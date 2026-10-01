/* MegaCover Pro Elite (Web) — motor de cálculo.
   Porte para JavaScript dos módulos models, estatisticas e algorithms da
   versão desktop. Não depende do navegador: também roda no Node (testes). */
(function (root) {
"use strict";

/* ======================= Loterias ======================= */
function faixas(inicio, fim, passo) {
  var out = [];
  for (var i = inicio; i <= fim; i += passo) out.push([i, Math.min(i + passo - 1, fim)]);
  return out;
}
function Loteria(o) {
  var d = {inicio: 1, sorteios: 1, colunar: false, colunas: 0, extra_nome: null,
           extra_universo: 0, extra_qtd: 0, nota: ""};
  for (var k in d) this[k] = d[k];
  for (k in o) this[k] = o[k];
  this.dezenas = [];
  for (var n = this.inicio; n <= this.universo; n++) this.dezenas.push(n);
}
Loteria.prototype.fmt = function (d) {
  return this.universo >= 10 ? (d < 10 ? "0" + d : "" + d) : "" + d;
};

var ORDEM = [
  new Loteria({chave: "megasena", nome: "Mega-Sena", emo: "🍀", cor: "#209869", universo: 60, sorteadas: 6,
    faixas: faixas(1, 60, 10), aposta_min: 6, aposta_max: 20, premios: [4, 5, 6], soma_min: 120, soma_max: 260}),
  new Loteria({chave: "lotofacil", nome: "Lotofácil", emo: "🌸", cor: "#930089", universo: 25, sorteadas: 15,
    faixas: faixas(1, 25, 5), aposta_min: 15, aposta_max: 20, premios: [11, 12, 13, 14, 15], soma_min: 166, soma_max: 224}),
  new Loteria({chave: "quina", nome: "Quina", emo: "🎲", cor: "#260085", universo: 80, sorteadas: 5,
    faixas: faixas(1, 80, 10), aposta_min: 5, aposta_max: 15, premios: [2, 3, 4, 5], soma_min: 100, soma_max: 305}),
  new Loteria({chave: "lotomania", nome: "Lotomania", emo: "🎯", cor: "#F78100", universo: 99, sorteadas: 20,
    faixas: faixas(0, 99, 20), aposta_min: 50, aposta_max: 50, premios: [15, 16, 17, 18, 19, 20],
    soma_min: 750, soma_max: 1230, inicio: 0,
    nota: "A aposta da Lotomania é sempre de 50 dezenas (00 a 99). Há prêmio também para 0 acertos."}),
  new Loteria({chave: "duplasena", nome: "Dupla Sena", emo: "🎰", cor: "#A0522D", universo: 50, sorteadas: 6,
    faixas: faixas(1, 50, 10), aposta_min: 6, aposta_max: 15, premios: [3, 4, 5, 6], soma_min: 100, soma_max: 215,
    sorteios: 2,
    nota: "Cada concurso tem DOIS sorteios. As estatísticas consideram os dois e a simulação usa o melhor acerto entre eles."}),
  new Loteria({chave: "timemania", nome: "Timemania", emo: "⚽", cor: "#0a6b3a", universo: 80, sorteadas: 7,
    faixas: faixas(1, 80, 10), aposta_min: 10, aposta_max: 10, premios: [3, 4, 5, 6, 7], soma_min: 170, soma_max: 400,
    extra_nome: "Time do Coração",
    nota: "A aposta da Timemania é sempre de 10 dezenas, mais o Time do Coração, escolhido no volante."}),
  new Loteria({chave: "diadesorte", nome: "Dia de Sorte", emo: "🌞", cor: "#CB852B", universo: 31, sorteadas: 7,
    faixas: faixas(1, 31, 8), aposta_min: 7, aposta_max: 15, premios: [4, 5, 6, 7], soma_min: 70, soma_max: 155,
    extra_nome: "Mês da Sorte",
    nota: "Além das dezenas, sorteia-se o Mês da Sorte, escolhido no volante."}),
  new Loteria({chave: "supersete", nome: "Super Sete", emo: "7️⃣", cor: "#7CB342", universo: 9, sorteadas: 1,
    faixas: [], aposta_min: 7, aposta_max: 21, premios: [3, 4, 5, 6, 7], soma_min: 0, soma_max: 63,
    inicio: 0, colunar: true, colunas: 7,
    nota: "O Super Sete tem 7 colunas, cada uma com um número de 0 a 9. A aposta mínima marca 1 número por coluna."}),
  new Loteria({chave: "maismilionaria", nome: "+Milionária", emo: "💎", cor: "#1E2C6B", universo: 50, sorteadas: 6,
    faixas: faixas(1, 50, 10), aposta_min: 6, aposta_max: 12, premios: [2, 3, 4, 5, 6], soma_min: 100, soma_max: 215,
    extra_nome: "Trevos", extra_universo: 6, extra_qtd: 2,
    nota: "Além das 6 dezenas, sorteia 2 trevos (1 a 6). O sistema gera os trevos junto com cada jogo."})
];
var TODAS = {};
ORDEM.forEach(function (l) { TODAS[l.chave] = l; });

/* ======================= Utilidades ======================= */
function rnd(n) { return Math.floor(Math.random() * n); }
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function sample(arr, k) {             /* k elementos distintos, sem reposição */
  var a = arr.slice(), n = a.length;
  for (var i = 0; i < k; i++) { var j = i + rnd(n - i), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a.slice(0, k);
}
function num(a, b) { return a - b; }
function sortN(a) { return a.slice().sort(num); }
function choiceW(itens, cum) {        /* escolha ponderada (cum = pesos acumulados) */
  var r = Math.random() * cum[cum.length - 1], lo = 0, hi = cum.length - 1;
  while (lo < hi) { var m = (lo + hi) >> 1; if (cum[m] > r) hi = m; else lo = m + 1; }
  return itens[lo];
}
function acumular(pesos) {
  var c = [], s = 0;
  for (var i = 0; i < pesos.length; i++) { s += pesos[i]; c.push(s); }
  return c;
}
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  var r = 1;
  for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
  return Math.round(r);
}
function combinations(arr, k, cb) {   /* chama cb(subconjunto) para cada combinação; cb===false interrompe */
  var n = arr.length, idx = [];
  if (k > n || k <= 0) return;
  for (var i = 0; i < k; i++) idx.push(i);
  while (true) {
    if (cb(idx.map(function (x) { return arr[x]; })) === false) return;
    var p = k - 1;
    while (p >= 0 && idx[p] === n - k + p) p--;
    if (p < 0) return;
    idx[p]++;
    for (var q = p + 1; q < k; q++) idx[q] = idx[q - 1] + 1;
  }
}
function intersec(a, b) {
  var s = new Set(b), c = 0;
  for (var i = 0; i < a.length; i++) if (s.has(a[i])) c++;
  return c;
}
function Counter() { this.m = new Map(); }
Counter.prototype.add = function (k, n) { this.m.set(k, (this.m.get(k) || 0) + (n || 1)); };
Counter.prototype.get = function (k) { return this.m.get(k) || 0; };
Counter.prototype.mostCommon = function () {
  return Array.from(this.m.entries()).sort(function (a, b) { return b[1] - a[1]; });
};

/* ======================= Estatísticas ======================= */
function sorteiosDe(c, cfg) {
  var dz = c.dezenas;
  if (cfg.sorteios <= 1) return [dz];
  var n = cfg.sorteadas, out = [];
  for (var i = 0; i < cfg.sorteios; i++) out.push(dz.slice(i * n, (i + 1) * n));
  return out;
}
function porColuna(cs, cfg) {
  var t = [];
  for (var col = 0; col < cfg.colunas; col++) {
    var f = {};
    cfg.dezenas.forEach(function (d) { f[d] = 0; });
    cs.forEach(function (c) { if (c.dezenas.length > col) f[c.dezenas[col]]++; });
    t.push(f);
  }
  return t;
}
function frequencias(cs, cfg) {
  var cont = {};
  cfg.dezenas.forEach(function (d) { cont[d] = 0; });
  cs.forEach(function (c) { c.dezenas.forEach(function (d) { if (d in cont) cont[d]++; }); });
  var total = cs.length * cfg.sorteios, out = {};
  cfg.dezenas.forEach(function (d) { out[d] = {abs: cont[d], pct: total ? cont[d] / total * 100 : 0}; });
  return out;
}
function atrasos(cs, cfg) {
  var maior = {}, cor = {};
  cfg.dezenas.forEach(function (d) { maior[d] = 0; cor[d] = 0; });
  cs.forEach(function (c) {
    var s = new Set(c.dezenas);
    cfg.dezenas.forEach(function (d) {
      if (s.has(d)) { if (cor[d] > maior[d]) maior[d] = cor[d]; cor[d] = 0; } else cor[d]++;
    });
  });
  cfg.dezenas.forEach(function (d) { if (cor[d] > maior[d]) maior[d] = cor[d]; });
  return {atual: cor, maior: maior};
}
function tendencia(cs, cfg, janela) {
  janela = janela || 20;
  var rec = cs.length > janela ? cs.slice(-janela) : cs, out = {};
  cfg.dezenas.forEach(function (d) { out[d] = 0; });
  rec.forEach(function (c) { c.dezenas.forEach(function (d) { if (d in out) out[d]++; }); });
  return out;
}
function mediaRepeticao(cs, cfg) {
  if (cs.length < 2) return {media: 0, dist: new Counter()};
  var seq = [];
  cs.forEach(function (c) { sorteiosDe(c, cfg).forEach(function (s) { seq.push(s); }); });
  var d = new Counter(), tot = 0;
  for (var i = 1; i < seq.length; i++) { var r = intersec(seq[i], seq[i - 1]); d.add(r); tot += r; }
  return {media: tot / (seq.length - 1), dist: d};
}
function ranking(cs, cfg, top) {
  top = top || 10;
  var f = frequencias(cs, cfg), a = atrasos(cs, cfg).atual;
  var pf = cfg.dezenas.slice().sort(function (x, y) { return f[y].abs - f[x].abs || x - y; });
  return {
    quentes: pf.slice(0, top).map(function (d) { return [d, f[d].abs]; }),
    frias: pf.slice(-top).reverse().map(function (d) { return [d, f[d].abs]; }),
    atrasadas: cfg.dezenas.slice().sort(function (x, y) { return a[y] - a[x] || x - y; })
      .slice(0, top).map(function (d) { return [d, a[d]]; })
  };
}
function paresImpares(j) {
  var p = 0;
  for (var i = 0; i < j.length; i++) if (j[i] % 2 === 0) p++;
  return [p, j.length - p];
}
function distParesImpares(cs, cfg) {
  var c = new Counter();
  cs.forEach(function (x) { sorteiosDe(x, cfg).forEach(function (dz) {
    var pi = paresImpares(dz); c.add(pi[0] + "P/" + pi[1] + "I");
  }); });
  return c;
}
function distribuicaoFaixas(j, cfg) {
  return cfg.faixas.map(function (f) {
    var n = 0; for (var i = 0; i < j.length; i++) if (j[i] >= f[0] && j[i] <= f[1]) n++; return n;
  });
}
function distFaixasHistorica(cs, cfg) {
  if (!cfg.faixas.length) return [];
  var t = cfg.faixas.map(function () { return 0; });
  cs.forEach(function (c) { distribuicaoFaixas(c.dezenas, cfg).forEach(function (v, i) { t[i] += v; }); });
  return t;
}
function soma(j) { var s = 0; for (var i = 0; i < j.length; i++) s += j[i]; return s; }
function distSomas(cs, cfg) {
  var out = [];
  cs.forEach(function (c) { sorteiosDe(c, cfg).forEach(function (s) { out.push(soma(s)); }); });
  return out;
}
function seqConsecutivas(j) {
  var s = sortN(j), melhor = 1, at = 1;
  for (var i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1] + 1) { at++; if (at > melhor) melhor = at; } else at = 1;
  }
  return melhor;
}
function distSequencias(cs, cfg) {
  var c = new Counter();
  cs.forEach(function (x) { sorteiosDe(x, cfg).forEach(function (s) { c.add(seqConsecutivas(s)); }); });
  return c;
}
var PRIMOS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
function primos(j) { var n = 0; j.forEach(function (d) { if (PRIMOS.has(d)) n++; }); return n; }
var MIOLO = new Set([7, 8, 9, 12, 13, 14, 17, 18, 19]);
function molduraMiolo(j) { var m = 0; j.forEach(function (d) { if (MIOLO.has(d)) m++; }); return [j.length - m, m]; }

