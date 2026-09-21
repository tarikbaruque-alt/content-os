# Content OS — Arquitetura

> Documento de **arquitetura conceitual**. Define *o que* o sistema é e *como*
> as partes se relacionam. **Não** é implementação — a construção da aplicação
> começa só depois da análise dos materiais de referência e da aprovação do
> estrategista.
>
> Status: **rascunho vivo** (v0.2). Nada aqui é finalizado até a etapa de
> materiais de referência ser concluída.

---

## 1. O que o Content OS é

Uma **camada de inteligência** para o trabalho de um estrategista de conteúdo —
não um app de telas, formulários ou dashboards. O produto não é uma coleção de
chatbots: é uma equipe de **agentes de IA especializados** operando por trás de
um **fluxo profissional de trabalho**.

### Objetivo final

Transformar **conhecimento + dados do cliente + pesquisa + estratégia +
criatividade + performance** em **decisões de conteúdo melhores**.

O sistema **não substitui** o julgamento do estrategista. Ele **amplia** a
capacidade de: **pensar, pesquisar, criar, planejar, executar, analisar e
aprender.**

---

## 2. As três dimensões da arquitetura

O sistema se organiza em três dimensões que se cruzam:

1. **Agentes** (§3) — *quem* faz o trabalho. 8 agentes especializados.
2. **Camadas de conhecimento** (§4) — *com base em quê* decidem. 4 fontes.
3. **Governança** (§5) — *sob quais regras* operam. Humano no comando.

```
        CONHECIMENTO (4 camadas)
                 │
                 ▼
   ┌──────────────────────────────┐
   │        8 AGENTES              │   ← executam o trabalho intelectual
   │  (fluxo profissional único)  │
   └──────────────────────────────┘
                 │
                 ▼
        GOVERNANÇA (humano aprova)
                 │
                 ▼
     DECISÕES DE CONTEÚDO MELHORES
```

---

## 3. Os agentes (núcleo de 8 + 1 curador; teto de 10)

Teto de **10 agentes**. O **núcleo são 8**; um **9º (Knowledge)** cuida da
memória profissional do sistema; o **10º fica reservado** para uma possível
camada de Orquestração (ver §3.1). Cada novo conhecimento **enriquece os
agentes existentes** — nunca cria um agente novo por arquivo.

| # | Agente | Charge (resumo) | Detalhe |
|---|--------|-----------------|---------|
| 1 | **Intelligence** | Memória estratégica, briefing e Content DNA do cliente | [`agents/01-intelligence.md`](./agents/01-intelligence.md) |
| 2 | **Strategy** | Diagnóstico, posicionamento, público, persona, Big Message, objetivos, dores, desejos, jornada, emoção | [`agents/02-strategy.md`](./agents/02-strategy.md) |
| 3 | **Research** | Nicho, referências, concorrentes, palavras-chave, tendências, pautas quentes, dados, oportunidades | [`agents/03-research.md`](./agents/03-research.md) |
| 4 | **Editorial** | Pilares, territórios, linha editorial, temas, subtemas, clusters, pautas | [`agents/04-editorial.md`](./agents/04-editorial.md) |
| 5 | **Ideas & Formats** | Ideias, conceitos, ângulos e escolha estratégica de formatos | [`agents/05-ideas-and-formats.md`](./agents/05-ideas-and-formats.md) |
| 6 | **Creative Studio** | Roteiros, Reels, headlines, hooks, copy, CTAs, carrosséis, Stories, narrativa, persuasão, direção criativa | [`agents/06-creative-studio/`](./agents/06-creative-studio/) |
| 7 | **Planning** | Calendário editorial, organização, status, produção, aprovação, futura integração com Notion | [`agents/07-planning.md`](./agents/07-planning.md) |
| 8 | **Performance** | Métricas, hipóteses, experimentos, insights, aprendizados, recomendações | [`agents/08-performance.md`](./agents/08-performance.md) |
| 9 | **Knowledge** *(curador)* | Ingestão dos materiais de referência → Knowledge Base própria: extrai princípios/frameworks, versiona, remove redundância, resolve conflitos, preserva origem | [`agents/09-knowledge.md`](./agents/09-knowledge.md) |

### 3.1 Slot 10 — reservado (Orchestration) — *decisão sua*

Um possível **Orchestrator** coordenaria o pipeline (rotear a demanda ao agente
certo, montar handoffs, consolidar entregas) sem virar mais um chatbot. Como
isso é tanto uma **função de sistema** quanto um agente, deixo **reservado**
para você decidir depois dos materiais: pode ser um 10º agente ou apenas a
camada de fluxo que conecta os outros 9. **Não criado ainda.**

### Fluxo de trabalho (não é rígido — é um pipeline colaborativo)

```
Intelligence ─→ Strategy ─→ Research ─→ Editorial ─→ Ideas & Formats ─→ Creative Studio ─→ Planning ─→ Performance
     ▲                                                                                                      │
     └──────────────────────── aprendizados retroalimentam o Content DNA ◀───────────────────────────────┘
```

Os agentes se comunicam pelo **Content DNA** (memória compartilhada) e por
**handoffs** explícitos (a saída de um é insumo do outro). Nenhum agente é um
chat isolado.

---

## 4. As 4 camadas de conhecimento

Detalhe em [`foundation/knowledge-layers.md`](./foundation/knowledge-layers.md).

1. **Content DNA** — conhecimento **específico de cada cliente**. ([`foundation/content-dna.md`](./foundation/content-dna.md))
2. **Knowledge Base** — conhecimento **profissional** (estratégia, copy, persuasão, formatos…). ([`foundation/knowledge-base.md`](./foundation/knowledge-base.md))
3. **Live Research** — informação **externa e atual** (tendências, pautas, palavras-chave).
4. **Performance Data** — **resultados reais** dos conteúdos dos clientes.

> Recomendação contextualizada = **Knowledge Base + Content DNA + Live Research + Performance Data**, combinadas quando apropriado.

---

## 5. Governança

Detalhe em [`foundation/governance.md`](./foundation/governance.md). Princípios:

- **Humano no comando:** o estrategista aprova, edita ou rejeita.
- **Inferência ≠ fato:** nada que a IA infere vira fato sobre o cliente sem aprovação (fluxo "Adicionar ao Content DNA?").
- **Sem mudança silenciosa** de arquitetura; mudanças estratégicas relevantes pedem aprovação.
- **Ética e originalidade:** os materiais de referência são **analisados**, não copiados (ver [`foundation/knowledge-ingestion.md`](./foundation/knowledge-ingestion.md)).

---

## 6. Camadas de IA (motor)

- **Claude (LLM)** — raciocínio e geração criativa: a maior parte do trabalho dos agentes.
- **Jev (TypeSafe, System One)** — decisão/classificação tipada: avaliação, roteamento e priorização (ex.: ranquear hooks, validar pilar/nível de consciência, pontuar densidade). Entra **depois** da geração, como camada de julgamento. Credencial: `TYPESAFE_API_KEY` no ambiente.

---

## 7. Estado atual e próximos passos

- [x] Definições de visão e arquitetura incorporadas (este documento + `agents/` + `foundation/`)
- [x] Primeira competência detalhada: **Reels Script Intelligence** (dentro do Creative Studio)
- [ ] **Análise dos materiais de referência** (livros, frameworks, PDFs) → Knowledge Base
- [ ] Apresentação: conhecimento encontrado, agentes enriquecidos, regras/frameworks, redundâncias, conflitos, melhorias, estrutura da Knowledge Base
- [ ] **Aprovação do estrategista**
- [ ] Documentação definitiva e **implementação incremental**
