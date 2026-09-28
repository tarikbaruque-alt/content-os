-- Content OS — banco do painel e dos agentes.
--
-- Duas partes:
-- 1) "docs": os mesmos documentos que o painel já grava (cos_clients/<id>,
--    cos_calendar/<id>/items/<item>…), em JSON. As 19 telas continuam iguais e
--    o backup do painel entra direto.
-- 2) O que é novo e precisa de consulta: propostas dos agentes, execuções,
--    fila, agenda por agente e a Knowledge Base com busca em português.
--
-- Segurança: tudo é por workspace (a equipe: Tarik, Nicácio…). Membro lê e
-- escreve os docs do seu workspace. Propostas, execuções e fila só são
-- escritas pelo servidor (service role): o navegador lê e decide pela função.


-- ---------------------------------------------------------------- equipe
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table public.membros (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'editor' check (papel in ('dono', 'editor')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.convites (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  papel text not null default 'editor' check (papel in ('dono', 'editor')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, email)
);

-- security definer: a policy consulta membros sem cair na própria RLS de membros.
create or replace function public.e_membro(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where m.workspace_id = ws and m.user_id = auth.uid());
$$;

create or replace function public.e_dono(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where m.workspace_id = ws and m.user_id = auth.uid() and m.papel = 'dono');
$$;

-- Primeiro acesso: cria o workspace e vira dono. Quem já é membro de algum
-- workspace não cria outro por engano (devolve o que já tem).
create or replace function public.criar_workspace(nome text) returns uuid
language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  select workspace_id into ws from public.membros where user_id = auth.uid() limit 1;
  if ws is not null then return ws; end if;
  insert into public.workspaces (nome) values (coalesce(nullif(trim(nome), ''), 'Content OS')) returning id into ws;
  insert into public.membros (workspace_id, user_id, papel) values (ws, auth.uid(), 'dono');
  return ws;
end $$;

-- Convite pendente vira membro no cadastro (e em quem já tinha conta, no próximo login via aceitar_convites()).
create or replace function public.aceitar_convites() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer; em text;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into em from auth.users where id = auth.uid();
  insert into public.membros (workspace_id, user_id, papel)
    select c.workspace_id, auth.uid(), c.papel from public.convites c where lower(c.email) = em
    on conflict do nothing;
  get diagnostics n = row_count;
  delete from public.convites where lower(email) = em;
  return n;
end $$;

-- ---------------------------------------------------------------- docs do painel
create table public.docs (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  path text not null check (path ~ '^[A-Za-z0-9_.-]+(/[A-Za-z0-9_.@-]+)+$'),
  -- coleção do doc: "cos_calendar/cli/items/cal-1" -> "cos_calendar/cli/items"
  parent text generated always as (regexp_replace(path, '/[^/]+$', '')) stored,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (workspace_id, path)
);
create index docs_parent_idx on public.docs (workspace_id, parent);

-- ---------------------------------------------------------------- agentes
-- Agenda e liga/desliga por agente, por workspace. A cadência padrão mora no
-- código (supabase/functions/_shared/agentes.ts); aqui só o que foi mudado.
create table public.agent_settings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agente text not null,
  ativo boolean not null default true,
  agenda text,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, agente)
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text,
  agente text not null,
  gatilho text not null,
  status text not null default 'rodando' check (status in ('rodando', 'ok', 'erro', 'sem_saida', 'pulado')),
  modelo text,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  buscas_web integer not null default 0,
  custo_usd numeric(10, 4) not null default 0,
  passos jsonb not null default '[]'::jsonb,
  erro text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index agent_runs_ws_idx on public.agent_runs (workspace_id, started_at desc);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text,
  agente text not null,
  tipo text not null,
  titulo text not null,
  resumo text,
  payload jsonb not null,
  fontes jsonb not null default '[]'::jsonb,
  status text not null default 'pendente' check (status in ('pendente', 'aplicada', 'rejeitada')),
  run_id uuid references public.agent_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid
);
create index proposals_ws_idx on public.proposals (workspace_id, status, created_at desc);

-- Fila: eventos e agenda viram tarefas; o Maestro consome. Uma tarefa pendente
-- por (workspace, cliente, agente): o segundo evento igual não duplica trabalho.
create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text,
  agente text not null,
  gatilho text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendente' check (status in ('pendente', 'rodando', 'feito', 'erro')),
  tentativas integer not null default 0,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create unique index agent_tasks_uma_pendente on public.agent_tasks (workspace_id, coalesce(client_id, ''), agente) where status = 'pendente';
create index agent_tasks_fila_idx on public.agent_tasks (status, run_after);

-- ---------------------------------------------------------------- Knowledge Base
-- workspace_id nulo = conhecimento do próprio Content OS (foundation/knowledge-base),
-- visível para todos; com workspace = material que a equipe subiu.
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  fonte text not null,
  titulo text not null,
  secao text,
  texto text not null,
  agentes text[] not null default '{}',
  tsv tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(secao, '')), 'A') ||
    setweight(to_tsvector('portuguese', texto), 'B')
  ) stored,
  created_at timestamptz not null default now()
);
create index knowledge_tsv_idx on public.knowledge_chunks using gin (tsv);
create index knowledge_fonte_idx on public.knowledge_chunks (workspace_id, fonte);

