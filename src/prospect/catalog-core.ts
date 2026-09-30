import type { DimKey, HeaderKey } from "./types.js";

// ------------------------------------------------------------------ nichos
export type Niche = { key: string; nome: string; dependeDe: ("autoridade" | "imagem" | "aquisicao")[]; custom?: boolean };

/**
 * Perfil-padrão de nichos: quais dependem, por natureza, de autoridade, imagem
 * ou aquisição digital. É uma HIPÓTESE de partida (não fato sobre um lead
 * específico) e você pode cadastrar novos nichos manualmente.
 */
export const NICHES: Niche[] = [
  { key: "medicos", nome: "Médicos", dependeDe: ["autoridade", "aquisicao"] },
  { key: "clinicas", nome: "Clínicas", dependeDe: ["autoridade", "imagem", "aquisicao"] },
  { key: "psicologos", nome: "Psicólogos", dependeDe: ["autoridade", "aquisicao"] },
  { key: "arquitetos", nome: "Arquitetos", dependeDe: ["imagem", "autoridade"] },
  { key: "educadores_fisicos", nome: "Educadores físicos", dependeDe: ["imagem", "autoridade", "aquisicao"] },
  { key: "academias", nome: "Academias", dependeDe: ["imagem", "aquisicao"] },
  { key: "restaurantes", nome: "Restaurantes", dependeDe: ["imagem", "aquisicao"] },
  { key: "cafeterias", nome: "Cafeterias", dependeDe: ["imagem", "aquisicao"] },
  { key: "lojas", nome: "Lojas", dependeDe: ["imagem", "aquisicao"] },
  { key: "moda", nome: "Marcas de moda", dependeDe: ["imagem", "aquisicao"] },
  { key: "ecommerces", nome: "E-commerces", dependeDe: ["imagem", "aquisicao"] },
  { key: "fotografos", nome: "Fotógrafos", dependeDe: ["imagem", "autoridade"] },
  { key: "profissionais_liberais", nome: "Profissionais liberais", dependeDe: ["autoridade", "aquisicao"] },
  { key: "infoprodutores", nome: "Infoprodutores", dependeDe: ["autoridade", "aquisicao"] },
  { key: "consultores", nome: "Consultores", dependeDe: ["autoridade", "aquisicao"] },
  { key: "prestadores_servicos", nome: "Prestadores de serviços", dependeDe: ["aquisicao"] },
  { key: "negocios_locais", nome: "Negócios locais", dependeDe: ["imagem", "aquisicao"] },
  { key: "especialistas", nome: "Especialistas que dependem de autoridade digital", dependeDe: ["autoridade", "aquisicao"] },
];

// -------------------------------------------------------------- dimensões
export type DimDef = { key: DimKey; label: string; grupo: "perfil" | "cadencia" | "formato" | "conversao" | "conteudo" | "funil" };

export const DIMENSOES: DimDef[] = [
  { key: "bio", label: "Bio", grupo: "perfil" },
  { key: "posicionamento", label: "Posicionamento", grupo: "perfil" },
  { key: "clareza_oferta", label: "Clareza da oferta", grupo: "perfil" },
  { key: "frequencia", label: "Frequência de postagem", grupo: "cadencia" },
  { key: "tipos_conteudo", label: "Tipos de conteúdo", grupo: "cadencia" },
  { key: "qualidade", label: "Qualidade percebida", grupo: "perfil" },
  { key: "consistencia_visual", label: "Consistência visual", grupo: "perfil" },
  { key: "reels", label: "Uso de Reels", grupo: "formato" },
  { key: "stories", label: "Stories", grupo: "formato" },
  { key: "carrosseis", label: "Carrosséis", grupo: "formato" },
  { key: "cta", label: "CTA (chamada para ação)", grupo: "conversao" },
  { key: "prova_social", label: "Prova social", grupo: "conversao" },
  { key: "autoridade", label: "Autoridade", grupo: "conteudo" },
  { key: "humanizacao", label: "Humanização", grupo: "conteudo" },
  { key: "educativo", label: "Conteúdo educativo", grupo: "conteudo" },
  { key: "comercial", label: "Conteúdo comercial", grupo: "conteudo" },
  { key: "descoberta", label: "Conteúdo de descoberta", grupo: "funil" },
  { key: "consideracao", label: "Conteúdo de consideração", grupo: "funil" },
  { key: "conversao", label: "Conteúdo de conversão", grupo: "funil" },
];
export const DIM_LABEL = Object.fromEntries(DIMENSOES.map((d) => [d.key, d.label])) as Record<DimKey, string>;

export const HEADER_PARTS: { key: HeaderKey; label: string; dica: string }[] = [
  { key: "foto", label: "Foto de perfil", dica: "Rosto/logo nítido, reconhecível em tamanho pequeno." },
  { key: "nome_busca", label: "Campo NOME com palavra-chave", dica: "O nome usa um termo que as pessoas pesquisam (ex.: Nome | especialidade)?" },
  { key: "handle", label: "@handle", dica: "Curto, memorável, coerente com a marca." },
  { key: "link", label: "Link da bio", dica: "Um link alinhado ao objetivo (agendamento, oferta, contato)." },
  { key: "categoria", label: "Categoria do perfil", dica: "Categoria clara abaixo do nome (contas comerciais/criador)." },
  { key: "destaques", label: "Destaques", dica: "Organizados pela próxima pergunta do visitante (início, prova, oferta, dúvidas)." },
  { key: "grid_9", label: "Primeiros 9 posts do grid", dica: "Legíveis de relance, com identidade visual coerente." },
  { key: "fixados", label: "Posts fixados", dica: "Melhores provas do que o seguidor vai encontrar." },
];

