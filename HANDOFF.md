# 🤝 Passagem de projeto — Content OS

**Para:** Nicásio · **De:** Tarik · **Data:** 25/09/2026
**Repositório:** github.com/tarikbaruque-alt/content-os (branch `main`)

Este documento é o ponto de partida. Ele diz o que já funciona, o que falta, em
que ordem atacar e quais acessos e chaves você precisa receber.

---

## 1. O que é o projeto

Um painel de estratégia de conteúdo para Instagram, operado por agentes de IA:

```
Briefing → Íris (Content DNA) → Átlas (Estratégia) → Bússola (Linha Editorial)
        → Musa (Ideias + Formatos) → Cronos (Calendário) → Estúdio Criativo
          (Rima: copy · Mosaico: carrossel · Enredo: Stories) → Notion
```

São duas partes que compartilham a mesma lógica:

| Parte | Onde fica | Para quê |
|---|---|---|
| **Painel** (uso diário) | `apps/web/src/*` → montado em `apps/web/index.html` | Publicado como Artifact privado no claude.ai. A IA do painel usa a conta Claude de quem está vendo |
| **Motor em TypeScript** | `src/` (agentes, pipeline, integrações) + `tests/` | CLI e integrações reais (Anthropic API, Notion, Pixabay) |

**Os dados dos clientes não ficam no repositório.** Eles ficam no banco do
Artifact publicado (coleções `cos_clients`, `cos_dna`, `cos_strategy`,
`cos_editorial`, `cos_ideas`, `cos_calendar`…). A cópia offline (`painel.html`)
guarda os dados só no navegador de quem a usa.

---

## 2. Como rodar (15 minutos)

```bash
npm ci
npm run typecheck      # precisa passar limpo
npm test               # 89 testes, todos passando em 25/09
npm run doctor         # mostra quais integrações/chaves faltam
npm run pipeline       # pipeline ponta a ponta (provider mock, sem chave)
npx --yes serve apps/web   # painel em http://localhost:3000
```

### Regras da casa

1. **O painel se edita nas partes**, em `apps/web/src/NN-nome.{html,css,js}`. Depois
   rode `npm run panel:sync`, que gera as 3 cópias idênticas (`apps/web/index.html`,
   `apps/web/app.html` e `AGENTES INTELIGENTES/painel.html`). Um teste falha se elas divergirem.
2. **Para publicar o painel**, é preciso republicar `apps/web/index.html` no mesmo
   Artifact, pelo Claude Code, passando a URL do painel. Ver `ACESSOS.md`.
3. **A página nunca repete sozinha uma chamada de IA que falhou**: essa é uma regra da
   plataforma do claude.ai. No `rate_limited`, o botão trava 60s com contagem e a pessoa clica de novo.
4. **Governança**: agente só **sugere** e o humano aprova. Nada entra no Content DNA
   como fato sem aprovação, e nenhum agente inventa número, prova ou depoimento.
5. Antes de cada push: `npm run typecheck && npm test`.

---

## 3. Quadro de estado (verificado em 25/09/2026)

| Área | Estado | Observação |
|---|---|---|
| Dashboard, Clientes, Clientes ativos | ✅ Funcional | Cadastro, ficha, cobranças, backup/importação |
| Briefing (formulário, importar, caixa de entrada do Gmail) | ✅ Funcional | Briefing colado no Content DNA agora aplica rotina e metas |
| Content DNA — Íris | ✅ Funcional | IA ao vivo depende da cota da conta Claude de quem usa |
| Estratégia (Átlas), Linha Editorial (Bússola), Ideias e Formatos (Musa) | ✅ Funcional | |
| Distribuição, Calendário (Cronos), Vitrine do cliente, `.ics` | ✅ Funcional | |
| Google Agenda (conector) | 🟡 Não verificado | Código pronto; a chamada real ainda não foi testada |
| Gmail (conector) | 🟡 Não verificado | Idem |
| Estúdio Criativo (Rima/Mosaico/Enredo) | ✅ Funcional no painel | No CLI, a prosa final exige `ANTHROPIC_API_KEY` |
| Aprovações → Notion | 🟡 Parcial | Sync real existe, com trava; falta `NOTION_DATABASE_ID` |
| Pesquisa (Radar) | 🟠 Só sinais internos | Pesquisa externa exige API de busca |
| Performance (Pulso) | 🔴 Mock | Dados de exemplo; falta integrar métricas reais |
| Knowledge Base (Acervo) | 🟡 Parcial | Recupera os pilares; ainda não há ingestão de conteúdo novo |
| Maestro (orquestrador) | 🟡 Parcial | Orquestrador-lite no motor; no painel, é o "Montar tudo" |
| Conteúdos / Aprovações (telas) | 🟠 Marcadas "demonstração" | Precisam refletir o estado real das peças |

