// GET/PUT /api/modelos  [admin]  — presets de serviço que preenchem o formulário
// de novo contrato. Guardados em config/modelos.json no repo de dados; enquanto o
// arquivo não existe, vale o catálogo abaixo. ATENÇÃO: depois do primeiro save o
// catálogo do código vira letra morta (armadilha conhecida da Ilume): mudar um
// modelo é pela tela Modelos ou por PUT preservando o sha.

import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarJson, lerJson } from "./lib/github.mjs";
import { sanitizarFinanceiro, sanitizarProposta, sanitizarServico } from "./lib/contrato-schema.mjs";

export const config = { path: "/api/modelos" };

const CAMINHO = "config/modelos.json";
const MAX_MODELOS = 30;
const ioPadrao = { lerJson, gravarJson };

const RELATORIO = { titulo: "Medição e relatório", etiqueta: "incluso", objeto: false, itens: [
  "Tag do Google e pixel da Meta instalados, com o contato contado como conversão",
  "Planilha de contatos em tempo real com página, campanha e origem de cada um",
  "Relatório mensal curto: investido, contatos gerados e custo por contato"
] };

export const CATALOGO_DEFAULT = [
  {
    id: "gestao-trafego",
    nome: "Gestão de tráfego mensal",
    titulo: "Cliente novo chegando todo dia, sem depender de indicação.",
    lead: "Anúncio na frente de quem já procura o que você vende, página certa para cada busca e o contato caindo no seu WhatsApp com a campanha que trouxe ele.",
    blocos: [
      { titulo: "Gestão de tráfego pago", etiqueta: "mensal", objeto: true, itens: [
        "Campanhas de pesquisa no Google e anúncios na Meta, separadas por serviço",
        "Palavras negativas e ajuste de público para cortar curioso",
        "Otimização semanal de termo, anúncio, lance e verba",
        "Verba de mídia é sua e vai direto para as plataformas, sem margem da Vértice"
      ] },
      RELATORIO
    ],
    naoIncluso: "Verba de mídia (paga direto às plataformas), fotografia, produção de vídeo, gestão das redes sociais e assinaturas de ferramentas de terceiros.",
    servico: { trafego: { plataformas: "Meta Ads e Google Ads", relatorioMensal: true } },
    financeiro: { mensal: { valor: 1500, meses: 0, inicio: "assinatura", descricao: "Gestão de tráfego" }, verbaMidia: { valorMes: 1500, destino: "Meta e Google" } }
  },
  {
    id: "landing-page",
    nome: "Landing page",
    titulo: "Uma página feita para transformar quem chega em contato no WhatsApp.",
    lead: "Copy de conversão, design leve e um único objetivo: o clique no botão. Em código próprio, sem WordPress e sem mensalidade.",
    blocos: [
      { titulo: "Pesquisa e copy", etiqueta: "incluso", objeto: false, itens: ["Levantamento do público e da oferta", "Headline, blocos de texto persuasivo e chamadas para ação"] },
      { titulo: "Landing page", etiqueta: "unico", objeto: true, itens: ["Página responsiva, rápida no celular, em HTML puro", "Botão de WhatsApp e/ou formulário de captura", "Até 2 rodadas de ajuste após a primeira entrega", "Hospedagem por conta da Vértice, arquivos são seus"] }
    ],
    naoIncluso: "Verba de mídia, gestão de tráfego, fotografia e produção de vídeo.",
    servico: { site: { tipo: "landing", paginas: 1, prazoDiasUteis: 7, revisoes: 2, hospedagemInclusa: true } },
    financeiro: { unico: { valor: 1500, descricao: "Landing page", parcelas: [{ pct: 100, gatilho: "no fechamento do contrato", quando: "assinatura" }] } }
  },
  {
    id: "site-completo",
    nome: "Site completo",
    titulo: "Cada serviço na sua página. O Google trazendo o cliente certo.",
    lead: "Um site em código próprio, uma página por categoria de serviço, com copy pensada para quem busca e o contato chegando no WhatsApp certo.",
    blocos: [
      { titulo: "Estrutura e copy", etiqueta: "incluso", objeto: false, itens: ["Diagnóstico das buscas no Google por serviço", "Lista de páginas definida junto com você", "Copy de conversão para cada público"] },
      { titulo: "Site completo", etiqueta: "unico", objeto: true, itens: ["Home e uma página por categoria de serviço", "Identidade da sua marca, leve no celular, sem WordPress", "Botão de WhatsApp em cada página", "Sem mensalidade: hospedagem por conta da Vértice e arquivos seus"] }
    ],
    naoIncluso: "Verba de mídia, gestão de tráfego, migração de blog ou conteúdo antigo, loja virtual e fotografia.",
    servico: { site: { tipo: "site", paginas: 6, prazoDiasUteis: 15, revisoes: 2, hospedagemInclusa: true } },
    financeiro: { unico: { valor: 2750, descricao: "Site completo", parcelas: [{ pct: 50, gatilho: "no fechamento do contrato", quando: "assinatura" }, { pct: 50, gatilho: "na entrega do site", quando: "entrega" }] } }
  },
  {
    id: "combo-site-trafego",
    nome: "Site + gestão de tráfego",
    titulo: "Cada serviço na sua página. O Google trazendo empresa, não curioso.",
    lead: "Site em código próprio com uma página por categoria de serviço e cada campanha ligada na página certa. O contato chega no WhatsApp e fica registrado com a campanha que trouxe ele.",
    blocos: [
      { titulo: "Site completo, uma página por categoria", etiqueta: "unico", objeto: true, itens: ["Home e uma página por categoria de serviço", "Copy pensada para cada público", "Identidade da sua marca, leve no celular", "Sem mensalidade e os arquivos são seus", "No ar em 7 a 10 dias úteis depois da prévia aprovada"] },
      { titulo: "Gestão de Google Ads", etiqueta: "mensal", objeto: true, itens: ["Uma campanha por página", "Palavras negativas desde o primeiro dia", "Otimização semanal de termo, anúncio, lance e verba", "Verba de mídia é sua e vai direto para o Google"] },
      RELATORIO
    ],
    naoIncluso: "Verba de mídia, Meta Ads, loja virtual, migração de conteúdo antigo e fotografia.",
    servico: { site: { tipo: "site", paginas: 6, prazoDiasUteis: 10, revisoes: 2, hospedagemInclusa: true }, trafego: { plataformas: "Google Ads", relatorioMensal: true } },
    financeiro: {
      unico: { valor: 1500, valorTabela: 2750, descricao: "Site completo", parcelas: [{ pct: 100, gatilho: "na aprovação da prévia do site", quando: "definir" }] },
      mensal: { valor: 1500, meses: 0, inicio: "operacao", descricao: "Gestão de Google Ads" },
      verbaMidia: { valorMes: 3000, destino: "Google" }
    }
  },
  {
    id: "site-cortesia-trafego",
    nome: "Tráfego + site de cortesia",
    titulo: "Gente nova chegando todo dia, com o site de graça.",
    lead: "Gestão de tráfego mensal e um site novo de cortesia, feito para receber anúncio: quem busca cai na página certa e termina no seu WhatsApp.",
    blocos: [
      { titulo: "Site novo", etiqueta: "cortesia", objeto: true, itens: ["Home e páginas por serviço, com botão de WhatsApp", "Feito para receber anúncio", "Hospedagem por conta da Vértice enquanto a parceria durar"] },
      { titulo: "Gestão de tráfego pago", etiqueta: "mensal", objeto: true, itens: ["Campanhas por serviço, cada uma na página certa", "Otimização semanal", "Verba de mídia é sua e vai direto para as plataformas"] },
      RELATORIO
    ],
    naoIncluso: "Verba de mídia, fotografia, produção de vídeo, gestão das redes sociais e assinaturas de ferramentas de terceiros.",
    servico: { site: { tipo: "site", paginas: 3, prazoDiasUteis: 10, revisoes: 2, hospedagemInclusa: true }, trafego: { plataformas: "Meta Ads e Google Ads", relatorioMensal: true } },
    financeiro: { mensal: { valor: 1500, meses: 0, inicio: "assinatura", descricao: "Gestão de tráfego" }, cortesias: [{ descricao: "Site novo (home + páginas por serviço)", valorTabela: 3000 }], verbaMidia: { valorMes: 1500, destino: "Meta e Google" } }
  },
  {
    id: "ecossistema",
    nome: "Ecossistema digital",
    titulo: "Página, anúncio e criativo trabalhando juntos para encher a agenda.",
    lead: "Funil completo: página de captura, campanhas e criativos todo mês, com relatório do que está fechando.",
    blocos: [
      { titulo: "Estratégia e páginas", etiqueta: "unico", objeto: true, itens: ["Desenho do funil", "Páginas de captura e de oferta"] },
      { titulo: "Tráfego e criativos", etiqueta: "mensal", objeto: true, itens: ["Gestão de campanhas Meta e Google", "8 criativos estáticos por mês", "Otimização semanal"] },
      RELATORIO
    ],
    naoIncluso: "Verba de mídia, produção de vídeo e assinaturas de ferramentas de terceiros.",
    servico: { site: { tipo: "site", paginas: 3, prazoDiasUteis: 10, revisoes: 2, hospedagemInclusa: true }, trafego: { plataformas: "Meta Ads e Google Ads", relatorioMensal: true }, criativos: { qtdMes: 8 } },
    financeiro: { mensal: { valor: 2500, meses: 0, inicio: "assinatura", descricao: "Ecossistema" }, verbaMidia: { valorMes: 2000, destino: "Meta e Google" } }
  },
  {
    id: "criativos",
    nome: "Criativos estáticos (mensal)",
    titulo: "Criativos novos todo mês para o anúncio não cansar.",
    lead: "Peças estáticas para Meta e Google, com copy e design alinhados à oferta, entregues em lotes mensais.",
    blocos: [
      { titulo: "Criativos", etiqueta: "mensal", objeto: true, itens: ["8 criativos estáticos por mês", "Copy e design por peça", "Até 2 ajustes por peça"] }
    ],
    naoIncluso: "Verba de mídia, gestão de tráfego e produção de vídeo.",
    servico: { criativos: { qtdMes: 8 } },
    financeiro: { mensal: { valor: 1000, meses: 0, inicio: "assinatura", descricao: "Criativos" } }
  }
];

