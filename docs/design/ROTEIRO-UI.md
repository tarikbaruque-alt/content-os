# Roteiro-mestre da interface do Content OS

Fonte visual única: Figma "CRM Dashboard (Community)", frame `9:10` (kit Untitled UI).
Referência salva em `docs/design/figma-crm-referencia.png`. Ícones reais em `apps/web/assets/icones/`
(baixados do Figma; nunca desenhar ícone à mão).

Este documento é o contrato. Toda tela é refeita por ele. Nada do visual antigo sobrevive
por inércia: se um bloco não está descrito aqui, ele é redesenhado ou sai.

---

## 1. Princípios

1. **Tudo branco.** Fundo da página, do menu, dos quadros e das gavetas: `#FFFFFF`. A única superfície
   cinza é o cabeçalho de tabela e o hover (`#F9F9FD`). Nenhum fundo colorido em bloco de texto.
2. **Um nível de moldura.** Quadro nunca dentro de quadro. Dentro de um quadro, a divisão é por
   linha fina (`1px #ECECEE`) ou por espaço, nunca por outra caixa.
3. **Cor só quer dizer estado.** Roxo `#4D4AEA` = ação e seleção. Verde = aprovado/ok. Cinza = neutro.
   Amarelo = pendente. Vermelho = erro. Nada de pílula colorida decorativa, coração, laranja, degradê.
4. **Tipografia do Figma, sem invenção.** Inter. Sem rótulo minúsculo em CAIXA ALTA com espaçamento
   (o "eyebrow" antigo). Rótulo é 14px/500 `#57595B` em caixa normal.
5. **Texto sem cara de IA.** Sem travessão (—), sem seta (→), sem emoji, sem ✓ ✕ ★, sem "//".
   Frase curta, verbo no início dos botões ("Aprovar", "Gerar ideias"). Sentence case.
6. **Uma decisão por tela.** O que é configuração raramente usada vai para uma gaveta
   ("Configurar rotina"), não para o topo da tela.
7. **Estrutura por processo.** Menu: Hoje, Clientes, Agentes; Configuração no rodapé.
   Cliente: Entender, Planejar, Calendário, Resultados, Operação.

## 2. Tokens (medidos no Figma)

| Token | Valor | Uso |
|---|---|---|
| ink | `#2A2A2A` | texto principal, ícones |
| muted | `#57595B` | rótulos, texto de apoio |
| faint | `#8C8E90` | placeholder, aba inativa, legenda |
| line | `#ECECEE` | bordas de quadro, separadores, fundo de chip neutro |
| line-strong | `#E0E0E0` | borda de botão secundário, campo, seletor |
| surface-2 | `#F9F9FD` | cabeçalho de tabela, hover, badge do menu |
| brand | `#4D4AEA` | botão primário, aba ativa, progresso, link |
| brand-weak | `#F4F3FF` | item ativo do menu, sub-aba ativa, filtro-pílula |
| good / good-bg | `#147129` / `#EAFDEE` | chip "aprovado", tendência positiva |
| radius | 6 (item de menu), 8 (botão, campo, cartão de número), 12 (quadro, tabela), 100/200 (chip, progresso) |

Tipografia (Inter): Título de página 28/38 500 · Número grande 36/46 500 -1px · Título de quadro 18/24 500 ·
Corpo 14/18 500 (texto de linha) e 14/20 400 (parágrafo) · Pequeno 12/16 500 (chip, cabeçalho de tabela) ·
Menu 16/20 500.

## 3. Biblioteca de componentes

- **Botão.** 40px de altura, padding 0 16, raio 8, 14/18 500, ícone 20–24 à esquerda com gap 8.
  Primário: fundo brand, texto branco. Secundário: branco, borda `#E0E0E0`. Terciário/link: sem borda,
  texto brand. Ícone: 40×40.
- **Campo de texto / área de texto.** Branco, borda 1px `#E0E0E0`, raio 8, 40px (área: mín. 96px),
  padding 0 14, texto 14 `#2A2A2A`, placeholder `#8C8E90`. Foco: borda brand + anel 4px `#F4F3FF`.
  Rótulo acima: 14/18 500 `#57595B`, gap 6.
- **Seletor (dropdown).** Mesmo corpo do campo, `appearance:none`, ícone `seletor` (as duas setinhas
  do Untitled) 20px à direita, padding-right 40. Nunca o seletor nativo do navegador.
