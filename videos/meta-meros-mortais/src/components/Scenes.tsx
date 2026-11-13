import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import Q from '../data/citacoes.json';
import {MK, PAGES} from '../timeline';
import {C, clamp, GRAD, SANS, SERIF} from '../theme';
import {Avatar, Bg, Chip, Clock, ease, easeIO, fadeOut, Grain, Icon, ICON, Kicker, MetaLogo, pop, QuoteCard, ramp, Source, Verified} from './Kit';

type SceneProps = {from: number; dur: number; vh: number};
type SceneFC = React.FC<SceneProps>;

// pseudo-aleatório determinístico
const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- câmera sobre foto (coordenadas da imagem original) ----------
type CamKey = {f: number; z: number; cx: number; cy: number};
const camAt = (f: number, keys: CamKey[]) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const p = interpolate(f, [a.f, b.f], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
      return {f, z: a.z + (b.z - a.z) * p, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p};
    }
  }
  return keys[keys.length - 1];
};
const PhotoCam: React.FC<{src: string; iw: number; ih: number; vw?: number; vh: number; keys: CamKey[]; f: number; filter?: string; children?: React.ReactNode}> = ({
  src,
  iw,
  ih,
  vw = 1080,
  vh,
  keys,
  f,
  filter,
  children,
}) => {
  const {z, cx, cy} = camAt(f, keys);
  const S = Math.max(vw / iw, vh / ih) * z;
  const x = Math.min(0, Math.max(vw - iw * S, vw / 2 - cx * S));
  const y = Math.min(0, Math.max(vh - ih * S, vh / 2 - cy * S));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: iw, height: ih, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${S})`}}>
        <Img src={staticFile(src)} style={{position: 'absolute', width: iw, height: ih, filter}} />
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ======================================================================
// 1 · "a Meta acabou de me dar esperança" — manchete oficial entra suave
// ======================================================================
const Headline: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 1, 16);
  const shine = interpolate(f, [10, 34], [-0.3, 1.3], clamp);
  const st = g >= MK.esperanca1 - 3 ? pop(g, MK.esperanca1 - 3, 11) : 0;
  const W = 960;
  const imgW = W - 80;
  return (
    <Bg>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 250,
          width: W,
          opacity: a,
          transform: `translateY(${(1 - a) * 60}px) perspective(1400px) rotateX(${(1 - a) * 10}deg)`,
          background: C.paper,
          borderRadius: 30,
          padding: '30px 40px 26px',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18}}>
          <MetaLogo h={40} variant="cor" />
          <div style={{width: 2, height: 32, background: 'rgba(11,18,32,0.15)'}} />
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, color: 'rgba(11,18,32,0.6)'}}>Newsroom</div>
        </div>
        <Img src={staticFile('img/art_titulo.png')} style={{width: imgW, height: (imgW * 819) / 2854, display: 'block'}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(105deg, transparent ${shine * 100 - 12}%, rgba(255,255,255,0.75) ${shine * 100}%, transparent ${shine * 100 + 12}%)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center'}}>
        <div style={{scale: String(st), rotate: '-2deg', opacity: Math.min(1, st * 1.4)}}>
          <Chip tone="blue" style={{fontSize: 46, padding: '18px 34px 16px', letterSpacing: '0.03em', fontWeight: 900}}>
            A Meta deu esperança
          </Chip>
        </div>
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 2 · página oficial em tela cheia, zoom suave na manchete e na data
// ======================================================================
const Article: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const P = (Q as unknown as {art_pagina: {w: number; h: number; rows: number[][]}}).art_pagina;
  const W = 1000;
  const s = W / P.w;
  const H = P.h * s;
  const top = 470;
  const a = ramp(f, 0, 14);
  const z = interpolate(f, [8, 90], [1, 1.07], {...clamp, easing: Easing.inOut(Easing.sin)});
  const [l1, l2, dt] = [P.rows[3], P.rows[4], P.rows[5]];
  const focusY = top + ((l1[1] + l2[3]) / 2) * s;
  const hl = (row: number[], at: number, len: number) => {
    const p = interpolate(g, [at, at + len], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
    return (
      <div
        style={{position: 'absolute', left: (row[0] - 14) * s, top: (row[1] + 26) * s, width: (row[2] - row[0] + 28) * s * p, height: (row[3] - row[1] - 20) * s, background: 'rgba(76,155,255,0.32)', mixBlendMode: 'multiply', borderRadius: 6}}
      />
    );
  };
  const ring = interpolate(g, [MK.todas2 - 4, MK.todas2 + 12], [0, 1], easeIO);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 385, display: 'flex', justifyContent: 'center', opacity: a}}>
        <Kicker>Comunicado oficial da Meta</Kicker>
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `540px ${focusY}px`, scale: String(z)}}>
        <div
          style={{
            position: 'absolute',
            left: (1080 - W) / 2,
            top: top + (1 - a) * 40,
            width: W,
            height: H,
            opacity: a,
            borderRadius: 26,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          }}
        >
          <Img src={staticFile('img/art_pagina.png')} style={{width: W, height: H}} />
          {hl(l1, MK.comunicado2 - 4, 16)}
          {hl(l2, MK.comunicado2 + 12, 12)}
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <ellipse
              cx={((dt[0] + dt[2]) / 2) * s + 6}
              cy={((dt[1] + dt[3]) / 2) * s}
              rx={((dt[2] - dt[0]) / 2) * s + 14}
              ry={((dt[3] - dt[1]) / 2) * s + 16}
              fill="none"
              stroke={C.goldDeep}
              strokeWidth={4}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - ring}
              strokeLinecap="round"
              transform={`rotate(-4 ${((dt[0] + dt[2]) / 2) * s} ${((dt[1] + dt[3]) / 2) * s})`}
            />
          </svg>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: top + H * 1.07 + 50, display: 'flex', justifyContent: 'center'}}>
        <Source o={a} />
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 3 · conta pequena × conta grande: SEGUIDORES ≠ ALCANCE
// ======================================================================
const Compare: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 12);
  const L = {x: 300, y: 540};
  const R = {x: 790, y: 540};
  const reach = interpolate(g, [MK.alcancar3 - 2, MK.mais3 + 26], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const bigDim = interpolate(g, [MK.muito3 - 6, MK.maior3 + 6], [0, 1], easeIO);
  const t = g >= MK.mais3 - 2 ? pop(g, MK.mais3 - 2, 14) : 0;
  // seguidores (pontinhos) de cada conta
  const smallF = Array.from({length: 7}, (_, i) => {
    const ang = (i / 7) * Math.PI * 2 + 0.4;
    return {x: L.x + Math.cos(ang) * 112, y: L.y + Math.sin(ang) * 112};
  });
  const bigF = Array.from({length: 44}, (_, i) => {
    const ring = i % 2;
    const ang = (i / 44) * Math.PI * 2;
    const r = 152 + ring * 34;
    return {x: R.x + Math.cos(ang) * r, y: R.y + Math.sin(ang) * r * 0.92, lit: rnd(i, 3) > 0.84};
  });
  // pessoas alcançadas pela conta pequena (espalhadas pela tela)
  const reached = Array.from({length: 34}, (_, i) => {
    const x = 60 + rnd(i, 1) * 960;
    const y = 300 + rnd(i, 2) * 520;
    const d = Math.hypot(x - L.x, y - L.y);
    return {x, y, d};
  }).filter((p) => Math.hypot(p.x - R.x, p.y - R.y) > 230 && p.d > 150);
  const maxD = 900;
  return (
    <Bg>
      {/* ondas de alcance */}
      <svg width={1080} height={1010} style={{position: 'absolute', left: 0, top: 0}}>
        {[0, 1, 2].map((k) => {
          const p = interpolate(g, [MK.alcancar3 + k * 9, MK.alcancar3 + k * 9 + 40], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          if (p <= 0 || p >= 1) return null;
          return <circle key={k} cx={L.x} cy={L.y} r={90 + p * 760} fill="none" stroke={C.gold} strokeWidth={3} opacity={(1 - p) * 0.7} />;
        })}
      </svg>
      {reached.map((p, i) => {
        const on = reach * maxD > p.d;
        const k = on ? interpolate(reach * maxD - p.d, [0, 60], [0, 1], clamp) : 0;
        return (
          <div key={i} style={{position: 'absolute', left: p.x - 15, top: p.y - 15, width: 30, height: 30, borderRadius: 30, background: C.gold, opacity: k * 0.95, scale: String(0.5 + k * 0.5), boxShadow: `0 0 16px ${C.gold}`}} />
        );
      })}
      {smallF.map((p, i) => (
        <div key={`s${i}`} style={{position: 'absolute', left: p.x - 13, top: p.y - 13, width: 26, height: 26, borderRadius: 26, background: C.gold, opacity: a}} />
      ))}
      {bigF.map((p, i) => {
        const lit = p.lit || bigDim < 0.5;
        return (
          <div
            key={`b${i}`}
            style={{position: 'absolute', left: p.x - 12, top: p.y - 12, width: 24, height: 24, borderRadius: 24, background: lit ? C.purple : '#3A4256', opacity: a * (lit ? 1 : 0.85)}}
          />
        );
      })}
      <div style={{position: 'absolute', left: L.x - 75, top: L.y - 75, opacity: a, scale: String(0.8 + a * 0.2)}}>
        <Avatar size={150} hue={210} ring={C.gold} ringW={5} />
      </div>
      <div style={{position: 'absolute', left: R.x - 115, top: R.y - 115, opacity: a, scale: String(0.8 + a * 0.2)}}>
        <Avatar size={230} hue={265} ring={C.purple} ringW={6} />
      </div>
      {[
        {x: L.x, t: 'Poucos seguidores'},
        {x: R.x, t: 'Muitos seguidores'},
      ].map((l, i) => (
        <div key={i} style={{position: 'absolute', left: l.x - 250, width: 500, top: i === 0 ? 690 : 770, textAlign: 'center', opacity: a, fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)'}}>
          {l.t}
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, scale: String(t), opacity: Math.min(1, t * 1.3)}}>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 70, color: C.white, letterSpacing: '-0.01em'}}>SEGUIDORES</span>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 84, color: C.gold}}>≠</span>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 70, letterSpacing: '-0.01em', background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>ALCANCE</span>
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 4 · a ironia do contador: zoom, contador cresce, desfoca, ALCANCE em primeiro plano
// ======================================================================
const Ironia: SceneFC = ({from, vh}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const l = (m: number) => m - from;
  const keys: CamKey[] = [
    {f: 0, z: 1.0, cx: 1000, cy: 700},
    {f: l(MK.coloca5) - 2, z: 1.08, cx: 1040, cy: 710},
    {f: l(MK.numero5) + 10, z: 2.15, cx: 1085, cy: 724},
    {f: l(MK.nao5), z: 2.3, cx: 1085, cy: 724},
    {f: l(MK.post5) + 40, z: 2.0, cx: 1085, cy: 724},
  ];
  const grow = interpolate(g, [MK.destaque5 - 4, MK.destaque5 + 14], [1, 1.32], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const glow = interpolate(g, [MK.destaque5 - 4, MK.destaque5 + 6], [0, 1], clamp);
  const blur = interpolate(g, [MK.nao5 - 2, MK.nao5 + 14], [0, 16], easeIO);
  const dark = interpolate(g, [MK.nao5 - 2, MK.nao5 + 14], [1, 0.42], easeIO);
  const shrink = interpolate(g, [MK.nao5, MK.nao5 + 14], [1, 0.86], easeIO);
  const al = g >= MK.determina5 - 6 ? pop(g, MK.determina5 - 6, 15) : 0;
  const path = interpolate(g, [MK.ate5 - 2, MK.post5 + 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const P0 = {x: 120, y: 760};
  const P1 = {x: 520, y: 520};
  const P2 = {x: 1000, y: 650};
  const bez = (t: number) => ({
    x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
    y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
  });
  const tip = bez(path);
  const CX = 980;
  const CY = 652;
  const CW = 214;
  const CH = 136;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <AbsoluteFill style={{filter: `blur(${blur}px) brightness(${dark})`}}>
        <PhotoCam src="img/perfil_instagram.jpg" iw={2000} ih={1332} vh={vh} keys={keys} f={f} filter="contrast(1.05) saturate(1.05)">
          {/* o número de seguidores "cresce" discretamente na composição */}
          <div
            style={{
              position: 'absolute',
              left: CX,
              top: CY,
              width: CW,
              height: CH,
              overflow: 'hidden',
              borderRadius: 14,
              scale: String(grow * (g >= MK.nao5 ? shrink : 1)),
              boxShadow: `0 0 0 ${3 * glow}px ${C.gold}, 0 0 ${40 * glow}px rgba(76,155,255,${0.7 * glow})`,
              opacity: glow,
            }}
          >
            <Img src={staticFile('img/perfil_instagram.jpg')} style={{position: 'absolute', left: -CX, top: -CY, width: 2000, height: 1332, filter: 'contrast(1.1) brightness(1.15)'}} />
          </div>
        </PhotoCam>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(6,10,21,0.65) 100%)'}} />
      {/* ALCANCE em primeiro plano */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', scale: String(0.85 + al * 0.15), opacity: Math.min(1, al * 1.3)}}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 168,
            letterSpacing: `${0.01 + al * 0.03}em`,
            background: `linear-gradient(100deg, #fff 10%, #9CC8FF 55%, ${C.purple} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))',
          }}
        >
          ALCANCE
        </div>
      </div>
      {/* até onde seu post vai */}
      {path > 0 ? (
        <>
          <svg width={1080} height={1010} style={{position: 'absolute', left: 0, top: 0}}>
            <path
              d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={5}
              strokeDasharray="2 18"
              strokeLinecap="round"
              pathLength={1000}
              style={{strokeDashoffset: 0}}
              mask="url(#reveal)"
            />
            <defs>
              <mask id="reveal" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1010}>
                <path d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`} fill="none" stroke="white" strokeWidth={30} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - path} />
              </mask>
            </defs>
          </svg>
          <div style={{position: 'absolute', left: tip.x - 44, top: tip.y - 44, width: 88, height: 88, borderRadius: 20, background: GRAD, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon d={ICON.heart} size={46} color="#fff" fill="#fff" w={2} />
          </div>
        </>
      ) : null}
      <Grain />
    </AbsoluteFill>
  );
};

// ======================================================================
// 5 · "o que importa é como as pessoas reagem" — trecho oficial grifado
// ======================================================================
const Sinais: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const a = ramp(f, 2, 14);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 40, top: 262 + (1 - a) * 40, opacity: a}}>
        <QuoteCard name="q_sinais" width={1000} f={f + from} hl={[{from: 11, to: 17, at: MK.saber6 - 4, len: MK.reagir6 + 8 - MK.saber6}]} />
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 6 · os 4 sinais ao redor do Reel → conteúdo chegando a mais pessoas
// ======================================================================
const Reel: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 12);
  const B = MK.take['8'];
  const toB = interpolate(g, [B - 6, B + 14], [0, 1], easeIO);
  const phoneS = 1 - toB * 0.36;
  const items = [
    {at: MK.tempo7, label: 'Tempo assistido', x: 215, y: 345, icon: 'clock'},
    {at: MK.curtem7, label: 'Curtidas', x: 865, y: 345, icon: 'heart'},
    {at: MK.comentam7, label: 'Comentários', x: 215, y: 625, icon: 'comment'},
    {at: MK.compartilham7, label: 'Compartilhamentos', x: 865, y: 625, icon: 'send'},
  ];
  const watch = interpolate(g, [MK.tempo7, B], [0.05, 0.92], clamp);
  // alcance: anéis de pessoas
  const rings = [
    {at: MK.interesse8, n: 6, r: 205},
    {at: MK.desperta8, n: 10, r: 330},
    {at: MK.maior8, n: 14, r: 455},
  ];
  const al = g >= MK.alcance8 - 3 ? pop(g, MK.alcance8 - 3, 13) : 0;
  const kick = fadeOut(g, B - 8, 10);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', opacity: a * kick}}>
        <Kicker>Sinais citados pela Meta</Kicker>
      </div>
      {/* linhas e pessoas do alcance */}
      <svg width={1080} height={1010} style={{position: 'absolute', left: 0, top: 0}}>
        {rings.map((rg, k) =>
          Array.from({length: rg.n}, (_, i) => {
            const ang = (i / rg.n) * Math.PI * 2 + k * 0.3;
            const x = 540 + Math.cos(ang) * rg.r;
            const y = 530 + Math.sin(ang) * rg.r * 0.56;
            const p = interpolate(g, [rg.at + i * 1.2, rg.at + i * 1.2 + 12], [0, 1], ease);
            if (p <= 0) return null;
            return <line key={`${k}-${i}`} x1={540} y1={530} x2={540 + (x - 540) * p} y2={530 + (y - 530) * p} stroke={C.gold} strokeOpacity={0.35} strokeWidth={2.5} />;
          }),
        )}
      </svg>
      {rings.map((rg, k) =>
        Array.from({length: rg.n}, (_, i) => {
          const ang = (i / rg.n) * Math.PI * 2 + k * 0.3;
          const x = 540 + Math.cos(ang) * rg.r;
          const y = 530 + Math.sin(ang) * rg.r * 0.56;
          const p = g >= rg.at + i * 1.2 + 8 ? pop(g, rg.at + i * 1.2 + 8, 12) : 0;
          if (p <= 0) return null;
          const sz = 70 - k * 8;
          return (
            <div key={`a${k}-${i}`} style={{position: 'absolute', left: x - sz / 2, top: y - sz / 2, scale: String(p)}}>
              <Avatar size={sz} hue={(i * 47 + k * 90) % 360} ring="rgba(255,255,255,0.7)" ringW={2} />
            </div>
          );
        }),
      )}
      {/* o Reel */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 140,
          top: 530 - 250,
          width: 280,
          height: 500,
          borderRadius: 40,
          overflow: 'hidden',
          border: '6px solid #1B2440',
          background: '#000',
          boxShadow: `0 30px 70px rgba(0,0,0,0.6), 0 0 ${60 * toB}px rgba(76,155,255,${0.6 * toB})`,
          opacity: a,
          scale: String((0.9 + a * 0.1) * phoneS),
        }}
      >
        <Img src={staticFile('img/criador.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 50%'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6))'}} />
        <div style={{position: 'absolute', left: 16, right: 16, bottom: 18, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.3)'}}>
          <div style={{width: `${watch * 100}%`, height: '100%', borderRadius: 3, background: '#fff'}} />
        </div>
      </div>
      {/* os 4 sinais */}
      {items.map((it, i) => {
        if (g < it.at - 3) return null;
        const p = pop(g, it.at - 3, 12) * kick;
        const next = items[i + 1]?.at ?? B;
        const active = g >= it.at - 3 && g < next - 3;
        const col = active ? '#fff' : C.gold;
        const left = it.x < 540;
        return (
          <div key={i} style={{position: 'absolute', left: it.x - 170, top: it.y - 70, width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, scale: String(p)}}>
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: 112,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? GRAD : 'rgba(10,16,34,0.85)',
                border: `3px solid ${active ? 'transparent' : C.gold}`,
                boxShadow: active ? '0 0 40px rgba(76,155,255,0.6)' : 'none',
              }}
            >
              {it.icon === 'clock' ? (
                <Clock size={58} color={col} p={watch} />
              ) : (
                <Icon d={ICON[it.icon as 'heart' | 'comment' | 'send']} size={56} color={col} fill={it.icon === 'heart' && g >= it.at ? col : 'none'} />
              )}
            </div>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 28, letterSpacing: '0.03em', textTransform: 'uppercase', color: C.white, textShadow: '0 4px 14px rgba(0,0,0,0.6)', textAlign: left ? 'left' : 'right'}}>{it.label}</div>
          </div>
        );
      })}
      {/* ALCANCE */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 232, display: 'flex', justifyContent: 'center', scale: String(al), opacity: Math.min(1, al * 1.3)}}>
        <Chip tone="blue" style={{fontSize: 42, fontWeight: 900, padding: '14px 32px 12px'}}>
          <svg width={36} height={36} viewBox="0 0 48 48">
            <path d="M24 40 V10 M12 22 L24 10 L36 22" fill="none" stroke="#fff" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Alcance
        </Chip>
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 7 · analogia: lista de convidados → quem aparece na festa (e ainda traz amigos)
// ======================================================================
const Festa: SceneFC = ({from, vh}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const X = MK.alcance9 - 6;
  const tr = interpolate(g, [X, X + 16], [0, 1], easeIO);
  const a = ramp(f, 0, 12);
  const blur = 18 * (1 - tr);
  const keys: CamKey[] = [
    {f: 0, z: 1.3, cx: 275, cy: 300},
    {f: X - from, z: 1.3, cx: 275, cy: 300},
    {f: X - from + 18, z: 1.12, cx: 275, cy: 270},
    {f: 200, z: 1.24, cx: 300, cy: 250},
  ];
  const names = ['Ana', 'Bruno', 'Carla', 'Diego', 'Júlia', 'Pedro'];
  const listOut = interpolate(g, [X, X + 14], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const chip1 = fadeOut(g, X, 8);
  const chip2 = g >= X + 8 ? pop(g, X + 8, 14) : 0;
  const friends = [
    {at: MK.trazer9 - 2, x: 700, y: 610, hue: 30, n: '+1'},
    {at: MK.trazer9 + 8, x: 830, y: 560, hue: 160, n: '+1'},
    {at: MK.amigos9 - 2, x: 950, y: 625, hue: 300, n: '+2'},
  ];
  const sweep = Math.sin(f / 18) * 0.5 + 0.5;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: `blur(${blur}px) brightness(${0.45 + tr * 0.55})`, rotate: `${(1 - tr) * -1.5}deg`, scale: '1.04'}}>
        <PhotoCam src="img/festa.jpg" iw={550} ih={550} vh={vh} keys={keys} f={f} filter="contrast(1.06) saturate(1.12)" />
      </AbsoluteFill>
      {/* luzes de festa */}
      <AbsoluteFill
        style={{
          opacity: tr * 0.55,
          mixBlendMode: 'screen',
          background: `radial-gradient(420px 300px at ${200 + sweep * 600}px 300px, rgba(255,80,160,0.35), transparent 70%), radial-gradient(380px 300px at ${900 - sweep * 500}px 520px, rgba(80,140,255,0.35), transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,21,0.55) 0%, rgba(6,10,21,0) 32%)'}} />
      {/* lista de convidados */}
      {listOut < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - 270,
            top: 300,
            width: 540,
            padding: '30px 40px 26px',
            background: '#FFF8EC',
            borderRadius: 18,
            boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
            rotate: `${-3 + listOut * 8}deg`,
            opacity: a * (1 - listOut),
            scale: String(0.94 + a * 0.06 + listOut * 0.9),
            translate: `0 ${listOut * -120}px`,
          }}
        >
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, color: C.ink, lineHeight: 1}}>Lista de convidados</div>
          <div style={{height: 2, background: 'rgba(11,18,32,0.15)', margin: '16px 0 10px'}} />
          {names.map((n, i) => {
            const ck = interpolate(g, [MK.seguidor9 + 4 + i * 5, MK.seguidor9 + 10 + i * 5], [0, 1], clamp);
            return (
              <div key={n} style={{display: 'flex', alignItems: 'center', gap: 18, height: 52}}>
                <div style={{width: 30, height: 30, borderRadius: 7, border: '3px solid rgba(11,18,32,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width={26} height={26} viewBox="0 0 48 48" style={{opacity: ck}}>
                    <path d="M9 25 L20 35 L40 12" fill="none" stroke={C.goldDeep} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ck} />
                  </svg>
                </div>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.ink}}>{n}</div>
              </div>
            );
          })}
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: 'rgba(11,18,32,0.45)', marginTop: 4}}>…</div>
        </div>
      ) : null}
      {/* rótulos */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 232, display: 'flex', justifyContent: 'center'}}>
        {chip1 > 0 ? (
          <div style={{opacity: chip1 * a}}>
            <Chip>Seguidores</Chip>
          </div>
        ) : (
          <div style={{scale: String(chip2)}}>
            <Chip tone="blue">Alcance</Chip>
          </div>
        )}
      </div>
      {/* ...e ainda traz os amigos */}
      {friends.map((fr, i) => {
        if (g < fr.at) return null;
        const p = pop(g, fr.at, 12);
        const slide = interpolate(g, [fr.at, fr.at + 12], [160, 0], ease);
        return (
          <div key={i} style={{position: 'absolute', left: fr.x - 50 + slide, top: fr.y - 50, scale: String(p)}}>
            <Avatar size={100} hue={fr.hue} ring="#fff" ringW={4} />
            <svg width={60} height={56} viewBox="0 0 60 56" style={{position: 'absolute', left: 22, top: -44, rotate: `${-14 + i * 12}deg`}}>
              <path d="M30 2 L52 52 H8 Z" fill={['#FF5C8A', '#4C9BFF', '#FFC94D'][i]} />
              <circle cx={30} cy={4} r={6} fill="#fff" />
            </svg>
            <div style={{position: 'absolute', right: -18, bottom: -8, padding: '4px 12px', borderRadius: 999, background: C.white, fontFamily: SANS, fontWeight: 900, fontSize: 26, color: C.ink}}>{fr.n}</div>
          </div>
        );
      })}
      <Grain o={0.1} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 8 · os deuses do Instagram (metáfora visual, sem números)
