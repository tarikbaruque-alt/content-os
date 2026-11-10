# Decupagem automática + legendas de 2 palavras para a análise "McDonald's × F1 (The Golden Zone)".
# - Remove o silêncio do início/fim de cada take e encurta pausas internas (>= 0,25 s) para ~0,14 s.
# - Cortes manuais: take 1 sem "apenas"; take 19 sem "mais de" (as fontes dizem 7%, não "mais de 7%").
# - Take 12 ("E foi daí que veio a grande sacada") fica de fora: repete o take 11.
# Marcadores nas legendas:  ~palavra = serifada itálica dourada · *palavra = caixa alta dourada · _palavra = sublinhada
#                           ^ = token do Whisper que não aparece na legenda · | = troca de página
import json, wave, sys, numpy as np

FPS = 30
BASE = sys.argv[1]
W = json.load(open(f'{BASE}/takes/words.json'))
TAKES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21]
CUT = {1: [(1.833, 2.200)], 19: [(2.89, 3.56)]}

SPEC = {
 1: "O McDonald's | viu o | ~dinheiro | onde ^ todo | mundo via | _curvas de | Fórmula 1.",
 2: "E olha | que sacada | é ~genial!",
 3: "O McDonald's | já patrocinava | Fórmula 1 | na América Latina.",
 4: "Mas em | vez de | simplesmente | colocar mais | uma ~logo | na pista, | decidiu procurar | por uma | *oportunidade | que ninguém | estava _enxergando.",
 5: "A equipe | criativa de | marketing do | McDonald's | analisou os | *24 circuitos | da temporada | e descobriu | algo ~curioso.",
 6: "Algumas _curvas | lembravam os | famosos | ~arcos ~dourados | do McDonald's.",
 7: "Sabe por | que isso | acontece? | O nosso | cérebro adora | reconhecer | *padrões.",
 8: "Sabe quando | você olha | para uma | ~nuvem | e reconhece | um ~rosto?",
 9: "Isso tem | nome, e | se chama | *pareidolia.",
 10: "E o | McDonald's | transformou essa | percepção | em _estratégia | de marketing.",
 11: "Mas olha só: | encontrar o | *M nas | curvas foi | a parte | mais ~fácil | da estratégia | de marketing | realizada pelo | McDonald's. | O que, | de fato, | foi uma | sacada genial | foi transformar | aquelas _curvas | em *vendas.",
 13: "Quando o | líder da | corrida | entrava na | chamada | *Golden *Zone, | era liberada | uma _oferta | no aplicativo | do McDonald's.",
 14: "Mas tem | um detalhe | ~importante: | a oferta | durava *apenas | o tempo | que o | carro levava | para atravessar | aquele _trecho.",
 15: "Passou | da curva, | *perdeu. | Na próxima | volta, | uma nova | ~chance.",
 16: "E percebe | o que | eles fizeram? | O McDonald's | transformou o | ~espectador | em *participante.",
 17: "Agora a | pessoa precisava | acompanhar | a corrida, | abrir o | aplicativo | e agir | *rápido.",
 18: "Essa estratégia | gerava no | participante: ^ | *atenção, | *urgência | e *recompensa.",
 19: "E a | estratégia | deu ~certo. | Segundo a | agência, | cresceram ^ ^ | *7% ^ em | vendas | e houve | uma adesão | de *2,3 ^ | milhões de | usuários ativos | durante as | corridas | e *2,7 ^ | milhões de | downloads | no aplicativo | durante o | mês.",
 20: "E sabe | qual é | a ~lição? | Marketing | não é | só *aparecer. | Marketing é | encontrar | oportunidades | onde ninguém | está enxergando | e transformar | *atenção | em *ação.",
 21: "Se a | sua marca | está deixando | o ~dinheiro | na pista, | me chama+no | _direct. | Só não | passa ~reto, ^ | pelo amor | de Deus. | E vão | pra cima!",
}
# Página com "^" junto (ex.: "cresceram ^ ^") consome os tokens do Whisper sem mostrar ("mais de" cortado).
# "+" junta duas palavras num token só (o Whisper ouviu "chamando" em vez de "chama no").

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
    # silêncios internos
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
    cur = max(0, s0 - 0.06)
    for g0, g1 in gaps:
        keep.append((cur, g0 + 0.07))
        cur = g1 - 0.07
    keep.append((cur, min(len(x) / sr, s1 + 0.09)))
    for c0, c1 in CUT.get(n, []):
        out = []
        for a, b in keep:
            if c1 <= a or c0 >= b:
                out.append((a, b))
            else:
                if a < c0: out.append((a, c0))
                if c1 < b: out.append((c1, b))
        keep = out
    return keep, s0

segs = []  # take, srcFrom, srcTo (frames 30fps), outFrom
out = 0
onsets = {}
for n in TAKES:
    keep, s0 = keep_ranges(n)
    onsets[n] = s0
    for a, b in keep:
        fa, fb = round(a * FPS), round(b * FPS)
        if fb - fa < 3: continue
        segs.append(dict(take=n, src=fa, srcEnd=fb, from_=out))
        out += fb - fa
TOTAL_SPEECH = out

