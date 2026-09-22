/* MegaCover Pro Elite (Web) — interface.
   Página estática: roda no GitHub Pages (ou qualquer hospedagem) sem servidor. */
(function () {
"use strict";

var GH = "https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/";
var GH_NOME = {megasena: "mega-sena", lotofacil: "lotofacil", quina: "quina", lotomania: "lotomania",
  duplasena: "dupla-sena", timemania: "timemania", diadesorte: "dia-de-sorte", supersete: "super-sete",
  maismilionaria: "mais-milionaria"};
var ABAS = [["dashboard", "🏠 Dashboard"], ["estatisticas", "📊 Estatísticas"], ["padroes", "🧩 Padrões"],
  ["gerador", "⚡ Gerador"], ["fechamentos", "🎯 Fechamentos"], ["simulador", "🎲 Simulador"],
  ["conferir", "✅ Conferir"], ["dados", "📥 Dados"]];

var S = {lot: "megasena", aba: "dashboard", dados: {}, meta: {}, ger: {}, fech: {}, carregando: {}, ordem: {}};
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function cfgAtual() { return MC.TODAS[S.lot]; }
function cs() { return S.dados[S.lot] || []; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
function fmtN(n) { return Number(n).toLocaleString("pt-BR"); }
function pct(v, d) { return (v * 100).toLocaleString("pt-BR", {minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d}) + "%"; }
function ls(k, v) {
  try {
    if (v === undefined) { var x = localStorage.getItem("mc:" + k); return x ? JSON.parse(x) : null; }
    if (v === null) localStorage.removeItem("mc:" + k); else localStorage.setItem("mc:" + k, JSON.stringify(v));
  } catch (e) { return null; }
}
var tStatus;
function status(msg) {
  var el = $("#status"); el.textContent = msg; el.classList.add("on");
  clearTimeout(tStatus); tStatus = setTimeout(function () { el.classList.remove("on"); }, 3200);
}

/* ======================= Dados ======================= */
function normTime(s) { return String(s || "").replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").trim().toUpperCase(); }
function rowParaConcurso(cfg, r) {
  var dz = (r[2] || []).map(Number), extra = "";
  if (cfg.sorteios > 1) dz = dz.concat((r[3] || []).map(Number));
  else if (cfg.extra_qtd > 1) extra = (r[3] || []).map(Number).sort(function (a, b) { return a - b; }).join(",");
  else if (cfg.extra_nome) extra = cfg.chave === "timemania" ? normTime(r[3]) : String(r[3] || "").trim();
  if (!cfg.colunar) {
    if (cfg.sorteios > 1) {
      var n = cfg.sorteadas;
      dz = MC.util.sortN(dz.slice(0, n)).concat(MC.util.sortN(dz.slice(n)));
    } else dz = MC.util.sortN(dz);
  }
  return {concurso: +r[0], data: r[1] || "", dezenas: dz, extra: extra};
}
function concursoParaRow(cfg, c) {
  var row = [c.concurso, c.data, c.dezenas.slice(0, cfg.colunar ? cfg.colunas : cfg.sorteadas)];
  if (cfg.sorteios > 1) row.push(c.dezenas.slice(cfg.sorteadas));
  else if (cfg.extra_qtd > 1) row.push(c.extra ? c.extra.split(",").map(Number) : []);
  else if (cfg.extra_nome) row.push(c.extra || "");
  return row;
}
function ghParaRow(cfg, x) {
  var dz = (x.resultado || x.resultado_1 || []).map(Number);
  if (!dz.length) return null;
  var row = [+x.concurso, x.data || "", dz];
  if (cfg.sorteios > 1) row.push((x.resultado_2 || []).map(Number));
  else if (cfg.extra_qtd > 1) row.push((x.trevos || []).map(Number));
  else if (cfg.chave === "timemania") row.push(String(x.time_do_coracao || ""));
  else if (cfg.chave === "diadesorte") row.push(String(x.mes_da_sorte || x.mesSorte || ""));
  return row;
}
function mesclar(id, rows, persistir) {
  var cfg = MC.TODAS[id], mapa = new Map();
  (S.dados[id] || []).forEach(function (c) { mapa.set(c.concurso, c); });
  var novos = 0;
  rows.forEach(function (r) {
    if (!r || !r[0] || !r[2] || !r[2].length) return;
    var c = rowParaConcurso(cfg, r), antigo = mapa.get(c.concurso);
    if (!antigo) novos++;
    if (antigo && !c.extra && antigo.extra) c.extra = antigo.extra;
    if (antigo && !c.data && antigo.data) c.data = antigo.data;
    mapa.set(c.concurso, c);
  });
  S.dados[id] = Array.from(mapa.values()).sort(function (a, b) { return a.concurso - b.concurso; });
  if (persistir && novos) {
    var base = S.meta[id] ? S.meta[id].ultimoBase : 0;
    var extras = S.dados[id].filter(function (c) { return c.concurso > base; }).map(function (c) { return concursoParaRow(cfg, c); });
    ls("add:" + id, extras.slice(-3000));
  }
  return novos;
}
function getJSON(url, ms) {
  var ctrl = "AbortController" in window ? new AbortController() : null;
  var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 20000);
  return fetch(url, {signal: ctrl ? ctrl.signal : undefined, cache: "no-cache"}).then(function (r) {
    clearTimeout(t); if (!r.ok) throw new Error("HTTP " + r.status); return r.json();
  });
}
function carregar(id) {
  if (S.dados[id]) return Promise.resolve(S.dados[id]);
  if (S.carregando[id]) return S.carregando[id];
  var cfg = MC.TODAS[id];
  S.carregando[id] = getJSON("data/" + id + ".json").then(function (d) {
    S.meta[id] = {atualizado: d.atualizado, ultimoBase: d.concursos.length ? d.concursos[d.concursos.length - 1][0] : 0};
    S.dados[id] = d.concursos.map(function (r) { return rowParaConcurso(cfg, r); });
  }).catch(function () {
    /* sem data/ (ex.: arquivo aberto direto do disco): baixa direto do GitHub */
    S.meta[id] = {atualizado: null, ultimoBase: 0};
    S.dados[id] = [];
    return atualizarOnline(id, true);
  }).then(function () {
    var add = ls("add:" + id);
    if (add && add.length) mesclar(id, add, false);
    delete S.carregando[id];
    return S.dados[id];
  });
  return S.carregando[id];
}
function atualizarOnline(id, silencioso) {
  var cfg = MC.TODAS[id];
  return getJSON(GH + GH_NOME[id] + ".json", 60000).then(function (lista) {
    var rows = lista.map(function (x) { return ghParaRow(cfg, x); }).filter(Boolean);
    var n = mesclar(id, rows, true);
    ls("sync:" + id, Date.now());
    return n;
  }).catch(function (e) { if (!silencioso) throw e; return 0; });
}
function atualizarTodas() {
  var bt = $("#bt-atualizar-todas"); bt.disabled = true; bt.textContent = "⏳ Atualizando…";
  var ids = MC.ORDEM.map(function (l) { return l.chave; }), rel = [], feitos = 0;
  return Promise.all(ids.map(function (id) {
    return carregar(id).then(function () { return atualizarOnline(id); }).then(function (n) {
      rel.push(MC.TODAS[id].nome + ": " + (n ? "+" + n : "ok"));
    }).catch(function () { rel.push(MC.TODAS[id].nome + ": falhou"); }).then(function () {
      feitos++; bt.textContent = "⏳ " + feitos + "/9";
    });
  })).then(function () {
    bt.disabled = false; bt.textContent = "🔄 Atualizar TODAS";
    status("Atualização concluída — " + rel.join(" · "));
    render();
  });
}

/* ======================= Componentes ======================= */
function bola(cfg, d, acerto, peq) {
  return '<span class="bola' + (acerto ? " acerto" : "") + (peq ? " peq" : "") + '">' + cfg.fmt(d) + "</span>";
}
function bolas(cfg, lista, acertos, peq) {
  var s = acertos ? new Set(acertos) : null;
  return '<span class="bolas">' + lista.map(function (d) { return bola(cfg, d, s && s.has(d), peq); }).join("") + "</span>";
}
function bolasConcurso(cfg, c) {
  if (cfg.colunar) return colunasSS(c.dezenas.map(function (d) { return [d]; }));
  var sts = MC.sorteiosDe(c, cfg);
  var h = sts.map(function (s, i) { return (sts.length > 1 ? '<div style="margin:2px 0"><small>' + (i + 1) + "º sorteio</small> " : "<div>") + bolas(cfg, s) + "</div>"; }).join("");
  if (c.extra) h += '<div style="margin-top:6px"><span class="extra-tag">' + esc(cfg.extra_nome) + ": " + esc(c.extra) + "</span></div>";
  return h;
}
function colunasSS(jogo) {
  var cfg = MC.TODAS.supersete;
  return '<span class="bolas">' + jogo.map(function (col, i) {
    return '<span class="col-ss"><small>C' + (i + 1) + "</small>" + col.map(function (d) { return bola(cfg, d, false, true); }).join("") + "</span>";
  }).join("") + "</span>";
}
function classeScore(s) { return s >= 75 ? "alto" : s >= 60 ? "medio" : "baixo"; }
function kpi(rot, val, sub, peq) {
  return '<div class="kpi"><div class="rot">' + rot + '</div><div class="val' + (peq ? " peq" : "") + '">' + val + "</div>" + (sub ? '<div class="sub">' + sub + "</div>" : "") + "</div>";
}
function opcoes(lista, sel) {
  return lista.map(function (o) {
    var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
    return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? " selected" : "") + ">" + esc(t) + "</option>";
  }).join("");
}
/* gráfico de barras em SVG (valores2 opcional = segunda série) */
function grafico(rotulos, valores, o) {
  o = o || {};
  var W = o.largura || 900, H = o.altura || 240, pe = 26, pt = 14, pl = 34, n = rotulos.length;
  var v2 = o.valores2, mx = Math.max.apply(null, valores.concat(v2 || [0]).concat([1]));
  var bw = (W - pl - 6) / n, g = '<svg class="grafico" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.titulo || "gráfico") + '">';
  for (var k = 0; k <= 4; k++) {
    var y = pt + (H - pt - pe) * (1 - k / 4), val = mx * k / 4;
    g += '<line class="eixo" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>';
    g += '<text x="' + (pl - 4) + '" y="' + (y + 3) + '" text-anchor="end">' + (val >= 100 ? Math.round(val) : Math.round(val * 10) / 10) + "</text>";
  }
  var passo = Math.ceil(n / (o.maxRotulos || 40));
  rotulos.forEach(function (r, i) {
    var x = pl + i * bw, h = (H - pt - pe) * valores[i] / mx, w = v2 ? bw * 0.42 : bw * 0.78;
    g += '<rect class="b1" x="' + (x + bw * 0.11) + '" y="' + (H - pe - h) + '" width="' + w + '" height="' + h + '" rx="2"><title>' + esc(r) + ": " + fmtN(valores[i]) + "</title></rect>";
    if (v2) {
      var h2 = (H - pt - pe) * v2[i] / mx;
      g += '<rect class="b2" x="' + (x + bw * 0.11 + w) + '" y="' + (H - pe - h2) + '" width="' + w + '" height="' + h2 + '" rx="2"><title>' + esc(r) + ": " + fmtN(v2[i]) + "</title></rect>";
    }
    if (i % passo === 0) g += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(r) + "</text>";
  });
  return g + "</svg>";
}
function tabela(cab, linhas, id) {
  return '<div class="tabela-wrap"><table' + (id ? ' id="' + id + '"' : "") + "><thead><tr>" + cab.map(function (c, i) {
    return '<th class="' + (id ? "ord" : "") + '" data-i="' + i + '">' + c + "</th>";
  }).join("") + "</tr></thead><tbody>" + linhas.map(function (l) {
    return "<tr>" + l.map(function (c) {
      var v = c && typeof c === "object" ? c : {h: c};
      return "<td" + (typeof v.h === "number" || v.num ? ' class="num"' : "") + (v.s != null ? ' data-s="' + v.s + '"' : "") + ">" + (typeof v.h === "number" ? fmtN(v.h) : v.h) + "</td>";
    }).join("") + "</tr>";
  }).join("") + "</tbody></table></div>";
}
function ativarOrdenacao(id) {
  var t = document.getElementById(id); if (!t) return;
  $$("th", t).forEach(function (th) {
    th.title = "Clique para ordenar";
    th.addEventListener("click", function () {
      var i = +th.dataset.i, desc = th.dataset.d !== "1";
      $$("th", t).forEach(function (x) { x.dataset.d = ""; }); th.dataset.d = desc ? "1" : "";
      var tb = t.tBodies[0], rows = Array.prototype.slice.call(tb.rows);
      rows.sort(function (a, b) {
        var ca = a.cells[i], cb = b.cells[i];
        var va = ca.dataset.s != null ? +ca.dataset.s : parseFloat(ca.textContent.replace(/\./g, "").replace(",", "."));
        var vb = cb.dataset.s != null ? +cb.dataset.s : parseFloat(cb.textContent.replace(/\./g, "").replace(",", "."));
        if (isNaN(va) || isNaN(vb)) { va = ca.textContent; vb = cb.textContent; return desc ? vb.localeCompare(va) : va.localeCompare(vb); }
        return desc ? vb - va : va - vb;
      });
      rows.forEach(function (r) { tb.appendChild(r); });
    });
  });
}
function baixar(nome, conteudo, tipo) {
  var b = new Blob([conteudo], {type: tipo || "text/plain;charset=utf-8"}), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function progresso(el, v) { el.classList.add("on"); el.firstElementChild.style.width = Math.round(v * 100) + "%"; }

/* ======================= Navegação ======================= */
function montarNav() {
  $("#loterias").innerHTML = MC.ORDEM.map(function (l) {
    return '<button class="chip" type="button" data-id="' + l.chave + '">' + l.emo + " " + esc(l.nome.toUpperCase()) + "</button>";
  }).join("");
  $("#abas").innerHTML = ABAS.map(function (a) { return '<button class="aba" type="button" data-aba="' + a[0] + '">' + a[1] + "</button>"; }).join("");
  $("#loterias").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) ir(b.dataset.id, S.aba); });
  $("#abas").addEventListener("click", function (e) { var b = e.target.closest(".aba"); if (b) ir(S.lot, b.dataset.aba); });
}
function ir(lot, aba) {
  S.lot = MC.TODAS[lot] ? lot : "megasena";
  S.aba = ABAS.some(function (a) { return a[0] === aba; }) ? aba : "dashboard";
  var h = "#" + S.lot + "/" + S.aba;
  if (location.hash !== h) history.replaceState(null, "", h);
  ls("ultima", [S.lot, S.aba]);
  render();
}
function render() {
  var cfg = cfgAtual();
  document.documentElement.style.setProperty("--cor-lot", cfg.cor);
  $$(".chip").forEach(function (b) { b.setAttribute("aria-current", b.dataset.id === S.lot); });
  $$(".aba").forEach(function (b) { b.setAttribute("aria-current", b.dataset.aba === S.aba); });
  var sel = $('.chip[aria-current="true"]'); if (sel && sel.scrollIntoView) sel.scrollIntoView({block: "nearest", inline: "nearest"});
  document.title = cfg.nome + " · MegaCover Pro Elite";
  var main = $("#conteudo");
  if (!S.dados[S.lot]) {
    main.innerHTML = '<p class="carregando">Carregando histórico da ' + esc(cfg.nome) + "…</p>";
    carregar(S.lot).then(render); return;
  }
  var cab = '<div class="titulo-lot"><h2>' + cfg.emo + " " + esc(cfg.nome) + '</h2><span class="selo">' + fmtN(cs().length) + " concursos</span></div>" +
    (cfg.nota && S.aba === "dashboard" ? '<p class="nota">ℹ ' + esc(cfg.nota) + "</p>" : "");
  main.innerHTML = cab + '<div id="aba"></div>';
  TELAS[S.aba]($("#aba"), cfg);
}

