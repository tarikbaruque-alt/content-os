# content-os

Plataforma de inteligência e automação para estratégia, planejamento e criação
de conteúdo com agentes de IA.

O Content OS é uma **camada de inteligência** para o trabalho de um estrategista
de conteúdo — não um app de telas. Uma equipe de **agentes de IA
especializados** que **amplia** (não substitui) a capacidade de pensar,
pesquisar, criar, planejar, executar, analisar e aprender.

## Comece por aqui

- 📐 **[ARCHITECTURE.md](./ARCHITECTURE.md)** — a arquitetura conceitual completa.
- 🔗 **[ACESSOS.md](./ACESSOS.md)** — painel, links e chaves de API num lugar só.

## Rodar em 5 minutos

Requer Node 20+.

```bash
npm install
npm test        # 81 testes — deve passar tudo
npm run smoke   # verificação ponta a ponta (DNA → … → Notion)
npm run pipeline  # gera o plano do cliente-exemplo → apps/web/generated-plan.json
```

**Ver o painel:** abra `apps/web/index.html` no navegador (ou `npx --yes serve apps/web`).

**Editar o painel:** o código fica dividido por assunto em `apps/web/src/` (estilos, estrutura, render, formatos, criação, calendário, vitrine do cliente, configuração, briefing/caixa de entrada, clientes ativos, dados). Edite as partes e rode `npm run panel:sync`, que monta `apps/web/index.html` (e as cópias `app.html` e `AGENTES INTELIGENTES/painel.html`). Um teste garante que o painel é exatamente a junção das partes.
No painel → **Plano do Mês → clique num conteúdo** para ver o esqueleto estratégico,
o carrossel (🎠) e a sequência de Stories (📱) prontos.

**Ligar as integrações (opcional):** abra a aba **🔑 Configuração** no painel,
cole as chaves e baixe o `.env` para a raiz — ou copie `.env.example` para `.env`.
Depois:

```bash
npm run doctor   # confere Anthropic + Notion + Pixabay
npm run notion:sync -- --authorize   # cria as páginas no seu Notion
```

Provedor de IA: `CONTENT_OS_LLM_PROVIDER=mock` (padrão, offline, determinístico)
ou `anthropic` (prosa premium — exige `ANTHROPIC_API_KEY`). Guardrails valem
sempre: nunca inventa prova, autoridade, urgência ou escassez; nada é enviado ao
Notion sem `--authorize`.

## Agentes

Ver [`agents/`](./agents/). O **Estúdio Criativo** é um squad de 3 especialistas
(Rima · copy/roteiro, Mosaico · carrossel, Enredo · sequência de Stories).

1. [Intelligence](./agents/01-intelligence.md) (Íris) · 2. [Strategy](./agents/02-strategy.md) (Átlas) ·
3. [Research](./agents/03-research.md) (Radar) · 4. [Editorial](./agents/04-editorial.md) (Bússola) ·
5. [Ideas & Formats](./agents/05-ideas-and-formats.md) (Musa) · 6. [Creative Studio](./agents/06-creative-studio/) (Rima · Mosaico · Enredo) ·
7. [Planning](./agents/07-planning.md) (Cronos) · 8. [Performance](./agents/08-performance.md) (Pulso) ·
9. [Knowledge](./agents/09-knowledge.md) (Acervo) · 10. Orquestração (Maestro)

## Fundações

Ver [`foundation/`](./foundation/).

- [Content DNA](./foundation/content-dna.md) — memória estratégica por cliente.
- [Camadas de conhecimento](./foundation/knowledge-layers.md) — Content DNA · Knowledge Base · Live Research · Performance Data.
- [Knowledge Base](./foundation/knowledge-base/) — conhecimento profissional próprio.
- [Ingestão de materiais](./foundation/knowledge-ingestion.md) — analisar, não copiar.
- [Governança](./foundation/governance.md) — humano no comando; inferência ≠ fato.

## Diretrizes de produto

- ⭐ [Doutrina Criativa](./foundation/creative-doctrine.md) — profundidade criativa e **anti-genérico**.
- [Arquitetura Editorial](./foundation/editorial-architecture.md) — cadeia editorial e função estratégica.
- [Formatos](./foundation/formats.md) — superfície × formato criativo.
- [Modelo de Conteúdo & Calendário](./foundation/content-model.md) — registro, status e geração por IA.
- [Experiência](./foundation/client-experience.md) — visão interna × portal do cliente.
- [Integração Notion](./foundation/integrations/notion.md) — camada opcional.

## Camadas de IA

- **Claude (LLM)** — raciocínio e geração criativa (a maior parte do trabalho).
- **Jev (TypeSafe, System One)** — decisão/classificação tipada (avaliação,
  roteamento, priorização). Credencial `TYPESAFE_API_KEY` no ambiente.

## Etapa atual — V1 funcional

O pipeline ponta a ponta está **implementado e testado** (81 testes):
Cliente → Content DNA (Íris) → Estratégia (Átlas, caminhos + mix) → Pesquisa
(Radar) → Editorial (Bússola) → Ideias & Formatos (Musa) → Produção
(Rima/copy · Mosaico/carrossel · Enredo/Stories) → Calendário (Cronos) →
Notion. Cada peça carrega o esqueleto estratégico completo (Persona → Objetivo →
Propósito → Dor/Desejo → Big Message → Emoção → Percepção → Função →
Funil/Jornada → Gatilhos → Elementos literários → Headline → Conteúdo → CTA),
editável e visível no painel.

**Funcional agora:** pipeline, esqueleto estratégico, carrossel e Stories,
distribuição por funil, painel, `.env` auto-carregado, sync Notion (schema-aware,
com trava de autorização). **Prosa premium** liga com `ANTHROPIC_API_KEY`;
**imagens reais** com `PIXABAY_API_KEY`.

**Depende de API externa (não implementado):** pesquisa externa real (Radar) e
métricas reais de performance (Pulso).

Estado honesto de cada agente: [ARCHITECTURE.md §5.3](./ARCHITECTURE.md).
