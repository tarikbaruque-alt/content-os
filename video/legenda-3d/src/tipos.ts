import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { NOMES_FONTES } from "./fontes";

export const palavraSchema = z.object({
  palavra: z.string(),
  inicio: z.number(),
  fim: z.number(),
});
export type Palavra = z.infer<typeof palavraSchema>;

export const trocaSchema = z.object({
  aPartirDe: z.number().describe("segundo do vídeo em que a troca começa"),
  fonte: z.enum(NOMES_FONTES).optional(),
  corDestaque: zColor().optional(),
  posicao: z.enum(["atras", "esquerda", "direita"]).optional(),
});

export const propsSchema = z.object({
  video: z.string().describe("arquivo em public/ com a pessoa sem fundo (.webm)"),
  palavras: z.array(palavraSchema),
  duracaoSegundos: z.number(),
  fps: z.number(),
  largura: z.number(),
  altura: z.number(),
  fonte: z.enum(NOMES_FONTES),
  corTexto: zColor(),
  corDestaque: zColor(),
  corFundo: zColor(),
  fundo: z.enum(["preto", "grade3d", "pontos"]),
  posicao: z.enum(["atras", "esquerda", "direita"]),
  tamanhoPessoa: z.number().min(0.4).max(1).describe("escala da pessoa, presa na base do quadro"),
  alturaLegenda: z.number().min(0.1).max(0.9).describe("centro da legenda, de 0 (topo) a 1 (base)"),
  maiusculas: z.boolean(),
  palavrasPorFrase: z.number().int().min(1).max(6),
  profundidade: z.number().min(0).max(40).describe("espessura da letra em 3D, em px"),
  destaques: z.array(z.string()).describe("palavras sempre na cor de destaque"),
  rodizioFontes: z.array(z.enum(NOMES_FONTES)).describe("se preenchido, cada frase usa a próxima fonte da lista"),
  trocas: z.array(trocaSchema).describe("mudanças de estilo a partir de um segundo do vídeo"),
});
export type Props = z.infer<typeof propsSchema>;
