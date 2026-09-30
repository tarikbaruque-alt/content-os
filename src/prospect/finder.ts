import type { Operacao } from "./types.js";
import { allNiches, norm } from "./context.js";

const slug = (s: string): string => norm(s).replace(/[^a-z0-9]+/g, "");

export type SearchPlan = {
  nicho: string;
  instagram: string[];
  hashtags: string[];
  googleMaps: string[];
  sinaisDeBomProspect: { criterio: string; ondeOlhar: string }[];
  filtrar: string[];
  aviso: string;
};

/**
 * RADAR DE PROSPECTS — sugestões de BUSCA. O sistema não acessa nem raspa o
 * Instagram: você busca, verifica o perfil e registra o que observou no Raio-X.
 */
export function buildSearchPlan(op: Operacao, nichoKeyOrText: string, cidade?: string): SearchPlan {
  const n = allNiches(op).find((x) => x.key === nichoKeyOrText || norm(x.nome) === norm(nichoKeyOrText));
  const nicho = n?.nome ?? nichoKeyOrText.trim();
  const base = nicho.toLowerCase();
  const c = cidade?.trim();
  const s = slug(nicho);
  const sc = c ? slug(c) : "";
  return {
    nicho,
    instagram: [
      ...(c ? [`${base} ${c}`, `${base} em ${c}`, `melhor ${base} ${c}`] : [base, `melhor ${base}`]),
      `${base} especialista`,
    ],
    hashtags: [`#${s}`, ...(sc ? [`#${s}${sc}`, `#${sc}${s}`, `#${s}em${sc}`] : []), `#${s}brasil`],
    googleMaps: c ? [`${base} em ${c}`, `${base} perto de ${c}`] : [base],
    sinaisDeBomProspect: [
      { criterio: "Tem um bom negócio", ondeOlhar: "Avaliações no Google, tempo de existência, movimento e estrutura visíveis" },
      { criterio: "Tem capacidade de investimento", ondeOlhar: "Mais de uma unidade, equipe, anúncios ativos, ticket do serviço, localização" },
      { criterio: "Depende de imagem, autoridade ou aquisição digital", ondeOlhar: "Serviço que se vende por confiança ou visual (saúde, estética, arquitetura, gastronomia, especialistas)" },
      { criterio: "Subaproveita o Instagram", ondeOlhar: "Perfil parado, sem estratégia visível, bio confusa, pouco Reels ou conteúdo só institucional" },
      { criterio: "Tem dificuldade de produzir conteúdo", ondeOlhar: "Posts irregulares, qualidade variável, ausência de rosto ou de vídeos" },
      { criterio: "Pode se beneficiar de operação recorrente", ondeOlhar: "Negócio que precisa de presença contínua, não de um projeto único" },
    ],
    filtrar: [
      "Priorize perfis com um negócio real por trás (site, endereço, avaliações).",
      "Descarte quem já tem uma operação de conteúdo visivelmente profissional e constante.",
      "Anote ao menos um fato específico por perfil — sem fato, não há abordagem legítima.",
    ],
    aviso: "Sugestões de busca: o sistema não acessa nem raspa o Instagram. Você abre o perfil, confere e registra as observações no Raio-X.",
  };
}

/** Importa uma lista de @handles colados (um por linha, espaço ou vírgula). */
export function parseHandles(text: string): string[] {
  const out = new Set<string>();
  for (const raw of text.split(/[\s,;]+/)) {
    const h = raw.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
    if (/^[A-Za-z0-9._]{1,30}$/.test(h)) out.add(h.toLowerCase());
  }
  return [...out];
}
