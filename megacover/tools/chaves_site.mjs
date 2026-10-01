// Preenche em assets/plano.js a URL e a chave PÚBLICA (anon) do Supabase, se ainda estiverem vazias.
// A chave anon é pública por natureza; a service_role nunca é usada aqui. Precisa de SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF.
// Saída: "alterado" quando o arquivo mudou (o workflow então faz o commit).
import { readFileSync, writeFileSync } from "node:fs";
const TOK = process.env.SUPABASE_ACCESS_TOKEN, REF = process.env.SUPABASE_PROJECT_REF, API = process.env.SUPABASE_API || "https://api.supabase.com";
const ARQ = new URL("../assets/plano.js", import.meta.url);
if (!TOK || !REF) { console.log("faltam SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_REF"); process.exit(0); }
const s = readFileSync(ARQ, "utf8");
if (!/supabase:\s*\{url:\s*"",\s*chave:\s*""\}/.test(s)) { console.log("plano.js já tem as chaves do Supabase: nada a fazer"); process.exit(0); }
const r = await fetch(`${API}/v1/projects/${REF}/api-keys`, {headers: {Authorization: "Bearer " + TOK}});
if (!r.ok) { console.log(`::warning::Não consegui ler as chaves do projeto (HTTP ${r.status}).`); process.exit(0); }
const chaves = await r.json();
const k = chaves.find((x) => x.name === "anon") || chaves.find((x) => x.type === "publishable");
if (!k || !k.api_key) { console.log("::warning::Chave pública não encontrada no projeto."); process.exit(0); }
writeFileSync(ARQ, s.replace(/supabase:\s*\{url:\s*"",\s*chave:\s*""\}/, `supabase: {url: "https://${REF}.supabase.co", chave: "${k.api_key}"}`));
console.log("alterado");
