# CREATIVE STUDIO

Módulo do **content-os** responsável pela **criação** de conteúdo — a camada
onde estratégia vira peça pronta para produção.

O Creative Studio é organizado em **competências**: unidades especializadas,
cada uma com um objetivo claro, entradas definidas e um formato de entrega.
Cada competência é descrita por um `SKILL.md` (o manual operacional que
governa como ela pensa e produz) e pode ser acionada por um agente de IA ou
por uma pessoa.

## Competências

| Competência | Pasta | O que faz |
|---|---|---|
| **Reels Script Intelligence** | [`reels-script-intelligence/`](./reels-script-intelligence/) | Roteiros de Reels e vídeos curtos de alto valor, estrategicamente alinhados ao cliente. |

## Princípio do módulo

Nada aqui é criado apenas para preencher calendário. Cada peça precisa ter
**função estratégica**, **densidade real** e **alinhamento** com o cliente
(Content DNA, persona, mensagem, objetivo). Volume sem profundidade não é
entrega — é ruído.

## Onde cada camada de IA atua

- **Claude (LLM):** geração criativa — roteiro, estrutura narrativa, hooks,
  headline, copy. É o motor desta competência.
- **Jev (TypeSafe, System One):** decisão e classificação tipada — por exemplo,
  escolher qual variação de hook tende a reter mais, validar se o roteiro está
  no pilar/nível de consciência certos, ou pontuar densidade. Entra como
  camada de **avaliação**, depois da geração. Ver `../integrations/` quando a
  integração for implementada.
