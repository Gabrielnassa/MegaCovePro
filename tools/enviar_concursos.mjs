// Envia os resultados de data/*.json para o servidor (rota tarefas/concursos) e dispara os avisos por e-mail.
// Usado pelo GitHub Actions depois de baixar os resultados. Node 20, sem dependências.
//   MEGACOVER_API_URL = https://<projeto>.supabase.co/functions/v1/api
//   TAREFA_TOKEN      = o mesmo valor configurado nos segredos do Supabase
// node tools/enviar_concursos.mjs          → só os 60 concursos mais recentes de cada loteria
// node tools/enviar_concursos.mjs --tudo   → o histórico inteiro (primeira carga)
import { readFile } from "node:fs/promises";

const BASE = (process.env.MEGACOVER_API_URL || "").replace(/\/$/, ""), TOKEN = process.env.TAREFA_TOKEN || "";
if (!BASE || !TOKEN) { console.log("MEGACOVER_API_URL ou TAREFA_TOKEN não definidos: nada a enviar."); process.exit(0); }
const tudo = process.argv.includes("--tudo");
const LOTERIAS = ["megasena", "lotofacil", "quina", "lotomania", "duplasena", "timemania", "diadesorte", "supersete", "maismilionaria"];

async function post(rota, corpo) {
  const r = await fetch(BASE + "/" + rota, {method: "POST", headers: {"content-type": "application/json", "x-tarefa-token": TOKEN}, body: JSON.stringify(corpo)});
  const t = await r.text();
  if (!r.ok) throw new Error(`${rota}: HTTP ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
let falhas = 0;
for (const lot of LOTERIAS) {
  try {
    const d = JSON.parse(await readFile(new URL(`../data/${lot}.json`, import.meta.url), "utf8"));
    const cs = tudo ? d.concursos : d.concursos.slice(-60);
    for (let i = 0; i < cs.length; i += 1000) await post("tarefas/concursos", {loteria: lot, concursos: cs.slice(i, i + 1000)});
    console.log(`${lot}: ${cs.length} concurso(s) enviados`);
  } catch (e) { falhas++; console.error(`${lot}: ${e.message}`); }
}
try { console.log("avisos:", JSON.stringify((await post("tarefas/avisar", {})).loterias)); }
catch (e) { falhas++; console.error("avisos:", e.message); }
process.exit(falhas ? 1 : 0);
