import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, clamp, SANS, SHADOW, SHADOW_BIG} from '../theme';
import {DUO_A, duoP} from '../timeline';
import {CtxText, Dot, Photo, Stroke} from './Draw';

const ease = {...clamp, easing: Easing.out(Easing.cubic)};
const IMG = {
  halter: 'img/halter.jpg',
  maquina: 'img/maquina_peito.jpg',
  leg: 'img/leg_press.jpg',
  bulgaro: 'img/bulgaro.jpg',
};

const big = (size: number, color: string = C.white): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: '-0.025em',
  textTransform: 'uppercase',
  color,
  textShadow: SHADOW_BIG,
  whiteSpace: 'nowrap',
});

// metade da tela (1080 × 960) com um recorte da foto
const Half: React.FC<{src: string; top: number; imgY: number; s?: number; grade?: string; children?: React.ReactNode}> = ({src, top, imgY, s = 1, grade = 'contrast(1.03)', children}) => (
  <div style={{position: 'absolute', left: 0, top, width: 1080, height: 960, overflow: 'hidden'}}>
    <Img
      src={staticFile(src)}
      style={{position: 'absolute', left: 0, top: -imgY, width: 1080, height: 1919, scale: String(s), transformOrigin: `540px ${imgY + 480}px`, filter: grade}}
    />
    {children}
  </div>
);

const Badge: React.FC<{x: number; y: number; s: number; children: React.ReactNode; size?: number}> = ({x, y, s, children, size = 128}) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size,
      backgroundColor: C.green,
      border: '5px solid #fff',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: SANS,
      fontWeight: 900,
      fontSize: size * 0.4,
      color: C.ink,
      scale: String(s),
    }}
  >
    {children}
  </div>
);

// ================= GANCHO: tela dividida máquina × pesos livres =================
export const Hook: React.FC<{ou: number; pesos: number; end: number}> = ({ou, pesos, end}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const z = interpolate(f, [0, end], [1, 1.06], clamp);
  // título completo já no 1º frame (headline de capa); cada parte pulsa quando é falada
  const lit = interpolate(f, [pesos - 2, pesos + 5], [0, 1], clamp);
  const ex = interpolate(f, [end - 1, end + 6], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const bump = (at: number) => interpolate(f, [at, at + 4, at + 13], [0, 1, 0], {...clamp, easing: Easing.inOut(Easing.sin)});
  void fps;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, translate: `0 ${-ex * 960}px`}}>
        <Half src={IMG.maquina} top={0} imgY={70} s={z} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 840, display: 'flex', justifyContent: 'center', translate: '0 -50%', scale: String(1 + 0.06 * bump(1))}}>
          <span style={big(132)}>Máquinas</span>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, translate: `0 ${ex * 960}px`}}>
        <Half src={IMG.halter} top={960} imgY={160} s={z} grade={`contrast(1.03) brightness(${0.82 + 0.18 * lit}) saturate(${0.85 + 0.15 * lit})`} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 1088, display: 'flex', justifyContent: 'center', translate: '0 -50%', scale: String(1 + 0.07 * bump(pesos))}}>
          <span style={big(104)}>
            Pesos livres<span style={{color: C.green}}>?</span>
          </span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 958, height: 4, backgroundColor: 'rgba(255,255,255,0.9)', opacity: 1 - ex}} />
      <div style={{opacity: 1 - ex}}>
        <Badge x={540} y={960} s={1 + 0.2 * bump(ou)}>
          OU
        </Badge>
      </div>
    </AbsoluteFill>
  );
};

