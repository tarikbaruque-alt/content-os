# Pergunta sincera: o que falta pra você começar no digital? (Reels 9:16)

Edição em Remotion de um take único. O vídeo tinha 1 min 32 s e ficou com 1 min 18 s, sem acelerar a voz.

## Decupagem (`scripts/montar.py`)
- A fala é dividida em "ilhas", os trechos entre silêncios. Cada ilha tem o texto corrigido e a marcação da legenda.
- Saem 42 pausas, três "é…" (aos 22,4 s, 36,0 s e 79,9 s), um falso começo (53,1 s) e um estalo (75,3 s).
- As pausas viram respiros curtos conforme a pontuação: fim de frase, vírgula ou meio de frase.
- O enquadramento só muda quando o corte tirou bastante coisa, para disfarçar o pulo sem "respirar" a cada frase.
- O tempo de cada palavra vem da transcrição de cada ilha (`scripts/ilhas.json`), com interpolação onde a transcrição errou.

## Legenda
- Até 2 palavras por vez, em Montserrat Bold branca.
- Ênfase em amarelo e caixa alta para o que ele frisa.
- Serifada itálica azul-clara como segunda voz tipográfica.
- Coral para dores e objeções.
- Na abertura e no "O QUE FALTA?", a tipografia grande (Anton) ocupa o lugar da legenda.

## Layout
- **Tela dividida sem linha:** o painel de cima esmaece, com desfoque, sobre o vídeo.
- **Tela cheia** só na escada final.
- **Indicador de etapa (1/5 a 5/5)** no topo dos painéis. Ele organiza a fala num caminho: exposição, autoridade, confiança, clientes e escala.

## Cenas
| Fala | Visual |
|---|---|
| Abertura | Headline no primeiro quadro: "PERGUNTA SINCERA — O QUE FALTA PRA VOCÊ COMEÇAR NO DIGITAL?" |
| "começar uma jornada no digital" | Imagem da loja física para o digital, com a câmera indo de um lado ao outro. |
| "quem não for pro digital o quanto antes está jogando dinheiro fora" | Dois blocos, "fora do digital" e "no digital", com relógio e notas indo embora. |
| "mesmo que você não faça nenhum produto…" | E-book, manual de dicas, curso, mentoria e consultoria entram um a um, com clique. |
| "se expor e conseguir seguidores" | Imagem da criadora com os gráficos e seguidores "+1" (etapa 1/5). |
| "abrir portas, novos caminhos, parcerias, collabs, publicidade" | Cinco caminhos que saem do rosto dele, um por citação. |
| "mostrar o seu trabalho pro mundo" | Imagem da vitrine com aproximação de câmera e o selo "sua vitrine pro mundo". |
| "qualidade… autoridade… visto como um expert" | Cartão de perfil com estrelas, barra de autoridade e carimbo "EXPERT" (etapa 2/5). |
| "conquistar confiabilidade das pessoas" | Medidor que enche enquanto as pessoas "acendem" (etapa 3/5). |
| "captar clientes… cases de sucesso" | Imagem do empreendedor com notificações "Novo cliente", portfólio e case (etapa 4/5). |
| "com o tempo você vai escalando o seu negócio" | "A escada do digital" completa, em tela cheia (etapa 5/5). |
| "a pergunta volta… o que que falta?" | Selo "a pergunta volta" e "O QUE FALTA?" em tipografia grande. |
| As objeções | Lista numerada: não gosto de me expor, falta ideia de conteúdo, falta tempo. Fecha com "comenta 1, 2 ou 3". |
| "Me diga…" | Selo "me diga nos comentários" e seta para o botão de comentar. |

## Som
- **Voz:** redução de ruído (RNNoise), equalização e compressão leves.
- **Cliques:** um clique marcado em tudo o que ele cita e um clique suave em cada troca de cena.
- **Trilha original** sintetizada (`scripts/trilha.py`). Ela cresce da autoridade até a escada e recua quando a pergunta volta.
- **Exportação** com e sem trilha, a -12 LUFS (`scripts/exportar.sh`).

## Arquivos que não vão para o repositório
O take, o áudio tratado e as imagens (`public/takes`, `public/audio`, `public/img`) ficam fora do repositório.
