# Como ativar os planos do MegaCover

Tudo já está pronto no código. Falta criar as contas nos serviços, guardar as chaves nos **segredos do GitHub**
e virar uma chave no site. Nenhuma senha ou chave secreta vai dentro do código.

| Serviço | Para quê | Custo para começar |
|---|---|---|
| **Supabase** | contas, banco de dados e o servidor (API) que decide o que cada plano pode usar | grátis |
| **Asaas** | cobrança por Pix e cartão, mensal e anual | só taxa por cobrança paga |
| **Resend** | e-mails de resultado e de suporte | grátis até 3.000 e-mails/mês |
| **Cloudflare Pages** | hospedar o site (com o repositório privado) | grátis |

## Onde fica cada coisa

- `assets/regras.json`: **fonte única** de planos, preços, limites e textos da comparação. Mudou um preço ou limite?
  Edite só aqui e rode `node tools/sincronizar.mjs` (copia para o servidor). O GitHub publica sozinho.
- `assets/plano.js`: fase do site (`beta` / `assinatura`), chaves públicas do Supabase e contato.
- `supabase/migrations/`: tabelas e regras do banco. `supabase/functions/`: o servidor (API e webhook do Asaas).
- Cupons: tabela `cupons` no Supabase (ver item 8).

---

## 1. Supabase (contas e servidor)
1. Crie a conta em https://supabase.com → **New project**: nome `megacover`, região **South America (São Paulo)**.
   Defina a **senha do banco** e guarde (vai virar o segredo `SUPABASE_DB_PASSWORD`).
2. **Authentication → Providers → Email**: ativo, com **Confirm email** ligado.
3. **Authentication → URL Configuration**:
   - Site URL: `https://SEU-DOMINIO/`
   - Redirect URLs: `https://SEU-DOMINIO/conta.html` e `https://SEU-DOMINIO/conta.html?modo=nova-senha`
4. (Opcional) Login com Google: crie o ID do cliente OAuth no Google Cloud, cole a Callback URL do Supabase
   (**Authentication → Providers → Google**) e depois troque `loginGoogle: true` em `assets/plano.js`.
5. Anote: **Reference ID** (Settings → General), **Project URL** e chave **anon public** (Settings → API).
   Crie um **Access Token** em https://supabase.com/dashboard/account/tokens.

> Não precisa rodar SQL à mão: o GitHub cria as tabelas sozinho (item 5). Se você já tinha rodado o antigo
> `schema.sql`, tudo bem: a migração aproveita as tabelas existentes.

## 2. Asaas (pagamentos)
1. Crie a conta em https://www.asaas.com (CPF ou CNPJ). Para testar antes, use também o **sandbox**:
   https://sandbox.asaas.com (conta separada, dinheiro de mentira).
