-- Papéis da equipe, valendo no banco:
--   dono     faz tudo, inclusive a equipe (convidar, trocar papel, remover)
--   editor   trabalha em tudo (clientes, plano, calendário, agentes), não mexe na equipe
--   leitura  vê tudo, não muda nada
-- Antes existiam dono e editor, mas toda policy de escrita pedia só "é membro",
-- então os dois eram iguais e não havia como dar acesso só de leitura.

alter table public.membros drop constraint if exists membros_papel_check;
alter table public.membros add constraint membros_papel_check check (papel in ('dono', 'editor', 'leitura'));
alter table public.convites drop constraint if exists convites_papel_check;
alter table public.convites add constraint convites_papel_check check (papel in ('dono', 'editor', 'leitura'));

create or replace function privado.e_editor(ws uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m where m.workspace_id = ws and m.user_id = auth.uid() and m.papel in ('dono', 'editor'));
$$;
revoke execute on function privado.e_editor(uuid) from public;
grant execute on function privado.e_editor(uuid) to anon, authenticated, service_role;

-- Escrita pede editor ou dono. Leitura continua para qualquer membro.
drop policy docs_criar on public.docs;
drop policy docs_editar on public.docs;
drop policy docs_apagar on public.docs;
create policy docs_criar on public.docs for insert
  with check (privado.e_editor(workspace_id) and not privado.doc_travado(path));
create policy docs_editar on public.docs for update
  using (privado.e_editor(workspace_id) and not privado.doc_travado(path))
  with check (privado.e_editor(workspace_id) and not privado.doc_travado(path));
create policy docs_apagar on public.docs for delete using (privado.e_editor(workspace_id));

drop policy settings_criar on public.agent_settings;
drop policy settings_editar on public.agent_settings;
create policy settings_criar on public.agent_settings for insert with check (privado.e_editor(workspace_id));
create policy settings_editar on public.agent_settings for update using (privado.e_editor(workspace_id)) with check (privado.e_editor(workspace_id));

drop policy "equipe cria links" on public.briefing_links;
drop policy "equipe desativa links" on public.briefing_links;
drop policy "equipe marca briefings" on public.briefings;
create policy "equipe cria links" on public.briefing_links for insert with check (privado.e_editor(workspace_id) and criado_por = auth.uid());
create policy "equipe desativa links" on public.briefing_links for update using (privado.e_editor(workspace_id)) with check (privado.e_editor(workspace_id));
create policy "equipe marca briefings" on public.briefings for update using (privado.e_editor(workspace_id)) with check (privado.e_editor(workspace_id));

-- O dono troca o papel dos outros (não o próprio: sempre sobra um dono).
-- RLS é por linha; a coluna que pode mudar vem do GRANT.
create policy membros_dono_papel on public.membros for update
  using (privado.e_dono(workspace_id) and user_id <> auth.uid())
  with check (privado.e_dono(workspace_id) and user_id <> auth.uid());
revoke update on public.membros from anon, authenticated;
grant update (papel) on public.membros to authenticated;

-- Apagar cliente passa a pedir editor.
create or replace function public.apagar_cliente(ws uuid, cli text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not privado.e_editor(ws) then raise exception 'sem permissão neste workspace' using errcode = '42501'; end if;
  if cli is null or cli = '' or length(cli) > 120 or position('/' in cli) > 0 then raise exception 'cliente inválido'; end if;
  delete from public.docs where workspace_id = ws and path like 'cos\_%' and split_part(path, '/', 2) = cli;
  get diagnostics n = row_count;
  delete from public.proposals where workspace_id = ws and client_id = cli;
  delete from public.agent_tasks where workspace_id = ws and client_id = cli;
  delete from public.aprovacoes where workspace_id = ws and client_id = cli;
  delete from public.briefings where workspace_id = ws and client_id = cli;
  return n;
end $$;

-- Quem está na equipe, com e-mail e nome (auth.users não é lido pelo navegador).
create or replace function public.equipe(ws uuid)
returns table (user_id uuid, email text, nome text, papel text, desde timestamptz, ultimo_acesso timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, u.email::text, coalesce(nullif(u.raw_user_meta_data->>'nome', ''), split_part(u.email::text, '@', 1)), m.papel, m.created_at, u.last_sign_in_at
    from public.membros m join auth.users u on u.id = m.user_id
   where m.workspace_id = ws and privado.e_membro(ws)
   order by (m.papel = 'dono') desc, m.created_at;
$$;
revoke execute on function public.equipe(uuid) from public, anon;
grant execute on function public.equipe(uuid) to authenticated;

-- Só a Edge Function (convite): quem já tem conta com este e-mail.
create or replace function public.usuario_por_email(e text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from auth.users where lower(email::text) = lower(trim(e)) limit 1;
$$;
revoke execute on function public.usuario_por_email(text) from public, anon, authenticated;
grant execute on function public.usuario_por_email(text) to service_role;
