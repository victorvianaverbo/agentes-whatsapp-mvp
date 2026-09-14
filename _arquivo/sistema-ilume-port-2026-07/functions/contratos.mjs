import { randomUUID } from "node:crypto";
import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { gravarContrato, lerContrato, listarArquivos } from "./lib/github.mjs";

export const config = { path: "/api/contratos" };

export const TIPOS = ["pontual", "recorrente", "combo"];

// valorTotal é derivado dos sub-blocos financeiros (usado só na listagem/validação):
// pontual e combo → valor do setup · recorrente → valor mensal de referência.
export function normalizarFinanceiro(tipo, fin) {
  fin = fin || {};
  const valorSetup = Number(fin.setup?.valor) || 0;
  const valorMensal = Number(fin.recorrencia?.valorMensal) || 0;
  const valorTotal = tipo === "recorrente" ? valorMensal : valorSetup;
  return { ...fin, valorTotal };
}

export default async (req) => {
  if (!isAdmin(req)) return erro(401, "Não autorizado");

  try {
    if (req.method === "GET") return await listar();
    if (req.method === "POST") return await criar(req);
    return erro(405, "Método não permitido");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
};

async function listar() {
  const arquivos = await listarArquivos();
  const resumos = await Promise.all(
    arquivos.map(async (a) => {
      const id = a.name.replace(/\.json$/, "");
      const lido = await lerContrato(id);
      if (!lido) return null;
      const c = lido.contrato;
      return {
        id: c.id,
        numero: c.numero,
        tipo: c.tipo,
        status: c.status,
        cliente: c.contratante?.nomeExibicao || c.contratante?.razaoSocial || "—",
        valorTotal: c.financeiro?.valorTotal ?? 0,
        criadoEm: c.criadoEm,
        assinaturas: {
          contratante: !!c.assinaturas?.contratante,
          contratado: !!c.assinaturas?.contratado
        }
      };
    })
  );
  const lista = resumos.filter(Boolean);
  lista.sort((x, y) => (y.criadoEm || "").localeCompare(x.criadoEm || ""));
  return json(200, lista);
}

async function criar(req) {
  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");
  if (!TIPOS.includes(body.tipo)) return erro(400, "tipo deve ser 'pontual', 'recorrente' ou 'combo'");
  if (!body.contratante?.razaoSocial) return erro(400, "contratante.razaoSocial é obrigatório");
  if (!body.contratante?.cnpjCpf) return erro(400, "contratante.cnpjCpf é obrigatório");
  const financeiro = normalizarFinanceiro(body.tipo, body.financeiro);
  if (!(financeiro.valorTotal > 0)) return erro(400, "informe um valor (setup ou mensal) maior que zero");

  const agora = new Date().toISOString();
  const ano = agora.slice(0, 4);
  const id = randomUUID();

  let numero = typeof body.numero === "string" && body.numero.trim() ? body.numero.trim() : "";
  if (!numero) {
    const existentes = await listarArquivos();
    numero = `VL-${ano}-${String(existentes.length + 1).padStart(2, "0")}`;
  }

  const contrato = {
    id,
    numero,
    tipo: body.tipo,
    status: "rascunho",
    criadoEm: agora,
    atualizadoEm: agora,
    enviadoEm: null,
    contratante: sanitizarContratante(body.contratante),
    proposta: body.proposta || {},
    servico: body.servico || {},
    financeiro,
    assinaturas: { contratante: null, contratado: null }
  };

  await gravarContrato(id, contrato, null, `criar contrato ${numero}`);
  return json(201, contrato);
}

export function sanitizarContratante(c) {
  const s = (v) => (typeof v === "string" ? v.trim() : "");
  return {
    razaoSocial: s(c.razaoSocial),
    nomeExibicao: s(c.nomeExibicao) || s(c.razaoSocial),
    cnpjCpf: s(c.cnpjCpf),
    endereco: s(c.endereco),
    cidadeUf: s(c.cidadeUf),
    cep: s(c.cep),
    contatoNome: s(c.contatoNome),
    contatoTelefone: s(c.contatoTelefone),
    contatoEmail: s(c.contatoEmail)
  };
}
