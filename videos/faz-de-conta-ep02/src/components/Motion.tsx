import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MK, SPEECH_END} from '../timeline';
import {C, clamp, COND, SANS, SERIF, SHADOW, TYPE} from '../theme';

// Todos os componentes recebem o frame GLOBAL (g) para sincronizar com as marcas da fala.
const ease = (g: number, a: number, len = 10) => interpolate(g, [a, a + len], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const fadeOut = (g: number, b: number, len = 8) => interpolate(g, [b - len, b], [1, 0], clamp);
const useSp = (g: number, at: number, damping = 15) => {
  const {fps} = useVideoConfig();
  return spring({frame: g - at, fps, config: {damping, stiffness: 170, mass: 0.7}});
};
export const useG = (from: number) => useCurrentFrame() + from;

const Kicker: React.FC<{children: React.ReactNode; a: number; style?: React.CSSProperties}> = ({children, a, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: C.copperLight, opacity: a, ...style}}>
    <div style={{width: 36, height: 2, backgroundColor: C.copperLight}} />
    {children}
  </div>
);

// ---------- Selo da série + rótulo de simulação ----------
export const SeriesTag: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  // primeiro quadro: título grande do quadro (serve de capa); em ~1,3 s ele encolhe para o canto
  const m = interpolate(g, [from + 34, from + 48], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const small = ease(g, from + 42, 8) * fadeOut(g, to, 8);
  const shine = interpolate(g, [from, from + 30], [0, 1], clamp);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 215,
          textAlign: 'center',
          opacity: 1 - m,
          scale: String(1 - 0.45 * m),
          translate: `${-300 * m}px ${-120 * m}px`,
        }}
      >
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 96, letterSpacing: 2, lineHeight: 1, color: C.white, textShadow: SHADOW}}>FAZ DE CONTA</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 70, lineHeight: 1.1, color: C.copperLight, textShadow: SHADOW}}>que eu sou…</div>
        <div style={{width: 200 + 160 * shine, height: 3, backgroundColor: C.copperLight, margin: '16px auto 12px'}} />
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 8, color: C.white, textShadow: SHADOW}}>EP. 02</div>
      </div>
      <div style={{position: 'absolute', left: 60, top: 190, fontFamily: SANS, opacity: small}}>
        <div style={{fontWeight: 700, fontSize: 24, letterSpacing: 5, color: C.white, textShadow: SHADOW}}>FAZ DE CONTA QUE EU SOU…</div>
        <div style={{marginTop: 6, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: C.copperLight, textShadow: SHADOW}}>EP. 02</div>
      </div>
    </>
  );
};

export const FictionLabel: React.FC<{from: number; to: number; side?: 'left' | 'right'}> = ({from, to, side = 'left'}) => {
  const g = useG(from);
  const a = ease(g, from, 8) * fadeOut(g, to, 6);
  return (
    <div
      style={{
        position: 'absolute',
        [side]: 60,
        top: 196,
        padding: '8px 16px',
        borderRadius: 999,
        border: `1px solid rgba(246,243,238,0.4)`,
        backgroundColor: 'rgba(7,14,30,0.45)',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 20,
        letterSpacing: 2,
        color: 'rgba(246,243,238,0.85)',
        opacity: a,
      }}
    >
      SIMULAÇÃO FICTÍCIA
    </div>
  );
};

