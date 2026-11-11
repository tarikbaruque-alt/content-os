# Decupagem + legendas de 2 palavras — "Máquinas vs. pesos livres" (João).
# Escolha dos takes (repetições descartadas):
#   - "estabilizadores": take 5 (com o "E", liga com a frase anterior) no lugar do take 4
#   - "suporte externo": take 6.1 (o take 6 diz "suportes externos" e tem um "E" solto no início)
#   - takes 7 e 8 são o mesmo arquivo
#   - "...controlar melhor o movimento e com segurança": take 9 até "controlar" + take 19 (regravação)
#     + take 9 a partir de "e ter uma boa contração muscular"
# Silêncio do início/fim cortado; pausas internas >= 0,25 s viram ~0,16 s (sem acelerar a fala).
# Marcadores no SPEC:
#   *palavra = conceito em destaque (verde, maior)   !palavra = palavra estratégica (branca, maior)
#   {pos} no início da página = palavra posicionada na cena (perto do halter, ao lado do corpo...)
#   {hook}/{combo} = página desenhada pela própria cena (tipografia grande), não pela legenda
import json, wave, sys, numpy as np

FPS = 30
BASE = sys.argv[1]
W = json.load(open(f'{BASE}/takes/words2.json'))

# (id do trecho, arquivo, janela no arquivo (s), fatia de palavras do Whisper)
CLIPS = [
    (1, '01', None, None),
    (2, '02', None, None),
    (3, '03', None, None),
    (4, '05', None, None),
    (5, '06b', None, None),
    (6, '07', None, None),
    (7, '09', (0.0, 2.24), (0, 3)),
    (8, '10', None, None),
    (9, '09', (3.68, None), (6, 12)),
    (10, '11', None, None),
    (11, '12', None, None),
    (12, '13', None, None),
]

SPEC = {
    1: "{hook} Máquinas ou | {hook} pesos livres?",
    2: "Entenda | o porquê | eles oferecem | *estímulos *diferentes?",
    3: "Os !pesos !livres | exigem maior | {halter} *controle | do movimento | e da | *contração *muscular.",
    4: "E outros | músculos | {lateral} *estabilizadores.",
    5: "Já as | !máquinas | oferecem | {encosto} *suporte *externo.",
    6: "Com isso, | ajudam a | *guiar | o movimento.",
    7: "Permitindo | assim controlar",
    8: "melhor o | movimento | e com | *segurança.",
    9: "e ter | uma boa | *contração *muscular.",
    10: "Por isso, | {combo} combinar os+dois | permite | trabalhar",
    11: "com | *estabilização | e movimentos | diferentes.",
    12: "Contribuindo | para um | treino melhor | e *completo. | Coloque | um+para | !pesos !livres | e o outro | para !máquinas. | Assim você | vai ter | um treino | *completo. | Gostou desse | conteúdo? | Compartilha, | comenta | e curte.",
}

# respiro (frames) ANTES de cada trecho: só nas trocas de frase; nada no meio de frase
BREATH = {2: 3, 3: 4, 4: 2, 5: 5, 6: 2, 7: 2, 10: 6}


def load(f):
    w = wave.open(f'{BASE}/remotion/public/audio/a{f}.wav')
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    return x, w.getframerate()


def keep_ranges(f, win, ws):
    x, sr = load(f)
    dur = len(x) / sr
    a = win[0] if win else 0.0
    b = (win[1] if win and win[1] is not None else dur)
    # limita a busca à região das palavras (ignora passos, cliques e ruídos antes/depois da fala)
    a = max(a, ws[0][0] - 0.35)
    b = min(b, ws[-1][1] + 0.5)
    hop = int(0.01 * sr)
    e = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    t = np.arange(len(e)) * 0.01
    inwin = (t >= a) & (t < b)
    speech = (e > -34) & inwin
    idx = np.where(speech)[0]
    i0, i1 = idx[0], idx[-1]
    # recua/avança enquanto ainda há voz fraca (consoantes), para não comer começo/fim de palavra
    k = 0
    while i0 > 0 and e[i0 - 1] > -46 and t[i0 - 1] >= a and k < 30:
        i0 -= 1; k += 1
    k = 0
    while i1 + 1 < len(e) and e[i1 + 1] > -46 and t[i1 + 1] < b and k < 25:
        i1 += 1; k += 1
    s0, s1 = i0 * 0.01, (i1 + 1) * 0.01
    gaps, i = [], i0
    while i < i1:
        if not speech[i]:
            j = i
            while j < len(speech) and not speech[j]:
                j += 1
            if (j - i) * 0.01 >= 0.25:
                gaps.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    keep, cur = [], max(a, s0 - 0.05)
    for g0, g1 in gaps:
        keep.append((cur, g0 + 0.08))
        cur = g1 - 0.08
    keep.append((cur, min(b, s1 + 0.08)))
    # descarta estalos isolados (trechos com menos de 0,15 s de som)
    keep = [(p, q) for p, q in keep if q - p - 0.16 >= 0.15 or len(keep) == 1]
    return keep, max(s0, keep[0][0] + 0.05)


segs, out, onsets = [], 0, {}
def words_of(cid):
    _, f, win, sl = next(c for c in CLIPS if c[0] == cid)
    ws = W[f]
    return ws[sl[0]:sl[1]] if sl else ws


