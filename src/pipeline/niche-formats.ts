import { FORMATOS, FORMATO_BY_KEY } from "./formats.js";

/**
 * Guia de formatos POR NICHO (Musa). A recomendação por função estratégica
 * (formats.ts) diz COMO uma peça deve narrar; este guia diz, para o nicho do
 * cliente, quais formatos devem ser o carro-chefe do perfil, em que proporção
 * de superfícies, com que produção e cadência — e o que evitar.
 *
 * São heurísticas de mercado (INFERÊNCIA, não fato): o guia orienta o começo
 * e deve ser ajustado com os dados reais de Performance (Pulso).
 */
export type NichePapel = "Carro-chefe" | "Apoio" | "Pontual";
export type NicheFormatPick = { key: string; papel: NichePapel; porque: string; comoFazer: string };
/** Prática a evitar; `key` liga o alerta a um formato da biblioteca, quando houver. */
export type NicheAvoid = { pratica: string; porque: string; key?: string };
export type SurfaceShare = { superficie: string; pct: number };

export type NicheProfile = {
  key: string;
  nome: string;
  /** Radicais (sem acento, minúsculos) que identificam o nicho no texto. */
  match: string[];
  /** Como o público deste nicho consome conteúdo e decide. */
  leitura: string;
  /** Formatos em ordem de prioridade (carro-chefe primeiro). */
  formatos: NicheFormatPick[];
  /** Proporção sugerida de superfícies (soma 100). */
  superficies: SurfaceShare[];
  producao: { nivel: string; porque: string };
  cadencia: string;
  /** Quadros recorrentes sugeridos. */
  series: string[];
  evitar: NicheAvoid[];
  /** Cuidados éticos/regulatórios — confira sempre a regra vigente do conselho. */
  cuidados: string[];
};

/** Encaixe de cada formato da biblioteca no nicho do cliente. */
export type FormatFit = NichePapel | "Com cuidado" | "Livre";

export type FormatGuide = {
  nichoKey: string;
  nicho: string;
  /** Trecho do Content DNA/cadastro que identificou o nicho ("" se genérico). */
  detectadoPor: string;
  generico: boolean;
  leitura: string;
  formatos: (NicheFormatPick & { nome: string; descricao: string; superficie: string; producao: string })[];
  superficies: SurfaceShare[];
  producao: { nivel: string; porque: string };
  cadencia: string;
  series: string[];
  evitar: NicheAvoid[];
  cuidados: string[];
  /** Todas as opções da biblioteca, com o encaixe neste nicho. */
  opcoes: { key: string; nome: string; descricao: string; superficie: string; producao: string; fit: FormatFit; nota?: string }[];
  aviso: string;
};

