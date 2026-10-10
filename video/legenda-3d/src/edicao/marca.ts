// Identidade visual da edição: verde para hipertrofia, laranja para emagrecimento.
export const COR = {
  verde: "#12B76A",
  verdeEscuro: "#0B6B3F",
  laranja: "#F04E23",
  laranjaEscuro: "#8C2A10",
  preto: "#0E0E10",
  branco: "#FFFFFF",
  amarelo: "#FFD60A",
};

// Enquadramentos: W = plano aberto, W2 = aberto um pouco mais fechado, M = plano médio (rosto e tronco).
export type Plano = "W" | "W2" | "M";
export const PLANOS: Record<Plano, { escala: number; origemX: number; origemY: number }> = {
  W: { escala: 1, origemX: 50, origemY: 40 },
  W2: { escala: 1.12, origemX: 50, origemY: 40 },
  M: { escala: 1.42, origemX: 49, origemY: 22 },
};
