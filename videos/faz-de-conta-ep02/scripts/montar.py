# Decupagem + legendas de 2 palavras — "Faz de conta que eu sou… assessor de investimentos" (Ep. 02).
# - Tira silêncio do início/fim de cada take e encurta pausas internas (>= 0,25 s) para ~0,12 s.
# - Take 15: corta a sílaba embolada antes de "Conselho".
# Marcadores:  *palavra = impacto (Montserrat ExtraBold)   ~palavra = emoção (serifada itálica)
#              !palavra = tensão (condensada)               #palavra = plot twist (máquina de escrever)
#              ^ = token do Whisper que não aparece (take 7 vira o título do quadro)   + = junta palavras
import json, wave, sys, numpy as np

FPS = 30
BASE = sys.argv[1]
W = json.load(open(f'{BASE}/takes/words.json'))
TAKES = list(range(1, 16))
CUT = {15: [(0.0, 0.21)]}

SPEC = {
 1: "Ele passou | anos juntando | dinheiro, | conseguiu fazer | esse dinheiro | *render… | e mesmo | assim | !perdeu | o apartamento | dos ~sonhos.",
 2: "Como isso | é ~possível?",
 3: "Imagina passar | *CINCO *ANOS | economizando, | abrindo mão | de ~viagens, | de ~restaurantes, | para juntar | *80 *MIL | reais | para dar | entrada no | primeiro ~apartamento.",
 4: "E querendo | ganhar | um pouco | mais, | ele investiu | *TUDO | que ele | tinha | em uma | aplicação | que ele | só poderia | resgatar | o dinheiro | daqui a | !DOIS !ANOS.",
 5: "!TRÊS !MESES | depois | apareceu | o imóvel | ~perfeito. | Ele tinha | o dinheiro… | e só | !NÃO !PODIA | usar.",
 6: "E viu | outra pessoa | realizar | o ~sonho | que era | dele.",
 7: "^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^",
 8: "Antes de | falar em | investimento, | eu faria | *DUAS | perguntas: | qual é | o seu | ~sonho? | E quando | você vai | *PRECISAR | desse dinheiro?",
 9: "Porque ganhar | dinheiro | é ~ótimo. | Agora, ver | a *OPORTUNIDADE | da sua | vida | passar | porque seu | !DINHEIRO | tá !PRESO | aí… | é de | doer, | né?",
 10: "Por isso | que um | bom ~assessor | pode fazer | *DIFERENÇA:",
 11: "ajudar a | investir | nos seus | *PLANOS, | não só | nos seus | rendimentos.",
 12: "Sabe o | que é | mais ~curioso? | Esse assessor | nem !EXISTE. | E eu | não sou | assessor. | Eu sou | #ESTRATEGISTA | de conteúdo.",
 13: "Eu acabei | de transformar | o serviço | *TÉCNICO | em uma | ~história | que desperta | *INTERESSE | e mostra | a importância | do assessor.",
 14: "E para | descobrir | qual *PROFISSÃO | eu vou | virar | no próximo | episódio.",
 15: "Conselho: | deixar cliente | escapar | também não | é um | bom ~investimento. | Vão pra | *CIMA!",
}

def load(n):
    w = wave.open(f'{BASE}/clean/a{n:02d}.wav')
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    return x, w.getframerate()

def keep_ranges(n):
    x, sr = load(n)
    hop = int(0.01 * sr)
    e = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    speech = e > -34
    idx = np.where(speech)[0]
    s0, s1 = idx[0] * 0.01, (idx[-1] + 1) * 0.01
    gaps = []
    i = idx[0]
    while i < idx[-1]:
        if not speech[i]:
            j = i
            while j < len(speech) and not speech[j]:
                j += 1
            if (j - i) * 0.01 >= 0.25:
                gaps.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    keep = []
    cur = max(0, s0 - 0.05)
    for g0, g1 in gaps:
        keep.append((cur, g0 + 0.06))
        cur = g1 - 0.06
    keep.append((cur, min(len(x) / sr, s1 + 0.08)))
    for c0, c1 in CUT.get(n, []):
        out = []
        for a, b in keep:
            if c1 <= a or c0 >= b:
                out.append((a, b))
            else:
                if a < c0: out.append((a, c0))
                if c1 < b: out.append((c1, b))
        keep = out
    return keep, max(s0, CUT.get(n, [(0, 0)])[0][1] if n in CUT else s0)

# respiro dramático extra (em frames) ANTES de certos takes: suspense e viradas
BREATH = {2: 4, 5: 16, 6: 4, 7: 14, 12: 10, 14: 4}

segs, out, onsets = [], 0, {}
for n in TAKES:
    keep, s0 = keep_ranges(n)
    onsets[n] = s0
    out += BREATH.get(n, 0)
    for a, b in keep:
        fa, fb = round(a * FPS), round(b * FPS)
        if fb - fa < 3: continue
        segs.append(dict(take=n, src=fa, srcEnd=fb, from_=out))
        out += fb - fa
TOTAL_SPEECH = out

