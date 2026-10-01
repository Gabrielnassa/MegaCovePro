// "Supabase local" SÓ PARA TESTES: imita o Auth (login por senha), o REST mínimo usado pelo site
// e publica as funções api e asaas-webhook na mesma porta. Senha de todos os usuários: senha123!
// Rodar: deno run -A supabase/tests/servidor_local.js   (porta 54400)
import postgres from "npm:postgres@3.4.5";
const PORTA = +(Deno.env.get("PORTA") || 54400);
const DB_URL = Deno.env.get("TESTE_DB_URL") || "postgres://postgres@127.0.0.1:54329/megacover_teste";
Deno.env.set("SUPABASE_DB_URL", DB_URL);
Deno.env.set("SUPABASE_URL", "http://127.0.0.1:" + PORTA);
Deno.env.set("SUPABASE_ANON_KEY", "anon-teste");
Deno.env.set("TAREFA_TOKEN", Deno.env.get("TAREFA_TOKEN") || "tarefa-teste");
Deno.env.set("EMAIL_PROVEDOR", "teste");
Deno.env.set("ASAAS_WEBHOOK_TOKEN", Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "webhook-teste");
const { tratar: api } = await import("../functions/api/index.js");
const { tratar: webhook } = await import("../functions/asaas-webhook/index.js");
const sql = postgres(DB_URL, {prepare: false, max: 2});

const CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS, HEAD"};
const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (p) => b64({alg: "HS256", typ: "JWT"}) + "." + b64(p) + ".teste";
const payload = (tok) => { try { return JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return null; } };
const resp = (status, body) => new Response(body == null ? null : JSON.stringify(body), {status, headers: {...CORS, "content-type": "application/json"}});
const usuario = (u) => ({id: u.id, aud: "authenticated", role: "authenticated", email: u.email, user_metadata: u.raw_user_meta_data || {}, app_metadata: {provider: "email"}, created_at: u.created_at});

async function sessao(u) {
  const sid = crypto.randomUUID(), exp = Math.floor(Date.now() / 1000) + 3600;
  await sql`insert into auth.sessions (id, user_id) values (${sid}, ${u.id})`;
  return {access_token: jwt({sub: u.id, session_id: sid, exp, aud: "authenticated", role: "authenticated", email: u.email}),
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r-" + sid, user: usuario(u)};
}
async function tratar(req) {
  const url = new URL(req.url), p = url.pathname;
  if (req.method === "OPTIONS") return new Response("ok", {headers: CORS});
  if (p.startsWith("/functions/v1/api")) { const r = await api(req); const h = new Headers(r.headers); for (const [k, v] of Object.entries(CORS)) h.set(k, v); return new Response(r.body, {status: r.status, headers: h}); }
  if (p.startsWith("/functions/v1/asaas-webhook")) return webhook(req);
  if (p === "/auth/v1/token") {
    const b = await req.json();
    if (url.searchParams.get("grant_type") === "password") {
      const [u] = await sql`select * from auth.users where email = ${b.email}`;
      if (!u || b.password !== "senha123!") return resp(400, {error: "invalid_grant", error_description: "Invalid login credentials", msg: "Invalid login credentials", message: "Invalid login credentials"});
      return resp(200, await sessao(u));
    }
    const sid = String(b.refresh_token || "").replace(/^r-/, "");
    const [s] = await sql`select s.id, u.* from auth.sessions s join auth.users u on u.id = s.user_id where s.id = ${sid}`.catch(() => []);
    if (!s) return resp(400, {error: "invalid_grant", message: "Invalid Refresh Token"});
    const exp = Math.floor(Date.now() / 1000) + 3600;
    return resp(200, {access_token: jwt({sub: s.user_id || s.id, session_id: sid, exp}), token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r-" + sid, user: usuario(s)});
  }
  if (p === "/auth/v1/signup") {
    const b = await req.json();
    const [u] = await sql`insert into auth.users (email, raw_user_meta_data) values (${b.email}, ${(b.data || {})}::jsonb) returning *`;
    return resp(200, await sessao(u));
  }
  if (p === "/auth/v1/user") {
    const pl = payload((req.headers.get("authorization") || "").replace("Bearer ", ""));
    if (!pl || !pl.sub) return resp(401, {message: "invalid token"});
    const [u] = await sql`select * from auth.users where id = ${pl.sub}`;
    const [s] = pl.session_id ? await sql`select id from auth.sessions where id = ${pl.session_id}` : [null];
    if (!u || (pl.session_id && !s)) return resp(401, {message: "session not found"});
    return resp(200, usuario(u));
  }
  if (p === "/auth/v1/logout") return new Response(null, {status: 204, headers: CORS});
  if (p === "/rest/v1/assinaturas") {
    const pl = payload((req.headers.get("authorization") || "").replace("Bearer ", "")) || {};
    const rows = await sql`select plano, ciclo, status, valido_ate from public.assinaturas where user_id = ${pl.sub || null}`;
    return resp(200, rows);
  }
  return resp(404, {message: "não simulado: " + p});
}
Deno.serve({port: PORTA, onListen() { console.log("supabase local em http://127.0.0.1:" + PORTA); }}, tratar);
