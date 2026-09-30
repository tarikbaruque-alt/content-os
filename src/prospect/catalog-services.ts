import type { ServiceKey } from "./types.js";

export type ServiceDef = {
  key: ServiceKey;
  nome: string;
  recorrente: boolean;
  /** entrada = porta de entrada · nucleo = contrato principal · expansao = complemento. */
  papel: "entrada" | "nucleo" | "expansao";
  entregavel: string;
  beneficio: string;
  impacto: string;
  valorComercial: string;
  /** Frase de valor pronta: é ISSO que se diz — nunca "N posts por mês". */
  frase: string;
};

export const SERVICES: ServiceDef[] = [
  {
    key: "gestao_redes", nome: "Gestão de redes sociais", recorrente: true, papel: "nucleo",
    entregavel: "Operação estratégica do Instagram (planejamento, criação, publicação e acompanhamento)",
    beneficio: "presença coordenada, com objetivo, em vez de postagens soltas",
    impacto: "o perfil passa a comunicar posicionamento e autoridade de forma consistente",
    valorComercial: "o Instagram deixa de ser vitrine e vira um ativo que gera oportunidades comerciais",
    frase: "Uma operação estratégica para transformar o Instagram em um ativo de posicionamento, autoridade e geração de oportunidades.",
  },
  {
    key: "estrategia_conteudo", nome: "Estratégia de conteúdo", recorrente: false, papel: "entrada",
    entregavel: "Estratégia de conteúdo (objetivos, público, pilares e linha editorial)",
    beneficio: "clareza sobre o que comunicar, para quem e com qual objetivo",
    impacto: "cada conteúdo passa a ter função: atrair, educar, gerar confiança ou converter",
    valorComercial: "comunicação que trabalha a favor do posicionamento e da aquisição, e não de ideias soltas",
    frase: "Uma estratégia que define o que comunicar, para quem e com qual objetivo, para que cada conteúdo tenha função dentro do seu posicionamento e da aquisição de clientes.",
  },
  {
    key: "planejamento_conteudo", nome: "Planejamento de conteúdo", recorrente: true, papel: "nucleo",
    entregavel: "Planejamento mensal de conteúdo",
    beneficio: "decisões tomadas antes da produção, não na hora de postar",
    impacto: "menos improviso e mais consistência ao longo do mês",
    valorComercial: "tempo e energia da equipe voltados ao que realmente move o negócio",
    frase: "Um planejamento que resolve com antecedência o que comunicar e quando, para que a rotina do conteúdo deixe de ser correria e passe a servir aos seus objetivos.",
  },
  {
    key: "calendario_editorial", nome: "Calendário editorial", recorrente: true, papel: "nucleo",
    entregavel: "Calendário editorial mensal",
    beneficio: "uma estrutura de conteúdo definida com antecedência",
    impacto: "a comunicação deixa de depender de ideias de última hora e passa a trabalhar objetivos específicos",
    valorComercial: "posicionamento e aquisição trabalhados de forma intencional, mês a mês",
    frase: "Uma estrutura mensal de conteúdo para que sua comunicação deixe de depender de ideias de última hora e passe a trabalhar objetivos específicos de posicionamento e aquisição.",
  },
  {
    key: "criacao_conteudo", nome: "Criação de conteúdo", recorrente: true, papel: "nucleo",
    entregavel: "Criação dos conteúdos (textos, roteiros, direção e peças)",
    beneficio: "conteúdo profissional produzido sem sobrecarregar sua rotina",
    impacto: "o perfil mantém padrão e regularidade sem depender do seu tempo",
    valorComercial: "presença profissional constante, que sustenta a percepção de valor do seu serviço",
    frase: "Conteúdos criados com padrão profissional e direção estratégica, para que você mantenha uma presença constante sem transformar o Instagram em mais uma tarefa da sua rotina.",
  },
  {
    key: "copywriting", nome: "Copywriting", recorrente: false, papel: "expansao",
    entregavel: "Copy de bio, legendas e chamadas",
    beneficio: "mensagens claras sobre o que você oferece e por que importa",
    impacto: "o público entende o valor e sabe qual é o próximo passo",
    valorComercial: "mais aproveitamento da atenção que o perfil já conquista",
    frase: "Textos que traduzem o que você faz em valor claro para o cliente e indicam o próximo passo, para que a atenção que o perfil já recebe se transforme em conversas.",
  },
  {
    key: "roteiros_video", nome: "Roteiros para vídeos", recorrente: true, papel: "expansao",
    entregavel: "Roteiros de vídeo com função definida em cada trecho",
    beneficio: "clareza do que falar, em que ordem e com qual objetivo",
    impacto: "vídeos mais claros e mais fáceis de gravar",
    valorComercial: "conhecimento técnico convertido em conteúdo que prende atenção e gera confiança",
    frase: "Roteiros pensados para transformar conhecimento técnico em conteúdos mais claros, interessantes e capazes de reter atenção.",
  },
  {
    key: "reels", nome: "Reels", recorrente: true, papel: "expansao",
    entregavel: "Estratégia e roteiros de Reels",
    beneficio: "formato de alcance trabalhado com intenção",
    impacto: "mais chance de o conteúdo chegar a quem ainda não conhece o perfil",
    valorComercial: "novas pessoas descobrindo o negócio pelo seu conhecimento",
    frase: "Reels planejados para levar o seu conhecimento a pessoas que ainda não conhecem o seu trabalho e conduzi-las até o perfil.",
  },
  {
    key: "carrosseis", nome: "Carrosséis", recorrente: true, papel: "expansao",
    entregavel: "Carrosséis educativos e de consideração",
    beneficio: "conteúdo aprofundado que explica e convence",
    impacto: "o público entende, guarda e compartilha o que você sabe",
    valorComercial: "autoridade construída com conteúdo que ajuda na decisão",
    frase: "Carrosséis que explicam o que você sabe de forma clara e organizada, para que o público entenda o seu valor antes mesmo de falar com você.",
  },
  {
    key: "stories", nome: "Stories", recorrente: true, papel: "expansao",
    entregavel: "Estratégia e sequências de Stories",
    beneficio: "relacionamento contínuo com quem já acompanha",
    impacto: "mais proximidade e confiança até o momento da decisão",
    valorComercial: "audiência aquecida, pronta para conversar quando precisar",
    frase: "Sequências de Stories com objetivo definido, para aproximar quem já acompanha o perfil e conduzi-lo com naturalidade até a conversa.",
  },
  {
    key: "posicionamento_digital", nome: "Posicionamento digital", recorrente: false, papel: "entrada",
    entregavel: "Definição de posicionamento e narrativa do perfil",
    beneficio: "clareza sobre para quem você é e o que o diferencia",
    impacto: "quem chega ao perfil entende rápido por que faz sentido te escolher",
    valorComercial: "clientes mais alinhados e menos comparação apenas por preço",
    frase: "Um posicionamento claro, que deixa evidente para quem você é e o que o diferencia, para atrair clientes mais alinhados e reduzir a comparação apenas por preço.",
  },
  {
    key: "branding_conteudo", nome: "Branding de conteúdo", recorrente: false, papel: "expansao",
    entregavel: "Identidade de conteúdo (linguagem, visual e padrões)",
    beneficio: "reconhecimento e coerência em cada publicação",
    impacto: "o perfil passa a ser lembrado e reconhecido",
    valorComercial: "uma marca que transmite o nível do serviço antes da primeira conversa",
    frase: "Uma identidade de conteúdo consistente, que faz o perfil ser reconhecido e comunica o nível do seu serviço antes mesmo da primeira conversa.",
  },
  {
    key: "consultoria_conteudo", nome: "Consultoria de conteúdo", recorrente: false, papel: "entrada",
    entregavel: "Consultoria de conteúdo (diagnóstico e orientação)",
    beneficio: "direção especializada para decisões de conteúdo",
    impacto: "menos tentativa e erro e mais decisões embasadas",
    valorComercial: "tempo e investimento poupados ao evitar caminhos sem retorno",
    frase: "Orientação especializada para decisões de conteúdo, com diagnóstico e prioridades claras, para investir tempo e esforço no que tem mais chance de gerar retorno.",
  },
  {
    key: "gestao_mensal_conteudo", nome: "Gestão mensal de conteúdo", recorrente: true, papel: "nucleo",
    entregavel: "Gestão mensal contínua do conteúdo (planejar, criar, publicar, medir e ajustar)",
    beneficio: "execução constante, ajustada com base no que funciona",
    impacto: "aprendizado acumulado e consistência mês a mês",
    valorComercial: "resultado construído com continuidade, em vez de ações isoladas",
    frase: "Uma gestão contínua do conteúdo — planejar, criar, publicar, medir e ajustar — para que o resultado seja construído com consistência e não em ações isoladas.",
  },
  {
    key: "analise_metricas", nome: "Análise de métricas", recorrente: true, papel: "expansao",
    entregavel: "Análise mensal de métricas com recomendações",
    beneficio: "clareza sobre o que funciona e o que ajustar",
    impacto: "decisões de conteúdo baseadas em evidências",
    valorComercial: "esforço concentrado no que aproxima o perfil dos seus objetivos",
    frase: "Uma leitura periódica dos resultados que mostra o que está funcionando e o que precisa mudar, para que as próximas decisões de conteúdo sejam baseadas em evidências.",
  },
  {
    key: "otimizacao_mensal", nome: "Otimização mensal", recorrente: true, papel: "expansao",
    entregavel: "Otimização mensal da estratégia e dos conteúdos",
    beneficio: "ajustes contínuos a partir dos resultados",
    impacto: "a estratégia evolui a cada ciclo em vez de ficar parada",
    valorComercial: "operação que melhora com o tempo e protege o investimento",
    frase: "Ajustes mensais na estratégia e nos conteúdos a partir do que os resultados mostram, para que a operação melhore a cada ciclo e proteja o seu investimento.",
  },
];
export const SERVICE_BY_KEY = Object.fromEntries(SERVICES.map((s) => [s.key, s])) as Record<ServiceKey, (typeof SERVICES)[number]>;
