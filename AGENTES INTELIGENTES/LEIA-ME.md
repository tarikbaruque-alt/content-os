# 🤖 AGENTES INTELIGENTES — Content OS

Bem-vindo. Aqui está o acesso rápido ao seu painel e às integrações.

## 🖥️ Abrir o painel

- **Online (recomendado — IA ao vivo):** clique em **`Painel Content OS.url`**
  ou acesse: https://claude.ai/artifact/B4rLbACkVLcpVn1mxLeVJy
- **Offline (no seu PC):** dê duplo clique em **`painel.html`** (nesta mesma
  pasta) — mesma versão, dados salvos neste navegador, sem IA ao vivo.

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

### 🧭 O painel te guia e aprende com você

- **Dashboard → Próximos passos:** mostra o que falta em cada cliente (Ficha →
  DNA → Estratégia → Editorial → Ideias → Formatos → Calendário → peça com IA →
  resultados) e leva direto para a próxima etapa.
- **✎ rascunho:** peça escrita sem IA aparece marcada — é base para revisar,
  **não publique assim**.
- **Aprovar / Salvar edições** numa peça: ela vira exemplo da voz do cliente e
  os agentes passam a imitar esse estilo nas próximas gerações.
- **📈 Resultado depois de publicar:** cole alcance, salvamentos e
  compartilhamentos no conteúdo; a aba **Formatos** mostra quais formatos
  funcionam para aquele cliente.

### ⚠️ Os botões "Gerar" (IA ao vivo) só funcionam ONLINE

Os botões de **Gerar Estratégia / Pesquisa / Linha Editorial / Ideias /
Formatos / Planejamento / Roteiro / Copy / Carrossel / Stories** chamam a IA de
verdade e salvam o resultado — isso roda **dentro do painel publicado no
claude.ai** (link acima), sem terminal nem chave Anthropic. Na cópia offline,
eles mostram um aviso pedindo para abrir pelo link.

## 📨 Cliente novo pelo formulário de briefing

1. No painel: **Clientes → 📨 Formulário de briefing para enviar**. Informe seu nome/agência e seu WhatsApp e baixe o arquivo `briefing-de-conteudo.html`.
2. Envie o arquivo ao cliente. Ele abre no celular (sem login), responde (negócio, **propósito**, **identidade**, público, dores, diferencial, tom, **objetivos**, **foco no funil (topo, meio ou fundo)**, **quantos conteúdos por semana**, **tempo para gravar**, dias de postagem, referências) e toca em **Enviar pelo WhatsApp**.
3. O cliente toca em **📧 Enviar por e-mail** (vai para o seu Gmail). No painel: **Clientes → 📬 Caixa de entrada de briefings → ↻ Verificar novos briefings → ✦ Criar cliente e montar tudo**. (Se ele mandar pelo WhatsApp: **📥 Importar briefing (colar)** e cole a mensagem.) O cliente é criado com ficha, rotina (frequência, dias, limite de gravações) e referências.
4. Clique em **✦ Montar tudo automaticamente** (30, 45, 60 ou 90 dias): Content DNA → Estratégia → Linha Editorial → Ideias → Calendário, já na frequência que o cliente pediu. Depois, revise e aprove o Content DNA.

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
