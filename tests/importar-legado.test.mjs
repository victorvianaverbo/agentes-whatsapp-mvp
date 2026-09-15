// Importação dos legados com GitHub em memória: node --test tests/importar-legado.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fakeIo } from "./_fake-io.mjs";
import { importar, validarLista } from "../ops/importar-legado.mjs";
import { uuidLegado } from "../vertice-labs/netlify/functions/lib/legado.mjs";
import { listarDoIndice } from "../vertice-labs/netlify/functions/lib/indice.mjs";

const lista = JSON.parse(readFileSync(new URL("../ops/legado.json", import.meta.url), "utf8"));
const pastas = readdirSync(new URL("../vertice-labs/propostas/", import.meta.url), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const HOJE = "2026-09-12";

function seedAssinaturas(io) {
  const ass = (nome, cpf, em, proto) => ({ nome, cpfCnpj: cpf, email: "x@x.com", ip: "1.1.1.1", userAgent: "ua", assinadoEm: em, protocolo: proto });
  return Promise.all([
    io.gravarJson("assinaturas/ancia-2026-09.json", { docId: "ancia-2026-09", formato: "multiparte", status: "assinado", assinaturas: {
      contratada: { parte: "contratada", ...ass("victor viana", "40.461.516/0001-58", "2026-09-03T19:20:01.300Z", "p1") },
      contratante: { parte: "contratante", ...ass("Amanda tatiana", "055.459.996-12", "2026-09-10T10:54:01.913Z", "p2") }
    } }, null, "seed"),
    io.gravarJson("assinaturas/monalisa-2026-08.json", { docId: "monalisa-2026-08", formato: "multiparte", status: "assinado", assinaturas: {
      contratada: { parte: "contratada", ...ass("victor viana", "40.461.516/0001-58", "2026-09-02T11:51:07.992Z", "p3") },
      contratante: { parte: "contratante", ...ass("MONALISA FERREIRA AZEVEDO", "14.906.763/0001-00", "2026-09-02T16:11:56.001Z", "p4") }
    } }, null, "seed"),
    io.gravarJson("assinaturas/souzatec-2026-01.json", { docId: "souzatec-2026-01", assinatura: ass("Leandro Marques de Souza", "31.571.579/0001-76", "2026-08-07T18:48:48.887Z", "p5") }, null, "seed"),
    io.gravarJson("assinaturas/lm-bids-2026-08.json", { docId: "lm-bids-2026-08", assinatura: ass("Matheus Moreira Silva Pinto", "61.424.626/0001-10", "2026-08-10T21:10:07.505Z", "p6") }, null, "seed"),
    io.gravarJson("assinaturas/faz-morar-evento-2026-03.json", { docId: "faz-morar-evento-2026-03", assinatura: ass("Jacqueline Costa Azevedo", "11.061.129/0001-26", "2026-07-31T21:57:18.303Z", "p7") }, null, "seed")
  ]);
}

test("legado.json cobre todas as pastas de propostas e passa na validação", () => {
  assert.deepEqual(validarLista(lista, pastas), []);
  assert.equal(lista.length, 32);
});

test("importação: status, assinaturas e cobranças dos 32", async () => {
  const io = fakeIo();
  await seedAssinaturas(io);
  const res = await importar(lista, io, { gravar: true, hoje: HOJE, log: () => {} });
  assert.equal(res.length, 32);
  const por = Object.fromEntries(res.map((r) => [r.item.slug, r.contrato]));

  // assinados de verdade
  assert.equal(por.ancia.status, "assinado");
  assert.equal(por.ancia.assinaturas.contratante.protocolo, "p2");
  assert.deepEqual(por.ancia.pagamentos.map((p) => p.vencimento), ["2026-09-10", "2026-10-10"]);
  assert.equal(por.ancia.pagamentos[0].previsao, false);

  assert.equal(por.monalisa.status, "assinado");
  assert.deepEqual(por.monalisa.pagamentos.map((p) => p.vencimento), ["2026-09-02", "2026-10-02"]);

  assert.equal(por.souzatec.status, "assinado");
  assert.equal(por.souzatec.assinaturas.contratada.origem.tipo, "html");
  assert.equal(por.souzatec.assinaturas.contratada.assinadoEm, "2026-07-06T21:20:00.000Z");
  assert.deepEqual(por.souzatec.pagamentos.map((p) => p.vencimento), ["2026-08-07", "2026-09-07", "2026-10-07"]);

  assert.equal(por["lm-bids"].status, "assinado");
  assert.deepEqual(por["lm-bids"].pagamentos.map((p) => [p.vencimento, p.valor]), [["2026-08-10", 1250]]);

  assert.equal(por["faz-morar-evento"].status, "assinado");
  assert.deepEqual(por["faz-morar-evento"].pagamentos.map((p) => p.vencimento), ["2026-07-31", "2026-08-31", "2026-09-30"]);
  assert.equal(por["faz-morar-evento"].legado.substitui, uuidLegado("leilao-e-prosa"));

  // aguardando: PV-2026-09 é multiparte sem arquivo de assinatura (ninguém assinou), previsão
  assert.equal(por.previ.status, "aguardando_assinaturas");
  assert.equal(por.previ.assinaturas.contratante, null);
  assert.equal(por.previ.assinaturas.contratada, null);
  assert.ok(por.previ.pagamentos.every((p) => p.previsao));
  assert.equal(por["sor-moema"].assinaturas.contratada.origem.tipo, "html-sem-protocolo");

  // câmbio: parcelas absolutas 4.000 + 2.000
  assert.deepEqual(por["cambio-automatico"].pagamentos.map((p) => [p.valor, p.vencimento]), [[4000, "2026-08-25"], [2000, "2026-09-24"]]);

  // escalonamento Kaka Souza
  assert.equal(por["limpeza-sexshop"].financeiro.mensal.escalonamento[0].valor, 1500);

  // sem cobrança
  for (const s of ["hype", "ilume", "leilao-e-prosa", "ms-inteligencia"]) assert.deepEqual(por[s].pagamentos, [], s);
  assert.equal(por.ilume.status, "terceiro");
  assert.equal(por["leilao-e-prosa"].status, "substituido");
  assert.equal(por["ms-inteligencia"].status, "expirada");
  assert.equal(por.hype.status, "proposta");
  assert.equal(por.ilume.assinaturas.outras["contratado-ilume"].nome, "Filipe Gomes Rodrigues");

  // índice gravado com 32 e legível pelo painel
  const idx = await listarDoIndice(io);
  assert.equal(idx.length, 32);
  assert.ok(idx.every((c) => c.legado && c.legado.slug));
});

test("importação é idempotente e preserva pagos e status do painel", async () => {
  const io = fakeIo();
  await seedAssinaturas(io);
  await importar(lista, io, { gravar: true, hoje: HOJE, log: () => {} });
  const id = uuidLegado("souzatec");
  const { contrato, sha } = await io.lerContrato(id);
  contrato.pagamentos[0].pago = true;
  contrato.pagamentos[0].pagoEm = "2026-08-08T00:00:00.000Z";
  await io.gravarContrato(id, contrato, sha, "pago");

  const idP = uuidLegado("previ");
  const lp = await io.lerContrato(idP);
  lp.contrato.status = "encerrado"; lp.contrato.atualizadoPor = "painel";
  await io.gravarContrato(idP, lp.contrato, lp.sha, "status painel");

  const res = await importar(lista, io, { gravar: true, hoje: HOJE, log: () => {} });
  const s = res.find((r) => r.item.slug === "souzatec").contrato;
  assert.equal(s.pagamentos[0].pago, true);
  assert.equal(s.pagamentos[0].pagoEm, "2026-08-08T00:00:00.000Z");
  assert.equal(res.find((r) => r.item.slug === "previ").contrato.status, "encerrado");
  assert.equal([...io.arquivos.keys()].filter((k) => k.startsWith("contratos/")).length, 32);
});

test("cliente em operação: mensalidade real, sem previsão, desde agosto", async () => {
  const io = fakeIo();
  await seedAssinaturas(io);
  const res = await importar(lista, io, { gravar: true, hoje: HOJE, log: () => {} });
  const por = Object.fromEntries(res.map((r) => [r.item.slug, r.contrato]));

  for (const slug of ["medsimple", "diriflux", "avantik"]) {
    const c = por[slug];
    assert.equal(c.status, "em_operacao", slug);
    // dinheiro que entra de verdade: nada marcado como previsão
    assert.ok(c.pagamentos.length > 0, slug);
    assert.ok(c.pagamentos.every((p) => p.previsao === false), slug);
    assert.ok(c.pagamentos.every((p) => p.serie === "mensal"), slug);
    // primeira em 05/08; da segunda em diante, todo dia 5
    assert.equal(c.pagamentos[0].vencimento, "2026-08-05", slug);
    assert.equal(c.pagamentos[1].vencimento, "2026-09-05", slug);
  }
  assert.equal(por.medsimple.pagamentos[0].valor, 7000);
  assert.equal(por.diriflux.pagamentos[0].valor, 1250);
  assert.equal(por.avantik.pagamentos[0].valor, 1000);
});
