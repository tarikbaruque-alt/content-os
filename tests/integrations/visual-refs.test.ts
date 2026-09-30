import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CompositeVisualProvider,
  PexelsVisualProvider,
  PixabayVisualProvider,
  SearchLinkVisualProvider,
  createVisualRefProvider,
} from "../../src/core/integrations/visual-refs.js";

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("PexelsVisualProvider", () => {
  it("traz foto e vídeo reais e envia a chave só no cabeçalho Authorization", async () => {
    const fetchMock = vi.fn((url: string) =>
      String(url).includes("/videos/")
        ? json({ videos: [{ url: "https://www.pexels.com/video/1/", user: { name: "Ana" } }] })
        : json({ photos: [{ url: "https://www.pexels.com/photo/2/", photographer: "Bia", src: { large: "https://images.pexels.com/2.jpg" } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const refs = await new PexelsVisualProvider("KEY").refs(["café"]);
    expect(refs.map((r) => r.fonte)).toEqual(["Pexels", "Pexels"]);
    expect(refs[0]!.url).toBe("https://images.pexels.com/2.jpg");
    expect(refs[1]!.url).toBe("https://www.pexels.com/video/1/");
    for (const [url, init] of fetchMock.mock.calls as unknown as [string, RequestInit][]) {
      expect(url).not.toContain("KEY");
      expect((init.headers as Record<string, string>).Authorization).toBe("KEY");
    }
  });

  it("cai para link do Pinterest quando o Pexels falha ou não acha nada", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json({}, 401)));
    const refs = await new PexelsVisualProvider("KEY").refs(["café"]);
    expect(refs).toHaveLength(1);
    expect(refs[0]!.fonte).toBe("Pinterest");
  });
});

describe("createVisualRefProvider", () => {
  it("escolhe pelo ambiente", () => {
    expect(createVisualRefProvider({})).toBeInstanceOf(SearchLinkVisualProvider);
    expect(createVisualRefProvider({ PIXABAY_API_KEY: "a" })).toBeInstanceOf(PixabayVisualProvider);
    expect(createVisualRefProvider({ PEXELS_API_KEY: "b" })).toBeInstanceOf(PexelsVisualProvider);
    expect(createVisualRefProvider({ PIXABAY_API_KEY: "a", PEXELS_API_KEY: "b" })).toBeInstanceOf(CompositeVisualProvider);
  });

  it("o composto não repete referências iguais", async () => {
    const p = new SearchLinkVisualProvider();
    const refs = await new CompositeVisualProvider([p, p]).refs(["x"]);
    expect(refs).toHaveLength(2);
  });
});
