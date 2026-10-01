// Cadastra (ou atualiza) sozinho o webhook do MegaCover no Asaas. Node 20, sem dependências.
// Precisa de: ASAAS_API_KEY, ASAAS_AMBIENTE (sandbox|producao), ASAAS_WEBHOOK_TOKEN, SUPABASE_PROJECT_REF
// Opcional: SUPORTE_EMAIL (recebe os avisos do Asaas se o webhook falhar), ASAAS_URL (testes)
const K = process.env.ASAAS_API_KEY, TOKEN = process.env.ASAAS_WEBHOOK_TOKEN, REF = process.env.SUPABASE_PROJECT_REF;
if (!K || !TOKEN || !REF) { console.log("Asaas: faltam ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN ou SUPABASE_PROJECT_REF. Nada feito."); process.exit(0); }
const BASE = process.env.ASAAS_URL || (process.env.ASAAS_AMBIENTE === "producao" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3");
const URL_WEBHOOK = process.env.WEBHOOK_URL || `https://${REF}.supabase.co/functions/v1/asaas-webhook`;
const EVENTOS = ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_DELETED",
  "PAYMENT_RESTORED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
  "SUBSCRIPTION_CREATED", "SUBSCRIPTION_UPDATED", "SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"];

async function chamar(metodo, caminho, corpo) {
  const r = await fetch(BASE + caminho, {method: metodo, headers: {access_token: K, "content-type": "application/json", "User-Agent": "MegaCover"},
    body: corpo ? JSON.stringify(corpo) : undefined});
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { j = {bruto: t}; }
  if (!r.ok) throw new Error(`${metodo} ${caminho}: HTTP ${r.status} ${(j.errors || []).map((e) => e.description).join("; ") || t.slice(0, 200)}`);
  return j;
}
const corpo = {name: "MegaCover", url: URL_WEBHOOK, email: process.env.SUPORTE_EMAIL || undefined, enabled: true, interrupted: false,
  apiVersion: 3, authToken: TOKEN, sendType: "SEQUENTIALLY", events: EVENTOS};
try {
  const lista = (await chamar("GET", "/webhooks?limit=100")).data || [];
  const meu = lista.find((w) => w.url === URL_WEBHOOK || w.name === "MegaCover");
  if (meu) { await chamar("PUT", `/webhooks/${meu.id}`, corpo); console.log(`Asaas (${BASE}): webhook atualizado → ${URL_WEBHOOK}`); }
  else { await chamar("POST", "/webhooks", corpo); console.log(`Asaas (${BASE}): webhook criado → ${URL_WEBHOOK}`); }
} catch (e) {
  console.log(`::warning::Não consegui cadastrar o webhook no Asaas sozinho (${e.message}). Cadastre à mão: Integrações → Webhooks, URL ${URL_WEBHOOK}, eventos de Cobranças e Assinaturas, envio sequencial. Para isso, crie o segredo ASAAS_WEBHOOK_TOKEN no GitHub com um texto longo seu (32+ letras e números), use o mesmo texto no Asaas e rode o workflow de novo.`);
}
