// Gera o catálogo de fechamentos prontos (matrizes por posição). Rodar uma vez: node tools/gerar_fechamentos.mjs
// O servidor só troca as posições 1..N pelas dezenas que a pessoa escolher.
import { createRequire } from "node:module"; import { writeFileSync } from "node:fs";
const MC = createRequire(import.meta.url)("../assets/engine.js");
const CAT = [
  ["megasena-9-quadra", "megasena", 9, "Quadra"], ["megasena-10-quadra", "megasena", 10, "Quadra"],
  ["megasena-12-quadra", "megasena", 12, "Quadra"], ["megasena-15-quadra", "megasena", 15, "Quadra"],
  ["lotofacil-16-13", "lotofacil", 16, "13 acertos"], ["lotofacil-17-13", "lotofacil", 17, "13 acertos"],
  ["quina-10-terno", "quina", 10, "Terno"], ["quina-12-quadra", "quina", 12, "Quadra"],
  ["duplasena-10-quadra", "duplasena", 10, "Quadra"], ["diadesorte-10-5", "diadesorte", 10, "5 acertos"],
  ["timemania-15-4", "timemania", 15, "4 acertos"], ["maismilionaria-10-quadra", "maismilionaria", 10, "4 acertos"]
];
/* conferência independente: fração dos t-subconjuntos da base contidos em algum jogo */
function cobertura(jogos, n, t) {
  const sets = jogos.map(j => new Set(j)); let tot = 0, ok = 0;
  MC.util.combinations(Array.from({length: n}, (_, i) => i + 1), t, s => { tot++; if (sets.some(g => s.every(d => g.has(d)))) ok++; });
  return ok / tot;
}
const out = [];
for (const [id, lot, n, gar] of CAT) {
  const cfg = MC.TODAS[lot], base = Array.from({length: n}, (_, i) => i + 1), t = MC.garantias(cfg)[gar];
  if (!t) throw new Error(id + ": garantia inexistente para " + lot + ": " + gar);
  let melhor = null;
  for (let r = 0; r < 4; r++) {                         // várias tentativas: fica a menor matriz com cobertura total
    const f = await MC.gerarFechamento(base, cfg, "Agressivo", gar, cfg.aposta_min, null, null, 20000);
    if (!melhor || (f.info.cobertura_pct >= melhor.info.cobertura_pct && f.jogos.length < melhor.jogos.length)) melhor = f;
  }
  const real = Math.round(cobertura(melhor.jogos, n, t) * 10000) / 100;
  out.push({id, loteria: lot, nome: `${cfg.nome}: ${n} dezenas, garantia de ${gar.toLowerCase()}`, dezenas: n, garantia: gar, acertos: t,
    tamanho: cfg.aposta_min, jogos: melhor.jogos, cobertura_pct: real});
  console.log(id, melhor.jogos.length, "jogos, cobertura conferida", real + "%");
}
if (out.some(c => c.cobertura_pct < 100)) console.warn("Fechamentos sem cobertura total serão descartados.");
writeFileSync(new URL("../supabase/functions/_shared/fechamentos.json", import.meta.url), JSON.stringify({gerado: new Date().toISOString(), catalogo: out.filter(c => c.cobertura_pct === 100)}));
