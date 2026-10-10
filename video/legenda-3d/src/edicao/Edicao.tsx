import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Freeze,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { usarFonte } from "../fontes";
import { COR, PLANOS } from "./marca";
import { BROLLS, type BRoll, CAPITULOS, PAGINAS, PALAVRAS_CHAVE, SECAO_LARANJA, SONS, TOMADAS } from "./roteiro";

export type PalavraEdicao = { palavra: string; inicio: number; fim: number };
export type EdicaoProps = { palavras: PalavraEdicao[]; duracao: number };

const ANTON = usarFonte("Anton");
const MONT = usarFonte("Montserrat");
const SOBRA_FINAL = 1.1; // segundos com o último quadro congelado no fim
const FIM_LEGENDA = 46.86; // a partir daqui a chamada final substitui a legenda

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const corDe = (nome: string) => (COR as Record<string, string>)[nome] ?? nome;
const limpar = (s: string) => s.replace(/[.,!?;:]+$/g, "");

// ---------- tempo ----------
const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, frame, fps };
};

/** Mola de entrada a partir de t0 (0 antes de t0). */
const useMola = (t0: number, config = { damping: 12, stiffness: 190, mass: 0.7 }) => {
  const { frame, fps } = useT();
  const local = frame - Math.round(t0 * fps);
  return local < 0 ? 0 : spring({ frame: local, fps, config });
};

const saida = (t: number, t1: number, dur = 0.18) => interpolate(t, [t1 - dur, t1], [1, 0], clamp);

const extrusao = (cor: string, prof: number) =>
  Array.from({ length: prof }, (_, i) => `${(i + 1) * 0.4}px ${i + 1}px 0 ${cor}`).join(", ");

// ---------- câmera ----------
const IMPACTOS = [0.08, 1.84, 10.76, 32.47, 44.04];

