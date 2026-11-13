# Decupagem + legendas de 2 palavras — "Pergunta sincera" (take único).
# A fala é dividida em "ilhas" (trechos entre silêncios). Cada ilha tem o texto corrigido e a marcação da legenda.
# Saem: silêncios, respiros, 3 "é..." (22,4 s · 36,0 s · 79,9 s), um falso começo (53,1 s) e um estalo (75,3 s).
# As pausas viram respiros curtos conforme a pontuação (fim de frase > vírgula > meio de frase), sem acelerar a voz.
# Marcadores: *palavra = amarelo (destaque) · ~palavra = serifada itálica · !palavra = coral (dor/objeção)
#             + = junta palavras num só token · {ctx} = página desenhada pela cena (legenda oculta)
import json, sys, wave, re, difflib
import numpy as np

FPS = 30
BASE = sys.argv[1]
WH = {round(i['a'], 2): i['words'] for i in json.load(open(f'{BASE}/raw/ilhas.json'))}  # no repositório: scripts/ilhas.json

# (início, fim, legenda) — tempos do áudio original; o script refina as bordas pela energia
ISL = [
    (0.04, 2.16, "{ctx} Gente, | {ctx} hoje eu | {ctx} queria fazer | {ctx} um ~questionamento | {ctx} pra vocês."),  # a headline ocupa a tela
    (2.45, 6.17, "Vocês têm | a *vontade | e o | *interesse | de começar | uma ~jornada | no *DIGITAL?"),
    (6.91, 8.21, "E por+que | eu estou | ~questionando | isso?"),
    (8.77, 9.08, "Porque,"),
    (9.42, 10.67, "olha, | hoje eu | sinto que"),
    (10.82, 13.03, "quem *não | for pro | *DIGITAL | o quanto | ~antes"),
    (13.41, 14.79, "está | jogando | !dinheiro !fora,"),
    (15.87, 17.04, "no sentido | de"),
    (17.86, 22.05, "quando você | vai pro | *digital, | mesmo que | você *não | faça nenhum | ~produto | como *e-book,"),
    (23.00, 24.20, "*manual | de *dicas,"),
    (24.63, 26.62, "*curso, | *mentoria, | *consultoria,"),
    (26.89, 28.37, "o fato | de você | se ~expor"),
    (28.69, 31.38, "e conseguir | *seguidores, | você consegue | abrir *portas,"),
    (31.81, 34.32, "abrir novos | *caminhos, | conseguir | *parcerias, | conseguir"),
    (34.63, 35.82, "*collabs, | conseguir"),
    (36.44, 37.29, "*publicidade"),
    (37.67, 42.18, "e até | mostrar o | seu *trabalho. | O mais | ~importante, | né? | Seria mostrar | o seu | *trabalho | pro *MUNDO, | sabe?"),
    (42.50, 44.49, "As pessoas | conseguem ver | a *qualidade"),
    (44.79, 47.78, "e a | *autoridade | que você | tem ao | falar sobre | determinado | assunto."),
    (48.37, 49.66, "Você passa | a ser | visto"),
    (49.87, 50.67, "como um | ~expert,"),
    (51.26, 52.74, "e a | partir daí | você vai"),
    (53.89, 55.22, "conseguindo | conquistar"),
    (55.54, 56.96, "*confiabilidade | das pessoas."),
    (57.79, 59.27, "E a | partir daí | você consegue,"),
    (59.84, 63.22, "possivelmente, | futuramente, | captar | *CLIENTES | pro seu | ~portfólio,"),
    (63.37, 64.42, "ter *cases | de *sucesso."),
    (64.94, 67.14, "E aí, | com o | *tempo, | você vai | ~escalando | o seu | *NEGÓCIO."),
    (67.63, 68.23, "Então, | assim,"),
    (69.53, 70.35, "a *pergunta | ~volta:"),
    (70.58, 72.43, "vocês têm | *vontade? | Têm | *interesse?"),
    (72.90, 73.52, "E se | tem,"),
    (73.94, 74.69, "{ctx} o que | {ctx} que falta?"),
    (75.95, 76.97, "Qual é | a maior | !objeção?"),
    (77.32, 77.56, "Vocês"),
    (77.85, 79.09, "não gostam | de se | !expor?"),
    (81.12, 84.73, "Acham que | não vão | ter !ideia | suficiente | para criar | conteúdos | ~constantes?"),
    (86.10, 88.14, "Falta | !tempo? | Falta | !disponibilidade?"),
    (88.96, 89.73, "Me *DIGA, | que"),
    (90.02, 91.59, "talvez | eu possa | vir *ajudar | *VOCÊS."),
]
# cortes obrigatórios (hesitações) — nunca entram, mesmo que o respiro permita
CUT = [(22.36, 22.98), (35.98, 36.42), (53.02, 53.74), (75.28, 75.52), (79.86, 80.90)]


