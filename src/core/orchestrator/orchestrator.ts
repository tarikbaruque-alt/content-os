import { Trace } from "../observability.js";
import { getAgent } from "../agents-registry.js";
import type { AgentContext, AgentResult, AgentRunner } from "./types.js";

/**
 * Maestro (orquestrador) — versão lite.
 *
 * Hoje: registra runners de agentes, injeta dependências compartilhadas,
 * abre um trace por execução e padroniza o resultado. Ainda não roteia entre
 * múltiplos agentes (só existe Íris). A base de handoff/roteamento já está
 * preparada para quando o 2º agente entrar.
 */
export class Orchestrator {
  private runners = new Map<string, AgentRunner<unknown, unknown>>();

  constructor(private readonly ctx: AgentContext) {}

  register<I, O>(agentKey: string, runner: AgentRunner<I, O>): void {
    this.runners.set(agentKey, runner as AgentRunner<unknown, unknown>);
  }

  async run<I, O>(agentKey: string, clientId: string, input: I): Promise<AgentResult<O>> {
    const runner = this.runners.get(agentKey);
    if (!runner) throw new Error(`Agente não registrado no Maestro: ${agentKey}`);
    const meta = getAgent(agentKey);
    const trace = new Trace(meta?.name ?? agentKey, clientId);
    trace.step("start", { agent: meta?.name, role: meta?.role });
    const { output, warnings, needsHumanApproval } = await runner(input, this.ctx, trace);
    trace.step("done", { warnings: warnings.length, needsHumanApproval });
    return { output: output as O, trace: trace.finish(), warnings, needsHumanApproval };
  }
}