create or replace function public.kb_buscar(ws uuid, consulta text, agente text default null, limite integer default 5)
returns table (id uuid, fonte text, titulo text, secao text, texto text, rank real)
language sql stable set search_path = public as $$
  with q as (
    select case when websearch_to_tsquery('portuguese', consulta)::text = '' then null
                else websearch_to_tsquery('portuguese', consulta) end as wq,
           plainto_tsquery('portuguese', consulta) as pq
  )
  select k.id, k.fonte, k.titulo, k.secao, k.texto,
         ts_rank(k.tsv, coalesce(q.wq, q.pq)) + case when agente = any (k.agentes) then 0.05 else 0 end as rank
  from public.knowledge_chunks k, q
  where (k.workspace_id is null or k.workspace_id = ws)
    and (k.tsv @@ coalesce(q.wq, q.pq)
         -- consulta com muitas palavras raramente casa todas: aceita qualquer uma
         or k.tsv @@ to_tsquery('portuguese', array_to_string(tsvector_to_array(to_tsvector('portuguese', consulta)), ' | ')))
  order by rank desc
  limit greatest(1, least(limite, 12));
$$;

-- ---------------------------------------------------------------- RLS
alter table public.workspaces enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.docs enable row level security;
alter table public.agent_settings enable row level security;
alter table public.agent_runs enable row level security;
alter table public.proposals enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy ws_ler on public.workspaces for select using (public.e_membro(id));
create policy ws_renomear on public.workspaces for update using (public.e_dono(id)) with check (public.e_dono(id));

create policy membros_ler on public.membros for select using (public.e_membro(workspace_id));
create policy membros_dono_remove on public.membros for delete using (public.e_dono(workspace_id) and user_id <> auth.uid());

create policy convites_ler on public.convites for select using (public.e_dono(workspace_id));
create policy convites_criar on public.convites for insert with check (public.e_dono(workspace_id));
create policy convites_apagar on public.convites for delete using (public.e_dono(workspace_id));

create policy docs_ler on public.docs for select using (public.e_membro(workspace_id));
create policy docs_criar on public.docs for insert with check (public.e_membro(workspace_id));
create policy docs_editar on public.docs for update using (public.e_membro(workspace_id)) with check (public.e_membro(workspace_id));
create policy docs_apagar on public.docs for delete using (public.e_membro(workspace_id));

create policy settings_ler on public.agent_settings for select using (public.e_membro(workspace_id));
create policy settings_criar on public.agent_settings for insert with check (public.e_membro(workspace_id));
create policy settings_editar on public.agent_settings for update using (public.e_membro(workspace_id)) with check (public.e_membro(workspace_id));

create policy runs_ler on public.agent_runs for select using (public.e_membro(workspace_id));
create policy proposals_ler on public.proposals for select using (public.e_membro(workspace_id));
create policy tasks_ler on public.agent_tasks for select using (public.e_membro(workspace_id));
create policy kb_ler on public.knowledge_chunks for select using (workspace_id is null or public.e_membro(workspace_id));

-- Coluna não se protege com policy (policy é por linha): o navegador não
-- escreve em propostas, execuções, fila nem KB. Só o servidor (service role).
revoke insert, update, delete on public.agent_runs, public.proposals, public.agent_tasks, public.knowledge_chunks from anon, authenticated;
revoke insert, delete on public.workspaces, public.membros from anon, authenticated;
revoke update (workspace_id, updated_by) on public.docs from authenticated;
revoke all on public.docs, public.agent_settings, public.convites from anon;

grant execute on function public.criar_workspace(text), public.aceitar_convites() to authenticated;
grant execute on function public.kb_buscar(uuid, text, text, integer) to authenticated, service_role;
-- Função nasce executável por PUBLIC (todo mundo): revogar só de um papel não adianta.
revoke execute on function public.criar_workspace(text), public.aceitar_convites() from public, anon;
grant execute on function public.criar_workspace(text), public.aceitar_convites() to authenticated;

-- ---------------------------------------------------------------- eventos -> fila
-- Briefing novo/alterado chama a Íris; resultado novo (métricas ou CSV) chama o
-- Pulso. A tarefa espera alguns minutos: quem ainda está digitando não dispara
-- uma execução por tecla.
create or replace function public.enfileirar(ws uuid, cli text, ag text, gat text, atraso interval)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.agent_tasks (workspace_id, client_id, agente, gatilho, run_after)
  values (ws, cli, ag, gat, now() + atraso)
  on conflict (workspace_id, coalesce(client_id, ''), agente) where status = 'pendente'
  do update set run_after = excluded.run_after, gatilho = excluded.gatilho;
end $$;
revoke execute on function public.enfileirar(uuid, text, text, text, interval) from public, anon, authenticated;
grant execute on function public.enfileirar(uuid, text, text, text, interval) to service_role;

create or replace function public.docs_eventos() returns trigger
language plpgsql security definer set search_path = public as $$
declare cli text := split_part(new.path, '/', 2);
begin
  if new.path like 'cos_clients/%' and coalesce(new.data->>'briefing', '') <> ''
     and (tg_op = 'INSERT' or coalesce(old.data->>'briefing', '') is distinct from new.data->>'briefing') then
    perform public.enfileirar(new.workspace_id, cli, 'iris', 'briefing novo', interval '10 minutes');
  elsif new.path like 'cos_perf/%'
     or (new.path like 'cos_calendar/%/items/%' and new.data ? 'metrics'
         and (tg_op = 'INSERT' or old.data->'metrics' is distinct from new.data->'metrics')) then
    perform public.enfileirar(new.workspace_id, cli, 'pulso', 'resultado novo', interval '30 minutes');
  end if;
  return new;
end $$;

create trigger docs_eventos after insert or update on public.docs
  for each row execute function public.docs_eventos();

create or replace function public.docs_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger docs_touch before update on public.docs for each row execute function public.docs_touch();
