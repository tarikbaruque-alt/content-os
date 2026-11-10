import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CURTA, GfxName, MK} from '../timeline';
import {C, clamp, SANS, SERIF} from '../theme';

// Grafismos do painel de cima (1080×860). Conteúdo entre y 160 e y 720: em cima fica a interface do Instagram,
// embaixo a legenda (na divisão da tela).

const useG = (seqFrom: number) => useCurrentFrame() + seqFrom; // frame global
const ease = (g: number, a: number, len = 10) => interpolate(g, [a, a + len], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const useSpring = (g: number, at: number, damping = 16) => {
  const {fps} = useVideoConfig();
  return spring({frame: g - at, fps, config: {damping, stiffness: 170, mass: 0.7}});
};

const PanelBg: React.FC<{kicker: string; g: number; at: number}> = ({kicker, g, at}) => (
  <AbsoluteFill style={{backgroundColor: C.panel}}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        opacity: 0.55,
      }}
    />
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(255,199,44,0.13) 0%, rgba(255,199,44,0) 55%)'}} />
    <div
      style={{
        position: 'absolute',
        left: 70,
        top: 170,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: 4,
        color: C.gold,
        opacity: ease(g, at, 8),
        translate: `${(1 - ease(g, at, 8)) * -20}px 0`,
      }}
    >
      <div style={{width: 34, height: 3, backgroundColor: C.gold}} />
      {kicker}
    </div>
  </AbsoluteFill>
);

// ---------- Nuvem que vira rosto (pareidolia) ----------
const Cloud: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const pop = useSpring(g, MK.nuvem - 4, 12);
  const face = ease(g, MK.rosto, 12);
  const drift = Math.sin((g - s0) / 25) * 8;
  return (
    <AbsoluteFill>
      <PanelBg kicker="O CÉREBRO E OS PADRÕES" g={g} at={s0} />
      <svg width={1080} height={860} viewBox="0 0 1080 860" style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${540 + drift} 470) scale(${0.85 + 0.15 * pop})`} opacity={0.35 + 0.65 * pop}>
          {[
            [-170, 30, 95],
            [-80, -40, 120],
            [40, -70, 135],
            [160, -10, 110],
            [230, 50, 80],
            [-240, 70, 70],
            [0, 50, 120],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={C.white} />
          ))}
          {/* rosto que o cérebro "encontra" */}
          <ellipse cx={-60} cy={-20} rx={16} ry={24} fill={C.bg} opacity={face} />
          <ellipse cx={70} cy={-20} rx={16} ry={24} fill={C.bg} opacity={face} />
          <path d="M -80 50 Q 5 120 90 50" stroke={C.bg} strokeWidth={14} strokeLinecap="round" fill="none" style={{strokeDasharray: 220, strokeDashoffset: 220 * (1 - face)}} />
        </g>
        <circle cx={540 + drift} cy={455} r={215 + 35 * face} stroke={C.gold} strokeWidth={4} fill="none" opacity={face * (1 - ease(g, MK.rosto + 8, 16)) * 0.9} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Verbete: pareidolia ----------
const Dict: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const w = ease(g, MK.pareidolia, 12);
  const def = ease(g, MK.pareidolia + 10, 12);
  return (
    <AbsoluteFill>
      <PanelBg kicker="TEM NOME" g={g} at={s0} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 270, fontFamily: SANS, color: C.white}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, lineHeight: 1, letterSpacing: -2, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)`}}>pareidolia</div>
        <div style={{marginTop: 18, fontWeight: 600, fontSize: 30, color: C.gray, letterSpacing: 2, opacity: w}}>pa·rei·do·li·a · substantivo feminino</div>
        <div style={{marginTop: 26, width: 160 * def, height: 4, backgroundColor: C.gold}} />
        <div style={{marginTop: 26, fontWeight: 500, fontSize: 40, lineHeight: 1.3, maxWidth: 900, opacity: def, translate: `0 ${(1 - def) * 14}px`}}>
          Quando o cérebro enxerga padrões familiares, como <span style={{color: C.gold, fontWeight: 700}}>rostos</span>, em formas aleatórias.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Curvas → vendas ----------
