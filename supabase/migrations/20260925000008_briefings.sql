-- Briefing por link: a equipe cria um link, o cliente responde no celular sem
-- login e a resposta cai no painel. O cliente nunca fala direto com o banco:
-- a Edge Function "agentes" confere o link e grava com a chave de serviço.

create table public.briefing_links (
  -- 32 caracteres hexadecimais: vai na URL sem precisar de escape.
  token text primary key default replace(gen_random_uuid()::text, '-', ''),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  cliente_nome text not null default '',
  agencia text not null default '',
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token text references public.briefing_links(token) on delete set null,
  respostas jsonb not null,
  status text not null default 'novo' check (status in ('novo', 'importado', 'arquivado')),
  client_id text,
  recebido_em timestamptz not null default now()
);
create index briefings_ws_status on public.briefings (workspace_id, status, recebido_em desc);

alter table public.briefing_links enable row level security;
alter table public.briefings enable row level security;

create policy "equipe vê os links" on public.briefing_links for select using (privado.e_membro(workspace_id));
create policy "equipe cria links" on public.briefing_links for insert with check (privado.e_membro(workspace_id) and criado_por = auth.uid());
create policy "equipe desativa links" on public.briefing_links for update using (privado.e_membro(workspace_id)) with check (privado.e_membro(workspace_id));

-- Resposta só entra pela Edge Function (chave de serviço): nada de insert para anon/authenticated.
create policy "equipe vê briefings" on public.briefings for select using (privado.e_membro(workspace_id));
create policy "equipe marca briefings" on public.briefings for update using (privado.e_membro(workspace_id)) with check (privado.e_membro(workspace_id));

-- Além da RLS, sem permissão de tabela: o visitante anônimo não toca em nada e a
-- equipe não insere resposta nem apaga histórico pelo navegador.
revoke all on public.briefing_links, public.briefings from anon;
revoke insert, delete on public.briefings from authenticated;
revoke delete on public.briefing_links from authenticated;
