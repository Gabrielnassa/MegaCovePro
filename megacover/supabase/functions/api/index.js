// API do MegaCover (Supabase Edge Function "api"). Endereço: https://<projeto>.supabase.co/functions/v1/api/<rota>
// Toda rota que depende de plano chama contexto() + exigir()/consumir(): a verificação acontece aqui, no servidor.
import {
  MC, PERM, R, CATALOGO, db, env, json, falha, ErroApi, CORS, contexto, exigir, consumir, cfgDe,
  historico, paraConcursos, validarJogos, lerCorpo, concursosDe, limparCache,
} from "../_shared/base.js";
import { csv, pdf } from "../_shared/relatorio.js";
import { enviarEmail, moldura, esc } from "../_shared/email.js";
import * as asaas from "../_shared/asaas.js";
import { avisarResultados } from "../_shared/avisos.js";

const DIA = 86400000;
const rotas = {};
const rota = (metodo, caminho, fn) => { rotas[metodo + " " + caminho] = fn; };
const regrasPublicas = () => { const r = {...R}; delete r._leia; return r; };

/* ---------- públicas ---------- */
rota("GET", "config", () => json(200, {
  regras: regrasPublicas(),
  fechamentos: CATALOGO.map(({jogos, ...f}) => ({...f, qtdJogos: jogos.length})),
}));

/* ---------- conta ---------- */
rota("GET", "me", async (req) => {
  const ctx = await contexto(req), uid = ctx.usuario.id, sql = db();
  const [perfil] = await sql`select nome, aviso_email, cpf is not null as tem_cpf from public.perfis where user_id = ${uid}`;
  const [ass] = await sql`select plano, ciclo, forma, status, valido_ate, valor from public.assinaturas where user_id = ${uid}`;
  const uso = Object.fromEntries((await sql`select recurso, qtd from public.uso_hoje(${uid}::uuid)`).map((x) => [x.recurso, x.qtd]));
  const [{n}] = await sql`select count(*)::int n from public.jogos_salvos where user_id = ${uid}`;
  const restante = ctx.origem === "teste" && ctx.testeAte ? Math.max(0, Math.ceil((new Date(ctx.testeAte) - Date.now()) / DIA)) : 0;
  const p = PERM.plano(R, ctx.plano);
  return json(200, {
    usuario: {id: uid, email: ctx.usuario.email, nome: (perfil && perfil.nome) || ctx.usuario.meta.nome || ""},
    plano: ctx.plano, planoNome: p ? p.nome : ctx.plano, origem: ctx.origem,
    teste: ctx.origem === "teste" ? {ate: ctx.testeAte, diasRestantes: restante, perdas: PERM.perdas(R, R.teste.plano, "gratis")} : null,
    assinatura: ass || null, limites: ctx.limites,
    usoHoje: {
      otimizador: {usado: uso.otimizador || 0, limite: PERM.limiteDiario(R, ctx.plano, "otimizador")},
      monteCarlo: {usado: uso.monteCarlo || 0, limite: PERM.limiteDiario(R, ctx.plano, "monteCarlo")},
    },
    jogosSalvos: {usados: n, limite: ctx.limites.jogosSalvos},
    avisoEmail: perfil ? perfil.aviso_email : true, temCpf: perfil ? perfil.tem_cpf : false,
  });
});
rota("POST", "sessao", async (req) => { await contexto(req); return json(200, {ok: true}); });
rota("PATCH", "perfil", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), uid = ctx.usuario.id;
  if (b.aviso_email != null) {
    if (b.aviso_email) exigir(ctx, "avisoEmail");
    await db()`update public.perfis set aviso_email = ${!!b.aviso_email} where user_id = ${uid}`;
  }
  if (b.nome != null) await db()`update public.perfis set nome = ${String(b.nome).slice(0, 80)} where user_id = ${uid}`;
  return json(200, {ok: true});
});

