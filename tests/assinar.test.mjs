// Testes da function /api/assinar com um GitHub em memória (sem token, sem
// gravar nada). Rodar da raiz do repo:
//
//   node --test tests/assinar.test.mjs
//
// Mora fora de vertice-labs/ de propósito: `publish = "."` publicaria o
// arquivo, e qualquer .mjs dentro de netlify/functions/ vira function no ar.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { tratar } from "../vertice-labs/netlify/functions/assinar.mjs";
import { ConflitoError } from "../vertice-labs/netlify/functions/lib/github.mjs";

const DOC = "cambio-automatico-2026-08";
const CAMINHO = `assinaturas/${DOC}.json`;
const ANTIGO = "lm-bids-2026-08";
const CPF_GREYK = "225.556.708-31";
const CNPJ_VERTICE = "40.461.516/0001-58";
const CNPJ_CLIENTE = "44.431.539/0001-70";
const CPF_QUALQUER = "529.982.247-25"; // válido, mas de ninguém
const CNPJ_QUALQUER = "11.222.333/0001-81";
const IP = "203.0.113.9";

function fakeIo({ hostingerFalha = false } = {}) {
  const arquivos = new Map();
  let n = 0;
  const io = {
    arquivos,
    enviados: [], // avisos de conclusão pela Hostinger
    lerJson: async (caminho) => {
      const a = arquivos.get(caminho);
      return a ? { dados: structuredClone(a.dados), sha: a.sha } : null;
    },
    gravarJson: async (caminho, dados, sha) => {
      const atual = arquivos.get(caminho);
      // mesma regra da Contents API: sha velho ou ausente em arquivo existente = conflito
      if ((atual && atual.sha !== sha) || (!atual && sha)) throw new ConflitoError();
      arquivos.set(caminho, { dados: structuredClone(dados), sha: `sha${++n}` });
    },
    enviarEmail: async () => {
      throw new Error("FormSubmit bloqueia chamada de servidor");
    },
    enviarComAnexo: async (msg) => {
      if (hostingerFalha) throw new Error("Hostinger Mail HTTP 401");
      io.enviados.push(msg);
      return true;
    }
  };
  return io;
}

function post(io, body, ip = IP) {
  const req = new Request("http://x/api/assinar", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "teste/1.0" },
    body: JSON.stringify(body)
  });
  return tratar(req, { ip }, io);
}

function get(io, query) {
  return tratar(new Request(`http://x/api/assinar${query ? "?" + query : ""}`), {}, io);
}

async function corpo(res) {
  return { status: res.status, body: await res.json() };
}

const dados = (extra) => ({ docId: DOC, nome: "Fulano de Tal", cpfCnpj: CPF_QUALQUER, email: "fulano@teste.com", aceite: true, ...extra });

test("GET sem assinatura responde 200 com tudo pendente", async () => {
  const io = fakeIo();
  const { status, body } = await corpo(await get(io, `docId=${DOC}`));
  assert.equal(status, 200);
  assert.equal(body.status, "aguardando_assinaturas");
  assert.equal(body.total, 3);
  assert.equal(body.assinadas, 0);
  assert.deepEqual(body.faltam, ["contratante", "contratada", "contratado-2"]);
  assert.equal(body.partes.contratada.assinada, false);
  assert.equal(body.partes.contratada.rotulo, "CONTRATADA");
});

test("GET: sem docId 400, inexistente 404, documento antigo 404; PUT 405", async () => {
  const io = fakeIo();
  assert.equal((await get(io, "")).status, 400);
  assert.equal((await get(io, "docId=nao-existe")).status, 404);
  assert.equal((await get(io, `docId=${ANTIGO}`)).status, 404);
  assert.equal((await tratar(new Request("http://x/api/assinar", { method: "PUT" }), {}, io)).status, 405);
});

test("validações antes de qualquer I/O", async () => {
  const io = fakeIo();
  let r;

  r = await corpo(await post(io, dados({ docId: "nao-existe", parte: "contratante" })));
  assert.equal(r.status, 404);

  r = await corpo(await post(io, dados({})));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "parte_ausente");

  r = await corpo(await post(io, dados({ parte: "errada" })));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "parte_invalida");

  r = await corpo(await post(io, dados({ parte: "__proto__" })));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "parte_invalida");

  r = await corpo(await post(io, dados({ parte: "contratante", cpfCnpj: "111.111.111-11" })));
  assert.equal(r.status, 400);
  assert.equal(r.body.erro, "Informe um CPF ou CNPJ válido");

  r = await corpo(await post(io, dados({ parte: "contratante", aceite: false })));
  assert.equal(r.status, 400);

  r = await corpo(await post(io, dados({ parte: "contratado-2", cpfCnpj: CPF_QUALQUER })));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "documento_nao_confere");
  assert.ok(!r.body.erro.includes("225"), "não revela o documento esperado");

  r = await corpo(await post(io, dados({ parte: "contratada", cpfCnpj: CNPJ_QUALQUER })));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "documento_nao_confere");

  r = await corpo(await post(io, dados({ docId: ANTIGO, parte: "contratante" })));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "parte_nao_suportada");

  assert.equal(io.arquivos.size, 0, "nada foi gravado");
});

