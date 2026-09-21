# Agentes do Content OS

Núcleo de **8 agentes** + **1 curador** (Knowledge), com teto de **10** (o 10º
reservado para uma possível camada de Orquestração — ver
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §3.1).

Os agentes **não são chatbots isolados**. São uma equipe especializada operando
por trás de um fluxo profissional único, comunicando-se pelo **Content DNA**
(memória compartilhada) e por **handoffs** explícitos.

## Mapa

| # | Agente | Charge |
|---|--------|--------|
| 1 | [Intelligence](./01-intelligence.md) | Memória estratégica, briefing, Content DNA |
| 2 | [Strategy](./02-strategy.md) | Diagnóstico, posicionamento, persona, Big Message, objetivos, emoção |
| 3 | [Research](./03-research.md) | Nicho, concorrentes, palavras-chave, tendências, pautas quentes |
| 4 | [Editorial](./04-editorial.md) | Pilares, territórios, linha editorial, temas, clusters |
| 5 | [Ideas & Formats](./05-ideas-and-formats.md) | Ideias, conceitos, ângulos, escolha de formatos |
| 6 | [Creative Studio](./06-creative-studio/) | Roteiros, headlines, hooks, copy, CTAs, carrosséis, Stories |
| 7 | [Planning](./07-planning.md) | Calendário, status, produção, aprovação |
| 8 | [Performance](./08-performance.md) | Métricas, hipóteses, experimentos, aprendizados |
| 9 | [Knowledge](./09-knowledge.md) | Curadoria dos materiais → Knowledge Base |

## Fluxo (pipeline colaborativo, não rígido)

```
Intelligence → Strategy → Research → Editorial → Ideas & Formats → Creative Studio → Planning → Performance
     ▲                                                                                              │
     └─────────────── aprendizados aprovados retroalimentam o Content DNA ◀────────────────────────┘

Knowledge (curador) alimenta a Knowledge Base, que serve todos os agentes.
```

## Anatomia de cada agente (template)

Cada ficha descreve: **Charge**, **Responsabilidades**, **Entradas**,
**Saídas**, **Camadas de conhecimento usadas**, **Handoffs**, **Fronteiras**
(o que NÃO faz) e **Status**.

> As fichas atuais definem o **comportamento em nível de arquitetura**. O
> detalhamento fino (prompts, critérios, frameworks) é fechado **após a análise
> dos materiais de referência** e sua aprovação.
