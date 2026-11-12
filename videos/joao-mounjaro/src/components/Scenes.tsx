import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MK} from '../timeline';
import {C, clamp, SANS, SERIF, SHADOW, SHADOW_BIG} from '../theme';
import {ease, easeIO, Film, IllustrationTag, Photo, Stroke} from './Draw';

type SP = {from: number; dur: number; vh: number};
const m = (k: string, from: number) => MK[k] - from;
const IMG = {
  caneta: 'img/caneta.jpg',
  balanca: 'img/balanca.jpg',
  hormonios: 'img/hormonios.jpg',
  motor: 'img/motor.jpg',
  pm: 'img/proteina_musculo.jpg',
  treino: 'img/treino.jpg',
};

const Chip: React.FC<{p: number; children: React.ReactNode; tone?: 'green' | 'dark' | 'amber'; size?: number; style?: React.CSSProperties}> = ({p, children, tone = 'dark', size = 36, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: SANS,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: '0.02em',
      padding: `${size * 0.36}px ${size * 0.7}px ${size * 0.3}px`,
      borderRadius: 999,
      color: tone === 'green' ? C.ink : tone === 'amber' ? C.ink : C.white,
      background: tone === 'green' ? C.gold : tone === 'amber' ? C.red : 'rgba(10,14,12,0.78)',
      border: tone === 'dark' ? `2px solid ${C.gold}` : 'none',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      opacity: p,
      scale: String(0.85 + 0.15 * p),
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.gold}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: '0.24em', color}}>
    <div style={{width: 36, height: 3, background: color}} />
    {children}
  </div>
);

// ================= GANCHO: a caneta + MOUNJARO =================
const HookPen: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const mj = m('mounjaro1', from);
  const pulse = interpolate(f, [mj - 2, mj + 4, mj + 16], [0, 1, 0.35], clamp);
  return (
    <AbsoluteFill>
      <Photo src={IMG.caneta} vh={vh} keys={[{f: 0, s: 1.05, cx: 600, cy: 900}, {f: dur, s: 1.16, cx: 560, cy: 960}]} grade="contrast(1.06) saturate(1.0)" />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,14,12,0.7) 0%, rgba(10,14,12,0.15) 40%, rgba(10,14,12,0) 60%)'}} />
      <div style={{position: 'absolute', left: 64, top: 236}}>
        <Kicker color={C.white}>O PERIGO QUE NINGUÉM TE CONTA</Kicker>
        <div
          style={{
            marginTop: 8,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 148,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: C.white,
            textShadow: `0 0 ${40 * pulse}px rgba(63,224,125,${0.9 * pulse}), ${SHADOW_BIG}`,
          }}
        >
          MOUN<span style={{color: C.gold}}>JARO</span>
        </div>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= A famosa canetinha (caneta + balança) =================
const PenScale: React.FC<SP> = ({dur, vh}) => (
  <AbsoluteFill>
    <Photo src={IMG.balanca} vh={vh} keys={[{f: 0, s: 1.12, cx: 520, cy: 800}, {f: dur, s: 1.2, cx: 520, cy: 780}]} grade="contrast(1.08) brightness(1.15)" />
    <IllustrationTag x={40} y={vh - 260} />
  </AbsoluteFill>
);

// ================= COMO FUNCIONA: GLP-1 e GIP → cérebro (apetite e saciedade) =================
const Ring: React.FC<{x: number; y: number; r: number; at: number; f: number; id: string; out?: number}> = ({x, y, r, at, f, id, out}) => (
  <Stroke id={id} f={f} at={at} dur={12} out={out} pts={[[x - r, y], [x + r, y]]} d={`M ${x} ${y - r} A ${r} ${r} 0 1 1 ${x - 0.1} ${y - r}`} color={C.gold} w={6} />
);

