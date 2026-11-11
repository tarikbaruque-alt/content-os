import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BEBAS, H, JOSEFIN, K, N, QUICK, SCRIPT, W} from './brand';
import {Arrow, CommentIcon, Dumbbell, Frustrated, Spark, Thought, Treadmill} from './Icons';

// O carrossel é desenhado como um panorama único (5 × 1080 px) e depois fatiado:
// a trilha pontilhada e o "?" gigante atravessam as bordas e convidam a arrastar.

const at = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({position: 'absolute', left: x, top: y, ...extra});

const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${staticFile('grain.png')})`,
      backgroundSize: '380px 380px',
      opacity: 0.2,
      mixBlendMode: 'overlay',
      pointerEvents: 'none',
    }}
  />
);

// ---------- Cabeçalho da identidade ----------
const Header: React.FC<{light?: boolean}> = ({light}) => (
  <>
    <div style={at(160, 136, {height: 70, display: 'flex', alignItems: 'center', gap: 18})}>
      <Img src={staticFile('img/logo.png')} style={{width: 68, height: 68, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))'}} />
      <span style={{fontFamily: JOSEFIN, fontWeight: 700, fontSize: 48, color: light ? K.ink : K.cream, paddingTop: 10, letterSpacing: '0.005em'}}>Dr. Bruno Sá</span>
    </div>
    <div
      style={at(642, 136, {
        width: 278,
        height: 70,
        borderRadius: 35,
        background: K.ink,
        color: K.cream,
        fontFamily: QUICK,
        fontWeight: 600,
        fontSize: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      Cuidado sob medida
    </div>
  </>
);

const spaced = (size: number, color: string, ls = '0.2em'): React.CSSProperties => ({
  fontFamily: QUICK,
  fontWeight: 700,
  fontSize: size,
  letterSpacing: ls,
  textTransform: 'uppercase',
  color,
  lineHeight: 1.45,
});

const Mark: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = K.sage}) => (
  <span style={{background: `linear-gradient(180deg, transparent 52%, ${color} 52%, ${color} 92%, transparent 92%)`, padding: '0 6px', margin: '0 -6px', borderRadius: 6}}>{children}</span>
);

// ================= SLIDE 1 · CAPA =================
const Slide1: React.FC = () => (
  <>
    <div style={at(40, 56, {display: 'flex', alignItems: 'center', gap: 22})}>
      <Img src={staticFile('img/logo.png')} style={{width: 88, height: 88, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'}} />
      <div style={{color: K.cream}}>
        <div style={{fontFamily: QUICK, fontWeight: 600, fontSize: 38, lineHeight: 1.1}}>Dr. Bruno Sá</div>
        <div style={{fontFamily: QUICK, fontWeight: 500, fontSize: 21, marginTop: 6, opacity: 0.95}}>Acupuntura e Fisioterapia</div>
      </div>
    </div>

    <div style={at(60, 262, {background: K.sage, color: K.ink, fontFamily: QUICK, fontWeight: 700, fontSize: 40, padding: '10px 34px 12px', borderRadius: 40})}>POV:</div>
    <div style={at(62, 362, spaced(31, K.cream))}>
      você recebeu alta da fisioterapia
      <br />e voltou para a
    </div>
    <div style={at(48, 452, {fontFamily: BEBAS, fontSize: 296, lineHeight: 0.86, color: K.cream, letterSpacing: '0.005em'})}>ACADEMIA</div>
    <div style={at(492, 650, {fontFamily: SCRIPT, fontSize: 150, color: K.leaf, rotate: '-7deg', lineHeight: 1, textShadow: '0 8px 24px rgba(30,40,24,0.25)'})}>sozinho.</div>

    <div style={at(90, 900, {rotate: '-9deg'})}>
      <Dumbbell w={600} />
    </div>

    <div
      style={at(612, 1300, {
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: K.ink,
        color: K.cream,
        fontFamily: QUICK,
        fontWeight: 600,
        fontSize: 30,
        padding: '20px 30px 22px 36px',
        borderRadius: 50,
        boxShadow: '0 12px 30px rgba(20,28,16,0.3)',
      })}
    >
      Arrasta para o lado <Arrow w={46} />
    </div>
  </>
);

// ================= SLIDE 2 · A PRIMEIRA DÚVIDA =================
const Machine: React.FC<{w?: number; color?: string}> = ({w = 300, color = K.greenDark}) => (
  // puxador (pulley) em traço
  <svg width={w} height={(w * 320) / 300} viewBox="0 0 300 320" style={{overflow: 'visible'}}>
    <g fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="14" y1="306" x2="290" y2="306" />
      <rect x="206" y="14" width="56" height="292" rx="10" />
      {[150, 178, 206, 234, 262].map((y) => (
        <line key={y} x1="218" y1={y} x2="250" y2={y} />
      ))}
      <line x1="234" y1="40" x2="234" y2="138" strokeWidth="5" />
      <path d="M206 30 L70 30" />
      <circle cx="70" cy="44" r="13" />
      <line x1="70" y1="57" x2="70" y2="128" strokeWidth="5" />
      <path d="M18 142 Q70 124 122 142" />
      <path d="M70 306 L70 236" />
      <path d="M28 232 L118 232" strokeWidth="14" />
      <path d="M70 232 L70 196" />
      <circle cx="54" cy="190" r="11" />
      <circle cx="86" cy="190" r="11" />
    </g>
  </svg>
);

const Slide2: React.FC = () => (
  <>
    <Header light />
    <div style={at(80, 292, spaced(30, K.greenDark))}>Primeiro dia de volta.</div>
    <div style={at(80, 356, {width: 640, fontFamily: JOSEFIN, fontWeight: 600, fontSize: 52, lineHeight: 1.16, color: K.ink})}>Você olha para o aparelho e pensa:</div>
    <div style={at(780, 318)}>
      <Thought size={170} />
    </div>
    <div style={at(64, 520, {fontFamily: SCRIPT, fontSize: 250, lineHeight: 1, color: K.green})}>“</div>
    <div style={at(80, 650, {width: 900, fontFamily: JOSEFIN, fontWeight: 700, fontSize: 96, lineHeight: 1.08, color: K.ink, letterSpacing: '-0.01em'})}>
      Será que eu
      <br />
      <Mark>já posso</Mark> fazer
      <br />
      esse exercício?
    </div>
    <div style={at(84, 1000, {opacity: 0.92})}>
      <Machine w={250} />
    </div>
    <div style={at(380, 1196, {fontFamily: QUICK, fontWeight: 600, fontSize: 30, color: K.greenDark, width: 560, lineHeight: 1.3})}>
      O aparelho é o mesmo de antes.
      <br />O seu corpo, nem tanto.
    </div>
  </>
);

// ================= SLIDE 3 · A INSEGURANÇA =================
const Phone: React.FC = () => (
  <div
    style={{
      width: 350,
      height: 700,
      borderRadius: 54,
      background: '#1C2418',
      padding: 12,
      boxShadow: '0 40px 80px rgba(20,28,16,0.45), inset 0 0 0 2px rgba(255,255,255,0.08)',
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: 43, background: '#F6F4EC', overflow: 'hidden', position: 'relative', fontFamily: QUICK}}>
      <div style={{position: 'absolute', left: '50%', top: 12, width: 104, height: 28, borderRadius: 20, background: '#1C2418', translate: '-50% 0'}} />
      <div style={{position: 'absolute', left: 26, top: 14, fontWeight: 700, fontSize: 17, color: K.ink}}>9:41</div>
      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          top: 58,
          height: 50,
          borderRadius: 25,
          background: '#FFFFFF',
          border: '2px solid #DDE3D2',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          fontWeight: 600,
          fontSize: 17,
          color: K.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke={K.greenDark} strokeWidth="2.6" />
          <line x1="13" y1="13" x2="18" y2="18" stroke={K.greenDark} strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        exercício pós-fisio joelho
      </div>
      <div style={{position: 'absolute', left: 18, right: 18, top: 126, height: 186, borderRadius: 18, background: `linear-gradient(135deg, #93AD78, #5B7445)`, overflow: 'hidden'}}>
        <svg width="314" height="186" viewBox="0 0 314 186" style={{position: 'absolute', inset: 0}}>
          <g stroke="rgba(251,248,238,0.55)" strokeWidth="7" strokeLinecap="round" fill="none">
            <circle cx="84" cy="52" r="13" fill="rgba(251,248,238,0.55)" stroke="none" />
            <path d="M84 68 L80 110 L108 136 L104 168" />
            <path d="M80 110 L54 132 L60 168" />
            <path d="M82 80 L118 88" />
            <line x1="30" y1="170" x2="150" y2="170" />
          </g>
        </svg>
        <div style={{position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%', width: 66, height: 66, borderRadius: 66, background: 'rgba(251,248,238,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="26" height="28" viewBox="0 0 26 28">
            <path d="M4 2 L24 14 L4 26 Z" fill={K.ink} />
          </svg>
        </div>
        <div style={{position: 'absolute', right: 10, bottom: 10, background: 'rgba(20,28,16,0.8)', color: '#fff', fontWeight: 700, fontSize: 14, padding: '3px 8px', borderRadius: 6}}>12:04</div>
      </div>
      <div style={{position: 'absolute', left: 20, right: 20, top: 324, fontWeight: 700, fontSize: 19, lineHeight: 1.25, color: K.ink}}>5 exercícios para voltar à academia depois da lesão</div>
      <div style={{position: 'absolute', left: 20, top: 378, fontWeight: 600, fontSize: 14, color: '#7C8771'}}>1,2 mi visualizações · há 2 anos</div>
      {[0, 1].map((i) => (
        <div key={i} style={{position: 'absolute', left: 18, right: 18, top: 420 + i * 118, height: 100, display: 'flex', gap: 14}}>
          <div style={{width: 150, height: 96, borderRadius: 12, background: i ? 'linear-gradient(135deg,#B9C9A2,#7F9867)' : 'linear-gradient(135deg,#A7BB8F,#66804F)'}} />
          <div style={{flex: 1, paddingTop: 6}}>
            <div style={{height: 13, borderRadius: 7, background: '#CBD3BE', width: '95%'}} />
            <div style={{height: 13, borderRadius: 7, background: '#CBD3BE', width: '70%', marginTop: 10}} />
            <div style={{height: 10, borderRadius: 7, background: '#E1E6D8', width: '50%', marginTop: 14}} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Slide3: React.FC = () => (
  <>
    <Header />
    <div style={at(80, 292, {width: 920, fontFamily: JOSEFIN, fontWeight: 600, fontSize: 52, lineHeight: 1.16, color: K.cream})}>Você pega o celular, procura um vídeo e pensa:</div>
    <div style={at(96, 470, {rotate: '-6deg'})}>
      <Phone />
    </div>
    <div style={at(506, 404, {fontFamily: SCRIPT, fontSize: 210, lineHeight: 1, color: K.leaf})}>“</div>
    <div style={at(520, 560, {width: 500, fontFamily: JOSEFIN, fontWeight: 700, fontSize: 58, lineHeight: 1.14, color: K.cream})}>
      Mas será que esse exercício serve para o
    </div>
    <div style={at(516, 836, {fontFamily: BEBAS, fontSize: 236, lineHeight: 0.84, color: K.leaf})}>
      MEU
      <br />
      CASO?
    </div>
    <svg width="440" height="40" viewBox="0 0 440 40" style={at(522, 1236)}>
      <path d="M6 26 Q120 6 230 20 T434 14" fill="none" stroke={K.cream} strokeWidth="7" strokeLinecap="round" />
    </svg>
  </>
);

// ================= SLIDE 4 · A FRUSTRAÇÃO =================
const Slide4: React.FC = () => (
  <>
    <Header />
    <div style={at(80, 272, {fontFamily: BEBAS, fontSize: 196, lineHeight: 0.86, color: K.cream})}>VOCÊ TENTA.</div>
    <div style={at(82, 452, {fontFamily: BEBAS, fontSize: 118, lineHeight: 0.9, color: K.cream, display: 'flex', alignItems: 'center', gap: 18})}>
      SENTE UM <span style={{color: K.leaf}}>INCÔMODO.</span>
      <span style={{marginTop: -30}}>
        <Spark size={92} />
      </span>
    </div>
    <div style={at(80, 640, {fontFamily: BEBAS, fontSize: 92, lineHeight: 0.92, color: K.cream})}>
      ISSO É
      <br />
      NORMAL?
    </div>
    <div style={at(600, 640, {width: 400, textAlign: 'right', fontFamily: BEBAS, fontSize: 92, lineHeight: 0.92, color: K.cream})}>
      SERÁ QUE
      <br />
      DEVO PARAR?
    </div>
    <div style={at(470, 652)}>
      <Frustrated size={112} />
    </div>
    <div style={at(270, 836)}>
      <Treadmill w={520} />
    </div>
    <div style={at(80, 1184, {width: 920, textAlign: 'center', fontFamily: SCRIPT, fontSize: 64, lineHeight: 1.12, color: K.leaf})}>
      Na dúvida, melhor voltar
      <br />
      para a esteira...
    </div>
  </>
);

// ================= SLIDE 5 · SOLUÇÃO + CTA =================
const Slide5: React.FC<{photo: string}> = ({photo}) => (
  <>
    <Header />
    <div style={at(80, 276, {width: 940, fontFamily: JOSEFIN, fontWeight: 700, fontSize: 60, lineHeight: 1.12, color: K.cream})}>
      Receber alta não significa
      <br />
      ter que se virar <span style={{fontFamily: SCRIPT, fontWeight: 400, fontSize: 104, color: K.leaf, lineHeight: 0.8}}>sozinho.</span>
    </div>
    <div style={at(82, 470, {width: 920, fontFamily: QUICK, fontWeight: 600, fontSize: 34, lineHeight: 1.3, color: K.cream})}>
      Seu retorno aos treinos também merece <b style={{fontWeight: 700, color: K.leaf}}>orientação.</b>
    </div>

    <div style={at(52, 600, {width: 508, height: 640, borderRadius: 46, border: '2px solid rgba(251,248,238,0.45)'})} />
    <div style={at(72, 620, {width: 468, height: 600, borderRadius: 38, overflow: 'hidden', boxShadow: '0 30px 60px rgba(20,28,16,0.35)'})}>
      <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '42% 35%'}} />
    </div>

    <div style={at(600, 640, spaced(32, K.leaf, '0.3em'))}>Dia</div>
    <div style={at(594, 684, {fontFamily: BEBAS, fontSize: 214, lineHeight: 0.86, color: K.cream})}>16/11</div>
    <div style={at(604, 880, {fontFamily: SCRIPT, fontSize: 66, color: K.leaf, rotate: '-4deg'})}>abro meu</div>
    <div
      style={at(600, 1000, {
        background: `linear-gradient(135deg, ${K.brightA}, ${K.brightB})`,
        borderRadius: 30,
        padding: '20px 26px 14px',
        fontFamily: JOSEFIN,
        fontWeight: 700,
        fontSize: 36,
        lineHeight: 1.12,
        color: K.cream,
        boxShadow: '0 16px 36px rgba(30,60,20,0.35)',
      })}
    >
      ACOMPANHAMENTO
      <br />
      PÓS-FISIO
    </div>

    <div
      style={at(70, 1268, {
        width: 940,
        height: 104,
        borderRadius: 52,
        background: K.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        boxShadow: '0 18px 40px rgba(20,28,16,0.35)',
        fontFamily: QUICK,
        fontWeight: 600,
        fontSize: 34,
        color: K.cream,
      })}
    >
      <CommentIcon size={46} />
      <span style={{fontWeight: 700}}>Comente</span>
      <span style={{background: `linear-gradient(135deg, ${K.brightA}, ${K.brightB})`, fontFamily: BEBAS, fontSize: 56, lineHeight: 1, padding: '10px 22px 6px', borderRadius: 18, color: K.cream, letterSpacing: '0.04em'}}>TREINO</span>
      <span>para entrar na lista.</span>
    </div>
  </>
);

// ================= TRILHA pontilhada (perdido → orientado) =================
const Trail: React.FC = () => {
  const y = 1402;
  const d = [
    `M 1000 1362 C 1050 1362 1060 ${y} 1120 ${y}`,
    // slide 2: um laço (dúvida)
    `L 1330 ${y} C 1450 ${y} 1450 1330 1405 1330 C 1360 1330 1360 ${y} 1480 ${y}`,
    `L 2300 ${y}`,
    // slide 3: dois laços
    `C 2420 ${y} 2420 1335 2378 1335 C 2336 1335 2336 ${y} 2450 ${y}`,
    `C 2570 ${y} 2570 1335 2528 1335 C 2486 1335 2486 ${y} 2600 ${y}`,
    `L 3420 ${y}`,
    // slide 4: nó embolado (frustração)
    `C 3520 ${y} 3560 1330 3500 1338 C 3440 1346 3470 1420 3560 1400 C 3650 1380 3620 1320 3580 1340`,
    `C 3540 1360 3600 1425 3680 1395 C 3760 1365 3700 1325 3660 1350 C 3620 1375 3700 ${y} 3800 ${y}`,
    // slide 5: caminho reto até o fim
    `L 5300 ${y}`,
  ].join(' ');
  return (
    <svg width={W * N} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="trail" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W * N} y2="0">
          <stop offset={0} stopColor={K.cream} />
          <stop offset={1 / 5} stopColor={K.cream} />
          <stop offset={1 / 5} stopColor={K.green} />
          <stop offset={2 / 5} stopColor={K.green} />
          <stop offset={2 / 5} stopColor={K.cream} />
          <stop offset={1} stopColor={K.cream} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#trail)" strokeWidth={6} strokeDasharray="1 15" strokeLinecap="round" opacity={0.85} />
      <g transform={`translate(5300 ${y})`}>
        <circle r="26" fill={K.cream} />
        <path d="M-11 0 L-3 8 L12 -8" fill="none" stroke={K.brightB} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

// ================= PANORAMA =================
export const Panorama: React.FC<{photo?: string}> = ({photo = 'img/bruno.jpg'}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W * N, height: H, overflow: 'hidden'}}>
    {/* fundos */}
    <div style={at(0, 0, {width: W, height: H, background: `radial-gradient(ellipse at 18% 8%, #8AA571 0%, ${K.green} 46%, #667E50 100%)`})} />
    <div style={at(W, 0, {width: W, height: H, background: K.creamBg})}>
      <div style={at(70, 360, {width: 940, height: 940, borderRadius: 940, background: K.mint})} />
    </div>
    <div style={at(W * 2, 0, {width: W, height: H, background: `linear-gradient(180deg, #718A5A 0%, #5E7748 100%)`})} />
    <div style={at(W * 3, 0, {width: W, height: H, background: `radial-gradient(ellipse at 50% 62%, #536A3F 0%, #3B4B2D 78%)`})} />
    <div style={at(W * 4, 0, {width: W, height: H, background: `radial-gradient(ellipse at 82% 12%, #8BA670 0%, ${K.green} 48%, #687F52 100%)`})} />
    <Grain />

    {/* "?" gigante atravessando os slides 2 e 3 */}
    <div style={at(W * 2 - 268, 180, {fontFamily: BEBAS, fontSize: 1320, lineHeight: 1, color: 'rgba(150,180,118,0.32)'})}>?</div>
    <div style={at(W * 4 - 190, 1040, {fontFamily: BEBAS, fontSize: 380, lineHeight: 1, color: 'rgba(220,231,198,0.08)'})}>?!</div>

    <Trail />

    <div style={at(0, 0, {width: W, height: H})}>
      <Slide1 />
    </div>
    <div style={at(W, 0, {width: W, height: H})}>
      <Slide2 />
    </div>
    <div style={at(W * 2, 0, {width: W, height: H})}>
      <Slide3 />
    </div>
    <div style={at(W * 3, 0, {width: W, height: H})}>
      <Slide4 />
    </div>
    <div style={at(W * 4, 0, {width: W, height: H})}>
      <Slide5 photo={photo} />
    </div>
  </div>
);

export const SlideView: React.FC<{i: number; photo?: string}> = ({i, photo}) => (
  <AbsoluteFill style={{overflow: 'hidden', backgroundColor: K.green}}>
    <div style={{position: 'absolute', left: -i * W, top: 0}}>
      <Panorama photo={photo} />
    </div>
  </AbsoluteFill>
);
