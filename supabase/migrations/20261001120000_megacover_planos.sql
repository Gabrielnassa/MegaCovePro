-- MegaCover Pro Elite · planos, limites, sessões, jogos salvos, pagamentos (Asaas) e e-mails.
-- Aplicada automaticamente pelo workflow .github/workflows/supabase.yml (supabase db push).
-- Regras comerciais (preços, limites, dias de teste) NÃO ficam aqui: ficam em assets/regras.json
-- e chegam às funções como parâmetro. Este arquivo só guarda dados e operações atômicas.

-- ============================== tabelas ==============================
create table if not exists public.perfis (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  nome               text,
  cpf                text,
  teste_ate          timestamptz,          -- nulo = criado_em da conta + dias do regras.json; preenchido = prazo manual
  asaas_cliente_id   text,
  aviso_email        boolean not null default true,
  criado_em          timestamptz not null default now()
);

create table if not exists public.assinaturas (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  plano                text not null check (plano in ('pro', 'elite', 'cortesia')),
  ciclo                text not null default 'mensal' check (ciclo in ('mensal', 'anual')),
  forma                text not null default 'cartao' check (forma in ('cartao', 'pix', 'manual')),
  status               text not null default 'pendente' check (status in ('pendente', 'ativa', 'atrasada', 'suspensa', 'cancelada')),
  valido_ate           timestamptz,
  valor                numeric(10, 2),
  cupom                text,
  asaas_assinatura_id  text unique,
  atualizado_em        timestamptz not null default now()
);
-- versões anteriores do schema (planos mensal/anual) são convertidas
alter table public.assinaturas add column if not exists forma text not null default 'cartao';
alter table public.assinaturas add column if not exists valor numeric(10, 2);
alter table public.assinaturas add column if not exists cupom text;
alter table public.assinaturas add column if not exists asaas_assinatura_id text;
alter table public.assinaturas add column if not exists ciclo text not null default 'mensal';
alter table public.assinaturas drop column if exists pagamento_id;
alter table public.assinaturas drop constraint if exists assinaturas_status_check;
alter table public.assinaturas add constraint assinaturas_status_check check (status in ('pendente', 'ativa', 'atrasada', 'suspensa', 'cancelada'));

create table if not exists public.cupons (
  codigo        text not null,
  plano         text not null check (plano in ('pro', 'elite')),
  ciclo         text not null check (ciclo in ('mensal', 'anual')),
  forma         text check (forma in ('cartao', 'pix')),         -- nulo = qualquer forma
  preco         numeric(10, 2),                                  -- preço final, ou
  desconto_pct  numeric(5, 2),                                   -- desconto percentual
  descricao     text,
  valido_ate    timestamptz,
  max_usos      int,
  usos          int not null default 0,
  ativo         boolean not null default true,
  primary key (codigo, plano, ciclo),
  check (preco is not null or desconto_pct is not null)
);
create table if not exists public.cupons_usos (
  codigo     text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  plano      text not null,
  ciclo      text not null,
  criado_em  timestamptz not null default now(),
  primary key (codigo, user_id)
);

create table if not exists public.uso_diario (
  user_id  uuid not null references auth.users (id) on delete cascade,
  recurso  text not null,
  dia      date not null,
  qtd      int not null default 0,
  primary key (user_id, recurso, dia)
);

create table if not exists public.sessoes (
  session_id  uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  agente      text,
  criado_em   timestamptz not null default now(),
  ultimo_uso  timestamptz not null default now(),
  revogada    boolean not null default false,
  revogada_em timestamptz
);
create index if not exists sessoes_user on public.sessoes (user_id, revogada, criado_em);

create table if not exists public.jogos_salvos (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  loteria    text not null,
  dezenas    jsonb not null,
  extra      text,
  nome       text,
  criado_em  timestamptz not null default now()
);
create index if not exists jogos_salvos_user on public.jogos_salvos (user_id, loteria);

create table if not exists public.concursos (
  loteria   text not null,
  concurso  int not null,
  data      text not null,
  dezenas   jsonb not null,
  extra     jsonb,
  primary key (loteria, concurso)
);

-- Cobrança iniciada e ainda não paga: só vira assinatura quando o Asaas confirmar o pagamento.
create table if not exists public.pagamentos_pendentes (
  asaas_assinatura_id  text primary key,
  user_id              uuid not null references auth.users (id) on delete cascade,
  plano                text not null,
  ciclo                text not null,
  forma                text not null,
  valor                numeric(10, 2) not null,
  cupom                text,
  criado_em            timestamptz not null default now()
);

