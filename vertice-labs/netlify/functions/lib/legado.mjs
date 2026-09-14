// Contratos legados: propostas HTML artesanais (vertice-labs/propostas/<slug>/)
// importadas como registros do sistema. Módulo puro, compartilhado pela function
// de sincronização e pelo script ops/importar-legado.mjs.
//
// As assinaturas desses contratos vivem em assinaturas/<docId>.json (gravadas
// pelo /api/assinar) e nunca são alteradas: aqui só são copiadas para o
// registro novo, com `origem` dizendo de onde vieram.

import { createHash } from "node:crypto";

// Namespace fixo: o mesmo slug sempre dá o mesmo uuid (importação idempotente).
export const NAMESPACE_LEGADO = "7c1b6a2e-5d3f-4b8a-9e0c-2f4d6a8b1c3e";

// UUID v5 (sha1 do namespace + nome), no formato que UUID_RE das functions aceita.
export function uuidLegado(slug) {
  const ns = Buffer.from(NAMESPACE_LEGADO.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(Buffer.concat([ns, Buffer.from(String(slug), "utf8")])).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // versão 5
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// "06/07/2026 18:20" ou "2026-07-06 18:20" (horário de Brasília) → ISO UTC.
// Só data → "AAAA-MM-DD" com precisão de dia.
export function carimboParaIso(texto) {
  const t = String(texto || "").trim();
  let m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(t);
  let y, mo, d, h, mi;
  if (m) { d = m[1]; mo = m[2]; y = m[3]; h = m[4]; mi = m[5]; }
  else {
    m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(t);
    if (!m) return { assinadoEm: null, precisao: null };
    y = m[1]; mo = m[2]; d = m[3]; h = m[4]; mi = m[5];
  }
  if (!h) return { assinadoEm: `${y}-${mo}-${d}`, precisao: "dia" };
  // Brasília = UTC-3 (sem horário de verão desde 2019)
  const utc = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) + 3, Number(mi)));
  return { assinadoEm: utc.toISOString(), precisao: "minuto" };
}

function copiarAssinatura(a, origem) {
  if (!a) return null;
  return {
    nome: a.nome || "",
    cpfCnpj: a.cpfCnpj || "",
    email: a.email || "",
    ip: a.ip || null,
    userAgent: a.userAgent || null,
    assinadoEm: a.assinadoEm || null,
    protocolo: a.protocolo || null,
    origem
  };
}

// Lê o arquivo assinaturas/<docId>.json (formato único ou multiparte) e devolve
// as assinaturas no formato do sistema novo + o status resultante.
export function mapearAssinaturas(registro, docId, { contratadaHtml = null } = {}) {
  const arquivo = `assinaturas/${docId}.json`;
  const agora = new Date().toISOString();
  const saida = { contratante: null, contratada: null, outras: {}, status: "aguardando_assinaturas" };

  if (registro && registro.assinatura) {
    // formato único: quem assina pela página é o cliente
    saida.contratante = copiarAssinatura(registro.assinatura, { tipo: "assinaturas", arquivo, parte: "unica", sincronizadoEm: agora });
  } else if (registro && registro.assinaturas && typeof registro.assinaturas === "object") {
    for (const [parte, a] of Object.entries(registro.assinaturas)) {
      const copia = copiarAssinatura(a, { tipo: "assinaturas", arquivo, parte, sincronizadoEm: agora });
      if (parte === "contratante" || parte === "contratada") saida[parte] = copia;
      else saida.outras[parte] = copia;
    }
  }

  // carimbo fixo da Vértice no HTML (contratos antigos, assinatura única)
  if (!saida.contratada && contratadaHtml) {
    const { assinadoEm, precisao } = carimboParaIso(contratadaHtml.assinadoEm);
    saida.contratada = {
      nome: contratadaHtml.nome || "Victor Rodrigues Viana",
      cpfCnpj: contratadaHtml.cpfCnpj || "40.461.516/0001-58",
      email: contratadaHtml.email || "vianavictorv@gmail.com",
      ip: null,
      userAgent: null,
      assinadoEm,
      precisao,
      protocolo: contratadaHtml.protocolo || null,
      origem: { tipo: contratadaHtml.protocolo ? "html" : "html-sem-protocolo", arquivo: contratadaHtml.arquivo || null, linha: contratadaHtml.linha || null }
    };
  }

  if (registro && registro.status === "assinado") saida.status = "assinado";
  else if (saida.contratante && saida.contratada) saida.status = "assinado";
  return saida;
}

// Aplica o resultado de mapearAssinaturas() num contrato legado. Muta e devolve.
export function aplicarSincronizacao(contrato, mapa) {
  contrato.assinaturas = contrato.assinaturas || { contratante: null, contratada: null };
  if (mapa.contratante) contrato.assinaturas.contratante = mapa.contratante;
  if (mapa.contratada) contrato.assinaturas.contratada = mapa.contratada;
  if (Object.keys(mapa.outras || {}).length) contrato.assinaturas.outras = mapa.outras;
  const manual = ["substituido", "expirada", "terceiro", "encerrado", "proposta"];
  if (!manual.includes(contrato.status)) contrato.status = mapa.status;
  contrato.legado = contrato.legado || {};
  contrato.legado.sincronizadoEm = new Date().toISOString();
  return contrato;
}
