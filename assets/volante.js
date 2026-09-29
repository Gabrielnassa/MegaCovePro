/* MegaCover Pro Elite — impressão no volante oficial.
   Tudo é desenhado em milímetros reais. Cada loteria tem um "molde" (posição
   da grade de números no volante) que o usuário calibra uma vez com o volante
   de verdade; a calibração fica salva no navegador e pode ser exportada. */
(function () {
"use strict";

var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* Moldes iniciais (aproximados). Medidas em mm a partir do canto superior
   esquerdo do volante. Calibre com o volante real antes de usar. */
function base(o) {
  var d = {largura: 82, altura: 190, jogos: 1, dirJogos: "vertical", distJogos: 60,
    x: 12, y: 42, passoX: 6.4, passoY: 5.2, ordem: "linha", zeroNoFim: false,
    marcaL: 4, marcaA: 2.4, formato: "retangulo",
    extra: null, papel: "volante", papelX: 10, papelY: 10, ajusteX: 0, ajusteY: 0,
    rotacao: 0, escalaX: 100, escalaY: 100, virar: "nao",
    /* volante virtual em A4 (sulfite): até 4 jogos por folha, com cabeçalho e marcas de relógio */
    v: {jogos: 3, porFolha: 3, orientacao: "paisagem", gapV: 8, largura: 82, altura: 205, recorteX: 8, recorteY: 2.5, x: 14, y: 32, gapY: 8,
        relogioX: 5, relogioL: 3.4, relogioA: 1.8, topoN: 2, topoX: 5, topoPasso: 5, topoY: 0, relogioFim: "",
        qtdMin: 0, qtdY: 0, qtdX: 0, qtdPasso: 5.5, arquivo: "MegaCover", recorte: "sim", lista: "sim"}};
  for (var k in o) d[k] = o[k];
  return d;
}
var MOLDES = {
  megasena: base({linhas: 6, colunas: 10}),
  /* Lotofácil (medido na foto do volante): colunas de 5 números correndo de cima para baixo,
     da direita para a esquerda; fileira de 6 marcas no topo; campo "quantos números" abaixo dos blocos */
  lotofacil: base({linhas: 5, colunas: 5, passoX: 13.2, passoY: 5.25, ordem: "colunaDir", marcaL: 3.6, marcaA: 2.4,
    v: {jogos: 3, porFolha: 3, orientacao: "paisagem", gapV: 8, largura: 82, altura: 205, recorteX: 8, recorteY: 2.5, x: 25, y: 52, gapY: 3.8,
        relogioX: 9.5, relogioL: 2.6, relogioA: 2.2, topoN: 6, topoX: 25, topoPasso: 5.3, topoY: 45, relogioFim: "135.5,145,154.5,161,166.3,169.5,172.7",
        qtdMin: 15, qtdY: 135.5, qtdX: 15, qtdPasso: 5.5, arquivo: "MegaCover", recorte: "sim", lista: "sim"}}),
  quina: base({linhas: 8, colunas: 10, passoY: 4.6}),
  lotomania: base({linhas: 10, colunas: 10, passoY: 4.4, zeroNoFim: true}),
  duplasena: base({linhas: 5, colunas: 10}),
  timemania: base({linhas: 8, colunas: 10, passoY: 4.6}),
  diadesorte: base({linhas: 4, colunas: 8, passoX: 7.2, extra: {nome: "Mês da Sorte", linhas: 3, colunas: 4, x: 14, y: 72, passoX: 14, passoY: 5.2}}),
  supersete: base({linhas: 10, colunas: 7, passoX: 8.5, passoY: 4.8, x: 14, ordem: "coluna"}),
  maismilionaria: base({linhas: 5, colunas: 10, extra: {nome: "Trevos", linhas: 1, colunas: 6, x: 20, y: 74, passoX: 7, passoY: 5.2}})
};
var CAMPOS_V = [["orientacao", "Folha A4", 0, "orientacao"], ["porFolha", "Volantes por folha", 0, "porFolha"], ["gapV", "Espaço entre os volantes", 0.5], ["jogos", "Jogos por volante (1 a 4)", 1, "int"], ["arquivo", "Nome no cabeçalho", 0, "texto"],
  ["largura", "Largura do volante (recorte)", 0.5], ["altura", "Altura do volante (recorte)", 0.5],
  ["recorteX", "Recorte · da borda esquerda da folha", 0.5], ["recorteY", "Recorte · da borda de cima da folha", 0.5],
  ["x", "1º número · da esquerda do recorte", 0.1], ["y", "1º número · do topo do recorte", 0.1], ["gapY", "Espaço entre jogos", 0.5],
  ["relogioX", "Coluna de relógio · da esquerda do recorte", 0.1], ["relogioL", "Largura da marca de relógio", 0.1], ["relogioA", "Altura da marca de relógio", 0.1],
  ["topoN", "Marcas de relógio no topo (quantas)", 1, "int"], ["topoX", "1ª marca do topo · da esquerda", 0.1], ["topoPasso", "Distância entre marcas do topo", 0.1], ["topoY", "Fileira do topo · do topo (0 = automático)", 0.1],
  ["relogioFim", "Marcas de relógio abaixo dos jogos (mm, separadas por vírgula)", 0, "texto"],
  ["qtdMin", "Campo \"quantos números\": menor valor (0 = não tem)", 1, "int"], ["qtdY", "Campo quantos números · do topo", 0.1], ["qtdX", "Campo quantos números · da esquerda", 0.1], ["qtdPasso", "Distância entre as casas do campo", 0.1],
  ["recorte", "Traço vermelho de recorte", 0, "simnao"], ["lista", "Lista dos jogos e MegaCover no rodapé", 0, "simnao"]];
var CAMPOS = [
  ["Volante", [["largura", "Largura do volante", 0.5], ["altura", "Altura do volante", 0.5]]],
  ["Jogos por volante", [["jogos", "Quantos jogos cabem", 1, "int"], ["dirJogos", "Os jogos ficam", 0, "dir"], ["distJogos", "Distância entre jogos", 0.1]]],
  ["Grade de números", [["x", "Centro do 1º número · da esquerda", 0.1], ["y", "Centro do 1º número · do topo", 0.1],
    ["passoX", "Distância entre colunas", 0.05], ["passoY", "Distância entre linhas", 0.05],
    ["linhas", "Linhas", 1, "int"], ["colunas", "Colunas", 1, "int"], ["ordem", "Numeração corre", 0, "ordem"]]],
  ["Marca", [["marcaL", "Largura da marca", 0.1], ["marcaA", "Altura da marca", 0.1], ["formato", "Formato", 0, "formato"]]],
  ["Impressora", [["papel", "Papel", 0, "papel"], ["papelX", "Volante colado a (esq.)", 0.5], ["papelY", "Volante colado a (topo)", 0.5],
    ["ajusteX", "Ajuste fino horizontal", 0.1], ["ajusteY", "Ajuste fino vertical", 0.1]]],
  ["Correção de inclinação e escala", [["rotacao", "Inclinação (graus, + gira no sentido horário)", 0.1, "num"],
    ["escalaX", "Escala horizontal (%)", 0.5, "num"], ["escalaY", "Escala vertical (%)", 0.5, "num"], ["virar", "Volante entra na impressora", 0, "virar"]]]
];
var EXTRA = [["x", "Centro do 1º item · da esquerda", 0.1], ["y", "Centro do 1º item · do topo", 0.1], ["passoX", "Distância entre colunas", 0.05],
  ["passoY", "Distância entre linhas", 0.05], ["linhas", "Linhas", 1, "int"], ["colunas", "Colunas", 1, "int"]];
var OPC = {dir: [["vertical", "um abaixo do outro"], ["horizontal", "lado a lado"]],
  ordem: [["linha", "por linha (01, 02, 03… →)"], ["coluna", "por coluna (01, 02, 03… ↓)"], ["colunaDir", "por coluna, da direita para a esquerda (Lotofácil)"]],
  formato: [["retangulo", "retângulo cheio"], ["elipse", "oval cheio"], ["x", "traço (X)"]],
  papel: [["volante", "o próprio volante (alimentação manual)"], ["a4", "folha A4 com o volante colado"]],
  virar: [["nao", "com o topo para dentro (normal)"], ["sim", "de cabeça para baixo (girar 180°)"]],
  simnao: [["sim", "sim"], ["nao", "não"]],
  porFolha: [[1, "1 volante"], [2, "2 volantes lado a lado"], [3, "3 volantes lado a lado (A4 deitada)"]],
  orientacao: [["paisagem", "deitada (paisagem) — cabem 3 volantes"], ["retrato", "em pé (retrato) — cabem 2 volantes"]]};

var $ = function (s) { return document.querySelector(s); };
function ls(k, v) {
  try {
    if (v === undefined) { var x = localStorage.getItem("mc:" + k); return x ? JSON.parse(x) : null; }
    if (v === null) localStorage.removeItem("mc:" + k); else localStorage.setItem("mc:" + k, JSON.stringify(v));
  } catch (e) { return null; }
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

var S = {lot: "megasena", jogos: [], extras: null, modo: "marcas", m: null};
function cfg() { return MC.TODAS[S.lot]; }
function molde(lot) {
  var m = clone(MOLDES[lot]), salvo = ls("vol:" + lot);
  if (salvo) {
    for (var k in salvo) if (k !== "extra" && k !== "v") m[k] = salvo[k];
    if (salvo.extra && m.extra) for (k in salvo.extra) m.extra[k] = salvo.extra[k];
    if (salvo.v) for (k in salvo.v) m.v[k] = salvo.v[k];
  }
  return m;
}
function salvar() { ls("vol:" + S.lot, S.m); }

/* linha e coluna da casa nº idx conforme a ordem de numeração do volante */
function linCol(m, idx) {
  if (m.ordem === "coluna") return [idx % m.linhas, Math.floor(idx / m.linhas)];
  if (m.ordem === "colunaDir") return [idx % m.linhas, m.colunas - 1 - Math.floor(idx / m.linhas)];
  return [Math.floor(idx / m.colunas), idx % m.colunas];
}
/* posição (mm) do centro de um número dentro do jogo nº j (0…) */
function ordemNumeros(c, m) {
  var l = c.dezenas.slice();
  if (m.zeroNoFim && l[0] === 0) { l.shift(); l.push(0); }
  return l;
}
function celula(m, idx, j) {
  var lc = linCol(m, idx), lin = lc[0], col = lc[1];
  var dx = m.dirJogos === "horizontal" ? j * m.distJogos : 0, dy = m.dirJogos === "vertical" ? j * m.distJogos : 0;
  return {x: m.x + col * m.passoX + dx, y: m.y + lin * m.passoY + dy};
}
function celulaExtra(m, idx, j) {
  var e = m.extra, lin = Math.floor(idx / e.colunas), col = idx % e.colunas;
  var dx = m.dirJogos === "horizontal" ? j * m.distJogos : 0, dy = m.dirJogos === "vertical" ? j * m.distJogos : 0;
  return {x: e.x + col * e.passoX + dx, y: e.y + lin * e.passoY + dy};
}
/* lista de marcas {x,y} de um jogo */
function marcasDoJogo(c, m, jogo, extra, j) {
  var out = [], ordem = ordemNumeros(c, m);
  if (c.colunar) {
    jogo.forEach(function (col, ci) {
      col.forEach(function (d) {
          out.push(celula(m, m.ordem === "linha" ? d * m.colunas + ci : ci * m.linhas + d, j));
      });
    });
  } else {
    jogo.forEach(function (d) { var i = ordem.indexOf(d); if (i >= 0) out.push(celula(m, i, j)); });
  }
  if (extra && m.extra) {
    if (c.extra_qtd > 1) String(extra).split(/[^0-9]+/).filter(Boolean).forEach(function (t) { var n = +t; if (n >= 1 && n <= 6) out.push(celulaExtra(m, n - 1, j)); });
    else if (c.chave === "diadesorte") { var mi = MESES.map(function (x) { return x.toLowerCase(); }).indexOf(String(extra).toLowerCase()); if (mi >= 0) out.push(celulaExtra(m, mi, j)); }
  }
  return out;
}
function marcaHTML(m, p) {
  var st = "left:" + (p.x - m.marcaL / 2) + "mm;top:" + (p.y - m.marcaA / 2) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + "mm";
  return '<i class="mk ' + m.formato + '" style="' + st + '"></i>';
}
/* folha de calibração: contorno do volante + todas as casas numeradas */
function reguaHTML(m) {
  var h = '<div class="regua h" style="left:6mm;top:' + (m.altura - 14) + 'mm;width:60mm"><span>0</span><span style="left:30mm">30</span><span style="left:60mm">60 mm</span></div>' +
    '<div class="regua v" style="left:6mm;top:' + (m.altura - 74) + 'mm;height:60mm"><span>60 mm</span></div>';
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (q) {
    h += '<div class="mira" style="left:' + (q[0] ? m.largura - 8 : 4) + "mm;top:" + (q[1] ? m.altura - 8 : 4) + 'mm"></div>';
  });
  return h;
}
function guiaHTML(c, m) {
  var h = reguaHTML(m), ordem = ordemNumeros(c, m), total = c.colunar ? m.linhas * m.colunas : ordem.length;
  for (var j = 0; j < m.jogos; j++) {
    for (var i = 0; i < total; i++) {
      var p = celula(m, i, j), rot = c.colunar ? linCol(m, i)[0] : c.fmt(ordem[i]);
      h += '<b class="casa" style="left:' + (p.x - m.marcaL / 2) + "mm;top:" + (p.y - m.marcaA / 2) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + rot + "</b>";
    }
    if (m.extra) {
      var n = m.extra.linhas * m.extra.colunas;
      for (i = 0; i < n; i++) {
        p = celulaExtra(m, i, j);
        var r = c.chave === "diadesorte" ? MESES[i] ? MESES[i].slice(0, 3) : "" : String(i + 1);
        h += '<b class="casa ex" style="left:' + (p.x - m.marcaL / 2) + "mm;top:" + (p.y - m.marcaA / 2) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + r + "</b>";
      }
    }
  }
  return h;
}

/* ======================= Volante virtual (A4) ======================= */
/* Reproduz o volante oficial em folha sulfite, no formato dos programas de impressão:
   recorte vermelho do tamanho do volante, cabeçalho, coluna de relógio, jogos empilhados,
   lista dos jogos e assinatura MegaCover no rodapé. Coordenadas relativas ao recorte. */
var A4 = {w: 210, h: 297};
function alturaJogo(m) {
  var h = (m.linhas - 1) * m.passoY + m.marcaA;
  if (m.extra) h += 4 + (m.extra.linhas - 1) * m.extra.passoY + m.marcaA;
  return h;
}
function arranjoVirtual(c, m) {
  var n = Math.max(1, Math.min(4, m.v.jogos | 0));
  return {n: n, cols: 1, linhas: n, th: alturaJogo(m)};
}
function origemJogo(m, ar, j) { return {x: m.v.x, y: m.v.y + j * (ar.th + m.v.gapY)}; }
function marcasVirtual(c, m, jogo, extra, o) {
  var out = [], ordem = ordemNumeros(c, m);
  function cel(idx) { var lc = linCol(m, idx); return {x: o.x + lc[1] * m.passoX, y: o.y + lc[0] * m.passoY}; }
  if (c.colunar) jogo.forEach(function (col, ci) { col.forEach(function (d) { out.push(cel(m.ordem === "linha" ? d * m.colunas + ci : ci * m.linhas + d)); }); });
  else jogo.forEach(function (d) { var i = ordem.indexOf(d); if (i >= 0) out.push(cel(i)); });
  if (extra && m.extra) {
    var e = m.extra, ey = o.y + (m.linhas - 1) * m.passoY + m.marcaA + 4;
    function cex(idx) { return {x: o.x + (idx % e.colunas) * e.passoX, y: ey + Math.floor(idx / e.colunas) * e.passoY}; }
    if (c.extra_qtd > 1) String(extra).split(/[^0-9]+/).filter(Boolean).forEach(function (t) { var n = +t; if (n >= 1 && n <= 6) out.push(cex(n - 1)); });
    else if (c.chave === "diadesorte") { var mi = MESES.map(function (x) { return x.toLowerCase(); }).indexOf(String(extra).toLowerCase()); if (mi >= 0) out.push(cex(mi)); }
  }
  return out;
}
/* coluna de relógio: 2 marcas na linha do cabeçalho, uma por linha de cada jogo, 3 no rodapé */
function relogioHTML(c, m, ar) {
  var v = m.v, rl = {marcaL: v.relogioL, marcaA: v.relogioA, formato: "retangulo"}, h = "", j, r;
  var yCab = +v.topoY || (v.y - m.passoY * 1.6), nT = Math.max(0, v.topoN | 0);
  for (r = 0; r < nT; r++) h += marcaHTML(rl, {x: (+v.topoX || v.relogioX) + r * (+v.topoPasso || 5), y: yCab});
  for (j = 0; j < ar.n; j++) {
    var o = origemJogo(m, ar, j);
    for (r = 0; r < m.linhas; r++) h += marcaHTML(rl, {x: v.relogioX, y: o.y + r * m.passoY});
    if (m.extra) for (r = 0; r < m.extra.linhas; r++) h += marcaHTML(rl, {x: v.relogioX, y: o.y + (m.linhas - 1) * m.passoY + m.marcaA + 4 + r * m.extra.passoY});
  }
  var yFim = origemJogo(m, ar, ar.n - 1).y + ar.th;
  var extras = String(v.relogioFim || "").split(/[^0-9.]+/).filter(Boolean).map(Number);
  if (!extras.length) for (r = 0; r < 3; r++) extras.push(yFim + 6 + r * 3.2);
  extras.forEach(function (y) { h += marcaHTML(rl, {x: v.relogioX, y: y}); });
  return {html: h, yFim: Math.max.apply(null, extras.concat([yFim]))};
}
function cabecalhoHTML(c, m, ar, ini) {
  var nums = []; for (var i = 0; i < ar.n; i++) nums.push(ini + i + 1);
  return '<div class="cab-v" style="left:0;top:' + (m.v.y - m.passoY * 3.6) + "mm;width:" + m.v.largura + 'mm"><span>' + esc(m.v.arquivo || "MegaCover") + "</span><b>" + nums.join("-") + "</b></div>";
}
function rodapeHTML(c, m, pg, yIni) {
  if (m.v.lista === "nao") return "";
  var linhas = [];
  for (var i = 0; i < m.v.jogos; i++) {
    var j = pg.jogos[i];
    linhas.push("Jogo " + (pg.ini + i + 1) + ": " + (j ? (c.colunar ? j.map(function (x) { return x.join(""); }).join(" | ") : j.map(c.fmt.bind(c)).join(",")) + (S.extras && S.extras[pg.ini + i] ? " [" + esc(S.extras[pg.ini + i]) + "]" : "") : ""));
  }
  var x0 = m.v.relogioX + m.v.relogioL + 3, largo = m.v.largura - x0 - 3, longo = linhas.some(function (l) { return l.length > 34; });
  var altura = linhas.length * (longo ? 3.2 : 4.3) + 7, top = Math.min(yIni + 3, m.v.altura - altura - 2);
  return '<div class="rod-v' + (longo ? " peq" : "") + '" style="left:' + x0 + "mm;top:" + top + "mm;width:" + largo + 'mm">' + linhas.map(function (l) { return "<div>" + esc(l) + "</div>"; }).join("") + '<div class="marca-v">MegaCover Pro Elite</div></div>';
}
function guiaVirtualHTML(c, m, ar) {
  var h = "", ordem = ordemNumeros(c, m), total = c.colunar ? m.linhas * m.colunas : ordem.length;
  for (var j = 0; j < ar.n; j++) {
    var o = origemJogo(m, ar, j);
    for (var i = 0; i < total; i++) {
      var lc = linCol(m, i), lin = lc[0], col = lc[1];
      h += '<b class="casa" style="left:' + (o.x + col * m.passoX) + "mm;top:" + (o.y + lin * m.passoY) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + (c.colunar ? lin : c.fmt(ordem[i])) + "</b>";
    }
    if (j === 0 && m.v.qtdMin > 0) for (var q = 0; q < 6; q++) h += '<b class="casa ex" style="left:' + (m.v.qtdX + q * m.v.qtdPasso) + "mm;top:" + m.v.qtdY + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + (m.v.qtdMin + q) + "</b>";
    if (m.extra) {
      var e = m.extra, ey = o.y + (m.linhas - 1) * m.passoY + m.marcaA + 4;
      for (i = 0; i < e.linhas * e.colunas; i++) h += '<b class="casa ex" style="left:' + (o.x + (i % e.colunas) * e.passoX) + "mm;top:" + (ey + Math.floor(i / e.colunas) * e.passoY) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + (c.chave === "diadesorte" ? (MESES[i] || "").slice(0, 3) : i + 1) + "</b>";
    }
  }
  return h;
}
function folhasVirtual() {
  var c = cfg(), m = S.m, v = m.v, ar = arranjoVirtual(c, m), paginas = [];
  var guia = S.modo === "guiav" || !S.jogos.length, volantes = [];
  if (guia) volantes.push({guia: true, ini: 0, jogos: []});
  else for (var i = 0; i < S.jogos.length; i += ar.n) volantes.push({guia: false, ini: i, jogos: S.jogos.slice(i, i + ar.n)});
  /* quantos volantes de tamanho real cabem lado a lado na folha (nunca encolhe) */
  var pais = v.orientacao !== "retrato", W = pais ? A4.h : A4.w, H = pais ? A4.w : A4.h;
  var pf = Math.max(1, Math.min(+v.porFolha || 1, Math.floor((W - v.recorteX + v.gapV) / (v.largura + v.gapV))));
  var paginas = []; for (i = 0; i < volantes.length; i += pf) paginas.push(volantes.slice(i, i + pf));
  $("#estilo-pagina").textContent = "@page{size:" + W + "mm " + H + "mm;margin:0}";
  var tr = "rotate(" + (+m.rotacao || 0) + "deg) scale(" + ((+m.escalaX || 100) / 100) + "," + ((+m.escalaY || 100) / 100) + ")";
  /* o recorte nunca sai da folha: se o volante for alto demais para a orientação, encosta na borda de cima */
  var offX = (+v.recorteX || 0) + (+m.ajusteX || 0), offY = Math.max(0, Math.min(+v.recorteY || 0, H - v.altura - 1)) + (+m.ajusteY || 0);
  function volanteHTML(pg, k) {
    var rel = relogioHTML(c, m, ar), dentro = rel.html + cabecalhoHTML(c, m, ar, pg.ini);
    if (pg.guia) dentro += guiaVirtualHTML(c, m, ar);
    else pg.jogos.forEach(function (jogo, j) {
      dentro += marcasVirtual(c, m, jogo, S.extras ? S.extras[pg.ini + j] : null, origemJogo(m, ar, j)).map(function (p) { return marcaHTML(m, {x: p.x + m.marcaL / 2, y: p.y + m.marcaA / 2}); }).join("");
    });
    if (!pg.guia && v.qtdMin > 0 && pg.jogos.length) {
      var q = pg.jogos[0].length;      /* o campo é um por volante: usa a quantidade do 1º jogo */
      dentro += marcaHTML(m, {x: v.qtdX + (q - v.qtdMin) * v.qtdPasso + m.marcaL / 2, y: v.qtdY + m.marcaA / 2});
    }
    dentro += rodapeHTML(c, m, pg, rel.yFim);
    return '<div class="area' + (v.recorte === "nao" ? "" : " recorte") + '" style="left:' + (offX + k * (v.largura + v.gapV)) + "mm;top:" + offY + "mm;width:" + v.largura + "mm;height:" + v.altura + "mm;transform:" + tr + '">' + dentro + "</div>";
  }
  return paginas.map(function (vs, k) {
    var ini = vs[0].ini + 1, fim = vs[vs.length - 1].ini + vs[vs.length - 1].jogos.length;
    return '<div class="folha' + (m.virar === "sim" ? " virada" : "") + '" style="width:' + W + "mm;height:" + H + 'mm">' + vs.map(volanteHTML).join("") +
      '<div class="rot-folha no-print">' + (vs[0].guia ? "Guia do volante virtual" : "Folha " + (k + 1) + " de " + paginas.length + " · " + vs.length + " volante(s) · jogos " + ini + "–" + fim) + "</div></div>";
  }).join("");
}

/* ======================= Desenho ======================= */
function folhas() {
  if (S.modo === "virtual" || S.modo === "guiav") return folhasVirtual();
  var c = cfg(), m = S.m, porFolha = Math.max(1, m.jogos | 0), paginas = [];
  if (S.modo === "guia" || !S.jogos.length) paginas.push({guia: true, jogos: []});
  else for (var i = 0; i < S.jogos.length; i += porFolha) paginas.push({guia: false, ini: i, jogos: S.jogos.slice(i, i + porFolha)});
  var a4 = m.papel === "a4", W = a4 ? 210 : m.largura, H = a4 ? 297 : m.altura;
  var offX = (a4 ? m.papelX : 0) + (+m.ajusteX || 0), offY = (a4 ? m.papelY : 0) + (+m.ajusteY || 0);
  $("#estilo-pagina").textContent = "@page{size:" + W + "mm " + H + "mm;margin:0}";
  return paginas.map(function (pg, k) {
    var dentro = pg.guia ? guiaHTML(c, m) : pg.jogos.map(function (jogo, j) {
      return marcasDoJogo(c, m, jogo, S.extras ? S.extras[pg.ini + j] : null, j).map(function (p) { return marcaHTML(m, p); }).join("");
    }).join("");
    var contorno = pg.guia ? '<div class="contorno" style="width:' + m.largura + "mm;height:" + m.altura + 'mm"><span>' + esc(c.nome) + " · " + m.largura + " × " + m.altura + " mm · calibração</span></div>" : "";
    var tr = "rotate(" + (+m.rotacao || 0) + "deg) scale(" + ((+m.escalaX || 100) / 100) + "," + ((+m.escalaY || 100) / 100) + ")";
    return '<div class="folha' + (m.virar === "sim" ? " virada" : "") + '" style="width:' + W + "mm;height:" + H + 'mm"><div class="area" style="left:' + offX + "mm;top:" + offY + "mm;width:" + m.largura + "mm;height:" + m.altura + "mm;transform:" + tr + '">' + contorno + dentro + "</div>" +
      '<div class="rot-folha no-print">' + (pg.guia ? "Folha de calibração" : "Volante " + (k + 1) + " de " + paginas.length + " · jogos " + (pg.ini + 1) + "–" + (pg.ini + pg.jogos.length)) + "</div></div>";
  }).join("");
}
function desenhar() {
  $("#folhas").innerHTML = folhas();
  var n = $("#folhas").children.length;
  var virt = S.modo === "virtual" || S.modo === "guiav", ar = virt ? arranjoVirtual(cfg(), S.m) : null;
  $("#resumo").innerHTML = S.modo === "guia" ? "Folha de calibração: imprima em papel comum e compare com o volante contra a luz."
    : S.modo === "guiav" ? "Guia do volante virtual: mostra onde cada número cai no recorte (" + ar.n + " jogos por volante)."
    : virt ? (S.jogos.length ? "<b>" + S.jogos.length + "</b> jogo(s) · <b>" + Math.ceil(S.jogos.length / ar.n) + "</b> volante(s) em <b>" + n + "</b> folha(s) A4 · " + ar.n + " jogos por volante." : "Nenhum jogo carregado — gere jogos no painel ou cole abaixo.")
    : S.jogos.length ? "<b>" + S.jogos.length + "</b> jogo(s) em <b>" + n + "</b> volante(s) · " + S.m.jogos + " por volante." : "Nenhum jogo carregado — gere jogos no painel ou cole abaixo.";
  escala();
}
function escala() {
  var box = $("#previa"), f = $("#folhas"); if (!box || !f.firstElementChild) return;
  var w = f.firstElementChild.getBoundingClientRect().width / (parseFloat(f.style.getPropertyValue("--z")) || 1);
  var z = Math.min(1.6, (box.clientWidth - 24) / w);
  f.style.setProperty("--z", z);
}

/* ======================= Controles ======================= */
function campo(chave, rot, passo, tipo, alvo) {
  var obj = alvo === "extra" ? S.m.extra : alvo === "v" ? S.m.v : S.m, v = obj[chave], id = "c-" + (alvo || "m") + "-" + chave;
  if (tipo === "texto") return '<label class="campo"><span class="rot">' + rot + '</span><input type="text" id="' + id + '" data-k="' + chave + '" data-a="' + (alvo || "") + '" value="' + esc(v) + '" maxlength="40"></label>';
  if (tipo && OPC[tipo]) return '<label class="campo"><span class="rot">' + rot + '</span><select id="' + id + '" data-k="' + chave + '" data-a="' + (alvo || "") + '">' +
    OPC[tipo].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>";
  return '<label class="campo"><span class="rot">' + rot + (tipo === "int" || tipo === "num" ? "" : " <small>mm</small>") + '</span><input type="number" id="' + id + '" data-k="' + chave + '" data-a="' + (alvo || "") + '" step="' + passo + '" value="' + v + '"' + (tipo === "int" ? ' min="1"' : "") + "></label>";
}
function montarControles() {
  var c = cfg(), h = "";
  CAMPOS.forEach(function (g) {
    h += "<fieldset><legend>" + g[0] + '</legend><div class="form">' + g[1].map(function (f) {
      if ((f[0] === "papelX" || f[0] === "papelY") && S.m.papel !== "a4") return "";
      if (c.colunar && (f[0] === "linhas" || f[0] === "colunas")) return "";
      return campo(f[0], f[1], f[2], f[3]);
    }).join("") + "</div></fieldset>";
  });
  h += '<fieldset><legend>Volante virtual (folha A4)</legend><div class="form">' + CAMPOS_V.map(function (f) { return campo(f[0], f[1], f[2], f[3], "v"); }).join("") + "</div></fieldset>";
  if (S.m.extra) h += "<fieldset><legend>" + esc(S.m.extra.nome) + '</legend><div class="form">' + EXTRA.map(function (f) { return campo(f[0], f[1], f[2], f[3], "extra"); }).join("") + "</div></fieldset>";
  if (c.chave === "lotomania") h += '<label class="chk"><input type="checkbox" id="c-zero"' + (S.m.zeroNoFim ? " checked" : "") + "> O 00 fica no fim do volante (depois do 99)</label>";
  if (c.chave === "timemania") h += '<p class="dica">O Time do Coração tem 80 opções no verso/lateral do volante: marque-o à caneta.</p>';
  $("#controles").innerHTML = h;
  $("#controles").oninput = function (e) {
    var t = e.target; if (!t.dataset.k && t.id !== "c-zero") return;
    if (t.id === "c-zero") S.m.zeroNoFim = t.checked;
    else {
      var obj = t.dataset.a === "extra" ? S.m.extra : t.dataset.a === "v" ? S.m.v : S.m, txt = t.tagName === "SELECT" || t.type === "text";
      var v = txt ? t.value : parseFloat(String(t.value).replace(",", "."));
      if (!txt && isNaN(v)) return;
      obj[t.dataset.k] = v;
      if (t.dataset.k === "papel") { salvar(); montarControles(); desenhar(); return; }
    }
    salvar(); desenhar();
  };
}
function lerTexto(txt) {
  var c = cfg();
  return txt.split(/\n+/).map(function (l) { return l.replace(/\[.*?\]/g, "").trim(); }).filter(Boolean).map(function (l) {
    if (c.colunar) {
      var cols = l.indexOf("|") >= 0 ? l.split("|") : l.replace(/[^0-9]/g, "").split("");
      cols = cols.map(function (x) { return x.replace(/[^0-9]/g, "").split("").map(Number); });
      return cols.length === 7 && cols.every(function (x) { return x.length; }) ? cols : null;
    }
    var ns = l.split(/[^0-9]+/).filter(Boolean).map(Number).filter(function (d) { return d >= c.inicio && d <= c.universo; });
    ns = Array.from(new Set(ns)).sort(function (a, b) { return a - b; });
    return ns.length ? ns : null;
  }).filter(Boolean);
}
function textoJogos() {
  var c = cfg();
  return S.jogos.map(function (j) { return c.colunar ? j.map(function (x) { return x.join(""); }).join(" | ") : j.map(c.fmt.bind(c)).join(" "); }).join("\n");
}
function trocarLoteria(lot, manterJogos) {
  S.lot = lot; S.m = molde(lot);
  if (!manterJogos) { S.jogos = []; S.extras = null; }
  document.documentElement.style.setProperty("--cor-lot", cfg().cor);
  $("#txt").value = textoJogos();
  montarControles(); desenhar();
}

function iniciar() {
  try { var t = ls("tema"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
  $("#lot").innerHTML = MC.ORDEM.map(function (l) { return '<option value="' + l.chave + '">' + l.nome + "</option>"; }).join("");
  var p = ls("imprimir");
  if (p && MC.TODAS[p.lot]) { S.jogos = p.jogos || []; S.extras = p.extras || null; S.lot = p.lot; }
  $("#lot").value = S.lot;
  var q = new URLSearchParams(location.search);
  S.modo = q.get("modo") || ls("vol-modo") || "virtual"; $("#modo").value = S.modo;
  trocarLoteria(S.lot, true);
  $("#lot").onchange = function () { trocarLoteria(this.value, false); };
  $("#modo").onchange = function () { S.modo = this.value; ls("vol-modo", S.modo); desenhar(); };
  $("#txt").oninput = function () { S.jogos = lerTexto(this.value); S.extras = null; desenhar(); };
  $("#bt-imprimir").onclick = function () {
    if (S.modo !== "guia" && S.modo !== "guiav" && !S.jogos.length) { alert("Nenhum jogo para imprimir."); return; }
    window.print();
  };
  $("#bt-padrao").onclick = function () {
    if (!confirm("Voltar a calibração da " + cfg().nome + " para os valores iniciais?")) return;
    ls("vol:" + S.lot, null); S.m = molde(S.lot); montarControles(); desenhar();
  };
  $("#bt-exportar").onclick = function () {
    var todos = {}; MC.ORDEM.forEach(function (l) { todos[l.chave] = molde(l.chave); });
    var b = new Blob([JSON.stringify({app: "MegaCover", tipo: "calibracao-volante", moldes: todos}, null, 1)], {type: "application/json"}), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "megacover-calibracao-volantes.json"; document.body.appendChild(a); a.click(); a.remove();
  };
  $("#arq-cal").onchange = function () {
    var f = this.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result); if (!d.moldes) throw 0;
        Object.keys(d.moldes).forEach(function (k) { if (MOLDES[k]) ls("vol:" + k, d.moldes[k]); });
        S.m = molde(S.lot); montarControles(); desenhar(); alert("Calibração importada.");
      } catch (e) { alert("Arquivo de calibração inválido."); }
    };
    rd.readAsText(f);
  };
  window.addEventListener("resize", escala);
  /* veio do Gerador: já abre a janela de impressão com o molde pronto */
  if (q.get("imprimir") === "1" && S.jogos.length) {
    history.replaceState(null, "", "volante.html");
    setTimeout(function () { window.print(); }, 600);
  }
}
iniciar();
})();
