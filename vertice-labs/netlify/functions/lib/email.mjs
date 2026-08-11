// Aviso por e-mail via FormSubmit, usado pela assinatura e pelo briefing.
//
// LEIA ANTES DE MEXER. O FormSubmit foi feito para formulário de navegador e
// trata chamada de servidor como abuso. Medido em 11/08/2026:
//
// 1. Sem header `Origin` ele responde **HTTP 200** com `{"success":"false"}`.
//    Checar só `res.ok` dá falso positivo: o código comemora e o e-mail some.
//    Por isso a validação aqui é pelo corpo, não pelo status.
// 2. Com `Origin` correto, do IP do Netlify, ele responde **403**. Do IP de
//    um navegador comum, a mesma chamada passa. Ou seja: e-mail disparado
//    daqui não sai, ponto.
//
// Por isso quem chama trata a falha como esperada e devolve `email` na
// resposta, para a página postar do navegador. Esta função continua no lugar
// porque o bloqueio pode mudar, e se um dia o servidor voltar a conseguir, o
// navegador para de duplicar sozinho.

const SITE = process.env.URL || "https://verticelabs.iafunil.com.br";

export async function enviarEmail(destino, campos, tentativas = 2) {
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await postar(destino, campos);
    } catch (e) {
      ultimoErro = e;
    }
  }
  throw ultimoErro;
}

async function postar(destino, campos) {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destino)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: SITE,
      Referer: `${SITE}/`
    },
    body: JSON.stringify(campos)
  });

  if (!res.ok) throw new Error(`FormSubmit HTTP ${res.status}`);

  const corpo = await res.json().catch(() => null);
  if (!corpo) throw new Error("FormSubmit respondeu sem JSON");
  if (String(corpo.success) !== "true") {
    throw new Error(`FormSubmit recusou: ${corpo.message || "sem mensagem"}`);
  }
  return corpo;
}
