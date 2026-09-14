// Agenda de cobranças de um contrato, calculada a partir de `financeiro`.
// Módulo puro: sem I/O, sem process.env. Usado pela function de assinatura,
// pela function de pagamentos e pelo script de importação dos legados.
//
// Datas são strings "AAAA-MM-DD" em horário de Brasília. Converter o instante
// da assinatura (ISO em UTC) com dataBRT(): quem assina às 22h em BH está em
// outro dia no UTC, e a cobrança tem que cair no dia em que a pessoa assinou.
//
// Regras:
// - único: uma cobrança por parcela. Vence na assinatura, N dias corridos
//   depois, na entrega (prazo do site em dias úteis) ou fica "a definir".
// - mensal com N meses: N mensalidades.
// - mensal sem prazo (meses = 0): ROLANTE. Nasce a 1ª; completarMensalidades()
//   garante uma cobrança por mês até o primeiro vencimento futuro. Não gera um
//   ano à frente: isso inflaria "a receber" com receita hipotética.
// - cortesia e verba de mídia nunca cobram.

const TZ = "America/Sao_Paulo";
const FMT = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export function dataBRT(instante) {
  const d = instante instanceof Date ? instante : new Date(instante || Date.now());
  if (Number.isNaN(d.getTime())) return null;
  return FMT.format(d); // en-CA = AAAA-MM-DD
}

export function hojeBRT(agora = new Date()) {
  return dataBRT(agora);
}

