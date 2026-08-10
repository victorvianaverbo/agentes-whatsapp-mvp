export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function erro(status, mensagem) {
  return json(status, { erro: mensagem });
}

export async function lerBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
