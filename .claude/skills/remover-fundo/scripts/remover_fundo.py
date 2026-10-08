#!/usr/bin/env python3
"""Remove o fundo de imagens e vídeos.

Modos:
  ia      recorta a pessoa/objeto com IA (rembg), quadro a quadro
  chroma  apaga um fundo de cor sólida (tela verde/azul) com ffmpeg

Saída padrão: vídeo com transparência (.webm VP9 ou .mov ProRes 4444)
ou .png para imagens. Com --fundo, o recorte é colocado sobre uma cor ou
imagem e sai como .mp4 (vídeo) ou .png/.jpg (imagem).
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

IMAGENS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def rodar(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"Falhou: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r.stdout


def info_video(caminho):
    saida = rodar(["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(caminho)])
    streams = json.loads(saida)["streams"]
    video = next(s for s in streams if s["codec_type"] == "video")
    tem_audio = any(s["codec_type"] == "audio" for s in streams)
    return video["r_frame_rate"], int(video["width"]), int(video["height"]), tem_audio


def sessao_ia(modelo):
    try:
        from rembg import new_session
    except ImportError:
        sys.exit('Falta o rembg. Instale com: pip install "rembg[cpu]"')
    return new_session(modelo)


def recortar_imagem(entrada, saida, sessao):
    from PIL import Image
    from rembg import remove
    with Image.open(entrada) as img:
        remove(img.convert("RGB"), session=sessao).save(saida)


def codificar_transparente(origem_args, saida, fps, tem_audio, audio_de=None, filtro=None):
    """Gera .webm (VP9 com alfa) ou .mov (ProRes 4444) a partir de quadros ou de um vídeo."""
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    if fps:
        cmd += ["-framerate", fps]
    cmd += origem_args
    if tem_audio and audio_de:
        cmd += ["-i", str(audio_de), "-map", "0:v", "-map", "1:a"]
    if filtro:
        cmd += ["-vf", filtro]
    if saida.suffix == ".mov":
        cmd += ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le"]
        audio = ["-c:a", "pcm_s16le"]
    else:
        cmd += ["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0", "-crf", "30"]
        audio = ["-c:a", "libopus"]
    if tem_audio:
        cmd += audio + ["-shortest"]
    rodar(cmd + [str(saida)])


def aplicar_fundo(recorte, fundo, saida, video):
    """Coloca o recorte transparente sobre uma cor (#rrggbb / nome) ou um arquivo de imagem."""
    if video:
        fps, w, h, tem_audio = info_video(recorte)
    else:
        from PIL import Image
        with Image.open(recorte) as img:
            w, h = img.size
        fps, tem_audio = "1", False
    fmt = "yuv420p" if video else "rgb24"
    # libvpx-vp9 decodifica o alfa só com o decodificador libvpx
    dec = ["-c:v", "libvpx-vp9"] if video and recorte.suffix == ".webm" else []
    cmd = ["ffmpeg", "-y", "-loglevel", "error", *dec, "-i", str(recorte)]
    if Path(fundo).is_file():
        cmd += ["-loop", "1", "-framerate", fps, "-i", fundo, "-filter_complex",
                f"[1:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}[bg];"
                f"[bg][0:v]overlay=shortest=1:repeatlast=0,format={fmt}[v]"]
    else:
        # o fundo de cor sai do próprio recorte, então fica com os mesmos quadros
        cor = fundo.replace("#", "0x")
        cmd += ["-filter_complex",
                f"[0:v]format=rgba,split[fg][b];[b]drawbox=x=0:y=0:w=iw:h=ih:color={cor}@1:t=fill[bg];"
                f"[bg][fg]overlay=format=auto,format={fmt}[v]"]
    cmd += ["-map", "[v]"]
    if video:
        cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18"]
        if tem_audio:
            cmd += ["-map", "0:a", "-c:a", "aac"]
    else:
        cmd += ["-frames:v", "1"]
    rodar(cmd + [str(saida)])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("entrada", type=Path)
    p.add_argument("-o", "--saida", type=Path, help="arquivo de saída (padrão: <nome>-sem-fundo.webm/.png)")
    p.add_argument("--modo", choices=["ia", "chroma"], default="ia")
    p.add_argument("--modelo", default="u2net_human_seg",
                   help="modelo do rembg: u2net_human_seg (pessoas, padrão), isnet-general-use (objetos), birefnet-portrait (mais preciso, mais lento)")
    p.add_argument("--cor", default="0x00FF00", help="cor do fundo no modo chroma (padrão: verde 0x00FF00)")
    p.add_argument("--tolerancia", type=float, default=0.15, help="modo chroma: quanto da cor apagar (0.01 a 1)")
    p.add_argument("--suavidade", type=float, default=0.08, help="modo chroma: suavidade da borda (0 a 1)")
    p.add_argument("--fundo", help="cor (#101820) ou imagem para colocar atrás do recorte")
    a = p.parse_args()

    entrada = a.entrada.resolve()
    if not entrada.is_file():
        sys.exit(f"Arquivo não encontrado: {entrada}")
    e_imagem = entrada.suffix.lower() in IMAGENS

    if a.saida:
        saida = a.saida.resolve()
    elif a.fundo:
        saida = entrada.with_name(f"{entrada.stem}-novo-fundo{'.png' if e_imagem else '.mp4'}")
    else:
        saida = entrada.with_name(f"{entrada.stem}-sem-fundo{'.png' if e_imagem else '.webm'}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        recorte = tmp / ("recorte.png" if e_imagem else "recorte.webm") if a.fundo else saida

        if e_imagem:
            if a.modo == "chroma":
                rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", str(entrada), "-vf",
                       f"chromakey={a.cor}:{a.tolerancia}:{a.suavidade},format=rgba", "-frames:v", "1", str(recorte)])
            else:
                recortar_imagem(entrada, recorte, sessao_ia(a.modelo))
        else:
            fps, _, _, tem_audio = info_video(entrada)
            if a.modo == "chroma":
                codificar_transparente(["-i", str(entrada)], recorte, None, tem_audio,
                                       filtro=f"chromakey={a.cor}:{a.tolerancia}:{a.suavidade}")
                # áudio já vem do próprio vídeo de entrada
            else:
                quadros, recortados = tmp / "quadros", tmp / "recortados"
                quadros.mkdir()
                recortados.mkdir()
                rodar(["ffmpeg", "-loglevel", "error", "-i", str(entrada), str(quadros / "%06d.png")])
                lista = sorted(quadros.glob("*.png"))
                sessao = sessao_ia(a.modelo)
                for i, q in enumerate(lista, 1):
                    recortar_imagem(q, recortados / q.name, sessao)
                    if i % 25 == 0 or i == len(lista):
                        print(f"  {i}/{len(lista)} quadros", file=sys.stderr)
                codificar_transparente(["-i", str(recortados / "%06d.png")], recorte, fps, tem_audio, audio_de=entrada)

        if a.fundo:
            aplicar_fundo(recorte, a.fundo, saida, not e_imagem)

    print(saida)


if __name__ == "__main__":
    if not shutil.which("ffmpeg"):
        sys.exit("Falta o ffmpeg. Instale com: brew install ffmpeg (Mac) ou apt install ffmpeg (Linux)")
    main()
