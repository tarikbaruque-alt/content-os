/**
 * Módulo COMERCIAL do Content OS — tipos.
 *
 * Princípio inegociável: NADA é inventado. Toda afirmação sobre um lead carrega
 * seu grau de certeza; toda prova/autoridade vem de um cadastro verificado;
 * toda concessão comercial (desconto etc.) depende de regra previamente cadastrada.
 */

/** Grau de certeza de uma afirmação sobre o lead. Hipótese NUNCA é tratada como fato. */
export type Certainty = "OBSERVADO" | "HIPOTESE" | "CONFIRMADO";

export type Claim = {
  texto: string;
  certeza: Certainty;
  /** De onde vem (observação registrada, trecho da conversa…). Obrigatório p/ OBSERVADO/CONFIRMADO. */
  evidencia?: string;
};

// ---------------------------------------------------------------- catálogo

export const SERVICE_CATEGORIES = [
  "estrategia",
  "conteudo",
  "branding",
  "copy",
  "roteiro",
  "site",
  "landing_page",
  "loja_virtual",
  "consultoria",
  "gestao_recorrente",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export type ServiceOffer = {
  key: string;
  nome: string;
  categoria: ServiceCategory;
  entregaveis: string[];
  /** Serviço indicado como primeira compra (baixo risco/atrito). */
  portaDeEntrada?: boolean;
  recorrente: boolean;
  /** Faixa de ticket CADASTRADA por você. Sem faixa → o sistema não estima valores. */
  ticketMin?: number;
  ticketMax?: number;
};

// ------------------------------------------------------------------ provas

export const PROOF_TYPES = [
  "case",
  "portfolio",
  "experiencia",
  "metodologia",
  "processo",
  "diferencial",
  "especializacao",
  "cliente",
  "resultado",
  "depoimento",
  "estrutura",
] as const;
export type ProofType = (typeof PROOF_TYPES)[number];

export type ProofItem = {
  tipo: ProofType;
  titulo: string;
  descricao: string;
  /** Onde a prova está documentada (link, arquivo, contrato, print…). */
  fonte: string;
  /** Só provas verificadas por um humano podem ser usadas como autoridade. */
  verificado: boolean;
  /** Obrigatório p/ resultado/case/depoimento que cite números ou ganhos. */
  resultadoDocumentado?: string;
  nichos?: string[];
};

// ----------------------------------------------------------------- regras

export type CommercialRules = {
  /** Ausente = NENHUM desconto pode ser sugerido. */
  descontoMaximoPct?: number;
  descontoCondicoes?: string[];
  parcelamentoMaxParcelas?: number;
  faseInicialPermitida?: boolean;
  margemMinimaPct?: number;
};

export type CommercialContext = {
  agencia: { nome: string; nichosPrioritarios?: string[]; processo?: string[] };
  servicos: ServiceOffer[];
  provas: ProofItem[];
  regras: CommercialRules;
};

// -------------------------------------------------------------------- lead

export const SIGNAL_AREAS = [
  "presenca_digital",
  "oferta",
  "posicionamento",
  "conteudo",
  "site",
  "conversao",
  "investimento",
  "maturidade",
  "outro",
] as const;
export type SignalArea = (typeof SIGNAL_AREAS)[number];

export type SignalRating = "forte" | "regular" | "fraca" | "ausente";

/** Uma OBSERVAÇÃO REAL registrada sobre o lead (com fonte). Base de toda análise. */
export type LeadSignal = {
  area: SignalArea;
  /** Frase completa e factual. Ex.: "O site não mostra o cardápio nem um botão de encomenda." */
  observacao: string;
  /** Onde foi visto: "site (home)", "Instagram – bio", "Google Maps"… */
  fonte: string;
  avaliacao: SignalRating;
};

export type ConversationMessage = {
  autor: "lead" | "nos";
  texto: string;
  data?: string;
};

export type Lead = {
  id: string;
  nome: string;
  /** Nome de quem vamos abordar (opcional). */
  contato?: string;
  nicho: string;
  cidade?: string;
  site?: string;
  instagram?: string;
  sinais: LeadSignal[];
  conversa: ConversationMessage[];
  orcamentoInformado?: string;
  decisores?: string[];
  concorrentes?: string[];
  solucoesTentadas?: string[];
  fornecedorAtual?: string;
};

// ----------------------------------------------------------------- saídas

export type Priority = "ALTA" | "MEDIA" | "BAIXA" | "INDEFINIDA";

export type DimensionLevel = SignalRating | "desconhecido";

export type LeadDimension = {
  dimensao: string;
  nivel: DimensionLevel;
  evidencia?: string;
};

export type TicketRange = {
  minimo: number;
  maximo: number;
  periodicidade: "unico" | "mensal";
  origem: string;
};

export type LeadAssessment = {
  prioridade: Priority;
  pontuacao: number;
  dimensoes: LeadDimension[];
  motivoDeInteresse: Claim[];
  possiveisProblemas: Claim[];
  possiveisOportunidades: Claim[];
  melhorServico: { servico: ServiceOffer; motivo: string } | null;
  melhorAngulo: string | null;
  possivelTicket: TicketRange | null;
  lacunas: string[];
};

export type ValueChain = {
  categoria: ServiceCategory;
  entregavel: string;
  beneficio: string;
  impacto: string;
  valorParaONegocio: string;
  /** Frase pronta de valor (entregável → benefício → impacto → valor). */
  frase: string;
};

export type OpportunityDiagnosis = {
  leadId: string;
  situacaoAtual: Claim[];
  possiveisDores: Claim[];
  oportunidadesDeCrescimento: Claim[];
  gargalosPercebidos: Claim[];
  impactoDosGargalos: Claim[];
  oQueOnegocioPodeEstarPerdendo: Claim[];
  comoNossosServicosAjudam: { servico: string; cadeiaDeValor: ValueChain }[];
  melhorPortaDeEntrada: { servico: string; motivo: string; ticket: TicketRange | null } | null;
  oportunidadesDeUpsell: { servico: string; motivo: string }[];
  potencialDeContratoRecorrente: { existe: boolean; motivo: string; servico?: string };
  argumentosParaGerarValor: string[];
  perguntasParaConfirmarHipoteses: { pergunta: string; confirma: string }[];
  avaliacao: LeadAssessment;
};

export type FirstApproach = {
  leadId: string;
  /** Por que existe um motivo legítimo de contato. */
  motivoReal: string;
  observacaoUsada: LeadSignal;
  variantes: { canal: "mensagem_curta" | "email"; assunto?: string; texto: string }[];
  avisos: string[];
};

export type FirstApproachRefusal = {
  leadId: string;
  recusada: true;
  motivo: string;
  proximoPasso: string;
};

export type DiscoveryFieldKey =
  | "querer"
  | "porque"
  | "problema"
  | "impacto"
  | "custo"
  | "resultadoEsperado"
  | "urgencia"
  | "prioridade"
  | "investimento"
  | "autoridadeDeDecisao"
  | "outrosDecisores"
  | "solucoesJaTentadas";

export type DiscoveryField = {
  campo: DiscoveryFieldKey;
  rotulo: string;
  status: "identificado" | "lacuna";
  evidencia?: string;
};

export type DiscoveryReport = {
  leadId: string;
  campos: DiscoveryField[];
  qualificacaoPct: number;
  qualificada: boolean;
  camposCriticosEmFalta: DiscoveryFieldKey[];
  proximasPerguntas: { campo: DiscoveryFieldKey; pergunta: string; finalidade: string }[];
};

export type AuthorityPlan = {
  provasUsaveis: { prova: ProofItem; relevancia: "alta" | "media"; comoUsar: string }[];
  naoUsar: { prova: ProofItem; motivo: string }[];
  semProvaRelevante: boolean;
  alternativasLegitimas: { eixo: string; comoTrabalhar: string }[];
  avisos: string[];
};

export const OBJECTION_KEYS = [
  "preco",
  "timing",
  "prioridade",
  "confianca",
  "risco",
  "autoridade",
  "socio",
  "orcamento",
  "concorrencia",
  "ja_tenho_fornecedor",
  "preciso_pensar",
  "nao_vejo_necessidade",
  "quero_fazer_depois",
  "esta_caro",
  "incerteza_retorno",
] as const;
export type ObjectionKey = (typeof OBJECTION_KEYS)[number];

export type ObjectionAnalysis = {
  detectada: boolean;
  explicita: { chave: ObjectionKey; rotulo: string } | null;
  secundarias: { chave: ObjectionKey; rotulo: string }[];
  possiveisImplicitas: string[];
  perguntaParaEntenderACausa: string;
  respostaConsultiva: string;
  reforcoDeValor: string[];
  reducaoDePercepcaoDeRisco: string[];
  proximoPasso: string;
  /** Só preenchido para objeção de preço. */
  abordagemDePreco?: {
    entenderPrimeiro: string[];
    reforcar: string[];
    desconto: { permitido: boolean; ate?: number; condicoes?: string[]; motivo?: string };
  };
  naoFazer: string[];
};

export type NegotiationOption = {
  tipo:
    | "aumentar_valor"
    | "reduzir_escopo"
    | "fase_inicial"
    | "parcelamento"
    | "condicao_especifica"
    | "pacote"
    | "recorrencia"
    | "upsell"
    | "downsell"
    | "desconto";
  titulo: string;
  comoApresentar: string;
  protegeMargem: boolean;
  disponivel: boolean;
  motivoIndisponivel?: string;
};

export type NegotiationAdvice = {
  leadId: string;
  opcoesEmOrdem: NegotiationOption[];
  contraPropostaSugerida: string;
  alertas: string[];
};

export type Deal = {
  lead: Lead;
  etapa?: string;
  propostaEnviada?: boolean;
  diasSemResposta?: number;
  valorProposto?: number;
  provasNecessarias?: string[];
};

export type DealCoachReport = {
  leadId: string;
  oQueImpedeOFechamento: string;
  principalRisco: string;
  principalObjecao: string | null;
  informacoesFaltantes: string[];
  forcaDaOportunidade: "alta" | "media" | "baixa";
  proximoMovimento: string;
  perguntaQueDestrava: string;
  argumentoDeValor: string;
  provaNecessaria: string;
  melhorCTA: string;
};

export type ScriptStep = {
  ordem: number;
  etapa: string;
  modo: "conduzir" | "descobrir" | "confirmar" | "apresentar";
  objetivo: string;
  perguntasOuFalas: string[];
};

export type ClosingPrep = {
  leadId: string;
  resumoExecutivo: string;
  objetivoDoLead: Claim[];
  dores: Claim[];
  impacto: Claim[];
  desejos: Claim[];
  objecoes: { objecao: string; certeza: Certainty }[];
  orcamento: string;
  decisores: string[];
  concorrentes: string[];
  oportunidades: string[];
  perguntasEssenciais: string[];
  argumentos: string[];
  casesRelevantes: string[];
  servicos: string[];
  possivelSolucao: string;
  possiveisPacotes: { nome: string; servicos: string[]; motivo: string }[];
  estrategiaDeFechamento: string;
  proximoPasso: string;
  roteiro: ScriptStep[];
};
