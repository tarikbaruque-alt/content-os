"""Decupagem do vídeo da coluna: trechos mantidos, tempos das palavras remapeados e vídeo-base tratado."""
import json, subprocess, sys
W = sys.argv[1]
# Trechos mantidos (segundos do original). Todos os cortes caem dentro de silêncios medidos (-42 dB),
# com pelo menos 0,15 s de margem antes e depois da fala.
MANTER = [(2.55, 5.88), (6.95, 9.86), (10.17, 11.48), (11.84, 15.55), (15.95, 17.55),
          (18.30, 22.00), (23.20, 26.20), (28.40, 30.35), (33.25, 37.25), (37.80, 41.90)]
SILENCIOS = [(0, 2.967), (5.732, 7.124), (9.706, 10.337), (11.301, 12.013), (13.126, 13.692), (14.183, 14.658),
             (15.412, 16.252), (17.297, 18.631), (19.535, 20.199), (21.814, 23.420), (24.064, 24.634),
             (26.004, 28.618), (30.027, 33.607), (34.934, 37.950), (40.205, 40.759), (41.513, 57.4)]
# Blocos de fala entre silêncios (início/fim medidos pela energia) e o texto de cada um,
# conferido com Whisper e Parakeet. Dentro do bloco, cada palavra recebe tempo proporcional às sílabas.
ILHAS = [
    (2.967, 5.732, "Aproveitar o intervalo aqui, uma dica rápida do físio."),
    (7.124, 9.706, "Você que chega em casa depois de um dia de trabalho"),
    (10.337, 11.301, "com a coluna lombar,"),
    (12.013, 13.126, "doendo, pesada,"),
    (13.692, 14.183, "rígida."),
    (14.658, 15.412, "Faz só isso aqui."),
    (16.252, 17.297, "Dobra um pouquinho o joelho."),
    (18.631, 19.535, "Deixa o tronco"),
    (20.199, 21.814, "cair à frente."),
    (23.420, 24.064, "Solta o tronco"),
    (24.634, 26.004, "um pouquinho."),
    (28.618, 30.027, "Deixa a gravidade atuar"),
    (33.607, 34.934, "e sobe devagarinho."),
    (37.950, 40.205, "Vai ficar uns 20 a 30 segundos lá embaixo."),
    (40.759, 41.513, "Pode repetir."),
]
import re
def silabas(w):
    w = w.lower()
    if w.isdigit(): return {"20": 2, "30": 2}.get(w, 2)
    return max(1, len(re.findall(r"[aeiouáéíóúâêôãõà]+", w)))
pal = []
for ini, fim, texto in ILHAS:
    ws = texto.split(); pesos = [silabas(w) + 0.3 for w in ws]; tot = sum(pesos); t = ini
    for w, q in zip(ws, pesos):
        d = (fim - ini) * q / tot
        pal.append({"palavra": w, "inicio": round(t, 3), "fim": round(t + d, 3)}); t += d
def remap(x):
    acc = 0.0
    for s, e in MANTER:
        if x < s: return acc
        if x <= e: return acc + x - s
        acc += e - s
    return acc
for w in pal:
    w["inicio"], w["fim"] = round(remap(w["inicio"]), 3), round(remap(w["fim"]), 3)
dur = round(sum(e - s for s, e in MANTER), 3)
cortes, acc = [], 0.0
for s, e in MANTER[:-1]:
    acc += e - s; cortes.append(round(acc, 3))
json.dump({"palavras": pal, "duracao": dur, "cortes": cortes}, open(f"{W}/roteiro.json", "w"), ensure_ascii=False, indent=0)
print("duração", dur, "cortes", cortes)
print(" ".join(f"{k}:{w['palavra']}@{w['inicio']:.2f}" for k, w in enumerate(pal)))
v, a, ins = [], [], []
for k, (s, e) in enumerate(MANTER):
    v.append(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{k}]")
    a.append(f"[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={e-s-0.015:.3f}:d=0.015[a{k}]")
    ins.append(f"[v{k}][a{k}]")
fc = ";".join(v + a) + f";{''.join(ins)}concat=n={len(MANTER)}:v=1:a=1[vc][ac];" \
     "[vc]fps=30,scale=1080:1920:flags=lanczos,eq=contrast=1.06:saturation=1.08:gamma=0.98," \
     "unsharp=5:5:0.6:5:5:0[vo];" \
     "[ac]highpass=f=80,afftdn=nf=-35,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=150,loudnorm=I=-16:TP=-2:LRA=7[ao]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{W}/bruto.mp4", "-filter_complex", fc, "-map", "[vo]", "-map", "[ao]",
                "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
                f"{W}/cortado.mp4"], check=True)
