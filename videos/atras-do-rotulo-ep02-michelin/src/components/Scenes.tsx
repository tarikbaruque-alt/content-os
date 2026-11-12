import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MK} from '../timeline';
import {C, clamp, SANS, SERIF, SHADOW, SHADOW_BIG} from '../theme';
import {Lockup, Vinheta} from './Brand';
import {camXY, ease, easeIO, Film, IllustrationTag, Photo, Star, starPath, Stroke} from './Draw';
import {FranceMap, GuideBook, Icon, Paper, Timeline} from './Kit';

type SP = {from: number; dur: number; vh: number};
const m = (k: string, from: number) => MK[k] - from;

// ================= CAPA (também é o 1º frame do vídeo) =================
export const CoverArt: React.FC<{f?: number}> = ({f = 0}) => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <Photo src="img/estrada.jpg" keys={[{f: 0, s: 1.06, cx: 520, cy: 980}, {f: 40, s: 1.09, cx: 520, cy: 975}]} frame={f} grade="contrast(1.08) saturate(1.05)" />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,11,13,0.82) 0%, rgba(11,11,13,0.35) 26%, rgba(11,11,13,0) 40%, rgba(11,11,13,0) 52%, rgba(11,11,13,0.78) 70%, rgba(11,11,13,0.92) 100%)'}} />
    <div style={{position: 'absolute', left: 70, top: 280, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
      <Lockup sc={0.62} align="left" />
      <div style={{marginTop: 22, display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: '0.16em', color: C.white, background: C.red, padding: '10px 20px 8px', borderRadius: 10}}>EP. 02 — MICHELIN</div>
    </div>
    <div style={{position: 'absolute', left: 60, right: 60, top: 1170, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 92, lineHeight: 1.02, letterSpacing: '-0.02em', color: C.white, textShadow: SHADOW_BIG}}>
      UMA FÁBRICA
      <br />
      DE <span style={{color: C.gold}}>PNEUS</span> DOMINA
      <br />A <span style={{color: C.gold}}>GASTRONOMIA?</span>
    </div>
    <IllustrationTag x={60} y={1600} o={0.85} />
  </AbsoluteFill>
);

const Cover: React.FC<SP> = () => <CoverArt f={useCurrentFrame()} />;

// ================= GANCHO =================
const Sparkle: React.FC<{x: number; y: number; p: number; size?: number}> = ({x, y, p, size = 160}) => {
  if (p <= 0 || p >= 1) return null;
  const a = Math.sin(p * Math.PI);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, opacity: a, rotate: `${p * 40}deg`, overflow: 'visible'}}>
      <circle r={22} fill="rgba(255,226,140,0.55)" style={{filter: 'blur(6px)'}} />
      <path d="M0 -48 L5 -5 L48 0 L5 5 L0 48 L-5 5 L-48 0 L-5 -5 Z" fill="#FFF3C8" />
    </svg>
  );
};

const HookStar: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const st = m('estrela1', from);
  return (
    <AbsoluteFill>
      <Photo
        src="img/estrela.jpg"
        vh={vh}
        keys={[
          {f: 0, s: 1.02, cx: 560, cy: 820},
          {f: dur, s: 1.32, cx: 420, cy: 720},
        ]}
      >
        <Sparkle x={373} y={700} p={interpolate(f, [st - 2, st + 18], [0, 1], clamp)} />
      </Photo>
      <IllustrationTag x={40} y={vh - 120} />
    </AbsoluteFill>
  );
};

// A fábrica: mesma imagem do painel e da tela cheia (a transição "desce" a câmera e revela tudo)
const FACT_S = 1.05;
const PANEL_Y = -640;
const HookFactory: React.FC<SP> = ({dur}) => {
  const f = useCurrentFrame();
  const s = FACT_S + 0.01 * (f / dur);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile('img/fabrica.jpg')} style={{position: 'absolute', width: 1080, height: 1919, transformOrigin: '0 0', transform: `translate(${540 - 540 * s}px, ${PANEL_Y}px) scale(${s})`, filter: 'contrast(1.05) saturate(1.0)'}} />
      <IllustrationTag x={40} y={740} />
    </AbsoluteFill>
  );
};

// ================= 1900 · A FÁBRICA (2.5D) =================
// camada da frente: a pilha de pneus (recortada com máscara suave) cresce mais rápido que o fundo
const TIRE_MASK = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1919"><filter id="b"><feGaussianBlur stdDeviation="9"/></filter><polygon filter="url(#b)" fill="white" points="0,1040 380,1040 410,1100 450,1225 610,1218 705,1285 742,1450 738,1700 700,1919 0,1919"/></svg>',
)}")`;

const Dust: React.FC<{f: number; n?: number}> = ({f, n = 26}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: n}).map((_, i) => {
      const r = (Math.sin(i * 91.7) + 1) / 2;
      const r2 = (Math.sin(i * 37.3 + 2) + 1) / 2;
      const x = (r * 1200 + f * (0.4 + r2 * 0.9)) % 1180 - 50;
      const y = 300 + r2 * 1300 + Math.sin(f / 30 + i) * 12;
      const sz = 2 + r * 5;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz, background: 'rgba(255,225,170,0.55)', filter: `blur(${r > 0.6 ? 2 : 0.6}px)`, opacity: 0.35 + r2 * 0.4}} />;
    })}
  </AbsoluteFill>
);