const useCamera = () => {
  const { t } = useT();
  const tomada = TOMADAS.find((x) => t >= x.ini && t < x.fim) ?? TOMADAS[TOMADAS.length - 1]!;
  const p = PLANOS[tomada.plano];
  const deriva = 1 + 0.03 * interpolate(t, [tomada.ini, tomada.fim], [0, 1], clamp);
  let dx = 0;
  let dy = 0;
  for (const i of IMPACTOS) {
    const d = t - i;
    if (d >= 0 && d < 0.3) {
      const a = 14 * Math.exp(-d * 14);
      dx += Math.sin(d * 90) * a;
      dy += Math.cos(d * 77) * a * 0.7;
    }
  }
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${p.escala * deriva})`,
    transformOrigin: `${p.origemX}% ${p.origemY}%`,
  };
};

const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const estilo = useCamera();
  return <AbsoluteFill style={estilo}>{children}</AbsoluteFill>;
};

// ---------- peças gráficas ----------
const Pilula: React.FC<{ texto: string; fundo: string; cor: string; tamanho: number; style?: React.CSSProperties }> = ({
  texto,
  fundo,
  cor,
  tamanho,
  style,
}) => (
  <div
    style={{
      display: "inline-block",
      background: fundo,
      color: cor,
      fontFamily: ANTON.familia,
      fontSize: tamanho,
      lineHeight: 1,
      padding: `${tamanho * 0.18}px ${tamanho * 0.42}px ${tamanho * 0.14}px`,
      borderRadius: tamanho * 0.3,
      letterSpacing: 1,
      boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {texto}
  </div>
);

const Titulo: React.FC<{ texto: string; cor: string; sombra: string; tamanho: number; style?: React.CSSProperties }> = ({
  texto,
  cor,
  sombra,
  tamanho,
  style,
}) => (
  <div
    style={{
      fontFamily: ANTON.familia,
      fontSize: tamanho,
      lineHeight: 1,
      color: cor,
      whiteSpace: "nowrap",
      textShadow: `${extrusao(sombra, Math.max(3, Math.round(tamanho / 14)))}, 0 ${Math.round(tamanho / 6)}px ${Math.round(tamanho / 4)}px rgba(0,0,0,0.26)`,
      ...style,
    }}
  >
    {texto}
  </div>
);

const Seta: React.FC<{ cor: string; tamanho: number; baixo?: boolean }> = ({ cor, tamanho, baixo }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ transform: baixo ? "rotate(180deg)" : undefined }}>
    <path d="M50 6 L92 52 H64 V94 H36 V52 H8 Z" fill={cor} stroke={COR.preto} strokeWidth={5} strokeLinejoin="round" />
  </svg>
);

const Check: React.FC<{ tamanho: number; cor?: string }> = ({ tamanho, cor = COR.verde }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill={cor} />
    <path d="M27 52 L44 68 L74 34" fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Entrada "batida": vem grande e desfocada e assenta no lugar. */
const Batida: React.FC<{ t0: number; t1: number; children: React.ReactNode; style?: React.CSSProperties; de?: number }> = ({
  t0,
  t1,
  children,
  style,
  de = 1.7,
}) => {
  const { t } = useT();
  const s = useMola(t0, { damping: 14, stiffness: 220, mass: 0.8 });
  if (t < t0 || t > t1) return null;
  const sai = saida(t, t1);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        opacity: Math.min(1, s * 3) * sai,
        filter: `blur(${(1 - Math.min(1, s)) * 14}px)`,
        transform: `scale(${interpolate(s, [0, 1], [de, 1]) * interpolate(sai, [0, 1], [0.92, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Entrada deslizando de cima, com mola. */
const Desliza: React.FC<{ t0: number; t1: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t0,
  t1,
  children,
  style,
}) => {
  const { t } = useT();
  const s = useMola(t0);
  if (t < t0 || t > t1) return null;
  const sai = saida(t, t1);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(1, s * 2) * sai,
        transform: `translateY(${(1 - s) * -60}px) scale(${interpolate(s, [0, 1], [0.8, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- gráficos atrás da pessoa ----------
const Abertura: React.FC = () => {
  const { t } = useT();
  const vs = useMola(1.2, { damping: 9, stiffness: 240, mass: 0.6 });
  const tam2 = 106;
  if (t > 2.94) return null;
  return (
    <>
      <Batida t0={0.08} t1={2.94} style={{ top: 22 }}>
        <Titulo texto="HIPERTROFIA" cor={COR.verde} sombra={COR.verdeEscuro} tamanho={122} />
      </Batida>
      <Batida t0={1.84} t1={2.94} style={{ top: 140, paddingLeft: 108 }}>
        <Titulo texto="EMAGRECIMENTO" cor={COR.laranja} sombra={COR.laranjaEscuro} tamanho={tam2} />
      </Batida>
      {t >= 1.2 ? (
        <div
          style={{
            position: "absolute",
            left: 112,
            top: 146,
            width: 92,
            height: 92,
            borderRadius: 46,
            background: COR.preto,
            border: "6px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: ANTON.familia,
            fontSize: 44,
            color: "#fff",
            boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
            transform: `scale(${vs}) rotate(${(1 - vs) * -90}deg)`,
            opacity: saida(t, 2.94),
            zIndex: 2,
          }}
        >
          VS
        </div>
      ) : null}
    </>
  );
};

const NaoMuda: React.FC = () => (
  <>
    <Desliza t0={9.48} t1={11.62} style={{ top: 70 }}>
      <Pilula texto="O TREINO" fundo={COR.preto} cor="#fff" tamanho={64} />
    </Desliza>
    <Batida t0={10.76} t1={11.62} style={{ top: 168 }}>
      <Titulo texto="NÃO MUDA" cor={COR.preto} sombra="rgba(0,0,0,0.18)" tamanho={150} />
      <Check tamanho={118} />
    </Batida>
    <Desliza t0={12.36} t1={13.74} style={{ top: 110 }}>
      <Pilula texto="O QUE MUDA?" fundo={COR.verde} cor="#fff" tamanho={92} />
    </Desliza>
  </>
);

const ConsumirMais: React.FC = () => (
  <>
    <Desliza t0={19.19} t1={21.54} style={{ top: 70, right: 640, justifyContent: "flex-end" }}>
      <Pilula texto="CONSUMIR" fundo={COR.preto} cor="#fff" tamanho={62} />
    </Desliza>
    <Batida t0={19.99} t1={21.54} style={{ top: 176, right: 610, justifyContent: "flex-end", gap: 14 }}>
      <Titulo texto="MAIS" cor={COR.verde} sombra={COR.verdeEscuro} tamanho={160} />
      <Seta cor={COR.verde} tamanho={110} />
    </Batida>
  </>
);

const Checklist: React.FC = () => {
  const { t } = useT();
  const a = useMola(23.75);
  const b = useMola(24.71);
  if (t < 23.7 || t > 27.47) return null;
  const sai = saida(t, 27.47);
  const chip = (s: number, texto: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: COR.preto,
        borderRadius: 26,
        padding: "16px 28px 14px 18px",
        boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
        opacity: Math.min(1, s * 2),
        transform: `scale(${interpolate(s, [0, 1], [0.6, 1])}) translateY(${(1 - s) * -40}px)`,
      }}
    >
      <Check tamanho={64} />
      <span style={{ fontFamily: ANTON.familia, fontSize: 70, color: "#fff", lineHeight: 1 }}>{texto}</span>
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 34, left: 0, right: 0, opacity: sai }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 26 }}>
        {t >= 23.75 ? chip(a, "VOLUME") : <div style={{ width: 300 }} />}
        {t >= 24.71 ? chip(b, "INTENSIDADE") : <div style={{ width: 480 }} />}
      </div>
      <Desliza t0={26.47} t1={27.47} style={{ top: 118 }}>
        <Titulo texto="ADEQUADOS AO OBJETIVO" cor={COR.verde} sombra={COR.verdeEscuro} tamanho={68} />
      </Desliza>
    </div>
  );
};

const Deficit: React.FC = () => {
  const { t } = useT();
  const c = useMola(33.11, { damping: 10, stiffness: 230, mass: 0.6 });
  return (
    <Batida t0={32.47} t1={34.5} style={{ top: 46, gap: 18 }}>
      <Titulo texto="DÉFICIT" cor={COR.laranja} sombra={COR.laranjaEscuro} tamanho={118} />
      <div style={{ opacity: t >= 33.11 ? Math.min(1, c * 2) : 0, transform: `scale(${interpolate(c, [0, 1], [0.4, 1])})` }}>
        <Titulo texto="CALÓRICO" cor={COR.preto} sombra="rgba(0,0,0,0.15)" tamanho={118} />
      </div>
      <Seta cor={COR.laranja} tamanho={92} baixo />
    </Batida>
  );
};

const ConsumirGastar: React.FC = () => {
  const { t } = useT();
  const cA = useMola(34.55);
  const cB = useMola(36.17);
  const mA = useMola(35.53, { damping: 9, stiffness: 230, mass: 0.6 });
  const mB = useMola(36.73, { damping: 9, stiffness: 230, mass: 0.6 });
  if (t < 34.55 || t > 37.2) return null;
  const sai = saida(t, 37.2);
  const cartao = (s: number, m: number, mostrarM: boolean, rotulo: string, valor: string, cor: string, baixo: boolean, left: number) => (
    <div
      style={{
        position: "absolute",
        top: 70,
        left,
        width: 320,
        height: 240,
        borderRadius: 34,
        background: COR.preto,
        boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        opacity: Math.min(1, s * 2) * sai,
        transform: `translateY(${(1 - s) * -80}px) rotate(${(1 - s) * (baixo ? -8 : 8)}deg)`,
      }}
    >
      <span style={{ fontFamily: ANTON.familia, fontSize: 60, color: "#fff", lineHeight: 1 }}>{rotulo}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: mostrarM ? 1 : 0,
          transform: `scale(${mostrarM ? interpolate(m, [0, 1], [0.3, 1]) : 0.3})`,
        }}
      >
        <span style={{ fontFamily: ANTON.familia, fontSize: 92, color: cor, lineHeight: 1 }}>{valor}</span>
        <Seta cor={cor} tamanho={68} baixo={baixo} />
      </div>
    </div>
  );
  return (
    <>
      {cartao(cA, mA, t >= 35.53, "CONSUMIR", "MENOS", COR.laranja, true, 18)}
      {t >= 36.17 ? cartao(cB, mB, t >= 36.73, "GASTAR", "MAIS", COR.verde, false, 742) : null}
    </>
  );
};

const Preservar: React.FC = () => (
  <>
    <Desliza t0={43.0} t1={45.25} style={{ top: 22 }}>
      <Pilula texto="PRESERVAR" fundo={COR.preto} cor="#fff" tamanho={54} />
    </Desliza>
    <Batida t0={44.04} t1={45.25} style={{ top: 104 }}>
      <Titulo texto="MASSA MUSCULAR" cor={COR.verde} sombra={COR.verdeEscuro} tamanho={100} />
    </Batida>
  </>
);

// Trechos em que existe gráfico atrás da pessoa (só neles o recorte é desenhado).
const ATRAS: [number, number][] = [
  [0, 2.96],
  [9.45, 13.76],
  [19.15, 21.56],
  [23.7, 27.5],
  [32.4, 37.22],
  [42.95, 45.27],
];

// ---------- B-roll ----------
const Rotulos: React.FC<{ rotulos: BRoll["rotulos"]; fim: number }> = ({ rotulos, fim }) => (
  <>
    {rotulos.map((r, i) => (
      <Desliza key={i} t0={r.t} t1={fim} style={{ top: 150 + i * 120 }}>
        <Pilula
          texto={r.texto}
          fundo={r.cor === "branco" ? "#fff" : corDe(r.cor)}
          cor={r.cor === "branco" ? COR.preto : "#fff"}
          tamanho={i === 0 ? 76 : 60}
        />
      </Desliza>
    ))}
  </>
);

const CamadaBRoll: React.FC<{ b: BRoll }> = ({ b }) => {
  const { t } = useT();
  if (t < b.ini || t > b.fim) return null;
  const p = interpolate(t, [b.ini, b.fim], [0, 1], clamp);
  const entra = interpolate(t, [b.ini, b.ini + 0.22], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const sai = saida(t, b.fim, 0.2);
  const src = staticFile(b.src);
  if (b.estilo === "cartao") {
    return (
      <AbsoluteFill style={{ opacity: Math.min(entra * 1.5, 1) * sai }}>
        <Img src={src} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(38px) brightness(0.55) saturate(1.2)" }} />
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Img
            src={src}
            style={{
              position: "absolute",
              left: 50,
              width: 980,
              top: 560,
              borderRadius: 40,
              boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
              transform: `translateY(${(1 - entra) * 260}px) rotateX(${(1 - entra) * 25}deg) rotateY(${interpolate(p, [0, 1], [-6, 6])}deg) scale(${1 + p * 0.05})`,
            }}
          />
        </AbsoluteFill>
        <Rotulos rotulos={b.rotulos} fim={b.fim} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ opacity: Math.min(entra * 1.5, 1) * sai, overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${1.06 + p * 0.1 + (1 - entra) * 0.3}) translateY(${interpolate(p, [0, 1], [10, -20])}px)`,
          filter: `blur(${(1 - entra) * 16}px)`,
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.5))" }} />
      <Rotulos rotulos={b.rotulos} fim={b.fim} />
    </AbsoluteFill>
  );
};

