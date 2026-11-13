# Trilha original (sintetizada aqui, sem direitos de terceiros): inspiradora e calma, para um vídeo educativo.
# Lá menor → dó maior, 96 BPM: piano elétrico suave + pizzicato + baixo + bateria leve.
# Automação: abertura só com harmonia · batida entra na "jornada" · cresce da autoridade até a escada (pico) ·
# recua quando "a pergunta volta" · volta inteira no convite final.
# Uso: python3 trilha.py edl.json saida.wav
import json, sys, wave
import numpy as np
from scipy.signal import fftconvolve, lfilter

SR = 48000
E = json.load(open(sys.argv[1]))
FPS = E['fps']
MK = E['marks']
M = lambda k: MK[k] / FPS
END = E['total'] / FPS
TOTAL = END + 16 / FPS
N = int(TOTAL * SR) + SR
t = np.arange(N) / SR
rng = np.random.default_rng(11)

BPM = 96.0
BEAT = 60 / BPM
STEP = BEAT / 4
BAR = 4 * BEAT
note = lambda m: 440.0 * 2 ** ((m - 69) / 12)
PROG = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 64], [55, 59, 62, 67]]  # Am7 Fmaj7 C(add3) G
ROOT = [45, 41, 36, 43]


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    return lfilter([1 - a], [1, -a], x)


def add(buf, y, at, g=1.0):
    s0 = int(at * SR)
    if s0 >= N:
        return
    ln = min(len(y), N - s0)
    buf[s0:s0 + ln] += y[:ln] * g


