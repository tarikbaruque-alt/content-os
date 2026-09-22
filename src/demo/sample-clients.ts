import type { IntelligenceInput } from "../agents/intelligence/schema.js";

/**
 * Clientes fictícios de nichos distintos, para demonstrar e testar Íris.
 * O conteúdo é propositalmente rico em pistas (negócio, público, dores,
 * desejos, objeções, VoC, diferenciais, comunicação, decisão, aprendizado).
 * Cliente B NÃO menciona preço/ticket — usado no teste de "não invenção".
 */
export type SampleClient = {
  client: { id: string; name: string; niche: string };
  input: IntelligenceInput;
};

export const SAMPLE_CLIENTS: SampleClient[] = [
  {
    client: { id: "dra-marina-trabalhista", name: "Dra. Marina — Advocacia Trabalhista", niche: "Advocacia trabalhista" },
    input: {
      clientId: "dra-marina-trabalhista",
      rawInputs: [
        {
          type: "interview",
          source: "Entrevista de onboarding — 10/03/2026",
          date: "2026-03-10",
          content: [
            "Sou advogada trabalhista e vendo consultoria jurídica e defesa em processos; meu ticket médio é R$ 3.500 por caso.",
            "Meu público são trabalhadores CLT demitidos e pequenos empreendedores.",
            "A maior dor deles é o medo de serem demitidos sem receber seus direitos.",
            "Eles desejam segurança e sentir que alguém está do lado deles.",
            "Uma objeção comum é que acham caro contratar um advogado.",
            "Meu diferencial é que explico cada etapa em linguagem simples, sem juridiquês.",
            "Tenho 8 anos de experiência e mais de 300 casos ganhos como prova social.",
            "Falo de forma acolhedora e informal, evito termos técnicos.",
            "No último mês, os Reels explicando a reforma trabalhista tiveram muito mais retenção.",
            "Decidimos focar em conteúdo de identificação para trabalhadores CLT.",
          ].join("\n"),
        },
        {
          type: "note",
          source: "DM de cliente — print enviado 11/03/2026",
          date: "2026-03-11",
          content: 'Uma cliente me escreveu: "Achei que ia ficar no prejuízo, mas você reverteu tudo e me devolveu a paz."',
        },
      ],
    },
  },
  {
    client: { id: "verde-vivo-cosmeticos", name: "Verde Vivo — Cosméticos Naturais", niche: "Cosméticos naturais" },
    input: {
      clientId: "verde-vivo-cosmeticos",
      rawInputs: [
        {
          type: "form",
          source: "Formulário de briefing — 05/03/2026",
          date: "2026-03-05",
          content: [
            "Tenho uma loja de cosméticos naturais e veganos.",
            "Meu público são mulheres de 25 a 40 anos preocupadas com sustentabilidade.",
            "A dor delas é não encontrar produtos sem crueldade animal que funcionem de verdade.",
            "Elas desejam cuidar da pele sem culpa ambiental.",
            "Uma objeção frequente é desconfiar que produto natural não é eficaz.",
            "Nosso diferencial é que só nós usamos embalagens compostáveis na região.",
            "Nossa comunicação é leve e educativa, com linguagem informal.",
            'Uma cliente comentou: "Finalmente um produto que respeita minha pele e o planeta."',
            "No último trimestre, os carrosséis de ingredientes engajaram mais.",
            "Vamos focar em educar sobre ingredientes.",
          ].join("\n"),
        },
      ],
    },
  },
  {
    client: { id: "rafa-nutri-esportivo", name: "Rafa Nutri — Nutrição Esportiva", niche: "Nutrição esportiva" },
    input: {
      clientId: "rafa-nutri-esportivo",
      rawInputs: [
        {
          type: "interview",
          source: "Call de diagnóstico — 08/03/2026",
          date: "2026-03-08",
          content: [
            "Sou nutricionista esportivo e vendo planos de acompanhamento mensal; o plano custa R$ 400 por mês.",
            "Meu público são homens de 20 a 35 anos que treinam e querem ganhar massa.",
            "A dor deles é treinar muito e não ver resultado na dieta.",
            "Eles desejam um corpo definido e mais energia no dia a dia.",
            "A objeção é achar que dieta de nutricionista é cara e restritiva.",
            "Meu diferencial é montar dietas com comida de verdade, sem shakes caros.",
            "Falo de forma direta e motivacional.",
            'Um cliente disse: "Em 3 meses ganhei 6kg de massa seca."',
            "No último mês, os Reels de refeições práticas tiveram mais salvamentos.",
            "Decidi focar em conteúdo de transformação real.",
          ].join("\n"),
        },
      ],
    },
  },
];
