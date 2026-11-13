#!/bin/bash
# sem_trilha.sh video.mp4 saida.mp4  (voz + efeitos, -12 LUFS)
V=$1; O=$2; A=/tmp/dry_$$.wav
ffmpeg -v error -y -i "$V" -vn -c:a pcm_s16le -ar 48000 $A
J=$(ffmpeg -hide_banner -i $A -af loudnorm=I=-12:TP=-1:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
set -- $(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -v error -y -i "$V" -i $A -map 0:v -map 1:a -af "loudnorm=I=-12:TP=-1:LRA=9:measured_I=$1:measured_TP=$2:measured_LRA=$3:measured_thresh=$4:offset=$5:linear=true" -ar 48000 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart "$O"
rm -f $A
