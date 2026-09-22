/** Utilitários de texto compartilhados pelas etapas do pipeline. */

/** Limpa frases em 1ª pessoa do briefing para virarem prosa de estratégia. */
export function clean(s: string): string {
  if (!s) return s;
  let t = s.trim().replace(/\.$/, "");
  const strips = [
    /^a maior dor (deles?|delas?) é (o |a )?/i,
    /^a dor (deles?|delas?) é (o |a )?/i,
    /^(eles?|elas?) (desejam|querem|sonham|buscam|almejam)( por)?\s+/i,
    /^(uma? )?obje[çc][ãa]o( comum| frequente)? é (achar que |de |desconfiar que )?/i,
    /^(o )?(meu|nosso) diferencial é (que |um |uma |o |a )?/i,
    /^s[óo] (eles?|elas?|n[óo]s)\s+/i,
    /^meu p[úu]blico s[ãa]o\s+/i,
    /^(decidimos|decidi|resolvi|optamos por|vamos) focar em\s+/i,
    /^no [úu]ltim[oa] (m[êe]s|trimestre|ano)[,]?\s+(os |as )?/i,
    /^(sou|tenho|falo de forma|vendo|vendemos)\s+/i,
  ];
  for (const re of strips) {
    const nt = t.replace(re, "");
    if (nt !== t) {
      t = nt;
      break;
    }
  }
  t = t.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Encurta para títulos/rótulos manterem-se enxutos. */
export function short(s: string, n = 46): string {
  const t = clean(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > 20 ? cut.slice(0, sp) : cut).replace(/[,;:]$/, "");
}
