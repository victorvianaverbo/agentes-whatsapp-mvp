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

export const config = { path: "/api/briefing" };

// Briefing novo = uma linha nova. Cliente fora da lista responde 404, o que
// impede usar a rota para escrever arquivo arbitrário no repo de dados.
const CLIENTES = {
  "lm-bids": { nome: "LM Bids Ltda", projeto: "LB-2026-08 · Landing page" }
};

const MAX_RESPOSTAS = 80;
const MAX_TEXTO = 6000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req, context) => {
  if (req.method !== "POST") return erro(405, "Método não permitido");

  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const clienteId = String(body.clienteId || "").trim();
  const cliente = Object.prototype.hasOwnProperty.call(CLIENTES, clienteId) ? CLIENTES[clienteId] : null;
  if (!cliente) return erro(404, "Briefing não encontrado");

  const nome = String(body.nome || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  if (nome.length < 3) return erro(400, "Informe seu nome");
  if (!EMAIL_RE.test(email)) return erro(400, "Informe um e-mail válido");

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
    contato: { nome, email },
    respostas,
    enviadoEm,
    ip: context?.ip || req.headers.get("x-nf-client-connection-ip") || "",
    userAgent: (req.headers.get("user-agent") || "").slice(0, 400)
  };

  const carimbo = enviadoEm.replace(/[:.]/g, "-");
  const caminho = `briefings/${clienteId}/${carimbo}.json`;

  const [arquivo, aviso] = await Promise.allSettled([
    gravarJson(caminho, registro, undefined, `briefing ${cliente.nome} · ${enviadoEm}`),
    notificarEmail(cliente, registro)
  ]);

  if (arquivo.status === "rejected") console.error("Falha ao gravar o briefing:", arquivo.reason?.message);
  if (aviso.status === "rejected") console.error("Falha ao avisar por e-mail:", aviso.reason?.message);

  // Só é erro de verdade se as duas pontas caírem: aí a resposta se perderia.
  if (arquivo.status === "rejected" && aviso.status === "rejected") {
    return erro(500, "Não foi possível enviar o briefing agora.");
  }

  return json(200, { ok: true, enviadoEm, respostas: respostas.length });
};

async function notificarEmail(cliente, r) {
  const destino = process.env.EMAIL_ASSINATURA || "vianavictorv@gmail.com";
  const campos = {
    _subject: `📋 Briefing de site · ${cliente.nome}`,
    _template: "table",
    Projeto: cliente.projeto,
    "Preenchido por": `${r.contato.nome} · ${r.contato.email}`,
    "Enviado em": r.enviadoEm
  };
  // Numera para o e-mail sair na mesma ordem do formulário e não colidir
  // quando duas perguntas de seções diferentes têm o mesmo enunciado.
  r.respostas.forEach((item, i) => {
    const rotulo = `${String(i + 1).padStart(2, "0")}. ${item.secao} · ${item.pergunta}`.slice(0, 240);
    campos[rotulo] = item.resposta;
  });

  const res = await fetch(`https://formsubmit.co/ajax/${destino}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(campos)
  });
  if (!res.ok) throw new Error(`FormSubmit HTTP ${res.status}`);
}
