// Assinatura eletrônica das propostas estáticas (/previ, /souzatec, /lm-bids,
// /cambio-automatico, ...).
//
// Mesmo desenho do sistema/ da Ilume: IP, data/hora e protocolo SHA-256 são
// calculados NO SERVIDOR, e a assinatura é gravada num repo GitHub privado —
// cada gravação vira um commit, o que dá trilha de auditoria de graça.
// O navegador só manda nome, documento e e-mail; não escolhe hash nem horário.
//
// Dois formatos de documento, decididos pela allowlist (nunca pelo arquivo):
// - sem `partes`: assinatura ÚNICA. O documento assina uma vez; a segunda
//   tentativa recebe 409. É o formato dos contratos antigos e não mudou.
// - com `partes`: assinatura POR PARTE (contratante, contratada, ...). Cada
//   parte assina uma vez, em qualquer ordem; quando todas assinaram, o
//   documento passa a `status: "assinado"`. A página descobre quem já
//   assinou pelo GET /api/assinar?docId=...

import { createHash } from "node:crypto";
import { erro, json, lerBody } from "./lib/http.mjs";
import { ConflitoError, gravarJson, lerJson } from "./lib/github.mjs";
import { enviarEmail } from "./lib/email.mjs";

export const config = { path: "/api/assinar" };

