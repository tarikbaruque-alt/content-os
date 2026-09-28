-- Apagar um cliente de uma vez, numa transação: ficha, DNA, plano, ideias,
-- calendário, propostas, fila, aprovações e briefings. Antes o navegador
-- apagava documento por documento (50 chamadas ou mais) e, se caísse no meio,
-- o cliente ficava pela metade.
-- As execuções (agent_runs) ficam: são o registro do gasto do mês.

create or replace function public.apagar_cliente(ws uuid, cli text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not privado.e_membro(ws) then raise exception 'sem permissão neste workspace' using errcode = '42501'; end if;
  if cli is null or cli = '' or length(cli) > 120 or position('/' in cli) > 0 then raise exception 'cliente inválido'; end if;
  delete from public.docs where workspace_id = ws and path like 'cos\_%' and split_part(path, '/', 2) = cli;
  get diagnostics n = row_count;
  delete from public.proposals where workspace_id = ws and client_id = cli;
  delete from public.agent_tasks where workspace_id = ws and client_id = cli;
  delete from public.aprovacoes where workspace_id = ws and client_id = cli;
  delete from public.briefings where workspace_id = ws and client_id = cli;
  return n;
end $$;
revoke execute on function public.apagar_cliente(uuid, text) from public, anon;
grant execute on function public.apagar_cliente(uuid, text) to authenticated;