- **Campo de busca.** Como o campo, com ícone `busca` 20px à esquerda (padding-left 42).
- **Chip de estado.** 12/16 500, padding 4 8, raio 200. Verde (aprovado, ativo, em execução),
  cinza (planejado, neutro), lilás (em andamento, aguardando), amarelo (pendente de revisão), vermelho (erro).
- **Filtro-pílula.** 40px, raio 8, fundo brand-weak, texto brand 14/500, ícone `x-fechar` 20 à direita.
  "Mais filtros": botão secundário com ícone `filtro-linhas`.
- **Abas.** 14/18 500; inativa `#8C8E90`; ativa brand com sublinhado 2px; linha de base 2px `#ECECEE`; gap 24.
- **Sub-abas.** 36px, raio 8, 14/500; ativa fundo brand-weak e texto brand; inativa `#57595B`.
- **Cartão de número.** Borda 1px line, raio 8, padding 24. Rótulo 14/500 muted; número 36/46;
  ícone `pontos` no canto; chip de tendência verde com `seta-alta` quando houver comparação real.
- **Quadro.** Borda 1px line, raio 12, fundo branco, padding 24. Cabeçalho: título 18/24 500 + frase de
  apoio 14 muted (opcional) + ações à direita. Conteúdo interno dividido por linha, não por caixa.
- **Tabela.** Contêiner borda 2px line raio 12. Cabeçalho `#F9F9FD`, 12/18 500 ink, padding 15 18.
  Linhas 76px (mín.), padding 18, separador 2px line, hover `#F9F9FD`. Célula principal:
  avatar 40 + nome 14/500 + apoio 14 faint. Ações por ícone (`linha-edit`, `linha-trash`) à direita.
  Paginação: "Anterior" / "Página 1 de N" / "Próxima".
- **Linha de lista.** Dentro de quadro: padding 16 0, separador 1px line; título 14/500, apoio 14 faint,
  chip e ações alinhados à direita.
- **Barra de progresso.** 8px, raio 100, trilho `#ECECEE`, preenchimento brand.
- **Gaveta.** Direita, 560px, fundo branco, sombra lg. Cabeçalho 24px padding: título 18/500 + apoio
  14 faint + fechar (`x-fechar`). Corpo rolável com seções separadas por linha. Rodapé fixo com as
  ações (primária à direita).
- **Janela (modal).** Centro, 480px, raio 12, mesmo cabeçalho/rodapé da gaveta.
- **Estado vazio.** Dentro do quadro: título 16/500, frase 14 muted, um botão primário. Sem ícone decorativo.
- **Caixa de seleção.** SVG do Figma (`checkbox-*`).
- **Avatar.** Círculo 40 (tabela) / 37 (cartão do usuário) / 24 (grupo), inicial 14/600 em cor da paleta.

## 4. Telas

### Moldura (feita, ajustar)
Menu branco 272px; separador vertical 1px line de ponta a ponta; logo `logomark` + "Content OS" 18/600;
itens 48px; badge de contagem cinza (`#F9F9FD`, texto muted), não roxo; cartão do usuário com avatar,
nome e e-mail, ícone `user-card-icone` (sair). Cabeçalho da página: título 28 + ações.

### Hoje
1. Três cartões de número: Propostas dos agentes · Peças para aprovar · Posts nos próximos 7 dias.
2. Chat do Maestro (etapa 2).
3. Quadro "Propostas dos agentes": linhas (agente, cliente, título, chip do tipo, Aprovar/Rejeitar).
4. Quadro "Próximos passos" do cliente em foco: lista de 9 etapas como linhas com caixa de seleção
   do Figma e o botão primário "Montar o restante" no cabeçalho do quadro.
5. Quadro "Próximas publicações": tabela (Data, Peça, Formato, Status).
6. Lembretes (cobrança, backup) como uma linha discreta no fim, não como cartões.

### Clientes
Cabeçalho: "Clientes" + botões "Receber briefing" (secundário, ícone `upload`) e "Novo cliente"
(primário, ícone `mais`). Abas: Clientes · Administrativo. Barra: busca à direita; filtro-pílula de etapa.
Tabela: Cliente (avatar+nome+nicho) · Etapa (chip) · Peças do calendário (progresso + "x de y") ·
Automação (Automático/Manual) · ações. Administrativo: mesma tabela com Contato, Valor mensal,
Cobrança (chip), ações.

