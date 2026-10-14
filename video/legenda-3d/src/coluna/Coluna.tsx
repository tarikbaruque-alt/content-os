import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { usarFonte } from "../fontes";
import { BROLLS, CARIMBOS_DOR, CHAVE, COR, DOR, PAGINAS, PASSOS, PASSOS_FIM, SONS, TOMADAS } from "./roteiro";

export type PalavraColuna = { palavra: string; inicio: number; fim: number };
export type ColunaProps = { palavras: PalavraColuna[]; duracao: number };

const MONT = usarFonte("Montserrat");
const SERIF = usarFonte("Playfair Display");
export const SOBRA_COLUNA = 1.0;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);
const limpar = (s: string) => s.replace(/[.,!?;:]+$/g, "");

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, frame, fps };
};

/** Progresso de 0 a 1 com curva suave entre t0 e t0 + dur. */
const entrada = (t: number, t0: number, dur = 0.45) => interpolate(t, [t0, t0 + dur], [0, 1], { ...clamp, easing: suave });
const saida = (t: number, t1: number, dur = 0.25) => interpolate(t, [t1 - dur, t1], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });

// ---------- câmera ----------
const TRANSICOES = TOMADAS.map((x) => x.ini).filter((x) => x > 0 && !BROLLS.some((b) => x > b.ini && x < b.fim));

const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useT();
  const tomada = TOMADAS.find((x) => t >= x.ini && t < x.fim) ?? TOMADAS[TOMADAS.length - 1]!;
  const p = tomada.plano;
  let escala = p.escala * (1 + 0.025 * interpolate(t, [tomada.ini, Math.min(tomada.fim, tomada.ini + 8)], [0, 1], clamp));
  let desfoque = 0;
  for (const i of TRANSICOES) {
    const d = t - i;
    if (d >= 0 && d < 0.4) escala *= 1 + 0.04 * Math.exp(-d * 12);
    if (d >= 0 && d < 0.08) desfoque = 3 * (1 - d / 0.08);
  }
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${escala})`,
        transformOrigin: `${p.ox}% ${p.oy}%`,
        filter: desfoque > 0.2 ? `blur(${desfoque}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---------- peças ----------
const Vidro: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: COR.vidro,
      border: "1.5px solid rgba(255,255,255,0.14)",
      borderRadius: 28,
      boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      backdropFilter: "blur(14px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Rotulo: React.FC<{ texto: string; cor?: string; tamanho?: number }> = ({ texto, cor = COR.ouro, tamanho = 26 }) => (
  <span style={{ fontFamily: MONT.familia, fontWeight: 900, fontSize: tamanho, letterSpacing: tamanho * 0.22, color: cor }}>{texto}</span>
);

