import sys, json, numpy as np, soundfile as sf, sherpa_onnx
wav, modelos = sys.argv[1], sys.argv[2]
a, sr = sf.read(wav, dtype="float32")
rec = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=f"{modelos}/turbo-encoder.int8.onnx", decoder=f"{modelos}/turbo-decoder.int8.onnx",
    tokens=f"{modelos}/turbo-tokens.txt", language="pt", task="transcribe", num_threads=4, enable_token_timestamps=True) if 'enable_token_timestamps' in sherpa_onnx.OfflineRecognizer.from_whisper.__code__.co_varnames else sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=f"{modelos}/turbo-encoder.int8.onnx", decoder=f"{modelos}/turbo-decoder.int8.onnx",
    tokens=f"{modelos}/turbo-tokens.txt", language="pt", task="transcribe", num_threads=4)
# cortes nos pontos mais silenciosos perto de cada 10 s
win = int(0.02*sr); en = np.array([np.sqrt(np.mean(a[i:i+win]**2)) for i in range(0, len(a)-win, win)])
cuts=[0]; alvo=10.0
while cuts[-1]/sr + alvo + 2 < len(a)/sr:
    lo=int((cuts[-1]/sr+alvo-2)/0.02); hi=int((cuts[-1]/sr+alvo+2)/0.02)
    k=lo+int(np.argmin(en[lo:hi])); cuts.append(k*win)
cuts.append(len(a))
out=[]
for s,e in zip(cuts[:-1],cuts[1:]):
    st=rec.create_stream(); st.accept_waveform(sr, a[s:e]); rec.decode_stream(st)
    r=st.result
    out.append({"inicio":s/sr,"fim":e/sr,"texto":r.text,"tokens":list(r.tokens),"ts":list(r.timestamps)})
    print(f"[{s/sr:.2f}-{e/sr:.2f}] {r.text}  (ts:{len(r.timestamps)})", file=sys.stderr)
json.dump(out, open(sys.argv[3],"w"), ensure_ascii=False, indent=1)