### Cliente: Entender
Quadro "Ficha do cliente": formulário em 2 colunas com os campos do Figma (§3), salva sozinho.
Quadro "Content DNA": tabela — Campo · Registro · Estado (chip: Fato verde, Hipótese amarelo,
Insight lilás, Decisão cinza, Aprendizado verde) · Origem · ações (Aprovar, Rejeitar por ícone).
Quadro "Briefing": área de texto + "Analisar com a Íris" (primário).

### Cliente: Planejar
- **Estratégia.** Quadro "Big Message" (texto 18/500) + linha com Posicionamento e Percepção.
  Quadro "Mix do mês": barra única segmentada em tons de roxo (100%, 70%, 45% de opacidade), legenda em linha.
  Tabela "Caminhos": Caminho · Funil · Relevância (progresso) · No mix (chip) · Quando usar.
- **Pesquisa.** Tabela: Tipo (chip) · Pauta · Fonte (link) · Data · Relevância. Botão "Rodar o Radar".
- **Linha editorial.** Um quadro por pilar: título + território; temas como linhas (tema, subtemas em texto).
- **Ideias.** Tabela: Ideia (título + ângulo) · Formato · Funil (chip) · Função · abrir. Botões
  "Gerar ideias" / "Gerar mais". Gatilhos e elementos literários vão para a gaveta "Preferências de criação".
- **Formatos.** Quadro do nicho (nome 18/500, leitura, seletor de nicho). Tabela de formatos
  recomendados: Formato · Papel (chip) · Por quê · Como fazer.

### Cliente: Calendário
Barra de ferramentas: seletor de período, sub-abas Semana/Lista, botões "Configurar rotina" (abre
gaveta com a rotina atual), "Exportar" e "Ver como cliente". Semana: colunas de dia com as peças
como linhas (hora, título, formato, chip de status). Lista: tabela (Data, Hora, Peça, Formato, Funil,
Status). Aprovações: tabela das peças com texto aguardando (Data, Peça, Formato, Status, "Revisar").

### Gaveta da peça
Cabeçalho: título da peça, data e formato. Abas: Roteiro e legenda · Carrossel · Stories · Estratégia.
Seções separadas por linha (sem caixas): Publicação (data, hora, status em seletor), Texto editável,
Resultado. Rodapé fixo: "Pedir ajuste" (secundário) e "Aprovar" (primário).

### Cliente: Resultados
Três cartões de número (Posts medidos, Alcance médio, Engajamento). Quadros com barras em roxo
(tipo de post, funil). Tabela "Posts que mais engajaram". Quadro "Leitura do Pulso". Importar CSV como
botão secundário com ícone `upload` no cabeçalho.

### Cliente: Operação
Quadro "Como a operação funciona para este cliente": formulário 2 colunas com seletores (§3).
Tabela "Agentes": Agente · Quando roda · Modo (controle segmentado Automático/Manual) · Última
execução (chip + data) · "Rodar agora". Tabela "Execuções deste cliente".

### Agentes
Três cartões: Servidor (Ligado/Sem chave), Gasto do mês (US$ x de y, progresso), Execuções no mês.
Tabela de agentes (sem modo). Tabela de execuções de todos os clientes.

### Configuração
Quadros: Equipe (membros, convite), Backup, Chaves e integrações, Knowledge Base (lista de fontes).

### Janelas
Novo cliente: janela 480px, campos do §3, "Criar cliente". Receber briefing: janela com as opções.

## 5. Critério de pronto

- Folha de contato de todas as telas lado a lado sem nenhum elemento do visual antigo
  (sem eyebrow em caixa alta, sem quadro dentro de quadro, sem seletor nativo, sem cor decorativa).
- Busca no código montado: zero `→`, zero emoji em rótulo, zero " — " em texto de interface.
- `npm test`, `npm run test:e2e` e o teste real no Supabase passando.
- Visto no celular (390px) sem rolagem horizontal da página.

## 6. Ordem

1. Componentes base (CSS + helpers de HTML): botão, campo, seletor, chip, quadro, tabela, gaveta.
2. Hoje e Clientes.
3. Entender, Planejar (5 sub-telas).
4. Calendário, gaveta da peça, Aprovações.
5. Resultados, Operação, Agentes, Configuração, janelas.
6. Folha de contato, varredura de texto, testes, deploy.
