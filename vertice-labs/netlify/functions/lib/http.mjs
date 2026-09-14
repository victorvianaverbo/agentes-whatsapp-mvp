export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

// `extra` é opcional e entra no corpo ao lado de `erro` — usado para
// `{ codigo: "..." }`, que a página lê para decidir o que mostrar.
export function erro(status, mensagem, extra) {
  return json(status, extra ? { erro: mensagem, ...extra } : { erro: mensagem });
}

export async function lerBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
