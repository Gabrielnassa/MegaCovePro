// Ambiente de teste local: Postgres comum + stub do Supabase Auth. Nada aqui vai para produção.
// Requer: banco criado por tests/preparar.sh (TESTE_DB_URL).
import postgres from "npm:postgres@3.4.5";

export const DB_URL = Deno.env.get("TESTE_DB_URL") || "postgres://postgres@127.0.0.1:54329/megacover_teste";
const PORTA_AUTH = 54400;
Deno.env.set("SUPABASE_DB_URL", DB_URL);
Deno.env.set("SUPABASE_URL", "http://127.0.0.1:" + PORTA_AUTH);
Deno.env.set("SUPABASE_ANON_KEY", "anon-teste");
Deno.env.set("TAREFA_TOKEN", "tarefa-teste");
Deno.env.set("EMAIL_PROVEDOR", "teste");
Deno.env.set("SUPORTE_EMAIL", "suporte@teste.local");
Deno.env.set("ASAAS_WEBHOOK_TOKEN", "webhook-teste");

export const sql = postgres(DB_URL, {prepare: false, max: 2});

/* stub do GET /auth/v1/user: aceita tokens "x.<payload base64url>.y" de usuários que existem em auth.users */
let servidor = null;
export function iniciarAuth() {
  if (servidor) return;
  servidor = Deno.serve({port: PORTA_AUTH, onListen() {}}, async (req) => {
    const tok = (req.headers.get("authorization") || "").replace("Bearer ", "");
    try {
      const p = JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const [u] = await sql`select id, email, raw_user_meta_data from auth.users where id = ${p.sub}`;
      if (!u) return new Response("{}", {status: 401});
      return Response.json({id: u.id, email: u.email, user_metadata: u.raw_user_meta_data});
    } catch { return new Response("{}", {status: 401}); }
  });
}
export async function pararAuth() { if (servidor) { await servidor.shutdown(); servidor = null; } await sql.end(); }

const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export function token(uid, sid) { return "e30." + b64({sub: uid, session_id: sid}) + ".assinatura"; }

/* cria um usuário com idade da conta e (opcional) assinatura */
export async function criarUsuario(email, {diasDeConta = 0, assinatura = null} = {}) {
  const [u] = await sql`insert into auth.users (email, created_at, raw_user_meta_data)
    values (${email}, now() - make_interval(days => ${diasDeConta}), ${{nome: email.split("@")[0]}}::jsonb) returning id`;
  if (assinatura) await sql`insert into public.assinaturas (user_id, plano, ciclo, status, valido_ate)
    values (${u.id}, ${assinatura.plano}, ${assinatura.ciclo || "mensal"}, ${assinatura.status || "ativa"}, now() + interval '20 days')`;
  const sid = crypto.randomUUID();
  await sql`insert into auth.sessions (id, user_id) values (${sid}, ${u.id})`;
  return {id: u.id, email, sid, tok: token(u.id, sid)};
}
export async function novaSessao(u) {
  const sid = crypto.randomUUID();
  await sql`insert into auth.sessions (id, user_id) values (${sid}, ${u.id})`;
  return {...u, sid, tok: token(u.id, sid)};
}

/* chama a API como o navegador faria */
export async function chamar(tratar, metodo, rota, {tok, corpo, cab = {}} = {}) {
  const h = {...cab}; if (tok) h.authorization = "Bearer " + tok; if (corpo) h["content-type"] = "application/json";
  const r = await tratar(new Request("http://local/functions/v1/api/" + rota, {method: metodo, headers: h, body: corpo ? JSON.stringify(corpo) : undefined}));
  const tipo = r.headers.get("content-type") || "";
  const dados = tipo.includes("json") ? await r.json() : new Uint8Array(await r.arrayBuffer());
  return {status: r.status, dados, tipo};
}
export function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); }
