# 🤖 AGENTES INTELIGENTES — Content OS

Bem-vindo. Aqui está o acesso rápido ao seu painel e às integrações.

## 🖥️ Abrir o painel

- **Versão mais atual (recomendado agora):** dê duplo clique em **`painel.html`**
  (nesta mesma pasta) — já tem a aba **Formatos**, a **Ficha do cliente** e o
  **Backup**. Tudo que você digitar fica salvo neste navegador.
- **Online (IA ao vivo):** **`Painel Content OS.url`** ou
  https://claude.ai/artifact/KtsKVcyzXyNUoxDTbcG6xk — ⚠️ ainda na versão
  anterior (sem Formatos/Ficha) até ser republicado.

No painel: **Plano do Mês** / **Calendário** → clique num conteúdo para ver o
esqueleto estratégico completo + 🎠 Carrossel + 📱 Sequência de Stories.

### 💾 Tudo o que você digita fica gravado

Cada cliente tem uma **Ficha do cliente** (aba **Content DNA**): nome, nicho,
@, site, região, ticket, produtos/serviços, público, tom de voz, o que **não**
pode aparecer e observações fixas. Você digita **uma vez** e ela salva
sozinha — assim como o briefing, os registros do DNA e as referências. Todos
os agentes usam a ficha como fato.

- **Pelo link do claude.ai:** fica gravado no painel publicado.
- **Offline (`painel.html`):** fica gravado **neste navegador** (dá para
  cadastrar clientes e preencher tudo; só os botões de IA exigem o link).
- Para levar os clientes de um para o outro (ou ter cópia de segurança):
  aba **🔑 Configuração → Backup dos clientes → Exportar / Importar**.

### ⚠️ Os botões "Gerar" (IA ao vivo) só funcionam ONLINE

Os botões de **Gerar Estratégia / Pesquisa / Linha Editorial / Ideias /
Formatos / Planejamento / Roteiro / Copy / Carrossel / Stories** chamam a IA de
verdade e salvam o resultado — isso roda **dentro do painel publicado no
claude.ai** (link acima), sem terminal nem chave Anthropic. Na cópia offline,
eles mostram um aviso pedindo para abrir pelo link.

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
