/* MegaCover Pro Elite — configuração comercial.
   Edite só este arquivo para mudar fase, planos, preços e links de pagamento.

   ▸ fase: "beta"        → tudo liberado de graça (período de testes); a página de planos mostra os preços
                            futuros e o botão vira "Começar grátis no Beta".
   ▸ fase: "assinatura"  → cada recurso pede o plano mínimo definido em `recursos`.
   A verificação do plano é feita no servidor (Supabase, tabela "assinaturas"): ninguém se dá um plano
   pelo navegador. Veja supabase/COMO-ATIVAR.md. */
window.MC_PLANO = {
  produto: "MegaCover Pro Elite",
  empresa: "NassaTech",
  versao: "2.0 Beta",
  fase: "beta",

  /* Login (Supabase). Settings → API: Project URL e chave "anon public". Vazio = login desligado. */
  supabase: {url: "", chave: ""},
  loginGoogle: false,          /* true depois de ativar o provedor Google no Supabase */
  loginObrigatorio: false,     /* true = só abre o painel quem estiver logado */

  /* Desconto do plano anual, mostrado no seletor Mensal/Anual. */
  descontoAnual: "30%",

  /* Planos, do mais barato ao mais caro. Preços em reais (número) ou null para "Em breve".
     anualMes = preço por mês no plano anual (cobrado uma vez por ano). checkout = link de pagamento
     (Mercado Pago, Stripe, Hotmart…) de cada ciclo; vazio = botão de lista de espera. */
  planos: [
    {id: "gratis", nome: "Grátis", nivel: 0, frase: "Para conhecer o MegaCover e jogar com método.",
     mensal: 0, anualMes: 0,
     inclui: ["Histórico completo das 9 loterias", "Estatísticas, atrasos e padrões", "Gerador com MegaScore™ (até 10 jogos)",
              "Volante virtual para imprimir", "Conferência no último concurso"]},
    {id: "pro", nome: "Pro", nivel: 1, frase: "A inteligência completa para quem joga toda semana.",
     mensal: 19.90, anualMes: 13.90, destaque: true, selo: "Mais popular",
     inclui: ["Tudo do Grátis", "MegaCover AI: DNA das Combinações™ e Otimização Elite™", "Fechamentos inteligentes",
              "Conferência em todo o histórico", "Exportação Excel, PDF e projetos"],
     checkout: {mensal: "", anual: ""}},
    {id: "elite", nome: "Elite", nivel: 2, frase: "Poder máximo de simulação e atendimento direto.",
     mensal: 39.90, anualMes: 27.90,
     inclui: ["Tudo do Pro", "Simulações de até 1 milhão de sorteios", "Gerador sem limite de jogos",
              "Suporte prioritário pelo WhatsApp", "Novos recursos antes de todo mundo"],
     checkout: {mensal: "", anual: ""}}
  ],

  /* Plano mínimo de cada recurso (nível do plano) e o nome que aparece nos avisos. */
  recursos: {
    ia: {nivel: 1, nome: "MegaCover AI (DNA das Combinações™ e Otimização Elite™)"},
    fechamentos: {nivel: 1, nome: "Fechamentos inteligentes"},
    historico: {nivel: 1, nome: "Conferência em todo o histórico"},
    exportar: {nivel: 1, nome: "Exportação Excel, PDF e projetos"},
    simulacaoGrande: {nivel: 2, nome: "Simulações acima de 10 mil sorteios"}
  },

  /* Limites do plano gratuito quando a fase for "assinatura". */
  gratis: {jogosPorGeracao: 10, simulacoes: 10000},

  /* Contato para a lista de espera e o suporte (WhatsApp no formato 5511999999999 ou e-mail). */
  whatsapp: "",
  email: ""
};

(function (P) {
  P.pro = {}; Object.keys(P.recursos).forEach(function (k) { P.pro[k] = P.recursos[k].nome; });
  P.beta = function () { return P.fase === "beta"; };
  P.loginAtivo = function () { return !!(P.supabase && P.supabase.url && P.supabase.chave); };
  P.plano = function (id) { for (var i = 0; i < P.planos.length; i++) if (P.planos[i].id === id) return P.planos[i]; return null; };
  /* Assinatura lida do Supabase por assets/auth.js e guardada em cache local. */
  P.assinatura = function () {
    try {
      var a = JSON.parse(localStorage.getItem("mc:assinatura") || "null");
      return a && a.status === "ativa" && (!a.valido_ate || new Date(a.valido_ate) > new Date()) ? a : null;
    } catch (e) { return null; }
  };
  P.nivel = function () { var a = P.assinatura(); if (!a) return 0; if (a.plano === "cortesia") return 99; var p = P.plano(a.plano); return p ? p.nivel : 1; };
  P.assinante = function () { return P.nivel() > 0; };
  P.planoMinimo = function (recurso) { var r = P.recursos[recurso], n = r ? r.nivel : 0; for (var i = 0; i < P.planos.length; i++) if (P.planos[i].nivel >= n) return P.planos[i]; return null; };
  P.liberado = function (recurso) { return P.beta() || !P.recursos[recurso] || P.nivel() >= P.recursos[recurso].nivel; };
  P.reais = function (v) { return v == null ? "" : "R$ " + v.toFixed(2).replace(".", ","); };
  P.contatoUrl = function (texto) {
    if (P.whatsapp) return "https://wa.me/" + P.whatsapp + "?text=" + encodeURIComponent(texto || "Quero assinar o " + P.produto);
    if (P.email) return "mailto:" + P.email + "?subject=" + encodeURIComponent(texto || P.produto);
    return "";
  };
  /* compatibilidade com versões anteriores */
  var pp = P.plano("pro"); P.precoMensal = pp && pp.mensal ? P.reais(pp.mensal) : null; P.linkAssinatura = pp && pp.checkout ? pp.checkout.mensal : "";
})(window.MC_PLANO);
