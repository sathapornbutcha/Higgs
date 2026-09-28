import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Background} from './ClawReveal';

// Built from the cut-out elements in intro/elements (copied to public/el).
// Timeline (seconds). Keep in sync with make_audio_elements.py.
export const E = {portal: 0.15, burst: 0.7, text: 1.25, hold: 1.7, paw: 4.75, black: 5.55, end: 6.0};
export const BEATS = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5];
const PURPLE = '139,61,255';
const el = (n: string) => staticFile(`el/${n}.png`);
const COIN = ['coin_01', 'coin_02', 'coin_03', 'coin_04', 'coin_05', 'coin_06'];
const CHAR = {x: 960, y: 430, w: 680};
const TEXT = {x: 960, y: 860, w: 860};
const pawP = (t: number) => eIn(clamp((t - E.paw) / (E.black - E.paw)));

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eIn = (p: number) => p * p * p;
const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
const decay = (t: number, t0: number, k: number) => (t >= t0 ? Math.exp(-(t - t0) * k) : 0);

const Sprite: React.FC<{src: string; x: number; y: number; w: number; style?: React.CSSProperties; filter?: string}> = ({src, x, y, w, style, filter}) => (
  <Img src={el(src)} style={{position: 'absolute', left: x - w / 2, top: y, width: w, transform: 'translateY(-50%)', filter, ...style}} />
);

// Ribbons of cloth sweeping across the frame at the start.
const Ribbons: React.FC<{t: number}> = ({t}) => {
  const a = clamp((t - 0.05) / 0.9), b = clamp((t - 0.2) / 0.9);
  return (
    <>
      <Sprite src="cloth_01" x={interpolate(eOut(a), [0, 1], [-500, 2400])} y={300 + 80 * Math.sin(a * 4)} w={900}
        style={{transform: `translateY(-50%) rotate(${-15 + 25 * a}deg)`, opacity: 1 - clamp((a - 0.8) / 0.2)}} filter="blur(1.5px)" />
      <Sprite src="cloth_02" x={interpolate(eOut(b), [0, 1], [2300, -400])} y={820 - 60 * Math.sin(b * 3)} w={560}
        style={{transform: `translateY(-50%) rotate(${10 - 30 * b}deg) scaleX(-1)`, opacity: 1 - clamp((b - 0.8) / 0.2)}} filter="blur(1px)" />
    </>
  );
};

const Portal: React.FC<{t: number}> = ({t}) => {
  if (t < E.portal) return null;
  const s = spring({frame: Math.round((t - E.portal) * 60), fps: 60, config: {damping: 14, stiffness: 90}});
  let beat = 0;
  for (const b of BEATS) beat += 0.03 * decay(t, b, 10);
  const out = clamp((t - E.paw) / 0.4);
  const scale = (0.1 + 0.9 * s) * (1 + beat) * (1 + 0.6 * out);
  return (
    <div style={{position: 'absolute', left: CHAR.x - 560, top: CHAR.y + 10 - 450, width: 1120, height: 900, opacity: (1 - out) * clamp(s * 2),
      transform: `rotate(${-200 * (1 - s) + t * 25}deg) scale(${scale})`,
      filter: `drop-shadow(0 0 ${30 + 90 * beat + 60 * decay(t, E.burst, 4)}px rgba(${PURPLE},0.9))`}}>
      <Img src={el('back_frame')} style={{width: '100%', height: '100%'}} />
    </div>
  );
};

