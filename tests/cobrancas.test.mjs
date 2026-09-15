// node --test tests/cobrancas.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicarEncerramento, completarMensalidades, dataBRT, gerarCobrancas, mesesDepois, reancorarMensais, somarDiasUteis
} from "../vertice-labs/netlify/functions/lib/cobrancas.mjs";

const base = (financeiro, extra = {}) => ({ status: "assinado", financeiro, servico: {}, ...extra });

test("dataBRT: assinatura às 23h UTC de 3/9 cai em 3/9 no Brasil (20h)", () => {
  assert.equal(dataBRT("2026-09-03T23:20:01.300Z"), "2026-09-03");
  assert.equal(dataBRT("2026-09-04T01:30:00.000Z"), "2026-09-03"); // 22h30 BRT do dia 3
});

test("mesesDepois grampeia no último dia do mês", () => {
  assert.equal(mesesDepois("2026-07-31", 1), "2026-08-31");
  assert.equal(mesesDepois("2026-07-31", 2), "2026-09-30");
  assert.equal(mesesDepois("2026-07-31", 3), "2026-10-31");
  assert.equal(mesesDepois("2026-11-15", 2), "2027-01-15");
  assert.equal(mesesDepois("2026-07-31", 1, 5), "2026-08-05");
});

test("somarDiasUteis pula fim de semana", () => {
  assert.equal(somarDiasUteis("2026-09-11", 1), "2026-09-14"); // sexta → segunda
});

test("único: 100% na assinatura", () => {
  const c = base({ unico: { valor: 1250, parcelas: [{ pct: 100, gatilho: "no fechamento", quando: "assinatura" }] } });
  const p = gerarCobrancas(c, { dataBase: "2026-08-10" });
  assert.equal(p.length, 1);
  assert.equal(p[0].id, "u1");
  assert.equal(p[0].valor, 1250);
  assert.equal(p[0].vencimento, "2026-08-10");
  assert.equal(p[0].serie, "unico");
});

test("único: 50/50 com entrega em dias úteis e arredondamento fechando o total", () => {
  const c = base(
    { unico: { valor: 1001, parcelas: [{ pct: 50, quando: "assinatura" }, { pct: 50, quando: "entrega" }] } },
    { servico: { site: { prazoDiasUteis: 5 } } }
  );
  const p = gerarCobrancas(c, { dataBase: "2026-07-06" });
  assert.equal(p[0].valor + p[1].valor, 1001);
  assert.equal(p[1].vencimento, "2026-07-13");
});

test("único: parcela 'definir' e '+30 dias' ", () => {
  const c = base({ unico: { valor: 6000, parcelas: [{ pct: 66.67, quando: "assinatura" }, { pct: 33.33, quando: "dias", dias: 30 }] } });
  const p = gerarCobrancas(c, { dataBase: "2026-08-25" });
  assert.equal(p[1].vencimento, "2026-09-24");
  const d = base({ unico: { valor: 1500, parcelas: [{ pct: 100, quando: "definir", gatilho: "na aprovação" }] } });
  assert.equal(gerarCobrancas(d, { dataBase: "2026-09-09" })[0].vencimento, null);
});

test("mensal com N meses gera N", () => {
  const c = base({ mensal: { valor: 2500, meses: 2, inicio: "assinatura" } });
  const p = gerarCobrancas(c, { dataBase: "2026-09-02" });
  assert.deepEqual(p.map((x) => x.vencimento), ["2026-09-02", "2026-10-02"]);
  assert.equal(p[0].descricao, "Mensalidade 1/2");
});

test("mensal indeterminado é rolante: até o primeiro vencimento futuro", () => {
  const c = base({ mensal: { valor: 1800, meses: 0, inicio: "assinatura" } });
  const p = gerarCobrancas(c, { dataBase: "2026-07-31", hoje: "2026-09-12" });
  assert.deepEqual(p.map((x) => x.vencimento), ["2026-07-31", "2026-08-31", "2026-09-30"]);
  // completar: hoje passou de 30/09 → nasce 31/10
  c.pagamentos = p;
  assert.equal(completarMensalidades(c, "2026-10-01"), true);
  assert.equal(c.pagamentos.at(-1).vencimento, "2026-10-31");
  assert.equal(completarMensalidades(c, "2026-10-01"), false);
});