test("fluxo completo: três partes, qualquer ordem, uma vez cada", async () => {
  const io = fakeIo();
  let r;

  r = await corpo(await post(io, dados({ parte: "contratado-2", nome: "Greyk da Silva Sousa", cpfCnpj: CPF_GREYK })));
  assert.equal(r.status, 200);
  assert.equal(r.body.parte, "contratado-2");
  assert.equal(r.body.status, "aguardando_assinaturas");
  assert.equal(r.body.avisado, false);
  assert.ok(r.body.email.campos._subject.includes("CONTRATADO 2 (Greyk) assinou · faltam 2"));
  assert.ok(r.body.email.campos.Status.includes("CONTRATANTE (Câmbio Automático)"));
  assert.equal(r.body.assinatura.cpfCnpj, CPF_GREYK, "comprovante do próprio assinante leva o documento");
  assert.equal(r.body.assinatura.userAgent, undefined);
  assert.deepEqual(r.body.estado.faltam, ["contratante", "contratada"]);
  assert.equal(r.body.estado.partes["contratado-2"].nome, "Greyk da Silva Sousa");

  r = await corpo(await post(io, dados({ parte: "contratado-2", cpfCnpj: CPF_GREYK })));
  assert.equal(r.status, 409);
  assert.equal(r.body.codigo, "parte_ja_assinou");

  r = await corpo(await post(io, dados({ parte: "contratada", nome: "Victor Rodrigues Viana", cpfCnpj: CNPJ_VERTICE })));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.estado.faltam, ["contratante"]);
  assert.ok(r.body.email.campos._subject.includes("faltam 1"));

  r = await corpo(await post(io, dados({ parte: "contratante", nome: "Sócio da Câmbio", cpfCnpj: CNPJ_CLIENTE })));
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "assinado");
  assert.ok(r.body.email.campos._subject.includes("ASSINADO por todas as partes"));
  assert.equal(r.body.estado.assinadas, 3);

  const gravado = io.arquivos.get(CAMINHO).dados;
  assert.equal(gravado.formato, "multiparte");
  assert.equal(gravado.status, "assinado");
  assert.ok(gravado.concluidoEm);
  assert.deepEqual(gravado.partes, ["contratante", "contratada", "contratado-2"]);
  assert.equal(Object.keys(gravado.assinaturas).length, 3);
  assert.equal(gravado.assinaturas["contratado-2"].userAgent, "teste/1.0");
  const a = gravado.assinaturas["contratado-2"];
  const esperado = createHash("sha256")
    .update([DOC, "contratado-2", a.nome, a.cpfCnpj, a.email, a.assinadoEm, IP].join("|"), "utf8")
    .digest("hex");
  assert.equal(a.protocolo, esperado, "protocolo inclui a parte");

  r = await corpo(await post(io, dados({ parte: "contratante", cpfCnpj: CPF_QUALQUER })));
  assert.equal(r.status, 409);
  assert.equal(r.body.codigo, "contrato_concluido");
});

test("GET nunca expõe CPF, e-mail nem User-Agent", async () => {
  const io = fakeIo();
  await post(io, dados({ parte: "contratado-2", nome: "Greyk da Silva Sousa", cpfCnpj: CPF_GREYK, email: "greyk@teste.com" }));
  const res = await get(io, `docId=${DOC}`);
  const texto = await res.text();
  assert.equal(res.status, 200);
  for (const proibido of ["cpfCnpj", "email", "userAgent", "22555670831", "225.556", "greyk@teste.com", "teste/1.0"]) {
    assert.ok(!texto.includes(proibido), `vazou: ${proibido}`);
  }
  const body = JSON.parse(texto);
  assert.equal(body.assinadas, 1);
  assert.equal(body.partes["contratado-2"].assinada, true);
  assert.equal(body.partes["contratado-2"].ip, IP);
  assert.ok(body.partes["contratado-2"].protocolo);
});

