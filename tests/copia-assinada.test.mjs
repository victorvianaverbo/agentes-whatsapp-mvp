// Testes da function /api/copia-assinada com GitHub, Chromium e Hostinger em
// memória. Rodar da raiz do repo:
//
//   node --test tests/copia-assinada.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { tratar, destinatariosDe, nomeArquivo, montarMensagem } from "../vertice-labs/netlify/functions/copia-assinada.mjs";
import { tratar as assinar } from "../vertice-labs/netlify/functions/assinar.mjs";
import { DOCUMENTOS } from "../vertice-labs/netlify/functions/assinar.mjs";
import { ConflitoError } from "../vertice-labs/netlify/functions/lib/github.mjs";

const DOC = "ancia-2026-09";
const REGISTRO = `assinaturas/${DOC}.json`;
const PDF = `contratos/${DOC}.pdf`;
const CNPJ_ANCIA = "55.043.748/0001-63";
const CPF_AMANDA = "055.459.996-12";
const CNPJ_VERTICE = "40.461.516/0001-58";
const CHAVE = "chave-de-teste";
const PDF_FALSO = Buffer.alloc(2048, 1);

function fakeIo() {
  const arquivos = new Map();
  let n = 0;
  const io = {
    arquivos,
    enviados: [],
    pdfsGerados: [],
    lerJson: async (caminho) => {
      const a = arquivos.get(caminho);
      return a ? { dados: structuredClone(a.dados), sha: a.sha } : null;
    },
    gravarJson: async (caminho, dados, sha) => {
      const atual = arquivos.get(caminho);
      if ((atual && atual.sha !== sha) || (!atual && sha)) throw new ConflitoError();
      arquivos.set(caminho, { dados: structuredClone(dados), sha: `sha${++n}` });
    },
    lerArquivo: async (caminho) => {
      const a = arquivos.get(caminho);
      return a ? { conteudo: Buffer.from(a.conteudo), sha: a.sha } : null;
    },
    gravarArquivo: async (caminho, conteudo, sha) => {
      const atual = arquivos.get(caminho);
      if ((atual && atual.sha !== sha) || (!atual && sha)) throw new ConflitoError();
      arquivos.set(caminho, { conteudo: Buffer.from(conteudo), sha: `sha${++n}` });
    },
    gerarPdf: async (url) => {
      io.pdfsGerados.push(url);
      return PDF_FALSO;
    },
    enviarComAnexo: async (msg) => {
      io.enviados.push(msg);
      return true;
    },
    // a function de assinatura também usa este io
    enviarEmail: async () => {
      throw new Error("FormSubmit bloqueia chamada de servidor");
    }
  };
  return io;
}

function post(io, body) {
  const req = new Request("http://x/api/copia-assinada", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return tratar(req, {}, io);
}

async function corpo(res) {
  return { status: res.status, body: await res.json() };
}

async function assinarTudo(io) {
  const base = { docId: DOC, aceite: true };
  const req = (b) => new Request("http://x/api/assinar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
  let r = await assinar(req({ ...base, parte: "contratante", nome: "Amanda Tatiana Gonzaga", cpfCnpj: CPF_AMANDA, email: "Amanda.Tatiana@gmail.com" }), { ip: "1.1.1.1" }, io);
  assert.equal(r.status, 200);
  r = await assinar(req({ ...base, parte: "contratada", nome: "Victor Rodrigues Viana", cpfCnpj: CNPJ_VERTICE, email: "vianavictorv@gmail.com" }), { ip: "2.2.2.2" }, io);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "assinado");
}

test("documento precisa existir, ter partes e ter página; etapa precisa ser válida", async () => {
  const io = fakeIo();
  assert.equal((await post(io, { docId: "nao-existe", etapa: "pdf" })).status, 404);
  assert.equal((await post(io, { docId: "lm-bids-2026-08", etapa: "pdf" })).status, 404, "assinatura única não tem cópia");
  // (desde 15/09/2026 todos os multiparte têm `pagina`, pelo aviso de conclusão; o 404 por falta dela fica só no código)
  const r = await corpo(await post(io, { docId: DOC, etapa: "zip" }));
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, "etapa_invalida");
  assert.equal((await tratar(new Request("http://x/api/copia-assinada"), {}, io)).status, 405);
  assert.equal(io.pdfsGerados.length, 0);
});

