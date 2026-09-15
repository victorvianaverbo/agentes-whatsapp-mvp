// GET /api/previsao?ate=AAAA-MM  → quanto entra por mês até o fim do horizonte  [admin]
//
// Responde a pergunta de gestão: se ninguém sair, quanto a casa recebe mês a mês
// até dezembro. Não inventa agenda: reusa `gerarCobrancas` do motor de cobranças
// com o horizonte esticado, que é o mesmo código que monta a agenda de verdade.
// A mensalidade sem prazo é rolante (nasce mês a mês, uma de cada vez), então a
// agenda gravada nunca tem mais de um mês à frente — por isso a projeção recomputa
// em vez de somar `contrato.pagamentos`.
//
// Só entram contratos que rendem: assinados e clientes em operação. Proposta e
// contrato à espera de assinatura ficam de fora, para a previsão não virar desejo.
//
// Precisa do contrato inteiro (o índice não carrega `financeiro.mensal` detalhado),
// então lê os arquivos em paralelo.

import { isAdmin } from "./lib/auth.mjs";
import { erro, json } from "./lib/http.mjs";
import { lerContrato, lerJson, gravarJson, listarArquivos, gravarContrato } from "./lib/github.mjs";
import { ATIVOS, listarDoIndice } from "./lib/indice.mjs";
import { dataBRT, gerarCobrancas, hojeBRT } from "./lib/cobrancas.mjs";

export const config = { path: "/api/previsao" };

const ioPadrao = { lerJson, gravarJson, listarArquivos, lerContrato, gravarContrato };
const MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export default (req, context) => tratar(req, context);

export async function tratar(req, context, io = ioPadrao, agora = new Date()) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  if (req.method !== "GET") return erro(405, "Método não permitido");
  try {
    const url = new URL(req.url);
    const hoje = hojeBRT(agora);
    const de = MES_RE.test(url.searchParams.get("de") || "") ? url.searchParams.get("de") : null;
    const ate = MES_RE.test(url.searchParams.get("ate") || "") ? url.searchParams.get("ate") : null;
    return json(200, await montarPrevisao(io, { hoje, de, ate }));
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
}

// Fatia da casa: contrato em sociedade entra só pela parte que fica com a Vértice.
export function fatorCasa(financeiro) {
  const pct = Number(financeiro?.participacao?.pct);
  return pct >= 0 && pct < 100 ? pct / 100 : 1;
}

// A âncora da agenda: quando o cliente assinou; senão quando a casa assinou;
// senão a emissão. Mesma ordem usada por /api/contratos/:id/pagamentos.
export function dataBaseDe(contrato) {
  return dataBRT(contrato.assinaturas?.contratante?.assinadoEm)
    || dataBRT(contrato.assinaturas?.contratada?.assinadoEm)
    || (contrato.criadoEm ? dataBRT(contrato.criadoEm) : null)
    || null;
}

export function listarMeses(de, ate) {
  const meses = [];
  let [y, m] = de.split("-").map(Number);
  const [ya, ma] = ate.split("-").map(Number);
  while (y < ya || (y === ya && m <= ma)) {
    meses.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) { m = 1; y++; }
  }
  return meses;
}