test("corrida: sha velho gera conflito, a releitura preserva a assinatura anterior", async () => {
  const io = fakeIo();
  await post(io, dados({ parte: "contratado-2", cpfCnpj: CPF_GREYK }));

  const lerReal = io.lerJson;
  let primeira = true;
  io.lerJson = async (c) => {
    const lido = await lerReal(c);
    if (primeira) { primeira = false; return { ...lido, sha: "velho" }; }
    return lido;
  };

  const r = await corpo(await post(io, dados({ parte: "contratada", cpfCnpj: CNPJ_VERTICE })));
  assert.equal(r.status, 200);
  const gravado = io.arquivos.get(CAMINHO).dados;
  assert.ok(gravado.assinaturas["contratado-2"], "assinatura anterior preservada");
  assert.ok(gravado.assinaturas["contratada"]);
});

test("corrida real: dois assinantes ao mesmo tempo, arquivo final tem os dois", async () => {
  const io = fakeIo();
  const [a, b] = await Promise.all([
    post(io, dados({ parte: "contratada", cpfCnpj: CNPJ_VERTICE })),
    post(io, dados({ parte: "contratado-2", cpfCnpj: CPF_GREYK }))
  ]);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  const gravado = io.arquivos.get(CAMINHO).dados;
  assert.deepEqual(Object.keys(gravado.assinaturas).sort(), ["contratada", "contratado-2"]);
});

test("conflito persistente esgota as tentativas com 409 conflito_gravacao", async () => {
  const io = fakeIo();
  io.gravarJson = async () => { throw new ConflitoError(); };
  const r = await corpo(await post(io, dados({ parte: "contratante" })));
  assert.equal(r.status, 409);
  assert.equal(r.body.codigo, "conflito_gravacao");
});

test("formato incompatível: arquivo antigo num documento multi-parte responde 500", async () => {
  const io = fakeIo();
  io.arquivos.set(CAMINHO, { dados: { docId: DOC, assinatura: { nome: "X" } }, sha: "s" });
  assert.equal((await post(io, dados({ parte: "contratante" }))).status, 500);
  assert.equal((await get(io, `docId=${DOC}`)).status, 500);
});

test("regressão: documento antigo continua no fluxo de assinatura única", async () => {
  const io = fakeIo();
  const caminho = `assinaturas/${ANTIGO}.json`;
  const r = await corpo(await post(io, dados({ docId: ANTIGO, nome: "Matheus Teste" })));
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.body), ["assinatura", "avisado", "email"]);
  assert.equal(r.body.avisado, false);
  assert.equal(r.body.email.campos._subject, "✍️ Contrato LB-2026-08 · LM Bids Ltda ASSINADO");
  assert.equal(r.body.assinatura.userAgent, "teste/1.0", "resposta antiga leva o user-agent, como antes");

  const gravado = io.arquivos.get(caminho).dados;
  assert.deepEqual(Object.keys(gravado), ["docId", "numero", "titulo", "cliente", "assinatura", "criadoEm"]);
  assert.equal(gravado.assinaturas, undefined);
  assert.equal(gravado.status, undefined);
  const a = gravado.assinatura;
  const esperado = createHash("sha256")
    .update([ANTIGO, a.nome, a.cpfCnpj, a.email, a.assinadoEm, IP].join("|"), "utf8")
    .digest("hex");
  assert.equal(a.protocolo, esperado, "protocolo antigo não inclui parte");

  const r2 = await corpo(await post(io, dados({ docId: ANTIGO })));
  assert.equal(r2.status, 409);
  assert.equal(r2.body.erro, "Este contrato já foi assinado. A assinatura só pode ser feita uma vez.");
  assert.equal(r2.body.codigo, undefined);
});

test("regressão: documento antigo com arquivo multi-parte responde 500", async () => {
  const io = fakeIo();
  io.arquivos.set(`assinaturas/${ANTIGO}.json`, { dados: { docId: ANTIGO, assinaturas: {} }, sha: "s" });
  assert.equal((await post(io, dados({ docId: ANTIGO }))).status, 500);
});

