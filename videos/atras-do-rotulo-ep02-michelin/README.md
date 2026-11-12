# Atrás do Rótulo · EP. 02 — Michelin (Reels 9:16)

Edição em Remotion com duas versões (`src/versao.ts`):
- **completa** (1 min 46 s);
- **curta** (1 min 32 s): sem os takes 4, 11 e 19, e o take 9 começa em "Em 1926".

## Decupagem (`scripts/montar.py`)
- Fica de fora o take 16, que repete o 17.
- Saem os "Bom," dos takes 9 e 22.
- Os respiros longos foram encurtados para cerca de 0,15 s.
- Há uma pausa cômica preservada entre "De carro." e "Gastando pneu.".

## Cenas
- **Capa e 1º frame:** "ATRÁS DO RÓTULO", "EP. 02 — MICHELIN" e a headline.
- **1900:** a fábrica aparece em 2.5D (pilha de pneus em camada separada), com a linha do tempo e o contador "MENOS DE 3.000 CARROS".
- **O guia:** o guia cai sobre a mesa e recebe o carimbo GRATUITO. Em seguida entra o mapa da França, com a rota saindo de Clermont-Ferrand e passando por oficinas, hotéis e restaurantes, e o carro percorrendo as estradas.
- **O calço:** o guia aparece apoiando a bancada. No "calço de móvel", a imagem congela e o livro ganha destaque.
- **A evolução:** 1900 → 1920 (o guia passa a ser vendido) → 1926 (primeiras estrelas) → 1931 (a classificação: parada, desvio, viagem especial).
- **30 milhões** de exemplares vendidos (segundo a Michelin).
- **Hoje:** no "Percebe a ironia?", foto de um chef segurando a placa MICHELIN 2025 (imagem real, não gerada; `public/img/hoje.jpg`).
- **A viagem:** mapa até o restaurante, chegada ao restaurante e close no pneu em "GASTANDO PNEU.".
- **Exemplo prático:** o anúncio de mensalidade dá lugar a um treino de 30 min na hora do almoço, com a piada da calça jeans.
- **Final:** estrada em perspectiva, retorno ao rosto e as três estrelas, das quais sobra uma ("vale uma parada").
- **Vinheta "ATRÁS DO RÓTULO"** (composição `VinhetaAtrasDoRotulo`, reutilizável): um rótulo é descolado e revela o nome.

As imagens geradas por IA levam o selo "Recriação ilustrativa".

## Som
- **Trilha original** (`scripts/trilha.py`), sintetizada e sem direitos de terceiros: ré menor na parte histórica e mais presença no final.
- **Ducking** sob a voz em `scripts/exportar.sh`, que também gera as versões com e sem trilha a -12 LUFS.
- **Efeitos** discretos: páginas, mapa e estrelas.

Takes, áudio e imagens ficam fora do Git (`public/takes`, `public/audio`, `public/img`).
