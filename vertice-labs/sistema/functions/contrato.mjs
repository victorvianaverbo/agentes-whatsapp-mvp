import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { excluirContrato, gravarContrato, lerContrato } from "./lib/github.mjs";
import { normalizarFinanceiro, sanitizarContratante, TIPOS } from "./contratos.mjs";

export const config = { path: "/api/contratos/:id" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (req, context) => {
  const id = context.params?.id || "";
  if (!UUID_RE.test(id)) return erro(404, "Contrato não encontrado");

  try {
    if (req.method === "GET") return await obter(req, id);
    if (req.method === "PATCH") return await atualizar(req, id);
    if (req.method === "DELETE") return await excluir(req, id);
    return erro(405, "Método não permitido");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
};

async function obter(req, id) {
  const lido = await lerContrato(id);
  if (!lido) return erro(404, "Contrato não encontrado");
  const { contrato } = lido;
  // Rascunho é invisível ao público: responde 404 (não confirma existência)
  if (contrato.status === "rascunho" && !isAdmin(req)) {
    return erro(404, "Contrato não encontrado");
  }
  return json(200, contrato);
}

async function atualizar(req, id) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const lido = await lerContrato(id);
  if (!lido) return erro(404, "Contrato não encontrado");
  const { contrato, sha } = lido;

  if (body.acao === "enviar") {
    if (contrato.status !== "rascunho") return erro(409, "Só rascunhos podem ser enviados");
    contrato.status = "aguardando_assinaturas";
    contrato.enviadoEm = new Date().toISOString();
    contrato.atualizadoEm = contrato.enviadoEm;
    await gravarContrato(id, contrato, sha, `enviar contrato ${contrato.numero}`);
    return json(200, contrato);
  }

  if (contrato.status !== "rascunho") {
    return erro(409, "Contrato enviado ou assinado não pode mais ser editado");
  }

  if (typeof body.numero === "string" && body.numero.trim()) contrato.numero = body.numero.trim();
  if (TIPOS.includes(body.tipo)) contrato.tipo = body.tipo;
  if (body.contratante) contrato.contratante = sanitizarContratante(body.contratante);
  if (body.proposta) contrato.proposta = body.proposta;
  if (body.servico) contrato.servico = body.servico;
  if (body.financeiro) {
    const financeiro = normalizarFinanceiro(contrato.tipo, body.financeiro);
    if (!(financeiro.valorTotal > 0)) return erro(400, "informe um valor (setup ou mensal) maior que zero");
    contrato.financeiro = financeiro;
  }
  contrato.atualizadoEm = new Date().toISOString();

  await gravarContrato(id, contrato, sha, `editar contrato ${contrato.numero}`);
  return json(200, contrato);
}

async function excluir(req, id) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  const lido = await lerContrato(id);
  if (!lido) return erro(404, "Contrato não encontrado");
  await excluirContrato(id, lido.sha, `excluir contrato ${lido.contrato.numero}`);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
