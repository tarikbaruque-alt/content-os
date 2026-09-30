# Módulo COMERCIAL — máquina comercial consultiva

> **Objetivo:** ajudar a encontrar, priorizar, abordar, qualificar, negociar e fechar —
> de forma **consultiva, estratégica e orientada a valor**. Nunca agressiva, manipuladora
> ou inventiva.
>
> **Status:** Fase 1 (motor + testes) ✅ · Fase 2 (telas no painel, persistência, IA de prosa) ⏳ ·
> Proposta persuasiva ⏳ (aguardando a estrutura desejada).
> ⚠ Este módulo **estende** o núcleo de 10 agentes; por isso vive em registro próprio
> (`src/commercial/registry.ts`) até a sua aprovação (ver `ARCHITECTURE.md` §3).

> **Para prospectar serviços de conteúdo no Instagram** use o app dedicado [`apps/prospect`](../../apps/prospect/README.md) (Mesa de Prospecção). Este módulo é genérico (qualquer serviço) e serviu de base para as regras de honestidade.

Código: [`src/commercial/`](../../src/commercial/) · Testes: [`tests/commercial/`](../../tests/commercial/) ·
Demonstração (dados **fictícios**): `npm run commercial [diagnostico|abordagem|descoberta|objecao|negociacao|coach|fechamento]`

## Regras inegociáveis (aplicadas em código e cobertas por teste)

| Regra | Como é garantida |
|---|---|
| Nunca inventar cases, números, clientes, resultados ou provas | Autoridade só de `ProofItem` **verificado** (e, se citar resultado, **documentado**). Números em textos gerados precisam existir em dados cadastrados (`findUnsupportedNumbers`). Sem prova → processo, metodologia, clareza, profissionalismo, especialização. |
| Hipótese ≠ fato | Toda afirmação sai como `OBSERVADO` (visto, com fonte), `HIPOTESE` (a validar) ou `CONFIRMADO` (dito pelo lead). Sem evidência, é rebaixada a `HIPOTESE` — nunca promovida. |
| Sem valores inventados | Ticket só de faixa **cadastrada** no serviço; sem faixa, o sistema não estima. |
| Sem desconto por conta própria | `discountPolicy`: só existe com `descontoMaximoPct` cadastrado; é a **última** opção da negociação; preço nunca abre com desconto. |
| Primeira mensagem não vende | `OBSERVAÇÃO REAL + OPORTUNIDADE + PERGUNTA`. **Recusa** gerar se não houver observação real com fonte. Frases genéricas/promessas/escassez são barradas. |
| Humano no comando | O módulo **sugere**; nada é enviado sem aprovação. |

## Agentes

| Agente | O que faz | Arquivo |
|---|---|---|
| **Garimpo** (Prospecção) | Avalia o lead só com observações registradas (12 dimensões); prioridade ALTA/MÉDIA/BAIXA/INDEFINIDA; hipóteses, melhor serviço, ângulo, ticket cadastrado, lacunas | `assessment.ts` |
| **ANALISAR OPORTUNIDADE** | Diagnóstico com as 12 seções pedidas | `diagnosis.ts` |
| **Abertura** | Primeira abordagem: 2 mensagens curtas + 1 e-mail | `approach.ts` |
| **Sonda** | Descoberta: 12 campos (quer, porquê, problema, impacto, custo, resultado, urgência, prioridade, investimento, decisor, outros decisores, já tentou) + perguntas só do que falta, cada uma com finalidade | `discovery.ts` |
| **Value Builder** | Entregável → benefício → impacto → valor, para 10 tipos de serviço | `value.ts` |
| **Lastro** | Seleciona autoridade legítima e explica o que **não** pode usar | `authority.ts` |
| **Objection Engine** | 15 objeções: explícita → implícitas → pergunta de causa → resposta → valor → risco → próximo passo | `objections.ts` |
| **Acordo** | Contra-proposta: valor → escopo → fase → parcelamento → condição → pacote → recorrência → up/downsell → desconto (último) | `negotiation.ts` |
| **Deal Coach** | "O que impede este negócio de fechar?" | `coach.ts` |
| **Fechamento** (PREPARAR FECHAMENTO) | Resumo executivo + roteiro dinâmico de 15 etapas | `closing.ts` |

## O que você precisa cadastrar (é daqui que sai tudo)

1. **Catálogo de serviços** (`ServiceOffer`): categoria, entregáveis, se é porta de entrada, se é recorrente e a **faixa de ticket**.
2. **Provas** (`ProofItem`): cases, portfólio, metodologia, processo etc. — com **fonte** e marcadas como **verificadas** por um humano.
3. **Regras comerciais** (`CommercialRules`): desconto máximo e condições, parcelamento, margem mínima, fase inicial.
4. **Processo** da operação (etapas) — usado na redução de risco.
5. **Por lead**: observações reais com fonte e avaliação (`forte/regular/fraca/ausente`), conversa, orçamento, decisores.

## Próximas fases

- **Fase 2 — Painel:** telas Leads/Pipeline, botão **ANALISAR OPORTUNIDADE**, **PREPARAR FECHAMENTO**, cadastro de catálogo/provas/regras, persistência (coleções `cos_leads`, `cos_catalog`, `cos_proofs`, `cos_rules`).
- **Fase 2 — IA de prosa:** `COMMERCIAL_DOCTRINE` (em `prompts.ts`) para a IA redigir com mais naturalidade; toda saída passa por `validateOutboundText` antes de chegar a você.
- **Proposta persuasiva** baseada no diagnóstico — aguardando a estrutura desejada.
- **Coleta de sinais** (leitura de site/Instagram) — hoje as observações são registradas por você.
