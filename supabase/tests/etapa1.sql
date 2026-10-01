\set ON_ERROR_STOP on
-- usuários de teste
insert into auth.users (id, email, created_at, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000001','novo@t.com', now() - interval '2 days', '{"nome":"Novo"}'),
 ('00000000-0000-0000-0000-000000000002','vencido@t.com', now() - interval '8 days', '{}'),
 ('00000000-0000-0000-0000-000000000003','pro@t.com', now() - interval '40 days', '{}'),
 ('00000000-0000-0000-0000-000000000004','atraso@t.com', now() - interval '90 days', '{}'),
 ('00000000-0000-0000-0000-000000000005','cancelado@t.com', now() - interval '90 days', '{}'),
 ('00000000-0000-0000-0000-000000000006','suspenso@t.com', now() - interval '90 days', '{}');
insert into public.assinaturas (user_id, plano, ciclo, status, valido_ate) values
 ('00000000-0000-0000-0000-000000000003','pro','mensal','ativa', now() + interval '10 days'),
 ('00000000-0000-0000-0000-000000000004','elite','mensal','atrasada', now() - interval '2 days'),
 ('00000000-0000-0000-0000-000000000005','pro','anual','cancelada', now() + interval '100 days'),
 ('00000000-0000-0000-0000-000000000006','elite','anual','suspensa', now() + interval '100 days');
select u.email, p.plano, p.origem, round(extract(epoch from (p.teste_ate - now()))/86400) as dias_teste
from auth.users u, lateral public.plano_efetivo(u.id, 7, 3) p order by u.email;
-- atraso além da tolerância
update public.assinaturas set valido_ate = now() - interval '4 days' where user_id = '00000000-0000-0000-0000-000000000004';
select 'atraso 4 dias' caso, plano from public.plano_efetivo('00000000-0000-0000-0000-000000000004', 7, 3);
-- perfil criado pelo gatilho
select 'perfis criados', count(*) from public.perfis;
-- contador diário
select 'uso', public.consumir_uso('00000000-0000-0000-0000-000000000001','montecarlo',2),
              public.consumir_uso('00000000-0000-0000-0000-000000000001','montecarlo',2),
              public.consumir_uso('00000000-0000-0000-0000-000000000001','montecarlo',2),
              public.consumir_uso('00000000-0000-0000-0000-000000000003','montecarlo',0);
update public.uso_diario set dia = dia - 1;  -- simula o dia seguinte
select 'novo dia', public.consumir_uso('00000000-0000-0000-0000-000000000001','montecarlo',2);
-- sessões: limite 1, a mais antiga cai
insert into auth.sessions (id, user_id) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003'),('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003');
select 'derrubadas 1a', count(*) from public.registrar_sessao('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',1,'a');
select pg_sleep(0.01);
select 'derrubadas 2a', array_agg(x) from public.registrar_sessao('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002',1,'b') x;
select 'auth.sessions restantes', array_agg(id) from auth.sessions;
select 'sessao revogada nao volta', count(*) from public.registrar_sessao('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',1,'a');
select 'revogada?', revogada from public.sessoes where session_id='10000000-0000-0000-0000-000000000001';
-- jogos salvos com limite 2
select 'salvar', public.salvar_jogo('00000000-0000-0000-0000-000000000001','megasena','[1,2,3,4,5,6]',null,'a',2),
                 public.salvar_jogo('00000000-0000-0000-0000-000000000001','megasena','[1,2,3,4,5,7]',null,'b',2),
                 public.salvar_jogo('00000000-0000-0000-0000-000000000001','megasena','[1,2,3,4,5,8]',null,'c',2);
-- RLS: usuário 1 vê só os próprios jogos; não vê concursos nem cupons; não executa funções internas
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select 'rls jogos proprios', count(*) from public.jogos_salvos;
select 'rls cupons', count(*) from public.cupons;
select 'rls assinaturas de outros', count(*) from public.assinaturas;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select 'rls jogos de outro usuario', count(*) from public.jogos_salvos;
select 'rls assinatura propria', count(*) from public.assinaturas;
\set ON_ERROR_STOP off
select public.consumir_uso('00000000-0000-0000-0000-000000000003','montecarlo',100);
reset role;
