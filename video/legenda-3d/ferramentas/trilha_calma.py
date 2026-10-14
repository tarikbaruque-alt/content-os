"""Trilha calma (pad + dedilhado suave, sem bateria) e um riser longo e suave."""
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfiltfilt
OUT, dur = sys.argv[1], float(sys.argv[2]); SR = 48000
rng = np.random.default_rng(3)
t = lambda d: np.arange(int(d * SR)) / SR
lp = lambda x, f: sosfiltfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
BPM = 84; beat = 60 / BPM; bar = 4 * beat
acordes = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 60]]  # Dm  Bb  C  Am
N = int((dur + 1) * SR); mix = np.zeros((N, 2))
def add(x, ini, g=1.0, pan=0.0):
    i = int(ini * SR); x = x[: max(0, N - i)]
    mix[i:i + len(x), 0] += x * g * (1 - pan); mix[i:i + len(x), 1] += x * g * (1 + pan)
for c in range(int(dur / bar) + 2):
    ac = acordes[c % 4]; ini = c * bar; tt = t(bar + 0.6)
    pad = sum(np.sin(2 * np.pi * hz(m) * (1 + d) * tt) for m in ac for d in (-0.002, 0.002))
    env = np.minimum(1, tt / 0.6) * np.minimum(1, np.maximum(0, (bar + 0.6 - tt) / 0.6))
    add(lp(pad * env, 1400) * 0.05, ini)
    tb = t(bar); add((np.sin(2 * np.pi * hz(ac[0] - 12) * tb) * np.minimum(1, tb / 0.05) * np.minimum(1, (bar - tb) / 0.2)) * 0.12, ini)
    for k in range(8):                                   # dedilhado em colcheias
        if ini + k * beat / 2 > dur - 2.8: break             # o final fica só com o acorde de resolução
        m = ac[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12; tp = t(0.9)
        pl = (np.sin(2 * np.pi * hz(m) * tp) + 0.3 * np.sin(4 * np.pi * hz(m) * tp)) * np.exp(-tp * 5) * np.minimum(1, tp / 0.004)
        add(pl * 0.05, ini + k * beat / 2, pan=0.3 if k % 2 else -0.3)
# acorde final (Ré menor) dedilhado e deixado soar
for k, m in enumerate([62, 65, 69, 74]):
    tp = t(3.0)
    nota = (np.sin(2 * np.pi * hz(m) * tp) + 0.25 * np.sin(4 * np.pi * hz(m) * tp)) * np.exp(-tp * 1.3) * np.minimum(1, tp / 0.006)
    add(nota * 0.07, dur - 2.6 + k * 0.07, pan=(k - 1.5) * 0.2)
mix = mix[: int(dur * SR)]
f = int(1.2 * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]; mix[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))[:, None]
sf.write(f"{OUT}/trilha_calma.wav", (mix / np.abs(mix).max() * 0.7).astype(np.float32), SR)
# riser longo e suave (ruído filtrado subindo + tom subindo)
tt = t(2.8); p = tt / 2.8
r = np.zeros_like(tt); fc = 300 * (6000 / 300) ** p
n = rng.standard_normal(len(tt))
from scipy.signal import stft, istft
fr, tf, Z = stft(n, SR, nperseg=2048, noverlap=1536)
mask = np.exp(-0.5 * ((np.log2(np.maximum(fr, 20))[:, None] - np.log2(300 * (6000 / 300) ** np.clip(tf / 2.8, 0, 1))[None, :]) / 0.8) ** 2)
_, r = istft(Z * mask, SR, nperseg=2048, noverlap=1536); r = r[: len(tt)]
r = r * p ** 2 + 0.25 * np.sin(2 * np.pi * np.cumsum(220 + 440 * p ** 2) / SR) * p ** 2
r = r / np.abs(r).max() * 0.5
sf.write(f"{OUT}/riser_longo.wav", np.stack([r, r], 1).astype(np.float32), SR)
print("ok")
