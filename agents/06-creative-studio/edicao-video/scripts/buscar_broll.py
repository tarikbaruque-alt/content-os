#!/usr/bin/env python3
"""Busca e baixa B-roll de Pexels e/ou Pixabay (licenças livres p/ uso comercial).

Uso: buscar_broll.py "café close" [--tipo video|imagem] [--fonte pexels|pixabay|ambas] [--n 3]
         [--dur-min 3] [--dur-max 15] [--saida assets/broll] [--somente-listar]
Chaves (gratuitas) em variáveis de ambiente: PEXELS_API_KEY, PIXABAY_API_KEY.
Registra origem/autor de cada arquivo em assets/broll/creditos.json.
Nunca usa o B-roll baixado como "prova real" (depoimento, resultado, cliente).
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request

UA = {"User-Agent": "content-os-broll/1.0"}

def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def pexels(q, n, key):
    d = get_json("https://api.pexels.com/videos/search?" + urllib.parse.urlencode(
        {"query": q, "orientation": "portrait", "size": "medium", "per_page": n * 3}),
        {"Authorization": key})
    for v in d.get("videos", []):
        files = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
        # prefere vertical perto de 1080 de largura, sem passar de 1440
        files.sort(key=lambda f: (f["width"] > f["height"], abs(f["width"] - 1080)))
        if files:
            yield {"fonte": "pexels", "id": v["id"], "dur": v["duration"], "url": files[0]["link"],
                   "w": files[0]["width"], "h": files[0]["height"],
                   "autor": v["user"]["name"], "pagina": v["url"]}

def pixabay(q, n, key):
    d = get_json("https://pixabay.com/api/videos/?" + urllib.parse.urlencode(
        {"key": key, "q": q, "per_page": max(n * 3, 3), "safesearch": "true"}))
    for v in d.get("hits", []):
        f = v["videos"].get("large") or v["videos"].get("medium")
        if f and f.get("url"):
            yield {"fonte": "pixabay", "id": v["id"], "dur": v["duration"], "url": f["url"],
                   "w": f["width"], "h": f["height"], "autor": v["user"], "pagina": v["pageURL"]}

def pexels_img(q, n, key):
    d = get_json("https://api.pexels.com/v1/search?" + urllib.parse.urlencode(
        {"query": q, "orientation": "portrait", "per_page": n * 2}), {"Authorization": key})
    for p in d.get("photos", []):
        yield {"fonte": "pexels", "id": p["id"], "dur": 0, "url": p["src"].get("large2x") or p["src"]["original"],
               "w": p["width"], "h": p["height"], "autor": p["photographer"], "pagina": p["url"], "ext": "jpg"}

def pixabay_img(q, n, key):
    d = get_json("https://pixabay.com/api/?" + urllib.parse.urlencode(
        {"key": key, "q": q, "image_type": "photo", "orientation": "vertical",
         "per_page": max(n * 2, 3), "safesearch": "true"}))
    for h in d.get("hits", []):
        yield {"fonte": "pixabay", "id": h["id"], "dur": 0, "url": h["largeImageURL"],
               "w": h["imageWidth"], "h": h["imageHeight"], "autor": h["user"], "pagina": h["pageURL"], "ext": "jpg"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("consulta")
    ap.add_argument("--tipo", default="video", choices=["video", "imagem"])
    ap.add_argument("--fonte", default="ambas", choices=["pexels", "pixabay", "ambas"])
    ap.add_argument("--n", type=int, default=3)
    ap.add_argument("--dur-min", type=float, default=3)
    ap.add_argument("--dur-max", type=float, default=15)
    ap.add_argument("--saida", default="assets/broll")
    ap.add_argument("--somente-listar", action="store_true")
    a = ap.parse_args()

    achados = []
    img = a.tipo == "imagem"
    fontes = (("pexels", pexels_img if img else pexels, "PEXELS_API_KEY"),
              ("pixabay", pixabay_img if img else pixabay, "PIXABAY_API_KEY"))
    for nome, fn, env in fontes:
        if a.fonte not in (nome, "ambas"):
            continue
        key = os.environ.get(env)
        if not key:
            print(f"[aviso] {env} não definida; pulando {nome}", file=sys.stderr)
            continue
        achados += [c for c in fn(a.consulta, a.n, key) if img or a.dur_min <= c["dur"] <= a.dur_max][:a.n]

    if not achados:
        sys.exit("Nenhum resultado (verifique chaves, rede e a consulta).")
    os.makedirs(a.saida, exist_ok=True)
    reg_path = os.path.join(a.saida, "creditos.json")
    reg = json.load(open(reg_path)) if os.path.exists(reg_path) else []
    slug = re.sub(r"[^a-z0-9]+", "-", a.consulta.lower()).strip("-")[:30]
    for c in achados:
        arq = os.path.join(a.saida, f"{slug}_{c['fonte']}_{c['id']}.{c.get('ext', 'mp4')}")
        print(f"{c['fonte']:8} {c['dur']:>4}s {c['w']}x{c['h']}  {c['autor']}  {c['pagina']}")
        if a.somente_listar:
            continue
        if not os.path.exists(arq):
            req = urllib.request.Request(c["url"], headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r, open(arq, "wb") as f:
                f.write(r.read())
        reg.append({**{k: c[k] for k in ("fonte", "id", "autor", "pagina", "dur")}, "arquivo": arq, "consulta": a.consulta})
        print("  ->", arq)
    if not a.somente_listar:
        json.dump(reg, open(reg_path, "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