/* ======================= Telas ======================= */
var TELAS = {};

TELAS.dashboard = function (el, cfg) {
  var c = cs(), u = c[c.length - 1];
  if (!u) { el.innerHTML = '<p class="vazio">Sem resultados. Use a aba 📥 Dados para atualizar ou importar.</p>'; return; }
  var r = cfg.colunar ? null : MC.ranking(c, cfg, 5), h = '<div class="kpis">';
  h += kpi("Último concurso", fmtN(u.concurso), esc(u.data));
  h += kpi("Concursos na base", fmtN(c.length), "desde o nº " + fmtN(c[0].concurso));
  if (r) {
    h += kpi("Mais sorteadas", r.quentes.map(function (x) { return cfg.fmt(x[0]); }).join(" · "), "no histórico completo", true);
    h += kpi("Mais atrasadas", r.atrasadas.map(function (x) { return cfg.fmt(x[0]); }).join(" · "), "concursos sem sair: " + r.atrasadas.map(function (x) { return x[1]; }).join(", "), true);
  }
  if (cfg.extra_nome) {
    var fx = MC.frequenciaExtras(c, cfg);
    h += kpi(esc(cfg.extra_nome) + " + sorteado", fx.length ? esc(fx[0][0]) : "—", fx.length ? fmtN(fx[0][1]) + " vezes (" + fx[0][2].toFixed(1).replace(".", ",") + "%)" : "sem dados", true);
  }
  var sy = ls("sync:" + S.lot);
  h += kpi("Base atualizada", sy ? new Date(sy).toLocaleDateString("pt-BR") : (S.meta[S.lot].atualizado ? new Date(S.meta[S.lot].atualizado).toLocaleDateString("pt-BR") : "—"), sy ? "online neste navegador" : "arquivo do site", true);
  h += "</div>";
  h += '<div class="grade g2"><div class="card"><h3>Último resultado — concurso ' + fmtN(u.concurso) + "</h3>" + bolasConcurso(cfg, u) + "</div>";
  h += '<div class="card"><h3>Consultar concurso anterior</h3><div class="form"><div class="campo"><label for="d-num">Concurso nº</label><input id="d-num" type="number" min="' + c[0].concurso + '" max="' + u.concurso + '" value="' + (u.concurso - 1) + '"></div><div class="campo"><button class="bt lot" id="d-ok" type="button">Consultar</button></div></div><div id="d-res" style="margin-top:12px"></div></div></div>';
  if (cfg.colunar) {
    var tab = MC.porColuna(c, cfg);
    h += '<div class="card"><h3>Dígito mais sorteado em cada coluna</h3><div class="bolas">' + tab.map(function (f, i) {
      var best = cfg.dezenas.slice().sort(function (a, b) { return f[b] - f[a]; })[0];
      return '<span class="col-ss"><small>C' + (i + 1) + "</small>" + bola(cfg, best) + "<small>" + f[best] + "x</small></span>";
    }).join("") + "</div></div>";
  } else {
    var fr = MC.frequencias(c, cfg);
    h += '<div class="card"><h3>Frequência de cada dezena</h3>' + grafico(cfg.dezenas.map(cfg.fmt.bind(cfg)), cfg.dezenas.map(function (d) { return fr[d].abs; }), {titulo: "Frequência", maxRotulos: cfg.dezenas.length > 60 ? 50 : 80}) + "</div>";
  }
  el.innerHTML = h;
  function consultar() {
    var n = +$("#d-num").value, achou = c.filter(function (x) { return x.concurso === n; })[0];
    $("#d-res").innerHTML = achou ? "<p><b>Concurso " + fmtN(n) + "</b> " + esc(achou.data) + "</p>" + bolasConcurso(cfg, achou) : '<p class="vazio">Concurso não encontrado na base.</p>';
  }
  $("#d-ok").onclick = consultar;
  $("#d-num").onkeydown = function (e) { if (e.key === "Enter") consultar(); };
};