// ======================================================================
const Deuses: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 16);
  const rays = Array.from({length: 9}, (_, i) => i);
  const gods = [
    {x: 540, y: 820, s: 250, hue: 40, d: 0},
    {x: 250, y: 940, s: 180, hue: 330, d: 1.7},
    {x: 830, y: 940, s: 180, hue: 190, d: 3.1},
  ];
  const swarm = interpolate(g, [MK.milhoes10 - 6, MK.milhoes10 + 40], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, #1A1440 0%, #2B1A5A 30%, #0F1636 62%, #060A15 100%)', overflow: 'hidden'}}>
      {/* raios de luz vindos de cima */}
      <AbsoluteFill style={{opacity: a, mixBlendMode: 'screen'}}>
        {rays.map((i) => {
          const ang = -40 + i * 10 + Math.sin((f + i * 13) / 30) * 2;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 540 - 60,
                top: -200,
                width: 120,
                height: 2000,
                transformOrigin: '60px 0',
                rotate: `${ang}deg`,
                background: 'linear-gradient(to bottom, rgba(255,240,200,0.55), rgba(255,240,200,0) 75%)',
                opacity: 0.18 + rnd(i, 4) * 0.2,
                filter: 'blur(14px)',
              }}
            />
          );
        })}
        <div style={{position: 'absolute', left: 540 - 500, top: -500, width: 1000, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,236,190,0.75), rgba(255,236,190,0))'}} />
      </AbsoluteFill>
      {/* seguidores subindo aos milhares */}
      {Array.from({length: 70}, (_, i) => {
        const st = rnd(i, 7) * 0.6;
        const p = interpolate(swarm, [st, st + 0.4], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        const x0 = rnd(i, 8) * 1080;
        const tx = gods[i % 3].x;
        const x = x0 + (tx - x0) * p;
        const y = 1920 - p * (1920 - gods[i % 3].y - 60);
        return <div key={i} style={{position: 'absolute', left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: 18, background: i % 2 ? C.gold : C.purple, opacity: Math.sin(p * Math.PI) * 0.9}} />;
      })}
      {/* nuvens: tufos com volume (luz em cima, sombra embaixo) */}
      <AbsoluteFill style={{opacity: a, filter: 'blur(5px)'}}>
        {Array.from({length: 26}, (_, i) => {
          const r = 70 + rnd(i, 9) * 90;
          const x = -60 + (i / 25) * 1200 + (rnd(i, 10) - 0.5) * 80 + Math.sin((f + i * 20) / 45) * 8;
          const y = 1130 + (rnd(i, 11) - 0.5) * 110 + (i % 3) * 26;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - r,
                top: y - r,
                width: r * 2,
                height: r * 1.7,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 45% 35%, #FFFFFF 0%, #EDEBFF 45%, #B9B3E6 80%, rgba(185,179,230,0) 100%)',
                opacity: 0.92,
              }}
            />
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,21,0) 62%, rgba(26,20,64,0.55) 70%, rgba(6,10,21,0) 82%)', opacity: a}} />
      {gods.map((gd, i) => {
        const fy = Math.sin(f / 16 + gd.d) * 10;
        const p = g >= from + i * 4 ? pop(g, from + i * 4, 14) : 0;
        return (
          <div key={i} style={{position: 'absolute', left: gd.x - gd.s / 2, top: gd.y - gd.s / 2 + fy, scale: String(p)}}>
            <div style={{position: 'absolute', left: gd.s * 0.1, top: -gd.s * 0.2, width: gd.s * 0.8, height: gd.s * 0.22, borderRadius: '50%', border: `${gd.s * 0.045}px solid #FFDB8A`, boxShadow: '0 0 30px rgba(255,219,138,0.9), inset 0 0 18px rgba(255,219,138,0.7)'}} />
            <div style={{boxShadow: '0 0 80px rgba(255,236,190,0.55)', borderRadius: gd.s}}>
              <Avatar size={gd.s} hue={gd.hue} ring="#FFE9B5" ringW={6} />
            </div>
            <div style={{position: 'absolute', right: -6, bottom: 4}}>
              <Verified size={gd.s * 0.3} />
            </div>
          </div>
        );
      })}
      <Grain o={0.08} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 9 · "segundo a Meta": trecho oficial + seguidores que nem abrem o app