/* ---------- campos extras (time, mês, trevos) ---------- */
function partesExtra(v, cfg) {
  if (v == null || v === "") return [];
  if (cfg.extra_qtd > 1) return String(v).split(",").map(function (x) { return x.trim(); }).filter(Boolean);
  return [String(v).trim()];
}
function frequenciaExtras(cs, cfg) {
  var c = new Counter(), total = 0;
  cs.forEach(function (x) { partesExtra(x.extra, cfg).forEach(function (p) { c.add(p); total++; }); });
  if (!total) return [];
  return c.mostCommon().map(function (e) { return [e[0], e[1], e[1] / total * 100]; });
}
function atrasoExtras(cs, cfg) {
  var comExtra = cs.filter(function (x) { return partesExtra(x.extra, cfg).length; });
  var ult = {};
  comExtra.forEach(function (x, pos) { partesExtra(x.extra, cfg).forEach(function (p) { ult[p] = pos; }); });
  var fim = comExtra.length - 1, out = {};
  Object.keys(ult).forEach(function (k) { out[k] = fim - ult[k]; });
  return out;
}

/* ======================= Gerador ======================= */
var ESTRATEGIAS = ["Estatística", "Agressiva", "Conservadora", "Alta cobertura"];
var FILTROS = [
  ["balancear_pares", "Balancear pares/ímpares"],
  ["evitar_proximas", "Evitar excesso de dezenas próximas"],
  ["controlar_soma", "Controlar soma"],
  ["controlar_distribuicao", "Controlar distribuição"],
  ["usar_atrasadas", "Usar dezenas atrasadas"],
  ["usar_quentes", "Usar dezenas quentes"],
  ["reduzir_repeticao", "Reduzir repetição"],
  ["evitar_padroes_improvaveis", "Evitar padrões improváveis"]
];
function filtrosPadrao() {
  var f = {soma_min: null, soma_max: null};
  FILTROS.forEach(function (x) { f[x[0]] = true; });
  return f;
}
function limitesSoma(n, cfg) {
  var fator = cfg.sorteadas ? n / cfg.sorteadas : 1;
  return [Math.floor(cfg.soma_min * fator), Math.floor(cfg.soma_max * fator)];
}
function jogoValido(jogo, f, cfg, ultimo) {
  var n = jogo.length, denso = n / (cfg.universo - cfg.inicio + 1) >= 0.4;
  if (f.balancear_pares) {
    var pi = paresImpares(jogo);
    if (pi[0] === 0 || pi[1] === 0) return false;
    if (Math.abs(pi[0] - pi[1]) > Math.max(3, Math.floor(n / 2))) return false;
  }
  if (f.controlar_soma) {
    var lim = limitesSoma(n, cfg), lo = f.soma_min || lim[0], hi = f.soma_max || lim[1], s = soma(jogo);
    if (s < lo || s > hi) return false;
  }
  if (f.controlar_distribuicao && cfg.faixas.length) {
    var fx = distribuicaoFaixas(jogo, cfg), pf = n / cfg.faixas.length;
    if (Math.max.apply(null, fx) > pf + Math.max(2, pf)) return false;
    if (denso && Math.min.apply(null, fx) === 0) return false;
  }
  if (f.evitar_proximas && !denso && seqConsecutivas(jogo) > 3) return false;
  if (f.evitar_padroes_improvaveis) {
    var so = sortN(jogo);
    if (!denso && new Set(so.map(function (d) { return d % 10; })).size <= 2) return false;
    var difs = new Set();
    for (var i = 0; i < so.length - 1; i++) difs.add(so[i + 1] - so[i]);
    if (difs.size === 1) return false;
  }
  if (f.reduzir_repeticao && ultimo && !denso) {
    if (intersec(jogo, ultimo) > Math.max(2, Math.floor(n / 4))) return false;
  }
  return true;
}
function pesos(cs, cfg, estr, f) {
  var out = {};
  if (!cs.length) { cfg.dezenas.forEach(function (d) { out[d] = 1; }); return out; }
  var fr = frequencias(cs, cfg), at = atrasos(cs, cfg).atual, td = tendencia(cs, cfg);
  var mf = 1, ma = 1, mt = 1;
  cfg.dezenas.forEach(function (d) { mf = Math.max(mf, fr[d].abs); ma = Math.max(ma, at[d]); mt = Math.max(mt, td[d]); });
  var usaQ = !f || f.usar_quentes !== false, usaA = !f || f.usar_atrasadas !== false;
  cfg.dezenas.forEach(function (d) {
    var F = usaQ ? fr[d].abs / mf : 0.5, A = usaA ? at[d] / ma : 0.5, T = td[d] / mt, w;
    if (estr === "Estatística") w = 0.5 * F + 0.3 * A + 0.2 * T;
    else if (estr === "Agressiva") w = 0.2 * F + 0.5 * A + 0.3 * T;
    else if (estr === "Conservadora") w = 0.7 * F + 0.1 * A + 0.2 * T;
    else w = 1;
    out[d] = Math.max(w, 0.05);
  });
  return out;
}
function gerarJogos(cs, cfg, nDez, nJogos, estr, f, maxTent) {
  nDez = nDez || cfg.aposta_min; f = f || filtrosPadrao(); maxTent = maxTent || 40000;
  var ultimo = cs.length ? cs[cs.length - 1].dezenas.slice(0, cfg.sorteadas) : null;
  var p = pesos(cs, cfg, estr, f), dez = cfg.dezenas, cum = acumular(dez.map(function (d) { return p[d]; }));
  var jogos = [], vistos = new Set(), tent = 0;
  while (jogos.length < nJogos && tent < maxTent) {
    tent++;
    var s = new Set();
    while (s.size < nDez) s.add(choiceW(dez, cum));
    var jogo = sortN(Array.from(s)), k = jogo.join(",");
    if (vistos.has(k)) continue;
    if (estr === "Alta cobertura" && jogos.length) {
      var mx = 0;
      for (var i = 0; i < jogos.length; i++) mx = Math.max(mx, intersec(jogo, jogos[i]));
      if (mx > nDez * 0.7 && Math.random() < 0.8) continue;
    }
    if (jogoValido(jogo, f, cfg, ultimo)) { vistos.add(k); jogos.push(jogo); }
  }
  return jogos;
}
function gerarColunar(cs, cfg, porCol, nJogos, estr) {
  var tab = cs.length ? porColuna(cs, cfg) : null, jogos = [], vistos = new Set(), tent = 0;
  var maxPossivel = Math.pow(comb(10, porCol), cfg.colunas);
  nJogos = Math.min(nJogos, maxPossivel);
  while (jogos.length < nJogos && tent < 20000) {
    tent++;
    var jogo = [];
    for (var col = 0; col < cfg.colunas; col++) {
      var pw;
      if (tab) {
        var fc = tab[col], mx = 1;
        cfg.dezenas.forEach(function (d) { mx = Math.max(mx, fc[d]); });
        pw = cfg.dezenas.map(function (d) {
          if (estr === "Conservadora") return fc[d] / mx + 0.05;
          if (estr === "Agressiva") return 1.05 - fc[d] / mx;
          return 0.5 + fc[d] / mx * 0.5;
        });
      } else pw = cfg.dezenas.map(function () { return 1; });
      var cum = acumular(pw), esc = new Set();
      while (esc.size < porCol) esc.add(choiceW(cfg.dezenas, cum));
      jogo.push(sortN(Array.from(esc)));
    }
    var k = JSON.stringify(jogo);
    if (vistos.has(k)) continue;
    vistos.add(k); jogos.push(jogo);
  }
  return jogos;
}

