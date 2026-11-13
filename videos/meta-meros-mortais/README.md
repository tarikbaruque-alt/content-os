# A Meta deu esperança aos meros mortais (Reels 9:16)

Edição em Remotion, com cerca de 1 min 31 s. A base é o comunicado oficial da Meta "Número de seguidores não determina o alcance", de 22/10/2026.

## Decupagem (`scripts/montar.py`)
- Foram usados 24 takes, na ordem do roteiro.
- O "12" enviado é uma cópia idêntica do 11, por isso o take 12 da edição é o arquivo "12.1".
- Os takes 6 e 7 foram emendados para não repetir "o importante, na verdade":
  > "O que importa, na verdade, é saber como as pessoas vão reagir ao seu conteúdo: quanto tempo assistem, se curtem, comentam ou compartilham."
- Silêncios e respiros saem. As pausas internas de 0,2 s ou mais viram cerca de 0,14 s, sem acelerar a voz.
- Fica de propósito só a pausa antes de "É… visualizou e não respondeu".
- Os jump cuts são disfarçados com um pequeno ajuste de enquadramento a cada corte.

## Comunicado real na tela (`scripts/recortes.py`, `scripts/citacoes.py`)
Os recortes saem do PDF do comunicado e usam os pixels originais. Para ficarem legíveis no celular, as palavras foram recompostas em linhas mais curtas. Nenhuma frase foi reescrita.
- A página com o logo, a manchete e a data aparece com zoom na manchete e um círculo na data.
- O trecho "Outros sinais… tempo de visualização, as curtidas, os comentários…" aparece grifado.
- O trecho "Por outro lado, muitos seguidores de uma celebridade global podem simplesmente não abrir o Instagram…" aparece grifado.
- O trecho "Sejamos claros: uma conta com menos seguidores pode… alcançar mais pessoas do que uma conta muito maior…" aparece grifado.

A parte política do comunicado ficou de fora.

## Layout
- **Tela dividida sem divisória:** o painel de cima se dissolve, com desfoque, sobre o vídeo.
- **Tela cheia** nos momentos de leitura: a página oficial e o trecho "por outro lado".

## Cenas
| Momento | Visual |
|---|---|
| Gancho | Manchete "A META DEU ESPERANÇA AOS MEROS MORTAIS!" no primeiro quadro; zoom no "mero mortal"; selo "105 seguidores", o número dito por ele. |
| "a Meta acabou de me dar esperança" | A manchete oficial entra suave, com o selo "A META DEU ESPERANÇA". |
| "A Meta publicou o comunicado" | A página oficial, com zoom na manchete e na data. |
| Conta pequena × grande | Comparação conceitual, sem números, e "SEGUIDORES ≠ ALCANCE". |
| A ironia | A foto do perfil do Instagram com zoom no contador. O número cresce, desfoca e "ALCANCE" vem para o primeiro plano. Uma linha mostra até onde o post vai. |
| Como o Instagram entrega | O trecho oficial grifado. Em volta do Reel surgem tempo assistido, curtidas, comentários e compartilhamentos. O alcance se abre em anéis de pessoas. |
| Analogia | A lista de convidados vira a festa, com câmera cinematográfica, e os amigos chegam com chapéu de festa. |
| Os deuses do Instagram | Luz vinda de cima, nuvens, halos e selos de verificado; é uma metáfora, não um dado. |
| "Segundo a Meta" | O trecho oficial em tela cheia, enquanto os seguidores "dormem". |
| Feed | Outros conteúdos passam na frente da celebridade, até o card do "mero mortal". Corte seco com zoom no rosto. |
| Boa notícia / conta pequena | O selo "BOA NOTÍCIA", o trecho "Sejamos claros" e "CONTA PEQUENA NÃO É CONTA FRACA" com expansão sutil. |
| Cada postagem | O Reel é enviado para pessoas diferentes; é uma possibilidade, não uma promessa de viralizar. |
| Conversa com a Meta | O símbolo da Meta no alto. A DM se escreve junto com a fala e aparece "Visto agora", com digitando… e nada. |
| Fechamento | "VISUALIZOU ✓✓" e "NÃO RESPONDEU"; a folha de envio com o amigo desanimado; o botão Seguir vira Seguindo, com "ME SEGUE"; o vídeo fecha em "vamo pra cima!" com corte limpo. |

## Som
- **Trilha original** sintetizada (`scripts/trilha.py`), moderna, curiosa e leve. Ela tem breques:
  - no "repara na ironia";
  - no zoom seco;
  - na pausa do "visualizou", onde quase silencia.
- A trilha entra com ducking sob a voz.
- **Exportação** com e sem trilha, a -12 LUFS (`scripts/exportar.sh`).

## Arquivos que não vão para o repositório
Os takes, os áudios tratados e as imagens (`public/takes`, `public/audio`, `public/img`) ficam fora do repositório.
