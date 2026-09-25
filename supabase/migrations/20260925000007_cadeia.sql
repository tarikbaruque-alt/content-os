-- Cadeia do planejamento: cada aprovação chama o próximo agente.
--   estratégia gravada  -> Bússola (já existia)
--   linha editorial     -> Musa
--   ideia nova          -> Cronos (monta o próximo trecho vazio do calendário)
-- O agente em modo manual para aquele cliente é pulado pelo Maestro, sem custo.
create or replace function privado.docs_eventos() returns trigger
language plpgsql security definer set search_path = public as $$
declare cli text := split_part(new.path, '/', 2);
begin
  if new.path like 'cos_clients/%' and coalesce(new.data->>'briefing', '') <> ''
     and (tg_op = 'INSERT' or coalesce(old.data->>'briefing', '') is distinct from new.data->>'briefing') then
    perform public.enfileirar(new.workspace_id, cli, 'iris', 'briefing novo', interval '10 minutes');
  elsif new.path like 'cos_strategy/%' and (tg_op = 'INSERT' or old.data is distinct from new.data) then
    perform public.enfileirar(new.workspace_id, cli, 'bussola', 'estratégia nova', interval '5 minutes');
  elsif new.path like 'cos_editorial/%' and (tg_op = 'INSERT' or old.data is distinct from new.data) then
    perform public.enfileirar(new.workspace_id, cli, 'musa', 'linha editorial nova', interval '5 minutes');
  elsif new.path like 'cos_ideas/%/items/%' and tg_op = 'INSERT' then
    perform public.enfileirar(new.workspace_id, cli, 'cronos', 'ideias novas', interval '5 minutes');
  elsif new.path like 'cos_perf/%'
     or (new.path like 'cos_calendar/%/items/%' and new.data ? 'metrics'
         and (tg_op = 'INSERT' or old.data->'metrics' is distinct from new.data->'metrics')) then
    perform public.enfileirar(new.workspace_id, cli, 'pulso', 'resultado novo', interval '30 minutes');
  end if;
  return new;
end $$;

-- Última vez de um agente para um cliente, opcionalmente só de um gatilho: o
-- Pulso que rodou por "resultado novo" não conta como o planejamento do mês.
drop function if exists public.ultima_vez(uuid, text, text);
create function public.ultima_vez(ws uuid, cli text, ag text, gat text default null) returns timestamptz
language sql stable security definer set search_path = public as $$
  select greatest(
    (select max(started_at) from public.agent_runs where workspace_id = ws and client_id is not distinct from cli and agente = ag and (gat is null or gatilho = gat)),
    (select max(created_at) from public.agent_tasks where workspace_id = ws and client_id is not distinct from cli and agente = ag and (gat is null or gatilho = gat)));
$$;
revoke execute on function public.ultima_vez(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.ultima_vez(uuid, text, text, text) to service_role;