function partes(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function montar(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function ultimoDiaDoMes(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function somarDias(iso, n) {
  const p = partes(iso);
  if (!p) return null;
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + Number(n || 0)));
  return montar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

// Pula sábado e domingo. Usado pela parcela "na entrega" com prazo em dias úteis.
export function somarDiasUteis(iso, dias) {
  const p = partes(iso);
  if (!p) return null;
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  let restantes = Math.max(0, Number(dias) || 0);
  while (restantes > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  return montar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

// Mesmo dia, k meses depois, grampeado no último dia do mês (31/07 → 31/08 →
// 30/09). `diaPreferido` força um dia fixo (1..28).
export function mesesDepois(iso, k, diaPreferido) {
  const p = partes(iso);
  if (!p) return null;
  const dia = diaPreferido ? Math.min(28, Math.max(1, Number(diaPreferido))) : p[2];
  const total = p[1] - 1 + Number(k || 0);
  const y = p[0] + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12 + 1;
  return montar(y, m, Math.min(dia, ultimoDiaDoMes(y, m)));
}

function arredondar(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

// Valor da mensalidade n (1-based), respeitando o escalonamento
// (ex.: R$ 1.000 nos 3 primeiros meses, R$ 1.500 a partir do 4º).
export function valorMensalNoMes(mensal, n) {
  let valor = Number(mensal?.valor) || 0;
  for (const e of Array.isArray(mensal?.escalonamento) ? mensal.escalonamento : []) {
    if (n >= Number(e.aPartirDoMes) && Number(e.valor) >= 0) valor = Number(e.valor);
  }
  return arredondar(valor);
}

const STATUS_SEM_COBRANCA = new Set(["substituido", "expirada", "terceiro"]);

export function cobraCliente(contrato) {
  if (contrato?.financeiro?.cobrarCliente === false) return false;
  if (STATUS_SEM_COBRANCA.has(contrato?.status)) return false;
  return true;
}

function cobrancasUnico(contrato, dataBase, previsao) {
  const u = contrato.financeiro?.unico;
  if (!u || !(Number(u.valor) > 0)) return [];
  const total = arredondar(u.valor);
  const parcelas = Array.isArray(u.parcelas) && u.parcelas.length
    ? u.parcelas
    : [{ pct: 100, gatilho: "na assinatura do contrato", quando: "assinatura" }];
  const prazo = Number(contrato.servico?.site?.prazoDiasUteis) || 0;
  const n = parcelas.length;
  let acumulado = 0;
  return parcelas.map((p, i) => {
    const pct = Number(p.pct) || 0;
    const ultima = i === n - 1;
    // parcela com valor absoluto (ex.: 4.000 + 2.000) vence o percentual
    const valor = ultima ? arredondar(total - acumulado)
      : (Number(p.valor) > 0 ? arredondar(p.valor) : arredondar((total * pct) / 100));
    acumulado = arredondar(acumulado + valor);
    let vencimento = null;
    const quando = String(p.quando || (/assinatura|fechamento|aceite/i.test(p.gatilho || "") ? "assinatura" : "definir"));
    if (dataBase) {
      if (quando === "assinatura") vencimento = dataBase;
      else if (quando === "dias") vencimento = somarDias(dataBase, Number(p.dias) || 0);
      else if (quando === "entrega" && prazo > 0) vencimento = somarDiasUteis(dataBase, prazo);
    }
    return {
      id: `u${i + 1}`,
      serie: "unico",
      n: i + 1,
      descricao: n === 1
        ? (u.descricao ? `${u.descricao} · pagamento único` : "Pagamento único")
        : `Parcela ${i + 1}/${n}${u.descricao ? " · " + u.descricao : ""}`,
      quando: String(p.gatilho || "").trim(),
      pct,
      valor,
      vencimento,
      pago: false,
      pagoEm: null,
      previsao: !!previsao
    };
  });
}

function primeiraMensalidade(mensal, dataBase) {
  if (!mensal) return null;
  if (mensal.inicio === "operacao") return mensal.inicioEm || null;
  return dataBase || null;
}

function novaMensalidade(contrato, n, vencimento, previsao) {
  const m = contrato.financeiro.mensal;
  const total = Number(m.meses) || 0;
  const dia = m.diaVencimento ? Number(m.diaVencimento) : null;
  return {
    id: `m${n}`,
    serie: "mensal",
    n,
    descricao: (total ? `Mensalidade ${n}/${total}` : `Mensalidade ${n}`) + (m.descricao ? " · " + m.descricao : ""),
    quando: n === 1
      ? (m.inicio === "operacao" ? "no início da operação" : "na assinatura do contrato")
      : (dia ? `vencimento todo dia ${dia}` : "no mesmo dia dos meses seguintes"),
    pct: 0,
    valor: valorMensalNoMes(m, n),
    vencimento,
    pago: false,
    pagoEm: null,
    previsao: !!previsao
  };
}

function cobrancasMensal(contrato, dataBase, hoje, previsao) {
  const m = contrato.financeiro?.mensal;
  if (!m || !(Number(m.valor) > 0)) return [];
  const primeira = primeiraMensalidade(m, dataBase);
  const meses = Number(m.meses) || 0;
  const lista = [];
  if (!primeira) {
    lista.push(novaMensalidade(contrato, 1, null, previsao));
    return lista;
  }
  if (meses > 0) {
    for (let i = 1; i <= meses; i++) {
      const venc = i === 1 ? primeira : mesesDepois(primeira, i - 1, m.diaVencimento);
      if (m.encerradoEm && venc > m.encerradoEm) break;
      lista.push(novaMensalidade(contrato, i, venc, previsao));
    }
    return lista;
  }
  // indeterminado: até o primeiro vencimento depois de hoje
  const limite = hoje || primeira;
  let i = 1;
  let venc = primeira;
  while (true) {
    if (m.encerradoEm && venc > m.encerradoEm) break;
    lista.push(novaMensalidade(contrato, i, venc, previsao));
    if (venc > limite || i >= 120) break;
    i++;
    venc = mesesDepois(primeira, i - 1, m.diaVencimento);
  }
  return lista;
}

// Agenda completa do contrato. `dataBase` = dia da assinatura (BRT) ou, para
// registros importados sem assinatura, a emissão (aí `previsao: true`).
export function gerarCobrancas(contrato, { dataBase = null, hoje = hojeBRT(), previsao = false } = {}) {
  if (!cobraCliente(contrato)) return [];
  return [
    ...cobrancasUnico(contrato, dataBase, previsao),
    ...cobrancasMensal(contrato, dataBase, hoje, previsao)
  ];
}

// Mensal indeterminado: acrescenta as mensalidades vencidas ou a vencer que
// ainda não existem, até o primeiro vencimento futuro. Muta `contrato.pagamentos`.
// Devolve true se acrescentou algo.
export function completarMensalidades(contrato, hoje = hojeBRT()) {
  const m = contrato?.financeiro?.mensal;
  if (!m || !(Number(m.valor) > 0) || Number(m.meses) > 0) return false;
  if (!cobraCliente(contrato)) return false;
  const pags = Array.isArray(contrato.pagamentos) ? contrato.pagamentos : (contrato.pagamentos = []);
  const mensais = pags.filter((p) => p.serie === "mensal").sort((a, b) => a.n - b.n);
  if (!mensais.length) return false;
  const ancora = mensais.find((p) => p.vencimento);
  if (!ancora) return false;
  let ultima = mensais[mensais.length - 1];
  if (!ultima.vencimento) return false;
  let mudou = false;
  let guarda = 0;
  while (ultima.vencimento <= hoje && guarda++ < 120) {
    const n = ultima.n + 1;
    const venc = mesesDepois(ancora.vencimento, n - ancora.n, m.diaVencimento);
    if (m.encerradoEm && venc > m.encerradoEm) break;
    const nova = novaMensalidade(contrato, n, venc, !!ultima.previsao);
    pags.push(nova);
    ultima = nova;
    mudou = true;
  }
  return mudou;
}

// Quando a 1ª mensalidade nasce sem data (início da operação) e o Victor define
// a data depois, as seguintes sem data e não pagas ganham vencimento a partir dela.
export function reancorarMensais(contrato) {
  const m = contrato?.financeiro?.mensal;
  if (!m) return false;
  const pags = Array.isArray(contrato.pagamentos) ? contrato.pagamentos : [];
  const mensais = pags.filter((p) => p.serie === "mensal").sort((a, b) => a.n - b.n);
  const ancora = mensais.find((p) => p.vencimento);
  if (!ancora) return false;
  let mudou = false;
  for (const p of mensais) {
    if (p.n > ancora.n && !p.vencimento && !p.pago) {
      p.vencimento = mesesDepois(ancora.vencimento, p.n - ancora.n, m.diaVencimento);
      mudou = true;
    }
  }
  return mudou;
}

// Remove cobranças não pagas com vencimento após o encerramento do mensal.
export function aplicarEncerramento(contrato, encerradoEm) {
  const m = contrato?.financeiro?.mensal;
  if (!m) return false;
  m.encerradoEm = encerradoEm;
  const antes = (contrato.pagamentos || []).length;
  contrato.pagamentos = (contrato.pagamentos || []).filter((p) =>
    !(p.serie === "mensal" && !p.pago && p.vencimento && p.vencimento > encerradoEm)
  );
  return contrato.pagamentos.length !== antes;
}

export function resumoPagamentos(pagamentos, hoje = hojeBRT()) {
  let recebido = 0, aReceber = 0, atrasado = 0, proximo = null;
  for (const p of Array.isArray(pagamentos) ? pagamentos : []) {
    const v = Number(p.valor) || 0;
    if (p.pago) { recebido += v; continue; }
    aReceber += v;
    if (p.vencimento && p.vencimento < hoje && !p.previsao) atrasado += v;
    if (p.vencimento && p.vencimento >= hoje && (!proximo || p.vencimento < proximo)) proximo = p.vencimento;
  }
  return { recebido: arredondar(recebido), aReceber: arredondar(aReceber), atrasado: arredondar(atrasado), proximoVencimento: proximo };
}
