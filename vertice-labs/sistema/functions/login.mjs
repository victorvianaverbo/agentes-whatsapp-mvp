import { isAdmin } from "./lib/auth.mjs";
import { erro, lerBody } from "./lib/http.mjs";

export const config = { path: "/api/login" };

export default async (req) => {
  if (req.method !== "POST") return erro(405, "Método não permitido");
  const body = await lerBody(req);
  const senha = body && typeof body.senha === "string" ? body.senha : "";
  // Reaproveita a mesma comparação timing-safe do isAdmin
  const fake = new Request(req.url, { headers: { authorization: `Bearer ${senha}` } });
  if (!isAdmin(fake)) return erro(401, "Senha incorreta");
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
};
