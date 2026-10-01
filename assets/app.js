/* MegaCover Pro Elite (Web) — interface.
   Página estática: roda no GitHub Pages (ou qualquer hospedagem) sem servidor. */
(function () {
"use strict";

var GH = "https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/";
var GH_NOME = {megasena: "mega-sena", lotofacil: "lotofacil", quina: "quina", lotomania: "lotomania",
  duplasena: "dupla-sena", timemania: "timemania", diadesorte: "dia-de-sorte", supersete: "super-sete",
  maismilionaria: "mais-milionaria"};
var ABAS = [["dashboard", "Visão geral", "painel"], ["estatisticas", "Estatísticas", "barras"], ["padroes", "Padrões", "padrao"],
  ["gerador", "Gerador", "raio"], ["fechamentos", "Fechamentos", "alvo"], ["simulador", "Simulador", "dado"],
  ["conferir", "Conferir", "check"], ["dados", "Dados", "banco"]];
var PL = window.MC_PLANO || {beta: function () { return true; }, liberado: function () { return true; }, pro: {}, contatoUrl: function () { return ""; }};
/* Modo servidor: com o login configurado, regras, dados e recursos pagos vêm da API (assets/api.js).
   O servidor decide tudo; o painel só antecipa os avisos para a pessoa não clicar à toa. */
/* modo servidor: login configurado e fase "assinatura" (no Beta tudo segue liberado, como antes) */
var SRV = !!(window.MC_API && window.MC_API.ativo() && !(window.MC_PLANO && window.MC_PLANO.beta()));
var REGRAS = null, PERM = window.MC_PERM, ME = null;
var MAPA_REC = {ia: "otimizador", fechamentos: "fechamentoPersonalizado", historico: "historicoCompleto", exportar: "exportar", simulacaoGrande: "monteCarlo"};
function podeSrv(rec, valor) { return PERM.pode(REGRAS, ME ? ME.plano : "gratis", MAPA_REC[rec] || rec, valor); }

/* ícones de traço (24×24) */
var ICONES = {
  painel: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  barras: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  padrao: "M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4zM9 7h6M7 9v6M17 9v6M9 17h6",
  raio: "M13 2 4 14h7l-1 8 9-12h-7z",
  alvo: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  dado: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01",
  check: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
  banco: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  ia: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM10 10h4v4h-4z",
  baixar: "M12 4v11M7 10l5 5 5-5M5 20h14",
  copiar: "M9 9h10v11H9zM5 15V4h10",
  imprimir: "M7 9V3h10v6M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3M7 14h10v7H7z",
  salvar: "M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 3v5h8V3M7 21v-7h10v7",
  abrir: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  brilho: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z",
  mais: "M12 5v14M5 12h14",
  atualizar: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  lixo: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  historico: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  coroa: "M3 18h18M4 8l4 4 4-7 4 7 4-4-2 10H6z",
  trofeu: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  lupa: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  x: "M6 6l12 12M18 6 6 18",
  escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  cadeado: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4"
};
function I(n, extra) { return '<svg class="ic' + (extra ? " " + extra : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONES[n] + '"/></svg>'; }
function tagPro(recurso, valor) {
  if (SRV) { var r = podeSrv(recurso, valor); return r.ok || !r.planoMinimo ? "" : ' <span class="pro" title="Recurso do plano ' + esc(r.planoMinimo.nome) + '">' + I("cadeado") + esc(r.planoMinimo.nome) + "</span>"; }
  return PL.pro && PL.pro[recurso] ? ' <span class="pro" title="' + (PL.beta() ? "Recurso PRO — liberado grátis no Beta" : "Recurso PRO") + '">PRO</span>' : "";
}
/* true se o recurso está liberado; senão abre o convite de assinatura */
function pro(recurso, valor) {
  if (SRV) { var r = podeSrv(recurso, valor); if (r.ok) return true; upsell(r); return false; }
  if (PL.liberado(recurso)) return true; modalPlano(recurso); return false;
}

var S = {lot: "megasena", aba: "dashboard", dados: {}, meta: {}, ger: {}, fech: {}, carregando: {}, sync: {}, ordem: {}};
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
var normTime = MC.normTime, rowParaConcurso = MC.rowParaConcurso;   /* fonte única no motor (também usada pelo servidor) */
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
  if (SRV) return carregarSrv(id);
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
    setTimeout(function () { sincronizar(id); }, 50);   /* busca concursos novos sem travar a tela */
    return S.dados[id];
  });
  return S.carregando[id];
}
/* modo servidor: o histórico vem da API, já limitado ao que o plano libera */
function carregarSrv(id) {
  if (S.dados[id]) return Promise.resolve(S.dados[id]);
  if (S.carregando[id]) return S.carregando[id];
  var cfg = MC.TODAS[id];
  S.carregando[id] = MC_API.get("concursos?loteria=" + id, {silencioso: true}).then(function (d) {
    S.meta[id] = {atualizado: null, ultimoBase: d.total, total: d.total, limitado: d.limitado, limite: d.limite};
    S.dados[id] = d.concursos.map(function (r) { return rowParaConcurso(cfg, r); });
  }).catch(function (e) {
    S.meta[id] = {erro: e.message, codigo: e.codigo}; S.dados[id] = [];
  }).then(function () { delete S.carregando[id]; return S.dados[id]; });
  return S.carregando[id];
}
/* ---------- fontes online ----------
   1ª) API pública que lê a CAIXA em tempo real (concurso a concurso)
   2ª) base do GitHub eitchtee/loterias.json (histórico completo, atrasa alguns dias) */