const Cruz: React.FC<{ tam: number }> = ({ tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 40 40">
    <rect x="15" y="4" width="10" height="32" rx="3" fill={COR.ouro} />
    <rect x="4" y="15" width="32" height="10" rx="3" fill={COR.ouro} />
  </svg>
);

/** Selo de abertura: "DICA DO FÍSIO". */
const Selo: React.FC = () => {
  const { t } = useT();
  const e = entrada(t, 0.25, 0.55);
  if (t > 1.85) return null;
  const s = saida(t, 1.85, 0.2);
  return (
    <div style={{ position: "absolute", top: 96, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: e * s }}>
      <Vidro style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 34px 18px 24px", transform: `translateY(${(1 - e) * -40}px)` }}>
        <Cruz tam={40} />
        <Rotulo texto="DICA DO FÍSIO" cor="#fff" tamanho={30} />
      </Vidro>
    </div>
  );
};

/** Imagem de apoio em cartão sobre fundo desfocado, com título em serifa. */
const CartaoImagem: React.FC<{ b: (typeof BROLLS)[number]; children?: React.ReactNode }> = ({ b, children }) => {
  const { t } = useT();
  if (t < b.ini || t > b.fim) return null;
  const e = entrada(t, b.ini, 0.5);
  const s = saida(t, b.fim, 0.22);
  const p = interpolate(t, [b.ini, b.fim], [0, 1], clamp);
  const src = staticFile(b.src);
  const letras = b.titulo.split("");
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, e * 1.6) * s }}>
      <Img src={src} style={{ position: "absolute", inset: -120, width: "calc(100% + 240px)", height: "calc(100% + 240px)", objectFit: "cover", filter: "blur(40px) brightness(0.45) saturate(1.1)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45))" }} />
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF.familia, fontStyle: "italic", fontWeight: 900, fontSize: 112, color: "#fff", lineHeight: 1, textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          {letras.map((l, i) => {
            const k = entrada(t, b.ini + 0.12 + i * 0.025, 0.4);
            return (
              <span key={i} style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 40}px)`, whiteSpace: "pre" }}>
                {l}
              </span>
            );
          })}
        </div>
        {b.sub ? (
          <div style={{ marginTop: 18, opacity: entrada(t, b.tSub, 0.35), transform: `translateY(${(1 - entrada(t, b.tSub, 0.35)) * 20}px)` }}>
            <Rotulo texto={b.sub} tamanho={34} />
          </div>
        ) : null}
        <div style={{ margin: "26px auto 0", height: 4, width: 220 * entrada(t, b.ini + 0.3, 0.6), background: COR.ouro, borderRadius: 2 }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: (1080 - b.largura) / 2,
          width: b.largura,
          top: 470,
          aspectRatio: b.aspecto,
          borderRadius: 40,
          overflow: "hidden",
          boxShadow: "0 50px 90px rgba(0,0,0,0.55)",
          border: "2px solid rgba(255,255,255,0.18)",
          transform: `translateY(${(1 - e) * 220}px) scale(${0.96 + p * 0.06})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1.05 + p * 0.08})` }}>
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Pulso vermelho sobre a lombar e as palavras de dor carimbadas uma a uma. */
const Dor: React.FC = () => {
  const { t } = useT();
  const b = BROLLS[1]!;
  if (t < b.ini || t > b.fim) return null;
  const s = saida(t, b.fim, 0.22);
  return (
    <AbsoluteFill style={{ opacity: s }}>
      {CARIMBOS_DOR.map((c, i) => {
        const e = entrada(t, c.t, 0.35);
        if (t < c.t) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 1235 + i * 118,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              opacity: e,
              transform: `scale(${interpolate(e, [0, 1], [1.6, 1])}) rotate(${(i - 1) * 2.5}deg)`,
            }}
          >
            <div style={{ border: `4px solid ${COR.dor}`, borderRadius: 16, padding: "6px 30px 2px", background: "rgba(14,17,22,0.55)" }}>
              <span style={{ fontFamily: SERIF.familia, fontStyle: "italic", fontWeight: 900, fontSize: 86, color: COR.dor, letterSpacing: 4 }}>{c.texto}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const PulsoLombar: React.FC = () => {
  const { t } = useT();
  const b = BROLLS[1]!;
  if (t < 7.6 || t > b.fim) return null;
  const ciclo = ((t - 7.6) % 0.9) / 0.9;
  return (
    <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <circle cx="47" cy="73" r={8 + ciclo * 16} fill="none" stroke={COR.dor} strokeWidth={1.4} opacity={1 - ciclo} />
      <circle cx="47" cy="73" r={5} fill={COR.dor} opacity={0.3 + 0.2 * Math.sin(t * 8)} />
    </svg>
  );
};

/** Indicador de passos do exercício, no topo. */
const Passos: React.FC = () => {
  const { t } = useT();
  if (t < PASSOS[0]!.t - 0.05 || t > PASSOS_FIM) return null;
  const idx = PASSOS.reduce((acc, p, i) => (t >= p.t ? i : acc), 0);
  const atual = PASSOS[idx]!;
  const e = entrada(t, PASSOS[0]!.t, 0.5);
  const s = saida(t, PASSOS_FIM, 0.3);
  const troca = entrada(t, atual.t, 0.4);
  return (
    <div style={{ position: "absolute", top: 86, left: 70, right: 70, opacity: e * s, transform: `translateY(${(1 - e) * -40}px)` }}>
      <Vidro style={{ padding: "26px 34px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Rotulo texto={`PASSO ${idx + 1} DE ${PASSOS.length}`} tamanho={24} />
          <div style={{ display: "flex", gap: 10 }}>
            {PASSOS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === idx ? 44 : 14,
                  height: 14,
                  borderRadius: 7,
                  background: i <= idx ? COR.ouro : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: SERIF.familia,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 64,
            color: "#fff",
            lineHeight: 1.05,
            opacity: troca,
            transform: `translateX(${(1 - troca) * 40}px)`,
          }}
        >
          {atual.texto}
        </div>
      </Vidro>
    </div>
  );
};

/** Setas caindo: a gravidade puxando o tronco. */
const Gravidade: React.FC = () => {
  const { t } = useT();
  const t0 = 20.27;
  const t1 = 21.85;
  if (t < t0 || t > t1) return null;
  const e = entrada(t, t0, 0.3);
  const s = saida(t, t1, 0.25);
  return (
    <div style={{ position: "absolute", left: 330, top: 560, width: 300, height: 400, opacity: e * s }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Vidro style={{ padding: "10px 24px 8px", borderRadius: 20 }}>
          <Rotulo texto="GRAVIDADE" tamanho={28} />
        </Vidro>
      </div>
      {[0, 1, 2].map((i) => {
        const fase = ((t - t0) * 1.4 + i / 3) % 1;
        return (
          <svg
            key={i}
            width={130}
            height={76}
            viewBox="0 0 120 70"
            style={{ position: "absolute", left: 85, top: 80 + fase * 260, opacity: Math.sin(fase * Math.PI), filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}
          >
            <path d="M10 10 L60 55 L110 10" fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
};

/** Vértebras empilhando de baixo para cima enquanto ele sobe devagar. */
const Vertebras: React.FC = () => {
  const { t } = useT();
  const t0 = 22.3;
  const t1 = 25.5;
  if (t < t0 || t > t1) return null;
  const e = entrada(t, t0, 0.4);
  const s = saida(t, t1, 0.3);
  const n = 9;
  const subida = interpolate(t, [22.6, 25.2], [0, n], clamp);
  return (
    <div style={{ position: "absolute", right: 56, top: 380, opacity: e * s }}>
      <Vidro style={{ padding: "26px 26px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {Array.from({ length: n }, (_, k) => {
          const i = n - 1 - k; // i = 0 é a de baixo
          const v = Math.max(0, Math.min(1, subida - i));
          return (
            <div
              key={k}
              style={{
                width: 120 - i * 6,
                height: 34,
                borderRadius: 12,
                background: v > 0 ? COR.ouro : "rgba(255,255,255,0.14)",
                opacity: 0.35 + 0.65 * v,
                transform: `scaleX(${0.7 + 0.3 * v})`,
              }}
            />
          );
        })}
        <div style={{ marginTop: 8, fontFamily: SERIF.familia, fontStyle: "italic", fontWeight: 900, fontSize: 40, color: "#fff" }}>devagar</div>
      </Vidro>
    </div>
  );
};

/** Cronômetro de 20 a 30 segundos. */
const Cronometro: React.FC = () => {
  const { t } = useT();
  const t0 = 25.66;
  const t1 = 28.42;
  if (t < t0 || t > t1) return null;
  const e = entrada(t, t0, 0.45);
  const s = saida(t, t1, 0.25);
  const giro = interpolate(t, [26.1, 28.3], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const R = 92;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 52, display: "flex", justifyContent: "center", opacity: e * s, transform: `scale(${0.85 + 0.15 * e})` }}>
      <Vidro style={{ display: "flex", alignItems: "center", gap: 24, padding: "18px 34px 18px 20px" }}>
        <svg width={190} height={190} viewBox="0 0 220 220">
          <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={14} />
          <circle cx="110" cy="110" r={R} fill="none" stroke={COR.ouro} strokeWidth={14} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - giro)} transform="rotate(-90 110 110)" />
          <text x="110" y="118" textAnchor="middle" fontFamily={SERIF.familia} fontStyle="italic" fontWeight={900} fontSize="58" fill="#fff">
            20–30
          </text>
          <text x="110" y="152" textAnchor="middle" fontFamily={MONT.familia} fontWeight={900} fontSize="18" letterSpacing="4" fill={COR.ouro}>
            SEGUNDOS
          </text>
        </svg>
        <div style={{ opacity: entrada(t, 27.36, 0.35) }}>
          <div style={{ fontFamily: SERIF.familia, fontStyle: "italic", fontWeight: 900, fontSize: 52, color: "#fff", lineHeight: 1 }}>lá</div>
          <div style={{ fontFamily: SERIF.familia, fontStyle: "italic", fontWeight: 900, fontSize: 52, color: "#fff", lineHeight: 1 }}>embaixo</div>
        </div>
      </Vidro>
    </div>
  );
};

/** "Pode repetir" com ícone de repetição girando, até o fim. */
const Repetir: React.FC<{ fimTotal: number }> = ({ fimTotal }) => {
  const { t } = useT();
  const t0 = 28.47;
  if (t < t0) return null;
  const e = entrada(t, t0, 0.45);
  const s = saida(t, fimTotal, 0.35);
  return (
    <div style={{ position: "absolute", top: 96, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: e * s, transform: `translateY(${(1 - e) * -30}px)` }}>
      <Vidro style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 38px 20px 26px" }}>
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: `rotate(${(t - t0) * 140}deg)` }}>
          <path d="M50 22 A20 20 0 1 0 52 38" fill="none" stroke={COR.ouro} strokeWidth={7} strokeLinecap="round" />
          <path d="M50 8 L50 24 L36 22" fill="none" stroke={COR.ouro} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: SERIF.familia, fontStyle: "italic", fontWeight: 900, fontSize: 60, color: "#fff" }}>Pode repetir</span>
      </Vidro>
    </div>
  );
};

// ---------- legenda: 2 palavras por tela ----------
const OCULTA = [
  [1.78, 3.33],
  [6.66, 10.3],
];

const Legenda: React.FC<{ palavras: PalavraColuna[] }> = ({ palavras }) => {
  const { t } = useT();
  const paginas = useMemo(
    () =>
      PAGINAS.filter(([, b]) => b < palavras.length).map(([a, b]) => {
        const ps = palavras.slice(a, b + 1);
        return { ps, ini: ps[0]!.inicio, fim: ps[ps.length - 1]!.fim };
      }),
    [palavras],
  );
  if (OCULTA.some(([a, b]) => t >= a! && t < b!)) return null;
  const idx = paginas.findIndex((p, i) => t >= p.ini && t < Math.min(paginas[i + 1]?.ini ?? Infinity, p.fim + 0.5));
  const pag = paginas[idx];
  if (!pag) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1500, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 30, flexWrap: "wrap" }}>
      {pag.ps.map((p, i) => {
        if (t < p.inicio) return null;
        const e = entrada(t, p.inicio, 0.3);
        const nome = limpar(p.palavra).toLowerCase();
        const dor = DOR.has(nome);
        const chave = CHAVE.has(nome) || /\d/.test(nome);
        const serif = dor || chave;
        const falando = t >= p.inicio && t < p.fim + 0.08;
        const sublinha = entrada(t, p.inicio, Math.max(0.2, p.fim - p.inicio));
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              opacity: e,
              transform: `translateY(${(1 - e) * 34}px)`,
              filter: `blur(${(1 - e) * 6}px)`,
            }}
          >
            <span
              style={{
                fontFamily: serif ? SERIF.familia : MONT.familia,
                fontStyle: serif ? "italic" : "normal",
                fontWeight: 900,
                fontSize: serif ? 118 : 96,
                textTransform: serif ? "none" : "uppercase",
                color: dor ? COR.dor : chave ? COR.ouro : "#fff",
                letterSpacing: serif ? 0 : 2,
                textShadow: "0 6px 24px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {limpar(p.palavra)}
            </span>
            {falando ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: -6,
                  height: 7,
                  width: `${sublinha * 100}%`,
                  borderRadius: 4,
                  background: dor ? COR.dor : COR.ouro,
                  boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

const Progresso: React.FC<{ duracao: number }> = ({ duracao }) => {
  const { t } = useT();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${Math.min(1, t / duracao) * 100}%`, background: COR.ouro }} />;
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

