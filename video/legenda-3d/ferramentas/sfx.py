"""Gera efeitos sonoros e uma trilha de fundo sintetizados (sem licença de terceiros)."""
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, sosfiltfilt
OUT = sys.argv[1]; SR = 48000
rng = np.random.default_rng(7)
t = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f, o=4): return sosfiltfilt(butter(o, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f, o=4): return sosfiltfilt(butter(o, f, "highpass", fs=SR, output="sos"), x)
def norm(x, db): return x / (np.max(np.abs(x)) + 1e-9) * 10 ** (db / 20)
def salvar(nome, x, pan=None):
    if x.ndim == 1: x = np.stack([x, x], 1)
    sf.write(f"{OUT}/{nome}.wav", x.astype(np.float32), SR)

def whoosh(d, f0, f1, db=-6):
    from scipy.signal import stft, istft
    n = rng.standard_normal(int(d * SR) + 4096)
    f, tf, Z = stft(n, SR, nperseg=2048, noverlap=1536)
    p = np.clip(tf / d, 0, 1)
    fc = f0 * (f1 / f0) ** p                       # centro da banda subindo/descendo
    lf = np.log2(np.maximum(f, 20))[:, None]
    mask = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / 0.9) ** 2)
    _, y = istft(Z * mask, SR, nperseg=2048, noverlap=1536)
    y = y[: int(d * SR)]; tt = t(d)[: len(y)]
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.6
    y = y * env
    pan = np.linspace(-0.6, 0.6, len(y))
    return norm(np.stack([y * (1 - pan) / 1.4, y * (1 + pan) / 1.4], 1), db)

salvar("whoosh", whoosh(0.5, 250, 5000, -5))
salvar("whoosh_curto", whoosh(0.28, 600, 7000, -8))
salvar("whoosh_saida", whoosh(0.4, 5000, 300, -8))
# pop: seno com queda de afinação
tt = t(0.14); pop = np.sin(2 * np.pi * np.cumsum(260 + 700 * np.exp(-tt * 45)) / SR) * np.exp(-tt * 30)
pop[:40] += rng.standard_normal(40) * np.linspace(0.6, 0, 40)
salvar("pop", norm(pop, -6))
tt = t(0.09); tick = np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 70) + 0.3 * np.sin(2 * np.pi * 3600 * tt) * np.exp(-tt * 90)
salvar("tick", norm(tick, -10))
# impacto: sub com queda + ruído grave
tt = t(0.9); sub = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-tt * 18)) / SR) * np.exp(-tt * 5.5)
ruido = lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 22)
imp = np.tanh(2.2 * (sub + 0.5 * ruido))
salvar("impacto", norm(imp, -4))
# ding: sino
tt = t(1.4); ding = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, a, k in
                       [(1318.5, 1, 3.2), (2637, 0.45, 5), (3955, 0.25, 7), (1977.75, 0.35, 4)])
ding *= np.minimum(1, tt / 0.004)
salvar("ding", norm(ding, -9))
# riser curto para a abertura
tt = t(0.9); r = hp(rng.standard_normal(len(tt)), 2000) * (tt / 0.9) ** 2.5
r += 0.4 * np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / 0.9) ** 2) / SR) * (tt / 0.9) ** 2
salvar("riser", norm(r, -12))

# trilha: 96 BPM, Am - F - C - G, kick suave, chimbal, baixo e pad filtrado
BPM = 96; beat = 60 / BPM; compasso = 4 * beat; dur = float(sys.argv[2])
N = int(dur * SR) + SR; mix = np.zeros((N, 2))
acordes = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(x, ini, g=1.0, pan=0.0):
    i = int(ini * SR); x = x[: max(0, N - i)]
    mix[i:i + len(x), 0] += x * g * (1 - pan); mix[i:i + len(x), 1] += x * g * (1 + pan)
nc = int(dur / compasso) + 1
for c in range(nc):
    ac = acordes[c % 4]; ini = c * compasso
    tt = t(compasso + 0.3)
    pad = sum(np.sin(2 * np.pi * hz(m) * (1 + d) * tt + ph) for m in ac for d, ph in [(-0.003, 0), (0.003, 1.3)])
    pad += 0.5 * sum(np.sin(2 * np.pi * hz(m + 12) * tt) for m in ac)
    env = np.minimum(1, tt / 0.25) * np.minimum(1, np.maximum(0, (compasso + 0.3 - tt) / 0.3))
    add(lp(pad * env, 1800, 2) * 0.05, ini)
    baixo = np.sin(2 * np.pi * hz(ac[0] - 24) * tt) + 0.3 * np.sin(2 * np.pi * hz(ac[0] - 12) * tt)
    for b in range(4):
        tb = t(beat * 0.9); nb = (np.sin(2 * np.pi * hz(ac[0] - 24) * tb) + 0.25 * np.sin(2 * np.pi * hz(ac[0] - 12) * tb)) * np.exp(-tb * 2.2) * np.minimum(1, tb / 0.01) * np.minimum(1, (beat * 0.9 - tb) / 0.06)
        add(nb * 0.22, ini + b * beat)
        tk = t(0.35); kick = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-tk * 35)) / SR) * np.exp(-tk * 9)
        add(kick * 0.55, ini + b * beat)
        for h in range(2):
            th = t(0.05); hat = hp(rng.standard_normal(len(th)), 7000) * np.exp(-th * 90)
            add(hat * (0.07 if h else 0.045), ini + b * beat + h * beat / 2, pan=0.25)
        if b in (1, 3):
            ts = t(0.25); clap = bp(rng.standard_normal(len(ts)), 900, 5000) * np.exp(-ts * 16)
            add(clap * 0.16, ini + b * beat, pan=-0.1)
mix = mix[: int(dur * SR)]
fade = int(1.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]; mix[: int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))[:, None]
sf.write(f"{OUT}/trilha.wav", norm(mix, -3).astype(np.float32), SR)
print("ok")
