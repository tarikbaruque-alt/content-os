"""Normaliza o áudio final para -14 LUFS / -1.5 dBTP (duas passadas), sem recodificar o vídeo."""
import json, re, subprocess, sys
ent, sai = sys.argv[1], sys.argv[2]
alvo = "I=-14:TP=-1.5:LRA=11"
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", ent, "-af", f"loudnorm={alvo}:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r, re.S).group(0))
af = (f"loudnorm={alvo}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", ent, "-c:v", "copy", "-af", af, "-ar", "48000",
                "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", sai], check=True)
r2 = subprocess.run(["ffmpeg", "-hide_banner", "-i", sai, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("\n".join(l for l in r2.splitlines()[-12:] if re.search(r"I:|Peak:|LRA:", l)))
