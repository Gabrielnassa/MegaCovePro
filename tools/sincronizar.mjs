// Copia para o servidor (supabase/functions/_shared) os arquivos que o site e o servidor compartilham.
// Uso: node tools/sincronizar.mjs            → copia
//      node tools/sincronizar.mjs --verificar → só confere (falha se estiver desatualizado)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARQ = ["regras.json", "permissoes.js", "engine.js"];
const verificar = process.argv.includes("--verificar");
let erros = 0;
for (const a of ARQ) {
  const de = join(raiz, "assets", a), para = join(raiz, "supabase/functions/_shared", a);
  const txt = readFileSync(de, "utf8");
  if (a.endsWith(".json")) JSON.parse(txt);              // falha cedo se o JSON estiver quebrado
  const atual = existsSync(para) ? readFileSync(para, "utf8") : null;
  if (atual === txt) continue;
  if (verificar) { console.error("DESATUALIZADO:", para); erros++; }
  else { writeFileSync(para, txt); console.log("copiado:", a); }
}
if (erros) { console.error("Rode: node tools/sincronizar.mjs"); process.exit(1); }
console.log(verificar ? "sincronizado" : "ok");