TELAS.estatisticas = function (el, cfg) {
  var c = cs(), h = "";
  var jan = +(ls("janela") || 20);
  if (cfg.colunar) {
    var tab = MC.porColuna(c, cfg);
    h += '<div class="card"><h3>Frequência por coluna</h3><p class="dica">Quantas vezes cada dígito saiu em cada coluna (' + fmtN(c.length) + " concursos).</p>";
    h += tabela(["Dígito"].concat(tab.map(function (_, i) { return "Coluna " + (i + 1); })), cfg.dezenas.map(function (d) {
      return [d].concat(tab.map(function (f) { return f[d]; }));
    }), "t-ss") + "</div>";
    var at = [];
    for (var col = 0; col < cfg.colunas; col++) {
      var ult = {};
      c.forEach(function (x, i) { ult[x.dezenas[col]] = i; });
      at.push(ult);
    }
    h += '<div class="card"><h3>Atraso por coluna</h3><p class="dica">Há quantos concursos o dígito não sai naquela coluna.</p>' + tabela(["Dígito"].concat(at.map(function (_, i) { return "Coluna " + (i + 1); })), cfg.dezenas.map(function (d) {
      return [d].concat(at.map(function (u) { return u[d] == null ? c.length : c.length - 1 - u[d]; }));
    }), "t-ss2") + "</div>";
    el.innerHTML = h; ativarOrdenacao("t-ss"); ativarOrdenacao("t-ss2"); return;
  }
  var fr = MC.frequencias(c, cfg), at2 = MC.atrasos(c, cfg), td = MC.tendencia(c, cfg, jan);
  h += '<div class="card"><h3>Frequência, atraso e tendência</h3><div class="form" style="margin-bottom:12px"><div class="campo"><label for="e-jan">Janela da tendência (concursos)</label><select id="e-jan">' + opcoes([10, 20, 30, 50, 100], jan) + '</select></div></div><p class="dica">Clique no cabeçalho para ordenar.</p>';
  h += tabela(["Dezena", "Frequência", "%", "Atraso atual", "Maior atraso", "Últimos " + jan], cfg.dezenas.map(function (d) {
    return [{h: bola(cfg, d, false, true), s: d}, fr[d].abs, {h: fr[d].pct.toFixed(2).replace(".", ","), s: fr[d].pct, num: 1}, at2.atual[d], at2.maior[d], td[d]];
  }), "t-est") + "</div>";
  if (cfg.extra_nome) {
    var fx = MC.frequenciaExtras(c, cfg), ax = MC.atrasoExtras(c, cfg);
    h += '<div class="card"><h3>' + esc(cfg.extra_nome) + "</h3>";
    h += fx.length ? tabela(["#", esc(cfg.extra_nome), "Vezes", "%", "Atraso"], fx.map(function (x, i) {
      return [i + 1, esc(x[0]), x[1], {h: x[2].toFixed(2).replace(".", ","), s: x[2], num: 1}, ax[x[0]] != null ? ax[x[0]] : "—"];
    }), "t-ext") : '<p class="vazio">Sem dados do campo extra nesta base.</p>';
    h += "</div>";
  }
  el.innerHTML = h;
  ativarOrdenacao("t-est"); ativarOrdenacao("t-ext");
  $("#e-jan").onchange = function () { ls("janela", +this.value); render(); };
};

TELAS.padroes = function (el, cfg) {
  var c = cs(), h = "";
  if (cfg.colunar) {
    var sm = c.map(function (x) { return MC.soma(x.dezenas); }), cont = {};
    sm.forEach(function (s) { cont[s] = (cont[s] || 0) + 1; });
    var ks = []; for (var s = 0; s <= 63; s++) ks.push(s);
    var rep = 0; for (var i = 1; i < c.length; i++) for (var k = 0; k < 7; k++) if (c[i].dezenas[k] === c[i - 1].dezenas[k]) rep++;
    h += '<div class="kpis">' + kpi("Soma média", (sm.reduce(function (a, b) { return a + b; }, 0) / sm.length).toFixed(1).replace(".", ",")) +
      kpi("Colunas repetidas", (rep / Math.max(1, c.length - 1)).toFixed(2).replace(".", ","), "média por concurso vs. o anterior") + "</div>";
    h += '<div class="card"><h3>Soma dos 7 dígitos</h3>' + grafico(ks.map(String), ks.map(function (s) { return cont[s] || 0; }), {maxRotulos: 32}) + "</div>";
    el.innerHTML = h; return;
  }
  var pi = MC.distParesImpares(c, cfg).mostCommon().sort(function (a, b) { return parseInt(a[0]) - parseInt(b[0]); });
  var somas = MC.distSomas(c, cfg), mn = Math.min.apply(null, somas), mx = Math.max.apply(null, somas);
  var nb = Math.min(30, mx - mn + 1), lb = (mx - mn + 1) / nb, bins = [], rot = [];
  for (var b = 0; b < nb; b++) { bins.push(0); rot.push(String(Math.round(mn + b * lb))); }
  somas.forEach(function (s) { bins[Math.min(nb - 1, Math.floor((s - mn) / lb))]++; });
  var seq = MC.distSequencias(c, cfg).mostCommon().sort(function (a, b) { return a[0] - b[0]; });
  var rp = MC.mediaRepeticao(c, cfg), lim = MC.limitesSoma(cfg.sorteadas, cfg);
  var dentro = somas.filter(function (s) { return s >= lim[0] && s <= lim[1]; }).length;
  var pr = 0, ns = 0; c.forEach(function (x) { MC.sorteiosDe(x, cfg).forEach(function (st) { pr += MC.primos(st); ns++; }); });
  h += '<div class="kpis">' + kpi("Repetição média", rp.media.toFixed(2).replace(".", ","), "dezenas repetidas do sorteio anterior") +
    kpi("Soma média", (somas.reduce(function (a, b) { return a + b; }, 0) / somas.length).toFixed(1).replace(".", ","), "faixa típica " + lim[0] + "–" + lim[1]) +
    kpi("Dentro da faixa típica", pct(dentro / somas.length, 1), "dos sorteios") +
    kpi("Primos por sorteio", (pr / ns).toFixed(2).replace(".", ","), "em média");
  if (cfg.chave === "lotofacil") {
    var mm = 0; c.forEach(function (x) { mm += MC.molduraMiolo(x.dezenas)[1]; });
    h += kpi("Miolo (volante 5×5)", (mm / c.length).toFixed(2).replace(".", ","), "dezenas do miolo em média");
  }
  h += "</div><div class=\"grade g2\">";
  h += '<div class="card"><h3>Pares × ímpares</h3>' + grafico(pi.map(function (x) { return x[0]; }), pi.map(function (x) { return x[1]; }), {altura: 260}) + "</div>";
  h += '<div class="card"><h3>Distribuição das somas</h3>' + grafico(rot, bins, {altura: 260, maxRotulos: 10}) + "</div>";
  var fh = MC.distFaixasHistorica(c, cfg);
  h += '<div class="card"><h3>Dezenas por faixa</h3>' + grafico(cfg.faixas.map(function (f) { return cfg.fmt(f[0]) + "–" + cfg.fmt(f[1]); }), fh, {altura: 260}) + "</div>";
  h += '<div class="card"><h3>Maior sequência de consecutivas</h3>' + grafico(seq.map(function (x) { return x[0] + " seguidas"; }), seq.map(function (x) { return x[1]; }), {altura: 260}) + "</div>";
  var rd = rp.dist.mostCommon().sort(function (a, b) { return a[0] - b[0]; });
  h += '<div class="card"><h3>Repetições em relação ao sorteio anterior</h3>' + grafico(rd.map(function (x) { return x[0] + " rep."; }), rd.map(function (x) { return x[1]; }), {altura: 260}) + "</div>";
  h += "</div>";
  el.innerHTML = h;
};

