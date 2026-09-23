import type { Dna } from "./types.js";

/** Agrupa o Content DNA (saída da Íris) por campo, para as etapas seguintes. */
export function dnaView(dna: Dna) {
  const g = (field: string) => dna.filter((d) => d.field === field).map((d) => d.value);
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
