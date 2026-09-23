import type { VisualRef } from "../../pipeline/types.js";

/**
 * Direção visual com referências REAIS — nunca inventadas.
 *
 * - Pinterest: não tem API pública simples, então geramos LINKS DE BUSCA reais
 *   (o usuário abre e escolhe) — isso não fabrica resultado nenhum.
 * - Pixabay: tem API pública. Com PIXABAY_API_KEY no ambiente, buscamos imagens
 *   reais (URL + autor). Sem chave, não inventamos — só sugerimos o termo.
 */

export function pinterestSearchUrl(term: string): string {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(term)}`;
}
export function pixabaySearchUrl(term: string): string {
  return `https://pixabay.com/images/search/${encodeURIComponent(term)}/`;
}

/** Provedor de referências visuais. O determinístico nunca chama a rede. */
export interface VisualRefProvider {
  readonly name: string;
  refs(terms: string[]): Promise<VisualRef[]>;
}

/** Determinístico: só monta links de busca (Pinterest) e sugestões (Pixabay). */
export class SearchLinkVisualProvider implements VisualRefProvider {
  readonly name = "search-links";
  async refs(terms: string[]): Promise<VisualRef[]> {
    const out: VisualRef[] = [];
    for (const t of terms) {
      out.push({ fonte: "Pinterest", termo: t, url: pinterestSearchUrl(t), nota: "Abra a busca e selecione referências reais." });
      out.push({ fonte: "Pixabay", termo: t, url: pixabaySearchUrl(t), nota: "Banco gratuito — configure PIXABAY_API_KEY para trazer imagens direto." });
    }
    return out;
  }
}

type PixabayHit = { webformatURL?: string; largeImageURL?: string; pageURL?: string; user?: string; tags?: string };

/** Real: busca imagens no Pixabay (precisa de PIXABAY_API_KEY). */
export class PixabayVisualProvider implements VisualRefProvider {
  readonly name = "pixabay";
  private readonly base: string;
  constructor(private readonly apiKey: string, base = "https://pixabay.com/api/") {
    this.base = base;
  }
  async refs(terms: string[]): Promise<VisualRef[]> {
    const out: VisualRef[] = [];
    for (const t of terms) {
      try {
        const url = `${this.base}?key=${encodeURIComponent(this.apiKey)}&q=${encodeURIComponent(t)}&image_type=photo&safesearch=true&per_page=3&lang=pt`;
        const res = await fetch(url);
        if (!res.ok) {
          out.push({ fonte: "Pinterest", termo: t, url: pinterestSearchUrl(t), nota: `Pixabay indisponível (HTTP ${res.status}); use a busca do Pinterest.` });
          continue;
        }
        const data = (await res.json()) as { hits?: PixabayHit[] };
        const hits = data.hits ?? [];
        if (!hits.length) {
          out.push({ fonte: "Pinterest", termo: t, url: pinterestSearchUrl(t), nota: "Sem resultado no Pixabay; refine na busca do Pinterest." });
          continue;
        }
        for (const h of hits.slice(0, 2)) {
          out.push({
            fonte: "Pixabay",
            termo: t,
            ...(h.largeImageURL || h.webformatURL ? { url: h.largeImageURL || h.webformatURL } : {}),
            nota: `Imagem real do Pixabay${h.user ? ` · por ${h.user}` : ""}${h.pageURL ? ` · ${h.pageURL}` : ""}`,
          });
        }
      } catch {
        out.push({ fonte: "Pinterest", termo: t, url: pinterestSearchUrl(t), nota: "Falha de rede no Pixabay; use a busca do Pinterest." });
      }
    }
    return out;
  }
}

/** Escolhe o provedor pelo ambiente: Pixabay se houver chave, senão só links. */
export function createVisualRefProvider(env: NodeJS.ProcessEnv = process.env): VisualRefProvider {
  const key = env.PIXABAY_API_KEY;
  return key ? new PixabayVisualProvider(key) : new SearchLinkVisualProvider();
}
