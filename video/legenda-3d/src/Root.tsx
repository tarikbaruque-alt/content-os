import React from "react";
import { Composition } from "remotion";
import { Coluna, type ColunaProps, SOBRA_COLUNA } from "./coluna/Coluna";
import { Edicao, type EdicaoProps, SOBRA } from "./edicao/Edicao";
import { Legenda3D } from "./Legenda3D";
import { type Props, propsSchema } from "./tipos";

const exemplo: Props = {
  video: "exemplo/pessoa.webm",
  palavras: [],
  duracaoSegundos: 5,
  fps: 30,
  largura: 1080,
  altura: 1920,
  fonte: "Anton",
  corTexto: "#ffffff",
  corDestaque: "#00A8A3",
  corFundo: "#030405",
  fundo: "preto",
  posicao: "atras",
  tamanhoPessoa: 0.78,
  alturaLegenda: 0.17,
  maiusculas: true,
  palavrasPorFrase: 2,
  profundidade: 14,
  destaques: [],
  rodizioFontes: [],
  trocas: [],
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="Coluna"
    component={Coluna}
    defaultProps={{ palavras: [], duracao: 5 } as ColunaProps}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={150}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props.duracao + SOBRA_COLUNA) * 30) })}
  />
  <Composition
    id="Edicao"
    component={Edicao}
    defaultProps={{ palavras: [], duracao: 5 } as EdicaoProps}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={150}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props.duracao + SOBRA) * 30) })}
  />
  <Composition
    id="Legenda3D"
    component={Legenda3D}
    schema={propsSchema}
    defaultProps={exemplo}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={150}
    calculateMetadata={({ props }) => ({
      fps: props.fps,
      width: props.largura,
      height: props.altura,
      durationInFrames: Math.max(1, Math.ceil(props.duracaoSegundos * props.fps)),
    })}
  />
  </>
);
