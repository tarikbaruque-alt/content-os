# Mesa de Prospecção

App **separado do painel do Content OS**, feito para uma coisa: prospectar clientes no Instagram para
**serviços de conteúdo** (gestão de redes, estratégia, planejamento, calendário editorial, criação, copy,
roteiros, Reels, carrosséis, Stories, posicionamento, branding e consultoria) — com foco em **contratos mensais**.

Motor testado em [`src/prospect/`](../../src/prospect/) · testes em [`tests/prospect/`](../../tests/prospect/) ·
telas em [`apps/prospect/src/`](./src/) · publicado como Artifact privado no claude.ai.

## O que faz

| Módulo | Função |
|---|---|
| **Prospects** | Lista com etapa (novo → fechado) e prioridade; importa listas de @ |
| **Encontrar** | Buscas por nicho e cidade + critérios de bom prospect. **Não raspa o Instagram** |
| **RAIO-X DO INSTAGRAM** | 19 dimensões + cabeçalho do perfil + números observados → gargalos como **hipóteses** e 22 dores a investigar (nunca assumidas) |
| **Por que precisaria de nós?** | Oportunidade, problema, melhoria, serviço, resultado, argumento e pergunta inicial |
| **Mini auditoria** | 6 blocos, curta e visual, para gerar percepção de valor antes da venda |
| **Abordagem** | Observação real + oportunidade + pergunta. Não vende; recusa se não há fato para citar |
| **Qualificação** | 16 campos e 9 objetivos, lidos só da fala do prospect ou do que você registrou |
| **Argumentos** | 10 argumentos (posicionamento, autoridade, consistência…) escolhidos pelo problema real |
| **Objeções** | 13 objeções típicas: o que há por trás, pergunta, resposta, argumento, redução de risco, próximo passo |
| **Pitch** | Cenário + problema + impacto + oportunidade + solução + diferencial + próximo passo |
| **Minha operação** | Seus serviços/preços, diferenciais e provas verificados, processo e regras |

## Regras que o código garante (com teste)

- **Hipótese nunca vira fato.** Cada afirmação sai `Observado`, `Hipótese` ou `Confirmado` (só a fala do prospect confirma).
- **Dor nunca é assumida.** Vira hipótese só com sinal no perfil; senão é “sem indício” ou “só a conversa revela”.
- **Valor, não quantidade.** ENTREGÁVEL → BENEFÍCIO → IMPACTO → VALOR COMERCIAL. “12 posts por mês” é barrado.
- **1ª mensagem não vende** (nada de gestão de redes, pacote, proposta, preço).
- **Nada inventado:** cases, números, clientes e diferenciais só existem se você cadastrou **e verificou**. Sem faixa de preço, não estima; sem regra, não sugere desconto.
- **IA opcional e validada:** só cita trechos que você colou (item sem evidência real é descartado); a mensagem “polida” é rejeitada se perder o fato, a pergunta ou virar venda.

## Como usar o Artifact

Os dados ficam no banco do Artifact (`pro_leads`, `pro_config`) quando ele está disponível; senão, só no navegador.
Faça backup em **Minha operação → Exportar**.

## Desenvolvimento

```bash
npm run prospect:build   # gera apps/prospect/index.html (Artifact) e app.html (abrir no navegador)
npm test                 # um teste falha se o HTML publicado divergir do código-fonte
```

- Edite as telas em `apps/prospect/src/*.js|css|html` e o motor em `src/prospect/`; depois rode o build.
- `index.html` é um **fragmento** (sem `<html>`/`<body>`): o envelope é adicionado na publicação.
- Para republicar, use a URL já registrada (ver `ACESSOS.md`).
