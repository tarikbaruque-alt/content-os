-- Links públicos por cliente, com o mesmo desenho do briefing por link (o token
-- é a credencial; o visitante nunca fala com o banco, só com a Edge Function):
--   vitrine  o cliente abre o calendário no celular e aprova ou pede ajuste em
--            cada pauta, e a resposta cai na peça (antes era um arquivo HTML
--            mandado no WhatsApp, que envelhecia, e a resposta voltava como texto)
--   agenda   assinatura de calendário (.ics) que o Google Agenda e o iPhone
--            atualizam sozinhos; sem cliente = todos os clientes, para a equipe

create table public.links_publicos (
  token text primary key default replace(gen_random_uuid()::text, '-', ''),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tipo text not null check (tipo in ('vitrine', 'agenda')),
  client_id text,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (tipo = 'agenda' or client_id is not null)
);
create index links_publicos_cliente on public.links_publicos (workspace_id, tipo, client_id) where ativo;

alter table public.links_publicos enable row level security;
create policy "equipe vê os links públicos" on public.links_publicos for select using (privado.e_membro(workspace_id));
create policy "editor cria link público" on public.links_publicos for insert with check (privado.e_editor(workspace_id) and criado_por = auth.uid());
create policy "editor desativa link público" on public.links_publicos for update using (privado.e_editor(workspace_id)) with check (privado.e_editor(workspace_id));
revoke all on public.links_publicos from anon;
revoke delete on public.links_publicos from authenticated;

-- A decisão do cliente na vitrine fica no histórico de aprovações (por = null: foi o cliente).
alter table public.aprovacoes drop constraint if exists aprovacoes_decisao_check;
alter table public.aprovacoes add constraint aprovacoes_decisao_check check (decisao in ('aprovado', 'rejeitado', 'reaberto', 'restaurado', 'ajuste'));
