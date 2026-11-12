#!/bin/bash
# exportar.sh video.mp4 trilha.wav saida_base  →  saida_base_com_trilha.mp4 e saida_base_sem_trilha.mp4 (-12 LUFS)
V=$1; MU=$2; O=$3
ffmpeg -v error -y -i "$V" -i "$MU" -filter_complex "[1:a]aresample=48000,volume=0.23[m];[0:a]aresample=48000,asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=5:attack=25:release=420:makeup=1[md];[v2][md]amix=inputs=2:normalize=0:duration=first[a]" -map "[a]" -c:a pcm_s16le /tmp/mix_$$.wav
for kind in com_trilha sem_trilha; do
  if [ $kind = com_trilha ]; then A=/tmp/mix_$$.wav; else ffmpeg -v error -y -i "$V" -vn -c:a pcm_s16le -ar 48000 /tmp/dry_$$.wav; A=/tmp/dry_$$.wav; fi
  J=$(ffmpeg -hide_banner -i $A -af loudnorm=I=-12:TP=-1:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  set -- $(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
  ffmpeg -v error -y -i "$V" -i $A -map 0:v -map 1:a -af "loudnorm=I=-12:TP=-1:LRA=9:measured_I=$1:measured_TP=$2:measured_LRA=$3:measured_thresh=$4:offset=$5:linear=true" -ar 48000 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart "${O}_${kind}.mp4"
done
rm -f /tmp/mix_$$.wav /tmp/dry_$$.wav
