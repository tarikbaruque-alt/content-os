import type {
  ObjectionKey,
  ServiceCategory,
  SignalArea,
  DiscoveryFieldKey,
} from "./types.js";

/**
 * Base de conhecimento comercial (metodologia). Não contém dados de cliente
 * nem provas: é o "como pensar" — tudo redigido como possibilidade/hipótese.
 */

// ------------------------------------------------------------ áreas do lead

export type AreaInsight = {
  rotulo: string;
  problema: string;
  oportunidade: string;
  gargalo: string;
  impacto: string;
  perdendo: string;
  categorias: ServiceCategory[];
  angulo: string;
  /** Pergunta de confirmação da hipótese (usada no diagnóstico). */
  pergunta: string;
  /** Peça da primeira abordagem. */
  oportunidadeCurta: string;
  perguntaAbordagem: string;
};

export const AREA_INSIGHTS: Partial<Record<SignalArea, AreaInsight>> = {
  presenca_digital: {
    rotulo: "Presença digital",
    problema: "a presença digital pode não estar transmitindo credibilidade suficiente para quem pesquisa o negócio",
    oportunidade: "organizar uma presença digital coerente, que facilite ser encontrado e reconhecido",
    gargalo: "presença digital pouco estruturada",
    impacto: "pode reduzir a confiança de quem conhece o negócio pela primeira vez",
    perdendo: "pode estar perdendo pessoas que pesquisam antes de comprar e não encontram sinais claros de confiança",
    categorias: ["estrategia", "branding", "gestao_recorrente"],
    angulo: "clareza e credibilidade da presença digital",
    pergunta: "Hoje, de onde vêm os clientes novos: indicação, busca, redes sociais ou outro canal?",
    oportunidadeCurta: "Isso pode deixar quem chega pela primeira vez sem um caminho claro.",
    perguntaAbordagem: "Isso já é um ponto que vocês querem resolver?",
  },
  oferta: {
    rotulo: "Oferta",
    problema: "a oferta pode não estar clara o suficiente para que o público entenda rápido o que comprar e por quê",
    oportunidade: "reorganizar a oferta em uma proposta simples, com benefício e próximo passo evidentes",
    gargalo: "oferta pouco clara",
    impacto: "pode aumentar as dúvidas e reduzir a decisão de compra",
    perdendo: "pode estar perdendo contatos de quem ficou em dúvida sobre o que exatamente é oferecido",
    categorias: ["estrategia", "copy", "consultoria"],
    angulo: "clareza da oferta",
    pergunta: "Qual serviço ou produto vocês mais querem vender hoje, e como o cliente costuma descobri-lo?",
    oportunidadeCurta: "Uma oferta mais direta pode encurtar o caminho até o contato.",
    perguntaAbordagem: "Isso é algo que vocês já perceberam?",
  },
  posicionamento: {
    rotulo: "Posicionamento",
    problema: "o posicionamento pode estar pouco diferenciado frente a concorrentes parecidos",
    oportunidade: "definir e comunicar um diferencial claro e defensável",
    gargalo: "posicionamento pouco diferenciado",
    impacto: "pode levar decisões de compra a se apoiar só no preço",
    perdendo: "pode estar competindo por preço com concorrentes que parecem equivalentes",
    categorias: ["estrategia", "branding", "consultoria"],
    angulo: "diferenciação frente aos concorrentes",
    pergunta: "O que faz um cliente escolher vocês em vez de um concorrente parecido?",
    oportunidadeCurta: "Sem um diferencial evidente, a comparação tende a cair só no preço.",
    perguntaAbordagem: "Como vocês explicam essa diferença hoje?",
  },
  conteudo: {
    rotulo: "Conteúdo",
    problema: "o conteúdo pode não estar constante ou estratégico o bastante para gerar interesse e autoridade",
    oportunidade: "construir uma linha editorial com propósito comercial e constância",
    gargalo: "conteúdo sem constância ou direção",
    impacto: "pode limitar alcance, relacionamento e geração de demanda",
    perdendo: "pode estar deixando de atrair e aquecer pessoas que ainda não conhecem o negócio",
    categorias: ["conteudo", "roteiro", "gestao_recorrente"],
    angulo: "conteúdo como fonte de demanda",
    pergunta: "O conteúdo hoje tem um objetivo definido (atrair, educar, vender) e alguém responsável pela rotina?",
    oportunidadeCurta: "Conteúdo com direção costuma virar conversa com cliente, não só curtida.",
    perguntaAbordagem: "O conteúdo já tem um objetivo definido por aí?",
  },
  site: {
    rotulo: "Site",
    problema: "o site pode não estar cumprindo o papel de apresentar a oferta e gerar contatos",
    oportunidade: "estruturar uma página que organize a oferta e conduza o visitante ao contato",
    gargalo: "site que não conduz à ação",
    impacto: "pode reduzir a credibilidade e o aproveitamento de quem já chega até o negócio",
    perdendo: "pode estar perdendo visitantes interessados que saem sem entrar em contato",
    categorias: ["landing_page", "site", "copy"],
    angulo: "aproveitar melhor quem já chega ao site",
    pergunta: "Quantos contatos ou pedidos o site gera por mês hoje — dá para medir?",
    oportunidadeCurta: "Quem chega interessado pode acabar saindo sem um próximo passo claro.",
    perguntaAbordagem: "O site funciona como canal de contatos hoje, ou é mais uma vitrine?",
  },
  conversao: {
    rotulo: "Conversão",
    problema: "o caminho entre o interesse e o contato/compra pode ter atritos",
    oportunidade: "simplificar o caminho até o contato e deixar o próximo passo evidente",
    gargalo: "atrito na conversão",
    impacto: "pode desperdiçar a atenção e o investimento já feitos para atrair pessoas",
    perdendo: "pode estar perdendo quem quase comprou, mas desistiu no caminho",
    categorias: ["landing_page", "loja_virtual", "copy"],
    angulo: "reduzir o atrito entre interesse e contato",
    pergunta: "Onde você sente que as pessoas travam entre demonstrar interesse e fechar?",
    oportunidadeCurta: "Pequenos atritos no caminho podem custar contatos que já estavam quase prontos.",
    perguntaAbordagem: "Onde vocês acham que o interessado costuma travar?",
  },
};

