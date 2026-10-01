// Asaas FALSO, só para testes: imita os endereços da API usados por _shared/asaas.js
// (clientes, assinaturas, cobranças) e uma "fatura" com botão que dispara o webhook de pagamento,
// como o Asaas faria. Nada aqui fala com o Asaas de verdade.
export const estado = {clientes: new Map(), assinaturas: new Map(), cobrancas: new Map(), chamadas: []};
let seq = 0;
const novoId = (p) => p + "_" + (++seq).toString().padStart(6, "0");
const hoje = () => new Date().toISOString().slice(0, 10);
const resp = (status, body, tipo) => new Response(typeof body === "string" ? body : JSON.stringify(body),
  {status, headers: {"content-type": tipo || "application/json", "Access-Control-Allow-Origin": "*"}});

/* base = prefixo onde o servidor local publica o falso (ex.: http://127.0.0.1:54400/asaas) */
export async function tratarAsaas(req, url, base, webhook) {
  const p = url.pathname.replace(/^\/asaas/, "");
  if (p.startsWith("/fatura/")) return fatura(req, p.split("/")[2], base, webhook);
  if (!req.headers.get("access_token")) return resp(401, {errors: [{description: "access_token ausente"}]});
  const corpo = req.method === "POST" ? await req.json() : null;
  estado.chamadas.push({metodo: req.method, caminho: p, corpo});
  if (req.method === "POST" && p === "/v3/customers") {
    const c = {id: novoId("cus"), ...corpo}; estado.clientes.set(c.id, c); return resp(200, c);
  }
  if (req.method === "POST" && p === "/v3/subscriptions") {
    if (!estado.clientes.has(corpo.customer)) return resp(400, {errors: [{description: "cliente inexistente"}]});
    const s = {id: novoId("sub"), status: "ACTIVE", ...corpo}; estado.assinaturas.set(s.id, s);
    const c = {id: novoId("pay"), subscription: s.id, customer: s.customer, value: s.value, billingType: s.billingType,
      dueDate: s.nextDueDate || hoje(), status: "PENDING", invoiceUrl: base + "/fatura/"};
    c.invoiceUrl += c.id; estado.cobrancas.set(c.id, c);
    return resp(200, s);
  }
  let m = p.match(/^\/v3\/subscriptions\/([^/]+)\/payments$/);
  if (m && req.method === "GET") return resp(200, {data: [...estado.cobrancas.values()].filter((c) => c.subscription === m[1])});
  m = p.match(/^\/v3\/subscriptions\/([^/]+)$/);
  if (m && req.method === "DELETE") {
    const s = estado.assinaturas.get(m[1]); if (!s) return resp(404, {errors: [{description: "não encontrada"}]});
    s.status = "INACTIVE"; s.deleted = true; return resp(200, {deleted: true, id: s.id});
  }
  return resp(404, {errors: [{description: "não simulado: " + req.method + " " + p}]});
}

/* página da fatura: "Pagar" envia PAYMENT_CONFIRMED ao webhook, como o Asaas faz depois do pagamento */
async function fatura(req, id, base, webhook) {
  const c = estado.cobrancas.get(id);
  if (!c) return resp(404, "fatura não encontrada", "text/plain");
  if (req.method === "POST") {
    c.status = "CONFIRMED";
    const r = await webhook({id: "evt_" + id, event: "PAYMENT_CONFIRMED", dateCreated: new Date().toISOString(),
      payment: {id: c.id, subscription: c.subscription, customer: c.customer, value: c.value, billingType: c.billingType, dueDate: c.dueDate, status: c.status}});
    return resp(200, {ok: r.status === 200});
  }
  const s = estado.assinaturas.get(c.subscription) || {};
  return resp(200, `<!doctype html><meta charset="utf-8"><title>Fatura (simulação)</title>
<body style="font:16px system-ui;max-width:420px;margin:60px auto">
<h1>Asaas (simulação)</h1><p id="desc">${s.description || ""}</p><p>Valor: <b id="valor">R$ ${Number(c.value).toFixed(2).replace(".", ",")}</b> · ${c.billingType}</p>
<button id="pagar" onclick="fetch(location.href,{method:'POST'}).then(r=>r.json()).then(j=>{document.getElementById('st').textContent=j.ok?'Pago':'Falhou'})">Pagar</button>
<p id="st">${c.status === "CONFIRMED" ? "Pago" : "Aguardando"}</p></body>`, "text/html; charset=utf-8");
}
