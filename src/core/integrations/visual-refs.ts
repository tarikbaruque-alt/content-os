import type { VisualRef } from "../../pipeline/types.js";

/**
 * Direção visual com referências REAIS — nunca inventadas.
 *
 * - Pinterest: não tem API pública simples, então geramos LINKS DE BUSCA reais
 *   (o usuário abre e escolhe) — isso não fabrica resultado nenhum.
 * - Pixabay: tem API pública. Com PIXABAY_API_KEY no ambiente, buscamos imagens
 *   reais (URL + autor). Sem chave, não inventamos — só sugerimos o termo.
 * - Pexels: com PEXELS_API_KEY, traz foto e vídeo (b-roll) reais, com autor e link.
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

type PexelsPhoto = { url?: string; photographer?: string; src?: { large?: string; original?: string } };
type PexelsVideo = { url?: string; user?: { name?: string }; video_files?: { link?: string; width?: number; file_type?: string }[] };

/** Real: busca foto e vídeo no Pexels (precisa de PEXELS_API_KEY). Só api.pexels.com recebe a chave. */
export class PexelsVisualProvider implements VisualRefProvider {
  readonly name = "pexels";
  constructor(private readonly apiKey: string, private readonly base = "https://api.pexels.com") {}

  private async get<T>(path: string, term: string): Promise<T | { status: number } | null> {
    try {
      const res = await fetch(`${this.base}${path}?query=${encodeURIComponent(term)}&per_page=1&locale=pt-BR`, {
        headers: { Authorization: this.apiKey },
      });
      return res.ok ? ((await res.json()) as T) : { status: res.status };
    } catch {
      return null;
    }
  }

  async refs(terms: string[]): Promise<VisualRef[]> {
    const out: VisualRef[] = [];
    for (const t of terms) {
      const photos = await this.get<{ photos?: PexelsPhoto[] }>("/v1/search", t);
      const videos = await this.get<{ videos?: PexelsVideo[] }>("/videos/search", t);
      const before = out.length;
      const photo = photos && !("status" in photos) ? photos.photos?.[0] : undefined;
      if (photo && (photo.src?.large || photo.src?.original)) {
        out.push({
          fonte: "Pexels",
          termo: t,
          url: photo.src.large || photo.src.original,
          nota: `Foto real do Pexels${photo.photographer ? ` · por ${photo.photographer}` : ""}${photo.url ? ` · ${photo.url}` : ""}`,
        });
      }
      const video = videos && !("status" in videos) ? videos.videos?.[0] : undefined;
      if (video?.url) {
        out.push({
          fonte: "Pexels",
          termo: t,
          url: video.url,
          nota: `Vídeo (b-roll) real do Pexels${video.user?.name ? ` · por ${video.user.name}` : ""}`,
        });
      }
      if (out.length === before) {
        out.push({ fonte: "Pinterest", termo: t, url: pinterestSearchUrl(t), nota: "Sem resultado no Pexels; use a busca do Pinterest." });
      }
    }
    return out;
  }
}

/** Junta provedores em ordem, sem repetir o mesmo link. */
export class CompositeVisualProvider implements VisualRefProvider {
  readonly name: string;
  constructor(private readonly providers: VisualRefProvider[]) {
    this.name = providers.map((p) => p.name).join("+");
  }
  async refs(terms: string[]): Promise<VisualRef[]> {
    const seen = new Set<string>();
    const out: VisualRef[] = [];
    for (const p of this.providers) {
      for (const r of await p.refs(terms)) {
        const k = `${r.fonte}|${r.termo}|${r.url ?? ""}`;
        if (!seen.has(k)) {
          seen.add(k);
          out.push(r);
        }
      }
    }
    return out;
  }
}

/** Escolhe o provedor pelo ambiente: Pixabay e/ou Pexels se houver chave, senão só links. */
export function createVisualRefProvider(env: NodeJS.ProcessEnv = process.env): VisualRefProvider {
  const providers: VisualRefProvider[] = [];
  if (env.PIXABAY_API_KEY) providers.push(new PixabayVisualProvider(env.PIXABAY_API_KEY));
  if (env.PEXELS_API_KEY) providers.push(new PexelsVisualProvider(env.PEXELS_API_KEY));
  if (!providers.length) return new SearchLinkVisualProvider();
  return providers.length === 1 ? providers[0]! : new CompositeVisualProvider(providers);
}
