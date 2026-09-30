/* MegaCover Pro Elite — login, conta e assinatura via Supabase.
   Usa o cliente oficial (assets/vendor/supabase.min.js). Senhas nunca passam pelo site: o Supabase
   guarda só o hash, e a sessão fica num token no navegador. A assinatura é lida da tabela
   "assinaturas" (protegida por RLS: cada pessoa só lê a própria linha). */
window.MC_AUTH = (function () {
  var P = window.MC_PLANO, cli = null, ouvintes = [];
  function ativo() { return !!(P && P.loginAtivo && P.loginAtivo() && window.supabase && window.supabase.createClient); }
  function cliente() {
    if (!ativo()) return null;
    if (!cli) {
      cli = window.supabase.createClient(P.supabase.url, P.supabase.chave, {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}});
      cli.auth.onAuthStateChange(function (ev, sessao) {
        if (ev === "SIGNED_OUT") try { localStorage.removeItem("mc:assinatura"); } catch (e) {}
        ouvintes.forEach(function (f) { try { f(ev, sessao); } catch (e) {} });
      });
    }
    return cli;
  }
  function base() { return location.href.replace(/[^\/]*$/, ""); }
  function sessao() { var c = cliente(); if (!c) return Promise.resolve(null); return c.auth.getSession().then(function (r) { return r.data.session || null; }); }
  function usuario() { return sessao().then(function (s) { return s ? s.user : null; }); }
  function erroPt(e) {
    var m = (e && e.message) || String(e || "");
    if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
    if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).";
    if (/already registered|already been registered/i.test(m)) return "Este e-mail já tem conta. Use \"Entrar\" ou \"Esqueci a senha\".";
    if (/Password should be at least/i.test(m)) return "A senha precisa ter pelo menos 8 caracteres.";
    if (/rate limit|too many/i.test(m)) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
    if (/Unable to validate email|invalid format/i.test(m)) return "E-mail inválido.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão com o servidor de login.";
    if (/provider is not enabled|Unsupported provider/i.test(m)) return "O login com Google ainda não foi ativado.";
    return m || "Não foi possível concluir.";
  }
  function entrar(email, senha) {
    var c = cliente(); if (!c) return Promise.reject(new Error("Login não configurado."));
    return c.auth.signInWithPassword({email: email, password: senha}).then(function (r) { if (r.error) throw r.error; return r.data.session; });
  }
  function cadastrar(email, senha, nome) {
    var c = cliente(); if (!c) return Promise.reject(new Error("Login não configurado."));
    return c.auth.signUp({email: email, password: senha, options: {data: {nome: nome || ""}, emailRedirectTo: base() + "conta.html?confirmado=1"}})
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  /* Google: volta para a página de conta, que segue para o destino escolhido */
  function entrarGoogle(volta) {
    var c = cliente(); if (!c) return Promise.reject(new Error("Login não configurado."));
    return c.auth.signInWithOAuth({provider: "google", options: {redirectTo: base() + "conta.html" + (volta ? "?volta=" + encodeURIComponent(volta) : "")}})
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function recuperar(email) {
    var c = cliente(); if (!c) return Promise.reject(new Error("Login não configurado."));
    return c.auth.resetPasswordForEmail(email, {redirectTo: base() + "conta.html?modo=nova-senha"}).then(function (r) { if (r.error) throw r.error; return true; });
  }
  function novaSenha(senha) {
    var c = cliente(); if (!c) return Promise.reject(new Error("Login não configurado."));
    return c.auth.updateUser({password: senha}).then(function (r) { if (r.error) throw r.error; return r.data.user; });
  }
  function sair() { var c = cliente(); try { localStorage.removeItem("mc:assinatura"); } catch (e) {} return c ? c.auth.signOut() : Promise.resolve(); }
  /* Lê a assinatura da pessoa logada e guarda em cache (usado por MC_PLANO.assinante()). */
  /* assinatura completa (inclusive vencida/cancelada), para a página Minha conta */
  function minhaAssinatura() {
    var c = cliente(); if (!c) return Promise.resolve(null);
    return sessao().then(function (s) {
      if (!s) return null;
      return c.from("assinaturas").select("plano,ciclo,status,valido_ate").eq("user_id", s.user.id).maybeSingle().then(function (r) { return r.error ? null : r.data; });
    });
  }
  function assinatura() {
    var c = cliente(); if (!c) return Promise.resolve(null);
    return sessao().then(function (s) {
      if (!s) { try { localStorage.removeItem("mc:assinatura"); } catch (e) {} return null; }
      return c.from("assinaturas").select("plano,ciclo,status,valido_ate").eq("user_id", s.user.id).maybeSingle().then(function (r) {
        var a = r.error ? null : r.data;
        try { if (a) localStorage.setItem("mc:assinatura", JSON.stringify({plano: a.plano, ciclo: a.ciclo, status: a.status, valido_ate: a.valido_ate, lido_em: Date.now()})); else localStorage.removeItem("mc:assinatura"); } catch (e) {}
        return a;
      });
    });
  }
  function aoMudar(f) { ouvintes.push(f); cliente(); }
  /* Chamado pelo painel ao abrir: atualiza a assinatura e avisa quem quiser saber. */
  function iniciar() { if (!ativo()) return Promise.resolve(null); return assinatura().catch(function () { return null; }); }
  return {ativo: ativo, cliente: cliente, sessao: sessao, usuario: usuario, entrar: entrar, entrarGoogle: entrarGoogle, minhaAssinatura: minhaAssinatura, cadastrar: cadastrar, recuperar: recuperar,
    novaSenha: novaSenha, sair: sair, assinatura: assinatura, aoMudar: aoMudar, iniciar: iniciar, erroPt: erroPt};
})();
