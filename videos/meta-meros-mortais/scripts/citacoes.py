# Recompõe trechos reais do comunicado (pixels originais, palavra por palavra) em linhas mais curtas,
# para ficarem legíveis no celular. Gera também a página (logo + manchete + data) e o logo colorido.
import json, sys, numpy as np
from PIL import Image
B = sys.argv[1]
IMG = f'{B}/remotion/public/img'
m = json.load(open(f'{B}/remotion/src/data/recortes.json'))
K = 3308 / 1414

def words_of(name, picks):
    src = Image.open(f'{IMG}/{name}.png').convert('RGB')
    im = Image.new('RGB', (src.width + 100, src.height + 100), (255, 255, 255))
    im.paste(src, (50, 50))
    rows = m[name]['rows']
    out = []
    for r, w0, w1 in picks:
        row = rows[r]
        y0, y1 = row['box'][1], row['box'][3]
        txt = row['text'].split()
        for i in range(w0, (w1 if w1 is not None else len(row['words']))):
            x0, x1 = row['words'][i]
            out.append((im.crop((x0 + 48, y0 + 24, x1 + 52, y1 + 76)), txt[i] if i < len(txt) else '?'))
    return out

def reflow(words, maxw, name, space=30, lh=112):
    lines, cur, cw = [], [], 0
    for im, t in words:
        need = im.width + (space if cur else 0)
        if cur and cw + need > maxw:
            lines.append(cur); cur, cw = [], 0
            need = im.width
        cur.append((im, t)); cw += need
    if cur: lines.append(cur)
    hh = max(im.height for im, _ in words)
    W = max(sum(i.width for i, _ in l) + space * (len(l) - 1) for l in lines)
    H = lh * (len(lines) - 1) + hh
    can = Image.new('RGB', (W + 8, H + 8), (255, 255, 255))
    boxes, y = [], 4
    for l in lines:
        x = 4
        for im, t in l:
            can.paste(im, (x, y))
            boxes.append(dict(t=t, x0=x, x1=x + im.width, y0=y + 20, y1=y + im.height - 20))
            x += im.width + space
        y += lh
    can.save(f'{IMG}/{name}.png', optimize=True)
    print(name, can.size, len(lines), 'linhas', ' '.join(b['t'] for b in boxes))
    return dict(w=can.width, h=can.height, words=boxes)

Q = {}
Q['q_sejamos'] = reflow(words_of('art_sejamos', [(0, 0, None), (1, 0, None), (2, 0, 3)]), 1450, 'q_sejamos')
Q['q_sinais'] = reflow(words_of('art_sinais', [(0, 1, None), (1, 0, None), (2, 0, None)]), 1450, 'q_sinais')
Q['q_porisso'] = reflow(words_of('art_porisso', [(2, 10, None), (3, 0, None), (4, 0, None), (5, 0, None)]), 1450, 'q_porisso')

# página: logo + manchete + data (sem o primeiro parágrafo)
p1 = Image.open(f'{B}/pdf/hi-1.png').convert('RGB')
pg = p1.crop((round(60 * K), round(40 * K), round(1360 * K), round(890 * K)))
pg.save(f'{IMG}/art_pagina.png', optimize=True)
a = np.asarray(pg.convert('L')) < 150
rows = a.sum(1) > 2
segs, i = [], 0
while i < len(rows):
    if rows[i]:
        j = i
        while j < len(rows) and rows[j]: j += 1
        cols = np.where(a[i:j].any(0))[0]
        if j - i > 20: segs.append([int(cols[0]), i, int(cols[-1]) + 1, j])
        i = j
    else: i += 1
print('pagina', pg.size, segs)
Q['art_pagina'] = dict(w=pg.width, h=pg.height, rows=segs)
json.dump(Q, open(f'{B}/remotion/src/data/citacoes.json', 'w'), ensure_ascii=False)

# logo colorido (símbolo azul + palavra escura) com fundo transparente
wb = Image.open(f'{IMG}/meta_logo_branco.png')
arr = np.asarray(wb).copy()
sym_w = Image.open(f'{IMG}/meta_simbolo.png').width
arr[:, sym_w:, 0:3] = (28, 43, 51)
Image.fromarray(arr, 'RGBA').save(f'{IMG}/meta_logo_cor.png')