/* ======================= MegaCover AI ======================= */
var METODOS = ["DNA das Combinações", "Otimização Elite"];
function contexto(cs, cfg) {
  var ctx = {};
  if (!cs.length) { cfg.dezenas.forEach(function (d) { ctx[d] = [0.5, 0.5]; }); return ctx; }
  var fr = frequencias(cs, cfg), at = atrasos(cs, cfg).atual, mf = 1, ma = 1;
  cfg.dezenas.forEach(function (d) { mf = Math.max(mf, fr[d].abs); ma = Math.max(ma, at[d]); });
  cfg.dezenas.forEach(function (d) { ctx[d] = [fr[d].abs / mf, Math.min(at[d] / ma, 1)]; });
  return ctx;
}
/* MegaScore™ 0–100 | Frequência 25% · Distribuição 25% · Atraso 20% · Cobertura 20% · Padrões 10% */
function megascore(jogo, cfg, ctx) {
  var n = jogo.length, sf = 0, br = 0;
  jogo.forEach(function (d) { sf += ctx[d][0]; br += ctx[d][1]; });
  sf /= n; br /= n;
  var sa = 1 - Math.abs(br - 0.5) * 2, sd = 1;
  if (cfg.faixas.length) {
    var fx = distribuicaoFaixas(jogo, cfg);
    sd = fx.filter(function (v) { return v > 0; }).length / cfg.faixas.length;
    var pf = n / cfg.faixas.length;
    if (Math.max.apply(null, fx) > pf + Math.max(2, pf)) sd *= 0.5;
  }
  var s = sortN(jogo), ideal = n > 1 ? (cfg.universo - cfg.inicio) / (n - 1) : 1, v = 0;
  for (var i = 0; i < n - 1; i++) v += Math.pow(s[i + 1] - s[i] - ideal, 2);
  v /= Math.max(n - 1, 1);
  var sc = Math.max(0, 1 - Math.sqrt(v) / ideal / 2), sp = 1;
  if (cfg.universo > 30 && seqConsecutivas(jogo) > 2) sp -= 0.4;
  var pi = paresImpares(jogo);
  if (pi[0] === 0 || pi[1] === 0) sp -= 0.4;
  var lim = limitesSoma(n, cfg), so = soma(jogo);
  if (so < lim[0] || so > lim[1]) sp -= 0.2;
  sp = Math.max(0, sp);
  return Math.round(1000 * (0.25 * sf + 0.25 * sd + 0.20 * sa + 0.20 * sc + 0.10 * sp)) / 10;
}
function diversidade(jogos) {
  if (jogos.length < 2) return [1, 0];
  var n = jogos[0].length, us = new Set();
  jogos.forEach(function (j) { j.forEach(function (d) { us.add(d); }); });
  var cob = us.size / Math.min(jogos.length * n, 60), tot = 0, pares = 0;
  for (var a = 0; a < jogos.length; a++) for (var b = a + 1; b < jogos.length; b++) { tot += intersec(jogos[a], jogos[b]); pares++; }
  return [cob, tot / pares / n];
}
function fitness(jogos, cfg, ctx) {
  var ms = 0;
  jogos.forEach(function (j) { ms += megascore(j, cfg, ctx); });
  ms /= jogos.length;
  var dv = diversidade(jogos);
  return 0.55 * ms + 0.30 * dv[0] * 100 - 0.15 * dv[1] * 100;
}
function mutar(jogo, n, cfg) {
  var s = new Set(jogo), arr = Array.from(s);
  s.delete(arr[rnd(arr.length)]);
  while (s.size < n) s.add(cfg.inicio + rnd(cfg.universo - cfg.inicio + 1));
  return sortN(Array.from(s));
}
function cruzar(a, b, n, cfg) {
  var pool = shuffle(Array.from(new Set(a.concat(b)))), s = new Set(pool.slice(0, n));
  while (s.size < n) s.add(cfg.inicio + rnd(cfg.universo - cfg.inicio + 1));
  return sortN(Array.from(s));
}
function pausa() { return new Promise(function (r) { setTimeout(r, 0); }); }

