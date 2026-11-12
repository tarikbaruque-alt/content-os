import React from 'react';
import {interpolate} from 'remotion';
import {C, clamp, SANS, SERIF} from '../theme';
import {ease, easeIO, Star} from './Draw';

// ================= Linha do tempo (1900 → 1920 → 1926 → 1931) =================
export const YEARS = ['1900', '1920', '1926', '1931'];
// pos: posição contínua (0 = 1900 … 3 = 1931); appear: 0–1
export const Timeline: React.FC<{pos: number; appear: number; y?: number; light?: boolean; starAt?: number}> = ({pos, appear, y = 250, light = false, starAt = 99}) => {
  const x0 = 150;
  const x1 = 930;
  const xs = YEARS.map((_, i) => x0 + ((x1 - x0) * i) / (YEARS.length - 1));
  const px = x0 + ((x1 - x0) * Math.min(pos, 3)) / 3;
  const base = light ? 'rgba(59,47,34,0.28)' : 'rgba(246,244,239,0.25)';
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: 90, opacity: appear, translate: `0 ${(1 - appear) * -14}px`}}>
      <div style={{position: 'absolute', left: x0, top: 20, width: (x1 - x0) * appear, height: 3, background: base, borderRadius: 2}} />
      <div style={{position: 'absolute', left: x0, top: 19, width: px - x0, height: 5, background: C.gold, borderRadius: 3, boxShadow: '0 0 12px rgba(242,193,78,0.6)'}} />
      {xs.map((x, i) => {
        const on = interpolate(pos, [i - 0.35, i], [0, 1], clamp);
        const past = pos >= i - 0.01;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: 21, translate: '-50% -50%'}}>
            <div
              style={{
                width: 14 + 10 * on,
                height: 14 + 10 * on,
                borderRadius: 30,
                background: past ? C.gold : light ? C.paper : C.bg,
                border: `3px solid ${past ? C.gold : base}`,
                boxShadow: on > 0.5 ? '0 0 18px rgba(242,193,78,0.75)' : 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 26,
                translate: '-50% 0',
                fontFamily: SANS,
                fontWeight: on > 0.5 ? 900 : 700,
                fontSize: 26 + 8 * on,
                letterSpacing: '0.04em',
                color: on > 0.5 ? C.gold : light ? C.inkSoft : 'rgba(246,244,239,0.6)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {YEARS[i]}
              {i === 2 && pos >= starAt ? <Star size={26} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ================= Ícones em traço (tinta) =================
export const Icon: React.FC<{name: 'wrench' | 'bed' | 'fork' | 'compass' | 'clock' | 'map'; size?: number; color?: string; w?: number}> = ({name, size = 44, color = C.ink, w = 3.4}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      {name === 'wrench' ? <path {...p} d="M30 8 a9 9 0 0 0 -8 12 L8 34 a3.5 3.5 0 0 0 5 5 L27 25 a9 9 0 0 0 12 -8 l-6 5 -5 -1 -1 -5 Z" /> : null}
      {name === 'bed' ? (
        <g {...p}>
          <path d="M5 36 V12 M5 28 H43 V36 M20 22 H37 a6 6 0 0 1 6 6" />
          <rect x="9" y="17" width="9" height="6" rx="2" />
        </g>
      ) : null}
      {name === 'fork' ? (
        <g {...p}>
          <path d="M14 6 V18 a4 4 0 0 0 8 0 V6 M18 6 V42" />
          <path d="M32 42 V6 c6 3 7 12 4 18 h-4" />
        </g>
      ) : null}
      {name === 'compass' ? (
        <g {...p}>
          <circle cx="24" cy="24" r="17" />
          <path d="M24 10 L28 24 L24 38 L20 24 Z" />
          <path d="M10 24 H14 M34 24 H38" />
        </g>
      ) : null}
      {name === 'clock' ? (
        <g {...p}>
          <circle cx="24" cy="24" r="17" />
          <path d="M24 13 V24 L31 28" />
        </g>
      ) : null}
      {name === 'map' ? <path {...p} d="M6 12 L17 8 L31 13 L42 9 V36 L31 40 L17 35 L6 39 Z M17 8 V35 M31 13 V40" /> : null}
    </svg>
  );
};

// ================= Guia ilustrado (não reproduz o guia original) =================
export const GuideBook: React.FC<{w?: number; stamp?: number; struck?: number}> = ({w = 420, stamp = 0, struck = 0}) => {
  const h = w * 1.42;
  const s = w / 420;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 10 * s, background: 'linear-gradient(135deg, #A3231D 0%, #7C1712 60%, #5E110D 100%)', boxShadow: `0 ${30 * s}px ${60 * s}px rgba(0,0,0,0.55), inset -${10 * s}px 0 ${18 * s}px rgba(0,0,0,0.35)`}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 26 * s, borderRadius: `${10 * s}px 0 0 ${10 * s}px`, background: 'linear-gradient(90deg, #5A0F0B, #8A1A14)'}} />
      <div style={{position: 'absolute', left: 44 * s, right: 22 * s, top: 22 * s, bottom: 22 * s, border: `${3 * s}px solid #D9B45A`, borderRadius: 6 * s}} />
      <div style={{position: 'absolute', left: 54 * s, right: 32 * s, top: 32 * s, bottom: 32 * s, border: `${1.5 * s}px solid rgba(217,180,90,0.7)`, borderRadius: 4 * s}} />
      <div style={{position: 'absolute', left: 30 * s, right: 0, top: 70 * s, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 74 * s, color: '#E9C877', lineHeight: 1}}>Guia</div>
      <div style={{position: 'absolute', left: 30 * s, right: 0, top: 150 * s, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 17 * s, letterSpacing: '0.28em', color: '#E9C877'}}>DO MOTORISTA</div>
      {/* carro antigo em traço */}
      <svg width={220 * s} height={110 * s} viewBox="0 0 220 110" style={{position: 'absolute', left: 130 * s, top: 205 * s}}>
        <g fill="none" stroke="#E9C877" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 72 H40 M80 72 H140 M178 72 H200 V58 L182 52 L160 28 H92 L80 50 H24 Z" />
          <circle cx="60" cy="74" r="16" />
          <circle cx="160" cy="74" r="16" />
          <path d="M100 32 V50 M130 32 V50" />
          <path d="M6 96 H214" strokeDasharray="10 9" opacity={0.7} />
        </g>
      </svg>
      {/* ícones redondos: mapas, oficinas, hotéis, restaurantes */}
      <div style={{position: 'absolute', left: 30 * s, right: 0, top: 350 * s, display: 'flex', justifyContent: 'center', gap: 14 * s}}>
        {(['map', 'wrench', 'bed', 'fork'] as const).map((n) => (
          <div key={n} style={{width: 62 * s, height: 62 * s, borderRadius: 62 * s, background: '#E9D3A0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name={n} size={38 * s} color="#5E110D" w={3.6} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 30 * s, right: 0, bottom: 52 * s, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30 * s, letterSpacing: '0.2em', color: '#E9C877'}}>1900</div>
      {/* carimbo GRATUITO */}
      {stamp > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '46%',
            translate: '-50% -50%',
            rotate: '-14deg',
            scale: String(2.2 - 1.2 * stamp),
            opacity: Math.min(1, stamp * 1.6),
            border: `${6 * s}px solid #F3E7C9`,
            borderRadius: 12 * s,
            padding: `${8 * s}px ${22 * s}px ${4 * s}px`,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 58 * s,
            letterSpacing: '0.08em',
            color: '#F3E7C9',
            mixBlendMode: 'screen',
            whiteSpace: 'nowrap',
          }}
        >
          GRATUITO
          <div style={{position: 'absolute', left: -10 * s, right: -10 * s, top: '48%', height: 8 * s, background: C.gold, transformOrigin: 'left', scale: `${struck} 1`, borderRadius: 4}} />
        </div>
      ) : null}
    </div>
  );
};

// ================= Mapa estilizado da França (papel antigo) =================
const FR: [number, number][] = [
  [2.55, 51.09], [1.6, 50.87], [1.58, 50.2], [0.6, 49.86], [0.1, 49.48], [-0.2, 49.3], [-1.0, 49.4], [-1.26, 49.68], [-1.94, 49.72], [-1.6, 48.65], [-2.3, 48.62],
  [-3.0, 48.8], [-4.1, 48.7], [-4.75, 48.4], [-4.3, 48.1], [-4.5, 47.95], [-3.5, 47.7], [-2.5, 47.4], [-2.2, 47.1], [-2.0, 46.8], [-1.3, 46.3], [-1.2, 45.8],
  [-1.15, 45.2], [-1.25, 44.6], [-1.4, 44.0], [-1.55, 43.45], [-1.78, 43.36], [-1.3, 43.08], [-0.3, 42.83], [0.7, 42.85], [1.45, 42.6], [2.0, 42.45], [3.17, 42.44],
  [3.05, 42.9], [3.3, 43.27], [4.05, 43.56], [4.8, 43.4], [5.35, 43.3], [6.0, 43.08], [6.65, 43.25], [7.0, 43.55], [7.5, 43.78], [7.65, 44.1], [7.0, 44.25],
  [6.9, 44.7], [7.05, 45.2], [6.8, 45.6], [7.05, 45.9], [6.8, 46.0], [6.2, 46.25], [6.1, 46.5], [6.4, 46.8], [6.9, 47.4], [7.6, 47.55], [7.6, 48.0], [7.8, 48.6],
  [8.2, 48.98], [7.4, 49.17], [6.75, 49.17], [6.35, 49.47], [5.8, 49.55], [5.3, 49.65], [4.85, 49.95], [4.8, 50.15], [4.15, 49.98], [3.7, 50.3], [3.3, 50.5],
  [2.9, 50.7], [2.55, 51.09],
];
const CORSE: [number, number][] = [[9.4, 43.0], [9.5, 42.6], [9.5, 42.1], [9.2, 41.4], [8.8, 41.6], [8.6, 42.0], [8.6, 42.4], [9.0, 42.7], [9.4, 43.0]];
export const CITY: Record<string, [number, number]> = {
  Paris: [2.35, 48.86],
  'Clermont-Ferrand': [3.08, 45.78],
  Lyon: [4.83, 45.76],
  Bordeaux: [-0.58, 44.84],
  Marseille: [5.37, 43.3],
  Nantes: [-1.55, 47.22],
  Estrasburgo: [7.75, 48.58],
  Lille: [3.06, 50.63],
  Toulouse: [1.44, 43.6],
  Rouen: [1.1, 49.44],
  Dijon: [5.04, 47.32],
  Avignon: [4.81, 43.95],
};
export const proj = (k: number) => ([lon, lat]: [number, number]): [number, number] => [(lon + 5.2) * 0.688 * k, (51.4 - lat) * k];

export type Pin = {at: string | [number, number]; t: number; icon: 'wrench' | 'bed' | 'fork' | 'star3'; label: string; side?: 'l' | 'r'};
export type Route = {pts: (string | [number, number])[]; t: number; dur: number; dash?: boolean};

const P = (v: string | [number, number]) => (typeof v === 'string' ? CITY[v] : v);

// Desenha o mapa numa caixa de largura w. f = frame local. car: posição do carro (0–1) sobre a rota "carRoute".
export const FranceMap: React.FC<{
  w: number;
  f: number;
  drawAt?: number;
  cities?: string[];
  routes?: Route[];
  pins?: Pin[];
  car?: {route: (string | [number, number])[]; p: number; o: number};
  highlight?: string;
}> = ({w, f, drawAt = 0, cities = [], routes = [], pins = [], car, highlight}) => {
  const k = w / (14.9 * 0.688);
  const pr = proj(k);
  const h = 10.1 * k;
  const outline = FR.map(pr).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
  const corse = CORSE.map(pr).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
  const draw = interpolate(f, [drawAt, drawAt + 16], [0, 1], easeIO);
  const pathOf = (pts: (string | [number, number])[]) => {
    const q = pts.map((v) => pr(P(v)));
    let d = `M${q[0][0]} ${q[0][1]}`;
    for (let i = 1; i < q.length; i++) {
      const [ax, ay] = q[i - 1];
      const [bx, by] = q[i];
      const mx = (ax + bx) / 2 + (by - ay) * 0.12;
      const my = (ay + by) / 2 - (bx - ax) * 0.12;
      d += ` Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    return {d, q};
  };
  // posição do carro ao longo da rota (aproximação pelos segmentos quadráticos)
  let carXY: [number, number] | null = null;
  if (car && car.o > 0) {
    const {q} = pathOf(car.route);
    const n = q.length - 1;
    const t = Math.min(0.9999, Math.max(0, car.p)) * n;
    const i = Math.floor(t);
    const u = t - i;
    const [ax, ay] = q[i];
    const [bx, by] = q[i + 1];
    const mx = (ax + bx) / 2 + (by - ay) * 0.12;
    const my = (ay + by) / 2 - (bx - ax) * 0.12;
    carXY = [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by];
  }
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <mask id="fr-draw" maskUnits="userSpaceOnUse" x={-50} y={-50} width={w + 100} height={h + 100}>
            <path d={outline} stroke="white" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          </mask>
        </defs>
        {/* meridianos e paralelos discretos */}
        {[-4, -2, 0, 2, 4, 6, 8].map((lon) => {
          const [x] = pr([lon, 50]);
          return <line key={`m${lon}`} x1={x} y1={0} x2={x} y2={h} stroke={C.inkSoft} strokeWidth={1} opacity={0.18 * draw} />;
        })}
        {[42, 44, 46, 48, 50].map((lat) => {
          const [, y] = pr([0, lat]);
          return <line key={`p${lat}`} x1={0} y1={y} x2={w} y2={y} stroke={C.inkSoft} strokeWidth={1} opacity={0.18 * draw} />;
        })}
        <path d={outline} fill="rgba(200,180,140,0.35)" opacity={draw} />
        <path d={corse} fill="rgba(200,180,140,0.35)" stroke={C.ink} strokeWidth={2.5} opacity={draw} />
        <path d={outline} fill="none" stroke={C.ink} strokeWidth={3} mask="url(#fr-draw)" strokeLinejoin="round" />
        {/* rotas */}
        {routes.map((r, i) => {
          const {d} = pathOf(r.pts);
          const p = interpolate(f, [r.t, r.t + r.dur], [0, 1], easeIO);
          if (p <= 0) return null;
          return (
            <g key={i}>
              <mask id={`rt-${i}`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={w + 100} height={h + 100}>
                <path d={d} stroke="white" strokeWidth={14} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
              </mask>
              <path d={d} stroke={r.dash ? C.ink : C.red} strokeWidth={r.dash ? 3 : 6} fill="none" strokeDasharray={r.dash ? '8 9' : '14 10'} mask={`url(#rt-${i})`} strokeLinecap="round" opacity={r.dash ? 0.55 : 1} />
            </g>
          );
        })}
        {/* cidades */}
        {cities.map((c) => {
          const [x, y] = pr(CITY[c]);
          const o = draw;
          const hl = highlight === c;
          return (
            <g key={c} opacity={o}>
              <circle cx={x} cy={y} r={hl ? 9 : 6} fill={hl ? C.red : C.ink} />
              {hl ? <circle cx={x} cy={y} r={16} fill="none" stroke={C.red} strokeWidth={2.5} /> : null}
            </g>
          );
        })}
      </svg>
      {cities.map((c) => {
        const [x, y] = pr(CITY[c]);
        const left = c === 'Clermont-Ferrand';
        return (
          <div
            key={`l${c}`}
            style={{
              position: 'absolute',
              left: left ? undefined : x + 12,
              right: left ? w - x + 14 : undefined,
              top: left ? y + 6 : y - 34,
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 30 * (w / 900),
              color: left ? C.red : C.ink,
              opacity: draw * 0.95,
              whiteSpace: 'nowrap',
            }}
          >
            {c}
          </div>
        );
      })}
      {/* pinos */}
      {pins.map((p, i) => {
        const [x, y] = pr(P(p.at));
        const a = interpolate(f, [p.t, p.t + 8], [0, 1], ease);
        if (a <= 0) return null;
        const sz = 74 * (w / 900);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, translate: '-50% -100%', scale: String(0.6 + 0.4 * a), opacity: a, transformOrigin: '50% 100%'}}>
            <div style={{position: 'relative', width: sz, height: sz * 1.25}}>
              <svg width={sz} height={sz * 1.25} viewBox="0 0 60 75" style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 6px 8px rgba(40,28,14,0.35))'}}>
                <path d="M30 73 C30 73 4 44 4 28 A26 26 0 0 1 56 28 C56 44 30 73 30 73 Z" fill={p.icon === 'star3' ? C.ink : C.red} />
                <circle cx="30" cy="28" r="19" fill={C.paper} />
              </svg>
              <div style={{position: 'absolute', left: 0, top: sz * 0.08, width: sz, height: sz * 0.62, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {p.icon === 'star3' ? (
                  <div style={{display: 'flex', gap: 1}}>
                    {[0, 1, 2].map((j) => (
                      <Star key={j} size={sz * 0.24} glow={0.2} />
                    ))}
                  </div>
                ) : (
                  <Icon name={p.icon} size={sz * 0.46} color={C.red} w={4} />
                )}
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                top: sz * 0.22,
                [p.side === 'l' ? 'right' : 'left']: sz + 6,
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 30 * (w / 900),
                letterSpacing: '0.08em',
                color: C.ink,
                whiteSpace: 'nowrap',
                background: 'rgba(234,223,198,0.85)',
                padding: '4px 10px 2px',
                borderRadius: 6,
              }}
            >
              {p.label}
            </div>
          </div>
        );
      })}
      {/* carro */}
      {carXY ? (
        <div style={{position: 'absolute', left: carXY[0], top: carXY[1], translate: '-50% -50%', opacity: car!.o}}>
          <div style={{width: 58 * (w / 900), height: 58 * (w / 900), borderRadius: 60, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(40,28,14,0.4)'}}>
            <svg width={40 * (w / 900)} height={24 * (w / 900)} viewBox="0 0 40 24">
              <path d="M3 16 H8 M15 16 H25 M32 16 H37 V12 L33 10 L28 4 H15 L12 10 H4 Z" fill="none" stroke={C.paper} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx="11.5" cy="17" r="3.5" fill="none" stroke={C.paper} strokeWidth={2.4} />
              <circle cx="28.5" cy="17" r="3.5" fill="none" stroke={C.paper} strokeWidth={2.4} />
            </svg>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// Papel antigo de fundo
export const Paper: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, #F1E7D0 0%, ${C.paper} 55%, #CDB98F 100%)`}}>
    {children}
  </div>
);