// ---------- legenda ----------
type Pagina = { palavras: PalavraEdicao[]; ini: number; fim: number };

const paginar = (palavras: PalavraEdicao[]): Pagina[] =>
  PAGINAS.filter(([, b]) => b < palavras.length).map(([a, b]) => {
    const ps = palavras.slice(a, b + 1);
    return { palavras: ps, ini: ps[0]!.inicio, fim: ps[ps.length - 1]!.fim };
  });

const Legenda: React.FC<{ palavras: PalavraEdicao[] }> = ({ palavras }) => {
  const { t, frame, fps } = useT();
  const paginas = useMemo(() => paginar(palavras), [palavras]);
  const idx = paginas.findIndex((p, i) => t >= p.ini && t < (paginas[i + 1]?.ini ?? p.fim + 0.6));
  const pag = paginas[idx];
  if (!pag || t >= FIM_LEGENDA) return null;
  const laranja = t >= SECAO_LARANJA.ini && t < SECAO_LARANJA.fim;
  const destaque = laranja ? COR.laranja : COR.verde;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 1350,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: 48,
        rowGap: 0,
      }}
    >
      {pag.palavras.map((p, i) => {
        const local = frame - Math.round(p.inicio * fps);
        if (local < 0) return null;
        const s = spring({ frame: local, fps, config: { damping: 11, stiffness: 260, mass: 0.5 } });
        const falando = t >= p.inicio && t < p.fim;
        const chave = PALAVRAS_CHAVE.has(limpar(p.palavra).toLowerCase());
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: MONT.familia,
              fontWeight: 900,
              fontSize: 88,
              lineHeight: 1.12,
              textTransform: "uppercase",
              color: falando || chave ? destaque : "#fff",
              WebkitTextStroke: "14px #000",
              paintOrder: "stroke fill",
              textShadow: "0 8px 0 rgba(0,0,0,0.55)",
              transform: `translateY(${(1 - s) * 26}px) scale(${interpolate(s, [0, 1], [0.55, 1]) * (falando ? 1.06 : 1)})`,
              opacity: Math.min(1, s * 2.5),
            }}
          >
            {limpar(p.palavra)}
          </span>
        );
      })}
    </div>
  );
};

