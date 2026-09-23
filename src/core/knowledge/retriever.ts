import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Acervo — recuperação da Knowledge Base.
 *
 * Recupera APENAS os pilares relevantes para a tarefa/agente (não despeja a KB
 * inteira no prompt). Versão 1: mapa agente→pilares + leitura sob demanda.
 * Fase futura: embeddings/semantic search. Preserva a origem (path do pilar).
 */
export type KnowledgeRef = {
  id: string;
  title: string;
  path: string;
  excerpt: string;
};

/** Quais pilares cada agente costuma usar. */
const AGENT_PILLARS: Record<string, string[]> = {
  intelligence: ["estrategia-marca"],
  strategy: ["estrategia-marca", "jornada-e-editorias"],
  research: ["distribuicao-instagram", "estrategia-marca"],
  editorial: ["jornada-e-editorias"],
  ideas: ["jornada-e-editorias", "criacao-alto-valor", "distribuicao-instagram"],
  creative: ["criacao-alto-valor", "jornada-e-editorias"],
  planning: ["planejamento-cadencia"],
  performance: ["distribuicao-instagram", "planejamento-cadencia"],
};

export class KnowledgeRetriever {
  constructor(
    private readonly pillarsDir: string = join(
      process.cwd(),
      "foundation",
      "knowledge-base",
      "pilares",
    ),
  ) {}

  async retrieveForAgent(agentKey: string): Promise<KnowledgeRef[]> {
    const wanted = AGENT_PILLARS[agentKey] ?? [];
    const refs: KnowledgeRef[] = [];
    for (const id of wanted) {
      const ref = await this.readPillar(id);
      if (ref) refs.push(ref);
    }
    return refs;
  }

  async listPillars(): Promise<string[]> {
    if (!existsSync(this.pillarsDir)) return [];
    const files = await readdir(this.pillarsDir);
    return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
  }

  private async readPillar(id: string): Promise<KnowledgeRef | null> {
    const path = join(this.pillarsDir, `${id}.md`);
    if (!existsSync(path)) return null;
    const raw = await readFile(path, "utf8");
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? id;
    const excerpt = raw
      .replace(/^#.*$/m, "")
      .replace(/>.*$/gm, "")
      .trim()
      .slice(0, 300);
    return { id, title, path: `foundation/knowledge-base/pilares/${id}.md`, excerpt };
  }
}
