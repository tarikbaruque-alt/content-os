# Decupagem + legendas de 2 palavras — "A Meta deu esperança aos meros mortais".
# Tira silêncio do início/fim de cada take e encurta pausas internas (>= 0,20 s) para ~0,14 s.
# Marcadores: *palavra = azul Meta · ~palavra = serifada itálica · _palavra = sublinhada · !palavra = rosa (problema)
#             ^ = token não exibido · + = junta palavras · {ctx} = página desenhada pela cena
# Take 12 = arquivo "12.1" (o "12" enviado é cópia idêntica do 11).
import json, wave, sys, numpy as np

FPS = 30
BASE = sys.argv[1]
W = json.load(open(f'{BASE}/raw/words_seg.json'))
TAKES = list(range(1, 25))
CUT = {7: [(0.0, 1.27), (5.12, 99.0)]}          # 6+7 emendados: "...reagir ao seu conteúdo: quanto tempo assistem... compartilham."
LEAD = {21: 0.16}                                # pausa cômica antes do "É... visualizou e não respondeu"
PAUSE = {}
BREATH = {4: 3, 10: 3, 14: 4, 18: 4, 22: 3, 23: 2, 24: 2}
HIDE = set()

SPEC = {
 1: "Eu+sou um | *MERO *MORTAL | com *105 | seguidores | e a | *META acabou | de me | dar ~esperança.",
 2: "A *META | publicou o | ~comunicado | dizendo | com todas | as *letras:",
 3: "Uma conta | com *poucos | seguidores | pode ~alcançar | *mais *pessoas | que uma | conta | muito *MAIOR.",
 4: "Repara na | ~ironia.",
 5: "A mesma | empresa que | coloca o | *número de | *seguidores | como ~destaque | no seu | perfil, | acabou de | dizer que | *NÃO é | ele que | ~determina | até onde | seu post | vai.",
 6: "O que | ~importa, | na verdade, | é saber | como as | pessoas vão | *reagir | ao seu | conteúdo:",
 7: "^ ^ ^ ^ ^ ^ | {ctx} quanto tempo | {ctx} assistem, | {ctx} se curtem, | {ctx} comentam | {ctx} ou compartilham. | ^ ^ ^",
 8: "Quanto mais | *interesse | seu conteúdo | desperta, | maior pode | ser seu | *ALCANCE.",
 9: "Fazendo uma | ~analogia: | *seguidor é | o número | de *convidados. | *Alcance é | quem pode | aparecer | na *festa | e ainda | trazer | alguns ~amigos.",
 10: "E os | ~deuses | do *Instagram, | com *milhões | de seguidores?",
 11: "Segundo+a | *META, | muitos desses | seguidores | podem *nem | *abrir o | aplicativo | quando o | post for | publicado.",
 12: "E quem | *abre | pode acabar | assistindo | conteúdo | de *outro | primeiro.",
 13: "~Inclusive | um conteúdo | de um | *MERO *MORTAL.",
 14: "Então, | se a | sua conta | é *pequena, | eu tenho | uma | *boa *notícia.",
 15: "Você *não | precisa ter | *10 *mil | seguidores | pra começar | a ser | ~descoberto.",
 16: "Leva isso | na sua | *mente: | {ctx} conta pequena | {ctx} não é | {ctx} considerada | {ctx} conta fraca.",
 17: "Cada | *postagem | é uma | nova | ~oportunidade | de conquistar | a *atenção | de alguém.",
 18: "Ô, | *META, | vem cá, | conversa | aqui comigo.",
 19: "Já que | você tá | dando | ~esperança | pros *meros | *mortais, | olha com | ~carinho | pra minha | conta também, | faz esse | favor.",
 20: "*Prometo | continuar | te alimentando | de conteúdo | ~interessante.",
 21: "É… | {ctx} visualizou | {ctx} e | {ctx} não respondeu.",
 22: "Então, | não vai | ter ~jeito, | eu vou | ter que | contar com | *VOCÊS.",
 23: "*Manda esse | vídeo | pra aquele | *amigo | que tá | ~desanimado | com o | número de | seguidores.",
 24: "{ctx} Me segue, | porque a | ~promessa | que eu | fiz pra | *META, | eu também | fiz pra | *você. | Vambora, | vamo pra | *CIMA!",
}


def load(n):
    w = wave.open(f'{BASE}/remotion/public/audio/a{n:02d}.wav')
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    return x, w.getframerate()


def keep_ranges(n):
    x, sr = load(n)
    ws = W[f'{n:02d}']
    a0 = LEAD.get(n, max(0.0, ws[0][0] - 0.35))
    b0 = min(len(x) / sr, ws[-1][1] + 0.5)
    hop = int(0.01 * sr)
    e = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    t = np.arange(len(e)) * 0.01
    speech = (e > -32) & (t >= a0) & (t < b0)
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
            if (j - i) * 0.01 >= 0.20 and not (n in LEAD and i * 0.01 < LEAD[n] + 0.9):
                gaps.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    keep, cur = [], (a0 if n in LEAD else max(a0, s0 - 0.05))
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


