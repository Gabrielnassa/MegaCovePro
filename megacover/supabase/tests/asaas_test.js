// Testes do pagamento: checkout, cupom e cada evento de webhook do Asaas (contra o Asaas falso).
// Rodar: PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh && deno test -A supabase/tests/asaas_test.js
import { sql, iniciarAuth, pararAuth, criarUsuario, chamar, eq } from "./ajuda.js";
import { tratarAsaas, estado as ASAAS } from "./asaas_falso.js";

const PORTA_ASAAS = 54402;
Deno.env.set("ASAAS_API_KEY", "asaas-teste");
Deno.env.set("ASAAS_URL", `http://127.0.0.1:${PORTA_ASAAS}/asaas/v3`);
const { tratar } = await import("../functions/api/index.js");
const { tratar: webhook } = await import("../functions/asaas-webhook/index.js");

const api = (m, r, o) => chamar(tratar, m, r, o);
const evento = (ev, token = "webhook-teste") => webhook(new Request("http://local/functions/v1/asaas-webhook",
  {method: "POST", headers: {"asaas-access-token": token, "content-type": "application/json"}, body: JSON.stringify(ev)}));
let nEv = 0;
function pagamento(subId, tipo = "PAYMENT_CONFIRMED", dueDate) {
  const c = [...ASAAS.cobrancas.values()].find((x) => x.subscription === subId);
  return {id: "evt_t" + (++nEv), event: tipo, payment: {id: c ? c.id : "pay_x", subscription: subId, value: c && c.value, dueDate: dueDate || (c && c.dueDate)}};
}
const plano = async (u) => (await api("GET", "me", {tok: u.tok})).dados;
const ass = async (u) => (await sql`select * from public.assinaturas where user_id = ${u.id}`)[0];
const dias = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const CPF = "52998224725";

