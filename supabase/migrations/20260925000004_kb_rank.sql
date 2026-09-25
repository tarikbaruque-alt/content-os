-- Busca da Knowledge Base: a nota passa a vir da consulta "qualquer palavra"
-- (com peso maior no título/seção), e casar TODAS as palavras vale o dobro.
-- Antes, trecho achado só pela busca ampla ficava com nota 0 e a ordem virava sorteio.
create or replace function public.kb_buscar(ws uuid, consulta text, agente text default null, limite integer default 5)
returns table (id uuid, fonte text, titulo text, secao text, texto text, rank real)
language sql stable set search_path = public as $$
  with termos as (
    select array_to_string(tsvector_to_array(to_tsvector('portuguese', consulta)), ' | ') as ou,
           plainto_tsquery('portuguese', consulta) as todos
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
