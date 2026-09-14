// Fluxo completo da API do sistema de contratos, com GitHub em memória:
//   node --test tests/contratos-sistema.test.mjs
process.env.ADMIN_PASSWORD = "senha-de-teste";
process.env.EMAIL_ASSINATURA = "victor@teste.com";

import { test } from "node:test";
import assert from "node:assert/strict";
import { corpo, fakeIo, req } from "./_fake-io.mjs";
import { tratar as contratos } from "../vertice-labs/netlify/functions/contratos.mjs";
import { tratar as contrato } from "../vertice-labs/netlify/functions/contrato.mjs";
import { tratar as assinar } from "../vertice-labs/netlify/functions/contrato-assinar.mjs";
import { tratar as pagamentos } from "../vertice-labs/netlify/functions/contrato-pagamentos.mjs";
import { tratar as modelos, CATALOGO_DEFAULT } from "../vertice-labs/netlify/functions/modelos.mjs";
import { sugerirSigla } from "../vertice-labs/netlify/functions/lib/contrato-schema.mjs";
import { uuidLegado } from "../vertice-labs/netlify/functions/lib/legado.mjs";

const CNPJ_CLIENTE = "55.043.748/0001-63";
const CNPJ_VERTICE = "40.461.516/0001-58";
const CPF_QUALQUER = "529.982.247-25";

const payloadMisto = () => ({
  contratante: { razaoSocial: "CNT Ambiental LTDA", nomeExibicao: "CNT Ambiental", cnpjCpf: CNPJ_CLIENTE, contatoEmail: "thomas@cnt.com" },
  proposta: { titulo: "Cada serviço na sua página.", lead: "Lead.", blocos: [{ titulo: "Site", itens: ["Home", "Análise de água"], objeto: true, etiqueta: "unico" }] },
  servico: { site: { tipo: "site", paginas: 6, prazoDiasUteis: 10 }, trafego: { plataformas: "Google Ads" } },
  financeiro: {
    unico: { valor: 1500, valorTabela: 2750, descricao: "Site completo", parcelas: [{ pct: 100, gatilho: "na aprovação da prévia", quando: "definir" }] },
    mensal: { valor: 1500, meses: 0, inicio: "operacao", descricao: "Gestão de Google Ads" },
    verbaMidia: { valorMes: 3500, destino: "Google" }
  }
});

async function criar(io, payload, extra = {}) {
  const { req: r, ctx } = req("/api/contratos", { method: "POST", body: payload, admin: true, ...extra });
  return corpo(await contratos(r, ctx, io));
}
function ctxId(id, base) { return { ...base, params: { id } }; }

test("sugerirSigla", () => {
  assert.equal(sugerirSigla("Anciã"), "AN");
  assert.equal(sugerirSigla("LM Bids Ltda"), "LB");
  assert.equal(sugerirSigla("Haus Decor BH"), "HD");
  assert.equal(sugerirSigla("Souza Tec Comércio e Serviço LTDA"), "ST");
});

