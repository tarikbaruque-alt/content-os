# Trilha original (sintetizada aqui, sem direitos de terceiros) que acompanha a história:
#   gancho: entrada suave · história (1900–1931): mistério em ré menor, pulso discreto e dedilhado
#   viagem/pneu: abre um pouco · exemplo prático: só a base · final: mais presença · vinheta: acorde final.
# Uso: python3 trilha.py edl.json saida.wav  (versão Mounjaro: lá menor, cauda de 45 frames)
import json, sys
import numpy as np
from scipy.signal import fftconvolve, lfilter

SR = 48000
E = json.load(open(sys.argv[1]))
FPS = E['fps']
MK = E['marks']
T = lambda n: MK['take'][str(n)] / FPS
END = E['total'] / FPS
TOTAL = END + 45 / FPS
N = int(TOTAL * SR) + SR
t = np.arange(N) / SR
rng = np.random.default_rng(7)

BPM = 84.0
BEAT = 60 / BPM
BAR = 4 * BEAT
note = lambda m: 440.0 * 2 ** ((m - 69) / 12)

# acordes (MIDI): Dm, Bb, F, C  → final: F, C, Dm, Bb (mais luminoso)
PROG_A = [[45, 52, 57, 60, 64], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67], [43, 55, 59, 62, 67]]
PROG_B = [[41, 53, 57, 60, 65, 69], [48, 55, 60, 64, 67, 72], [43, 55, 59, 62, 67, 71], [45, 52, 57, 60, 64, 69]]

sec = {
    'intro': (0.0, T(3)),
    'hist': (T(3), T(4)),
    'trip': (T(4), T(5)),
    'prat': (T(5), MK['gostou5'] / FPS),
    'fim': (MK['gostou5'] / FPS, END),
    'vin': (END, TOTAL),
}

def env_section(name, fade=1.2):
    a, b = sec[name]
    e = np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)
    return e

def saw_additive(f0, length, harm=10, detune=0.0):
    tt = np.arange(length) / SR
    y = np.zeros(length)
    for k in range(1, harm + 1):
        y += np.sin(2 * np.pi * f0 * k * (1 + detune) * tt + rng.uniform(0, 6.28)) / k
    return y

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    return lfilter([1 - a], [1, -a], x)

# ---------- pad ----------
pad = np.zeros(N)
n_bars = int(np.ceil(TOTAL / BAR)) + 1
for i in range(n_bars):
    start = i * BAR
    s0 = int(start * SR)
    ln = int((BAR + 1.6) * SR)
    if s0 >= N:
        break
    ln = min(ln, N - s0)
    chord = (PROG_B if start >= sec['fim'][0] - 0.5 else PROG_A)[i % 4]
    y = np.zeros(ln)
    for mnote in chord:
        f0 = note(mnote)
        y += saw_additive(f0, ln, harm=7, detune=0.0025) + saw_additive(f0, ln, harm=7, detune=-0.0025)
    tt = np.arange(ln) / SR
    adsr = np.clip(tt / 0.9, 0, 1) * np.clip((BAR + 1.6 - tt) / 1.6, 0, 1)
    pad[s0:s0 + ln] += y * adsr
pad = onepole_lp(pad, 900)
pad = onepole_lp(pad, 1400)
pad /= np.abs(pad).max() + 1e-9

# ---------- dedilhado (Karplus-Strong) ----------
def pluck(f0, dur=1.6, bright=0.5):
    n = int(dur * SR)
    p = int(SR / f0)
    buf = rng.uniform(-1, 1, p) * bright
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.996 * 0.5 * (v + buf[(i + 1) % p])
    return out

