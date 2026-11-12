# Decupagem + legendas de 2 palavras — "Atrás do Rótulo: Michelin".
# - Tira o silêncio do início/fim de cada take e encurta pausas internas (>= 0,25 s) para ~0,15 s.
# - Take 16 fica de fora (repete o 17). Saem os "Bom," do início dos takes 9 e 22.
# - Take 14 ganha uma pausa cômica entre "De carro." e "Gastando pneu."
# Marcadores:  ~palavra = serifada itálica dourada · *palavra = caixa alta dourada · _palavra = sublinhada
#              !palavra = caixa alta vermelha · ^ = token do Whisper que não aparece · + = junta palavras
import json, wave, sys, numpy as np

FPS = 30
BASE = sys.argv[1]
W = json.load(open(f'{BASE}/raw/words.json'))
VERSAO = sys.argv[3] if len(sys.argv) > 3 else 'completa'
TAKES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23]
CUT = {9: [(0.0, 0.58)], 22: [(0.0, 0.31)]}
if VERSAO == 'curta':
    # versão curta: sem a pergunta do take 4, sem os 30 milhões (11), sem o take 19; o 9 começa em "Em 1926"
    TAKES = [t for t in TAKES if t not in (4, 11, 19)]
    CUT[9] = [(0.0, 2.28)]
PAUSE = {14: [(0.5, 12)]}          # (segundo no take, frames de pausa inseridos)
BREATH = {4: 3, 6: 4, 7: 5, 8: 3, 12: 5, 15: 4, 20: 6, 21: 4}
HIDE = {14}                         # legenda desenhada pela própria cena

