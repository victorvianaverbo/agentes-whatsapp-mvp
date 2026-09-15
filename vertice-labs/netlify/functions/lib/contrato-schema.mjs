// Forma do contrato da Vértice e saneamento do que chega do painel.
// Módulo puro (sem I/O). O painel manda JSON livre; tudo que vai para o repo
// de dados passa por aqui, campo a campo (whitelist), como no sistema da Ilume.
//
// Diferenças para a Ilume: não há `tipo` pontual/recorrente. O financeiro tem
// duas pernas independentes, `unico` (pagamento único, com parcelas) e
// `mensal` (mensalidade, com ou sem prazo), mais cortesias e verba de mídia.
// Um contrato pode ter só uma perna ou as duas (site + gestão de tráfego).

export const STATUS_SISTEMA = ["rascunho", "aguardando_assinaturas", "assinado"];
// `em_operacao`: cliente que paga e é atendido sem contrato assinado no sistema
// (acordo anterior ao painel). Conta como receita real, não como previsão.
export const STATUS_LEGADO = ["proposta", "em_operacao", "expirada", "substituido", "terceiro", "encerrado"];
export const STATUS = [...STATUS_SISTEMA, ...STATUS_LEGADO];
export const PARTES = ["contratante", "contratada"];

export const NUMERO_RE = /^[A-Z]{2,4}-\d{4}-\d{2}(-\d+)?$/;
const ETIQUETAS = ["", "incluso", "mensal", "unico", "cortesia"];
// "data": parcela com dia marcado no calendário (bônus de fim de ano, parcela negociada).
const QUANDO = ["assinatura", "dias", "entrega", "data", "definir"];
const INICIO_MENSAL = ["assinatura", "operacao"];
const MAX_TEXTO = 4000;

