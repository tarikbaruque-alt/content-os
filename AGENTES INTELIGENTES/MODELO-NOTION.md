# 🗂️ Modelo do Database do Notion — Content OS

Crie um database no Notion com estas colunas para o `npm run notion:sync`
preencher **100%**. O sync é *schema-aware*: só escreve nas colunas que existirem
com o tipo certo — então nomes e tipos precisam bater.

## Jeito rápido (importar o CSV)

1. No Notion: **+ New page → Import → CSV** e escolha **`modelo-notion.csv`**
   (nesta pasta). Isso cria o database já com **todas as colunas**.
2. O Notion importa tudo como *texto*. Ajuste os **tipos** das colunas abaixo
   (clique no título da coluna → *Edit property → Type*):

| Coluna | Tipo no Notion |
|---|---|
| **Nome** | Title (título — já vem assim) |
| Cliente | Text |
| Data | Text |
| Tema | Text |
| Plataforma | Select |
| Formato | Select |
| Pilar | Select |
| Persona | Text |
| Objetivo | Text |
| Funil | Select |
| Função estratégica | Select |
| Big Message | Text |
| Emoção | Select |
| Headline | Text |
| CTA | Text |
| Status | Status (ou Select) |

> Dica: em *Funil* os valores são `topo`, `meio`, `fundo`. Em *Status*:
> `PLANNED`, `REVIEW`, `WAITING APPROVAL`, `IN PRODUCTION`, `APPROVED`,
> `PUBLISHED`. O Notion cria as opções automaticamente na primeira sincronização.

## Depois de criar o database

1. **Conecte a integração** ao database: abra o database → **••• → Connections →
   Connect to → sua integração** *(sem isso a API responde 404).*
2. Copie o **Database ID**: na URL `notion.so/…/`**`<32 caracteres>`**`?v=…`
3. No `.env` (ou na aba 🔑 Configuração do painel):
   ```
   NOTION_API_KEY=ntn_...
   NOTION_DATABASE_ID=<32 caracteres>
   ```
4. Rode:
   ```bash
   npm run doctor                       # confere a conexão + cobertura das colunas
   npm run notion:sync                  # DRY-RUN (mostra o que vai criar)
   npm run notion:sync -- --authorize   # cria as páginas de verdade
   ```

## O que vai dentro de cada página

Além das colunas acima, o **corpo** de cada página leva a produção completa,
em 3 seções claras para o cliente entender:

- 📌 **O QUE será publicado** — headline + copy/legenda + CTA
- 🎬 **COMO será produzido** — roteiro + carrossel + sequência de Stories
- 🎯 **POR QUE faz parte da estratégia** — objetivo, função, persona, propósito,
  Big Message, emoção (+ porquê), percepção, gatilhos e elementos literários

Assim, quando você compartilhar essa página com o cliente, ele entende
**o que + como + por quê** — e o Notion cuida da permissão de acesso.