SPEC = {
 1: "{ctx} Vocês sabiam ^ ^ | chefs mais | famosos do | mundo | sonham em | ter uma | ~estrela | dada por | uma *fabricante | de *pneus?",
 2: "{ctx} Em *1900, | a+*Michelin | já fabricava | pneus na | ~França.",
 3: "Só tinha | um !probleminha: | existiam | {ctx} menos de | {ctx} *3 *mil | {ctx} carros | no país.",
 4: "A pergunta | que fica | no ar | é: como | vender ~pneus | se quase | *ninguém | dirigia?",
 5: "Então, os | irmãos *Michelin | criaram um | *guia *gratuito | {ctx} com oficinas, | {ctx} mapas, | {ctx} hotéis e | {ctx} restaurantes. | Justamente para | _incentivar as | pessoas a | ~viajar.",
 6: "Só que, | segundo a | própria *Michelin, | um dos | irmãos | encontrou os | exemplares | do guia | sendo usados | para _apoiar | uma ~bancada.",
 7: "Queriam colocar | o mundo | pra ~rodar… | e o | livro virou | {ctx} *calço | {ctx} de *móvel.",
 8: "E aí | que veio | a outra | ~sacada: | nem tudo | que é | *gratuito | tem o | _valor | que merece.",
 9: "^ com o | tempo ganhou | *autoridade. | {ctx} Em *1926, | surgiram as | primeiras | ~estrelas." if VERSAO != 'curta' else "^ ^ ^ ^ ^ ^ | {ctx} Em *1926, | surgiram as | primeiras | ~estrelas.",
 10: "Depois veio | a classificação. | {ctx} Uma ~estrela | {ctx} vale uma | {ctx} *parada, | {ctx} duas valem | {ctx} um *desvio | {ctx} e três, | {ctx} uma viagem | {ctx} ~especial.",
 11: "Segundo a | própria *Michelin, | {ctx} mais de | {ctx} *30 *milhões | {ctx} de exemplares | do guia | já foram | ~vendidos.",
 12: "Percebe a | ~ironia? | A *Michelin | começou ajudando | motoristas | a encontrar | _restaurantes…",
 13: "e terminou ^ | fazendo gente | ~viajar | só pra | conhecê-los. ^",
 14: "De *carro. | Gastando *pneu.",
 15: "E aí | que está | o verdadeiro | *marketing: | criar ~motivos | para consumir | seu produto.",
 17: "Por exemplo, | se você | tem uma | *academia, | em vez | de só | anunciar | !mensalidade, | mostre um | treino de | *30 *minutos | pra quem | tem só | a hora | do ~almoço.",
 18: "Ninguém sonha | com a | !esteira. | Sonha, sim, | com a | calça ~jeans | fechando | sem precisar | deitar | na cama.",
 19: "A técnica | é despertar | o ~desejo | _antes de | tentar vender.",
 20: "A *Michelin | não vendeu | só pneus. | Vendeu ~motivos | {ctx} pra pegar | {ctx} a estrada.",
 21: "Qual *marca | você quer | ver no | próximo episódio | do *Atrás | do *Rótulo? | Comenta aqui!",
 22: "^ Se esse | conteúdo foi | *três ~estrelas, | me segue | pra mais.",
 23: "E se | foi ~uma, | me segue | também… | pelo menos | valeu a | *parada. | E vamos | embora, | vamos pra | *cima!",
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
    speech = (e > -34) & (t >= a0) & (t < b0)
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
            if (j - i) * 0.01 >= 0.25:
                gaps.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    keep, cur = [], max(a0, s0 - 0.05)
    for c0, c1 in CUT.get(n, []):
        if c0 <= cur < c1:
            cur = c1
    for g0, g1 in gaps:
        keep.append((cur, g0 + 0.075))
        cur = g1 - 0.075
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
                e = {'~': 'serif', '*': 'gold', '_': 'under', '!': 'red'}[tok[0]]
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
    'estrela1': find(1, 'estrela'), 'fabricante1': find(1, 'fabricante'), 'pneus1': find(1, 'pneus'),
    'f1900': find(2, '1900'), 'franca2': find(2, 'frança'),
    'probleminha3': find(3, 'probleminha'), 'menos3': find(3, 'menos'), 'carros3': find(3, 'carros'),
    'como4': find(4, 'como'), 'ninguem4': find(4, 'ninguém'),
    'guia5': find(5, 'guia'), 'gratuito5': find(5, 'gratuito'), 'oficinas5': find(5, 'oficinas'), 'mapas5': find(5, 'mapas'),
    'hoteis5': find(5, 'hotéis'), 'restaurantes5': find(5, 'restaurantes'), 'justamente5': find(5, 'justamente'),
    'encontrou6': find(6, 'encontrou'), 'apoiar6': find(6, 'apoiar'), 'bancada6': find(6, 'bancada'),
    'calco7': find(7, 'calço'),
    'sacada8': find(8, 'sacada'), 'gratuito8': find(8, 'gratuito'), 'valor8': find(8, 'valor'),
    'autoridade9': find(9, 'autoridade'), 'f1926': find(9, '1926'), 'estrelas9': find(9, 'estrelas'),
    'uma10': find(10, 'uma'), 'duas10': find(10, 'duas'), 'tres10': find(10, 'três'),
    'f30': find(11, '30'), 'vendidos11': find(11, 'vendidos'),
    'ironia12': find(12, 'ironia'), 'comecou12': find(12, 'começou'), 'restaurantes12': find(12, 'restaurantes'),
    'viajar13': find(13, 'viajar'),
    'carro14': find(14, 'carro'), 'gastando14': find(14, 'gastando'),
    'marketing15': find(15, 'marketing'), 'motivos15': find(15, 'motivos'),
    'academia17': find(17, 'academia'), 'mensalidade17': find(17, 'mensalidade'), 'mostre17': find(17, 'mostre'), 'almoco17': find(17, 'almoço'),
    'esteira18': find(18, 'esteira'), 'calca18': find(18, 'calça'), 'deitar18': find(18, 'deitar'),
    'desejo19': find(19, 'desejo'),
    'vendeu20': find(20, 'vendeu', 1), 'estrada20': find(20, 'estrada'),
    'marca21': find(21, 'marca'), 'comenta21': find(21, 'comenta'),
    'tres22': find(22, 'três'), 'segue22': find(22, 'segue'), 'mais22': find(22, 'mais'),
    'chefes1': find(1, 'chefes'), 'criaram5': find(5, 'criaram'), 'com5': find(5, 'com'), 'viajar5': find(5, 'viajar'),
    'segundo6': find(6, 'segundo'), 'livro7': find(7, 'livro'), 'outra8': find(8, 'outra'), 'merece8': find(8, 'merece'),
    'surgiram9': find(9, 'surgiram'), 'classificacao10': find(10, 'classificação'), 'parada10': find(10, 'parada'),
    'desvio10': find(10, 'desvio'), 'especial10': find(10, 'especial'), 'mais11': find(11, 'mais'), 'exemplares11': find(11, 'exemplares'),
    'motoristas12': find(12, 'motoristas'), 'vez17': find(17, 'vez'), 'treino17': find(17, 'treino'), 'fechando18': find(18, 'fechando'),
    'sonha18b': find(18, 'sonha', 1), 'pegar20': find(20, 'pegar'), 'tambem23': find(23, 'também'), 'cima23': find(23, 'cima'),
    'pneus2': find(2, 'pneus'), 'pneu14': find(14, 'pneu'), 'colocar7': find(7, 'colocar'),
    'existiam3': find(3, 'existiam'), 'pais3': find(3, 'país'), 'conhece13': find(13, 'conhecê'),
    'uma23': find(23, 'uma'), 'parada23': find(23, 'parada'), 'vamos23': find(23, 'vamos'),
}

marks = {k: v for k, v in marks.items() if v is not None}
json.dump(dict(fps=FPS, total=TOTAL_SPEECH, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('fala total: %.1f s em %d trechos, %d páginas de legenda' % (TOTAL_SPEECH / FPS, len(segs), len(pages)))
for n in TAKES:
    ss = [s for s in segs if s['take'] == n]
    print(f"take {n:2d}: {len(ss)} trechos, {sum(s['srcEnd'] - s['src'] for s in ss) / FPS:5.2f} s, começa em {take_from[n]}")