test("escalonamento: 1.000 nos 3 primeiros, 1.500 a partir do 4º", () => {
  const c = base({ mensal: { valor: 1000, meses: 0, inicio: "assinatura", escalonamento: [{ aPartirDoMes: 4, valor: 1500 }] } });
  const p = gerarCobrancas(c, { dataBase: "2026-07-06", hoje: "2026-10-20" });
  assert.deepEqual(p.map((x) => x.valor), [1000, 1000, 1000, 1500, 1500]); // 4º e 5º (06/10 e 06/11, o primeiro futuro)
});

test("misto: site a definir + 1ª mensalidade no início da operação; reancorar ao datar", () => {
  const c = base({
    unico: { valor: 1500, parcelas: [{ pct: 100, quando: "definir", gatilho: "na aprovação da prévia" }] },
    mensal: { valor: 1500, meses: 0, inicio: "operacao" }
  });
  c.pagamentos = gerarCobrancas(c, { dataBase: "2026-09-09" });
  assert.equal(c.pagamentos.length, 2);
  assert.equal(c.pagamentos[1].vencimento, null);
  c.pagamentos[1].vencimento = "2026-10-01";
  assert.equal(reancorarMensais(c), false); // só uma mensal existe
  assert.equal(completarMensalidades(c, "2026-11-05"), true);
  assert.deepEqual(c.pagamentos.filter((x) => x.serie === "mensal").map((x) => x.vencimento), ["2026-10-01", "2026-11-01", "2026-12-01"]);
});

test("encerramento remove mensalidades futuras não pagas e para de completar", () => {
  const c = base({ mensal: { valor: 2000, meses: 0, inicio: "assinatura" } });
  c.pagamentos = gerarCobrancas(c, { dataBase: "2026-07-14", hoje: "2026-09-12" });
  c.pagamentos[0].pago = true;
  aplicarEncerramento(c, "2026-08-20");
  assert.deepEqual(c.pagamentos.map((x) => x.vencimento), ["2026-07-14", "2026-08-14"]);
  assert.equal(completarMensalidades(c, "2026-12-01"), false);
});

test("encerramento tira a mensalidade que ainda esperava data (início na operação)", () => {
  // Caso Judah: fechou só o setup do site; a mensalidade de tráfego nunca começou,
  // então nasceu sem vencimento e não pode sobrar na lista depois do encerramento.
  const c = base({
    unico: { valor: 5000, parcelas: [{ pct: 50, quando: "assinatura" }, { pct: 50, quando: "entrega" }] },
    mensal: { valor: 1500, meses: 0, inicio: "operacao" }
  });
  c.pagamentos = gerarCobrancas(c, { dataBase: "2026-06-29", hoje: "2026-09-15" });
  assert.equal(c.pagamentos.filter((p) => p.serie === "mensal" && !p.vencimento).length, 1);
  aplicarEncerramento(c, "2026-09-15");
  assert.deepEqual(c.pagamentos.map((p) => p.serie), ["unico", "unico"]);
  assert.equal(completarMensalidades(c, "2026-12-01"), false);
});

test("sem cobrança para terceiro, substituído, expirada e cobrarCliente:false", () => {
  for (const status of ["terceiro", "substituido", "expirada"]) {
    assert.deepEqual(gerarCobrancas({ status, financeiro: { unico: { valor: 100 } } }, { dataBase: "2026-01-01" }), []);
  }
  assert.deepEqual(gerarCobrancas({ status: "proposta", financeiro: { cobrarCliente: false, mensal: { valor: 6000 } } }, { dataBase: "2026-01-01" }), []);
});
