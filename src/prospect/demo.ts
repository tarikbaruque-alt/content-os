import type { Lead } from "./types.js";
import { newLead } from "./factory.js";

/**
 * DADOS FICTÍCIOS DE DEMONSTRAÇÃO — pessoa, perfil e números inventados só para
 * mostrar como a ferramenta funciona. Não representam nenhum prospect real.
 */
export function demoLead(): Lead {
  const l = newLead("dra.helena.exemplo", "Dra. Helena Prado (exemplo fictício)");
  l.profile = {
    ...l.profile, id: "demo-helena", contato: "Helena", nicho: "medicos", cidade: "Campinas",
    temaDominado: "dermatologia estética", bio: "Dermatologista | Especialista em estética | Agende sua consulta",
    posts30d: 3, reels30d: 0, carrosseis30d: 1, stories: "raro", ctaNaBio: false,
    mix: { educativo: 1, comercial: 1, institucional: 7, pessoal: 1, provaSocial: 0 },
    dims: {
      autoridade: { nota: "forte", obs: "A bio cita título e especialização" },
      qualidade: { nota: "regular" },
      consistencia_visual: { nota: "forte", obs: "Paleta e grade visual coerentes" },
      posicionamento: { nota: "fraca", obs: "Lista procedimentos sem dizer para quem são" },
      clareza_oferta: { nota: "regular" },
      prova_social: { nota: "ausente" },
      humanizacao: { nota: "fraca" },
      bio: { nota: "regular" },
    },
    header: { nome_busca: { nota: "fraca", obs: "O nome é só 'Helena Prado'" }, destaques: { nota: "fraca" }, fixados: { nota: "ausente" }, foto: { nota: "forte" } },
    notas: [{ texto: "A bio cita título e especialização, mas não diz para quem é o atendimento.", fonte: "Instagram (bio)" }],
    negocio: { nota: "forte", obs: "Consultório em clínica com estrutura visível" },
    capacidade: { nota: "regular", obs: "Clínica com equipe de atendimento visível" },
  };
  return l;
}
