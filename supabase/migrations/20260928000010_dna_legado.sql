-- DNA do painel antigo: o registro sem status era o DNA em uso (o painel
-- antigo não tinha aprovação), então conta como aprovado. É a mesma regra de
-- dnaValeAprovado (supabase/functions/_shared/processo.ts) e do painel.
-- Sem isso, todo cliente trazido do painel antigo ficava com 0 aprovados e
-- nenhuma gravação do plano passava pela trava.

create or replace function privado.dna_aprovados(d jsonb) returns int
language sql immutable set search_path = '' as $$
  select count(*)::int from jsonb_array_elements(coalesce(d->'entries', '[]'::jsonb)) e
   where coalesce(e->>'status', 'approved') = 'approved';
$$;

-- Os registros que já estão no banco ganham o status explícito (e a marca
-- "legado", para ninguém confundir com uma aprovação feita no painel novo).
-- Contando igual antes e depois, o gatilho não registra aprovação nem enfileira nada.
update public.docs d
   set data = jsonb_set(d.data, '{entries}', (
         select coalesce(jsonb_agg(case when x->>'status' is null then x || '{"status":"approved","legado":true}'::jsonb else x end order by n), '[]'::jsonb)
           from jsonb_array_elements(d.data->'entries') with ordinality as t(x, n)))
 where d.path like 'cos_dna/%'
   and jsonb_typeof(d.data->'entries') = 'array'
   and exists (select 1 from jsonb_array_elements(d.data->'entries') x where x->>'status' is null);
