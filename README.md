# content-os

Plataforma de inteligência e automação para estratégia, planejamento e criação
de conteúdo com agentes de IA.

O Content OS é uma **camada de inteligência** para o trabalho de um estrategista
de conteúdo — não um app de telas. Uma equipe de **agentes de IA
especializados** que **amplia** (não substitui) a capacidade de pensar,
pesquisar, criar, planejar, executar, analisar e aprender.

## Comece por aqui

- 📐 **[ARCHITECTURE.md](./ARCHITECTURE.md)** — a arquitetura conceitual completa.

## Agentes (núcleo de 8 + curador; teto de 10)

Ver [`agents/`](./agents/).

1. [Intelligence](./agents/01-intelligence.md) · 2. [Strategy](./agents/02-strategy.md) ·
3. [Research](./agents/03-research.md) · 4. [Editorial](./agents/04-editorial.md) ·
5. [Ideas & Formats](./agents/05-ideas-and-formats.md) · 6. [Creative Studio](./agents/06-creative-studio/) ·
7. [Planning](./agents/07-planning.md) · 8. [Performance](./agents/08-performance.md) ·
9. [Knowledge](./agents/09-knowledge.md) · *(10. Orquestração — reservado)*

## Fundações

Ver [`foundation/`](./foundation/).

- [Content DNA](./foundation/content-dna.md) — memória estratégica por cliente.
- [Camadas de conhecimento](./foundation/knowledge-layers.md) — Content DNA · Knowledge Base · Live Research · Performance Data.
- [Knowledge Base](./foundation/knowledge-base.md) — conhecimento profissional próprio.
- [Ingestão de materiais](./foundation/knowledge-ingestion.md) — analisar, não copiar.
- [Governança](./foundation/governance.md) — humano no comando; inferência ≠ fato.

## Camadas de IA

- **Claude (LLM)** — raciocínio e geração criativa (a maior parte do trabalho).
- **Jev (TypeSafe, System One)** — decisão/classificação tipada (avaliação,
  roteamento, priorização). Credencial `TYPESAFE_API_KEY` no ambiente.

## Etapa atual

Incorporando definições à arquitetura. **A implementação da aplicação ainda não
começou** — o próximo passo é a **análise dos materiais de referência** e a
**aprovação do estrategista** antes de formalizar e implementar. Ver
[ARCHITECTURE.md §7](./ARCHITECTURE.md).