/* DNA das Combinações™ — algoritmo evolutivo */
async function otimizarDNA(cs, iniciais, cfg, prog, geracoes, pop) {
  geracoes = geracoes || 50; pop = pop || 24;
  var n = iniciais[0].length, q = iniciais.length, ctx = contexto(cs, cfg);
  function indiv() { var o = []; for (var i = 0; i < q; i++) o.push(mutar(sample(cfg.dezenas, n), n, cfg)); return o; }
  var popu = [iniciais.map(function (j) { return j.slice(); })];
  while (popu.length < pop) popu.push(indiv());
  var melhor = popu[0], mfit = -1e9;
  for (var g = 0; g < geracoes; g++) {
    var av = popu.map(function (ind) { return [fitness(ind, cfg, ctx), ind]; }).sort(function (x, y) { return y[0] - x[0]; });
    if (av[0][0] > mfit) { mfit = av[0][0]; melhor = av[0][1]; }
    var elite = av.slice(0, Math.max(2, Math.floor(pop / 5))).map(function (x) { return x[1]; }), nova = elite.slice();
    while (nova.length < pop) {
      var pp = sample(elite, 2), filho = [];
      for (var i = 0; i < q; i++) { var c = cruzar(pp[0][i], pp[1][i], n, cfg); if (Math.random() < 0.3) c = mutar(c, n, cfg); filho.push(c); }
      nova.push(filho);
    }
    popu = nova;
    if (prog) prog((g + 1) / geracoes, mfit);
    await pausa();
  }
  return {jogos: melhor, fit: mfit};
}
/* Otimização Elite™ — recozimento simulado */
async function otimizarElite(cs, jogos, cfg, prog, iter, t0) {
  iter = iter || 1500; t0 = t0 || 10;
  var n = jogos[0].length, ctx = contexto(cs, cfg), at = jogos.map(function (j) { return j.slice(); });
  var fit = fitness(at, cfg, ctx), melhor = at, mfit = fit;
  for (var i = 0; i < iter; i++) {
    var t = t0 * (1 - i / iter) + 0.01, viz = at.map(function (j) { return j.slice(); }), idx = rnd(viz.length);
    viz[idx] = mutar(viz[idx], n, cfg);
    var f2 = fitness(viz, cfg, ctx);
    if (f2 > fit || Math.random() < Math.exp((f2 - fit) / t)) {
      at = viz; fit = f2;
      if (fit > mfit) { melhor = at; mfit = fit; }
    }
    if (i % 50 === 0) { if (prog) prog(i / iter, mfit); await pausa(); }
  }
  return {jogos: melhor, fit: mfit};
}
function otimizar(metodo, cs, jogos, cfg, prog) {
  return metodo === "DNA das Combinações" ? otimizarDNA(cs, jogos, cfg, prog) : otimizarElite(cs, jogos, cfg, prog);
}

