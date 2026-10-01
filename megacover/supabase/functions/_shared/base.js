// Base das funções do servidor: banco, autenticação, plano efetivo, bloqueios e limites.
// Toda decisão de plano passa por exigir()/consumir(), que leem regras.json via permissoes.js.
import postgres from "npm:postgres@3.4.5";
import "./engine.js";
import "./permissoes.js";
import REGRAS from "./regras.json" with { type: "json" };
import FECH from "./fechamentos.json" with { type: "json" };

export const MC = globalThis.MC;
export const PERM = globalThis.MC_PERM;
export const R = REGRAS;
export const CATALOGO = FECH.catalogo;
export const env = (k, d) => Deno.env.get(k) ?? d;

let _sql = null;
export function db() {
  if (!_sql) _sql = postgres(env("SUPABASE_DB_URL"), {prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10});
  return _sql;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};
export function json(status, body) {
  return new Response(JSON.stringify(body), {status, headers: {...CORS, "content-type": "application/json; charset=utf-8"}});
}
export class ErroApi extends Error {
  constructor(status, codigo, mensagem, extra) { super(mensagem); this.status = status; this.codigo = codigo; this.extra = extra || {}; }
}
export function falha(status, codigo, mensagem, extra) { throw new ErroApi(status, codigo, mensagem, extra); }

/* ---------- autenticação: o próprio Supabase Auth confirma o token ---------- */
function payloadJwt(tok) {
  try { return JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return {}; }
}
export async function autenticar(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!tok) falha(401, "login", "Entre na sua conta para continuar.");
  const r = await fetch(env("SUPABASE_URL") + "/auth/v1/user", {headers: {Authorization: "Bearer " + tok, apikey: env("SUPABASE_ANON_KEY")}});
  if (!r.ok) {
    // sessão derrubada por login em outro aparelho: o Auth recusa o token; a mensagem certa vem da nossa tabela
    const sid = payloadJwt(tok).session_id;
    if (sid) {
      const [s] = await db()`select revogada from public.sessoes where session_id = ${sid}::uuid`.catch(() => []);
      if (s && s.revogada) falha(401, "sessao_encerrada", "Sua conta foi acessada em outro aparelho e esta sessão foi encerrada. Entre novamente para continuar.");
    }
    falha(401, "login", "Sua sessão expirou. Entre novamente.");
  }
  const u = await r.json();
  if (!u || !u.id) falha(401, "login", "Sua sessão expirou. Entre novamente.");
  return {id: u.id, email: u.email, meta: u.user_metadata || {}, sessionId: payloadJwt(tok).session_id || null};
}

/* ---------- contexto da requisição: plano efetivo + controle de sessões (uma ida ao banco) ---------- */
export async function contexto(req) {
  const u = await autenticar(req);
  const sess = {};
  for (const p of R.planos) sess[p.id] = PERM.limites(R, p.id).sessoes;
  const [c] = await db()`select * from public.contexto_api(${u.id}::uuid, ${u.sessionId}::uuid, ${R.teste.dias}::int,
    ${R.toleranciaAtrasoDias}::int, ${R.teste.plano}, ${sess}::jsonb, ${(req.headers.get("user-agent") || "").slice(0, 200)})`;
  if (c.sessao === "encerrada")
    falha(401, "sessao_encerrada", "Sua conta foi acessada em outro aparelho e esta sessão foi encerrada. Entre novamente para continuar.");
  return {usuario: u, plano: c.plano, origem: c.origem, testeAte: c.teste_ate, validoAte: c.valido_ate, status: c.status,
          limites: PERM.limites(R, c.plano)};
}

