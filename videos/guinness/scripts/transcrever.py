import sys, glob, re, json, os, subprocess
import numpy as np
def load(f):
    raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768.0
from faster_whisper import WhisperModel
up, out = sys.argv[1], sys.argv[2]
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "small", device="cpu", compute_type="int8")
res = {}
if os.path.exists(out): res = json.load(open(out))
for f in sorted(glob.glob(up + "/*")):
    if not re.search(r"\.(mp4|mov|m4a|ogg|opus|mp3|wav|aac)$", f, re.I): continue
    key = os.path.basename(f)
    if key in res: continue
    segs, info = m.transcribe(load(f), language="pt", word_timestamps=True, vad_filter=False)
    words = []; text = []
    for s in segs:
        text.append(s.text.strip())
        for w in (s.words or []): words.append([round(w.start,2), round(w.end,2), w.word.strip()])
    res[key] = {"text": " ".join(text), "words": words, "duration": info.duration}
    print(key, "->", res[key]["text"], flush=True)
    json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