export const Coluna: React.FC<ColunaProps> = ({ palavras, duracao }) => {
  const { t, fps } = useT();
  const prontas = useFontes();
  const ultimo = Math.floor(duracao * fps) - 2;
  const video = <OffthreadVideo src={staticFile("coluna/base.mp4")} style={{ width: "100%", height: "100%" }} />;
  const fimTotal = duracao + SOBRA_COLUNA;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Camera>{t * fps >= ultimo ? <Freeze frame={ultimo}>{video}</Freeze> : video}</Camera>
      {/* degradê só no rodapé, para a legenda ler bem sobre o piso claro */}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 62%, rgba(0,0,0,0.6) 100%)" }} />
      {prontas ? (
        <>
          <Selo />
          <Passos />
          <Gravidade />
          <Vertebras />
          <Cronometro />
          <Repetir fimTotal={fimTotal} />
          <CartaoImagem b={BROLLS[0]!} />
          <CartaoImagem b={BROLLS[1]!}>
            <PulsoLombar />
          </CartaoImagem>
          <Dor />
          <Legenda palavras={palavras} />
          <Progresso duracao={duracao} />
        </>
      ) : null}
      {SONS.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.t * fps))} durationInFrames={Math.round(3 * fps)}>
          <Audio src={staticFile(`coluna/sfx/${s.arquivo}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
      <Audio
        src={staticFile("coluna/sfx/trilha_calma.wav")}
        volume={(f) => interpolate(f / fps, [0, 0.5, fimTotal - 1, fimTotal], [0, 0.2, 0.2, 0], clamp)}
      />
    </AbsoluteFill>
  );
};
