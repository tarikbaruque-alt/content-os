"""Mede o topo da cabeça e a largura dela em cada quadro, a partir do recorte (alfa)."""
import sys, json, subprocess, numpy as np
src = sys.argv[1]; W, H = 270, 480
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-c:v", "libvpx-vp9", "-i", src, "-vf", f"scale={W}:{H}",
                      "-f", "rawvideo", "-pix_fmt", "rgba", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 4)[..., 3]
out = []
for a in fr:
    linhas = np.where((a > 128).sum(1) > 3)[0]
    if not len(linhas): out.append(None); continue
    topo = int(linhas[0])
    faixa = a[topo:topo + 25] > 128          # 25 px abaixo do topo (~100 px no quadro final)
    cols = np.where(faixa.any(0))[0]
    out.append([topo * 4, int(cols[0]) * 4, int(cols[-1]) * 4])
json.dump(out, open(sys.argv[2], "w"))
print(len(out))