/* ---------- resultados e estatísticas ---------- */
rota("GET", "concursos", async (req, url) => {
  const ctx = await contexto(req), lot = url.searchParams.get("loteria"); cfgDe(lot);
  const rows = await historico(ctx, lot), todos = await concursosDe(lot);
  return json(200, {loteria: lot, concursos: rows, total: todos.length, limitado: rows.length < todos.length, limite: ctx.limites.historicoConcursos});
});
rota("GET", "estatisticas", async (req, url) => {
  const ctx = await contexto(req), lot = url.searchParams.get("loteria"), cfg = cfgDe(lot);
  const c = paraConcursos(cfg, await historico(ctx, lot)), completas = PERM.pode(R, ctx.plano, "estatisticasCompletas").ok;
  const out = {loteria: lot, nivel: completas ? "completas" : "basicas", concursos: c.length};
  if (cfg.colunar) {
    out.porColuna = MC.porColuna(c, cfg);
    out.atrasoPorColuna = Array.from({length: cfg.colunas}, (_, col) => {
      const ult = {}; c.forEach((x, i) => { ult[x.dezenas[col]] = i; });
      return Object.fromEntries(cfg.dezenas.map((d) => [d, ult[d] == null ? c.length : c.length - 1 - ult[d]]));
    });
    return json(200, out);
  }
  out.frequencias = MC.frequencias(c, cfg);
  out.atrasos = MC.atrasos(c, cfg);
  if (completas) {
    const jan = Math.min(500, Math.max(5, +url.searchParams.get("janela") || 20));
    out.tendencia = MC.tendencia(c, cfg, jan); out.janela = jan;
    if (cfg.extra_nome) { out.extras = MC.frequenciaExtras(c, cfg); out.atrasoExtras = MC.atrasoExtras(c, cfg); }
  }
  return json(200, out);
});
rota("GET", "padroes", async (req, url) => {
  const ctx = await contexto(req), lot = url.searchParams.get("loteria"), cfg = cfgDe(lot);
  exigir(ctx, "graficos");
  const c = paraConcursos(cfg, await historico(ctx, lot));
  if (cfg.colunar) {
    let rep = 0; for (let i = 1; i < c.length; i++) for (let k = 0; k < 7; k++) if (c[i].dezenas[k] === c[i - 1].dezenas[k]) rep++;
    return json(200, {loteria: lot, colunar: true, somas: c.map((x) => MC.soma(x.dezenas)), repeticaoMedia: rep / Math.max(1, c.length - 1)});
  }
  const rp = MC.mediaRepeticao(c, cfg);
  let pr = 0, ns = 0; c.forEach((x) => MC.sorteiosDe(x, cfg).forEach((st) => { pr += MC.primos(st); ns++; }));
  const out = {loteria: lot, paresImpares: MC.distParesImpares(c, cfg).mostCommon(), somas: MC.distSomas(c, cfg),
    sequencias: MC.distSequencias(c, cfg).mostCommon(), repeticao: {media: rp.media, dist: rp.dist.mostCommon()},
    faixas: MC.distFaixasHistorica(c, cfg), limitesSoma: MC.limitesSoma(cfg.sorteadas, cfg), primosMedia: ns ? pr / ns : 0};
  if (lot === "lotofacil") { let mm = 0; c.forEach((x) => { mm += MC.molduraMiolo(x.dezenas)[1]; }); out.mioloMedia = c.length ? mm / c.length : 0; }
  return json(200, out);
});

/* ---------- gerador ---------- */
const FILTROS_DESLIGADOS = () => { const f = {soma_min: null, soma_max: null}; MC.FILTROS.forEach((x) => { f[x[0]] = false; }); return f; };
rota("POST", "gerar", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria);
  const n = Math.floor(+b.jogos || 0);
  if (n < 1) falha(400, "invalido", "Informe quantos jogos gerar.");
  exigir(ctx, "geradorJogos", n);
  if (n > R.tetoTecnico.jogosPorGeracao) falha(400, "invalido", `Gere no máximo ${R.tetoTecnico.jogosPorGeracao} jogos por vez.`);
  const estr = b.estrategia || "Alta cobertura";
  if (MC.ESTRATEGIAS.indexOf(estr) < 0) falha(400, "invalido", "Estratégia desconhecida.");
  if (estr !== "Alta cobertura") exigir(ctx, "geradorPonderado");           // "Alta cobertura" = aleatório puro
  const f = b.filtros && typeof b.filtros === "object" ? b.filtros : null;
  const usaFiltro = f && (MC.FILTROS.some((x) => f[x[0]]) || f.soma_min || f.soma_max);
  if (usaFiltro) exigir(ctx, "filtros");
  const c = paraConcursos(cfg, await historico(ctx, b.loteria));
  let jogos;
  if (cfg.colunar) {
    const porCol = Math.max(1, Math.min(3, Math.floor(+b.porColuna || 1)));
    jogos = MC.gerarColunar(c, cfg, porCol, n, estr);
  } else {
    const nd = Math.floor(+b.dezenas || cfg.aposta_min);
    if (nd < cfg.aposta_min || nd > cfg.aposta_max) falha(400, "invalido", `Use de ${cfg.aposta_min} a ${cfg.aposta_max} dezenas.`);
    jogos = MC.gerarJogos(c, cfg, nd, n, estr, usaFiltro ? f : FILTROS_DESLIGADOS());
  }
  const ctxEst = !cfg.colunar && c.length ? MC.contexto(c, cfg) : null;
  return json(200, {jogos, scores: ctxEst ? jogos.map((j) => MC.megascore(j, cfg, ctxEst)) : null});
});

