# Content OS — Plano Técnico v1

> Aprovado pelo estrategista. Registra a arquitetura técnica e o plano de
> implementação incremental. Stack: **TypeScript**. 1º agente: **Inteligência
> (Íris)**. Provider inicial: **mock** (real conectável depois sem reescrever).

## Princípio
Entender → Pensar → Pesquisar → Planejar → Criar → Executar → Medir → Aprender → Melhorar.
A IA existe para **melhores decisões de conteúdo**, não para produzir mais.

## Os 10 (agente × ferramenta × workflow) — com nomes próprios

| # | Função | Nome | Classificação |
|---|--------|------|---------------|
| 1 | Inteligência | **Íris** | Agente (raciocínio) |
| 2 | Estratégia | **Átlas** | Agente |
| 3 | Pesquisa | **Radar** | Agente + ferramentas externas |
| 4 | Editorial | **Bússola** | Agente |
| 5 | Ideias & Formatos | **Musa** | Agente |
| 6 | Estúdio Criativo | **Rima** | Agente (competências) |
| 7 | Planejamento | **Cronos** | Agente leve + workflow (estados) |
| 8 | Performance | **Pulso** | Agente + ferramentas (métricas) |
| 9 | Conhecimento | **Acervo** | Camada de recuperação (não é chatbot) |
| 10 | Orquestrador | **Maestro** | Controlador/coordenação (não é chatbot) |

Ferramentas compartilhadas (infra): Content DNA store, KB retriever, LLM gateway
(multi-provedor), Decision gateway (Jev), Research tools, Metrics, Notion.

## Arquitetura técnica
- **TypeScript** (Node 20+), **Zod** para schemas tipados + validação.
- **LLM gateway** com interface `LLMProvider` + adapters (`mock` agora, `anthropic`
  depois) — sem lock-in. Interface `DecisionProvider` para o Jev (futuro).
- **Content DNA store**: interface + adapter **em arquivos versionados (JSON/cliente)**
  → trocável por Postgres (DB-ready).
- **KB retriever**: recupera **apenas** os pilares relevantes por tarefa.
- **Guardrails** na fronteira (Zod + regras anti-invenção + proveniência + no overwrite).
- **Observabilidade**: logger estruturado + trace por execução.
- **Testes**: Vitest (unit + integração determinística com mock; smoke real gated).

## Governança de memória (Content DNA)
Estados: **FACT · HYPOTHESIS · INSIGHT · STRATEGIC_DECISION · LEARNING**.
Seções: **Business · Audience · VoC · Positioning · Communication · Strategic Memory**.
Fluxo: agente **sugere** → humano **APPROVE / EDIT / REJECT**. Nunca overwrite
silencioso; proveniência (fonte/URL/data/agente/confiança) obrigatória.

## Primeiro agente — Inteligência (Íris)
Raiz do grafo: não depende de nenhum agente e produz o Content DNA. Implementá-lo
constrói o **kernel** reutilizável (schemas, LLM gateway, store, governança,
guardrails, KB retriever, orquestrador-lite, observabilidade, testes).

- **Input** `IntelligenceInput`: `{ clientId, rawInputs:[{type,content,source}], focus? }`
- **Output** `ContentDNASuggestionSet`: `{ clientId, suggestions:[{section,field,value,state,confidence,provenance,rationale}] }`
- **Regra**: saída são **sugestões** — nada entra no DNA sem aprovação humana.

## Ritmo
PLAN → IMPLEMENT → TEST → REVIEW → COMMIT → NEXT. Uma fatia por vez, testável.
Após validar Íris (agente + painel), seguir para o 2º agente (Estratégia/Átlas).

## Painel (preview)
Primeira versão visual (SaaS, mock) para navegar o conceito: visão geral,
clientes, Content DNA, agentes+status, estratégia, pesquisa, editorial,
conteúdos, calendário, performance, Knowledge Base. Os agentes são infra nos
bastidores; o painel mostra o **trabalho**, não 10 chatbots.
