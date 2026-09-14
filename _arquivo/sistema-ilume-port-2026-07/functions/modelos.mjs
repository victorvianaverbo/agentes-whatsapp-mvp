import { isAdmin } from "./lib/auth.mjs";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarJson, lerJson } from "./lib/github.mjs";

export const config = { path: "/api/modelos" };

const CAMINHO = "config/modelos.json";
const TIPOS = ["pontual", "recorrente"];
const PRESETS = ["5050", "304030", "custom"];
const MAX_MODELOS = 30;

// Catálogo inicial: usado enquanto config/modelos.json não existe no repo de dados.
// O primeiro save pela tela "Modelos" cria o arquivo.
const CATALOGO_DEFAULT = [
  {
    id: "cobertura-evento",
    nome: "Cobertura de evento",
    tipo: "pontual",
    titulo: "A cobertura audiovisual do seu evento, do registro ao trailer final.",
    lead: "Captação completa do seu evento com câmera, microfones e iluminação profissionais — palestras na íntegra, entrevistas editadas e trailer de divulgação.",
    blocos: [
      { titulo: "Captação no evento", itens: ["Gravação presencial na data e horário combinados", "Estrutura inclusa: 1 câmera, 2 microfones e iluminação profissional"] },
      { titulo: "Vídeos entregues", itens: ["Vídeos das palestras na íntegra", "Vídeos editados das entrevistas", "Trailer editado do evento", "Até 2 alterações por vídeo incluídas, sem custo"] }
    ],
    mostrarGravacao: true,
    mostrarVideosCortes: false,
    servico: { prazoEntregaDias: 10, valorHoraExcedente: 175, descricaoObjeto: ["Vídeos de todas as palestras na íntegra", "Vídeos editados das entrevistas", "Vídeo editado do trailer do evento"] },
    financeiro: { preset: "304030" }
  },
  {
    id: "video-institucional",
    nome: "Vídeo institucional",
    tipo: "pontual",
    titulo: "O vídeo institucional que apresenta sua empresa com autoridade.",
    lead: "Roteiro, gravação e edição profissional de um vídeo que conta a história da sua empresa e conecta com quem importa.",
    blocos: [
      { titulo: "Produção completa", itens: ["Alinhamento de roteiro e pauta", "Gravação presencial com equipamento profissional", "Edição completa com trilha licenciada"] },
      { titulo: "Entrega", itens: ["1 vídeo institucional editado", "Até 2 alterações incluídas, sem custo"] }
    ],
    mostrarGravacao: true,
    mostrarVideosCortes: true,
    servico: { qtdVideos: 1, qtdCortes: 0, prazoEntregaDias: 15 },
    financeiro: { preset: "5050" }
  },
  {
    id: "comercial-anuncio",
    nome: "Comercial / anúncio",
    tipo: "pontual",
    titulo: "Criativos em vídeo feitos pra vender todos os dias.",
    lead: "Comercial gravado e editado no formato certo pra anúncios — com cortes prontos pra Reels, Stories e feed.",
    blocos: [
      { titulo: "Produção", itens: ["Gravação do comercial com equipamento profissional", "Edição dinâmica com trilha licenciada"] },
      { titulo: "Entrega", itens: ["1 comercial editado", "3 cortes em formato vertical pra redes sociais", "Até 2 alterações por vídeo incluídas"] }
    ],
    mostrarGravacao: true,
    mostrarVideosCortes: true,
    servico: { qtdVideos: 1, qtdCortes: 3, prazoEntregaDias: 10 },
    financeiro: { preset: "5050" }
  },
  {
    id: "videocast",
    nome: "Videocast / podcast",
    tipo: "pontual",
    titulo: "Seu videocast gravado e editado, pronto pra publicar.",
    lead: "Gravação do episódio com múltiplas câmeras e áudio profissional, edição completa e cortes pra divulgar nas redes.",
    blocos: [
      { titulo: "Gravação do episódio", itens: ["Captação presencial com câmera e microfones profissionais", "Acompanhamento técnico durante toda a gravação"] },
      { titulo: "Entrega", itens: ["Episódio completo editado", "Cortes verticais pra Reels/Shorts/TikTok", "Até 2 alterações por vídeo incluídas"] }
    ],
    mostrarGravacao: true,
    mostrarVideosCortes: true,
    servico: { qtdVideos: 1, qtdCortes: 10, prazoEntregaDias: 7 },
    financeiro: { preset: "5050" }
  },
  {
    id: "aftermovie",
    nome: "Aftermovie / trailer",
    tipo: "pontual",
    titulo: "O aftermovie que eterniza seu evento e vende o próximo.",
    lead: "Captação dos melhores momentos e edição cinematográfica em um vídeo curto e impactante, feito pra divulgação.",
    blocos: [
      { titulo: "Captação", itens: ["Cobertura dos principais momentos do evento", "Equipamento profissional de imagem e som"] },
      { titulo: "Entrega", itens: ["1 aftermovie editado com trilha licenciada", "Até 2 alterações incluídas"] }
    ],
    mostrarGravacao: true,
    mostrarVideosCortes: true,
    servico: { qtdVideos: 1, qtdCortes: 0, prazoEntregaDias: 7 },
    financeiro: { preset: "5050" }
  },
  {
    id: "social-media-mensal",
    nome: "Social media mensal (recorrente)",
    tipo: "recorrente",
    titulo: "Vídeos todo mês pra manter sua marca presente.",
    lead: "Assinatura mensal de produção audiovisual: gravações agendadas, edição profissional e entrega contínua pro seu conteúdo nunca parar.",
    blocos: [
      { titulo: "Todo mês", itens: ["4 vídeos gravados e editados", "8 horas de gravação mensais", "Agendamento flexível conforme sua agenda"] },
      { titulo: "Qualidade", itens: ["Equipamento profissional de imagem e som", "Trilhas licenciadas", "Até 2 alterações por vídeo incluídas"] }
    ],
    mostrarGravacao: false,
    mostrarVideosCortes: false,
    servico: { meses: 3, videosMes: 4, horasMensais: 8, prazoEntregaDias: 7 },
    financeiro: { preset: "5050", diaVencimento: 5 }
  }
];