/* ---------- Gerador ---------- */
function definirExtras(cfg, n, modo) {
  if (!cfg.extra_nome) return null;
  var rank = MC.frequenciaExtras(cs(), cfg), out = [], i;
  if (cfg.extra_qtd > 1) {
    var uni = []; for (i = 1; i <= cfg.extra_universo; i++) uni.push(String(i));
    var pw = {}; rank.forEach(function (x) { pw[x[0]] = x[1]; });
    for (i = 0; i < n; i++) {
      var e;
      if (modo === "Mais frequentes" && rank.length) e = rank.slice(0, cfg.extra_qtd).map(function (x) { return x[0]; });
      else if (modo === "Ponderado pela frequência" && rank.length) {
        e = []; var disp = uni.slice();
        while (e.length < cfg.extra_qtd) {
          var tot = 0; disp.forEach(function (v) { tot += pw[v] || 1; });
          var r = Math.random() * tot, acc = 0;
          for (var k = 0; k < disp.length; k++) { acc += pw[disp[k]] || 1; if (acc >= r) { e.push(disp.splice(k, 1)[0]); break; } }
        }
      } else e = MC.util.sample(uni, cfg.extra_qtd);
      out.push(e.sort(function (a, b) { return a - b; }).join(", "));
    }
    return out;
  }
  if (!rank.length) { for (i = 0; i < n; i++) out.push("—"); return out; }
  var top = rank.slice(0, 3).map(function (x) { return x[0]; });
  for (i = 0; i < n; i++) {
    if (modo === "Mais frequente") out.push(rank[0][0]);
    else if (modo === "Top 3 alternando") out.push(top[i % top.length]);
    else out.push(rank[MC.util.rnd(rank.length)][0]);
  }
  return out;
}
function modosExtra(cfg) {
  return cfg.extra_qtd > 1 ? ["Mais frequentes", "Aleatório", "Ponderado pela frequência"] : ["Mais frequente", "Top 3 alternando", "Aleatório"];
}
function definirJogos(cfg, jogos, estr) {
  var ctx = cfg.colunar ? null : MC.contexto(cs(), cfg), g = S.ger[S.lot] || {};
  S.ger[S.lot] = {jogos: jogos, estr: estr, modoExtra: g.modoExtra,
    scores: cfg.colunar ? null : jogos.map(function (j) { return MC.megascore(j, cfg, ctx); }),
    extras: definirExtras(cfg, jogos.length, g.modoExtra || modosExtra(cfg)[0])};
}
function linhasJogos(cfg, g) {
  return g.jogos.map(function (j, i) {
    var l = [i + 1, {h: cfg.colunar ? colunasSS(j) : bolas(cfg, j, null, true), s: i}];
    if (!cfg.colunar) l.push({h: '<span class="score ' + classeScore(g.scores[i]) + '">' + g.scores[i].toFixed(1).replace(".", ",") + "</span>", s: g.scores[i]}, MC.soma(j), MC.paresImpares(j).join("/"));
    else l.push(MC.custoSS(j));
    if (g.extras) l.push({h: '<span class="extra-tag">' + esc(g.extras[i]) + "</span>", s: i});
    return l;
  });
}
function cabJogos(cfg) {
  var c = ["#", "Jogo"];
  if (cfg.colunar) c.push("Apostas"); else c.push("MegaScore™", "Soma", "Pares/Ímpares");
  if (cfg.extra_nome) c.push(esc(cfg.extra_nome));
  return c;
}
function textoJogo(cfg, j) { return cfg.colunar ? j.map(function (c) { return c.join(""); }).join(" | ") : j.map(cfg.fmt.bind(cfg)).join(" "); }
function exportarJogos(cfg, g, tipo) {
  var nome = "megacover_" + cfg.chave + "_" + new Date().toISOString().slice(0, 10);
  if (tipo === "csv") {
    var linhas = [["Jogo"].concat(cfg.colunar ? ["C1", "C2", "C3", "C4", "C5", "C6", "C7"] : g.jogos[0].map(function (_, i) { return "D" + (i + 1); }))
      .concat(cfg.colunar ? [] : ["MegaScore"]).concat(cfg.extra_nome ? [cfg.extra_nome] : [])];
    g.jogos.forEach(function (j, i) {
      var l = [i + 1].concat(cfg.colunar ? j.map(function (c) { return c.join("-"); }) : j.map(cfg.fmt.bind(cfg)));
      if (!cfg.colunar) l.push(String(g.scores[i]).replace(".", ","));
      if (g.extras) l.push(g.extras[i]);
      linhas.push(l);
    });
    baixar(nome + ".csv", "﻿" + linhas.map(function (l) { return l.join(";"); }).join("\r\n"), "text/csv;charset=utf-8");
  } else if (tipo === "txt") {
    baixar(nome + ".txt", g.jogos.map(function (j, i) { return textoJogo(cfg, j) + (g.extras ? "  [" + g.extras[i] + "]" : ""); }).join("\r\n"));
  } else if (tipo === "copiar") {
    var t = g.jogos.map(function (j, i) { return textoJogo(cfg, j) + (g.extras ? "  [" + g.extras[i] + "]" : ""); }).join("\n");
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { status("Jogos copiados."); }, function () { status("Não foi possível copiar."); });
  } else if (tipo === "projeto") {
    baixar(nome + ".megacover", JSON.stringify({app: "MegaCover Pro Elite", versao: "1.5.0-web", loteria: cfg.chave, criado: new Date().toISOString(), estrategia: g.estr, jogos: g.jogos, extras: g.extras}, null, 1), "application/json");
  }
}
TELAS.gerador = function (el, cfg) {
  var pf = ls("filtros") || MC.filtrosPadrao(), g = S.ger[S.lot], nd = ls("nd:" + S.lot) || (cfg.colunar ? 1 : cfg.aposta_min);
  var h = '<div class="card"><h3>Parâmetros</h3><div class="form">';
  h += '<div class="campo"><label for="g-nd">' + (cfg.colunar ? "Números por coluna" : "Dezenas por jogo") + '</label><select id="g-nd">' +
    opcoes(cfg.colunar ? [[1, "1 por coluna"], [2, "2 por coluna"], [3, "3 por coluna"]] : range(cfg.aposta_min, cfg.aposta_max), nd) + "</select></div>";
  h += '<div class="campo"><label for="g-nj">Quantidade de jogos</label><input id="g-nj" type="number" min="1" max="500" value="' + (ls("nj") || 10) + '"></div>';
  h += '<div class="campo"><label for="g-es">Estratégia</label><select id="g-es">' + opcoes(MC.ESTRATEGIAS, ls("estr") || "Estatística") + "</select></div>";
  if (!cfg.colunar) {
    h += '<div class="campo"><label for="g-smin">Soma mín (0 = auto)</label><input id="g-smin" type="number" min="0" max="5000" value="' + (pf.soma_min || 0) + '"></div>';
    h += '<div class="campo"><label for="g-smax">Soma máx (0 = auto)</label><input id="g-smax" type="number" min="0" max="5000" value="' + (pf.soma_max || 0) + '"></div>';
  }
  h += "</div>";
  if (!cfg.colunar) h += '<div class="checks">' + MC.FILTROS.map(function (f) {
    return '<label><input type="checkbox" data-f="' + f[0] + '"' + (pf[f[0]] !== false ? " checked" : "") + "> " + f[1] + "</label>";
  }).join("") + "</div>";
  if (cfg.extra_nome) {
    var rank = MC.frequenciaExtras(cs(), cfg);
    h += '<div class="form" style="margin-top:10px"><div class="campo"><label for="g-ex">⭐ ' + esc(cfg.extra_nome) + '</label><select id="g-ex">' + opcoes(modosExtra(cfg), g && g.modoExtra) + '</select></div><div class="campo"><span class="rot">Mais sorteados</span><div class="lista-rank">' +
      (rank.length ? rank.slice(0, 3).map(function (x) { return "<span><b>" + esc(x[0]) + "</b> " + x[2].toFixed(1).replace(".", ",") + "%</span>"; }).join("") : "<span>sem dados</span>") + "</div></div></div>";
  }
  h += '<div class="linha-bts"><button class="bt lot" id="g-gerar" type="button">⚡ Gerar jogos</button>';
  if (!cfg.colunar) h += '<select id="g-met" style="width:auto">' + opcoes(MC.METODOS) + '</select><button class="bt" id="g-otim" type="button">🧠 Otimizar com MegaCover AI</button>';
  h += '</div><div class="progresso" id="g-prog"><i></i></div>';
  if (cfg.colunar) h += '<p class="nota" style="margin-top:12px">ℹ No Super Sete cada coluna é sorteada de forma independente, então não existe otimização de conjunto. Para ampliar a cobertura, marque 2 ou 3 números por coluna (isso multiplica o número de apostas no volante) ou use a aba 🎯 Fechamentos.</p>';
  h += "</div>";
  h += '<div class="card" id="g-res"></div>';
  el.innerHTML = h;
  function desenharRes() {
    var g = S.ger[S.lot], box = $("#g-res");
    if (!g || !g.jogos.length) { box.innerHTML = '<h3>Jogos</h3><p class="vazio">Configure e clique em ⚡ Gerar jogos.</p>'; return; }
    var media = g.scores ? g.scores.reduce(function (a, b) { return a + b; }, 0) / g.scores.length : null;
    box.innerHTML = "<h3>" + g.jogos.length + " jogos · " + esc(g.estr) + (media != null ? " · MegaScore™ médio " + media.toFixed(1).replace(".", ",") : "") + "</h3>" +
      tabela(cabJogos(cfg), linhasJogos(cfg, g), "t-jogos") +
      '<div class="linha-bts"><button class="bt" data-x="csv" type="button">⬇ Excel (CSV)</button><button class="bt" data-x="txt" type="button">⬇ TXT</button><button class="bt" data-x="copiar" type="button">📋 Copiar</button><button class="bt" data-x="pdf" type="button">🖨 PDF / Imprimir</button><button class="bt" data-x="projeto" type="button">💾 Salvar projeto</button><button class="bt" data-x="sim" type="button">🎲 Simular</button><button class="bt" data-x="conf" type="button">✅ Conferir</button></div>';
    ativarOrdenacao("t-jogos");
    $$("[data-x]", box).forEach(function (b) {
      b.onclick = function () {
        var x = b.dataset.x;
        if (x === "pdf") window.print();
        else if (x === "sim") ir(S.lot, "simulador");
        else if (x === "conf") ir(S.lot, "conferir");
        else exportarJogos(cfg, g, x);
      };
    });
  }
  desenharRes();
  function lerFiltros() {
    var f = {soma_min: +($("#g-smin") || {}).value || null, soma_max: +($("#g-smax") || {}).value || null};
    $$("[data-f]").forEach(function (c) { f[c.dataset.f] = c.checked; });
    ls("filtros", f); return f;
  }
  if ($("#g-ex")) $("#g-ex").onchange = function () {
    var g = S.ger[S.lot]; if (!g) { S.ger[S.lot] = {jogos: [], modoExtra: this.value}; return; }
    g.modoExtra = this.value; g.extras = definirExtras(cfg, g.jogos.length, g.modoExtra); desenharRes();
  };
  $("#g-gerar").onclick = function () {
    var nd = +$("#g-nd").value, nj = Math.max(1, Math.min(500, +$("#g-nj").value || 10)), es = $("#g-es").value;
    ls("nd:" + S.lot, nd); ls("nj", nj); ls("estr", es);
    var mod = $("#g-ex") ? $("#g-ex").value : null;
    S.ger[S.lot] = Object.assign(S.ger[S.lot] || {}, {modoExtra: mod});
    var jogos = cfg.colunar ? MC.gerarColunar(cs(), cfg, nd, nj, es) : MC.gerarJogos(cs(), cfg, nd, nj, es, lerFiltros());
    if (!jogos.length) { status("Nenhum jogo passou nos filtros. Afrouxe os critérios."); return; }
    definirJogos(cfg, jogos, es);
    desenharRes();
    status(jogos.length < nj ? "Só " + jogos.length + " jogos passaram nos filtros." : jogos.length + " jogos gerados para a " + cfg.nome + ".");
  };
  if ($("#g-otim")) $("#g-otim").onclick = function () {
    var g = S.ger[S.lot];
    if (!g || !g.jogos.length) { status("Gere jogos primeiro."); return; }
    var bt = this, pr = $("#g-prog"), met = $("#g-met").value; bt.disabled = true;
    MC.otimizar(met, cs(), g.jogos, cfg, function (p, f) { progresso(pr, p); bt.textContent = "🧠 Fitness " + f.toFixed(2); }).then(function (r) {
      definirJogos(cfg, r.jogos.map(MC.util.sortN), met);
      pr.classList.remove("on"); bt.disabled = false; bt.textContent = "🧠 Otimizar com MegaCover AI";
      desenharRes(); status("Otimização concluída — fitness " + r.fit.toFixed(2));
    });
  };
};
function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }

