# Ferramentas da edição completa (composição `Edicao`)

Usadas na edição "Hipertrofia vs emagrecimento" (10/10/2026). Os vídeos do
cliente ficam em `public/edicao/`, que não vai para o git.

| Script | Etapa |
|---|---|
| `transcrever_sherpa.py` | texto da fala com Whisper turbo (sherpa-onnx, modelo baixado do GitHub) |
| `tempos_parakeet.py` | tempo de cada palavra com Parakeet v3 (suporta português) |
| `preparar_cortes.py` | corta as pausas, remapeia os tempos e gera o vídeo-base tratado (cor, nitidez, áudio) |
| `sfx.py` | sintetiza os efeitos sonoros e a trilha (sem licença de terceiros) |
| `medir_png.py` + `analisar_cabeca.py` | medem onde está a cabeça em cada momento, para posicionar os títulos |
| `rastrear_maos.py` + `ancoras_maos.py` | rastreiam as mãos (MediaPipe 0.10.14, modelo embutido) e geram a posição das palavras da abertura, que entra em `props.json` como `maos` |
| `medir_cabeca.py` | mede a cabeça direto do `.webm` recortado |
| `masterizar.py` | áudio final em −14 LUFS / −1,5 dBTP |
| `folha.sh` | folha de quadros para conferência |

Modelos (GitHub, releases `asr-models` do sherpa-onnx):
`sherpa-onnx-whisper-turbo` e `sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8`.

Render:

```bash
npx remotion render Edicao saida.mp4 --props=public/edicao/props.json --codec=h264 --crf=16
python3 ferramentas/masterizar.py saida.mp4 final.mp4
```

O roteiro da edição (planos, B-roll, gráficos, sons e páginas da legenda) fica
em `src/edicao/roteiro.ts`.

## Edição "dica do físio — coluna lombar" (composição `Coluna`)

| Script | Etapa |
|---|---|
| `trecho_whisper.py` | confere trechos duvidosos com o Whisper em pedaços curtos |
| `decupar_coluna.py` | decupagem: trechos mantidos (cortes só dentro de silêncios, com margem), tempo das palavras por bloco de fala e vídeo-base tratado |
| `trilha_calma.py` | trilha calma sem bateria e riser longo |

O roteiro visual (planos, passos, cartões, sons e páginas de 2 palavras) fica em `src/coluna/roteiro.ts`.