def load():
    w = wave.open(f'{BASE}/remotion/public/audio/a01.wav')
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    return x, w.getframerate()


x, sr = load()
hop = int(0.01 * sr)
E = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
DUR = len(x) / sr


def refine(a, b):
    """estende as bordas enquanto ainda há cauda/ataque de voz (> -46 dB)"""
    i0, i1 = int(round(a * 100)), int(round(b * 100))
    k = 0
    while i0 > 0 and E[i0 - 1] > -46 and k < 12:
        i0 -= 1; k += 1
    k = 0
    while i1 < len(E) - 1 and E[i1] > -46 and k < 22:
        i1 += 1; k += 1
    return i0 / 100, i1 / 100


def clean(tok):
    return re.sub(r'[*~!_]', '', tok)


def norm(s):
    return re.sub(r'[^a-záàâãéêíóôõúç0-9]', '', s.lower())


# ---------- respiros: quanto silêncio fica depois de cada ilha ----------
def breath(spec):
    last = clean(spec.split('|')[-1].split()[-1])
    if last[-1] in '.?!:':
        return 0.21
    if last[-1] == ',':
        return 0.13
    return 0.09


islands = []
for a, b, spec in ISL:
    ra, rb = refine(a, b)
    for c0, c1 in CUT:  # a borda refinada não pode invadir um corte
        if ra < c1 <= a + 0.02: ra = max(ra, c1)
        if b - 0.02 <= c0 < rb: rb = min(rb, c0)
    islands.append(dict(a=a, b=b, ra=ra, rb=rb, spec=spec))

# ---------- trechos mantidos ----------
keep = []  # (src_ini, src_fim, cortou_muito)
for i, isl in enumerate(islands):
    pre = 0.05
    start = max(0.0, isl['ra'] - pre)
    if i > 0:
        prev = islands[i - 1]
        gap = isl['ra'] - prev['rb']
        want = breath(prev['spec'])
        has_cut = any(prev['rb'] <= c0 and c1 <= isl['ra'] + 0.05 for c0, c1 in CUT)
        if gap <= want + 0.06 and not has_cut:
            # pausa natural curta: mantém inteira (sem corte)
            keep[-1] = (keep[-1][0], isl['rb'], keep[-1][2])
            continue
        post = min(want - pre, gap - pre - 0.01)
        post = max(post, 0.03)
        end_prev = prev['rb'] + post
        for c0, c1 in CUT:
            if prev['rb'] <= c0 < end_prev: end_prev = c0
            if c0 < start < c1: start = c1
        keep[-1] = (keep[-1][0], end_prev, keep[-1][2])
        keep.append((start, isl['rb'], (gap >= 0.45) or has_cut))
    else:
        keep.append((start, isl['rb'], False))
keep[-1] = (keep[-1][0], min(DUR, islands[-1]['rb'] + 0.10), keep[-1][2])

