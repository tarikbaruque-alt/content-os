---
name: legenda-3d
description: Monta vídeo de influenciador com a pessoa recortada sobre fundo preto e a fala dela em legenda dinâmica 3D, palavra por palavra, atrás da pessoa (por cima da cabeça) ou ao lado. A tipografia, as cores, o fundo (preto, grade 3D ou pontos) e a posição podem mudar por vídeo, por trecho ou a cada frase. Renderiza no Remotion (video/legenda-3d). Use quando pedirem legenda atrás da pessoa, legenda 3D, fundo preto com legenda, texto atrás do influenciador, legenda animada palavra por palavra, ou trocar a fonte da legenda de um vídeo falado.
---

# Legenda 3D atrás da pessoa

O script `scripts/legenda_3d.py` faz o processo todo:

1. remove o fundo com a skill `remover-fundo`;
2. transcreve palavra por palavra com faster-whisper;
3. renderiza no projeto Remotion `video/legenda-3d`.

O resultado sai como `<vídeo>-legenda3d.mp4`, ao lado do original.

## Preparar (uma vez por máquina)

```bash
which ffmpeg node
pip install "rembg[cpu]" faster-whisper
cd video/legenda-3d && npm ci
```

Na primeira vez, o rembg baixa o modelo de recorte (~170 MB), o whisper baixa
o modelo `small` (~460 MB) e o Remotion baixa o navegador que usa para
renderizar.

## Fluxo

1. Conferir o pedido: o vídeo, o formato (9:16 é o padrão), a posição da
   legenda e a tipografia. Pergunte só o que faltar. Sem pedido, use o padrão.
2. Rodar `python3 .claude/skills/legenda-3d/scripts/legenda_3d.py <video>`
   com as opções do pedido.
3. **Ler a transcrição** em `<video>-palavras.json`. Corrigir nome próprio,
   marca e número que o whisper errar, sem mexer nos tempos, e rodar de novo
   (o arquivo corrigido é reaproveitado sozinho). O recorte também é
   reaproveitado: fica em `video/legenda-3d/public/<nome>/pessoa.webm`.
4. **Conferir** com uma folha de quadros antes de entregar:
   ```bash
   for t in 1 3 6 10; do ffmpeg -loglevel error -y -ss $t -i saida.mp4 -frames:v 1 -vf scale=300:-1 /tmp/q$t.png; done
   ffmpeg -loglevel error -y -i /tmp/q1.png -i /tmp/q3.png -i /tmp/q6.png -i /tmp/q10.png -filter_complex hstack=4 /tmp/folha.png
   ```
   Olhe se a legenda aparece (e não some toda atrás da cabeça), se nada sai
   pela borda e se a palavra entra junto com a fala.
5. Entregar o vídeo e dizer a fonte, a cor e a posição usadas, para a pessoa
   pedir a troca.

## Opções

| Opção | Padrão | O que faz |
|---|---|---|
| `--posicao` | `atras` | `atras` (por cima da cabeça), `esquerda` ou `direita` (a pessoa vai para o outro lado) |
| `--fonte` | `Anton` | Anton, Archivo Black, Bangers, Bebas Neue, DM Serif Display, Montserrat, Oswald, Playfair Display, Poppins, Space Grotesk, Syne, Unbounded |
| `--rodizio "Anton,Playfair Display"` | | cada frase usa a próxima fonte da lista |
| `--trocas '[{"aPartirDe": 12, "fonte": "Syne"}]'` | | muda fonte, `corDestaque` ou `posicao` a partir de um segundo do vídeo |
| `--cor-destaque` | `#00A8A3` | cor da palavra sendo falada, dos números e dos `--destaques` |
| `--cor-texto` / `--cor-fundo` | `#ffffff` / `#030405` | |
| `--fundo` | `preto` | `preto`, `grade3d` (chão em perspectiva andando) ou `pontos` |
| `--destaques "vendas,grátis"` | | palavras sempre na cor de destaque |
| `--formato` | `9:16` | `16:9`, `1:1`, `4:5` |
| `--palavras-por-frase` | 2 atrás, 3 ao lado | |
| `--profundidade` | `14` | espessura 3D da letra, em px (0 = chapada) |
| `--tamanho-pessoa` / `--altura-legenda` | 0,78 / 0,17 atrás | se a legenda sumir atrás da cabeça, diminua a pessoa ou suba a legenda |
| `--minusculas` | | mantém maiúsculas e minúsculas como faladas |
| `--so-preparar` | | prepara tudo e mostra o comando do Remotion Studio, onde fonte, cores e posição mudam ao vivo no painel da direita |

Para incluir uma fonte nova, acrescente-a em `video/legenda-3d/src/fontes.ts`
e na lista `FONTES` do script.

## Regras de animação

Estas regras vêm da skill de animação de vídeos do canal (yt-ddiasmatt-animation)
e já estão no código:

- **Sincronia por palavra:** cada palavra entra no instante em que é falada,
  nunca antes. A cor de destaque acompanha a palavra que está sendo dita.
- **Curva de intensidade:** a entrada é forte (mais profundidade, desfoque e
  balanço de câmera) até 30 s, desce até 2:30 e fica calma depois.
- **Margens:** o texto fica a 80 px ou mais do topo e a 100 px ou mais das
  laterais.
- **Fundo limpo:** o brilho fica só na letra. Nada de mancha de luz, vinheta ou
  degradê no fundo.
- **Número falado** entra na cor de destaque, como foi falado.
- **Voz intacta:** o áudio sai do vídeo original, sem alteração.

## Ambiente sem acesso aos modelos

Se o Hugging Face estiver bloqueado, o whisper não baixa o modelo. Nesse caso,
escreva o `<video>-palavras.json` à mão, no formato
`[{"palavra": "Hoje", "inicio": 0.3, "fim": 0.6}, ...]`, ou peça a
transcrição com os tempos à pessoa.

Se o Chromium não carregar as fontes por causa de um proxy com certificado
próprio, rode o render direto com `--ignore-certificate-errors`:

```bash
cd video/legenda-3d && npx remotion render Legenda3D saida.mp4 --props=public/<nome>/props.json --ignore-certificate-errors
```

Use `REMOTION_BROWSER_EXECUTABLE=/caminho/do/chrome` quando o Remotion não
puder baixar o próprio navegador.