// ---------- Gráfico de linha (cobre) ----------
const ChartLine: React.FC<{p: number; w: number; h: number; stroke?: number; glow?: boolean}> = ({p, w, h, stroke = 8, glow = true}) => {
  const pts = [
    [0, 0.92],
    [0.14, 0.8],
    [0.26, 0.84],
    [0.4, 0.62],
    [0.52, 0.66],
    [0.66, 0.42],
    [0.78, 0.46],
    [0.9, 0.2],
    [1, 0.06],
  ];
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x * w} ${y * h}`).join(' ');
  const len = w * 1.7;
  const head = pts.reduce((acc, cur, i) => (i / (pts.length - 1) <= p ? cur : acc), pts[0]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible'}}>
      {glow ? <path d={d} stroke={C.copperLight} strokeWidth={stroke * 3} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.25} style={{strokeDasharray: len, strokeDashoffset: len * (1 - p), filter: 'blur(6px)'}} /> : null}
      <path d={d} stroke={C.copperLight} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{strokeDasharray: len, strokeDashoffset: len * (1 - p)}} />
      {p > 0.05 ? <circle cx={head[0] * w} cy={head[1] * h} r={stroke * 1.4} fill={C.white} /> : null}
    </svg>
  );
};

// ---------- Cadeado ----------
const Padlock: React.FC<{size: number; closed: number; color?: string}> = ({size, closed, color = C.copperLight}) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none">
    <path d={`M 28 ${52 - (1 - closed) * 16} V ${34 - (1 - closed) * 16} a 22 22 0 0 1 44 0 V ${52 - (1 - closed) * 4}`} stroke={color} strokeWidth={9} strokeLinecap="round" />
    <rect x={14} y={50} width={72} height={62} rx={12} fill={color} />
    <circle cx={50} cy={76} r={8} fill={C.navyDeep} />
    <rect x={46} y={78} width={8} height={18} rx={3} fill={C.navyDeep} />
  </svg>
);

// ---------- Calendário ----------
const Calendar: React.FC<{label: string; sub: string; flip: number}> = ({label, sub, flip}) => (
  <div style={{width: 300, borderRadius: 22, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', fontFamily: SANS, backgroundColor: C.white}}>
    <div style={{height: 70, backgroundColor: C.copper, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 70}}>
      <div style={{width: 14, height: 14, borderRadius: 7, backgroundColor: C.navyDeep}} />
      <div style={{width: 14, height: 14, borderRadius: 7, backgroundColor: C.navyDeep}} />
    </div>
    <div style={{padding: '22px 0 26px', textAlign: 'center', transformOrigin: 'top', rotate: `x ${(1 - flip) * -70}deg`}}>
      <div style={{fontFamily: COND, fontSize: 110, lineHeight: 1, color: C.navy}}>{label}</div>
      <div style={{fontWeight: 700, fontSize: 24, letterSpacing: 4, color: C.navy, opacity: 0.7, marginTop: 8}}>{sub}</div>
    </div>
  </div>
);

// ---------- Bolha do sonho (o apartamento) ----------
const DreamBubble: React.FC<{size: number; gray: number; glow: number}> = ({size, gray, glow}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: `0 0 ${80 * glow}px rgba(230,174,126,${0.55 * glow}), 0 30px 80px rgba(0,0,0,0.5)`,
      border: `4px solid rgba(246,243,238,${0.8 - 0.4 * gray})`,
    }}
  >
    <Img src={staticFile('img/apto_sonho.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: `grayscale(${gray}) brightness(${1 - 0.45 * gray}) contrast(1.05)`}} />
  </div>
);

// ---------- Selo "VENDIDO" ----------
const SoldStamp: React.FC<{p: number; scale?: number}> = ({p, scale = 1}) => (
  <div
    style={{
      padding: '14px 40px',
      border: `8px solid ${C.copperLight}`,
      borderRadius: 16,
      fontFamily: COND,
      fontSize: 120 * scale,
      lineHeight: 1,
      letterSpacing: 6,
      color: C.copperLight,
      rotate: '-12deg',
      opacity: p > 0 ? 1 : 0,
      scale: String(interpolate(p, [0, 1], [1.8, 1])),
      backgroundColor: 'rgba(7,14,30,0.35)',
      textShadow: '0 4px 18px rgba(0,0,0,0.5)',
    }}
  >
    VENDIDO
  </div>
);

const NavyBg: React.FC<{grid?: boolean}> = ({grid = true}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #1A2B4D 0%, ${C.navy} 45%, ${C.navyDeep} 100%)`}}>
    {grid ? (
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(246,243,238,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(246,243,238,0.05) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
    ) : null}
  </AbsoluteFill>
);

// ================= CENAS =================

