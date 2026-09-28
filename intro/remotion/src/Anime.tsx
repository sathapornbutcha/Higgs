import React from 'react';
import {AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, Grain, Layer, ORANGE, PURPLE, Shine, Sprite, beatPulse, clamp, decay, eInOut, eOut, springT} from './lib';

// Anime opening: pans across details, an eye glint, a diagonal split-screen hero pose and a sliding title.
export const AN = {eyes: 1.0, hero: 1.6, text: 2.1, out: 4.7, end: 5.5};
export const AN_BEATS = [2.4, 2.9, 3.4, 3.9, 4.4];

const Radial: React.FC<{t: number; color: string; inner?: number; seed: string; spin?: number}> = ({t, color, inner = 380, seed, spin = 0}) => (
  <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
    {new Array(90).fill(0).map((_, i) => {
      const r = random(`${seed}${i}${Math.floor(t * 20)}`);
      const a = (i / 90) * Math.PI * 2 + spin * t + r * 0.03;
      const ri = inner + r * 250, wo = 0.006 + 0.012 * random(`${seed}w${i}`);
      return <polygon key={i} fill={color}
        points={`${960 + 1400 * Math.cos(a - wo)},${540 + 1400 * Math.sin(a - wo)} ${960 + ri * Math.cos(a)},${540 + ri * Math.sin(a)} ${960 + 1400 * Math.cos(a + wo)},${540 + 1400 * Math.sin(a + wo)}`} />;
    })}
  </svg>
);

const Petals: React.FC<{t: number; count?: number}> = ({t, count = 16}) => (
  <>
    {new Array(count).fill(0).map((_, i) => {
      const x = ((random(`px${i}`) * 2200 - t * (160 + 120 * random(`pv${i}`))) % 2200 + 2200) % 2200 - 140;
      const y = ((random(`py${i}`) * 1200 + t * (90 + 80 * random(`pw${i}`))) % 1200) - 60;
      const src = i % 3 === 0 ? 'ear_fluff_01' : i % 3 === 1 ? 'effect_08' : 'ear_fluff_02';
      return <Sprite key={i} src={src} x={x} y={y} w={40 + 50 * random(`ps${i}`)} rot={t * 120 * (random(`pr${i}`) - 0.5) + i * 40} opacity={0.85} />;
    })}
  </>
);

const Glint: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  const r = 70 * s, w = r * 0.1;
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
      <path fill="white" style={{filter: 'drop-shadow(0 0 12px white)'}}
        d={`M${x},${y - r} L${x + w},${y - w} L${x + r},${y} L${x + w},${y + w} L${x},${y + r} L${x - w},${y + w} L${x - r},${y} L${x - w},${y - w} Z`} />
    </svg>
  );
};

const Shots: React.FC<{t: number}> = ({t}) => {
  if (t < AN.eyes) {
    const p = t / AN.eyes;
    return (
      <AbsoluteFill style={{background: 'linear-gradient(160deg, #5b1fb0 0%, #c04fd0 45%, #ff9a3c 100%)'}}>
        <Radial t={t} color="rgba(255,255,255,0.18)" inner={500} seed="a1" />
        <Sprite src="cloth_01" x={1900 - 2400 * eInOut(p)} y={260} w={1300} rot={-10 + 20 * p} opacity={0.95} />
        <Sprite src="ear_left" x={520 + 140 * p} y={560 - 40 * Math.sin(p * 3)} w={900} rot={-18 + 14 * p} filter="drop-shadow(0 20px 30px rgba(40,0,80,0.45))" />
        <Sprite src="ear_right" x={1420 - 140 * p} y={520 + 40 * Math.sin(p * 3)} w={940} rot={14 - 12 * p} filter="drop-shadow(0 20px 30px rgba(40,0,80,0.45))" />
        <Petals t={t} />
      </AbsoluteFill>
    );
  }
  if (t < AN.hero) {
    const p = (t - AN.eyes) / (AN.hero - AN.eyes);
    const z = 1 + 0.35 * eInOut(p);
    const g = Math.sin(Math.PI * clamp((t - AN.eyes - 0.2) / 0.3));
    return (
      <AbsoluteFill style={{background: 'radial-gradient(circle, #43157e, #120420 75%)'}}>
        <Radial t={t} color="rgba(255,255,255,0.12)" inner={300} seed="a2" spin={0.3} />
        <AbsoluteFill style={{transform: `scale(${z})`}}>
          <Sprite src="eye_left" x={700} y={540} w={420} rot={-6} filter={`drop-shadow(0 0 30px rgba(${PURPLE},0.9))`} />
          <Sprite src="eye_right" x={1220} y={540} w={420} rot={6} filter={`drop-shadow(0 0 30px rgba(${PURPLE},0.9))`} />
          <Sprite src="face_mark" x={1460} y={420} w={200} rot={t * 90} opacity={0.9} />
          {g > 0 && <><Glint x={640} y={470} s={g} /><Glint x={1160} y={470} s={g} /></>}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return null;
};

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < AN.hero) return null;
  const tau = t - AN.hero;
  const slide = eOut(clamp(tau / 0.3));
  const beat = beatPulse(t, AN_BEATS, 0.025);
  const float = 10 * Math.sin((2 * Math.PI * t) / 2) * clamp((t - 2.2) / 0.4);
  const out = eInOut(clamp((t - AN.out) / 0.5));
  const outline = 'drop-shadow(4px 0 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(0 -4px 0 white)';
  return (
    <Layer src="character" x={960 + 900 * (1 - slide)} y={430 + 500 * (1 - slide) + float - 900 * out} w={700} aspect={ASPECT.character}
      transform={`rotate(${(1 - slide) * -14 + 2 * Math.sin(t)}deg) scale(${(1.15 - 0.15 * clamp(tau / 0.6)) * (1 + beat)})`}
      filter={`${outline} drop-shadow(0 0 ${26 + 70 * beat}px rgba(${PURPLE},0.8)) drop-shadow(0 24px 30px rgba(40,0,80,0.5))`} />
  );
};