test("sem todas as assinaturas, as duas etapas respondem 409 nao_assinado", async () => {
  const io = fakeIo();
  let r = await corpo(await post(io, { docId: DOC, etapa: "pdf" }));
  assert.equal(r.status, 409);
  assert.equal(r.body.codigo, "nao_assinado");
  r = await corpo(await post(io, { docId: DOC, etapa: "enviar" }));
  assert.equal(r.status, 409);
  assert.equal(r.body.codigo, "nao_assinado");
  assert.equal(io.pdfsGerados.length, 0);
  assert.equal(io.enviados.length, 0);
});

test("fluxo completo: pdf, enviar, e as repetições não refazem nada", async () => {
  const io = fakeIo();
  await assinarTudo(io);
  // a última assinatura já manda o aviso de conclusão (link, sem anexo) pelo assinar.mjs
  assert.equal(io.enviados.length, 1);
  assert.equal(io.enviados[0].anexos, undefined);
  assert.ok(io.enviados[0].assunto.endsWith("assinado por todas as partes"));

  let r = await corpo(await post(io, { docId: DOC, etapa: "enviar" }));
  assert.equal(r.status, 409, "enviar antes do pdf");
  assert.equal(r.body.codigo, "pdf_pendente");

  r = await corpo(await post(io, { docId: DOC, etapa: "pdf" }));
  assert.equal(r.status, 200);
  assert.deepEqual(io.pdfsGerados, ["https://verticelabs.iafunil.com.br/ancia?pdf=1"]);
  assert.ok(io.arquivos.get(PDF).conteudo.equals(PDF_FALSO), "PDF gravado no repo");
  assert.ok(r.body.copia.geradoEm);
  assert.equal(r.body.copia.enviadaEm, null);
  const registro1 = io.arquivos.get(REGISTRO).dados;
  assert.ok(registro1.copia.pdfSha);
  assert.equal(registro1.copia.bytes, PDF_FALSO.length);
  assert.equal(registro1.status, "assinado", "assinaturas preservadas");
  assert.equal(Object.keys(registro1.assinaturas).length, 2);

  r = await corpo(await post(io, { docId: DOC, etapa: "pdf" }));
  assert.equal(r.status, 200);
  assert.equal(r.body.jaExistia, true);
  assert.equal(io.pdfsGerados.length, 1, "não regera");

  r = await corpo(await post(io, { docId: DOC, etapa: "enviar" }));
  assert.equal(r.status, 200);
  assert.equal(io.enviados.length, 2, "aviso de conclusão + cópia em PDF");
  const msg = io.enviados[1];
  assert.deepEqual(msg.para, ["Amanda.Tatiana@gmail.com", "vianavictorv@gmail.com"], "e-mails das assinaturas, sem duplicar o do Victor");
  assert.equal(msg.assunto, "Contrato AN-2026-09 · Anciã · cópia assinada em PDF");
  assert.equal(msg.anexos.length, 1);
  assert.equal(msg.anexos[0].filename, "Contrato-AN-2026-09-Ancia-Assinado.pdf");
  assert.equal(msg.anexos[0].content, PDF_FALSO.toString("base64"));
  assert.ok(msg.html.includes("Amanda Tatiana Gonzaga"));
  assert.ok(msg.texto.includes("Protocolo"));
  assert.ok(r.body.copia.enviadaEm);
  assert.equal(r.body.copia.destinatarios, 2, "resposta traz a quantidade, não os e-mails");
  assert.equal(JSON.stringify(r.body).includes("@"), false);

  const registro2 = io.arquivos.get(REGISTRO).dados;
  assert.ok(registro2.copia.enviadaEm);
  assert.deepEqual(registro2.copia.destinatarios, ["Amanda.Tatiana@gmail.com", "vianavictorv@gmail.com"]);

  r = await corpo(await post(io, { docId: DOC, etapa: "enviar" }));
  assert.equal(r.status, 200);
  assert.equal(r.body.jaEnviada, true);
  assert.equal(io.enviados.length, 2, "não reenvia");
});

test("GET /api/assinar expõe a cópia só com datas e quantidade", async () => {
  const io = fakeIo();
  await assinarTudo(io);
  await post(io, { docId: DOC, etapa: "pdf" });
  await post(io, { docId: DOC, etapa: "enviar" });
  const res = await assinar(new Request(`http://x/api/assinar?docId=${DOC}`), {}, io);
  const texto = await res.text();
  assert.equal(res.status, 200);
  const body = JSON.parse(texto);
  assert.ok(body.copia.geradoEm);
  assert.ok(body.copia.enviadaEm);
  assert.equal(body.copia.destinatarios, 2);
  assert.ok(!texto.includes("@"), "nenhum e-mail no GET");
  assert.ok(!texto.includes("pdfSha"));
});

