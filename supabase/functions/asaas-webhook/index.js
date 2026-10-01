// Webhook do Asaas (Supabase Edge Function "asaas-webhook", publicada sem verificação de JWT).
// Cadastre no painel do Asaas: URL https://<projeto>.supabase.co/functions/v1/asaas-webhook
// e o mesmo token definido em ASAAS_WEBHOOK_TOKEN. O Asaas envia o token no cabeçalho "asaas-access-token".
import { env, json } from "../_shared/base.js";
import { processarEvento } from "../_shared/asaas.js";

export async function tratar(req) {
  if (req.method !== "POST") return json(405, {erro: "metodo"});
  const t = env("ASAAS_WEBHOOK_TOKEN");
  if (!t || req.headers.get("asaas-access-token") !== t) return json(401, {erro: "token"});
  let ev; try { ev = await req.json(); } catch { return json(400, {erro: "json"}); }
  try { return json(200, await processarEvento(ev)); }
  catch (e) { console.error(e); return json(500, {erro: "processamento"}); }   // 500 faz o Asaas reenviar depois
}
if (import.meta.main) Deno.serve(tratar);