/* ======================= Monte Carlo ======================= */
async function monteCarlo(jogos, cfg, nSim, prog) {
  var dist = {}, total = 0, t0 = Date.now(), i;
  if (cfg.colunar) {
    var marc = jogos.map(function (j) { return j.map(function (col) { return new Set(col); }); });
    for (i = 0; i < nSim; i++) {
      var srt = []; for (var c = 0; c < cfg.colunas; c++) srt.push(rnd(10));
      var mel = 0;
      for (var g = 0; g < marc.length; g++) {
        var h = 0; for (c = 0; c < cfg.colunas; c++) if (marc[g][c].has(srt[c])) h++;
        if (h > mel) mel = h;
      }
      dist[mel] = (dist[mel] || 0) + 1; total += mel;
      if (Date.now() - t0 > 40) { if (prog) prog(i / nSim); await pausa(); t0 = Date.now(); }
    }
  } else {
    var U = cfg.dezenas.slice(), N = U.length, K = cfg.sorteadas, mark = new Uint8Array(cfg.universo + 1);
    for (i = 0; i < nSim; i++) {
      var melhor = 0;
      for (var s = 0; s < cfg.sorteios; s++) {
        for (var a = 0; a < K; a++) { var b = a + rnd(N - a), t = U[a]; U[a] = U[b]; U[b] = t; mark[U[a]] = 1; }
        for (g = 0; g < jogos.length; g++) {
          var j = jogos[g], hh = 0;
          for (var x = 0; x < j.length; x++) hh += mark[j[x]];
          if (hh > melhor) melhor = hh;
        }
        for (a = 0; a < K; a++) mark[U[a]] = 0;
      }
      dist[melhor] = (dist[melhor] || 0) + 1; total += melhor;
      if (Date.now() - t0 > 40) { if (prog) prog(i / nSim); await pausa(); t0 = Date.now(); }
    }
  }
  var res = {simulacoes: nSim, media: total / nSim, dist: dist, faixas: {}};
  cfg.premios.forEach(function (fx) {
    var v = 0; Object.keys(dist).forEach(function (k) { if (+k >= fx) v += dist[k]; });
    res.faixas[fx] = v / nSim;
  });
  if (prog) prog(1);
  return res;
}
/* Probabilidade exata (hipergeométrica) de uma aposta de n dezenas acertar exatamente k */
function probExata(cfg, n, k) {
  var U = cfg.universo - cfg.inicio + 1, S = cfg.sorteadas;
  return comb(n, k) * comb(U - n, S - k) / comb(U, S);
}

