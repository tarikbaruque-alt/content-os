import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {MK} from '../timeline';
import {C, clamp, COND, GRAD, SANS} from '../theme';
import {Avatar, Bg, CamKey, Chip, Clock, ease, easeIO, fadeOut, Grain, Icon, PhotoCam, pop, ramp, rnd, starPath, Stepper, STEPS} from './Kit';

type SceneProps = {from: number; dur: number; vh: number};
type SceneFC = React.FC<SceneProps>;

const TopShade: React.FC<{h?: number; o?: number}> = ({h = 330, o = 0.7}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: `linear-gradient(to bottom, rgba(7,10,18,${o}) 0%, rgba(7,10,18,0) 100%)`}} />
);

// ======================================================================
// 1 · "começar uma jornada no digital" — da loja física para o digital
// ======================================================================
const Jornada: SceneFC = ({from, vh}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const l = (m: number) => m - from;
  const keys: CamKey[] = [
    {f: 0, z: 1.5, cx: 300, cy: 470},
    {f: l(MK.interesse), z: 1.46, cx: 360, cy: 470},
    {f: l(MK.digital) + 16, z: 1.34, cx: 600, cy: 410},
  ];
  const p = pop(g, MK.jornada - 3, 13);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <PhotoCam src="img/jornada.jpg" iw={900} ih={1600} vh={vh} keys={keys} f={f} filter="contrast(1.05) saturate(1.06)" />
      <TopShade />
      <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', scale: String(p), opacity: Math.min(1, p * 1.4)}}>
        <Chip tone="gold" style={{fontSize: 34, fontWeight: 900}}>
          <Icon n="path" size={36} color={C.ink} w={4} />
          Jornada no digital
        </Chip>
      </div>
      <Grain o={0.08} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 2 · "quem não for pro digital o quanto antes está jogando dinheiro fora"
// ======================================================================
const Dinheiro: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 12);
  const spin = interpolate(g, [from, MK.jogando], [0, 2.4], clamp);
  const antes = pop(g, MK.antes - 3, 13);
  const leak = interpolate(g, [MK.jogando - 2, MK.jogando + 10], [0, 1], clamp);
  const arrow = interpolate(g, [from + 8, from + 26], [0, 1], easeIO);
  const tile = (x: number, icon: string, label: string, bad: boolean) => (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 380,
        width: 350,
        height: 330,
        borderRadius: 34,
        background: bad ? `rgba(${Math.round(20 + leak * 60)},${Math.round(26 - leak * 8)},${Math.round(44 - leak * 20)},0.92)` : 'rgba(18,24,42,0.92)',
        border: `2.5px solid ${bad ? (leak > 0.4 ? C.red : 'rgba(255,255,255,0.18)') : C.gold}`,
        boxShadow: bad ? `0 0 ${50 * leak}px rgba(255,107,107,${0.45 * leak})` : `0 0 ${40 + 20 * Math.sin(f / 9)}px rgba(255,200,61,0.3)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        opacity: a,
        scale: String(0.92 + a * 0.08),
      }}
    >
      <Icon n={icon} size={140} color={bad ? (leak > 0.4 ? C.red : C.white) : C.gold} w={2.6} />
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: '0.06em', color: C.white, textAlign: 'center', whiteSpace: 'nowrap'}}>{label}</div>
    </div>
  );
  return (
    <Bg>
      {tile(56, 'store', 'FORA DO DIGITAL', true)}
      {tile(674, 'phone', 'NO DIGITAL', false)}
      {/* seta + relógio: "o quanto antes" */}
      <svg width={1080} height={1010} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M424 545 H644" stroke={C.gold} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" pathLength={100} opacity={a} style={{strokeDashoffset: -f * 1.2}} />
        <path d="M626 523 L654 545 L626 567" fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={arrow} />
      </svg>
      <div style={{position: 'absolute', left: 540 - 46, top: 412, opacity: a}}>
        <Clock size={92} color={C.white} p={spin} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 246, display: 'flex', justifyContent: 'center', scale: String(antes), opacity: Math.min(1, antes * 1.4) * fadeOut(g, MK.jogando - 4, 8)}}>
        <Chip tone="gold" style={{fontSize: 34, fontWeight: 900}}>O quanto antes</Chip>
      </div>
      {/* notas saindo: dinheiro indo embora */}
      {Array.from({length: 11}, (_, i) => {
        const st = MK.jogando - 2 + i * 3.2;
        const t = interpolate(g, [st, st + 34], [0, 1], clamp);
        if (t <= 0 || t >= 1) return null;
        const dx = (rnd(i, 1) - 0.5) * 340;
        const x = 231 + dx * t;
        const y = 500 - t * 300 - Math.sin(t * Math.PI) * 40;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 52,
              top: y - 28,
              width: 104,
              height: 56,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #58E6A8, #1FA971)',
              border: '2px solid rgba(255,255,255,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 26,
              color: 'rgba(6,40,26,0.9)',
              rotate: `${(rnd(i, 2) - 0.5) * 70 + t * 60 * (i % 2 ? 1 : -1)}deg`,
              opacity: Math.sin(t * Math.PI) ** 0.6,
              filter: `grayscale(${t * 0.9})`,
            }}
          >
            R$
          </div>
        );
      })}
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 3 · "mesmo que você não faça nenhum produto como e-book, manual, curso, mentoria, consultoria"
// ======================================================================
const Produtos: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const head = pop(g, from + 2, 13);
  const items = [
    {at: MK.ebook, n: 'book', label: 'E-book', x: 54, y: 352},
    {at: MK.manual, n: 'list', label: 'Manual de dicas', x: 392, y: 352},
    {at: MK.curso, n: 'course', label: 'Curso', x: 730, y: 352},
    {at: MK.mentoria, n: 'mentor', label: 'Mentoria', x: 223, y: 558},
    {at: MK.consultoria, n: 'brief', label: 'Consultoria', x: 561, y: 558},
  ];
  const slots = ramp(g, MK.produto - 6, 12);
  const end = interpolate(g, [MK.consultoria + 16, MK.consultoria + 28], [0, 1], clamp);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 240, display: 'flex', justifyContent: 'center', scale: String(head), opacity: Math.min(1, head * 1.4)}}>
        <Chip tone="gold" style={{fontSize: 34, fontWeight: 900}}>Mesmo sem produto</Chip>
      </div>
      {items.map((it, i) => {
        const p = pop(g, it.at - 3, 12);
        const next = items[i + 1]?.at ?? it.at + 22;
        const active = g >= it.at - 3 && g < next - 3;
        return (
          <div key={i} style={{position: 'absolute', left: it.x, top: it.y, width: 296, height: 180, opacity: slots}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: 28, border: '2.5px dashed rgba(255,255,255,0.28)'}} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 28,
                background: active ? GRAD : 'rgba(18,24,42,0.94)',
                border: `2.5px solid ${active ? 'transparent' : C.gold}`,
                boxShadow: active ? '0 0 50px rgba(255,200,61,0.55)' : '0 14px 34px rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                scale: String(p),
                opacity: Math.min(1, p * 1.5) * (1 - end * 0.45),
              }}
            >
              <Icon n={it.n} size={70} color={active ? C.ink : C.gold} w={3} />
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 26, letterSpacing: '0.04em', textTransform: 'uppercase', color: active ? C.ink : C.white, textAlign: 'center', whiteSpace: 'nowrap'}}>{it.label}</div>
            </div>
          </div>
        );
      })}
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 4 · "o fato de você se expor e conseguir seguidores" — etapa 1/5
// ======================================================================
const Seguidores: SceneFC = ({from, vh}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const l = (m: number) => m - from;
  const keys: CamKey[] = [
    {f: 0, z: 1.36, cx: 330, cy: 760},
    {f: l(MK.expor), z: 1.4, cx: 360, cy: 700},
    {f: l(MK.seguidores) + 14, z: 1.46, cx: 660, cy: 430},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <PhotoCam src="img/criadora.jpg" iw={941} ih={1672} vh={vh} keys={keys} f={f} filter="contrast(1.05) saturate(1.05)" />
      <Stepper active={1} f={f} shade />
      {[0, 1, 2, 3].map((i) => {
        const st = MK.seguidores + i * 6;
        const t = interpolate(g, [st, st + 26], [0, 1], clamp);
        if (t <= 0 || t >= 1) return null;
        return (
          <div key={i} style={{position: 'absolute', left: 250 + i * 170, top: 690 - t * 150, opacity: Math.sin(t * Math.PI), scale: String(0.7 + t * 0.4)}}>
            <Avatar size={74} hue={(i * 80 + 20) % 360} ring="#fff" ringW={3} />
            <div style={{position: 'absolute', right: -22, top: -14, padding: '2px 10px', borderRadius: 999, background: C.gold, fontFamily: SANS, fontWeight: 900, fontSize: 24, color: C.ink}}>+1</div>
          </div>
        );
      })}
      <Grain o={0.08} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 5 · "abrir portas, novos caminhos, parcerias, collabs, publicidade"
// ======================================================================
const NodeIcon: React.FC<{kind: string; color: string}> = ({kind, color}) => {
  if (kind === 'parceria')
    return (
      <svg width={58} height={58} viewBox="0 0 48 48">
        <circle cx={18} cy={24} r={12} fill="none" stroke={color} strokeWidth={3.2} />
        <circle cx={30} cy={24} r={12} fill="none" stroke={color} strokeWidth={3.2} />
      </svg>
    );
  if (kind === 'collab')
    return (
      <svg width={60} height={60} viewBox="0 0 48 48">
        <circle cx={15} cy={17} r={6.5} fill="none" stroke={color} strokeWidth={3.2} />
        <path d="M4 38 C5 29 9 26 15 26 C19 26 22 27.5 24 31" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
        <circle cx={33} cy={17} r={6.5} fill="none" stroke={color} strokeWidth={3.2} />
        <path d="M44 38 C43 29 39 26 33 26 C29 26 26 27.5 24 31" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
        <path d="M24 5 V13 M20 9 H28" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      </svg>
    );
  return <Icon n={kind} size={56} color={color} />;
};

const Portas: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 10);
  const cx = 540;
  const cy = 650;
  const nodes = [
    {at: MK.portas, kind: 'door', label: 'Portas', x: 150, y: 690},
    {at: MK.caminhos, kind: 'path', label: 'Novos caminhos', x: 268, y: 478},
    {at: MK.parcerias, kind: 'parceria', label: 'Parcerias', x: 540, y: 405},
    {at: MK.collabs, kind: 'collab', label: 'Collabs', x: 812, y: 478},
    {at: MK.publicidade, kind: 'megaphone', label: 'Publicidade', x: 930, y: 690},
  ];
  return (
    <Bg>
      <Stepper active={1} f={f + 200} />
      <svg width={1080} height={1010} style={{position: 'absolute', left: 0, top: 0}}>
        {nodes.map((n, i) => {
          const p = interpolate(g, [n.at - 8, n.at], [0, 1], ease);
          if (p <= 0) return null;
          return <line key={i} x1={cx} y1={cy} x2={cx + (n.x - cx) * p} y2={cy + (n.y - cy) * p} stroke={C.gold} strokeWidth={3.5} strokeDasharray="3 12" strokeLinecap="round" opacity={0.85} />;
        })}
        {[0, 1].map((k) => {
          const t = ((f + k * 22) % 44) / 44;
          return <circle key={k} cx={cx} cy={cy} r={92 + t * 60} fill="none" stroke={C.gold} strokeWidth={2.5} opacity={(1 - t) * 0.5 * a} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: cx - 84, top: cy - 84, opacity: a, scale: String(0.85 + a * 0.15)}}>
        <Avatar size={168} img="img/rosto.jpg" ring={C.gold} ringW={6} />
      </div>
      {nodes.map((n, i) => {
        const p = pop(g, n.at - 2, 12);
        if (p <= 0) return null;
        const next = nodes[i + 1]?.at ?? n.at + 40;
        const active = g < next - 2;
        return (
          <div key={i} style={{position: 'absolute', left: n.x - 150, top: n.y - 62, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, scale: String(p)}}>
            <div
              style={{
                width: 124,
                height: 124,
                borderRadius: 124,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? GRAD : 'rgba(18,24,42,0.95)',
                border: `3px solid ${active ? 'transparent' : C.gold}`,
                boxShadow: active ? '0 0 46px rgba(255,200,61,0.6)' : '0 10px 26px rgba(0,0,0,0.4)',
              }}
            >
              <NodeIcon kind={n.kind} color={active ? C.ink : C.gold} />
            </div>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 27, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.white, textShadow: '0 3px 12px rgba(0,0,0,0.7)', whiteSpace: 'nowrap'}}>{n.label}</div>
          </div>
        );
      })}
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 6 · "mostrar o seu trabalho pro mundo" — a vitrine
// ======================================================================
const Vitrine: SceneFC = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const keys: CamKey[] = [
    {f: 0, z: 1.02, cx: 470, cy: 560},
    {f: dur, z: 1.34, cx: 470, cy: 790},
  ];
  const p2 = pop(g, MK.mundo - 3, 13);
  const shine = interpolate(g, [MK.mundo - 2, MK.mundo + 22], [-0.3, 1.3], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <PhotoCam src="img/vitrine.jpg" iw={941} ih={1672} vh={vh} keys={keys} f={f} filter="contrast(1.05) saturate(1.04)" />
      <AbsoluteFill style={{background: `linear-gradient(105deg, transparent ${shine * 100 - 14}%, rgba(255,255,255,0.4) ${shine * 100}%, transparent ${shine * 100 + 14}%)`, mixBlendMode: 'screen'}} />
      <Stepper active={1} f={f + 200} shade />
      <div style={{position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'absolute', scale: String(p2), opacity: Math.min(1, p2 * 1.4)}}>
          <Chip tone="gold" style={{fontSize: 34, fontWeight: 900}}>
            <svg width={36} height={36} viewBox="0 0 48 48">
              <circle cx={24} cy={24} r={19} fill="none" stroke={C.ink} strokeWidth={4} />
              <path d="M5 24 H43 M24 5 C15 13 15 35 24 43 C33 35 33 13 24 5" fill="none" stroke={C.ink} strokeWidth={3.4} />
            </svg>
            Sua vitrine pro mundo
          </Chip>
        </div>
      </div>
      <Grain o={0.08} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 7 · qualidade → autoridade → visto como expert — etapa 2/5
// ======================================================================
const Autoridade: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 2, 12);
  const bar = interpolate(g, [MK.autoridade - 2, MK.autoridade + 22], [0, 1], easeIO);
  const tag = pop(g, MK.assunto - 3, 13);
  const eye = pop(g, MK.visto - 3, 13);
  const st = MK.expert - 2;
  const seal = interpolate(g, [st, st + 7], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const shake = g >= st + 7 && g < st + 14 ? Math.sin((g - st) * 2.6) * (14 - (g - st)) * 0.6 : 0;
  return (
    <Bg>
      <Stepper active={2} f={f} />
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 350 + (1 - a) * 40,
          width: 920,
          height: 410,
          borderRadius: 36,
          background: 'linear-gradient(160deg, rgba(26,34,58,0.96), rgba(14,19,34,0.96))',
          border: '1.5px solid rgba(255,255,255,0.14)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
          opacity: a,
          translate: `${shake}px 0`,
        }}
      >
        <div style={{position: 'absolute', left: 44, top: 44}}>
          <Avatar size={176} img="img/rosto.jpg" ring={C.gold} ringW={5} />
        </div>
        <div style={{position: 'absolute', left: 262, top: 54, width: 270, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.92)'}} />
        <div style={{position: 'absolute', left: 262, top: 96, width: 170, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.35)'}} />
        {/* qualidade */}
        <div style={{position: 'absolute', left: 262, top: 138, fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: '0.18em', color: C.gray}}>QUALIDADE</div>
        <div style={{position: 'absolute', left: 258, top: 170, display: 'flex', gap: 6}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const p = pop(g, MK.qualidade - 2 + i * 3, 11);
            return (
              <svg key={i} width={52} height={52} viewBox="0 0 52 52" style={{overflow: 'visible'}}>
                <path d={starPath(26, 27, 23)} fill="rgba(255,255,255,0.12)" />
                <path d={starPath(26, 27, 23)} fill={C.gold} style={{transformOrigin: '26px 27px', scale: String(p)}} />
              </svg>
            );
          })}
        </div>
        {/* autoridade */}
        <div style={{position: 'absolute', left: 44, top: 262, fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: '0.18em', color: C.gray}}>AUTORIDADE</div>
        <div style={{position: 'absolute', left: 44, top: 298, width: 700, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
          <div style={{width: `${bar * 100}%`, height: '100%', borderRadius: 11, background: GRAD}} />
        </div>
        <div style={{position: 'absolute', left: 764, top: 276, opacity: 0.35 + bar * 0.65}}>
          <Icon n="shield" size={62} color={bar > 0.95 ? C.gold : C.white} w={3.2} />
        </div>
        <div style={{position: 'absolute', left: 44, top: 344, display: 'flex', gap: 14}}>
          <div style={{scale: String(tag), opacity: Math.min(1, tag * 1.4), transformOrigin: '0 50%'}}>
            <Chip style={{fontSize: 24, padding: '9px 18px 8px'}}># seu assunto</Chip>
          </div>
          <div style={{scale: String(eye), opacity: Math.min(1, eye * 1.4), transformOrigin: '0 50%'}}>
            <Chip style={{fontSize: 24, padding: '9px 18px 8px'}}>
              <Icon n="eye" size={28} color={C.cyan} w={4} />
              visto como
            </Chip>
          </div>
        </div>
      </div>
      {/* selo EXPERT */}
      {g >= st ? (
        <div style={{position: 'absolute', left: 742, top: 300, scale: String(2.4 - seal * 1.4), opacity: seal, rotate: '-12deg'}}>
          <svg width={250} height={250} viewBox="0 0 250 250" style={{filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.5))'}}>
            <path
              d={Array.from({length: 40}, (_, i) => {
                const ang = (i / 40) * Math.PI * 2;
                const r = i % 2 ? 110 : 122;
                return `${i ? 'L' : 'M'}${125 + Math.cos(ang) * r} ${125 + Math.sin(ang) * r}`;
              }).join(' ') + ' Z'}
              fill={C.gold}
            />
            <circle cx={125} cy={125} r={92} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="3 9" />
            <text x={125} y={146} textAnchor="middle" fontFamily="Anton" fontSize={62} fill={C.ink} letterSpacing={2}>
              EXPERT
            </text>
            <path d={starPath(125, 66, 15)} fill={C.ink} />
            <path d={starPath(125, 184, 11)} fill={C.ink} />
          </svg>
        </div>
      ) : null}
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 8 · "conquistar confiabilidade das pessoas" — etapa 3/5
// ======================================================================
const Confianca: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 12);
  const prog = interpolate(g, [MK.i_conseguindo - 4, MK.confiabilidade + 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const full = pop(g, MK.confiabilidade + 12, 12);
  const R = 132;
  const CIRC = 2 * Math.PI * R;
  const people = Array.from({length: 8}, (_, i) => {
    const ang = -Math.PI / 2 + ((i + 0.5) / 8) * Math.PI * 2;
    return {x: 540 + Math.cos(ang) * 400, y: 560 + Math.sin(ang) * 190, hue: (i * 45 + 10) % 360};
  });
  return (
    <Bg>
      <Stepper active={3} f={f} />
      {people.map((p, i) => {
        const at = MK.confiabilidade - 6 + i * 4;
        const lit = pop(g, at, 11);
        return (
          <div key={i} style={{position: 'absolute', left: p.x - 46, top: p.y - 46, opacity: a * (0.5 + lit * 0.5), scale: String(0.9 + lit * 0.12)}}>
            <Avatar size={92} hue={p.hue} dim={1 - lit} ring={lit > 0.1 ? C.gold : 'rgba(255,255,255,0.28)'} ringW={4} />
            {lit > 0 ? (
              <div style={{position: 'absolute', left: 58, top: -24, scale: String(lit), opacity: interpolate(g, [at + 26, at + 40], [1, 0], clamp)}}>
                <Icon n="heart" size={40} color={C.red} fill={C.red} w={2} />
              </div>
            ) : null}
          </div>
        );
      })}
      <svg width={1080} height={1010} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
        <circle cx={540} cy={560} r={R} fill="rgba(14,19,34,0.92)" stroke="rgba(255,255,255,0.12)" strokeWidth={24} />
        <circle cx={540} cy={560} r={R} fill="none" stroke={C.gold} strokeWidth={24} strokeLinecap="round" strokeDasharray={`${CIRC * prog} ${CIRC}`} transform="rotate(-90 540 560)" style={{filter: `drop-shadow(0 0 ${14 * prog}px rgba(255,200,61,0.8))`}} />
      </svg>
      <div style={{position: 'absolute', left: 540 - 62, top: 560 - 62, opacity: a, scale: String(1 + full * 0.12)}}>
        <Icon n="shield" size={124} color={prog > 0.97 ? C.gold : 'rgba(255,255,255,0.75)'} w={2.6} />
      </div>
      <Grain />
    </Bg>
  );
};

// ======================================================================
// 9 · "captar clientes pro seu portfólio, ter cases de sucesso" — etapa 4/5
// ======================================================================
const Notif: React.FC<{x: number; y: number; w: number; h: number; on: number; children: React.ReactNode}> = ({x, y, w, h, on, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 16,
      background: 'rgba(10,14,24,0.94)',
      border: `2px solid ${on > 0.5 ? 'rgba(61,220,151,0.9)' : 'rgba(255,255,255,0.18)'}`,
      boxShadow: on > 0.5 ? '0 0 22px rgba(61,220,151,0.45)' : '0 8px 20px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}
  >
    {/* esqueleto enquanto a notificação não chega */}
    <div style={{position: 'absolute', inset: 0, opacity: 1 - on, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px'}}>
      <div style={{width: 34, height: 34, borderRadius: 34, background: 'rgba(255,255,255,0.14)'}} />
      <div>
        <div style={{width: w * 0.45, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.2)'}} />
        <div style={{width: w * 0.3, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.12)', marginTop: 8}} />
      </div>
    </div>
    <div style={{position: 'absolute', inset: 0, opacity: on, translate: `${(1 - on) * -20}px 0`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px'}}>{children}</div>
  </div>
);

const Clientes: SceneFC = ({from, dur, vh}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const l = (m: number) => m - from;
  const keys: CamKey[] = [
    {f: 0, z: 1.12, cx: 440, cy: 400},
    {f: l(MK.captar), z: 1.2, cx: 420, cy: 388},
    {f: dur, z: 1.3, cx: 385, cy: 380},
  ];
  const n1 = ramp(g, MK.captar - 2, 8);
  const n2 = ramp(g, MK.clientes - 2, 8);
  const pf = ramp(g, MK.portfólio - 2, 8);
  const cs = ramp(g, MK.cases - 2, 8);
  const txt: React.CSSProperties = {fontFamily: SANS, fontWeight: 800, fontSize: 20, color: C.white, lineHeight: 1.1, whiteSpace: 'nowrap'};
  const sub: React.CSSProperties = {fontFamily: SANS, fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3};
  const ok = (
    <div style={{width: 36, height: 36, borderRadius: 36, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
      <svg width={22} height={22} viewBox="0 0 48 48">
        <path d="M11 25 L20 34 L37 15" fill="none" stroke="#06281A" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <PhotoCam src="img/clientes.jpg" iw={941} ih={1672} vh={vh} keys={keys} f={f} filter="contrast(1.05) saturate(1.05)">
        {/* cartões nítidos por cima dos da ilustração */}
        <Notif x={126} y={256} w={284} h={150} on={Math.max(pf, cs)}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10, width: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, opacity: pf}}>
              <Icon n="folder" size={30} color={C.gold} w={4} />
              <div style={{...txt, fontSize: 21}}>Portfólio</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, opacity: cs, translate: `${(1 - cs) * -14}px 0`}}>
              <Icon n="trophy" size={30} color={C.gold} w={4} />
              <div>
                <div style={{...txt, fontSize: 21}}>Case de sucesso</div>
                <svg width={96} height={18} viewBox="0 0 96 18" style={{marginTop: 3}}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <path key={i} d={starPath(9 + i * 19, 9.5, 8.5)} fill={C.gold} />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </Notif>
        <Notif x={38} y={416} w={232} h={82} on={n1}>
          {ok}
          <div>
            <div style={txt}>Novo cliente</div>
            <div style={sub}>agora</div>
          </div>
        </Notif>
        <Notif x={38} y={506} w={232} h={82} on={n2}>
          {ok}
          <div>
            <div style={txt}>Novo cliente</div>
            <div style={sub}>agora</div>
          </div>
        </Notif>
      </PhotoCam>
      <Stepper active={4} f={f} shade />
      <Grain o={0.08} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 10 · "com o tempo você vai escalando o seu negócio" — a escada completa (tela cheia)
// ======================================================================
const Escada: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const a = ramp(f, 0, 12);
  const X0 = 78;
  const W = 185;
  const BASE = 1420;
  const top = (i: number) => 1180 - i * 135;
  const big = pop(g, MK.escalando - 3, 12);
  const line = interpolate(f, [8, 8 + 5 * 7 + 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: 'blur(5px) brightness(0.34) saturate(1.1)', scale: String(1.06 + f * 0.0004)}}>
        <Img src={staticFile('img/painel.jpg')} style={{width: 1080, height: 1920, objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,10,18,0.75) 0%, rgba(7,10,18,0.25) 40%, rgba(7,10,18,0.85) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 262, textAlign: 'center', opacity: a}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: '0.24em', color: C.gold}}>A ESCADA DO DIGITAL</div>
        <div style={{fontFamily: COND, fontSize: 176, lineHeight: 1.05, marginTop: 14, letterSpacing: '0.02em', background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', scale: String(0.8 + big * 0.2), opacity: Math.min(1, big * 1.4), filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))'}}>
          ESCALAR
        </div>
      </div>
      {/* degraus */}
      {STEPS.map((s, i) => {
        const at = from + 8 + i * 7;
        const p = pop(g, at, 13);
        const last = i === 4;
        const glow = last ? big : 0;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: X0 + i * W + 6,
                top: top(i),
                width: W - 12,
                height: (BASE - top(i)) * p,
                borderRadius: '18px 18px 0 0',
                background: last ? GRAD : `linear-gradient(to bottom, rgba(255,200,61,${0.3 + i * 0.12}), rgba(255,200,61,0.06))`,
                border: `2px solid rgba(255,200,61,${0.5 + i * 0.1})`,
                borderBottom: 'none',
                boxShadow: glow ? `0 0 ${70 * glow}px rgba(255,200,61,0.7)` : 'none',
                opacity: Math.min(1, p * 1.5),
              }}
            >
              <div style={{fontFamily: COND, fontSize: 84, color: last ? C.ink : C.white, textAlign: 'center', marginTop: 14, opacity: 0.95}}>{i + 1}</div>
            </div>
            <div style={{position: 'absolute', left: X0 + i * W - 40, width: W + 80, top: top(i) - 62, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 25, letterSpacing: '0.03em', textTransform: 'uppercase', color: last ? C.gold : C.white, textShadow: '0 3px 12px rgba(0,0,0,0.8)', opacity: Math.min(1, p * 1.5), translate: `0 ${(1 - p) * 16}px`}}>
              {s}
            </div>
          </React.Fragment>
        );
      })}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M128 1090 L952 492" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} opacity={0.9} />
        {line > 0.97 ? <path d="M912 494 L952 492 L938 530" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: BASE, height: 4, background: 'rgba(255,200,61,0.5)'}} />
      <Grain o={0.08} />
    </AbsoluteFill>
  );
};

// ======================================================================
// 11 · as objeções: não gosto de me expor · falta ideia · falta tempo
// ======================================================================
const Objecoes: SceneFC = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const head = pop(g, from + 2, 13);
  const rows = [
    {at: MK.gostam - 3, n: 'camoff', t: 'Não gosto de me expor'},
    {at: MK.acham - 3, n: 'bulb', t: 'Falta ideia de conteúdo'},
    {at: MK.faltaTempo - 3, n: 'clock', t: 'Falta tempo'},
  ];
  const endAt = MK.disponibilidade + 16;
  const hint = pop(g, endAt, 12);
  return (
    <Bg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 238, display: 'flex', justifyContent: 'center', scale: String(head), opacity: Math.min(1, head * 1.4)}}>
        <Chip tone="red" style={{fontSize: 32, fontWeight: 900}}>Qual é a sua maior objeção?</Chip>
      </div>
      {rows.map((r, i) => {
        const p = pop(g, r.at, 13);
        if (p <= 0) return null;
        const next = rows[i + 1]?.at ?? endAt;
        const active = g < next;
        const allOn = g >= endAt;
        const on = active || allOn;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 80,
              top: 334 + i * 132,
              width: 920,
              height: 114,
              borderRadius: 30,
              background: on ? 'rgba(255,200,61,0.16)' : 'rgba(18,24,42,0.94)',
              border: `3px solid ${on ? C.gold : 'rgba(255,255,255,0.16)'}`,
              boxShadow: active && !allOn ? '0 0 44px rgba(255,200,61,0.35)' : '0 12px 30px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '0 26px',
              scale: String(0.9 + p * 0.1),
              opacity: Math.min(1, p * 1.5),
              translate: `${(1 - p) * -40}px 0`,
            }}
          >
            <div style={{width: 72, height: 72, borderRadius: 72, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: COND, fontSize: 46, color: C.ink, flexShrink: 0}}>{i + 1}</div>
            <div style={{flexShrink: 0}}>{r.n === 'clock' ? <Clock size={50} color={C.white} p={f / 40} /> : <Icon n={r.n} size={50} color={C.white} w={3.2} />}</div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.white, whiteSpace: 'nowrap', letterSpacing: '-0.01em'}}>{r.t}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 738, display: 'flex', justifyContent: 'center', scale: String(hint), opacity: Math.min(1, hint * 1.4)}}>
        <Chip tone="gold" style={{fontSize: 34, fontWeight: 900}}>
          <Icon n="comment" size={34} color={C.ink} w={4.4} />
          Comenta 1, 2 ou 3
        </Chip>
      </div>
      <Grain />
    </Bg>
  );
};

export const SCENES: Record<string, SceneFC> = {
  jornada: Jornada,
  dinheiro: Dinheiro,
  produtos: Produtos,
  seguidores: Seguidores,
  portas: Portas,
  vitrine: Vitrine,
  autoridade: Autoridade,
  confianca: Confianca,
  clientes: Clientes,
  escada: Escada,
  objecoes: Objecoes,
};