/* ---------- Fechamentos ---------- */
TELAS.fechamentos = function (el, cfg) {
  if (cfg.colunar) return fechamentoSuperSete(el, cfg);
  var gar = Object.keys(MC.garantias(cfg)), f = S.fech[S.lot];
  var tamPadrao = cfg.aposta_min, baseN = Math.min(cfg.dezenas.length - 1, tamPadrao + (cfg.chave === "lotomania" ? 10 : 4));
  var sel = new Set((ls("base:" + S.lot) || []).filter(function (d) { return d >= cfg.inicio && d <= cfg.universo; }));
  var h = '<div class="card"><h3>Fechamento inteligente</h3><p class="dica">Escolha a base de dezenas (clique no volante ou digite) e o sistema monta o menor conjunto de jogos que cobre as combinações da faixa-alvo dentro dela.</p>';
  h += '<div class="volante" id="f-vol">' + cfg.dezenas.map(function (d) { return '<button type="button" data-d="' + d + '"' + (sel.has(d) ? ' class="on"' : "") + ">" + cfg.fmt(d) + "</button>"; }).join("") + "</div>";
  h += '<div class="form" style="margin-top:12px"><div class="campo" style="grid-column:1/-1"><label for="f-base">Base (separe por vírgula ou espaço)</label><input id="f-base" type="text" value="' + Array.from(sel).sort(function (a, b) { return a - b; }).join(", ") + '"></div>';
  h += '<div class="campo"><label for="f-bn">Tamanho da base sugerida</label><input id="f-bn" type="number" min="' + (tamPadrao + 1) + '" max="' + cfg.dezenas.length + '" value="' + baseN + '"></div>';
  h += '<div class="campo"><label for="f-tam">Dezenas por jogo</label><select id="f-tam">' + opcoes(range(cfg.aposta_min, cfg.aposta_max), tamPadrao) + "</select></div>";
  h += '<div class="campo"><label for="f-per">Perfil</label><select id="f-per">' + opcoes(MC.PERFIS, "Equilibrado") + "</select></div>";
  h += '<div class="campo"><label for="f-gar">Cobertura-alvo</label><select id="f-gar">' + opcoes(gar) + "</select></div>";
  h += '<div class="campo"><label for="f-max">Máx. de jogos (0 = auto)</label><input id="f-max" type="number" min="0" max="5000" value="0"></div></div>';
  h += '<div class="linha-bts"><button class="bt" id="f-sug" type="button">✨ Sugerir base (quentes + atrasadas)</button><button class="bt" id="f-limpar" type="button">Limpar</button><button class="bt lot" id="f-ok" type="button">🎯 Gerar fechamento</button><span id="f-cont" class="dica" style="margin:0"></span></div><div class="progresso" id="f-prog"><i></i></div></div>';
  h += '<div class="card" id="f-res"></div>';
  el.innerHTML = h;
  function lerBase() { return $("#f-base").value.split(/[^0-9]+/).filter(Boolean).map(Number).filter(function (d) { return d >= cfg.inicio && d <= cfg.universo; }); }
  function sync(lista) {
    var s = new Set(lista); ls("base:" + S.lot, Array.from(s));
    $$("#f-vol button").forEach(function (b) { b.classList.toggle("on", s.has(+b.dataset.d)); });
    $("#f-cont").textContent = s.size + " dezenas na base";
  }
  $("#f-vol").onclick = function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var s = new Set(lerBase()), d = +b.dataset.d;
    if (s.has(d)) s.delete(d); else s.add(d);
    var arr = Array.from(s).sort(function (a, b) { return a - b; });
    $("#f-base").value = arr.join(", "); sync(arr);
  };
  $("#f-base").oninput = function () { sync(lerBase()); };
  $("#f-limpar").onclick = function () { $("#f-base").value = ""; sync([]); };
  $("#f-sug").onclick = function () {
    var b = MC.sugerirBase(cs(), cfg, Math.max(+$("#f-tam").value + 1, Math.min(cfg.dezenas.length, +$("#f-bn").value)));
    $("#f-base").value = b.join(", "); sync(b);
  };
  sync(lerBase());
  function desenhar() {
    var f = S.fech[S.lot], box = $("#f-res");
    if (!f) { box.innerHTML = '<h3>Resultado</h3><p class="vazio">Monte a base e clique em 🎯 Gerar fechamento.</p>'; return; }
    var i = f.info;
    box.innerHTML = "<h3>" + i.qtd_jogos + " jogos de " + i.tamanho_jogo + " dezenas</h3><div class=\"resumo\">Base de <b>" + i.base.length + "</b> dezenas · perfil <b>" + esc(i.perfil) + "</b> · cobertura interna (" + esc(i.garantia_alvo) + ", calculada em " + i.calculada_em + " dezenas): <b>" + i.cobertura_pct.toLocaleString("pt-BR") + "%</b><br><small>" + esc(i.observacao) + "</small></div><div style=\"margin-top:12px\"></div>" +
      tabela(["#", "Jogo", "Soma"], f.jogos.map(function (j, k) { return [k + 1, {h: bolas(cfg, j, null, true), s: k}, MC.soma(j)]; }), "t-fech") +
      '<div class="linha-bts"><button class="bt lot" id="f-usar" type="button">Usar como jogos atuais (exportar / simular / conferir)</button></div>';
    $("#f-usar").onclick = function () { definirJogos(cfg, f.jogos, "Fechamento " + i.perfil); ir(S.lot, "gerador"); };
  }
  desenhar();
  $("#f-ok").onclick = function () {
    var base = lerBase(), tam = +$("#f-tam").value;
    if (base.length - tam > 12 && !confirm("A base tem " + base.length + " dezenas para jogos de " + tam + ". O cálculo pode levar alguns segundos e a cobertura será estimada por amostragem. Continuar?")) return;
    var bt = this, pr = $("#f-prog"); bt.disabled = true; bt.textContent = "⏳ Calculando…";
    MC.gerarFechamento(base, cfg, $("#f-per").value, $("#f-gar").value, tam, +$("#f-max").value || null, function (p, n) {
      progresso(pr, p); bt.textContent = "⏳ " + n + " jogos…";
    }).then(function (r) { S.fech[S.lot] = r; desenhar(); status(r.jogos.length + " jogos no fechamento."); })
      .catch(function (e) { status(e.message); })
      .then(function () { bt.disabled = false; bt.textContent = "🎯 Gerar fechamento"; pr.classList.remove("on"); });
  };
};
function fechamentoSuperSete(el, cfg) {
  var h = '<div class="card"><h3>Fechamento Super Sete — desdobramento do volante</h3><div class="form">';
  h += '<div class="campo"><label for="s-tot">Total de números (7 a 21)</label><input id="s-tot" type="number" min="7" max="21" value="' + (ls("ss-tot") || 10) + '"></div>';
  h += '<div class="campo"><label for="s-per">Distribuição</label><select id="s-per">' + opcoes(MC.PERFIS_SS, ls("ss-per") || "Equilibrado") + "</select></div>";
  h += '<div class="campo"><button class="bt lot" id="s-ok" type="button">🎯 Gerar fechamento</button></div></div>';
  h += '<p class="nota" style="margin-top:12px"><b>Regra oficial da CAIXA:</b> de 8 a 14 números marcados, cada coluna tem no mínimo 1 e no máximo 2. De 15 a 21 números, no mínimo 2 e no máximo 3 — só é possível marcar o 3º número numa coluna depois que TODAS já tiverem 2. A quantidade de jogos simples é o produto das colunas (ex.: 2 números em três colunas e 1 nas demais = 2×2×2 = 8 jogos).</p><div id="s-prev" class="resumo"></div></div><div class="card" id="s-res"><h3>Resultado</h3><p class="vazio">Escolha o total e clique em 🎯 Gerar fechamento.</p></div>';
  el.innerHTML = h;
  function previa() {
    try {
      var t = +$("#s-tot").value, q = MC.distribuirColunas(t, 7), c = q.reduce(function (a, b) { return a * b; }, 1);
      $("#s-prev").innerHTML = "Distribuição por coluna: <b>" + q.join(" · ") + "</b> → <b>" + fmtN(c) + "</b> jogo(s) simples.";
    } catch (e) { $("#s-prev").textContent = e.message; }
  }
  $("#s-tot").oninput = previa; previa();
  $("#s-ok").onclick = function () {
    try {
      var t = +$("#s-tot").value, p = $("#s-per").value; ls("ss-tot", t); ls("ss-per", p);
      var r = MC.fechamentoSS(cs(), cfg, t, p);
      $("#s-res").innerHTML = "<h3>Cartão a marcar no volante</h3>" + colunasSS(r.cartao) + '<div class="resumo">' + esc(r.info.observacao) + "</div>" +
        '<h3 style="margin-top:16px">Jogos simples equivalentes (' + fmtN(r.jogos.length) + ")</h3>" +
        tabela(["#", "Jogo"], r.jogos.slice(0, 2187).map(function (j, i) { return [i + 1, j.map(function (c) { return c[0]; }).join(" ")]; })) +
        '<div class="linha-bts"><button class="bt lot" id="s-usar" type="button">Usar o cartão como jogo atual (simular / conferir)</button></div>';
      $("#s-usar").onclick = function () { definirJogos(cfg, [r.cartao], "Fechamento " + p); ir(S.lot, "simulador"); };
    } catch (e) { status(e.message); }
  };
}