/** Áreas que indicam NECESSIDADE (as demais indicam capacidade/maturidade). */
export const NEED_AREAS: SignalArea[] = [
  "presenca_digital",
  "oferta",
  "posicionamento",
  "conteudo",
  "site",
  "conversao",
];

// ------------------------------------------------------- cadeia de valor

export type ValueChainDef = {
  entregavel: string;
  beneficio: string;
  impacto: string;
  valor: string;
  frase: string;
};

export const VALUE_CHAINS: Record<ServiceCategory, ValueChainDef> = {
  estrategia: {
    entregavel: "Estratégia (diagnóstico, posicionamento e plano de ação)",
    beneficio: "direção clara sobre o que comunicar, para quem e por quê",
    impacto: "menos esforço disperso e decisões de comunicação tomadas com critério",
    valor: "tempo e investimento concentrados no que aproxima o negócio dos clientes certos",
    frase:
      "Vamos definir a direção estratégica — posicionamento, público e prioridades — para que cada ação de comunicação aproxime o negócio do cliente certo, sem esforço disperso.",
  },
  conteudo: {
    entregavel: "Planejamento e produção de conteúdo",
    beneficio: "presença constante e relevante diante do público",
    impacto: "o público passa a conhecer, confiar e lembrar do negócio antes de precisar comprar",
    valor: "uma fonte contínua de atenção qualificada e de relacionamento com potenciais clientes",
    frase:
      "Vamos estruturar um conteúdo com propósito comercial capaz de manter o negócio presente, gerar confiança e abrir conversas com potenciais clientes de forma contínua.",
  },
  branding: {
    entregavel: "Identidade e posicionamento de marca",
    beneficio: "reconhecimento, coerência e diferenciação",
    impacto: "o negócio passa a ser percebido com mais valor e a ser menos comparado apenas por preço",
    valor: "percepção de valor que sustenta melhores negociações e relações mais duradouras",
    frase:
      "Vamos construir uma marca coerente e reconhecível que destaque o diferencial do negócio, eleve a percepção de valor e reduza a comparação puramente por preço.",
  },
  copy: {
    entregavel: "Copy (textos de comunicação e de venda)",
    beneficio: "mensagem clara e persuasiva",
    impacto: "o público entende a oferta e o motivo para agir",
    valor: "melhor aproveitamento da audiência que o negócio já tem",
    frase:
      "Vamos transformar a oferta em uma mensagem clara e persuasiva, para que o público entenda o valor e saiba exatamente qual é o próximo passo.",
  },
  roteiro: {
    entregavel: "Roteiros de vídeo e Reels",
    beneficio: "vídeos com função estratégica em cada trecho",
    impacto: "mais retenção, autoridade e conversas comerciais",
    valor: "vídeos que trabalham a favor do objetivo comercial, não só do alcance",
    frase:
      "Vamos criar roteiros em que cada trecho tem uma função — atrair, gerar confiança e conduzir à conversa — para que o vídeo aproxime o público do objetivo do negócio.",
  },
  site: {
    entregavel: "Site institucional",
    beneficio: "credibilidade e clareza sobre a oferta",
    impacto: "visitantes entendem o que é oferecido e sabem como avançar",
    valor: "presença digital que aumenta a credibilidade e transforma visitantes em oportunidades comerciais",
    frase:
      "Vamos estruturar uma presença digital capaz de aumentar sua credibilidade, organizar sua oferta e transformar visitantes em oportunidades comerciais.",
  },
  landing_page: {
    entregavel: "Landing page de conversão",
    beneficio: "uma oferta, um caminho, uma ação",
    impacto: "quem chega interessado sabe exatamente qual é o próximo passo",
    valor: "melhor aproveitamento do tráfego e das ações de divulgação já existentes",
    frase:
      "Vamos criar uma página focada em uma oferta e uma ação, para que quem chega interessado encontre um caminho simples até o contato e você aproveite melhor a atenção que já conquista.",
  },
  loja_virtual: {
    entregavel: "Loja virtual",
    beneficio: "canal de venda próprio, organizado e confiável",
    impacto: "o cliente compra sem depender de atendimento manual para tudo",
    valor: "vendas com menos fricção operacional e mais previsibilidade",
    frase:
      "Vamos montar um canal de vendas próprio, organizado e confiável, em que o cliente compra com menos atrito e a operação depende menos de atendimento manual.",
  },
  consultoria: {
    entregavel: "Consultoria estratégica",
    beneficio: "orientação especializada para decisões de comunicação e vendas",
    impacto: "menos tentativa e erro e mais decisões embasadas",
    valor: "tempo e investimento poupados ao evitar caminhos errados",
    frase:
      "Vamos orientar suas decisões de comunicação e vendas com método, para que você invista tempo e dinheiro nos caminhos com mais chance de trazer retorno.",
  },
  gestao_recorrente: {
    entregavel: "Gestão recorrente (acompanhamento contínuo)",
    beneficio: "execução constante, ajustada com base em evidências",
    impacto: "aprendizado acumulado e consistência mês a mês",
    valor: "resultado construído com continuidade, em vez de ações isoladas",
    frase:
      "Vamos conduzir a execução de forma contínua, medindo e ajustando o que funciona, para que o resultado seja construído com consistência e não em ações isoladas.",
  },
};