const ARCH = 'M 0 230 C 0 40, 150 40, 150 150 C 150 40, 300 40, 300 230';
const Curvas: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const arch = ease(g, s0 + 2, 16);
  const arrow = ease(g, MK.transformar11, 12);
  const bars = [0.35, 0.55, 0.78, 1];
  return (
    <AbsoluteFill>
      <PanelBg kicker="A SACADA DE VERDADE" g={g} at={s0} />
      <svg width={1080} height={860} viewBox="0 0 1080 860" style={{position: 'absolute', inset: 0}}>
        <g transform="translate(110 260)">
          <path d={ARCH} stroke={C.gold} strokeWidth={26} strokeLinecap="round" fill="none" style={{strokeDasharray: 820, strokeDashoffset: 820 * (1 - arch)}} />
        </g>
        <path d={`M 470 380 H ${470 + 150 * arrow}`} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
        {arrow > 0.9 ? <path d="M 600 358 L 624 380 L 600 402" stroke={C.white} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
        {bars.map((h, i) => {
          const p = ease(g, MK.vendas11 - 6 + i * 3, 10);
          const H = 260 * h * p;
          return <rect key={i} x={690 + i * 72} y={500 - H} width={52} height={H} rx={8} fill={i === 3 ? C.gold : 'rgba(255,199,44,0.45)'} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 110, top: 540, width: 300, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: C.white, opacity: arch}}>CURVAS</div>
      <div style={{position: 'absolute', left: 680, top: 540, width: 290, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: C.gold, opacity: ease(g, MK.vendas11, 8)}}>VENDAS</div>
    </AbsoluteFill>
  );
};

// ---------- Golden Zone: a oferta dura o tempo da curva ----------
const trackPt = (t: number) => {
  const x = 100 + 880 * t;
  const hump = t > 0.32 && t < 0.68 ? Math.sin((Math.PI * (t - 0.32)) / 0.36) : 0;
  const y = 520 + Math.sin(t * Math.PI * 2) * 18 - 190 * hump;
  return [x, y];
};
const trackPath = (a: number, b: number) => {
  const pts = [];
  for (let i = 0; i <= 120; i++) pts.push(trackPt(a + ((b - a) * i) / 120));
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
};
const Z0 = 0.32;
const Z1 = 0.68;
const Timer: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  // fases: aproxima → atravessa a zona (oferta ativa) → sai (perdeu) → volta 2 (nova chance)
  const lap2 = g >= MK.proxima15;
  let t: number;
  if (!lap2) {
    t = interpolate(g, [s0, MK.oferta14, MK.trecho14 + 12, MK.perdeu15], [0.08, Z0, Z1, 0.92], {...clamp, easing: Easing.inOut(Easing.sin)});
  } else {
    t = interpolate(g, [MK.proxima15, MK.chance15], [0.12, Z0 + 0.02], {...clamp, easing: Easing.out(Easing.cubic)});
  }
  const inZone = t >= Z0 && t <= Z1;
  const bar = !lap2 ? (t < Z0 ? 1 : Math.max(0, 1 - (t - Z0) / (Z1 - Z0))) : 1;
  const lost = !lap2 && g >= MK.perdeu15;
  const chance = lap2 && g >= MK.chance15;
  const [cx, cy] = trackPt(t);
  const pulse = 1 + 0.15 * Math.sin(g / 3) * (inZone ? 1 : 0);
  return (
    <AbsoluteFill>
      <PanelBg kicker="A MECÂNICA" g={g} at={s0} />
      <svg width={1080} height={860} viewBox="0 0 1080 860" style={{position: 'absolute', inset: 0}}>
        <path d={trackPath(0, 1)} stroke="#2B2B31" strokeWidth={40} strokeLinecap="round" fill="none" />
        <path d={trackPath(0, 1)} stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="14 16" fill="none" />
        <path d={trackPath(Z0, Z1)} stroke={C.gold} strokeWidth={40} strokeLinecap="round" fill="none" opacity={0.9} />
        <circle cx={cx} cy={cy} r={22 * pulse} fill={C.white} stroke={inZone ? C.gold : C.gray} strokeWidth={7} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 245, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: C.gold}}>GOLDEN ZONE</div>
      {lap2 ? <div style={{position: 'absolute', right: 70, top: 166, fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: C.white}}>VOLTA 2</div> : null}
      <div style={{position: 'absolute', left: 140, right: 140, top: 625, fontFamily: SANS}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 26, letterSpacing: 3, color: lost ? C.red : C.white, marginBottom: 12}}>
          <span>{lost ? 'OFERTA ENCERRADA' : chance ? 'NOVA CHANCE' : 'OFERTA ATIVA'}</span>
          <span style={{color: lost ? C.red : C.gold}}>{lost ? 'PERDEU' : `${Math.round(bar * 100)}%`}</span>
        </div>
        <div style={{height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
          <div style={{width: `${bar * 100}%`, height: '100%', borderRadius: 9, backgroundColor: lost ? C.red : C.gold}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Espectador → participante ----------
const Eye: React.FC<{c: string}> = ({c}) => (
  <svg width={84} height={84} viewBox="0 0 48 48" fill="none">
    <path d="M4 24 C 10 13, 38 13, 44 24 C 38 35, 10 35, 4 24 Z" stroke={c} strokeWidth={3.5} strokeLinejoin="round" />
    <circle cx={24} cy={24} r={6.5} fill={c} />
  </svg>
);
const Tap: React.FC<{c: string}> = ({c}) => (
  <svg width={84} height={84} viewBox="0 0 48 48" fill="none">
    <path d="M19 26 V11 a3.5 3.5 0 0 1 7 0 V24 M26 22 a3.5 3.5 0 0 1 7 0 v4 M33 24 a3.5 3.5 0 0 1 6 2 v6 c0 7 -5 12 -12 12 h-2 c-5 0 -8 -3 -11 -7 l-5 -8 a3 3 0 0 1 5 -3 l4 4" stroke={c} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 8 l-3 -3 M30 8 l3 -3 M22 4 V1" stroke={c} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
const Espectador: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const a = ease(g, MK.espectador16 - 4, 10);
  const strike = ease(g, MK.participante16 - 6, 8);
  const b = useSpring(g, MK.participante16 - 2, 14);
  return (
    <AbsoluteFill>
      <PanelBg kicker="A VIRADA" g={g} at={s0} />
      <div style={{position: 'absolute', left: 120, top: 270, display: 'flex', alignItems: 'center', gap: 30, opacity: 0.3 + 0.7 * a}}>
        <Eye c={strike > 0 ? C.gray : C.white} />
        <div style={{position: 'relative', fontFamily: SANS, fontWeight: 900, fontSize: 86, letterSpacing: -2, color: strike > 0 ? C.gray : C.white}}>
          ESPECTADOR
          <div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 8, borderRadius: 4, backgroundColor: C.red, transformOrigin: 'left', scale: `${strike} 1`}} />
        </div>
      </div>
      <svg width={60} height={90} viewBox="0 0 60 90" style={{position: 'absolute', left: 150, top: 400, opacity: b}}>
        <path d="M30 4 V78 M14 62 L30 80 L46 62" stroke={C.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <div style={{position: 'absolute', left: 120, top: 510, display: 'flex', alignItems: 'center', gap: 30, opacity: b, scale: String(0.85 + 0.15 * b), transformOrigin: 'left center'}}>
        <Tap c={C.gold} />
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 86, letterSpacing: -2, color: C.gold}}>PARTICIPANTE</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3 ações ----------
const Steps: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const rows = [
    {at: MK.acompanhar17, t: 'Acompanhar a corrida'},
    {at: MK.abrir17, t: 'Abrir o aplicativo'},
    {at: MK.agir17, t: 'Agir rápido'},
  ];
  return (
    <AbsoluteFill>
      <PanelBg kicker="O FÃ PRECISAVA" g={g} at={s0} />
      {rows.map((r, i) => {
        const p = ease(g, r.at - 3, 9);
        const last = i === 2;
        return (
          <div key={r.t} style={{position: 'absolute', left: 90, top: 270 + i * 150, display: 'flex', alignItems: 'center', gap: 32, opacity: p, translate: `${(1 - p) * -40}px 0`}}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                border: `4px solid ${C.gold}`,
                backgroundColor: last ? C.gold : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 44,
                color: last ? C.bg : C.gold,
              }}
            >
              {i + 1}
            </div>
            <div style={{fontFamily: last ? SERIF : SANS, fontStyle: last ? 'italic' : 'normal', fontWeight: last ? 400 : 800, fontSize: last ? 96 : 62, letterSpacing: last ? -1 : -1.5, color: last ? C.gold : C.white}}>{r.t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Atenção · urgência · recompensa ----------
const Triad: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const nodes = [
    {at: MK.atencao18, x: 540, y: 390, t: 'Atenção'},
    {at: MK.urgencia18, x: 290, y: 610, t: 'Urgência'},
    {at: MK.recompensa18, x: 790, y: 610, t: 'Recompensa'},
  ];
  const p = nodes.map((n) => ease(g, n.at - 3, 9));
  const edge = (i: number, j: number, k: number) => {
    const a = nodes[i];
    const b = nodes[j];
    const e = k;
    return <path d={`M ${a.x} ${a.y} L ${a.x + (b.x - a.x) * e} ${a.y + (b.y - a.y) * e}`} stroke="rgba(255,199,44,0.55)" strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />;
  };
  return (
    <AbsoluteFill>
      <PanelBg kicker="O QUE A ESTRATÉGIA GERAVA" g={g} at={s0} />
      <svg width={1080} height={860} viewBox="0 0 1080 860" style={{position: 'absolute', inset: 0}}>
        {edge(0, 1, ease(g, nodes[1].at, 10))}
        {edge(1, 2, ease(g, nodes[2].at, 10))}
        {edge(2, 0, ease(g, nodes[2].at + 6, 10))}
        {nodes.map((n, i) => (
          <circle key={n.t} cx={n.x} cy={n.y} r={20 + 8 * p[i]} fill={C.gold} opacity={p[i]} />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <div
          key={n.t}
          style={{
            position: 'absolute',
            left: n.x - 250,
            width: 500,
            top: i === 0 ? n.y - 125 : n.y + 34,
            textAlign: 'center',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: 84,
            color: C.white,
            opacity: p[i],
            translate: `0 ${(1 - p[i]) * 16}px`,
          }}
        >
          {n.t}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ---------- Resultados (dados divulgados pela agência) ----------
const fmt = (v: number, dec: number) => v.toFixed(dec).replace('.', ',');
const ResultsCurta: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const hero = useSpring(g, MK.p7 - 4, 14);
  const c = interpolate(g, [MK.p7 - 4, MK.p7 + 12], [0, 7], {...clamp, easing: Easing.out(Easing.cubic)});
  const small = [
    {at: MK.segundo19, v: '2,3 mi', label: 'usuários ativos nas corridas'},
    {at: MK.segundo19 + 8, v: '2,7 mi', label: 'downloads do app no mês'},
  ];
  return (
    <AbsoluteFill>
      <PanelBg kicker="O RESULTADO · SEGUNDO A AGÊNCIA" g={g} at={s0} />
      {/* "Deu certo." ocupa o painel até os números entrarem */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 300,
          textAlign: 'center',
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 170,
          color: C.white,
          opacity: ease(g, s0 + 2, 8) * (1 - ease(g, MK.segundo19 - 6, 6)),
          scale: String(0.94 + 0.06 * ease(g, s0 + 2, 12)),
        }}
      >
        Deu <span style={{color: C.gold}}>certo.</span>
      </div>
      <div style={{position: 'absolute', left: 90, top: 230, display: 'flex', alignItems: 'baseline', gap: 30, opacity: hero, scale: String(0.85 + 0.15 * hero), transformOrigin: 'left center'}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 210, letterSpacing: -8, lineHeight: 1, color: C.gold, fontVariantNumeric: 'tabular-nums', width: 470}}>+{Math.round(c)}%</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 46, lineHeight: 1.1, color: C.white}}>
          em vendas
          <br />
          digitais
        </div>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, top: 520, display: 'flex', gap: 40}}>
        {small.map((x) => {
          const p = ease(g, x.at - 2, 8);
          return (
            <div key={x.v} style={{flex: 1, borderTop: `2px solid ${C.line}`, paddingTop: 18, opacity: p, translate: `0 ${(1 - p) * 14}px`}}>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 76, letterSpacing: -3, lineHeight: 1, color: C.gold}}>{x.v}</div>
              <div style={{marginTop: 8, fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.white}}>{x.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Results: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  if (CURTA) return <ResultsCurta g={g} s0={s0} />;
  const stats = [
    {at: MK.p7, v: 7, dec: 0, pre: '+', suf: '%', label: 'em vendas digitais'},
    {at: MK.p23, v: 2.3, dec: 1, pre: '', suf: ' mi', label: 'usuários ativos nas corridas'},
    {at: MK.p27, v: 2.7, dec: 1, pre: '', suf: ' mi', label: 'downloads do app no mês'},
  ];
  return (
    <AbsoluteFill>
      <PanelBg kicker="O RESULTADO · SEGUNDO A AGÊNCIA" g={g} at={s0} />
      {stats.map((s, i) => {
        const p = ease(g, s.at - 4, 8);
        const c = interpolate(g, [s.at - 4, s.at + 14], [0, s.v], {...clamp, easing: Easing.out(Easing.cubic)});
        return (
          <div key={s.label} style={{position: 'absolute', left: 90, top: 250 + i * 150, display: 'flex', alignItems: 'baseline', gap: 26, opacity: p, translate: `0 ${(1 - p) * 20}px`}}>
            <div style={{width: 400, whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 900, fontSize: 108, letterSpacing: -4, lineHeight: 1, color: C.gold, fontVariantNumeric: 'tabular-nums'}}>
              {s.pre}
              {fmt(c, s.dec)}
              {s.suf}
            </div>
            <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.white, whiteSpace: 'nowrap'}}>{s.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- A lição ----------
const Lesson: React.FC<{g: number; s0: number}> = ({g, s0}) => {
  const l1 = ease(g, s0, 10);
  const strike = ease(g, MK.marketingE20 - 6, 8);
  const l2 = ease(g, MK.marketingE20, 10);
  const l3 = useSpring(g, MK.atencao20 - 2, 15);
  const ar = ease(g, MK.acao20 - 6, 8);
  const l4 = useSpring(g, MK.acao20 - 2, 13);
  return (
    <AbsoluteFill>
      <PanelBg kicker="A LIÇÃO" g={g} at={s0} />
      <div style={{position: 'absolute', left: 80, right: 80, top: 245, fontFamily: SANS, color: C.white}}>
        <div style={{fontWeight: 800, fontSize: 58, letterSpacing: -1.5, opacity: l1 * (1 - 0.55 * strike)}}>
          Marketing não é só{' '}
          <span style={{position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 74}}>
            aparecer.
            <span style={{position: 'absolute', left: -4, right: -4, top: '55%', height: 6, borderRadius: 3, backgroundColor: C.red, transformOrigin: 'left', scale: `${strike} 1`}} />
          </span>
        </div>
        <div style={{marginTop: 22, fontWeight: 600, fontSize: 44, lineHeight: 1.25, color: C.white, opacity: l2, translate: `0 ${(1 - l2) * 14}px`}}>
          É encontrar oportunidades onde <span style={{color: C.gold}}>ninguém está enxergando</span>
        </div>
        <div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 30}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, lineHeight: 1, opacity: l3, scale: String(0.85 + 0.15 * l3), transformOrigin: 'left center'}}>Atenção</div>
          <svg width={140} height={50} viewBox="0 0 140 50" style={{opacity: ar > 0 ? 1 : 0}}>
            <path d={`M 4 25 H ${4 + 118 * ar}`} stroke={C.gold} strokeWidth={7} strokeLinecap="round" />
            {ar > 0.9 ? <path d="M 108 9 L 128 25 L 108 41" stroke={C.gold} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
          </svg>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, lineHeight: 1, color: C.gold, opacity: l4, scale: String(0.8 + 0.2 * l4), transformOrigin: 'left center'}}>Ação</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Graphic: React.FC<{name: GfxName; seqFrom: number}> = ({name, seqFrom}) => {
  const g = useG(seqFrom);
  const s0 = seqFrom + 3;
  switch (name) {
    case 'cloud':
      return <Cloud g={g} s0={s0} />;
    case 'dict':
      return <Dict g={g} s0={s0} />;
    case 'curvas':
      return <Curvas g={g} s0={s0} />;
    case 'timer':
      return <Timer g={g} s0={s0} />;
    case 'espectador':
      return <Espectador g={g} s0={s0} />;
    case 'steps':
      return <Steps g={g} s0={s0} />;
    case 'triad':
      return <Triad g={g} s0={s0} />;
    case 'results':
      return <Results g={g} s0={s0} />;
    case 'lesson':
      return <Lesson g={g} s0={s0} />;
  }
};
