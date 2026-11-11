import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './fonts';
import {Captions} from './components/Captions';
import {ARoll, Cine, Finish, PiP, Voice} from './components/Layers';
import {
  ApartamentoSonho,
  Arrependimento,
  Bastidores,
  Conceitos,
  DirectPill,
  EndCard,
  FictionLabel,
  GanharChart,
  HookDream,
  MesesCard,
  MeSegue,
  ModoAssessor,
  Perguntas,
  PresoMini,
  SeriesTag,
  SeriesTitle,
  SonhoOverlay,
  Vault,
} from './components/Motion';
import {MK, SPEECH_END, T, TOTAL} from './timeline';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);

// Cena = trecho com componente próprio. "from/to" em frames globais.
const Scene: React.FC<{name: string; from: number; to: number; children: React.ReactNode}> = ({name, from, to, children}) => (
  <Sequence name={name} from={from} durationInFrames={Math.max(1, to - from)} premountFor={30}>
    {children}
  </Sequence>
);

const Fx: React.FC<{n: string; at: number; v: number; dur?: number}> = ({n, at, v, dur = 45}) => (
  <Sequence name={`sfx ${n}`} from={Math.max(0, at)} durationInFrames={dur} layout="none">
    <Audio src={sfx(n)} volume={v} />
  </Sequence>
);