/** Serviços que costumam vir a seguir de outro (trilha de upsell). */
export const UPSELL_PATH: Record<ServiceCategory, ServiceCategory[]> = {
  estrategia: ["conteudo", "branding", "gestao_recorrente"],
  conteudo: ["roteiro", "gestao_recorrente", "landing_page"],
  branding: ["site", "conteudo", "copy"],
  copy: ["landing_page", "site", "conteudo"],
  roteiro: ["conteudo", "gestao_recorrente"],
  site: ["copy", "conteudo", "gestao_recorrente"],
  landing_page: ["copy", "conteudo", "gestao_recorrente"],
  loja_virtual: ["copy", "conteudo", "gestao_recorrente"],
  consultoria: ["estrategia", "gestao_recorrente"],
  gestao_recorrente: ["roteiro", "landing_page", "consultoria"],
};

// ------------------------------------------------------------- objeções

export type ObjectionPlaybook = {
  rotulo: string;
  padroes: RegExp[];
  implicitas: string[];
  pergunta: string;
  resposta: string;
  reforco: string[];
  risco: string[];
  proximoPasso: string;
};

/** Ordem = prioridade de detecção (a primeira que casar é a explícita). */
export const OBJECTION_ORDER: ObjectionKey[] = [
  "esta_caro",
  "preco",
  "orcamento",
  "incerteza_retorno",
  "concorrencia",
  "ja_tenho_fornecedor",
  "socio",
  "autoridade",
  "confianca",
  "risco",
  "nao_vejo_necessidade",
  "prioridade",
  "timing",
  "preciso_pensar",
  "quero_fazer_depois",
];