test("dany-2026-09: quatro assinantes; Hyype, Greyk e Victor só assinam com o documento de cada um; a contratante com qualquer documento válido", async () => {
  const io = fakeIo();
  const DANY = "dany-2026-09";
  const CNPJ_HYYPE = "35.534.271/0001-01";
  const d = (extra) => dados({ docId: DANY, ...extra });

  let r = await corpo(await get(io, `docId=${DANY}`));
  assert.equal(r.body.total, 4);
  assert.deepEqual(r.body.faltam, ["contratante", "contratada", "contratado-2", "contratado-3"]);

  r = await corpo(await post(io, d({ parte: "contratada", cpfCnpj: CNPJ_VERTICE })));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "documento_nao_confere", "o CNPJ da Vértice não assina pela Hyype");
  r = await corpo(await post(io, d({ parte: "contratado-2", cpfCnpj: CNPJ_VERTICE })));
  assert.equal(r.body.codigo, "documento_nao_confere", "o Greyk assina só com o CPF dele");
  r = await corpo(await post(io, d({ parte: "contratado-3", cpfCnpj: CPF_GREYK })));
  assert.equal(r.body.codigo, "documento_nao_confere", "o Victor assina só pela Viana Mídias");

  r = await corpo(await post(io, d({ parte: "contratada", nome: "Representante Hyype", cpfCnpj: CNPJ_HYYPE, email: "hyype@teste.com" })));
  assert.equal(r.status, 200);
  assert.ok(r.body.email.campos._subject.includes("CONTRATADA (Hyype) assinou · faltam 3"), r.body.email.campos._subject);
  r = await corpo(await post(io, d({ parte: "contratado-2", nome: "Greyk da Silva Sousa", cpfCnpj: CPF_GREYK, email: "greyk@teste.com" })));
  assert.equal(r.status, 200);
  r = await corpo(await post(io, d({ parte: "contratado-3", nome: "Victor Rodrigues Viana", cpfCnpj: CNPJ_VERTICE, email: "vianavictorv@gmail.com" })));
  assert.equal(r.status, 200);
  assert.equal(r.body.estado.status, "aguardando_assinaturas", "sem a Dany ainda não está assinado");
  assert.equal(r.body.avisoConclusao, undefined, "antes da última assinatura não há aviso de conclusão");
  assert.equal(io.enviados.length, 0);

  r = await corpo(await post(io, d({ parte: "contratante", nome: "Dany Gonçalves", email: "dany@teste.com" })));
  assert.equal(r.status, 200);
  assert.equal(r.body.estado.status, "assinado");
  const gravado = io.arquivos.get(`assinaturas/${DANY}.json`).dados;
  assert.deepEqual(gravado.partes, ["contratante", "contratada", "contratado-2", "contratado-3"]);
  assert.equal(gravado.numero, "DG-2026-09");

  // aviso de conclusão: um e-mail, com o link, para todos os assinantes e o Victor (sem repetir)
  assert.equal(r.body.avisoConclusao, true);
  assert.equal(io.enviados.length, 1);
  const aviso = io.enviados[0];
  assert.deepEqual(aviso.para, ["dany@teste.com", "hyype@teste.com", "greyk@teste.com", "vianavictorv@gmail.com"]);
  assert.equal(aviso.assunto, "Contrato DG-2026-09 · Dany Gonçalves · assinado por todas as partes");
  assert.ok(aviso.texto.includes("https://verticelabs.iafunil.com.br/dany"));
  assert.ok(aviso.html.includes("Hyype") && !aviso.html.includes("Vértice"), "marca do documento, não a Vértice");
  assert.ok(aviso.texto.includes("Protocolo: "), "protocolos no corpo");
  assert.equal(aviso.remetenteNome, "Hyype");
  assert.equal(aviso.anexos, undefined, "sem PDF");
});

test("aviso de conclusão: sem marca sai como Vértice Labs; falha na Hostinger não derruba a assinatura", async () => {
  const assinarTodos = async (io) => {
    await post(io, dados({ parte: "contratada", cpfCnpj: CNPJ_VERTICE, email: "victor@teste.com" }));
    await post(io, dados({ parte: "contratado-2", cpfCnpj: CPF_GREYK, email: "greyk@teste.com" }));
    return corpo(await post(io, dados({ parte: "contratante", cpfCnpj: CNPJ_CLIENTE, email: "cliente@teste.com" })));
  };

  const io = fakeIo();
  let r = await assinarTodos(io);
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "assinado");
  assert.equal(r.body.avisoConclusao, true);
  assert.equal(io.enviados.length, 1);
  assert.equal(io.enviados[0].remetenteNome, "Vértice Labs");
  assert.ok(io.enviados[0].texto.includes("https://verticelabs.iafunil.com.br/cambio-automatico"));
  assert.ok(io.enviados[0].texto.includes("40.461.516/0001-58"));
  assert.deepEqual(io.enviados[0].para, ["cliente@teste.com", "victor@teste.com", "greyk@teste.com", "vianavictorv@gmail.com"]);

  const io2 = fakeIo({ hostingerFalha: true });
  r = await assinarTodos(io2);
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "assinado", "assinatura gravada mesmo sem e-mail");
  assert.equal(r.body.avisoConclusao, false);
  assert.equal(io2.arquivos.get(CAMINHO).dados.status, "assinado");
});