// GANCHO: dinheiro crescendo × sonho sumindo
export const HookDream: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const a = ease(g, from, 6);
  const chart = interpolate(g, [from + 2, MK.sonhos1 + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const gray = interpolate(g, [MK.perdeu1 - 2, MK.sonhos1 + 6], [0, 1], clamp);
  const sink = interpolate(g, [MK.perdeu1, MK.sonhos1 + 12], [1, 0.9], clamp);
  const stamp = ease(g, MK.sonhos1, 6);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <NavyBg />
      <div style={{position: 'absolute', left: 160, top: 470, scale: String(sink)}}>
        <DreamBubble size={760} gray={gray} glow={1 - gray} />
      </div>
      <div style={{position: 'absolute', left: 70, top: 300}}>
        <ChartLine p={chart} w={940} h={900} stroke={9} />
      </div>
      <div style={{position: 'absolute', right: 70, top: 290, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.copperLight, opacity: ease(g, from + 10, 8), textShadow: SHADOW}}>RENDIMENTO ↗</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center'}}>
        <SoldStamp p={stamp} />
      </div>
    </AbsoluteFill>
  );
};

// CINCO ANOS DE SACRIFÍCIO: linha do tempo, renúncias e o contador
const Plane: React.FC = () => (
  <svg width={44} height={44} viewBox="0 0 48 48" fill="none">
    <path d="M6 26 L42 12 L30 40 L24 28 Z M24 28 L42 12" stroke={C.white} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);
