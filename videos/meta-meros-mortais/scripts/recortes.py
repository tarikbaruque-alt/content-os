# Recortes do comunicado oficial da Meta (PDF) + logo com transparência + caixas de linha para os grifos.
import json, sys, numpy as np
from PIL import Image, ImageFilter
B = sys.argv[1]  # pasta meta
pdf = f'{B}/pdf'
out = f'{B}/remotion/public/img'
p1 = Image.open(f'{pdf}/hi-1.png').convert('RGB')
p2 = Image.open(f'{pdf}/hi-2.png').convert('RGB')
K = 3308 / 1414  # coordenadas medidas na página exibida (1414 px)

def crop(page, x0, y0, x1, y1):
    return page.crop((round(x0 * K), round(y0 * K), round(x1 * K), round(y1 * K)))

def lines(im, thr=170, gap=6):
    a = np.asarray(im.convert('L')) < thr
    rows = a.sum(1) > 2
    boxes, i = [], 0
    while i < len(rows):
        if rows[i]:
            j = i
            while j < len(rows) and rows[j]:
                j += 1
            cols = np.where(a[i:j].any(0))[0]
            boxes.append([int(cols[0]), i, int(cols[-1]) + 1, j])
            i = j
        else:
            i += 1
    # junta pedaços (acentos, descendentes) da mesma linha
    merged = []
    for b in boxes:
        if merged and b[1] - merged[-1][3] < gap * 3 and (b[3] - b[1] < 40 or merged[-1][3] - merged[-1][1] < 40):
            m = merged[-1]
            merged[-1] = [min(m[0], b[0]), m[1], max(m[2], b[2]), b[3]]
        else:
            merged.append(b)
    return [b for b in merged if b[3] - b[1] > 30]

meta = {}
R = {
    'art_titulo': (p1, 80, 530, 1300, 880),
    'art_engajamento': (p1, 80, 1335, 1330, 1495),
    'art_porisso': (p1, 80, 1525, 1330, 1835),
    'art_sejamos': (p2, 80, 270, 1335, 565),
    'art_sinais': (p2, 135, 1005, 1300, 1140),
}
for name, (pg, *box) in R.items():
    im = crop(pg, *box)
    im.save(f'{out}/{name}.png', optimize=True)
    meta[name] = dict(w=im.width, h=im.height, lines=lines(im))
    print(name, im.size, len(meta[name]['lines']), meta[name]['lines'][:3])

# logo Meta (1600 dpi): símbolo azul transparente + versão com palavra branca + versão original (fundo branco)
lg = Image.open(f'{pdf}/logo-1.png').convert('RGB').filter(ImageFilter.GaussianBlur(1.2))
a = np.asarray(lg).astype(np.float32)
mn = a.min(2)
alpha = np.clip((255 - mn) / (255 - 25), 0, 1)
ys, xs = np.where(alpha > 0.5)
# separa símbolo (azul) e palavra (escura) pelo vão vertical
colmask = (alpha > 0.5).any(0)
xs_on = np.where(colmask)[0]
gaps = np.where(np.diff(xs_on) > 20)[0]
sym_end = xs_on[gaps[0]] + 1
word_start = xs_on[gaps[0] + 1]
big = [g for g in np.where(np.diff(xs_on) > 90)[0] if xs_on[g] > word_start]
word_end = xs_on[big[0]] + 1 if big else xs_on[-1] + 1
y0, y1 = ys.min() - 8, ys.max() + 8
def rgba(x0, x1, white=False):
    al = alpha[y0:y1, x0:x1]
    if white:
        rgb = np.full(al.shape + (3,), 255, np.float32)
    else:
        src = a[y0:y1, x0:x1]
        rgb = np.where(al[..., None] > 0.01, (src - (1 - al[..., None]) * 255) / np.maximum(al[..., None], 0.01), 0)
        rgb = np.clip(rgb, 0, 255)
    return Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
x0 = xs_on[0] - 8
sym = rgba(x0, sym_end + 8)
sym.save(f'{out}/meta_simbolo.png')
full = Image.new('RGBA', (word_end + 8 - x0, y1 - y0))
full.paste(sym, (0, 0))
wd = rgba(word_start - 4, word_end + 8, white=True)
full.alpha_composite(wd, (word_start - 4 - x0, 0))
full.save(f'{out}/meta_logo_branco.png')
print('logo', sym.size, full.size)
json.dump(meta, open(f'{B}/remotion/src/data/recortes.json', 'w'), indent=1)
