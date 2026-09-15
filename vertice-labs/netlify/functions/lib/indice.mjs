// Índice de contratos: um único arquivo (config/indice.json) com o resumo de
// todos. Sem ele, listar exigia 1 chamada ao GitHub por contrato (N+1).
// Toda escrita de contrato atualiza o índice; se ele sumir ou ficar
// dessincronizado, é reconstruído a partir dos arquivos.
//
// `io` é injetável (lerJson, gravarJson, listarArquivos, lerContrato) para os
// testes rodarem com um GitHub em memória.

import { ConflitoError, gravarJson, lerContrato, lerJson, listarArquivos } from "./github.mjs";
import { resumoPagamentos } from "./cobrancas.mjs";

export const CAMINHO_INDICE = "config/indice.json";

// Contrato que está rendendo: assinado, ou cliente em operação sem documento assinado.
export const ATIVOS = new Set(["assinado", "em_operacao"]);

const ioPadrao = { lerJson, gravarJson, listarArquivos, lerContrato };

export function resumo(c) {
  const f = c.financeiro || {};
  const m = f.mensal;
  const pags = Array.isArray(c.pagamentos) ? c.pagamentos : [];
  const r = resumoPagamentos(pags);
  return {
    id: c.id,
    numero: c.numero,
    status: c.status,
    origem: c.origem || "sistema",
    cliente: c.contratante?.nomeExibicao || c.contratante?.razaoSocial || "—",
    valorTotal: Number(f.valorTotal) || 0,
    valorMensal: Number(f.valorMensal) || 0,
    valorUnico: Number(f.unico?.valor) || 0,
    mensalAtivo: !!(m && Number(m.valor) > 0 && !m.encerradoEm && ATIVOS.has(c.status)),
    // Para o painel saber o que de fato ainda rende: parceria sem cobrança ao
    // cliente e mensalidade de prazo já vencido não entram no recorrente.
    mensalMeses: m ? Number(m.meses) || 0 : 0,
    cobrarCliente: f.cobrarCliente !== false,
    participacao: f.participacao || null,
    criadoEm: c.criadoEm,
    enviadoEm: c.enviadoEm || null,
    assinaturas: {
      contratante: !!c.assinaturas?.contratante,
      contratada: !!c.assinaturas?.contratada
    },
    pagamentos: pags,
    aReceber: r.aReceber,
    atrasado: r.atrasado,
    proximoVencimento: r.proximoVencimento,
    legado: c.legado ? { slug: c.legado.slug, docId: c.legado.docId, url: c.legado.url, fluxo: c.legado.fluxo } : null
  };
}

function ordenar(lista) {
  return lista.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
}

export async function lerIndice(io = ioPadrao) {
  const lido = await io.lerJson(CAMINHO_INDICE);
  return lido ? { lista: Array.isArray(lido.dados) ? lido.dados : [], sha: lido.sha } : null;
}

export async function reconstruirIndice(io = ioPadrao) {
  const arquivos = await io.listarArquivos("contratos");
  const contratos = await Promise.all(
    arquivos.map(async (a) => {
      const lido = await io.lerContrato(a.name.replace(/\.json$/, ""));
      return lido ? resumo(lido.contrato) : null;
    })
  );
  const lista = ordenar(contratos.filter(Boolean));
  const atual = await lerIndice(io);
  await io.gravarJson(CAMINHO_INDICE, lista, atual?.sha, "reconstruir índice de contratos");
  return lista;
}

// Lista com verificação barata: índice + listagem do diretório, em paralelo.
// Se os ids não baterem, reconstrói.
export async function listarDoIndice(io = ioPadrao) {
  const [indice, arquivos] = await Promise.all([lerIndice(io), io.listarArquivos("contratos")]);
  const idsArquivos = new Set(arquivos.map((a) => a.name.replace(/\.json$/, "")));
  if (indice) {
    const idsIndice = new Set(indice.lista.map((c) => c.id));
    const igual = idsIndice.size === idsArquivos.size && [...idsArquivos].every((id) => idsIndice.has(id));
    if (igual) return ordenar(indice.lista);
  }
  return reconstruirIndice(io);
}

// Insere/atualiza (ou remove) um contrato no índice, com retry em caso de corrida.
export async function atualizarIndice(contrato, { remover = false } = {}, io = ioPadrao) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const atual = await lerIndice(io);
    if (!atual) {
      await reconstruirIndice(io);
      return;
    }
    const lista = atual.lista.filter((c) => c.id !== contrato.id);
    if (!remover) lista.push(resumo(contrato));
    try {
      await io.gravarJson(CAMINHO_INDICE, ordenar(lista), atual.sha, `índice — ${contrato.numero}`);
      return;
    } catch (e) {
      if (e instanceof ConflitoError) continue;
      throw e;
    }
  }
  // Não falha a operação principal: o índice se corrige na próxima listagem.
  console.error("Não foi possível atualizar o índice após 3 tentativas");
}

// Números já usados (para sugerir o próximo e recusar duplicado).
export async function numerosUsados(io = ioPadrao) {
  const lista = await listarDoIndice(io);
  return new Set(lista.map((c) => c.numero));
}