export default async (req) => {
  if (!isAdmin(req)) return erro(401, "Não autorizado");

  try {
    if (req.method === "GET") {
      const lido = await lerJson(CAMINHO);
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
        const r = await gravarJson(CAMINHO, modelos, body.sha || undefined, "atualizar modelos de serviço");
        return json(200, { modelos, sha: r.content.sha });
      } catch (e) {
        if (e instanceof ConflitoError) {
          return erro(409, "Os modelos foram alterados em outra sessão — recarregue e tente de novo.");
        }
        throw e;
      }
    }

    return erro(405, "Método não permitido");
  } catch (e) {
    console.error(e);
    return erro(500, "Erro interno: " + e.message);
  }
};

function slug(nome) {
  return String(nome).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 50) || "modelo";
}

function sanitizarModelo(m, idsUsados) {
  const s = (v) => (typeof v === "string" ? v.trim() : "");
  const n = (v) => (Number(v) > 0 ? Number(v) : 0);
  if (!m || typeof m !== "object") return "Modelo inválido";
  const nome = s(m.nome);
  if (!nome) return "Todo modelo precisa de um nome";
  if (!TIPOS.includes(m.tipo)) return `Modelo "${nome}": tipo deve ser pontual ou recorrente`;

  let id = s(m.id) || slug(nome);
  if (!/^[a-z0-9-]+$/.test(id)) id = slug(nome);
  let base = id, i = 2;
  while (idsUsados.has(id)) id = base + "-" + i++;

  const fin = m.financeiro || {};
  const preset = PRESETS.includes(fin.preset) ? fin.preset : "5050";
  let parcelas = [];
  if (preset === "custom") {
    parcelas = (Array.isArray(fin.parcelas) ? fin.parcelas : [])
      .map((p) => ({ pct: n(p.pct), gatilho: s(p.gatilho) }))
      .filter((p) => p.pct > 0);
    const soma = parcelas.reduce((t, p) => t + p.pct, 0);
    if (soma !== 100) return `Modelo "${nome}": parcelas personalizadas somam ${soma}% — precisam somar 100%`;
  }

  const sv = m.servico || {};
  return {
    id,
    nome,
    tipo: m.tipo,
    titulo: s(m.titulo),
    lead: s(m.lead),
    blocos: (Array.isArray(m.blocos) ? m.blocos : [])
      .map((b) => ({
        titulo: s(b && b.titulo),
        itens: (Array.isArray(b && b.itens) ? b.itens : []).map(s).filter(Boolean)
      }))
      .filter((b) => b.titulo || b.itens.length),
    mostrarGravacao: !!m.mostrarGravacao,
    mostrarVideosCortes: !!m.mostrarVideosCortes,
    servico: m.tipo === "pontual"
      ? {
          qtdVideos: n(sv.qtdVideos),
          qtdCortes: n(sv.qtdCortes),
          prazoEntregaDias: n(sv.prazoEntregaDias) || 7,
          valorHoraExcedente: n(sv.valorHoraExcedente),
          descricaoObjeto: (Array.isArray(sv.descricaoObjeto) ? sv.descricaoObjeto : []).map(s).filter(Boolean)
        }
      : {
          meses: n(sv.meses) || 3,
          videosMes: n(sv.videosMes) || 4,
          horasMensais: n(sv.horasMensais) || 8,
          prazoEntregaDias: n(sv.prazoEntregaDias) || 7
        },
    financeiro: m.tipo === "recorrente"
      ? { preset: "5050", diaVencimento: Math.min(28, n(fin.diaVencimento) || 5) }
      : { preset, parcelas }
  };
}
