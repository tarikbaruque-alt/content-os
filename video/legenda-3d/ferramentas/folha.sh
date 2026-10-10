#!/bin/bash
# uso: folha.sh <video.mp4> <saida.png> t1 t2 ... (até 9 por linha, monta linhas de 6)
V=$1; OUT=$2; shift 2; D=$(mktemp -d); i=0
for t in "$@"; do
  ffmpeg -loglevel error -y -ss $t -i "$V" -frames:v 1 -vf "scale=300:-1,drawtext=text='$t':x=6:y=6:fontsize=22:fontcolor=red:box=1:boxcolor=white" $D/$(printf %03d $i).png; i=$((i+1))
done
n=$i; per=6; rows=$(( (n+per-1)/per )); args=""; for f in $D/*.png; do args="$args -i $f"; done
ffmpeg -loglevel error -y $args -filter_complex "xstack=inputs=$n:layout=$(python3 -c "
n=$n;p=$per;print('|'.join(f'{(i%p)*300}_{(i//p)*534}' for i in range(n)))"):fill=black" "$OUT"
rm -r $D
