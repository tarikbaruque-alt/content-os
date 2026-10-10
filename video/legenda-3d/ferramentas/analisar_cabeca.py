import json, sys
cab = json.load(open(sys.argv[1]))
TOM = [(0,2.94,"W"),(2.94,6.452,"M"),(6.452,7.945,"W2"),(7.945,9.45,"M"),(9.45,17.15,"W"),(17.15,21.55,"W2"),(21.55,27.49,"W"),
       (27.49,30.29,"M"),(30.29,35.366,"W"),(35.366,37.21,"W2"),(37.21,39.5,"M"),(39.5,45.27,"W"),(45.27,46.86,"M"),(46.86,60,"W")]
PL = {"W": (1, 50, 40), "W2": (1.12, 50, 40), "M": (1.42, 49, 22)}
def cam(t, x, y):
    for a, b, p in TOM:
        if a <= t < b:
            e, ox, oy = PL[p]; s = e * (1 + 0.03 * (t - a) / (b - a)); ox *= 10.8; oy *= 19.2
            return ox + (x - ox) * s, oy + (y - oy) * s
GRAF = {"abertura": (0.08, 2.94), "naomuda": (9.48, 11.62), "oquemuda": (12.36, 13.74), "consumirmais": (19.19, 21.54),
        "checklist": (23.7, 27.47), "deficit": (32.47, 34.5), "consumirgastar": (34.55, 37.2), "preservar": (43.0, 45.25), "cta": (46.86, 49.0)}
for nome, (a, b) in GRAF.items():
    tops, xs0, xs1 = [], [], []
    for f in range(int(a * 30), int(b * 30) + 1):
        if f >= len(cab) or cab[f] is None: continue
        y, x0, x1 = cab[f]; t = f / 30
        _, yy = cam(t, (x0 + x1) / 2, y); x0o, _ = cam(t, x0, y); x1o, _ = cam(t, x1, y)
        tops.append(yy); xs0.append(x0o); xs1.append(x1o)
    if tops: print(f"{nome:15s} topo min {min(tops):5.0f} max {max(tops):5.0f}  cabeça x {min(xs0):4.0f}-{max(xs1):4.0f}  (n={len(tops)})")
    else: print(nome, "sem dados ainda")