create table if not exists public.eventos_asaas (
  id            text primary key,
  tipo          text not null,
  payload       jsonb not null,
  recebido_em   timestamptz not null default now(),
  processado_em timestamptz,
  erro          text
);

create table if not exists public.emails_enviados (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users (id) on delete set null,
  tipo          text not null,
  chave         text unique,                -- evita e-mail repetido (ex.: resultado:megasena:3065:<user>)
  destinatario  text not null,
  assunto       text not null,
  status        text not null default 'enviado',
  erro          text,
  criado_em     timestamptz not null default now()
);

create table if not exists public.avisos_resultado (
  loteria          text primary key,
  ultimo_concurso  int not null
);

create table if not exists public.suporte_mensagens (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  plano       text not null,
  prioritario boolean not null default false,
  assunto     text not null,
  mensagem    text not null,
  criado_em   timestamptz not null default now()
);

-- ============================== RLS ==============================
-- Tudo passa pela API (service role). O navegador só lê o próprio perfil, assinatura e jogos.
alter table public.perfis            enable row level security;
alter table public.assinaturas       enable row level security;
alter table public.cupons            enable row level security;
alter table public.cupons_usos       enable row level security;
alter table public.uso_diario        enable row level security;
alter table public.sessoes           enable row level security;
alter table public.jogos_salvos      enable row level security;
alter table public.concursos         enable row level security;
alter table public.eventos_asaas     enable row level security;
alter table public.pagamentos_pendentes enable row level security;
alter table public.emails_enviados   enable row level security;
alter table public.avisos_resultado  enable row level security;
alter table public.suporte_mensagens enable row level security;

drop policy if exists "perfil: ler o proprio" on public.perfis;
create policy "perfil: ler o proprio" on public.perfis for select to authenticated using (auth.uid() = user_id);
drop policy if exists "perfil: editar o proprio" on public.perfis;
drop policy if exists "assinatura: ler a propria" on public.assinaturas;
create policy "assinatura: ler a propria" on public.assinaturas for select to authenticated using (auth.uid() = user_id);
drop policy if exists "jogos: ler os proprios" on public.jogos_salvos;
create policy "jogos: ler os proprios" on public.jogos_salvos for select to authenticated using (auth.uid() = user_id);
-- sem políticas nas demais tabelas: só a API (service role) acessa.

-- ============================== funções ==============================
create or replace function public.hoje_brasilia() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- perfil criado junto com a conta
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (user_id, nome) values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users for each row execute function public.criar_perfil();

-- Plano efetivo: assinatura paga válida > teste Elite no prazo > grátis.
-- dias_teste e tolerancia vêm do regras.json (passados pela API).
create or replace function public.plano_efetivo(uid uuid, dias_teste int, tolerancia_dias int, plano_teste text default 'elite')
returns table (plano text, origem text, teste_ate timestamptz, valido_ate timestamptz, status text)
language plpgsql stable security definer set search_path = public as $$
declare a record; t timestamptz;
begin
  select coalesce(p.teste_ate, u.created_at + make_interval(days => dias_teste)) into t
    from auth.users u left join public.perfis p on p.user_id = u.id where u.id = uid;
  select * into a from public.assinaturas s where s.user_id = uid;
  if a.user_id is not null and a.status in ('ativa', 'atrasada', 'cancelada')
     and (a.valido_ate is null or a.valido_ate + make_interval(days => case when a.status = 'atrasada' then tolerancia_dias else 0 end) > now()) then
    return query select case when a.plano = 'cortesia' then 'elite' else a.plano end, 'assinatura'::text, t, a.valido_ate, a.status;
  elsif t is not null and t > now() then
    return query select plano_teste, 'teste'::text, t, null::timestamptz, null::text;
  else
    return query select 'gratis'::text, 'gratis'::text, t, a.valido_ate, a.status;
  end if;
end $$;

-- Contador diário atômico (zera à meia-noite de Brasília porque a chave é a data local).
-- Devolve o novo total, ou -1 se o limite já foi atingido.
create or replace function public.consumir_uso(uid uuid, rec text, limite int)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if limite is not null and limite <= 0 then return -1; end if;
  insert into public.uso_diario as u (user_id, recurso, dia, qtd) values (uid, rec, public.hoje_brasilia(), 1)
  on conflict (user_id, recurso, dia) do update set qtd = u.qtd + 1
    where limite is null or u.qtd < limite
  returning u.qtd into n;
  return coalesce(n, -1);
end $$;

