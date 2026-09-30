/**
 * Registro dos agentes do módulo COMERCIAL.
 *
 * Fica SEPARADO de `src/core/agents-registry.ts` de propósito: a arquitetura
 * documenta um teto de 10 agentes (ARCHITECTURE.md §3). Este módulo é uma
 * extensão que aguarda a sua aprovação para ser incorporada ao núcleo.
 */
export type CommercialAgentInfo = {
  key: string;
  name: string;
  role: string;
  status: "active" | "planned";
  summary: string;
  /** Botão/ação exposta no painel, quando houver. */
  action?: string;
};

export const COMMERCIAL_AGENTS: CommercialAgentInfo[] = [
  { key: "prospecting", name: "Garimpo", role: "Prospecção", status: "active", action: "ANALISAR OPORTUNIDADE",
    summary: "Avalia leads só com observações registradas; prioriza, aponta hipóteses, melhor serviço, ângulo e ticket (do catálogo)." },
  { key: "approach", name: "Abertura", role: "Primeira abordagem", status: "active",
    summary: "Mensagem curta e humana: observação real + oportunidade + pergunta. Recusa gerar sem motivo real de contato." },
  { key: "discovery", name: "Sonda", role: "Descoberta de necessidade", status: "active",
    summary: "Lê a conversa e identifica o que o lead quer, dor, impacto, urgência, orçamento e decisores; pergunta só o que falta." },
  { key: "value", name: "Value Builder", role: "Valor percebido", status: "active",
    summary: "Entregável → benefício → impacto → valor para o negócio, para cada tipo de serviço." },
  { key: "authority", name: "Lastro", role: "Autoridade legítima", status: "active",
    summary: "Usa apenas provas cadastradas e verificadas; sem prova, trabalha processo, metodologia e clareza." },
  { key: "objections", name: "Objection Engine", role: "Objeções", status: "active",
    summary: "Detecta a objeção real (15 tipos), pergunta a causa, responde de forma consultiva e reduz risco. Preço nunca abre com desconto." },
  { key: "negotiation", name: "Acordo", role: "Negociação", status: "active",
    summary: "Contra-propostas por valor, escopo, fase, parcelamento, pacote e recorrência; desconto só com regra cadastrada." },
  { key: "coach", name: "Deal Coach", role: "Coach de negócio", status: "active",
    summary: "Responde: o que está impedindo este negócio de fechar? Risco, objeção, lacunas, próximo movimento e CTA." },
  { key: "closing", name: "Fechamento", role: "Preparação de reunião", status: "active", action: "PREPARAR FECHAMENTO",
    summary: "Resumo executivo e roteiro dinâmico de 15 etapas adaptado ao lead." },
  { key: "proposal", name: "Proposta", role: "Proposta persuasiva", status: "planned",
    summary: "Proposta baseada no diagnóstico (aguardando a estrutura desejada)." },
];
