import sys, json, numpy as np, soundfile as sf, sherpa_onnx
wav, m, saida = sys.argv[1], sys.argv[2], sys.argv[3]
a, sr = sf.read(wav, dtype="float32")
rec = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=f"{m}/encoder.int8.onnx", decoder=f"{m}/decoder.int8.onnx", joiner=f"{m}/joiner.int8.onnx",
    tokens=f"{m}/tokens.txt", model_type="nemo_transducer", num_threads=4)
segs = json.load(open(sys.argv[4]))
palavras = []
for sg in segs:
    s, e = int(sg["inicio"]*sr), int(sg["fim"]*sr)
    st = rec.create_stream(); st.accept_waveform(sr, a[s:e]); rec.decode_stream(st)
    r = st.result
    print(f"[{sg['inicio']:.2f}] {r.text}", file=sys.stderr)
    # junta tokens SentencePiece (▁ = início de palavra) em palavras com tempo de início
    atual = None
    for tok, t in zip(r.tokens, r.timestamps):
        t = t + sg["inicio"]
        if tok.startswith("▁") or tok.startswith(" ") or atual is None:
            if atual: palavras.append(atual)
            atual = {"palavra": tok.lstrip("▁ "), "inicio": round(t, 3), "ultimo": t}
        else:
            atual["palavra"] += tok; atual["ultimo"] = t
    if atual: palavras.append(atual)
json.dump(palavras, open(saida, "w"), ensure_ascii=False, indent=0)