const s = (v, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const n0 = (v) => (Number(v) > 0 ? Math.round(Number(v) * 100) / 100 : 0);
const inteiro = (v, min, max, padrao) => {
  const x = Math.floor(Number(v));
  if (!Number.isFinite(x)) return padrao;
  return Math.min(max, Math.max(min, x));
};
const linhas = (v) => (Array.isArray(v) ? v : String(v || "").split("\n"))
  .map((t) => s(t, 600)).filter(Boolean);

/* ------------------------------ numeração ------------------------------ */

// "Anciã" → "AN"; "LM Bids" → "LB"; "Haus Decor BH" → "HD"; "Souza Tec" → "ST".
export function sugerirSigla(nome) {
  const limpo = String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ").trim().toUpperCase();
  const palavras = limpo.split(/\s+/).filter((p) => p && !["DE", "DA", "DO", "DAS", "DOS", "E", "LTDA", "ME", "EPP", "SA"].includes(p));
  if (!palavras.length) return "VL";
  if (palavras.length >= 2) return (palavras[0][0] + palavras[1][0]).replace(/[^A-Z0-9]/g, "") || "VL";
  return palavras[0].slice(0, 2).padEnd(2, "X");
}

export function montarNumero(sigla, dataISO) {
  const d = String(dataISO || new Date().toISOString()).slice(0, 7); // AAAA-MM
  const sg = String(sigla || "VL").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "VL";
  return `${sg}-${d.slice(0, 4)}-${d.slice(5, 7)}`;
}

/* ------------------------------ saneamento ------------------------------ */

export function sanitizarContratante(c = {}) {
  return {
    razaoSocial: s(c.razaoSocial),
    nomeExibicao: s(c.nomeExibicao) || s(c.razaoSocial),
    cnpjCpf: s(c.cnpjCpf, 30),
    endereco: s(c.endereco),
    cidadeUf: s(c.cidadeUf, 80),
    cep: s(c.cep, 12),
    contatoNome: s(c.contatoNome),
    contatoTelefone: s(c.contatoTelefone, 40),
    contatoEmail: s(c.contatoEmail, 160),
    representante: s(c.representante),
    representanteCpf: s(c.representanteCpf, 30),
    pendencias: linhas(c.pendencias).slice(0, 20)
  };
}

export function sanitizarProposta(p = {}) {
  const blocos = (Array.isArray(p.blocos) ? p.blocos : []).map((b) => ({
    titulo: s(b?.titulo, 200),
    itens: linhas(b?.itens).slice(0, 30),
    objeto: !!b?.objeto,
    etiqueta: ETIQUETAS.includes(b?.etiqueta) ? b.etiqueta : ""
  })).filter((b) => b.titulo || b.itens.length).slice(0, 20);
  const passos = (Array.isArray(p.passos) ? p.passos : []).map((x) => ({
    titulo: s(x?.titulo, 80), texto: s(x?.texto, 300)
  })).filter((x) => x.titulo).slice(0, 8);
  return {
    titulo: s(p.titulo, 300),
    lead: s(p.lead, 1200),
    contexto: linhas(p.contexto).map((t) => t.slice(0, 1500)).slice(0, 6),
    validaDias: inteiro(p.validaDias, 1, 90, 7),
    blocos,
    naoIncluso: s(p.naoIncluso, 1500),
    passos
  };
}

export function sanitizarServico(sv = {}) {
  const site = sv.site && typeof sv.site === "object" ? {
    tipo: sv.site.tipo === "landing" ? "landing" : "site",
    paginas: inteiro(sv.site.paginas, 1, 60, 1),
    prazoDiasUteis: inteiro(sv.site.prazoDiasUteis, 0, 120, 10),
    revisoes: inteiro(sv.site.revisoes, 0, 10, 2),
    hospedagemInclusa: sv.site.hospedagemInclusa !== false
  } : null;
  const trafego = sv.trafego && typeof sv.trafego === "object" ? {
    plataformas: s(sv.trafego.plataformas, 120) || "Meta Ads e Google Ads",
    relatorioMensal: sv.trafego.relatorioMensal !== false
  } : null;
  const criativos = sv.criativos && typeof sv.criativos === "object" ? {
    qtdMes: inteiro(sv.criativos.qtdMes, 1, 200, 8)
  } : null;
  return { site, trafego, criativos, outros: s(sv.outros, 1500) };
}

// Devolve { financeiro } ou { erro }.
export function sanitizarFinanceiro(f = {}, { permitirVazio = false } = {}) {
  let unico = null;
  if (f.unico && typeof f.unico === "object" && Number(f.unico.valor) > 0) {
    const parcelasEntrada = Array.isArray(f.unico.parcelas) && f.unico.parcelas.length
      ? f.unico.parcelas
      : [{ pct: 100, gatilho: "na assinatura do contrato", quando: "assinatura" }];
    const parcelas = parcelasEntrada.map((p) => ({
      pct: Math.round(Number(p?.pct) || 0),
      valor: n0(p?.valor) || null, // valor absoluto vence o percentual (ex.: 4.000 + 2.000)
      gatilho: s(p?.gatilho, 200),
      quando: QUANDO.includes(p?.quando) ? p.quando : "definir",
      dias: inteiro(p?.dias, 0, 365, 0),
      em: /^\d{4}-\d{2}-\d{2}$/.test(String(p?.em || "")) ? p.em : null
    })).filter((p) => p.pct > 0 || p.valor > 0).slice(0, 12);
    // percentual derivado do valor absoluto, para a soma fechar em 100
    const totalUnico = n0(f.unico.valor);
    for (const p of parcelas) if (p.valor && !p.pct) p.pct = Math.round((p.valor / totalUnico) * 100);
    const soma = parcelas.reduce((t, p) => t + p.pct, 0);
    const somaValores = parcelas.reduce((t, p) => t + (p.valor || 0), 0);
    const porValor = parcelas.every((p) => p.valor) && Math.abs(somaValores - totalUnico) < 0.01;
    if (soma !== 100 && !porValor) return { erro: `As parcelas do pagamento único somam ${soma}%; precisam somar 100%.` };
    unico = {
      valor: n0(f.unico.valor),
      valorTabela: n0(f.unico.valorTabela) || null,
      descricao: s(f.unico.descricao, 120),
      parcelas
    };
  }

  let mensal = null;
  if (f.mensal && typeof f.mensal === "object" && Number(f.mensal.valor) > 0) {
    const escalonamento = (Array.isArray(f.mensal.escalonamento) ? f.mensal.escalonamento : []).map((e) => ({
      aPartirDoMes: inteiro(e?.aPartirDoMes, 2, 120, 2), valor: n0(e?.valor)
    })).filter((e) => e.valor > 0).slice(0, 6);
    mensal = {
      valor: n0(f.mensal.valor),
      valorTabela: n0(f.mensal.valorTabela) || null,
      descricao: s(f.mensal.descricao, 120),
      meses: inteiro(f.mensal.meses, 0, 120, 0),
      inicio: INICIO_MENSAL.includes(f.mensal.inicio) ? f.mensal.inicio : "assinatura",
      inicioEm: /^\d{4}-\d{2}-\d{2}$/.test(String(f.mensal.inicioEm || "")) ? f.mensal.inicioEm : null,
      diaVencimento: f.mensal.diaVencimento ? inteiro(f.mensal.diaVencimento, 1, 28, null) : null,
      avisoDias: inteiro(f.mensal.avisoDias, 0, 90, 30),
      encerradoEm: /^\d{4}-\d{2}-\d{2}$/.test(String(f.mensal.encerradoEm || "")) ? f.mensal.encerradoEm : null,
      escalonamento
    };
  }

  const cortesias = (Array.isArray(f.cortesias) ? f.cortesias : []).map((c) => ({
    descricao: s(c?.descricao, 200), valorTabela: n0(c?.valorTabela) || null
  })).filter((c) => c.descricao).slice(0, 10);

  const verbaMidia = f.verbaMidia && typeof f.verbaMidia === "object" && Number(f.verbaMidia.valorMes) > 0 ? {
    valorMes: n0(f.verbaMidia.valorMes),
    destino: s(f.verbaMidia.destino, 120) || "as plataformas de anúncio"
  } : null;

  if (!unico && !mensal && !cortesias.length && !permitirVazio) {
    return { erro: "Informe um valor único, um valor mensal ou ao menos uma cortesia." };
  }

  // Contrato em sociedade: `pct` é a fatia da casa; o resto fica com o sócio.
  // Sem participação (ou 100%), o contrato é todo nosso e o campo some.
  const p = f.participacao;
  const pct = p && typeof p === "object" ? Number(p.pct) : NaN;
  const participacao = pct >= 0 && pct < 100 ? { pct: Math.round(pct * 100) / 100, socio: s(p.socio, 80) } : null;

  const financeiro = { unico, mensal, cortesias, verbaMidia, participacao, cobrarCliente: f.cobrarCliente !== false };
  Object.assign(financeiro, derivarTotais(financeiro));
  return { financeiro };
}

export function derivarTotais(financeiro) {
  const unico = Number(financeiro?.unico?.valor) || 0;
  const mensal = Number(financeiro?.mensal?.valor) || 0;
  const meses = Number(financeiro?.mensal?.meses) || 0;
  return {
    valorTotal: Math.round((unico + (meses > 0 ? mensal * meses : 0)) * 100) / 100,
    valorMensal: mensal
  };
}

export function sanitizarEspeciais(lista) {
  return linhas(lista).slice(0, 30);
}

export function sanitizarLegado(l) {
  if (!l || typeof l !== "object") return null;
  return {
    slug: s(l.slug, 80),
    docId: s(l.docId, 80) || null,
    fluxo: s(l.fluxo, 40),
    url: s(l.url, 300) || null,
    arquivo: s(l.arquivo, 300) || null,
    formato: s(l.formato, 20) || null,
    importadoEm: s(l.importadoEm, 40) || null,
    sincronizadoEm: s(l.sincronizadoEm, 40) || null,
    substituidoPor: s(l.substituidoPor, 80) || null,
    substitui: s(l.substitui, 80) || null,
    alertas: linhas(l.alertas).slice(0, 10)
  };
}

// Registro novo, a partir do que o painel mandou. `numero` já validado.
export function montarContrato({ id, numero, agora, contratante, proposta, servico, financeiro, clausulasEspeciais, legado = null, status = "rascunho", origem = "sistema", observacoes = "", arquivos = [] }) {
  return {
    id,
    numero,
    status,
    origem,
    criadoEm: agora,
    atualizadoEm: agora,
    enviadoEm: null,
    contratante,
    proposta,
    servico,
    financeiro,
    clausulasEspeciais,
    assinaturas: { contratante: null, contratada: null },
    pagamentos: [],
    copia: null,
    legado,
    arquivos: Array.isArray(arquivos) ? arquivos.slice(0, 20) : [],
    observacoes: s(observacoes, MAX_TEXTO)
  };
}

export function validarDocumentoDigitos(v) {
  const d = String(v || "").replace(/\D/g, "");
  return d.length === 11 || d.length === 14;
}

export function ehLegado(contrato) {
  return !!(contrato && contrato.legado);
}

// Um contrato pode ser editado enquanto nenhuma parte assinou e ele não é legado.
export function editavel(contrato) {
  if (ehLegado(contrato)) return false;
  const a = contrato.assinaturas || {};
  const semAssinatura = !a.contratante && !a.contratada;
  return contrato.status === "rascunho" || (contrato.status === "aguardando_assinaturas" && semAssinatura);
}
