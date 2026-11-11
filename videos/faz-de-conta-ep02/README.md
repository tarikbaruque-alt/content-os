# Faz de conta que eu sou… assessor de investimentos (Ep. 02)

Reels 9:16 de ~70 s feito em [Remotion](https://www.remotion.dev).

O roteiro conta a história fictícia de alguém que junta 80 mil em 5 anos, deixa o dinheiro numa aplicação com resgate em 2 anos e perde o apartamento dos sonhos. Depois o criador vira "assessor de faz de conta" e explica objetivo, prazo e liquidez. No plot twist, revela que é estrategista de conteúdo.

## Edição

- **Decupagem** (`scripts/montar.py`):
  - encurta pausas e respiros;
  - deixa pausas dramáticas antes do "Como isso é possível?", do "3 meses depois", do arrependimento, do "faz de conta" e do plot twist.
- **Voz:** RNNoise + EQ + compressão, com o mesmo volume em todos os takes. Saída final em −12 LUFS.
- **Legendas de até 2 palavras**, com a tipografia ligada à intenção:
  - Montserrat no texto corrente;
  - ExtraBold maior nas palavras de impacto;
  - Playfair itálica nas palavras emocionais;
  - Anton condensada na tensão;
  - Special Elite (máquina de escrever) no plot twist.
- **Cenas e motion design** (`src/components/Motion.tsx`):
  - gancho "rende × perde", com a bolha do sonho, o gráfico e o selo "VENDIDO";
  - 5 anos de renúncias, com linha do tempo e contador até R$ 80.000;
  - "dinheiro preso" atrás do vidro, com calendário de 2 anos e cadeado;
  - "3 meses depois";
  - imóvel perfeito × dinheiro bloqueado;
  - arrependimento, com aproximação lenta e lembranças em camadas;
  - título do quadro (identidade reutilizável);
  - modo assessor;
  - as duas perguntas;
  - objetivo, prazo e liquidez;
  - bastidores em tela dividida (GANCHO → HISTÓRIA → EMOÇÃO → VALOR → ESTRATÉGIA);
  - CTA e cartão final.
- **Sem trilha.** Efeitos sintetizados: whoosh, impacto grave, carimbo, relógio, cadeado, riser, brilho e "tape stop".

Takes, áudio tratado e imagens (geradas por IA pelo criador) não ficam no Git.