Deno.test({name: "Asaas: checkout, cupom e webhooks", sanitizeOps: false, sanitizeResources: false, async fn(t) {
  iniciarAuth();
  const srv = Deno.serve({port: PORTA_ASAAS, onListen() {}}, (req) => tratarAsaas(req, new URL(req.url), `http://127.0.0.1:${PORTA_ASAAS}/asaas`, evento));
  const ana = await criarUsuario("ana@t.com", {diasDeConta: 10});     // já fora do teste: Grátis
  const bia = await criarUsuario("bia@t.com", {diasDeConta: 10});
  const caio = await criarUsuario("caio@t.com", {diasDeConta: 1});    // no teste Elite
  let subAna, subBia1, subBia2;

  try {
    await t.step("checkout valida CPF e nome no servidor", async () => {
      let r = await api("POST", "assinar", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix", nome: "Ana Teste"}});
      eq([r.status, r.dados.erro], [400, "cpf"], "sem CPF");
      r = await api("POST", "assinar", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix", nome: "Ana Teste", cpf: "11111111111"}});
      eq([r.status, r.dados.erro], [400, "cpf"], "CPF inválido");
      r = await api("POST", "assinar", {tok: ana.tok, corpo: {plano: "gratis", ciclo: "anual", forma: "pix", cpf: CPF}});
      eq(r.status, 400, "plano sem preço");
      r = await api("POST", "assinar", {corpo: {plano: "pro"}});
      eq(r.status, 401, "sem login");
    });

    await t.step("cupom: preço vem do servidor e respeita plano e ciclo", async () => {
      let r = await api("POST", "cupom", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix"}});
      eq([r.status, r.dados.valor], [200, 89.9], "Pro anual Pix sem cupom");
      r = await api("POST", "cupom", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "cartao", cupom: "loterica"}});
      eq([r.dados.valor, r.dados.original], [79, 99], "LOTERICA Pro anual cartão");
      r = await api("POST", "cupom", {tok: ana.tok, corpo: {plano: "elite", ciclo: "anual", forma: "pix", cupom: "LOTERICA"}});
      eq(r.dados.valor, 149, "LOTERICA Elite anual");
      r = await api("POST", "cupom", {tok: ana.tok, corpo: {plano: "pro", ciclo: "mensal", forma: "pix", cupom: "LOTERICA"}});
      eq([r.status, r.dados.erro], [400, "cupom"], "LOTERICA no mensal");
      r = await api("POST", "cupom", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix", cupom: "NAOEXISTE"}});
      eq(r.dados.mensagem, "Cupom não encontrado.", "cupom inexistente");
    });

    await t.step("iniciar o checkout não muda o acesso", async () => {
      const r = await api("POST", "assinar", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix", nome: "Ana Teste", cpf: CPF, cupom: "LOTERICA"}});
      eq(r.status, 200, "assinar"); eq(r.dados.valor, 79, "valor com cupom");
      subAna = r.dados.assinatura;
      const s = ASAAS.assinaturas.get(subAna);
      eq([s.billingType, s.cycle, s.value], ["PIX", "YEARLY", 79], "assinatura criada no Asaas");
      eq(ASAAS.clientes.get(s.customer).cpfCnpj, CPF, "cliente com CPF");
      eq((await plano(ana)).plano, "gratis", "continua Grátis até pagar");
      eq((await sql`select count(*)::int n from public.pagamentos_pendentes where user_id = ${ana.id}`)[0].n, 1, "pendente");
    });

    await t.step("webhook exige o token", async () => {
      eq((await evento(pagamento(subAna), "errado")).status, 401, "token errado");
      eq((await plano(ana)).plano, "gratis", "nada mudou");
    });

    await t.step("pagamento confirmado libera o plano; evento repetido não duplica", async () => {
      const ev = pagamento(subAna);
      const r = await evento(ev); eq(r.status, 200, "webhook");
      const me = await plano(ana);
      eq([me.plano, me.origem, me.assinatura.status, me.assinatura.ciclo, me.assinatura.forma], ["pro", "assinatura", "ativa", "anual", "pix"], "Pro ativo");
      eq(dias((await ass(ana)).valido_ate, new Date()) >= 365, true, "válido por 1 ano");
      eq((await (await evento(ev)).json()).duplicado, true, "mesmo evento de novo");
      const [c] = await sql`select usos from public.cupons where codigo = 'LOTERICA' and plano = 'pro' and ciclo = 'anual'`;
      eq(c.usos, 1, "cupom contado uma vez");
      eq((await sql`select count(*)::int n from public.pagamentos_pendentes where user_id = ${ana.id}`)[0].n, 0, "pendente apagado");
    });

    await t.step("cupom não pode ser usado duas vezes pela mesma conta", async () => {
      const r = await api("POST", "cupom", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix", cupom: "LOTERICA"}});
      eq([r.status, r.dados.mensagem], [400, "Você já usou este cupom."], "reuso");
      const r2 = await api("POST", "assinar", {tok: ana.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix"}});
      eq(r2.status, 400, "mesmo plano já ativo");
    });

    await t.step("renovação estende a validade", async () => {
      const antes = (await ass(ana)).valido_ate;
      const prox = new Date(antes); const due = prox.toISOString().slice(0, 10);
      await evento(pagamento(subAna, "PAYMENT_RECEIVED", due));
      const depois = (await ass(ana)).valido_ate;
      eq(dias(depois, antes) >= 365, true, "mais um ano");
    });

    await t.step("atraso: 3 dias de tolerância, depois Grátis", async () => {
      await evento(pagamento(subAna, "PAYMENT_OVERDUE"));
      eq((await ass(ana)).status, "atrasada", "status atrasada");
      eq((await plano(ana)).plano, "pro", "ainda no período pago");
      await sql`update public.assinaturas set valido_ate = now() - interval '2 days' where user_id = ${ana.id}`;
      eq((await plano(ana)).plano, "pro", "2 dias após o vencimento: tolerância");
      await sql`update public.assinaturas set valido_ate = now() - interval '4 days' where user_id = ${ana.id}`;
      eq((await plano(ana)).plano, "gratis", "4 dias após: Grátis");
      await evento(pagamento(subAna, "PAYMENT_RECEIVED", new Date().toISOString().slice(0, 10)));
      const me = await plano(ana);
      eq([me.plano, me.assinatura.status], ["pro", "ativa"], "pagou: volta na hora");
    });

    await t.step("estorno ou chargeback suspende na hora", async () => {
      await evento(pagamento(subAna, "PAYMENT_REFUNDED"));
      eq([(await ass(ana)).status, (await plano(ana)).plano], ["suspensa", "gratis"], "estorno");
      await evento({id: "evt_fim_ana", event: "SUBSCRIPTION_DELETED", subscription: {id: subAna}});
      eq((await ass(ana)).status, "suspensa", "exclusão depois do estorno não reabre");
    });

    await t.step("troca de plano: Pro → Elite cancela a assinatura antiga no Asaas", async () => {
      let r = await api("POST", "assinar", {tok: bia.tok, corpo: {plano: "pro", ciclo: "mensal", forma: "cartao", nome: "Bia Teste", cpf: CPF}});
      subBia1 = r.dados.assinatura; await evento(pagamento(subBia1));
      eq((await plano(bia)).plano, "pro", "Pro mensal");
      eq(dias((await ass(bia)).valido_ate, new Date()) >= 28, true, "1 mês");
      r = await api("POST", "assinar", {tok: bia.tok, corpo: {plano: "elite", ciclo: "anual", forma: "pix"}});
      eq(r.status, 200, "CPF já guardado: não pede de novo");
      subBia2 = r.dados.assinatura;
      eq((await plano(bia)).plano, "pro", "continua Pro até pagar o Elite");
      await evento(pagamento(subBia2));
      eq((await plano(bia)).plano, "elite", "Elite");
      eq(ASAAS.assinaturas.get(subBia1).deleted, true, "Pro antigo cancelado no Asaas");
      await evento({id: "evt_fim_bia1", event: "SUBSCRIPTION_DELETED", subscription: {id: subBia1}});
      eq([(await ass(bia)).status, (await plano(bia)).plano], ["ativa", "elite"], "aviso da antiga não derruba a nova");
    });

    await t.step("cancelar: vale até o fim do período e não renova", async () => {
      const r = await api("POST", "cancelar", {tok: bia.tok});
      eq(r.status, 200, "cancelar");
      eq(ASAAS.assinaturas.get(subBia2).deleted, true, "cancelada no Asaas");
      const me = await plano(bia);
      eq([me.plano, me.assinatura.status], ["elite", "cancelada"], "Elite até o fim do período");
      eq((await api("POST", "cancelar", {tok: bia.tok})).status, 400, "cancelar de novo");
      await sql`update public.assinaturas set valido_ate = now() - interval '1 minute' where user_id = ${bia.id}`;
      eq((await plano(bia)).plano, "gratis", "terminado o período: Grátis (sem tolerância)");
    });

    await t.step("assinar durante o teste: o plano pago vale ao confirmar", async () => {
      eq((await plano(caio)).origem, "teste", "no teste Elite");
      const r = await api("POST", "assinar", {tok: caio.tok, corpo: {plano: "pro", ciclo: "mensal", forma: "pix", nome: "Caio Teste", cpf: CPF}});
      eq((await plano(caio)).origem, "teste", "segue no teste até pagar");
      await evento(pagamento(r.dados.assinatura));
      const me = await plano(caio);
      eq([me.plano, me.origem, me.teste], ["pro", "assinatura", null], "Pro pago");
    });

    await t.step("checkout abandonado não deixa cobrança solta no Asaas", async () => {
      const davi = await criarUsuario("davi@t.com", {diasDeConta: 10});
      let r = await api("POST", "assinar", {tok: davi.tok, corpo: {plano: "pro", ciclo: "mensal", forma: "pix", nome: "Davi Teste", cpf: CPF}});
      const s1 = r.dados.assinatura;
      r = await api("POST", "assinar", {tok: davi.tok, corpo: {plano: "elite", ciclo: "mensal", forma: "pix"}});
      const s2 = r.dados.assinatura;
      eq(ASAAS.assinaturas.get(s1).deleted, true, "novo checkout cancela o anterior não pago");
      eq((await sql`select count(*)::int n from public.pagamentos_pendentes where user_id = ${davi.id}`)[0].n, 1, "só o último fica pendente");
      const res = await (await evento(pagamento(s2, "PAYMENT_OVERDUE"))).json();
      eq([res.abandonado, ASAAS.assinaturas.get(s2).deleted], [true, true], "1ª cobrança vencida sem pagar: cancelada");
      eq((await sql`select count(*)::int n from public.pagamentos_pendentes where user_id = ${davi.id}`)[0].n, 0, "nada pendente");
      eq((await plano(davi)).plano, "gratis", "continua Grátis");
    });

    await t.step("eventos desconhecidos não quebram o webhook", async () => {
      let r = await evento({id: "evt_x1", event: "PAYMENT_CONFIRMED", payment: {id: "p", subscription: "sub_inexistente"}});
      eq(r.status, 200, "assinatura desconhecida: 200 (não adianta o Asaas reenviar)");
      r = await evento({id: "evt_x2", event: "PAYMENT_CREATED", payment: {id: "p", subscription: subBia2}});
      eq((await r.json()).ignorado, true, "evento ignorado");
      r = await evento({nada: 1}); eq(r.status, 200, "evento sem tipo");
    });

    await t.step("sem chave do Asaas: mensagem clara, nada é criado", async () => {
      Deno.env.delete("ASAAS_API_KEY");
      const zeca = await criarUsuario("zeca@t.com", {diasDeConta: 10});
      const r = await api("POST", "assinar", {tok: zeca.tok, corpo: {plano: "pro", ciclo: "anual", forma: "pix", nome: "Zeca", cpf: CPF}});
      eq([r.status, r.dados.erro], [503, "pagamento"], "não configurado");
      Deno.env.set("ASAAS_API_KEY", "asaas-teste");
    });
  } finally {
    await srv.shutdown();
    await pararAuth();
  }
}});
