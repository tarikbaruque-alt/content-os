-- Fase 1 do processo: a trava mora no banco, não na tela.
--
-- 1) Os documentos do plano (estratégia, linha editorial, ideias) só são
--    gravados pelo servidor (Edge Function, op "gravar"), que confere a trava
--    da etapa e registra quem gravou. O navegador continua lendo e apagando.
-- 2) Toda aprovação fica em aprovacoes, que o navegador só lê.
-- 3) Aprovar o DNA (5 registros ou mais) põe o Átlas na fila; antes, a Íris
--    chamava o Átlas direto, sem ninguém ter aprovado nada.

create function privado.doc_travado(p text) returns boolean
language sql immutable set search_path = '' as $$
  select p like 'cos_strategy/%' or p like 'cos_editorial/%' or p like 'cos_ideas/%';
$$;
revoke execute on function privado.doc_travado(text) from public;
grant execute on function privado.doc_travado(text) to anon, authenticated, service_role;

drop policy docs_criar on public.docs;
drop policy docs_editar on public.docs;
create policy docs_criar on public.docs for insert
  with check (privado.e_membro(workspace_id) and not privado.doc_travado(path));
create policy docs_editar on public.docs for update
  using (privado.e_membro(workspace_id) and not privado.doc_travado(path))
  with check (privado.e_membro(workspace_id) and not privado.doc_travado(path));

create table public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text not null,
  objeto text not null check (objeto in ('dna', 'estrategia', 'editorial', 'ideias', 'calendario', 'peca')),
  decisao text not null check (decisao in ('aprovado', 'rejeitado', 'reaberto', 'restaurado')),
  ref text,
  motivo text,
  versao_anterior jsonb,
  versao jsonb,
  por uuid references auth.users(id) on delete set null,
  em timestamptz not null default now()
);
create index aprovacoes_cliente on public.aprovacoes (workspace_id, client_id, em desc);
alter table public.aprovacoes enable row level security;
create policy "equipe lê as aprovações" on public.aprovacoes for select using (privado.e_membro(workspace_id));
revoke all on public.aprovacoes from anon;
revoke insert, update, delete on public.aprovacoes from authenticated;

create or replace function privado.dna_aprovados(d jsonb) returns int
language sql immutable set search_path = '' as $$
  select count(*)::int from jsonb_array_elements(coalesce(d->'entries', '[]'::jsonb)) e where e->>'status' = 'approved';
$$;
revoke execute on function privado.dna_aprovados(jsonb) from public;

-- Mesmos eventos de antes, mais o DNA: registra a aprovação e, ao cruzar 5
-- registros aprovados sem estratégia ainda, põe o Átlas na fila.
create or replace function privado.docs_eventos() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cli text := split_part(new.path, '/', 2);
  antes int;
  agora int;
begin
  if new.path like 'cos_dna/%' then
    antes := case when tg_op = 'UPDATE' then privado.dna_aprovados(old.data) else 0 end;
    agora := privado.dna_aprovados(new.data);
    if agora > antes then
      insert into public.aprovacoes (workspace_id, client_id, objeto, decisao, motivo, versao_anterior, versao, por)
      values (new.workspace_id, cli, 'dna', 'aprovado', 'registros do Content DNA aprovados',
              jsonb_build_object('aprovados', antes), jsonb_build_object('aprovados', agora), auth.uid());
    end if;
    if agora >= 5 and antes < 5
       and not exists (select 1 from public.docs d where d.workspace_id = new.workspace_id and d.path = 'cos_strategy/' || cli) then
      perform public.enfileirar(new.workspace_id, cli, 'atlas', 'DNA aprovado', interval '2 minutes');
    end if;
  elsif new.path like 'cos_clients/%' and coalesce(new.data->>'briefing', '') <> ''
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
