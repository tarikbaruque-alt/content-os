-- Funções que só o servidor (Edge Function com service role) chama.

-- Pega até n tarefas vencidas e marca como "rodando". SKIP LOCKED: duas batidas
-- ao mesmo tempo nunca pegam a mesma tarefa. Tarefa presa em "rodando" há mais
-- de 30 min (a função caiu no meio) volta a ser pega, até 3 tentativas.
create or replace function public.pegar_tarefas(n integer)
returns setof public.agent_tasks
language plpgsql security definer set search_path = public as $$
begin
  update public.agent_tasks set status = 'erro', finished_at = now()
   where status = 'rodando' and run_after < now() - interval '30 minutes' and tentativas >= 3;
  return query
  update public.agent_tasks t set status = 'rodando', tentativas = t.tentativas + 1, run_after = now()
   where t.id in (
     select id from public.agent_tasks
      where (status = 'pendente' and run_after <= now())
         or (status = 'rodando' and run_after < now() - interval '30 minutes' and tentativas < 3)
      order by run_after
      limit greatest(1, n)
      for update skip locked)
  returning t.*;
end $$;

create or replace function public.gasto_do_mes(ws uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(custo_usd), 0) from public.agent_runs
   where workspace_id = ws and started_at >= date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
$$;

-- Última vez que o agente rodou (ou foi posto na fila) para o cliente.
create or replace function public.ultima_vez(ws uuid, cli text, ag text) returns timestamptz
language sql stable security definer set search_path = public as $$
  select greatest(
    (select max(started_at) from public.agent_runs where workspace_id = ws and client_id is not distinct from cli and agente = ag),
    (select max(created_at) from public.agent_tasks where workspace_id = ws and client_id is not distinct from cli and agente = ag));
$$;

revoke execute on function public.pegar_tarefas(integer), public.ultima_vez(uuid, text, text) from public, anon, authenticated;
grant execute on function public.pegar_tarefas(integer), public.ultima_vez(uuid, text, text) to service_role;
-- O painel mostra o gasto do mês ao membro; a função só responde para quem é do workspace.
revoke execute on function public.gasto_do_mes(uuid) from public, anon, authenticated;
create or replace function public.gasto_do_mes_painel(ws uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select case when public.e_membro(ws) then public.gasto_do_mes(ws) else null end;
$$;
revoke execute on function public.gasto_do_mes_painel(uuid) from public, anon;
grant execute on function public.gasto_do_mes_painel(uuid) to authenticated;
grant execute on function public.gasto_do_mes(uuid) to service_role;