/* ---------- Simulador ---------- */
TELAS.simulador = function (el, cfg) {
  var g = S.ger[S.lot], h = '<div class="card"><h3>Simulador Monte Carlo</h3>';
  if (!g || !g.jogos.length) {
    el.innerHTML = h + '<p class="vazio">Gere jogos no ⚡ Gerador (ou use um fechamento) para simular.</p><div class="linha-bts"><button class="bt lot" type="button" id="m-ir">Ir para o Gerador</button></div></div>';
    $("#m-ir").onclick = function () { ir(S.lot, "gerador"); }; return;
  }
  h += '<p class="dica">Sorteia aleatoriamente milhares de concursos e mede o melhor acerto do seu conjunto de ' + g.jogos.length + " jogo(s) em cada um.</p>";
  h += '<div class="form"><div class="campo"><label for="m-n">Simulações</label><select id="m-n">' + opcoes([[10000, "10 mil"], [100000, "100 mil"], [500000, "500 mil"], [1000000, "1 milhão"]], 100000) + '</select></div><div class="campo"><button class="bt lot" id="m-ok" type="button">🎲 Simular</button></div></div><div class="progresso" id="m-prog"><i></i></div></div><div id="m-res"></div>';
  if (!cfg.colunar) {
    var n = g.jogos[0].length;
    h += '<div class="card"><h3>Probabilidade exata de uma aposta de ' + n + " dezenas</h3>" + tabela(["Acertos", "Probabilidade", "1 em"], cfg.premios.slice().reverse().map(function (k) {
      var p = MC.probExata(cfg, n, k); return [k + " acertos", p ? (p * 100).toPrecision(3).replace(".", ",") + "%" : "0", p ? fmtN(Math.round(1 / p)) : "—"];
    })) + '<p class="dica" style="margin-top:8px">Cálculo combinatório (hipergeométrico) para um único jogo' + (cfg.sorteios > 1 ? ", por sorteio" : "") + ".</p></div>";
  }
  el.innerHTML = h;
  $("#m-ok").onclick = function () {
    var bt = this, pr = $("#m-prog"), ns = +$("#m-n").value; bt.disabled = true;
    MC.monteCarlo(g.jogos, cfg, ns, function (p) { progresso(pr, p); }).then(function (r) {
      bt.disabled = false; pr.classList.remove("on");
      var ks = Object.keys(r.dist).map(Number).sort(function (a, b) { return a - b; });
      var hh = '<div class="kpis">' + kpi("Média do melhor acerto", r.media.toFixed(3).replace(".", ","), fmtN(r.simulacoes) + " simulações");
      cfg.premios.slice().reverse().forEach(function (fx) {
        var v = r.faixas[fx]; hh += kpi(fx + "+ acertos", pct(v, v && v < 0.001 ? 4 : 2), v ? "≈ 1 a cada " + fmtN(Math.round(1 / v)) + " concursos" : "não ocorreu");
      });
      hh += '</div><div class="card"><h3>Distribuição do melhor acerto</h3>' + grafico(ks.map(function (k) { return k + " ac."; }), ks.map(function (k) { return r.dist[k]; }), {altura: 240}) +
        '<p class="dica" style="margin-top:8px">Estimativas empíricas por amostragem — não constituem previsão nem garantia de prêmio.</p></div>';
      $("#m-res").innerHTML = hh;
    });
  };
};

