# 🔗 Content OS — Acessos & Links

Tudo que você precisa para usar, configurar e integrar o Content OS, num lugar só.

---

## 🖥️ Painel de agentes (admin)

O painel é um arquivo **na sua pasta de trabalho**:

- **Arquivo local:** `apps/web/index.html` (abra com duplo clique no navegador)
- **Ou rode um servidor local:**
  ```bash
  npm run preview          # instruções
  npx --yes serve apps/web # sobe em http://localhost:3000
  ```
- **Link online (Artifact privado — só você abre):**
  👉 https://claude.ai/artifact/KtsKVcyzXyNUoxDTbcG6xk

> No painel: **Plano do Mês → clique num conteúdo** → abas **🎠 Criar Carrossel** e **📱 Criar Sequência de Stories**.
> Aba **Agentes** = os 12 especialistas (Estúdio Criativo: Rima, Mosaico, Enredo).

### 🔑 Configurar as chaves (uma vez só)

Abra a aba **🔑 Configuração** no painel → cole as chaves → **Baixar .env** →
salve o arquivo como **`.env` na raiz do projeto**. Pronto: os comandos leem o
`.env` automaticamente em toda execução — **fica sempre conectado, sem redigitar**.
(As chaves também ficam salvas no seu navegador para você não perder o que digitou.)

---

## 🤖 Anthropic (para a Rima/Mosaico/Enredo escreverem com IA real)

| O quê | Link |
|---|---|
| Console / conta | https://console.anthropic.com |
| Criar API Key | https://console.anthropic.com/settings/keys |
| Uso e custos | https://console.anthropic.com/settings/usage |

**Variáveis a configurar** (no ambiente do Claude Code → *Credenciais de API*):
```
CONTENT_OS_LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-5   # opcional (mais barato); default: claude-opus-5
```
**Rede:** libere o host `api.anthropic.com` na política de rede do ambiente.

---

## 📝 Notion (sincronização das páginas de conteúdo)

| O quê | Link |
|---|---|
| Criar integração interna | https://www.notion.so/my-integrations |
| Documentação da API | https://developers.notion.com/docs/create-a-notion-integration |

**Passo a passo:**
1. Crie uma **integração interna** → copie o **Internal Integration Token** (`ntn_...`).
2. Abra o **database** que vai receber os conteúdos → **••• → Connections → conecte a integração**. *(sem isso a API dá 404)*
3. Copie o **Database ID** — os 32 caracteres da URL:
   `notion.so/<workspace>/`**`<ESTES 32 CARACTERES>`**`?v=...`

**Variáveis a configurar:**
```
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=<32 caracteres>
```
**Rede:** libere o host `api.notion.com`.

**Colunas ideais do database** (o sync só preenche as que existirem):
`Nome` (title) · `Cliente`/`Objetivo`/`CTA` (text) · `Plataforma`/`Formato`/`Pilar`/`Funil`/`Função estratégica`/`Emoção` (select) · `Status` (status).

---

## 🖼️ Pixabay (imagens reais para carrossel/Stories — opcional)

| O quê | Link |
|---|---|
| Pegar API key (grátis) | https://pixabay.com/api/docs |

```
PIXABAY_API_KEY=...
```
Sem chave, o sistema gera **links de busca** (Pinterest/Pixabay) — nunca inventa imagens.

---

## ⚡ Comandos rápidos

```bash
npm run doctor       # diz o que já está conectado e o que falta
npm test             # 58 testes (deve passar tudo)
npm run pipeline     # gera o plano do cliente-exemplo (grava apps/web/generated-plan.json)
npm run notion:sync  # DRY-RUN (mostra o que seria criado no Notion)
npm run notion:sync -- --authorize   # cria de verdade (exige credenciais)
```

---

## 📂 Onde estão as coisas na pasta

| Caminho | O que é |
|---|---|
| `apps/web/index.html` | **Painel de agentes** (abra no navegador) |
| `.env.example` | Modelo de todas as variáveis (copie para `.env`) |
| `src/agents/` | Íris, Rima, **Mosaico** (carrossel), **Enredo** (Stories) |
| `src/core/integrations/` | Notion sync + referências visuais (Pixabay/Pinterest) |
| `src/pipeline/` | O pipeline ponta a ponta (Cliente → … → Notion) |
| `ARCHITECTURE.md` | Visão técnica e maturidade de cada agente |

---

> 🔒 **Nunca comite o `.env` real** (já está no `.gitignore`). As chaves ficam
> só no seu ambiente. O link do Artifact acima é **privado** — só abre na sua conta.