// ================= CENA 1: supino com halteres → controle =================
export const SceneControle: React.FC<{dur: number; controle: number; contracao: number}> = ({dur, controle, contracao}) => (
  <Photo
    src={IMG.halter}
    keys={[
      {f: 0, s: 1.03, cx: 540, cy: 880},
      {f: controle - 4, s: 1.07, cx: 520, cy: 760},
      {f: contracao - 2, s: 1.08, cx: 520, cy: 760},
      {f: contracao + 20, s: 1.3, cx: 560, cy: 740},
      {f: dur, s: 1.34, cx: 560, cy: 745},
    ]}
    svg={
      <>
        <Stroke id="c-l" pts={[[175, 375], [175, 255]]} at={controle} dur={9} out={contracao - 6} head="end" w={5} />
        <Stroke id="c-r" pts={[[830, 345], [830, 225]]} at={controle + 3} dur={9} out={contracao - 6} head="end" w={5} />
        <Stroke id="c-pl" pts={[[175, 560], [175, 690]]} at={controle + 6} dur={8} out={contracao - 6} dash w={3} />
        <Stroke id="c-pr" pts={[[830, 520], [830, 650]]} at={controle + 9} dur={8} out={contracao - 6} dash w={3} />
      </>
    }
  >
    <CtxText x={502} y={262} at={controle} out={contracao - 6} size={96}>
      Controle
    </CtxText>
  </Photo>
);

// ================= CENA 2: búlgaro → estabilizadores (tronco e pernas) =================
export const SceneEstab: React.FC<{dur: number; musculos: number; estab: number}> = ({dur, musculos, estab}) => (
  <Photo
    src={IMG.bulgaro}
    keys={[
      {f: 0, s: 1.04, cx: 600, cy: 880},
      {f: dur, s: 1.15, cx: 620, cy: 900},
    ]}
    svg={
      <>
        <Stroke id="e-tr" pts={[[690, 365], [668, 620], [650, 880]]} at={3} dur={12} w={4} />
        <Dot x={690} y={365} at={3} />
        <Dot x={650} y={880} at={12} />
        <Stroke id="e-fl" pts={[[650, 880], [790, 1065], [738, 1580]]} at={musculos - 4} dur={12} w={4} />
        <Dot x={790} y={1065} at={musculos + 4} />
        <Dot x={738} y={1580} at={musculos + 10} />
        <Stroke id="e-bl" pts={[[650, 880], [330, 1070], [150, 900]]} at={musculos} dur={12} w={4} />
        <Dot x={150} y={900} at={musculos + 10} />
      </>
    }
  >
    <CtxText x={262} y={535} rot={-90} at={estab} size={68}>
      Estabilizadores
    </CtxText>
  </Photo>
);

// ================= CENA 3: máquina de peito → suporte externo (encosto + braços articulados) =================
export const SceneSuporte: React.FC<{dur: number; suporte: number}> = ({dur, suporte}) => (
  <Photo
    src={IMG.maquina}
    keys={[
      {f: 0, s: 1.04, cx: 540, cy: 760},
      {f: dur, s: 1.1, cx: 520, cy: 700},
    ]}
    svg={
      <>
        <Stroke id="s-al" pts={[[60, 240], [135, 292], [188, 420], [205, 560]]} at={3} dur={12} dash w={3} />
        <Stroke id="s-ar" pts={[[772, 252], [880, 302], [985, 420], [1028, 560]]} at={6} dur={12} dash w={3} />
        <Dot x={365} y={572} at={10} r={7} color={C.white} />
        <Dot x={925} y={572} at={13} r={7} color={C.white} />
        <Stroke id="s-enc" pts={[[206, 360], [210, 205], [232, 176], [498, 168], [522, 190], [530, 330]]} at={suporte - 2} dur={12} w={6} color={C.green} />
        <Stroke id="s-lead" pts={[[530, 262], [586, 262]]} at={suporte + 6} dur={5} w={3} color={C.green} />
      </>
    }
  >
    <CtxText x={600} y={262} align="left" at={suporte + 4} size={76}>
      Suporte
    </CtxText>
    <CtxText x={602} y={336} align="left" at={suporte + 9} size={50} color={C.white}>
      Externo
    </CtxText>
  </Photo>
);

