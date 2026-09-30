-- MegaCover Pro Elite · banco no Supabase
-- Cole tudo no SQL Editor do projeto (Supabase → SQL Editor → New query → Run).
-- O Supabase já cuida das contas (e-mail + senha com hash) na tabela auth.users.
-- Aqui criamos só o que o site precisa: o perfil e a assinatura de cada pessoa.

-- 1) Perfil (nome), criado automaticamente quando alguém se cadastra
create table if not exists public.perfis (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  nome        text,
  criado_em   timestamptz not null default now()
);
alter table public.perfis enable row level security;
drop policy if exists "perfil: ler o proprio" on public.perfis;
create policy "perfil: ler o proprio" on public.perfis for select to authenticated using (auth.uid() = user_id);
drop policy if exists "perfil: editar o proprio" on public.perfis;
create policy "perfil: editar o proprio" on public.perfis for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (user_id, nome) values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users for each row execute function public.criar_perfil();

-- 2) Assinatura: uma linha por pessoa. Quem tem status 'ativa' (e valido_ate no futuro ou nulo) é PRO.
--    Só o painel do Supabase (ou o webhook do pagamento, com a service_role key) cria/edita linhas.
--    O site apenas lê a própria linha — por isso não há policy de insert/update para usuários.
create table if not exists public.assinaturas (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  plano          text not null default 'pro' check (plano in ('pro', 'elite', 'cortesia')),
  ciclo          text not null default 'mensal' check (ciclo in ('mensal', 'anual')),
  status         text not null default 'ativa' check (status in ('ativa', 'cancelada', 'vencida')),
  valido_ate     timestamptz,
  pagamento_id   text,
  atualizado_em  timestamptz not null default now()
);
-- quem já tinha criado a tabela na versão anterior (planos mensal/anual) roda estas linhas também:
alter table public.assinaturas add column if not exists ciclo text not null default 'mensal';
alter table public.assinaturas drop constraint if exists assinaturas_plano_check;
update public.assinaturas set plano = 'pro' where plano in ('mensal', 'anual');
alter table public.assinaturas add constraint assinaturas_plano_check check (plano in ('pro', 'elite', 'cortesia'));
alter table public.assinaturas enable row level security;
drop policy if exists "assinatura: ler a propria" on public.assinaturas;
create policy "assinatura: ler a propria" on public.assinaturas for select to authenticated using (auth.uid() = user_id);

-- 3) Atalho para liberar alguém à mão (SQL Editor):
--    insert into public.assinaturas (user_id, plano, ciclo, valido_ate)
--    select id, 'pro', 'mensal', now() + interval '30 days' from auth.users where email = 'pessoa@exemplo.com'
--    on conflict (user_id) do update set status = 'ativa', plano = excluded.plano, ciclo = excluded.ciclo, valido_ate = excluded.valido_ate, atualizado_em = now();
--    (plano: 'pro', 'elite' ou 'cortesia' = tudo liberado; ciclo: 'mensal' ou 'anual')
