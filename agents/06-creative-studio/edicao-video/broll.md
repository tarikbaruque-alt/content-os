# B-roll — como planejar e aplicar

B-roll = cenas de cobertura sobre a fala para dar ritmo e ilustrar o que está sendo dito.
Regra de ouro: **o áudio nunca corta; a imagem troca a cada 2–4 s.**

## Fluxo (barato em tokens)
1. `scripts/transcrever.py` → `words.json` (local, sem custo de API).
2. O agente lê **só o texto** da transcrição e monta o `plano.json`: momentos em que
   entra B-roll + o que mostrar. Ele não assiste ao vídeo.
3. Você aprova/ajusta o plano (uma lista curta em texto).
4. As cenas são reunidas em `assets/broll/` (ver fontes abaixo).
5. `scripts/aplicar_broll.py` compõe o vídeo; `scripts/legenda_ass.py` gera a legenda; um ffmpeg final queima a legenda.

## Onde encontrar B-roll (do mais barato ao mais caro)
| Fonte | Custo | Observação |
|---|---|---|
| **Seus próprios clipes** (bastidores, produto, cliente) | grátis | Melhor: autêntico e único. Grave 1–2 min extras de cenas soltas por vídeo. |
| **Banco de mídia licenciado do cliente / Artlist stock** | assinatura | Baixe manualmente e coloque em `assets/broll/`. |
| **Pexels / Pixabay** | grátis (licença livre) | Precisa de chave de API gratuita para eu buscar/baixar automaticamente. |
| **Imagens + zoom lento (Ken Burns)** | grátis | Fotos/prints/infográficos viram clipe com `zoom` no plano. |
| **IA (Artlist generate_video/image)** | **créditos** | Conta atual: teste grátis (1 vídeo, 2 imagens). Só compensa com assinatura; use para cenas que não existem em banco. |

## Regras de qualidade
- **Duração:** 2–3 s cada; nunca > 4 s. Entradas em `t` alinhadas ao começo de uma frase/palavra-chave.
- **Nunca cobrir os primeiros 1,5 s** (gancho com rosto) nem o CTA final.
- **Cobrir ≤ 50 %** do vídeo; o rosto precisa voltar.
- **Coerência com a fala:** cada B-roll ilustra a palavra dita. Sem cena "bonita" que não diz nada.
- **Sem fabricar prova:** não usar cena de banco como se fosse "cliente real" / resultado real.
- **Variar** enquadramento (close, plano aberto) e direção do zoom.
- **Formato:** o script já corta para 9:16; prefira clipes verticais ou com sujeito centralizado.
- **Legenda por cima:** a zona da legenda fica livre (60–72 % da altura); evite B-roll com texto embutido nessa faixa.

## Formato do plano (`plano.json`)
```json
[
  {"t": 4.2, "dur": 2.5, "file": "assets/broll/cafe-close.mp4", "zoom": 0.08, "fade": 0.2},
  {"t": 9.0, "dur": 2.0, "file": "assets/broll/grafico.png",    "zoom": 0.10, "fade": 0.2}
]
```
Campos e padrões em `scripts/aplicar_broll.py`. Presets de ritmo em `presets/broll.yaml`.

## Pedido rápido
*"Vídeo X, coloca B-roll onde fizer sentido, ritmo dinâmico, legenda estilo hormozi."*
O agente responde primeiro com o **plano em lista** (tempo → cena → motivo) para você aprovar.
