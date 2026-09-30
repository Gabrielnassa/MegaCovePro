/* MegaCover Pro Elite — cartões de planos com seletor Mensal/Anual (usado na página inicial e em planos.html).
   Lê tudo de MC_PLANO (assets/plano.js). O botão de cada plano leva ao cadastro e, depois do login,
   ao link de pagamento do plano e ciclo escolhidos. */
window.MC_PLANOS = (function () {
  var P = window.MC_PLANO, A = window.MC_AUTH;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function ic(d) { return '<svg class="ic" viewBox="0 0 24 24"><path d="' + d + '"/></svg>'; }
  var OK = ic("M5 12l5 5L20 7");
  var estado = {ciclo: "anual", usuario: null};
  try { estado.ciclo = localStorage.getItem("mc:ciclo") === "mensal" ? "mensal" : "anual"; } catch (e) {}
  function preco(p) {
    var v = estado.ciclo === "anual" ? p.anualMes : p.mensal;
    if (v === 0) return {grande: "R$ 0", obs: "para sempre"};
    if (v == null) return {grande: "Em breve", obs: "valor anunciado antes do lançamento"};
    var reais = P.reais(v).replace("R$ ", "");
    return {grande: '<span class="moeda">R$</span>' + reais + '<small>/mês</small>',
            obs: estado.ciclo === "anual" ? "cobrado " + P.reais(Math.round(v * 12 * 100) / 100) + " por ano" + (p.mensal ? ' · <s>' + P.reais(p.mensal) + "/mês</s>" : "") : "cobrado mensalmente · cancele quando quiser"};
  }
  /* para onde vai o botão do plano */
  function destino(p) {
    var nivel = P.nivel(), logado = !!estado.usuario, login = P.loginAtivo();
    if (P.beta()) return {href: "app.html", txt: p.nivel ? "Testar grátis no Beta" : "Começar grátis", tipo: p.destaque ? "primario" : ""};
    if (logado && nivel === p.nivel) return {txt: "Seu plano atual", desativado: true};
    if (!p.nivel) return {href: login && !logado ? "conta.html?modo=criar" : "app.html", txt: "Começar grátis", tipo: ""};
    var alvo = p.id + "-" + estado.ciclo;
    if (login && !logado) return {href: "conta.html?modo=criar&plano=" + alvo + "&volta=" + encodeURIComponent("planos.html?assinar=" + alvo), txt: "Assinar o " + p.nome, tipo: p.destaque ? "primario" : ""};
    var link = p.checkout && p.checkout[estado.ciclo];
    if (link) return {href: linkPagamento(link), txt: nivel > p.nivel ? "Mudar para o " + p.nome : "Assinar o " + p.nome, tipo: p.destaque ? "primario" : "", externo: true};
    var c = P.contatoUrl("Quero assinar o plano " + p.nome + " (" + estado.ciclo + ") do " + P.produto);
    return c ? {href: c, txt: "Quero o " + p.nome, tipo: p.destaque ? "primario" : "", externo: true} : {txt: "Em breve", desativado: true};
  }
  /* o e-mail vai junto para o pagamento reconhecer a conta */
  function linkPagamento(link) {
    var u = estado.usuario; if (!u || !u.email) return link;
    return link + (link.indexOf("?") >= 0 ? "&" : "?") + "prefilled_email=" + encodeURIComponent(u.email) + "&client_reference_id=" + encodeURIComponent(u.id);
  }
  function cartao(p) {
    var pr = preco(p), d = destino(p);
    var bt = d.desativado ? '<button class="bt" type="button" disabled>' + esc(d.txt) + "</button>"
      : '<a class="bt ' + (d.tipo || "") + '" href="' + esc(d.href) + '"' + (d.externo ? ' target="_blank" rel="noopener"' : "") + ">" + esc(d.txt) + "</a>";
    return '<div class="plano' + (p.destaque ? " destaque" : "") + (estado.usuario && P.nivel() === p.nivel && !P.beta() ? " atual" : "") + '">' +
      (p.selo ? '<span class="fita">' + esc(p.selo) + "</span>" : "") +
      "<h3>" + esc(p.nome) + '</h3><p class="desc">' + esc(p.frase) + '</p><div class="preco">' + pr.grande + '</div><div class="obs">' + pr.obs + "</div>" + bt +
      "<ul>" + p.inclui.map(function (t, i) { return "<li" + (i === 0 && /^Tudo do/.test(t) ? ' class="base"' : "") + ">" + OK + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul></div>";
  }
  function seletor() {
    return '<div class="ciclo" role="tablist" aria-label="Ciclo de cobrança">' +
      '<button type="button" role="tab" data-ciclo="mensal" aria-selected="' + (estado.ciclo === "mensal") + '">Mensal</button>' +
      '<button type="button" role="tab" data-ciclo="anual" aria-selected="' + (estado.ciclo === "anual") + '">Anual <span class="desconto">−' + esc(P.descontoAnual) + "</span></button></div>";
  }
  function montar(el) {
    var aviso = P.beta() ? '<p class="aviso-beta"><b>Beta aberto:</b> todos os recursos estão liberados de graça durante os testes. Os preços abaixo valem depois do lançamento.</p>' : "";
    el.innerHTML = seletor() + aviso + '<div class="planos">' + P.planos.map(cartao).join("") + "</div>";
    el.querySelectorAll("[data-ciclo]").forEach(function (b) {
      b.onclick = function () { estado.ciclo = b.dataset.ciclo; try { localStorage.setItem("mc:ciclo", estado.ciclo); } catch (e) {} montar(el); };
    });
  }
  function iniciar(el) {
    montar(el);
    if (A && A.ativo()) A.usuario().then(function (u) { estado.usuario = u; return u ? A.assinatura() : null; }).then(function () { montar(el); }).catch(function () {});
  }
  /* volta do cadastro: segue direto para o pagamento do plano escolhido */
  function continuarAssinatura() {
    var q = new URLSearchParams(location.search).get("assinar"); if (!q || !A || !A.ativo()) return;
    var partes = q.split("-"), p = P.plano(partes[0]), ciclo = partes[1] === "mensal" ? "mensal" : "anual";
    if (!p || !p.checkout) return;
    A.usuario().then(function (u) {
      if (!u) return; estado.usuario = u; estado.ciclo = ciclo;
      var link = p.checkout[ciclo]; if (link && !P.beta()) location.href = linkPagamento(link);
    });
  }
  return {iniciar: iniciar, continuarAssinatura: continuarAssinatura, estado: estado};
})();
