---
name: remover-fundo
description: Remove o fundo de vídeos e imagens (pessoa ou objeto recortado com IA, ou tela verde/azul por chroma key) e, se pedido, troca por uma cor ou imagem. Gera vídeo com transparência (.webm ou .mov ProRes 4444) pronto para Remotion, CapCut, Premiere ou DaVinci. Use quando pedirem para remover, apagar, recortar ou trocar o fundo de um vídeo ou foto, tirar a tela verde, deixar o fundo transparente ou isolar a pessoa para edição.
---

# Remover fundo de vídeo e imagem

O script `scripts/remover_fundo.py` faz o trabalho todo. Rode-o com o arquivo
do usuário e entregue o caminho do resultado, que ele imprime na última linha.

## Preparar (uma vez)

```bash
which ffmpeg || echo "instalar: brew install ffmpeg (Mac) / apt install ffmpeg (Linux)"
python3 -c "import rembg" 2>/dev/null || pip install "rembg[cpu]"
```

Na primeira vez que o modo IA roda, o rembg baixa o modelo (~170 MB) para
`~/.rembg/models`. Isso é normal e só acontece uma vez por modelo.

## Escolher o modo

| Situação | Modo |
|---|---|
| Gravado com tela verde ou azul | `--modo chroma` (rápido, só ffmpeg, borda mais limpa) |
| Qualquer outro fundo (sala, rua, escritório) | `--modo ia` (padrão) |

Se não souber como o vídeo foi gravado, extraia um quadro e olhe antes de
escolher:
`ffmpeg -loglevel error -ss 1 -i video.mp4 -frames:v 1 /tmp/quadro.png`

## Comandos

```bash
S=.claude/skills/remover-fundo/scripts/remover_fundo.py

# fundo transparente (sai video-sem-fundo.webm, ao lado do original)
python3 $S video.mp4

# tela verde
python3 $S video.mp4 --modo chroma
python3 $S video.mp4 --modo chroma --cor 0x0047BB          # tela azul
python3 $S video.mp4 --modo chroma --tolerancia 0.25       # sobrou verde? aumente

# trocar o fundo por uma cor ou imagem (sai video-novo-fundo.mp4)
python3 $S video.mp4 --fundo "#101820"
python3 $S video.mp4 --fundo escritorio.jpg

# para Premiere / DaVinci / Final Cut, que leem melhor ProRes
python3 $S video.mp4 -o video-sem-fundo.mov

# foto (sai foto-sem-fundo.png)
python3 $S foto.jpg
```

Opções do modo IA (`--modelo`):
- `u2net_human_seg`: padrão, feito para pessoas.
- `isnet-general-use`: objetos e produtos.
- `birefnet-portrait`: borda de cabelo mais fina, porém bem mais lento e com
  download maior. Use quando o cabelo sair serrilhado.

O áudio original é mantido. No modo IA, o tempo é de cerca de 0,5 s por quadro
na CPU. Um vídeo de 30 s a 30 fps (900 quadros) leva uns 7 minutos. Avise o
usuário antes de vídeos longos e, se ele quiser testar primeiro, corte um trecho:
`ffmpeg -i video.mp4 -t 3 -c copy teste.mp4`.

## Conferir o resultado

Antes de entregar, gere uma comparação e olhe a imagem:

```bash
python3 $S video.mp4 --fundo "#e84a5f" -o /tmp/conferir.mp4
ffmpeg -loglevel error -y -ss 1 -i video.mp4 -frames:v 1 /tmp/a.png
ffmpeg -loglevel error -y -ss 1 -i /tmp/conferir.mp4 -frames:v 1 /tmp/b.png
ffmpeg -loglevel error -y -i /tmp/a.png -i /tmp/b.png -filter_complex hstack /tmp/antes-depois.png
```

Fundo colorido que aparece por dentro da pessoa ou pedaços do fundo antigo que
sobram indicam que é preciso trocar o modelo (modo IA) ou ajustar
`--tolerancia` e `--suavidade` (modo chroma).

## Usar no Remotion (`npx create-video@latest`)

Copie o `.webm` para a pasta `public/` do projeto e use com `transparent`:

```tsx
import { AbsoluteFill, OffthreadVideo, Img, staticFile } from "remotion";

export const Apresentador = () => (
  <AbsoluteFill>
    <Img src={staticFile("fundo.jpg")} />
    <OffthreadVideo src={staticFile("video-sem-fundo.webm")} transparent />
  </AbsoluteFill>
);
```

Para exportar do Remotion mantendo a transparência, use
`npx remotion render <id> out.webm --codec=vp9 --image-format=png --pixel-format=yuva420p`.
