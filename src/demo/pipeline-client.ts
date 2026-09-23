/** Clientes fictícios completos para o teste ponta a ponta do pipeline (um por nicho). */
export type PipelineClientDef = {
  id: string;
  name: string;
  source: string;
  briefing: string;
};

const SRC = "Briefing de onboarding — 21/09/2026";

export const PIPELINE_CLIENTS: PipelineClientDef[] = [
  {
    id: "aurora",
    name: "Studio Aurora — Fotografia de Casamento",
    source: SRC,
    briefing: [
      "Sou fotógrafa de casamento e vendo ensaios e cobertura de casamento; meu ticket médio é R$ 6.000 por evento.",
      "Meu público são noivas de 28 a 38 anos que valorizam memórias afetivas.",
      "A maior dor delas é o medo de que o dia passe rápido e não fique registrado de verdade.",
      "Elas desejam reviver as emoções do casamento por fotos naturais, sem poses forçadas.",
      "Uma objeção comum é achar que fotógrafo bom é caro demais para o orçamento.",
      "Meu diferencial é um estilo documental que capta a emoção real, não o retrato posado.",
      "Tenho 10 anos de experiência e mais de 200 casamentos fotografados.",
      "Falo de forma sensível e próxima, evito termos técnicos de fotografia.",
      "No último mês, os Reels dos bastidores da edição tiveram mais salvamentos.",
      "Decidimos focar em conteúdo de identificação com as emoções da noiva.",
      'Uma cliente me disse: "Chorei vendo as fotos, era exatamente como eu senti no dia."',
    ].join("\n"),
  },
  {
    id: "marina",
    name: "Dra. Marina — Advocacia Trabalhista",
    source: SRC,
    briefing: [
      "Sou advogada trabalhista e atendo trabalhadores individuais (não empresas) em processos de rescisão, assédio e horas extras; cobro honorários por êxito, sem custo inicial para o cliente.",
      "Meu público são trabalhadores CLT de 25 a 50 anos que saíram ou estão saindo de um emprego e sentem que foram prejudicados.",
      "A maior dor deles é o medo de processar o ex-empregador e ser malvisto, ou de já ter perdido o prazo sem saber.",
      "Eles desejam recuperar o que é justo com clareza sobre o processo, sem se sentir 'encrenqueiro' ou vulnerável.",
      "Uma objeção comum é achar que processo trabalhista demora anos e não vale a pena.",
      "Meu diferencial é explicar juridiquês em português claro e responder rápido — muita gente nunca teve um advogado que fizesse isso.",
      "Tenho 12 anos de atuação e já conduzi mais de 400 processos trabalhistas.",
      "Falo de forma acolhedora mas direta, sem jargão jurídico, como se estivesse explicando pra um amigo.",
      "No último mês, o conteúdo explicando 'você sabia que tem direito a isso' teve muito mais salvamento que os outros.",
      "Decidimos focar em educar sobre direitos específicos antes de empurrar a consultoria.",
      'Uma cliente me disse: "Eu não sabia que tinha direito a isso, achei que tinha perdido o prazo."',
    ].join("\n"),
  },
  {
    id: "verde",
    name: "Verde Vivo — Cosméticos Naturais",
    source: SRC,
    briefing: [
      "Vendo uma linha de cosméticos naturais e veganos para skincare, sem crueldade animal, por e-commerce; meu ticket médio é R$ 120 por pedido.",
      "Meu público são mulheres de 25 a 45 anos preocupadas com os ingredientes que usam na pele e com sustentabilidade.",
      "A maior dor delas é ter pele sensível que reage a produtos convencionais, e culpa por consumir produtos que agridem o meio ambiente.",
      "Elas desejam uma rotina de skincare que realmente funcione e seja limpa e consciente ao mesmo tempo.",
      "Uma objeção comum é achar que produto natural não funciona tão bem quanto os industrializados.",
      "Meu diferencial são fórmulas com ingredientes rastreáveis, sem parabenos, testadas dermatologicamente, em embalagem reciclável.",
      "Estou no mercado há 6 anos e tenho mais de mil avaliações positivas nos produtos.",
      "Falo de forma leve, acolhedora e educativa, evito qualquer discurso de 'greenwashing' vazio — só afirmo o que dá pra comprovar.",
      "No último mês, os posts mostrando os bastidores da fórmula (quais ingredientes entram e por quê) engajaram muito mais que os posts só de produto.",
      "Decidimos focar em provar eficácia com transparência de ingredientes, não só apelo emocional.",
      'Uma cliente me disse: "Finalmente um produto natural que realmente faz efeito, minha pele não reagiu."',
    ].join("\n"),
  },
  {
    id: "rafa",
    name: "Rafa Nutri — Nutrição Esportiva",
    source: SRC,
    briefing: [
      "Sou nutricionista esportivo e vendo acompanhamento nutricional personalizado para quem treina; meu ticket médio é R$ 450 por mês.",
      "Meu público são pessoas de 25 a 40 anos que treinam na academia querendo hipertrofia ou emagrecimento, mas se perdem com dietas da internet.",
      "A maior dor deles é sentir que já tentaram de tudo — low carb, jejum, dieta de influenciador — e não veem resultado.",
      "Eles desejam comer bem, ter energia pro treino e ver resultado no espelho sem sofrer com dieta restritiva.",
      "Uma objeção comum é achar que nutricionista é caro e que dieta é chata demais pra conseguir seguir.",
      "Meu diferencial é montar o plano em torno da rotina real da pessoa, sem cortar tudo que ela gosta — nada de dieta genérica copiada da internet.",
      "Tenho 9 anos de prática e já acompanhei mais de 600 atletas amadores.",
      "Falo de forma direta e motivacional, sem papo de chá detox ou dieta da moda — só o que tem evidência.",
      "No último mês, o conteúdo desmentindo o mito de que carboidrato engorda teve muito mais compartilhamento que o resto.",
      "Decidimos focar em desmistificar dietas da internet antes de vender o acompanhamento.",
      'Um cliente me disse: "Consegui ver resultado sem passar fome pela primeira vez."',
    ].join("\n"),
  },
];

/** Compat: cliente único (Studio Aurora) para quem ainda importa o formato antigo. */
export const PIPELINE_CLIENT = { id: PIPELINE_CLIENTS[0]!.id, name: PIPELINE_CLIENTS[0]!.name };
export const PIPELINE_SOURCE = PIPELINE_CLIENTS[0]!.source;
export const PIPELINE_BRIEFING = PIPELINE_CLIENTS[0]!.briefing;
