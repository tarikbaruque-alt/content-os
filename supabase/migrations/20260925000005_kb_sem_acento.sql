-- No Postgres do Supabase o analisador de texto não trata letra acentuada como
-- letra: "frequência" virava 'frequ' + 'nci', e 'nci' casava com toda palavra
-- terminada em "ência". Tirar os acentos antes de indexar e de buscar resolve
-- (o dicionário português acerta o radical do mesmo jeito sem acento).
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

create or replace function privado.sem_acento(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''));
$$;
grant execute on function privado.sem_acento(text) to anon, authenticated, service_role;

alter table public.knowledge_chunks drop column tsv;
alter table public.knowledge_chunks add column tsv tsvector generated always as (
  setweight(to_tsvector('portuguese', privado.sem_acento(coalesce(titulo, '') || ' ' || coalesce(secao, ''))), 'A') ||
  setweight(to_tsvector('portuguese', privado.sem_acento(texto)), 'B')
) stored;
create index knowledge_tsv_idx on public.knowledge_chunks using gin (tsv);

create or replace function public.kb_buscar(ws uuid, consulta text, agente text default null, limite integer default 5)
returns table (id uuid, fonte text, titulo text, secao text, texto text, rank real)
language sql stable set search_path = public as $$
  with termos as (
    select array_to_string(tsvector_to_array(to_tsvector('portuguese', privado.sem_acento(consulta))), ' | ') as ou,
           plainto_tsquery('portuguese', privado.sem_acento(consulta)) as todos
  ), q as (
    select case when ou = '' then null else to_tsquery('portuguese', ou) end as ou, todos from termos
  )
  select k.id, k.fonte, k.titulo, k.secao, k.texto,
         (ts_rank(k.tsv, q.ou, 1) * case when k.tsv @@ q.todos then 2 else 1 end
           + case when agente = any (k.agentes) then 0.02 else 0 end)::real as rank
  from public.knowledge_chunks k, q
  where q.ou is not null
    and (k.workspace_id is null or k.workspace_id = ws)
    and k.tsv @@ q.ou
  order by rank desc
  limit greatest(1, least(limite, 12));
$$;