// ------------------------------------------------------------------ dores
export type PainDef = {
  key: string;
  label: string;
  /** IDs de gargalo cujos sinais sugerem esta dor. */
  sinais: string[];
  /** false = só a conversa revela (o perfil não permite observar). */
  observavel: boolean;
  pergunta: string;
};

/** Dores comuns em redes sociais — usadas como HIPÓTESES para investigar. Nunca são assumidas. */
export const PAINS: PainDef[] = [
  { key: "falta_tempo", label: "Falta de tempo para produzir", sinais: [], observavel: false, pergunta: "Quanto da sua semana consegue dedicar ao Instagram hoje, e isso é suficiente?" },
  { key: "nao_sabe_o_que_postar", label: "Não sabe o que postar", sinais: ["sem_estrategia"], observavel: false, pergunta: "Na hora de postar, o que costuma pesar mais: decidir o assunto ou produzir?" },
  { key: "falta_constancia", label: "Falta de constância", sinais: ["baixa_frequencia"], observavel: true, pergunta: "Vocês conseguem manter frequência ou acaba ficando difícil pela rotina?" },
  { key: "baixo_alcance", label: "Baixo alcance", sinais: ["baixo_alcance", "reels_baixo", "pouco_encontravel"], observavel: true, pergunta: "Você sente que o conteúdo chega a pessoas novas ou fica só entre quem já te segue?" },
  { key: "pouco_engajamento", label: "Pouco engajamento", sinais: [], observavel: false, pergunta: "Como você enxerga a resposta do público aos conteúdos hoje?" },
  { key: "conteudo_pouco_profissional", label: "Conteúdo pouco profissional", sinais: ["qualidade_baixa", "cabecalho_fraco"], observavel: true, pergunta: "Você sente que o perfil representa o nível do serviço que vocês entregam?" },
  { key: "sem_posicionamento", label: "Perfil sem posicionamento", sinais: ["sem_posicionamento", "estetica_sem_valor"], observavel: true, pergunta: "Como você explicaria, em uma frase, o que faz o cliente escolher vocês?" },
  { key: "dificuldade_autoridade", label: "Dificuldade de demonstrar autoridade", sinais: ["autoridade_nao_convertida", "sem_prova_social"], observavel: true, pergunta: "Você sente que o Instagram mostra o quanto você domina o assunto?" },
  { key: "conteudo_sem_clientes", label: "Conteúdo que não gera clientes", sinais: ["pouco_comercial", "oferta_sem_desejo"], observavel: true, pergunta: "Você sente que o Instagram realmente ajuda a gerar oportunidades comerciais?" },
  { key: "falta_estrategia", label: "Falta de estratégia", sinais: ["sem_estrategia", "institucional"], observavel: true, pergunta: "Hoje existe alguma estratégia por trás dos conteúdos ou vocês vão produzindo conforme aparecem ideias?" },
  { key: "falta_calendario", label: "Falta de calendário", sinais: ["baixa_frequencia", "sem_estrategia"], observavel: false, pergunta: "Vocês trabalham com algum planejamento mensal ou decidem semana a semana?" },
  { key: "falta_criatividade", label: "Falta de criatividade", sinais: [], observavel: false, pergunta: "Faltam ideias ou sobra ideia e falta tempo de executar?" },
  { key: "dificuldade_roteiro", label: "Dificuldade com roteiro", sinais: [], observavel: false, pergunta: "Na hora de gravar, o que trava: saber o que falar ou como estruturar?" },
  { key: "dificuldade_aparecer", label: "Dificuldade em aparecer", sinais: ["sem_humanizacao"], observavel: true, pergunta: "Como você se sente em aparecer nos conteúdos? O que incomoda mais?" },
  { key: "baixa_qualidade_videos", label: "Baixa qualidade de vídeos", sinais: ["qualidade_baixa"], observavel: true, pergunta: "Você está satisfeito com a qualidade dos vídeos que publica hoje?" },
  { key: "comunicacao_generica", label: "Comunicação genérica", sinais: ["estetica_sem_valor", "sem_posicionamento", "bio_fraca"], observavel: true, pergunta: "Se trocássemos o seu logo pelo de um concorrente, os conteúdos ainda fariam sentido?" },
  { key: "falta_identidade", label: "Falta de identidade", sinais: ["qualidade_baixa", "sem_posicionamento"], observavel: true, pergunta: "Existe uma identidade visual e de linguagem definida para o perfil?" },
  { key: "perfil_parado", label: "Perfil parado", sinais: ["baixa_frequencia"], observavel: true, pergunta: "O que aconteceu nos períodos em que o perfil ficou sem publicar?" },
  { key: "stories_sem_estrategia", label: "Stories sem estratégia", sinais: ["stories_sem_estrategia"], observavel: true, pergunta: "Os Stories têm um objetivo (relacionamento, prova, venda) ou vão saindo conforme dá?" },
  { key: "reels_sem_retencao", label: "Reels sem retenção", sinais: [], observavel: false, pergunta: "Você acompanha quanto tempo as pessoas assistem seus Reels?" },
  { key: "conteudo_sem_cta", label: "Conteúdo sem CTA", sinais: ["pouco_comercial", "bio_fraca"], observavel: true, pergunta: "Depois de ver um conteúdo, o que você quer que a pessoa faça?" },
  { key: "dependencia_indicacao", label: "Dependência exclusiva de indicação", sinais: ["dependencia_indicacao"], observavel: false, pergunta: "De onde vêm hoje os clientes novos: indicação, busca, redes sociais?" },
];
