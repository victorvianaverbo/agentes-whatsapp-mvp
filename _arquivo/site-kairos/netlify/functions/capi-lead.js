// Netlify Function - Meta Conversions API (CAPI) Lead Event
// Recebe POST com { email, phone, nome, lp, lead_id? } do form da LP
// Envia evento Lead pra Meta no formato CRM Lead Event (system_generated)
// Token vem da env var META_CAPI_TOKEN (configurar via netlify env:set)

import crypto from 'node:crypto';

const PIXEL_ID = '2163536854400808';
const API_VERSION = 'v18.0';
const ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

const sha256 = (s) => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');
const normalizePhone = (p) => String(p).replace(/\D/g, '');

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'META_CAPI_TOKEN not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { email, phone, nome, lp, lead_id, event_id } = body;
  if (!email && !phone) {
    return new Response(JSON.stringify({ error: 'email or phone required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const user_data = {};
  if (email) user_data.em = [sha256(email)];
  if (phone) user_data.ph = [sha256(normalizePhone(phone))];
  if (nome) {
    const parts = String(nome).trim().split(/\s+/);
    user_data.fn = [sha256(parts[0])];
    if (parts.length > 1) user_data.ln = [sha256(parts.slice(1).join(' '))];
  }
  if (lead_id) user_data.lead_id = Number(lead_id);

  const payload = {
    data: [{
      action_source: 'system_generated',
      custom_data: {
        event_source: 'crm',
        lead_event_source: lp ? `Kairos LP - ${lp}` : 'Kairos LP'
      },
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: event_id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      user_data
    }]
  };

  try {
    const r = await fetch(`${ENDPOINT}?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await r.json();
    return new Response(JSON.stringify({ ok: r.ok, meta_response: result, sent: payload }), {
      status: r.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: '/api/capi-lead'
};