M = [
 ('mero1', 1, 'mero'), ('n105', 1, '105'), ('seguidores1', 1, 'seguidores'), ('meta1', 1, 'meta'), ('esperanca1', 1, 'esperança'),
 ('publicou2', 2, 'publicou'), ('comunicado2', 2, 'comunicado'), ('todas2', 2, 'todas'),
 ('poucos3', 3, 'poucos'), ('alcancar3', 3, 'alcançar'), ('mais3', 3, 'mais'), ('que3', 3, 'que'), ('muito3', 3, 'muito'), ('maior3', 3, 'maior'),
 ('ironia4', 4, 'ironia'),
 ('coloca5', 5, 'coloca'), ('numero5', 5, 'número'), ('destaque5', 5, 'destaque'), ('perfil5', 5, 'perfil'), ('acabou5', 5, 'acabou'), ('nao5', 5, 'não'),
 ('determina5', 5, 'determina'), ('ate5', 5, 'até'), ('post5', 5, 'post'),
 ('saber6', 6, 'saber'), ('pessoas6', 6, 'pessoas'), ('reagir6', 6, 'reagir'),
 ('tempo7', 7, 'tempo'), ('curtem7', 7, 'curtem'), ('comentam7', 7, 'comentam'), ('compartilham7', 7, 'compartilham'),
 ('interesse8', 8, 'interesse'), ('desperta8', 8, 'desperta'), ('maior8', 8, 'maior'), ('alcance8', 8, 'alcance'),
 ('seguidor9', 9, 'seguidor'), ('convidados9', 9, 'convidados'), ('alcance9', 9, 'alcance'), ('aparecer9', 9, 'aparecer'), ('festa9', 9, 'festa'),
 ('trazer9', 9, 'trazer'), ('amigos9', 9, 'amigos'),
 ('deuses10', 10, 'deuses'), ('instagram10', 10, 'instagram'), ('milhoes10', 10, 'milhões'),
 ('meta11', 11, 'meta'), ('muitos11', 11, 'muitos'), ('nem11', 11, 'nem'), ('abrir11', 11, 'abrir'), ('quando11', 11, 'quando'), ('publicado11', 11, 'publicado'),
 ('abre12', 12, 'abre'), ('assistindo12', 12, 'assistindo'), ('outro12', 12, 'outro'), ('primeiro12', 12, 'primeiro'),
 ('um13', 13, 'um'), ('mero13', 13, 'mero'),
 ('conta14', 14, 'conta'), ('pequena14', 14, 'pequena'), ('eu14', 14, 'eu'), ('boa14', 14, 'boa'),
 ('precisa15', 15, 'precisa'), ('n10_15', 15, '10'), ('comecar15', 15, 'começar'), ('descoberto15', 15, 'descoberto'),
 ('mente16', 16, 'mente'), ('conta16', 16, 'conta'), ('nao16', 16, 'não'), ('considerada16', 16, 'considerada'), ('conta16b', 16, 'conta', 1), ('fraca16', 16, 'fraca'),
 ('cada17', 17, 'cada'), ('postagem17', 17, 'postagem'), ('oportunidade17', 17, 'oportunidade'), ('conquistar17', 17, 'conquistar'), ('atencao17', 17, 'atenção'), ('alguem17', 17, 'alguém'),
 ('meta18', 18, 'meta'), ('vem18', 18, 'vem'), ('conversa18', 18, 'conversa'),
 ('esperanca19', 19, 'esperança'), ('meros19', 19, 'meros'), ('olhe19', 19, 'olhe'), ('carinho19', 19, 'carinho'), ('minha19', 19, 'minha'), ('faz19', 19, 'faz'),
 ('prometo20', 20, 'prometo'), ('alimentando20', 20, 'alimentando'), ('interessante20', 20, 'interessante'),
 ('e21', 21, 'é'), ('visualizou21', 21, 'visualizou'), ('nao21', 21, 'não'), ('respondeu21', 21, 'respondeu'),
 ('contar22', 22, 'contar'), ('voces22', 22, 'vocês'),
 ('manda23', 23, 'manda'), ('video23', 23, 'vídeo'), ('amigo23', 23, 'amigo'), ('desanimado23', 23, 'desanimado'), ('seguidores23', 23, 'seguidores'),
 ('segue24', 24, 'segue'), ('promessa24', 24, 'promessa'), ('meta24', 24, 'meta'), ('voce24', 24, 'você'), ('vambora24', 24, 'vambora'), ('vamo24', 24, 'vamo'), ('cima24', 24, 'cima'),
]
marks = {'take': take_from, 'takeEnd': take_end}
for name, n, word, *occ in M:
    marks[name] = find(n, word, occ[0] if occ else 0)
marks = {k: v for k, v in marks.items() if v is not None}
json.dump(dict(fps=FPS, total=TOTAL_SPEECH, segs=segs, pages=pages, marks=marks), open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('fala total: %.1f s em %d trechos, %d páginas de legenda' % (TOTAL_SPEECH / FPS, len(segs), len(pages)))
for n in TAKES:
    ss = [s for s in segs if s['take'] == n]
    print(f"take {n:2d}: {len(ss)} trechos, {sum(s['srcEnd'] - s['src'] for s in ss) / FPS:5.2f} s, começa em {take_from[n]} ({take_from[n]/FPS:.1f}s)")
