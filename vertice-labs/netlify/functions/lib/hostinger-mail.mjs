// Envio de e-mail com anexo pela API de e-mail da Hostinger, a partir de uma
// caixa gerenciada (contato@vianamidias.com.br). Diferente do FormSubmit
// (lib/email.mjs), esta API aceita chamada de servidor, leva anexo e guarda
// cópia na pasta Enviados da caixa.
//
// Env vars no site Netlify:
//   HOSTINGER_MAIL_TOKEN  token de API criado no painel/MCP da Hostinger,
//                         com escopo na caixa remetente
//   HOSTINGER_MAIL_BOX    resourceId da caixa (AC...)

const API = "https://api.mail.hostinger.com";
const REMETENTE_NOME = "Vértice Labs";

// `remetenteNome` é o displayName que aparece na caixa de quem recebe; a caixa
// remetente é sempre a mesma. Documentos de outra marca (ver `marca` no
// DOCUMENTOS do assinar.mjs) passam o nome deles.
export async function enviarComAnexo({ para, assunto, html, texto, anexos = [], remetenteNome = REMETENTE_NOME }) {
  const token = process.env.HOSTINGER_MAIL_TOKEN;
  const caixa = process.env.HOSTINGER_MAIL_BOX;
  if (!token || !caixa) {
    throw new Error("Configure HOSTINGER_MAIL_TOKEN e HOSTINGER_MAIL_BOX nas variáveis de ambiente.");
  }
  if (!Array.isArray(para) || para.length === 0) throw new Error("Informe ao menos um destinatário.");

  const res = await fetch(`${API}/api/v1/mailboxes/${encodeURIComponent(caixa)}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      to: para,
      subject: assunto,
      html,
      text: texto,
      displayName: remetenteNome || REMETENTE_NOME,
      attachments: anexos.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType || "application/pdf",
        encoding: "base64"
      }))
    })
  });

  if (res.status === 204 || res.ok) return true;
  const corpo = await res.text().catch(() => "");
  throw new Error(`Hostinger Mail HTTP ${res.status}: ${corpo.slice(0, 300)}`);
}
