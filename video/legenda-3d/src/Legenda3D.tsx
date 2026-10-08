import { fitText } from "@remotion/layout-utils";
import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type Fonte, type NomeFonte, usarFonte } from "./fontes";
import { type Frase, limparPalavra, montarFrases } from "./frases";
import type { Palavra, Props } from "./tipos";

type Posicao = Props["posicao"];

// Margens da skill de animação: texto a 80 px ou mais do topo e 100 px ou mais das laterais.
const MARGEM_TOPO = 80;
const MARGEM_LADO = 100;

// Curva de intensidade: forte nos primeiros 30 s, desce até 2:30 e fica calma depois.
const intensidade = (t: number) => interpolate(t, [0, 30, 150], [1, 1, 0.35], { extrapolateRight: "clamp" });

const useFontesProntas = (nomes: NomeFonte[]) => {
  const fontes = useMemo(() => Object.fromEntries(nomes.map((n) => [n, usarFonte(n)])) as Record<NomeFonte, Fonte>, [nomes.join("|")]);
  const [prontas, setProntas] = useState(false);
  const [handle] = useState(() => delayRender("carregando fontes"));
  useEffect(() => {
    document.fonts.ready.then(() => {
      setProntas(true);
      continueRender(handle);
    });
  }, [handle]);
  return { fontes, prontas };
};

const estiloEm = (props: Props, t: number) => {
  let atual = { fonte: props.fonte, corDestaque: props.corDestaque, posicao: props.posicao };
  for (const troca of [...props.trocas].sort((a, b) => a.aPartirDe - b.aPartirDe)) {
    if (troca.aPartirDe > t) break;
    atual = {
      fonte: troca.fonte ?? atual.fonte,
      corDestaque: troca.corDestaque ?? atual.corDestaque,
      posicao: troca.posicao ?? atual.posicao,
    };
  }
  return atual;
};

const extrusao = (cor: string, profundidade: number) =>
  Array.from({ length: Math.round(profundidade) }, (_, i) => `${(i + 1) * 0.5}px ${i + 1}px 0 color-mix(in srgb, ${cor} 30%, black)`).join(", ");

