import type { Dna } from "./types.js";

/**
 * Aliases de campo: a Íris real (LLM) segue as chaves canônicas pedidas no
 * prompt, mas nem sempre com 100% de aderência — este mapa é uma rede de
 * segurança para não cair em texto genérico só porque o modelo usou uma
 * chave próxima (ex.: "dor" em vez de "dores", "main_pain" em inglês).
 */
const ALIASES: Record<string, string[]> = {
  persona: ["primary_persona", "publico", "público", "avatar"],
  dores: ["dor", "main_pain", "pain", "problema", "problemas"],
  desejos: ["desejo", "main_desire", "desire", "resultado_desejado"],
  objecoes: ["objecao", "objection", "objections"],
  frase: ["voc", "voice_of_customer", "citacao"],
  diferenciais: ["diferencial", "differentiator", "differentiators"],
  posicionamento: ["positioning", "autoridade", "prova_autoridade"],
  tom: ["tone", "tom_de_voz", "voice_tone"],
  decisao: ["decisoes", "strategic_decision"],
  aprendizado: ["aprendizados", "learning", "learnings"],
  ticket: ["average_ticket", "preco", "price"],
  oferta: ["offer", "offers", "business_type"],
};

/** Agrupa o Content DNA (saída da Íris) por campo, para as etapas seguintes. */
export function dnaView(dna: Dna) {
  const g = (field: string) => {
    const direct = dna.filter((d) => d.field === field).map((d) => d.value);
    if (direct.length) return direct;
    const aliases = ALIASES[field] ?? [];
    return dna.filter((d) => aliases.includes(d.field)).map((d) => d.value);
  };
  const first = (field: string, fb = "") => g(field)[0] ?? fb;
  return {
    ticket: first("ticket") || first("oferta"),
    oferta: first("oferta") || first("ticket"),
    persona: first("persona"),
    dores: g("dores"),
    desejos: g("desejos"),
    objecoes: g("objecoes"),
    voc: g("frase"),
    diferenciais: g("diferenciais"),
    posicionamento: g("posicionamento"),
    tom: first("tom"),
    decisoes: g("decisao"),
    aprendizados: g("aprendizado"),
  };
}
export type DnaView = ReturnType<typeof dnaView>;
