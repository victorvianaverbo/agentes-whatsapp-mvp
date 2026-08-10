// Persistência: repositório GitHub privado como "banco".
// Cada contrato = contratos/{id}.json, lido/gravado via Contents API.
// O `sha` do arquivo funciona como lock otimista: um PUT com sha desatualizado
// falha (409/422) e o chamador relê antes de tentar de novo.

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

function caminho(id) {
  return `contratos/${id}.json`;
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

export async function gravarJson(caminhoArquivo, dados, sha, mensagem) {
  const { token, repo, branch } = cfg();
  const body = {
    message: mensagem,
    branch,
    content: Buffer.from(JSON.stringify(dados, null, 2), "utf8").toString("base64")
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

export async function lerContrato(id) {
  const lido = await lerJson(caminho(id));
  return lido ? { contrato: lido.dados, sha: lido.sha } : null;
}

export async function gravarContrato(id, contrato, sha, mensagem) {
  return gravarJson(caminho(id), contrato, sha, mensagem);
}

export async function listarArquivos() {
  const { token, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${repo}/contents/contratos?ref=${branch}`, {
    headers: ghHeaders(token)
  });
  if (res.status === 404) return []; // pasta ainda não existe
  if (!res.ok) throw new Error(`GitHub LIST ${res.status}: ${await res.text()}`);
  const itens = await res.json();
  return itens.filter((i) => i.type === "file" && i.name.endsWith(".json"));
}

export async function excluirContrato(id, sha, mensagem) {
  const { token, repo, branch } = cfg();
  const res = await fetch(`${API}/repos/${repo}/contents/${caminho(id)}`, {
    method: "DELETE",
    headers: ghHeaders(token, true),
    body: JSON.stringify({ message: mensagem, sha, branch })
  });
  if (!res.ok) throw new Error(`GitHub DELETE ${res.status}: ${await res.text()}`);
}
