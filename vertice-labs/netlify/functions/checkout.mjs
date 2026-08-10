// Cria a Checkout Session do Stripe para a pagina /palestrantes.
//
// Parcelamento em 12x so existe em Checkout Session criada por codigo (Payment
// Link nao parcela) — por isso esta function. Sem SDK, sem dependencias: fetch
// puro na API do Stripe. A chave vive em STRIPE_SECRET_KEY (env var do site
// Netlify), nunca no codigo.

const PLANOS = {
  mensal:               { price: 'price_1TvhCILGJ9uCQzbbpnztTCi5', mode: 'subscription', clube: true,  installments: false },
  anual:                { price: 'price_1TwmVPLGJ9uCQzbbzm9BnmXO', mode: 'payment',      clube: true,  installments: true  },
  ecossistema:          { price: 'price_1Twin0LGJ9uCQzbbMH2AVlEM', mode: 'payment',      clube: false, installments: true  },
  'ecossistema-avista': { price: 'price_1TwjdtLGJ9uCQzbbQl1ob0cZ', mode: 'payment',      clube: false, installments: false },
};

// A API do Stripe usa form-encoding com colchetes para campos aninhados.
function paraForm(objeto, prefixo = '', destino = new URLSearchParams()) {
  for (const [chave, valor] of Object.entries(objeto)) {
    if (valor === undefined || valor === null) continue;
    const nome = prefixo ? `${prefixo}[${chave}]` : chave;
    if (typeof valor === 'object') paraForm(valor, nome, destino);
    else destino.append(nome, String(valor));
  }
  return destino;
}

function erro(status, mensagem) {
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<div style="font-family:system-ui;max-width:32rem;margin:18vh auto;padding:0 1.5rem;text-align:center;color:#0d0d0f">`
    + `<h1 style="font-size:1.25rem">${mensagem}</h1>`
    + `<p><a href="/palestrantes" style="color:#0d0d0f">← Voltar para os planos</a></p></div>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export default async (req) => {
  if (req.method !== 'POST') return erro(405, 'Método não permitido.');

  const corpoReq = new URLSearchParams(await req.text());
  const plano = String(corpoReq.get('plano') || '').toLowerCase();
  const cfg = PLANOS[plano];
  const chave = process.env.STRIPE_SECRET_KEY;

  if (!cfg) return erro(400, 'Plano indisponível. Chame no WhatsApp que a gente resolve.');
  if (!chave) return erro(500, 'Pagamento fora do ar por um instante. Tente de novo em breve.');

  const origin = new URL(req.url).origin;

  const corpo = {
    mode: cfg.mode,
    line_items: [{ price: cfg.price, quantity: 1 }],
    success_url: `${origin}/palestrantes/obrigado`,
    cancel_url: `${origin}/palestrantes`,
    locale: 'pt-BR',
    billing_address_collection: 'required',
    allow_promotion_codes: true,
    phone_number_collection: { enabled: true },
    metadata: { plano },
  };

  // Nome do clube e endereco so servem ao provisionamento do Membro Club.
  if (cfg.clube) {
    corpo.custom_fields = [
      {
        key: 'nomedoclube',
        label: { type: 'custom', custom: 'Nome do seu clube (aparece na area de membros)' },
        type: 'text',
        text: { maximum_length: 40 },
      },
      {
        key: 'endereco',
        label: { type: 'custom', custom: 'Endereco desejado: ____.membroclub.com.br' },
        type: 'text',
        text: { maximum_length: 30 },
        optional: true,
      },
    ];
  }

  // Parcelamento em ate 12x so existe em pagamento unico; assinatura nao parcela.
  if (cfg.mode === 'payment') {
    if (cfg.installments) corpo.payment_method_options = { card: { installments: { enabled: true } } };
    corpo.payment_intent_data = { metadata: { plano } };
  } else {
    corpo.subscription_data = { metadata: { plano } };
  }

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paraForm(corpo).toString(),
    });
    const dados = await r.json();
    if (!r.ok) throw new Error(dados.error?.message || 'falha ao criar o checkout');
    return new Response(null, { status: 303, headers: { Location: dados.url } });
  } catch (e) {
    console.error('checkout:', e.message);
    return erro(502, 'Não consegui abrir o pagamento agora. Tente de novo em instantes.');
  }
};