export const OBJECTIONS: Record<ObjectionKey, ObjectionPlaybook> = {
  esta_caro: {
    rotulo: "Está caro",
    padroes: [/(est[aá]|ficou|achei|[eé]|muito|bem) ?car[oa]/i, /car[oa] demais/i, /salgad/i],
    implicitas: [
      "compara com uma alternativa mais barata sem considerar escopo",
      "não enxerga ainda o retorno que justifica o investimento",
      "o valor está acima do orçamento pensado",
    ],
    pergunta: "Pra eu entender melhor: caro em relação a quê — a outra proposta, ao orçamento que você tinha em mente, ou ao resultado que espera?",
    resposta:
      "Faz sentido olhar com cuidado. Antes de falar de valor, quero ter certeza de que estamos comparando a mesma coisa: escopo, profundidade e acompanhamento. Se você me contar com o que está comparando, consigo te mostrar onde as propostas diferem e ajustar o que fizer sentido para o seu momento.",
    reforco: ["escopo e profundidade do trabalho", "processo e entregáveis definidos", "acompanhamento durante a execução", "impacto esperado sobre o objetivo do negócio"],
    risco: ["propor uma fase inicial menor, com escopo claro", "alinhar por escrito o que está e o que não está incluído"],
    proximoPasso: "Entender a comparação e o orçamento e, em seguida, apresentar uma alternativa de escopo ou de fases.",
  },
  preco: {
    rotulo: "Preço",
    padroes: [/pre[cç]o (est[aá]|[eé]|ficou|pesa|alto|elevado)/i, /valor (alto|elevado)/i, /investimento (alto|elevado)/i, /pesa no (bolso|or[çc]amento)/i, /n[aã]o cabe/i],
    implicitas: [
      "o valor não parece proporcional ao que foi entendido como entrega",
      "não há clareza sobre o impacto esperado",
      "precisa justificar o valor para outra pessoa",
    ],
    pergunta: "Quando você diz que o preço é uma questão, é sobre o valor total, a forma de pagamento ou sobre o que está incluso?",
    resposta:
      "Obrigado por ser direto. Vale separarmos duas coisas: o valor em si e o que ele entrega. Se me disser o que pesa mais para você — o total, a forma de pagamento ou o escopo —, consigo te apresentar opções que respeitem o seu momento sem perder o que realmente move o resultado.",
    reforco: ["o que está incluso e o que muda no negócio", "processo e acompanhamento", "economia de tempo e de retrabalho", "geração de oportunidades e posicionamento"],
    risco: ["começar por uma fase inicial", "definir critérios de sucesso antes de começar"],
    proximoPasso: "Descobrir o que pesa no preço (total, pagamento ou escopo) e apresentar alternativas estruturadas.",
  },
  orcamento: {
    rotulo: "Orçamento",
    padroes: [/n[aã]o (tenho|temos) (dinheiro|grana|verba|or[çc]amento)/i, /sem (verba|caixa|grana|or[çc]amento)/i, /(caixa|or[çc]amento|verba) (est[aá] )?(apertad[oa]|curt[oa]|limitad[oa]|zerad[oa]|fechad[oa]|estourad[oa])/i, /fora do (meu |nosso )?or[çc]amento/i],
    implicitas: ["o investimento não está previsto neste período", "precisa priorizar onde colocar o dinheiro"],
    pergunta: "Você tem uma faixa de investimento em mente para este objetivo? Assim consigo pensar em uma solução que caiba.",
    resposta:
      "Entendo, e é importante trabalharmos dentro da realidade do seu caixa. Se me disser a faixa que faz sentido, eu estruturo uma primeira etapa que traga clareza e direção sem comprometer o orçamento, deixando as demais para quando fizer sentido.",
    reforco: ["priorização do que traz mais retorno primeiro", "etapas que se pagam em clareza e organização"],
    risco: ["etapa inicial de escopo reduzido", "cronograma de entregas alinhado ao fluxo de caixa"],
    proximoPasso: "Obter a faixa de investimento e propor uma fase inicial dentro dela.",
  },
  incerteza_retorno: {
    rotulo: "Não tenho certeza do retorno",
    padroes: [/n[aã]o tenho certeza (do|de|se)/i, /garant(e|ir|ia) (de )?(retorno|resultado)/i, /(ser[aá] que|n[aã]o sei se) (vai )?(vale|compensa|d[aá]|traz)/i, /\broi\b/i],
    implicitas: ["já teve experiência ruim com resultado", "não sabe como o retorno será medido"],
    pergunta: "Que sinal, para você, mostraria que valeu a pena — mais contatos, mais vendas, mais clareza, outro?",
    resposta:
      "Pergunta justa — e não vou prometer o que não posso garantir. O que posso fazer é combinarmos, antes de começar, como o resultado será medido e quais sinais vamos acompanhar, para você decidir com base em evidências e não em promessa.",
    reforco: ["indicadores combinados antes do início", "acompanhamento e ajustes com base em dados", "clareza sobre o que depende de nós e o que depende do mercado"],
    risco: ["definir métricas de sucesso por escrito", "revisar resultados em datas combinadas"],
    proximoPasso: "Definir juntos o critério de sucesso e os indicadores da primeira fase.",
  },
  concorrencia: {
    rotulo: "Concorrência",
    padroes: [/(outr[oa]s?|mais) (propostas?|or[cç]amentos?|cota[cç][oõ]es|ag[eê]ncias?)/i, /cotando/i, /comparando (com|propostas|pre[cç]os)/i, /estou (vendo|olhando) (outras|outros)/i],
    implicitas: ["está comparando principalmente por preço", "não tem critérios claros de escolha"],
    pergunta: "Que critérios você está usando para escolher — preço, prazo, método, confiança na equipe?",
    resposta:
      "É saudável comparar. Para ajudar sua decisão, posso te mostrar o que compõe a nossa proposta — escopo, método e acompanhamento — para você comparar item a item, e não só o valor final.",
    reforco: ["método e processo", "escopo detalhado", "acompanhamento", "diferenciais cadastrados e verificados"],
    risco: ["propor uma reunião de esclarecimento sobre a proposta", "oferecer critérios objetivos de comparação"],
    proximoPasso: "Descobrir os critérios de decisão e comparar escopo e método item a item.",
  },
  ja_tenho_fornecedor: {
    rotulo: "Já tenho fornecedor",
    padroes: [/j[aá] tenho (algu[eé]m|uma ag[eê]ncia|um (freelancer|fornecedor|profissional|designer|social media))/i, /j[aá] (trabalho|contrato|tenho contrato) com/i, /meu (fornecedor|social media|designer|freelancer)/i, /quem (faz|cuida) (isso )?j[aá]/i],
    implicitas: ["há lealdade ou custo de troca", "pode estar satisfeito ou apenas acomodado"],
    pergunta: "O que já funciona bem com quem você trabalha hoje, e o que você gostaria que fosse diferente?",
    resposta:
      "Ótimo que já tenha alguém — isso mostra que você valoriza esse trabalho. Não proponho trocar nada: se houver alguma lacuna que hoje não esteja coberta, posso complementar. Se estiver tudo coberto, sem problema também.",
    reforco: ["complementaridade em vez de substituição", "olhar externo sobre o que já existe"],
    risco: ["propor um diagnóstico pontual, sem compromisso de troca"],
    proximoPasso: "Mapear o que está coberto e o que falta; oferecer um diagnóstico pontual de complemento.",
  },
  socio: {
    rotulo: "Sócio / outra pessoa na decisão",
    padroes: [/(preciso|tenho que|vou) (falar|conversar|ver|alinhar|consultar) com (o |a |meu |minha )?(s[oó]ci[oa]|marido|esposa|parceir[oa])/i, /(s[oó]ci[oa]|marido|esposa) (precisa|tem que|vai) (ver|aprovar|decidir|opinar)/i, /preciso falar com (meu|minha)/i],
    implicitas: ["a decisão é compartilhada e o sócio ainda não foi convencido", "receio de decidir sozinho"],
    pergunta: "O que seu sócio(a) costuma avaliar mais numa decisão como esta? Posso preparar um resumo que facilite essa conversa.",
    resposta:
      "Faz todo sentido decidir junto. Se ajudar, preparo um resumo curto com objetivo, escopo, etapas e investimento, e podemos fazer uma conversa rápida com os dois para esclarecer dúvidas.",
    reforco: ["resumo objetivo para apoiar a decisão", "disponibilidade para esclarecer diretamente"],
    risco: ["reunião com todos os decisores", "proposta em formato fácil de compartilhar"],
    proximoPasso: "Agendar conversa com todos os decisores ou enviar resumo executivo e definir data de retorno.",
  },
  autoridade: {
    rotulo: "Autoridade (não decido sozinho)",
    padroes: [/n[aã]o (sou|fui) eu (quem )?(decide|decido)/i, /n[aã]o decido/i, /quem decide/i, /preciso (da )?aprova[cç][aã]o/i, /tenho que (falar|consultar|ver) com (o |a )?(chefe|diretor|gerente|dono|dona)/i],
    implicitas: ["quem conversa comigo não é quem decide", "precisa de argumentos para levar adiante"],
    pergunta: "Quem mais participa dessa decisão e o que essa pessoa precisa ver para se sentir segura?",
    resposta:
      "Entendo. Para facilitar, posso montar um material com o problema, a solução e o investimento — e, se fizer sentido, participar de uma conversa com quem decide para responder direto às dúvidas.",
    reforco: ["material de apoio à decisão", "participação na conversa com o decisor"],
    risco: ["reunião com o decisor", "proposta clara e autoexplicativa"],
    proximoPasso: "Identificar o decisor e o que ele precisa; propor conversa ou material de apoio.",
  },
  confianca: {
    rotulo: "Confiança",
    padroes: [/n[aã]o (tenho|sinto|teria) confian[cç]a/i, /falta de confian[cç]a/i, /n[aã]o te conhe[cç]o/i, /n[aã]o conhe[cç]o (a |o |voc)/i, /(preciso de|pe[cç]o|quero) refer[eê]ncias?/i, /j[aá] (me )?(queimei|fui enganad)/i, /deu errado (antes|com)/i, /muitas? promessas?/i],
    implicitas: ["teve experiência ruim anterior", "precisa de evidência antes de se comprometer"],
    pergunta: "O que faria você se sentir seguro para seguir — ver trabalhos anteriores, entender melhor o processo, começar por algo menor?",
    resposta:
      "É natural querer segurança antes de decidir. O que posso fazer é mostrar como trabalhamos, o que já foi documentado e propor um começo menor, para você conhecer o processo antes de assumir um compromisso maior.",
    reforco: ["processo transparente", "trabalhos e provas verificados e cadastrados", "primeira etapa de baixo risco"],
    risco: ["fase inicial curta com entregável claro", "alinhamento de expectativas por escrito"],
    proximoPasso: "Apresentar processo e provas reais cadastradas e propor uma etapa inicial de baixo risco.",
  },
  risco: {
    rotulo: "Risco",
    padroes: [/e se n[aã]o (der|funcionar|gostar)/i, /arriscad/i, /\b(muito|alto|grande) risco\b/i, /tenho (medo|receio)/i],
    implicitas: ["medo de perder dinheiro ou tempo", "não sabe o que acontece se não gostar"],
    pergunta: "Qual é o risco que mais te preocupa: financeiro, de prazo ou de não ficar como você imagina?",
    resposta:
      "Entendo a preocupação. O melhor jeito de reduzir risco é dividir o trabalho em etapas com entregáveis claros e pontos de validação, para você ver o que foi feito antes de avançar.",
    reforco: ["etapas com validação", "escopo e entregáveis descritos por escrito"],
    risco: ["contrato por fase", "alinhamento de aprovações ao longo do projeto"],
    proximoPasso: "Propor um plano por fases com pontos de aprovação.",
  },
  nao_vejo_necessidade: {
    rotulo: "Não vejo necessidade",
    padroes: [/n[aã]o (vejo|preciso|acho necess)/i, /n[aã]o (\w+ )?(faz|fazem) falta/i, /est[aá] tudo (bem|ok)/i, /n[aã]o tenho (essa )?necessidade/i],
    implicitas: ["ainda não percebeu o custo de não agir", "o problema não está visível para ele"],
    pergunta: "Se pudesse mudar uma coisa na forma como novos clientes chegam até você, qual seria?",
    resposta:
      "Justo — se está funcionando, não há por que mexer. Só queria entender melhor: há algo em como os clientes chegam hoje que você gostaria que fosse mais previsível ou mais simples?",
    reforco: ["observações reais sobre a presença atual do negócio", "oportunidades ainda não exploradas (como hipótese a validar)"],
    risco: ["conversa de diagnóstico sem compromisso"],
    proximoPasso: "Compartilhar uma observação concreta (rotulada como hipótese) e perguntar se faz sentido explorar.",
  },
  prioridade: {
    rotulo: "Prioridade",
    padroes: [/outras prioridades/i, /n[aã]o [eé] (a |minha )?prioridade/i, /outras (coisas|demandas)/i, /tenho (outras|muita coisa)/i, /foco (agora )?est[aá] (em|no|na)/i, /n[aã]o [eé] (o )?foco/i],
    implicitas: ["existe algo mais urgente", "não vê este tema como estratégico agora"],
    pergunta: "O que está no topo da sua lista agora, e como isso se relaciona com atrair ou reter clientes?",
    resposta:
      "Faz sentido ter prioridades. Só vale checar se este tema pode ajudar naquilo que já é prioridade — se não ajudar, é melhor esperar mesmo. Qual é o principal objetivo do negócio nos próximos meses?",
    reforco: ["conexão com o objetivo prioritário do negócio", "custo de adiar (apenas o que for possível fundamentar)"],
    risco: ["começar por uma etapa leve que não disputa tempo da equipe"],
    proximoPasso: "Ligar o tema à prioridade atual ou combinar novo contato em data definida.",
  },
  timing: {
    rotulo: "Timing",
    padroes: [/momento (errado|ruim|n[aã]o)/i, /n[aã]o [eé] (a )?hora/i, /ano que vem/i, /m[eê]s que vem/i, /mais pra frente|mais para frente/i, /agora n[aã]o/i, /final do ano/i, /depois das (festas|f[eé]rias)/i],
    implicitas: ["há algo bloqueando agora (caixa, agenda, equipe)", "pode ser uma forma educada de dizer não"],
    pergunta: "O que precisaria acontecer para ser um bom momento — e quando isso costuma acontecer?",
    resposta:
      "Sem problema, timing importa. Para não deixar o assunto se perder, podemos combinar uma data para retomar e, até lá, eu deixo um resumo do que vimos. O que precisa acontecer para fazer sentido começar?",
    reforco: ["custo de esperar, se houver evidência real", "possibilidade de começar em escopo menor"],
    risco: ["data de retomada combinada", "início em etapa leve"],
    proximoPasso: "Combinar data e condição concreta de retomada.",
  },
  preciso_pensar: {
    rotulo: "Preciso pensar",
    padroes: [/preciso pensar/i, /vou pensar/i, /deixa eu pensar/i, /vou analisar/i, /preciso avaliar/i, /me d[aá] um tempo/i],
    implicitas: ["há uma dúvida não dita", "pode faltar clareza, confiança ou orçamento"],
    pergunta: "Claro. Para eu te ajudar a pensar: existe algum ponto específico que ainda ficou em aberto?",
    resposta:
      "Claro, é uma decisão que merece reflexão. Para ajudar, me diz o que ainda ficou em aberto — valor, escopo, prazo ou confiança — e eu trago as informações que faltam. Podemos também marcar um retorno rápido para você decidir com tudo claro.",
    reforco: ["resumo objetivo do que foi combinado", "clareza sobre o próximo passo"],
    risco: ["data de retorno combinada", "canal aberto para dúvidas"],
    proximoPasso: "Identificar a dúvida real e combinar data de retorno.",
  },
  quero_fazer_depois: {
    rotulo: "Quero fazer depois",
    padroes: [/(fazer|resolver|ver|come[cç]ar|contratar|fechar|decidir) (isso |tudo )?(depois|mais tarde)/i, /deix(a|ar|o) (isso )?pra depois/i, /outro momento/i, /te (aviso|chamo|procuro) (depois|mais tarde)/i, /retorno (depois|mais)/i],
    implicitas: ["falta urgência percebida", "não vê custo em adiar"],
    pergunta: "Tem algum motivo específico para deixar para depois — algo que precisa acontecer antes?",
    resposta:
      "Tranquilo. Só para não perdermos o fio: o que precisa acontecer antes para fazer sentido começar? Combinamos uma data de retomada e eu deixo tudo organizado.",
    reforco: ["custo de adiar, apenas se fundamentável", "possibilidade de começar em etapa menor"],
    risco: ["data de retomada", "materiais prontos para quando decidir"],
    proximoPasso: "Combinar data de retomada e a condição para avançar.",
  },
};

