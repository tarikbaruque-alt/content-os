import type { Palavra } from "./tipos";

export type Frase = { palavras: Palavra[]; inicio: number; fim: number; indice: number };

// Junta as palavras em frases curtas: quebra numa pausa, numa pontuação
// final ou quando chega ao limite de palavras.
export const montarFrases = (palavras: Palavra[], maximo: number): Frase[] => {
  const frases: Frase[] = [];
  let atual: Palavra[] = [];
  const fechar = () => {
    if (!atual.length) return;
    frases.push({ palavras: atual, inicio: atual[0]!.inicio, fim: atual[atual.length - 1]!.fim, indice: frases.length });
    atual = [];
  };
  palavras.forEach((p, i) => {
    const anterior = palavras[i - 1];
    if (anterior && (p.inicio - anterior.fim > 0.45 || /[.!?…]$/.test(anterior.palavra))) fechar();
    atual.push(p);
    if (atual.length >= maximo || /[.!?…,;:]$/.test(p.palavra) && atual.length >= 2) fechar();
  });
  fechar();
  return frases;
};

export const limparPalavra = (texto: string) => texto.replace(/^[«"“(]+|[»"”),.;:!?…]+$/g, "");
