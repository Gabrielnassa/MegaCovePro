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

## O que você faz × o que é automático

Você só **cria as contas** (exigem seu nome, documentos e aceite de termos) e **cola 6 segredos no GitHub**.
O workflow **Publicar servidor** faz o resto sozinho, e pode ser rodado quantas vezes quiser:

| Automático (workflow) | Antes era à mão |
|---|---|
| cria as tabelas e regras do banco | rodar SQL no Supabase |
| publica as funções `api` e `asaas-webhook` e envia os segredos a elas | |
| configura o login: URLs do site, confirmação de e-mail, senha mínima de 8, e-mails de cadastro/nova senha **em português** e envio pelo Resend (SMTP) | Authentication → URL Configuration / Templates / SMTP |
| cadastra o domínio no Resend e **lista os registros de DNS** a criar (no resumo da execução) | |
| cadastra o **webhook** no Asaas com token, eventos e envio sequencial | Integrações → Webhooks |
| calcula os tokens internos (`TAREFA_TOKEN`, `ASAAS_WEBHOOK_TOKEN`) a partir da senha do banco | inventar tokens |
| preenche a URL e a chave pública do Supabase em `assets/plano.js` | copiar e colar chaves |

## 1. Supabase (5 minutos)
1. Crie a conta em https://supabase.com → **New project**: nome `megacover`, região **South America (São Paulo)**.
   Clique em *Generate a password* e **guarde a senha** (vira o segredo `SUPABASE_DB_PASSWORD`).
2. Copie o **Reference ID**: é o código no endereço do painel, `supabase.com/dashboard/project/ESTE-CODIGO`.
3. Gere um **Access Token** em https://supabase.com/dashboard/account/tokens.

## 2. Asaas (pagamentos)
1. Comece pelo **sandbox** (aprovação na hora, dinheiro de mentira): https://sandbox.asaas.com → crie a conta →
   **Integrações → Chave de API** → gerar. Essa é a `ASAAS_API_KEY` dos testes.
2. Em paralelo, abra a conta real em https://www.asaas.com (a análise dos documentos leva alguns dias). Se pedirem a
   descrição do negócio, use:
   > *Software online (SaaS) de estatística e organização de jogos das Loterias CAIXA, vendido por assinatura mensal ou anual.
   > Não recebemos, intermediamos nem registramos apostas: o cliente aposta por conta própria nas lotéricas ou nos canais oficiais da CAIXA.*
   > Atividade (CNPJ): CNAE **6203-1/00**, desenvolvimento e licenciamento de programas de computador não customizáveis.
3. Quando a conta real for aprovada: troque o segredo `ASAAS_API_KEY` pela chave real, crie `ASAAS_AMBIENTE` = `producao`
   e rode o workflow de novo (o webhook da conta real é cadastrado sozinho).

## 3. Resend (e-mails)
1. Crie a conta em https://resend.com → **API Keys → Create API Key** com permissão **Full access** → `RESEND_API_KEY`.
   (O domínio é cadastrado pelo workflow, não precisa fazer nada em *Domains*.)

## 4. Segredos no GitHub (6)
No repositório: **Settings → Secrets and variables → Actions → New repository secret**.

| Segredo | Valor |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | token do item 1.3 |
| `SUPABASE_PROJECT_REF` | Reference ID |
| `SUPABASE_DB_PASSWORD` | senha do banco |
| `DOMINIO` | `megacover.com.br` (só o domínio, sem https) |
| `ASAAS_API_KEY` | chave do Asaas (sandbox primeiro) |
| `RESEND_API_KEY` | chave do Resend |

Opcionais: `ASAAS_AMBIENTE` (`producao` ao lançar), `SUPORTE_EMAIL` (padrão `suporte@DOMINIO`),
`EMAIL_REMETENTE` (padrão `MegaCover <avisos@DOMINIO>`).

## 5. Rodar o "Publicar servidor"
**Actions → Publicar servidor → Run workflow.** No fim, abra a execução e veja o **resumo**:
- **E-mail (Resend):** se aparecer "aguardando DNS", crie os registros da tabela no DNS do domínio
  (Cloudflare → DNS → Records → Add record, com o *proxy* desligado/nuvem cinza) e rode o workflow de novo até ficar ✅.
- **Caixa de suporte:** no Cloudflare, **Email → Email Routing** → crie `suporte@DOMINIO` encaminhando para o seu Gmail.
- O último passo testa o servidor (`GET config → HTTP 200`).
- Avisos amarelos (⚠) dizem exatamente o que faltou, caso algum serviço recuse a configuração automática.

## 6. Primeira carga dos resultados
**Actions → Atualizar resultados → Run workflow**, com *Enviar o histórico inteiro* = `sim`.
Depois ele roda sozinho duas vezes por dia: grava os concursos no servidor e envia os e-mails de resultado.

## 7. Site no Cloudflare Pages (repositório privado)
1. Deixe o repositório **privado** no GitHub (Settings → General → Danger Zone → Change visibility).
2. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → escolha o repositório.
3. Build: **Framework** None · **Build command** `bash tools/montar_site.sh` · **Build output directory** `site`.
   (Só as páginas, `assets/` e `data/` vão ao ar; `supabase/` e `tools/` ficam de fora.)
4. **Custom domains**: adicione o seu domínio e siga as instruções de DNS.

## 8. Lançar os planos
Em `assets/plano.js` troque `fase: "beta"` por `fase: "assinatura"` (a URL e a chave pública do Supabase já foram
preenchidas pelo workflow). A chave *anon* é pública por natureza (só faz o que as regras do banco permitem). **Nunca** coloque a chave
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
deno test -A supabase/tests/ferramentas_test.js   # configuração automática (Asaas, Resend, chaves do site)
```
`supabase/tests/servidor_local.js` sobe um Supabase e um Asaas de mentira na porta 54400 para testar o site inteiro no navegador.

## Segurança
- Senhas ficam só no Supabase (hash bcrypt). Dados de cartão ficam só no Asaas. O MegaCover guarda nome, e-mail e CPF.
- Toda verificação de plano e de limite acontece no servidor; o site só mostra os avisos.
- Cada pessoa só lê os próprios dados (RLS). As funções que mudam plano e contadores não podem ser chamadas pelo navegador.
- Chaves secretas só nos segredos do GitHub/Supabase. Se alguma vazar, gere outra no serviço e atualize o segredo.
