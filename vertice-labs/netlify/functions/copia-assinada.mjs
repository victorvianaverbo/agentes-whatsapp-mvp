// Cópia assinada em PDF por e-mail.
//
// Depois que todas as partes assinam (status "assinado" em assinaturas/<docId>.json),
// a página chama esta rota em duas etapas, cada uma dentro dos 10 s da function:
//
//   POST /api/copia-assinada { docId, etapa: "pdf" }
//     imprime a página do contrato (?pdf=1) em PDF e grava em contratos/<docId>.pdf
//     no repo de dados; marca registro.copia = { pdfSha, geradoEm, bytes }
//   POST /api/copia-assinada { docId, etapa: "enviar" }
//     manda o PDF por e-mail (API da Hostinger) para os e-mails de todas as
//     assinaturas mais EMAIL_ASSINATURA; marca registro.copia.enviadaEm
//
// As duas etapas são idempotentes: repetir responde 200 sem refazer. Se uma
// falhar, a página tenta de novo na próxima abertura.
//
// Modo teste ({ teste: true, chave: COPIA_CHAVE }): gera o PDF do estado atual
// (mesmo sem assinaturas) em contratos/<docId>-teste.pdf e envia só para
// EMAIL_ASSINATURA, sem tocar em registro.copia. A chave impede que a rota
// vire disparador de e-mail para qualquer um.

import { createHash } from "node:crypto";
import { lerJson, gravarJson, lerArquivo, gravarArquivo, ConflitoError } from "./lib/github.mjs";
import { gerarPdf } from "./lib/pdf.mjs";
import { enviarComAnexo } from "./lib/hostinger-mail.mjs";
import { json, erro, lerBody } from "./lib/http.mjs";
import { DOCUMENTOS, estadoPublico } from "./assinar.mjs";

export const config = { path: "/api/copia-assinada" };

const TENTATIVAS_GRAVACAO = 3;

export default (req, context) => tratar(req, context);

export async function tratar(req, context, io = { lerJson, gravarJson, lerArquivo, gravarArquivo, gerarPdf, enviarComAnexo }) {
  if (req.method !== "POST") return erro(405, "Método não permitido");
  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const docId = String(body.docId || "").trim();
  const doc = Object.prototype.hasOwnProperty.call(DOCUMENTOS, docId) ? DOCUMENTOS[docId] : null;
  if (!doc || !doc.partes || !doc.pagina) return erro(404, "Documento não encontrado");

  const etapa = String(body.etapa || "").trim();
  if (etapa !== "pdf" && etapa !== "enviar") return erro(400, "Informe a etapa: pdf ou enviar", { codigo: "etapa_invalida" });

  const teste = body.teste === true;
  if (teste) {
    const chave = process.env.COPIA_CHAVE;
    if (!chave || String(body.chave || "") !== chave) return erro(403, "Chave de teste inválida", { codigo: "chave_invalida" });
  }

  const caminhos = {
    registro: `assinaturas/${docId}.json`,
    pdf: `contratos/${docId}${teste ? "-teste" : ""}.pdf`
  };

  try {
    return etapa === "pdf"
      ? await etapaPdf(docId, doc, caminhos, teste, io)
      : await etapaEnviar(docId, doc, caminhos, teste, io);
  } catch (e) {
    console.error(e);
    return erro(500, etapa === "pdf" ? "Não foi possível gerar o PDF agora." : "Não foi possível enviar a cópia agora.");
  }
}

/* ------------------------------- etapa: pdf ------------------------------- */

