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
    rotacao: 0, escalaX: 100, escalaY: 100, virar: "nao"};
  for (var k in o) d[k] = o[k];
  return d;
}
var MOLDES = {
  megasena: base({linhas: 6, colunas: 10}),
  lotofacil: base({linhas: 5, colunas: 5, passoX: 9, passoY: 6, x: 18}),
  quina: base({linhas: 8, colunas: 10, passoY: 4.6}),
  lotomania: base({linhas: 10, colunas: 10, passoY: 4.4, zeroNoFim: true}),
  duplasena: base({linhas: 5, colunas: 10}),
  timemania: base({linhas: 8, colunas: 10, passoY: 4.6}),
  diadesorte: base({linhas: 4, colunas: 8, passoX: 7.2, extra: {nome: "Mês da Sorte", linhas: 3, colunas: 4, x: 14, y: 72, passoX: 14, passoY: 5.2}}),
  supersete: base({linhas: 10, colunas: 7, passoX: 8.5, passoY: 4.8, x: 14, ordem: "coluna"}),
  maismilionaria: base({linhas: 5, colunas: 10, extra: {nome: "Trevos", linhas: 1, colunas: 6, x: 20, y: 74, passoX: 7, passoY: 5.2}})
};
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
  ordem: [["linha", "por linha (01, 02, 03… →)"], ["coluna", "por coluna (01, 02, 03… ↓)"]],
  formato: [["retangulo", "retângulo cheio"], ["elipse", "oval cheio"], ["x", "traço (X)"]],
  papel: [["volante", "o próprio volante (alimentação manual)"], ["a4", "folha A4 com o volante colado"]],
  virar: [["nao", "com o topo para dentro (normal)"], ["sim", "de cabeça para baixo (girar 180°)"]]};

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
  if (salvo) { for (var k in salvo) if (k !== "extra") m[k] = salvo[k]; if (salvo.extra && m.extra) for (k in salvo.extra) m.extra[k] = salvo.extra[k]; }
  return m;
}
function salvar() { ls("vol:" + S.lot, S.m); }

/* posição (mm) do centro de um número dentro do jogo nº j (0…) */
function ordemNumeros(c, m) {
  var l = c.dezenas.slice();
  if (m.zeroNoFim && l[0] === 0) { l.shift(); l.push(0); }
  return l;
}
function celula(m, idx, j) {
  var lin, col;
  if (m.ordem === "coluna") { col = Math.floor(idx / m.linhas); lin = idx % m.linhas; }
  else { lin = Math.floor(idx / m.colunas); col = idx % m.colunas; }
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
        var idx = m.ordem === "coluna" ? ci * m.linhas + d : d * m.colunas + ci;
        out.push(celula(m, idx, j));
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
      var p = celula(m, i, j), rot = c.colunar ? (m.ordem === "coluna" ? i % m.linhas : Math.floor(i / m.colunas)) : c.fmt(ordem[i]);
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

/* ======================= Desenho ======================= */
function folhas() {
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
  $("#resumo").innerHTML = S.modo === "guia" ? "Folha de calibração: imprima em papel comum e compare com o volante contra a luz."
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
  var obj = alvo === "extra" ? S.m.extra : S.m, v = obj[chave], id = "c-" + (alvo || "m") + "-" + chave;
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
  if (S.m.extra) h += "<fieldset><legend>" + esc(S.m.extra.nome) + '</legend><div class="form">' + EXTRA.map(function (f) { return campo(f[0], f[1], f[2], f[3], "extra"); }).join("") + "</div></fieldset>";
  if (c.chave === "lotomania") h += '<label class="chk"><input type="checkbox" id="c-zero"' + (S.m.zeroNoFim ? " checked" : "") + "> O 00 fica no fim do volante (depois do 99)</label>";
  if (c.chave === "timemania") h += '<p class="dica">O Time do Coração tem 80 opções no verso/lateral do volante: marque-o à caneta.</p>';
  $("#controles").innerHTML = h;
  $("#controles").oninput = function (e) {
    var t = e.target; if (!t.dataset.k && t.id !== "c-zero") return;
    if (t.id === "c-zero") S.m.zeroNoFim = t.checked;
    else {
      var obj = t.dataset.a === "extra" ? S.m.extra : S.m, v = t.tagName === "SELECT" ? t.value : parseFloat(String(t.value).replace(",", "."));
      if (t.tagName !== "SELECT" && isNaN(v)) return;
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
  trocarLoteria(S.lot, true);
  $("#lot").onchange = function () { trocarLoteria(this.value, false); };
  $("#modo").onchange = function () { S.modo = this.value; desenhar(); };
  $("#txt").oninput = function () { S.jogos = lerTexto(this.value); S.extras = null; desenhar(); };
  $("#bt-imprimir").onclick = function () {
    if (S.modo !== "guia" && !S.jogos.length) { alert("Nenhum jogo para imprimir."); return; }
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
}
iniciar();
})();