/* ---------- bloqueios ---------- */
export function exigir(ctx, recurso, valor) {
  const r = PERM.pode(R, ctx.plano, recurso, valor);
  if (!r.ok) {
    const min = r.planoMinimo ? r.planoMinimo.nome : "pago";
    falha(403, "plano", `${r.nome} faz parte do plano ${min}.`, {recurso, nome: r.nome, planoMinimo: r.planoMinimo, planoAtual: ctx.plano});
  }
}
/* contador diário (otimizadores e Monte Carlo): zera à meia-noite de Brasília */
export async function consumir(ctx, recurso) {
  exigir(ctx, recurso);
  const lim = PERM.limiteDiario(R, ctx.plano, recurso);
  const [{n}] = await db()`select public.consumir_uso(${ctx.usuario.id}::uuid, ${recurso}, ${lim}::int) as n`;
  if (n < 0)
    falha(429, "limite_diario", `Você já usou as ${lim} execuções de hoje. O limite volta à meia-noite (horário de Brasília).`, {recurso, limite: lim});
  return {usado: n, limite: lim};
}

/* ---------- dados ---------- */
export function cfgDe(loteria) {
  const c = MC.TODAS[loteria];
  if (!c) falha(400, "invalido", "Loteria desconhecida.");
  return c;
}
const cache = new Map();   // loteria → {quando, rows}
export async function concursosDe(loteria) {
  const c = cache.get(loteria);
  if (c && Date.now() - c.quando < 120000) return c.rows;
  const rows = (await db()`select concurso, data, dezenas, extra from public.concursos where loteria = ${loteria} order by concurso`)
    .map((r) => [r.concurso, r.data, r.dezenas, r.extra]);
  cache.set(loteria, {quando: Date.now(), rows});
  return rows;
}
export function limparCache(loteria) { if (loteria) cache.delete(loteria); else cache.clear(); }
/* histórico liberado para o plano (ex.: últimos 50 concursos no Grátis) */
export async function historico(ctx, loteria) {
  exigir(ctx, "loteria", loteria);
  const rows = await concursosDe(loteria), n = ctx.limites.historicoConcursos;
  return n == null ? rows : rows.slice(-n);
}
export function paraConcursos(cfg, rows) { return rows.map((r) => MC.rowParaConcurso(cfg, r)); }

/* ---------- validação de jogos recebidos ---------- */
export function validarJogos(cfg, jogos, teto) {
  if (!Array.isArray(jogos) || !jogos.length) falha(400, "invalido", "Envie ao menos um jogo.");
  if (jogos.length > (teto || R.tetoTecnico.jogosPorRequisicao)) falha(400, "invalido", `Envie no máximo ${teto || R.tetoTecnico.jogosPorRequisicao} jogos por vez.`);
  return jogos.map((j, i) => {
    if (cfg.colunar) {
      if (!Array.isArray(j) || j.length !== cfg.colunas || j.some((c) => !Array.isArray(c) || !c.length || c.some((d) => !Number.isInteger(d) || d < 0 || d > 9)))
        falha(400, "invalido", `Jogo ${i + 1}: o Super Sete precisa de ${cfg.colunas} colunas com dígitos de 0 a 9.`);
      return j.map((c) => Array.from(new Set(c)).sort((a, b) => a - b));
    }
    if (!Array.isArray(j)) falha(400, "invalido", `Jogo ${i + 1} inválido.`);
    const s = Array.from(new Set(j.map(Number)));
    if (s.some((d) => !Number.isInteger(d) || d < cfg.inicio || d > cfg.universo)) falha(400, "invalido", `Jogo ${i + 1}: dezenas devem ficar entre ${cfg.inicio} e ${cfg.universo}.`);
    if (s.length < cfg.aposta_min || s.length > cfg.aposta_max) falha(400, "invalido", `Jogo ${i + 1}: use de ${cfg.aposta_min} a ${cfg.aposta_max} dezenas.`);
    return s.sort((a, b) => a - b);
  });
}
export async function lerCorpo(req) {
  if (req.method === "GET" || req.method === "DELETE") return {};
  try { return await req.json(); } catch { falha(400, "invalido", "Corpo da requisição inválido."); }
}