export const NICHE_PROFILES: NicheProfile[] = [
  {
    key: "psicologia",
    nome: "Psicologia & terapia",
    match: ["psicolog", "psicoterap", "terapeut", "terapia", "psicanal", "saude mental", "ansiedade", "autoconhecimento", "neuropsic"],
    leitura: "A pessoa precisa se sentir compreendida antes de buscar ajuda. Identificação e acolhimento abrem a porta; a decisão de marcar a sessão vem depois de muita confiança acumulada.",
    formatos: [
      { key: "pov", papel: "Carro-chefe", porque: "cenas do cotidiano emocional geram o “isso sou eu” que abre a conversa.", comoFazer: "“Quando você…” encenado em 15–30s, sem caricaturar o sofrimento; feche com uma frase de acolhimento." },
      { key: "talking_head", papel: "Carro-chefe", porque: "a voz e o rosto do terapeuta constroem o vínculo que antecede a primeira sessão.", comoFazer: "Uma reflexão por vídeo, tom calmo, 30–60s, enquadramento próximo e sem trilha agitada." },
      { key: "checklist", papel: "Apoio", porque: "carrosséis de “sinais de…” são salvos e compartilhados com quem precisa.", comoFazer: "5–7 sinais com linguagem cuidadosa e o último slide orientando buscar avaliação profissional." },
      { key: "storytelling", papel: "Apoio", porque: "uma história ilustra um padrão emocional melhor que a teoria.", comoFazer: "Use caso composto/fictício e diga que é ilustrativo — nunca um paciente identificável." },
      { key: "live", papel: "Pontual", porque: "roda de conversa aprofunda a confiança com quem já acompanha.", comoFazer: "Tema único, 30–40 min, perguntas enviadas antes pela caixinha." },
    ],
    superficies: [{ superficie: "Reel", pct: 40 }, { superficie: "Carrossel", pct: 35 }, { superficie: "Stories", pct: 25 }],
    producao: { nivel: "Lo-fi", porque: "tom íntimo e humano; produção muito polida soa distante." },
    cadencia: "2–3 Reels + 2 carrosséis por semana; Stories com perguntas reflexivas.",
    series: ["Você não é o único que…", "Frase que escuto no consultório (anonimizada)", "Uma pergunta para levar para a semana"],
    evitar: [
      { pratica: "Casos reais identificáveis", porque: "fere o sigilo profissional previsto no Código de Ética do CFP.", key: "case" },
      { pratica: "Conteúdo de diagnóstico (“se você faz X, você tem Y”)", porque: "estimula autodiagnóstico e contraria a ética da profissão." },
    ],
    cuidados: [
      "Siga as regras do CFP para publicidade: sem promessa de cura e sem depoimento de paciente.",
      "Em temas sensíveis, inclua orientação para buscar ajuda profissional ou o CVV (188).",
    ],
  },
  {
    key: "saude",
    nome: "Saúde & clínicas",
    match: ["medic", "clinica", "consultorio", "dentist", "odonto", "ortodont", "fisioterap", "dermatolog", "ginecolog", "pediatr", "cardiolog", "cirurgi", "saude", "fonoaudiolog", "oftalmolog", "enfermag"],
    leitura: "O paciente decide por confiança e clareza: quer entender o que tem, se é grave e se aquele profissional é seguro. Traduzir o técnico em linguagem simples, com o rosto do profissional, converte mais que peça “bonita”.",
    formatos: [
      { key: "mito_verdade", papel: "Carro-chefe", porque: "derruba crenças que atrasam o tratamento e posiciona o profissional como fonte confiável.", comoFazer: "Um mito por vídeo, 30–45s, o profissional na câmera; cite a fonte quando usar dado." },
      { key: "resposta_comentario", papel: "Carro-chefe", porque: "dúvidas reais de pacientes são pauta infinita e mostram cuidado.", comoFazer: "Mostre a pergunta anonimizada na tela e responda em linguagem simples, terminando em “procure avaliação”." },
      { key: "checklist", papel: "Apoio", porque: "“sinais de alerta” e “como se preparar para o exame” são salvos e compartilhados.", comoFazer: "Carrossel de 6–8 slides, um item por slide, sem jargão." },
      { key: "bastidores", papel: "Apoio", porque: "consultório, equipamentos e protocolos visíveis reduzem o medo e transmitem segurança.", comoFazer: "Stories/Reel curto do preparo da sala, higienização e equipe — sem expor pacientes." },
      { key: "entrevista", papel: "Pontual", porque: "conversa com colega de outra especialidade gera autoridade cruzada.", comoFazer: "3–4 perguntas que o paciente faria, cortadas em Reels de 45s." },
    ],
    superficies: [{ superficie: "Reel", pct: 45 }, { superficie: "Carrossel", pct: 30 }, { superficie: "Stories", pct: 25 }],
    producao: { nivel: "Mid-fi", porque: "clareza e credibilidade pesam mais que estética; áudio limpo e boa luz bastam." },
    cadencia: "3 Reels + 2 carrosséis por semana; Stories nos dias de atendimento, com caixinha de dúvidas 1×/semana.",
    series: ["Mito ou verdade?", "Pergunta do paciente", "Sinal de alerta da semana"],
    evitar: [
      { pratica: "Antes e depois como promessa de resultado", porque: "os conselhos (CFM, CFO etc.) restringem imagem de paciente e promessa de resultado.", key: "antes_depois" },
      { pratica: "Trend de humor sobre sintomas", porque: "banaliza a dor do paciente e mina a autoridade.", key: "trend" },
    ],
    cuidados: [
      "Confira o código de ética do seu conselho (CFM, CFO, COFFITO…) antes de publicar imagem de paciente, preço ou depoimento.",
      "Nunca prometa resultado nem faça diagnóstico pelo conteúdo — oriente a consulta.",
      "Anonimize qualquer dúvida ou caso real.",
    ],
  },
  {
    key: "nutricao_fitness",
    nome: "Nutrição, fitness & bem-estar",
    match: ["nutri", "dieta", "emagrec", "personal", "academia", "treino", "fitness", "musculac", "pilates", "yoga", "crossfit", "corrida", "esportiv", "suplement", "hipertrof"],
    leitura: "O público consome muito conteúdo prático e compara resultados. Ganha quem ensina algo aplicável hoje e mostra rotina real; como o nicho é saturado de promessa, credibilidade vira diferencial.",
    formatos: [
      { key: "tutorial", papel: "Carro-chefe", porque: "receita, treino ou montagem de prato aplicável hoje é o conteúdo mais salvo do nicho.", comoFazer: "Resultado na primeira cena, passos rápidos na tela, lista final para salvar." },
      { key: "mito_verdade", papel: "Carro-chefe", porque: "derrubar modismos é onde a autoridade técnica aparece.", comoFazer: "Pegue a crença da moda, explique o porquê com base científica e dê a alternativa prática." },
      { key: "vlog", papel: "Apoio", porque: "rotina real (refeições, treinos) gera identificação e prova de coerência.", comoFazer: "“Um dia comigo/com um aluno” em cortes de 2–3s, com legenda do que importa." },
      { key: "react", papel: "Apoio", porque: "reagir à dieta ou ao treino viral com análise aproveita o alcance da tendência.", comoFazer: "Tela dividida com o viral + sua análise em 3 pontos, sem atacar a pessoa." },
      { key: "antes_depois", papel: "Pontual", porque: "prova de resultado, quando há autorização e contexto.", comoFazer: "Mostre o processo e o tempo real, com autorização por escrito e sem prometer o mesmo resultado." },
    ],
    superficies: [{ superficie: "Reel", pct: 50 }, { superficie: "Carrossel", pct: 25 }, { superficie: "Stories", pct: 25 }],
    producao: { nivel: "Lo-fi", porque: "cozinha e academia de verdade geram identificação e permitem volume." },
    cadencia: "4 Reels + 1–2 carrosséis por semana; Stories diários de rotina.",
    series: ["Troca inteligente", "Mito da semana", "Prato (ou treino) em 60s"],
    evitar: [
      { pratica: "Antes e depois sem contexto", porque: "CFN/CRN e CONFEF restringem imagem de paciente/aluno e promessa de resultado; parece anúncio milagroso.", key: "antes_depois" },
      { pratica: "Dieta ou treino genérico “para todos”", porque: "desvaloriza o atendimento individual que você vende." },
    ],
    cuidados: [
      "Nutricionistas: confira o Código de Ética do CFN sobre imagem de paciente e divulgação de marcas e suplementos.",
      "Não prometa quilos nem prazos.",
    ],
  },
  {
    key: "estetica_beleza",
    nome: "Estética & beleza (serviços)",
    match: ["estetic", "beleza", "salao", "cabelei", "cabelo", "maquiag", "manicure", "unha", "sobrancelh", "lash", "cilios", "harmoniz", "depilac", "barbear", "barbearia", "spa", "micropigment"],
    leitura: "Beleza é decisão visual e de confiança nas mãos da profissional. O público quer ver resultado, processo e ambiente — e ter certeza de que é seguro.",
    formatos: [
      { key: "antes_depois", papel: "Carro-chefe", porque: "a transformação é o próprio produto.", comoFazer: "Mesma luz e ângulo no antes e no depois, sem filtro que altere o resultado, com autorização da cliente." },
      { key: "bastidores", papel: "Carro-chefe", porque: "ver o procedimento acontecendo gera desejo e confiança na técnica.", comoFazer: "Timelapse do procedimento com 2–3 legendas explicando o cuidado de cada etapa." },
      { key: "trend", papel: "Apoio", porque: "áudios em alta com transformações ampliam o alcance local.", comoFazer: "Use o áudio do momento para revelar o resultado no “drop”." },
      { key: "resposta_comentario", papel: "Apoio", porque: "“dói?”, “quanto dura?”, “pode na gravidez?” são as objeções reais antes de agendar.", comoFazer: "Uma dúvida por vídeo, resposta direta em até 30s." },
      { key: "case", papel: "Pontual", porque: "a jornada completa de uma cliente mostra o método, não só o resultado.", comoFazer: "Carrossel: queixa → avaliação → procedimento → manutenção." },
    ],
    superficies: [{ superficie: "Reel", pct: 50 }, { superficie: "Stories", pct: 30 }, { superficie: "Carrossel", pct: 20 }],
    producao: { nivel: "Mid-fi", porque: "luz boa é inegociável: o resultado precisa aparecer com fidelidade." },
    cadencia: "4–5 Reels por semana; Stories diários com agenda e bastidor.",
    series: ["Transformação da semana", "Dói? Dura? Pode? (dúvidas)", "Cuidado em casa"],
    evitar: [
      { pratica: "Filtro ou edição que altera o resultado", porque: "quebra a confiança e pode configurar propaganda enganosa (CDC)." },
      { pratica: "Só antes e depois, sem ensinar nada", porque: "o perfil vira vitrine e não constrói autoridade." },
    ],
    cuidados: [
      "Procedimentos injetáveis e harmonização: o conselho do profissional (CFM, CFO, CFBM…) regula o uso de imagem de paciente.",
      "Tenha autorização por escrito para uso de imagem.",
    ],
  },
  {
    key: "juridico",
    nome: "Advocacia & jurídico",
    match: ["advoga", "advocac", "juridic", "direito", "trabalhist", "previdenc", "tributar", "oab", "inventario", "divorci"],
    leitura: "O cliente chega com medo e sem saber se tem direito. Explicar em português claro “isso é direito seu?” gera alcance e autoridade; a contratação vem da confiança, não de chamada de venda.",
    formatos: [
      { key: "talking_head", papel: "Carro-chefe", porque: "o advogado explicando um direito em linguagem simples é a base da autoridade no nicho.", comoFazer: "Um direito por vídeo, 45–60s, começando pela situação da pessoa (não pela lei)." },
      { key: "mito_verdade", papel: "Carro-chefe", porque: "crenças erradas fazem a pessoa perder direitos — corrigi-las é útil e compartilhável.", comoFazer: "“Você é obrigado a…? Mito.” e a explicação em 3 frases." },
      { key: "checklist", papel: "Apoio", porque: "“documentos para guardar” e “o que conferir na rescisão” são salvos e reenviados.", comoFazer: "Carrossel de 6–8 itens, sem juridiquês, com o último slide convidando a salvar." },
      { key: "duplo_personagem", papel: "Apoio", porque: "encenar a situação típica (patrão × empregado) cria identificação imediata.", comoFazer: "Diálogo curto de 20–30s e, em seguida, o comentário técnico." },
      { key: "analise", papel: "Pontual", porque: "comentar lei nova ou decisão relevante mostra atualização.", comoFazer: "“O que muda para você” em 3 pontos, no dia ou no dia seguinte à notícia." },
    ],
    superficies: [{ superficie: "Reel", pct: 45 }, { superficie: "Carrossel", pct: 35 }, { superficie: "Stories", pct: 20 }],
    producao: { nivel: "Mid-fi", porque: "sobriedade transmite seriedade; muito amador parece despreparo, muito produzido parece propaganda." },
    cadencia: "3 Reels + 2 carrosséis por semana; Stories com caixinha de dúvidas.",
    series: ["Você sabia que é direito seu?", "Mito jurídico da semana", "Lei nova em 1 minuto"],
    evitar: [
      { pratica: "Case com resultado ou valor ganho", porque: "o Código de Ética e o Provimento 205/2021 da OAB restringem publicidade que ostente resultados ou identifique clientes.", key: "case" },
      { pratica: "CTA de venda direta (“contrate já”)", porque: "a captação de clientela é vedada; use CTA informativo (salvar, enviar dúvida)." },
    ],
    cuidados: [
      "A publicidade na advocacia deve ser informativa (Provimento 205/2021 da OAB) — confira a regra vigente.",
      "Nunca dê consultoria de caso específico nos comentários.",
    ],
  },
  {
    key: "financas",
    nome: "Finanças, contabilidade & investimentos",
    match: ["financ", "contab", "contador", "invest", "credito", "seguro", "previdencia privada", "imposto", "mei", "economi", "renda fixa"],
    leitura: "Tema técnico e com medo embutido (dívida, imposto, perder dinheiro). O público salva conteúdo útil e segue quem simplifica com números concretos e exemplos do dia a dia.",
    formatos: [
      { key: "checklist", papel: "Carro-chefe", porque: "passo a passo, prazos e documentos viram material de consulta — o formato mais salvo do nicho.", comoFazer: "Carrossel com um passo por slide e exemplo numérico real." },
      { key: "tela_dividida", papel: "Carro-chefe", porque: "o profissional + a planilha ou simulação na tela torna o abstrato concreto.", comoFazer: "Grave a tela com a conta e o seu rosto no canto; arredonde números para facilitar." },
      { key: "comparacao", papel: "Apoio", porque: "“X ou Y?” (CDB × poupança, MEI × ME) é a dúvida real de decisão.", comoFazer: "Tabela simples, critério por critério, com conclusão “depende de…” honesta." },
      { key: "analise", papel: "Apoio", porque: "traduzir a notícia econômica para o bolso gera autoridade e alcance.", comoFazer: "“O que isso muda no seu bolso” em até 3 pontos, no mesmo dia da notícia." },
      { key: "resposta_comentario", papel: "Pontual", porque: "dúvidas reais mostram proximidade com o público.", comoFazer: "Responda sem recomendação individual; explique o critério." },
    ],
    superficies: [{ superficie: "Carrossel", pct: 40 }, { superficie: "Reel", pct: 40 }, { superficie: "Stories", pct: 20 }],
    producao: { nivel: "Mid-fi", porque: "números legíveis e visual limpo passam confiança." },
    cadencia: "2 Reels + 3 carrosséis por semana; Stories com enquetes.",
    series: ["Traduzindo a notícia para o seu bolso", "Prazo da semana", "Erro que custa caro"],
    evitar: [
      { pratica: "Promessa de rentabilidade ou ganho rápido", porque: "soa golpe, afasta o público qualificado e pode ferir regras da CVM." },
      { pratica: "Recomendação individual de investimento", porque: "exige habilitação específica (ex.: CVM/ANBIMA)." },
    ],
    cuidados: [
      "Use números reais com fonte e data.",
      "Deixe claro que é conteúdo educativo, não recomendação individual.",
    ],
  },
  {
    key: "educacao",
    nome: "Educação, cursos & mentorias",
    match: ["curso", "mentor", "infoprodut", "professor", "ensino", "escola", "idioma", "ingles", "concurso", "vestibular", "treinament", "educac", "aula"],
    leitura: "O aluno compra transformação e método. Conteúdo que entrega uma amostra do método (uma vitória rápida) e mostra alunos reais cria desejo pelo produto completo.",
    formatos: [
      { key: "tutorial", papel: "Carro-chefe", porque: "uma mini-aula com vitória rápida prova o método na prática.", comoFazer: "Um conceito por vídeo, com exemplo aplicado e exercício no final." },
      { key: "serie", papel: "Carro-chefe", porque: "quadro recorrente cria hábito de audiência — como uma turma.", comoFazer: "Mesmo nome, mesma abertura e mesmo dia da semana." },
      { key: "case", papel: "Apoio", porque: "a jornada de um aluno real é a prova mais forte do nicho.", comoFazer: "Onde estava → o que fez no método → onde chegou, com autorização." },
      { key: "curiosidade", papel: "Apoio", porque: "ganchos de curiosidade trazem público novo para o topo.", comoFazer: "Abra com um fato surpreendente do tema e entregue a explicação até o fim." },
      { key: "live", papel: "Pontual", porque: "aula aberta aquece a audiência antes de abrir turma.", comoFazer: "Uma aula completa de 40 min, com a oferta só no final." },
    ],
    superficies: [{ superficie: "Reel", pct: 40 }, { superficie: "Carrossel", pct: 30 }, { superficie: "Stories", pct: 20 }, { superficie: "Live", pct: 10 }],
    producao: { nivel: "Mid-fi", porque: "clareza didática (áudio, legenda, tela) vale mais que cenário." },
    cadencia: "3 Reels + 2 carrosséis por semana; 1 live por mês ou antes de cada abertura de turma.",
    series: ["Aula de 1 minuto", "Erro comum de aluno (anonimizado)", "Pergunta da turma"],
    evitar: [
      { pratica: "Print de faturamento e lifestyle como prova", porque: "atrai o público errado e gera desconfiança." },
      { pratica: "Só teoria solta", porque: "não mostra o método e não gera desejo pelo curso." },
    ],
    cuidados: ["Depoimentos só reais e autorizados; não prometa renda nem aprovação garantida."],
  },
  {
    key: "moda",
    nome: "Moda & acessórios",
    match: ["moda", "roupa", "vestuar", "boutique", "look", "calcad", "sapato", "bolsa", "acessori", "joia", "semijoia", "bijuter", "lingerie"],
    leitura: "Compra por desejo e identificação com quem veste. O público quer ver caimento real, combinações e o produto em movimento — e decide rápido quando vê “em alguém como eu”.",
    formatos: [
      { key: "provador", papel: "Carro-chefe", porque: "caimento real em corpo real responde à dúvida que impede a compra.", comoFazer: "Vista na câmera, gire, mostre detalhe do tecido e informe tamanho e altura." },
      { key: "trend", papel: "Carro-chefe", porque: "transições e áudios em alta são a linguagem nativa de moda no Reels.", comoFazer: "Use a transição do momento para trocar de look no ritmo do áudio." },
      { key: "tutorial", papel: "Apoio", porque: "“3 jeitos de usar a mesma peça” aumenta o valor percebido.", comoFazer: "Mesma peça-base, três produções, preço e link ao final." },
      { key: "bastidores", papel: "Apoio", porque: "chegada de coleção e embalagem geram expectativa e humanizam a loja.", comoFazer: "Unboxing da coleção nos Stories com enquete “qual você quer ver no corpo?”." },
      { key: "resposta_comentario", papel: "Pontual", porque: "dúvida de tamanho e tecido é a objeção nº 1 da compra online.", comoFazer: "Responda mostrando a peça em duas numerações." },
    ],
    superficies: [{ superficie: "Reel", pct: 50 }, { superficie: "Stories", pct: 35 }, { superficie: "Carrossel", pct: 15 }],
    producao: { nivel: "Lo-fi", porque: "espontaneidade com boa luz vende mais que catálogo; o que importa é a peça em movimento." },
    cadencia: "5 ou mais Reels por semana; Stories diários com novidades, enquetes e link de compra.",
    series: ["3 jeitos de usar", "Provador com a equipe", "Chegou!"],
    evitar: [
      { pratica: "Só foto de catálogo estática", porque: "baixo alcance e não mostra caimento." },
      { pratica: "Modelos que não representam a cliente", porque: "quebram a identificação." },
    ],
    cuidados: ["Informe tamanho e altura de quem veste — reduz troca e dúvida."],
  },
  {
    key: "cosmeticos",
    nome: "Cosméticos & produtos de autocuidado",
    match: ["cosmetic", "skincare", "skin care", "dermocosm", "sabonete", "perfum", "hidratant", "produto natural", "produtos naturais", "vegano", "organic", "autocuidado"],
    leitura: "A cliente quer ver textura, rotina e resultado, e entender ingrediente sem jargão. Transparência (o que tem e o que não tem) vira argumento de compra.",
    formatos: [
      { key: "demonstracao", papel: "Carro-chefe", porque: "textura, aplicação e absorção na pele são o que o site não mostra.", comoFazer: "Close bem iluminado da textura, aplicação real e o acabamento em 15–20s." },
      { key: "tutorial", papel: "Carro-chefe", porque: "a rotina de uso (ordem, quantidade, horário) aumenta a recompra.", comoFazer: "“Minha rotina da noite em 4 passos”, com o produto de cada passo na tela." },
      { key: "mito_verdade", papel: "Apoio", porque: "decodificar ingredientes gera autoridade e confiança.", comoFazer: "Um ingrediente por vídeo: o que faz, o que não faz, para quem é." },
      { key: "comparacao", papel: "Apoio", porque: "comparar rótulos mostra o diferencial sem precisar gritar.", comoFazer: "Compare tipos de fórmula, nunca uma marca concorrente nomeada." },
      { key: "bastidores", papel: "Pontual", porque: "produção artesanal ou de pequeno lote é diferencial visível.", comoFazer: "Um lote do início ao envase em timelapse." },
    ],
    superficies: [{ superficie: "Reel", pct: 45 }, { superficie: "Stories", pct: 30 }, { superficie: "Carrossel", pct: 25 }],
    producao: { nivel: "Mid-fi", porque: "close de textura exige luz e foco; o resto pode ser espontâneo." },
    cadencia: "4 Reels + 2 carrosséis por semana; Stories com rotina e bastidor de produção.",
    series: ["Rótulo decodificado", "Rotina em 60s", "Por dentro da produção"],
    evitar: [
      { pratica: "Promessa de efeito terapêutico (“cura”, “trata”)", porque: "a ANVISA restringe as alegações de cosméticos." },
      { pratica: "Comparação citando concorrente", porque: "risco ético-publicitário (CONAR) e soa agressivo." },
    ],
    cuidados: ["Use só as alegações de benefício comprovadas/aprovadas para o produto."],
  },
  {
    key: "gastronomia",
    nome: "Gastronomia & alimentação",
    match: ["restaurant", "gastronom", "confeit", "doceria", "docinho", "bolo", "cafeteria", "cafe", "hamburg", "pizz", "chef", "comida", "delivery", "padaria", "boteco", "cervej", "marmit", "lanchonete", "brigadeiro"],
    leitura: "Comida se vende pelos olhos e pelo som. O público decide em segundos com close, processo e ambiente — e volta pela relação com quem faz.",
    formatos: [
      { key: "bastidores", papel: "Carro-chefe", porque: "o preparo (som, fumaça, recheio) é o conteúdo mais desejado do nicho.", comoFazer: "Closes de 1–2s no ritmo do som ambiente, prato pronto no final." },
      { key: "pov", papel: "Carro-chefe", porque: "“POV: você pediu X” coloca o cliente na experiência.", comoFazer: "Câmera na altura dos olhos do cliente, do pedido à primeira mordida." },
      { key: "tour", papel: "Apoio", porque: "ambiente e atendimento são parte do que se compra.", comoFazer: "Entrada → mesa → prato, em um plano contínuo de 15s." },
      { key: "tutorial", papel: "Apoio", porque: "uma receita simplificada gera salvamento e reciprocidade sem entregar o segredo.", comoFazer: "Versão caseira de um item do cardápio, 5 passos." },
      { key: "trend", papel: "Pontual", porque: "trends de comida têm alcance alto quando cabem no cardápio.", comoFazer: "Só entre na trend que combina com um prato real da casa." },
    ],
    superficies: [{ superficie: "Reel", pct: 55 }, { superficie: "Stories", pct: 35 }, { superficie: "Carrossel", pct: 10 }],
    producao: { nivel: "Mid-fi", porque: "close bem iluminado e som ambiente limpo fazem o prato vender." },
    cadencia: "5 Reels por semana; Stories diários (cardápio do dia, pedidos saindo).",
    series: ["Saindo do forno", "Cardápio do dia", "Quem faz (equipe)"],
    evitar: [
      { pratica: "Cardápio estático como conteúdo principal", porque: "não gera desejo nem alcance." },
      { pratica: "Imagem de banco", porque: "quebra a confiança: o cliente quer ver o SEU prato." },
    ],
    cuidados: ["Informe alérgenos quando for relevante."],
  },
  {
    key: "imobiliario",
    nome: "Imobiliário & construção",
    match: ["imobili", "imove", "imovel", "corretor", "construtor", "incorpora", "loteament", "aluguel", "condominio", "apartament"],
    leitura: "Decisão cara e longa. O público consome tour de imóvel como entretenimento e só contrata quem demonstra conhecimento do mercado local e passa segurança no processo.",
    formatos: [
      { key: "tour", papel: "Carro-chefe", porque: "tour é o formato que o público do nicho procura e compartilha.", comoFazer: "Plano contínuo e estabilizado, preço e metragem na primeira cena, 30–60s." },
      { key: "analise", papel: "Carro-chefe", porque: "“vale a pena morar em X?” posiciona como especialista local.", comoFazer: "Bairro, preço médio do m², prós e contras honestos." },
      { key: "checklist", papel: "Apoio", porque: "documentos e erros na compra são dúvidas de alto valor.", comoFazer: "Carrossel com 7 itens e um exemplo real de problema evitado." },
      { key: "comparacao", papel: "Apoio", porque: "financiar × alugar e bairro × bairro são decisões reais do comprador.", comoFazer: "Conta simples na tela com premissas explícitas." },
      { key: "case", papel: "Pontual", porque: "uma compra concluída mostra o processo e gera confiança.", comoFazer: "Com autorização: desafio do cliente → busca → chave na mão." },
    ],
    superficies: [{ superficie: "Reel", pct: 55 }, { superficie: "Carrossel", pct: 25 }, { superficie: "Stories", pct: 20 }],
    producao: { nivel: "High-fi", porque: "tour exige estabilizador e luz natural; conteúdo educativo pode ser Mid-fi." },
    cadencia: "3 Reels (1 tour) + 2 carrosséis por semana.",
    series: ["Tour em 60s", "Bairro a bairro", "Custo real de comprar"],
    evitar: [
      { pratica: "Promessa de valorização garantida", porque: "não é verificável e fere a confiança." },
      { pratica: "Material da incorporadora sem contexto", porque: "todo corretor posta igual; não diferencia." },
    ],
    cuidados: ["Corretores: identifique o CRECI conforme as regras do COFECI e informe valores e condições com precisão."],
  },
  {
    key: "arquitetura",
    nome: "Arquitetura, interiores & decoração",
    match: ["arquitet", "interiores", "decorac", "marcenaria", "paisagis", "reforma", "moveis planejados", "iluminac"],
    leitura: "O público compra gosto e a segurança de que a obra não vai virar dor de cabeça. Transformação do espaço e processo transparente geram desejo e confiança.",
    formatos: [
      { key: "antes_depois", papel: "Carro-chefe", porque: "a transformação do ambiente é o argumento mais forte do nicho.", comoFazer: "Mesmo ângulo no antes e no depois, com transição no ritmo do áudio." },
      { key: "tour", papel: "Carro-chefe", porque: "o projeto pronto em movimento mostra detalhes que a foto perde.", comoFazer: "Plano contínuo, luz natural, closes de marcenaria e acabamentos." },
      { key: "bastidores", papel: "Apoio", porque: "obra e escolha de materiais mostram método e reduzem o medo da reforma.", comoFazer: "Diário de obra nos Stories, um marco por semana no feed." },
      { key: "checklist", papel: "Apoio", porque: "“erros comuns na reforma” é conteúdo salvo e compartilhado.", comoFazer: "Carrossel com o erro, a consequência e a solução." },
      { key: "react", papel: "Pontual", porque: "comentar ambientes virais com olhar técnico gera alcance e autoridade.", comoFazer: "O que funciona, o que não funciona e como adaptar." },
    ],
    superficies: [{ superficie: "Reel", pct: 50 }, { superficie: "Carrossel", pct: 35 }, { superficie: "Stories", pct: 15 }],
    producao: { nivel: "High-fi", porque: "projeto pronto é portfólio; a obra pode ser Lo-fi." },
    cadencia: "3 Reels + 2 carrosséis por semana.",
    series: ["Antes × depois", "Erro de reforma", "Detalhe que faz diferença"],
    evitar: [
      { pratica: "Render 3D apresentado como obra pronta", porque: "sempre sinalize que é projeto/render." },
      { pratica: "Só portfólio sem explicar decisões", porque: "não mostra o método que diferencia você." },
    ],
    cuidados: ["Autorização do cliente para mostrar a casa; nunca exponha endereço."],
  },
  {
    key: "eventos",
    nome: "Casamento, eventos & fotografia",
    match: ["casament", "noiv", "evento", "fotograf", "filmag", "buffet", "cerimoni", "festa", "debutante"],
    leitura: "Compra emocional, com medo de errar num dia único. O público quer se imaginar vivendo aquilo e confiar que o fornecedor não vai falhar.",
    formatos: [
      { key: "storytelling", papel: "Carro-chefe", porque: "a história de um casal ou evento gera a emoção que motiva a contratação.", comoFazer: "Do detalhe pessoal ao grande momento, com trilha e poucas legendas." },
      { key: "bastidores", papel: "Carro-chefe", porque: "o dia por trás das câmeras prova cuidado e responde ao medo de falha.", comoFazer: "Checklist, equipe e imprevistos resolvidos, em Stories no dia e Reel depois." },
      { key: "checklist", papel: "Apoio", porque: "guias de planejamento são salvos por quem está organizando.", comoFazer: "“O que perguntar antes de contratar…”, um item por slide." },
      { key: "pov", papel: "Apoio", porque: "“POV: você no dia…” faz a pessoa se imaginar ali.", comoFazer: "Câmera subjetiva nos momentos-chave, 15–20s." },
      { key: "entrevista", papel: "Pontual", porque: "o depoimento real de um casal/cliente é prova social forte.", comoFazer: "3 perguntas, respostas curtas, com autorização." },
    ],
    superficies: [{ superficie: "Reel", pct: 50 }, { superficie: "Carrossel", pct: 25 }, { superficie: "Stories", pct: 25 }],
    producao: { nivel: "High-fi", porque: "a entrega é o seu portfólio; o bastidor pode ser Lo-fi." },
    cadencia: "3 Reels + 2 carrosséis por semana; Stories nos dias de evento.",
    series: ["Guia do planejamento", "Bastidor do dia", "Histórias que contamos"],
    evitar: [
      { pratica: "Só portfólio sem narrativa", porque: "fotos bonitas sem história não diferenciam." },
      { pratica: "Escassez inventada (“últimas datas”)", porque: "só use quando for real — o público confere." },
    ],
    cuidados: ["Autorização dos clientes para uso de imagem."],
  },
  {
    key: "pet",
    nome: "Pet & veterinária",
    match: ["pet", "veterin", "cachorr", "cao", "caes", "gato", "felin", "banho e tosa", "petshop"],
    leitura: "O tutor é apaixonado e ansioso pelo bem-estar do animal. Pets geram alcance natural; a confiança vem de cuidado visível e informação responsável.",
    formatos: [
      { key: "pov", papel: "Carro-chefe", porque: "“POV: seu cachorro quando…” é a linguagem nativa do nicho e gera compartilhamento.", comoFazer: "Situação real do dia a dia, legenda com a “fala” do pet." },
      { key: "bastidores", papel: "Carro-chefe", porque: "atendimento, banho e tosa mostram o cuidado com o animal.", comoFazer: "Mostre o manejo calmo e o resultado; nunca um animal estressado." },
      { key: "mito_verdade", papel: "Apoio", porque: "derrubar crenças sobre alimentação e cuidado posiciona como referência.", comoFazer: "Um mito por vídeo, com orientação para consultar o veterinário." },
      { key: "tutorial", papel: "Apoio", porque: "cuidados práticos em casa geram reciprocidade.", comoFazer: "Passo a passo de 30s (escovar, cortar unha etc.)." },
      { key: "antes_depois", papel: "Pontual", porque: "a transformação da tosa é visual e compartilhável.", comoFazer: "Com autorização do tutor, mesma luz e ângulo." },
    ],
    superficies: [{ superficie: "Reel", pct: 55 }, { superficie: "Stories", pct: 30 }, { superficie: "Carrossel", pct: 15 }],
    producao: { nivel: "Lo-fi", porque: "espontaneidade combina com pets e permite volume." },
    cadencia: "4–5 Reels por semana; Stories diários.",
    series: ["Cliente do dia", "Mito ou verdade pet", "Cuidado da semana"],
    evitar: [
      { pratica: "Expor animal estressado para viralizar", porque: "gera rejeição imediata dos tutores." },
      { pratica: "Orientar medicação pelo conteúdo", porque: "só o veterinário, em consulta (CFMV)." },
    ],
    cuidados: ["Autorização do tutor para uso de imagem."],
  },
  {
    key: "turismo",
    nome: "Turismo & hospitalidade",
    match: ["turism", "viage", "pousada", "hotel", "hostel", "resort", "agencia de viage", "roteiro", "destino"],
    leitura: "Compra de experiência: o público quer se imaginar lá. Imersão visual e informação prática (quanto custa, quando ir) convertem.",
    formatos: [
      { key: "tour", papel: "Carro-chefe", porque: "imersão no lugar é o que faz a pessoa reservar.", comoFazer: "Chegada → quarto → experiência, em 20–30s com som ambiente." },
      { key: "pov", papel: "Carro-chefe", porque: "“POV: seu café da manhã aqui” coloca o hóspede na cena.", comoFazer: "Câmera subjetiva, momento único, legenda curta." },
      { key: "checklist", papel: "Apoio", porque: "roteiros e “quanto custa” são salvos para planejar a viagem.", comoFazer: "Carrossel com dia a dia do roteiro e valores com data." },
      { key: "vlog", papel: "Apoio", porque: "um dia inteiro no lugar mostra a experiência completa.", comoFazer: "Cortes curtos da manhã à noite." },
      { key: "trend", papel: "Pontual", porque: "trends de viagem ampliam o alcance.", comoFazer: "Use só com imagens reais do lugar." },
    ],
    superficies: [{ superficie: "Reel", pct: 55 }, { superficie: "Stories", pct: 25 }, { superficie: "Carrossel", pct: 20 }],
    producao: { nivel: "High-fi", porque: "imersão pede boa imagem; a rotina pode ser Lo-fi." },
    cadencia: "4 Reels + 1 carrossel por semana; Stories diários.",
    series: ["Roteiro de 3 dias", "Quanto custa", "Um dia aqui"],
    evitar: [
      { pratica: "Foto editada que não corresponde ao lugar", porque: "gera frustração e avaliação negativa." },
      { pratica: "Só paisagem, sem informação prática", porque: "encanta, mas não converte." },
    ],
    cuidados: ["Preços e condições sempre com data de validade."],
  },
  {
    key: "tecnologia_b2b",
    nome: "Tecnologia, SaaS & serviços B2B",
    match: ["saas", "software", "tecnolog", "b2b", "startup", "agencia", "consultoria", "automac", "marketing digital"],
    leitura: "O decisor quer reduzir risco e justificar o investimento internamente. Mostrar o problema de negócio com clareza, o “como” e casos reais gera oportunidades; opinião forte gera autoridade.",
    formatos: [
      { key: "tela_dividida", papel: "Carro-chefe", porque: "mostrar o processo ou a ferramenta na tela torna a solução concreta.", comoFazer: "Um problema, a solução na tela, o ganho em número." },
      { key: "analise", papel: "Carro-chefe", porque: "opinião fundamentada sobre o mercado diferencia no meio de conteúdo genérico.", comoFazer: "Uma tese por peça, com argumento e exemplo." },
      { key: "case", papel: "Apoio", porque: "case com número é a prova que o decisor leva para a reunião.", comoFazer: "Contexto → problema → o que foi feito → resultado mensurável (com autorização)." },
      { key: "comparacao", papel: "Apoio", porque: "“fazer internamente × contratar” é a decisão real do comprador.", comoFazer: "Critérios objetivos: custo, prazo, risco." },
      { key: "entrevista", papel: "Pontual", porque: "conversa com cliente ou especialista gera autoridade emprestada.", comoFazer: "Cortes de 45s com uma ideia cada." },
    ],
    superficies: [{ superficie: "Carrossel", pct: 40 }, { superficie: "Reel", pct: 35 }, { superficie: "Vídeo", pct: 15 }, { superficie: "Stories", pct: 10 }],
    producao: { nivel: "Mid-fi", porque: "clareza e tela legível valem mais que produção." },
    cadencia: "2 carrosséis + 2 Reels por semana; 1 vídeo mais longo por mês.",
    series: ["Opinião impopular", "Desmontando um processo", "Número da semana"],
    evitar: [
      { pratica: "Jargão e lista de funcionalidades", porque: "o decisor compra resultado, não feature." },
      { pratica: "Trend de humor desconectada", porque: "atrai público que não compra.", key: "trend" },
    ],
    cuidados: ["Case com números só com autorização do cliente."],
  },
];

