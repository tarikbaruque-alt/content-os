import sys, json, glob, numpy as np
from PIL import Image
arqs = sorted(glob.glob(sys.argv[1] + "/*.png"))
out = []
for f in arqs:
    a = np.asarray(Image.open(f).getchannel("A").resize((270, 480)))
    linhas = np.where((a > 128).sum(1) > 3)[0]
    if not len(linhas): out.append(None); continue
    topo = int(linhas[0]); cols = np.where((a[topo:topo + 25] > 128).any(0))[0]
    out.append([topo * 4, int(cols[0]) * 4, int(cols[-1]) * 4])
json.dump(out, open(sys.argv[2], "w")); print(len(out))
