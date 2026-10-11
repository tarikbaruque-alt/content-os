"""Converte o rastreio das mãos em âncoras por quadro para as duas palavras da abertura.
Cada palavra segue a ponta do dedo enquanto a mão está levantada e fica parada quando ela desce."""
import json, sys
d = json.load(open(sys.argv[1])); Q = d["quadros"]; fps = d["fps"]
def lado(lista, direita):
    if not lista: return None
    m = max(lista, key=lambda h: h["cx"]) if direita else min(lista, key=lambda h: h["cx"])
    # com duas mãos detectadas, a da direita tem cx maior; com uma só, decide pelo lado da tela
    if len(lista) == 1 and ((m["cx"] > 560) != direita): return None
    return m
def trilha(direita, ini):
    """Segue a ponta do dedo a partir de `ini`; quando a mão desce 60 px do ponto mais alto, congela lá."""
    out, sx, sy, minimo, congelado = [], None, None, None, None
    for i, l in enumerate(Q):
        m = lado(l, direita)
        if congelado is None and m and i / fps >= ini - 0.1:
            x, y = m["cx"], m["topo"]
            sx = x if sx is None else sx + 0.45 * (x - sx); sy = y if sy is None else sy + 0.45 * (y - sy)
            if minimo is None or sy < minimo[1]: minimo = (round(sx), round(sy))
            elif sy > minimo[1] + 25: congelado = (round(sx), round(sy))
        out.append(congelado or ((round(sx), round(sy)) if sx is not None else None))
    prim = next(p for p in out if p)
    return [p or prim for p in out]
json.dump({"fps": fps, "direita": trilha(True, 0.08), "esquerda": trilha(False, 1.84)}, open(sys.argv[2], "w"))
r = json.load(open(sys.argv[2]))
for i in range(0, len(Q), 6): print(f"{i/fps:4.2f} dir {r['direita'][i]} esq {r['esquerda'][i]}")