/* ---------- Elite: otimizadores e Monte Carlo (com limite diário) ---------- */
rota("POST", "otimizar", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria); exigir(ctx, "otimizador");
  if (cfg.colunar) falha(400, "invalido", "O otimizador não se aplica ao Super Sete.");
  if (MC.METODOS.indexOf(b.metodo) < 0) falha(400, "invalido", "Método desconhecido.");
  const jogos = validarJogos(cfg, b.jogos, 50);
  const uso = await consumir(ctx, "otimizador");
  const c = paraConcursos(cfg, await historico(ctx, b.loteria));
  const r = await MC.otimizar(b.metodo, c, jogos, cfg, null);
  return json(200, {...r, uso});
});
rota("POST", "montecarlo", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria); exigir(ctx, "monteCarlo");
  const jogos = validarJogos(cfg, b.jogos, 100);
  const n = Math.min(1000000, Math.max(1000, Math.floor(+b.simulacoes || 10000)));
  const uso = await consumir(ctx, "monteCarlo");
  const r = await MC.monteCarlo(jogos, cfg, n, null);
  return json(200, {resultado: r, simulacoes: n, uso});
});

/* ---------- fechamentos ---------- */
rota("GET", "fechamentos", async (req, url) => {
  const ctx = await contexto(req), lot = url.searchParams.get("loteria");
  const lista = CATALOGO.filter((f) => !lot || f.loteria === lot).map(({jogos, ...f}) => ({
    ...f, qtdJogos: jogos.length,
    permitido: PERM.pode(R, ctx.plano, "fechamentoPronto", f.id).ok && PERM.pode(R, ctx.plano, "loteria", f.loteria).ok,
  }));
  return json(200, {fechamentos: lista});
});
rota("POST", "fechamentos/aplicar", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req);
  const f = CATALOGO.find((x) => x.id === b.id);
  if (!f) falha(404, "invalido", "Fechamento não encontrado.");
  exigir(ctx, "loteria", f.loteria); exigir(ctx, "fechamentoPronto", f.id);
  const cfg = cfgDe(f.loteria), dz = Array.from(new Set((b.dezenas || []).map(Number)));
  if (dz.length !== f.dezenas || dz.some((d) => !Number.isInteger(d) || d < cfg.inicio || d > cfg.universo))
    falha(400, "invalido", `Escolha exatamente ${f.dezenas} dezenas entre ${cfg.inicio} e ${cfg.universo}.`);
  const ord = dz.sort((a, b2) => a - b2);
  const jogos = f.jogos.map((j) => j.map((pos) => ord[pos - 1]).sort((a, b2) => a - b2));
  return json(200, {fechamento: {id: f.id, nome: f.nome, garantia: f.garantia, cobertura_pct: f.cobertura_pct}, jogos});
});
rota("POST", "fechamento", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria); exigir(ctx, "fechamentoPersonalizado");
  if (cfg.colunar) {
    const c = paraConcursos(cfg, await historico(ctx, b.loteria));
    return json(200, MC.fechamentoSS(c, cfg, Math.floor(+b.total || 7), b.perfil || "Estatístico"));
  }
  const max = b.max ? Math.min(R.tetoTecnico.jogosPorGeracao, Math.floor(+b.max)) : R.tetoTecnico.jogosPorGeracao;
  try {
    const r = await MC.gerarFechamento(b.base || [], cfg, b.perfil, b.garantia, Math.floor(+b.tamanho || cfg.aposta_min), max, null, 1200);
    return json(200, r);
  } catch (e) { falha(400, "invalido", e.message); }
});

