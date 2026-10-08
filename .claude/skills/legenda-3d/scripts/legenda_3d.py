#!/usr/bin/env python3
"""Vídeo com a pessoa recortada sobre fundo preto e a legenda dela em 3D.

Etapas: 1) remove o fundo (skill remover-fundo), 2) transcreve palavra por
palavra (faster-whisper), 3) renderiza no Remotion (video/legenda-3d).

Exemplos:
  python3 legenda_3d.py fala.mp4
  python3 legenda_3d.py fala.mp4 --fonte "Playfair Display" --cor-destaque "#ff5a36" --posicao esquerda
  python3 legenda_3d.py fala.mp4 --palavras fala-palavras.json      # depois de corrigir a transcrição
  python3 legenda_3d.py fala.mp4 --so-preparar                      # abre no Remotion Studio em vez de renderizar
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
PROJETO = RAIZ / "video" / "legenda-3d"
REMOVER = RAIZ / ".claude" / "skills" / "remover-fundo" / "scripts" / "remover_fundo.py"
FONTES = ["Anton", "Archivo Black", "Bangers", "Bebas Neue", "DM Serif Display", "Montserrat",
          "Oswald", "Playfair Display", "Poppins", "Space Grotesk", "Syne", "Unbounded"]
FORMATOS = {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080), "4:5": (1080, 1350)}


def rodar(cmd, **kw):
    r = subprocess.run(cmd, **kw)
    if r.returncode != 0:
        sys.exit(f"Falhou: {' '.join(map(str, cmd))}")


def info_video(caminho):
    saida = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(caminho)],
                           capture_output=True, text=True, check=True).stdout
    dados = json.loads(saida)
    video = next(s for s in dados["streams"] if s["codec_type"] == "video")
    num, den = map(int, video["r_frame_rate"].split("/"))
    return round(num / den) or 30, float(dados["format"]["duration"])


def transcrever(entrada, modelo, idioma):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Falta o faster-whisper. Instale com: pip install faster-whisper")
    print(f"Transcrevendo com o modelo {modelo} (na primeira vez ele é baixado)...", file=sys.stderr)
    segmentos, _ = WhisperModel(modelo, compute_type="int8").transcribe(
        str(entrada), language=idioma, word_timestamps=True, vad_filter=True)
    palavras = []
    for seg in segmentos:
        for w in seg.words or []:
            texto = w.word.strip()
            if texto:
                palavras.append({"palavra": texto, "inicio": round(w.start, 3), "fim": round(w.end, 3)})
    return palavras


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("entrada", type=Path, help="vídeo original com a pessoa falando")
    p.add_argument("-o", "--saida", type=Path)
    p.add_argument("--palavras", type=Path, help="JSON de palavras já pronto (pula a transcrição)")
    p.add_argument("--recorte", type=Path, help=".webm transparente já pronto (pula a remoção de fundo)")
    p.add_argument("--fonte", default="Anton", choices=FONTES)
    p.add_argument("--rodizio", default="", help='fontes separadas por vírgula, uma por frase: "Anton,Playfair Display"')
    p.add_argument("--trocas", default="[]", help='JSON: [{"aPartirDe": 12, "fonte": "Syne", "corDestaque": "#ff3b3b", "posicao": "direita"}]')
    p.add_argument("--cor-texto", default="#ffffff")
    p.add_argument("--cor-destaque", default="#00A8A3")
    p.add_argument("--cor-fundo", default="#030405")
    p.add_argument("--fundo", default="preto", choices=["preto", "grade3d", "pontos"])
    p.add_argument("--posicao", default="atras", choices=["atras", "esquerda", "direita"])
    p.add_argument("--formato", default="9:16", choices=list(FORMATOS))
    p.add_argument("--palavras-por-frase", type=int, help="padrão: 2 atrás, 3 ao lado")
    p.add_argument("--profundidade", type=float, default=14, help="espessura 3D das letras em px (0 = sem)")
    p.add_argument("--tamanho-pessoa", type=float, help="escala da pessoa (padrão 0.78 atrás, 0.86 ao lado)")
    p.add_argument("--altura-legenda", type=float, help="centro da legenda de 0 (topo) a 1 (base); padrão 0.17 atrás, 0.42 ao lado")
    p.add_argument("--minusculas", action="store_true", help="não converter a legenda para maiúsculas")
    p.add_argument("--destaques", default="", help="palavras sempre na cor de destaque, separadas por vírgula")
    p.add_argument("--modelo-fundo", default="u2net_human_seg")
    p.add_argument("--modelo-whisper", default="small")
    p.add_argument("--idioma", default="pt")
    p.add_argument("--so-preparar", action="store_true", help="prepara tudo e mostra o comando do Remotion Studio")
    a = p.parse_args()

    entrada = a.entrada.resolve()
    if not entrada.is_file():
        sys.exit(f"Arquivo não encontrado: {entrada}")
    slug = re.sub(r"[^a-z0-9]+", "-", entrada.stem.lower()).strip("-") or "video"
    pasta = PROJETO / "public" / slug
    pasta.mkdir(parents=True, exist_ok=True)
    fps, duracao = info_video(entrada)

    # 1. pessoa sem fundo
    recorte = pasta / "pessoa.webm"
    if a.recorte:
        shutil.copy(a.recorte, recorte)
    elif not recorte.exists():
        print("Removendo o fundo...", file=sys.stderr)
        rodar([sys.executable, REMOVER, entrada, "-o", recorte, "--modelo", a.modelo_fundo])

    # 2. palavras
    arquivo_palavras = entrada.with_name(f"{entrada.stem}-palavras.json")
    if a.palavras:
        palavras = json.loads(a.palavras.read_text(encoding="utf-8"))
    elif arquivo_palavras.exists():
        palavras = json.loads(arquivo_palavras.read_text(encoding="utf-8"))
    else:
        palavras = transcrever(entrada, a.modelo_whisper, a.idioma)
        arquivo_palavras.write_text(json.dumps(palavras, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"Transcrição salva em {arquivo_palavras} (corrija ali se alguma palavra sair errada)", file=sys.stderr)

    largura, altura = FORMATOS[a.formato]
    lista = lambda s: [x.strip() for x in s.split(",") if x.strip()]
    props = {
        "video": f"{slug}/pessoa.webm",
        "palavras": palavras,
        "duracaoSegundos": duracao,
        "fps": fps,
        "largura": largura,
        "altura": altura,
        "fonte": a.fonte,
        "corTexto": a.cor_texto,
        "corDestaque": a.cor_destaque,
        "corFundo": a.cor_fundo,
        "fundo": a.fundo,
        "posicao": a.posicao,
        "tamanhoPessoa": a.tamanho_pessoa or (0.78 if a.posicao == "atras" else 0.86),
        "alturaLegenda": a.altura_legenda or (0.17 if a.posicao == "atras" else 0.42),
        "maiusculas": not a.minusculas,
        "palavrasPorFrase": a.palavras_por_frase or (2 if a.posicao == "atras" else 3),
        "profundidade": a.profundidade,
        "destaques": lista(a.destaques),
        "rodizioFontes": lista(a.rodizio),
        "trocas": json.loads(a.trocas),
    }
    for f in props["rodizioFontes"] + [t.get("fonte") for t in props["trocas"] if t.get("fonte")]:
        if f not in FONTES:
            sys.exit(f"Fonte desconhecida: {f}. Opções: {', '.join(FONTES)}")
    arquivo_props = pasta / "props.json"
    arquivo_props.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")

    # 3. render
    if not (PROJETO / "node_modules").exists():
        rodar(["npm", "ci"], cwd=PROJETO)
    if a.so_preparar:
        print(f"Pronto. Para ajustar ao vivo:\n  cd {PROJETO} && npx remotion studio --props={arquivo_props}")
        return
    saida = (a.saida or entrada.with_name(f"{entrada.stem}-legenda3d.mp4")).resolve()
    cmd = ["npx", "remotion", "render", "Legenda3D", str(saida), f"--props={arquivo_props}", "--codec=h264", "--crf=18"]
    navegador = os.environ.get("REMOTION_BROWSER_EXECUTABLE")
    if navegador:
        cmd.append(f"--browser-executable={navegador}")
    rodar(cmd, cwd=PROJETO)
    print(saida)


if __name__ == "__main__":
    main()
