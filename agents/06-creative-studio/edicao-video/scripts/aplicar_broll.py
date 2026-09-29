#!/usr/bin/env python3
"""Insere B-rolls sobre o vídeo principal (o áudio original é mantido).

Uso: aplicar_broll.py VIDEO plano.json OUT.mp4 [--res 1080x1920] [--crf 20]
plano.json: [{"t": 4.2, "dur": 2.5, "file": "assets/broll/x.mp4",
              "zoom": 0.08, "fade": 0.2, "ini": 0}]
  t     segundo do vídeo principal onde o B-roll entra
  dur   duração na tela (2–3s funciona melhor)
  file  clipe ou imagem (imagem vira clipe com zoom lento)
  zoom  quanto aproxima durante o clipe (0 = parado; 0.05–0.10 = suave)
  fade  segundos de fade in/out (0.15–0.3 = fluido; 0 = corte seco)
  ini   ponto do clipe onde começa (opcional)
"""
import argparse, json, subprocess, sys, os

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("plano"); ap.add_argument("out")
ap.add_argument("--res", default="1080x1920"); ap.add_argument("--crf", default="20")
a = ap.parse_args()
W, H = map(int, a.res.split("x"))
plano = sorted(json.load(open(a.plano)), key=lambda x: x["t"])

cmd = ["ffmpeg", "-y", "-loglevel", "error", "-hide_banner", "-i", a.video]
for b in plano:
    if b["file"].lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        cmd += ["-loop", "1", "-t", str(b["dur"] + 1), "-i", b["file"]]
    else:
        cmd += ["-ss", str(b.get("ini", 0)), "-t", str(b["dur"] + 1), "-i", b["file"]]

fc = [f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30,format=yuv420p[base0]"]
for i, b in enumerate(plano, start=1):
    d, t, z, f = b["dur"], b["t"], b.get("zoom", 0.06), b.get("fade", 0.2)
    chain = f"[{i}:v]fps=30,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,trim=duration={d},setpts=PTS-STARTPTS"
    if z:
        # aproxima devagar: escala cresce com o tempo e recorta o centro
        chain += (f",scale=w='trunc({W}*(1+{z}*t/{d})/2)*2':h='trunc({H}*(1+{z}*t/{d})/2)*2':eval=frame,"
                  f"crop={W}:{H}")
    chain += ",format=yuva420p"
    if f:
        chain += f",fade=t=in:st=0:d={f}:alpha=1,fade=t=out:st={d - f}:d={f}:alpha=1"
    chain += f",setpts=PTS+{t}/TB[b{i}]"
    fc.append(chain)
    fc.append(f"[base{i-1}][b{i}]overlay=eof_action=pass:enable='between(t,{t},{t + d})'[base{i}]")

cmd += ["-filter_complex", ";".join(fc), "-map", f"[base{len(plano)}]", "-map", "0:a?",
        "-c:v", "libx264", "-crf", a.crf, "-pix_fmt", "yuv420p", "-c:a", "copy", a.out]
r = subprocess.run(cmd)
sys.exit(r.returncode)
