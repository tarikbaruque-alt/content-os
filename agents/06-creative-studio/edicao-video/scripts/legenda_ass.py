#!/usr/bin/env python3
"""Gera legenda ASS animada (palavra ativa em destaque) a partir de words.json.

Uso: legenda_ass.py words.json --estilo hormozi [--out legenda.ass] [--res 1080x1920]
       [--palavras N]          quantas palavras aparecem por vez (1 = uma palavra grande por vez)
       [--entrada fade|slide|nenhuma]   efeito quando cada bloco de palavras aparece
       [--bounce | --sem-bounce]        "quique" da palavra ativa
Queimar: ffmpeg -i IN -vf "ass=legenda.ass[:fontsdir=assets/fontes]" OUT
Edição de texto (corrigir nomes): edite words.json e rode de novo — não precisa retranscrever.
"""
import argparse, json, os, yaml

HERE = os.path.dirname(os.path.abspath(__file__))

def ass_color(hexstr, default_alpha=0):
    """#RRGGBB[AA] -> &HAABBGGRR (ASS: alpha 00 = opaco)."""
    h = hexstr.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    a = 255 - int(h[6:8], 16) if len(h) == 8 else default_alpha
    return f"&H{a:02X}{b}{g}{r}".upper().replace("&H", "&H")

def ts(t):
    h, m = int(t // 3600), int(t % 3600 // 60)
    return f"{h}:{m:02d}:{t % 60:05.2f}"

def grupos(words, n, gap=0.6):
    g, cur = [], []
    for w in words:
        if cur and (len(cur) >= n or w["s"] - cur[-1]["e"] > gap or cur[-1]["w"][-1:] in ".!?"):
            g.append(cur); cur = []
        cur.append(w)
    if cur: g.append(cur)
    return g

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("words")
    ap.add_argument("--estilo", default="hormozi")
    ap.add_argument("--out", default="legenda.ass")
    ap.add_argument("--res", default="1080x1920")
    ap.add_argument("--palavras", type=int)
    ap.add_argument("--entrada", choices=["fade", "slide", "nenhuma"])
    ap.add_argument("--bounce", dest="bounce", action="store_true", default=None)
    ap.add_argument("--sem-bounce", dest="bounce", action="store_false")
    ap.add_argument("--presets", default=os.path.join(HERE, "..", "presets", "legendas.yaml"))
    a = ap.parse_args()

    st = yaml.safe_load(open(a.presets))[a.estilo]
    if a.palavras: st["palavras_por_linha"] = a.palavras
    if a.entrada: st["entrada"] = a.entrada
    if a.bounce is not None: st["bounce"] = a.bounce
    W, H = map(int, a.res.split("x"))
    words = json.load(open(a.words))
    cor, ativa = ass_color(st["cor"]), ass_color(st["ativa"])
    border = 1
    outline = st["contorno_px"]
    back = ass_color("#000000B0")
    if st.get("ativa_fundo"):
        pass  # fundo por palavra via \bord+\3c na palavra ativa (abaixo)
    margin_v = int(H * (1 - st["pos_y_pct"] / 100))

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: L,{st['fonte']},{st['tamanho']},{cor},{cor},{ass_color(st['contorno'])},{back},{-1 if st['negrito'] else 0},0,0,0,100,100,1,0,{border},{outline},{st['sombra_px']},2,60,60,{margin_v},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    ev = []
    for grp in grupos(words, st["palavras_por_linha"]):
        for i, w in enumerate(grp):
            start = w["s"]
            nxt = words[words.index(w) + 1]["s"] if words.index(w) + 1 < len(words) else 1e9
            end = grp[i + 1]["s"] if i + 1 < len(grp) else min(w["e"] + 0.15, nxt)
            parts = []
            for j, x in enumerate(grp):
                t = x["w"].upper() if st["caixa_alta"] else x["w"]
                if j == i:
                    pop = st["pop"]
                    tag = f"{{\\c{ativa}"
                    if st.get("ativa_fundo"):
                        tag += f"\\bord14\\3c{ass_color(st['ativa_fundo'])}"
                    if pop != 100 and st.get("bounce"):
                        # sobe além do tamanho e assenta: sensação de "quique"
                        tag += (f"\\fscx{pop + 10}\\fscy{pop + 10}\\t(0,70,\\fscx{pop - 6}\\fscy{pop - 6})"
                                f"\\t(70,140,\\fscx100\\fscy100)")
                    elif pop != 100:
                        tag += f"\\fscx{pop}\\fscy{pop}\\t(0,90,\\fscx100\\fscy100)"
                    parts.append(f"{tag}}}{t}{{\\r}}")
                else:
                    parts.append(t)
            pre = ""
            if i == 0:  # efeito de entrada só quando o bloco aparece
                ent = st.get("entrada", "nenhuma")
                y = int(H * st["pos_y_pct"] / 100)
                if ent == "fade":
                    pre = "{\\fad(120,0)}"
                elif ent == "slide":
                    pre = f"{{\\move({W // 2},{y + 50},{W // 2},{y},0,140)\\fad(100,0)}}"
            ev.append(f"Dialogue: 0,{ts(start)},{ts(end)},L,,0,0,0,,{pre}{' '.join(parts)}")
    open(a.out, "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")
    print(f"{len(ev)} eventos, estilo '{a.estilo}' -> {a.out}")

if __name__ == "__main__":
    main()
