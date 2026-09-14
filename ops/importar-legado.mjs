// Importa as propostas e contratos antigos (ops/legado.json) para o sistema de
// contratos: cria/atualiza contratos/{uuid}.json no repo de dados e o índice.
//
//   node ops/importar-legado.mjs                 # dry-run: só imprime
//   node ops/importar-legado.mjs --gravar        # grava tudo
//   node ops/importar-legado.mjs --gravar --so=lm-bids,souzatec
//   node ops/importar-legado.mjs --json          # dry-run com o JSON completo
//
// Env: GITHUB_TOKEN, GITHUB_DATA_REPO (victorvianaverbo/vertice-contratos-data), GITHUB_BRANCH.
// Mora na raiz do monorepo (fora de vertice-labs/, que é publicado inteiro no Netlify).
//
// Idempotente: o uuid vem do slug (v5). Rodar de novo recalcula tudo a partir do
// legado.json e das assinaturas, preservando o que o Victor marcou como pago e
// o status mudado no painel.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FN = path.join(RAIZ, "vertice-labs", "netlify", "functions");
const github = await import(pathToUrl(path.join(FN, "lib", "github.mjs")));
const indiceLib = await import(pathToUrl(path.join(FN, "lib", "indice.mjs")));
const schema = await import(pathToUrl(path.join(FN, "lib", "contrato-schema.mjs")));
const cobr = await import(pathToUrl(path.join(FN, "lib", "cobrancas.mjs")));
const legadoLib = await import(pathToUrl(path.join(FN, "lib", "legado.mjs")));

function pathToUrl(p) { return "file:///" + p.replace(/\\/g, "/"); }

const STATUS_FORCAVEIS = new Set(["proposta", "expirada", "substituido", "terceiro", "encerrado"]);

