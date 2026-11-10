# Análise de campanha: McDonald's × F1, "The Golden Zone" (Reels 9:16)

Duas versões no mesmo projeto. A escolha fica em `src/versao.ts`:

- **curta** (padrão, ~89 s):
  - sai o take 2 e as perguntas "Sabe por que isso acontece?", "E percebe o que eles fizeram?" e "E sabe qual é a lição?";
  - o take 5 fica sem "criativa de marketing do McDonald's";
  - o take 11 fica sem "Mas olha só" e sem "da estratégia de marketing realizada pelo McDonald's";
  - o take 19 termina em "7% em vendas", e os outros números ficam só na tela.
  - Decupagem: `scripts/montar_curto.py`.
- **longa** (~1 min 50 s, todos os takes menos o 12). Decupagem: `scripts/montar.py`.

Fotos da F1 (opcionais) para a versão curta:

- `public/img/f1-curva.jpg`: abertura, em "onde todo mundo via curvas";
- `public/img/f1-logos.jpg`: "mais uma logo na pista".

Depois de colocar as fotos, ligue cada uma em `src/data/imagens.json`. Sem elas, entram as imagens do case.

Reels de cerca de 1 min 50 s feito em [Remotion](https://www.remotion.dev). Analisa a campanha *The Golden Zone* (TBWA\Colombia para McDonald's): os arcos dourados escondidos nas curvas dos 24 circuitos da F1 viraram ofertas relâmpago no app.

## O que tem na edição

- **Decupagem automática** em `scripts/montar.py`:
  - tira o silêncio do início e do fim de cada take e encurta as pausas internas;
  - corta "apenas" do take 1 e "mais de" do take 19 (as fontes falam em 7 %, não "mais de 7 %");
  - deixa de fora o take 12, que repete o 11.
- **Voz tratada:** redução de ruído por rede neural (RNNoise, modelo `bd`), EQ, compressão e o mesmo volume em todos os takes.
- **Layouts:**
  - rosto em tela cheia;
  - tela dividida (case ou grafismo em cima, rosto embaixo), com o painel deslizando a cada troca;
  - case em tela cheia, com o vídeo em card sobre ele mesmo desfocado.
- **O vídeo do case entra sem áudio.** A legenda em espanhol gravada na imagem fica fora do quadro.
- **Grafismos (`src/components/Graphics.tsx`):**
  - nuvem que vira rosto;
  - verbete "pareidolia";
  - curvas → vendas;
  - mecânica da Golden Zone (barra da oferta esvaziando enquanto o carro atravessa a curva);
  - espectador → participante;
  - 3 ações;
  - tríade atenção, urgência e recompensa;
  - resultados (dados da agência);
  - a lição.
- **Legendas de 2 palavras** em Inter, com troca de tipografia nas palavras-chave: Instrument Serif itálica dourada, caixa alta dourada ou sublinhado animado.
- **Sem trilha.** Efeitos discretos sintetizados: whoosh nas trocas de layout e pop nos grafismos.

## Números citados (segundo a agência)

- +7 % em vendas digitais;
- 2,3 milhões de usuários ativos durante as corridas;
- 2,7 milhões de downloads do app no mês.

Fontes: [TBWA](https://tbwa.com/work/the-golden-zone-mcdonalds-tbwa/), [Selfstorming](https://www.selfstorming.com/tools/libraries/campaigns/the-golden-zone).

## Como rodar

Os takes, o case e o áudio não ficam no Git. Converta os arquivos e coloque nestes caminhos:

- takes em 1080×1920 a 30 fps: `public/takes/takeNN.mp4`;
- case em 1920×1080: `public/caso.mp4`;
- voz tratada: `public/audio/aNN.wav`.

Depois gere a decupagem:

```bash
python3 scripts/montar.py <pasta com takes/words.json e clean/aNN.wav> src/data/edl.json
```

```bash
npm i
```

```bash
npx remotion studio
```

```bash
npx remotion render Analise out/analise-mcdonalds-f1.mp4 --codec=h264 --crf=17
```
