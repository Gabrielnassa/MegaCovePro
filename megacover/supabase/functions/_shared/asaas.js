// Integração com o Asaas: cupom, assinatura (cartão ou Pix, mensal ou anual), cancelamento e webhooks.
// Variáveis de ambiente:
//   ASAAS_API_KEY        chave da API (painel Asaas → Integrações)
//   ASAAS_AMBIENTE       "sandbox" (padrão) | "producao"
//   ASAAS_URL            opcional: força a URL base da API
//   ASAAS_WEBHOOK_TOKEN  token que você define ao cadastrar o webhook no Asaas
import { R, PERM, db, env, falha } from "./base.js";

function baseUrl() {
  return env("ASAAS_URL") || (env("ASAAS_AMBIENTE", "sandbox") === "producao" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3");
}
async function chamar(metodo, caminho, corpo) {
  const k = env("ASAAS_API_KEY");
  if (!k) falha(503, "pagamento", "Os pagamentos ainda não foram configurados. Tente novamente mais tarde.");
  const r = await fetch(baseUrl() + caminho, {
    method: metodo, headers: {access_token: k, "content-type": "application/json", "User-Agent": "MegaCover"},
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const t = await r.text(); let j = {};
  try { j = t ? JSON.parse(t) : {}; } catch { j = {bruto: t}; }
  if (!r.ok) falha(502, "pagamento", (j.errors && j.errors[0] && j.errors[0].description) || "O Asaas recusou a operação (" + r.status + ").");
  return j;
}
const hojeBR = () => new Intl.DateTimeFormat("en-CA", {timeZone: R.fuso, year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());

export function cpfValido(cpf) {
  const d = String(cpf || "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const t of [9, 10]) {
    let s = 0; for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +d[t]) return false;
  }
  return true;
}
function pedido(b) {
  const plano = String(b.plano || ""), ciclo = b.ciclo === "anual" ? "anual" : "mensal", forma = b.forma === "pix" ? "pix" : "cartao";
  const p = PERM.plano(R, plano);
  if (!p || !p.precos) falha(400, "invalido", "Escolha o plano Pro ou Elite.");
  return {plano, ciclo, forma, cupom: b.cupom ? String(b.cupom).trim().toUpperCase().slice(0, 40) : null};
}
async function precoComCupom(ctx, ped) {
  let linha = null;
  if (ped.cupom) {
    [linha] = await db()`select * from public.cupons where codigo = ${ped.cupom} and plano = ${ped.plano} and ciclo = ${ped.ciclo}`;
    if (!linha) {
      const outros = await db()`select plano, ciclo from public.cupons where codigo = ${ped.cupom} and ativo`;
      falha(400, "cupom", outros.length ? `Este cupom vale para: ${outros.map((o) => o.plano + " " + o.ciclo).join(", ")}.` : "Cupom não encontrado.");
    }
    const [usado] = await db()`select 1 from public.cupons_usos where codigo = ${ped.cupom} and user_id = ${ctx.usuario.id}`;
    if (usado) falha(400, "cupom", "Você já usou este cupom.");
  }
  const r = PERM.aplicarCupom(R, ped.plano, ped.ciclo, ped.forma, linha);
  if (r.erro) falha(400, "cupom", r.erro);
  return r;
}

export async function validarCupom(ctx, b) {
  const ped = pedido(b), r = await precoComCupom(ctx, ped);
  return {...r, porMes: PERM.porMes(r.valor, ped.ciclo), plano: ped.plano, ciclo: ped.ciclo, forma: ped.forma, cupom: ped.cupom};
}

export async function assinar(ctx, b) {
  const ped = pedido(b), uid = ctx.usuario.id, sql = db();
  const [perfil] = await sql`select nome, cpf, asaas_cliente_id from public.perfis where user_id = ${uid}`;
  const [atual] = await sql`select plano, ciclo, status, valido_ate, asaas_assinatura_id from public.assinaturas where user_id = ${uid}`;
  if (atual && atual.status === "ativa" && atual.plano === ped.plano && atual.ciclo === ped.ciclo)
    falha(400, "invalido", "Você já tem este plano ativo.");
  const cpf = String(b.cpf || (perfil && perfil.cpf) || "").replace(/\D/g, "");
  if (!cpfValido(cpf)) falha(400, "cpf", "Informe um CPF válido. O Asaas exige o CPF para emitir a cobrança.");
  const nome = String(b.nome || (perfil && perfil.nome) || ctx.usuario.meta.nome || "").trim();
  if (nome.length < 3) falha(400, "invalido", "Informe seu nome completo.");
  const preco = await precoComCupom(ctx, ped);

  let cliente = perfil && perfil.asaas_cliente_id;
  if (!cliente) {
    const c = await chamar("POST", "/customers", {name: nome, cpfCnpj: cpf, email: ctx.usuario.email, externalReference: uid, notificationDisabled: false});
    cliente = c.id;
  }
  await sql`update public.perfis set cpf = ${cpf}, nome = ${nome}, asaas_cliente_id = ${cliente} where user_id = ${uid}`;

  const plano = PERM.plano(R, ped.plano);
  const sub = await chamar("POST", "/subscriptions", {
    customer: cliente, billingType: ped.forma === "pix" ? "PIX" : "CREDIT_CARD", value: preco.valor, nextDueDate: hojeBR(),
    cycle: ped.ciclo === "anual" ? "YEARLY" : "MONTHLY", description: `MegaCover ${plano.nome} ${ped.ciclo}`,
    externalReference: [uid, ped.plano, ped.ciclo, ped.forma, ped.cupom || ""].join("|"),
  });
  await sql`insert into public.pagamentos_pendentes (asaas_assinatura_id, user_id, plano, ciclo, forma, valor, cupom)
    values (${sub.id}, ${uid}, ${ped.plano}, ${ped.ciclo}, ${ped.forma}, ${preco.valor}, ${ped.cupom}) on conflict (asaas_assinatura_id) do nothing`;
  const pg = await chamar("GET", `/subscriptions/${sub.id}/payments`);
  const primeira = (pg.data || [])[0];
  if (!primeira || !primeira.invoiceUrl) falha(502, "pagamento", "O Asaas não devolveu o link de pagamento. Tente de novo.");
  return {url: primeira.invoiceUrl, valor: preco.valor, assinatura: sub.id};
}

export async function cancelar(ctx) {
  const [a] = await db()`select asaas_assinatura_id, status, valido_ate from public.assinaturas where user_id = ${ctx.usuario.id}`;
  if (!a || !a.asaas_assinatura_id || ["cancelada", "suspensa"].includes(a.status)) falha(400, "invalido", "Não há assinatura ativa para cancelar.");
  await chamar("DELETE", `/subscriptions/${a.asaas_assinatura_id}`);
  await db()`update public.assinaturas set status = 'cancelada', atualizado_em = now() where user_id = ${ctx.usuario.id}`;
  return {ok: true, validoAte: a.valido_ate};
}

/* ---------- webhooks ---------- */
function somar(data, ciclo) {
  const d = new Date(data + "T23:59:59-03:00");
  if (ciclo === "anual") d.setUTCFullYear(d.getUTCFullYear() + 1); else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}
const PAGO = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
const ESTORNO = ["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"];
const FIM = ["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"];

/* Processa um evento do Asaas. Idempotente: o mesmo evento (id) só é aplicado uma vez. */
export async function processarEvento(ev) {
  const sql = db(), id = ev && (ev.id || (ev.event + ":" + (ev.payment && ev.payment.id) + ":" + (ev.dateCreated || "")));
  if (!ev || !ev.event) return {ok: false, motivo: "evento inválido"};
  const novo = await sql`insert into public.eventos_asaas (id, tipo, payload) values (${id}, ${ev.event}, ${ev}::jsonb)
    on conflict (id) do nothing returning id`;
  if (!novo.length) return {ok: true, duplicado: true};
  try {
    const p = ev.payment || {}, subId = p.subscription || (ev.subscription && ev.subscription.id);
    let r = {ok: true, ignorado: true};
    if (subId && PAGO.includes(ev.event)) r = await ativar(subId, p);
    else if (subId && ev.event === "PAYMENT_OVERDUE")
      await sql`update public.assinaturas set status = 'atrasada', atualizado_em = now() where asaas_assinatura_id = ${subId} and status = 'ativa'`, r = {ok: true};
    else if (subId && ESTORNO.includes(ev.event))
      await sql`update public.assinaturas set status = 'suspensa', atualizado_em = now() where asaas_assinatura_id = ${subId}`, r = {ok: true};
    else if (subId && FIM.includes(ev.event))
      await sql`update public.assinaturas set status = 'cancelada', atualizado_em = now() where asaas_assinatura_id = ${subId} and status <> 'suspensa'`, r = {ok: true};
    await sql`update public.eventos_asaas set processado_em = now() where id = ${id}`;
    return r;
  } catch (e) {
    await sql`update public.eventos_asaas set erro = ${String(e.message || e).slice(0, 500)} where id = ${id}`;
    throw e;
  }
}

async function ativar(subId, p) {
  const sql = db();
  const [pend] = await sql`select * from public.pagamentos_pendentes where asaas_assinatura_id = ${subId}`;
  const [ass] = await sql`select * from public.assinaturas where asaas_assinatura_id = ${subId}`;
  const dados = pend || ass;
  if (!dados) return {ok: false, motivo: "assinatura desconhecida: " + subId};
  const venc = p.dueDate || new Date().toISOString().slice(0, 10), ate = somar(venc, dados.ciclo);
  const [antiga] = await sql`select asaas_assinatura_id from public.assinaturas where user_id = ${dados.user_id}`;
  await sql`insert into public.assinaturas (user_id, plano, ciclo, forma, status, valido_ate, valor, cupom, asaas_assinatura_id, atualizado_em)
    values (${dados.user_id}, ${dados.plano}, ${dados.ciclo}, ${dados.forma}, 'ativa', ${ate}, ${dados.valor}, ${dados.cupom}, ${subId}, now())
    on conflict (user_id) do update set plano = excluded.plano, ciclo = excluded.ciclo, forma = excluded.forma, status = 'ativa',
      valido_ate = greatest(excluded.valido_ate, case when public.assinaturas.asaas_assinatura_id = excluded.asaas_assinatura_id then public.assinaturas.valido_ate else excluded.valido_ate end),
      valor = excluded.valor, cupom = excluded.cupom, asaas_assinatura_id = excluded.asaas_assinatura_id, atualizado_em = now()`;
  if (pend) {
    await sql`delete from public.pagamentos_pendentes where asaas_assinatura_id = ${subId}`;
    if (pend.cupom) {
      const u = await sql`insert into public.cupons_usos (codigo, user_id, plano, ciclo) values (${pend.cupom}, ${pend.user_id}, ${pend.plano}, ${pend.ciclo})
        on conflict do nothing returning codigo`;
      if (u.length) await sql`update public.cupons set usos = usos + 1 where codigo = ${pend.cupom} and plano = ${pend.plano} and ciclo = ${pend.ciclo}`;
    }
    // troca de plano: a assinatura anterior deixa de cobrar
    if (antiga && antiga.asaas_assinatura_id && antiga.asaas_assinatura_id !== subId) {
      try { await chamar("DELETE", `/subscriptions/${antiga.asaas_assinatura_id}`); } catch (e) { console.error("não cancelou a assinatura anterior", e.message); }
    }
  }
  return {ok: true, ativada: true, validoAte: ate};
}