/* ---------- Conferir ---------- */
function lerJogosTexto(cfg, txt) {
  return txt.split(/\n+/).map(function (l) { return l.replace(/\[.*?\]/g, "").trim(); }).filter(Boolean).map(function (l) {
    if (cfg.colunar) {
      var cols = l.indexOf("|") >= 0 ? l.split("|") : l.replace(/[^0-9]/g, "").split("");
      cols = cols.map(function (c) { return c.replace(/[^0-9]/g, "").split("").map(Number); });
      return cols.length === 7 && cols.every(function (c) { return c.length; }) ? cols : null;
    }
    var ns = l.split(/[^0-9]+/).filter(Boolean).map(Number).filter(function (d) { return d >= cfg.inicio && d <= cfg.universo; });
    ns = MC.util.sortN(Array.from(new Set(ns)));
    return ns.length >= Math.min(cfg.sorteadas, cfg.aposta_min) ? ns : null;
  }).filter(Boolean);
}
TELAS.conferir = function (el, cfg) {
  var g = S.ger[S.lot], c = cs(), u = c[c.length - 1];
  var txt = ls("conf:" + S.lot) || (g && g.jogos.length ? g.jogos.map(function (j) { return textoJogo(cfg, j); }).join("\n") : "");
  var h = '<div class="card"><h3>Conferir jogos</h3><p class="dica">Um jogo por linha. ' + (cfg.colunar ? "Super Sete: 7 dígitos (ex.: 5267245) ou colunas separadas por | (ex.: 12 | 5 | 67 | …)." : "Números separados por espaço, vírgula ou traço.") + "</p>";
  h += '<textarea id="c-txt" spellcheck="false">' + esc(txt) + "</textarea>";
  h += '<div class="form" style="margin-top:10px"><div class="campo"><label for="c-num">Concurso</label><input id="c-num" type="number" min="' + (c[0] ? c[0].concurso : 1) + '" max="' + (u ? u.concurso : 1) + '" value="' + (u ? u.concurso : "") + '"></div><div class="campo"><button class="bt lot" id="c-ok" type="button">✅ Conferir no concurso</button></div><div class="campo"><button class="bt" id="c-hist" type="button">📜 Conferir em todo o histórico</button></div>' +
    (g && g.jogos.length ? '<div class="campo"><button class="bt" id="c-atuais" type="button">Usar jogos atuais</button></div>' : "") + "</div></div><div class=\"card\" id=\"c-res\"></div>";
  el.innerHTML = h;
  $("#c-res").innerHTML = '<h3>Resultado</h3><p class="vazio">Cole seus jogos e confira.</p>';
  $("#c-txt").oninput = function () { ls("conf:" + S.lot, this.value); };
  if ($("#c-atuais")) $("#c-atuais").onclick = function () { $("#c-txt").value = g.jogos.map(function (j) { return textoJogo(cfg, j); }).join("\n"); ls("conf:" + S.lot, null); };
  $("#c-ok").onclick = function () {
    var jogos = lerJogosTexto(cfg, $("#c-txt").value), n = +$("#c-num").value, con = c.filter(function (x) { return x.concurso === n; })[0];
    if (!jogos.length) { status("Nenhum jogo válido no texto."); return; }
    if (!con) { status("Concurso não encontrado na base."); return; }
    var premiados = 0, linhas = jogos.map(function (j, i) {
      var hs = MC.conferir(j, con, cfg), best = Math.max.apply(null, hs), pr = cfg.premios.indexOf(best) >= 0;
      if (pr) premiados++;
      var todas = cfg.colunar ? [] : con.dezenas;
      return [i + 1, {h: cfg.colunar ? colunasSS(j) : bolas(cfg, j, todas, true), s: i}, {h: (pr ? "🏆 " : "") + hs.join(" / "), s: best}];
    });
    $("#c-res").innerHTML = "<h3>Concurso " + fmtN(n) + " · " + premiados + " jogo(s) premiado(s)</h3>" + bolasConcurso(cfg, con) + '<div style="margin-top:12px"></div>' + tabela(["#", "Jogo", cfg.sorteios > 1 ? "Acertos (1º / 2º)" : "Acertos"], linhas, "t-conf");
    ativarOrdenacao("t-conf");
  };
  $("#c-hist").onclick = function () {
    var jogos = lerJogosTexto(cfg, $("#c-txt").value);
    if (!jogos.length) { status("Nenhum jogo válido no texto."); return; }
    var prs = cfg.premios.slice().reverse();
    var linhas = jogos.map(function (j, i) {
      var cont = {}, mel = 0, melC = null;
      c.forEach(function (con) {
        var b = Math.max.apply(null, MC.conferir(j, con, cfg));
        if (cfg.premios.indexOf(b) >= 0) cont[b] = (cont[b] || 0) + 1;
        if (b > mel) { mel = b; melC = con.concurso; }
      });
      return [i + 1, {h: cfg.colunar ? colunasSS(j) : bolas(cfg, j, null, true), s: i}].concat(prs.map(function (p) { return cont[p] || 0; })).concat([{h: mel + (melC ? " (nº " + fmtN(melC) + ")" : ""), s: mel}]);
    });
    $("#c-res").innerHTML = "<h3>Desempenho no histórico (" + fmtN(c.length) + " concursos)</h3><p class=\"dica\">Quantas vezes cada jogo teria sido premiado em cada faixa.</p>" +
      tabela(["#", "Jogo"].concat(prs.map(function (p) { return p + " ac."; })).concat(["Melhor"]), linhas, "t-hist");
    ativarOrdenacao("t-hist");
  };
};