const Fork: React.FC = () => (
  <svg width={44} height={44} viewBox="0 0 48 48" fill="none">
    <path d="M14 6 V20 a6 6 0 0 0 12 0 V6 M20 6 V44 M34 6 c-6 6 -6 18 0 20 V44" stroke={C.white} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
const Renuncia: React.FC<{p: number; strike: number; icon: React.ReactNode; label: string}> = ({p, strike, icon, label}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 26px 14px 18px', borderRadius: 999, backgroundColor: 'rgba(7,14,30,0.6)', border: `1px solid ${C.line}`, opacity: p, translate: `${(1 - p) * -40}px 0`}}>
    {icon}
    <div style={{position: 'relative', fontFamily: SANS, fontWeight: 600, fontSize: 38, color: C.white}}>
      {label}
      <div style={{position: 'absolute', left: -4, right: -4, top: '52%', height: 4, backgroundColor: C.copperLight, transformOrigin: 'left', scale: `${strike} 1`}} />
    </div>
  </div>
);

export const SonhoOverlay: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const tl = interpolate(g, [MK.anos3, MK.oitenta3], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const v = ease(g, MK.viagens3 - 2, 8);
  const r = ease(g, MK.restaurantes3 - 2, 8);
  const cnt = interpolate(g, [MK.oitenta3 - 6, MK.oitenta3 + 14], [0, 80000], {...clamp, easing: Easing.out(Easing.cubic)});
  const cA = ease(g, MK.oitenta3 - 6, 6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,14,30,0.55) 0%, rgba(7,14,30,0) 30%, rgba(7,14,30,0) 55%, rgba(7,14,30,0.65) 100%)'}} />
      <div style={{position: 'absolute', left: 60, top: 300, display: 'flex', flexDirection: 'column', gap: 16}}>
        <Renuncia p={v} strike={ease(g, MK.viagens3 + 6, 6)} icon={<Plane />} label="viagens" />
        <Renuncia p={r} strike={ease(g, MK.restaurantes3 + 6, 6)} icon={<Fork />} label="restaurantes" />
      </div>
      {/* linha do tempo dos 5 anos */}
      <div style={{position: 'absolute', left: 90, right: 90, top: 1240, opacity: ease(g, MK.anos3 - 4, 8)}}>
        <div style={{position: 'relative', height: 4, backgroundColor: 'rgba(246,243,238,0.25)', borderRadius: 2}}>
          <div style={{position: 'absolute', left: 0, top: 0, height: 4, width: `${tl * 100}%`, backgroundColor: C.copperLight, borderRadius: 2}} />
          {[0, 1, 2, 3, 4].map((i) => {
            const on = tl >= i / 4 - 0.001;
            return (
              <div key={i} style={{position: 'absolute', left: `${(i / 4) * 100}%`, top: -12, translate: '-50% 0', textAlign: 'center'}}>
                <div style={{width: 28, height: 28, borderRadius: 14, backgroundColor: on ? C.copperLight : C.navy, border: `3px solid ${C.copperLight}`, margin: '0 auto'}} />
                <div style={{marginTop: 10, fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: on ? C.white : 'rgba(246,243,238,0.5)'}}>ANO {i + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1040, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 104, letterSpacing: -2, color: C.white, opacity: cA, textShadow: SHADOW, fontVariantNumeric: 'tabular-nums'}}>
        R$ {Math.round(cnt).toLocaleString('pt-BR')}
      </div>
    </AbsoluteFill>
  );
};

// O ERRO: o dinheiro entra no investimento, rende… e fica atrás do vidro trancado
export const Vault: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const a = ease(g, from, 6);
  const notes = interpolate(g, [from + 2, from + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const chart = interpolate(g, [from + 10, MK.dois4 + 10], [0, 1], clamp);
  const cal = useSp(g, MK.resgatar4 - 2);
  const lock = useSp(g, MK.dois4 - 4, 12);
  const closed = ease(g, MK.dois4 + 2, 5);
  const preso = ease(g, MK.dois4 + 6, 8);
  const frost = ease(g, MK.dois4 + 2, 10);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <NavyBg />
      {/* conteúdo atrás do vidro */}
      <div style={{position: 'absolute', left: 190, top: 560, width: 700, height: 760}}>
        <div style={{position: 'absolute', inset: 0, filter: `blur(${1 + frost * 3}px)`}}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 120 + (i % 2) * 30,
                top: 560 - i * 42 * notes,
                width: 360,
                height: 120,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.copper}, ${C.copperLight})`,
                border: '2px solid rgba(255,255,255,0.35)',
                opacity: notes,
                boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
              }}
            />
          ))}
          <div style={{position: 'absolute', left: 40, top: 60}}>
            <ChartLine p={chart} w={620} h={360} stroke={7} />
          </div>
        </div>
        {/* vidro */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 40,
            border: '3px solid rgba(246,243,238,0.55)',
            background: `linear-gradient(130deg, rgba(255,255,255,${0.16 + frost * 0.08}) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,${0.1 + frost * 0.06}) 100%)`,
            boxShadow: 'inset 0 0 60px rgba(255,255,255,0.08), 0 40px 90px rgba(0,0,0,0.5)',
          }}
        />
        <div style={{position: 'absolute', left: 40, top: 30, width: 18, height: 300, borderRadius: 9, background: 'linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0))'}} />
      </div>
      {/* calendário do resgate */}
      <div style={{position: 'absolute', right: 50, top: 600, translate: `${(1 - cal) * 420}px 0`, rotate: '6deg'}}>
        <Calendar label="2 ANOS" sub="PARA RESGATAR" flip={cal} />
      </div>
      {/* cadeado */}
      <div style={{position: 'absolute', left: 540 - 110, top: 820 - (1 - lock) * 500, opacity: lock > 0.02 ? 1 : 0}}>
        <Padlock size={220} closed={closed} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontFamily: COND, fontSize: 150, letterSpacing: 4, lineHeight: 1, color: C.white, opacity: preso, scale: String(0.9 + 0.1 * preso), textShadow: SHADOW}}>
        DINHEIRO <span style={{color: C.copperLight}}>PRESO</span>
      </div>
    </AbsoluteFill>
  );
};

// TRÊS MESES DEPOIS
export const MesesCard: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const a = ease(g, from, 5) * fadeOut(g, to, 4);
  const k = Math.floor(interpolate(g, [from, from + 14], [0, 3], clamp));
  return (
    <AbsoluteFill style={{opacity: a}}>
      <NavyBg grid={false} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: C.copperLight}}>MÊS {Math.max(1, k)}</div>
        <div style={{fontFamily: COND, fontSize: 190, letterSpacing: 6, lineHeight: 1, color: C.white, marginTop: 18}}>3 MESES</div>
        <div style={{fontFamily: COND, fontSize: 120, letterSpacing: 10, lineHeight: 1, color: 'rgba(246,243,238,0.55)'}}>DEPOIS</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// O IMÓVEL PERFEITO… e o dinheiro trancado
export const ApartamentoSonho: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const g = useG(from);
  const f = g - from;
  const z = interpolate(f, [0, dur], [1.0, 1.12], clamp);
  const gray = interpolate(g, [MK.nao5 - 2, MK.nao5 + 10], [0, 1], clamp);
  const badge = useSp(g, MK.tinha5 - 2);
  const shake = g >= MK.nao5 && g < MK.nao5 + 14 ? Math.sin((g - MK.nao5) * 2.4) * 10 * (1 - (g - MK.nao5) / 14) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.navyDeep}}>
      <AbsoluteFill style={{scale: String(z)}}>
        <Img src={staticFile('img/apto_sonho.jpg')} style={{width: 1080, height: 1920, objectFit: 'cover', filter: `grayscale(${gray}) brightness(${1.05 - 0.4 * gray}) saturate(${1.15 - 0.3 * gray}) blur(1px)`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at 70% 25%, rgba(255,214,160,${0.35 * (1 - gray)}) 0%, rgba(255,214,160,0) 50%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,14,30,0.3), rgba(7,14,30,0) 30%, rgba(7,14,30,0) 60%, rgba(7,14,30,0.75))'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1080,
          display: 'flex',
          justifyContent: 'center',
          opacity: badge,
          translate: `${shake}px ${(1 - badge) * 60}px`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 34px', borderRadius: 26, background: 'rgba(7,14,30,0.7)', border: `2px solid ${C.copperLight}`, boxShadow: '0 20px 50px rgba(0,0,0,0.45)'}}>
          <Padlock size={70} closed={1} />
          <div style={{fontFamily: SANS, color: C.white}}>
            <div style={{fontWeight: 800, fontSize: 52, letterSpacing: -1}}>R$ 80.000</div>
            <div style={{fontWeight: 600, fontSize: 26, letterSpacing: 2, color: C.copperLight}}>BLOQUEADO POR 2 ANOS</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// O ARREPENDIMENTO: aproximação lenta no rosto + lembranças em camadas
const Flash: React.FC<{g: number; at: number; len?: number; x: number; y: number; w: number; rot?: number; children: React.ReactNode}> = ({g, at, len = 16, x, y, w, rot = 0, children}) => {
  const t = (g - at) / len;
  if (t < 0 || t > 1) return null;
  const op = interpolate(t, [0, 0.2, 0.7, 1], [0, 0.85, 0.7, 0]);
  const bl = interpolate(t, [0, 0.25, 0.7, 1], [10, 0, 1, 8]);
  const sc = interpolate(t, [0, 1], [1.12, 0.98]);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: op, filter: `blur(${bl}px)`, scale: String(sc), rotate: `${rot}deg`, mixBlendMode: 'screen'}}>
      {children}
    </div>
  );
};

export const Arrependimento: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const z = interpolate(g, [from, to], [1.06, 1.42], {...clamp, easing: Easing.in(Easing.sin)});
  const dark = interpolate(g, [to - 12, to], [0, 1], clamp);
  const title = ease(g, MK.dele6, 10);
  const span = Math.max(40, to - from - 14);
  const at = (k: number) => from + 2 + Math.round((k / 6) * span);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{scale: String(z), transformOrigin: '36% 30%'}}>
        <Img src={staticFile('img/cadeado_frustracao.jpg')} style={{width: 1080, height: 1920, objectFit: 'cover', filter: 'contrast(1.08) saturate(0.8) brightness(0.9)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 36% 30%, rgba(0,0,0,0) 25%, rgba(4,8,18,0.7) 80%)'}} />
      {/* lembranças */}
      <Flash g={g} at={at(0)} x={600} y={320} w={360} rot={4}>
        <Img src={staticFile('img/pote.jpg')} style={{width: '100%', borderRadius: 18}} />
      </Flash>
      <Flash g={g} at={at(1)} x={80} y={980} w={460} rot={-3}>
        <div style={{fontFamily: COND, fontSize: 120, color: C.white, lineHeight: 1}}>5 ANOS</div>
        <div style={{height: 4, backgroundColor: C.copperLight, marginTop: 10}} />
      </Flash>
      <Flash g={g} at={at(2)} x={620} y={820} w={340} rot={5}>
        <Padlock size={200} closed={1} />
      </Flash>
      <Flash g={g} at={at(3)} x={120} y={300} w={320} rot={-6}>
        <Calendar label="2 ANOS" sub="PARA RESGATAR" flip={1} />
      </Flash>
      <Flash g={g} at={MK.outra6} x={560} y={560} w={420} rot={3} len={18}>
        <Img src={staticFile('img/placa.jpg')} style={{width: '100%', borderRadius: 16}} />
      </Flash>
      <Flash g={g} at={MK.sonho6 - 2} x={200} y={360} w={680} len={22}>
        <DreamBubble size={680} gray={0.85} glow={0} />
      </Flash>
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: COND, fontSize: 132, letterSpacing: 10, color: C.white, opacity: title * 0.92, textShadow: SHADOW}}>
        SONHO PERDIDO
      </div>
      <AbsoluteFill style={{backgroundColor: '#000', opacity: dark}} />
    </AbsoluteFill>
  );
};

// MODO ASSESSOR: moldura da série + gráficos projetados na parede
export const ModoAssessor: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const a = ease(g, from, 10) * fadeOut(g, to, 6);
  const draw = interpolate(g, [from, from + 40], [0, 1], clamp);
  const c = (style: React.CSSProperties) => <div style={{position: 'absolute', width: 70, height: 70, borderColor: C.copperLight, borderStyle: 'solid', borderWidth: 0, ...style}} />;
  return (
    <AbsoluteFill style={{opacity: a, pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(13,24,48,0.55), rgba(13,24,48,0.05) 35%, rgba(13,24,48,0.05) 70%, rgba(13,24,48,0.65))', mixBlendMode: 'multiply'}} />
      <div style={{position: 'absolute', left: 140, top: 520, opacity: 0.35, mixBlendMode: 'screen'}}>
        <ChartLine p={draw} w={800} h={260} stroke={4} />
      </div>
      {c({left: 40, top: 170, borderTopWidth: 3, borderLeftWidth: 3})}
      {c({right: 40, top: 170, borderTopWidth: 3, borderRightWidth: 3})}
      {c({left: 40, bottom: 330, borderBottomWidth: 3, borderLeftWidth: 3})}
      {c({right: 40, bottom: 330, borderBottomWidth: 3, borderRightWidth: 3})}
      <div style={{position: 'absolute', left: 70, top: 200}}>
        <Kicker a={1}>MODO ASSESSOR</Kicker>
      </div>
    </AbsoluteFill>
  );
};

// Título do quadro (identidade reutilizável nos próximos episódios)
export const SeriesTitle: React.FC<{from: number; to: number; profissao: string}> = ({from, to, profissao}) => {
  const g = useG(from);
  const base = 'FAZ DE CONTA QUE EU SOU…';
  const n = Math.floor(interpolate(g, [MK.faz7 - 2, MK.faz7 + 18], [0, base.length], clamp));
  const p = useSp(g, MK.assessor7 - 3, 14);
  const line = ease(g, MK.assessor7 + 4, 12);
  const out = fadeOut(g, to, 6);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 60, right: 60, top: 290, textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 44, letterSpacing: 8, color: C.white, textShadow: SHADOW, minHeight: 56}}>{base.slice(0, n)}</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 104, lineHeight: 1.05, color: C.copperLight, marginTop: 14, opacity: p, translate: `0 ${(1 - p) * 30}px`, textShadow: SHADOW}}>{profissao}</div>
        <div style={{width: 360 * line, height: 3, backgroundColor: C.copperLight, margin: '18px auto 0'}} />
      </div>
    </AbsoluteFill>
  );
};

// As duas perguntas do assessor
export const Perguntas: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const k = ease(g, MK.duas8 - 2, 8);
  const q1 = useSp(g, MK.qual8 - 3);
  const q2 = useSp(g, MK.quando8 - 3);
  const Card: React.FC<{n: string; t: string; p: number}> = ({n, t, p}) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '22px 30px', borderRadius: 24, background: 'rgba(7,14,30,0.78)', border: `1px solid ${C.line}`, opacity: p, translate: `${(1 - p) * -60}px 0`, boxShadow: '0 18px 40px rgba(0,0,0,0.4)'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 70, color: C.copperLight, lineHeight: 1}}>{n}</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.white, lineHeight: 1.15}}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,14,30,0.6), rgba(7,14,30,0) 40%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 280, display: 'flex', flexDirection: 'column', gap: 18}}>
        <Kicker a={k}>DUAS PERGUNTAS ANTES DE INVESTIR</Kicker>
        <Card n="1" t="Qual é o seu sonho?" p={q1} />
        <Card n="2" t="Quando você vai precisar do dinheiro?" p={q2} />
      </div>
    </AbsoluteFill>
  );
};

// "Ganhar dinheiro é ótimo": gráfico subindo na parede
export const GanharChart: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const p = interpolate(g, [from, to], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 120, top: 330, opacity: fadeOut(g, to, 4), mixBlendMode: 'screen'}}>
      <ChartLine p={p} w={840} h={300} stroke={7} />
    </div>
  );
};

// "Dinheiro preso aí": vidro trancado sobre a oportunidade que passa
export const PresoMini: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const p = useSp(g, from, 13);
  const closed = ease(g, MK.preso9 - 2, 5);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: fadeOut(g, to, 4)}}>
      <div style={{position: 'relative', width: 520, height: 520, borderRadius: 40, border: '3px solid rgba(246,243,238,0.6)', background: 'linear-gradient(130deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.12))', backdropFilter: 'blur(6px)', scale: String(0.8 + 0.2 * p), opacity: p, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 90px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.white, opacity: 0.85}}>R$ 80.000</div>
        <div style={{position: 'absolute', bottom: -70}}>
          <Padlock size={150} closed={closed} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Objetivo · Prazo · Liquidez
export const Conceitos: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const items = [
    {at: MK.investir11 - 2, t: 'OBJETIVO', d: 'para que é o dinheiro'},
    {at: MK.planos11 - 2, t: 'PRAZO', d: 'quando você vai usar'},
    {at: MK.rendimentos11 - 4, t: 'LIQUIDEZ', d: 'se dá para resgatar a tempo'},
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to right, rgba(7,14,30,0.8), rgba(7,14,30,0.15) 60%)'}} />
      <div style={{position: 'absolute', left: 60, top: 300, display: 'flex', flexDirection: 'column', gap: 26}}>
        <Kicker a={ease(g, from, 8)}>O QUE UM BOM ASSESSOR OLHA</Kicker>
        {items.map((it, i) => {
          const p = ease(g, it.at, 8);
          return (
            <div key={it.t} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: p, translate: `${(1 - p) * -40}px 0`}}>
              <div style={{width: 64, height: 64, borderRadius: 32, border: `2px solid ${C.copperLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 36, color: C.copperLight}}>{i + 1}</div>
              <div>
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: 2, color: C.white, lineHeight: 1}}>{it.t}</div>
                <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, color: 'rgba(246,243,238,0.8)', marginTop: 6}}>{it.d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// BASTIDORES: o roteiro por trás do vídeo (split; o rosto fica embaixo)
export const Bastidores: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const thumbs = ['img/sonho.jpg', 'img/apto_sonho.jpg', 'img/cadeado_frustracao.jpg', 'img/assessor_graficos.jpg'];
  const rew = interpolate(g, [from, from + 26], [0, 1], clamp);
  const steps = [
    {t: 'GANCHO', at: MK.transformar13 - 4},
    {t: 'HISTÓRIA', at: MK.tecnico13},
    {t: 'EMOÇÃO', at: MK.historia13},
    {t: 'VALOR', at: MK.interesse13},
    {t: 'ESTRATÉGIA', at: MK.importancia13},
  ];
  return (
    <AbsoluteFill style={{opacity: fadeOut(g, to, 6)}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 900, overflow: 'hidden'}}>
        <NavyBg />
        <div style={{position: 'absolute', left: 60, top: 200}}>
          <Kicker a={ease(g, from, 8)}>
            <span style={{fontFamily: TYPE, letterSpacing: 3, fontSize: 30}}>bastidores do roteiro</span>
          </Kicker>
        </div>
        {/* "rebobinando" as cenas */}
        <div style={{position: 'absolute', left: 60, right: 60, top: 270, height: 260, display: 'flex', gap: 20, opacity: interpolate(g, [from, from + 6, MK.transformar13 + 6, MK.transformar13 + 14], [0, 1, 1, 0.35], clamp)}}>
          {thumbs.map((t, i) => {
            const p = interpolate(rew, [i * 0.18, i * 0.18 + 0.3], [0, 1], clamp);
            return (
              <div key={t} style={{flex: 1, borderRadius: 14, overflow: 'hidden', border: `2px solid ${C.line}`, opacity: p, translate: `0 ${(1 - p) * -40}px`, rotate: `${(i - 1.5) * 2}deg`}}>
                <Img src={staticFile(t)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4) contrast(1.05)'}} />
              </div>
            );
          })}
        </div>
        {/* fluxo da estratégia */}
        <div style={{position: 'absolute', left: 60, right: 60, top: 590, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 18}}>
          {steps.map((s, i) => {
            const p = ease(g, s.at, 8);
            const last = i === steps.length - 1;
            return (
              <React.Fragment key={s.t}>
                <div style={{padding: '12px 22px', borderRadius: 999, border: `2px solid ${last ? C.copperLight : 'rgba(246,243,238,0.5)'}`, backgroundColor: last ? C.copper : 'rgba(7,14,30,0.5)', fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 2, color: C.white, opacity: p, scale: String(0.85 + 0.15 * p)}}>{s.t}</div>
                {!last ? <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: C.copperLight, opacity: ease(g, steps[i + 1].at - 2, 6)}}>→</div> : null}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: C.copperLight}} />
      </div>
    </AbsoluteFill>
  );
};