---

## 4. Backlog priorizado para o Nicásio

Cada item virou uma issue no GitHub (#25–#35), com critério de aceite. Atenda na ordem.

### P0 — confiabilidade (fazer primeiro)
1. [#25] **CI no GitHub Actions**: rodar `typecheck` e `test` em cada PR. Hoje não existe CI.
2. [#26] **Teste de ponta a ponta do painel no navegador (Playwright)**: carregar o painel com
   `window.claude` simulado, rodar o "Montar tudo" e abrir as 19 telas sem erro.
   Os testes atuais só pegam erro de sintaxe e deixaram passar bugs de execução.
3. [#27] **Plano B quando a IA do painel é limitada**: com `rate_limited`, oferecer
   "Copiar pedido" e "Colar resposta", para que nenhum cliente fique travado.

### P1 — completar o que hoje não roda
4. [#28] **Notion sync ponta a ponta**, com `NOTION_DATABASE_ID`: dry-run e depois escrita autorizada.
5. [#29] **Pulso (Performance real)**: importar métricas (CSV exportado do Instagram
   primeiro; depois a API do Instagram Graph) e trocar o mock.
6. [#30] **Radar externo**: pesquisa com fonte (API de busca), sempre citando a URL, sem inventar.
7. [#31] **Verificar os conectores Google Agenda e Gmail** com chamadas reais e ajustar os campos lidos.
8. [#32] **Telas Conteúdos e Aprovações com dados reais**: tirar o selo "demonstração".

### P2 — evolução
9. [#33] **Acervo**: ingestão de conteúdo novo na Knowledge Base.
10. [#34] **Atualizar o contrato do Artifact** (0.2.54 → 0.2.58) e testar de novo.
11. [#35] **Store do Content DNA em Postgres** (a interface já está pronta) e camada de decisão Jev/TypeSafe.

---

## 5. Acessos que o Tarik precisa dar

- [ ] **GitHub**: Settings → Collaborators → adicionar o usuário do Nicásio (ou tornar o repositório público).
- [ ] **Painel (Artifact)**: no botão "Compartilhar" do painel, dar acesso de **editor** ao
  Nicásio. Sem isso, ele não vê os clientes nem consegue republicar.
- [ ] **Conta Claude**: o Nicásio usa a própria conta. A IA do painel consome a cota de quem está usando.

## 6. Chaves (variáveis de ambiente)

**Nunca coloque chaves em commit nem em mensagem de chat.** Cadastre-as no `.env`
local (que está no `.gitignore`) ou nas configurações do ambiente do Claude Code na web
(menu do ambiente → Editar → variáveis de ambiente). Modelo completo: `.env.example`.

| Variável | Para quê | Onde conseguir | Situação |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Agentes do CLI com IA real (Rima, pipeline, smoke) | console.anthropic.com → API Keys | ❌ falta |
| `CONTENT_OS_LLM_PROVIDER` | `anthropic` para usar a chave acima (padrão: `mock`) | — | configurar |
| `ANTHROPIC_MODEL` | Opcional. Padrão `claude-opus-5`; mais barato: `claude-sonnet-5` | — | opcional |
| `NOTION_API_KEY` | Sincronizar calendário/aprovações com o Notion | notion.so/my-integrations | ✅ já existe no ambiente |
| `NOTION_DATABASE_ID` | Database de destino (32 caracteres, tirados da URL) | URL do database no Notion | ❌ falta |
| `NOTION_SYNC_AUTHORIZE` | Liga a escrita real (sem ela, só faz dry-run) | — | deixar vazio; usar `--authorize` |
| `PIXABAY_API_KEY` | Imagens de referência reais (Mosaico/Enredo) | pixabay.com/api/docs (grátis) | opcional |
| `TYPESAFE_API_KEY` | Camada de decisão Jev (futuro) | — | não usar ainda |

Depois de configurar: `npm run doctor` deve mostrar ✅ em Anthropic e Notion.
