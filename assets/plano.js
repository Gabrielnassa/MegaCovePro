/* MegaCover Pro Elite — configuração comercial.
   Edite só este arquivo para mudar fase, preços e links.

   ▸ fase: "beta"        → tudo liberado de graça (período de testes).
   ▸ fase: "assinatura"  → recursos PRO passam a pedir assinatura.
     Atenção: o GitHub Pages é um site estático. Um bloqueio feito só no
     navegador é fácil de burlar. Para cobrar de verdade será preciso login e
     verificação no servidor (ex.: Supabase/Firebase + Mercado Pago/Stripe).
     A interface já está preparada: basta trocar a função `assinante()`. */
window.MC_PLANO = {
  produto: "MegaCover Pro Elite",
  empresa: "NassaTech",
  versao: "2.0 Beta",
  fase: "beta",

  /* Preços exibidos na página de planos. Deixe null para mostrar "Em breve". */
  precoMensal: null,          /* ex.: "R$ 29,90" */
  precoAnual: null,           /* ex.: "R$ 249,00" */
  economiaAnual: null,        /* ex.: "2 meses grátis" */

  /* Link de pagamento (Mercado Pago, Stripe, Hotmart…). Vazio = botão "Em breve". */
  linkAssinatura: "",
  /* Contato para a lista de espera (WhatsApp no formato 5511999999999 ou e-mail). */
  whatsapp: "",
  email: "",

  /* Login e assinatura (Supabase). Crie o projeto em supabase.com, copie a URL e a chave "anon public"
     (Settings → API). Vazio = login desativado (o site continua funcionando sem conta). */
  supabase: {url: "", chave: ""},
  /* true = só entra no painel quem fizer login (mesmo no Beta). */
  loginObrigatorio: false,

  /* Limites do plano gratuito quando a fase for "assinatura". */
  gratis: {jogosPorGeracao: 10, simulacoes: 10000},

  /* Recursos que serão exclusivos do PRO (no Beta aparecem com o selo, mas liberados). */
  pro: {
    ia: "MegaCover AI (DNA das Combinações™ e Otimização Elite™)",
    fechamentos: "Fechamentos inteligentes",
    simulacaoGrande: "Simulações acima de 10 mil sorteios",
    historico: "Conferência em todo o histórico",
    exportar: "Exportação Excel, PDF e projetos"
  }
};

(function (P) {
  P.beta = function () { return P.fase === "beta"; };
  /* Assinatura lida do Supabase (tabela "assinaturas") por assets/auth.js e guardada em cache local.
     A verificação real é feita no servidor: a linha só existe se você (ou o webhook do pagamento) criar. */
  P.assinante = function () {
    try {
      var a = JSON.parse(localStorage.getItem("mc:assinatura") || "null");
      return !!(a && a.status === "ativa" && (!a.valido_ate || new Date(a.valido_ate) > new Date()));
    } catch (e) { return false; }
  };
  P.loginAtivo = function () { return !!(P.supabase && P.supabase.url && P.supabase.chave); };
  P.liberado = function (recurso) { return P.beta() || !P.pro[recurso] || P.assinante(); };
  P.contatoUrl = function () {
    if (P.whatsapp) return "https://wa.me/" + P.whatsapp + "?text=" + encodeURIComponent("Quero entrar na lista do " + P.produto + " PRO");
    if (P.email) return "mailto:" + P.email + "?subject=" + encodeURIComponent(P.produto + " PRO");
    return "";
  };
})(window.MC_PLANO);
