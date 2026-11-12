# Decupagem + legendas de 2 palavras — João · Mounjaro.
# Tira silêncio do início/fim de cada take e encurta pausas internas (>= 0,25 s) para ~0,15 s.
# Marcadores: *palavra = verde (destaque) · ~palavra = serifada itálica verde · _palavra = sublinhada · !palavra = âmbar
#             ^ = token não exibido · + = junta palavras · {ctx} = página desenhada pela cena
import json, wave, sys, numpy as np

FPS = 30
BASE = sys.argv[1]
W = json.load(open(f'{BASE}/raw/words_seg.json'))
TAKES = [1, 2, 3, 4, 5]
CUT = {}
PAUSE = {}
BREATH = {2: 3, 3: 5, 4: 6, 5: 5}
HIDE = set()

SPEC = {
 1: "O *perigo | que ninguém | te conta | sobre o | {ctx} *MOUNJARO. | Aposto que | ninguém te | contou o | que acontece | quando você | *para de | tomar | o+*MOUNJARO?",
 2: "Fica até | o *final | porque isso | vai salvar | o seu | *resultado | e comenta | {ctx} *EU | se você | usa ou | já pensou | em usar | a famosa | *canetinha.",
 3: "O *MOUNJARO | imita+a | ação de | *dois *hormônios | que ajudam | a controlar | o seu | *apetite | e a | sua | *saciedade. | Você sente | *menos *fome | e pode | perder | bastante peso. | Parece | ~perfeito, | não é | mesmo? | Mas *calma, | o problema | está | ~escondido aí. | Você sente | menos fome | e muita | gente acaba | comendo | pouca *proteína. | E sem | {ctx} *treino | {ctx} *de *força, | o corpo | pode perder | não só | *gordura, | mas também | *massa *muscular. | Ah, o | importante | é o | número | na *balança. | Não é | mesmo? | Não é | bem assim.",
 4: "Ele precisa | de *combustível | e uma | boa *manutenção | para funcionar | bem, | e quando | você não | consome | *proteína | suficiente, | pode perder | *massa *muscular | e reduzir | a ~capacidade | do seu | corpo de | funcionar bem.",
 5: "Essa analogia | deixa claro | que ~emagrecer | não é | simplesmente | só perder | *peso. | A *proteína | oferece os | *aminoácidos | necessários | para *preservar | e reparar | os tecidos | *musculares. | O maior | *problema | pode aparecer | quando você | *para de | usar a | sua *canetinha. | E é | justamente isso | que eu | vou te | explicar | na *segunda | *parte. | Gostou desse | conteúdo? | Comenta, | curte e | compartilha!",
}


def load(n):
    w = wave.open(f'{BASE}/remotion/public/audio/a{n:02d}.wav')
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    return x, w.getframerate()


def keep_ranges(n):
    x, sr = load(n)
    ws = W[f'{n:02d}']
    a0 = max(0.0, ws[0][0] - 0.35)
    b0 = min(len(x) / sr, ws[-1][1] + 0.5)
    hop = int(0.01 * sr)
    e = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    t = np.arange(len(e)) * 0.01
    speech = (e > -30) & (t >= a0) & (t < b0)
    for c0, c1 in CUT.get(n, []):
        speech &= ~((t >= c0) & (t < c1))
    idx = np.where(speech)[0]
    i0, i1 = idx[0], idx[-1]
    k = 0
    while i0 > 0 and e[i0 - 1] > -46 and k < 25 and not any(c0 <= t[i0 - 1] < c1 for c0, c1 in CUT.get(n, [])):
        i0 -= 1; k += 1
    k = 0
    while i1 + 1 < len(e) and e[i1 + 1] > -46 and k < 20:
        i1 += 1; k += 1
    s0, s1 = i0 * 0.01, (i1 + 1) * 0.01
    gaps, i = [], i0
    while i < i1:
        if not speech[i]:
            j = i
            while j < len(speech) and not speech[j]:
                j += 1
            if (j - i) * 0.01 >= 0.20:
                gaps.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    keep, cur = [], max(a0, s0 - 0.05)
    for c0, c1 in CUT.get(n, []):
        if c0 <= cur < c1:
            cur = c1
    for g0, g1 in gaps:
        keep.append((cur, g0 + 0.07))
        cur = g1 - 0.07
    keep.append((cur, min(b0, s1 + 0.09)))
    keep = [(p, q) for p, q in keep if q - p - 0.15 >= 0.12 or len(keep) == 1]
    # pausas cômicas: divide o trecho no ponto indicado
    out = []
    for p, q in keep:
        cuts = [pt for pt, _ in PAUSE.get(n, []) if p < pt < q]
        last = p
        for pt in cuts:
            out.append((last, pt))
            last = pt
        out.append((last, q))
    return out, s0


segs, out, onsets = [], 0, {}
for n in TAKES:
    keep, s0 = keep_ranges(n)
    onsets[n] = s0
    out += BREATH.get(n, 0)
    for a, b in keep:
        fa, fb = round(a * FPS), round(b * FPS)
        if fb - fa < 3:
            continue
        for pt, fr in PAUSE.get(n, []):
            if abs(a - pt) < 1e-6:
                out += fr
        segs.append(dict(take=n, src=fa, srcEnd=fb, from_=out))
        out += fb - fa
TOTAL_SPEECH = out


