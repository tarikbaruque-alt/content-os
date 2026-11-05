# Atrás do Rótulo: Guinness (Reels 9:16)

Vídeo de ~88 s feito em [Remotion](https://www.remotion.dev): a história de como a
cervejaria Guinness criou o *Guinness World Records*. Tem vibe histórica, com mapa,
datas, linha do tempo, papel envelhecido e grão de filme.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `src/Guinness.tsx` | Linha do tempo principal: decupagem dos 15 takes, zoom in/out, B-roll, grafismos e efeitos sonoros |
| `src/scenes/*` | Cenas em motion: `MapScene` (Europa → Irlanda, 1951), `QuotesScene` (as 3 frases), `SearchScene` (busca × 1951), `TimelineScene` (1951 → 1954), `BookScene` (1ª edição, 1955), `CounterScene` (+150 milhões), `CoverScene` |
| `src/components/Captions.tsx` | Legenda com no máximo 2 linhas. Palavras relevantes mudam de tipografia (serifada dourada, data em carimbo, palavra riscada) |
| `src/data/captions.ts` | Legendas geradas da transcrição, já com os tempos do corte final |
| `src/components/PhotoScene.tsx` | Câmera (Ken Burns) sobre as imagens, com tratamento sépia |
| `scripts/` | Scripts Python usados na transcrição (faster-whisper), no corte e nas legendas |

## Como rodar

Os takes brutos **não ficam no Git** porque são pesados. Coloque os 15 takes,
convertidos para 1080×1920 a 30 fps, em `public/takes/take01.mp4` … `take15.mp4`.

```bash
npm i
```

```bash
npm run dev
```

```bash
npm run render
```

Em ambiente sem acesso ao download do Chrome do Remotion, aponte para um Chromium
local com `--browser-executable=/caminho/do/chrome-headless-shell`.

## Fontes e sons

- Fontes locais (`public/fonts`, vindas do `@fontsource`): Montserrat, Playfair Display,
  Special Elite e IM Fell English SC.
- Efeitos sonoros (`public/sfx`): sintetizados com ffmpeg (whoosh, carimbo,
  máquina de escrever, pop, riser e projetor).
- O vídeo não tem trilha musical. A ideia é adicionar uma música em alta direto no Instagram.