export const GENERIC_PROFILE: NicheProfile = {
  key: "generico",
  nome: "Perfil geral",
  match: [],
  leitura: "Nicho não identificado com segurança: o guia usa a base que funciona para a maioria dos negócios — rosto, utilidade e prova. Informe o nicho no cadastro ou no Content DNA para um guia específico.",
  formatos: [
    { key: "talking_head", papel: "Carro-chefe", porque: "rosto e voz constroem confiança em qualquer nicho.", comoFazer: "Uma ideia por vídeo, 30–60s, começando pela situação da persona." },
    { key: "tutorial", papel: "Carro-chefe", porque: "conteúdo útil e aplicável gera salvamento e reciprocidade.", comoFazer: "Resultado primeiro, passos depois, resumo para salvar." },
    { key: "bastidores", papel: "Apoio", porque: "mostrar como você trabalha humaniza e prova método.", comoFazer: "Stories do processo; um marco por semana no feed." },
    { key: "case", papel: "Apoio", porque: "um caso real prova a promessa.", comoFazer: "Antes → processo → depois, com autorização." },
    { key: "resposta_comentario", papel: "Pontual", porque: "dúvidas reais viram pauta certeira.", comoFazer: "Mostre a pergunta e responda direto." },
  ],
  superficies: [{ superficie: "Reel", pct: 45 }, { superficie: "Carrossel", pct: 30 }, { superficie: "Stories", pct: 25 }],
  producao: { nivel: "Mid-fi", porque: "equilibra clareza e volume." },
  cadencia: "3 Reels + 2 carrosséis por semana; Stories diários.",
  series: ["Pergunta da semana", "Bastidor", "Erro comum"],
  evitar: [{ pratica: "Trend desconectada do tema", porque: "traz alcance que não vira cliente.", key: "trend" }],
  cuidados: ["Se o nicho for regulado (saúde, direito, finanças), confira o código do conselho antes de usar imagem de cliente, depoimento ou promessa."],
};

