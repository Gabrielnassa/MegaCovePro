# Login e assinatura com Supabase

O site já vem com a tela de conta (`conta.html`), o cliente oficial do Supabase e a leitura da assinatura.
Falta só criar o projeto e colar duas chaves. Leva uns 10 minutos.

## 1. Criar o projeto
1. Entre em https://supabase.com e crie uma conta (o plano gratuito basta para começar).
2. **New project** → nome `megacover`, região **South America (São Paulo)**, defina a senha do banco e guarde.
3. Aguarde o projeto ficar pronto (1 a 2 minutos).

## 2. Criar as tabelas
1. Menu **SQL Editor** → **New query**.
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.

## 3. Configurar o login por e-mail
1. **Authentication → Providers → Email**: deixe ativo. Mantenha **Confirm email** ligado (evita contas com e-mail falso).
2. **Authentication → URL Configuration**:
   - Site URL: `https://gabrielnassa.github.io/MegaCovePro/`
   - Redirect URLs: adicione `https://gabrielnassa.github.io/MegaCovePro/conta.html` e `https://gabrielnassa.github.io/MegaCovePro/conta.html?modo=nova-senha`
3. (Opcional) **Authentication → Email Templates**: traduza os e-mails de confirmação e de nova senha para português.

## 4. Colar as chaves no site
1. **Settings → API**: copie a **Project URL** e a chave **anon public**.
2. Em `assets/plano.js`, preencha:
   ```js
   supabase: {url: "https://xxxx.supabase.co", chave: "eyJ..."},
   ```
   A chave *anon* pode ficar pública: ela só permite o que as políticas de segurança (RLS) liberam.
   **Nunca** coloque a chave `service_role` no site.
3. Suba o `plano.js` para o GitHub. Pronto: o botão **Entrar** aparece no site e no painel.

## 4b. Login com Google (opcional, recomendado)
1. No Google Cloud Console (console.cloud.google.com) crie um projeto → **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth** (tipo "Aplicativo da Web").
2. Em "URIs de redirecionamento autorizados" cole a **Callback URL** que o Supabase mostra em **Authentication → Providers → Google**.
3. Copie o Client ID e o Client Secret para essa tela do Supabase e ative o Google.
4. Em `assets/plano.js`, troque `loginGoogle: false` por `loginGoogle: true`. O botão "Continuar com Google" aparece na tela de login.

## 5. Planos, preços e pagamento
Os planos (Grátis, Pro e Elite), os preços mensal e anual e os links de pagamento ficam em `assets/plano.js`, na lista `planos`.
Para cada plano pago preencha `checkout: {mensal: "link", anual: "link"}` com o link de pagamento (Mercado Pago, Stripe…).
O site envia o e-mail e o id da conta junto no link (`prefilled_email` e `client_reference_id`), o que o Stripe usa para identificar quem pagou.

## 5b. Liberar um plano para alguém
Enquanto não houver pagamento automático, libere pelo **SQL Editor**:
```sql
insert into public.assinaturas (user_id, plano, ciclo, valido_ate)
select id, 'pro', 'mensal', now() + interval '30 days' from auth.users where email = 'pessoa@exemplo.com'
on conflict (user_id) do update set status = 'ativa', plano = excluded.plano, ciclo = excluded.ciclo, valido_ate = excluded.valido_ate, atualizado_em = now();
```
Para cancelar: `update public.assinaturas set status = 'cancelada' where user_id = (select id from auth.users where email = '...');`

## 6. Quando sair do Beta
Em `assets/plano.js` troque `fase: "beta"` por `fase: "assinatura"`. Cada recurso passa a pedir o plano mínimo definido em `recursos` (Pro ou Elite) e, se quiser exigir conta para abrir o painel,
`loginObrigatorio: true`. Os recursos PRO passam a pedir assinatura ativa.

## 7. Pagamento automático (próximo passo)
Mercado Pago (Pix e cartão, sem CNPJ obrigatório) ou Stripe. O fluxo é: link de pagamento com o e-mail da pessoa →
webhook (uma Edge Function do Supabase) recebe o aviso de pagamento aprovado → insere/renova a linha em `assinaturas`.
Isso pode ser feito depois, sem mudar nada do que já está no site.

## Segurança
- Senhas nunca chegam ao site nem ao GitHub: o Supabase guarda apenas o hash (bcrypt) e cuida de confirmação e recuperação por e-mail.
- Cada pessoa só lê a própria linha de perfil e assinatura (RLS). Ninguém consegue se dar PRO pelo navegador.
- O site continua funcionando se o Supabase estiver fora do ar: a última assinatura lida fica em cache no navegador.
