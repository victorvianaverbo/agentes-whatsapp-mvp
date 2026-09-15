// Previsão de recebimento mês a mês:
//   node --test tests/previsao.test.mjs
process.env.ADMIN_PASSWORD = "senha-de-teste";

import { test } from "node:test";
import assert from "node:assert/strict";
import { corpo, fakeIo, req } from "./_fake-io.mjs";
import { tratar as previsao, dataBaseDe, listarMeses, montarPrevisao, projetarContrato } from "../vertice-labs/netlify/functions/previsao.mjs";
import { montarContrato, sanitizarContratante, sanitizarFinanceiro } from "../vertice-labs/netlify/functions/lib/contrato-schema.mjs";

const HOJE = "2026-09-15";
const ATE = "2026-12-28";

function contrato({ id, numero, cliente, status = "assinado", financeiro, assinouEm = "2026-08-05T12:00:00.000Z", pagamentos = null }) {
  const fin = sanitizarFinanceiro(financeiro, { permitirVazio: true });
  assert.equal(fin.erro, undefined, `financeiro inválido em ${numero}: ${fin.erro}`);
  const c = montarContrato({
    id, numero, agora: "2026-08-01T12:00:00.000Z",
    contratante: sanitizarContratante({ razaoSocial: cliente, cnpjCpf: "55.043.748/0001-63" }),
    proposta: { titulo: cliente }, servico: {}, financeiro: fin.financeiro,
    clausulasEspeciais: [], legado: null, status, origem: "sistema", observacoes: "", arquivos: []
  });
  c.status = status;
  if (assinouEm) c.assinaturas = { contratante: { nome: cliente, assinadoEm: assinouEm }, contratada: { nome: "Vértice", assinadoEm: assinouEm } };
  c.pagamentos = pagamentos || [];
  return c;
}

const mes = (linha, m) => linha.valores.find((v) => v.mes === m);

