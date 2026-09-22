import type { Idea, DeviceRec } from "../../pipeline/types.js";
import type { CreativeContext } from "./context.js";
import { lc } from "./context.js";

/**
 * Biblioteca de ELEMENTOS LITERÁRIOS / NARRATIVOS selecionáveis.
 *
 * A IA recomenda os mais adequados conforme persona + Big Message + emoção +
 * objetivo + formato — mas o usuário pode escolher, adicionar, remover ou editar.
 */
export type DeviceDef = { key: string; nome: string; descricao: string };

export const ELEMENTOS: DeviceDef[] = [
  { key: "storytelling", nome: "Storytelling", descricao: "Uma pequena história com começo, tensão e desfecho." },
  { key: "metafora", nome: "Metáfora", descricao: "Explica o abstrato por uma imagem concreta." },
  { key: "analogia", nome: "Analogia", descricao: "Compara com algo familiar para dar clareza." },
  { key: "contraste", nome: "Contraste", descricao: "Coloca dois opostos lado a lado para destacar a diferença." },
  { key: "paradoxo", nome: "Paradoxo", descricao: "Uma verdade que parece contradição e faz pensar." },
  { key: "antitese", nome: "Antítese", descricao: "Opõe ideias na mesma frase (isto, não aquilo)." },
  { key: "repeticao", nome: "Repetição", descricao: "Repete uma estrutura/palavra para fixar." },
  { key: "ritmo", nome: "Ritmo", descricao: "Cadência das frases (curtas/longas) que conduz a leitura." },
  { key: "ironia", nome: "Ironia", descricao: "Diz o contrário do literal para provocar." },
  { key: "suspense", nome: "Suspense", descricao: "Adia a informação para manter o interesse." },
  { key: "tensao", nome: "Tensão", descricao: "Sustenta um problema não resolvido." },
  { key: "conflito", nome: "Conflito", descricao: "Um embate (interno/externo) que move a narrativa." },
  { key: "dialogo", nome: "Diálogo", descricao: "Fala entre personagens dá vida e naturalidade." },
  { key: "pergunta_retorica", nome: "Pergunta retórica", descricao: "Pergunta que engaja sem esperar resposta." },
  { key: "open_loop", nome: "Open loop", descricao: "Abre uma pendência que só fecha depois." },
  { key: "quebra_expectativa", nome: "Quebra de expectativa", descricao: "Frustra o previsível para surpreender." },
  { key: "revelacao", nome: "Revelação", descricao: "Entrega a virada/insight guardado até aqui." },
];

const BY_KEY = new Map(ELEMENTOS.map((d) => [d.key, d]));

// Recomendação por emoção e por formato/superfície.
const BY_EMOTION: Record<string, string[]> = {
  curiosidade: ["open_loop", "pergunta_retorica", "suspense"],
  identificação: ["storytelling", "dialogo", "contraste"],
  confiança: ["analogia", "antitese", "repeticao"],
  segurança: ["contraste", "analogia", "repeticao"],
  inspiração: ["metafora", "antitese", "ritmo"],
  desejo: ["storytelling", "metafora", "quebra_expectativa"],
  pertencimento: ["storytelling", "dialogo", "repeticao"],
  reflexão: ["paradoxo", "pergunta_retorica", "antitese"],
  ambição: ["contraste", "revelacao", "ritmo"],
  antecipação: ["suspense", "open_loop", "quebra_expectativa"],
  proximidade: ["dialogo", "storytelling", "ritmo"],
};
const BY_SURFACE: Record<string, string[]> = {
  Reel: ["open_loop", "quebra_expectativa", "ritmo", "revelacao"],
  Carrossel: ["antitese", "repeticao", "contraste", "storytelling"],
  Stories: ["dialogo", "pergunta_retorica", "suspense", "storytelling"],
};

/**
 * Recomenda 3–4 elementos coerentes com persona + Big Message + emoção +
 * objetivo + formato, cada um com o PORQUÊ.
 */
export function recommendDevices(idea: Idea, ctx: CreativeContext): DeviceRec[] {
  const keys = [
    ...new Set([...(BY_EMOTION[idea.emocao] ?? []), ...(BY_SURFACE[idea.surface] ?? ["storytelling", "contraste"])]),
  ].slice(0, 4);
  const why: Record<string, string> = {
    storytelling: `dá forma humana à Big Message ("${short(ctx.strategy.bigMessage)}") no formato ${idea.surface}.`,
    metafora: `traduz "${lc(ctx.desejo)}" numa imagem concreta, coerente com a emoção "${idea.emocao}".`,
    analogia: `aproxima o tema do repertório da persona, facilitando o entendimento.`,
    contraste: `separa o caminho comum de ${lc(ctx.diferencial)} — reforça a percepção-alvo.`,
    paradoxo: `provoca reflexão sobre "${lc(ctx.dor)}" sem soar panfletário.`,
    antitese: `opõe dor e desejo na mesma frase, adensando a mensagem.`,
    repeticao: `fixa a Big Message pela cadência — bom para ${idea.surface}.`,
    ritmo: `controla a leitura para sustentar a emoção "${idea.emocao}".`,
    ironia: `quebra o tom óbvio e cria identificação com quem já se cansou do clichê.`,
    suspense: `segura a atenção até a virada, ideal para ${idea.surface}.`,
    tensao: `mantém o problema vivo até o payoff, evitando resolução precoce.`,
    conflito: `dá movimento à narrativa a partir de "${lc(ctx.dor)}".`,
    dialogo: `naturaliza a fala e funciona muito bem em Stories.`,
    pergunta_retorica: `engaja a persona e prepara a virada.`,
    open_loop: `abre uma pendência no início que só fecha no fim — retém a audiência.`,
    quebra_expectativa: `frustra o previsível para tornar a mensagem memorável.`,
    revelacao: `entrega o insight guardado, conectando com o objetivo ${lc(idea.funcao)}.`,
  };
  return keys.map((k) => {
    const def = BY_KEY.get(k)!;
    return { key: k, nome: def.nome, porque: why[k] ?? def.descricao };
  });
}

function short(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