/* {url} com {id} e {n}; "ultimo" é o que se põe em {n} para pedir o último concurso */
var APIS = [
  {nome: "CAIXA (oficial)", url: "https://servicebus2.caixa.gov.br/portaldeloterias/api/{id}/{n}", ultimo: ""},
  {nome: "loteriascaixa-api", url: "https://loteriascaixa-api.vercel.app/api/{id}/{n}", ultimo: "latest"},
  {nome: "guidi", url: "https://api.guidi.dev.br/loteria/{id}/{n}", ultimo: "ultimo"}
];
function urlApi(a, id, n) { return a.url.replace("{id}", id).replace("{n}", n === "latest" ? a.ultimo : n).replace(/\/$/, ""); }
var SYNC_INTERVALO = 15 * 60 * 1000;   /* volta a checar a cada 15 min (só 1 requisição "último" por loteria) */
function apiParaRow(cfg, j) {
  if (!j || typeof j !== "object") return null;
  if (Array.isArray(j)) j = j[0];
  var n = +(j.concurso || j.numero || j.numeroConcurso || 0); if (!n) return null;
  var dz = (j.dezenas || j.listaDezenas || j.dezenasSorteadasOrdemSorteio || []).map(Number).filter(function (x) { return !isNaN(x); });
  if (!dz.length) return null;
  var data = String(j.data || j.dataApuracao || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(data)) data = data.split("-").reverse().join("/");
  var row = [n, data, cfg.colunar ? dz.slice(0, cfg.colunas) : dz.slice(0, cfg.sorteadas)];
  if (cfg.sorteios > 1) row.push((j.dezenas2 || j.listaDezenasSegundoSorteio || j.dezenasSegundoSorteio || dz.slice(cfg.sorteadas)).map(Number));
  else if (cfg.extra_qtd > 1) row.push((j.trevos || j.trevosSorteados || []).map(Number));
  else if (cfg.chave === "timemania") row.push(String(j.timeCoracao || j.nomeTimeCoracaoMesSorte || j.timeDoCoracao || ""));
  else if (cfg.chave === "diadesorte") row.push(String(j.mesSorte || j.nomeTimeCoracaoMesSorte || j.mesDaSorte || ""));
  return row;
}
function apiConcurso(id, n) {           /* tenta cada API; n = "latest" ou número */
  var cfg = MC.TODAS[id], i = 0;
  return new Promise(function (res, rej) {
    (function prox() {
      if (i >= APIS.length) { rej(new Error("APIs indisponíveis")); return; }
      getJSON(urlApi(APIS[i++], id, n), 9000).then(function (j) { var r = apiParaRow(cfg, j); if (r) res(r); else prox(); }).catch(prox);
    })();
  });
}
function ultimoLocal(id) { var c = S.dados[id] || []; return c.length ? c[c.length - 1].concurso : 0; }
/* baixa os concursos que faltam pela API; se ela falhar ou faltar demais, usa a base do GitHub */
function atualizarOnline(id, silencioso) {
  var cfg = MC.TODAS[id];
  return apiConcurso(id, "latest").then(function (ult) {
    var local = ultimoLocal(id), faltam = [];
    for (var n = local + 1; n < ult[0]; n++) faltam.push(n);
    if (faltam.length > 80) throw new Error("muitos concursos");   /* histórico grande: GitHub é mais eficiente */
    var rows = [ult];
    return (function lote(i) {
      if (i >= faltam.length) return Promise.resolve();
      return Promise.all(faltam.slice(i, i + 6).map(function (n) { return apiConcurso(id, n).then(function (r) { rows.push(r); }, function () {}); }))
        .then(function () { return lote(i + 6); });
    })(0).then(function () { return rows; });
  }).catch(function () {
    return getJSON(GH + GH_NOME[id] + ".json", 60000).then(function (lista) {
      return lista.map(function (x) { return ghParaRow(cfg, x); }).filter(Boolean);
    });
  }).then(function (rows) {
    var n = mesclar(id, rows, true);
    ls("sync:" + id, Date.now());
    return n;
  }).catch(function (e) { if (!silencioso) throw e; return 0; });
}
/* sincronização automática em segundo plano (ao abrir e a cada 2 h) */
function sincronizar(id) {
  var t = ls("sync:" + id);
  if (t && Date.now() - t < SYNC_INTERVALO) return Promise.resolve(0);
  if (S.sync[id]) return S.sync[id];
  S.sync[id] = atualizarOnline(id, true).then(function (n) {
    delete S.sync[id];
    if (n) {
      var el = $("#ult-" + id), c = S.dados[id]; if (el && c.length) el.textContent = "nº " + c[c.length - 1].concurso;
      if (id === S.lot) { render(); status(MC.TODAS[id].nome + ": " + n + " concurso(s) novo(s) baixado(s)."); }
    }
    return n;
  });
  return S.sync[id];
}
function atualizarTodas() {
  var bt = $("#bt-atualizar-todas"); bt.disabled = true; bt.innerHTML = I("atualizar") + '<span class="txt-lg">Atualizando…</span>';
  var ids = MC.ORDEM.map(function (l) { return l.chave; }), rel = [], feitos = 0;
  return Promise.all(ids.map(function (id) {
    return carregar(id).then(function () { ls("sync:" + id, null); return atualizarOnline(id); }).then(function (n) {
      rel.push(MC.TODAS[id].nome + ": " + (n ? "+" + n : "ok"));
    }).catch(function () { rel.push(MC.TODAS[id].nome + ": falhou"); }).then(function () {
      feitos++; bt.innerHTML = I("atualizar") + '<span class="txt-lg">' + feitos + "/9</span>";
    });
  })).then(function () {
    bt.disabled = false; bt.innerHTML = I("atualizar") + '<span class="txt-lg">Atualizar todas</span>'; montarUltimos();
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
function vazio(icone, txt, extra) { return '<div class="vazio">' + I(icone) + "<div>" + txt + "</div>" + (extra || "") + "</div>"; }
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
  var bw = (W - pl - 6) / n, g = '<svg class="grafico" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.titulo || "gráfico") + '">' +
    '<defs><linearGradient id="gb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lot-viva)"/><stop offset="1" style="stop-color:var(--lot-viva);stop-opacity:.35"/></linearGradient>' +
    '<linearGradient id="gb2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ouro2)"/><stop offset="1" style="stop-color:var(--ouro);stop-opacity:.55"/></linearGradient></defs>';
  var corte = o.destacar ? valores.slice().sort(function (a, b) { return b - a; })[Math.min(o.destacar, n) - 1] : Infinity;
  for (var k = 0; k <= 4; k++) {
    var y = pt + (H - pt - pe) * (1 - k / 4), val = mx * k / 4;
    g += '<line class="eixo" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>';
    g += '<text x="' + (pl - 4) + '" y="' + (y + 3) + '" text-anchor="end">' + (val >= 100 ? Math.round(val) : Math.round(val * 10) / 10) + "</text>";
  }
  var passo = Math.ceil(n / (o.maxRotulos || 40));
  rotulos.forEach(function (r, i) {
    var x = pl + i * bw, h = (H - pt - pe) * valores[i] / mx, w = v2 ? bw * 0.42 : bw * 0.78;
    g += '<rect class="b1' + (valores[i] >= corte ? " top" : "") + '" x="' + (x + bw * 0.11) + '" y="' + (H - pe - h) + '" width="' + w + '" height="' + h + '" rx="' + Math.min(4, w / 3) + '"><title>' + esc(r) + ": " + fmtN(valores[i]) + "</title></rect>";
    if (v2) {
      var h2 = (H - pt - pe) * v2[i] / mx;
      g += '<rect class="b2" x="' + (x + bw * 0.11 + w) + '" y="' + (H - pe - h2) + '" width="' + w + '" height="' + h2 + '" rx="2"><title>' + esc(r) + ": " + fmtN(v2[i]) + "</title></rect>";
    }
    if (i % passo === 0) g += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(r) + "</text>";
  });
  return g + "</svg>";
}
function ehNum(c) { return typeof c === "number" || !!(c && typeof c === "object" && (typeof c.h === "number" || c.num)); }
function tabela(cab, linhas, id) {
  /* o cabeçalho segue o alinhamento da coluna: números à direita */
  var numCol = cab.map(function (_, i) { return linhas.length > 0 && linhas.every(function (l) { return ehNum(l[i]); }); });
  return '<div class="tabela-wrap"><table' + (id ? ' id="' + id + '"' : "") + "><thead><tr>" + cab.map(function (c, i) {
    return '<th class="' + (id ? "ord" : "") + (numCol[i] ? " num" : "") + '" data-i="' + i + '">' + c + "</th>";
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
    return '<button class="chip" type="button" data-id="' + l.chave + '" style="--c:' + l.cor + '"><span class="ponto"></span><span class="nm">' + esc(l.nome) + '</span><span class="ult" id="ult-' + l.chave + '"></span></button>';
  }).join("");
  $("#abas").innerHTML = ABAS.map(function (a) { return '<button class="aba" type="button" data-aba="' + a[0] + '">' + I(a[2]) + a[1] + "</button>"; }).join("");
  $("#bt-menu").onclick = function () { $("#app").classList.toggle("menu-aberto"); };
  $("#cortina").onclick = function () { $("#app").classList.remove("menu-aberto"); };
  planoCard();
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
  $("#app").classList.remove("menu-aberto");
  var nomeAba = ABAS.filter(function (a) { return a[0] === S.aba; })[0][1];
  document.title = cfg.nome + " · " + nomeAba + " · MegaCover Pro Elite";
  var main = $("#conteudo");
  if (SRV && !podeSrv("loteria", S.lot).ok) {
    $("#titulo").innerHTML = '<h1><span class="ponto"></span>' + esc(cfg.nome) + "</h1><p>Disponível nos planos pagos</p>";
    main.innerHTML = '<div id="aba" class="entrar">' + cardBloqueado(podeSrv("loteria", S.lot), "A " + cfg.nome + " e as outras 6 loterias fazem parte dos planos pagos. No Grátis você usa a Mega-Sena e a Lotofácil.") + "</div>";
    ligarBloqueados(main); return;
  }
  if (!S.dados[S.lot]) {
    $("#titulo").innerHTML = '<h1><span class="ponto"></span>' + esc(cfg.nome) + "</h1><p>Carregando histórico…</p>";
    main.innerHTML = '<div class="carregando"><div class="esqueleto"></div><div class="esqueleto" style="height:260px"></div></div>';
    carregar(S.lot).then(render); return;
  }
  var c = cs(), u = c[c.length - 1];
  $("#titulo").innerHTML = '<h1><span class="ponto"></span>' + esc(cfg.nome) + "</h1><p>" +
    (u ? 'Concurso <span class="mono">' + fmtN(u.concurso) + "</span> · " + esc(u.data) + '<span class="sep"> · <span class="mono">' + fmtN(c.length) + "</span> concursos " +
      (SRV && S.meta[S.lot].limitado ? 'liberados <a href="#" class="lk-hist">(histórico completo no Pro)</a>' : "na base") + "</span>" : (SRV && S.meta[S.lot].erro ? esc(S.meta[S.lot].erro) : "Sem resultados")) + "</p>";
  var lkh = $(".lk-hist"); if (lkh) lkh.onclick = function (e) { e.preventDefault(); pro("historicoCompleto"); };
  var ul = $("#ult-" + S.lot); if (ul && u) ul.textContent = "nº " + u.concurso;
  main.innerHTML = (cfg.nota && S.aba === "dashboard" ? '<p class="nota">' + I("info") + "<span>" + esc(cfg.nota) + "</span></p>" : "") + '<div id="aba" class="entrar"></div>';
  TELAS[S.aba]($("#aba"), cfg);
  window.scrollTo(0, 0);
}

/* ======================= Telas ======================= */
var TELAS = {};

TELAS.dashboard = function (el, cfg) {
  var c = cs(), u = c[c.length - 1];
  if (!u) { el.innerHTML = '<div class="card">' + vazio("banco", "Nenhum resultado na base. Use a aba <b>Dados</b> para atualizar ou importar.") + "</div>"; return; }
  var ant = c[c.length - 2], h = "";
  /* destaque: último resultado */
  var sts = cfg.colunar ? [u.dezenas] : MC.sorteiosDe(u, cfg), mini = "";
  if (!cfg.colunar) {
    var s0 = sts[0], pi = MC.paresImpares(s0), rep = ant ? MC.util.intersec(s0, MC.sorteiosDe(ant, cfg)[0]) : null;
    mini = '<div class="kpis mini">' +
      kpi("Soma", fmtN(MC.soma(s0)), "faixa típica " + MC.limitesSoma(cfg.sorteadas, cfg).join("–")) +
      kpi("Pares / ímpares", pi[0] + " / " + pi[1]) +
      (rep != null ? kpi("Repetidas", String(rep), "do concurso anterior") : "") + "</div>";
  }
  h += '<div class="grade g-dash"><div class="card destaque"><div class="sobre">Último resultado · concurso ' + fmtN(u.concurso) + " · " + esc(u.data) + "</div>" +
    sts.map(function (st, i) {
      return (sts.length > 1 ? '<div class="dica" style="margin:10px 0 6px">' + (i + 1) + "º sorteio</div>" : '<div style="height:10px"></div>') +
        (cfg.colunar ? '<div class="bolas grandes">' + st.map(function (d, k) { return '<span class="col-ss"><small>C' + (k + 1) + '</small><span class="bola grande">' + d + "</span></span>"; }).join("") + "</div>"
          : '<div class="bolas grandes">' + st.map(function (d) { return '<span class="bola grande">' + cfg.fmt(d) + "</span>"; }).join("") + "</div>");
    }).join("") +
    (u.extra ? '<div style="margin-top:14px"><span class="extra-tag">' + I(cfg.extra_qtd ? "brilho" : "coroa") + esc(cfg.extra_nome) + ": <b>" + esc(u.extra) + "</b></span></div>" : "") + mini + "</div>";
  h += '<div class="card"><div class="cab"><h3>Consultar concurso</h3></div><div class="form" style="grid-template-columns:auto 1fr auto;gap:8px">' +
    '<button class="bt icone" id="d-ant" type="button" aria-label="Concurso anterior">‹</button><input id="d-num" type="number" aria-label="Número do concurso" min="' + c[0].concurso + '" max="' + u.concurso + '" value="' + (u.concurso - 1) + '"><button class="bt icone" id="d-prox" type="button" aria-label="Próximo concurso">›</button></div>' +
    '<div class="linha-bts" style="margin-top:10px"><button class="bt primario" id="d-ok" type="button" style="flex:1">' + I("lupa") + 'Consultar</button></div><div id="d-res" style="margin-top:16px"></div></div></div>';
  /* indicadores */
  var r = cfg.colunar ? null : MC.ranking(c, cfg, 10), sy = ls("sync:" + S.lot);
  h += '<div class="kpis">' + kpi("Concursos analisados", fmtN(c.length), "do nº " + fmtN(c[0].concurso) + " ao " + fmtN(u.concurso));
  if (r) {
    h += kpi("Mais sorteada", cfg.fmt(r.quentes[0][0]), fmtN(r.quentes[0][1]) + " vezes no histórico");
    h += kpi("Mais atrasada", cfg.fmt(r.atrasadas[0][0]), r.atrasadas[0][1] + " concursos sem sair");
  }
  if (cfg.extra_nome) {
    var fx = MC.frequenciaExtras(c, cfg);
    h += kpi(esc(cfg.extra_nome) + " líder", fx.length ? esc(fx[0][0]) : "—", fx.length ? fmtN(fx[0][1]) + " vezes · " + fx[0][2].toFixed(1).replace(".", ",") + "%" : "sem dados", true);
  }
  if (SRV) h += kpi("Histórico liberado", S.meta[S.lot].limitado ? "Últimos " + S.meta[S.lot].limite : "Completo", S.meta[S.lot].limitado ? "de " + fmtN(S.meta[S.lot].total) + " concursos · completo no Pro" : "atualizado automaticamente", true);
  else h += kpi("Última sincronização", sy ? new Date(sy).toLocaleString("pt-BR", {day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"}) : (S.meta[S.lot].atualizado ? new Date(S.meta[S.lot].atualizado).toLocaleDateString("pt-BR") : "—"), sy ? "automática · checa a cada 15 min" : "arquivo do site", true) + "</div>";
  if (cfg.colunar) {
    var tab = MC.porColuna(c, cfg);
    h += '<div class="card"><div class="cab"><h3>Dígito líder em cada coluna</h3><span class="dica" style="margin:0">frequência no histórico</span></div><div class="bolas grandes">' + tab.map(function (f, i) {
      var best = cfg.dezenas.slice().sort(function (a, b) { return f[b] - f[a]; })[0];
      return '<span class="col-ss"><small>C' + (i + 1) + '</small><span class="bola grande">' + best + '</span><small class="mono">' + f[best] + "×</small></span>";
    }).join("") + "</div></div>";
  } else {
    h += '<div class="grade g2"><div class="card"><div class="cab"><h3>Mais sorteadas</h3><span class="dica" style="margin:0">top 10 · histórico</span></div>' + bolas(cfg, r.quentes.map(function (x) { return x[0]; }).sort(function (a, b) { return a - b; })) + "</div>" +
      '<div class="card"><div class="cab"><h3>Mais atrasadas</h3><span class="dica" style="margin:0">top 10 · concursos sem sair</span></div>' + bolas(cfg, r.atrasadas.map(function (x) { return x[0]; }).sort(function (a, b) { return a - b; })) + "</div></div>";
    var fr = MC.frequencias(c, cfg);
    if (SRV && !podeSrv("graficos").ok) h += cardBloqueado(podeSrv("graficos"), "O gráfico de frequência de cada dezena faz parte dos gráficos do plano Pro.");
    else h += '<div class="card"><div class="cab"><h3>Frequência de cada dezena</h3><div class="legenda" style="margin:0"><span><i style="background:var(--lot-viva)"></i>frequência</span><span><i style="background:var(--ouro)"></i>6 mais sorteadas</span></div></div>' +
      grafico(cfg.dezenas.map(cfg.fmt.bind(cfg)), cfg.dezenas.map(function (d) { return fr[d].abs; }), {titulo: "Frequência", destacar: 6, maxRotulos: cfg.dezenas.length > 60 ? 50 : 80}) + "</div>";
  }
  el.innerHTML = h;
  function consultar() {
    var n = +$("#d-num").value, achou = c.filter(function (x) { return x.concurso === n; })[0];
    $("#d-res").innerHTML = achou ? '<div class="sobre">Concurso ' + fmtN(n) + " · " + esc(achou.data) + "</div>" + bolasConcurso(cfg, achou) : '<p class="dica">Concurso não encontrado na base.</p>';
  }
  $("#d-ok").onclick = consultar;
  $("#d-ant").onclick = function () { $("#d-num").value = Math.max(c[0].concurso, +$("#d-num").value - 1); consultar(); };
  $("#d-prox").onclick = function () { $("#d-num").value = Math.min(u.concurso, +$("#d-num").value + 1); consultar(); };
  $("#d-num").onkeydown = function (e) { if (e.key === "Enter") consultar(); };
  consultar();
};

TELAS.estatisticas = function (el, cfg) {
  var jan = +(ls("janela") || 20);
  if (!SRV) { desenharEstat(el, cfg, MC.dadosEstatisticas(cs(), cfg, true, jan)); return; }
  el.innerHTML = '<div class="carregando"><div class="esqueleto" style="height:300px"></div></div>';
  MC_API.get("estatisticas?loteria=" + cfg.chave + "&janela=" + jan, {silencioso: true})
    .then(function (D) { desenharEstat(el, cfg, D); }).catch(function (e) { el.innerHTML = cardErro(e); ligarBloqueados(el); });
};
function desenharEstat(el, cfg, D) {
  var h = "", jan = D.janela || +(ls("janela") || 20), completas = D.nivel === "completas";
  if (cfg.colunar) {
    h += '<div class="card"><h3>Frequência por coluna</h3><p class="dica">Quantas vezes cada dígito saiu em cada coluna (' + fmtN(D.concursos) + " concursos).</p>";
    h += tabela(["Dígito"].concat(D.porColuna.map(function (_, i) { return "Coluna " + (i + 1); })), cfg.dezenas.map(function (d) {
      return [d].concat(D.porColuna.map(function (f) { return f[d]; }));
    }), "t-ss") + "</div>";
    h += '<div class="card"><h3>Atraso por coluna</h3><p class="dica">Há quantos concursos o dígito não sai naquela coluna.</p>' + tabela(["Dígito"].concat(D.atrasoPorColuna.map(function (_, i) { return "Coluna " + (i + 1); })), cfg.dezenas.map(function (d) {
      return [d].concat(D.atrasoPorColuna.map(function (u) { return u[d]; }));
    }), "t-ss2") + "</div>";
    el.innerHTML = h; ativarOrdenacao("t-ss"); ativarOrdenacao("t-ss2"); return;
  }
  var fr = D.frequencias, at2 = D.atrasos, td = D.tendencia;
  h += '<div class="card"><h3>' + (completas ? "Frequência, atraso e tendência" : "Frequência e atraso") + "</h3>" +
    (completas ? '<div class="form" style="margin-bottom:14px;max-width:260px"><div class="campo"><label for="e-jan">Janela da tendência (concursos)</label><select id="e-jan">' + opcoes([10, 20, 30, 50, 100], jan) + "</select></div></div>" : "") +
    '<p class="dica">' + (SRV ? "Calculado sobre " + fmtN(D.concursos) + " concursos. " : "") + "Clique no cabeçalho para ordenar.</p>";
  var cab = ["Dezena", "Frequência", "%", "Atraso atual", "Maior atraso"].concat(completas ? ["Últimos " + jan] : []);
  h += tabela(cab, cfg.dezenas.map(function (d) {
    return [{h: bola(cfg, d, false, true), s: d}, fr[d].abs, {h: fr[d].pct.toFixed(2).replace(".", ","), s: fr[d].pct, num: 1}, at2.atual[d], at2.maior[d]].concat(completas ? [td[d]] : []);
  }), "t-est") + "</div>";
  if (!completas) h += cardBloqueado(podeSrv("estatisticasCompletas"), "Tendência por janela de concursos e as estatísticas do " + (cfg.extra_nome ? esc(cfg.extra_nome) : "histórico completo") + " estão nas estatísticas completas.");
  else if (cfg.extra_nome) {
    var fx = D.extras || [], ax = D.atrasoExtras || {};
    h += '<div class="card"><h3>' + esc(cfg.extra_nome) + "</h3>";
    h += fx.length ? tabela(["#", esc(cfg.extra_nome), "Vezes", "%", "Atraso"], fx.map(function (x, i) {
      return [i + 1, esc(x[0]), x[1], {h: x[2].toFixed(2).replace(".", ","), s: x[2], num: 1}, ax[x[0]] != null ? ax[x[0]] : "—"];
    }), "t-ext") : '<p class="vazio">Sem dados do campo extra nesta base.</p>';
    h += "</div>";
  }
  el.innerHTML = h; ligarBloqueados(el);
  ativarOrdenacao("t-est"); ativarOrdenacao("t-ext");
  if ($("#e-jan")) $("#e-jan").onchange = function () { ls("janela", +this.value); render(); };
}

TELAS.padroes = function (el, cfg) {
  if (!SRV) { desenharPadroes(el, cfg, MC.dadosPadroes(cs(), cfg)); return; }
  if (!podeSrv("graficos").ok) { el.innerHTML = cardBloqueado(podeSrv("graficos"), "Gráficos de pares e ímpares, somas, faixas, sequências e repetições ajudam a organizar seus jogos."); ligarBloqueados(el); return; }
  el.innerHTML = '<div class="carregando"><div class="esqueleto" style="height:300px"></div></div>';
  MC_API.get("padroes?loteria=" + cfg.chave, {silencioso: true})
    .then(function (D) { desenharPadroes(el, cfg, D); }).catch(function (e) { el.innerHTML = cardErro(e); ligarBloqueados(el); });
};
function desenharPadroes(el, cfg, D) {
  var h = "";
  if (cfg.colunar) {
    var sm = D.somas, cont = {};
    sm.forEach(function (s) { cont[s] = (cont[s] || 0) + 1; });
    var ks = []; for (var s = 0; s <= 63; s++) ks.push(s);
    h += '<div class="kpis">' + kpi("Soma média", (sm.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, sm.length)).toFixed(1).replace(".", ",")) +
      kpi("Colunas repetidas", D.repeticaoMedia.toFixed(2).replace(".", ","), "média por concurso vs. o anterior") + "</div>";
    h += '<div class="card"><h3>Soma dos 7 dígitos</h3>' + grafico(ks.map(String), ks.map(function (s) { return cont[s] || 0; }), {maxRotulos: 32}) + "</div>";
    el.innerHTML = h; return;
  }
  var pi = D.paresImpares.slice().sort(function (a, b) { return parseInt(a[0]) - parseInt(b[0]); });
  var somas = D.somas, mn = Math.min.apply(null, somas), mx = Math.max.apply(null, somas);
  var nb = Math.min(30, mx - mn + 1), lb = (mx - mn + 1) / nb, bins = [], rot = [];
  for (var b = 0; b < nb; b++) { bins.push(0); rot.push(String(Math.round(mn + b * lb))); }
  somas.forEach(function (s) { bins[Math.min(nb - 1, Math.floor((s - mn) / lb))]++; });
  var seq = D.sequencias.slice().sort(function (a, b) { return a[0] - b[0]; });
  var lim = D.limitesSoma, dentro = somas.filter(function (s) { return s >= lim[0] && s <= lim[1]; }).length;
  h += '<div class="kpis">' + kpi("Repetição média", D.repeticao.media.toFixed(2).replace(".", ","), "dezenas repetidas do sorteio anterior") +
    kpi("Soma média", (somas.reduce(function (a, b) { return a + b; }, 0) / somas.length).toFixed(1).replace(".", ","), "faixa típica " + lim[0] + "–" + lim[1]) +
    kpi("Dentro da faixa típica", pct(dentro / somas.length, 1), "dos sorteios") +
    kpi("Primos por sorteio", D.primosMedia.toFixed(2).replace(".", ","), "em média");
  if (D.mioloMedia != null) h += kpi("Miolo (volante 5×5)", D.mioloMedia.toFixed(2).replace(".", ","), "dezenas do miolo em média");
  h += "</div><div class=\"grade g2\">";
  h += '<div class="card"><h3>Pares × ímpares</h3>' + grafico(pi.map(function (x) { return x[0]; }), pi.map(function (x) { return x[1]; }), {altura: 260}) + "</div>";
  h += '<div class="card"><h3>Distribuição das somas</h3>' + grafico(rot, bins, {altura: 260, maxRotulos: 10}) + "</div>";
  h += '<div class="card"><h3>Dezenas por faixa</h3>' + grafico(cfg.faixas.map(function (f) { return cfg.fmt(f[0]) + "–" + cfg.fmt(f[1]); }), D.faixas, {altura: 260}) + "</div>";
  h += '<div class="card"><h3>Maior sequência de consecutivas</h3>' + grafico(seq.map(function (x) { return x[0] + " seguidas"; }), seq.map(function (x) { return x[1]; }), {altura: 260}) + "</div>";
  var rd = D.repeticao.dist.slice().sort(function (a, b) { return a[0] - b[0]; });
  h += '<div class="card"><h3>Repetições em relação ao sorteio anterior</h3>' + grafico(rd.map(function (x) { return x[0] + " rep."; }), rd.map(function (x) { return x[1]; }), {altura: 260}) + "</div>";
  h += "</div>";
  el.innerHTML = h;
}

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
    if (!cfg.colunar) l.push({h: '<span class="score ' + classeScore(g.scores[i]) + '" style="--p:' + g.scores[i] + '%">' + g.scores[i].toFixed(1).replace(".", ",") + "</span>", s: g.scores[i]}, MC.soma(j), MC.paresImpares(j).join("/"));
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
  var maxJ = SRV && ME.limites.geradorMaxJogos ? ME.limites.geradorMaxJogos : 500, pond = !SRV || podeSrv("geradorPonderado").ok, filtrosOk = !SRV || podeSrv("filtros").ok;
  var estrIni = ls("estr") || "Estatística"; if (!pond) estrIni = "Alta cobertura";
  h += '<div class="campo"><label for="g-nj">Quantidade de jogos' + (SRV && ME.limites.geradorMaxJogos ? " (até " + maxJ + ")" : "") + '</label><input id="g-nj" type="number" min="1" max="' + maxJ + '" value="' + Math.min(maxJ, ls("nj") || 10) + '"></div>';
  h += '<div class="campo"><label for="g-es">Estratégia' + (pond ? "" : tagPro("geradorPonderado")) + '</label><select id="g-es">' + MC.ESTRATEGIAS.map(function (e) {
    var bloq = !pond && e !== "Alta cobertura";
    return '<option value="' + esc(e) + '"' + (e === estrIni ? " selected" : "") + '>' + esc(e === "Alta cobertura" ? "Aleatória (alta cobertura)" : e + " · ponderada pelo histórico") + (bloq ? " 🔒" : "") + "</option>";
  }).join("") + "</select></div>";
  if (!cfg.colunar) {
    h += '<div class="campo"><label for="g-smin">Soma mín (0 = auto)</label><input id="g-smin" type="number" min="0" max="5000" value="' + (pf.soma_min || 0) + '"></div>';
    h += '<div class="campo"><label for="g-smax">Soma máx (0 = auto)</label><input id="g-smax" type="number" min="0" max="5000" value="' + (pf.soma_max || 0) + '"></div>';
  }
  h += "</div>";
  if (!cfg.colunar) h += '<div class="checks' + (filtrosOk ? "" : " travado") + '">' + (filtrosOk ? "" : '<span class="dica" style="margin:0;width:100%">Filtros de soma, pares, repetidas e sequências' + tagPro("filtros") + "</span>") + MC.FILTROS.map(function (f) {
    return '<label><input type="checkbox" data-f="' + f[0] + '"' + (filtrosOk && pf[f[0]] !== false ? " checked" : "") + (filtrosOk ? "" : " disabled") + "> " + f[1] + "</label>";
  }).join("") + "</div>";
  if (cfg.extra_nome) {
    var rank = MC.frequenciaExtras(cs(), cfg);
    h += '<div class="form" style="margin-top:10px"><div class="campo"><label for="g-ex">' + esc(cfg.extra_nome) + '</label><select id="g-ex">' + opcoes(modosExtra(cfg), g && g.modoExtra) + '</select></div><div class="campo"><span class="rot">Mais sorteados</span><div class="lista-rank">' +
      (rank.length ? rank.slice(0, 3).map(function (x) { return "<span><b>" + esc(x[0]) + "</b> " + x[2].toFixed(1).replace(".", ",") + "%</span>"; }).join("") : "<span>sem dados</span>") + "</div></div></div>";
  }
  h += '<div class="linha-bts"><button class="bt lot" id="g-gerar" type="button">' + I("raio") + "Gerar jogos</button>";
  if (!cfg.colunar) h += '<select id="g-met" style="width:auto">' + opcoes(MC.METODOS) + '</select><button class="bt" id="g-otim" type="button">' + I("ia") + "Otimizar com MegaCover AI" + tagPro("ia") + "</button>";
  h += '</div><div class="progresso" id="g-prog"><i></i></div>';
  if (cfg.colunar) h += '<p class="nota" style="margin-top:14px">' + I("info") + '<span>No Super Sete cada coluna é sorteada de forma independente, então não existe otimização de conjunto. Para ampliar a cobertura, marque 2 ou 3 números por coluna (isso multiplica o número de apostas no volante) ou use a aba Fechamentos.</span></p>';
  h += "</div>";
  h += '<div class="card" id="g-res"></div>';
  el.innerHTML = h;
  function desenharRes() {
    var g = S.ger[S.lot], box = $("#g-res");
    if (!g || !g.jogos.length) { box.innerHTML = '<h3>Seus jogos</h3>' + vazio("raio", "Configure os parâmetros e clique em <b>Gerar jogos</b>."); return; }
    var media = g.scores ? g.scores.reduce(function (a, b) { return a + b; }, 0) / g.scores.length : null;
    box.innerHTML = '<div class="cab"><h3>' + g.jogos.length + ' jogos</h3><span class="dica" style="margin:0">' + esc(g.estr) + (media != null ? ' · MegaScore™ médio <b class="mono">' + media.toFixed(1).replace(".", ",") + "</b>" : "") + "</span></div>" +
      tabela(cabJogos(cfg), linhasJogos(cfg, g), "t-jogos") +
      '<div class="linha-bts"><button class="bt" data-x="csv" type="button">' + I("baixar") + 'Excel' + tagPro("exportar") + '</button><button class="bt" data-x="txt" type="button">' + I("baixar") + 'TXT</button><button class="bt" data-x="pdf" type="button">' + I("imprimir") + 'PDF' + (SRV ? tagPro("relatorioPdf", "simples") : "") + '</button>' + (SRV ? '<button class="bt" data-x="salvar" type="button">' + I("salvar") + "Salvar jogos</button>" : "") + '<button class="bt" data-x="projeto" type="button">' + I("salvar") + 'Salvar projeto</button><button class="bt" data-x="copiar" type="button">' + I("copiar") + 'Copiar</button><span style="flex:1"></span><button class="bt" data-x="sim" type="button">' + I("dado") + 'Simular</button><button class="bt" data-x="conf" type="button">' + I("check") + 'Conferir</button><button class="bt primario" data-x="volante" type="button">' + I("imprimir") + 'Imprimir no volante</button></div>';
    ativarOrdenacao("t-jogos");
    $$("[data-x]", box).forEach(function (b) {
      b.onclick = function () {
        var x = b.dataset.x;
        if (SRV && (x === "csv" || x === "pdf" || x === "salvar")) { acaoServidor(cfg, g, x, b); return; }
        if (["csv", "txt", "pdf", "projeto"].indexOf(x) >= 0 && !pro("exportar")) return;
        if (x === "pdf") window.print();
        else if (x === "sim") ir(S.lot, "simulador");
        else if (x === "conf") ir(S.lot, "conferir");
        else if (x === "volante") imprimirVolante(cfg, g.jogos, g.extras);
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
    if (SRV) {
      if (es !== "Alta cobertura" && !pro("geradorPonderado")) return;
      if (!pro("geradorJogos", nj)) return;
      var bt0 = this; bt0.disabled = true;
      MC_API.post("gerar", {loteria: cfg.chave, jogos: nj, estrategia: es, dezenas: nd, porColuna: nd, filtros: filtrosOk ? lerFiltros() : null}).then(function (d) {
        if (!d.jogos.length) { status("Nenhum jogo passou nos filtros. Afrouxe os critérios."); return; }
        definirJogos(cfg, d.jogos, es); desenharRes();
        status(d.jogos.length < nj ? "Só " + d.jogos.length + " jogos passaram nos filtros." : d.jogos.length + " jogos gerados para a " + cfg.nome + ".");
      }).catch(function (e) { if (e.codigo !== "plano") status(e.message); }).then(function () { bt0.disabled = false; });
      return;
    }
    var jogos = cfg.colunar ? MC.gerarColunar(cs(), cfg, nd, nj, es) : MC.gerarJogos(cs(), cfg, nd, nj, es, lerFiltros());
    if (!jogos.length) { status("Nenhum jogo passou nos filtros. Afrouxe os critérios."); return; }
    definirJogos(cfg, jogos, es);
    desenharRes();
    status(jogos.length < nj ? "Só " + jogos.length + " jogos passaram nos filtros." : jogos.length + " jogos gerados para a " + cfg.nome + ".");
  };
  if ($("#g-otim")) $("#g-otim").onclick = function () {
    if (!pro("ia")) return;
    var g = S.ger[S.lot];
    if (!g || !g.jogos.length) { status("Gere jogos primeiro."); return; }
    var bt = this, pr = $("#g-prog"), met = $("#g-met").value; bt.disabled = true;
    if (SRV) {
      bt.innerHTML = I("ia") + "Otimizando…";
      MC_API.post("otimizar", {loteria: cfg.chave, metodo: met, jogos: g.jogos.slice(0, 50)}).then(function (r) {
        definirJogos(cfg, r.jogos.map(MC.util.sortN), met); desenharRes();
        status("Otimização concluída · fitness " + r.fit.toFixed(2) + " · " + r.uso.usado + " de " + r.uso.limite + " execuções hoje");
      }).catch(function (e) { if (["plano", "limite_diario"].indexOf(e.codigo) < 0) status(e.message); })
        .then(function () { bt.disabled = false; bt.innerHTML = I("ia") + "Otimizar com MegaCover AI" + tagPro("ia"); });
      return;
    }
    MC.otimizar(met, cs(), g.jogos, cfg, function (p, f) { progresso(pr, p); bt.innerHTML = I("ia") + "Fitness " + f.toFixed(2); }).then(function (r) {
      definirJogos(cfg, r.jogos.map(MC.util.sortN), met);
      pr.classList.remove("on"); bt.disabled = false; bt.innerHTML = I("ia") + "Otimizar com MegaCover AI" + tagPro("ia");
      desenharRes(); status("Otimização concluída — fitness " + r.fit.toFixed(2));
    });
  };
};
function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }
/* exportação, relatórios e jogos salvos pelo servidor */
function acaoServidor(cfg, g, x, bt) {
  if (x === "csv" && !pro("exportar")) return;
  if (x === "pdf" && !pro("relatorioPdf", "simples")) return;
  var txt0 = bt.innerHTML; bt.disabled = true;
  var fim = function () { bt.disabled = false; bt.innerHTML = txt0; };
  if (x === "salvar") {
    MC_API.post("jogos", {loteria: cfg.chave, jogos: g.jogos.map(function (j, i) { return {dezenas: j, extra: g.extras ? g.extras[i] : null}; })})
      .then(function (r) { status(r.ids.length + " jogo(s) salvo(s). Veja em Conferir › Meus jogos salvos."); })
      .catch(function (e) { if (e.codigo !== "plano") status(e.message); }).then(fim);
    return;
  }
  var tipo = x === "pdf" ? (ME.limites.relatorioPdf === "completo" ? "completo" : "simples") : null;
  MC_API.post("exportar", {loteria: cfg.chave, formato: x, tipo: tipo, jogos: g.jogos, extras: g.extras}, {binario: true}).then(function (blob) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "megacover-" + cfg.chave + "-" + new Date().toISOString().slice(0, 10) + "." + x; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    status(x === "pdf" ? "Relatório " + tipo + " gerado." : "Planilha gerada.");
  }).catch(function (e) { if (e.codigo !== "plano") status(e.message); }).then(fim);
}

/* leva os jogos para a página de impressão no volante */
function imprimirVolante(cfg, jogos, extras) {
  if (!jogos || !jogos.length) { status("Gere jogos primeiro."); return; }
  ls("imprimir", {lot: cfg.chave, jogos: jogos, extras: extras || null, criado: Date.now()});
  location.href = "volante.html?modo=virtual&imprimir=1";
}

/* ---------- Fechamentos ---------- */
TELAS.fechamentos = function (el, cfg) {
  if (cfg.colunar) return fechamentoSuperSete(el, cfg);
  var gar = Object.keys(MC.garantias(cfg)), f = S.fech[S.lot];
  var tamPadrao = cfg.aposta_min, baseN = Math.min(cfg.dezenas.length - 1, tamPadrao + (cfg.chave === "lotomania" ? 10 : 4));
  var sel = new Set((ls("base:" + S.lot) || []).filter(function (d) { return d >= cfg.inicio && d <= cfg.universo; }));
  var h = (SRV ? '<div id="f-prontos"></div>' : "") + '<div class="card"><h3>Fechamento personalizado' + tagPro("fechamentos") + '</h3><p class="dica">Escolha a base de dezenas (clique no volante ou digite) e o sistema monta o menor conjunto de jogos que cobre as combinações da faixa-alvo dentro dela.</p>';
  h += '<div class="volante" id="f-vol">' + cfg.dezenas.map(function (d) { return '<button type="button" data-d="' + d + '"' + (sel.has(d) ? ' class="on"' : "") + ">" + cfg.fmt(d) + "</button>"; }).join("") + "</div>";
  h += '<div class="form" style="margin-top:12px"><div class="campo" style="grid-column:1/-1"><label for="f-base">Base (separe por vírgula ou espaço)</label><input id="f-base" type="text" value="' + Array.from(sel).sort(function (a, b) { return a - b; }).join(", ") + '"></div>';
  h += '<div class="campo"><label for="f-bn">Tamanho da base sugerida</label><input id="f-bn" type="number" min="' + (tamPadrao + 1) + '" max="' + cfg.dezenas.length + '" value="' + baseN + '"></div>';
  h += '<div class="campo"><label for="f-tam">Dezenas por jogo</label><select id="f-tam">' + opcoes(range(cfg.aposta_min, cfg.aposta_max), tamPadrao) + "</select></div>";
  h += '<div class="campo"><label for="f-per">Perfil</label><select id="f-per">' + opcoes(MC.PERFIS, "Equilibrado") + "</select></div>";
  h += '<div class="campo"><label for="f-gar">Cobertura-alvo</label><select id="f-gar">' + opcoes(gar) + "</select></div>";
  h += '<div class="campo"><label for="f-max">Máx. de jogos (0 = auto)</label><input id="f-max" type="number" min="0" max="5000" value="0"></div></div>';
  h += '<div class="linha-bts"><button class="bt" id="f-sug" type="button">' + I("brilho") + 'Sugerir base</button><button class="bt" id="f-limpar" type="button">Limpar</button><button class="bt lot" id="f-ok" type="button">' + I("alvo") + 'Gerar fechamento</button><span id="f-cont" class="dica" style="margin:0"></span></div><div class="progresso" id="f-prog"><i></i></div></div>';
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
    if (!f) { box.innerHTML = '<h3>Resultado</h3>' + vazio("alvo", "Monte a base e clique em <b>Gerar fechamento</b>."); return; }
    var i = f.info;
    box.innerHTML = "<h3>" + i.qtd_jogos + " jogos de " + i.tamanho_jogo + " dezenas</h3><div class=\"resumo\">Base de <b>" + i.base.length + "</b> dezenas · perfil <b>" + esc(i.perfil) + "</b> · cobertura interna (" + esc(i.garantia_alvo) + ", calculada em " + i.calculada_em + " dezenas): <b>" + i.cobertura_pct.toLocaleString("pt-BR") + "%</b><br><small>" + esc(i.observacao) + "</small></div><div style=\"margin-top:12px\"></div>" +
      tabela(["#", "Jogo", "Soma"], f.jogos.map(function (j, k) { return [k + 1, {h: bolas(cfg, j, null, true), s: k}, MC.soma(j)]; }), "t-fech") +
      '<div class="linha-bts"><button class="bt lot" id="f-usar" type="button">Usar como jogos atuais (exportar / simular / conferir)</button></div>';
    $("#f-usar").onclick = function () { definirJogos(cfg, f.jogos, "Fechamento " + i.perfil); ir(S.lot, "gerador"); };
  }
  desenhar();
  if (SRV) montarProntos($("#f-prontos"), cfg, function (r) { S.fech[S.lot] = r; desenhar(); $("#f-res").scrollIntoView({behavior: "smooth"}); });
  $("#f-ok").onclick = function () {
    if (!pro("fechamentos")) return;
    var base = lerBase(), tam = +$("#f-tam").value;
    if (SRV) {
      var bt1 = this; bt1.disabled = true; bt1.textContent = "Calculando…";
      MC_API.post("fechamento", {loteria: cfg.chave, base: base, perfil: $("#f-per").value, garantia: $("#f-gar").value, tamanho: tam, max: +$("#f-max").value || null})
        .then(function (r) { S.fech[S.lot] = r; desenhar(); status(r.jogos.length + " jogos no fechamento."); })
        .catch(function (e) { if (e.codigo !== "plano") status(e.message); })
        .then(function () { bt1.disabled = false; bt1.innerHTML = I("alvo") + "Gerar fechamento"; });
      return;
    }
    if (base.length - tam > 12 && !confirm("A base tem " + base.length + " dezenas para jogos de " + tam + ". O cálculo pode levar alguns segundos e a cobertura será estimada por amostragem. Continuar?")) return;
    var bt = this, pr = $("#f-prog"); bt.disabled = true; bt.textContent = "Calculando…";
    MC.gerarFechamento(base, cfg, $("#f-per").value, $("#f-gar").value, tam, +$("#f-max").value || null, function (p, n) {
      progresso(pr, p); bt.textContent = n + " jogos…";
    }).then(function (r) { S.fech[S.lot] = r; desenhar(); status(r.jogos.length + " jogos no fechamento."); })
      .catch(function (e) { status(e.message); })
      .then(function () { bt.disabled = false; bt.innerHTML = I("alvo") + "Gerar fechamento"; pr.classList.remove("on"); });
  };
};
function fechamentoSuperSete(el, cfg) {
  var h = '<div class="card"><h3>Fechamento Super Sete' + tagPro("fechamentos") + '</h3><p class="dica">Desdobramento do volante seguindo a regra oficial da CAIXA.</p><div class="form">';
  h += '<div class="campo"><label for="s-tot">Total de números (7 a 21)</label><input id="s-tot" type="number" min="7" max="21" value="' + (ls("ss-tot") || 10) + '"></div>';
  h += '<div class="campo"><label for="s-per">Distribuição</label><select id="s-per">' + opcoes(MC.PERFIS_SS, ls("ss-per") || "Equilibrado") + "</select></div>";
  h += '<div class="campo"><button class="bt lot" id="s-ok" type="button">' + I("alvo") + 'Gerar fechamento</button></div></div>';
  h += '<p class="nota" style="margin-top:12px"><b>Regra oficial da CAIXA:</b> de 8 a 14 números marcados, cada coluna tem no mínimo 1 e no máximo 2. De 15 a 21 números, no mínimo 2 e no máximo 3 — só é possível marcar o 3º número numa coluna depois que TODAS já tiverem 2. A quantidade de jogos simples é o produto das colunas (ex.: 2 números em três colunas e 1 nas demais = 2×2×2 = 8 jogos).</p><div id="s-prev" class="resumo"></div></div><div class="card" id="s-res"><h3>Resultado</h3>' + vazio("alvo", "Escolha o total e clique em <b>Gerar fechamento</b>.") + '</div>';
  el.innerHTML = h;
  function previa() {
    try {
      var t = +$("#s-tot").value, q = MC.distribuirColunas(t, 7), c = q.reduce(function (a, b) { return a * b; }, 1);
      $("#s-prev").innerHTML = "Distribuição por coluna: <b>" + q.join(" · ") + "</b> → <b>" + fmtN(c) + "</b> jogo(s) simples.";
    } catch (e) { $("#s-prev").textContent = e.message; }
  }
  $("#s-tot").oninput = previa; previa();
  $("#s-ok").onclick = function () {
    if (!pro("fechamentos")) return;
    try {
      var t = +$("#s-tot").value, p = $("#s-per").value; ls("ss-tot", t); ls("ss-per", p);
      if (SRV) {
        MC_API.post("fechamento", {loteria: cfg.chave, total: t, perfil: p}).then(mostrarSS).catch(function (e) { if (e.codigo !== "plano") status(e.message); });
        return;
      }
      mostrarSS(MC.fechamentoSS(cs(), cfg, t, p));
    } catch (e) { status(e.message); }
  };
  function mostrarSS(r) {
    var p = $("#s-per").value;
    try {
      $("#s-res").innerHTML = "<h3>Cartão a marcar no volante</h3>" + colunasSS(r.cartao) + '<div class="resumo">' + esc(r.info.observacao) + "</div>" +
        '<h3 style="margin-top:16px">Jogos simples equivalentes (' + fmtN(r.jogos.length) + ")</h3>" +
        tabela(["#", "Jogo"], r.jogos.slice(0, 2187).map(function (j, i) { return [i + 1, j.map(function (c) { return c[0]; }).join(" ")]; })) +
        '<div class="linha-bts"><button class="bt lot" id="s-usar" type="button">Usar o cartão como jogo atual (simular / conferir)</button></div>';
      $("#s-usar").onclick = function () { definirJogos(cfg, [r.cartao], "Fechamento " + p); ir(S.lot, "simulador"); };
    } catch (e) { status(e.message); }
  }
}
/* catálogo de fechamentos prontos (servidor): matrizes com cobertura conferida aplicadas às dezenas da pessoa */
function montarProntos(box, cfg, aoGerar) {
  MC_API.get("fechamentos?loteria=" + cfg.chave, {silencioso: true}).then(function (d) {
    var L = d.fechamentos; if (!L.length) { box.innerHTML = ""; return; }
    box.innerHTML = '<div class="card"><h3>Fechamentos prontos</h3><p class="dica">Modelos com cobertura conferida. Escolha um modelo, informe as suas dezenas e o MegaCover monta os jogos.</p><div class="prontos">' +
      L.map(function (f) {
        return '<label class="pronto' + (f.permitido ? "" : " travado") + '"><input type="radio" name="fp" value="' + esc(f.id) + '"' + (f.permitido ? "" : ' data-bloq="1"') + '><span><b>' + esc(f.nome) + "</b><small>" + f.qtdJogos + " jogos de " + f.tamanho + " dezenas · cobertura " + String(f.cobertura_pct).replace(".", ",") + "%</small></span>" + (f.permitido ? "" : tagPro("fechamentoPronto", f.id)) + "</label>";
      }).join("") + '</div><div class="form" style="margin-top:12px"><div class="campo" style="grid-column:1/-1"><label for="fp-dz">Suas dezenas</label><input id="fp-dz" type="text" placeholder="Escolha um modelo acima"></div></div>' +
      '<div class="linha-bts"><button class="bt lot" id="fp-ok" type="button">' + I("alvo") + 'Montar jogos</button><span id="fp-info" class="dica" style="margin:0"></span></div></div>';
    var atual = null;
    $$("input[name=fp]", box).forEach(function (r) {
      r.onchange = function () {
        if (r.dataset.bloq) { r.checked = false; atual = null; pro("fechamentoPronto", r.value); return; }
        atual = L.filter(function (f) { return f.id === r.value; })[0];
        $("#fp-dz").placeholder = "Digite " + atual.dezenas + " dezenas entre " + cfg.fmt(cfg.inicio) + " e " + cfg.fmt(cfg.universo);
        $("#fp-info").textContent = atual.dezenas + " dezenas → " + atual.qtdJogos + " jogos";
      };
    });
    $("#fp-ok").onclick = function () {
      if (!atual) { status("Escolha um modelo de fechamento."); return; }
      var dz = $("#fp-dz").value.split(/[^0-9]+/).filter(Boolean).map(Number);
      MC_API.post("fechamentos/aplicar", {id: atual.id, dezenas: dz}).then(function (r) {
        aoGerar({jogos: r.jogos, info: {qtd_jogos: r.jogos.length, tamanho_jogo: r.jogos[0].length, base: MC.util.sortN(dz), perfil: "Pronto", garantia_alvo: r.fechamento.garantia,
          calculada_em: atual.acertos, cobertura_pct: r.fechamento.cobertura_pct,
          observacao: "Fechamento pronto com cobertura conferida dentro das dezenas escolhidas. Organiza seus jogos; não constitui garantia de premiação."}});
        status(r.jogos.length + " jogos montados.");
      }).catch(function (e) { if (e.codigo !== "plano") status(e.message); });
    };
  }).catch(function () { box.innerHTML = ""; });
}

/* ---------- Simulador ---------- */
TELAS.simulador = function (el, cfg) {
  var g = S.ger[S.lot], h = '<div class="card"><h3>Simulador Monte Carlo</h3>';
  if (!g || !g.jogos.length) {
    el.innerHTML = h + vazio("dado", "Gere jogos no <b>Gerador</b> (ou use um fechamento) para simular.", '<button class="bt primario" type="button" id="m-ir">' + I("raio") + "Ir para o Gerador</button>") + "</div>";
    $("#m-ir").onclick = function () { ir(S.lot, "gerador"); }; return;
  }
  h += '<p class="dica">Teste sua estratégia contra os concursos anteriores e contra milhares de sorteios simulados: o MegaCover mede o melhor acerto do seu conjunto de ' + g.jogos.length + " jogo(s) em cada um.</p>";
  if (SRV && !podeSrv("monteCarlo").ok) {
    h += "</div>" + cardBloqueado(podeSrv("monteCarlo"), "Teste sua estratégia contra os concursos anteriores e contra milhares de sorteios simulados antes de apostar.");
    el.innerHTML = h; return;
  }
  h += '<div class="form"><div class="campo"><label for="m-n">Simulações</label><select id="m-n">' + opcoes(SRV ? [[10000, "10 mil"], [100000, "100 mil"], [500000, "500 mil"], [1000000, "1 milhão"]] : [[10000, "10 mil"], [100000, "100 mil" + (PL.pro.simulacaoGrande ? " · PRO" : "")], [500000, "500 mil" + (PL.pro.simulacaoGrande ? " · PRO" : "")], [1000000, "1 milhão" + (PL.pro.simulacaoGrande ? " · PRO" : "")]], SRV || PL.liberado("simulacaoGrande") ? 100000 : 10000) + '</select></div><div class="campo"><button class="bt lot" id="m-ok" type="button">' + I("dado") + 'Simular</button></div></div><div class="progresso" id="m-prog"><i></i></div></div><div id="m-res"></div>';
  if (!cfg.colunar) {
    var n = g.jogos[0].length;
    h += '<div class="card"><h3>Probabilidade exata de uma aposta de ' + n + " dezenas</h3>" + tabela(["Acertos", "Probabilidade", "1 em"], cfg.premios.slice().reverse().map(function (k) {
      var p = MC.probExata(cfg, n, k); return [k + " acertos", p ? (p * 100).toPrecision(3).replace(".", ",") + "%" : "0", p ? fmtN(Math.round(1 / p)) : "—"];
    })) + '<p class="dica" style="margin-top:8px">Cálculo combinatório (hipergeométrico) para um único jogo' + (cfg.sorteios > 1 ? ", por sorteio" : "") + ".</p></div>";
  }
  el.innerHTML = h;
  $("#m-ok").onclick = function () {
    if (SRV ? !pro("monteCarlo") : (+$("#m-n").value > 10000 && !pro("simulacaoGrande"))) return;
    var bt = this, pr = $("#m-prog"), ns = +$("#m-n").value; bt.disabled = true;
    var ant = null;
    var prom = SRV
      ? MC_API.post("montecarlo", {loteria: cfg.chave, jogos: g.jogos.slice(0, 100), simulacoes: ns}).then(function (d) {
          ant = d.anteriores; status("Simulação concluída · " + d.uso.usado + " de " + d.uso.limite + " execuções hoje"); return d.resultado; })
      : MC.monteCarlo(g.jogos, cfg, ns, function (p) { progresso(pr, p); }).then(function (r) { ant = MC.historicoConjunto(g.jogos, cs(), cfg); return r; });
    prom.catch(function (e) { bt.disabled = false; pr.classList.remove("on"); if (["plano", "limite_diario"].indexOf(e.codigo) < 0) status(e.message); throw e; }).then(function (r) {
      bt.disabled = false; pr.classList.remove("on");
      var ks = Object.keys(r.dist).map(Number).sort(function (a, b) { return a - b; });
      var hh = '<div class="kpis">' + kpi("Média do melhor acerto", r.media.toFixed(3).replace(".", ","), fmtN(r.simulacoes) + " simulações");
      cfg.premios.slice().reverse().forEach(function (fx) {
        var v = r.faixas[fx]; hh += kpi(fx + "+ acertos", pct(v, v && v < 0.001 ? 4 : 2), v ? "≈ 1 a cada " + fmtN(Math.round(1 / v)) + " concursos" : "não ocorreu");
      });
      hh += '</div><div class="card"><h3>Distribuição do melhor acerto</h3>' + grafico(ks.map(function (k) { return k + " ac."; }), ks.map(function (k) { return r.dist[k]; }), {altura: 240}) +
        '<p class="dica" style="margin-top:8px">Estimativas empíricas por amostragem — não constituem previsão nem garantia de prêmio.</p></div>';
      if (ant && ant.concursos) {
        var kk = Object.keys(ant.dist).map(Number).sort(function (a, b) { return a - b; });
        hh = '<div class="card"><h3>Nos concursos anteriores</h3><p class="dica">Como o seu conjunto teria ido nos ' + fmtN(ant.concursos) + " concursos reais (nº " + fmtN(ant.de) + " a " + fmtN(ant.ate) + ").</p>" +
          '<div class="kpis">' + kpi("Média do melhor acerto", ant.media.toFixed(3).replace(".", ","), "nos concursos reais") +
          cfg.premios.slice().reverse().map(function (fx) { return kpi(fx + "+ acertos", fmtN(ant.faixas[fx] || 0) + "×", "concursos com essa faixa"); }).join("") + "</div>" +
          grafico(kk.map(function (k) { return k + " ac."; }), kk.map(function (k) { return ant.dist[k]; }), {altura: 200}) + "</div>" +
          '<h3 style="margin:18px 0 10px">Em sorteios simulados</h3>' + hh;
      }
      $("#m-res").innerHTML = hh;
    }).catch(function () {});
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
  h += '<div class="form" style="margin-top:10px"><div class="campo"><label for="c-num">Concurso</label><input id="c-num" type="number" min="' + (c[0] ? c[0].concurso : 1) + '" max="' + (u ? u.concurso : 1) + '" value="' + (u ? u.concurso : "") + '"></div><div class="campo"><button class="bt lot" id="c-ok" type="button">' + I("check") + 'Conferir no concurso</button></div><div class="campo"><button class="bt" id="c-hist" type="button">' + I("historico") + 'Todo o histórico' + tagPro("historico") + '</button></div>' +
    (g && g.jogos.length ? '<div class="campo"><button class="bt" id="c-atuais" type="button">Usar jogos atuais</button></div>' : "") + "</div></div><div class=\"card\" id=\"c-res\"></div>";
  if (SRV) h += '<div class="card" id="c-salvos"></div>';
  el.innerHTML = h;
  if (SRV) montarSalvos(cfg);
  $("#c-res").innerHTML = '<h3>Resultado</h3>' + vazio("check", "Cole seus jogos (um por linha) e confira.");
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
      return [i + 1, {h: cfg.colunar ? colunasSS(j) : bolas(cfg, j, todas, true), s: i}, {h: (pr ? I("trofeu") + " " : "") + hs.join(" / "), s: best}];
    });
    $("#c-res").innerHTML = "<h3>Concurso " + fmtN(n) + " · " + premiados + " jogo(s) premiado(s)</h3>" + bolasConcurso(cfg, con) + '<div style="margin-top:12px"></div>' + tabela(["#", "Jogo", cfg.sorteios > 1 ? "Acertos (1º / 2º)" : "Acertos"], linhas, "t-conf");
    ativarOrdenacao("t-conf");
  };
  $("#c-hist").onclick = function () {
    if (!pro("historico")) return;
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

/* jogos salvos no servidor (limite por plano) */
function montarSalvos(cfg) {
  var box = $("#c-salvos"); if (!box) return;
  MC_API.get("jogos?loteria=" + cfg.chave, {silencioso: true}).then(function (d) {
    var lim = d.limite, J = d.jogos;
    box.innerHTML = '<div class="cab"><h3>Meus jogos salvos</h3><span class="dica" style="margin:0">' + J.length + (lim ? " de " + lim + " (todas as loterias contam)" : "") + "</span></div>" +
      (J.length ? tabela(["#", "Jogo", ""], J.map(function (j, i) {
        return [i + 1, {h: cfg.colunar ? colunasSS(j.dezenas) : bolas(cfg, j.dezenas, null, true), s: i}, {h: '<button class="bt icone" type="button" data-apagar="' + j.id + '" aria-label="Apagar">' + I("lixo") + "</button>", s: 0}];
      }), "t-salvos") + '<div class="linha-bts"><button class="bt lot" id="c-usar-salvos" type="button">' + I("check") + "Conferir os salvos</button>" +
        (ME && ME.limites.avisoEmail ? '<span class="dica" style="margin:0">Você recebe o resultado destes jogos por e-mail depois de cada sorteio.</span>' : '<span class="dica" style="margin:0">Aviso de resultado por e-mail' + tagPro("avisoEmail") + "</span>") + "</div>"
        : vazio("salvar", "Gere jogos e use <b>Salvar jogos</b> no Gerador para guardá-los aqui."));
    $$("[data-apagar]", box).forEach(function (b) {
      b.onclick = function () { MC_API.del("jogos?id=" + b.dataset.apagar).then(function () { montarSalvos(cfg); }); };
    });
    if ($("#c-usar-salvos")) $("#c-usar-salvos").onclick = function () {
      $("#c-txt").value = J.map(function (j) { return textoJogo(cfg, j.dezenas); }).join("\n"); $("#c-ok").click();
    };
  }).catch(function () { box.innerHTML = ""; });
}

/* ---------- Dados ---------- */
TELAS.dados = function (el, cfg) {
  if (SRV) {
    var m = S.meta[S.lot] || {}, cc = cs();
    el.innerHTML = '<div class="card"><h3>Resultados</h3><p class="dica">Os resultados são atualizados automaticamente pelo servidor do MegaCover depois de cada sorteio. Confira sempre o resultado oficial em loterias.caixa.gov.br.</p>' +
      '<div class="resumo">Concursos liberados no seu plano: <b>' + fmtN(cc.length) + "</b>" + (m.limitado ? " de " + fmtN(m.total) + " · histórico completo nos planos pagos" : " (histórico completo)") +
      (cc.length ? "<br>Último concurso: <b>" + fmtN(cc[cc.length - 1].concurso) + "</b> · " + esc(cc[cc.length - 1].data) : "") + "</div>" +
      (m.limitado ? '<div class="linha-bts"><button class="bt primario" type="button" id="x-hist">' + I("coroa") + "Liberar o histórico completo</button></div>" : "") + "</div>";
    if ($("#x-hist")) $("#x-hist").onclick = function () { pro("historicoCompleto"); };
    return;
  }
  var c = cs(), add = ls("add:" + S.lot) || [], sy = ls("sync:" + S.lot);
  var nCols = cfg.colunar ? 7 : cfg.sorteadas * cfg.sorteios;
  var h = '<div class="grade g2"><div class="card"><h3>Atualizar resultados</h3><p class="dica">O painel sincroniza sozinho ao abrir e a cada 15 minutos: primeiro pela API pública que lê a CAIXA em tempo real, depois pela base do GitHub (eitchtee/loterias.json) como reserva. Os concursos novos ficam salvos neste navegador. Use o botão para forçar agora.</p>' +
    '<div class="resumo">Base do site: até o concurso <b>' + fmtN(S.meta[S.lot].ultimoBase || 0) + "</b>" + (S.meta[S.lot].atualizado ? " (" + new Date(S.meta[S.lot].atualizado).toLocaleDateString("pt-BR") + ")" : "") +
    "<br>Salvos neste navegador: <b>" + fmtN(add.length) + "</b> concurso(s)" + (sy ? " · última sincronização " + new Date(sy).toLocaleString("pt-BR") : "") + "</div>" +
    '<div class="linha-bts"><button class="bt lot" id="x-on" type="button">' + I("atualizar") + 'Atualizar ' + esc(cfg.nome) + '</button><button class="bt" id="x-testar" type="button">' + I("lupa") + 'Testar fontes</button><button class="bt perigo" id="x-limpar" type="button">' + I("lixo") + 'Apagar dados locais</button></div><div id="x-fontes"></div></div>';
  h += '<div class="card"><h3>Adicionar concurso</h3><div class="form"><div class="campo"><label for="x-n">Concurso</label><input id="x-n" type="number" min="1" value="' + ((c.length ? c[c.length - 1].concurso : 0) + 1) + '"></div><div class="campo"><label for="x-d">Data</label><input id="x-d" type="text" placeholder="dd/mm/aaaa"></div></div>' +
    '<div class="form" style="margin-top:10px"><div class="campo" style="grid-column:1/-1"><label for="x-dz">' + nCols + " número(s)" + (cfg.sorteios > 1 ? " (1º sorteio seguido do 2º)" : cfg.colunar ? " (coluna 1 a 7)" : "") + '</label><input id="x-dz" type="text" placeholder="ex.: 04 05 30 33 41 52"></div>' +
    (cfg.extra_nome ? '<div class="campo" style="grid-column:1/-1"><label for="x-ex">' + esc(cfg.extra_nome) + (cfg.extra_qtd > 1 ? " (ex.: 2,5)" : "") + '</label><input id="x-ex" type="text"></div>' : "") +
    '</div><div class="linha-bts"><button class="bt lot" id="x-add" type="button">Adicionar</button></div></div></div>';
  h += '<div class="grade g2"><div class="card"><h3>Importar CSV</h3><p class="dica">Formato do MegaCover desktop: <code>Concurso;Data;Bola1;…;BolaN' + (cfg.extra_nome ? ";" + esc(cfg.extra_nome) : "") + "</code> (separador ; ou ,). A primeira linha pode ser o cabeçalho.</p>" +
    '<input type="file" id="x-arq" accept=".csv,.txt"><div class="linha-bts"><button class="bt" id="x-exp" type="button">' + I("baixar") + 'Exportar histórico (CSV)</button></div><div id="x-log" class="dica" style="margin-top:8px"></div></div>';
  h += '<div class="card"><h3>Projetos .megacover</h3><p class="dica">Abra um projeto salvo no Gerador para recuperar os jogos.</p><input type="file" id="x-proj" accept=".megacover,.json"><div id="x-plog" class="dica" style="margin-top:8px"></div></div></div>';
  el.innerHTML = h;
  $("#x-on").onclick = function () {
    var bt = this; bt.disabled = true; bt.textContent = "Baixando…";
    ls("sync:" + S.lot, null);
    atualizarOnline(S.lot).then(function (n) { status(n ? n + " concurso(s) novo(s) da " + cfg.nome + "." : cfg.nome + " já está atualizada."); render(); })
      .catch(function (e) { status("Não foi possível conectar (" + e.message + ")."); bt.disabled = false; bt.innerHTML = I("atualizar") + "Atualizar " + esc(cfg.nome); });
  };
  $("#x-testar").onclick = function () {
    var box = $("#x-fontes"), bt = this; bt.disabled = true;
    var fontes = APIS.map(function (a) { return {nome: a.nome, url: urlApi(a, S.lot, "latest")}; })
      .concat([{nome: "Base GitHub (eitchtee)", url: GH + GH_NOME[S.lot] + ".json", lista: true}]);
    box.innerHTML = '<div class="resumo">Testando ' + fontes.length + " fontes a partir do seu navegador…</div>";
    Promise.all(fontes.map(function (f) {
      var t0 = Date.now();
      return getJSON(f.url, 15000).then(function (j) {
        var r = f.lista ? (Array.isArray(j) && j.length ? ghParaRow(cfg, j[j.length - 1]) : null) : apiParaRow(cfg, j);
        return {f: f, ok: !!r, txt: r ? "concurso " + r[0] + " · " + r[1] : "respondeu, mas em formato inesperado", ms: Date.now() - t0};
      }, function (e) { return {f: f, ok: false, txt: "falhou (" + (e && e.message || "bloqueado/CORS") + ")", ms: Date.now() - t0}; });
    })).then(function (rs) {
      box.innerHTML = '<div class="resumo" id="x-diag">' + rs.map(function (r) {
        return (r.ok ? "✅" : "❌") + " <b>" + esc(r.f.nome) + "</b>: " + esc(r.txt) + ' <small>(' + r.ms + " ms)</small>";
      }).join("<br>") + '<br><small>Local: concurso ' + ultimoLocal(S.lot) + " · " + new Date().toLocaleString("pt-BR") + " · " + esc(navigator.userAgent.slice(0, 60)) + '</small></div><div class="linha-bts"><button class="bt" id="x-copiar-diag" type="button">' + I("copiar") + "Copiar resultado</button></div>";
      $("#x-copiar-diag").onclick = function () { navigator.clipboard.writeText($("#x-diag").innerText).then(function () { status("Copiado. Cole na conversa para eu analisar."); }); };
      bt.disabled = false;
    });
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
/* ======================= Planos no modo servidor ======================= */
/* o que o plano mínimo acrescenta ao plano atual (lido de regras.json) */
function ganhos(min) {
  if (!min || !REGRAS) return [];
  return PERM.perdas(REGRAS, min.id, ME ? ME.plano : "gratis").filter(function (x) { return x.antes !== "—"; });
}
function linkAssinar(min) { return "planos.html?plano=" + (min ? min.id : "pro"); }
function cardBloqueado(r, texto) {
  var min = r && r.planoMinimo, g = ganhos(min).slice(0, 6);
  return '<div class="card bloqueado"><div class="cab"><h3>' + I("cadeado") + esc(r && r.nome || "Recurso dos planos pagos") + "</h3>" +
    (min ? '<span class="pro">Plano ' + esc(min.nome) + "</span>" : "") + "</div>" + (texto ? '<p class="dica">' + texto + "</p>" : "") +
    (g.length ? '<p style="margin:10px 0 6px;font-weight:700">O plano ' + esc(min.nome) + ' inclui:</p><ul class="ganhos">' +
      g.map(function (x) { return "<li>" + I("check") + "<span>" + esc(x.rotulo) + ": <b>" + esc(x.antes) + "</b></span></li>"; }).join("") + "</ul>" : "") +
    '<div class="linha-bts"><a class="bt primario" href="' + linkAssinar(min) + '">' + I("coroa") + "Assinar o " + esc(min ? min.nome : "Pro") + '</a><a class="bt" href="planos.html">Comparar planos</a></div></div>';
}
function cardErro(e) {
  if (e && e.codigo === "plano") return cardBloqueado({nome: e.dados.nome, planoMinimo: e.dados.planoMinimo}, esc(e.message));
  return '<div class="card">' + vazio("info", esc(e && e.message || "Não foi possível carregar agora. Tente de novo.")) + "</div>";
}
function ligarBloqueados() {}
/* aviso ao tentar usar um recurso bloqueado: o que perderia/ganharia e botão direto para assinar */
function upsell(r) {
  var min = r && r.planoMinimo, g = ganhos(min);
  abrirModal('<div class="sobre">Recurso do plano ' + esc(min ? min.nome : "pago") + '</div><h2 id="modal-titulo">' + esc(r && r.nome || "Recurso bloqueado") + "</h2>" +
    (ME && ME.origem === "teste" ? "" : '<p>Seu plano atual é o <b>' + esc(ME ? ME.planoNome : "Grátis") + "</b>." + (min ? " Com o " + esc(min.nome) + " você passa a ter:" : "") + "</p>") +
    (g.length ? "<ul>" + g.map(function (x) { return "<li>" + I("check") + "<span>" + esc(x.rotulo) + ": <b>" + esc(x.antes) + "</b></span></li>"; }).join("") + "</ul>" : "") +
    '<div class="linha-bts"><a class="bt primario" href="' + linkAssinar(min) + '">' + I("coroa") + "Assinar o " + esc(min ? min.nome : "Pro") + '</a><button class="bt" type="button" data-fechar>Agora não</button></div>');
}
function avisoLimite(e) {
  abrirModal('<div class="sobre">Limite diário</div><h2 id="modal-titulo">Você usou as execuções de hoje</h2><p>' + esc(e.message) + '</p><div class="linha-bts"><button class="bt primario" type="button" data-fechar>Entendi</button></div>');
}
/* contador do teste Elite e selo do plano no topo */
function barraPlano() {
  var box = $("#selo-plano"); if (!box || !ME) return;
  if (ME.teste) {
    var d = ME.teste.diasRestantes, urg = d <= 2;
    box.innerHTML = '<button class="bt selo-teste' + (urg ? " urgente" : "") + '" type="button" id="bt-teste">' + I("coroa") + '<span>Elite grátis · <b>' + (d <= 0 ? "último dia" : "faltam " + d + " dia" + (d > 1 ? "s" : "")) + "</b></span></button>";
    $("#bt-teste").onclick = modalTeste;
  } else {
    box.innerHTML = '<a class="bt selo-plano" href="conta.html">' + I("escudo") + "<span>Plano <b>" + esc(ME.planoNome) + "</b></span></a>";
  }
}
function modalTeste() {
  var t = ME.teste, d = t.diasRestantes;
  abrirModal('<div class="sobre">Teste grátis do Elite</div><h2 id="modal-titulo">' + (d <= 0 ? "Seu teste termina hoje" : "Faltam " + d + " dia" + (d > 1 ? "s" : "") + " de Elite") + "</h2>" +
    "<p>Quando o teste acabar, sua conta passa para o plano <b>Grátis</b>. Você deixa de ter:</p><ul>" +
    t.perdas.map(function (x) { return "<li>" + I("x") + "<span>" + esc(x.rotulo) + ": <b>" + esc(x.antes) + "</b> → " + esc(x.depois) + "</span></li>"; }).join("") +
    '</ul><div class="linha-bts"><a class="bt primario" href="planos.html?plano=elite">' + I("coroa") + 'Assinar o Elite</a><a class="bt" href="planos.html?plano=pro">Ver o Pro</a><button class="bt fantasma" type="button" data-fechar>Continuar testando</button></div>');
}

/* ======================= Plano / Beta ======================= */
var AU = window.MC_AUTH, CONTA = {usuario: null};
function planoCard() {
  var el = $("#plano-card"); if (!el) return;
  var ass = PL.assinante && PL.assinante(), u = CONTA.usuario, h;
  var aPl = PL.assinatura && PL.assinatura(), nomePl = aPl ? (aPl.plano === "cortesia" ? "Cortesia" : ((PL.plano(aPl.plano) || {}).nome || "Pro")) : "";
  if (ass) h = '<span class="tag"><i></i>Plano ' + esc(nomePl) + '</span><p>Recursos do seu plano liberados. Obrigado por apoiar o MegaCover.</p><a class="bt" href="conta.html" style="width:100%">Minha conta</a>';
  else if (PL.beta()) h = '<span class="tag"><i></i>Acesso Beta</span><p>Todos os recursos PRO liberados grátis durante o período de testes.</p><button class="bt" type="button" id="bt-plano" style="width:100%">' + I("coroa") + "Conhecer o PRO</button>";
  else h = '<span class="tag">Plano gratuito</span><p>Desbloqueie IA, fechamentos e simulações ilimitadas.</p><button class="bt primario" type="button" id="bt-plano" style="width:100%">' + I("coroa") + "Ver planos</button>";
  if (AU && AU.ativo()) {
    h += u ? '<div class="conta-card"><a href="conta.html" title="' + esc(u.email) + '">' + esc((u.user_metadata && (u.user_metadata.nome || u.user_metadata.full_name)) || u.email) + '</a><button class="bt peq" type="button" id="bt-sair">Sair</button></div>'
           : '<div class="conta-card"><a href="conta.html?volta=app.html">Entrar ou criar conta</a></div>';
  }
  el.innerHTML = h;
  var bp = $("#bt-plano"); if (bp) bp.onclick = function () { modalPlano(); };
  var bs = $("#bt-sair"); if (bs) bs.onclick = function () { AU.sair().then(function () { location.href = "index.html"; }); };
  var bc = $("#bt-conta"); if (bc) bc.hidden = !(AU && AU.ativo() && !u);
}
/* Login (Supabase): atualiza a assinatura ao abrir e redesenha o cartão do plano. */
function conta() {
  if (!AU || !AU.ativo()) return;
  AU.usuario().then(function (u) {
    CONTA.usuario = u;
    if (!u && PL.loginObrigatorio) { location.href = "conta.html?volta=app.html"; return; }
    planoCard();
    return AU.iniciar().then(function () { planoCard(); });
  }).catch(function () {});
  AU.aoMudar(function (ev, s) { CONTA.usuario = s ? s.user : null; if (ev === "SIGNED_OUT" && PL.loginObrigatorio) location.href = "conta.html"; else planoCard(); });
}
function abrirModal(html) {
  var m = $("#modal"); $("#modal-caixa").innerHTML = html; m.hidden = false;
  m.onclick = function (e) { if (e.target === m || e.target.closest("[data-fechar]")) fecharModal(); };
  var f = $("#modal-caixa button, #modal-caixa input"); if (f) f.focus();
}
function fecharModal() { $("#modal").hidden = true; }
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#modal").hidden && !$("#modal-caixa [data-obrigatorio]")) fecharModal(); });
function listaPro() { return Object.keys(PL.pro || {}).map(function (k) { return "<li>" + I("check") + "<span>" + esc(PL.pro[k]) + "</span></li>"; }).join(""); }
function modalPlano(recurso) {
  var min = recurso && PL.planoMinimo ? PL.planoMinimo(recurso) : null, nome = min ? min.nome : "Pro";
  var acao = PL.beta()
    ? '<a class="bt primario" href="planos.html">Ver os planos</a><button class="bt" type="button" data-fechar>Continuar no Beta</button>'
    : '<a class="bt primario" href="planos.html">Assinar o ' + esc(nome) + '</a><button class="bt" type="button" data-fechar>Agora não</button>';
  abrirModal('<div class="sobre">' + (PL.beta() ? "Período de testes" : "Recurso do plano " + esc(nome)) + '</div><h2 id="modal-titulo">' +
    (recurso && !PL.beta() ? esc(PL.pro[recurso]) + " faz parte do plano " + esc(nome) : PL.beta() ? "Você está no Beta: tudo liberado" : "Conheça os planos do MegaCover") + "</h2>" +
    "<p>" + (PL.beta() ? "Durante o período de testes você usa de graça todos os recursos dos planos pagos:" : "Os planos pagos incluem:") + "</p><ul>" + listaPro() + "</ul>" +
    (PL.beta() ? '<p style="font-size:13px">Quando as assinaturas abrirem, os participantes do Beta serão avisados com antecedência.</p>' : "") +
    '<div class="linha-bts">' + acao + "</div>");
}
function boasVindas() {
  if (ls("aceite")) return;
  abrirModal('<div class="sobre">Bem-vindo(a)</div><h2 id="modal-titulo">MegaCover Pro Elite <span class="pro">BETA</span></h2>' +
    "<p>Estatística, combinatória e simulação para as 9 loterias CAIXA — tudo processado no seu navegador.</p><ul>" +
    "<li>" + I("barras") + "<span>Histórico completo desde o 1º concurso de cada loteria</span></li>" +
    "<li>" + I("ia") + "<span>Gerador com MegaScore™ e MegaCover AI</span></li>" +
    "<li>" + I("coroa") + "<span>Recursos PRO liberados grátis durante o Beta</span></li></ul>" +
    '<label class="aceite"><input type="checkbox" id="aceite-ck" data-obrigatorio> <span>Tenho 18 anos ou mais e entendo que esta é uma ferramenta estatística: <b>não prevê resultados nem garante prêmios</b>.</span></label>' +
    '<div class="linha-bts"><button class="bt primario grande" type="button" id="aceite-ok" disabled>Começar a usar</button></div>');
  $("#modal").onclick = null;
  $("#aceite-ck").onchange = function () { $("#aceite-ok").disabled = !this.checked; };
  $("#aceite-ok").onclick = function () { ls("aceite", Date.now()); fecharModal(); };
}

function montarUltimos() {
  MC.ORDEM.forEach(function (l) {
    if (SRV && !podeSrv("loteria", l.chave).ok) { var el0 = $("#ult-" + l.chave); if (el0) el0.innerHTML = I("cadeado"); return; }
    carregar(l.chave).then(function (c) { var el = $("#ult-" + l.chave); if (el && c.length) el.textContent = "nº " + c[c.length - 1].concurso; });
  });
}
function iniciar() {
  if (SRV) return iniciarServidor();
  tema(); montarNav(); boasVindas(); conta();
  $("#bt-atualizar-todas").onclick = atualizarTodas;
  var h = location.hash.replace("#", "").split("/"), u = ls("ultima") || [];
  window.addEventListener("hashchange", function () { var p = location.hash.replace("#", "").split("/"); if (p[0] !== S.lot || p[1] !== S.aba) ir(p[0], p[1]); });
  ir(h[0] || u[0] || "megasena", h[1] || u[1] || "dashboard");
  setTimeout(montarUltimos, 600);
}
/* modo servidor: exige login, carrega as regras e o plano da pessoa e liga os avisos da API */
function iniciarServidor() {
  tema();
  var encerrada = false;   // depois do aviso de sessão derrubada, não redireciona por cima dele
  MC_API.quando("login", function () { if (!encerrada) location.href = "conta.html?volta=" + encodeURIComponent("app.html" + location.hash); });
  MC_API.quando("sessao_encerrada", function (e) {
    if (encerrada) return; encerrada = true;
    abrirModal('<div class="sobre">Sessão encerrada</div><h2 id="modal-titulo">Sua conta foi aberta em outro aparelho</h2><p>' + esc(e.message) +
      '</p><div class="linha-bts"><a class="bt primario" href="conta.html?motivo=sessao&volta=app.html" data-obrigatorio>Entrar novamente</a></div>');
    window.MC_AUTH.sair();
  });
  MC_API.quando("plano", function (e) { upsell({nome: e.dados.nome, planoMinimo: e.dados.planoMinimo}); });
  MC_API.quando("limite", avisoLimite);
  var bt = $("#bt-atualizar-todas"); if (bt) bt.hidden = true;
  Promise.all([fetch("assets/regras.json", {cache: "no-cache"}).then(function (r) { return r.json(); }), window.MC_AUTH.sessao()]).then(function (x) {
    REGRAS = x[0];
    if (!x[1]) { location.href = "conta.html?volta=" + encodeURIComponent("app.html" + location.hash); return null; }
    return MC_API.post("sessao", {}).then(function () { return MC_API.get("me"); });
  }).then(function (me) {
    if (!me) return;
    ME = me;
    montarNav(); conta(); barraPlano();
    $("#bt-atualizar-todas").onclick = null;
    var h = location.hash.replace("#", "").split("/"), u = ls("ultima") || [];
    window.addEventListener("hashchange", function () { var p = location.hash.replace("#", "").split("/"); if (p[0] !== S.lot || p[1] !== S.aba) ir(p[0], p[1]); });
    ir(h[0] || u[0] || "megasena", h[1] || u[1] || "dashboard");
    setTimeout(montarUltimos, 600);
  }).catch(function (e) {
    if (e && (e.status === 401)) return;
    $("#conteudo").innerHTML = '<div class="card">' + vazio("info", "Não foi possível conectar ao servidor do MegaCover. Verifique a internet e recarregue a página.") + "</div>";
  });
}
iniciar();
})();