// ================= CENA 4: leg press → movimento guiado =================
export const SceneGuiar: React.FC<{dur: number; ajudam: number; guiar: number}> = ({dur, ajudam, guiar}) => (
  <Photo
    src={IMG.leg}
    keys={[
      {f: 0, s: 1.04, cx: 560, cy: 900},
      {f: dur, s: 1.1, cx: 620, cy: 820},
    ]}
    svg={
      <>
        <Stroke id="g-trk" pts={[[600, 1330], [1010, 560]]} at={ajudam} dur={14} dash w={3} color="rgba(255,255,255,0.8)" />
        <Stroke id="g-arr" pts={[[660, 1150], [905, 690]]} at={guiar - 2} dur={12} w={6} color={C.green} head="both" />
        <Dot x={945} y={560} at={ajudam + 8} r={7} color={C.white} />
      </>
    }
  />
);

// ================= COMPARAÇÃO FINAL: combinar os dois =================
export const Combo: React.FC<{dur: number; dois: number}> = ({dur, dois}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inn = interpolate(f, [0, 7], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const ex = interpolate(f, [dur - 6, dur], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const off = Math.max(inn, ex) * 960;
  const z = interpolate(f, [0, dur], [1, 1.05], clamp);
  const plus = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 200, mass: 0.7}});
  const cP = interpolate(f, [3, 11], [0, 1], ease);
  const dP = spring({frame: f - dois, fps, config: {damping: 14, stiffness: 190, mass: 0.7}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, translate: `0 ${-off}px`}}>
        <Half src={IMG.leg} top={0} imgY={230} s={z} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 852, display: 'flex', justifyContent: 'center', translate: '0 -50%', opacity: cP, scale: String(0.94 + 0.06 * cP)}}>
          <span style={big(128)}>Combinar</span>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, translate: `0 ${off}px`}}>
        <Half src={IMG.bulgaro} top={960} imgY={380} s={z} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 1078, display: 'flex', justifyContent: 'center', translate: '0 -50%', opacity: Math.min(1, dP * 1.4), scale: String(0.8 + 0.2 * dP)}}>
          <span style={big(146, C.green)}>os dois</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 958, height: 4, backgroundColor: 'rgba(255,255,255,0.9)', opacity: 1 - Math.max(inn, ex)}} />
      <div style={{opacity: 1 - ex}}>
        <Badge x={540} y={960} s={plus} size={112}>
          +
        </Badge>
      </div>
    </AbsoluteFill>
  );
};

// ================= TELA DIVIDIDA: "um para pesos livres e o outro para máquinas" =================
const Tile: React.FC<{src: string; x: number; dir: number; p: number; on: number; label: string; pos: string}> = ({src, x, dir, p, on, label, pos}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: 230,
      width: 470,
      height: 640,
      borderRadius: 28,
      overflow: 'hidden',
      border: `4px solid ${on > 0.5 ? C.green : 'rgba(255,255,255,0.35)'}`,
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      translate: `${(1 - p) * dir * 620}px 0`,
      scale: String(0.97 + 0.03 * on),
    }}
  >
    <Img
      src={staticFile(src)}
      style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: `brightness(${0.5 + 0.5 * on}) saturate(${0.55 + 0.45 * on})`}}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 22,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: on > 0.5 ? C.ink : C.white,
          backgroundColor: on > 0.5 ? C.green : 'rgba(10,14,12,0.7)',
          padding: '10px 20px',
          borderRadius: 40,
        }}
      >
        {label}
      </span>
    </div>
  </div>
);

export const DuoTiles: React.FC<{pesos: number; maquinas: number}> = ({pesos, maquinas}) => {
  const f = useCurrentFrame();
  const p = duoP(f + DUO_A);
  const onL = interpolate(f, [pesos - 2, pesos + 4], [0, 1], clamp);
  const onR = interpolate(f, [maquinas - 2, maquinas + 4], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 1060,
          opacity: p,
          background: `linear-gradient(180deg, ${C.ink} 0%, ${C.ink} 86%, rgba(10,14,12,0) 100%)`,
        }}
      />
      <Tile src={IMG.halter} x={50} dir={-1} p={p} on={onL} label="Pesos livres" pos="50% 22%" />
      <Tile src={IMG.leg} x={560} dir={1} p={p} on={onR} label="Máquinas" pos="62% 32%" />
    </AbsoluteFill>
  );
};