export const Ep02: React.FC = () => {
  const casalTo = MK.doer9 - 2;
  return (
    <AbsoluteFill style={{backgroundColor: '#070E1E'}}>
      {/* rosto (base) + identidade "modo assessor" */}
      <ARoll />
      <Scene name="Modo assessor" from={T(7)} to={T(12)}>
        <ModoAssessor from={T(7)} to={T(12)} />
      </Scene>
      <Scene name="Título do quadro" from={T(7) - 2} to={T(8)}>
        <SeriesTitle from={T(7) - 2} to={T(8)} profissao="assessor de investimentos" />
      </Scene>
      <Scene name="Ganhar dinheiro é ótimo" from={MK.ganhar9} to={MK.agora9}>
        <GanharChart from={MK.ganhar9} to={MK.agora9} />
      </Scene>

      {/* ===== HISTÓRIA ===== */}
      <Scene name="Gancho · rende × perde" from={MK.conseguiu1} to={T(2)}>
        <HookDream from={MK.conseguiu1} />
      </Scene>
      <Scene name="5 anos economizando" from={T(3)} to={T(4)}>
        <Cine src="img/sonho.jpg" dur={T(4) - T(3)} from={{s: 1.04, x: 0, y: 10}} to={{s: 1.16, x: -30, y: 40}} />
        <SonhoOverlay from={T(3)} />
      </Scene>
      <Scene name="Dinheiro preso" from={MK.aplicacao4} to={T(5)}>
        <Vault from={MK.aplicacao4} />
      </Scene>
      <Scene name="3 meses depois" from={T(5)} to={MK.apareceu5}>
        <MesesCard from={T(5)} to={MK.apareceu5} />
      </Scene>
      <Scene name="O imóvel perfeito" from={MK.apareceu5} to={T(6)}>
        <ApartamentoSonho from={MK.apareceu5} dur={T(6) - MK.apareceu5} />
      </Scene>
      <Scene name="Arrependimento" from={T(6) - 4} to={T(7) - 2}>
        <Arrependimento from={T(6) - 4} to={T(7) - 2} />
      </Scene>

      {/* ===== ASSESSOR (faz de conta) ===== */}
      <Scene name="Duas perguntas" from={T(8)} to={T(9)}>
        <Cine src="img/assessor_graficos.jpg" dur={T(9) - T(8)} from={{s: 1.05, x: 10, y: 0}} to={{s: 1.14, x: -20, y: -30}} />
        <Perguntas from={T(8)} />
        <PiP from={T(8)} />
      </Scene>
      <Scene name="A oportunidade passando" from={MK.agora9} to={casalTo}>
        <Cine src="img/casal_vendido.jpg" dur={casalTo - MK.agora9} from={{s: 1.04, x: 0, y: 0}} to={{s: 1.14, x: 20, y: 30}} grade="contrast(1.05) saturate(0.6) brightness(0.85)" />
        <Sequence from={MK.dinheiro9b - MK.agora9} layout="none">
          <AbsoluteFill style={{backgroundColor: 'rgba(7,14,30,0.45)'}} />
          <PresoMini from={MK.dinheiro9b} to={casalTo} />
        </Sequence>
      </Scene>
      <Scene name="Um bom assessor" from={T(10)} to={T(11)}>
        <Cine src="img/assessor_tablet.jpg" dur={T(11) - T(10)} from={{s: 1.05, x: 0, y: 0}} to={{s: 1.15, x: 20, y: -20}} />
        <PiP from={T(10)} />
      </Scene>
      <Scene name="Objetivo, prazo e liquidez" from={T(11)} to={T(12)}>
        <Cine src="img/assessor_plano.jpg" dur={T(12) - T(11)} w={2880} h={1920} from={{s: 1.0, x: -80, y: 0}} to={{s: 1.06, x: -860, y: 0}} rot={0} />
        <Conceitos from={T(11)} />
      </Scene>

      {/* ===== PLOT TWIST + BASTIDORES ===== */}
      <Scene name="Bastidores" from={T(13) - 4} to={T(14) + 4}>
        <Bastidores from={T(13) - 4} to={T(14) + 4} />
      </Scene>
      <Scene name="Me segue" from={T(14)} to={T(15)}>
        <MeSegue from={T(14)} to={T(15)} />
      </Scene>
      <Scene name="Direct" from={T(15)} to={SPEECH_END}>
        <DirectPill from={T(15)} />
      </Scene>

      {/* rótulos */}
      <Scene name="Selo da série" from={0} to={T(2)}>
        <SeriesTag from={0} to={T(2)} />
      </Scene>
      <Scene name="Simulação fictícia (história)" from={T(3)} to={T(7) - 14}>
        <FictionLabel from={T(3)} to={T(7) - 14} />
      </Scene>
      <Scene name="Simulação fictícia (assessor)" from={T(8)} to={T(12)}>
        <FictionLabel from={T(8)} to={T(12)} side="right" />
      </Scene>

      <Captions />

      <Scene name="Encerramento" from={SPEECH_END} to={TOTAL}>
        <EndCard from={SPEECH_END} />
      </Scene>
      <Finish />

      {/* ===== SOM ===== */}
      <Voice />
      {[MK.conseguiu1, T(3), MK.aplicacao4, T(5), MK.apareceu5, T(6) - 4, T(8), MK.agora9, T(10), T(11), T(13) - 4, SPEECH_END].map((f, i) => (
        <Fx key={`w${i}`} n="whoosh" at={f - 3} v={0.12} dur={20} />
      ))}
      <Fx n="boom" at={MK.perdeu1 - 2} v={0.3} />
      <Fx n="stamp" at={MK.sonhos1 - 1} v={0.28} dur={20} />
      <Fx n="ticks" at={MK.anos3} v={0.1} dur={50} />
      <Fx n="ticks" at={MK.resgatar4 - 2} v={0.1} dur={40} />
      <Fx n="lock" at={MK.dois4 + 2} v={0.45} dur={20} />
      <Fx n="ticks" at={T(5)} v={0.12} dur={20} />
      <Fx n="lock" at={MK.tinha5} v={0.35} dur={20} />
      <Fx n="boom" at={MK.nao5 - 1} v={0.32} />
      <Fx n="stamp" at={MK.outra6} v={0.22} dur={20} />
      <Fx n="riser" at={T(7) - 38} v={0.16} dur={40} />
      <Fx n="shine" at={MK.assessor7 - 2} v={0.22} dur={30} />
      {[MK.viagens3, MK.restaurantes3, MK.oitenta3, MK.qual8, MK.quando8, MK.investir11, MK.planos11, MK.rendimentos11, MK.transformar13, MK.tecnico13, MK.historia13, MK.interesse13, MK.importancia13].map((f, i) => (
        <Fx key={`p${i}`} n="pop" at={f - 2} v={0.12} dur={10} />
      ))}
      <Fx n="lock" at={MK.preso9 - 2} v={0.3} dur={20} />
      <Fx n="tapestop" at={T(12) - 3} v={0.28} dur={20} />
      <Fx n="shine" at={SPEECH_END + 4} v={0.2} dur={30} />
    </AbsoluteFill>
  );
};

