// GET  /api/contratos  → lista (resumo do índice)      [admin]
// POST /api/contratos  → cria um contrato em rascunho  [admin]

import { randomUUID } from "node:crypto";
import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { gravarContrato, lerContrato, lerJson, gravarJson, listarArquivos } from "./lib/github.mjs";
import { atualizarIndice, listarDoIndice, numerosUsados } from "./lib/indice.mjs";
import {
  NUMERO_RE, STATUS_LEGADO, montarContrato, montarNumero, sanitizarContratante, sanitizarEspeciais,
  sanitizarFinanceiro, sanitizarLegado, sanitizarProposta, sanitizarServico, sugerirSigla, validarDocumentoDigitos
} from "./lib/contrato-schema.mjs";

export const config = { path: "/api/contratos" };

const ioPadrao = { lerJson, gravarJson, listarArquivos, lerContrato, gravarContrato };

export default (req, context) => tratar(req, context);

export async function tratar(req, context, io = ioPadrao) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  try {
    if (req.method === "GET") return json(200, await listarDoIndice(io));
    if (req.method === "POST") return await criar(req, io);
    return erro(405, "Método não permitido");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
}

async function criar(req, io) {
  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const contratante = sanitizarContratante(body.contratante);
  if (!contratante.razaoSocial) return erro(400, "contratante.razaoSocial é obrigatório");
  if (!validarDocumentoDigitos(contratante.cnpjCpf)) return erro(400, "contratante.cnpjCpf precisa ser um CPF ou CNPJ");

  const legado = sanitizarLegado(body.legado);
  const fin = sanitizarFinanceiro(body.financeiro, { permitirVazio: !!legado });
  if (fin.erro) return erro(400, fin.erro);

  const agora = new Date().toISOString();
  const usados = await numerosUsados(io);

  let numero = String(body.numero || "").trim().toUpperCase();
  if (numero) {
    if (!NUMERO_RE.test(numero)) return erro(400, "Número fora do padrão XX-AAAA-MM (ex.: AN-2026-09)");
    if (usados.has(numero)) return erro(409, `O número ${numero} já existe. Escolha outro ou deixe em branco.`, { codigo: "numero_duplicado" });
  } else {
    const base = montarNumero(body.sigla || sugerirSigla(contratante.nomeExibicao), agora);
    numero = base;
    for (let i = 2; usados.has(numero) && i < 50; i++) numero = `${base}-${i}`;
  }

  let status = "rascunho";
  if (legado) {
    const permitidos = [...STATUS_LEGADO, "aguardando_assinaturas", "assinado"];
    status = permitidos.includes(body.status) ? body.status : "proposta";
  }

  const contrato = montarContrato({
    id: randomUUID(),
    numero,
    agora,
    contratante,
    proposta: sanitizarProposta(body.proposta),
    servico: sanitizarServico(body.servico),
    financeiro: fin.financeiro,
    clausulasEspeciais: sanitizarEspeciais(body.clausulasEspeciais),
    legado,
    status,
    origem: legado ? "legado" : "sistema",
    observacoes: body.observacoes
  });

  await io.gravarContrato(contrato.id, contrato, null, `criar contrato ${numero}`);
  await atualizarIndice(contrato, {}, io);
  return json(201, contrato);
}
