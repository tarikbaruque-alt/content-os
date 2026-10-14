import sys, numpy as np, soundfile as sf, sherpa_onnx
wav, m = sys.argv[1], sys.argv[2]
a, sr = sf.read(wav, dtype="float32")
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{m}/turbo-encoder.int8.onnx", decoder=f"{m}/turbo-decoder.int8.onnx",
    tokens=f"{m}/turbo-tokens.txt", language="pt", task="transcribe", num_threads=4)
for par in sys.argv[3:]:
    s, e = map(float, par.split(":"))
    st = rec.create_stream(); st.accept_waveform(sr, a[int(s*sr):int(e*sr)]); rec.decode_stream(st)
    print(f"[{s}-{e}] {st.result.text}")
