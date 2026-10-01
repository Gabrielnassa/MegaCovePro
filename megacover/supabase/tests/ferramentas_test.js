// Testes dos scripts que configuram sozinhos o Asaas (webhook), o Resend (domínio) e as chaves públicas do site.
// Rodar: deno test -A supabase/tests/ferramentas_test.js   (não precisa de banco)
import { tratarAsaas, estado as ASAAS } from "./asaas_falso.js";
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); };
const RAIZ = new URL("../../", import.meta.url).pathname;
async function rodar(script, env) {
  const p = new Deno.Command("node", {args: [RAIZ + "tools/" + script], env: {PATH: Deno.env.get("PATH"), ...env}, stdout: "piped", stderr: "piped"});
  const r = await p.output(); return new TextDecoder().decode(r.stdout) + new TextDecoder().decode(r.stderr);
}

Deno.test({name: "ferramentas de configuração", sanitizeOps: false, sanitizeResources: false, async fn(t) {
  const resend = {dominios: [], verificar: 0};
  const srv = Deno.serve({port: 54404, onListen() {}}, async (req) => {
    const u = new URL(req.url);
    if (u.pathname.startsWith("/asaas/")) return tratarAsaas(req, u, "http://127.0.0.1:54404/asaas", () => null);
    if (u.pathname.startsWith("/resend/")) {
      if (req.headers.get("authorization") !== "Bearer re_ok") return Response.json({message: "API key is invalid"}, {status: 401});
      const p = u.pathname.replace("/resend", "");
      if (p === "/domains" && req.method === "GET") return Response.json({data: resend.dominios});
      if (p === "/domains" && req.method === "POST") {
        const b = await req.json(); const d = {id: "dom_1", name: b.name, region: b.region, status: "not_started",
          records: [{record: "SPF", type: "MX", name: "send", value: "feedback-smtp.sa-east-1.amazonses.com", priority: 10}, {record: "DKIM", type: "TXT", name: "resend._domainkey", value: "p=MIGf..."}]};
        resend.dominios.push(d); return Response.json(d);
      }
      if (p === "/domains/dom_1" && req.method === "GET") return Response.json(resend.dominios[0]);
      if (p === "/domains/dom_1/verify") { resend.verificar++; return Response.json({object: "domain", id: "dom_1"}); }
    }
    if (u.pathname === "/v1/projects/abcdefghijklmnopqrst/api-keys") {
      if (req.headers.get("authorization") !== "Bearer sbp_ok") return new Response("{}", {status: 401});
      return Response.json([{name: "anon", api_key: "eyJ.anon.publica"}, {name: "service_role", api_key: "eyJ.NUNCA"}]);
    }
    return new Response("?", {status: 404});
  });
  try {
    await t.step("Asaas: cria o webhook e depois só atualiza", async () => {
      const env = {ASAAS_API_KEY: "k", ASAAS_WEBHOOK_TOKEN: "tok1", SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst", ASAAS_URL: "http://127.0.0.1:54404/asaas/v3", SUPORTE_EMAIL: "s@x.com"};
      let o = await rodar("configurar_asaas.mjs", env);
      eq(o.includes("webhook criado"), true, o);
      const w = [...ASAAS.webhooks.values()][0];
      eq([w.url, w.authToken, w.sendType, w.enabled, w.events.includes("PAYMENT_CONFIRMED"), w.events.includes("SUBSCRIPTION_DELETED")],
        ["https://abcdefghijklmnopqrst.supabase.co/functions/v1/asaas-webhook", "tok1", "SEQUENTIALLY", true, true, true], "webhook");
      o = await rodar("configurar_asaas.mjs", {...env, ASAAS_WEBHOOK_TOKEN: "tok2"});
      eq([o.includes("webhook atualizado"), ASAAS.webhooks.size, [...ASAAS.webhooks.values()][0].authToken], [true, 1, "tok2"], "atualiza sem duplicar");
      o = await rodar("configurar_asaas.mjs", {...env, ASAAS_URL: "http://127.0.0.1:1/x"});
      eq(o.includes("::warning::"), true, "falha vira aviso, não quebra o workflow");
      eq((await rodar("configurar_asaas.mjs", {})).includes("Nada feito"), true, "sem chave: nada");
    });
    await t.step("Resend: cadastra o domínio e lista o DNS", async () => {
      const env = {RESEND_API_KEY: "re_ok", DOMINIO: "megacover.com.br", RESEND_API: "http://127.0.0.1:54404/resend"};
      let o = await rodar("configurar_resend.mjs", env);
      eq([o.includes("cadastrado"), o.includes("resend._domainkey"), resend.dominios[0].region, resend.verificar], [true, true, "sa-east-1", 1], o);
      o = await rodar("configurar_resend.mjs", env);
      eq([resend.dominios.length, o.includes("cadastrado")], [1, false], "não duplica");
      resend.dominios[0].status = "verified";
      o = await rodar("configurar_resend.mjs", env);
      eq([o.includes("verificado"), o.includes("| Tipo |")], [true, false], "verificado");
      o = await rodar("configurar_resend.mjs", {...env, RESEND_API_KEY: "errada"});
      eq(o.includes("::warning::"), true, "chave errada vira aviso");
    });
    await t.step("chaves públicas no plano.js (nunca a service_role)", async () => {
      const arq = RAIZ + "assets/plano.js", original = await Deno.readTextFile(arq);
      try {
        const env = {SUPABASE_ACCESS_TOKEN: "sbp_ok", SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst", SUPABASE_API: "http://127.0.0.1:54404"};
        eq((await rodar("chaves_site.mjs", env)).trim(), "alterado", "preencheu");
        const s = await Deno.readTextFile(arq);
        eq([s.includes('supabase: {url: "https://abcdefghijklmnopqrst.supabase.co", chave: "eyJ.anon.publica"}'), s.includes("NUNCA")], [true, false], "conteúdo");
        eq((await rodar("chaves_site.mjs", env)).includes("já tem"), true, "não sobrescreve");
      } finally { await Deno.writeTextFile(arq, original); }
    });
  } finally { await srv.shutdown(); }
}});
