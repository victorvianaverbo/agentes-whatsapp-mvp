// Assinatura eletrônica das propostas estáticas (/previ, /souzatec, ...).
//
// Mesmo desenho do sistema/ da Ilume: IP, data/hora e protocolo SHA-256 são
// calculados NO SERVIDOR, e a assinatura é gravada num repo GitHub privado —
// cada gravação vira um commit, o que dá trilha de auditoria de graça.
// O navegador só manda nome, documento e e-mail; não escolhe hash nem horário.
//
// Cada documento assina UMA vez: a segunda tentativa recebe 409.

import { createHash } from "node:crypto";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarJson, lerJson } from "./lib/github.mjs";

export const config = { path: "/api/assinar" };

// Allowlist. Documento que não estiver aqui não grava nada — evita que alguém
// use a rota para escrever arquivo arbitrário no repo de dados.
// Proposta nova = uma linha nova.
const DOCUMENTOS = {
  "previ-2026-01": {
    numero: "PV-2026-01",
    titulo: "Contrato de Prestação de Serviços · Previ Serviços Previdenciários",
    cliente: "Previ Serviços Previdenciários"
  },
  "faz-morar-evento-2026-03": {
    numero: "FM-2026-03",
    titulo: "Contrato de Prestação de Serviços · Campanha do evento Leilão & Prosa · Faz Morar",
    cliente: "Faz Morar Imóveis LTDA"
  },
  "souzatec-2026-01": {
    numero: "SZ-2026-01",
    titulo: "Contrato de Prestação de Serviços · Souza Tec Construtora",
    cliente: "Souza Tec Comércio e Serviço LTDA"
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req, context) => {
  if (req.method !== "POST") return erro(405, "Método não permitido");

  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const docId = String(body.docId || "").trim();
  const doc = Object.prototype.hasOwnProperty.call(DOCUMENTOS, docId) ? DOCUMENTOS[docId] : null;
  if (!doc) return erro(404, "Documento não encontrado");

  const nome = String(body.nome || "").trim().replace(/\s+/g, " ");
  const cpfCnpj = String(body.cpfCnpj || "").trim();
  const email = String(body.email || "").trim();

  if (nome.length < 3 || nome.length > 120) return erro(400, "Informe o nome completo");
  if (!validarDocumento(cpfCnpj)) return erro(400, "Informe um CPF ou CNPJ válido");
  if (!EMAIL_RE.test(email) || email.length > 160) return erro(400, "Informe um e-mail válido");
  if (body.aceite !== true) return erro(400, "É preciso concordar com as cláusulas para assinar");

  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "";
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 400);
  const caminho = `assinaturas/${docId}.json`;

  try {
    // Até 2 tentativas: numa corrida de gravação o sha fica velho, então
    // relemos e revalidamos — a segunda assinatura cai no 409 abaixo.
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const lido = await lerJson(caminho);
      if (lido?.dados?.assinatura) {
        return erro(409, "Este contrato já foi assinado. A assinatura só pode ser feita uma vez.");
      }

      const assinadoEm = new Date().toISOString();
      const protocolo = createHash("sha256")
        .update([docId, nome, cpfCnpj, email, assinadoEm, ip].join("|"), "utf8")
        .digest("hex");

      const assinatura = { nome, cpfCnpj, email, ip, userAgent, assinadoEm, protocolo };
      const registro = {
        docId,
        numero: doc.numero,
        titulo: doc.titulo,
        cliente: doc.cliente,
        assinatura,
        criadoEm: assinadoEm
      };

      try {
        await gravarJson(caminho, registro, lido?.sha, `assinatura ${doc.numero} — ${doc.cliente}`);
      } catch (e) {
        if (e instanceof ConflitoError) continue; // outra gravação entrou antes
        throw e;
      }

      await notificarEmail(doc, assinatura).catch((e) =>
        console.error("Falha ao enviar e-mail (assinatura já registrada):", e.message)
      );

      return json(200, { assinatura });
    }
    return erro(409, "Conflito de gravação. Tente novamente.");
  } catch (e) {
    console.error(e);
    return erro(500, "Não foi possível registrar a assinatura agora.");
  }
};

async function notificarEmail(doc, a) {
  const destino = process.env.EMAIL_ASSINATURA || "vianavictorv@gmail.com";
  const res = await fetch(`https://formsubmit.co/ajax/${destino}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `✍️ Contrato ${doc.numero} · ${doc.cliente} ASSINADO`,
      _template: "table",
      Documento: doc.titulo,
      Contrato: doc.numero,
      Nome: a.nome,
      "CPF/CNPJ": a.cpfCnpj,
      "E-mail": a.email,
      "Data e hora (UTC)": a.assinadoEm,
      "IP de origem": a.ip || "não disponível",
      Protocolo: a.protocolo,
      "User-Agent": a.userAgent
    })
  });
  if (!res.ok) throw new Error(`FormSubmit HTTP ${res.status}`);
}

/* ===================== validação de CPF / CNPJ ===================== */

function validarDocumento(valor) {
  const limpo = String(valor).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  if (limpo.length === 11) return validarCpf(limpo);
  if (limpo.length === 14) return validarCnpj(limpo);
  return false;
}

function validarCpf(cpf) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 111.111.111-11 e afins
  for (let tamanho = 9; tamanho < 11; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11 % 10;
    if (resto !== Number(cpf[tamanho])) return false;
  }
  return true;
}

// Aceita o CNPJ alfanumérico: o valor de cada caractere é o código ASCII
// menos 48, o que preserva 0-9 e dá 17..26 para A-Z.
function validarCnpj(cnpj) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj)) return false;
  if (/^(.)\1{13}$/.test(cnpj)) return false;
  const val = (c) => c.charCodeAt(0) - 48;
  for (let tamanho = 12; tamanho < 14; tamanho++) {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += val(cnpj[i]) * peso;
      peso = peso - 1 < 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    const digito = resto < 2 ? 0 : 11 - resto;
    if (digito !== Number(cnpj[tamanho])) return false;
  }
  return true;
}
