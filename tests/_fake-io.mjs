// GitHub em memória para os testes do sistema de contratos (sem token, sem rede).
// Mesma regra da Contents API: sha velho ou ausente em arquivo existente = conflito.
import { ConflitoError } from "../vertice-labs/netlify/functions/lib/github.mjs";

export function fakeIo() {
  const arquivos = new Map();
  let n = 0;
  const io = {
    arquivos,
    enviados: [],
    lerJson: async (caminho) => {
      const a = arquivos.get(caminho);
      return a ? { dados: structuredClone(a.dados), sha: a.sha } : null;
    },
    gravarJson: async (caminho, dados, sha) => {
      const atual = arquivos.get(caminho);
      if ((atual && atual.sha !== sha) || (!atual && sha)) throw new ConflitoError();
      const novoSha = `sha${++n}`;
      arquivos.set(caminho, { dados: structuredClone(dados), sha: novoSha });
      return { content: { sha: novoSha } };
    },
    listarArquivos: async (pasta) => [...arquivos.keys()]
      .filter((k) => k.startsWith(pasta + "/") && k.endsWith(".json"))
      .map((k) => ({ name: k.slice(pasta.length + 1), type: "file" })),
    excluirJson: async (caminho, sha) => {
      const atual = arquivos.get(caminho);
      if (!atual || atual.sha !== sha) throw new ConflitoError();
      arquivos.delete(caminho);
    },
    enviarComAnexo: async (msg) => { io.enviados.push(msg); return true; },
    enviarEmail: async () => { throw new Error("FormSubmit bloqueia chamada de servidor"); }
  };
  io.lerContrato = async (id) => {
    const l = await io.lerJson(`contratos/${id}.json`);
    return l ? { contrato: l.dados, sha: l.sha } : null;
  };
  io.gravarContrato = (id, c, sha, msg) => io.gravarJson(`contratos/${id}.json`, c, sha, msg);
  io.excluirContrato = (id, sha, msg) => io.excluirJson(`contratos/${id}.json`, sha, msg);
  return io;
}

export const SENHA = "senha-de-teste";

export function req(url, { method = "GET", body, admin = false, ip = "203.0.113.9" } = {}) {
  const headers = { "content-type": "application/json", "user-agent": "teste/1.0" };
  if (admin) headers.authorization = `Bearer ${SENHA}`;
  const r = new Request(`http://x${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { req: r, ctx: { ip, params: {} } };
}

export async function corpo(res) {
  const status = res.status;
  if (status === 204) return { status, body: null };
  return { status, body: await res.json() };
}