const Factory: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const e = interpolate(f, [0, 12], [0, 1], easeIO);
  const s = FACT_S + 0.05 * (f / dur);
  const yFull = camXY(s, 540, 1000).y;
  const y = PANEL_Y + (yFull - PANEL_Y) * e;
  const x = 540 - 540 * s;
  const fg = 1 + 0.07 * (f / dur);
  // "1900" grande que voa para a linha do tempo
  const t1900 = m('f1900', from);
  const yrIn = interpolate(f, [t1900, t1900 + 8], [0, 1], ease);
  const fly = interpolate(f, [t1900 + 26, t1900 + 40], [0, 1], easeIO);
  const tlIn = interpolate(f, [t1900 + 32, t1900 + 44], [0, 1], ease);
  // destaques
  const pn = m('pneus2', from);
  const ex = m('existiam3', from);
  const mn = m('menos3', from);
  const dim = interpolate(f, [mn - 2, mn + 8], [0, 1], ease);
  const count = Math.round(interpolate(f, [mn + 2, mn + 18], [0, 3000], {...clamp, easing: Easing.out(Easing.cubic)}));
  const numIn = interpolate(f, [mn, mn + 8], [0, 1], ease);
  const carsIn = interpolate(f, [m('carros3', from) - 2, m('carros3', from) + 8], [0, 1], ease);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1919, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${s})`}}>
        <Img src={staticFile('img/fabrica.jpg')} style={{position: 'absolute', width: 1080, height: 1919, filter: 'contrast(1.06) saturate(0.95) sepia(0.12)'}} />
        <div style={{position: 'absolute', inset: 0, transformOrigin: '360px 1919px', scale: String(fg), WebkitMaskImage: TIRE_MASK, maskImage: TIRE_MASK}}>
          <Img src={staticFile('img/fabrica.jpg')} style={{position: 'absolute', width: 1080, height: 1919, filter: 'contrast(1.1) saturate(0.95) sepia(0.12) brightness(1.04)'}} />
        </div>
        <svg width={1080} height={1919} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'}}>
          <Stroke id="pneu" f={f} at={pn - 2} dur={14} out={ex - 6} pts={[[220, 1570], [720, 1570]]} d="M 470 1320 A 250 250 0 1 1 469 1320" color={C.gold} w={5} />
          <Stroke id="car1" f={f} at={ex} dur={10} out={mn - 4} pts={[[760, 941], [882, 941]]} d="M 821 881 A 60 60 0 1 1 820 881" color={C.gold} w={4} />
          <Stroke id="car2" f={f} at={ex + 4} dur={10} out={mn - 4} pts={[[870, 1016], [1060, 1016]]} d="M 964 921 A 95 95 0 1 1 963 921" color={C.gold} w={4} />
        </svg>
      </div>
      <Dust f={f + from} />
      <Film o={0.12} vignette={0.5} />
      {/* escurece para o número */}
      <AbsoluteFill style={{backgroundColor: `rgba(11,11,13,${0.62 * dim})`}} />
      {/* ano grande */}
      {fly < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 + (150 - 540) * fly,
            top: 860 + (271 - 860) * fly,
            translate: '-50% -50%',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: 300 - 260 * fly,
            lineHeight: 1,
            color: C.gold,
            textShadow: SHADOW_BIG,
            opacity: yrIn * (1 - fly * 0.9),
            scale: String(0.9 + 0.1 * yrIn),
            letterSpacing: '-0.01em',
          }}
        >
          1900
        </div>
      ) : null}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(11,11,13,${0.7 * tlIn}) 0%, rgba(11,11,13,0) 26%)`}} />
      <Timeline pos={0} appear={tlIn} />
      {/* menos de 3.000 carros */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: numIn, translate: `0 ${(1 - numIn) * 30}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, letterSpacing: '0.32em', color: C.white, paddingLeft: '0.32em'}}>MENOS DE</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 290, lineHeight: 1, letterSpacing: '-0.03em', color: C.gold, textShadow: '0 0 60px rgba(242,193,78,0.35)', fontVariantNumeric: 'tabular-nums', scale: String(1.15 - 0.15 * numIn)}}>
          {count.toLocaleString('pt-BR')}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: '0.12em', color: C.white, opacity: carsIn, translate: `0 ${(1 - carsIn) * 16}px`}}>CARROS NO PAÍS</div>
      </div>
      <IllustrationTag x={48} y={1290} o={1 - dim} />
    </AbsoluteFill>
  );
};

// ================= O GUIA GRATUITO → MAPA DA FRANÇA =================
const Table: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 42%, rgba(255,214,150,0.22) 0%, rgba(0,0,0,0) 55%), repeating-linear-gradient(176deg, rgba(0,0,0,0.0) 0px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0) 9px, rgba(255,255,255,0.025) 14px, rgba(0,0,0,0) 22px), linear-gradient(180deg, #3A2618 0%, #2A1B11 60%, #1A110B 100%)`,
    }}
  />
);

