# Formatos — Superfície × Formato Criativo

> Diretriz de **Ideas & Formats (Musa)** e **Estúdio Criativo (Rima)**.
> Distinção fundamental: **onde** a peça vive ≠ **como** ela narra.

---

## 1. Superfície (canal)

Onde o conteúdo é publicado e com que gramática de consumo:

`Reel` · `Carrossel` · `Stories` · `Vídeo` · `Imagem única` · `Live` ·
`Canal de transmissão` · `Legenda/texto`

## 2. Formato criativo (narrativo)

Como o conteúdo é construído:

`Tutorial` · `Passo a passo` · `Lista` · `Opinião` · `Análise` · `Comentário` ·
`Reação` · `Comparação` · `Case` · `Storytelling` · `Bastidores` ·
`Transformação` · `Antes/Depois` · `Erro comum` · `Mito × Verdade` ·
`Problema–Solução` · `Perguntas e respostas` · `Demonstração` · `Breakdown` ·
`Entrevista` · `POV` · `Provocação` · `Tendência contextualizada` ·
`Análise de notícia` · `Resposta a comentário` · `Quebra de objeção` · `Prova` ·
`Experiência própria` · `Experiência compartilhada` · `Série` ·
`Quadro recorrente` · `Checklist` · `Framework` · `Narrativa visual`

---

## 3. A recomendação é uma **combinação**

O sistema recomenda `superfície + formato criativo`, sempre derivada da
estratégia da peça (objetivo, jornada, função estratégica, persona):

| Combinação | Quando tende a funcionar |
|---|---|
| **Reel + Storytelling** | identificação e conexão emocional (descoberta) |
| **Carrossel + Framework** | educação com profundidade e salvamento (consideração) |
| **Stories + Bastidores** | relacionamento e experiência própria (cliente) |
| **Reel + Análise** | autoridade e diferenciação |
| **Carrossel + Case** | prova e quebra de objeção (conversão) |
| **Stories + Quebra de objeção** | fundo de funil, pré-venda |
| **Reel + Mito × Verdade** | conscientização e atenção |

> São **heurísticas**, não regras. A combinação certa é a que serve ao objetivo
> e à persona daquela peça — nunca a que "costuma performar".

---

## 4. Regras

1. Nunca escolher formato antes de saber **objetivo + jornada + função estratégica**.
2. A mesma ideia pode render **combinações diferentes** — escolher é decisão
   estratégica, não sorteio.
3. Variedade de superfície **não** substitui variedade narrativa: quatro Reels
   com o mesmo formato criativo são repetição, mesmo parecendo diferentes.

---

## 5. Formato por nicho (guia do cliente)

Além da função da peça, o **nicho** muda o que funciona. A Musa identifica o
nicho do cliente (cadastro → campo `nicho` do Content DNA → oferta/posicionamento
→ nome) e entrega um **guia de formatos** — aba **Formatos** do painel, visível
também no portal do cliente:

- **Formatos recomendados** em ordem: *carro-chefe* (a base do perfil), *apoio*
  e *pontual*, cada um com **por quê** e **como fazer**;
- **mix de superfícies**, nível de **produção** e **cadência** sugeridos;
- **séries/quadros recorrentes** para criar hábito;
- o que **evitar** e os **cuidados éticos/regulatórios** do nicho (CFM, OAB, CFP,
  CRN, ANVISA…);
- **todas as opções** da biblioteca com o encaixe no nicho (carro-chefe, apoio,
  pontual, livre, com cuidado).

Na geração de ideias, o nicho **desempata** dentro da função: entre os formatos
que servem à função (`FN_ALTERNATIVAS`), vence o que o nicho favorece, e nunca
um formato marcado como arriscado para o nicho. No painel, **✦ Personalizar com
IA** reescreve o guia para o cliente específico a partir do Content DNA.

Fonte: `src/pipeline/niche-formats.ts` (16 perfis + perfil geral). Depois de
editar, rode `npm run panel:sync` para atualizar o painel. São **heurísticas**
(inferência, não fato) — ajuste com os dados de Performance.
