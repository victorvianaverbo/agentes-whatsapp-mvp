// PATCH /api/contratos/:id/pagamentos   [admin]
//   { pagamentos: [...] }     → substitui a agenda (datas, pago/não pago)
//   { acao: "completar" }     → mensal indeterminado: acrescenta as mensalidades até o próximo vencimento
//   { acao: "gerar" }         → contrato assinado sem agenda: gera a partir da assinatura
// Permitido mesmo com o contrato assinado: só a agenda muda, cláusulas e assinaturas não.

import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarContrato, lerContrato, lerJson, gravarJson, listarArquivos } from "./lib/github.mjs";
import { atualizarIndice } from "./lib/indice.mjs";
import { completarMensalidades, dataBRT, gerarCobrancas, hojeBRT, reancorarMensais } from "./lib/cobrancas.mjs";

export const config = { path: "/api/contratos/:id/pagamentos" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const ioPadrao = { lerJson, gravarJson, listarArquivos, lerContrato, gravarContrato };

export default (req, context) => tratar(req, context);

export function sanitizarPagamentos(lista) {
  if (!Array.isArray(lista)) return { erro: "Envie { pagamentos: [...] }" };
  if (lista.length > 120) return { erro: "Máximo de 120 cobranças por contrato" };
  const pagamentos = [];
  for (const p of lista) {
    if (!p || typeof p !== "object") return { erro: "Cobrança inválida" };
    const valor = Number(p.valor);
    if (!(valor >= 0)) return { erro: "Valor inválido em uma das cobranças" };
    const vencimento = p.vencimento == null || p.vencimento === "" ? null : String(p.vencimento);
    if (vencimento && !DATA_RE.test(vencimento)) return { erro: "Data de vencimento inválida (use AAAA-MM-DD)" };
    pagamentos.push({
      id: String(p.id || "p" + (pagamentos.length + 1)).slice(0, 20),
      serie: p.serie === "mensal" ? "mensal" : "unico",
      n: Math.max(1, Math.floor(Number(p.n) || pagamentos.length + 1)),
      descricao: String(p.descricao || "").trim().slice(0, 200),
      quando: String(p.quando || "").trim().slice(0, 200),
      pct: Number(p.pct) || 0,
      valor: Math.round(valor * 100) / 100,
      vencimento,
      pago: p.pago === true,
      pagoEm: p.pago === true ? (p.pagoEm || new Date().toISOString()) : null,
      previsao: p.previsao === true
    });
  }
  return { pagamentos };
}

export async function tratar(req, context, io = ioPadrao) {
  if (req.method !== "PATCH") return erro(405, "Método não permitido");
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  const id = context?.params?.id || "";
  if (!UUID_RE.test(id)) return erro(404, "Contrato não encontrado");

  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");
  const acao = String(body.acao || "");
  let entrada = null;
  if (!acao) {
    entrada = sanitizarPagamentos(body.pagamentos);
    if (entrada.erro) return erro(400, entrada.erro);
  } else if (acao !== "completar" && acao !== "gerar") {
    return erro(400, "Ação desconhecida");
  }

  try {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const lido = await io.lerContrato(id);
      if (!lido) return erro(404, "Contrato não encontrado");
      const { contrato, sha } = lido;
      const hoje = hojeBRT();

      if (entrada) contrato.pagamentos = entrada.pagamentos;
      if (acao === "gerar") {
        if (contrato.status !== "assinado") return erro(409, "Só contratos assinados ganham agenda automática");
        const pagos = new Map((contrato.pagamentos || []).filter((p) => p.pago).map((p) => [p.id, p]));
        const base = dataBRT(contrato.assinaturas?.contratante?.assinadoEm) || dataBRT(contrato.assinaturas?.contratada?.assinadoEm) || hoje;
        contrato.pagamentos = gerarCobrancas(contrato, { dataBase: base, hoje }).map((p) => {
          const a = pagos.get(p.id);
          return a ? { ...p, pago: true, pagoEm: a.pagoEm } : p;
        });
      }
      reancorarMensais(contrato);
      completarMensalidades(contrato, hoje);
      contrato.atualizadoEm = new Date().toISOString();

      try {
        await io.gravarContrato(id, contrato, sha, `pagamentos — contrato ${contrato.numero}`);
      } catch (e) {
        if (e instanceof ConflitoError) continue;
        throw e;
      }
      await atualizarIndice(contrato, {}, io);
      return json(200, { pagamentos: contrato.pagamentos });
    }
    return erro(409, "Conflito de gravação. Tente novamente.");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
}