/* ======================= Fechamentos ======================= */
var PERFIS = ["Econômico", "Equilibrado", "Agressivo"];
function garantias(cfg) {
  if (cfg.colunar) return {};
  var t = {megasena: {"Quadra": 4, "Quina": 5, "Sena": 6},
    lotofacil: {"11 acertos": 11, "12 acertos": 12, "13 acertos": 13},
    quina: {"Terno": 3, "Quadra": 4, "Quina": 5},
    lotomania: {"15 acertos": 15, "16 acertos": 16, "17 acertos": 17},
    duplasena: {"Terno": 3, "Quadra": 4, "Quina": 5},
    timemania: {"3 acertos": 3, "4 acertos": 4, "5 acertos": 5},
    diadesorte: {"4 acertos": 4, "5 acertos": 5, "6 acertos": 6},
    maismilionaria: {"3 acertos": 3, "4 acertos": 4, "5 acertos": 5}};
  return t[cfg.chave] || {"Terno": 3, "Quadra": 4, "Quina": 5};
}
function ganho(cand, alvo, t, amostras) {
  var n = 0;
  if (amostras == null) { combinations(cand, t, function (s) { if (alvo.has(s.join(","))) n++; }); return n; }
  for (var i = 0; i < amostras; i++) if (alvo.has(sortN(sample(cand, t)).join(","))) n++;
  return n;
}
async function greedyCover(base, t, tam, maxJogos, prog, tempoMax) {
  tempoMax = tempoMax || 15000;
  base = sortN(base);
  var totalAlvos = comb(base.length, t), LIM = 12000, estimado = totalAlvos > LIM, alvo = new Set();
  if (estimado) { while (alvo.size < LIM) alvo.add(sortN(sample(base, t)).join(",")); }
  else combinations(base, t, function (s) { alvo.add(s.join(",")); });
  var considerado = alvo.size, amostras = null;
  if (comb(tam, t) > 4000) { amostras = 1500; estimado = true; }
  var candidatos = null;
  if (comb(base.length, tam) <= 40000) { candidatos = []; combinations(base, tam, function (s) { candidatos.push(s); }); shuffle(candidatos); }
  var amax = tam <= 8 ? 300 : (tam <= 20 ? 60 : 25), jogos = [], ini = Date.now(), tick = Date.now();
  while (alvo.size && (!maxJogos || jogos.length < maxJogos)) {
    if (Date.now() - ini > tempoMax) break;
    var lote = [];
    if (!candidatos) for (var i = 0; i < amax; i++) lote.push(sortN(sample(base, tam)));
    else lote = sample(candidatos, Math.min(candidatos.length, amax));
    var melhor = null, g = -1;
    for (i = 0; i < lote.length; i++) { var x = ganho(lote[i], alvo, t, amostras); if (x > g) { g = x; melhor = lote[i]; } }
    if (!melhor || g <= 0) { if (jogos.length) break; melhor = lote[0]; }
    jogos.push(melhor.slice());
    if (amostras == null) combinations(melhor, t, function (s) { alvo.delete(s.join(",")); });
    else for (i = 0; i < amostras * 3; i++) alvo.delete(sortN(sample(melhor, t)).join(","));
    if (Date.now() - tick > 40) { if (prog) prog(1 - alvo.size / considerado, jogos.length); await pausa(); tick = Date.now(); }
  }
  return {jogos: jogos, restantes: alvo.size, considerado: considerado, estimado: estimado};
}
async function gerarFechamento(base, cfg, perfil, garantia, tam, maxJogos, prog, tempoMax) {
  if (cfg.colunar) throw new Error("O Super Sete usa o fechamento por colunas.");
  base = sortN(Array.from(new Set(base.map(Number))));
  var gar = garantias(cfg), nomes = Object.keys(gar);
  garantia = garantia || nomes[0];
  var t = gar[garantia] || gar[nomes[0]];
  tam = tam || cfg.aposta_min;
  if (base.some(function (d) { return isNaN(d) || d < cfg.inicio || d > cfg.universo; }))
    throw new Error("As dezenas devem estar entre " + cfg.inicio + " e " + cfg.universo + ".");
  if (base.length <= tam) throw new Error("A base deve ter mais que " + tam + " dezenas (tamanho do jogo) para gerar um fechamento.");
  if (base.length > cfg.dezenas.length) throw new Error("A base não pode exceder " + cfg.dezenas.length + " dezenas.");
  var at, lim;
  if (perfil === "Econômico") { at = Math.max(3, t - 1); lim = maxJogos || Math.max(5, base.length - tam + 3) * 3; }
  else if (perfil === "Agressivo") { at = t; lim = maxJogos; }
  else { at = t; lim = maxJogos || Math.max(10, (base.length - tam + 1) * 12); }
  if (at > tam) at = tam;
  while (at > 2 && comb(tam, at) > 3000000) at--;
  var r = await greedyCover(base, at, tam, lim, prog, tempoMax);
  if (!r.jogos.length) throw new Error("Não foi possível montar o fechamento com estes parâmetros.");
  var cob = r.considerado ? 1 - r.restantes / r.considerado : 0;
  return {jogos: r.jogos, info: {
    base: base, perfil: perfil, tamanho_jogo: tam, garantia_alvo: garantia, calculada_em: at,
    qtd_jogos: r.jogos.length, cobertura_pct: Math.round(cob * 10000) / 100, estimada: r.estimado,
    observacao: (r.estimado ? "Cobertura ESTIMADA por amostragem dentro da base escolhida. "
      : "Cobertura matemática calculada dentro da base escolhida. ") + "Não constitui garantia de premiação."}};
}
function sugerirBase(cs, cfg, n) {
  var r = ranking(cs, cfg, n), base = [];
  for (var i = 0; i < n; i++) {
    [r.quentes[i], r.atrasadas[i]].forEach(function (x) { if (x && base.indexOf(x[0]) < 0 && base.length < n) base.push(x[0]); });
  }
  for (i = 0; base.length < n && i < cfg.dezenas.length; i++) if (base.indexOf(cfg.dezenas[i]) < 0) base.push(cfg.dezenas[i]);
  return sortN(base);
}