create or replace function public.uso_hoje(uid uuid)
returns table (recurso text, qtd int) language sql stable security definer set search_path = public as $$
  select recurso, qtd from public.uso_diario where user_id = uid and dia = public.hoje_brasilia()
$$;

-- Sessões: registra a sessão e, acima do limite, derruba as mais antigas (também no Supabase Auth).
create or replace function public.registrar_sessao(uid uuid, sid uuid, limite int, ag text)
returns setof uuid language plpgsql security definer set search_path = public, auth as $$
declare velhas uuid[];
begin
  perform pg_advisory_xact_lock(hashtext('sessao:' || uid::text));
  insert into public.sessoes (session_id, user_id, agente) values (sid, uid, ag)
  on conflict (session_id) do update set ultimo_uso = now()
    where public.sessoes.revogada = false;
  select array_agg(session_id) into velhas from (
    select session_id from public.sessoes where user_id = uid and revogada = false
    order by criado_em desc offset greatest(limite, 1)) x;
  if velhas is not null then
    update public.sessoes set revogada = true, revogada_em = now() where session_id = any (velhas);
    -- também derruba no Auth; se o projeto não permitir, a tabela sessoes já bloqueia a sessão na API
    begin
      delete from auth.sessions where id = any (velhas);
    exception when insufficient_privilege then null;
    end;
    return query select unnest(velhas);
  end if;
end $$;

-- Jogos salvos com limite (verificado com trava, sem corrida entre abas).
create or replace function public.salvar_jogo(uid uuid, lot text, dz jsonb, ex text, nm text, limite int)
returns bigint language plpgsql security definer set search_path = public as $$
declare n int; novo bigint;
begin
  perform pg_advisory_xact_lock(hashtext('jogos:' || uid::text));
  if limite is not null then
    select count(*) into n from public.jogos_salvos where user_id = uid;
    if n >= limite then return null; end if;
  end if;
  insert into public.jogos_salvos (user_id, loteria, dezenas, extra, nome) values (uid, lot, dz, ex, nm) returning id into novo;
  return novo;
end $$;

-- Contexto de cada requisição da API numa só ida ao banco: plano efetivo + sessão.
-- sessoes_por_plano = {"gratis":1,"pro":1,"elite":2} (vem do regras.json).
-- sessao: 'ok' | 'encerrada' (derrubada por login em outro aparelho).
create or replace function public.contexto_api(uid uuid, sid uuid, dias_teste int, tolerancia_dias int, plano_teste text, sessoes_por_plano jsonb, ag text)
returns table (plano text, origem text, teste_ate timestamptz, valido_ate timestamptz, status text, sessao text)
language plpgsql security definer set search_path = public as $$
declare p record; lim int; rev boolean;
begin
  select * into p from public.plano_efetivo(uid, dias_teste, tolerancia_dias, plano_teste);
  if sid is null then
    return query select p.plano, p.origem, p.teste_ate, p.valido_ate, p.status, 'ok'::text; return;
  end if;
  select s.revogada into rev from public.sessoes s where s.session_id = sid;
  if rev then
    return query select p.plano, p.origem, p.teste_ate, p.valido_ate, p.status, 'encerrada'::text; return;
  end if;
  lim := coalesce((sessoes_por_plano ->> p.plano)::int, 1);
  perform public.registrar_sessao(uid, sid, lim, ag);
  return query select p.plano, p.origem, p.teste_ate, p.valido_ate, p.status, 'ok'::text;
end $$;

-- As funções acima são só para a API (service role).
revoke all on function public.plano_efetivo(uuid, int, int, text) from public, anon, authenticated;
revoke all on function public.consumir_uso(uuid, text, int) from public, anon, authenticated;
revoke all on function public.uso_hoje(uuid) from public, anon, authenticated;
revoke all on function public.registrar_sessao(uuid, uuid, int, text) from public, anon, authenticated;
revoke all on function public.salvar_jogo(uuid, text, jsonb, text, text, int) from public, anon, authenticated;
revoke all on function public.contexto_api(uuid, uuid, int, int, text, jsonb, text) from public, anon, authenticated;

-- ============================== dados iniciais ==============================
-- Cupom de lançamento para clientes das lotéricas (edite ou desative pelo painel do Supabase).
insert into public.cupons (codigo, plano, ciclo, preco, descricao)
values ('LOTERICA', 'pro', 'anual', 79.00, 'Lançamento para clientes das lotéricas'),
       ('LOTERICA', 'elite', 'anual', 149.00, 'Lançamento para clientes das lotéricas')
on conflict (codigo, plano, ciclo) do nothing;
