// Aviso de resultado: depois de cada sorteio, confere os jogos salvos de quem tem o recurso avisoEmail
// (Pro e Elite, conforme regras.json) e envia um e-mail com os acertos. Nunca repete o mesmo aviso.
import { MC, PERM, R, db, cfgDe, concursosDe, limparCache } from "./base.js";
import { enviarEmail, moldura, esc } from "./email.js";

const planosComAviso = () => R.planos.filter((p) => PERM.pode(R, p.id, "avisoEmail").ok).map((p) => p.id);

export async function avisarResultados(opcoes = {}) {
  const sql = db(), lots = opcoes.loteria ? [opcoes.loteria] : MC.ORDEM.map((l) => l.chave), saida = [];
  for (const lot of lots) {
    const cfg = cfgDe(lot); limparCache(lot);
    const rows = await concursosDe(lot);
    if (!rows.length) continue;
    const ult = MC.rowParaConcurso(cfg, rows[rows.length - 1]);
    const [marca] = await sql`select ultimo_concurso from public.avisos_resultado where loteria = ${lot}`;
    if (!marca) {  // primeira execução: só marca o ponto de partida, sem avisar resultados antigos
      await sql`insert into public.avisos_resultado (loteria, ultimo_concurso) values (${lot}, ${ult.concurso})`;
      saida.push({loteria: lot, inicio: ult.concurso}); continue;
    }
    if (marca.ultimo_concurso >= ult.concurso && !opcoes.forcar) continue;
    const pessoas = await sql`
      select u.id, u.email, coalesce(p.nome, '') as nome
      from auth.users u join public.perfis p on p.user_id = u.id
      where p.aviso_email and exists (select 1 from public.jogos_salvos j where j.user_id = u.id and j.loteria = ${lot})
        and (select pe.plano from public.plano_efetivo(u.id, ${R.teste.dias}::int, ${R.toleranciaAtrasoDias}::int, ${R.teste.plano}) pe) = any(${planosComAviso()})`;
    let enviados = 0, falhas = 0;
    for (const pessoa of pessoas) {
      const jogos = await sql`select dezenas, nome from public.jogos_salvos where user_id = ${pessoa.id} and loteria = ${lot} order by id`;
      const linhas = jogos.map((j, i) => {
        const ac = MC.conferir(j.dezenas, ult, cfg);
        return {nome: j.nome || "Jogo " + (i + 1), dezenas: cfg.colunar ? j.dezenas.map((c) => c.join("")).join(" | ") : j.dezenas.map((d) => cfg.fmt(d)).join(" "), acertos: ac};
      });
      const melhor = Math.max(...linhas.map((l) => Math.max(...l.acertos)));
      const sorteio = cfg.colunar ? ult.dezenas.join(" ") : MC.sorteiosDe(ult, cfg).map((s) => s.map((d) => cfg.fmt(d)).join(" ")).join(" / ");
      const corpo = `<p>Olá${pessoa.nome ? ", " + esc(pessoa.nome.split(" ")[0]) : ""}! Saiu o resultado do concurso <b>${ult.concurso}</b> da ${esc(cfg.nome)} (${esc(ult.data)}).</p>
<p style="font-size:18px;letter-spacing:.06em"><b>${esc(sorteio)}</b>${ult.extra ? " · " + esc(cfg.extra_nome) + ": " + esc(ult.extra) : ""}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px"><tr><th align="left" style="border-bottom:1px solid #ddd;padding:6px 4px">Jogo</th><th align="left" style="border-bottom:1px solid #ddd;padding:6px 4px">Dezenas</th><th style="border-bottom:1px solid #ddd;padding:6px 4px">Acertos</th></tr>
${linhas.map((l) => `<tr><td style="padding:6px 4px;border-bottom:1px solid #f0f0f0">${esc(l.nome)}</td><td style="padding:6px 4px;border-bottom:1px solid #f0f0f0;font-family:monospace">${esc(l.dezenas)}</td><td align="center" style="padding:6px 4px;border-bottom:1px solid #f0f0f0"><b>${l.acertos.join(" / ")}</b></td></tr>`).join("")}</table>
<p style="font-size:13px;color:#666">Confira sempre o resultado oficial em loterias.caixa.gov.br. Prêmios são pagos pela CAIXA mediante o bilhete.</p>`;
      const r = await enviarEmail({
        para: pessoa.email, userId: pessoa.id, tipo: "resultado", chave: `resultado:${lot}:${ult.concurso}:${pessoa.id}`,
        assunto: `${cfg.nome} ${ult.concurso}: seu melhor jogo fez ${melhor} acerto(s)`,
        html: moldura(`Resultado da ${cfg.nome} · concurso ${ult.concurso}`, corpo),
        texto: `${cfg.nome} concurso ${ult.concurso}: ${sorteio}\n` + linhas.map((l) => `${l.nome}: ${l.dezenas} → ${l.acertos.join("/")} acerto(s)`).join("\n"),
      });
      if (r.ok) enviados++; else falhas++;
    }
    if (!falhas) await sql`update public.avisos_resultado set ultimo_concurso = ${ult.concurso} where loteria = ${lot}`;
    saida.push({loteria: lot, concurso: ult.concurso, pessoas: pessoas.length, enviados, falhas});
  }
  return {ok: true, loterias: saida};
}
