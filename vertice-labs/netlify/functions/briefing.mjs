// Briefing de site preenchido pelo cliente (/lm-bids/briefing, ...).
//
// Mesmo desenho do assinar.mjs: allowlist de destinos, gravação num repo
// GitHub privado (cada envio vira um commit) e aviso por e-mail. A diferença
// é que aqui o e-mail vale tanto quanto o arquivo: se um dos dois canais
// entregar, o cliente vê sucesso e a resposta não se perde.
//
// O cliente pode reenviar quantas vezes quiser: cada envio é um arquivo novo,
// carimbado com a hora, então correção não apaga a versão anterior.

import { erro, json, lerBody } from "./lib/http.mjs";
import { gravarJson } from "./lib/github.mjs";
import { enviarEmail } from "./lib/email.mjs";

export const config = { path: "/api/briefing" };

// Briefing novo = uma linha nova. Cliente fora da lista responde 404, o que
// impede usar a rota para escrever arquivo arbitrário no repo de dados.
const CLIENTES = {
  "lm-bids": { nome: "LM Bids Ltda", projeto: "LB-2026-08 · Landing page" }
};

const MAX_RESPOSTAS = 80;
const MAX_TEXTO = 6000;

export default async (req, context) => {
  if (req.method !== "POST") return erro(405, "Método não permitido");

  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const clienteId = String(body.clienteId || "").trim();
  const cliente = Object.prototype.hasOwnProperty.call(CLIENTES, clienteId) ? CLIENTES[clienteId] : null;
  if (!cliente) return erro(404, "Briefing não encontrado");

  // Quem preenche já é conhecido pelo clienteId, então o formulário não pede
  // nome nem e-mail. O link é de uso único por cliente.
  if (!Array.isArray(body.respostas) || body.respostas.length === 0) {
    return erro(400, "Nenhuma resposta recebida");
  }
  if (body.respostas.length > MAX_RESPOSTAS) return erro(400, "Briefing acima do tamanho aceito");

  const respostas = [];
  for (const item of body.respostas) {
    if (!item || typeof item !== "object") continue;
    const resposta = String(item.resposta ?? "").trim();
    if (!resposta) continue; // pergunta pulada não vira linha
    respostas.push({
      secao: String(item.secao ?? "").trim().slice(0, 120),
      pergunta: String(item.pergunta ?? "").trim().slice(0, 300),
      resposta: resposta.slice(0, MAX_TEXTO)
    });
  }
  if (respostas.length === 0) return erro(400, "Nenhuma resposta preenchida");

  const enviadoEm = new Date().toISOString();
  const registro = {
    clienteId,
    cliente: cliente.nome,
    projeto: cliente.projeto,
    respostas,
    enviadoEm,
    ip: context?.ip || req.headers.get("x-nf-client-connection-ip") || "",
    userAgent: (req.headers.get("user-agent") || "").slice(0, 400)
  };

  const carimbo = enviadoEm.replace(/[:.]/g, "-");
  const caminho = `briefings/${clienteId}/${carimbo}.json`;
  const destino = process.env.EMAIL_ASSINATURA || "vianavictorv@gmail.com";
  const campos = montarEmail(cliente, registro);

  const [arquivo, aviso] = await Promise.allSettled([
    gravarJson(caminho, registro, undefined, `briefing ${cliente.nome} · ${enviadoEm}`),
    enviarEmail(destino, campos)
  ]);

  if (arquivo.status === "rejected") console.error("Falha ao gravar o briefing:", arquivo.reason?.message);
  if (aviso.status === "rejected") console.error("Falha ao avisar por e-mail:", aviso.reason?.message);

  // `salvo` e `avisado` saem na resposta de propósito: sem isso, um canal que
  // parou de funcionar fica invisível até alguém reclamar que não recebeu nada.
  // `email` só aparece quando o servidor não conseguiu avisar, e é o que a
  // página posta do navegador (ver lib/email.mjs para o porquê).
  return json(200, {
    ok: true,
    enviadoEm,
    respostas: respostas.length,
    salvo: arquivo.status === "fulfilled",
    avisado: aviso.status === "fulfilled",
    email: aviso.status === "rejected" ? { destino, campos } : undefined
  });
};

function montarEmail(cliente, r) {
  const campos = {
    _subject: `📋 Briefing de site · ${cliente.nome}`,
    _template: "table",
    Projeto: cliente.projeto,
    "Enviado em": r.enviadoEm
  };
  // Numera para o e-mail sair na mesma ordem do formulário e não colidir
  // quando duas perguntas de seções diferentes têm o mesmo enunciado.
  r.respostas.forEach((item, i) => {
    const rotulo = `${String(i + 1).padStart(2, "0")}. ${item.secao} · ${item.pergunta}`.slice(0, 240);
    campos[rotulo] = item.resposta;
  });
  return campos;
}