/* ---------- jogos salvos ---------- */
rota("GET", "jogos", async (req, url) => {
  const ctx = await contexto(req), lot = url.searchParams.get("loteria");
  const rows = lot
    ? await db()`select id, loteria, dezenas, extra, nome, criado_em from public.jogos_salvos where user_id = ${ctx.usuario.id} and loteria = ${lot} order by id`
    : await db()`select id, loteria, dezenas, extra, nome, criado_em from public.jogos_salvos where user_id = ${ctx.usuario.id} order by id`;
  return json(200, {jogos: rows, limite: ctx.limites.jogosSalvos});
});
rota("POST", "jogos", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria);
  const itens = Array.isArray(b.jogos) ? b.jogos : [];
  const jogos = validarJogos(cfg, itens.map((x) => x.dezenas || x));
  const lim = ctx.limites.jogosSalvos, ids = [];
  for (let i = 0; i < jogos.length; i++) {
    const [{id}] = await db()`select public.salvar_jogo(${ctx.usuario.id}::uuid, ${b.loteria}, ${jogos[i]}::jsonb,
      ${itens[i].extra || null}, ${itens[i].nome ? String(itens[i].nome).slice(0, 60) : null}, ${lim}::int) as id`;
    if (id == null) {
      const r = PERM.pode(R, ctx.plano, "jogosSalvos", lim);
      falha(403, "plano", `Seu plano guarda até ${lim} jogos. ${ids.length} foram salvos.`,
        {recurso: "jogosSalvos", nome: r.nome, planoMinimo: r.planoMinimo, planoAtual: ctx.plano, salvos: ids.length});
    }
    ids.push(id);
  }
  return json(200, {ok: true, ids});
});
rota("DELETE", "jogos", async (req, url) => {
  const ctx = await contexto(req), id = url.searchParams.get("id");
  const r = id === "todos"
    ? await db()`delete from public.jogos_salvos where user_id = ${ctx.usuario.id} returning id`
    : await db()`delete from public.jogos_salvos where user_id = ${ctx.usuario.id} and id = ${+id || 0} returning id`;
  return json(200, {ok: true, apagados: r.length});
});

/* ---------- conferência ---------- */
rota("POST", "conferir", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria); exigir(ctx, "conferencia");
  const jogos = validarJogos(cfg, b.jogos);
  const c = paraConcursos(cfg, await historico(ctx, b.loteria));
  if (!c.length) falha(404, "invalido", "Ainda não há resultados desta loteria.");
  const ult = Math.min(c.length, Math.max(1, Math.floor(+b.ultimos || 1)));
  const alvo = c.slice(-ult);
  return json(200, {
    concursos: alvo.map((x) => ({concurso: x.concurso, data: x.data, dezenas: x.dezenas, extra: x.extra})),
    acertos: jogos.map((j) => alvo.map((x) => MC.conferir(j, x, cfg))),
    limitadoA: ctx.limites.historicoConcursos,
  });
});