// ================= CTA gravado: compartilha, comenta e curte (ícones animados) =================
const ICONS = {
  share: 'M43 5 L5 20 L20 27 L27 43 Z M20 27 L43 5',
  comment: 'M9 9 H39 A4 4 0 0 1 43 13 V30 A4 4 0 0 1 39 34 H22 L12 42 V34 H9 A4 4 0 0 1 5 30 V13 A4 4 0 0 1 9 9 Z',
  heart: 'M24 41 C10 31 4 24 4 16 C4 10 9 6 14 6 C18 6 22 8 24 12 C26 8 30 6 34 6 C39 6 44 10 44 16 C44 24 38 31 24 41 Z',
};

const Icon: React.FC<{d: string; x: number; at: number; active: boolean; fill?: boolean}> = ({d, x, at, active, fill}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 11, stiffness: 210, mass: 0.6}});
  const col = active ? C.green : C.white;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 64,
        top: 1170 - 64,
        width: 128,
        height: 128,
        borderRadius: 128,
        backgroundColor: 'rgba(10,14,12,0.6)',
        border: `3px solid ${active ? C.green : 'rgba(255,255,255,0.5)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scale: String(s),
        boxShadow: '0 10px 26px rgba(0,0,0,0.4)',
      }}
    >
      <svg width={64} height={64} viewBox="0 0 48 48">
        <path d={d} fill={fill && active ? col : 'none'} stroke={col} strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const CtaIcons: React.FC<{share: number; comment: number; like: number}> = ({share, comment, like}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Icon d={ICONS.share} x={360} at={share} active={f < comment} />
      <Icon d={ICONS.comment} x={540} at={comment} active={f >= comment && f < like} />
      <Icon d={ICONS.heart} x={720} at={like} active={f >= like} fill />
    </AbsoluteFill>
  );
};

// ================= FECHAMENTO EM MOTION: pesos livres + máquinas = treino completo =================
const Round: React.FC<{src: string; x: number; y: number; p: number; pos: string; label: string}> = ({src, x, y, p, pos, label}) => (
  <div style={{position: 'absolute', left: x - 150, top: y - 150, width: 300, opacity: p}}>
    <div style={{width: 300, height: 300, borderRadius: 300, overflow: 'hidden', border: `5px solid ${C.white}`, boxShadow: '0 16px 40px rgba(0,0,0,0.55)'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
    </div>
    <div style={{marginTop: 22, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: '0.02em', textTransform: 'uppercase', color: C.white, textShadow: SHADOW}}>
      {label}
    </div>
  </div>
);

export const EndMotion: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const wipe = interpolate(f, [0, 8], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const inn = interpolate(f, [5, 15], [0, 1], ease);
  const merge = interpolate(f, [30, 44], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const plus = spring({frame: f - 11, fps, config: {damping: 12, stiffness: 200, mass: 0.7}});
  const t1 = interpolate(f, [17, 26], [0, 1], ease);
  const t2 = interpolate(f, [22, 31], [0, 1], ease);
  const dx = (1 - inn) * 320 - merge * 26;
  const push = interpolate(f, [0, 64], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{translate: `0 ${wipe * 1920}px`}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, #15241B 0%, ${C.ink} 70%)`}} />
      <AbsoluteFill style={{scale: String(push), transformOrigin: '540px 980px'}}>
      <Round src={IMG.halter} x={325 - dx} y={760} p={inn} pos="50% 22%" label="Pesos livres" />
      <Round src={IMG.leg} x={750 + dx} y={760} p={inn} pos="60% 30%" label="Máquinas" />
      <Badge x={540} y={760} s={plus} size={104}>
        +
      </Badge>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center', translate: '0 -50%', opacity: t1, clipPath: `inset(-30% ${(1 - t1) * 100}% -30% 0)`}}>
        <span style={big(118)}>Treino</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1272, display: 'flex', justifyContent: 'center', translate: '0 -50%', opacity: t2, clipPath: `inset(-30% ${(1 - t2) * 100}% -30% 0)`}}>
        <span style={big(118, C.green)}>Completo</span>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Stroke id="end-u" pts={[[245, 1352], [835, 1352]]} at={30} dur={10} w={7} color={C.green} />
      </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
