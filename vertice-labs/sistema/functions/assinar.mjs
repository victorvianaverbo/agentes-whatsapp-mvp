import { createHash } from "node:crypto";
import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarContrato, lerContrato } from "./lib/github.mjs";

export const config = { path: "/api/contratos/:id/assinar" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PARTES = ["contratante", "contratado"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req, context) => {
  if (req.method !== "POST") return erro(405, "Método não permitido");
  const id = context.params?.id || "";
  if (!UUID_RE.test(id)) return erro(404, "Contrato não encontrado");

  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const parte = body.parte;
  if (!PARTES.includes(parte)) return erro(400, "parte deve ser 'contratante' ou 'contratado'");

  // Só o Victor (painel autenticado) assina como CONTRATADA
  if (parte === "contratado" && !isAdmin(req)) return erro(401, "Não autorizado");

  const nome = String(body.nome || "").trim();
  const cpfCnpj = String(body.cpfCnpj || "").trim();
  const email = String(body.email || "").trim();
  const digitos = cpfCnpj.replace(/\D/g, "");
  if (nome.length < 3) return erro(400, "Informe o nome completo");
  if (digitos.length !== 11 && digitos.length !== 14) return erro(400, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido");
  if (!EMAIL_RE.test(email)) return erro(400, "Informe um e-mail válido");
  if (body.aceite !== true) return erro(400, "É preciso concordar com as cláusulas para assinar");

  const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "";
  const userAgent = req.headers.get("user-agent") || "";

  try {
    // Até 2 tentativas: se houver corrida de gravação (sha desatualizado),
    // relê e revalida — uma re-assinatura da mesma parte cai no 409 abaixo.
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const lido = await lerContrato(id);
      if (!lido) return erro(404, "Contrato não encontrado");
      const { contrato, sha } = lido;

      if (contrato.status !== "aguardando_assinaturas") {
        return erro(409, contrato.status === "assinado"
          ? "Este contrato já foi assinado pelas duas partes"
          : "Este contrato não está aberto para assinatura");
      }
      if (contrato.assinaturas[parte]) {
        return erro(409, "Esta parte já assinou o contrato. A assinatura só pode ser feita uma vez.");
      }

      const assinadoEm = new Date().toISOString();
      const protocolo = createHash("sha256")
        .update([contrato.id, parte, nome, cpfCnpj, email, assinadoEm, ip].join("|"), "utf8")
        .digest("hex");

      const assinatura = { nome, cpfCnpj, email, ip, userAgent, assinadoEm, protocolo };
      contrato.assinaturas[parte] = assinatura;
      if (contrato.assinaturas.contratante && contrato.assinaturas.contratado) {
        contrato.status = "assinado";
      }
      contrato.atualizadoEm = assinadoEm;

      try {
        await gravarContrato(id, contrato, sha, `assinatura ${parte} — contrato ${contrato.numero}`);
      } catch (e) {
        if (e instanceof ConflitoError) continue; // outra gravação entrou antes: relê e revalida
        throw e;
      }

      await notificarEmail(contrato, parte, assinatura).catch((e) =>
        console.error("Falha ao enviar e-mail (assinatura registrada mesmo assim):", e.message)
      );

      return json(200, { assinatura, status: contrato.status });
    }
    return erro(409, "Conflito de gravação. Tente novamente.");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
};

async function notificarEmail(contrato, parte, a) {
  const destino = process.env.EMAIL_ASSINATURA;
  if (!destino) return;
  const completo = contrato.status === "assinado";
  const quem = parte === "contratante" ? "CONTRATANTE (cliente)" : "CONTRATADA (Vértice)";
  const res = await fetch(`https://formsubmit.co/ajax/${destino}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: completo
        ? `✅ Contrato ${contrato.numero} COMPLETO — assinado pelas duas partes`
        : `✍️ Contrato ${contrato.numero} — assinado pelo ${quem}`,
      _template: "table",
      Contrato: `${contrato.numero} · ${contrato.contratante?.nomeExibicao || ""}`,
      Parte: quem,
      Nome: a.nome,
      "CPF/CNPJ": a.cpfCnpj,
      "E-mail": a.email,
      "Data e hora (UTC)": a.assinadoEm,
      "IP de origem": a.ip || "não disponível",
      Protocolo: a.protocolo,
      "User-Agent": a.userAgent,
      Status: completo ? "ASSINADO PELAS DUAS PARTES" : "Aguardando a outra parte"
    })
  });
  if (!res.ok) throw new Error(`FormSubmit HTTP ${res.status}`);
}