const Capitulo: React.FC = () => {
  const { t } = useT();
  const c = CAPITULOS.find((x) => t >= x.ini && t < x.fim);
  const s = useMola(c?.ini ?? 0);
  if (!c) return null;
  const sai = saida(t, c.fim, 0.2);
  return (
    <div style={{ position: "absolute", top: 1640, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, s * 2) * sai }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "rgba(14,14,16,0.88)",
          borderRadius: 40,
          padding: "14px 30px 12px 22px",
          transform: `translateY(${(1 - s) * 40}px)`,
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 11, background: corDe(c.cor) }} />
        <span style={{ fontFamily: MONT.familia, fontWeight: 900, fontSize: 34, color: "#fff", letterSpacing: 3 }}>{c.texto}</span>
      </div>
    </div>
  );
};

// ---------- chamada final ----------
const Icone: React.FC<{ tipo: "compartilhar" | "curtir" | "comentar"; ativo: boolean }> = ({ tipo, ativo }) => {
  const traço = { fill: "none", stroke: COR.preto, strokeWidth: 8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tipo === "curtir")
    return (
      <svg width="96" height="96" viewBox="0 0 100 100">
        <path d="M50 84 C20 64 10 48 10 34 C10 20 21 12 32 12 C40 12 46 16 50 23 C54 16 60 12 68 12 C79 12 90 20 90 34 C90 48 80 64 50 84 Z" {...traço} fill={ativo ? "#FF2D55" : "none"} stroke={ativo ? "#FF2D55" : COR.preto} />
      </svg>
    );
  if (tipo === "comentar")
    return (
      <svg width="96" height="96" viewBox="0 0 100 100">
        <path d="M50 14 C74 14 90 28 90 46 C90 64 74 78 50 78 C44 78 38 77 33 75 L14 86 L19 68 C13 62 10 54 10 46 C10 28 26 14 50 14 Z" {...traço} />
      </svg>
    );
  return (
    <svg width="96" height="96" viewBox="0 0 100 100">
      <path d="M86 14 L12 46 L42 56 L52 86 Z M42 56 L86 14" {...traço} />
    </svg>
  );
};