async function etapaPdf(docId, doc, caminhos, teste, io) {
  const registro = (await io.lerJson(caminhos.registro))?.dados || null;
  if (!teste) {
    const bloqueio = exigirAssinado(registro);
    if (bloqueio) return bloqueio;
    if (registro.copia?.pdfSha) return json(200, { etapa: "pdf", jaExistia: true, copia: copiaPublica(registro.copia) });
  }

  const pdf = await io.gerarPdf(`${site()}${doc.pagina}?pdf=1`);
  if (!pdf || pdf.length < 1000) throw new Error(`PDF vazio (${pdf ? pdf.length : 0} bytes)`);
  const sha256 = createHash("sha256").update(pdf).digest("hex");

  const existente = await io.lerArquivo(caminhos.pdf);
  await io.gravarArquivo(caminhos.pdf, pdf, existente?.sha, `pdf ${doc.numero}${teste ? " (teste)" : ""}`);

  if (teste) return json(200, { etapa: "pdf", teste: true, bytes: pdf.length, sha256, caminho: caminhos.pdf });

  const geradoEm = new Date().toISOString();
  const atualizado = await gravarCopia(caminhos.registro, doc, (r) => {
    r.copia = { ...(r.copia || {}), pdfSha: sha256, geradoEm, bytes: pdf.length };
  }, io);
  return json(200, { etapa: "pdf", copia: copiaPublica(atualizado.copia) });
}

/* ------------------------------ etapa: enviar ----------------------------- */

async function etapaEnviar(docId, doc, caminhos, teste, io) {
  const registro = (await io.lerJson(caminhos.registro))?.dados || null;
  if (!teste) {
    const bloqueio = exigirAssinado(registro);
    if (bloqueio) return bloqueio;
    if (!registro.copia?.pdfSha) return erro(409, "Gere o PDF antes de enviar.", { codigo: "pdf_pendente" });
    if (registro.copia.enviadaEm) return json(200, { etapa: "enviar", jaEnviada: true, copia: copiaPublica(registro.copia) });
  }

  const arquivo = await io.lerArquivo(caminhos.pdf);
  if (!arquivo || !arquivo.conteudo || arquivo.conteudo.length === 0) {
    return erro(409, "PDF não encontrado. Gere o PDF antes de enviar.", { codigo: "pdf_pendente" });
  }

  const destinatarios = teste ? [emailVertice()] : destinatariosDe(registro);
  const mensagem = montarMensagem(doc, registro, teste);
  await io.enviarComAnexo({
    para: destinatarios,
    assunto: mensagem.assunto,
    html: mensagem.html,
    texto: mensagem.texto,
    remetenteNome: mensagem.remetenteNome,
    anexos: [{ filename: nomeArquivo(doc), content: arquivo.conteudo.toString("base64"), contentType: "application/pdf" }]
  });

  if (teste) return json(200, { etapa: "enviar", teste: true, destinatarios });

  const enviadaEm = new Date().toISOString();
  const atualizado = await gravarCopia(caminhos.registro, doc, (r) => {
    r.copia = { ...(r.copia || {}), enviadaEm, destinatarios };
  }, io);
  return json(200, { etapa: "enviar", copia: copiaPublica(atualizado.copia) });
}

/* --------------------------------- apoio --------------------------------- */

function exigirAssinado(registro) {
  if (!registro || registro.status !== "assinado" || !registro.assinaturas) {
    return erro(409, "O contrato ainda não foi assinado por todas as partes.", { codigo: "nao_assinado" });
  }
  return null;
}

// Relê, aplica a mudança e grava com o sha atual; numa corrida com uma
// gravação concorrente, tenta de novo a partir do arquivo relido.
async function gravarCopia(caminho, doc, mudar, io) {
  for (let tentativa = 0; tentativa < TENTATIVAS_GRAVACAO; tentativa++) {
    const lido = await io.lerJson(caminho);
    if (!lido?.dados) throw new Error("Registro de assinaturas sumiu durante a gravação");
    const registro = lido.dados;
    mudar(registro);
    try {
      await io.gravarJson(caminho, registro, lido.sha, `cópia assinada ${doc.numero}`);
      return registro;
    } catch (e) {
      if (e instanceof ConflitoError) continue;
      throw e;
    }
  }
  throw new Error("Conflito persistente ao gravar a cópia");
}

export function copiaPublica(copia) {
  return estadoPublico("x", { partes: {} }, { copia }).copia;
}

function site() {
  return (process.env.URL || "https://verticelabs.iafunil.com.br").replace(/\/$/, "");
}

function emailVertice() {
  return process.env.EMAIL_ASSINATURA || "vianavictorv@gmail.com";
}

