/* MegaCover Pro Elite — cliente da API do servidor (Supabase Edge Function "api").
   Usado pelo painel quando o login está configurado (modo servidor). Toda regra de plano é decidida
   no servidor; aqui só tratamos as respostas: login, sessão derrubada, plano e limite diário. */
window.MC_API = (function () {
  var P = window.MC_PLANO, A = window.MC_AUTH;
  function ativo() { return !!(P && P.loginAtivo && P.loginAtivo() && A && A.ativo()); }
  function base() { return P.supabase.url.replace(/\/$/, "") + "/functions/v1/api/"; }
  var ouvintes = {};
  function quando(evento, fn) { ouvintes[evento] = fn; }
  function avisar(evento, dados) { if (ouvintes[evento]) ouvintes[evento](dados); }

  function erro(status, corpo) {
    var e = new Error((corpo && corpo.mensagem) || "Falha na comunicação com o servidor.");
    e.status = status; e.codigo = corpo && corpo.erro; e.dados = corpo || {};
    return e;
  }
  /* opcoes: {corpo, binario (true = devolve Blob), silencioso (não abre avisos de plano/limite)} */
  function chamar(metodo, rota, opcoes) {
    opcoes = opcoes || {};
    return A.sessao().then(function (s) {
      if (!s) { avisar("login"); throw erro(401, {erro: "login", mensagem: "Entre na sua conta para continuar."}); }
      var h = {Authorization: "Bearer " + s.access_token, apikey: P.supabase.chave};
      if (opcoes.corpo) h["content-type"] = "application/json";
      return fetch(base() + rota, {method: metodo, headers: h, body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined});
    }).then(function (r) {
      var tipo = r.headers.get("content-type") || "";
      if (r.ok) return opcoes.binario ? r.blob() : (tipo.indexOf("json") >= 0 ? r.json() : r.text());
      return (tipo.indexOf("json") >= 0 ? r.json() : Promise.resolve({})).then(function (c) {
        var e = erro(r.status, c);
        /* login e sessão derrubada sempre avisam; "silencioso" só cala os avisos de plano e limite */
        if (e.codigo === "sessao_encerrada") avisar("sessao_encerrada", e);
        else if (e.status === 401) avisar("login", e);
        else if (!opcoes.silencioso) {
          if (e.codigo === "plano") avisar("plano", e);
          else if (e.codigo === "limite_diario") avisar("limite", e);
        }
        throw e;
      });
    });
  }
  return {
    ativo: ativo, quando: quando, chamar: chamar,
    get: function (rota, o) { return chamar("GET", rota, o); },
    post: function (rota, corpo, o) { o = o || {}; o.corpo = corpo; return chamar("POST", rota, o); },
    patch: function (rota, corpo, o) { o = o || {}; o.corpo = corpo; return chamar("PATCH", rota, o); },
    del: function (rota, o) { return chamar("DELETE", rota, o); }
  };
})();
