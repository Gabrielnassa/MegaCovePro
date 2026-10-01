// Testes dos e-mails: aviso de resultado dos jogos salvos (Pro/Elite) e suporte prioritário do Elite.
// O provedor Resend é imitado por um servidor local (RESEND_URL): nenhum e-mail sai de verdade.
// Rodar: PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh && deno test -A supabase/tests/avisos_test.js
import { sql, iniciarAuth, pararAuth, criarUsuario, chamar, eq } from "./ajuda.js";
import { tratar } from "../functions/api/index.js";

const api = (m, r, o) => chamar(tratar, m, r, o);
const TAREFA = {"x-tarefa-token": "tarefa-teste"};
const PORTA_RESEND = 54403;

Deno.test({name: "E-mails: aviso de resultado e suporte", sanitizeOps: false, sanitizeResources: false, async fn(t) {
  iniciarAuth();
  const caixa = [];   // e-mails recebidos pelo "Resend"
  let resendFalha = false;
  const resend = Deno.serve({port: PORTA_RESEND, onListen() {}}, async (req) => {
    if (req.headers.get("authorization") !== "Bearer re_teste") return new Response("chave", {status: 401});
    if (resendFalha) return new Response("fora do ar", {status: 500});
    caixa.push(await req.json()); return Response.json({id: "em_" + caixa.length});
  });
  const mega = JSON.parse(await Deno.readTextFile(new URL("../../data/megasena.json", import.meta.url))).concursos;
  const ultimo = mega[mega.length - 1], dzUlt = ultimo[2].map(Number);
  const carregar = (lista) => api("POST", "tarefas/concursos", {cab: TAREFA, corpo: {loteria: "megasena", concursos: lista}});
  const avisar = (corpo = {loteria: "megasena"}) => api("POST", "tarefas/avisar", {cab: TAREFA, corpo});
  const enviados = async (tipo = "resultado") => sql`select destinatario, assunto, status from public.emails_enviados where tipo = ${tipo} order by destinatario`;

  try {
    const U = {
      gratis: await criarUsuario("gratis@t.com", {diasDeConta: 10}),
      pro: await criarUsuario("pro@t.com", {diasDeConta: 40, assinatura: {plano: "pro"}}),
      proSemAviso: await criarUsuario("pro2@t.com", {diasDeConta: 40, assinatura: {plano: "pro"}}),
      elite: await criarUsuario("elite@t.com", {diasDeConta: 40, assinatura: {plano: "elite"}}),
      teste: await criarUsuario("teste@t.com", {diasDeConta: 1}),
    };
    eq((await carregar(mega.slice(0, -1))).status, 200, "carga sem o último concurso");
    const salvar = (u, jogos, lot = "megasena") => api("POST", "jogos", {tok: u.tok, corpo: {loteria: lot, jogos}});
    eq((await salvar(U.gratis, [[1, 2, 3, 4, 5, 6]])).status, 200, "grátis salva");
    eq((await salvar(U.pro, [{dezenas: dzUlt, nome: "Sena cheia"}, [1, 2, 3, 4, 5, 6]])).status, 200, "pro salva");
    eq((await salvar(U.proSemAviso, [[1, 2, 3, 4, 5, 6]])).status, 200, "pro2 salva");
    eq((await salvar(U.elite, [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], "lotofacil")).status, 200, "elite só lotofácil");
    eq((await salvar(U.teste, [dzUlt.slice(0, 4).concat([59, 60].filter((d) => !dzUlt.includes(d)).slice(0, 2))])).status, 200, "teste salva");
    eq((await api("PATCH", "perfil", {tok: U.proSemAviso.tok, corpo: {aviso_email: false}})).status, 200, "pro2 desliga o aviso");
    eq((await api("PATCH", "perfil", {tok: U.gratis.tok, corpo: {aviso_email: true}})).status, 403, "grátis não liga o aviso");

    await t.step("tarefa protegida por token", async () => {
      eq((await api("POST", "tarefas/avisar", {corpo: {}})).status, 401, "sem token");
    });

    await t.step("1ª execução só marca o ponto de partida", async () => {
      const r = await avisar();
      eq(r.dados.loterias[0].inicio, ultimo[0] - 1, "marca o concurso atual");
      eq((await enviados()).length, 0, "nenhum e-mail de resultado antigo");
    });

    await t.step("novo concurso: avisa só quem tem o recurso e jogos dessa loteria", async () => {
      await carregar(mega);
      const r = await avisar();
      const l = r.dados.loterias[0];
      eq([l.concurso, l.pessoas, l.enviados, l.falhas], [ultimo[0], 2, 2, 0], "Pro + teste Elite");
      const e = await enviados();
      eq(e.map((x) => x.destinatario), ["pro@t.com", "teste@t.com"], "destinatários");
      eq(e[0].assunto, `Mega-Sena ${ultimo[0]}: seu melhor jogo fez 6 acerto(s)`, "assunto do Pro (jogo igual ao resultado)");
      eq(e[1].assunto.endsWith("fez 4 acerto(s)"), true, "assunto do teste: 4 acertos");
    });

    await t.step("nunca repete o mesmo aviso", async () => {
      await avisar();
      await avisar({loteria: "megasena", forcar: true});
      eq((await enviados()).length, 2, "continua 2");
    });

    await t.step("Resend: envia de verdade, suporte do Elite marcado como prioritário", async () => {
      Deno.env.set("EMAIL_PROVEDOR", "resend"); Deno.env.set("RESEND_API_KEY", "re_teste");
      Deno.env.set("RESEND_URL", `http://127.0.0.1:${PORTA_RESEND}/emails`); Deno.env.set("EMAIL_REMETENTE", "MegaCover <avisos@teste.local>");
      let r = await api("POST", "suporte", {tok: U.elite.tok, corpo: {assunto: "Ajuda", mensagem: "Olá"}});
      eq([r.status, r.dados.prioritario, r.dados.prazoHoras], [200, true, 24], "Elite");
      r = await api("POST", "suporte", {tok: U.pro.tok, corpo: {assunto: "Ajuda", mensagem: "Olá"}});
      eq([r.status, r.dados.prioritario, r.dados.prazoHoras], [200, false, 48], "Pro");
      eq((await api("POST", "suporte", {tok: U.gratis.tok, corpo: {assunto: "Ajuda", mensagem: "Olá"}})).status, 403, "Grátis: só FAQ");
      eq(caixa.length, 2, "2 e-mails no Resend");
      const [el, pr] = caixa;
      eq([el.subject, el.headers["X-Priority"], el.reply_to, el.to[0]], ["[ELITE · PRIORITÁRIO] Ajuda", "1 (Highest)", "elite@t.com", "suporte@teste.local"], "Elite prioritário");
      eq([pr.subject, pr.headers["X-Priority"]], ["[Pro] Ajuda", undefined], "Pro normal");
    });

    await t.step("Resend fora do ar: não marca como enviado e tenta de novo depois", async () => {
      const novo = [ultimo[0] + 1, "01/01/2030", [1, 2, 3, 4, 5, 6]];
      await carregar([novo]);
      resendFalha = true;
      let l = (await avisar()).dados.loterias[0];
      eq([l.concurso, l.enviados, l.falhas], [novo[0], 0, 2], "falhou");
      eq((await sql`select ultimo_concurso from public.avisos_resultado where loteria = 'megasena'`)[0].ultimo_concurso, ultimo[0], "marca não avança");
      resendFalha = false;
      l = (await avisar()).dados.loterias[0];
      eq([l.enviados, l.falhas], [2, 0], "reenvio");
      const aviso = caixa.find((m) => m.to[0] === "pro@t.com" && m.subject.startsWith("Mega-Sena " + novo[0]));
      eq(!!aviso && aviso.html.includes("Minha conta"), true, "e-mail explica como desligar");
      eq(aviso.subject, `Mega-Sena ${novo[0]}: seu melhor jogo fez 6 acerto(s)`, "Pro tinha 1 2 3 4 5 6");
    });
  } finally {
    Deno.env.set("EMAIL_PROVEDOR", "teste");
    await resend.shutdown();
    await pararAuth();
  }
}});