/* ---------- Super Sete: volante por colunas ---------- */
var PERFIS_SS = ["Equilibrado", "Estatístico", "Sequencial"];
function custoSS(cartao) { var t = 1; cartao.forEach(function (c) { t *= c.length; }); return t; }
function validarSS(qtd, colunas) {
  colunas = colunas || 7;
  var tot = soma(qtd);
  if (qtd.length !== colunas) throw new Error("O cartão deve ter " + colunas + " colunas.");
  if (qtd.some(function (q) { return q < 1 || q > 3; })) throw new Error("Cada coluna deve ter de 1 a 3 números.");
  if (tot < colunas || tot > colunas * 3) throw new Error("O total deve ficar entre " + colunas + " e " + colunas * 3 + " números.");
  if (tot <= 14 && qtd.some(function (q) { return q > 2; })) throw new Error("Com até 14 números marcados, o máximo é 2 por coluna.");
  if (tot > 14 && qtd.some(function (q) { return q < 2; })) throw new Error("Com 15 números ou mais, cada coluna precisa ter no mínimo 2.");
  return true;
}
function distribuirColunas(total, colunas, prioridade) {
  colunas = colunas || 7;
  if (total < colunas || total > colunas * 3) throw new Error("O total deve ficar entre " + colunas + " e " + colunas * 3 + " números.");
  var ordem = prioridade || Array.from({length: colunas}, function (_, i) { return i; });
  var qtd = ordem.map(function () { return 1; }), ex = total - colunas, i;
  for (i = 0; ex > 0 && i < colunas; i++, ex--) qtd[ordem[i]] = 2;
  for (i = 0; ex > 0 && i < colunas; i++, ex--) qtd[ordem[i]] = 3;
  validarSS(qtd, colunas);
  return qtd;
}
function fechamentoSS(cs, cfg, total, perfil, maxExp) {
  maxExp = maxExp || 2187;
  var tab = cs.length ? porColuna(cs, cfg) : null, ids = Array.from({length: cfg.colunas}, function (_, i) { return i; });
  var prio = ids.slice();
  if (perfil === "Estatístico" && tab) {
    /* colunas mais "indefinidas" (dígito líder menos dominante) recebem os extras primeiro */
    prio.sort(function (a, b) {
      function dom(i) { var f = tab[i], s = 0, m = 0; for (var d in f) { s += f[d]; m = Math.max(m, f[d]); } return m / (s || 1); }
      return dom(a) - dom(b);
    });
  }
  var qtd = distribuirColunas(total, cfg.colunas, prio), cartao = [];
  for (var c = 0; c < cfg.colunas; c++) {
    if (tab) { var f = tab[c]; cartao.push(sortN(cfg.dezenas.slice().sort(function (a, b) { return f[b] - f[a] || a - b; }).slice(0, qtd[c]))); }
    else cartao.push(sortN(sample(cfg.dezenas, qtd[c])));
  }
  var custo = custoSS(cartao), jogos = [];
  if (custo <= maxExp) {
    (function rec(i, acc) {
      if (i === cartao.length) { jogos.push(acc.map(function (d) { return [d]; })); return; }
      cartao[i].forEach(function (d) { rec(i + 1, acc.concat([d])); });
    })(0, []);
  }
  return {cartao: cartao, jogos: jogos, info: {perfil: perfil, total: total, por_coluna: qtd, jogos_simples: custo,
    observacao: "Marcando esses números no volante, a aposta equivale a " + custo +
      " jogo(s) simples. Ferramenta de cobertura: não constitui garantia de premiação."}};
}