def map_t(n, t):
    f = t * FPS
    best = None
    for s in segs:
        if s['take'] != n: continue
        if s['src'] <= f < s['srcEnd']:
            return s['from_'] + (f - s['src'])
        if f < s['src'] and best is None:
            best = s['from_']
    if best is not None: return best
    last = [s for s in segs if s['take'] == n][-1]
    return last['from_'] + (last['srcEnd'] - last['src'])

pages = []
for n in TAKES:
    words = W[str(n)]
    spec_pages = [p.strip().split() for p in SPEC[n].split('|')]
    flat = [t for p in spec_pages for t in p]
    # "onde ^ todo": o ^ consome "apenas" (cortado)
    assert len(flat) == len(words), (n, len(flat), len(words), [w[2] for w in words], flat)
    k = 0
    for p in spec_pages:
        toks = []
        t_start = None
        for tok in p:
            w = words[k]; k += 1
            ts = max(w[0], onsets[n] - 0.02) if k == 1 else w[0]
            if tok == '^':
                continue
            if t_start is None: t_start = ts
            emph = None
            if tok[0] == '~': emph, tok = 'serif', tok[1:]
            elif tok[0] == '*': emph, tok = 'gold', tok[1:]
            elif tok[0] == '_': emph, tok = 'under', tok[1:]
            toks.append(dict(t=tok.replace('+', ' '), e=emph))
        if not toks: continue
        pages.append(dict(take=n, start=int(round(map_t(n, t_start))), toks=toks))
    # fim da última página do take
    pages[-1]['takeEnd'] = int(round(map_t(n, words[-1][1] + 0.15)))

# fim de cada página = início da próxima (ou fim do take + pausa curta)
for i, p in enumerate(pages):
    nxt = pages[i + 1]['start'] if i + 1 < len(pages) else TOTAL_SPEECH
    end = nxt
    if 'takeEnd' in p:
        end = min(nxt, max(p['takeEnd'], p['start'] + 8))
    p['end'] = max(end, p['start'] + 6)
    p.pop('takeEnd', None)
# evita sobreposição
for i in range(len(pages) - 1):
    if pages[i]['end'] > pages[i + 1]['start']:
        pages[i]['end'] = pages[i + 1]['start']

# início de cada take na edição (para sincronizar grafismos)
take_from = {}
for s in segs:
    take_from.setdefault(s['take'], s['from_'])

# instantes de palavras-chave (frame na edição) para os grafismos
def at(n, i):
    return int(round(map_t(n, W[str(n)][i][0])))
def find(n, word, occ=0):
    c = 0
    for i, w in enumerate(W[str(n)]):
        if w[2].strip('.,?!:').lower() == word.lower():
            if c == occ: return at(n, i)
            c += 1
    raise KeyError((n, word))

marks = {
 'take': take_from,
 'onde1': find(1, 'onde'), 'logo': find(4, 'logo'), 'oportunidade': find(4, 'oportunidade'),
 'circuitos24': find(5, '24'), 'curioso': find(5, 'curioso'),
 'arcos': find(6, 'arcos'),
 'nuvem': find(8, 'nuvem'), 'rosto': find(8, 'rosto'),
 'pareidolia': find(9, 'pareidolia'),
 'transformou10': find(10, 'transformou'),
 'otQue11': find(11, 'O', 1), 'transformar11': find(11, 'transformar'), 'vendas11': find(11, 'vendas'),
 'golden13': find(13, 'Golden'), 'oferta13': find(13, 'oferta'), 'aplicativo13': find(13, 'aplicativo'),
 'oferta14': find(14, 'oferta'), 'carro14': find(14, 'carro'), 'trecho14': find(14, 'trigo'),
 'perdeu15': find(15, 'perdeu'), 'proxima15': find(15, 'próxima'), 'chance15': find(15, 'chance'),
 'espectador16': find(16, 'espectador'), 'participante16': find(16, '-participante'),
 'acompanhar17': find(17, 'acompanhar'), 'abrir17': find(17, 'abrir'), 'agir17': find(17, 'agir'),
 'atencao18': find(18, 'atenção'), 'urgencia18': find(18, 'urgência'), 'recompensa18': find(18, 'recompensa'),
 'certo19': find(19, 'certo'), 'p7': find(19, '7'), 'p23': find(19, '2', 0), 'p27': find(19, '2', 1),
 'marketing20': find(20, 'Marketing'), 'marketingE20': find(20, 'marketing', 1), 'atencao20': find(20, 'atenção'), 'acao20': find(20, 'ação'),
 'direct21': find(21, 'direct'), 'reto21': find(21, 'reto'),
}

json.dump(dict(fps=FPS, total=TOTAL_SPEECH, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('fala total: %.1f s em %d trechos, %d páginas de legenda' % (TOTAL_SPEECH / FPS, len(segs), len(pages)))
for n in TAKES:
    ss = [s for s in segs if s['take'] == n]
    print(f"take {n:2d}: {len(ss)} trechos, {sum(s['srcEnd']-s['src'] for s in ss)/FPS:5.2f} s (bruto {len(load(n)[0])/48000:5.2f} s)")