/** minúsculo, sem acento — para casar radicais independentemente da grafia. */
export function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function scoreProfile(p: NicheProfile, text: string): number {
  return p.match.filter((m) => new RegExp(`(^|[^a-z0-9])${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text)).length;
}

/**
 * Identifica o nicho a partir de textos em ordem de prioridade (ex.: campo
 * "nicho" do DNA primeiro, depois oferta/posicionamento/nome). O primeiro
 * texto que casar com algum perfil decide; empates ficam com o perfil que vem
 * antes em NICHE_PROFILES.
 */
export function detectNiche(texts: (string | undefined)[]): { profile: NicheProfile; from: string } {
  for (const raw of texts) {
    if (!raw) continue;
    const text = normalizeText(raw);
    let best: NicheProfile | undefined;
    let bestScore = 0;
    for (const p of NICHE_PROFILES) {
      const sc = scoreProfile(p, text);
      if (sc > bestScore) {
        best = p;
        bestScore = sc;
      }
    }
    if (best) return { profile: best, from: raw };
  }
  return { profile: GENERIC_PROFILE, from: "" };
}

export function profileByKey(key: string): NicheProfile | undefined {
  return key === GENERIC_PROFILE.key ? GENERIC_PROFILE : NICHE_PROFILES.find((p) => p.key === key);
}

/** Monta o guia de formatos que o painel mostra ao estrategista e ao cliente. */
export function buildFormatGuide(profile: NicheProfile, detectadoPor = ""): FormatGuide {
  const picks = new Map(profile.formatos.map((f) => [f.key, f]));
  const avoid = new Map(profile.evitar.filter((e) => e.key).map((e) => [e.key!, e]));
  const rank: Record<FormatFit, number> = { "Carro-chefe": 0, Apoio: 1, Pontual: 2, Livre: 3, "Com cuidado": 4 };
  const opcoes = FORMATOS.map((f) => {
    const pick = picks.get(f.key);
    const av = avoid.get(f.key);
    const fit: FormatFit = pick ? pick.papel : av ? "Com cuidado" : "Livre";
    const nota = av ? `${av.pratica}: ${av.porque}` : pick?.porque;
    return { key: f.key, nome: f.nome, descricao: f.descricao, superficie: f.superficie, producao: f.producao, fit, ...(nota ? { nota } : {}) };
  }).sort((a, b) => rank[a.fit] - rank[b.fit]);

  return {
    nichoKey: profile.key,
    nicho: profile.nome,
    detectadoPor,
    generico: profile.key === GENERIC_PROFILE.key,
    leitura: profile.leitura,
    formatos: profile.formatos.map((f) => {
      const def = FORMATO_BY_KEY.get(f.key)!;
      return { ...f, nome: def.nome, descricao: def.descricao, superficie: def.superficie, producao: def.producao };
    }),
    superficies: profile.superficies,
    producao: profile.producao,
    cadencia: profile.cadencia,
    series: profile.series,
    evitar: profile.evitar,
    cuidados: profile.cuidados,
    opcoes,
    aviso: "Heurísticas de mercado para começar — ajuste com os dados reais de Performance do cliente. Regras de conselhos mudam: confira a versão vigente.",
  };
}
