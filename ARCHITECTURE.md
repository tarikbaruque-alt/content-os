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
2. **Knowledge Base** — conhecimento **profissional** (estratégia, copy, persuasão, formatos…). ([`foundation/knowledge-base/`](./foundation/knowledge-base/))
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

## 5.1 Diretrizes de produto (doutrina)

Definem a **qualidade e a profundidade** do que o sistema entrega. São
transversais e referenciadas pelos agentes (que não duplicam seu conteúdo):

| Diretriz | Governa |
|---|---|
| [Doutrina Criativa](./foundation/creative-doctrine.md) | Musa, Rima — leitura estratégica, arquitetura de desejo, persuasão ética, repertório narrativo, **anti-genérico**, controles criativos |
| [Arquitetura Editorial](./foundation/editorial-architecture.md) | Bússola — cadeia editorial e **jornada × funil × objetivo × função estratégica** |
| [Formatos](./foundation/formats.md) | Musa, Rima — **superfície × formato criativo** |
| [Modelo de Conteúdo & Calendário](./foundation/content-model.md) | Cronos — registro de conteúdo, status, geração de calendário por IA |
| [Experiência](./foundation/client-experience.md) | produto — visão interna × portal do cliente |
| [Integração Notion](./foundation/integrations/notion.md) | Cronos — camada opcional de sincronização |

## 5.2 Verificação de arquitetura (impacto das diretrizes)

As diretrizes foram checadas contra a arquitetura planejada. Resultado:

**Não muda (confirmado):**
- **Nenhum agente novo.** Copy, roteiro, carrossel, Stories e direção criativa
  permanecem **competências/workflows dentro do Estúdio Criativo (Rima)**,
  compartilhando a mesma inteligência estratégica. Teto de 10 mantido.
- Divisão de responsabilidades intacta: Musa ideação · Bússola editorial ·
  Cronos calendário · Acervo conhecimento · Maestro coordenação · Pulso ciclo.
- Kernel já construído (schemas, providers, store, governança, guardrails)
  **serve** as novas diretrizes sem reescrita.

**Ajustes aditivos necessários (registrados, a implementar na fase de cada agente):**
1. **`função estratégica` vira campo de 1ª classe**, distinto de objetivo,
   jornada e funil (afeta o modelo de conteúdo e as ideias).
2. **`formato` passa a ser composto**: `superfície + formato criativo`.
3. **Controles criativos** (intensidade comercial, criatividade, profundidade,
   emoção) entram no modelo de requisição de criação.
4. **Portão anti-genérico** vira um guardrail executável no Estúdio Criativo
   (hoje existe como regra documentada).
5. **Rastreabilidade criativa**: gatilhos e recursos narrativos utilizados são
   campos do conteúdo, não só prosa.
6. **`SyncTarget`** (Notion) entra como interface, no mesmo padrão de `LlmProvider`.

Nenhum desses ajustes exige reconstrução — todos são **extensões** do que existe.

## 5.3 Maturidade dos agentes (critério honesto)

Um agente só é **FUNCIONAL** quando recebe contexto → processa → gera resultado
→ é salvo → alimenta o próximo estágio → aparece no painel. "Executa
tecnicamente" não basta: precisa atingir a profundidade estratégica do projeto.

| Estágio | Estado | Nota |
|---|---|---|
| Íris (Inteligência) | **Funcional** | Briefing → Content DNA com estados + proveniência + guardrails; alimenta todo o pipeline; visível no painel (Análise IA). |
| Átlas (Estratégia) | **Funcional (profundo)** | Não gera "uma" estratégia: 15 caminhos ranqueados por aderência ao DNA + mix recomendado combinável no painel. |
| Musa (Ideias & Formatos) | **Funcional (profundo)** | ≥15 ideias diversas; formato recomendado por **dimensões** (produção/estrutura/narrativa/superfície) com justificativa. |
| Bússola (Editorial) | **Parcial** | Pilar→tópico no pipeline; visão dedicada por cliente ainda de exemplo. |
| Rima (Estúdio Criativo) | **Parcial** | Roteiro/copy prontos por estrutura; prosa publicável depende do provider Anthropic. |
| Cronos (Planejamento) | **Funcional** | Calendário do mês por mix de funil; payload de Notion por peça. |
| Radar (Pesquisa) | **Parcial** | Oportunidades derivadas do DNA; dados externos reais dependem de web/API. |
| Pulso (Performance) | **Parcial** | Estrutura DATA/HYPOTHESIS/INTERPRETATION/INSIGHT/RECOMMENDATION; métricas reais dependem de API de rede social. |
| Acervo (Conhecimento) | **Funcional** | Recuperação seletiva de pilares da KB. |
| Maestro (Orquestração) | **Funcional (lite)** | Encadeia o pipeline compartilhando contexto. |

Dependem de integração externa (não fabricados): **prosa publicável** (Anthropic),
**pesquisa externa** (web), **sincronização real com Notion** (API + auth),
**métricas** (APIs de rede social).

## 6. Camadas de IA (motor)

- **Claude (LLM)** — raciocínio e geração criativa: a maior parte do trabalho dos agentes.
- **Jev (TypeSafe, System One)** — decisão/classificação tipada: avaliação, roteamento e priorização (ex.: ranquear hooks, validar pilar/nível de consciência, pontuar densidade). Entra **depois** da geração, como camada de julgamento. Credencial: `TYPESAFE_API_KEY` no ambiente.

---

## 7. Estado atual e próximos passos

**Escopo definido:** Instagram-first · foco orgânico (pago = área futura).

- [x] Definições de visão e arquitetura incorporadas (este documento + `agents/` + `foundation/`)
- [x] Primeira competência detalhada: **Reels Script Intelligence** (dentro do Creative Studio)
- [x] **1º lote de materiais analisado** (tráfego orgânico Instagram) → [proposta 01](./foundation/knowledge-base/proposals/01-instagram-organico.md)
- [x] **Aprovação do estrategista** nas decisões de escopo
- [x] **Knowledge Base formalizada** (5 pilares ativos + 1 futuro) → [`foundation/knowledge-base/`](./foundation/knowledge-base/)
- [x] **Diretrizes de produto registradas** (§5.1) e **impacto arquitetural verificado** (§5.2)
- [x] **1ª fatia implementada:** kernel (schemas, LLM gateway, Content DNA store, governança, guardrails, Acervo, Maestro-lite, observabilidade) + **agente Inteligência (Íris)** + **preview do painel** — 11 testes passando
- [ ] **Validação do estrategista** (Íris + painel)
- [ ] Ligar o provider real (Anthropic) — arquitetura já pronta
- [ ] Próximo agente: **Estratégia (Átlas)** — só após validação
- [ ] Ajustes aditivos da §5.2 na fase de cada agente