/* ---------- exportação ---------- */
rota("POST", "exportar", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req), cfg = cfgDe(b.loteria);
  exigir(ctx, "loteria", b.loteria);
  const jogos = validarJogos(cfg, b.jogos), extras = Array.isArray(b.extras) ? b.extras.map(String) : null;
  const nome = "megacover-" + b.loteria + "-" + new Date().toISOString().slice(0, 10);
  if (b.formato === "csv") {
    exigir(ctx, "exportar");
    return new Response(csv(cfg, jogos, extras), {headers: {...CORS, "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${nome}.csv"`}});
  }
  if (b.formato === "pdf") {
    const tipo = b.tipo === "completo" ? "completo" : "simples";
    exigir(ctx, "relatorioPdf", tipo);
    const c = tipo === "completo" ? paraConcursos(cfg, await historico(ctx, b.loteria)) : null;
    return new Response(pdf(cfg, jogos, extras, tipo, c), {headers: {...CORS, "content-type": "application/pdf", "content-disposition": `attachment; filename="${nome}.pdf"`}});
  }
  falha(400, "invalido", "Formato deve ser csv ou pdf.");
});

/* ---------- suporte ---------- */
rota("POST", "suporte", async (req) => {
  const ctx = await contexto(req), b = await lerCorpo(req);
  exigir(ctx, "suporteEmail");
  const assunto = String(b.assunto || "").trim().slice(0, 120), msg = String(b.mensagem || "").trim().slice(0, 5000);
  if (!assunto || !msg) falha(400, "invalido", "Preencha o assunto e a mensagem.");
  const tipoSup = ctx.limites.suporte, cfgSup = R.suporte[tipoSup] || {}, prioritario = tipoSup === "email_prioritario";
  const etiqueta = prioritario ? (cfgSup.etiqueta || "[ELITE · PRIORITÁRIO]") + " " : "[" + (PERM.plano(R, ctx.plano) || {}).nome + "] ";
  await db()`insert into public.suporte_mensagens (user_id, plano, prioritario, assunto, mensagem) values (${ctx.usuario.id}, ${ctx.plano}, ${prioritario}, ${assunto}, ${msg})`;
  const r = await enviarEmail({
    para: env("SUPORTE_EMAIL", "suporte@megacover.com.br"), assunto: etiqueta + assunto, responderPara: ctx.usuario.email, prioritario,
    tipo: "suporte", userId: ctx.usuario.id,
    html: moldura("Nova mensagem de suporte", `<p><b>De:</b> ${esc(ctx.usuario.email)} · plano ${esc(ctx.plano)}${prioritario ? " · <b>PRIORITÁRIO (responder em até " + cfgSup.prazoHoras + "h úteis)</b>" : ""}</p><p><b>Assunto:</b> ${esc(assunto)}</p><p style="white-space:pre-wrap">${esc(msg)}</p>`),
    texto: `De: ${ctx.usuario.email} (plano ${ctx.plano})\nAssunto: ${assunto}\n\n${msg}`,
  });
  if (!r.ok) falha(502, "email", "Não foi possível enviar agora. Tente de novo em alguns minutos.");
  return json(200, {ok: true, prazoHoras: cfgSup.prazoHoras || null, prioritario});
});

/* ---------- assinatura (Asaas) ---------- */
rota("POST", "cupom", async (req) => { const ctx = await contexto(req); return json(200, await asaas.validarCupom(ctx, await lerCorpo(req))); });
rota("POST", "assinar", async (req) => { const ctx = await contexto(req); return json(200, await asaas.assinar(ctx, await lerCorpo(req))); });
rota("POST", "cancelar", async (req) => { const ctx = await contexto(req); return json(200, await asaas.cancelar(ctx)); });

/* ---------- tarefas internas (GitHub Actions / agendador), protegidas por token ---------- */
function exigirTarefa(req) {
  const t = env("TAREFA_TOKEN");
  if (!t || req.headers.get("x-tarefa-token") !== t) falha(401, "tarefa", "Token de tarefa inválido.");
}
rota("POST", "tarefas/concursos", async (req) => {
  exigirTarefa(req);
  const b = await lerCorpo(req), cfg = cfgDe(b.loteria), rows = Array.isArray(b.concursos) ? b.concursos : [];
  const val = rows.filter((r) => Array.isArray(r) && Number.isInteger(+r[0]) && Array.isArray(r[2]))
    .map((r) => ({loteria: cfg.chave, concurso: +r[0], data: String(r[1] || ""), dezenas: r[2], extra: r[3] == null ? null : r[3]}));
  for (let i = 0; i < val.length; i += 500) {
    const lote = val.slice(i, i + 500);
    await db()`insert into public.concursos ${db()(lote, "loteria", "concurso", "data", "dezenas", "extra")}
      on conflict (loteria, concurso) do update set data = excluded.data, dezenas = excluded.dezenas, extra = excluded.extra`;
  }
  limparCache(cfg.chave);
  return json(200, {ok: true, gravados: val.length});
});
rota("POST", "tarefas/avisar", async (req) => { exigirTarefa(req); return json(200, await avisarResultados(await lerCorpo(req))); });

/* ---------- servidor ---------- */
export async function tratar(req) {
  if (req.method === "OPTIONS") return new Response("ok", {headers: CORS});
  const url = new URL(req.url), caminho = url.pathname.replace(/^.*?\/api\/?/, "").replace(/\/$/, "");
  const fn = rotas[req.method + " " + caminho];
  try {
    if (!fn) falha(404, "rota", "Rota não encontrada: " + req.method + " " + caminho);
    return await fn(req, url);
  } catch (e) {
    if (e instanceof ErroApi) return json(e.status, {erro: e.codigo, mensagem: e.message, ...e.extra});
    console.error(e);
    return json(500, {erro: "interno", mensagem: "Erro interno. Tente novamente."});
  }
}
if (import.meta.main) Deno.serve(tratar);
