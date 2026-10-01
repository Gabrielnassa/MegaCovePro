// Popula o banco de teste: resultados das 9 loterias (pela rota de tarefas) e um usuário de cada plano.
// Requer o servidor_local.js rodando. Senha de todos: senha123!
import postgres from "npm:postgres@3.4.5";
const API = "http://127.0.0.1:54400/functions/v1/api/";
const sql = postgres(Deno.env.get("TESTE_DB_URL") || "postgres://postgres@127.0.0.1:54329/megacover_teste", {prepare: false, max: 1});
for (const lot of ["megasena", "lotofacil", "quina", "lotomania", "duplasena", "timemania", "diadesorte", "supersete", "maismilionaria"]) {
  const d = JSON.parse(await Deno.readTextFile(new URL(`../../data/${lot}.json`, import.meta.url)));
  const r = await fetch(API + "tarefas/concursos", {method: "POST", headers: {"content-type": "application/json", "x-tarefa-token": "tarefa-teste"}, body: JSON.stringify({loteria: lot, concursos: d.concursos})});
  console.log(lot, r.status, (await r.json()).gravados);
}
const us = [["gratis@t.com", 10, null], ["teste@t.com", 2, null], ["pro@t.com", 40, "pro"], ["elite@t.com", 40, "elite"]];
for (const [email, dias, plano] of us) {
  const [u] = await sql`insert into auth.users (email, created_at, raw_user_meta_data) values (${email}, now() - make_interval(days => ${dias}), ${{nome: email.split("@")[0]}}::jsonb)
    on conflict (email) do update set email = excluded.email returning id`;
  if (plano) await sql`insert into public.assinaturas (user_id, plano, ciclo, status, valido_ate) values (${u.id}, ${plano}, 'mensal', 'ativa', now() + interval '20 days') on conflict (user_id) do nothing`;
  console.log("usuário", email, plano || (dias < 7 ? "teste Elite" : "grátis"));
}
await sql.end();
