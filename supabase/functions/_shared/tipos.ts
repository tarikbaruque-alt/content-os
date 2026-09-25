// Contratos do executor de agentes. Sem dependência de runtime: o mesmo código
// roda na Edge Function (Deno) e nos testes (Node), trocando só as peças.

/** Documento do painel: o mesmo caminho que o navegador usa (cos_clients/<id>…). */
export type Doc = { path: string; data: Record<string, any>; updated_at?: string };

export type Proposta = {
  workspace_id: string;
  client_id: string | null;
  agente: string;
  /** estrategia | pesquisa | editorial | ideias: o painel aplica ao aprovar.
   *  aviso: o agente já gravou algo pendente (DNA, peça) e só avisa. */
  tipo: "estrategia" | "pesquisa" | "editorial" | "ideias" | "aviso";
  titulo: string;
  resumo?: string;
  payload: Record<string, any>;
  fontes?: { titulo?: string; url: string; data?: string }[];
  run_id?: string | null;
};

export type Execucao = {
  status: "ok" | "erro" | "sem_saida" | "pulado";
  modelo?: string;
  tokens_in?: number;
  tokens_out?: number;
  buscas_web?: number;
  custo_usd?: number;
  passos?: unknown[];
  erro?: string | null;
};

export type Aprovacao = {
  workspace_id: string; client_id: string; objeto: string; decisao: "aprovado" | "rejeitado" | "reaberto" | "restaurado";
  ref?: string | null; motivo?: string | null; versao_anterior?: unknown; versao?: unknown; por?: string | null;
};
export type Tarefa = { id: string; workspace_id: string; client_id: string | null; agente: string; gatilho: string; tentativas: number };

export type TrechoKB = { fonte: string; titulo: string; secao: string | null; texto: string };

/** Tudo que o executor precisa do banco. Supabase em produção, memória nos testes. */
export interface Backend {
  getDoc(ws: string, path: string): Promise<Record<string, any> | null>;
  /** Quando o doc foi gravado pela última vez (ISO), ou null se não existe. */
  quando(ws: string, path: string): Promise<string | null>;
  setDoc(ws: string, path: string, data: Record<string, any>): Promise<void>;
  /** Filhos diretos de uma coleção (ex.: "cos_calendar/<cli>/items"). */
  listDocs(ws: string, parent: string): Promise<Doc[]>;
  buscarKB(ws: string, consulta: string, agente: string, limite: number): Promise<TrechoKB[]>;
  iniciarExecucao(ws: string, cliente: string | null, agente: string, gatilho: string): Promise<string>;
  terminarExecucao(id: string, e: Execucao): Promise<void>;
  criarProposta(p: Proposta): Promise<string>;
  /** Quanto este workspace já gastou com agentes no mês corrente (US$). */
  gastoDoMes(ws: string): Promise<number>;
  /** Momento da última execução (ou tarefa criada) deste agente para o cliente. */
  ultimaVez(ws: string, cliente: string | null, agente: string, gatilho?: string): Promise<Date | null>;
  workspaces(): Promise<string[]>;
  configAgentes(ws: string): Promise<Record<string, { ativo: boolean; agenda: string | null }>>;
  enfileirar(ws: string, cliente: string | null, agente: string, gatilho: string): Promise<void>;
  /** Pega até `n` tarefas vencidas e marca como "rodando" (atômico no Postgres). */
  pegarTarefas(n: number): Promise<Tarefa[]>;
  terminarTarefa(id: string, ok: boolean): Promise<void>;
  /** Propostas dos agentes ainda sem decisão para este cliente. */
  propostasPendentes(ws: string, cliente: string): Promise<number>;
  /** Registro de aprovação (tabela aprovacoes, só inclusão). */
  registrarAprovacao(a: Aprovacao): Promise<void>;
}

// ---- Mensagens da API da Anthropic: só o que o executor usa. O cliente real é
// o SDK oficial (@anthropic-ai/sdk); nos testes, um roteiro de respostas.
export type BlocoConteudo =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, any> }
  | { type: "server_tool_use"; id: string; name: string; input: Record<string, any> }
  | { type: "web_search_tool_result"; tool_use_id: string; content: any }
  | { type: "thinking"; thinking: string; signature?: string }
  | { type: string; [k: string]: any };

export type RespostaLlm = {
  content: BlocoConteudo[];
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number; server_tool_use?: { web_search_requests?: number } | null };
};

export interface ClienteLlm {
  create(params: Record<string, any>): Promise<RespostaLlm>;
}
