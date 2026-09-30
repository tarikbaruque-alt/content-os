import type { ArgKey } from "./types.js";

export type ArgumentDef = {
  key: ArgKey;
  rotulo: string;
  tese: string;
  comoUsar: string;
  frases: string[];
  /** IDs de gargalo que pedem este argumento. */
  gargalos: string[];
  /** Objetivos (chaves) em que ele pesa mais. */
  objetivos: string[];
};

/** Banco de argumentos para serviços de conteúdo. Sem números e sem promessa de resultado. */
export const ARGUMENTS: ArgumentDef[] = [
  { key: "posicionamento", rotulo: "POSICIONAMENTO",
    tese: "Quando o perfil deixa claro para quem é e o que o diferencia, quem chega entende rápido por que faz sentido te seguir e te procurar.",
    comoUsar: "Use quando bio, oferta ou linguagem estiverem genéricas. Peça para o lead explicar em uma frase o que faz o cliente escolhê-lo.",
    frases: ["Hoje o perfil mostra o que você faz, mas talvez não deixe tão claro por que escolher você.", "Posicionamento é decidir o que você quer ser lembrado por fazer."],
    gargalos: ["sem_posicionamento", "estetica_sem_valor", "bio_fraca"], objetivos: ["melhorar_posicionamento", "atrair_clientes_melhores", "construir_marca"] },
  { key: "autoridade", rotulo: "AUTORIDADE",
    tese: "Conhecimento técnico só vira autoridade quando é transformado em conteúdo que as pessoas conseguem entender, guardar e compartilhar.",
    comoUsar: "Use quando o lead domina o assunto, mas o perfil mostra pouco disso. Conecte ao que ele já sabe, sem inventar credenciais.",
    frases: ["O conhecimento já existe; falta transformá-lo em conteúdo que trabalhe por você.", "Autoridade não é dizer que sabe; é mostrar de um jeito que o outro entenda."],
    gargalos: ["autoridade_nao_convertida", "sem_prova_social"], objetivos: ["aumentar_autoridade", "atrair_clientes_melhores"] },
  { key: "consistencia", rotulo: "CONSISTÊNCIA",
    tese: "Presença constante mantém o negócio na lembrança de quem ainda não está pronto para comprar.",
    comoUsar: "Use quando houver pausas ou baixa frequência. Foque em rotina viável, não em volume.",
    frases: ["Quem não está pronto para contratar hoje lembra de quem aparece com regularidade.", "Constância é o que transforma conteúdo em hábito de quem acompanha."],
    gargalos: ["baixa_frequencia"], objetivos: ["aumentar_reconhecimento", "criar_comunidade"] },
  { key: "profissionalizacao", rotulo: "PROFISSIONALIZAÇÃO",
    tese: "A forma como o perfil se apresenta comunica o nível do serviço antes de qualquer conversa.",
    comoUsar: "Use quando o serviço é bom, mas a apresentação não acompanha. Fale de padrão, não de estética pela estética.",
    frases: ["O perfil é a primeira reunião com quem ainda não te conhece.", "Quanto mais profissional a apresentação, menos você precisa explicar o valor do que faz."],
    gargalos: ["qualidade_baixa", "cabecalho_fraco"], objetivos: ["profissionalizar_presenca", "construir_marca"] },
  { key: "tempo", rotulo: "TEMPO",
    tese: "Quem produz o conteúdo sozinho usa tempo que poderia estar no que só você faz.",
    comoUsar: "Use quando o lead produz internamente ou reclama de rotina. Mostre o que sai da mão dele e o que continua com ele.",
    frases: ["O conteúdo precisa acontecer sem competir com o seu atendimento.", "A ideia não é te substituir; é tirar o peso de planejar e produzir."],
    gargalos: ["baixa_frequencia", "sem_estrategia"], objetivos: ["profissionalizar_presenca"] },
  { key: "estrategia", rotulo: "ESTRATÉGIA",
    tese: "Sem objetivo definido, cada postagem é uma aposta isolada; com estratégia, cada uma tem função.",
    comoUsar: "Use quando há produção, mas sem direção. Pergunte se há estratégia por trás dos conteúdos.",
    frases: ["Produzir conteúdo é diferente de ter uma estratégia de conteúdo.", "Cada publicação deveria responder: para quem é e para quê."],
    gargalos: ["sem_estrategia", "institucional"], objetivos: ["gerar_leads", "vender", "melhorar_posicionamento"] },
  { key: "aquisicao", rotulo: "AQUISIÇÃO",
    tese: "O Instagram pode ser um canal que aproxima potenciais clientes antes mesmo do primeiro contato.",
    comoUsar: "Use quando o lead depende de indicação ou não vê o Instagram gerar oportunidades.",
    frases: ["Indicação é ótimo; o Instagram pode ser a vitrine em que quem foi indicado confere quem você é.", "Conteúdo bem direcionado prepara o cliente antes de ele falar com você."],
    gargalos: ["pouco_comercial", "baixo_alcance", "dependencia_indicacao", "pouco_encontravel"], objetivos: ["gerar_leads", "vender", "atrair_clientes_melhores"] },
  { key: "conversao", rotulo: "CONVERSÃO",
    tese: "Interesse sem próximo passo claro se perde; o conteúdo precisa conduzir a uma ação.",
    comoUsar: "Use quando faltam CTA, oferta clara ou conteúdo de decisão. Não confunda com empurrar venda.",
    frases: ["Quem chega interessado precisa saber o que fazer em seguida.", "Conteúdo que educa e também indica o caminho tende a aproveitar melhor a atenção."],
    gargalos: ["pouco_comercial", "oferta_sem_desejo", "bio_fraca"], objetivos: ["gerar_leads", "vender"] },
  { key: "marca", rotulo: "MARCA",
    tese: "Uma marca reconhecível é lembrada e escolhida com mais facilidade.",
    comoUsar: "Use quando visual e linguagem variam de post para post ou não representam o negócio.",
    frases: ["Reconhecimento se constrói com repetição coerente.", "A marca aparece em cada detalhe: visual, tom e temas."],
    gargalos: ["qualidade_baixa", "sem_humanizacao", "sem_posicionamento"], objetivos: ["construir_marca", "aumentar_reconhecimento", "criar_comunidade"] },
  { key: "diferenciacao", rotulo: "DIFERENCIAÇÃO",
    tese: "Quando tudo parece igual, a decisão vai para o preço; diferenciar é dar outro critério de escolha.",
    comoUsar: "Use com lead que compara fornecedores ou atua em nicho saturado. Só cite diferenciais cadastrados por você.",
    frases: ["Se o concorrente falasse o mesmo que você, o cliente saberia escolher?", "Diferenciar é dar ao cliente um motivo além do preço."],
    gargalos: ["sem_posicionamento", "estetica_sem_valor", "oferta_sem_desejo"], objetivos: ["atrair_clientes_melhores", "melhorar_posicionamento"] },
];
export const ARG_BY_KEY = Object.fromEntries(ARGUMENTS.map((a) => [a.key, a])) as Record<ArgKey, (typeof ARGUMENTS)[number]>;
