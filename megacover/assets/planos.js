/* MegaCover Pro Elite — cartões de planos, tabela de comparação e checkout (página inicial e planos.html).
   Preços, destaques e comparação vêm de assets/regras.json (a mesma fonte que o servidor usa), lidos por
   assets/permissoes.js. O valor final (com cupom) é sempre calculado pelo servidor; aqui só mostramos.
   Endereços aceitos em planos.html:
     ?plano=elite          abre o pagamento do plano (se já tiver entrado)
     ?assinar=pro-anual    volta do cadastro: abre o pagamento do plano e ciclo escolhidos
     ?cupom=LOTERICA       já preenche o cupom (link para divulgar nas lotéricas) */
window.MC_PLANOS = (function () {
  var P = window.MC_PLANO, A = window.MC_AUTH, PERM = window.MC_PERM;
  var R = null, carregando = null;
  var estado = {ciclo: "anual", usuario: null, me: null, el: null};
  try { estado.ciclo = localStorage.getItem("mc:ciclo") === "mensal" ? "mensal" : "anual"; } catch (e) {}
  var q = new URLSearchParams(location.search);
  var cupomUrl = (q.get("cupom") || "").trim().toUpperCase();
  try { if (cupomUrl) sessionStorage.setItem("mc:cupom", cupomUrl); else cupomUrl = sessionStorage.getItem("mc:cupom") || ""; } catch (e) {}

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function ic(d) { return '<svg class="ic" viewBox="0 0 24 24"><path d="' + d + '"/></svg>'; }
  var OK = ic("M5 12l5 5L20 7");
  var reais = function (v) { return PERM.reais(v); };
  var servidor = function () { return !!(P.loginAtivo() && window.MC_API && !P.beta()); };

  function regras() {
    if (R) return Promise.resolve(R);
    if (!carregando) carregando = fetch("assets/regras.json", {cache: "no-cache"}).then(function (r) { return r.json(); }).then(function (x) { R = x; return R; });
    return carregando;
  }
  function pagos() { return PERM.planos(R).filter(function (p) { return p.precos; }); }
  /* maior economia do anual (no Pix) em relação a 12 meses do mensal, para o selo do seletor */
  function economiaMax() {
    var m = 0;
    pagos().forEach(function (p) { var e = 1 - p.precos.anual.pix / (p.precos.mensal.cartao * 12); if (e > m) m = e; });
    return Math.floor(m * 100);
  }
  function preco(p) {
    if (!p.precos) return {grande: '<span class="moeda">R$</span>0', obs: "para sempre"};
    var c = estado.ciclo, cartao = p.precos[c].cartao, pix = p.precos[c].pix;
    var mes = PERM.porMes(cartao, c).toFixed(2).replace(".", ",");
    if (c === "mensal")
      return {grande: '<span class="moeda">R$</span>' + mes + "<small>/mês</small>", obs: "cobrado todo mês · Pix ou cartão · cancele quando quiser"};
    var eco = Math.round((p.precos.mensal.cartao * 12 - pix) * 100) / 100;
    return {grande: '<span class="moeda">R$</span>' + mes + "<small>/mês</small>",
            obs: reais(cartao) + " por ano no cartão · <b>" + reais(pix) + " no Pix</b>",
            eco: "Economize " + reais(eco) + " por ano em relação ao mensal"};
  }
  function planoAtual() {
    var me = estado.me; if (!me) return null;
    if (me.origem === "assinatura") return me.assinatura && me.assinatura.status === "cancelada" ? null : me.plano;   // cancelado pode assinar de novo
    return me.origem === "gratis" ? "gratis" : null;
  }
  /* para onde vai o botão do plano */
  function destino(p) {
    var logado = !!estado.usuario, atual = planoAtual();
    if (P.beta()) return {href: "app.html", txt: p.precos ? "Testar grátis no Beta" : "Começar grátis", tipo: p.destaque ? "primario" : ""};
    if (logado && atual === p.id) return {txt: "Seu plano atual", desativado: true};
    if (!p.precos) return {href: P.loginAtivo() && !logado ? "conta.html?modo=criar" : "app.html", txt: logado ? "Abrir o painel" : "Criar conta grátis", tipo: ""};
    var alvo = p.id + "-" + estado.ciclo;
    if (!P.loginAtivo()) {
      var c = P.contatoUrl("Quero assinar o plano " + p.nome + " (" + estado.ciclo + ") do " + P.produto);
      return c ? {href: c, txt: "Quero o " + p.nome, tipo: p.destaque ? "primario" : "", externo: true} : {txt: "Em breve", desativado: true};
    }
    if (!logado) return {href: "conta.html?modo=criar&plano=" + alvo + "&volta=" + encodeURIComponent("planos.html?assinar=" + alvo), txt: "Assinar o " + p.nome, tipo: p.destaque ? "primario" : ""};
    var nAtual = atual ? (PERM.plano(R, atual) || {nivel: 0}).nivel : 0;
    return {acao: p.id, txt: atual && atual !== "gratis" && nAtual > p.nivel ? "Mudar para o " + p.nome : "Assinar o " + p.nome, tipo: p.destaque ? "primario" : ""};
  }
  function cartao(p) {
    var pr = preco(p), d = destino(p), atual = estado.usuario && planoAtual() === p.id && !P.beta();
    var bt = d.desativado ? '<button class="bt" type="button" disabled>' + esc(d.txt) + "</button>"
      : d.acao ? '<button class="bt ' + (d.tipo || "") + '" type="button" data-assinar="' + esc(d.acao) + '">' + esc(d.txt) + "</button>"
      : '<a class="bt ' + (d.tipo || "") + '" href="' + esc(d.href) + '"' + (d.externo ? ' target="_blank" rel="noopener"' : "") + ">" + esc(d.txt) + "</a>";
    return '<div class="plano' + (p.destaque ? " destaque" : "") + (atual ? " atual" : "") + '" id="plano-' + esc(p.id) + '">' +
      (p.selo ? '<span class="fita">' + esc(p.selo) + "</span>" : "") +
      "<h3>" + esc(p.nome) + '</h3><p class="desc">' + esc(p.frase) + '</p><div class="preco">' + pr.grande + '</div><div class="obs">' + pr.obs + "</div>" +
      (pr.eco ? '<div class="eco">' + esc(pr.eco) + "</div>" : "") + bt +
      "<ul>" + (p.destaques || []).map(function (t, i) { return "<li" + (i === 0 && /^Tudo do/.test(t) ? ' class="base"' : "") + ">" + OK + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul></div>";
  }
  function seletor() {
    return '<div class="ciclo" role="tablist" aria-label="Ciclo de cobrança">' +
      '<button type="button" role="tab" data-ciclo="mensal" aria-selected="' + (estado.ciclo === "mensal") + '">Mensal</button>' +
      '<button type="button" role="tab" data-ciclo="anual" aria-selected="' + (estado.ciclo === "anual") + '">Anual <span class="desconto">economize até ' + economiaMax() + "%</span></button></div>";
  }
  function avisoTopo() {
    if (P.beta()) return '<p class="aviso-beta"><b>Beta aberto:</b> todos os recursos estão liberados de graça durante os testes. Os preços abaixo valem depois do lançamento.</p>';
    var me = estado.me;
    if (me && me.teste) return '<p class="aviso-beta">Você está no <b>teste grátis do ' + esc(PERM.plano(R, R.teste.plano).nome) + "</b>: faltam " + me.teste.diasRestantes + " dia(s). Assine para continuar com todos os recursos.</p>";
    if (!estado.usuario) return '<p class="aviso-beta">Toda conta nova ganha <b>' + R.teste.dias + " dias de " + esc(PERM.plano(R, R.teste.plano).nome) + " grátis</b>, sem cartão de crédito.</p>";
    return "";
  }
  function montar() {
    var el = estado.el; if (!el || !R) return;
    el.innerHTML = seletor() + avisoTopo() + '<div class="planos">' + PERM.planos(R).map(cartao).join("") + "</div>";
    el.querySelectorAll("[data-ciclo]").forEach(function (b) {
      b.onclick = function () { estado.ciclo = b.dataset.ciclo; try { localStorage.setItem("mc:ciclo", estado.ciclo); } catch (e) {} montar(); };
    });
    el.querySelectorAll("[data-assinar]").forEach(function (b) { b.onclick = function () { checkout(b.dataset.assinar, estado.ciclo); }; });
  }
  /* tabela de comparação (linhas e textos de regras.json) */
  function comparar(tabela) {
    regras().then(function () {
      var ps = PERM.planos(R);
      tabela.innerHTML = "<thead><tr><th>Recurso</th>" + ps.map(function (p) { return '<th class="' + (p.destaque ? "destaque" : "") + '">' + esc(p.nome) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        PERM.comparacao(R).map(function (l) {
          return "<tr><td>" + esc(l.rotulo) + "</td>" + l.valores.map(function (v) {
            return v === "✓" ? "<td>" + OK + "</td>" : v === "—" ? '<td class="nao">—</td>' : "<td>" + esc(v) + "</td>";
          }).join("") + "</tr>";
        }).join("") + "</tbody>";
    });
  }

  /* ---------- checkout: forma de pagamento, CPF e cupom; o servidor cria a cobrança no Asaas ---------- */
  function modal() {
    var m = document.getElementById("modal-pag");
    if (!m) {
      m = document.createElement("div"); m.className = "modal"; m.id = "modal-pag"; m.hidden = true;
      m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "pag-titulo");
      m.innerHTML = '<div class="caixa checkout" id="pag-caixa"></div>'; document.body.appendChild(m);
      m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-fechar]")) m.hidden = true; });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") m.hidden = true; });
    }
    return m;
  }
  function mascaraCpf(v) {
    var d = v.replace(/\D/g, "").slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  function checkout(planoId, ciclo) {
    var p = PERM.plano(R, planoId); if (!p || !p.precos) return;
    var me = estado.me || {}, m = modal(), cx = document.getElementById("pag-caixa");
    var st = {ciclo: ciclo || "anual", forma: "pix", cupom: cupomUrl || "", cupomOk: null, msgCupom: ""};
    function linhaForma(f, rot, sub) {
      var v = p.precos[st.ciclo][f];
      return '<label class="forma' + (st.forma === f ? " sel" : "") + '"><input type="radio" name="forma" value="' + f + '"' + (st.forma === f ? " checked" : "") + ">" +
        "<span><b>" + rot + "</b><small>" + sub + '</small></span><span class="vl">' + reais(v) + "</span></label>";
    }
    function total() {
      var base = PERM.preco(R, p.id, st.ciclo, st.forma), c = st.cupomOk && st.cupomOk.forma === st.forma && st.cupomOk.ciclo === st.ciclo ? st.cupomOk : null;
      return {valor: c ? c.valor : base, original: base, cupom: c};
    }
    function desenhar() {
      var t = total(), anual = st.ciclo === "anual";
      cx.innerHTML = '<div class="sobre">Assinatura</div><h2 id="pag-titulo">' + esc(P.produto.replace(" Pro Elite", "")) + " " + esc(p.nome) + "</h2>" +
        '<div class="ciclo mini" role="tablist"><button type="button" data-c="mensal" aria-selected="' + !anual + '">Mensal</button><button type="button" data-c="anual" aria-selected="' + anual + '">Anual</button></div>' +
        '<div class="formas">' + linhaForma("pix", "Pix", anual ? "pagamento único por ano" : "QR Code todo mês") + linhaForma("cartao", "Cartão de crédito", anual ? "cobrado uma vez por ano" : "cobrança automática todo mês") + "</div>" +
        '<form id="pag-form" novalidate>' +
        '<label class="campo"><span>Nome completo</span><input name="nome" autocomplete="name" required value="' + esc((me.usuario && me.usuario.nome) || "") + '"></label>' +
        (me.temCpf ? "" : '<label class="campo"><span>CPF <small>exigido pelo Asaas para emitir a cobrança</small></span><input name="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" required></label>') +
        '<div class="campo"><span>Cupom de desconto</span><div class="cupom"><input name="cupom" autocomplete="off" placeholder="Ex.: LOTERICA" value="' + esc(st.cupom) + '"><button class="bt" type="button" id="pag-cupom">Aplicar</button></div>' +
        (st.msgCupom ? '<small class="' + (st.cupomOk ? "ok" : "erro") + '">' + esc(st.msgCupom) + "</small>" : "") + "</div>" +
        '<div class="total"><span>Total ' + (anual ? "por ano" : "por mês") + "</span><b>" + (t.cupom && t.cupom.desconto ? "<s>" + reais(t.original) + "</s> " : "") + reais(t.valor) + "</b></div>" +
        '<p class="letra">' + (anual ? "Equivale a " + reais(PERM.porMes(t.valor, "anual")) + "/mês. " : "") + "Renova " + (anual ? "a cada ano" : "todo mês") + " pelo mesmo valor; cancele quando quiser em Minha conta. " +
        (me.teste ? "Seu teste grátis é substituído pelo plano assinado assim que o pagamento for confirmado. " : "") + "O pagamento é feito na página segura do Asaas.</p>" +
        '<p class="erro" id="pag-erro" hidden></p>' +
        '<div class="linha-bts"><button class="bt primario" type="submit" id="pag-ir">Ir para o pagamento</button><button class="bt" type="button" data-fechar>Voltar</button></div></form>';
      cx.querySelectorAll("[data-c]").forEach(function (b) { b.onclick = function () { st.ciclo = b.dataset.c; revalidar(); }; });
      cx.querySelectorAll("input[name=forma]").forEach(function (r) { r.onchange = function () { st.forma = r.value; revalidar(); }; });
      var cpf = cx.querySelector("input[name=cpf]"); if (cpf) cpf.oninput = function () { cpf.value = mascaraCpf(cpf.value); };
      cx.querySelector("input[name=cupom]").oninput = function () { st.cupom = this.value.trim().toUpperCase(); };
      cx.querySelector("#pag-cupom").onclick = function () { st.cupom = cx.querySelector("input[name=cupom]").value.trim().toUpperCase(); validarCupom(); };
      cx.querySelector("#pag-form").onsubmit = enviar;
    }
    /* guarda o que a pessoa já digitou antes de redesenhar */
    function lembrar() {
      var f = cx.querySelector("#pag-form"); if (!f) return;
      if (f.nome.value) me = Object.assign({}, me, {usuario: Object.assign({}, me.usuario, {nome: f.nome.value})});
      if (f.cpf) st.cpf = f.cpf.value;
    }
    function redesenhar() { lembrar(); desenhar(); var f = cx.querySelector("#pag-form"); if (f.cpf && st.cpf) f.cpf.value = st.cpf; }
    function revalidar() { if (st.cupom && st.cupomOk !== null) validarCupom(); else redesenhar(); }
    function validarCupom() {
      if (!st.cupom) { st.cupomOk = null; st.msgCupom = ""; redesenhar(); return; }
      MC_API.post("cupom", {plano: p.id, ciclo: st.ciclo, forma: st.forma, cupom: st.cupom}, {silencioso: true}).then(function (r) {
        st.cupomOk = {valor: r.valor, desconto: r.desconto, forma: st.forma, ciclo: st.ciclo};
        st.msgCupom = r.desconto ? "Cupom " + st.cupom + " aplicado: " + reais(r.desconto) + " de desconto." : "Cupom válido.";
        redesenhar();
      }).catch(function (e) { st.cupomOk = false; st.msgCupom = e.message; redesenhar(); });
    }
    function enviar(e) {
      e.preventDefault(); lembrar();
      var f = cx.querySelector("#pag-form"), b = cx.querySelector("#pag-ir"), erro = cx.querySelector("#pag-erro");
      var corpo = {plano: p.id, ciclo: st.ciclo, forma: st.forma, nome: f.nome.value.trim()};
      if (f.cpf) corpo.cpf = f.cpf.value.replace(/\D/g, "");
      var cup = f.cupom.value.trim().toUpperCase(); if (cup) corpo.cupom = cup;
      function mostrar(t) { erro.textContent = t; erro.hidden = false; }
      if (corpo.nome.length < 3) return mostrar("Informe seu nome completo.");
      if (f.cpf && corpo.cpf.length !== 11) return mostrar("Informe os 11 dígitos do CPF.");
      b.disabled = true; b.textContent = "Gerando a cobrança…"; erro.hidden = true;
      MC_API.post("assinar", corpo, {silencioso: true}).then(function (r) {
        try { sessionStorage.removeItem("mc:cupom"); } catch (x) {}
        b.textContent = "Abrindo o pagamento…"; location.href = r.url;
      }).catch(function (x) { b.disabled = false; b.textContent = "Ir para o pagamento"; mostrar(x.message); });
    }
    desenhar(); m.hidden = false;
    if (st.cupom) validarCupom();
    var n = cx.querySelector("input[name=nome]"); if (n && !n.value) n.focus();
  }

  function iniciar(el) {
    estado.el = el;
    regras().then(function () {
      montar();
      if (!A || !A.ativo()) return null;
      return A.usuario().then(function (u) {
        estado.usuario = u;
        if (!u || !servidor()) return null;
        return MC_API.get("me", {silencioso: true}).then(function (me) { estado.me = me; }).catch(function () {});
      }).then(function () { montar(); abrirPedido(); });
    }).catch(function () { if (el) el.innerHTML = '<p class="aviso-beta">Não foi possível carregar os planos. Recarregue a página.</p>'; });
  }
  /* ?plano=elite (vindo do painel) ou ?assinar=pro-anual (volta do cadastro) */
  function abrirPedido() {
    var a = (q.get("assinar") || "").split("-"), id = a[0] || q.get("plano"), ciclo = a[1] === "mensal" ? "mensal" : (a[1] === "anual" ? "anual" : estado.ciclo);
    if (!id) return;
    var c = document.getElementById("plano-" + id); if (c) { c.classList.add("foco"); c.scrollIntoView({block: "center"}); }
    if (!estado.usuario || !servidor() || planoAtual() === id) return;
    var p = PERM.plano(R, id); if (p && p.precos) checkout(id, ciclo);
  }
  return {iniciar: iniciar, comparar: comparar, regras: regras, estado: estado, continuarAssinatura: function () {}};
})();