test("modo teste: exige a chave, gera em -teste.pdf, envia só para o Victor e não grava copia", async () => {
  const io = fakeIo();
  process.env.COPIA_CHAVE = CHAVE;
  try {
    let r = await corpo(await post(io, { docId: DOC, etapa: "pdf", teste: true }));
    assert.equal(r.status, 403);
    assert.equal(r.body.codigo, "chave_invalida");

    r = await corpo(await post(io, { docId: DOC, etapa: "pdf", teste: true, chave: "errada" }));
    assert.equal(r.status, 403);

    r = await corpo(await post(io, { docId: DOC, etapa: "pdf", teste: true, chave: CHAVE }));
    assert.equal(r.status, 200);
    assert.equal(r.body.teste, true);
    assert.equal(r.body.caminho, `contratos/${DOC}-teste.pdf`);
    assert.ok(io.arquivos.get(`contratos/${DOC}-teste.pdf`));
    assert.equal(io.arquivos.get(REGISTRO), undefined, "sem assinatura, nada é gravado no registro");

    r = await corpo(await post(io, { docId: DOC, etapa: "enviar", teste: true, chave: CHAVE }));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.destinatarios, ["vianavictorv@gmail.com"]);
    assert.equal(io.enviados.length, 1);
    assert.ok(io.enviados[0].assunto.startsWith("[TESTE] "));
    assert.ok(io.enviados[0].texto.includes("assinatura pendente"));
    assert.equal(io.arquivos.get(REGISTRO), undefined);
  } finally {
    delete process.env.COPIA_CHAVE;
  }
});

test("sem COPIA_CHAVE configurada o modo teste é sempre recusado", async () => {
  const io = fakeIo();
  delete process.env.COPIA_CHAVE;
  const r = await post(io, { docId: DOC, etapa: "pdf", teste: true, chave: "" });
  assert.equal(r.status, 403);
});

test("falha ao gerar o PDF responde 500 e não marca nada", async () => {
  const io = fakeIo();
  await assinarTudo(io);
  io.gerarPdf = async () => { throw new Error("chromium morreu"); };
  const r = await corpo(await post(io, { docId: DOC, etapa: "pdf" }));
  assert.equal(r.status, 500);
  assert.equal(io.arquivos.get(REGISTRO).dados.copia, undefined);
});

test("corrida ao gravar a cópia: relê e preserva o registro", async () => {
  const io = fakeIo();
  await assinarTudo(io);
  const lerReal = io.lerJson;
  let primeira = true;
  io.lerJson = async (c) => {
    const lido = await lerReal(c);
    if (primeira && lido) { primeira = false; return { ...lido, sha: "velho" }; }
    return lido;
  };
  const r = await corpo(await post(io, { docId: DOC, etapa: "pdf" }));
  assert.equal(r.status, 200);
  const registro = io.arquivos.get(REGISTRO).dados;
  assert.ok(registro.copia.pdfSha);
  assert.equal(Object.keys(registro.assinaturas).length, 2);
});

test("apoio: destinatários, nome do arquivo e mensagem", () => {
  const doc = DOCUMENTOS[DOC];
  assert.equal(nomeArquivo(doc), "Contrato-AN-2026-09-Ancia-Assinado.pdf");
  const lista = destinatariosDe({ assinaturas: { a: { email: "x@y.com" }, b: { email: "X@Y.com" }, c: { email: "" } } });
  assert.deepEqual(lista, ["x@y.com", "vianavictorv@gmail.com"]);
  const m = montarMensagem(doc, null, false);
  assert.ok(m.html.includes("CONTRATANTE"));
  assert.ok(m.texto.includes("https://verticelabs.iafunil.com.br/ancia"));
  assert.ok(!m.assunto.startsWith("[TESTE]"));
  assert.equal(m.remetenteNome, "Vértice Labs", "sem `marca`, o e-mail continua da Vértice");
  assert.ok(m.texto.includes("40.461.516/0001-58"));
});

test("marca do documento: o contrato da Dany sai como Hyype, sem rastro da Vértice no corpo", () => {
  const dany = DOCUMENTOS["dany-2026-09"];
  assert.equal(nomeArquivo(dany), "Contrato-DG-2026-09-Dany-Goncalves-Assinado.pdf");
  const m = montarMensagem(dany, null, false);
  assert.equal(m.remetenteNome, "Hyype");
  assert.ok(m.texto.includes("https://verticelabs.iafunil.com.br/dany"));
  assert.ok(m.texto.includes("35.534.271/0001-01") && m.html.includes("35.534.271/0001-01"));
  assert.ok(!m.texto.includes("Vértice") && !m.html.includes("Vértice"));
  assert.ok(!m.texto.includes("40.461.516") && !m.html.includes("40.461.516"));
});
