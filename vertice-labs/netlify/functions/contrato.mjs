// /api/contratos/:id
//   GET    → JSON do contrato (público se enviado; rascunho e legado → 404 sem admin)
//   PATCH  → { acao: "enviar" } | { acao: "encerrarMensal", em } | { acao: "sincronizar" }
//            | { acao: "status", status } | { acao: "observacoes", observacoes } | edição de campos
//   DELETE → exclui

import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { excluirContrato, gravarContrato, lerContrato, lerJson, gravarJson, listarArquivos } from "./lib/github.mjs";
import { atualizarIndice, numerosUsados } from "./lib/indice.mjs";
import { aplicarEncerramento, dataBRT, gerarCobrancas, hojeBRT } from "./lib/cobrancas.mjs";
import { aplicarSincronizacao, mapearAssinaturas } from "./lib/legado.mjs";
import {
  NUMERO_RE, STATUS_LEGADO, editavel, ehLegado, sanitizarContratante, sanitizarEspeciais,
  sanitizarFinanceiro, sanitizarProposta, sanitizarServico, validarDocumentoDigitos
} from "./lib/contrato-schema.mjs";

export const config = { path: "/api/contratos/:id" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ioPadrao = { lerJson, gravarJson, listarArquivos, lerContrato, gravarContrato, excluirContrato };

export default (req, context) => tratar(req, context);

export async function tratar(req, context, io = ioPadrao) {
  const id = context?.params?.id || "";
  if (!UUID_RE.test(id)) return erro(404, "Contrato não encontrado");
  try {
    if (req.method === "GET") return await obter(req, id, io);
    if (req.method === "PATCH") return await atualizar(req, id, io);
    if (req.method === "DELETE") return await excluir(req, id, io);
    return erro(405, "Método não permitido");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
}

async function obter(req, id, io) {
  const lido = await io.lerContrato(id);
  if (!lido) return erro(404, "Contrato não encontrado");
  const { contrato } = lido;
  // Rascunho e legado são invisíveis ao público: 404 (não confirma existência)
  if ((contrato.status === "rascunho" || ehLegado(contrato)) && !isAdmin(req)) {
    return erro(404, "Contrato não encontrado");
  }
  return json(200, contrato);
}

async function atualizar(req, id, io) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const lido = await io.lerContrato(id);
  if (!lido) return erro(404, "Contrato não encontrado");
  const { contrato, sha } = lido;
  const agora = new Date().toISOString();

  if (body.acao === "enviar") {
    if (ehLegado(contrato)) return erro(409, "Contrato legado não é enviado por aqui: use o link antigo.");
    if (contrato.status !== "rascunho") return erro(409, "Só rascunhos podem ser enviados");
    contrato.status = "aguardando_assinaturas";
    contrato.enviadoEm = agora;
    contrato.atualizadoEm = agora;
    await io.gravarContrato(id, contrato, sha, `enviar contrato ${contrato.numero}`);
    await atualizarIndice(contrato, {}, io);
    return json(200, contrato);
  }

  if (body.acao === "encerrarMensal") {
    if (!contrato.financeiro?.mensal) return erro(400, "Este contrato não tem mensalidade");
    const em = /^\d{4}-\d{2}-\d{2}$/.test(String(body.em || "")) ? body.em : hojeBRT();
    aplicarEncerramento(contrato, em);
    if (!ehLegado(contrato)) contrato.status = "assinado";
    else contrato.status = "encerrado";
    contrato.atualizadoEm = agora;
    await io.gravarContrato(id, contrato, sha, `encerrar mensalidade ${contrato.numero} em ${em}`);
    await atualizarIndice(contrato, {}, io);
    return json(200, contrato);
  }

  if (body.acao === "sincronizar") {
    if (!ehLegado(contrato)) return erro(409, "Só contratos legados são sincronizados");
    const docId = contrato.legado.docId;
    if (!docId) return erro(400, "Este legado não tem docId: é só proposta, sem assinatura.");
    const registro = await io.lerJson(`assinaturas/${docId}.json`);
    const eraAssinado = contrato.status === "assinado";
    const mapa = mapearAssinaturas(registro?.dados || null, docId);
    // não apaga uma assinatura da Vértice que veio do carimbo do HTML
    if (!mapa.contratada && contrato.assinaturas?.contratada) mapa.contratada = contrato.assinaturas.contratada;
    aplicarSincronizacao(contrato, mapa);
    if (contrato.status === "assinado" && !eraAssinado) regerarPreservandoPagos(contrato);
    contrato.atualizadoEm = agora;
    await io.gravarContrato(id, contrato, sha, `sincronizar assinaturas ${contrato.numero}`);
    await atualizarIndice(contrato, {}, io);
    return json(200, contrato);
  }

  if (body.acao === "status") {
    if (!ehLegado(contrato)) return erro(409, "Status de contrato do sistema muda pelas ações (enviar, assinar), não à mão");
    const permitidos = [...STATUS_LEGADO, "aguardando_assinaturas", "assinado"];
    if (!permitidos.includes(body.status)) return erro(400, "Status inválido");
    contrato.status = body.status;
    contrato.atualizadoEm = agora;
    contrato.atualizadoPor = "painel";
    await io.gravarContrato(id, contrato, sha, `status ${contrato.numero} → ${body.status}`);
    await atualizarIndice(contrato, {}, io);
    return json(200, contrato);
  }

  if (body.acao === "observacoes") {
    contrato.observacoes = String(body.observacoes || "").trim().slice(0, 4000);
    contrato.atualizadoEm = agora;
    await io.gravarContrato(id, contrato, sha, `observações ${contrato.numero}`);
    return json(200, contrato);
  }

  // Edição: só enquanto ninguém assinou e não é legado.
  if (!editavel(contrato)) {
    return erro(409, ehLegado(contrato)
      ? "Contrato legado não é editável: o documento é o HTML antigo."
      : "Contrato com assinatura registrada não pode mais ser editado");
  }

  if (typeof body.numero === "string" && body.numero.trim()) {
    const numero = body.numero.trim().toUpperCase();
    if (!NUMERO_RE.test(numero)) return erro(400, "Número fora do padrão XX-AAAA-MM");
    if (numero !== contrato.numero) {
      const usados = await numerosUsados(io);
      if (usados.has(numero)) return erro(409, `O número ${numero} já existe.`, { codigo: "numero_duplicado" });
      contrato.numero = numero;
    }
  }
  if (body.contratante) {
    const c = sanitizarContratante(body.contratante);
    if (!c.razaoSocial) return erro(400, "contratante.razaoSocial é obrigatório");
    if (!validarDocumentoDigitos(c.cnpjCpf)) return erro(400, "contratante.cnpjCpf precisa ser um CPF ou CNPJ");
    contrato.contratante = c;
  }
  if (body.proposta) contrato.proposta = sanitizarProposta(body.proposta);
  if (body.servico) contrato.servico = sanitizarServico(body.servico);
  if (body.financeiro) {
    const fin = sanitizarFinanceiro(body.financeiro);
    if (fin.erro) return erro(400, fin.erro);
    contrato.financeiro = fin.financeiro;
  }
  if (Array.isArray(body.clausulasEspeciais) || typeof body.clausulasEspeciais === "string") {
    contrato.clausulasEspeciais = sanitizarEspeciais(body.clausulasEspeciais);
  }
  if (typeof body.observacoes === "string") contrato.observacoes = body.observacoes.trim().slice(0, 4000);
  contrato.atualizadoEm = agora;

  await io.gravarContrato(id, contrato, sha, `editar contrato ${contrato.numero}`);
  await atualizarIndice(contrato, {}, io);
  return json(200, contrato);
}

// Ao virar assinado por sincronização: agenda real (sem previsão) a partir da
// assinatura do cliente, mantendo o que o Victor já marcou como pago.
function regerarPreservandoPagos(contrato) {
  const pagos = new Map((contrato.pagamentos || []).filter((p) => p.pago).map((p) => [p.id, p]));
  const base = dataBRT(contrato.assinaturas?.contratante?.assinadoEm) || dataBRT(contrato.assinaturas?.contratada?.assinadoEm);
  const novos = gerarCobrancas(contrato, { dataBase: base, previsao: false });
  contrato.pagamentos = novos.map((p) => {
    const antigo = pagos.get(p.id);
    return antigo ? { ...p, pago: true, pagoEm: antigo.pagoEm, vencimento: antigo.vencimento || p.vencimento } : p;
  });
}

async function excluir(req, id, io) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  const lido = await io.lerContrato(id);
  if (!lido) return erro(404, "Contrato não encontrado");
  await io.excluirContrato(id, lido.sha, `excluir contrato ${lido.contrato.numero}`);
  await atualizarIndice(lido.contrato, { remover: true }, io);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
