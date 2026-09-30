/**
 * MESA DE PROSPECÇÃO — motor de prospecção de serviços de conteúdo no Instagram.
 * Princípio: NADA é inventado. Fato observado ≠ hipótese ≠ confirmado pelo lead.
 */

export type Certeza = "OBSERVADO" | "HIPOTESE" | "CONFIRMADO";
export type Claim = { texto: string; certeza: Certeza; evidencia?: string };

export type Nota = "forte" | "regular" | "fraca" | "ausente" | "nao_avaliado";
export type NotaAvaliada = Exclude<Nota, "nao_avaliado">;

export const DIM_KEYS = [
  "bio", "posicionamento", "clareza_oferta", "frequencia", "tipos_conteudo", "qualidade",
  "consistencia_visual", "reels", "stories", "carrosseis", "cta", "prova_social", "autoridade",
  "humanizacao", "educativo", "comercial", "descoberta", "consideracao", "conversao",
] as const;
export type DimKey = (typeof DIM_KEYS)[number];

/** Checagem do cabeçalho do perfil (inspirada no ig-profile-optimizer, MIT). */
export const HEADER_KEYS = ["foto", "nome_busca", "handle", "link", "categoria", "destaques", "grid_9", "fixados"] as const;
export type HeaderKey = (typeof HEADER_KEYS)[number];

export type DimInput = { nota: Nota; obs?: string };

export type IgProfile = {
  id: string;
  handle: string;
  nome: string;
  /** Nome de quem será abordado (opcional). */
  contato?: string;
  /** Chave de um nicho do catálogo OU texto livre. */
  nicho: string;
  cidade?: string;
  /** O que o perfil demonstra dominar (fato informado por você). */
  temaDominado?: string;
  bio?: string;
  link?: string;
  seguidores?: number;
  posts30d?: number;
  reels30d?: number;
  carrosseis30d?: number;
  stories?: "diario" | "semanal" | "raro" | "nunca" | "nao_sei";
  /** Contagem por tipo nos últimos posts observados. */
  mix?: { educativo?: number; comercial?: number; institucional?: number; pessoal?: number; provaSocial?: number };
  funil?: { descoberta?: number; consideracao?: number; conversao?: number };
  ctaNaBio?: boolean;
  dims: Partial<Record<DimKey, DimInput>>;
  header: Partial<Record<HeaderKey, DimInput>>;
  /** Observações reais livres, com fonte. */
  notas: { texto: string; fonte: string }[];
  negocio?: DimInput;
  capacidade?: DimInput;
  /** Legendas/bio coladas — usadas só pela análise de IA (com validação). */
  amostraTexto?: string;
};

export const QUAL_KEYS = [
  "quemProduz", "frequencia", "estrutura", "temSocialMedia", "temDesigner", "temVideomaker",
  "produzInternamente", "principalDificuldade", "objetivoInstagram", "usaConteudoParaAquisicao",
  "investeEmMidia", "ticketNegocio", "volumeClientes", "urgencia", "orcamento", "tomadorDecisao",
] as const;
export type QualKey = (typeof QUAL_KEYS)[number];

export const OBJETIVO_KEYS = [
  "gerar_leads", "vender", "aumentar_autoridade", "melhorar_posicionamento", "construir_marca",
  "aumentar_reconhecimento", "atrair_clientes_melhores", "criar_comunidade", "profissionalizar_presenca",
] as const;
export type ObjetivoKey = (typeof OBJETIVO_KEYS)[number];

export type Msg = { autor: "lead" | "nos"; texto: string };

export const LEAD_STATUS = ["novo", "raiox", "abordado", "conversa", "qualificado", "pitch", "negociacao", "fechado", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export type Lead = {
  profile: IgProfile;
  status: LeadStatus;
  conversa: Msg[];
  /** Respostas informadas manualmente (valem como CONFIRMADO: você ouviu do lead). */
  qual: Partial<Record<QualKey, string>>;
  objetivos: ObjetivoKey[];
  doresConfirmadas: string[];
  criadoEm?: string;
  atualizadoEm?: string;
};

export type ServiceKey =
  | "gestao_redes" | "estrategia_conteudo" | "planejamento_conteudo" | "calendario_editorial"
  | "criacao_conteudo" | "copywriting" | "roteiros_video" | "reels" | "carrosseis" | "stories"
  | "posicionamento_digital" | "branding_conteudo" | "consultoria_conteudo" | "gestao_mensal_conteudo"
  | "analise_metricas" | "otimizacao_mensal";

export type ArgKey =
  | "posicionamento" | "autoridade" | "consistencia" | "profissionalizacao" | "tempo"
  | "estrategia" | "aquisicao" | "conversao" | "marca" | "diferenciacao";

export type ProofType = "case" | "portfolio" | "experiencia" | "metodologia" | "processo" | "diferencial" | "especializacao" | "cliente" | "resultado" | "depoimento" | "estrutura";
export type ProofItem = { tipo: ProofType; titulo: string; descricao: string; fonte: string; verificado: boolean; resultadoDocumentado?: string; nichos?: string[] };

/** Sua operação: o que você vende, prova e aceita. É daqui — e só daqui — que saem preços, diferenciais e concessões. */
export type Operacao = {
  nome?: string;
  assinatura?: string;
  nichosCustom: { key: string; nome: string; dependeDe: ("autoridade" | "imagem" | "aquisicao")[] }[];
  catalogo: Partial<Record<ServiceKey, { ativo: boolean; ticketMin?: number; ticketMax?: number }>>;
  diferenciais: ProofItem[];
  provas: ProofItem[];
  processo: string[];
  regras: { descontoMaximoPct?: number; descontoCondicoes?: string[]; parcelamentoMaxParcelas?: number; faseInicialPermitida?: boolean; margemMinimaPct?: number };
};

export const OPERACAO_VAZIA: Operacao = { nichosCustom: [], catalogo: {}, diferenciais: [], provas: [], processo: [], regras: {} };