// --------------------------------------------- perguntas de descoberta

export type DiscoveryFieldDef = {
  rotulo: string;
  padroes: RegExp[];
  /** Perguntas por campo (finalidade comercial explícita). */
  pergunta: (nicho: string, contexto: string) => string;
  finalidade: string;
  critico: boolean;
  prioridade: number;
};

export const DISCOVERY_FIELDS: Record<DiscoveryFieldKey, DiscoveryFieldDef> = {
  querer: {
    rotulo: "O que o lead quer",
    padroes: [/quero|queria|gostaria|preciso|busco|procuro|estou (atr[aá]s|querendo)|\b(resolver|organizar|melhorar|aumentar)\b/i],
    pergunta: (n) => `O que você gostaria que fosse diferente no seu negócio de ${n.toLowerCase()} nos próximos meses?`,
    finalidade: "Definir o objetivo declarado (o que ele quer) antes de propor solução.",
    critico: false,
    prioridade: 2,
  },
  porque: {
    rotulo: "Por que quer",
    padroes: [/o motivo|motivo ([eé]|foi|disso)|para que|pra que|por isso|[eé] importante (pra|para)/i],
    pergunta: () => "Por que isso é importante para você agora?",
    finalidade: "Entender a motivação real por trás do pedido (o porquê).",
    critico: false,
    prioridade: 4,
  },
  problema: {
    rotulo: "Problema a resolver",
    padroes: [/problema|dificuldade|n[aã]o consigo|dif[ií]cil|falta|n[aã]o tenho|trava|gargalo|n[aã]o [eé] (constante|claro)|n[aã]o (acha|encontra|sabe)|complicad|confus|bagun[cç]/i, /\bperd(e|em|emos|endo|i|eu)\b/i],
    pergunta: (n, c) => c ? `Notei que ${c} Isso também incomoda no dia a dia, ou não é um problema para vocês?` : `Qual é hoje a maior dificuldade para conseguir mais clientes no seu negócio de ${n.toLowerCase()}?`,
    finalidade: "Confirmar (ou refutar) as hipóteses de dor com as palavras do próprio lead.",
    critico: true,
    prioridade: 1,
  },
  impacto: {
    rotulo: "Impacto do problema",
    padroes: [/\bperd(e|em|emos|endo|i|eu)\b|deixo de|deixamos de|deixa(m)? de|preju[ií]zo|custa|queda|caiu|a menos|impacta|afeta/i],
    pergunta: () => "Na prática, o que isso tem custado ou limitado no seu negócio hoje?",
    finalidade: "Dimensionar o custo do problema para justificar prioridade e investimento.",
    critico: true,
    prioridade: 2,
  },
  custo: {
    rotulo: "Custo do problema (valor)",
    padroes: [/R\$\s?\d|\d+\s?(mil|reais)|por m[eê]s|por semana/i],
    pergunta: () => "Se você tivesse que estimar, quanto isso representa por mês em vendas que deixam de acontecer?",
    finalidade: "Obter uma ordem de grandeza (informada pelo lead) do custo de não agir.",
    critico: false,
    prioridade: 6,
  },
  resultadoEsperado: {
    rotulo: "Resultado esperado",
    padroes: [/espero|meta|objetivo|quero (chegar|ter|aumentar|dobrar)|resultado|onde quero chegar/i],
    pergunta: () => "Se isso der certo, como você saberá que valeu a pena? O que precisaria mudar?",
    finalidade: "Fixar o critério de sucesso para ancorar valor e proposta.",
    critico: true,
    prioridade: 3,
  },
  urgencia: {
    rotulo: "Urgência",
    padroes: [/urgente|logo|at[eé] (o )?(m[eê]s|semana|dia)|essa semana|antes d[eo]|prazo|inaugura|lan[cç]amento|pra ontem/i],
    pergunta: () => "Existe alguma data ou evento que faz este tema ser urgente?",
    finalidade: "Identificar prazo real (sem criar urgência artificial).",
    critico: false,
    prioridade: 5,
  },
  prioridade: {
    rotulo: "Prioridade",
    padroes: [/prioridade|mais importante|primeiro|agora n[aã]o|no topo/i],
    pergunta: () => "De 0 a 10, quão prioritário é resolver isso agora, e o que disputa esse lugar?",
    finalidade: "Medir a prioridade frente a outras demandas e prever objeção de prioridade.",
    critico: false,
    prioridade: 5,
  },
  investimento: {
    rotulo: "Investimento",
    padroes: [/or[cç]amento|investir|budget|verba|quanto custa|valor|R\$\s?\d/i],
    pergunta: () => "Você já tem uma faixa de investimento em mente para resolver isso?",
    finalidade: "Alinhar expectativa de investimento antes da proposta.",
    critico: true,
    prioridade: 6,
  },
  autoridadeDeDecisao: {
    rotulo: "Autoridade de decisão",
    padroes: [/eu decido|decis[aã]o [eé] minha|sou (o |a )?(dono|dona|s[oó]cio|respons[aá]vel)|quem decide|aprova[cç][aã]o/i],
    pergunta: () => "Como costuma ser a decisão numa contratação como esta — é você quem decide?",
    finalidade: "Confirmar se está falando com quem decide.",
    critico: true,
    prioridade: 4,
  },
  outrosDecisores: {
    rotulo: "Outros decisores",
    padroes: [/s[oó]ci[oa]|marido|esposa|diretor|conselho|contador|falar com/i],
    pergunta: () => "Mais alguém participa dessa decisão? Se sim, o que essa pessoa costuma avaliar?",
    finalidade: "Antecipar objeção de sócio/autoridade e preparar material para eles.",
    critico: false,
    prioridade: 7,
  },
  solucoesJaTentadas: {
    rotulo: "Soluções já tentadas",
    padroes: [/j[aá] (tentei|contratei|usei|fiz)|tinha (uma|um) (ag[eê]ncia|freelancer)|fornecedor|deu errado/i],
    pergunta: () => "O que você já tentou para resolver isso e o que aconteceu?",
    finalidade: "Evitar repetir o que falhou e entender o que ele valoriza ou rejeita.",
    critico: false,
    prioridade: 7,
  },
};