def map_t(n, t):
    f = t * FPS
    nxt = None
    for s in segs:
        if s['take'] != n: continue
        if s['src'] <= f < s['srcEnd']:
            return s['from_'] + (f - s['src'])
        if f < s['src'] and nxt is None:
            nxt = s['from_']
    if nxt is not None: return nxt
    last = [s for s in segs if s['take'] == n][-1]
    return last['from_'] + (last['srcEnd'] - last['src'])

pages = []
for n in TAKES:
    words = W[str(n)]
    spec_pages = [p.strip().split() for p in SPEC[n].split('|')]
    flat = [t for p in spec_pages for t in p]
    assert len(flat) == len(words), (n, len(flat), len(words), [w[2] for w in words], flat)
    k = 0
    for p in spec_pages:
        toks, t_start = [], None
        for tok in p:
            w = words[k]; k += 1
            ts = max(w[0], onsets[n] - 0.02) if k == 1 else w[0]
            if tok == '^': continue
            if t_start is None: t_start = ts
            e = None
            if tok[0] in '*~!#':
                e = {'*': 'impact', '~': 'serif', '!': 'tension', '#': 'twist'}[tok[0]]
                tok = tok[1:]
            toks.append(dict(t=tok.replace('+', ' '), e=e))
        if not toks: continue
        pages.append(dict(take=n, start=int(round(map_t(n, t_start))), toks=toks))
    if pages and pages[-1]['take'] == n:
        pages[-1]['takeEnd'] = int(round(map_t(n, words[-1][1] + 0.15)))

for i, p in enumerate(pages):
    nxt = pages[i + 1]['start'] if i + 1 < len(pages) else TOTAL_SPEECH
    end = nxt
    if 'takeEnd' in p: end = min(nxt, max(p['takeEnd'], p['start'] + 8))
    p['end'] = max(end, p['start'] + 6)
    p.pop('takeEnd', None)
for i in range(len(pages) - 1):
    if pages[i]['end'] > pages[i + 1]['start']: pages[i]['end'] = pages[i + 1]['start']

take_from = {}
take_end = {}
for s in segs:
    take_from.setdefault(s['take'], s['from_'])
    take_end[s['take']] = s['from_'] + s['srcEnd'] - s['src']

def find(n, word, occ=0):
    c = 0
    for i, w in enumerate(W[str(n)]):
        if w[2].strip('.,?!:').lower() == word.lower():
            if c == occ: return int(round(map_t(n, w[0])))
            c += 1
    raise KeyError((n, word))

marks = {
 'take': take_from, 'takeEnd': take_end,
 'conseguiu1': find(1, 'conseguiu'), 'render1': find(1, 'render'), 'perdeu1': find(1, 'perdeu'), 'sonhos1': find(1, 'sonhos'),
 'anos3': find(3, '5'), 'abrindo3': find(3, 'abrindo'), 'viagens3': find(3, 'viagens'), 'restaurantes3': find(3, 'restaurantes'),
 'oitenta3': find(3, '80'), 'primeiro3': find(3, 'primeiro'),
 'investiu4': find(4, 'investiu'), 'aplicacao4': find(4, 'aplicação'), 'resgatar4': find(4, 'resgatar'), 'dois4': find(4, 'dois'),
 'tres5': find(5, 'três'), 'apareceu5': find(5, 'apareceu'), 'tinha5': find(5, 'tinha'), 'nao5': find(5, 'não'),
 'viu6': find(6, 'viu'), 'outra6': find(6, 'outra'), 'sonho6': find(6, 'sonho'), 'dele6': find(6, 'dele'),
 'faz7': find(7, 'faz'), 'assessor7': find(7, 'assessor'),
 'duas8': find(8, 'duas'), 'qual8': find(8, 'qual'), 'quando8': find(8, 'quando'),
 'ganhar9': find(9, 'ganhar'), 'agora9': find(9, 'agora'), 'oportunidade9': find(9, 'oportunidade'),
 'dinheiro9b': find(9, 'dinheiro', 1), 'preso9': find(9, 'preso'), 'doer9': find(9, 'doer'),
 'bom10': find(10, 'bom'), 'diferenca10': find(10, 'diferença'),
 'investir11': find(11, 'investir'), 'planos11': find(11, 'planos'), 'rendimentos11': find(11, 'rendimentos'),
 'esse12': find(12, 'esse'), 'naosou12': find(12, 'não'), 'estrategista12': find(12, 'estrategista'),
 'transformar13': find(13, 'transformar'), 'tecnico13': find(13, 'técnico'), 'historia13': find(13, 'história'),
 'interesse13': find(13, 'interesse'), 'importancia13': find(13, 'importância'),
 'profissao14': find(14, 'profissão'), 'proximo14': find(14, 'próximo'),
 'deixar15': find(15, 'deixar'), 'vao15': find(15, 'vão'),
}

json.dump(dict(fps=FPS, total=TOTAL_SPEECH, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('fala total: %.1f s em %d trechos, %d páginas de legenda' % (TOTAL_SPEECH / FPS, len(segs), len(pages)))
for n in TAKES:
    ss = [s for s in segs if s['take'] == n]
    print(f"take {n:2d}: {len(ss)} trechos, {sum(s['srcEnd']-s['src'] for s in ss)/FPS:5.2f} s")