// Monta o registro de um item do legado.json. `assinaturasRegistro` é o conteúdo
// de assinaturas/<docId>.json (ou null); `existente` é o contrato já gravado (ou null).
export function montarRegistro(item, { assinaturasRegistro = null, existente = null, hoje = cobr.hojeBRT(), opcoes = {} } = {}) {
  const id = legadoLib.uuidLegado(item.slug);
  const agora = new Date().toISOString();
  const emissao = item.emissao || hoje;

  const fin = schema.sanitizarFinanceiro(item.financeiro || {}, { permitirVazio: true });
  if (fin.erro) throw new Error(`${item.slug}: ${fin.erro}`);
  const financeiro = fin.financeiro;
  if (item.financeiro && item.financeiro.cobrarCliente === false) financeiro.cobrarCliente = false;

  const proposta = schema.sanitizarProposta({
    titulo: item.titulo || "",
    lead: item.lead || "",
    blocos: item.blocos || [],
    naoIncluso: item.naoIncluso || ""
  });
  const contratante = schema.sanitizarContratante(item.contratante || {});
  const legado = schema.sanitizarLegado({
    slug: item.slug,
    docId: item.docId,
    fluxo: item.fluxo,
    url: item.url,
    arquivo: item.arquivo,
    formato: item.fluxo === "api-assinar-multiparte" ? "multiparte" : (item.fluxo === "api-assinar-unica" ? "unico" : null),
    importadoEm: existente?.legado?.importadoEm || agora,
    substituidoPor: item.substituidoPor ? legadoLib.uuidLegado(item.substituidoPor) : null,
    substitui: item.substitui ? legadoLib.uuidLegado(item.substitui) : null,
    alertas: item.alertas || []
  });

  const contrato = schema.montarContrato({
    id, numero: item.numero, agora: emissao + "T12:00:00.000Z",
    contratante, proposta, servico: schema.sanitizarServico(item.servico || {}), financeiro,
    clausulasEspeciais: [], legado, status: "proposta", origem: "legado",
    observacoes: item.observacoes || "", arquivos: item.arquivos || []
  });
  contrato.enviadoEm = item.fluxo === "sem-contrato" ? null : contrato.criadoEm;
  contrato.atualizadoEm = agora;

  // assinaturas: arquivo do /api/assinar (fonte de verdade) + carimbo fixo do HTML
  const html = item.assinaturasHtml || {};
  const contratadaHtml = html.contratada ? { ...html.contratada, arquivo: item.arquivo } : null;
  const mapa = legadoLib.mapearAssinaturas(assinaturasRegistro, item.docId || item.slug, { contratadaHtml });
  contrato.assinaturas = { contratante: mapa.contratante, contratada: mapa.contratada };
  if (Object.keys(mapa.outras).length) contrato.assinaturas.outras = mapa.outras;
  if (html.outras) {
    contrato.assinaturas.outras = contrato.assinaturas.outras || {};
    for (const [k, a] of Object.entries(html.outras)) {
      const { assinadoEm, precisao } = legadoLib.carimboParaIso(a.assinadoEm);
      contrato.assinaturas.outras[k] = { nome: a.nome, cpfCnpj: a.cpfCnpj || "", email: a.email || "", assinadoEm, precisao, protocolo: a.protocolo || null, origem: { tipo: "html-sem-protocolo", arquivo: item.arquivo, linha: a.linha || null } };
    }
  }

  // status: forçado no legado.json > mantido pelo painel > derivado das assinaturas
  let status;
  if (item.status && STATUS_FORCAVEIS.has(item.status)) status = item.status;
  else if (item.fluxo === "sem-contrato") status = "proposta";
  else status = mapa.status; // assinado | aguardando_assinaturas
  if (existente?.atualizadoPor === "painel" && existente.status && !opcoes.forcarStatus) {
    status = existente.status;
    contrato.atualizadoPor = "painel";
  }
  contrato.status = status;
  if (status === "assinado" && !contrato.assinaturas.contratante && !contrato.assinaturas.contratada) {
    contrato.legado.alertas.push("Marcado como assinado sem nenhuma assinatura registrada.");
  }

  // cobranças: base = assinatura do cliente (real) ou emissão (previsão)
  const assinadoReal = status === "assinado" && contrato.assinaturas.contratante;
  const base = assinadoReal ? (cobr.dataBRT(contrato.assinaturas.contratante.assinadoEm) || emissao) : emissao;
  const previsao = !assinadoReal;
  const novos = cobr.gerarCobrancas(contrato, { dataBase: base, hoje, previsao });
  const pagos = new Map(((existente && !opcoes.regerarCobrancas ? existente.pagamentos : []) || []).filter((p) => p.pago).map((p) => [p.id, p]));
  const datas = new Map(((existente && !opcoes.regerarCobrancas ? existente.pagamentos : []) || []).filter((p) => p.vencimento).map((p) => [p.id, p.vencimento]));
  contrato.pagamentos = novos.map((p) => {
    const a = pagos.get(p.id);
    const venc = p.vencimento || datas.get(p.id) || null;
    return a ? { ...p, vencimento: venc, pago: true, pagoEm: a.pagoEm, previsao: false } : { ...p, vencimento: venc };
  });
  cobr.completarMensalidades(contrato, hoje);

  if (existente?.observacoes && !item.observacoes) contrato.observacoes = existente.observacoes;
  if (existente?.copia) contrato.copia = existente.copia;
  return contrato;
}

export function validarLista(lista, pastasPropostas) {
  const erros = [];
  const numeros = new Set();
  const slugs = new Set();
  for (const it of lista) {
    if (!it.slug) erros.push("item sem slug");
    if (slugs.has(it.slug)) erros.push(`slug repetido: ${it.slug}`);
    slugs.add(it.slug);
    if (!/^[A-Z]{2,4}-\d{4}-\d{2}(-\d+)?$/.test(it.numero || "")) erros.push(`${it.slug}: número fora do padrão (${it.numero})`);
    if (numeros.has(it.numero)) erros.push(`${it.slug}: número repetido ${it.numero}`);
    numeros.add(it.numero);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(it.emissao || "")) erros.push(`${it.slug}: emissão inválida`);
    if (["api-assinar-multiparte", "api-assinar-unica"].includes(it.fluxo) && !it.docId) erros.push(`${it.slug}: fluxo ${it.fluxo} exige docId`);
    if (it.status && !STATUS_FORCAVEIS.has(it.status)) erros.push(`${it.slug}: status "${it.status}" não pode ser forçado`);
    if (it.substituidoPor && !lista.some((x) => x.slug === it.substituidoPor)) erros.push(`${it.slug}: substituidoPor aponta para slug inexistente`);
  }
  for (const pasta of pastasPropostas || []) {
    if (!slugs.has(pasta)) erros.push(`pasta propostas/${pasta} sem entrada no legado.json`);
  }
  return erros;
}