const Title: React.FC<{t: number}> = ({t}) => {
  if (t < AN.text) return null;
  const p = springT(t - AN.text, 9, 18);
  const beat = beatPulse(t, AN_BEATS, 0.02);
  const out = eInOut(clamp((t - AN.out) / 0.5));
  return (
    <Layer src="logo_text" x={960 - 1500 * (1 - clamp(p, 0, 1.2)) + 1800 * out} y={870} w={880} aspect={ASPECT.logo_text}
      transform={`skewX(${(1 - p) * 30}deg) scale(${1 + beat})`} opacity={clamp(p * 4)}
      filter={`drop-shadow(5px 0 0 white) drop-shadow(-5px 0 0 white) drop-shadow(0 5px 0 white) drop-shadow(0 -5px 0 white) drop-shadow(0 16px 20px rgba(40,0,80,0.5))`}>
      <Shine src="logo_text" t={t} at={[2.9, 4.0]} />
    </Layer>
  );
};

const HeroBg: React.FC<{t: number}> = ({t}) => {
  if (t < AN.hero) return null;
  const split = eOut(clamp((t - AN.hero) / 0.25));
  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, rgb(${PURPLE}) 0%, rgb(${PURPLE}) 49.6%, white 49.6%, white 50.4%, rgb(${ORANGE}) 50.4%, rgb(${ORANGE}) 100%)`,
      clipPath: `circle(${150 * split}% at 50% 50%)`}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0 1.5px, transparent 2px) 0 0 / 22px 22px', opacity: 0.6}} />
      <Radial t={t} color="rgba(20,5,40,0.35)" inner={560} seed="a3" />
      <Petals t={t} count={12} />
    </AbsoluteFill>
  );
};

export const Anime: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cut = [AN.eyes, AN.hero].some((c) => t >= c && t < c + 1 / 30) ? 0.9 : 0;
  const flash = Math.max(cut, 0.5 * decay(t, AN.hero, 16));
  const amp = 22 * decay(t, AN.hero + 0.25, 10) + 10 * decay(t, AN.text + 0.15, 12);
  const white = clamp((t - AN.out - 0.35) / 0.3);
  const black = clamp((t - AN.end + 0.18) / 0.12);
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_anime.wav')} />
      <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${amp * Math.cos(t * 83)}px) scale(${1 + 0.05 * clamp((t - AN.hero) / 3)})`}}>
        <CameraMotionBlur shutterAngle={200} samples={4}>
          <Shots t={t} />
        </CameraMotionBlur>
        <HeroBg t={t} />
        <CameraMotionBlur shutterAngle={200} samples={4}>
          <Hero />
        </CameraMotionBlur>
        <Title t={t} />
      </AbsoluteFill>
      <Grain frame={frame} opacity={0.05} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: Math.max(flash, white)}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: black}} />
    </AbsoluteFill>
  );
};