const Hormones: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const h = m('dois3', from);
  const ap = m('apetite3', from);
  const sa = m('saciedade3', from);
  const lblH = interpolate(f, [h, h + 8], [0, 1], ease);
  const lblA = interpolate(f, [ap - 2, ap + 8], [0, 1], ease);
  const lblS = interpolate(f, [sa - 2, sa + 8], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo
        src={IMG.hormonios}
        keys={[
          {f: 0, s: 1.04, cx: 540, cy: 960},
          {f: h + 4, s: 1.06, cx: 520, cy: 980},
          {f: ap - 6, s: 1.08, cx: 520, cy: 960},
          {f: ap + 10, s: 1.22, cx: 640, cy: 520},
          {f: dur, s: 1.26, cx: 650, cy: 520},
        ]}
        grade="contrast(1.04) saturate(0.95) hue-rotate(-12deg)"
        svg={
          <>
            <Ring id="glp" x={228} y={1026} r={150} at={h} f={f} out={ap - 4} />
            <Ring id="gip" x={672} y={1020} r={142} at={h + 4} f={f} out={ap - 4} />
            <Ring id="ape" x={918} y={294} r={125} at={ap - 2} f={f} />
            <Ring id="sac" x={918} y={600} r={125} at={sa - 2} f={f} />
          </>
        }
      >
        <div style={{position: 'absolute', left: 450, top: 1250, translate: '-50% 0', opacity: lblH, scale: String(0.9 + 0.1 * lblH)}}>
          <Chip p={lblH} tone="green" size={40}>
            2 HORMÔNIOS
          </Chip>
        </div>
        <div style={{position: 'absolute', right: 1080 - 770, top: 260, textAlign: 'right', opacity: lblA, translate: `${(1 - lblA) * 20}px 0`}}>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.white, textShadow: SHADOW_BIG}}>APETITE</div>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: C.gold, textShadow: SHADOW}}>▼ MENOR</div>
        </div>
        <div style={{position: 'absolute', right: 1080 - 770, top: 566, textAlign: 'right', opacity: lblS, translate: `${(1 - lblS) * 20}px 0`}}>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.white, textShadow: SHADOW_BIG}}>SACIEDADE</div>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: C.gold, textShadow: SHADOW}}>▲ MAIOR</div>
        </div>
      </Photo>
      <Film o={0.05} vignette={0.35} />
      <IllustrationTag x={48} y={1300} />
    </AbsoluteFill>
  );
};

// ================= Menos fome → menos peso (medidores) =================
const MeterIcon: React.FC<{name: 'fork' | 'scale'}> = ({name}) => (
  <svg width={70} height={70} viewBox="0 0 48 48">
    {name === 'fork' ? (
      <g fill="none" stroke={C.gold} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 6 V18 a4 4 0 0 0 8 0 V6 M18 6 V42" />
        <path d="M32 42 V6 c6 3 7 12 4 18 h-4" />
      </g>
    ) : (
      <g fill="none" stroke={C.gold} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        <rect x={5} y={8} width={38} height={34} rx={7} />
        <path d="M14 20 a10 10 0 0 1 20 0 M24 20 L28 15" />
      </g>
    )}
  </svg>
);