// ======================================================================
const PorIsso: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 2, 14);
  const fol = Array.from({length: 16}, (_, i) => i);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: a}}>
        <MetaLogo h={46} />
      </div>
      <div style={{position: 'absolute', left: 40, top: 360 + (1 - a) * 40, opacity: a}}>
        <QuoteCard
          name="q_porisso"
          width={1000}
          f={g}
          hl={[
            {from: 3, to: 14, at: MK.muitos11 - 2, len: MK.abrir11 + 22 - MK.muitos11},
            {from: 15, to: 22, at: MK.quando11 - 2, len: MK.publicado11 + 12 - MK.quando11},
          ]}
        />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 965, display: 'flex', justifyContent: 'center'}}>
        <Source o={a} />
      </div>
      <div style={{position: 'absolute', left: 90, top: 1075, width: 900, display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'center'}}>
        {fol.map((i) => {
          const asleep = rnd(i, 11) > 0.28;
          const at = MK.nem11 - 4 + rnd(i, 12) * 40;
          const d = asleep ? interpolate(g, [at, at + 10], [0, 1], clamp) : 0;
          const p = g >= from + 4 + i ? pop(g, from + 4 + i, 14) : 0;
          return (
            <div key={i} style={{position: 'relative', scale: String(p)}}>
              <Avatar size={88} hue={(i * 53) % 360} dim={d * 0.9} ring={asleep ? `rgba(255,255,255,${0.5 - d * 0.35})` : C.gold} ringW={3} />
              {d > 0.5 ? (
                <div style={{position: 'absolute', right: -8, top: -20, fontFamily: SANS, fontWeight: 800, fontSize: 26, color: 'rgba(255,255,255,0.7)', opacity: (d - 0.5) * 2, translate: `0 ${-Math.sin((g + i * 7) / 9) * 4}px`}}>z</div>
              ) : null}
            </div>
          );
        })}
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 10 · feed: quem abre vê outros conteúdos primeiro… inclusive o de um mero mortal
// ======================================================================
const FeedCard: React.FC<{kind: 'celeb' | 'food' | 'pet' | 'trip' | 'mortal'; w: number}> = ({kind, w}) => {
  const h = 290;
  const media: Record<string, string> = {
    celeb: 'linear-gradient(135deg, #F6C85F, #C2459A 60%, #5B2DA8)',
    food: 'linear-gradient(135deg, #FF9A5A, #E8473F)',
    pet: 'linear-gradient(135deg, #43D6B5, #1F7FA8)',
    trip: 'linear-gradient(160deg, #FFB86B 0%, #F0627E 45%, #403A8F 100%)',
    mortal: '#000',
  };
  return (
    <div style={{width: w, background: '#0F1526', borderRadius: 18, overflow: 'hidden', border: kind === 'mortal' ? `3px solid ${C.gold}` : '1px solid rgba(255,255,255,0.08)', boxShadow: kind === 'mortal' ? '0 0 40px rgba(76,155,255,0.6)' : 'none'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px'}}>
        <Avatar size={42} hue={kind === 'celeb' ? 40 : kind === 'food' ? 10 : kind === 'pet' ? 170 : kind === 'trip' ? 320 : 210} img={kind === 'mortal' ? 'img/criador.jpg' : undefined} />
        {kind === 'mortal' ? (
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, color: C.white}}>mero.mortal</div>
        ) : (
          <div style={{width: kind === 'celeb' ? 150 : 110, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.55)'}} />
        )}
        {kind === 'celeb' ? <Verified size={24} /> : null}
      </div>
      <div style={{height: h, background: media[kind], position: 'relative', overflow: 'hidden'}}>
        {kind === 'mortal' ? <Img src={staticFile('img/criador.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 40%'}} /> : null}
        {kind === 'celeb' ? (
          <svg width={110} height={80} viewBox="0 0 110 80" style={{position: 'absolute', left: w / 2 - 55, top: h / 2 - 40}}>
            <path d="M8 70 L14 18 L36 44 L55 8 L74 44 L96 18 L102 70 Z" fill="rgba(255,255,255,0.9)" />
          </svg>
        ) : null}
        {kind === 'food' ? <div style={{position: 'absolute', left: w / 2 - 70, top: h / 2 - 70, width: 140, height: 140, borderRadius: 140, border: '10px solid rgba(255,255,255,0.85)'}} /> : null}
        {kind === 'pet' ? (
          <svg width={120} height={120} viewBox="0 0 120 120" style={{position: 'absolute', left: w / 2 - 60, top: h / 2 - 60}}>
            <ellipse cx={60} cy={80} rx={30} ry={24} fill="rgba(255,255,255,0.9)" />
            {[22, 46, 74, 98].map((x, i) => (
              <ellipse key={i} cx={x} cy={i === 0 || i === 3 ? 50 : 34} rx={11} ry={14} fill="rgba(255,255,255,0.9)" />
            ))}
          </svg>
        ) : null}
        {kind === 'trip' ? (
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={w * 0.7} cy={h * 0.38} r={38} fill="rgba(255,240,200,0.95)" />
            <path d={`M0 ${h} L${w * 0.3} ${h * 0.45} L${w * 0.55} ${h * 0.8} L${w * 0.78} ${h * 0.55} L${w} ${h} Z`} fill="rgba(20,16,50,0.75)" />
          </svg>
        ) : null}
        {kind === 'mortal' ? (
          <div style={{position: 'absolute', left: 14, bottom: 14}}>
            <Chip tone="blue" style={{fontSize: 22, padding: '8px 16px 7px'}}>
              Mero mortal
            </Chip>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Feed: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 12);
  const on = interpolate(g, [MK.abre12 - 4, MK.abre12 + 8], [0, 1], clamp);
  const CW = 436;
  const CH = 290 + 66 + 16;
  // cada conteúdo novo entra por cima e empurra o da celebridade para baixo
  const arrivals = [MK.assistindo12 - 4, MK.outro12 - 6, MK.primeiro12 + 4, MK.take['13'] + 2];
  const shift = arrivals.reduce((acc, at) => acc + interpolate(g, [at, at + 12], [0, 1], easeIO), 0);
  const order: ('celeb' | 'food' | 'pet' | 'trip' | 'mortal')[] = ['mortal', 'trip', 'pet', 'food', 'celeb'];
  return (
    <Bg>
      <div style={{position: 'absolute', left: 540 - 250, top: 236, width: 500, height: 580, borderRadius: 50, border: '7px solid #1B2440', background: '#05070E', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', opacity: a, scale: String(0.94 + a * 0.06)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 58, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, background: '#05070E', zIndex: 2, opacity: on}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, color: C.white}}>Para você</div>
          <div style={{flex: 1}} />
          <Icon d={ICON.heart} size={28} color="#fff" />
          <Icon d={ICON.send} size={28} color="#fff" />
        </div>
        <div style={{position: 'absolute', left: (500 - 14 - CW) / 2, top: 66, opacity: on}}>
          {order.map((k, i) => {
            const base = (i - 4) * CH; // a celebridade começa no topo (índice 4)
            const y = base + shift * CH;
            return (
              <div key={k} style={{position: 'absolute', left: 0, top: y, width: CW}}>
                <FeedCard kind={k} w={CW} />
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', inset: 0, background: '#05070E', opacity: 1 - on}} />
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 11 · "Sejamos claros" — trecho oficial grifado
// ======================================================================
const Sejamos: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const a = ramp(f, 2, 14);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 40, top: 262 + (1 - a) * 40, opacity: a}}>
        <QuoteCard name="q_sejamos" width={1000} f={f + from} hl={[{from: 2, to: 24, at: from + 10, len: 84}]} />
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 12 · cada postagem, uma nova chance: o Reel sendo enviado a pessoas diferentes
// ======================================================================
const Compartilhar: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const p0 = pop(g, MK.postagem17 - 6, 13);
  const people = Array.from({length: 8}, (_, i) => {
    const ang = -Math.PI / 2 + (i / 8) * Math.PI * 2 + 0.2;
    return {x: 540 + Math.cos(ang) * 400, y: 530 + Math.sin(ang) * 230, hue: (i * 45 + 20) % 360};
  });
  return (
    <Bg>
      {people.map((pp, i) => {
        const at = MK.oportunidade17 - 4 + i * 6;
        const t = interpolate(g, [at, at + 16], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
        const arrived = g >= at + 16;
        const lit = arrived ? pop(g, at + 16, 10) : 0;
        const c = {x: (540 + pp.x) / 2 + (pp.y - 530) * 0.25, y: (530 + pp.y) / 2 - (pp.x - 540) * 0.25};
        const bx = (1 - t) ** 2 * 540 + 2 * (1 - t) * t * c.x + t ** 2 * pp.x;
        const by = (1 - t) ** 2 * 530 + 2 * (1 - t) * t * c.y + t ** 2 * pp.y;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: pp.x - 46, top: pp.y - 46, opacity: 0.5 + lit * 0.5, scale: String(0.9 + lit * 0.12)}}>
              <Avatar size={92} hue={pp.hue} dim={1 - lit} ring={lit > 0.1 ? C.gold : 'rgba(255,255,255,0.3)'} ringW={4} />
              {lit > 0 ? (
                <div style={{position: 'absolute', left: 60, top: -26, scale: String(lit), opacity: interpolate(g, [at + 30, at + 44], [1, 0], clamp)}}>
                  <Icon d={ICON.heart} size={40} color={C.red} fill={C.red} w={2} />
                </div>
              ) : null}
            </div>
            {t > 0 && t < 1 ? (
              <div style={{position: 'absolute', left: bx - 22, top: by - 22, rotate: `${Math.atan2(pp.y - 530, pp.x - 540) * (180 / Math.PI) + 45}deg`}}>
                <Icon d={ICON.send} size={44} color="#fff" fill="rgba(76,155,255,0.9)" w={2.6} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: 540 - 115, top: 530 - 190, width: 230, height: 380, borderRadius: 30, overflow: 'hidden', border: '5px solid #1B2440', boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 50px rgba(76,155,255,0.35)', scale: String(p0)}}>
        <Img src={staticFile('img/criador.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 50%'}} />
        <div style={{position: 'absolute', left: 115 - 34, top: 190 - 34, width: 68, height: 68, borderRadius: 68, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={30} height={30} viewBox="0 0 30 30">
            <path d="M8 4 L26 15 L8 26 Z" fill="#fff" />
          </svg>
        </div>
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 13 · DM com a Meta: as mensagens se escrevem junto com a fala → "Visto"
// ======================================================================
const say = (take: number, g: number) =>
  PAGES.filter((p) => p.take === take && p.start <= g)
    .map((p) => p.toks.map((t) => t.t).join(' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

const Dm: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 10);
  const msgs: {t: string; at: number}[] = [{t: 'Ô, Meta, vem cá, conversa aqui comigo', at: from}];
  const m2 = say(19, g);
  if (m2) msgs.push({t: m2, at: MK.take['19']});
  const m3 = say(20, g);
  if (m3) msgs.push({t: m3, at: MK.take['20']});
  const seen = g >= MK.take['21'] + 2 ? ramp(g, MK.take['21'] + 2, 6) : 0;
  const typingOn = g >= MK.take['21'] + 9 && g < MK.e21 - 4;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, #0B1022, #070B16)'}}>
      {/* mensagens (ancoradas embaixo, sobem como num chat) */}
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 50,
          top: 340,
          bottom: 1010 - 772,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          gap: 14,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 46px)',
          maskImage: 'linear-gradient(to bottom, transparent 0, black 46px)',
        }}
      >
        {msgs.map((m, i) => {
          const p = i === 0 ? a : pop(g, m.at, 16);
          return (
            <div
              key={i}
              style={{
                maxWidth: 760,
                padding: '18px 26px 16px',
                borderRadius: 30,
                borderBottomRightRadius: 8,
                background: GRAD,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 34,
                lineHeight: 1.28,
                color: '#fff',
                scale: String(0.9 + p * 0.1),
                opacity: p,
                transformOrigin: '100% 100%',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              }}
            >
              {m.t}
            </div>
          );
        })}
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.6)', opacity: seen, marginRight: 8}}>Visto agora</div>
        <div style={{alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 12, opacity: typingOn ? 1 : 0, height: typingOn ? 64 : 0}}>
          <div style={{width: 46, height: 46, borderRadius: 46, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <MetaLogo h={18} variant="simbolo" />
          </div>
          <div style={{padding: '18px 22px', borderRadius: 26, background: '#1B2236', display: 'flex', gap: 9}}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{width: 12, height: 12, borderRadius: 12, background: '#fff', opacity: 0.35 + 0.65 * Math.max(0, Math.sin((g - k * 4) / 3))}} />
            ))}
          </div>
        </div>
      </div>
      {/* cabeçalho da conversa */}
            <div style={{position: 'absolute', left: 50, right: 50, top: 220, display: 'flex', alignItems: 'center', gap: 22, opacity: a}}>
        <svg width={30} height={30} viewBox="0 0 30 30">
          <path d="M20 4 L8 15 L20 26" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{width: 84, height: 84, borderRadius: 84, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px rgba(255,255,255,0.15)'}}>
          <MetaLogo h={32} variant="simbolo" />
        </div>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#fff'}}>
            Meta <Verified size={30} />
          </div>
          <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 24, color: 'rgba(255,255,255,0.55)'}}>{seen > 0 ? 'Online agora' : 'Ativo há 1 h'}</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 330, height: 2, background: 'rgba(255,255,255,0.08)', opacity: a}} />
      <Grain />
    </AbsoluteFill>
  );
};

export const SCENES: Record<string, SceneFC> = {
  headline: Headline,
  article: Article,
  compare: Compare,
  ironia: Ironia,
  sinais: Sinais,
  reel: Reel,
  festa: Festa,
  deuses: Deuses,
  porisso: PorIsso,
  feed: Feed,
  sejamos: Sejamos,
  compartilhar: Compartilhar,
  dm: Dm,
};