const Chamada: React.FC = () => {
  const { t } = useT();
  const itens = [
    { t0: 46.9, tipo: "compartilhar" as const, texto: "COMPARTILHA" },
    { t0: 47.86, tipo: "curtir" as const, texto: "CURTE" },
    { t0: 48.58, tipo: "comentar" as const, texto: "COMENTA" },
  ];
  const molas = [useMola(46.9, { damping: 8, stiffness: 220, mass: 0.6 }), useMola(47.86, { damping: 8, stiffness: 220, mass: 0.6 }), useMola(48.58, { damping: 8, stiffness: 220, mass: 0.6 })];
  if (t < 46.86) return null;
  return (
    <div style={{ position: "absolute", top: 1290, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 46 }}>
      {itens.map((it, i) => {
        const s = molas[i]!;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: t >= it.t0 ? 1 : 0.0, transform: `scale(${t >= it.t0 ? s : 0})` }}>
            <div style={{ width: 170, height: 170, borderRadius: 85, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 40px rgba(0,0,0,0.25)", border: `6px solid ${COR.preto}` }}>
              <Icone tipo={it.tipo} ativo={t >= it.t0} />
            </div>
            <span style={{ fontFamily: ANTON.familia, fontSize: 50, color: "#fff", WebkitTextStroke: "10px #000", paintOrder: "stroke fill" }}>{it.texto}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- composição ----------
const useFontes = () => {
  const [handle] = useState(() => delayRender("fontes"));
  const [ok, setOk] = useState(false);
  useEffect(() => {
    document.fonts.ready.then(() => {
      setOk(true);
      continueRender(handle);
    });
  }, [handle]);
  return ok;
};

export const Edicao: React.FC<EdicaoProps> = ({ palavras, duracao }) => {
  const { t, fps } = useT();
  const prontas = useFontes();
  const ultimo = Math.floor(duracao * fps) - 2;
  const congelado = t * fps >= ultimo;
  const atras = ATRAS.some(([a, b]) => t >= a && t < b);
  const video = (src: string, extra: object) => {
    const el = <OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%" }} {...extra} />;
    return congelado ? <Freeze frame={ultimo}>{el}</Freeze> : el;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Camera>{video("edicao/base.mp4", { volume: 1 })}</Camera>
      {prontas ? (
        <>
          <Abertura />
          <NaoMuda />
          <ConsumirMais />
          <Checklist />
          <Deficit />
          <ConsumirGastar />
          <Preservar />
        </>
      ) : null}
      {atras ? <Camera>{video("edicao/pessoa.webm", { transparent: true, muted: true })}</Camera> : null}
      {prontas ? (
        <>
          {BROLLS.map((b, i) => (
            <CamadaBRoll key={i} b={b} />
          ))}
          <Capitulo />
          <Legenda palavras={palavras} />
          <Chamada />
        </>
      ) : null}
      {SONS.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.t * fps))} durationInFrames={Math.round(1.6 * fps)}>
          <Audio src={staticFile(`edicao/sfx/${s.arquivo}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
      <Audio
        src={staticFile("edicao/sfx/trilha.wav")}
        volume={(f) => interpolate(f / fps, [0, 0.4, duracao - 0.6, duracao + SOBRA_FINAL], [0, 0.16, 0.16, 0], clamp)}
      />
    </AbsoluteFill>
  );
};

export const SOBRA = SOBRA_FINAL;