export function destinatariosDe(registro) {
  const lista = [];
  const visto = new Set();
  const incluir = (e) => {
    const limpo = String(e || "").trim();
    const chave = limpo.toLowerCase();
    if (!limpo || visto.has(chave)) return;
    visto.add(chave);
    lista.push(limpo);
  };
  for (const a of Object.values(registro.assinaturas || {})) incluir(a.email);
  incluir(emailVertice());
  return lista;
}

export function nomeArquivo(doc) {
  const contratante = doc.partes?.contratante?.curto || "Cliente";
  const slug = contratante.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Contrato-${doc.numero}-${slug}-Assinado.pdf`;
}

function dataBr(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Marca que assina o e-mail. Um documento pode trazer `marca` na entrada do
// DOCUMENTOS (nome, rodape, contato) quando a contratada não é a Vértice.
const MARCA_PADRAO = {
  nome: "Vértice Labs",
  rodape: "Vértice Labs · Viana Mídias e Marketing LTDA · CNPJ 40.461.516/0001-58",
  contato: "WhatsApp (31) 99161-8745 · vianavictorv@gmail.com"
};

export function montarMensagem(doc, registro, teste) {
  const marca = { ...MARCA_PADRAO, ...(doc.marca || {}) };
  const cliente = doc.partes?.contratante?.curto || doc.cliente;
  const link = `${site()}${doc.pagina}`;
  const assinaturas = registro?.assinaturas || {};
  const linhas = Object.keys(doc.partes).map((id) => {
    const p = doc.partes[id];
    const a = assinaturas[id];
    return a
      ? { rotulo: p.rotulo, quem: p.quem, texto: `${a.nome}, em ${dataBr(a.assinadoEm)}`, protocolo: a.protocolo }
      : { rotulo: p.rotulo, quem: p.quem, texto: "assinatura pendente", protocolo: "" };
  });

  const assunto = `${teste ? "[TESTE] " : ""}Contrato ${doc.numero} · ${cliente} · cópia assinada em PDF`;

  const texto = [
    `Contrato ${doc.numero} · ${doc.titulo}`,
    "",
    teste ? "Este é um envio de teste. O PDF em anexo mostra o estado atual do contrato." : "Segue em anexo a cópia do contrato assinado eletronicamente por todas as partes.",
    "",
    ...linhas.map((l) => `${l.rotulo} · ${l.quem}: ${l.texto}${l.protocolo ? `\nProtocolo: ${l.protocolo}` : ""}`),
    "",
    `O contrato também pode ser conferido em ${link}`,
    "",
    marca.rodape,
    marca.contato
  ].join("\n");

  const html = `
<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0d0d0f;max-width:620px">
  <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#76767e;margin:0 0 6px">${esc(marca.nome)}</p>
  <h1 style="font-size:20px;margin:0 0 14px">Contrato ${esc(doc.numero)} · ${esc(cliente)}</h1>
  <p style="margin:0 0 16px">${teste ? "Este é um envio de <b>teste</b>. O PDF em anexo mostra o estado atual do contrato." : "Segue em anexo a cópia do contrato assinado eletronicamente por todas as partes, com data, hora, IP e protocolo de cada assinatura."}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px">
    ${linhas.map((l) => `<tr>
      <td style="padding:8px 10px;border-top:1px solid #e4e4e8;vertical-align:top;white-space:nowrap"><b>${esc(l.rotulo)}</b><br><span style="color:#76767e">${esc(l.quem)}</span></td>
      <td style="padding:8px 10px;border-top:1px solid #e4e4e8;vertical-align:top">${esc(l.texto)}${l.protocolo ? `<br><span style="font-family:monospace;font-size:11px;color:#76767e;word-break:break-all">Protocolo ${esc(l.protocolo)}</span>` : ""}</td>
    </tr>`).join("")}
  </table>
  <p style="margin:16px 0 0">O contrato também pode ser conferido em <a href="${esc(link)}" style="color:#0d0d0f">${esc(link)}</a>.</p>
  <p style="margin:22px 0 0;font-size:12px;color:#76767e">${esc(marca.rodape)}<br>${esc(marca.contato)}</p>
</div>`;

  return { assunto, texto, html, remetenteNome: marca.nome };
}