// Allowlist. Documento que não estiver aqui não grava nada — evita que alguém
// use a rota para escrever arquivo arbitrário no repo de dados.
// Proposta nova = uma linha nova.
//
// Documento com várias partes leva `partes`: a ordem das chaves é a ordem dos
// carimbos e da lista "faltam". `documentos` (opcional) é a lista de CPF/CNPJ
// que aquela parte pode usar, só dígitos; sem a lista, qualquer documento
// válido serve (o contratante costuma assinar com o CPF do sócio).
// NUNCA acrescente `partes` a um docId que já tem arquivo no formato antigo:
// a function responde 500 em vez de misturar os formatos.
//
// `pagina` (opcional) é a rota da proposta no site. Só documentos com `pagina`
// ganham a cópia assinada em PDF por e-mail (ver copia-assinada.mjs).
export const DOCUMENTOS = {
  // PV-2026-01 (jul/2026, assinatura única) nunca foi assinada pela cliente e foi
  // substituída pela PV-2026-09; a entrada fica só por histórico.
  "previ-2026-01": {
    numero: "PV-2026-01",
    titulo: "Contrato de Prestação de Serviços · Previ Serviços Previdenciários",
    cliente: "Previ Serviços Previdenciários"
  },
  // Gestão de tráfego da Previ com o site já entregue e quitado (14/09/2026).
  "previ-2026-09": {
    numero: "PV-2026-09",
    titulo: "Contrato de Prestação de Serviços · Gestão de tráfego pago · Previ Serviços Previdenciários",
    cliente: "Previ Serviços Previdenciários (Bruna Clarindo Vieira Evangelista)",
    pagina: "/previ",
    partes: {
      "contratante": {
        rotulo: "CONTRATANTE",
        curto: "Previ",
        quem: "Bruna Clarindo Vieira Evangelista · Previ Serviços Previdenciários",
        documentos: ["07741293605"]
      },
      "contratada": {
        rotulo: "CONTRATADA",
        curto: "Vértice",
        quem: "Viana Mídias e Marketing LTDA · Vértice Labs",
        documentos: ["40461516000158"]
      }
    }
  },
  "faz-morar-evento-2026-03": {
    numero: "FM-2026-03",
    titulo: "Contrato de Prestação de Serviços · Campanha do evento Leilão & Prosa · Faz Morar",
    cliente: "Faz Morar Imóveis LTDA"
  },
  "souzatec-2026-01": {
    numero: "SZ-2026-01",
    titulo: "Contrato de Prestação de Serviços · Souza Tec Construtora",
    cliente: "Souza Tec Comércio e Serviço LTDA"
  },
  "lm-bids-2026-08": {
    numero: "LB-2026-08",
    titulo: "Contrato de Prestação de Serviços · Landing Page · LM Bids",
    cliente: "LM Bids Ltda"
  },
  "monalisa-2026-08": {
    numero: "ML-2026-08",
    titulo: "Contrato de Prestação de Serviços · Ecossistema digital · Dra. Monalisa",
    cliente: "La Vie - Clínica de Endocrinologia LTDA (Dra. Monalisa)",
    partes: {
      "contratante": {
        rotulo: "CONTRATANTE",
        curto: "La Vie",
        quem: "La Vie - Clínica de Endocrinologia LTDA",
        documentos: ["14906763000100"]
      },
      "contratada": {
        rotulo: "CONTRATADA",
        curto: "Vértice",
        quem: "Viana Mídias e Marketing LTDA · Vértice Labs",
        documentos: ["40461516000158"]
      }
    }
  },
  "cambio-automatico-2026-08": {
    numero: "CA-2026-08",
    titulo: "Contrato de Prestação de Serviços · Venda de ingressos · Câmbio Automático das Américas",
    cliente: "Câmbio Automático das Américas Ltda - ME",
    partes: {
      "contratante": {
        rotulo: "CONTRATANTE",
        curto: "Câmbio Automático",
        quem: "Câmbio Automático das Américas Ltda - ME"
      },
      "contratada": {
        rotulo: "CONTRATADA",
        curto: "Vértice",
        quem: "Viana Mídias e Marketing LTDA · Vértice Labs",
        documentos: ["40461516000158"]
      },
      "contratado-2": {
        rotulo: "CONTRATADO 2",
        curto: "Greyk",
        quem: "Greyk da Silva Sousa",
        documentos: ["22555670831"]
      }
    }
  },
  "ancia-2026-09": {
    numero: "AN-2026-09",
    titulo: "Contrato de Prestação de Serviços · Tráfego pago + site do buffet · Anciã",
    cliente: "Ancia Cafeteria e Culinaria Afetiva LTDA (Amanda Tatiana Gonzaga)",
    pagina: "/ancia",
    partes: {
      "contratante": {
        rotulo: "CONTRATANTE",
        curto: "Anciã",
        quem: "Ancia Cafeteria e Culinaria Afetiva LTDA",
        // CNPJ da empresa ou CPF da sócia-administradora (Amanda), conferido na Receita
        documentos: ["55043748000163", "05545999612"]
      },
      "contratada": {
        rotulo: "CONTRATADA",
        curto: "Vértice",
        quem: "Viana Mídias e Marketing LTDA · Vértice Labs",
        documentos: ["40461516000158"]
      }
    }
  },
  // Primeiro contrato em que a contratada não é a Vértice: a Hyype Pagamentos
  // assina pelo CNPJ dela. `marca` troca o nome e o rodapé do e-mail da cópia
  // assinada (copia-assinada.mjs); sem `marca`, o e-mail sai como Vértice Labs.
  "dany-2026-09": {
    numero: "DG-2026-09",
    titulo: "Contrato de Parceria Comercial · Máquina de vendas na Hyype · Dany Gonçalves",
    cliente: "Dany Gonçalves",
    pagina: "/dany",
    marca: {
      nome: "Hyype",
      rodape: "Hyype · Hyype Pagamentos LTDA · CNPJ 35.534.271/0001-01 · Barueri/SP",
      contato: "Greyk Sousa e Victor Viana · sócios do projeto"
    },
    // Quatro assinantes (revisão do Greyk em 12/09/2026): a Hyype segue como
    // contratada e os sócios do projeto assinam junto, Greyk pelo CPF e Victor
    // pela Viana Mídias.
    partes: {
      "contratante": {
        rotulo: "CONTRATANTE",
        curto: "Dany Gonçalves",
        quem: "Dany Gonçalves"
        // sem `documentos`: os dados dela ainda não foram informados
      },
      "contratada": {
        rotulo: "CONTRATADA",
        curto: "Hyype",
        quem: "Hyype Pagamentos LTDA · Hyype",
        documentos: ["35534271000101"]
      },
      "contratado-2": {
        rotulo: "CONTRATADO 2",
        curto: "Greyk",
        quem: "Greyk da Silva Sousa",
        documentos: ["22555670831"]
      },
      "contratado-3": {
        rotulo: "CONTRATADO 3",
        curto: "Victor",
        quem: "Viana Mídias e Marketing LTDA · Victor Rodrigues Viana",
        documentos: ["40461516000158"]
      }
    }
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TENTATIVAS_UNICA = 2;
const TENTATIVAS_MULTI = 3; // uma por assinante: corrida entre os três resolve na releitura

export default (req, context) => tratar(req, context);

// `io` é injetável para os testes rodarem com um GitHub em memória, sem token
// (ver tests/assinar.test.mjs na raiz do repo). O runtime ignora este export.
export async function tratar(req, context, io = { lerJson, gravarJson, enviarEmail }) {
  if (req.method === "GET") return obterEstado(req, io);
  if (req.method === "POST") return assinar(req, context, io);
  return erro(405, "Método não permitido");
}

/* ============================ POST: assinar ============================ */

async function assinar(req, context, io) {
  const body = await lerBody(req);
  if (!body) return erro(400, "JSON inválido");

  const docId = String(body.docId || "").trim();
  const doc = resolverDocumento(docId);
  if (!doc) return erro(404, "Documento não encontrado");

  // Tudo daqui até o loop é validação sem I/O: um pedido malformado nunca
  // chega ao GitHub, o que também é o que permite testar a rota em produção.
  const parte = resolverParte(doc, body);
  if (parte instanceof Response) return parte;

  const campos = validarCampos(body);
  if (campos instanceof Response) return campos;

  if (parte) {
    const confere = validarDocumentoEsperado(doc, parte, campos.cpfCnpj);
    if (confere) return confere;
  }

  const ctx = {
    ip: context?.ip || req.headers.get("x-nf-client-connection-ip") || "",
    userAgent: (req.headers.get("user-agent") || "").slice(0, 400),
    caminho: `assinaturas/${docId}.json`
  };

  try {
    return parte
      ? await assinarMultiparte(docId, doc, parte, campos, ctx, io)
      : await assinarUnica(docId, doc, campos, ctx, io);
  } catch (e) {
    console.error(e);
    return erro(500, "Não foi possível registrar a assinatura agora.");
  }
}

function resolverDocumento(docId) {
  return Object.prototype.hasOwnProperty.call(DOCUMENTOS, docId) ? DOCUMENTOS[docId] : null;
}

// Devolve a parte (string) para documento multi-parte, null para documento de
// assinatura única, ou a Response de erro.
function resolverParte(doc, body) {
  const parte = body.parte == null ? "" : String(body.parte).trim();
  if (!doc.partes) {
    if (parte) return erro(400, "Este documento não usa assinatura por parte", { codigo: "parte_nao_suportada" });
    return null;
  }
  if (!parte) return erro(400, "Informe como qual parte você está assinando", { codigo: "parte_ausente" });
  if (!Object.prototype.hasOwnProperty.call(doc.partes, parte)) {
    return erro(400, `Parte inválida. Use uma de: ${Object.keys(doc.partes).join(", ")}`, { codigo: "parte_invalida" });
  }
  return parte;
}

function validarCampos(body) {
  const nome = String(body.nome || "").trim().replace(/\s+/g, " ");
  const cpfCnpj = String(body.cpfCnpj || "").trim();
  const email = String(body.email || "").trim();

  if (nome.length < 3 || nome.length > 120) return erro(400, "Informe o nome completo");
  if (!validarDocumento(cpfCnpj)) return erro(400, "Informe um CPF ou CNPJ válido");
  if (!EMAIL_RE.test(email) || email.length > 160) return erro(400, "Informe um e-mail válido");
  if (body.aceite !== true) return erro(400, "É preciso concordar com as cláusulas para assinar");
  return { nome, cpfCnpj, email };
}

// A mensagem não revela qual documento a parte deveria usar.
function validarDocumentoEsperado(doc, parte, cpfCnpj) {
  const esperados = doc.partes[parte].documentos;
  if (!esperados || esperados.includes(normalizarDocumento(cpfCnpj))) return null;
  return erro(400, `O CPF/CNPJ informado não é o cadastrado para a parte ${doc.partes[parte].rotulo}.`, {
    codigo: "documento_nao_confere"
  });
}

function calcularProtocolo(campos) {
  return createHash("sha256").update(campos.join("|"), "utf8").digest("hex");
}

async function avisar(campos, io) {
  // O e-mail pode não sair daqui: o FormSubmit bloqueia chamada de servidor
  // (ver lib/email.mjs). A assinatura já está gravada, então devolvemos o
  // aviso pronto para a página postar do navegador.
  const destino = process.env.EMAIL_ASSINATURA || "vianavictorv@gmail.com";
  const avisado = await io.enviarEmail(destino, campos).then(
    () => true,
    (e) => {
      console.error("Falha ao enviar e-mail (assinatura já registrada):", e.message);
      return false;
    }
  );
  return { avisado, email: avisado ? undefined : { destino, campos } };
}

/* ---------------------- formato antigo: assinatura única ---------------------- */

async function assinarUnica(docId, doc, { nome, cpfCnpj, email }, { ip, userAgent, caminho }, io) {
  // Até 2 tentativas: numa corrida de gravação o sha fica velho, então
  // relemos e revalidamos — a segunda assinatura cai no 409 abaixo.
  for (let tentativa = 0; tentativa < TENTATIVAS_UNICA; tentativa++) {
    const lido = await io.lerJson(caminho);
    if (lido?.dados?.assinaturas) return formatoIncompativel(docId, "único", "várias partes");
    if (lido?.dados?.assinatura) {
      return erro(409, "Este contrato já foi assinado. A assinatura só pode ser feita uma vez.");
    }

    const assinadoEm = new Date().toISOString();
    const protocolo = calcularProtocolo([docId, nome, cpfCnpj, email, assinadoEm, ip]);

    const assinatura = { nome, cpfCnpj, email, ip, userAgent, assinadoEm, protocolo };
    const registro = {
      docId,
      numero: doc.numero,
      titulo: doc.titulo,
      cliente: doc.cliente,
      assinatura,
      criadoEm: assinadoEm
    };

    try {
      await io.gravarJson(caminho, registro, lido?.sha, `assinatura ${doc.numero} — ${doc.cliente}`);
    } catch (e) {
      if (e instanceof ConflitoError) continue; // outra gravação entrou antes
      throw e;
    }

    const { avisado, email: aviso } = await avisar(montarEmail(doc, assinatura), io);
    return json(200, { assinatura, avisado, email: aviso });
  }
  return erro(409, "Conflito de gravação. Tente novamente.");
}

function montarEmail(doc, a) {
  return {
    _subject: `✍️ Contrato ${doc.numero} · ${doc.cliente} ASSINADO`,
    _template: "table",
    Documento: doc.titulo,
    Contrato: doc.numero,
    Nome: a.nome,
    "CPF/CNPJ": a.cpfCnpj,
    "E-mail": a.email,
    "Data e hora (UTC)": a.assinadoEm,
    "IP de origem": a.ip || "não disponível",
    Protocolo: a.protocolo,
    "User-Agent": a.userAgent
  };
}

/* ------------------------ formato novo: várias partes ------------------------ */

async function assinarMultiparte(docId, doc, parte, { nome, cpfCnpj, email }, { ip, userAgent, caminho }, io) {
  for (let tentativa = 0; tentativa < TENTATIVAS_MULTI; tentativa++) {
    const lido = await io.lerJson(caminho);
    if (lido?.dados?.assinatura) return formatoIncompativel(docId, "várias partes", "único");

    // Cada tentativa parte do arquivo relido, nunca do estado da anterior:
    // numa corrida, a releitura traz o sha novo E a assinatura que entrou antes.
    const registro = lido ? lido.dados : novoRegistroMultiparte(docId, doc);
    if (!registro.assinaturas || typeof registro.assinaturas !== "object") registro.assinaturas = {};

    if (registro.status === "assinado") {
      return erro(409, "Este contrato já foi assinado por todas as partes.", { codigo: "contrato_concluido" });
    }
    if (Object.prototype.hasOwnProperty.call(registro.assinaturas, parte)) {
      return erro(409, `A parte ${doc.partes[parte].rotulo} já assinou o contrato. A assinatura só pode ser feita uma vez.`, {
        codigo: "parte_ja_assinou"
      });
    }

    const assinadoEm = new Date().toISOString();
    const protocolo = calcularProtocolo([docId, parte, nome, cpfCnpj, email, assinadoEm, ip]);
    const assinatura = { parte, nome, cpfCnpj, email, ip, userAgent, assinadoEm, protocolo };
    aplicarAssinatura(doc, registro, assinatura);

    const completo = registro.status === "assinado";
    const mensagem = `assinatura ${doc.numero} · ${parte} — ${nome}${completo ? " (todas as partes)" : ""}`;
    try {
      await io.gravarJson(caminho, registro, lido?.sha, mensagem);
    } catch (e) {
      // Inclui o caso do arquivo que acabou de nascer: o PUT sem sha num
      // arquivo existente volta 422, que lib/github.mjs converte em conflito.
      if (e instanceof ConflitoError) continue;
      throw e;
    }

    const estado = estadoPublico(docId, doc, registro);
    const { avisado, email: aviso } = await avisar(montarEmailParte(doc, parte, assinatura, estado), io);

    // O comprovante do próprio assinante leva o documento e o e-mail dele;
    // o `estado` (que a página usa para os carimbos) só leva o que é público.
    const { userAgent: _ua, ...comprovante } = assinatura;
    return json(200, { parte, status: registro.status, assinatura: comprovante, estado, avisado, email: aviso });
  }
  return erro(409, "Conflito de gravação. Tente novamente.", { codigo: "conflito_gravacao" });
}

function novoRegistroMultiparte(docId, doc) {
  return {
    docId,
    numero: doc.numero,
    titulo: doc.titulo,
    cliente: doc.cliente,
    formato: "multiparte",
    partes: Object.keys(doc.partes), // snapshot da config: diz com que partes o documento foi assinado
    status: "aguardando_assinaturas",
    assinaturas: {},
    criadoEm: null,
    atualizadoEm: null,
    concluidoEm: null
  };
}

// Pura: muta e devolve o registro.
export function aplicarAssinatura(doc, registro, assinatura) {
  registro.assinaturas[assinatura.parte] = assinatura;
  registro.criadoEm = registro.criadoEm || assinatura.assinadoEm;
  registro.atualizadoEm = assinatura.assinadoEm;
  const faltam = Object.keys(doc.partes).filter((p) => !registro.assinaturas[p]);
  if (faltam.length === 0) {
    registro.status = "assinado";
    registro.concluidoEm = assinatura.assinadoEm;
  }
  return registro;
}

// O que sai de uma assinatura para quem só tem o link: o mesmo que o carimbo
// da página mostra. Objeto novo, campo a campo — nunca spread do registro.
export function assinaturaPublica(a) {
  return { nome: a.nome, assinadoEm: a.assinadoEm, ip: a.ip, protocolo: a.protocolo };
}

export function estadoPublico(docId, doc, registro) {
  const assinaturas = registro?.assinaturas && typeof registro.assinaturas === "object" ? registro.assinaturas : {};
  const ids = Object.keys(doc.partes);
  const partes = {};
  const faltam = [];
  for (const id of ids) {
    const p = doc.partes[id];
    const a = Object.prototype.hasOwnProperty.call(assinaturas, id) ? assinaturas[id] : null;
    partes[id] = { rotulo: p.rotulo, quem: p.quem, assinada: Boolean(a), ...(a ? assinaturaPublica(a) : {}) };
    if (!a) faltam.push(id);
  }
  const estado = {
    docId,
    numero: doc.numero,
    status: registro?.status || "aguardando_assinaturas",
    total: ids.length,
    assinadas: ids.length - faltam.length,
    faltam,
    partes
  };
  // Cópia assinada em PDF (copia-assinada.mjs): só datas e quantidade,
  // nunca os e-mails dos destinatários.
  if (registro?.copia && typeof registro.copia === "object") {
    estado.copia = {
      geradoEm: registro.copia.geradoEm || null,
      enviadaEm: registro.copia.enviadaEm || null,
      destinatarios: Array.isArray(registro.copia.destinatarios) ? registro.copia.destinatarios.length : 0
    };
  }
  return estado;
}

export function montarEmailParte(doc, parte, a, estado) {
  const p = doc.partes[parte];
  const completo = estado.status === "assinado";
  const faltam = estado.faltam.map((id) => `${doc.partes[id].rotulo} (${doc.partes[id].curto})`);
  return {
    _subject: completo
      ? `✅ Contrato ${doc.numero} · ${doc.cliente} · ASSINADO por todas as partes`
      : `✍️ Contrato ${doc.numero} · ${p.rotulo} (${p.curto}) assinou · faltam ${estado.faltam.length}`,
    _template: "table",
    Documento: doc.titulo,
    Contrato: doc.numero,
    Parte: `${p.rotulo} · ${p.quem}`,
    Nome: a.nome,
    "CPF/CNPJ": a.cpfCnpj,
    "E-mail": a.email,
    "Data e hora (UTC)": a.assinadoEm,
    "IP de origem": a.ip || "não disponível",
    Protocolo: a.protocolo,
    "User-Agent": a.userAgent,
    Status: completo ? "ASSINADO por todas as partes" : `Faltam ${estado.faltam.length}: ${faltam.join(", ")}`
  };
}

function formatoIncompativel(docId, configurado, gravado) {
  console.error(`Documento ${docId}: allowlist define formato ${configurado}, mas o arquivo gravado é ${gravado}.`);
  return erro(500, "Registro em formato incompatível com a configuração do documento");
}

/* ============================ GET: estado público ============================ */

// Só documentos com `partes` respondem: os contratos antigos não expõem nada.
// Sem arquivo (ninguém assinou) é 200 com tudo pendente, não erro.
async function obterEstado(req, io) {
  const docId = (new URL(req.url).searchParams.get("docId") || "").trim();
  if (!docId) return erro(400, "Informe o docId");

  const doc = resolverDocumento(docId);
  if (!doc || !doc.partes) return erro(404, "Documento não encontrado");

  try {
    const lido = await io.lerJson(`assinaturas/${docId}.json`);
    if (lido?.dados?.assinatura) return formatoIncompativel(docId, "várias partes", "único");
    return json(200, estadoPublico(docId, doc, lido?.dados || null));
  } catch (e) {
    console.error(e);
    return erro(500, "Não foi possível consultar o documento agora.");
  }
}

/* ===================== validação de CPF / CNPJ ===================== */

export function normalizarDocumento(valor) {
  return String(valor).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function validarDocumento(valor) {
  const limpo = normalizarDocumento(valor);
  if (limpo.length === 11) return validarCpf(limpo);
  if (limpo.length === 14) return validarCnpj(limpo);
  return false;
}

function validarCpf(cpf) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 111.111.111-11 e afins
  for (let tamanho = 9; tamanho < 11; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11 % 10;
    if (resto !== Number(cpf[tamanho])) return false;
  }
  return true;
}

// Aceita o CNPJ alfanumérico: o valor de cada caractere é o código ASCII
// menos 48, o que preserva 0-9 e dá 17..26 para A-Z.
function validarCnpj(cnpj) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj)) return false;
  if (/^(.)\1{13}$/.test(cnpj)) return false;
  const val = (c) => c.charCodeAt(0) - 48;
  for (let tamanho = 12; tamanho < 14; tamanho++) {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += val(cnpj[i]) * peso;
      peso = peso - 1 < 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    const digito = resto < 2 ? 0 : 11 - resto;
    if (digito !== Number(cnpj[tamanho])) return false;
  }
  return true;
}
