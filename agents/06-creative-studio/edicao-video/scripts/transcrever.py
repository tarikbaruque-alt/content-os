#!/usr/bin/env python3
"""Transcreve com timestamps por palavra (local, faster-whisper) -> words.json.

Uso: transcrever.py VIDEO [--out words.json] [--modelo small] [--lingua pt]
Saída: [{"w": "palavra", "s": 0.12, "e": 0.48}, ...]
Modelos: tiny/base (rápido) < small (bom p/ pt-BR) < medium/large-v3 (melhor, lento).
"""
import argparse, json
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--out", default="words.json")
ap.add_argument("--modelo", default="small")
ap.add_argument("--lingua", default="pt")
a = ap.parse_args()

model = WhisperModel(a.modelo, device="cpu", compute_type="int8")
segs, _ = model.transcribe(a.video, language=a.lingua, word_timestamps=True, vad_filter=True)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)}
         for s in segs for w in s.words if w.word.strip()]
json.dump(words, open(a.out, "w"), ensure_ascii=False, indent=1)
print(f"{len(words)} palavras -> {a.out}")