export default (req, context) => tratar(req, context);

export async function tratar(req, context, io = ioPadrao) {
  if (!isAdmin(req)) return erro(401, "Não autorizado");
  try {
    if (req.method === "GET") {
      const lido = await io.lerJson(CAMINHO);
      if (!lido) return json(200, { modelos: CATALOGO_DEFAULT, sha: null });
      return json(200, { modelos: lido.dados, sha: lido.sha });
    }
    if (req.method === "PUT") {
      const body = await lerBody(req);
      if (!body || !Array.isArray(body.modelos)) return erro(400, "Envie { modelos: [...] }");
      if (body.modelos.length > MAX_MODELOS) return erro(400, `Máximo de ${MAX_MODELOS} modelos`);
      const ids = new Set();
      const modelos = [];
      for (const m of body.modelos) {
        const limpo = sanitizarModelo(m, ids);
        if (typeof limpo === "string") return erro(400, limpo);
        ids.add(limpo.id);
        modelos.push(limpo);
      }
      try {
        const r = await io.gravarJson(CAMINHO, modelos, body.sha || undefined, "atualizar modelos de serviço");
        return json(200, { modelos, sha: r?.content?.sha || null });
      } catch (e) {
        if (e instanceof ConflitoError) return erro(409, "Os modelos foram alterados em outra sessão — recarregue e tente de novo.");
        throw e;
      }
    }
    return erro(405, "Método não permitido");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
}

function slug(nome) {
  return String(nome).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "modelo";
}

export function sanitizarModelo(m, idsUsados = new Set()) {
  if (!m || typeof m !== "object") return "Modelo inválido";
  const nome = String(m.nome || "").trim().slice(0, 80);
  if (!nome) return "Todo modelo precisa de um nome";
  let id = String(m.id || "").trim() || slug(nome);
  if (!/^[a-z0-9-]+$/.test(id)) id = slug(nome);
  const base = id;
  for (let i = 2; idsUsados.has(id); i++) id = `${base}-${i}`;
  const p = sanitizarProposta(m);
  const fin = sanitizarFinanceiro(m.financeiro || {}, { permitirVazio: true });
  if (fin.erro) return `Modelo "${nome}": ${fin.erro}`;
  return {
    id, nome,
    titulo: p.titulo, lead: p.lead, contexto: p.contexto, blocos: p.blocos, naoIncluso: p.naoIncluso, passos: p.passos,
    servico: sanitizarServico(m.servico || {}),
    financeiro: fin.financeiro
  };
}
