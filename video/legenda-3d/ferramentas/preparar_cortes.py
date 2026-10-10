"""Corta as pausas, remapeia o tempo das palavras e gera o vídeo-base tratado."""
import json, subprocess, sys
W = sys.argv[1]
palavras = json.load(open(f"{W}/parakeet.json"))
# correções de pontuação nas emendas entre blocos da transcrição
fix = {("simples.", 7.52): "simples", ("Para", 8.3): "para", ("adequados.", 27.52): "adequados",
       ("Para", 28.0): "para", ("consumir.", 35.84): "consumir", ("Menos", 36.32): "menos"}
for i, p in enumerate(palavras):
    p["palavra"] = fix.get((p["palavra"], round(p["inicio"], 2)), p["palavra"])
    prox = palavras[i + 1]["inicio"] if i + 1 < len(palavras) else 50.1
    p["fim"] = round(min(prox - 0.02, max(p["ultimo"] + 0.22, p["inicio"] + 0.18), p["inicio"] + 0.9), 3)
silencios = [(6.3815,6.70202),(8.03515,8.37537),(15.1658,15.4746),(20.264,20.5723),(29.0105,29.3406),
             (35.7857,36.2413),(37.8139,38.0999),(40.2157,40.529),(41.4791,41.7821),(42.68,42.9562)]
remover = []
for s, e in silencios:
    a, b = s + 0.07, e - 0.09
    if b - a < 0.12: continue
    if any(a < p["inicio"] < b for p in palavras):
        print("pulando corte com palavra dentro", s, e); continue
    remover.append((a, b))
DUR = 50.1
fim_fala = palavras[-1]["fim"] + 0.35
manter, t = [], 0.0
for a, b in remover:
    manter.append((t, a)); t = b
manter.append((t, min(DUR, fim_fala)))
def remap(x):
    out = 0.0
    for s, e in manter:
        if x >= e: out += e - s
        else: return out + max(0.0, x - s)
    return out
for p in palavras:
    p["inicio"], p["fim"] = round(remap(p["inicio"]), 3), round(remap(p["fim"]), 3)
    del p["ultimo"]
cortes = []
acc = 0.0
for s, e in manter[:-1]:
    acc += e - s; cortes.append(round(acc, 3))
duracao = round(sum(e - s for s, e in manter), 3)
json.dump({"palavras": palavras, "cortes": cortes, "duracao": duracao, "manter": manter},
          open(f"{W}/roteiro.json", "w"), ensure_ascii=False, indent=0)
print("duração", duracao, "cortes", cortes)
# filtro: trechos + emenda com fade curto no áudio
v, a, ins = [], [], []
for i, (s, e) in enumerate(manter):
    v.append(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{i}]")
    a.append(f"[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={e-s-0.012:.3f}:d=0.012[a{i}]")
    ins.append(f"[v{i}][a{i}]")
n = len(manter)
fc = ";".join(v + a) + f";{''.join(ins)}concat=n={n}:v=1:a=1[vc][ac];" \
     "[vc]fps=30,scale=1080:1920:flags=lanczos,eq=contrast=1.07:saturation=1.12:brightness=0.01:gamma=0.98," \
     "colorbalance=rs=0.02:bs=-0.02:rh=0.015:bh=-0.015,unsharp=5:5:0.7:5:5:0[vo];" \
     "[ac]highpass=f=75,afftdn=nf=-30,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=120,loudnorm=I=-16:TP=-2:LRA=7[ao]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{W}/bruto.mp4", "-filter_complex", fc,
                "-map", "[vo]", "-map", "[ao]", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", f"{W}/cortado.mp4"], check=True)