const Guide: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gi = m('guia5', from);
  const drop = spring({frame: f - (gi - 6), fps, config: {damping: 14, stiffness: 120, mass: 0.9}});
  const stamp = interpolate(f, [m('gratuito5', from), m('gratuito5', from) + 6], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const toMap = interpolate(f, [m('com5', from) - 4, m('com5', from) + 8], [0, 1], easeIO);
  const kick = interpolate(f, [6, 16], [0, 1], ease) * (1 - toMap);
  const of = m('oficinas5', from);
  const mp = m('mapas5', from);
  const ht = m('hoteis5', from);
  const rs = m('restaurantes5', from);
  const ju = m('justamente5', from);
  const vj = m('viajar5', from);
  const carP = interpolate(f, [ju + 2, vj + 6], [0, 1], easeIO);
  const zoom = interpolate(f, [ju, dur], [1, 1.06], easeIO);
  const cart = interpolate(f, [mp - 2, mp + 8], [0, 1], ease);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* mesa + guia */}
      <AbsoluteFill style={{opacity: 1 - toMap}}>
        <Table />
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em', color: C.gold, opacity: kick, paddingLeft: '0.3em'}}>
          ANDRÉ E ÉDOUARD MICHELIN
        </div>
        <div
          style={{
            position: 'absolute',
            left: 540,
            top: 900,
            translate: `-50% calc(-50% + ${(1 - drop) * -1100}px)`,
            rotate: `${-4 - (1 - drop) * 18}deg`,
            scale: String(1 + toMap * 1.4),
          }}
        >
          <div style={{position: 'absolute', left: 30, right: -10, top: 40, bottom: -40, background: 'rgba(0,0,0,0.5)', filter: 'blur(26px)', borderRadius: 30, opacity: drop}} />
          <GuideBook w={430} stamp={stamp} />
        </div>
      </AbsoluteFill>
      {/* mapa */}
      <AbsoluteFill style={{opacity: toMap, scale: String((0.92 + 0.08 * toMap) * zoom)}}>
        <Paper />
        <div style={{position: 'absolute', left: 80, top: 410}}>
          <FranceMap
            w={920}
            f={f}
            drawAt={m('com5', from) - 2}
            cities={['Paris', 'Clermont-Ferrand', 'Lyon', 'Rouen', 'Bordeaux', 'Marseille', 'Nantes', 'Lille', 'Estrasburgo', 'Toulouse']}
            highlight="Clermont-Ferrand"
            routes={[
              {pts: ['Clermont-Ferrand', 'Lyon'], t: of - 6, dur: 12},
              {pts: ['Lyon', 'Paris'], t: ht - 12, dur: 12},
              {pts: ['Paris', 'Rouen'], t: rs - 10, dur: 10},
              {pts: ['Paris', 'Lille'], t: ju, dur: 14, dash: true},
              {pts: ['Paris', 'Nantes'], t: ju + 4, dur: 16, dash: true},
              {pts: ['Paris', 'Estrasburgo'], t: ju + 8, dur: 16, dash: true},
              {pts: ['Clermont-Ferrand', 'Bordeaux'], t: ju + 10, dur: 16, dash: true},
              {pts: ['Lyon', 'Marseille'], t: ju + 14, dur: 14, dash: true},
              {pts: ['Bordeaux', 'Toulouse'], t: ju + 20, dur: 12, dash: true},
            ]}
            pins={[
              {at: 'Lyon', t: of, icon: 'wrench', label: 'OFICINAS'},
              {at: 'Paris', t: ht, icon: 'bed', label: 'HOTÉIS'},
              {at: 'Rouen', t: rs, icon: 'fork', label: 'RESTAURANTES', side: 'l'},
            ]}
            car={{route: ['Clermont-Ferrand', 'Lyon', 'Paris', 'Rouen'], p: carP, o: interpolate(f, [ju, ju + 4], [0, 1], clamp)}}
          />
        </div>
        {/* cartucho "mapas" */}
        <div style={{position: 'absolute', left: 90, top: 1160, display: 'flex', alignItems: 'center', gap: 16, opacity: cart, translate: `0 ${(1 - cart) * 14}px`}}>
          <div style={{width: 92, height: 92, borderRadius: 92, border: `3px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(234,223,198,0.9)'}}>
            <Icon name="compass" size={64} color={C.ink} />
          </div>
          <div>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: '0.12em', color: C.ink}}>MAPAS</div>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: C.ink, opacity: 0.8}}>França, 1900</div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: C.ink, opacity: interpolate(f, [m('com5', from) + 4, m('com5', from) + 14], [0, 0.85], clamp)}}>
          Clermont-Ferrand, berço da Michelin
        </div>
        <Film o={0.14} vignette={0.35} />
      </AbsoluteFill>
      {toMap < 1 ? <Film o={0.12} vignette={0.5} /> : null}
    </AbsoluteFill>
  );
};

// ================= O GUIA APOIANDO A BANCADA =================
const BOOK: [number, number][] = [
  [247, 1108],
  [861, 1159],
  [803, 1481],
  [69, 1423],
];
const CalcoFull: React.FC<SP> = ({dur}) => {
  const f = useCurrentFrame();
  const ex = interpolate(f, [dur - 8, dur], [0, 1], easeIO);
  return (
    <AbsoluteFill>
      <Photo
        src="img/calco.jpg"
        vh={1920 - 1060 * ex}
        keys={[
          {f: 0, s: 1.02, cx: 540, cy: 900},
          {f: dur, s: 1.22, cx: 470, cy: 1230},
        ]}
        grade="contrast(1.06) saturate(0.98) sepia(0.08)"
      />
      <Dust f={f} n={18} />
      <Film o={0.1} vignette={0.45} />
      <IllustrationTag x={48} y={1290} o={1 - ex} />
    </AbsoluteFill>
  );
};

const CalcoPanel: React.FC<SP> = ({from, vh}) => {
  const f = useCurrentFrame();
  const fr = m('calco7', from) - 1;
  const fz = interpolate(f, [fr, fr + 3], [0, 1], clamp);
  const flash = interpolate(f, [fr, fr + 1, fr + 5], [0, 0.4, 0], clamp);
  const lbl = interpolate(f, [fr + 1, fr + 9], [0, 1], ease);
  const keys = [
    {f: 0, s: 1.22, cx: 470, cy: 1230},
    {f: fr, s: 1.3, cx: 470, cy: 1262},
  ];
  const poly = BOOK.map((p) => p.join(',')).join(' ');
  return (
    <AbsoluteFill>
      <Photo
        src="img/calco.jpg"
        vh={vh}
        keys={keys}
        grade={`contrast(1.06) saturate(${0.98 - 0.5 * fz}) sepia(0.08)`}
        svg={
          <>
            <defs>
              <mask id="calco-hole">
                <rect x={-200} y={-200} width={1500} height={2400} fill="white" />
                <polygon points={poly} fill="black" style={{filter: 'blur(10px)'}} />
              </mask>
            </defs>
            <rect x={-200} y={-200} width={1500} height={2400} fill={`rgba(11,11,13,${0.55 * fz})`} mask="url(#calco-hole)" />
            <Stroke id="book" f={f} at={fr + 1} dur={10} pts={[...BOOK, BOOK[0]]} color={C.gold} w={5} />
          </>
        }
      >
        <div
          style={{
            position: 'absolute',
            left: 470,
            top: 1545,
            translate: '-50% -50%',
            whiteSpace: 'nowrap',
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 60,
            letterSpacing: '-0.01em',
            color: C.white,
            textShadow: SHADOW_BIG,
            opacity: lbl,
            scale: String(1.12 - 0.12 * lbl),
          }}
        >
          CALÇO DE <span style={{color: C.gold}}>MÓVEL</span>
        </div>
      </Photo>
      <AbsoluteFill style={{backgroundColor: `rgba(255,255,255,${flash})`}} />
      <Film o={0.1} vignette={0.4} />
      <IllustrationTag x={40} y={vh - 120} o={1 - fz} />
    </AbsoluteFill>
  );
};

// ================= 1920 · O GUIA PASSA A SER VENDIDO =================
const Evol1920: React.FC<SP> = ({from}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vl = m('valor8', from);
  const gr = m('gratuito8', from);
  const pos = interpolate(f, [vl, vl + 14], [0, 1], easeIO);
  const struck = interpolate(f, [vl - 2, vl + 6], [0, 1], ease);
  const tag = spring({frame: f - (vl + 4), fps, config: {damping: 9, stiffness: 120, mass: 0.8}});
  const pulse = 1 + 0.06 * Math.sin(Math.min(1, Math.max(0, (f - gr) / 10)) * Math.PI);
  const appear = interpolate(f, [0, 10], [0, 1], ease);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, #2A1E14 0%, #120D09 75%)'}}>
      <Timeline pos={pos} appear={appear} y={240} />
      <div style={{position: 'absolute', left: 360, top: 600, translate: '-50% -50%', rotate: '-3deg', opacity: appear, scale: String(pulse)}}>
        <GuideBook w={290} stamp={1} struck={struck} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 600,
          top: 430,
          transformOrigin: '30px 0px',
          rotate: `${(1 - tag) * 70 - 6}deg`,
          opacity: Math.min(1, tag * 2),
        }}
      >
        <svg width={60} height={60} style={{position: 'absolute', left: 0, top: -40}}>
          <path d="M30 0 C 30 20, 34 30, 30 46" stroke={C.paperDark} strokeWidth={3} fill="none" />
        </svg>
        <div style={{marginTop: 6, width: 330, padding: '30px 28px 24px', background: 'linear-gradient(135deg, #F4E9D0, #E2D0A8)', clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>
          <div style={{marginLeft: 40, fontFamily: SERIF, fontStyle: 'italic', fontSize: 70, lineHeight: 1, color: C.red}}>1920</div>
          <div style={{marginLeft: 40, marginTop: 8, fontFamily: SANS, fontWeight: 900, fontSize: 28, lineHeight: 1.15, letterSpacing: '0.04em', color: C.ink}}>
            PASSA A SER
            <br />
            VENDIDO
          </div>
        </div>
      </div>
      <Film o={0.12} vignette={0.4} />
    </AbsoluteFill>
  );
};

// ================= 1926 · AS PRIMEIRAS ESTRELAS =================
const Stars1926: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const y26 = m('f1926', from);
  const es = m('estrelas9', from);
  const pos = 1 + interpolate(f, [y26 - 4, y26 + 10], [0, 1], easeIO);
  const glow = interpolate(f, [es - 2, es + 8], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo
        src="img/estrela.jpg"
        keys={[
          {f: 0, s: 1.0, cx: 600, cy: 900},
          {f: es, s: 1.2, cx: 430, cy: 760},
          {f: dur, s: 1.26, cx: 400, cy: 730},
        ]}
        grade="contrast(1.05) saturate(1.02)"
      >
        <div style={{position: 'absolute', left: 373 - 90, top: 700 - 90, width: 180, height: 180, borderRadius: 180, background: 'radial-gradient(circle, rgba(255,226,140,0.75) 0%, rgba(255,226,140,0) 65%)', opacity: glow * (0.75 + 0.25 * Math.sin(f / 4))}} />
        <Sparkle x={373} y={700} p={interpolate(f, [es, es + 18], [0, 1], clamp)} size={200} />
      </Photo>
      <Film o={0.08} vignette={0.45} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,11,13,0.75) 0%, rgba(11,11,13,0) 24%)'}} />
      <Timeline pos={pos} appear={1} starAt={glow > 0.5 ? 1.9 : 99} />
      <IllustrationTag x={48} y={1290} />
    </AbsoluteFill>
  );
};

// ================= 1931 · A CLASSIFICAÇÃO =================
const StarRow: React.FC<{n: number; title: string; at: number; f: number; y: number}> = ({n, title, at, f, y}) => {
  const a = interpolate(f, [at - 2, at + 8], [0, 1], ease);
  return (
    <div style={{position: 'absolute', left: 90, right: 70, top: y, display: 'flex', alignItems: 'center', gap: 34, opacity: a, translate: `${(1 - a) * -30}px 0`}}>
      <div style={{width: 330, display: 'flex', gap: 8}}>
        {Array.from({length: n}).map((_, i) => {
          const p = interpolate(f, [at + i * 4, at + i * 4 + 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
          return <Star key={i} size={100} p={p} glow={0.8} />;
        })}
      </div>
      <div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: '0.24em', color: 'rgba(246,244,239,0.75)'}}>VALE UM{n === 2 ? '' : 'A'}</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 82, lineHeight: 1, color: C.white}}>{title}</div>
      </div>
    </div>
  );
};

const Scale1931: React.FC<SP> = ({from}) => {
  const f = useCurrentFrame();
  const cl = m('classificacao10', from);
  const pos = 2 + interpolate(f, [cl - 4, cl + 10], [0, 1], easeIO);
  const kick = interpolate(f, [cl, cl + 10], [0, 1], ease);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <AbsoluteFill style={{scale: '1.15'}}>
        <Img src={staticFile('img/estrela.jpg')} style={{width: 1080, height: 1919, objectFit: 'cover', filter: 'blur(26px) brightness(0.32) saturate(1.2)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(242,193,78,0.10) 0%, rgba(0,0,0,0) 60%)'}} />
      <Timeline pos={pos} appear={1} starAt={1.9} />
      <div style={{position: 'absolute', left: 90, top: 420, opacity: kick, translate: `0 ${(1 - kick) * 16}px`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: '0.3em', color: C.gold}}>
          <div style={{width: 40, height: 3, background: C.gold}} />A CLASSIFICAÇÃO
        </div>
      </div>
      <StarRow n={1} title="parada" at={m('uma10', from)} f={f} y={560} />
      <StarRow n={2} title="desvio" at={m('duas10', from)} f={f} y={800} />
      <StarRow n={3} title="viagem especial" at={m('tres10', from)} f={f} y={1040} />
      <Film o={0.08} vignette={0.4} />
    </AbsoluteFill>
  );
};

// ================= 30 MILHÕES =================
const Counter30: React.FC<SP> = ({from, vh}) => {
  const f = useCurrentFrame();
  const t30 = m('f30', from);
  const mais = m('mais11', from);
  const exm = m('exemplares11', from);
  const n = Math.round(interpolate(f, [t30 - 8, t30 + 14], [0, 30000000], {...clamp, easing: Easing.out(Easing.cubic)}));
  const numIn = interpolate(f, [mais - 2, mais + 6], [0, 1], ease);
  const word = interpolate(f, [t30 + 16, t30 + 24], [0, 1], ease);
  const lbl = interpolate(f, [exm - 2, exm + 8], [0, 1], ease);
  const stack = interpolate(f, [t30 - 8, t30 + 20], [0, 1], easeIO);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 70%, #3A1512 0%, #120A09 75%)'}}>
      {/* pilha de guias crescendo */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: vh, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, opacity: 0.35}}>
        {Array.from({length: 13}).map((_, i) => {
          const hh = (220 + ((i * 53) % 5) * 70) * stack * interpolate(f, [t30 - 8 + i * 1.5, t30 + 6 + i * 1.5], [0, 1], clamp);
          return <div key={i} style={{width: 66, height: hh, borderRadius: '6px 6px 0 0', background: 'linear-gradient(90deg, #8E1C15, #B3291F 50%, #7A1510)', borderTop: `4px solid ${C.gold}`}} />;
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', opacity: numIn}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: '0.3em', color: C.white, paddingLeft: '0.3em'}}>MAIS DE</div>
        <div style={{position: 'relative', height: 200}}>
          <div style={{position: 'absolute', left: 0, right: 0, fontFamily: SANS, fontWeight: 900, fontSize: 150, lineHeight: 1.3, color: C.gold, fontVariantNumeric: 'tabular-nums', opacity: 1 - word, textShadow: '0 0 50px rgba(242,193,78,0.35)'}}>
            {n.toLocaleString('pt-BR')}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, fontFamily: SANS, fontWeight: 900, fontSize: 170, lineHeight: 1.15, letterSpacing: '-0.02em', color: C.gold, opacity: word, scale: String(0.9 + 0.1 * word), textShadow: '0 0 60px rgba(242,193,78,0.4)'}}>
            30 MILHÕES
          </div>
        </div>
        <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: '0.12em', color: C.white, opacity: lbl}}>DE EXEMPLARES VENDIDOS</div>
        <div style={{marginTop: 14, fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: 'rgba(246,244,239,0.7)', opacity: lbl}}>segundo a própria Michelin</div>
      </div>
      <Film o={0.08} vignette={0.35} />
    </AbsoluteFill>
  );
};

// ================= MAPA · DA ESTRADA AO RESTAURANTE =================
const MapTrip: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const mo = m('motoristas12', from);
  const rs = m('restaurantes12', from);
  const carP = interpolate(f, [mo - 4, rs + 6], [0, 1], easeIO);
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{position: 'absolute', left: 150, top: 95, scale: String(interpolate(f, [0, dur], [1, 1.05], clamp)), transformOrigin: '50% 60%'}}>
        <FranceMap
          w={770}
          f={f}
          drawAt={-20}
          cities={['Paris', 'Clermont-Ferrand', 'Lyon', 'Avignon', 'Bordeaux', 'Marseille']}
          routes={[{pts: ['Paris', 'Clermont-Ferrand', 'Lyon', 'Avignon'], t: mo - 4, dur: rs + 6 - (mo - 4)}]}
          pins={[{at: 'Avignon', t: rs - 2, icon: 'star3', label: 'RESTAURANTE', side: 'l'}]}
          car={{route: ['Paris', 'Clermont-Ferrand', 'Lyon', 'Avignon'], p: carP, o: interpolate(f, [mo - 6, mo - 2], [0, 1], clamp)}}
        />
      </div>
      <Film o={0.12} vignette={0.35} />
    </AbsoluteFill>
  );
};

// ================= CHEGANDO AO RESTAURANTE + O PNEU =================
const Arrival: React.FC<SP> = ({from, dur}) => {
  const c = m('carro14', from);
  return (
    <AbsoluteFill>
      <Photo
        src="img/estrada.jpg"
        keys={[
          {f: 0, s: 1.0, cx: 560, cy: 1000},
          {f: c + 6, s: 1.2, cx: 690, cy: 880},
          {f: dur, s: 1.21, cx: 692, cy: 878},
        ]}
        grade="contrast(1.06) saturate(1.05)"
      />
      <Film o={0.06} vignette={0.4} />
      <IllustrationTag x={48} y={1290} />
    </AbsoluteFill>
  );
};

const Tire: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const pn = m('pneu14', from);
  const a = interpolate(f, [0, 5], [0, 1], ease);
  const b = interpolate(f, [pn - 2, pn + 6], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo
        src="img/estrada.jpg"
        keys={[
          {f: 0, s: 1.95, cx: 250, cy: 1300},
          {f: pn - 1, s: 1.98, cx: 250, cy: 1300},
          {f: pn + 10, s: 2.25, cx: 245, cy: 1320},
          {f: dur, s: 2.3, cx: 245, cy: 1322},
        ]}
        grade="contrast(1.12) saturate(1.05)"
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(11,11,13,0) 30%, rgba(11,11,13,0.55) 100%)'}} />
      <div style={{position: 'absolute', right: 70, top: 720, textAlign: 'right', fontFamily: SANS, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em', textShadow: SHADOW_BIG}}>
        <div style={{fontSize: 110, color: C.white, opacity: a, translate: `${(1 - a) * 30}px 0`}}>GASTANDO</div>
        <div style={{fontSize: 170, color: C.gold, opacity: b, scale: String(1.15 - 0.15 * b), transformOrigin: 'right center'}}>PNEU.</div>
      </div>
      <Film o={0.06} vignette={0.5} />
    </AbsoluteFill>
  );
};

// ================= ANÚNCIO GENÉRICO × CONTEÚDO ÚTIL =================
const AdCards: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = m('mostre17', from);
  const al = m('almoco17', from);
  const aIn = spring({frame: f, fps, config: {damping: 16, stiffness: 140}});
  const sw = interpolate(f, [ms - 3, ms + 9], [0, 1], easeIO);
  const bIn = spring({frame: f - (ms - 1), fps, config: {damping: 15, stiffness: 130}});
  const clk = interpolate(f, [ms + 6, al + 4], [0, 1], easeIO);
  const strike = interpolate(f, [ms - 2, ms + 6], [0, 1], ease);
  void dur;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #1C1C22 0%, #0B0B0D 75%)'}}>
      {/* anúncio genérico */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 190 - sw * 250,
          top: 230,
          width: 380,
          height: 500,
          borderRadius: 26,
          background: '#F2F2F2',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          opacity: aIn * (1 - 0.45 * sw),
          scale: String((0.9 + 0.1 * aIn) * (1 - 0.18 * sw)),
          filter: `grayscale(${sw}) blur(${sw * 1.5}px)`,
          rotate: `${-sw * 6}deg`,
          overflow: 'hidden',
          fontFamily: SANS,
          textAlign: 'center',
        }}
      >
        <div style={{background: '#D6D6D6', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, letterSpacing: '0.2em', color: '#777'}}>ANÚNCIO</div>
        <div style={{marginTop: 50, fontWeight: 900, fontSize: 40, color: '#444'}}>MENSALIDADE</div>
        <div style={{position: 'relative', display: 'inline-block', marginTop: 10, fontWeight: 900, fontSize: 80, color: '#C8312B'}}>
          R$ 99,90
          <div style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 8, background: '#222', transformOrigin: 'left', scale: `${strike} 1`, borderRadius: 4}} />
        </div>
        <div style={{margin: '40px auto 0', width: 250, padding: '18px 0', borderRadius: 40, background: '#BDBDBD', fontWeight: 800, fontSize: 24, color: '#fff'}}>MATRICULE-SE</div>
      </div>
      {/* conteúdo útil */}
      <div
        style={{
          position: 'absolute',
          left: 430 + (1 - bIn) * 500,
          top: 190,
          width: 520,
          height: 580,
          borderRadius: 30,
          background: 'linear-gradient(160deg, #23222A 0%, #141318 100%)',
          border: `2px solid rgba(242,193,78,0.55)`,
          boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          opacity: Math.min(1, bIn * 1.4),
          fontFamily: SANS,
          padding: 40,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <svg width={130} height={130} viewBox="0 0 130 130">
            <circle cx={65} cy={65} r={56} fill="none" stroke="rgba(246,244,239,0.18)" strokeWidth={10} />
            <circle cx={65} cy={65} r={56} fill="none" stroke={C.gold} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${0.5 * clk} 1`} transform="rotate(-90 65 65)" />
            <line x1={65} y1={65} x2={65 + 34 * Math.sin(clk * Math.PI)} y2={65 - 34 * Math.cos(clk * Math.PI)} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
            <circle cx={65} cy={65} r={6} fill={C.white} />
          </svg>
          <div>
            <div style={{fontWeight: 900, fontSize: 30, letterSpacing: '0.08em', color: C.gold}}>12:00 → 12:30</div>
            <div style={{fontWeight: 600, fontSize: 24, color: 'rgba(246,244,239,0.7)', marginTop: 6}}>hora do almoço</div>
          </div>
        </div>
        <div style={{marginTop: 40, fontWeight: 900, fontSize: 64, lineHeight: 1, color: C.white}}>
          TREINO DE
          <br />
          <span style={{color: C.gold}}>30 MIN</span>
        </div>
        <div style={{marginTop: 26, fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, lineHeight: 1.1, color: 'rgba(246,244,239,0.85)'}}>pra quem só tem a hora do almoço</div>
      </div>
    </AbsoluteFill>
  );
};