# ---------- piano elétrico (pad) ----------
def ep(m, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f0 = note(m)
    y = np.sin(2 * np.pi * f0 * tt) + 0.35 * np.sin(2 * np.pi * 2 * f0 * tt) * np.exp(-tt / 0.4) + 0.12 * np.sin(2 * np.pi * 3 * f0 * tt) * np.exp(-tt / 0.2)
    y *= (1 + 0.12 * np.sin(2 * np.pi * 4.5 * tt))  # tremolo
    return y * np.clip(tt / 0.02, 0, 1) * np.exp(-tt / 1.6)


pad = np.zeros(N)
nb = int(np.ceil(TOTAL / BAR)) + 1
for i in range(nb):
    for k, m in enumerate(PROG[i % 4]):
        add(pad, ep(m, BAR + 0.8), i * BAR + k * 0.012, 0.5)
        add(pad, ep(m, BEAT * 1.5) * 0.6, i * BAR + 2.5 * BEAT, 0.35)  # empurrãozinho sincopado
pad = onepole_lp(pad, 2600)
pad /= np.abs(pad).max() + 1e-9


# ---------- pizzicato (Karplus-Strong) ----------
def pluck(f0, dur=0.9, bright=0.6):
    n = int(dur * SR)
    p = int(SR / f0)
    buf = rng.uniform(-1, 1, p) * bright
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.992 * 0.5 * (v + buf[(i + 1) % p])
    return out


cache = {}
piz = np.zeros(N)
STEPS = [0, 3, 6, 10, 12, 14]
IDX = [0, 2, 1, 3, 2, 1]
for i in range(nb):
    ch = PROG[i % 4]
    for j, st in enumerate(STEPS):
        m = ch[IDX[(j + i) % len(IDX)] % 4] + 12
        if m not in cache:
            cache[m] = pluck(note(m))
        add(piz, cache[m], i * BAR + st * STEP, 0.8 + 0.3 * rng.random())
piz = onepole_lp(piz, 4200)
piz /= np.abs(piz).max() + 1e-9

# arpejo agudo (parte motivacional)
arp = np.zeros(N)
for i in range(nb):
    ch = PROG[i % 4]
    for st in range(0, 16, 2):
        m = ch[[0, 1, 2, 3, 2, 1, 2, 3][st // 2]] + 24
        if m not in cache:
            cache[m] = pluck(note(m), 0.6, 0.45)
        add(arp, cache[m], i * BAR + st * STEP, 0.6)
arp = onepole_lp(arp, 5200)
arp /= np.abs(arp).max() + 1e-9

# ---------- baixo sincopado ----------
bass = np.zeros(N)
for i in range(nb):
    r = ROOT[i % 4]
    for st, ln in [(0, 2.5), (3, 1.0), (8, 2.5), (11, 1.0), (14, 1.0)]:
        n = int(ln * STEP * SR)
        tt = np.arange(n) / SR
        f0 = note(r + (12 if st == 14 else 0))
        y = np.tanh(1.6 * np.sin(2 * np.pi * f0 * tt)) * np.clip(tt / 0.005, 0, 1) * np.clip((ln * STEP - tt) / 0.02, 0, 1)
        add(bass, y, i * BAR + st * STEP, 0.9)
bass = onepole_lp(bass, 700)
bass /= np.abs(bass).max() + 1e-9

# ---------- bateria leve ----------
def kick():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 45 + 80 * np.exp(-tt / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.18)


def hat(dec=0.025):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    x = np.diff(rng.standard_normal(n + 1))
    return x * np.exp(-tt / dec) * 0.5


def snap():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    x = lfilter([1, 0, -1], [1, -1.6, 0.8], x) * 0.25
    return (x + 0.4 * np.sin(2 * np.pi * 190 * tt)) * np.exp(-tt / 0.07)


K, H, Hs, Sn = kick(), hat(), hat(0.06), snap()
drums = np.zeros(N)
hats = np.zeros(N)
for i in range(nb):
    b = i * BAR
    for st in [0, 7, 8]:
        add(drums, K, b + st * STEP, 1.0 if st != 7 else 0.55)
    for st in [4, 12]:
        add(drums, Sn, b + st * STEP, 0.7)
    for st in range(0, 16, 2):
        add(hats, Hs if st == 14 else H, b + st * STEP, 0.55 if st % 4 else 0.85)
drums /= np.abs(drums).max() + 1e-9
hats /= np.abs(hats).max() + 1e-9

# ---------- brilho na escada (escala) ----------
choir = np.zeros(N)
a0, a1 = M('i_eai'), M('i_volta')
n = int((a1 - a0 + 1.0) * SR); tt = np.arange(n) / SR
for m in [69, 72, 76, 79, 84]:
    for d in (-0.004, 0.004):
        choir[int(a0 * SR):int(a0 * SR) + n] += np.sin(2 * np.pi * note(m) * (1 + d) * tt + rng.uniform(0, 6)) * (1 + 0.15 * np.sin(2 * np.pi * 5 * tt))
env = np.clip(tt / 0.6, 0, 1) * np.clip((a1 - a0 + 1.0 - tt) / 0.9, 0, 1)
choir[int(a0 * SR):int(a0 * SR) + n] *= env
choir /= np.abs(choir).max() + 1e-9

# ---------- automação ----------
def lvl(points):
    return np.interp(t, [p[0] for p in points], [p[1] for p in points])


def hole(a, b, fade=0.05, depth=0.0):
    """multiplicador: cai para 'depth' entre a e b"""
    return 1 - (1 - depth) * np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)


groove = lvl([(0, 0), (M('i_voces') - 0.1, 0), (M('i_voces') + 0.8, 0.6), (M('i_pessoas'), 0.7), (M('i_eai'), 0.95), (M('i_volta') - 0.1, 0.95), (M('i_volta') + 0.3, 0.0),
              (M('i_voces2') - 0.2, 0.0), (M('i_voces2') + 0.6, 0.6), (M('i_mediga'), 0.7), (M('i_mediga') + 0.6, 0.95), (END, 1.0)])
groove *= hole(M('i_porque0'), M('i_porque') - 0.05, 0.05, 0.25)
padl = lvl([(0, 0.0), (0.4, 0.6), (M('i_voces'), 0.55), (M('i_pessoas'), 0.6), (M('i_eai'), 0.8), (M('i_volta'), 0.6), (M('i_mediga'), 0.7), (END, 0.85)])
pizl = lvl([(0, 0.0), (0.3, 0.45), (M('i_voces'), 0.6), (M('quem'), 0.35), (M('i_sentido'), 0.6), (M('i_volta'), 0.6), (M('i_volta') + 0.3, 0.35), (M('i_voces2'), 0.6), (END, 0.7)])
arpl = lvl([(0, 0), (M('i_pessoas') - 0.2, 0), (M('i_pessoas') + 1.5, 0.45), (M('i_eai'), 0.7), (M('i_volta'), 0.7), (M('i_volta') + 0.4, 0.0), (M('i_mediga'), 0.0), (M('i_mediga') + 0.6, 0.55), (END, 0.65)])

dry = pad * padl * 0.46 + piz * pizl * 0.34 + arp * arpl * 0.16 + bass * groove * 0.34 + drums * groove * 0.36 + hats * groove * 0.10 + choir * 0.22

# acorde final curto (corte limpo)
hit = np.zeros(N)
s0 = int(END * SR)
tt = np.arange(N - s0) / SR
for m in [36, 48, 52, 55, 60, 64, 67]:
    hit[s0:] += np.sin(2 * np.pi * note(m) * tt) * np.exp(-tt / 0.9) * np.clip(tt / 0.01, 0, 1)
hit /= np.abs(hit).max() + 1e-9
dry += hit * 0.5
add(dry, K, END, 0.5)

# ---------- reverb curta (sala) ----------
ir_t = np.arange(int(1.4 * SR)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.35)
ir = onepole_lp(ir, 6000)
ir /= np.sqrt(np.sum(ir ** 2))
wet_src = pad * padl * 0.46 + piz * pizl * 0.34 + arp * arpl * 0.16 + choir * 0.22
wL = fftconvolve(wet_src, ir)[:N]
wR = fftconvolve(wet_src, np.roll(ir, 173))[:N]
L = dry + wL * 0.35
R = dry + wR * 0.35
# um pouco de largura para o pizzicato
L += np.roll(piz * pizl, int(0.011 * SR)) * 0.06
st = np.stack([L, R], 1)
st /= np.abs(st).max() + 1e-9
st *= 0.8
st *= np.clip((TOTAL - t) / 0.12, 0, 1)[:, None]
w = wave.open(sys.argv[2], 'w')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(st[: int(TOTAL * SR)], -1, 1) * 32767).astype('<i2').tobytes())
w.close()
print('trilha: %.1f s' % TOTAL)
