// Persistência: repositório GitHub privado como "banco".
// Cada assinatura = assinaturas/{docId}.json, lida/gravada via Contents API.
// O `sha` do arquivo funciona como lock otimista: um PUT com sha desatualizado
// falha (409/422) e o chamador relê antes de tentar de novo.
//
// Mesmo contrato de uso de sistema/functions/lib/github.mjs, enxugado para o
// que as propostas estáticas precisam (ler e gravar um JSON por documento).

const API = "https://api.github.com";

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_DATA_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) {
    throw new Error("Configure GITHUB_TOKEN e GITHUB_DATA_REPO nas variáveis de ambiente.");
  }
  return { token, repo, branch };
}

function ghHeaders(token, comBody) {
  const h = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "vertice-contratos"
  };
  if (comBody) h["Content-Type"] = "application/json";
  return h;
}

export class ConflitoError extends Error {
  constructor() {
    super("Conflito de gravação (sha desatualizado)");
    this.name = "ConflitoError";
  }
}

export async function lerJson(caminhoArquivo) {
  const { token, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${repo}/contents/${caminhoArquivo}?ref=${branch}`, {
    headers: ghHeaders(token)
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const conteudo = Buffer.from(data.content, "base64").toString("utf8");
  return { dados: JSON.parse(conteudo), sha: data.sha };
}

export function gravarJson(caminhoArquivo, dados, sha, mensagem) {
  return gravarArquivo(caminhoArquivo, Buffer.from(JSON.stringify(dados, null, 2), "utf8"), sha, mensagem);
}

// Arquivo binário (o PDF da cópia assinada). Devolve { conteudo: Buffer, sha }.
// Acima de 1 MB a Contents API não traz o conteúdo: aí o blob é lido pelo sha.
export async function lerArquivo(caminhoArquivo) {
  const { token, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${repo}/contents/${caminhoArquivo}?ref=${branch}`, {
    headers: ghHeaders(token)
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let b64 = data.content;
  if ((!b64 || !b64.trim()) && data.size > 0) {
    const blob = await fetch(`${API}/repos/${repo}/git/blobs/${data.sha}`, { headers: ghHeaders(token) });
    if (!blob.ok) throw new Error(`GitHub blob ${blob.status}: ${await blob.text()}`);
    b64 = (await blob.json()).content;
  }
  return { conteudo: Buffer.from(b64 || "", "base64"), sha: data.sha };
}

export async function gravarArquivo(caminhoArquivo, conteudo, sha, mensagem) {
  const { token, repo, branch } = cfg();
  const body = {
    message: mensagem,
    branch,
    content: Buffer.from(conteudo).toString("base64")
  };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/repos/${repo}/contents/${caminhoArquivo}`, {
    method: "PUT",
    headers: ghHeaders(token, true),
    body: JSON.stringify(body)
  });
  if (res.status === 409 || res.status === 422) throw new ConflitoError();
  if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---------------- sistema de contratos (contratos/{uuid}.json) ---------------- */

// Lista os arquivos .json de uma pasta do repo (o filtro deixa de fora os PDFs
// das cópias assinadas, que moram na mesma pasta contratos/).
export async function listarArquivos(pasta = "contratos") {
  const { token, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${repo}/contents/${pasta}?ref=${branch}`, {
    headers: ghHeaders(token)
  });
  if (res.status === 404) return []; // pasta ainda não existe
  if (!res.ok) throw new Error(`GitHub LIST ${res.status}: ${await res.text()}`);
  const itens = await res.json();
  return itens.filter((i) => i.type === "file" && i.name.endsWith(".json"));
}

export async function excluirJson(caminhoArquivo, sha, mensagem) {
  const { token, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${repo}/contents/${caminhoArquivo}`, {
    method: "DELETE",
    headers: ghHeaders(token, true),
    body: JSON.stringify({ message: mensagem, sha, branch })
  });
  if (res.status === 409 || res.status === 422) throw new ConflitoError();
  if (!res.ok) throw new Error(`GitHub DELETE ${res.status}: ${await res.text()}`);
}

export function caminhoContrato(id) {
  return `contratos/${id}.json`;
}

export async function lerContrato(id) {
  const lido = await lerJson(caminhoContrato(id));
  return lido ? { contrato: lido.dados, sha: lido.sha } : null;
}

export function gravarContrato(id, contrato, sha, mensagem) {
  return gravarJson(caminhoContrato(id), contrato, sha, mensagem);
}

export function excluirContrato(id, sha, mensagem) {
  return excluirJson(caminhoContrato(id), sha, mensagem);
}