const Meter: React.FC<{label: string; icon: 'fork' | 'scale'; from: number; to: number; p: number; y: number}> = ({label, icon, from, to, p, y}) => {
  const v = from + (to - from) * p;
  return (
    <div style={{position: 'absolute', left: 100, right: 100, top: y}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.white}}>
        <MeterIcon name={icon} />
        <span style={{flex: 1}}>{label}</span>
        <span style={{color: C.gold, fontSize: 54, opacity: p > 0.05 ? 1 : 0}}>▼</span>
      </div>
      <div style={{marginTop: 22, height: 46, borderRadius: 46, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
        <div style={{width: `${v}%`, height: '100%', borderRadius: 46, background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`, boxShadow: `0 0 28px ${C.gold}`}} />
      </div>
    </div>
  );
};

const Meters: React.FC<SP> = ({from}) => {
  const f = useCurrentFrame();
  const fo = interpolate(f, [m('menos3', from) - 2, m('menos3', from) + 22], [0, 1], easeIO);
  const pe = interpolate(f, [m('perder3', from), m('peso3', from) + 14], [0, 1], easeIO);
  const a = interpolate(f, [0, 8], [0, 1], ease);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${C.greenDark} 0%, ${C.bg} 75%)`, opacity: a}}>
      <div style={{position: 'absolute', left: 100, top: 270}}>
        <Kicker>COM O MEDICAMENTO</Kicker>
      </div>
      <Meter label="FOME" icon="fork" from={85} to={28} p={fo} y={380} />
      <Meter label="PESO" icon="scale" from={85} to={55} p={pe} y={620} />
    </AbsoluteFill>
  );
};

// ================= Pouca proteína =================
const Protein: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const pc = m('pouca3', from);
  const lvl = interpolate(f, [pc - 4, pc + 16], [0.85, 0.22], easeIO);
  const lbl = interpolate(f, [pc - 2, pc + 8], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo src={IMG.pm} vh={vh} keys={[{f: 0, s: 1.18, cx: 540, cy: 420}, {f: dur, s: 1.24, cx: 560, cy: 410}]} grade={`contrast(1.04) saturate(${1 - 0.35 * (1 - lvl)})`} />
      <div style={{position: 'absolute', left: 70, top: 250, width: 360, padding: '20px 24px', borderRadius: 24, background: 'rgba(10,14,12,0.78)', border: `2px solid ${C.gold}`, fontFamily: SANS}}>
        <div style={{fontWeight: 900, fontSize: 32, letterSpacing: '0.06em', color: C.white}}>PROTEÍNA</div>
        <div style={{marginTop: 14, height: 22, borderRadius: 22, background: 'rgba(255,255,255,0.15)', overflow: 'hidden'}}>
          <div style={{width: `${lvl * 100}%`, height: '100%', background: lvl < 0.4 ? C.red : C.gold, borderRadius: 22}} />
        </div>
        <div style={{marginTop: 10, fontWeight: 800, fontSize: 24, color: C.red, opacity: lbl}}>ABAIXO DO IDEAL</div>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= Sem treino de força =================
const Training: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const t = m('treino3', from);
  const a = interpolate(f, [t - 4, t + 6], [0, 1], ease);
  const s0 = interpolate(f, [0, 6], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo src={IMG.treino} vh={vh} keys={[{f: 0, s: 1.05, cx: 540, cy: 620}, {f: dur, s: 1.12, cx: 540, cy: 600}]} grade="contrast(1.05) saturate(0.95)" />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,14,12,0.75) 0%, rgba(10,14,12,0.2) 45%, rgba(10,14,12,0) 70%)'}} />
      <div style={{position: 'absolute', left: 64, top: 236}}>
        <div style={{display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: '0.1em', color: C.ink, background: C.red, padding: '8px 18px 6px', borderRadius: 10, opacity: s0}}>SEM</div>
        <div style={{marginTop: 10, fontFamily: SANS, fontWeight: 900, fontSize: 104, lineHeight: 0.95, letterSpacing: '-0.02em', color: C.white, textShadow: SHADOW_BIG, opacity: a, translate: `0 ${(1 - a) * 18}px`}}>
          TREINO
          <br />
          <span style={{color: C.gold}}>DE FORÇA</span>
        </div>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= Gordura e massa muscular =================
const MuscleLoss: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const g = m('gordura3', from);
  const ms = m('massa3', from);
  const a = interpolate(f, [g - 2, g + 8], [0, 1], ease);
  const b = interpolate(f, [ms - 2, ms + 8], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo src={IMG.pm} vh={vh} keys={[{f: 0, s: 1.0, cx: 540, cy: 1400}, {f: dur, s: 1.06, cx: 560, cy: 1420}]} grade="contrast(1.04)" />
      <div style={{position: 'absolute', left: 60, top: 240, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
        <Chip p={a} tone="amber" size={38}>
          GORDURA ▼
        </Chip>
        <Chip p={b} tone="green" size={38}>
          MASSA MUSCULAR ▼
        </Chip>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= O número na balança =================
const Scale: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const n = m('numero3', from);
  const led = interpolate(f, [n - 2, n + 6], [0, 1], ease);
  const blink = Math.floor(f / 5) % 2 === 0 ? 1 : 0.55;
  return (
    <AbsoluteFill>
      <Photo
        src={IMG.balanca}
        vh={vh}
        keys={[
          {f: 0, s: 1.15, cx: 520, cy: 1060},
          {f: dur, s: 1.3, cx: 520, cy: 1100},
        ]}
        grade="contrast(1.08) brightness(1.15)"
      >
        <div style={{position: 'absolute', left: 560, top: 1010, transform: 'translate(-50%, -50%) rotate(-8deg) skewX(-18deg)', fontFamily: 'monospace', fontWeight: 700, fontSize: 92, letterSpacing: '0.08em', color: C.gold, textShadow: `0 0 18px ${C.gold}, 0 0 40px rgba(63,224,125,0.6)`, opacity: led * blink}}>
          --.- kg
        </div>
      </Photo>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= ANALOGIA DO MOTOR =================
const Engine: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const cb = m('combustivel4', from);
  const mn = m('manutencao4', from);
  const a = interpolate(f, [2, 12], [0, 1], ease);
  const c1 = interpolate(f, [cb - 2, cb + 8], [0, 1], ease);
  const c2 = interpolate(f, [mn - 2, mn + 8], [0, 1], ease);
  const idle = Math.sin(f * 2.1) * 0.8;
  const rot = f * 9;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <AbsoluteFill style={{translate: `0 ${idle}px`}}>
        <Photo
          src={IMG.motor}
          keys={[
            {f: 0, s: 1.42, cx: 540, cy: 560},
            {f: dur, s: 1.52, cx: 560, cy: 560},
          ]}
          grade="contrast(1.06) saturate(0.95) hue-rotate(-8deg)"
          svg={
            <g opacity={interpolate(f, [10, 20], [0, 0.9], clamp)}>
              {[
                [672, 618, 62],
                [880, 420, 52],
              ].map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={C.gold} strokeWidth={4} strokeDasharray="18 14" transform={`rotate(${rot * (i ? -1.3 : 1)} ${x} ${y})`} opacity={0.75} />
              ))}
            </g>
          }
        />
      </AbsoluteFill>
      {/* brilho que passa pelo motor */}
      <AbsoluteFill style={{background: `linear-gradient(105deg, rgba(255,255,255,0) ${interpolate(f, [0, dur], [-30, 110])}%, rgba(200,255,220,0.10) ${interpolate(f, [0, dur], [-20, 120])}%, rgba(255,255,255,0) ${interpolate(f, [0, dur], [-10, 130])}%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,14,12,0.85) 0%, rgba(10,14,12,0) 22%, rgba(10,14,12,0) 55%, rgba(10,14,12,0.8) 78%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', opacity: a, translate: `0 ${(1 - a) * 14}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: '0.3em', color: C.gold, paddingLeft: '0.3em'}}>PENSE ASSIM</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 92, lineHeight: 1, color: C.white, textShadow: SHADOW_BIG}}>
          MÚSCULO <span style={{color: C.gold}}>=</span> MOTOR
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1180, display: 'flex', justifyContent: 'center', gap: 22}}>
        <Chip p={c1} size={38}>
          COMBUSTÍVEL
        </Chip>
        <Chip p={c2} size={38}>
          MANUTENÇÃO
        </Chip>
      </div>
      <Film o={0.06} vignette={0.4} />
      <IllustrationTag x={48} y={1300} />
    </AbsoluteFill>
  );
};

