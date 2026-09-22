/**
 * Observabilidade mínima: logger estruturado + trace por execução de agente.
 * Sem dependências externas. Silenciável em testes (CONTENT_OS_LOG_SILENT=1).
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (process.env.CONTENT_OS_LOG_SILENT === "1") return;
  const line = { ts: new Date().toISOString(), level, message, ...meta };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

export type TraceStep = {
  name: string;
  at: string;
  detail?: Record<string, unknown>;
};

export type TraceSummary = {
  agent: string;
  clientId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  steps: TraceStep[];
  usage?: { inputTokens: number; outputTokens: number };
};

export class Trace {
  private steps: TraceStep[] = [];
  private readonly start = Date.now();
  private readonly startedAt = new Date().toISOString();
  usage?: { inputTokens: number; outputTokens: number };

  constructor(
    private readonly agent: string,
    private readonly clientId: string,
  ) {}

  step(name: string, detail?: Record<string, unknown>): void {
    this.steps.push({ name, at: new Date().toISOString(), detail });
  }

  finish(): TraceSummary {
    return {
      agent: this.agent,
      clientId: this.clientId,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - this.start,
      steps: this.steps,
      usage: this.usage,
    };
  }
}
