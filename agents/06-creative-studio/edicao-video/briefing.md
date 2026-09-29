# Briefing de edição (1 bloco por vídeo)

> Preencha só o que for diferente do preset. Campos vazios = usar padrão.

```yaml
arquivo: entrada/nome-do-video.mp4
cliente:
preset: reels-9x16          # ver presets/
estilo_legenda: padrao      # ver presets/legendas.yaml
duracao_alvo: 30s           # máx.
cortes:                     # o que remover/manter
  - remover silêncios: sim
  - remover trecho: "00:12-00:15"
gancho_inicial:             # texto na tela nos 3 primeiros segundos
cta_final:                  # texto/áudio no final
musica: nenhuma             # arquivo de assets/musicas/ ou nenhuma
volume_musica: 12%
logo: sim                   # posição no preset marca
referencia: referencias/x   # estilo a imitar (opcional)
observacoes:
```

## Pedido rápido (sem preencher nada)
Basta dizer, por exemplo: *"Pega entrada/video1.mp4, preset Reels, legenda
amarela, corta silêncios, 30s, sem música."*