// Importa uma lista já validada. `io` = { lerJson, gravarJson, listarArquivos, lerContrato, gravarContrato }.
export async function importar(lista, io, { gravar = false, so = null, hoje = cobr.hojeBRT(), opcoes = {}, log = console.log } = {}) {
  const selecionados = so ? lista.filter((x) => so.includes(x.slug)) : lista;
  const resultados = [];
  for (const item of selecionados) {
    const registroAss = ["api-assinar-multiparte", "api-assinar-unica"].includes(item.fluxo) && item.docId
      ? (await io.lerJson(`assinaturas/${item.docId}.json`))?.dados || null
      : null;
    const existente = (await io.lerContrato(legadoLib.uuidLegado(item.slug)))?.contrato || null;
    const contrato = montarRegistro(item, { assinaturasRegistro: registroAss, existente, hoje, opcoes });
    resultados.push({ item, contrato, existente: !!existente });
  }

  if (gravar) {
    for (const r of resultados) {
      const lido = await io.lerContrato(r.contrato.id);
      await io.gravarContrato(r.contrato.id, r.contrato, lido?.sha || null, `importar legado ${r.contrato.numero} — ${r.contrato.contratante.nomeExibicao}`);
      log(`gravado ${r.contrato.numero} (${r.contrato.id})`);
    }
    // índice: ler uma vez, mesclar, gravar com retry
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const atual = await indiceLib.lerIndice(io);
      const ids = new Set(resultados.map((r) => r.contrato.id));
      const listaIdx = (atual?.lista || []).filter((c) => !ids.has(c.id)).concat(resultados.map((r) => indiceLib.resumo(r.contrato)));
      listaIdx.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
      try {
        await io.gravarJson(indiceLib.CAMINHO_INDICE, listaIdx, atual?.sha, `índice — importação de ${resultados.length} legados`);
        break;
      } catch (e) {
        if (!(e instanceof github.ConflitoError) || tentativa === 2) throw e;
      }
    }
  }
  return resultados;
}

function tabela(resultados) {
  const linhas = resultados.map((r) => {
    const c = r.contrato;
    const pend = (c.contratante.pendencias || []).join(",");
    const alertas = (c.legado.alertas || []).length;
    return [c.legado.slug, c.numero, c.status, c.financeiro.unico ? "u" : "", c.financeiro.valorMensal ? `m${c.financeiro.mensal.meses || "∞"}` : "", String(c.pagamentos.length), r.existente ? "atualiza" : "novo", pend, alertas ? `${alertas} alerta(s)` : ""];
  });
  const cab = ["slug", "número", "status", "un", "mensal", "cob", "gravação", "pendências", "alertas"];
  const larg = cab.map((h, i) => Math.max(h.length, ...linhas.map((l) => String(l[i]).length)));
  const fmt = (l) => l.map((v, i) => String(v).padEnd(larg[i])).join("  ");
  return [fmt(cab), ...linhas.map(fmt)].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(`--${n}`);
  const val = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
  const lista = JSON.parse(readFileSync(path.join(RAIZ, "ops", "legado.json"), "utf8"));
  const pastas = readdirSync(path.join(RAIZ, "vertice-labs", "propostas"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const erros = validarLista(lista, pastas);
  if (erros.length) { console.error("legado.json inválido:\n - " + erros.join("\n - ")); process.exit(1); }
  const so = val("so") ? val("so").split(",").map((s) => s.trim()).filter(Boolean) : null;
  const gravar = flag("gravar");
  const io = {
    lerJson: github.lerJson, gravarJson: github.gravarJson, listarArquivos: github.listarArquivos,
    lerContrato: github.lerContrato, gravarContrato: github.gravarContrato
  };
  const resultados = await importar(lista, io, { gravar, so, opcoes: { regerarCobrancas: flag("regerar-cobrancas"), forcarStatus: flag("forcar-status") } });
  if (flag("json")) console.log(JSON.stringify(resultados.map((r) => r.contrato), null, 2));
  console.log("\n" + tabela(resultados));
  console.log(`\n${resultados.length} registro(s) ${gravar ? "gravados" : "(dry-run, nada gravado; use --gravar)"}.`);
}
