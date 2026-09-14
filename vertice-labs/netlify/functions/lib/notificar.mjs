// Aviso por e-mail a cada assinatura, pela API da Hostinger (lib/hostinger-mail.mjs).
// O FormSubmit (lib/email.mjs) bloqueia chamada de servidor, por isso não é usado aqui.
// Falha no e-mail nunca derruba a assinatura: quem chama trata a rejeição.

import { enviarComAnexo } from "./hostinger-mail.mjs";
import { VERTICE, SITE } from "./vertice.mjs";

function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function moeda(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function montarAvisoAssinatura(contrato, parte, assinatura) {
  const completo = contrato.status === "assinado";
  const cliente = contrato.contratante?.nomeExibicao || contrato.contratante?.razaoSocial || "";
  const quem = parte === "contratante" ? `CONTRATANTE (${cliente})` : `CONTRATADA (${VERTICE.fantasia})`;
  const falta = parte === "contratante" ? "a Vértice" : "o cliente";
  const assunto = completo
    ? `Contrato ${contrato.numero} · ${cliente} · ASSINADO pelas duas partes`
    : `Contrato ${contrato.numero} · ${quem} assinou · falta ${falta}`;
  const linhas = [
    ["Contrato", `${contrato.numero} · ${cliente}`],
    ["Parte", quem],
    ["Nome", assinatura.nome],
    ["CPF/CNPJ", assinatura.cpfCnpj],
    ["E-mail", assinatura.email],
    ["Data e hora (UTC)", assinatura.assinadoEm],
    ["IP de origem", assinatura.ip || "não disponível"],
    ["Protocolo", assinatura.protocolo],
    ["Valor", contrato.financeiro?.valorMensal ? `${moeda(contrato.financeiro.valorMensal)}/mês` : moeda(contrato.financeiro?.valorTotal)],
    ["Status", completo ? "ASSINADO pelas duas partes" : `Aguardando ${falta}`],
    ["Link", `${SITE}/contrato?id=${contrato.id}`]
  ];
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#0d0d0f">
    <p style="font-size:16px"><b>${esc(assunto)}</b></p>
    <table style="border-collapse:collapse">${linhas.map(([k, v]) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#76767e;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`
    ).join("")}</table>
    <p style="color:#76767e;font-size:12px;margin-top:16px">Assinatura eletrônica registrada nos termos da MP 2.200-2/2001 e da Lei nº 14.063/2020. Vértice Labs · sistema de contratos.</p>
  </div>`;
  const texto = linhas.map(([k, v]) => `${k}: ${v}`).join("\n");
  return { assunto, html, texto };
}

export async function notificarAssinatura(contrato, parte, assinatura, io = { enviarComAnexo }) {
  const destino = process.env.EMAIL_ASSINATURA || VERTICE.email;
  const aviso = montarAvisoAssinatura(contrato, parte, assinatura);
  await io.enviarComAnexo({ para: [destino], assunto: aviso.assunto, html: aviso.html, texto: aviso.texto, anexos: [] });
  return true;
}
