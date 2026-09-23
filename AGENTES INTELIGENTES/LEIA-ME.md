# 🤖 AGENTES INTELIGENTES — Content OS

Bem-vindo. Aqui está o acesso rápido ao seu painel e às integrações.

## 🖥️ Abrir o painel

- **Online (recomendado):** clique em **`Painel Content OS.url`** (abre no navegador)
  ou acesse: https://claude.ai/artifact/KtsKVcyzXyNUoxDTbcG6xk
- **Offline (no seu PC):** dê duplo clique em **`painel.html`** (nesta mesma pasta).

No painel: **Plano do Mês** / **Calendário** → clique num conteúdo para ver o
esqueleto estratégico completo + 🎠 Carrossel + 📱 Sequência de Stories.

### ⚠️ Cadastrar clientes novos e os botões "Gerar" só funcionam ONLINE

A partir desta versão, o painel permite **cadastrar clientes reais do zero**
(botão **+ Novo cliente**) e tem botões de **Gerar Estratégia / Pesquisa /
Linha Editorial / Ideias / Planejamento / Roteiro / Copy / Carrossel /
Stories** que chamam a IA de verdade e salvam o resultado — tudo isso roda
**dentro do próprio painel publicado no claude.ai** (link acima), sem precisar
de terminal nem de chave Anthropic no `.env`. Cada geração usa o seu uso do
Claude (aparece um aviso de permissão na primeira vez).

Isso **só funciona pelo link do claude.ai** — a cópia offline (`painel.html`
aberto direto do seu PC) não tem essa capacidade e mostra um aviso pedindo
para você abrir pelo link. Os 4 clientes-exemplo (Studio Aurora, Dra. Marina,
Verde Vivo, Rafa Nutri) continuam funcionando normalmente nas duas versões.

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
