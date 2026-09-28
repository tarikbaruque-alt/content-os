-- Estratégia nova gravada (aprovação da proposta do Átlas ou botão no painel)
-- chama a Bússola para refazer a linha editorial em cima dela.
create or replace function privado.docs_eventos() returns trigger
language plpgsql security definer set search_path = public as $$
declare cli text := split_part(new.path, '/', 2);
begin
  if new.path like 'cos_clients/%' and coalesce(new.data->>'briefing', '') <> ''
     and (tg_op = 'INSERT' or coalesce(old.data->>'briefing', '') is distinct from new.data->>'briefing') then
    perform public.enfileirar(new.workspace_id, cli, 'iris', 'briefing novo', interval '10 minutes');
  elsif new.path like 'cos_strategy/%' and (tg_op = 'INSERT' or old.data is distinct from new.data) then
    perform public.enfileirar(new.workspace_id, cli, 'bussola', 'estratégia nova', interval '5 minutes');
  elsif new.path like 'cos_perf/%'
     or (new.path like 'cos_calendar/%/items/%' and new.data ? 'metrics'
         and (tg_op = 'INSERT' or old.data->'metrics' is distinct from new.data->'metrics')) then
    perform public.enfileirar(new.workspace_id, cli, 'pulso', 'resultado novo', interval '30 minutes');
  end if;
  return new;
end $$;