for cid, f, win, _ in CLIPS:
    keep, s0 = keep_ranges(f, win, words_of(cid))
    onsets[cid] = s0
    out += BREATH.get(cid, 0)
    for a, b in keep:
        fa, fb = round(a * FPS), round(b * FPS)
        if fb - fa < 3:
            continue
        segs.append(dict(take=cid, file=f, src=fa, srcEnd=fb, from_=out))
        out += fb - fa
TOTAL_SPEECH = out


def map_t(cid, t):
    fr = t * FPS
    nxt = None
    for s in segs:
        if s['take'] != cid:
            continue
        if s['src'] <= fr < s['srcEnd']:
            return s['from_'] + (fr - s['src'])
        if fr < s['src'] and nxt is None:
            nxt = s['from_']
    if nxt is not None:
        return nxt
    last = [s for s in segs if s['take'] == cid][-1]
    return last['from_'] + (last['srcEnd'] - last['src'])


pages = []
for cid, f, win, _ in CLIPS:
    words = words_of(cid)
    spec_pages = [p.strip().split() for p in SPEC[cid].split('|')]
    flat = [t for p in spec_pages for t in p if not t.startswith('{')]
    n_words = sum(len(t.split('+')) for t in flat)
    assert n_words == len(words), (cid, n_words, len(words), [w[2] for w in words], flat)
    k = 0
    for p in spec_pages:
        pos = None
        if p and p[0].startswith('{'):
            pos = p[0][1:-1]
            p = p[1:]
        toks, t_start = [], None
        for tok in p:
            parts = tok.split('+')
            w = words[k]
            ts = max(w[0], onsets[cid] - 0.02) if k == 0 else w[0]
            k += len(parts)
            if t_start is None:
                t_start = ts
            e = None
            if tok[0] in '*!':
                e = {'*': 'key', '!': 'strong'}[tok[0]]
                tok = tok[1:]
            toks.append(dict(t=tok.replace('+', ' '), e=e))
        pages.append(dict(take=cid, start=int(round(map_t(cid, t_start))), toks=toks, pos=pos))
    pages[-1]['takeEnd'] = int(round(map_t(cid, words[-1][1] + 0.15)))

for i, p in enumerate(pages):
    nxt = pages[i + 1]['start'] if i + 1 < len(pages) else TOTAL_SPEECH
    end = nxt
    if 'takeEnd' in p:
        end = min(nxt, max(p['takeEnd'], p['start'] + 8))
    p['end'] = max(end, p['start'] + 6)
    p.pop('takeEnd', None)
for i in range(len(pages) - 1):
    if pages[i]['end'] > pages[i + 1]['start']:
        pages[i]['end'] = pages[i + 1]['start']

take_from, take_end = {}, {}
for s in segs:
    take_from.setdefault(s['take'], s['from_'])
    take_end[s['take']] = s['from_'] + s['srcEnd'] - s['src']


def find(cid, word, occ=0):
    c = 0
    for w in words_of(cid):
        if w[2].strip('.,?!:').lower() == word.lower():
            if c == occ:
                _, f, win, _ = next(cc for cc in CLIPS if cc[0] == cid)
                return int(round(map_t(cid, max(w[0], onsets[cid] - 0.02 if w is words_of(cid)[0] else w[0]))))
            c += 1
    raise KeyError((cid, word))


marks = {
    'take': take_from, 'takeEnd': take_end,
    'ou1': find(1, 'ou'), 'pesos1': find(1, 'pesos'),
    'estimulos2': find(2, 'estímulos'),
    'exigem3': find(3, 'exigem'), 'controle3': find(3, 'controle'), 'movimento3': find(3, 'movimento'), 'contracao3': find(3, 'contração'),
    'musculos4': find(4, 'músculos'), 'estab4': find(4, 'estabilizadores'),
    'maquinas5': find(5, 'máquinas'), 'oferecem5': find(5, 'oferecem'), 'suporte5': find(5, 'suporte'),
    'ajudam6': find(6, 'ajudam'), 'guiar6': find(6, 'guiar'),
    'seguranca8': find(8, 'segurança'), 'contracao9': find(9, 'contração'),
    'combinar10': find(10, 'combinar'), 'dois10': find(10, 'dois'), 'permite10': find(10, 'permite'),
    'estab11': find(11, 'estabilização'), 'movimentos11': find(11, 'movimentos'),
    'treino12': find(12, 'treino'), 'completo12': find(12, 'completo'), 'coloque12': find(12, 'coloque'),
    'pesos12': find(12, 'pesos'), 'outro12': find(12, 'outro'), 'maquinas12': find(12, 'máquinas'),
    'assim12': find(12, 'assim'), 'gostou12': find(12, 'gostou'),
    'compartilha12': find(12, 'compartilha'), 'comenta12': find(12, 'comenta'), 'curte12': find(12, 'curte'),
}

json.dump(dict(fps=FPS, total=TOTAL_SPEECH, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('fala total: %.1f s em %d trechos, %d páginas de legenda' % (TOTAL_SPEECH / FPS, len(segs), len(pages)))
for cid, f, _, _ in CLIPS:
    ss = [s for s in segs if s['take'] == cid]
    print(f"trecho {cid:2d} (t{f}): {len(ss)} cortes, {sum(s['srcEnd']-s['src'] for s in ss)/FPS:5.2f} s, começa em {take_from[cid]}")
print({k: v for k, v in marks.items() if k not in ('take', 'takeEnd')})
