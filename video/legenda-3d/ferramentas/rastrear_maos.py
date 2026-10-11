"""Rastreia as duas mãos quadro a quadro (MediaPipe) e salva o topo e o centro de cada uma."""
import sys, json, cv2, mediapipe as mp
src, saida, ate = sys.argv[1], sys.argv[2], float(sys.argv[3])
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
maos = mp.solutions.hands.Hands(static_image_mode=False, max_num_hands=2, model_complexity=1,
                                min_detection_confidence=0.3, min_tracking_confidence=0.3)
out = []; f = 0
while f / fps <= ate:
    ok, img = cap.read()
    if not ok: break
    h, w = img.shape[:2]
    r = maos.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    lista = []
    for lm in (r.multi_hand_landmarks or []):
        xs = [p.x * w for p in lm.landmark]; ys = [p.y * h for p in lm.landmark]
        lista.append({"cx": round(sum(xs) / 21), "cy": round(sum(ys) / 21), "topo": round(min(ys)),
                      "x0": round(min(xs)), "x1": round(max(xs))})
    lista.sort(key=lambda m: m["cx"])
    out.append(lista); f += 1
json.dump({"fps": fps, "quadros": out}, open(saida, "w"))
for i in range(0, len(out), 6):
    print(f"{i/fps:5.2f}", " | ".join(f"c=({m['cx']},{m['cy']}) topo={m['topo']}" for m in out[i]))
