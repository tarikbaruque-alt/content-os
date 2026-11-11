# Máquinas vs. pesos livres (Reels do João)

Edição em Remotion (1080×1920, 30 fps, ~58 s).

## Decupagem (`scripts/montar.py`)
- Take 1 começa direto em "Máquinas ou pesos livres?" (os ~5 s de entrada foram cortados).
- Repetições descartadas: take 4 (fica o 5, que liga com "E outros músculos…"), take 6 (fica o 6.1, "suporte externo"), take 8 (igual ao 7).
- "…controlar melhor o movimento e com segurança": take 9 até "controlar" + take 19 (regravação) + take 9 a partir de "e ter uma boa contração muscular".
- Silêncios do início/fim cortados; pausas internas ≥ 0,25 s reduzidas para ~0,16 s, sem acelerar a fala.

## Estrutura visual
| Momento | Visual |
|---|---|
| Gancho | tela dividida máquina × halteres, título "MÁQUINAS OU PESOS LIVRES?" já no 1º frame |
| "pesos livres exigem maior controle…" | supino com halteres, setas acompanhando o movimento, "CONTROLE" perto dos halteres, zoom no peito em "contração muscular" |
| "outros músculos estabilizadores" | búlgaro, linhas no tronco e nas pernas, "ESTABILIZADORES" ao lado do corpo |
| "máquinas oferecem suporte externo" | máquina de peito, encosto em verde, braços articulados tracejados, "SUPORTE EXTERNO" junto ao encosto |
| "ajudam a guiar o movimento" | leg press, seta seguindo o trilho |
| "combinar os dois" | comparação em tela dividida |
| "um para pesos livres e o outro para máquinas" | dois cards + rosto na metade de baixo |
| "compartilha, comenta e curte" | ícones animados (CTA gravado por ele) |
| Fechamento | motion "PESOS LIVRES + MÁQUINAS = TREINO COMPLETO" e corte limpo |

## Como gerar
```
python3 scripts/montar.py <pasta-do-material> src/data/edl.json
npx remotion render Ep03 out/maquinas_vs_pesos.mp4 --codec=h264 --crf=17
npx remotion still Capa out/capa.jpg
```
Takes, áudio tratado e imagens ficam em `public/takes`, `public/audio` e `public/img` (fora do git).
