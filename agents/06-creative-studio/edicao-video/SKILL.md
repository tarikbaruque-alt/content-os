# EDIÇÃO DE VÍDEO

> Competência do **Creative Studio** para editar vídeos conforme o desejo do
> estrategista, com **o mínimo de tokens**: tudo o que é padrão fica gravado
> aqui e nos `presets/`; a cada vídeo só se informa o que muda.

## 1. Como funciona (fluxo)

1. Você coloca o(s) vídeo(s) bruto(s) em `entrada/`.
2. Você preenche (ou fala) o `briefing.md` — 1 bloco por vídeo. Só o que difere do preset.
3. O agente lê **apenas**: este SKILL, o preset escolhido e o briefing. Não relê o resto.
4. O agente monta o comando com as `receitas-ffmpeg.md` e gera o resultado em `saida/`.
5. Você revisa. Ajustes = uma frase ("legenda maior", "corta os 2s iniciais").

## 2. Regras para economizar tokens

- **Nunca "assistir" o vídeo inteiro.** Usar `ffprobe` (metadados) e, se preciso,
  1 frame a cada N segundos em baixa resolução. Transcrever só se o briefing pedir legenda/corte por fala.
- **Ler só o preset escolhido**, não a pasta toda.
- **Comandos ffmpeg prontos** de `receitas-ffmpeg.md`; não reinventar.
- **Lote:** vários vídeos com o mesmo preset = 1 script em loop, não 1 conversa por vídeo.
- **Saídas do ffmpeg** sempre com `-loglevel error -hide_banner`; nunca colar log inteiro.
- **Testar em prévia curta** (`-t 5`, resolução baixa) antes de renderizar tudo.
- Ajustes pequenos: alterar o valor no preset/briefing e rerrodar, sem reescrever o comando.

## 2b. Recursos prontos (testados)

| Tarefa | Comando |
|---|---|
| Transcrever com tempo por palavra | `python3 scripts/transcrever.py entrada/x.mp4 --out words.json` |
| Legenda animada bonita | `python3 scripts/legenda_ass.py words.json --estilo hormozi --out legenda.ass` |
| Inserir B-roll | `python3 scripts/aplicar_broll.py entrada/x.mp4 plano.json saida/y.mp4` |
| Queimar a legenda | `ffmpeg -i y.mp4 -vf "ass=legenda.ass:fontsdir=assets/fontes" -c:a copy z.mp4` |

Estilos de legenda: `hormozi` (impacto), `clean` (elegante), `caixa` (destaque em caixa),
`neon`, `cinema` — em `presets/legendas.yaml`. Corrigir um nome errado = editar `words.json` e rerrodar
(não retranscreve). Guia de B-roll em [`broll.md`](./broll.md).

## 3. Regras inegociáveis

1. **Nunca sobrescrever** o arquivo original: sempre gravar em `saida/` com o nome `AAAA-MM-DD_cliente_tema_vN.mp4`.
2. **Não inventar conteúdo**: legendas fiéis à fala; sem depoimentos, números ou provas que não estejam no vídeo/briefing.
3. Respeitar a **marca** (`presets/marca.yaml`): cores, fonte, logo, tom.
4. Música só de `assets/musicas/` (licenciada) — nunca baixar faixa avulsa.
5. Se faltar informação decisiva (duração, formato, CTA), **perguntar uma vez**, objetivamente.

## 4. Presets

| Preset | Uso |
|---|---|
| `presets/reels-9x16.yaml` | Reels/Shorts/TikTok: 1080×1920, legenda, ritmo |
| `presets/legendas.yaml` | Estilos de legenda animada (fonte, cor, posição, pulo) |
| `presets/broll.yaml` | Ritmo de B-roll (duração, cobertura, zoom, fade) |
| `presets/marca.yaml` | Identidade do cliente (cores, fonte, logo, música) |

Novo formato (feed 4:5, YouTube 16:9, Stories) = copiar um preset e ajustar.

## 5. Onde entra o que você me passa

| Pasta | O que colocar |
|---|---|
| `entrada/` | Vídeos brutos |
| `referencias/` | Vídeos/prints de estilo que você quer imitar + `notas.md` explicando o que gostou |
| `assets/fontes/` | Fontes (.ttf/.otf) |
| `assets/logos/` | Logo (PNG transparente) |
| `assets/musicas/` | Trilhas licenciadas |
| `assets/overlays/` | Barras, setas, transições, molduras |
| `assets/broll/` | Clipes/imagens de cobertura (ver `broll.md`) |
| `saida/` | Resultado (gerado pelo agente) |

## 6. Ambiente

Requer `ffmpeg`/`ffprobe`. Se não estiver instalado: `apt-get install -y ffmpeg`.
Scripts: `pip install pyyaml faster-whisper` (transcrição local, sem custo de API; o 1º uso baixa o modelo).
Fontes: os estilos usam Montserrat/Poppins; coloque os `.ttf` em `assets/fontes/` (sem eles cai numa fonte padrão).
Vídeos grandes **não vão no git** (ver `.gitignore` desta pasta); passe por upload na sessão ou Drive.
