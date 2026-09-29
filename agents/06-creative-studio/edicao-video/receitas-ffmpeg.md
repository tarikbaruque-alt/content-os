# Receitas ffmpeg (copiar, trocar variáveis)

Sempre: `ffmpeg -y -loglevel error -hide_banner ...`
Variáveis: `IN` entrada, `OUT` saída (em `saida/`), tempos em `HH:MM:SS`.

## Inspecionar (barato, sem ver o vídeo)
```
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of default=nw=1 "$IN"
```

## Cortar trecho
```
ffmpeg -ss 00:00:03 -to 00:00:33 -i "$IN" -c:v libx264 -crf 20 -c:a aac "$OUT"
```

## Converter para 9:16 (preencher e cortar)
```
-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30"
```
Com barras (contain): `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black`

## Remover silêncios
```
-af "silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_duration=0.35:stop_threshold=-35dB"
```
(cortar o vídeo junto exige transcrição/timestamps; para sincronia perfeita usar o script de cortes por fala.)

## Normalizar áudio
```
-af "loudnorm=I=-14:TP=-1.5:LRA=11"
```

## Legenda queimada (.srt → vídeo)
```
-vf "subtitles=legenda.srt:force_style='FontName=Fonte,FontSize=18,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=3,Alignment=2,MarginV=380'"
```
Gerar o .srt localmente: `faster-whisper` (`--language pt`). Revisar palavras-chave/nomes antes de queimar.

## Logo
```
ffmpeg -i "$IN" -i assets/logos/logo.png -filter_complex "[1]scale=180:-1,format=rgba,colorchannelmixer=aa=0.9[l];[0][l]overlay=W-w-60:250" "$OUT"
```

## Música de fundo (12%)
```
ffmpeg -i "$IN" -stream_loop -1 -i assets/musicas/faixa.mp3 -filter_complex "[1:a]volume=0.12[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" -map 0:v -map "[a]" -shortest "$OUT"
```

## Texto na tela (gancho nos 3 primeiros segundos)
```
-vf "drawtext=fontfile=assets/fontes/PRINCIPAL.ttf:text='SEU GANCHO':fontsize=72:fontcolor=white:borderw=4:bordercolor=black:x=(w-tw)/2:y=300:enable='between(t,0,3)'"
```

## Prévia rápida (barata)
Acrescentar `-t 5 -vf scale=540:-2 -crf 30 -preset ultrafast` e conferir antes do render final.

## Lote (mesmo preset, vários vídeos)
```
for f in entrada/*.mp4; do OUT="saida/$(date +%F)_$(basename "${f%.*}")_v1.mp4"; ffmpeg -y -loglevel error -hide_banner -i "$f" <filtros> "$OUT"; done
```
