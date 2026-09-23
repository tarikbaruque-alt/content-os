# 🤖 AGENTES INTELIGENTES — Content OS

Bem-vindo. Aqui está o acesso rápido ao seu painel e às integrações.

## 🖥️ Abrir o painel

- **Online (recomendado):** clique em **`Painel Content OS.url`** (abre no navegador)
  ou acesse: https://claude.ai/artifact/KtsKVcyzXyNUoxDTbcG6xk
- **Offline (no seu PC):** dê duplo clique em **`painel.html`** (nesta mesma pasta).

No painel: **Plano do Mês** / **Calendário** → clique num conteúdo para ver o
esqueleto estratégico completo + 🎠 Carrossel + 📱 Sequência de Stories.

## ⚙️ Integrações finais (Anthropic + Notion)

Jeito mais fácil: no painel → aba **🔑 Configuração** → cole as chaves →
**Baixar .env** → salve como `.env` na raiz do projeto. Depois, no terminal do
projeto:

```bash
npm run doctor       # confere se Anthropic + Notion conectaram
npm run pipeline     # gera o conteúdo (com IA, se a chave Anthropic estiver ativa)
npm run notion:sync -- --authorize   # cria as páginas no seu Notion
```

### As 2 chaves

1. **Anthropic** — https://console.anthropic.com/settings/keys (`sk-ant-…`)
   e libere o host `api.anthropic.com` na rede do ambiente.
2. **Notion** — https://www.notion.so/my-integrations (token `ntn_…`),
   **conecte a integração ao seu database** (••• → Connections),
   copie o **Database ID** (32 caracteres da URL) e libere `api.notion.com`.

> Guia completo (todos os links e comandos): veja **`../ACESSOS.md`** na raiz do projeto.

---
_Content OS · painel de agentes inteligentes para estratégia de conteúdo._
