import type { CommercialContext, Lead } from "../commercial/types.js";

/**
 * DADOS FICTÍCIOS DE DEMONSTRAÇÃO — não representam clientes, cases ou preços reais.
 * Servem apenas para testes e para o comando `npm run commercial`.
 */
export const DEMO_CTX: CommercialContext = {
  agencia: {
    nome: "Estúdio Demo (fictício)",
    nichosPrioritarios: ["Gastronomia", "Saúde"],
    processo: ["Diagnóstico", "Estratégia", "Execução", "Revisão mensal"],
  },
  servicos: [
    { key: "estrategia", nome: "Estratégia de conteúdo e posicionamento", categoria: "estrategia", entregaveis: ["Diagnóstico do negócio", "Posicionamento", "Plano editorial de 90 dias"], portaDeEntrada: true, recorrente: false, ticketMin: 2500, ticketMax: 4500 },
    { key: "landing", nome: "Landing page de encomendas", categoria: "landing_page", entregaveis: ["Página de oferta", "Cardápio/produtos", "Botão de contato"], portaDeEntrada: true, recorrente: false, ticketMin: 1800, ticketMax: 3500 },
    { key: "site", nome: "Site institucional", categoria: "site", entregaveis: ["Site de 5 páginas", "SEO básico", "Integração com WhatsApp"], recorrente: false, ticketMin: 4000, ticketMax: 9000 },
    { key: "copy", nome: "Copy de oferta", categoria: "copy", entregaveis: ["Textos da oferta principal"], recorrente: false, ticketMin: 900, ticketMax: 1800 },
    { key: "conteudo", nome: "Planejamento e produção de conteúdo", categoria: "conteudo", entregaveis: ["Calendário", "Roteiros", "Copy de legendas"], recorrente: true, ticketMin: 1500, ticketMax: 3500 },
    { key: "gestao", nome: "Gestão recorrente de Instagram", categoria: "gestao_recorrente", entregaveis: ["Publicação", "Acompanhamento", "Relatório mensal"], recorrente: true, ticketMin: 2000, ticketMax: 4000 },
  ],
  provas: [
    { tipo: "metodologia", titulo: "Método em 4 etapas (diagnóstico → estratégia → execução → revisão)", descricao: "Método interno documentado.", fonte: "Documento interno v2", verificado: true, nichos: ["Gastronomia"] },
    { tipo: "case", titulo: "Case de padaria (rascunho)", descricao: "Ainda sem números confirmados.", fonte: "anotação", verificado: false },
    { tipo: "resultado", titulo: "Resultado sem documentação", descricao: "Citado de memória.", fonte: "memória", verificado: true },
  ],
  regras: {},
};

/** Variante do contexto COM regras comerciais cadastradas. */
export const DEMO_CTX_WITH_RULES: CommercialContext = {
  ...DEMO_CTX,
  regras: { descontoMaximoPct: 8, descontoCondicoes: ["pagamento à vista"], parcelamentoMaxParcelas: 6, faseInicialPermitida: true, margemMinimaPct: 35 },
};

export const DEMO_LEAD: Lead = {
  id: "lead-demo-1",
  nome: "Padaria Trigo (fictícia)",
  contato: "Marina Souza",
  nicho: "Gastronomia",
  cidade: "Campinas",
  instagram: "@padariatrigo.demo",
  sinais: [
    { area: "site", avaliacao: "fraca", observacao: "O site não mostra o cardápio nem um botão de encomenda.", fonte: "site (home)" },
    { area: "conteudo", avaliacao: "fraca", observacao: "O último post do Instagram tem mais de um mês.", fonte: "Instagram (perfil)" },
    { area: "posicionamento", avaliacao: "regular", observacao: "A bio destaca pães artesanais, sem dizer o que diferencia dos concorrentes.", fonte: "Instagram (bio)" },
    { area: "investimento", avaliacao: "regular", observacao: "Tem mais de uma unidade, segundo o Google Maps.", fonte: "Google Maps" },
    { area: "maturidade", avaliacao: "regular", observacao: "Negócio consolidado, com encomendas recebidas por WhatsApp.", fonte: "Instagram (bio)" },
  ],
  conversa: [
    { autor: "nos", texto: "Notei que o site não mostra o cardápio nem um botão de encomenda. Isso é um ponto que vocês querem resolver?" },
    { autor: "lead", texto: "Oi! Sim, a gente perde muitas encomendas porque tudo é por WhatsApp e o pessoal não acha o cardápio." },
    { autor: "lead", texto: "É urgente pra mim resolver isso antes das encomendas de fim de ano." },
  ],
};
