# Como ser um marketeiro… Inteligente (Reels 9:16)

Reels de cerca de 50 s feito em [Remotion](https://www.remotion.dev). Mostra 3 técnicas que um bom restaurante usa e que servem para qualquer negócio: **espera explicada**, **ancoragem** e **o final que fica** (regra do pico-fim).

## O que tem na edição

- **Decupagem:** takes 1 a 6, 8, 9, 11, 12 e 13. O 12 (vinho do topo da carta) e o 13 (terceiro princípio) foram gravados depois. Ficaram de fora o 7 (a carta já mostra "No seu negócio") e o 10 (repete o fechamento do 11). Os cortes estão em `scripts/montar.py`.
- **Rosto centralizado:** cada take tem um enquadramento próprio, calculado por detecção de rosto (`scripts/faces.py`). O rosto fica sempre em (540, 850) e com a mesma altura.
- **Painéis do storyboard como card**, sobre o próprio painel desfocado em tela cheia, com movimento de câmera dentro do card (`src/components/Card.tsx`).
- **Legendas de 2 palavras** (`src/components/Captions.tsx`). A palavra de destaque fica maior e amarela (Anton), em serifada itálica (Playfair) ou grifada em amarelo (`@remotion/rough-notation`).
- **Selos das técnicas** (1 · ESPERA EXPLICADA, 2 · ANCORAGEM e 3 · O FINAL QUE FICA). Nesses trechos, a legenda dá lugar ao selo.
- **Carta de vinhos:** o preço do Reserva Especial foi trocado de R$ 390 para R$ 790 no próprio painel, para a âncora ficar mais forte.
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