const Fundo: React.FC<{ tipo: Props["fundo"]; cor: string; t: number }> = ({ tipo, cor, t }) => {
  if (tipo === "pontos") {
    return (
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(color-mix(in srgb, ${cor} 35%, transparent) 2px, transparent 2.5px)`,
          backgroundSize: "56px 56px",
          backgroundPosition: `0 ${t * 12}px`,
        }}
      />
    );
  }
  if (tipo === "grade3d") {
    const linha = `color-mix(in srgb, ${cor} 30%, transparent)`;
    return (
      <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: "50% 40%", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "-100%",
            width: "300%",
            top: "45%",
            height: "120%",
            transform: "rotateX(74deg)",
            transformOrigin: "50% 0%",
            backgroundImage: `linear-gradient(${linha} 2px, transparent 2px), linear-gradient(90deg, ${linha} 2px, transparent 2px)`,
            backgroundSize: "120px 120px",
            backgroundPosition: `0 ${t * 60}px`,
            maskImage: "linear-gradient(to bottom, transparent, black 35%)",
          }}
        />
      </AbsoluteFill>
    );
  }
  return null;
};

const Legenda: React.FC<{
  frase: Frase;
  props: Props;
  fonte: Fonte;
  corDestaque: string;
  posicao: Posicao;
  t: number;
  fimVisivel: number;
}> = ({ frase, props, fonte, corDestaque, posicao, t, fimVisivel }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = intensidade(frase.inicio);
  const lateral = posicao !== "atras";
  const direcao = posicao === "esquerda" ? 1 : posicao === "direita" ? -1 : 0;
  const larguraUtil = lateral ? width * 0.44 - MARGEM_LADO : width - 2 * MARGEM_LADO;
  const maximo = lateral ? height * 0.11 : height * 0.2;
  const destaques = new Set(props.destaques.map((d) => d.toLowerCase()));

  // Atrás: a frase numa linha só, larga, por cima da cabeça. Ao lado: uma palavra por linha.
  const grupos: Palavra[][] = lateral
    ? frase.palavras.map((p) => [p])
    : frase.palavras.length > 3
      ? [frase.palavras.slice(0, Math.ceil(frase.palavras.length / 2)), frase.palavras.slice(Math.ceil(frase.palavras.length / 2))]
      : [frase.palavras];
  const textoDe = (p: Palavra) => (props.maiusculas ? limparPalavra(p.palavra).toUpperCase() : limparPalavra(p.palavra));
  const linhas = grupos.map((ps) => {
    const { fontSize } = fitText({ text: ps.map(textoDe).join(" "), withinWidth: larguraUtil * 0.94, fontFamily: fonte.familia, fontWeight: fonte.peso });
    return { ps, tamanho: Math.min(fontSize, maximo) };
  });
  const alturaBloco = linhas.reduce((s, l) => s + l.tamanho * 0.98, 0);
  const centro = height * props.alturaLegenda;
  const topo = Math.max(MARGEM_TOPO, centro - alturaBloco / 2);

  const saida = interpolate(t, [fimVisivel - 0.15, fimVisivel], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const balanco = 1 + 2 * k;
  const giroY = -direcao * 16 + Math.sin(t * 0.5) * balanco;
  const giroX = 6 + Math.cos(t * 0.37) * balanco * 0.6;

  return (
    <AbsoluteFill style={{ perspective: 1400, perspectiveOrigin: "50% 40%", opacity: saida }}>
      <div
        style={{
          position: "absolute",
          top: topo,
          left: posicao === "direita" ? width * 0.56 : MARGEM_LADO,
          width: larguraUtil,
          transformStyle: "preserve-3d",
          transform: `rotateX(${giroX}deg) rotateY(${giroY}deg) translateZ(${-(1 - saida) * 300}px)`,
          transformOrigin: direcao === 1 ? "0% 50%" : direcao === -1 ? "100% 50%" : "50% 50%",
          textAlign: lateral ? (direcao === 1 ? "left" : "right") : "center",
        }}
      >
        {linhas.map(({ ps, tamanho }, i) => (
          <div key={i} style={{ fontSize: tamanho, lineHeight: 0.98, whiteSpace: "nowrap", transformStyle: "preserve-3d" }}>
            {ps.map((p, j) => {
              const local = frame - Math.round(p.inicio * fps);
              const s = local < 0 ? 0 : spring({ frame: local, fps, config: { damping: 13, stiffness: 170, mass: 0.6 } });
              const falando = t >= p.inicio && t < p.fim + 0.15;
              const fixa = destaques.has(limparPalavra(p.palavra).toLowerCase()) || /\d/.test(p.palavra);
              const cor = falando || fixa ? corDestaque : props.corTexto;
              const brilho = falando ? `, 0 0 ${24 + 30 * k}px color-mix(in srgb, ${corDestaque} 70%, transparent)` : "";
              return (
                <span
                  key={j}
                  style={{
                    display: "inline-block",
                    marginLeft: j ? "0.25em" : 0,
                    fontFamily: fonte.familia,
                    fontWeight: fonte.peso,
                    fontStyle: fonte.italico ? "italic" : "normal",
                    color: cor,
                    textShadow: extrusao(cor, props.profundidade) + brilho,
                    opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                    filter: `blur(${(1 - s) * 10 * k}px)`,
                    transform: `translateZ(${(1 - s) * -700 * (0.5 + k / 2)}px) rotateX(${(1 - s) * 70}deg) scale(${1 + (falando ? 0.04 * k : 0)})`,
                    transformOrigin: "50% 100%",
                  }}
                >
                  {textoDe(p)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Legenda3D: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const frases = useMemo(() => montarFrases(props.palavras, props.palavrasPorFrase), [props.palavras, props.palavrasPorFrase]);
  const nomes = useMemo(
    () => [...new Set<NomeFonte>([props.fonte, ...props.rodizioFontes, ...props.trocas.flatMap((x) => (x.fonte ? [x.fonte] : []))])],
    [props.fonte, props.rodizioFontes, props.trocas],
  );
  const { fontes, prontas } = useFontesProntas(nomes);
  const estilo = estiloEm(props, t);

  let indice = -1;
  for (let i = 0; i < frases.length && frases[i]!.inicio <= t; i++) indice = i;
  const frase = frases[indice];
  const proxima = frases[indice + 1];
  const fimVisivel = frase ? Math.min(proxima ? proxima.inicio : Infinity, frase.fim + 0.8) : 0;
  const nomeFonte = props.rodizioFontes.length && frase ? props.rodizioFontes[frase.indice % props.rodizioFontes.length]! : estilo.fonte;

  const lateral = estilo.posicao !== "atras";
  const lado = estilo.posicao === "esquerda" ? 1 : -1;

  return (
    <AbsoluteFill style={{ backgroundColor: props.corFundo }}>
      <Fundo tipo={props.fundo} cor={estilo.corDestaque} t={t} />
      {prontas && frase && t < fimVisivel ? (
        <Legenda
          key={frase.indice}
          frase={frase}
          props={props}
          fonte={fontes[nomeFonte]}
          corDestaque={estilo.corDestaque}
          posicao={estilo.posicao}
          t={t}
          fimVisivel={fimVisivel}
        />
      ) : null}
      <AbsoluteFill
        style={{
          transform: `translateX(${lateral ? lado * 26 : 0}%) scale(${props.tamanhoPessoa})`,
          transformOrigin: "50% 100%",
        }}
      >
        <OffthreadVideo src={staticFile(props.video)} transparent style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
