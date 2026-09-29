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
  plano          text not null default 'mensal' check (plano in ('mensal', 'anual', 'cortesia')),
  status         text not null default 'ativa' check (status in ('ativa', 'cancelada', 'vencida')),
  valido_ate     timestamptz,
  pagamento_id   text,
  atualizado_em  timestamptz not null default now()
);
alter table public.assinaturas enable row level security;
drop policy if exists "assinatura: ler a propria" on public.assinaturas;
create policy "assinatura: ler a propria" on public.assinaturas for select to authenticated using (auth.uid() = user_id);

-- 3) Atalho para liberar alguém à mão (SQL Editor):
--    insert into public.assinaturas (user_id, plano, valido_ate)
--    select id, 'cortesia', now() + interval '30 days' from auth.users where email = 'pessoa@exemplo.com'
--    on conflict (user_id) do update set status = 'ativa', plano = excluded.plano, valido_ate = excluded.valido_ate, atualizado_em = now();
