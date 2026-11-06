# Como ser um marketeiro… Inteligente (Reels 9:16)

Reels de cerca de 50 s feito em [Remotion](https://www.remotion.dev). Mostra 3 técnicas que um bom restaurante usa e que servem para qualquer negócio: **espera explicada**, **ancoragem** e **o final que fica** (regra do pico-fim).

## O que tem na edição

- **Decupagem:** takes 1 a 9, 11 e 12 (o 12 é a frase do vinho, gravada depois). O take 10 ficou de fora porque repete o fechamento do 11. Os cortes estão em `scripts/montar.py`.
- **Rosto centralizado:** cada take tem um enquadramento próprio, calculado por detecção de rosto (`scripts/faces.py`). O rosto fica sempre em (540, 850) e com a mesma altura.
- **Painéis do storyboard como card**, sobre o próprio painel desfocado em tela cheia, com movimento de câmera dentro do card (`src/components/Card.tsx`).
- **Legendas de 2 palavras** (`src/components/Captions.tsx`). A palavra de destaque fica maior e amarela (Anton), em serifada itálica (Playfair) ou grifada em amarelo (`@remotion/rough-notation`).
- **Selos das técnicas** (1 · ESPERA EXPLICADA, 2 · ANCORAGEM e 3 · O FINAL QUE FICA). Nesses trechos, a legenda dá lugar ao selo.
- **Frase ainda não gravada** ("a gente lembra do melhor momento… e do final") entra como bilhete sobre o card.
- **Sem trilha.** Os efeitos foram sintetizados com ffmpeg: sino na abertura e no "INTELIGENTE", whoosh nas trocas, relógio, taças e carimbo.

## Como rodar

Os takes brutos não ficam no Git. Converta para 1080×1920 a 30 fps e coloque em `public/takes/take01.mp4` … `take11.mp4`, como faz `scripts/` no fluxo original.

```bash
npm i
```

```bash
npm run dev
```

```bash
npx remotion render Marketeiro out/marketeiro-inteligente.mp4
```

```bash
npx remotion still Capa out/capa-marketeiro-inteligente.png
```

Se o Remotion não conseguir baixar o Chrome, passe `--browser-executable=/caminho/do/chrome-headless-shell`.
