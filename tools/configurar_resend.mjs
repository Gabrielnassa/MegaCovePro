// Cadastra o domínio no Resend e mostra os registros de DNS a criar (no resumo do GitHub Actions).
// Precisa de: RESEND_API_KEY (com permissão total) e EMAIL_DOMINIO (ou DOMINIO). Opcional: RESEND_API (testes).
import { appendFileSync } from "node:fs";
const K = process.env.RESEND_API_KEY, DOM = process.env.EMAIL_DOMINIO || process.env.DOMINIO, BASE = process.env.RESEND_API || "https://api.resend.com";
if (!K || !DOM) { console.log("Resend: faltam RESEND_API_KEY ou EMAIL_DOMINIO/DOMINIO. Nada feito."); process.exit(0); }
const resumo = (t) => { console.log(t); if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, t + "\n"); };
async function chamar(metodo, caminho, corpo) {
  const r = await fetch(BASE + caminho, {method: metodo, headers: {Authorization: "Bearer " + K, "content-type": "application/json"}, body: corpo ? JSON.stringify(corpo) : undefined});
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { j = {bruto: t}; }
  if (!r.ok) throw new Error(`${metodo} ${caminho}: HTTP ${r.status} ${j.message || t.slice(0, 200)}`);
  return j;
}
try {
  let d = ((await chamar("GET", "/domains")).data || []).find((x) => x.name === DOM);
  if (!d) { d = await chamar("POST", "/domains", {name: DOM, region: "sa-east-1"}); console.log(`Resend: domínio ${DOM} cadastrado.`); }
  d = await chamar("GET", `/domains/${d.id}`);
  if (d.status !== "verified") { try { await chamar("POST", `/domains/${d.id}/verify`); } catch { /* sem problema: tenta de novo na próxima */ } }
  resumo(`## E-mail (Resend): ${DOM} — ${d.status === "verified" ? "✅ verificado" : "⏳ aguardando DNS (" + d.status + ")"}`);
  if (d.status !== "verified") {
    resumo("Crie estes registros no DNS do domínio (Cloudflare → DNS → Records → Add record). Depois rode este workflow de novo.\n");
    resumo("| Tipo | Nome | Valor | Prioridade |\n|---|---|---|---|");
    for (const r of d.records || []) resumo(`| ${r.type} | \`${r.name}\` | \`${r.value}\` | ${r.priority ?? ""} |`);
  }
} catch (e) {
  console.log(`::warning::Não consegui configurar o domínio no Resend (${e.message}). Confira se a chave tem permissão "Full access".`);
}