// CTA: me segue + próximo episódio
export const MeSegue: React.FC<{from: number; to: number}> = ({from, to}) => {
  const g = useG(from);
  const a = useSp(g, from + 2, 13);
  const b = useSp(g, MK.profissao14 - 2, 14);
  const out = fadeOut(g, to, 5);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <div style={{padding: '18px 46px', borderRadius: 999, backgroundColor: C.white, fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: 3, color: C.navy, scale: String(0.8 + 0.2 * a), opacity: a, boxShadow: '0 18px 40px rgba(0,0,0,0.4)'}}>ME SEGUE</div>
        <div style={{padding: '12px 26px', borderRadius: 14, border: `2px solid ${C.copperLight}`, background: 'rgba(7,14,30,0.65)', fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.copperLight, opacity: b, translate: `0 ${(1 - b) * 20}px`}}>
          EP. 03 — QUAL PROFISSÃO VEM DEPOIS?
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DirectPill: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const a = useSp(g, from + 4, 14);
  const out = fadeOut(g, SPEECH_END, 6);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', opacity: a * out}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 34px', borderRadius: 999, background: 'rgba(7,14,30,0.7)', border: `2px solid ${C.copperLight}`, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: C.white, translate: `0 ${(1 - a) * 20}px`}}>
        Me manda <span style={{fontWeight: 900, color: C.copperLight, letterSpacing: 2}}>HISTÓRIA</span> no direct
      </div>
    </div>
  );
};

// Encerramento
export const EndCard: React.FC<{from: number}> = ({from}) => {
  const g = useG(from);
  const a = ease(g, from, 10);
  const l1 = useSp(g, from + 6, 15);
  const l2 = useSp(g, from + 18, 14);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <NavyBg />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 70px'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: 7, color: C.copperLight, marginBottom: 40, opacity: l1}}>FAZ DE CONTA QUE EU SOU… · EP. 02</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1.12, letterSpacing: 1, color: C.white, opacity: l1, translate: `0 ${(1 - l1) * 30}px`}}>
          A PROFISSÃO É DE FAZ DE CONTA.
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 96, lineHeight: 1.1, color: C.copperLight, marginTop: 26, opacity: l2, translate: `0 ${(1 - l2) * 30}px`}}>
          A estratégia é de verdade.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