const Character: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < E.burst - 0.02) return null;
  const s = spring({frame: frame - E.burst * fps, fps, config: {damping: 9, stiffness: 130, mass: 0.9}});
  const live = clamp((t - E.hold) / 0.4);
  const breathe = 1 + 0.018 * Math.sin((2 * Math.PI * t) / 1.6) * live;
  const bob = 10 * Math.sin((2 * Math.PI * t) / 2.2) * live;
  const tilt = 2.5 * Math.sin(t * 1.3) * live;
  let beat = 0;
  for (const b of BEATS) beat += 0.02 * decay(t, b, 12);
  const pawOut = clamp((pawP(t) - 0.35) / 0.3);
  const scale = (0.15 + 0.85 * s) * (1 + beat) * (1 - 0.1 * Math.sin(Math.PI * clamp((t - E.paw + 0.2) / 0.2)));
  return (
    <div style={{position: 'absolute', left: CHAR.x - CHAR.w / 2, top: CHAR.y - CHAR.w * 0.435, width: CHAR.w,
      transformOrigin: '50% 80%', opacity: clamp(s * 4) * (1 - pawOut),
      transform: `translateY(${bob + (1 - s) * 120}px) rotate(${tilt + (1 - s) * -20}deg) rotateY(${(1 - s) * 60}deg) scale(${scale}, ${scale * breathe})`}}>
      <Img src={el('character')} style={{width: '100%',
        filter: `drop-shadow(0 0 ${24 + 60 * beat}px rgba(${PURPLE},0.75)) drop-shadow(0 24px 30px rgba(0,0,0,0.55))`}} />
    </div>
  );
};

const Title: React.FC<{t: number}> = ({t}) => {
  if (t < E.text) return null;
  const p = clamp((t - E.text) / 0.16);
  const land = t - E.text - 0.16;
  let s = 2.3 - 1.3 * eOut(p);
  if (land > 0) s *= 1 + 0.07 * Math.exp(-9 * land) * Math.cos(28 * land);
  for (const b of BEATS) s *= 1 + 0.02 * decay(t, b, 12);
  const out = clamp((t - E.paw) / 0.3);
  const sh = SHINE(t);
  const mask = `url(${el('logo_text')})`;
  return (
    <div style={{position: 'absolute', left: TEXT.x - TEXT.w / 2, top: TEXT.y - TEXT.w * 0.23, width: TEXT.w, height: TEXT.w * 0.457,
      transform: `translateY(${out * 300}px) scale(${s})`, opacity: clamp(p * 3) * (1 - out)}}>
      <Img src={el('logo_text')} style={{width: '100%', height: '100%',
        filter: `drop-shadow(0 0 22px rgba(${PURPLE},0.8)) drop-shadow(0 14px 18px rgba(0,0,0,0.6))`}} />
      {sh !== null && <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
        background: 'linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 60%)',
        backgroundSize: '300% 100%', backgroundPosition: `${sh}% 0`, mixBlendMode: 'screen'}} />}
    </div>
  );
};

const SHINE = (t: number) => {
  for (const s of [2.2, 3.7]) if (t >= s && t < s + 0.6) return interpolate(t, [s, s + 0.6], [110, -10], {easing: Easing.inOut(Easing.cubic)});
  return null;
};

// Coins orbiting the character, using the six spin frames; front half drawn over the character.
const Coins: React.FC<{t: number; front: boolean}> = ({t, front}) => {
  const appear = clamp((t - E.text) / 0.5);
  if (appear <= 0) return null;
  const out = clamp((t - E.paw) / 0.3);
  return (
    <>
      {new Array(7).fill(0).map((_, i) => {
        const th = (i / 7) * Math.PI * 2 + t * 0.9;
        const depth = Math.sin(th);
        if (front !== depth > 0) return null;
        const r = 640 * (0.3 + 0.7 * eOut(appear)) * (1 + out);
        const x = CHAR.x + r * Math.cos(th), y = 520 + 150 * depth * (0.3 + 0.7 * eOut(appear));
        const frameIdx = Math.floor((t * 10 + i * 1.7) % 6);
        const w = (110 + 50 * (depth + 1) / 2) * (COIN[frameIdx] === 'coin_04' ? 0.25 : 1);
        return <Sprite key={i} src={COIN[frameIdx]} x={x} y={y} w={w}
          style={{opacity: appear * (1 - out) * (0.65 + 0.35 * (depth + 1) / 2)}} filter="drop-shadow(0 0 10px rgba(255,190,60,0.6))" />;
      })}
    </>
  );
};