// ------------------------------------------------------- roteiro (15 passos)

export type ScriptStepDef = {
  etapa: string;
  campos?: DiscoveryFieldKey[];
  objetivo: string;
  tipo: "discovery" | "apresentacao" | "fixo";
};

export const SCRIPT_STEPS: ScriptStepDef[] = [
  { etapa: "Contexto", objetivo: "Alinhar o objetivo da reunião e o tempo disponível.", tipo: "fixo" },
  { etapa: "Rapport", objetivo: "Criar conexão genuína a partir de algo real sobre o negócio.", tipo: "fixo" },
  { etapa: "Entendimento da situação", campos: ["querer", "porque", "solucoesJaTentadas"], objetivo: "Entender o cenário atual nas palavras do lead.", tipo: "discovery" },
  { etapa: "Dor", campos: ["problema"], objetivo: "Nomear o problema principal com as palavras do próprio lead.", tipo: "discovery" },
  { etapa: "Impacto", campos: ["impacto", "custo"], objetivo: "Dimensionar o que o problema custa ou limita.", tipo: "discovery" },
  { etapa: "Objetivo", campos: ["resultadoEsperado"], objetivo: "Definir o resultado esperado e o critério de sucesso.", tipo: "discovery" },
  { etapa: "Prioridade", campos: ["prioridade", "urgencia"], objetivo: "Confirmar prioridade e prazo reais.", tipo: "discovery" },
  { etapa: "Investimento", campos: ["investimento"], objetivo: "Alinhar a faixa de investimento antes de propor.", tipo: "discovery" },
  { etapa: "Autoridade de decisão", campos: ["autoridadeDeDecisao", "outrosDecisores"], objetivo: "Saber quem decide e quem mais precisa ser convencido.", tipo: "discovery" },
  { etapa: "Solução", objetivo: "Apresentar a solução como resposta direta ao problema confirmado.", tipo: "apresentacao" },
  { etapa: "Demonstração de valor", objetivo: "Conectar entregável → benefício → impacto → valor ao objetivo do lead.", tipo: "apresentacao" },
  { etapa: "Redução de risco", objetivo: "Mostrar processo, etapas, critérios de sucesso e provas verificadas.", tipo: "apresentacao" },
  { etapa: "Investimento (apresentação)", objetivo: "Apresentar o investimento ancorado no valor e nas opções disponíveis.", tipo: "apresentacao" },
  { etapa: "Tratamento de objeções", objetivo: "Entender a causa de cada objeção antes de responder.", tipo: "apresentacao" },
  { etapa: "Próximo passo", objetivo: "Sair com um próximo passo concreto, data e responsável.", tipo: "fixo" },
];