const EngineSmall: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const ms = m('massa4', from);
  const pr = m('proteina4', from);
  const a = interpolate(f, [ms - 2, ms + 8], [0, 1], ease);
  const p = interpolate(f, [pr - 2, pr + 8], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo
        src={IMG.motor}
        vh={vh}
        keys={[
          {f: 0, s: 1.1, cx: 540, cy: 1050},
          {f: ms, s: 1.22, cx: 540, cy: 1330},
          {f: dur, s: 1.26, cx: 540, cy: 1340},
        ]}
        grade="contrast(1.06) saturate(0.95) hue-rotate(-8deg)"
      />
      <div style={{position: 'absolute', left: 60, top: 240, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start'}}>
        <Chip p={p} tone="amber" size={34}>
          POUCA PROTEÍNA
        </Chip>
        <Chip p={a} tone="green" size={34}>
          MENOS MÚSCULO = MOTOR MENOR
        </Chip>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

const Muscle: React.FC<SP> = ({dur, vh}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [4, 14], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo src={IMG.pm} vh={vh} keys={[{f: 0, s: 1.05, cx: 360, cy: 1300}, {f: dur, s: 1.35, cx: 300, cy: 1520}]} grade="contrast(1.05)" />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,14,12,0.85) 0%, rgba(10,14,12,0.55) 32%, rgba(10,14,12,0) 50%)'}} />
      <div style={{position: 'absolute', left: 64, top: 236, opacity: a, translate: `0 ${(1 - a) * 14}px`}}>
        <Kicker>MÚSCULO</Kicker>
        <div style={{marginTop: 6, fontFamily: SERIF, fontStyle: 'italic', fontSize: 72, lineHeight: 1, color: C.white, textShadow: SHADOW_BIG}}>parte importante do motor</div>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= Proteína → aminoácidos → músculo =================
const Aminos: React.FC<SP> = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const am = m('aminoacidos5', from);
  const ti = m('tecidos5', from);
  const pv = m('preservar5', from);
  const rp = m('reparar5', from);
  const flow = interpolate(f, [am - 6, ti + 10], [0, 1], clamp);
  const lA = interpolate(f, [am - 2, am + 8], [0, 1], ease);
  const c1 = interpolate(f, [pv - 2, pv + 8], [0, 1], ease);
  const c2 = interpolate(f, [rp - 2, rp + 8], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Photo
        src={IMG.pm}
        vh={vh}
        keys={[
          {f: 0, s: 1.12, cx: 560, cy: 430},
          {f: am, s: 1.12, cx: 560, cy: 470},
          {f: ti + 6, s: 1.1, cx: 470, cy: 1450},
          {f: dur, s: 1.18, cx: 470, cy: 1480},
        ]}
        grade="contrast(1.04)"
      />
      {/* aminoácidos: partículas verdes descendo do prato para o músculo */}
      <AbsoluteFill style={{opacity: flow > 0 && flow < 1 ? 1 : 0}}>
        {Array.from({length: 26}).map((_, i) => {
          const r = (Math.sin(i * 12.9898) + 1) / 2;
          const r2 = (Math.sin(i * 78.233) + 1) / 2;
          const t = (flow * 1.6 + r) % 1;
          const x = 200 + r2 * 680 + Math.sin(t * 6 + i) * 24;
          const y = 220 + t * (vh - 300);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 14 + r * 10, height: 14 + r * 10, borderRadius: 30, background: C.gold, boxShadow: `0 0 16px ${C.gold}`, opacity: Math.sin(t * Math.PI) * 0.9}} />;
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 64, top: 236, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start'}}>
        <Chip p={lA} tone="green" size={36}>
          AMINOÁCIDOS
        </Chip>
        <div style={{display: 'flex', gap: 14}}>
          <Chip p={c1} size={32}>
            PRESERVAR
          </Chip>
          <Chip p={c2} size={32}>
            REPARAR
          </Chip>
        </div>
      </div>
      <IllustrationTag x={40} y={vh - 260} />
    </AbsoluteFill>
  );
};

// ================= Quando você para: tendência de reganho (ilustrativa) =================
const Regain: React.FC<SP> = ({from, dur}) => {
  const f = useCurrentFrame();
  const pb = m('problema5', from);
  const cn = m('canetinha5', from);
  const a = interpolate(f, [0, 10], [0, 1], ease);
  // gráfico
  const X0 = 140;
  const X1 = 960;
  const Y0 = 640;
  const Y1 = 1130;
  const stopX = X0 + (X1 - X0) * 0.55;
  const down = `M ${X0} ${Y0 + 30} C ${X0 + 180} ${Y0 + 60}, ${stopX - 200} ${Y1 - 60}, ${stopX} ${Y1 - 40}`;
  const up = `M ${stopX} ${Y1 - 40} C ${stopX + 120} ${Y1 - 60}, ${X1 - 160} ${Y0 + 170}, ${X1} ${Y0 + 150}`;
  const pDown = interpolate(f, [4, pb + 20], [0, 1], easeIO);
  const stopIn = interpolate(f, [cn - 10, cn], [0, 1], ease);
  const pUp = interpolate(f, [cn, dur - 4], [0, 1], easeIO);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, opacity: a}}>
      <AbsoluteFill style={{scale: '1.1'}}>
        <Img src={staticFile(IMG.balanca)} style={{width: 1080, height: 1919, objectFit: 'cover', filter: 'blur(22px) brightness(0.35)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 140, top: 250}}>
        <Kicker>QUANDO VOCÊ PARA</Kicker>
        <div style={{marginTop: 8, fontFamily: SANS, fontWeight: 900, fontSize: 96, lineHeight: 1, color: C.white}}>
          EFEITO <span style={{color: C.gold}}>SANFONA?</span>
        </div>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <line x1={X0} y1={Y0 - 40} x2={X0} y2={Y1 + 40} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <line x1={X0} y1={Y1 + 40} x2={X1 + 20} y2={Y1 + 40} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <text x={X0 - 18} y={Y0 - 54} fill="rgba(255,255,255,0.75)" fontFamily="Montserrat" fontWeight={800} fontSize={26} textAnchor="start">PESO</text>
        <text x={X1 + 20} y={Y1 + 86} fill="rgba(255,255,255,0.75)" fontFamily="Montserrat" fontWeight={800} fontSize={26} textAnchor="end">TEMPO</text>
        {/* fase com o medicamento */}
        <rect x={X0} y={Y0 - 40} width={(stopX - X0) * Math.min(1, pDown * 1.3)} height={Y1 - Y0 + 80} fill="rgba(63,224,125,0.07)" />
        <path d={down} fill="none" stroke={C.gold} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pDown} />
        <path d={up} fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pUp} />
        <line x1={stopX} y1={Y0 - 40} x2={stopX} y2={Y1 + 40} stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeDasharray="10 10" opacity={stopIn} />
      </svg>
      <div style={{position: 'absolute', left: X0 + 20, top: Y0 - 30, fontFamily: SANS, fontWeight: 800, fontSize: 26, color: C.gold, opacity: pDown}}>COM O MEDICAMENTO</div>
      <div style={{position: 'absolute', left: stopX + 14, top: Y1 - 10, fontFamily: SANS, fontWeight: 900, fontSize: 30, color: C.white, opacity: stopIn}}>PAROU</div>
      <div style={{position: 'absolute', left: 140, right: 120, top: 1235, fontFamily: SANS, fontWeight: 600, fontSize: 24, lineHeight: 1.35, color: 'rgba(255,255,255,0.7)', opacity: interpolate(f, [cn, cn + 10], [0, 1], clamp)}}>
        Ilustração da tendência média observada em estudos (ex.: SURMOUNT-4, 2024). Varia de pessoa para pessoa.
      </div>
    </AbsoluteFill>
  );
};

// ================= Fim =================
const End: React.FC<SP> = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f, fps, config: {damping: 16, stiffness: 140}});
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${C.greenDark} 0%, ${C.bg} 70%)`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center', opacity: a, translate: `0 ${(1 - a) * 20}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 170, lineHeight: 1, color: C.white}}>
          PARTE <span style={{color: C.gold}}>2</span>
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 80, color: C.gold}}>em breve</div>
      </div>
      <div style={{position: 'absolute', left: 120, right: 120, top: 1320, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 26, lineHeight: 1.35, color: 'rgba(255,255,255,0.7)', opacity: interpolate(f, [8, 16], [0, 1], clamp)}}>
        Medicamentos só com prescrição e acompanhamento médico.
      </div>
    </AbsoluteFill>
  );
};

export const SCENES: Record<string, React.FC<SP>> = {
  hookPen: HookPen,
  penScale: PenScale,
  hormones: Hormones,
  meters: Meters,
  protein: Protein,
  training: Training,
  muscleLoss: MuscleLoss,
  scale: Scale,
  engine: Engine,
  engineSmall: EngineSmall,
  muscle: Muscle,
  aminos: Aminos,
  regain: Regain,
  end: End,
};
