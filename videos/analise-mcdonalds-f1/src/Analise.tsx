import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './fonts';
import {Captions} from './components/Captions';
import {ARoll, FullCase, TopPanel, Voice} from './components/Layers';
import {ArcosTitle, Counter24, CtaPill, EndCard, HookKicker, LogoChips, ZoneChips} from './components/Overlays';
import {MK, SECTIONS, SPEECH_END, T, TOTAL} from './timeline';
import {C} from './theme';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);

const POPS = [
  'logo', 'oportunidade', 'circuitos24', 'arcos', 'rosto', 'pareidolia', 'vendas11', 'golden13', 'oferta13', 'perdeu15', 'chance15',
  'participante16', 'acompanhar17', 'abrir17', 'agir17', 'atencao18', 'urgencia18', 'recompensa18', 'p7', 'p23', 'p27', 'acao20', 'direct21',
];

export type AnaliseProps = {diagSemVoz?: boolean};

// diagSemVoz: só para conferência — desliga voz e efeitos, sobra apenas o que viria do vídeo do case (deve ser silêncio).
export const Analise: React.FC<AnaliseProps> = ({diagSemVoz = false}) => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <ARoll />
    <TopPanel />

    {SECTIONS.filter((s) => s.mode === 'full').map((s) => (
      <Sequence key={s.name} name={`Tela cheia · ${s.name}`} from={s.from} durationInFrames={s.to - s.from} premountFor={30}>
        <FullCase s={s} />
      </Sequence>
    ))}

    <Sequence name="Selo da análise" from={0} durationInFrames={T(2)}>
      <HookKicker />
    </Sequence>
    <Sequence name="Chips · logo / oportunidade" from={0} durationInFrames={T(5)}>
      <LogoChips />
    </Sequence>
    <Sequence name="24 circuitos" from={T(5)} durationInFrames={T(6) - T(5)} layout="none">
      <Sequence from={-T(5)} layout="none">
        <Counter24 />
      </Sequence>
    </Sequence>
    <Sequence name="Arcos dourados" from={T(6)} durationInFrames={T(7) - T(6)} layout="none">
      <Sequence from={-T(6)} layout="none">
        <ArcosTitle />
      </Sequence>
    </Sequence>
    <Sequence name="Chips · Golden Zone" from={0} durationInFrames={T(14)}>
      <ZoneChips />
    </Sequence>
    <Sequence name="CTA" from={0} durationInFrames={SPEECH_END}>
      <CtaPill />
    </Sequence>

    <Captions />

    <Sequence name="Encerramento" from={0} durationInFrames={TOTAL}>
      <EndCard from={SPEECH_END} />
    </Sequence>

    {diagSemVoz ? null : <Voice />}
    {/* Efeitos discretos (sintetizados, sem direitos de terceiros): whoosh nas trocas de layout, pop nos grafismos. */}
    {!diagSemVoz && SECTIONS.slice(1).map((s) => (
      <Sequence key={`w${s.from}`} name="whoosh" from={Math.max(0, s.from - 4)} durationInFrames={18} layout="none">
        <Audio src={sfx('whoosh')} volume={0.13} />
      </Sequence>
    ))}
    {!diagSemVoz && POPS.map((k) => (
      <Sequence key={`p${k}`} name={`pop ${k}`} from={Math.max(0, MK[k] - 2)} durationInFrames={8} layout="none">
        <Audio src={sfx('pop')} volume={0.14} />
      </Sequence>
    ))}
    {diagSemVoz ? null : (
      <Sequence name="relógio da oferta" from={MK.oferta14} durationInFrames={50} layout="none">
        <Audio src={sfx('ticks')} volume={0.1} />
      </Sequence>
    )}
  </AbsoluteFill>
);