/* ======================= Conferência ======================= */
/* ---------- formato dos dados: [concurso, "dd/mm/aaaa", dezenas, extra] → objeto ---------- */
function normTime(s) { return String(s || "").replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").trim().toUpperCase(); }
function rowParaConcurso(cfg, r) {
  var dz = (r[2] || []).map(Number), extra = "";
  if (cfg.sorteios > 1) dz = dz.concat((r[3] || []).map(Number));
  else if (cfg.extra_qtd > 1) extra = (r[3] || []).map(Number).sort(num).join(",");
  else if (cfg.extra_nome) extra = cfg.chave === "timemania" ? normTime(r[3]) : String(r[3] || "").trim();
  if (!cfg.colunar) {
    if (cfg.sorteios > 1) { var n = cfg.sorteadas; dz = sortN(dz.slice(0, n)).concat(sortN(dz.slice(n))); }
    else dz = sortN(dz);
  }
  return {concurso: +r[0], data: r[1] || "", dezenas: dz, extra: extra};
}
function conferir(jogo, concurso, cfg) {
  if (cfg.colunar) {
    var h = 0;
    for (var c = 0; c < cfg.colunas; c++) if (jogo[c].indexOf(concurso.dezenas[c]) >= 0) h++;
    return [h];
  }
  return sorteiosDe(concurso, cfg).map(function (s) { return intersec(jogo, s); });
}

var MC = {
  ORDEM: ORDEM, TODAS: TODAS, ESTRATEGIAS: ESTRATEGIAS, FILTROS: FILTROS, METODOS: METODOS,
  PERFIS: PERFIS, PERFIS_SS: PERFIS_SS,
  util: {rnd: rnd, sample: sample, shuffle: shuffle, sortN: sortN, comb: comb, combinations: combinations, intersec: intersec},
  sorteiosDe: sorteiosDe, porColuna: porColuna, frequencias: frequencias, atrasos: atrasos, tendencia: tendencia,
  mediaRepeticao: mediaRepeticao, ranking: ranking, paresImpares: paresImpares, distParesImpares: distParesImpares,
  distribuicaoFaixas: distribuicaoFaixas, distFaixasHistorica: distFaixasHistorica, soma: soma, distSomas: distSomas,
  seqConsecutivas: seqConsecutivas, distSequencias: distSequencias, primos: primos, molduraMiolo: molduraMiolo,
  frequenciaExtras: frequenciaExtras, atrasoExtras: atrasoExtras, partesExtra: partesExtra,
  filtrosPadrao: filtrosPadrao, limitesSoma: limitesSoma, jogoValido: jogoValido,
  gerarJogos: gerarJogos, gerarColunar: gerarColunar, contexto: contexto, megascore: megascore, fitness: fitness,
  otimizar: otimizar, monteCarlo: monteCarlo, probExata: probExata,
  garantias: garantias, gerarFechamento: gerarFechamento, sugerirBase: sugerirBase,
  custoSS: custoSS, validarSS: validarSS, distribuirColunas: distribuirColunas, fechamentoSS: fechamentoSS,
  conferir: conferir, rowParaConcurso: rowParaConcurso, normTime: normTime
};
if (typeof module !== "undefined" && module.exports) module.exports = MC;
else root.MC = MC;
})(typeof globalThis !== "undefined" ? globalThis : this);