segs, out, z = [], 0, 0
for a, b, big in keep:
    fa, fb = int(round(a * FPS)), int(round(b * FPS))
    if big:
        z = 1 - z  # só muda o enquadramento quando o corte tirou bastante coisa (disfarça o pulo)
    segs.append(dict(take=1, src=fa, srcEnd=fb, from_=out, z=z))
    out += fb - fa
TOTAL = out


def map_t(t):
    fr = t * FPS
    for s in segs:
        if s['src'] <= fr < s['srcEnd']:
            return s['from_'] + (fr - s['src'])
        if fr < s['src']:
            return s['from_']
    return TOTAL


# ---------- tempo de cada palavra (âncoras do Whisper + interpolação) ----------
def times(isl):
    toks = [t for p in isl['spec'].split('|') for t in p.split() if not t.startswith('{')]
    wh = WH.get(round(isl['a'], 2)) or []
    if not wh:  # ilha com início ajustado por corte: procura a mais próxima
        key = min(WH, key=lambda k: abs(k - isl['a']))
        wh = [w for w in WH[key] if w[0] >= isl['a'] - 0.15] if abs(key - isl['a']) < 1.2 else []
    a, b = isl['ra'], isl['rb']
    A = [norm(clean(t).split('+')[0]) for t in toks]
    B = [norm(w[2]) for w in wh]
    t0 = [None] * len(toks)
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            t0[blk.a + k] = min(max(wh[blk.b + k][0], a), b - 0.05)
    t0[0] = a if t0[0] is None or t0[0] < a + 0.12 else t0[0]
    # interpola os que faltam pelo tamanho das palavras
    L = [len(clean(t)) + 1 for t in toks]
    anchors = [(i, t) for i, t in enumerate(t0) if t is not None] + [(len(toks), b)]
    for (i0, ta), (i1, tb) in zip(anchors, anchors[1:]):
        tot = sum(L[i0:i1])
        acc = 0
        for i in range(i0, i1):
            if t0[i] is None:
                t0[i] = ta + (tb - ta) * acc / tot
            acc += L[i]
    for i in range(1, len(t0)):
        t0[i] = max(t0[i], t0[i - 1] + 0.04)
    return toks, t0


pages, words = [], []
for n, isl in enumerate(islands):
    toks, t0 = times(isl)
    k = 0
    first = len(pages)
    for p in isl['spec'].split('|'):
        p = p.split()
        hide = False
        if p and p[0].startswith('{'):
            hide, p = True, p[1:]
        ptoks, start = [], None
        for tok in p:
            t = t0[k]; k += 1
            if start is None:
                start = t
            e = None
            if tok[0] in '~*_!':
                e = {'~': 'serif', '*': 'gold', '_': 'under', '!': 'red'}[tok[0]]
                tok = tok[1:]
            txt = tok.replace('+', ' ')
            ptoks.append(dict(t=txt, e=e))
            words.append(dict(w=norm(txt), f=int(round(map_t(t))), isl=n))
        pages.append(dict(take=1, start=int(round(map_t(start))), toks=ptoks, hide=hide))
    pages[-1]['islEnd'] = int(round(map_t(isl['rb']))) + 5

for i, p in enumerate(pages):
    nxt = pages[i + 1]['start'] if i + 1 < len(pages) else TOTAL
    end = min(nxt, p['islEnd']) if 'islEnd' in p else nxt
    p['end'] = max(end, p['start'] + 5)
    if p['end'] > nxt: p['end'] = nxt
    p.pop('islEnd', None)


# nenhuma página pisca: mínimo de 8 quadros, pegando emprestado da vizinha mais longa
MINP = 8
for _ in range(3):
    for i, p in enumerate(pages):
        need = MINP - (p['end'] - p['start'])
        if need <= 0:
            continue
        if i > 0 and pages[i - 1]['end'] == p['start']:
            prev = pages[i - 1]
            give = min(need, max(0, (prev['end'] - prev['start']) - MINP))
            prev['end'] -= give; p['start'] -= give; need -= give
        if need > 0 and i + 1 < len(pages) and pages[i + 1]['start'] == p['end']:
            nx = pages[i + 1]
            give = min(need, max(0, (nx['end'] - nx['start']) - MINP))
            nx['start'] += give; p['end'] += give


