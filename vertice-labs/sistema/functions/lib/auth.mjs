import { createHash, timingSafeEqual } from "node:crypto";

// Autenticação simples do painel: a senha (env ADMIN_PASSWORD) viaja como
// Authorization: Bearer <senha>. Comparação timing-safe sobre hashes SHA-256
// para não vazar tamanho nem conteúdo por timing.
export function isAdmin(req) {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) return false;
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const enviada = auth.slice(7);
  const a = createHash("sha256").update(enviada, "utf8").digest();
  const b = createHash("sha256").update(senha, "utf8").digest();
  return timingSafeEqual(a, b);
}
