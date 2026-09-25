-- Funções auxiliares saem do schema exposto pela API (public) para um schema
-- que o PostgREST não publica. As policies continuam valendo: elas apontam para
-- a função pelo identificador interno, não pelo nome.
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated, service_role;

alter function public.e_membro(uuid) set schema privado;
alter function public.e_dono(uuid) set schema privado;
alter function public.docs_eventos() set schema privado;
alter function public.docs_touch() set schema privado;
alter function privado.docs_touch() set search_path = '';

revoke execute on all functions in schema privado from public;
grant execute on function privado.e_membro(uuid), privado.e_dono(uuid) to anon, authenticated, service_role;

-- Esta referenciava a função pelo nome: recriada apontando para o novo lugar.
create or replace function public.gasto_do_mes_painel(ws uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select case when privado.e_membro(ws) then public.gasto_do_mes(ws) else null end;
$$;