def find(word, occ=0):
    c = 0
    for w in words:
        if w['w'] == norm(word):
            if c == occ:
                return w['f']
            c += 1
    raise KeyError(word)


isl_from = [int(round(map_t(i['ra']))) for i in islands]
isl_to = [int(round(map_t(i['rb'] - 0.001))) + 1 for i in islands]
NAMES = ['gente', 'voces', 'porque0', 'porque', 'olha', 'quem', 'esta', 'sentido', 'quando', 'manual', 'curso', 'fato', 'conseguir', 'abrir2', 'collabs', 'publicidade',
         'ate', 'pessoas', 'autoridadeI', 'passa', 'como', 'partir', 'conseguindo', 'confiab', 'partir2', 'possivel', 'cases', 'eai', 'entao', 'volta', 'vontade2', 'ese',
         'falta', 'qual', 'voces2', 'gostam', 'acham', 'tempoI', 'mediga', 'talvez']
marks = {'take': {'1': 0}, 'takeEnd': {'1': TOTAL}}
for nme, a, b in zip(NAMES, isl_from, isl_to):
    marks['i_' + nme] = a
    marks['e_' + nme] = b
W = [('consegue',), ('nenhum',), ('quem',), ('fazer',), ('começar',), ('mostrar',), ('ver',), ('falar',), ('partir',), ('partir', 1, 'partirB'), ('possivelmente',), ('futuramente',), ('criar',), ('conteúdos',), ('suficiente',), ('questionamento',), ('vontade',), ('interesse',), ('jornada',), ('digital',), ('questionando',), ('sinto',), ('digital', 1, 'digital2'), ('antes',), ('jogando',), ('dinheiro',),
     ('digital', 2, 'digital3'), ('mesmo',), ('produto',), ('ebook',), ('manual',), ('dicas',), ('curso',), ('mentoria',), ('consultoria',), ('expor',), ('seguidores',),
     ('portas',), ('caminhos',), ('parcerias',), ('collabs',), ('publicidade',), ('trabalho',), ('importante',), ('trabalho', 1, 'trabalho2'), ('mundo',), ('sabe',),
     ('qualidade',), ('autoridade',), ('assunto',), ('visto',), ('expert',), ('conquistar',), ('confiabilidade',), ('pessoas', 1, 'pessoas2'), ('captar',), ('clientes',),
     ('portfólio',), ('cases',), ('sucesso',), ('tempo',), ('escalando',), ('negócio',), ('pergunta',), ('volta',), ('vontade', 1, 'vontadeB'), ('interesse', 1, 'interesseB'),
     ('objeção',), ('gostam',), ('expor', 1, 'exporB'), ('acham',), ('ideia',), ('constantes',), ('falta', 1, 'faltaTempo'), ('tempo', 1, 'tempoB'),
     ('falta', 2, 'faltaDisp'), ('disponibilidade',), ('diga',), ('talvez',), ('ajudar',), ('vocês', 4, 'vocesFim')]
for w in W:
    key = w[2] if len(w) > 2 else norm(w[0])
    try:
        marks[key] = find(w[0], w[1] if len(w) > 1 else 0)
    except KeyError:
        print('!! não achei', w)

json.dump(dict(fps=FPS, total=TOTAL, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('original %.1f s → editado %.1f s (%d trechos, %d páginas de legenda)' % (DUR, TOTAL / FPS, len(segs), len(pages)))
print('mudanças de enquadramento:', sum(1 for i in range(1, len(segs)) if segs[i]['z'] != segs[i - 1]['z']))