// Effect sprites that flash on impacts and beats.
const Effects: React.FC<{t: number}> = ({t}) => {
  const hits: {t0: number; n: string; x: number; y: number; w: number; r: number}[] = [
    {t0: 0.1, n: 'effect_01', x: 520, y: 330, w: 420, r: -10}, {t0: 0.22, n: 'effect_12', x: 1420, y: 700, w: 420, r: 10},
    {t0: E.burst, n: 'effect_09', x: 600, y: 300, w: 380, r: -30}, {t0: E.burst, n: 'effect_06', x: 1350, y: 330, w: 380, r: 20},
    {t0: E.burst + 0.05, n: 'effect_02', x: 560, y: 650, w: 360, r: 160}, {t0: E.burst + 0.05, n: 'effect_10', x: 1380, y: 640, w: 300, r: 0},
    {t0: E.text + 0.16, n: 'effect_03', x: 560, y: 880, w: 380, r: 20}, {t0: E.text + 0.16, n: 'effect_05', x: 1380, y: 860, w: 300, r: -20},
    ...BEATS.map((b, i) => ({t0: b, n: 'effect_08', x: 960 + (random(`ex${i}`) - 0.5) * 900, y: 420 + (random(`ey${i}`) - 0.5) * 500, w: 150, r: random(`er${i}`) * 90})),
  ];
  return (
    <>
      {hits.map((h, i) => {
        const p = (t - h.t0) / 0.45;
        if (p < 0 || p > 1) return null;
        const s = 0.6 + 0.6 * eOut(p);
        return <Sprite key={i} src={h.n} x={h.x} y={h.y} w={h.w}
          style={{transform: `translateY(-50%) rotate(${h.r}deg) scale(${s})`, opacity: Math.sin(Math.PI * p), mixBlendMode: 'screen'}} />;
      })}
    </>
  );
};

const Paw: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  if (t < E.paw - 0.05) return null;
  const p = pawP(t);
  const w = 200 + 4600 * p;
  const cx = interpolate(p, [0, 0.5, 1], [CHAR.x + 120, 960, 960]), cy = interpolate(p, [0, 0.5, 1], [CHAR.y + 190, 560, 540]);
  return (
    <div style={{position: 'absolute', left: cx - w / 2, top: cy - w * 0.35, width: w, transform: `rotate(${-8 + 16 * p}deg)`, opacity: clamp(p * 20)}}>
      <Img src={el('paw')} style={{width: '100%', filter: `blur(${10 * clamp((p - 0.4) / 0.6)}px) drop-shadow(0 20px 30px rgba(0,0,0,0.6))`}} />
    </div>
  );
};

export const ElementsIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const amp = 26 * decay(t, E.burst, 8) + 18 * decay(t, E.text + 0.16, 10);
  const dx = amp * Math.sin(t * 97), dy = amp * Math.cos(t * 83);
  const push = 1 + 0.04 * clamp((t - E.hold) / 3);
  const flash = 0.2 * decay(t, E.burst, 22) + 0.1 * decay(t, E.text + 0.16, 24);
  const black = t >= E.black ? 1 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Audio src={staticFile('sfx_el.wav')} />
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${push})`}}>
        <Background t={t} frame={frame} />
        <Portal t={t} />
        <Ribbons t={t} />
        <Coins t={t} front={false} />
        <AbsoluteFill style={{perspective: 1600}}>
          <CameraMotionBlur shutterAngle={200} samples={6}>
            <Character />
          </CameraMotionBlur>
        </AbsoluteFill>
        <Coins t={t} front />
        <Title t={t} />
        <Effects t={t} />
        <CameraMotionBlur shutterAngle={220} samples={6}>
          <Paw />
        </CameraMotionBlur>
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: 'rgb(255,235,255)', opacity: flash}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: black}} />
    </AbsoluteFill>
  );
};
