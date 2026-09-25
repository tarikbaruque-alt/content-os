import type { BlocoConteudo, ClienteLlm, RespostaLlm } from "./tipos.ts";

// Preço por milhão de tokens (entrada, saída) e da busca na web (por busca).
// Tabela da Anthropic; modelo fora da lista conta como Opus para não subestimar.
const PRECOS: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-opus-5": [5, 25],
  "claude-sonnet-5": [2, 10],
  "claude-haiku-4-5": [1, 5],
};
export const PRECO_BUSCA_WEB = 0.01;
export function custoUsd(modelo: string, tin: number, tout: number, buscas = 0): number {
  const [pi, po] = PRECOS[modelo] ?? [5, 25];
  return Math.round(((tin * pi + tout * po) / 1e6 + buscas * PRECO_BUSCA_WEB) * 10000) / 10000;
}

export type Ferramenta = {
  nome: string;
  descricao: string;
  entrada: Record<string, any>;
  rodar: (input: Record<string, any>) => Promise<unknown>;
};

export type Uso = { tokens_in: number; tokens_out: number; buscas_web: number; custo_usd: number };
export type Passo = { tipo: "ferramenta" | "busca_web" | "texto" | "aviso"; nome?: string; entrada?: unknown; resumo?: string };

export type Pedido = {
  llm: ClienteLlm;
  modelo: string;
  sistema: string;
  pedido: string;
  ferramentas: Ferramenta[];
  /** Esquema JSON do que o agente entrega (vira a ferramenta "entregar"). */
  saida: Record<string, any>;
  buscaWeb?: { maxUsos: number } | null;
  maxRodadas?: number;
};

export type Resultado = { saida: Record<string, any> | null; uso: Uso; passos: Passo[]; modelo: string };

const TETO_RESULTADO = 14000;

/**
 * Laço do agente: o Claude pensa, chama ferramentas (as nossas e a busca na
 * web da própria Anthropic) e termina chamando "entregar" com a saída no
 * esquema pedido. Sem "entregar" não há saída: nada de raspar JSON de texto.
 */
export async function executar(p: Pedido): Promise<Resultado> {
  const uso: Uso = { tokens_in: 0, tokens_out: 0, buscas_web: 0, custo_usd: 0 };
  const passos: Passo[] = [];
  const porNome = new Map(p.ferramentas.map((f) => [f.nome, f]));
  const tools: Record<string, any>[] = p.ferramentas.map((f) => ({ name: f.nome, description: f.descricao, input_schema: f.entrada }));
  tools.push({
    name: "entregar",
    description: "Entrega o resultado final do seu trabalho. Chame uma única vez, quando tiver terminado.",
    input_schema: p.saida,
  });
  if (p.buscaWeb) {
    tools.push({
      type: "web_search_20260209",
      name: "web_search",
      max_uses: p.buscaWeb.maxUsos,
      user_location: { type: "approximate", country: "BR", timezone: "America/Sao_Paulo" },
    });
  }
  const messages: { role: "user" | "assistant"; content: any }[] = [{ role: "user", content: p.pedido }];
  let saida: Record<string, any> | null = null;
  let cutucou = false;

  for (let rodada = 0; rodada < (p.maxRodadas ?? 12); rodada++) {
    const r: RespostaLlm = await p.llm.create({
      model: p.modelo,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: p.sistema,
      tools,
      messages,
    });
    uso.tokens_in += r.usage?.input_tokens ?? 0;
    uso.tokens_out += r.usage?.output_tokens ?? 0;
    uso.buscas_web += r.usage?.server_tool_use?.web_search_requests ?? 0;
    if (r.stop_reason === "max_tokens") throw new Error("Resposta cortada pelo limite de tokens.");
    if (r.stop_reason === "refusal") throw new Error("O modelo recusou o pedido.");

    // O conteúdo volta inteiro (inclusive blocos de pensamento): a API exige isso para continuar.
    messages.push({ role: "assistant", content: r.content });
    for (const b of r.content) {
      if (b.type === "server_tool_use") passos.push({ tipo: "busca_web", entrada: (b as any).input?.query ?? (b as any).input });
      if (b.type === "text" && (b as any).text?.trim()) passos.push({ tipo: "texto", resumo: String((b as any).text).slice(0, 300) });
    }
    // Busca na web ainda em andamento do lado da Anthropic: só continuar.
    if (r.stop_reason === "pause_turn") continue;

    const chamadas = r.content.filter((b): b is Extract<BlocoConteudo, { type: "tool_use" }> => b.type === "tool_use");
    if (!chamadas.length) {
      if (cutucou) break;
      cutucou = true;
      passos.push({ tipo: "aviso", resumo: "terminou sem entregar; pedido para chamar entregar" });
      messages.push({ role: "user", content: "Você terminou sem chamar a ferramenta entregar. Chame entregar agora com o resultado no formato pedido." });
      continue;
    }
    const resultados: Record<string, any>[] = [];
    for (const c of chamadas) {
      if (c.name === "entregar") {
        const faltando = ((p.saida.required as string[]) ?? []).filter((k) => c.input?.[k] === undefined);
        if (faltando.length) {
          resultados.push({ type: "tool_result", tool_use_id: c.id, is_error: true, content: `Faltam campos obrigatórios: ${faltando.join(", ")}.` });
          continue;
        }
        saida = c.input;
        resultados.push({ type: "tool_result", tool_use_id: c.id, content: "Recebido." });
        continue;
      }
      const f = porNome.get(c.name);
      passos.push({ tipo: "ferramenta", nome: c.name, entrada: c.input });
      try {
        if (!f) throw new Error(`ferramenta desconhecida: ${c.name}`);
        const out = await f.rodar(c.input ?? {});
        let txt = typeof out === "string" ? out : JSON.stringify(out);
        if (txt.length > TETO_RESULTADO) txt = txt.slice(0, TETO_RESULTADO) + "\n[…cortado]";
        resultados.push({ type: "tool_result", tool_use_id: c.id, content: txt || "(vazio)" });
      } catch (e) {
        resultados.push({ type: "tool_result", tool_use_id: c.id, is_error: true, content: (e as Error).message });
      }
    }
    messages.push({ role: "user", content: resultados });
    if (saida) break;
  }
  uso.custo_usd = custoUsd(p.modelo, uso.tokens_in, uso.tokens_out, uso.buscas_web);
  return { saida, uso, passos, modelo: p.modelo };
}