// ================= PEGAR A ESTRADA =================
const Road: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const HZ = 905;
  const z = interpolate(f, [0, dur], [0.8, 13], {...clamp, easing: Easing.in(Easing.quad)});
  const carY = HZ + (1640 - HZ) / z;
  const carS = 1 / z;
  const pg = m('pegar20', from);
  const tIn = interpolate(f, [pg - 2, pg + 8], [0, 1], ease);
  const push = interpolate(f, [0, dur], [1, 1.05], clamp);
  const sunY = HZ - 40 + interpolate(f, [0, dur], [0, 14], clamp);
  const per = (t: number) => HZ + (1920 - HZ) * Math.pow(t, 2.2);
  const dashes = Array.from({length: 16}).map((_, i) => {
    const t0 = i / 16;
    const t1 = t0 + 0.032;
    const y0 = per(t0);
    const y1 = per(t1);
    const w0 = 2 + 20 * Math.pow(t0, 2.2);
    const w1 = 2 + 20 * Math.pow(t1, 2.2);
    return `M${540 - w0 / 2} ${y0} L${540 + w0 / 2} ${y0} L${540 + w1 / 2} ${y1} L${540 - w1 / 2} ${y1} Z`;
  });
  // postes à direita e árvores à esquerda, em perspectiva
  const poles = Array.from({length: 9}).map((_, i) => {
    const t = Math.pow((i + 1) / 9, 1.8);
    const y = HZ + (1920 - HZ) * t;
    const x = 540 + (34 + 900 * t);
    const h = 30 + 900 * t;
    return {x, y, h, w: 2 + 12 * t};
  });
  const trees = Array.from({length: 7}).map((_, i) => {
    const t = Math.pow((i + 1) / 7, 1.9);
    return {x: 540 - (40 + 820 * t), y: HZ + (1920 - HZ) * t, r: 10 + 230 * t};
  });
  return (
    <AbsoluteFill style={{backgroundColor: '#0E0F22', overflow: 'hidden'}}>
      <AbsoluteFill style={{scale: String(push), transformOrigin: `540px ${HZ}px`}}>
        <AbsoluteFill style={{background: `linear-gradient(180deg, #0E0F22 0%, #2B2346 22%, #6D3E5E 36%, #C9675A 43.5%, #F2A765 46.5%, #FBD99A 47.2%, #FBD99A 47.2%)`}} />
        <div style={{position: 'absolute', left: 540 - 600, top: sunY - 600, width: 1200, height: 1200, borderRadius: 1200, background: 'radial-gradient(circle, rgba(255,226,170,0.55) 0%, rgba(255,170,110,0.22) 30%, rgba(255,140,90,0) 62%)'}} />
        <div style={{position: 'absolute', left: 540 - 95, top: sunY - 95, width: 190, height: 190, borderRadius: 190, background: 'radial-gradient(circle, #FFF6DC 0%, #FFE2A6 55%, #FFC977 100%)', boxShadow: '0 0 90px 30px rgba(255,205,130,0.55)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: HZ - 3, height: 6, background: 'linear-gradient(90deg, rgba(255,230,180,0) 0%, rgba(255,236,200,0.9) 50%, rgba(255,230,180,0) 100%)', filter: 'blur(2px)'}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8A6A62" />
              <stop offset="0.08" stopColor="#4C3E3C" />
              <stop offset="1" stopColor="#1F1B1A" />
            </linearGradient>
            <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5A3E3E" />
              <stop offset="0.12" stopColor="#2A2124" />
              <stop offset="1" stopColor="#120F10" />
            </linearGradient>
          </defs>
          <path d={`M0 ${HZ} L0 812 Q140 770 300 806 Q420 832 540 800 Q720 752 880 798 Q990 828 1080 790 L1080 ${HZ} Z`} fill="#7A4C66" opacity={0.75} />
          <path d={`M0 ${HZ} L0 852 Q220 818 400 858 Q560 890 760 846 Q930 812 1080 852 L1080 ${HZ} Z`} fill="#4A3049" />
          <path d={`M0 ${HZ} L0 884 Q260 870 420 890 Q620 910 840 884 Q960 872 1080 888 L1080 ${HZ} Z`} fill="#2A1D2C" />
          <rect x={0} y={HZ} width={1080} height={1920 - HZ} fill="url(#field)" />
          <path d={`M${540 - 20} ${HZ} L${540 + 20} ${HZ} L1560 1920 L-480 1920 Z`} fill="url(#asphalt)" />
          <path d={`M${540 - 20} ${HZ} L-480 1920`} stroke="#EADBB8" strokeWidth={7} opacity={0.75} />
          <path d={`M${540 + 20} ${HZ} L1560 1920`} stroke="#EADBB8" strokeWidth={7} opacity={0.75} />
          {dashes.map((d, i) => (
            <path key={i} d={d} fill="#F2C14E" opacity={0.92} />
          ))}
          {/* reflexo do pôr do sol no asfalto */}
          <path d={`M${540 - 20} ${HZ} L${540 + 20} ${HZ} L${540 + 180} 1500 L${540 - 180} 1500 Z`} fill="rgba(255,200,130,0.10)" />
          {trees.map((t, i) => (
            <g key={`t${i}`} fill="#0F0C0E">
              <rect x={t.x - t.r * 0.08} y={t.y - t.r * 1.2} width={t.r * 0.16} height={t.r * 1.2} />
              <ellipse cx={t.x} cy={t.y - t.r * 1.5} rx={t.r * 0.62} ry={t.r * 0.9} />
            </g>
          ))}
          {poles.map((p, i) => (
            <g key={`p${i}`} stroke="#0F0C0E" strokeLinecap="round">
              <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - p.h} strokeWidth={p.w} />
              <line x1={p.x - p.h * 0.12} y1={p.y - p.h * 0.92} x2={p.x + p.h * 0.12} y2={p.y - p.h * 0.92} strokeWidth={p.w * 0.7} />
            </g>
          ))}
          <path d={poles.map((p, i) => `${i ? 'L' : 'M'}${p.x - p.h * 0.1} ${p.y - p.h * 0.92}`).join(' ')} stroke="#0F0C0E" strokeWidth={2} fill="none" opacity={0.8} />
        </svg>
        {/* carro antigo, de costas, indo embora */}
        <div style={{position: 'absolute', left: 540, top: carY, translate: '-50% -100%', scale: String(carS), transformOrigin: '50% 100%'}}>
          <svg width={420} height={320} viewBox="0 0 420 320" style={{overflow: 'visible'}}>
            <ellipse cx={210} cy={300} rx={200} ry={16} fill="rgba(0,0,0,0.55)" />
            <rect x={56} y={214} width={58} height={88} rx={14} fill="#0C0C0E" />
            <rect x={306} y={214} width={58} height={88} rx={14} fill="#0C0C0E" />
            <path d="M68 236 L80 120 Q84 70 130 62 L290 62 Q336 70 340 120 L352 236 Z" fill="#141418" />
            <path d="M80 120 Q84 70 130 62 L290 62 Q336 70 340 120" fill="none" stroke="rgba(255,190,120,0.55)" strokeWidth={4} />
            <path d="M110 122 Q114 90 140 88 L280 88 Q306 90 310 122 Z" fill="#3A4652" opacity={0.85} />
            <rect x={46} y={204} width={328} height={48} rx={12} fill="#1B1B20" />
            <circle cx={210} cy={170} r={46} fill="#0B0B0D" stroke="#34343A" strokeWidth={9} />
            <circle cx={88} cy={226} r={42} fill="rgba(255,70,50,0.28)" />
            <circle cx={332} cy={226} r={42} fill="rgba(255,70,50,0.28)" />
            <circle cx={88} cy={226} r={14} fill="#FF5A44" />
            <circle cx={332} cy={226} r={14} fill="#FF5A44" />
          </svg>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: tIn, translate: `0 ${(1 - tIn) * 20}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: '0.18em', color: C.white, textShadow: SHADOW, paddingLeft: '0.18em'}}>PEGAR A</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 220, lineHeight: 0.95, color: C.gold, textShadow: '0 6px 40px rgba(0,0,0,0.45)'}}>estrada</div>
      </div>
      <Film o={0.1} vignette={0.5} />
    </AbsoluteFill>
  );
};

const VinhetaScene: React.FC<SP> = () => <Vinheta episode="EP. 02 — MICHELIN" />;

export const SCENES: Record<string, React.FC<SP>> = {
  cover: Cover,
  hookStar: HookStar,
  hookFactory: HookFactory,
  factory: Factory,
  guide: Guide,
  calcoFull: CalcoFull,
  calcoPanel: CalcoPanel,
  evol1920: Evol1920,
  stars1926: Stars1926,
  scale1931: Scale1931,
  counter30: Counter30,
  mapTrip: MapTrip,
  arrival: Arrival,
  tire: Tire,
  adCards: AdCards,
  road: Road,
  vinheta: VinhetaScene,
};

export {starPath};