test("uuidLegado é determinístico e válido", () => {
  const a = uuidLegado("ancia");
  assert.equal(a, uuidLegado("ancia"));
  assert.notEqual(a, uuidLegado("monalisa"));
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("lista exige admin; criação valida e numera XX-AAAA-MM", async () => {
  const io = fakeIo();
  const { req: semAuth, ctx } = req("/api/contratos");
  assert.equal((await contratos(semAuth, ctx, io)).status, 401);

  const ruim = await criar(io, { ...payloadMisto(), financeiro: {} });
  assert.equal(ruim.status, 400);

  const { status, body } = await criar(io, payloadMisto());
  assert.equal(status, 201);
  assert.equal(body.status, "rascunho");
  assert.match(body.numero, /^CA-\d{4}-\d{2}$/);
  assert.equal(body.financeiro.valorTotal, 1500);
  assert.equal(body.financeiro.valorMensal, 1500);
  assert.equal(body.financeiro.unico.parcelas[0].quando, "definir");

  // mesmo número de novo → sufixo; número explícito duplicado → 409
  const segundo = await criar(io, payloadMisto());
  assert.equal(segundo.body.numero, body.numero + "-2");
  const dup = await criar(io, { ...payloadMisto(), numero: body.numero });
  assert.equal(dup.status, 409);

  const { req: lista, ctx: c2 } = req("/api/contratos", { admin: true });
  const l = await corpo(await contratos(lista, c2, io));
  assert.equal(l.body.length, 2);
  assert.equal(l.body[0].cliente, "CNT Ambiental");
});

test("fluxo: rascunho invisível → enviar → cliente assina → Vértice assina → agenda + e-mail → pagamentos", async () => {
  const io = fakeIo();
  const { body: c } = await criar(io, payloadMisto());
  const id = c.id;

  // público não vê rascunho; admin vê
  const g1 = req(`/api/contratos/${id}`);
  assert.equal((await contrato(g1.req, ctxId(id, g1.ctx), io)).status, 404);
  const g2 = req(`/api/contratos/${id}`, { admin: true });
  assert.equal((await contrato(g2.req, ctxId(id, g2.ctx), io)).status, 200);

  // assinar antes de enviar → 409
  const a0 = req(`/api/contratos/${id}/assinar`, { method: "POST", body: { parte: "contratante", nome: "Thomas Silva", cpfCnpj: CPF_QUALQUER, email: "t@cnt.com", aceite: true } });
  assert.equal((await assinar(a0.req, ctxId(id, a0.ctx), io)).status, 409);

  // enviar
  const e = req(`/api/contratos/${id}`, { method: "PATCH", body: { acao: "enviar" }, admin: true });
  const env = await corpo(await contrato(e.req, ctxId(id, e.ctx), io));
  assert.equal(env.body.status, "aguardando_assinaturas");

  // editar ainda permitido (ninguém assinou)
  const ed = req(`/api/contratos/${id}`, { method: "PATCH", body: { proposta: { titulo: "Novo título" } }, admin: true });
  assert.equal((await contrato(ed.req, ctxId(id, ed.ctx), io)).status, 200);

  // cliente assina (público)
  const a1 = req(`/api/contratos/${id}/assinar`, { method: "POST", body: { parte: "contratante", nome: "Thomas Silva", cpfCnpj: CPF_QUALQUER, email: "t@cnt.com", aceite: true } });
  const r1 = await corpo(await assinar(a1.req, ctxId(id, a1.ctx), io));
  assert.equal(r1.status, 200);
  assert.equal(r1.body.status, "aguardando_assinaturas");
  assert.equal(r1.body.assinatura.ip, "203.0.113.9");
  assert.equal(io.enviados.length, 1);
  assert.match(io.enviados[0].assunto, /CONTRATANTE .* assinou/);

  // segunda assinatura do cliente → 409; editar agora → 409
  const a1b = req(`/api/contratos/${id}/assinar`, { method: "POST", body: { parte: "contratante", nome: "Thomas Silva", cpfCnpj: CPF_QUALQUER, email: "t@cnt.com", aceite: true } });
  assert.equal((await assinar(a1b.req, ctxId(id, a1b.ctx), io)).status, 409);
  const ed2 = req(`/api/contratos/${id}`, { method: "PATCH", body: { proposta: { titulo: "x" } }, admin: true });
  assert.equal((await contrato(ed2.req, ctxId(id, ed2.ctx), io)).status, 409);

  // Vértice: sem admin 401; com CNPJ errado 400; certo → assinado + agenda
  const a2 = req(`/api/contratos/${id}/assinar`, { method: "POST", body: { parte: "contratada", nome: "Victor Rodrigues Viana", cpfCnpj: CNPJ_VERTICE, email: "vianavictorv@gmail.com", aceite: true } });
  assert.equal((await assinar(a2.req, ctxId(id, a2.ctx), io)).status, 401);
  const a3 = req(`/api/contratos/${id}/assinar`, { method: "POST", admin: true, body: { parte: "contratada", nome: "Victor", cpfCnpj: CPF_QUALQUER, email: "v@v.com", aceite: true } });
  assert.equal((await assinar(a3.req, ctxId(id, a3.ctx), io)).status, 400);
  const a4 = req(`/api/contratos/${id}/assinar`, { method: "POST", admin: true, body: { parte: "contratada", nome: "Victor Rodrigues Viana", cpfCnpj: CNPJ_VERTICE, email: "vianavictorv@gmail.com", aceite: true } });
  const r4 = await corpo(await assinar(a4.req, ctxId(id, a4.ctx), io));
  assert.equal(r4.status, 200);
  assert.equal(r4.body.status, "assinado");
  assert.equal(r4.body.pagamentos.length, 2);
  assert.equal(r4.body.pagamentos[0].serie, "unico");
  assert.equal(r4.body.pagamentos[0].vencimento, null);
  assert.equal(r4.body.pagamentos[1].id, "m1");
  assert.match(io.enviados[1].assunto, /ASSINADO pelas duas partes/);

  // pagamentos: datar a 1ª mensalidade e marcar o site pago
  const pags = r4.body.pagamentos.map((p) => ({ ...p }));
  pags[0].pago = true;
  pags[1].vencimento = "2026-10-01";
  const p1 = req(`/api/contratos/${id}/pagamentos`, { method: "PATCH", admin: true, body: { pagamentos: pags } });
  const rp = await corpo(await pagamentos(p1.req, ctxId(id, p1.ctx), io));
  assert.equal(rp.status, 200);
  assert.equal(rp.body.pagamentos[0].pago, true);
  assert.ok(rp.body.pagamentos[0].pagoEm);
  assert.equal(rp.body.pagamentos[1].vencimento, "2026-10-01");

  // índice reflete
  const { req: lista, ctx: cl } = req("/api/contratos", { admin: true });
  const l = await corpo(await contratos(lista, cl, io));
  assert.equal(l.body[0].status, "assinado");
  assert.equal(l.body[0].mensalAtivo, true);
  assert.equal(l.body[0].assinaturas.contratada, true);

  // excluir
  const d = req(`/api/contratos/${id}`, { method: "DELETE", admin: true });
  assert.equal((await contrato(d.req, ctxId(id, d.ctx), io)).status, 204);
  const l2 = await corpo(await contratos(req("/api/contratos", { admin: true }).req, cl, io));
  assert.equal(l2.body.length, 0);
});

test("legado: público 404, editar/enviar/assinar 409, sincronizar lê assinaturas/<docId>.json", async () => {
  const io = fakeIo();
  const { status, body: c } = await criar(io, {
    ...payloadMisto(),
    numero: "AN-2026-09",
    status: "aguardando_assinaturas",
    legado: { slug: "ancia", docId: "ancia-2026-09", fluxo: "api-assinar-multiparte", url: "/ancia" },
    financeiro: { mensal: { valor: 1500, meses: 0, inicio: "assinatura" }, cortesias: [{ descricao: "Site do buffet", valorTabela: 3000 }] }
  });
  assert.equal(status, 201);
  assert.equal(c.origem, "legado");
  const id = c.id;

  const g = req(`/api/contratos/${id}`);
  assert.equal((await contrato(g.req, ctxId(id, g.ctx), io)).status, 404);
  const e = req(`/api/contratos/${id}`, { method: "PATCH", body: { acao: "enviar" }, admin: true });
  assert.equal((await contrato(e.req, ctxId(id, e.ctx), io)).status, 409);
  const a = req(`/api/contratos/${id}/assinar`, { method: "POST", admin: true, body: { parte: "contratada", nome: "Victor Rodrigues Viana", cpfCnpj: CNPJ_VERTICE, email: "v@v.com", aceite: true } });
  assert.equal((await assinar(a.req, ctxId(id, a.ctx), io)).status, 409);

  // sem arquivo de assinatura: continua aguardando
  const s1 = req(`/api/contratos/${id}`, { method: "PATCH", body: { acao: "sincronizar" }, admin: true });
  const r1 = await corpo(await contrato(s1.req, ctxId(id, s1.ctx), io));
  assert.equal(r1.body.status, "aguardando_assinaturas");

  // arquivo multiparte assinado pelas duas partes → assinado + agenda real
  await io.gravarJson("assinaturas/ancia-2026-09.json", {
    docId: "ancia-2026-09", formato: "multiparte", status: "assinado",
    assinaturas: {
      contratada: { parte: "contratada", nome: "victor viana", cpfCnpj: CNPJ_VERTICE, email: "v@v.com", ip: "1.1.1.1", assinadoEm: "2026-09-03T19:20:01.300Z", protocolo: "abc" },
      contratante: { parte: "contratante", nome: "Amanda tatiana", cpfCnpj: CNPJ_CLIENTE, email: "a@a.com", ip: "2.2.2.2", assinadoEm: "2026-09-10T10:54:01.913Z", protocolo: "def" }
    }
  }, null, "teste");
  const s2 = req(`/api/contratos/${id}`, { method: "PATCH", body: { acao: "sincronizar" }, admin: true });
  const r2 = await corpo(await contrato(s2.req, ctxId(id, s2.ctx), io));
  assert.equal(r2.body.status, "assinado");
  assert.equal(r2.body.assinaturas.contratante.protocolo, "def");
  assert.equal(r2.body.assinaturas.contratante.origem.tipo, "assinaturas");
  assert.equal(r2.body.pagamentos[0].vencimento, "2026-09-10");
  assert.equal(r2.body.pagamentos[0].previsao, false);
});

test("modelos: catálogo default sem arquivo; PUT sanitiza e devolve sha", async () => {
  const io = fakeIo();
  const { req: g, ctx } = req("/api/modelos", { admin: true });
  const r = await corpo(await modelos(g, ctx, io));
  assert.equal(r.body.modelos.length, CATALOGO_DEFAULT.length);
  assert.equal(r.body.sha, null);
  const { req: p } = req("/api/modelos", { method: "PUT", admin: true, body: { modelos: [{ nome: "Teste", financeiro: { mensal: { valor: 100 } } }] } });
  const rp = await corpo(await modelos(p, ctx, io));
  assert.equal(rp.status, 200);
  assert.equal(rp.body.modelos[0].id, "teste");
  assert.equal(rp.body.modelos[0].financeiro.mensal.valor, 100);
  assert.ok(rp.body.sha);
});