// Projeta um contrato: agenda recomputada até o fim do horizonte, com o que já
// foi pago preservado por id. Devolve { mensal, unico, semData } por mês.
export function projetarContrato(contrato, { hoje, ateData }) {
  const fator = fatorCasa(contrato.financeiro);
  const gravados = new Map((contrato.pagamentos || []).map((p) => [p.id, p]));
  // `hoje: ateData` faz a mensalidade rolante ir até o fim do horizonte.
  const projetadas = gerarCobrancas(contrato, { dataBase: dataBaseDe(contrato), hoje: ateData });

  const porMes = new Map();
  let semData = 0;
  // A mensalidade rolante nasce sempre uma além de `hoje`; corta no horizonte.
  const mesFinal = ateData.slice(0, 7);
  for (const p of projetadas) {
    const g = gravados.get(p.id);
    // O que está gravado manda: data corrigida à mão e pagamento registrado.
    const venc = (g && g.vencimento) || p.vencimento || null;
    const valor = (g && g.pago ? g.valor : p.valor) * fator;
    if (!venc) { semData += valor; continue; }
    const mes = venc.slice(0, 7);
    if (mes > mesFinal) continue;
    const atual = porMes.get(mes) || { mensal: 0, unico: 0, pago: 0, previsto: 0 };
    if (p.serie === "mensal") atual.mensal += valor; else atual.unico += valor;
    if (g && g.pago) atual.pago += valor; else atual.previsto += valor;
    porMes.set(mes, atual);
  }
  // Cobrança avulsa criada à mão no painel não sai de `gerarCobrancas`.
  for (const g of contrato.pagamentos || []) {
    if (projetadas.some((p) => p.id === g.id) || !g.vencimento) continue;
    const mes = g.vencimento.slice(0, 7);
    const atual = porMes.get(mes) || { mensal: 0, unico: 0, pago: 0, previsto: 0 };
    const valor = g.valor * fator;
    if (g.serie === "mensal") atual.mensal += valor; else atual.unico += valor;
    if (g.pago) atual.pago += valor; else atual.previsto += valor;
    porMes.set(mes, atual);
  }
  return { porMes, semData };
}

const round = (n) => Math.round(n * 100) / 100;

export async function montarPrevisao(io, { hoje, de = null, ate = null } = {}) {
  const ano = hoje.slice(0, 4);
  const mesInicial = de || `${ano}-08`;
  const mesFinal = ate || `${ano}-12`;
  const meses = listarMeses(mesInicial, mesFinal);
  const ateData = `${mesFinal}-28`; // dia 28: o teto que `diaVencimento` respeita

  const resumo = await listarDoIndice(io);
  const ativos = resumo.filter((c) => ATIVOS.has(c.status));
  const contratos = (await Promise.all(ativos.map((c) => io.lerContrato(c.id))))
    .map((r) => r?.contrato)
    .filter(Boolean);

  const linhas = [];
  for (const c of contratos) {
    const { porMes, semData } = projetarContrato(c, { hoje, ateData });
    const valores = meses.map((m) => {
      const v = porMes.get(m) || { mensal: 0, unico: 0, pago: 0, previsto: 0 };
      return { mes: m, mensal: round(v.mensal), unico: round(v.unico), pago: round(v.pago), previsto: round(v.previsto), total: round(v.mensal + v.unico) };
    });
    const total = round(valores.reduce((t, v) => t + v.total, 0));
    if (!total && !semData) continue;
    linhas.push({
      id: c.id,
      numero: c.numero,
      cliente: c.contratante?.nomeExibicao || c.contratante?.razaoSocial || "—",
      status: c.status,
      participacao: c.financeiro?.participacao || null,
      valores,
      semData: round(semData),
      total
    });
  }
  linhas.sort((a, b) => b.total - a.total || a.numero.localeCompare(b.numero));

  const totais = meses.map((m, i) => {
    const soma = linhas.reduce((t, l) => ({
      mensal: t.mensal + l.valores[i].mensal,
      unico: t.unico + l.valores[i].unico,
      pago: t.pago + l.valores[i].pago,
      previsto: t.previsto + l.valores[i].previsto
    }), { mensal: 0, unico: 0, pago: 0, previsto: 0 });
    return { mes: m, mensal: round(soma.mensal), unico: round(soma.unico), pago: round(soma.pago), previsto: round(soma.previsto), total: round(soma.mensal + soma.unico) };
  });

  return {
    hoje,
    meses,
    linhas,
    totais,
    geral: {
      total: round(totais.reduce((t, v) => t + v.total, 0)),
      mensal: round(totais.reduce((t, v) => t + v.mensal, 0)),
      unico: round(totais.reduce((t, v) => t + v.unico, 0)),
      pago: round(totais.reduce((t, v) => t + v.pago, 0)),
      previsto: round(totais.reduce((t, v) => t + v.previsto, 0)),
      semData: round(linhas.reduce((t, l) => t + l.semData, 0))
    }
  };
}