test("listarMeses cobre o intervalo fechado e vira o ano", () => {
  assert.deepEqual(listarMeses("2026-08", "2026-12"), ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
  assert.deepEqual(listarMeses("2026-11", "2027-01"), ["2026-11", "2026-12", "2027-01"]);
  assert.deepEqual(listarMeses("2026-09", "2026-09"), ["2026-09"]);
});

test("mensalidade sem prazo vai até dezembro, mesmo com a agenda parada no mês seguinte", () => {
  // O motor só grava até um mês à frente; a projeção precisa ir além disso.
  const c = contrato({
    id: "a", numero: "AA-2026-01", cliente: "Sem prazo",
    financeiro: { mensal: { valor: 1500, meses: 0, inicio: "assinatura" } },
    pagamentos: [{ id: "m1", serie: "mensal", n: 1, valor: 1500, vencimento: "2026-08-05", pago: true, pagoEm: "2026-08-05T12:00:00.000Z", previsao: false }]
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.deepEqual([...porMes.keys()].sort(), ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
  assert.equal(porMes.get("2026-12").mensal, 1500);
  // agosto já entrou de fato; dezembro é previsão
  assert.equal(porMes.get("2026-08").pago, 1500);
  assert.equal(porMes.get("2026-12").previsto, 1500);
});

test("mensalidade com prazo para no fim do prazo", () => {
  const c = contrato({
    id: "b", numero: "BB-2026-01", cliente: "Dois meses",
    financeiro: { mensal: { valor: 500, meses: 2, inicio: "assinatura" } }
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.deepEqual([...porMes.keys()].sort(), ["2026-08", "2026-09"]);
});

test("mensal encerrado não aparece depois da data de encerramento", () => {
  const c = contrato({
    id: "c", numero: "CC-2026-01", cliente: "Encerrado",
    financeiro: { mensal: { valor: 800, meses: 0, inicio: "assinatura", encerradoEm: "2026-10-01" } }
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.deepEqual([...porMes.keys()].sort(), ["2026-08", "2026-09"]);
});

test("entrada única cai no mês do vencimento e não se repete", () => {
  const c = contrato({
    id: "d", numero: "DD-2026-01", cliente: "Setup",
    financeiro: { unico: { valor: 5000, parcelas: [{ pct: 50, quando: "assinatura" }, { pct: 50, quando: "dias", dias: 30 }] } }
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.equal(porMes.get("2026-08").unico, 2500); // assinatura em 05/08
  assert.equal(porMes.get("2026-09").unico, 2500); // 30 dias depois
  assert.equal(porMes.get("2026-08").mensal, 0);
  assert.equal(porMes.has("2026-10"), false);
});

test("contrato em sociedade entra pela metade", () => {
  const c = contrato({
    id: "e", numero: "EE-2026-01", cliente: "Meio a meio",
    financeiro: { mensal: { valor: 6000, meses: 0, inicio: "assinatura" }, participacao: { pct: 50, socio: "Greyk" } }
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.equal(porMes.get("2026-09").mensal, 3000);
});

test("cobrança sem data fica na sacola, não some nem inventa mês", () => {
  const c = contrato({
    id: "f", numero: "FF-2026-01", cliente: "Depende de etapa",
    financeiro: { unico: { valor: 1500, parcelas: [{ pct: 100, quando: "definir" }] } }
  });
  const { porMes, semData } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.equal(semData, 1500);
  assert.equal(porMes.size, 0);
});

test("cobrança avulsa criada no painel entra na projeção", () => {
  const c = contrato({
    id: "g", numero: "GG-2026-01", cliente: "Avulsa",
    financeiro: { mensal: { valor: 1000, meses: 2, inicio: "assinatura" } },
    pagamentos: [{ id: "extra1", serie: "unico", n: 9, valor: 400, vencimento: "2026-11-10", pago: false, previsao: false }]
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.equal(porMes.get("2026-11").unico, 400);
});

test("montarPrevisao: só o que rende entra, com totais por mês e no ano", async () => {
  const io = fakeIo();
  const lista = [
    contrato({ id: "1", numero: "AA-2026-01", cliente: "Assinado", financeiro: { mensal: { valor: 1000, meses: 0, inicio: "assinatura" } } }),
    contrato({ id: "2", numero: "BB-2026-01", cliente: "Em operação", status: "em_operacao", assinouEm: null,
      financeiro: { mensal: { valor: 7000, meses: 0, inicio: "operacao", inicioEm: "2026-08-05", diaVencimento: 5 } } }),
    contrato({ id: "3", numero: "CC-2026-01", cliente: "Só proposta", status: "proposta", assinouEm: null,
      financeiro: { mensal: { valor: 9999, meses: 0, inicio: "assinatura" } } }),
    contrato({ id: "4", numero: "DD-2026-01", cliente: "Aguardando", status: "aguardando_assinaturas", assinouEm: null,
      financeiro: { unico: { valor: 8888 } } })
  ];
  for (const c of lista) await io.gravarContrato(c.id, c, null, "seed");

  const p = await montarPrevisao(io, { hoje: HOJE });
  assert.deepEqual(p.meses, ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
  assert.deepEqual(p.linhas.map((l) => l.numero), ["BB-2026-01", "AA-2026-01"]);
  assert.equal(p.linhas.find((l) => l.numero === "CC-2026-01"), undefined, "proposta não entra");
  assert.equal(p.linhas.find((l) => l.numero === "DD-2026-01"), undefined, "aguardando assinatura não entra");

  const emOperacao = p.linhas.find((l) => l.numero === "BB-2026-01");
  assert.equal(mes(emOperacao, "2026-08").total, 7000);
  assert.equal(mes(emOperacao, "2026-12").total, 7000);
  assert.equal(emOperacao.total, 35000); // agosto a dezembro

  assert.equal(p.totais.find((t) => t.mes === "2026-09").total, 8000);
  assert.equal(p.geral.total, 40000);
  assert.equal(p.geral.mensal, 40000);
  assert.equal(p.geral.unico, 0);
});

test("endpoint exige admin e aceita o horizonte por querystring", async () => {
  const io = fakeIo();
  const c = contrato({ id: "1", numero: "AA-2026-01", cliente: "X", financeiro: { mensal: { valor: 100, meses: 0, inicio: "assinatura" } } });
  await io.gravarContrato(c.id, c, null, "seed");
  const agora = new Date("2026-09-15T12:00:00.000Z");
  const chamar = (url, opts) => { const { req: r, ctx } = req(url, opts); return previsao(r, ctx, io, agora); };

  assert.equal((await chamar("/api/previsao")).status, 401);
  assert.equal((await chamar("/api/previsao", { method: "POST", admin: true })).status, 405);

  const r = await corpo(await chamar("/api/previsao?de=2026-10&ate=2026-11", { admin: true }));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.meses, ["2026-10", "2026-11"]);
  assert.equal(r.body.geral.total, 200);
});

test("parcela com data marcada cai no mês escolhido, não na assinatura", () => {
  // Caso MedSimple: bônus de R$ 20.000 combinado para dezembro.
  const c = contrato({
    id: "h", numero: "HH-2026-01", cliente: "Bônus",
    financeiro: {
      mensal: { valor: 7000, meses: 0, inicio: "operacao", inicioEm: "2026-08-05", diaVencimento: 5 },
      unico: { valor: 20000, descricao: "Bônus", parcelas: [{ pct: 100, quando: "data", em: "2026-12-05" }] }
    },
    assinouEm: null
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.equal(porMes.get("2026-12").unico, 20000);
  assert.equal(porMes.get("2026-08").unico, 0);
  assert.equal(porMes.get("2026-12").total || porMes.get("2026-12").mensal + porMes.get("2026-12").unico, 27000);
});

test("o mês é o do vencimento, não o do clique em marcar pago", () => {
  // Faz Morar: mensalidades de julho e agosto marcadas como pagas de uma vez em
  // setembro. Cada uma fica no seu mês; senão setembro aparecia com o triplo.
  const c = contrato({
    id: "i", numero: "II-2026-01", cliente: "Pagou atrasado", assinouEm: "2026-06-29T12:00:00.000Z",
    financeiro: { unico: { valor: 5000, parcelas: [{ pct: 50, quando: "assinatura" }, { pct: 50, quando: "dias", dias: 21 }] } },
    pagamentos: [
      { id: "u1", serie: "unico", n: 1, valor: 2500, vencimento: "2026-08-15", pago: true, pagoEm: "2026-09-15T12:00:00.000Z", previsao: false },
      { id: "u2", serie: "unico", n: 2, valor: 2500, vencimento: "2026-09-20", pago: true, pagoEm: "2026-09-15T12:00:00.000Z", previsao: false }
    ]
  });
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.equal(porMes.get("2026-08").unico, 2500);
  assert.equal(porMes.get("2026-09").unico, 2500);
  assert.equal(porMes.get("2026-08").pago, 2500);
});

test("contrato sem assinatura registrada ancora na emissão, nunca em hoje", () => {
  // dataBRT(undefined) devolve hoje: sem guarda, a mensalidade da Ilume
  // recomeçava no dia da consulta e sumia de outubro em diante.
  const c = contrato({
    id: "j", numero: "JJ-2026-01", cliente: "Sem assinatura", assinouEm: null,
    financeiro: { mensal: { valor: 750, meses: 0, inicio: "assinatura" } }
  });
  c.assinaturas = {};
  assert.equal(dataBaseDe(c), "2026-08-01"); // criadoEm do helper
  const { porMes } = projetarContrato(c, { hoje: HOJE, ateData: ATE });
  assert.deepEqual([...porMes.keys()].sort(), ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
});