pl_cache = {}
arp = np.zeros(N)
def arp_section(a, b, prog, pattern, octave=12, vel=1.0):
    k = 0
    tb = a
    while tb < b - 0.2:
        bar_i = int(tb // BAR)
        chord = prog[bar_i % 4]
        m = chord[pattern[k % len(pattern)]] + octave
        if m not in pl_cache:
            pl_cache[m] = pluck(note(m))
        y = pl_cache[m]
        s0 = int(tb * SR)
        ln = min(len(y), N - s0)
        arp[s0:s0 + ln] += y[:ln] * vel * (0.85 + 0.3 * rng.random())
        tb += BEAT / 2
        k += 1

arp_section(sec['hist'][0] + BAR, sec['hist'][1], PROG_A, [2, 3, 4, 3], octave=12, vel=0.55)
arp_section(sec['trip'][0], sec['trip'][1], PROG_A, [2, 4, 3, 4, 1, 4], octave=12, vel=0.75)
arp_section(sec['fim'][0], sec['fim'][1], PROG_B, [2, 3, 5, 4], octave=12, vel=0.8)
arp = onepole_lp(arp, 3500)
arp /= np.abs(arp).max() + 1e-9

# ---------- pulso grave (tensão na parte histórica) ----------
sub = np.zeros(N)
tb = sec['hist'][0]
while tb < sec['trip'][1]:
    bar_i = int(tb // BAR)
    root = PROG_A[bar_i % 4][0] - 12
    s0 = int(tb * SR)
    ln = min(int(0.7 * SR), N - s0)
    tt = np.arange(ln) / SR
    sub[s0:s0 + ln] += np.sin(2 * np.pi * note(root) * tt) * np.exp(-tt / 0.25) * np.clip(tt / 0.01, 0, 1)
    tb += BEAT
sub /= np.abs(sub).max() + 1e-9

# ---------- acorde final da vinheta + brilho ----------
hit = np.zeros(N)
s0 = int(END * SR)
ln = N - s0
tt = np.arange(ln) / SR
for mnote in [45, 52, 57, 60, 64, 69, 72, 76]:
    hit[s0:] += np.sin(2 * np.pi * note(mnote) * tt) * np.exp(-tt / 1.6) * np.clip(tt / 0.02, 0, 1)
hit /= np.abs(hit).max() + 1e-9

# ---------- automação por trecho ----------
def lvl(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return np.interp(t, xs, ys)

pad_lvl = lvl([(0, 0.0), (1.2, 0.55), (sec['hist'][0], 0.6), (sec['trip'][0], 0.7), (sec['prat'][0], 0.5), (sec['fim'][0] - 1, 0.55), (sec['fim'][0] + 2, 0.85), (END, 0.95), (END + 0.6, 0.4), (TOTAL, 0.0)])
arp_lvl = env_section('hist', 2.5) * 0.45 + env_section('trip', 0.8) * 0.6 + env_section('fim', 1.5) * 0.7
sub_lvl = (env_section('hist', 2.0) + env_section('trip', 0.8)) * 0.35
mix = pad * pad_lvl * 0.55 + arp * arp_lvl * 0.5 + sub * sub_lvl + hit * 0.7

# ---------- reverb (resposta ao impulso sintética) ----------
ir_t = np.arange(int(2.6 * SR)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.75)
ir = onepole_lp(ir, 5000)
ir /= np.sqrt(np.sum(ir ** 2))
wetL = fftconvolve(mix, ir)[:N]
ir2 = np.roll(ir, 211) * 0.98
wetR = fftconvolve(mix, ir2)[:N]
L = mix * 0.7 + wetL * 0.55
R = mix * 0.7 + wetR * 0.55
st = np.stack([L, R], 1)
st /= np.abs(st).max() + 1e-9
st *= 0.8
fade_out = np.clip((TOTAL - t) / 0.15, 0, 1)[:, None]
st *= fade_out
import wave
w = wave.open(sys.argv[2], 'w')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(st[: int(TOTAL * SR)], -1, 1) * 32767).astype('<i2').tobytes())
w.close()
print('trilha: %.1f s' % TOTAL)
