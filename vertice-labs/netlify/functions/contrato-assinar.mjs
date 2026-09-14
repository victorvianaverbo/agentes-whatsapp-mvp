// POST /api/contratos/:id/assinar  { parte, nome, cpfCnpj, email, aceite: true }
//   contratante → público (quem tem o link)
//   contratada  → só o painel (admin) e só com o CNPJ da Vértice
// Cada parte assina uma vez (409 na segunda). IP, hora e protocolo são do servidor.
// Quando as duas assinam, nasce a agenda de cobranças e sai o aviso por e-mail.

import { createHash } from "node:crypto";
import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarContrato, lerContrato, lerJson, gravarJson, listarArquivos } from "./lib/github.mjs";
import { atualizarIndice } from "./lib/indice.mjs";
import { dataBRT, gerarCobrancas } from "./lib/cobrancas.mjs";
import { notificarAssinatura } from "./lib/notificar.mjs";
import { enviarComAnexo } from "./lib/hostinger-mail.mjs";
import { VERTICE } from "./lib/vertice.mjs";
import { PARTES, ehLegado } from "./lib/contrato-schema.mjs";
import { validarDocumento, normalizarDocumento } from "./assinar.mjs";

export const config = { path: "/api/contratos/:id/assinar" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ioPadrao = { lerJson, gravarJson, listarArquivos, lerContrato, gravarContrato, enviarComAnexo };

export default (req, context) => tratar(req, context);

export async function tratar(req, context, io = ioPadrao) {
  if (req.method !== "POST") return erro(405, "Método não permitido");
  const id = context?.params?.id || "";
  if (!UUID_RE.test(id)) return erro(404, "Contrato não encontrado");

  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const parte = String(body.parte || "").trim();
  if (!PARTES.includes(parte)) return erro(400, "parte deve ser 'contratante' ou 'contratada'");
  if (parte === "contratada" && !isAdmin(req)) return erro(401, "Não autorizado");

  const nome = String(body.nome || "").trim().replace(/\s+/g, " ");
  const cpfCnpj = String(body.cpfCnpj || "").trim();
  const email = String(body.email || "").trim();
  if (nome.length < 3 || nome.length > 120) return erro(400, "Informe o nome completo");
  if (!validarDocumento(cpfCnpj)) return erro(400, "Informe um CPF ou CNPJ válido");
  if (!EMAIL_RE.test(email) || email.length > 160) return erro(400, "Informe um e-mail válido");
  if (body.aceite !== true) return erro(400, "É preciso concordar com as cláusulas para assinar");
  if (parte === "contratada" && normalizarDocumento(cpfCnpj) !== VERTICE.cnpjDigitos) {
    return erro(400, "A CONTRATADA assina com o CNPJ da Vértice Labs.", { codigo: "documento_nao_confere" });
  }

  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "";
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 400);

  try {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const lido = await io.lerContrato(id);
      if (!lido) return erro(404, "Contrato não encontrado");
      const { contrato, sha } = lido;

      if (ehLegado(contrato)) return erro(409, "Contrato legado assina pela página antiga, não por aqui.", { codigo: "legado" });
      if (contrato.status !== "aguardando_assinaturas") {
        return erro(409, contrato.status === "assinado"
          ? "Este contrato já foi assinado pelas duas partes"
          : "Este contrato não está aberto para assinatura", { codigo: contrato.status === "assinado" ? "contrato_concluido" : "nao_aberto" });
      }
      if (contrato.assinaturas[parte]) {
        return erro(409, "Esta parte já assinou o contrato. A assinatura só pode ser feita uma vez.", { codigo: "parte_ja_assinou" });
      }

      const assinadoEm = new Date().toISOString();
      const protocolo = createHash("sha256")
        .update([contrato.id, parte, nome, cpfCnpj, email, assinadoEm, ip].join("|"), "utf8")
        .digest("hex");
      const assinatura = { nome, cpfCnpj, email, ip, userAgent, assinadoEm, protocolo };
      contrato.assinaturas[parte] = assinatura;

      if (contrato.assinaturas.contratante && contrato.assinaturas.contratada) {
        contrato.status = "assinado";
        if (!Array.isArray(contrato.pagamentos) || !contrato.pagamentos.length) {
          const base = dataBRT(contrato.assinaturas.contratante.assinadoEm);
          contrato.pagamentos = gerarCobrancas(contrato, { dataBase: base });
        }
      }
      contrato.atualizadoEm = assinadoEm;

      try {
        await io.gravarContrato(id, contrato, sha, `assinatura ${parte} — contrato ${contrato.numero}`);
      } catch (e) {
        if (e instanceof ConflitoError) continue; // outra gravação entrou antes: relê e revalida
        throw e;
      }

      await atualizarIndice(contrato, {}, io);
      const avisado = await notificarAssinatura(contrato, parte, assinatura, io).then(
        () => true,
        (e) => { console.error("Falha ao enviar e-mail (assinatura registrada mesmo assim):", e.message); return false; }
      );

      const { userAgent: _ua, ...comprovante } = assinatura;
      return json(200, { parte, status: contrato.status, assinatura: comprovante, avisado, pagamentos: contrato.pagamentos });
    }
    return erro(409, "Conflito de gravação. Tente novamente.", { codigo: "conflito_gravacao" });
  } catch (e) {
    console.error(e);
    return erro(500, "Não foi possível registrar a assinatura agora.");
  }
}