2. **Integrações → Chave de API**: gere a chave (vai virar `ASAAS_API_KEY`).
3. Invente um token longo e aleatório para o webhook (ex.: gere em https://www.uuidgenerator.net) → `ASAAS_WEBHOOK_TOKEN`.
4. **Integrações → Webhooks → Adicionar**:
   - URL: `https://REFERENCE-ID.supabase.co/functions/v1/asaas-webhook`
   - Token de autenticação: o mesmo `ASAAS_WEBHOOK_TOKEN`
   - Versão da API: v3 · Tipo de envio: **sequencial** · Fila ativa
   - Eventos: **Cobranças** (todos) e **Assinaturas** (todos)
5. Enquanto testa use `ASAAS_AMBIENTE = sandbox` com a chave do sandbox. Para cobrar de verdade troque para
   `producao` e a chave da conta real (e cadastre o webhook também na conta real).

## 3. Resend (e-mails)
1. Crie a conta em https://resend.com → **Domains → Add domain** com o seu domínio e copie os registros DNS que ele
   mostrar para o painel do Registro.br (ou da Cloudflare, se o DNS estiver lá). Espere ficar **Verified**.
2. **API Keys → Create** → `RESEND_API_KEY`.
3. Remetente (`EMAIL_REMETENTE`): `MegaCover <avisos@SEU-DOMINIO>`. E-mail que recebe o suporte (`SUPORTE_EMAIL`): o seu.

## 4. Segredos no GitHub
No repositório: **Settings → Secrets and variables → Actions → New repository secret**. Crie um por um:

| Segredo | Valor |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | token do item 1.5 |
| `SUPABASE_PROJECT_REF` | Reference ID do projeto |
| `SUPABASE_DB_PASSWORD` | senha do banco |
| `ASAAS_API_KEY` | chave do Asaas |
| `ASAAS_AMBIENTE` | `sandbox` (testes) ou `producao` |
| `ASAAS_WEBHOOK_TOKEN` | token inventado no item 2.3 |
| `RESEND_API_KEY` | chave do Resend |
| `EMAIL_PROVEDOR` | `resend` |
| `EMAIL_REMETENTE` | `MegaCover <avisos@SEU-DOMINIO>` |
| `SUPORTE_EMAIL` | seu e-mail de suporte |
| `TAREFA_TOKEN` | outro token longo inventado (protege a carga de resultados) |
| `MEGACOVER_API_URL` | `https://REFERENCE-ID.supabase.co/functions/v1/api` |

## 5. Publicar o servidor
**Actions → Publicar servidor → Run workflow.** Ele cria as tabelas, envia os segredos, publica as funções
`api` e `asaas-webhook` e termina testando `GET /config` (tem que dar HTTP 200).
Depois roda sozinho a cada mudança em `supabase/` ou em `assets/regras.json`.

## 6. Primeira carga dos resultados
**Actions → Atualizar resultados → Run workflow**, com o campo *Enviar o histórico inteiro* = `sim`.
Daí em diante ele roda duas vezes por dia: baixa os concursos, grava no servidor e manda os e-mails de resultado
para quem é Pro/Elite e tem jogos salvos daquela loteria.

## 7. Site no Cloudflare Pages (repositório privado)
1. Deixe o repositório **privado** no GitHub (Settings → General → Danger Zone → Change visibility).
2. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → escolha o repositório.
3. Build: **Framework** None · **Build command** `bash tools/montar_site.sh` · **Build output directory** `site`.
   (Só as páginas, `assets/` e `data/` vão ao ar; `supabase/` e `tools/` ficam de fora.)
4. **Custom domains**: adicione o seu domínio e siga as instruções de DNS.
5. Volte ao Supabase (item 1.3) e confira se as URLs usam o domínio final.

## 8. Lançar os planos
Em `assets/plano.js`:
```js
fase: "assinatura",
supabase: {url: "https://REFERENCE-ID.supabase.co", chave: "CHAVE-ANON-PUBLIC"},
```
A chave *anon* é pública por natureza (só faz o que as regras do banco permitem). **Nunca** coloque a chave
`service_role` no site. A partir daí: o painel pede login, toda conta nova ganha 7 dias de Elite, e cada
recurso é liberado ou bloqueado **pelo servidor** conforme `regras.json`.

**Cupons** (SQL Editor do Supabase):
```sql
-- preço fixo
insert into public.cupons (codigo, plano, ciclo, preco, descricao) values ('BLACK', 'elite', 'anual', 129.00, 'Black Friday');
-- ou percentual, com validade e limite de usos
insert into public.cupons (codigo, plano, ciclo, desconto_pct, valido_ate, max_usos) values ('AMIGO10', 'pro', 'mensal', 10, '2026-12-31', 100);
-- desativar
update public.cupons set ativo = false where codigo = 'LOTERICA';
```
O cupom `LOTERICA` já vem criado (Pro anual R$ 79, Elite anual R$ 149). Link para divulgar nas lotéricas:
`https://SEU-DOMINIO/planos.html?cupom=LOTERICA` (o cupom já vem preenchido no pagamento).

**Dar um plano de cortesia** (parceiros, imprensa):
```sql
insert into public.assinaturas (user_id, plano, ciclo, status, valido_ate)
select id, 'cortesia', 'anual', 'ativa', now() + interval '1 year' from auth.users where email = 'pessoa@exemplo.com'
on conflict (user_id) do update set plano = 'cortesia', status = 'ativa', valido_ate = excluded.valido_ate, atualizado_em = now();
```
**Estender o teste de alguém:** `update public.perfis set teste_ate = now() + interval '7 days' where user_id = (select id from auth.users where email = '...');`

---

## 9. Como testar cada plano (no ar, com o Asaas em sandbox)
Crie quatro contas com e-mails seus (ex.: `voce+gratis@gmail.com`, `voce+pro@...`).

**Teste Elite (conta nova):** no topo do painel aparece "Elite grátis · faltam 7 dias". Clique nele: lista o que você perde ao fim
do teste. Tudo liberado: 9 loterias, otimizadores (20/dia), Monte Carlo (10/dia), PDF completo, 2 aparelhos.

**Grátis:** no SQL Editor, encerre o teste: `update public.perfis set teste_ate = now() where user_id = (select id from auth.users where email = 'voce+gratis@gmail.com');`
Confira: só Mega-Sena e Lotofácil (as outras mostram cadeado); gerador até 10 jogos (pedir 11 abre a oferta do Pro);
estratégias ponderadas e filtros com cadeado; estatísticas básicas e últimos 50 concursos; gráficos, simulador e PDF bloqueados;
2 fechamentos de exemplo; até 20 jogos salvos; abrir a conta em outro navegador derruba o primeiro ("conta aberta em outro aparelho").

**Pro:** encerre o teste da conta e assine o Pro em **Planos**. No sandbox, pague com um dos cartões de teste da documentação
do Asaas (docs.asaas.com, "Testando pagamentos") ou escolha Pix e, no painel do sandbox, abra a cobrança e confirme o recebimento.
Em segundos (quando o webhook chega) a conta vira Pro.
Confira: 9 loterias, histórico completo, gerador sem limite com filtros, todos os fechamentos, CSV e PDF simples,
aviso de resultado por e-mail (Minha conta), suporte por e-mail com prazo de 48h. Otimizadores e Monte Carlo pedem o Elite.

**Elite:** assine o Elite (ou passe do Pro para o Elite: a assinatura antiga é cancelada no Asaas sozinha).
Confira: otimizadores até 20/dia e Monte Carlo até 10/dia (o 21º/11º mostra o limite, que volta à meia-noite de Brasília),
PDF completo, 2 aparelhos ao mesmo tempo (o 3º derruba o mais antigo), suporte com etiqueta `[ELITE · PRIORITÁRIO]`.

**Cancelamento e atraso:** em Minha conta, *Cancelar assinatura*: o plano continua até o fim do período pago e não renova.
Pagamento atrasado: 3 dias de tolerância, depois a conta volta ao Grátis até pagar. Estorno ou chargeback: volta ao Grátis na hora.

**Prova de que o bloqueio é do servidor:** com a conta Grátis logada, no console do navegador:
```js
MC_API.post("otimizar", {loteria: "megasena", jogos: [[1,2,3,4,5,6]]}).catch(e => console.log(e.status, e.message))
```
Resposta: `403 Algoritmo genético e simulated annealing faz parte do plano Elite.`

## 10. Testes automáticos (para quem mexer no código)
Precisam de Postgres e Deno locais:
```
PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh && deno test -A supabase/tests/api_test.js     # bloqueios por plano
PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh && deno test -A supabase/tests/asaas_test.js   # pagamentos e webhooks
PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh && deno test -A supabase/tests/avisos_test.js  # e-mails
```
`supabase/tests/servidor_local.js` sobe um Supabase e um Asaas de mentira na porta 54400 para testar o site inteiro no navegador.

## Segurança
- Senhas ficam só no Supabase (hash bcrypt). Dados de cartão ficam só no Asaas. O MegaCover guarda nome, e-mail e CPF.
- Toda verificação de plano e de limite acontece no servidor; o site só mostra os avisos.
- Cada pessoa só lê os próprios dados (RLS). As funções que mudam plano e contadores não podem ser chamadas pelo navegador.
- Chaves secretas só nos segredos do GitHub/Supabase. Se alguma vazar, gere outra no serviço e atualize o segredo.
