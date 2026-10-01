// Envio de e-mails. Provedor escolhido por variável de ambiente:
//   EMAIL_PROVEDOR = "resend" (produção) | "teste" (padrão: só registra em emails_enviados, não envia)
//   RESEND_API_KEY, EMAIL_REMETENTE (ex.: "MegaCover <avisos@megacover.com.br>")
// Cada envio com `chave` é registrado antes: a mesma chave nunca é enviada duas vezes.
import { db, env } from "./base.js";

export async function enviarEmail({para, assunto, html, texto, responderPara, prioritario, tipo, chave, userId}) {
  const sql = db();
  const linhas = await sql`insert into public.emails_enviados (user_id, tipo, chave, destinatario, assunto, status)
    values (${userId || null}, ${tipo}, ${chave || null}, ${para}, ${assunto}, 'enviando')
    on conflict (chave) do nothing returning id`;
  if (!linhas.length) return {ok: true, duplicado: true};
  const id = linhas[0].id, provedor = env("EMAIL_PROVEDOR", "teste");
  if (provedor === "teste") {
    await sql`update public.emails_enviados set status = 'teste' where id = ${id}`;
    return {ok: true, teste: true, id};
  }
  try {
    if (provedor !== "resend") throw new Error("EMAIL_PROVEDOR desconhecido: " + provedor);
    const cab = prioritario ? {"X-Priority": "1 (Highest)", "Importance": "high", "X-MegaCover-Prioridade": "elite"} : {};
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {Authorization: "Bearer " + env("RESEND_API_KEY"), "content-type": "application/json"},
      body: JSON.stringify({from: env("EMAIL_REMETENTE", "MegaCover <avisos@megacover.com.br>"), to: [para], subject: assunto,
        html, text: texto, reply_to: responderPara || undefined, headers: cab}),
    });
    if (!r.ok) throw new Error("Resend " + r.status + ": " + (await r.text()).slice(0, 300));
    await sql`update public.emails_enviados set status = 'enviado' where id = ${id}`;
    return {ok: true, id};
  } catch (e) {
    // apaga o registro para a próxima rodada tentar de novo
    await sql`delete from public.emails_enviados where id = ${id}`;
    return {ok: false, erro: String(e.message || e)};
  }
}

export const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
export function moldura(titulo, corpo) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b1d22">
<div style="max-width:560px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border-radius:14px;padding:24px;border:1px solid #e7e1d3">
<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9a7220;font-weight:700">MegaCover Pro Elite</div>
<h1 style="font-size:20px;margin:8px 0 16px">${esc(titulo)}</h1>${corpo}</div>
<p style="font-size:11px;color:#8a8577;text-align:center;margin-top:14px">Ferramenta estatística para organizar seus jogos. Não prevê resultados nem garante prêmios. Proibido para menores de 18 anos.<br>
Para não receber avisos de resultado, desligue a opção em Minha conta.</p></div></body></html>`;
}