def map_t(n, t):
    fr = t * FPS
    nxt = None
    for s in segs:
        if s['take'] != n:
            continue
        if s['src'] <= fr < s['srcEnd']:
            return s['from_'] + (fr - s['src'])
        if fr < s['src'] and nxt is None:
            nxt = s['from_']
    if nxt is not None:
        return nxt
    last = [s for s in segs if s['take'] == n][-1]
    return last['from_'] + (last['srcEnd'] - last['src'])


pages = []
for n in TAKES:
    words = W[f'{n:02d}']
    spec_pages = [p.strip().split() for p in SPEC[n].split('|')]
    flat = [t for p in spec_pages for t in p if not t.startswith('{')]
    assert len(flat) == len(words), (n, len(flat), len(words), [w[2] for w in words], flat)
    k = 0
    first_page = len(pages)
    for p in spec_pages:
        pos = None
        if p and p[0].startswith('{'):
            pos, p = p[0][1:-1], p[1:]
        toks, t_start = [], None
        for tok in p:
            w = words[k]
            k += 1
            if tok == '^':
                continue
            ts = max(w[0], onsets[n] - 0.02) if t_start is None and len(pages) == first_page else w[0]
            if t_start is None:
                t_start = ts
            e = None
            if tok[0] in '~*_!':
                e = {'~': 'serif', '*': 'gold', '_': 'under', '!': 'red'}[tok[0]]  # 'gold' = verde de destaque
                tok = tok[1:]
            toks.append(dict(t=tok.replace('+', ' '), e=e))
        if not toks:
            continue
        pages.append(dict(take=n, start=int(round(map_t(n, t_start))), toks=toks, hide=(n in HIDE) or pos is not None))
    pages[-1]['takeEnd'] = int(round(map_t(n, words[-1][1] + 0.15)))

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


def find(n, word, occ=0):
    if n not in TAKES:
        return None
    c = 0
    for w in W[f'{n:02d}']:
        if w[2].strip('.,?!:…').lower() == word.lower():
            if c == occ:
                return int(round(map_t(n, w[0])))
            c += 1
    raise KeyError((n, word))


marks = {
    'take': take_from, 'takeEnd': take_end,
    'perigo1': find(1, 'perigo'), 'mounjaro1': find(1, 'mounjaro'), 'aposto1': find(1, 'aposto'), 'acontece1': find(1, 'acontece'),
    'para1': find(1, 'para'), 'mounjaro1b': find(1, 'mounjaro', 1),
    'final2': find(2, 'final'), 'resultado2': find(2, 'resultado'), 'comenta2': find(2, 'comenta'), 'eu2': find(2, 'eu'),
    'usa2': find(2, 'usa'), 'famosa2': find(2, 'famosa'), 'canetinha2': find(2, 'canetinha'),
    'dois3': find(3, 'dois'), 'hormonios3': find(3, 'hormônios'), 'apetite3': find(3, 'apetite'), 'saciedade3': find(3, 'saciedade'),
    'voce3': find(3, 'você'), 'menos3': find(3, 'menos'), 'perder3': find(3, 'perder'), 'peso3': find(3, 'peso'), 'parece3': find(3, 'parece'),
    'calma3': find(3, 'calma'), 'escondido3': find(3, 'escondido'), 'voce3b': find(3, 'você', 1), 'pouca3': find(3, 'pouca'),
    'proteina3': find(3, 'proteína'), 'sem3': find(3, 'sem'), 'treino3': find(3, 'treino'), 'forca3': find(3, 'força'), 'corpo3': find(3, 'corpo'),
    'gordura3': find(3, 'gordura'), 'massa3': find(3, 'massa'), 'ah3': find(3, 'ah'), 'numero3': find(3, 'número'), 'balanca3': find(3, 'balança'),
    'nao3c': find(3, 'não', 3), 'bem3': find(3, 'bem'),
    'ele4': find(4, 'ele'), 'combustivel4': find(4, 'combustível'), 'manutencao4': find(4, 'manutenção'), 'quando4': find(4, 'quando'),
    'proteina4': find(4, 'proteína'), 'massa4': find(4, 'massa'), 'reduzir4': find(4, 'reduzir'), 'capacidade4': find(4, 'capacidade'),
    'funcionar4b': find(4, 'funcionar', 1),
    'analogia5': find(5, 'analogia'), 'emagrecer5': find(5, 'emagrecer'), 'peso5': find(5, 'peso'), 'proteina5': find(5, 'proteína'),
    'aminoacidos5': find(5, 'aminoácidos'), 'preservar5': find(5, 'preservar'), 'reparar5': find(5, 'reparar'), 'tecidos5': find(5, 'tecidos'),
    'maior5': find(5, 'maior'), 'problema5': find(5, 'problema'), 'canetinha5': find(5, 'canetinha'), 'justamente5': find(5, 'justamente'),
    'segunda5': find(5, 'segunda'), 'gostou5': find(5, 'gostou'), 'comenta5': find(5, 'comenta'), 'curte5': find(5, 'curte'),
    'compartilha5': find(5, 'compartilha'),
}

marks = {k: v for k, v in marks.items() if v is not None}
json.dump(dict(fps=FPS, total=TOTAL_SPEECH, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('fala total: %.1f s em %d trechos, %d páginas de legenda' % (TOTAL_SPEECH / FPS, len(segs), len(pages)))
for n in TAKES:
    ss = [s for s in segs if s['take'] == n]
    print(f"take {n:2d}: {len(ss)} trechos, {sum(s['srcEnd'] - s['src'] for s in ss) / FPS:5.2f} s, começa em {take_from[n]}")