/* ---------- Dados ---------- */
TELAS.dados = function (el, cfg) {
  var c = cs(), add = ls("add:" + S.lot) || [], sy = ls("sync:" + S.lot);
  var nCols = cfg.colunar ? 7 : cfg.sorteadas * cfg.sorteios;
  var h = '<div class="grade g2"><div class="card"><h3>🔄 Atualizar resultados online</h3><p class="dica">Baixa os concursos novos da base pública de resultados (GitHub eitchtee/loterias.json). Os concursos novos ficam salvos neste navegador.</p>' +
    '<div class="resumo">Base do site: até o concurso <b>' + fmtN(S.meta[S.lot].ultimoBase || 0) + "</b>" + (S.meta[S.lot].atualizado ? " (" + new Date(S.meta[S.lot].atualizado).toLocaleDateString("pt-BR") + ")" : "") +
    "<br>Salvos neste navegador: <b>" + fmtN(add.length) + "</b> concurso(s)" + (sy ? " · última sincronização " + new Date(sy).toLocaleString("pt-BR") : "") + "</div>" +
    '<div class="linha-bts"><button class="bt lot" id="x-on" type="button">🔄 Atualizar ' + esc(cfg.nome) + '</button><button class="bt perigo" id="x-limpar" type="button">Apagar dados locais</button></div></div>';
  h += '<div class="card"><h3>✍ Adicionar concurso manualmente</h3><div class="form"><div class="campo"><label for="x-n">Concurso</label><input id="x-n" type="number" min="1" value="' + ((c.length ? c[c.length - 1].concurso : 0) + 1) + '"></div><div class="campo"><label for="x-d">Data</label><input id="x-d" type="text" placeholder="dd/mm/aaaa"></div></div>' +
    '<div class="form" style="margin-top:10px"><div class="campo" style="grid-column:1/-1"><label for="x-dz">' + nCols + " número(s)" + (cfg.sorteios > 1 ? " (1º sorteio seguido do 2º)" : cfg.colunar ? " (coluna 1 a 7)" : "") + '</label><input id="x-dz" type="text" placeholder="ex.: 04 05 30 33 41 52"></div>' +
    (cfg.extra_nome ? '<div class="campo" style="grid-column:1/-1"><label for="x-ex">' + esc(cfg.extra_nome) + (cfg.extra_qtd > 1 ? " (ex.: 2,5)" : "") + '</label><input id="x-ex" type="text"></div>' : "") +
    '</div><div class="linha-bts"><button class="bt lot" id="x-add" type="button">Adicionar</button></div></div></div>';
  h += '<div class="grade g2"><div class="card"><h3>📥 Importar CSV</h3><p class="dica">Formato do MegaCover desktop: <code>Concurso;Data;Bola1;…;BolaN' + (cfg.extra_nome ? ";" + esc(cfg.extra_nome) : "") + "</code> (separador ; ou ,). A primeira linha pode ser o cabeçalho.</p>" +
    '<input type="file" id="x-arq" accept=".csv,.txt"><div class="linha-bts"><button class="bt" id="x-exp" type="button">⬇ Exportar histórico (CSV)</button></div><div id="x-log" class="dica" style="margin-top:8px"></div></div>';
  h += '<div class="card"><h3>💾 Projetos (.megacover)</h3><p class="dica">Abra um projeto salvo no ⚡ Gerador para recuperar os jogos.</p><input type="file" id="x-proj" accept=".megacover,.json"><div id="x-plog" class="dica" style="margin-top:8px"></div></div></div>';
  el.innerHTML = h;
  $("#x-on").onclick = function () {
    var bt = this; bt.disabled = true; bt.textContent = "⏳ Baixando…";
    atualizarOnline(S.lot).then(function (n) { status(n ? n + " concurso(s) novo(s) da " + cfg.nome + "." : cfg.nome + " já está atualizada."); render(); })
      .catch(function (e) { status("Não foi possível conectar (" + e.message + ")."); bt.disabled = false; bt.textContent = "🔄 Atualizar " + cfg.nome; });
  };
  $("#x-limpar").onclick = function () {
    if (!confirm("Apagar os concursos salvos neste navegador para a " + cfg.nome + "? A base do site continua.")) return;
    ls("add:" + S.lot, null); ls("sync:" + S.lot, null); delete S.dados[S.lot]; render();
  };
  $("#x-add").onclick = function () {
    var n = +$("#x-n").value, dz = $("#x-dz").value.split(/[^0-9]+/).filter(Boolean).map(Number);
    if (!n || dz.length !== nCols) { status("Informe o concurso e exatamente " + nCols + " números."); return; }
    if (dz.some(function (d) { return d < cfg.inicio || d > cfg.universo; })) { status("Números devem estar entre " + cfg.inicio + " e " + cfg.universo + "."); return; }
    var ex = $("#x-ex") ? $("#x-ex").value.trim() : "", row = [n, $("#x-d").value.trim(), cfg.sorteios > 1 ? dz.slice(0, cfg.sorteadas) : dz];
    if (cfg.sorteios > 1) row.push(dz.slice(cfg.sorteadas));
    else if (cfg.extra_qtd > 1) row.push(ex.split(/[^0-9]+/).filter(Boolean).map(Number));
    else if (cfg.extra_nome) row.push(ex);
    mesclar(S.lot, [row], true); forcarPersistencia(n); status("Concurso " + n + " adicionado."); render();
  };
  $("#x-arq").onchange = function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var rows = [], ruins = 0;
      String(rd.result).split(/\r?\n/).forEach(function (l) {
        if (!l.trim()) return;
        var p = l.split(l.indexOf(";") >= 0 ? ";" : ",").map(function (x) { return x.trim(); });
        if (!/^\d+$/.test(p[0])) return;
        var dz = p.slice(2, 2 + nCols).map(Number);
        if (dz.length !== nCols || dz.some(isNaN)) { ruins++; return; }
        var row = [+p[0], p[1] || "", cfg.sorteios > 1 ? dz.slice(0, cfg.sorteadas) : dz];
        var ex = p.slice(2 + nCols).join(",");
        if (cfg.sorteios > 1) row.push(dz.slice(cfg.sorteadas));
        else if (cfg.extra_qtd > 1) row.push(ex.split(/[^0-9]+/).filter(Boolean).map(Number));
        else if (cfg.extra_nome) row.push(ex);
        rows.push(row);
      });
      var novos = mesclar(S.lot, rows, true);
      rows.forEach(function (r) { forcarPersistencia(r[0]); });
      $("#x-log").textContent = rows.length + " linha(s) lida(s), " + novos + " concurso(s) novo(s)" + (ruins ? ", " + ruins + " ignorada(s)" : "") + ".";
      status("Importação concluída.");
    };
    rd.readAsText(f, "utf-8");
  };
  $("#x-exp").onclick = function () {
    var cab = ["Concurso", "Data"].concat(range(1, nCols).map(function (i) { return "Bola" + i; })).concat(cfg.extra_nome ? [cfg.extra_nome] : []);
    var linhas = [cab.join(";")].concat(cs().map(function (x) { return [x.concurso, x.data].concat(x.dezenas).concat(cfg.extra_nome ? [x.extra] : []).join(";"); }));
    baixar(cfg.chave + "_historico.csv", "﻿" + linhas.join("\r\n"), "text/csv;charset=utf-8");
  };
  $("#x-proj").onchange = function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var p = JSON.parse(rd.result), lc = MC.TODAS[p.loteria];
        if (!lc || !Array.isArray(p.jogos) || !p.jogos.length) throw new Error("arquivo inválido");
        var ant = S.lot; S.lot = p.loteria;
        carregar(p.loteria).then(function () {
          definirJogos(lc, p.jogos, p.estrategia || "Projeto");
          if (p.extras && p.extras.length === p.jogos.length) S.ger[p.loteria].extras = p.extras;
          S.lot = ant; ir(p.loteria, "gerador"); status("Projeto aberto: " + p.jogos.length + " jogos da " + lc.nome + ".");
        });
      } catch (e) { $("#x-plog").textContent = "Não foi possível abrir: " + e.message; }
    };
    rd.readAsText(f, "utf-8");
  };
};
/* concursos adicionados à mão ou importados, mesmo que antigos, ficam salvos no navegador */
function forcarPersistencia(n) {
  var cfg = cfgAtual(), add = ls("add:" + S.lot) || [], c = cs().filter(function (x) { return x.concurso === n; })[0];
  if (!c) return;
  add = add.filter(function (r) { return r[0] !== n; }); add.push(concursoParaRow(cfg, c));
  ls("add:" + S.lot, add.slice(-3000));
}

/* ======================= Início ======================= */
function tema() {
  var t = ls("tema"); if (t) document.documentElement.setAttribute("data-theme", t);
  $("#bt-tema").onclick = function () {
    var escuro = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    var novo = escuro ? "light" : "dark"; document.documentElement.setAttribute("data-theme", novo); ls("tema", novo);
  };
}
function iniciar() {
  tema(); montarNav();
  $("#bt-atualizar-todas").onclick = atualizarTodas;
  var h = location.hash.replace("#", "").split("/"), u = ls("ultima") || [];
  window.addEventListener("hashchange", function () { var p = location.hash.replace("#", "").split("/"); if (p[0] !== S.lot || p[1] !== S.aba) ir(p[0], p[1]); });
  ir(h[0] || u[0] || "megasena", h[1] || u[1] || "dashboard");
}
iniciar();
})();
