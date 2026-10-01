// Testes da API: cada plano tenta cada recurso direto no servidor (sem passar pelo site).
// Rodar: PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh && deno test -A supabase/tests/api_test.js
import { sql, iniciarAuth, pararAuth, criarUsuario, novaSessao, chamar, eq } from "./ajuda.js";
import { tratar } from "../functions/api/index.js";
import { db } from "../functions/_shared/base.js";

const U = {};
const api = (m, r, o) => chamar(tratar, m, r, o);
const MEGA = [[5, 12, 23, 34, 45, 56], [1, 2, 3, 4, 5, 6]];

Deno.test({name: "API por plano", sanitizeOps: false, sanitizeResources: false, async fn(t) {
  iniciarAuth();
  // resultados carregados pela rota de tarefas (a mesma que o GitHub Actions vai usar)
  for (const lot of ["megasena", "lotofacil", "quina", "supersete"]) {
    const d = JSON.parse(await Deno.readTextFile(new URL(`../../data/${lot}.json`, import.meta.url)));
    const r = await api("POST", "tarefas/concursos", {cab: {"x-tarefa-token": "tarefa-teste"}, corpo: {loteria: lot, concursos: d.concursos}});
    eq(r.status, 200, "carga " + lot);
  }
  eq((await api("POST", "tarefas/concursos", {corpo: {loteria: "megasena", concursos: []}})).status, 401, "tarefa sem token");

  U.gratis = await criarUsuario("gratis@t.com", {diasDeConta: 10});
  U.teste = await criarUsuario("teste@t.com", {diasDeConta: 2});
  U.pro = await criarUsuario("pro@t.com", {diasDeConta: 40, assinatura: {plano: "pro"}});
  U.elite = await criarUsuario("elite@t.com", {diasDeConta: 40, assinatura: {plano: "elite", ciclo: "anual"}});

  await t.step("config é pública e não expõe as matrizes", async () => {
    const r = await api("GET", "config");
    eq(r.status, 200, "config"); eq(r.dados.regras.planos.length, 3, "planos");
    eq(r.dados.fechamentos.every((f) => !f.jogos && f.qtdJogos > 0), true, "catálogo sem matrizes");
  });
  await t.step("sem login → 401", async () => {
    eq((await api("GET", "me")).status, 401, "me sem token");
    eq((await api("GET", "me", {tok: "lixo"})).status, 401, "token inválido");
  });
  await t.step("me: plano efetivo e teste de 7 dias", async () => {
    const g = (await api("GET", "me", {tok: U.gratis.tok})).dados, te = (await api("GET", "me", {tok: U.teste.tok})).dados;
    const p = (await api("GET", "me", {tok: U.pro.tok})).dados, e = (await api("GET", "me", {tok: U.elite.tok})).dados;
    eq([g.plano, g.origem], ["gratis", "gratis"], "grátis");
    eq([te.plano, te.origem, te.teste.diasRestantes], ["elite", "teste", 5], "teste com 5 dias");
    eq(te.teste.perdas.length > 10, true, "lista do que perderia");
    eq([p.plano, e.plano, e.origem], ["pro", "elite", "assinatura"], "pagos");
  });
  await t.step("loterias liberadas por plano", async () => {
    eq((await api("GET", "concursos?loteria=megasena", {tok: U.gratis.tok})).status, 200, "grátis mega");
    const q = await api("GET", "concursos?loteria=quina", {tok: U.gratis.tok});
    eq([q.status, q.dados.erro, q.dados.planoMinimo.id], [403, "plano", "pro"], "grátis quina bloqueada");
    eq((await api("GET", "concursos?loteria=quina", {tok: U.pro.tok})).status, 200, "pro quina");
  });
  await t.step("histórico: 50 concursos no grátis, completo no pro", async () => {
    const g = (await api("GET", "concursos?loteria=megasena", {tok: U.gratis.tok})).dados;
    const p = (await api("GET", "concursos?loteria=megasena", {tok: U.pro.tok})).dados;
    eq([g.concursos.length, g.limitado], [50, true], "grátis");
    eq([p.concursos.length === p.total, p.limitado, p.total > 3000], [true, false, true], "pro");
  });
  await t.step("gerador: limite, ponderado e filtros", async () => {
    const base = {loteria: "megasena", dezenas: 6, estrategia: "Alta cobertura"};
    eq((await api("POST", "gerar", {tok: U.gratis.tok, corpo: {...base, jogos: 10}})).dados.jogos.length, 10, "grátis 10");
    eq((await api("POST", "gerar", {tok: U.gratis.tok, corpo: {...base, jogos: 11}})).status, 403, "grátis 11");
    eq((await api("POST", "gerar", {tok: U.gratis.tok, corpo: {...base, jogos: 5, estrategia: "Estatística"}})).status, 403, "grátis ponderado");
    eq((await api("POST", "gerar", {tok: U.gratis.tok, corpo: {...base, jogos: 5, filtros: {balancear_pares: true}}})).status, 403, "grátis filtros");
    const p = await api("POST", "gerar", {tok: U.pro.tok, corpo: {...base, jogos: 80, estrategia: "Estatística", filtros: {balancear_pares: true, controlar_soma: true}}});
    eq([p.status, p.dados.jogos.length, p.dados.scores.length], [200, 80, 80], "pro 80 ponderado com filtros");
    eq((await api("POST", "gerar", {tok: U.pro.tok, corpo: {loteria: "supersete", jogos: 3, porColuna: 1, estrategia: "Estatística"}})).dados.jogos.length, 3, "pro super sete");
  });
  await t.step("estatísticas básicas x completas e gráficos", async () => {
    const g = (await api("GET", "estatisticas?loteria=megasena", {tok: U.gratis.tok})).dados;
    const p = (await api("GET", "estatisticas?loteria=megasena", {tok: U.pro.tok})).dados;
    eq([g.nivel, !!g.frequencias, !!g.atrasos, !!g.tendencia], ["basicas", true, true, false], "grátis básicas");
    eq([p.nivel, !!p.tendencia], ["completas", true], "pro completas");
    eq((await api("GET", "padroes?loteria=megasena", {tok: U.gratis.tok})).status, 403, "grátis sem gráficos");
    eq((await api("GET", "padroes?loteria=megasena", {tok: U.pro.tok})).status, 200, "pro gráficos");
  });
  await t.step("otimizadores: só Elite, 20 por dia", async () => {
    const c = {loteria: "megasena", metodo: "Otimização Elite", jogos: MEGA};
    eq((await api("POST", "otimizar", {tok: U.pro.tok, corpo: c})).dados.planoMinimo.id, "elite", "pro bloqueado");
    let ult;
    for (let i = 0; i < 20; i++) ult = await api("POST", "otimizar", {tok: U.elite.tok, corpo: c});
    eq([ult.status, ult.dados.uso.usado, ult.dados.uso.limite], [200, 20, 20], "20ª execução");
    const x = await api("POST", "otimizar", {tok: U.elite.tok, corpo: c});
    eq([x.status, x.dados.erro], [429, "limite_diario"], "21ª bloqueada");
  });
  await t.step("Monte Carlo: só Elite, 10 por dia, zera no dia seguinte", async () => {
    const c = {loteria: "megasena", jogos: MEGA, simulacoes: 20000};
    eq((await api("POST", "montecarlo", {tok: U.gratis.tok, corpo: c})).status, 403, "grátis");
    for (let i = 0; i < 10; i++) eq((await api("POST", "montecarlo", {tok: U.elite.tok, corpo: c})).status, 200, "execução " + (i + 1));
    eq((await api("POST", "montecarlo", {tok: U.elite.tok, corpo: c})).status, 429, "11ª");
    await sql`update public.uso_diario set dia = dia - 1 where user_id = ${U.elite.id}`;   // simula a virada do dia
    eq((await api("POST", "montecarlo", {tok: U.elite.tok, corpo: c})).status, 200, "dia seguinte");
    const me = (await api("GET", "me", {tok: U.elite.tok})).dados;
    eq([me.usoHoje.monteCarlo.usado, me.usoHoje.otimizador.usado], [1, 0], "contadores de hoje");
  });
  await t.step("fechamentos prontos e personalizado", async () => {
    const l = (await api("GET", "fechamentos?loteria=megasena", {tok: U.gratis.tok})).dados.fechamentos;
    eq(l.filter((f) => f.permitido).map((f) => f.id), ["megasena-9-quadra"], "grátis vê só o exemplo da mega");
    const a = await api("POST", "fechamentos/aplicar", {tok: U.gratis.tok, corpo: {id: "megasena-9-quadra", dezenas: [3, 7, 11, 19, 24, 33, 41, 50, 58]}});
    eq([a.status, a.dados.jogos.length, a.dados.jogos.every((j) => j.length === 6)], [200, 12, true], "aplica o exemplo");
    eq((await api("POST", "fechamentos/aplicar", {tok: U.gratis.tok, corpo: {id: "megasena-12-quadra", dezenas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}})).status, 403, "grátis 12 dezenas");
    eq((await api("POST", "fechamentos/aplicar", {tok: U.pro.tok, corpo: {id: "megasena-12-quadra", dezenas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}})).status, 200, "pro 12 dezenas");
    const per = {loteria: "megasena", base: [1, 5, 9, 13, 17, 21, 25, 29, 33], perfil: "Equilibrado", garantia: "Quadra", tamanho: 6};
    eq((await api("POST", "fechamento", {tok: U.gratis.tok, corpo: per})).status, 403, "grátis personalizado");
    const pp = await api("POST", "fechamento", {tok: U.pro.tok, corpo: per});
    eq([pp.status, pp.dados.jogos.length > 0], [200, true], "pro personalizado");
  });
  await t.step("jogos salvos: 20 no grátis, ilimitado no pro", async () => {
    const um = (i) => ({dezenas: [1, 2, 3, 4, 5, 7 + i], nome: "J" + i});
    const g = await api("POST", "jogos", {tok: U.gratis.tok, corpo: {loteria: "megasena", jogos: Array.from({length: 20}, (_, i) => um(i))}});
    eq(g.status, 200, "20 salvos");
    const g2 = await api("POST", "jogos", {tok: U.gratis.tok, corpo: {loteria: "megasena", jogos: [um(30)]}});
    eq([g2.status, g2.dados.recurso], [403, "jogosSalvos"], "21º bloqueado");
    eq((await api("POST", "jogos", {tok: U.pro.tok, corpo: {loteria: "megasena", jogos: Array.from({length: 30}, (_, i) => um(i))}})).status, 200, "pro 30");
    const lista = (await api("GET", "jogos?loteria=megasena", {tok: U.gratis.tok})).dados;
    eq([lista.jogos.length, lista.limite], [20, 20], "lista do grátis");
    const del = await api("DELETE", "jogos?id=" + lista.jogos[0].id, {tok: U.pro.tok});
    eq(del.dados.apagados, 0, "não apaga jogo de outra pessoa");
  });
  await t.step("conferência liberada para todos", async () => {
    const r = await api("POST", "conferir", {tok: U.gratis.tok, corpo: {loteria: "megasena", jogos: MEGA, ultimos: 5}});
    eq([r.status, r.dados.acertos.length, r.dados.acertos[0].length], [200, 2, 5], "grátis confere");
    const r2 = await api("POST", "conferir", {tok: U.gratis.tok, corpo: {loteria: "megasena", jogos: MEGA, ultimos: 500}});
    eq(r2.dados.concursos.length, 50, "grátis só nos últimos 50");
  });
  await t.step("exportação e relatórios", async () => {
    const c = {loteria: "megasena", jogos: MEGA};
    eq((await api("POST", "exportar", {tok: U.gratis.tok, corpo: {...c, formato: "csv"}})).status, 403, "grátis csv");
    eq((await api("POST", "exportar", {tok: U.gratis.tok, corpo: {...c, formato: "pdf"}})).status, 403, "grátis pdf");
    const csv = await api("POST", "exportar", {tok: U.pro.tok, corpo: {...c, formato: "csv"}});
    eq([csv.status, csv.tipo.startsWith("text/csv")], [200, true], "pro csv");
    const ps = await api("POST", "exportar", {tok: U.pro.tok, corpo: {...c, formato: "pdf", tipo: "simples"}});
    eq([ps.status, new TextDecoder().decode(ps.dados.slice(0, 5))], [200, "%PDF-"], "pro pdf simples");
    eq((await api("POST", "exportar", {tok: U.pro.tok, corpo: {...c, formato: "pdf", tipo: "completo"}})).status, 403, "pro pdf completo");
    const pc = await api("POST", "exportar", {tok: U.elite.tok, corpo: {...c, formato: "pdf", tipo: "completo"}});
    eq([pc.status, pc.dados.length > ps.dados.length], [200, true], "elite pdf completo");
    await Deno.writeFile("/tmp/relatorio_elite.pdf", pc.dados);
  });
  await t.step("sessões simultâneas: 1 no grátis, 2 no elite", async () => {
    const a = U.gratis, b = await novaSessao(a);
    eq((await api("POST", "sessao", {tok: a.tok})).status, 200, "sessão A");
    eq((await api("POST", "sessao", {tok: b.tok})).status, 200, "sessão B");
    const r = await api("GET", "me", {tok: a.tok});
    eq([r.status, r.dados.erro], [401, "sessao_encerrada"], "A foi derrubada");
    eq((await api("GET", "me", {tok: b.tok})).status, 200, "B continua");
    const e1 = U.elite, e2 = await novaSessao(e1), e3 = await novaSessao(e1);
    for (const s of [e1, e2]) eq((await api("POST", "sessao", {tok: s.tok})).status, 200, "elite 1 e 2");
    eq((await api("GET", "me", {tok: e1.tok})).status, 200, "elite: 2 sessões convivem");
    await new Promise((r) => setTimeout(r, 15));
    eq((await api("POST", "sessao", {tok: e3.tok})).status, 200, "elite 3ª");
    eq((await api("GET", "me", {tok: e1.tok})).dados.erro, "sessao_encerrada", "elite: a mais antiga cai");
    eq((await api("GET", "me", {tok: e2.tok})).status, 200, "elite: a 2ª continua");
    U.elite = e3; U.gratis = b;
  });
  await t.step("suporte: só pagos, Elite marcado como prioritário", async () => {
    const c = {assunto: "Dúvida no fechamento", mensagem: "Como uso o fechamento de 12 dezenas?"};
    eq((await api("POST", "suporte", {tok: U.gratis.tok, corpo: c})).status, 403, "grátis vai para a FAQ");
    const p = await api("POST", "suporte", {tok: U.pro.tok, corpo: c});
    const e = await api("POST", "suporte", {tok: U.elite.tok, corpo: c});
    eq([p.dados.prioritario, p.dados.prazoHoras, e.dados.prioritario, e.dados.prazoHoras], [false, 48, true, 24], "prazos");
    const m = await sql`select assunto, status from public.emails_enviados where tipo = 'suporte' order by id`;
    eq(m.map((x) => x.assunto), ["[Pro] Dúvida no fechamento", "[ELITE · PRIORITÁRIO] Dúvida no fechamento"], "assuntos");
    eq(m.every((x) => x.status === "teste"), true, "modo de teste não envia");
  });
  await db().end(); await pararAuth();
}});
