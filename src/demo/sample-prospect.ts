import type { Operacao } from "../prospect/types.js";

export { demoLead } from "../prospect/demo.js";

export const DEMO_OP: Operacao = {
  nome: "Operação Demo (fictícia)", assinatura: "— [seu nome]",
  nichosCustom: [{ key: "pet_shops", nome: "Pet shops", dependeDe: ["imagem", "aquisicao"] }],
  catalogo: {
    estrategia_conteudo: { ativo: true, ticketMin: 2500, ticketMax: 4500 },
    gestao_mensal_conteudo: { ativo: true, ticketMin: 3000, ticketMax: 6000 },
    copywriting: { ativo: true, ticketMin: 900, ticketMax: 1800 },
  },
  diferenciais: [
    { tipo: "diferencial", titulo: "Estratégia antes da produção", descricao: "Todo ciclo começa por objetivo, público e pilares.", fonte: "método interno", verificado: true },
    { tipo: "diferencial", titulo: "Diferencial não verificado", descricao: "Ainda não confirmado.", fonte: "rascunho", verificado: false },
  ],
  provas: [],
  processo: ["Diagnóstico", "Estratégia", "Planejamento do ciclo", "Produção", "Análise e ajuste"],
  regras: {},
};
