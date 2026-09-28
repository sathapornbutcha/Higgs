import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';

export const PURPLE = '139,61,255';
export const ORANGE = '255,140,26';
export const GOLD = '255,205,70';
export const COIN = ['coin_01', 'coin_02', 'coin_03', 'coin_04', 'coin_05', 'coin_06'];

export const el = (n: string) => staticFile(`el/${n}.png`);
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const eIn = (p: number) => p * p * p;
export const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const eInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const decay = (t: number, t0: number, k: number) => (t >= t0 ? Math.exp(-(t - t0) * k) : 0);
/** Damped spring 0 -> 1 with overshoot; tau seconds since start. */
export const springT = (tau: number, k = 9, w = 20) => (tau <= 0 ? 0 : 1 - Math.exp(-k * tau) * Math.cos(w * tau));
export const beatPulse = (t: number, beats: number[], amt = 0.02, k = 12) => beats.reduce((s, b) => s + amt * decay(t, b, k), 0);

/** Absolutely positioned element image, centred on (x, y), width w. */
export const Sprite: React.FC<{src: string; x: number; y: number; w: number; rot?: number; sx?: number; sy?: number; opacity?: number;
  filter?: string; blend?: React.CSSProperties['mixBlendMode']; origin?: string}> = ({src, x, y, w, rot = 0, sx = 1, sy = 1, opacity = 1, filter, blend, origin}) => (
  <Img src={el(src)} style={{position: 'absolute', left: x - w / 2, top: y, width: w, opacity, filter, mixBlendMode: blend,
    transformOrigin: origin ?? '50% 50%', transform: `translateY(-50%) rotate(${rot}deg) scale(${sx}, ${sy})`}} />
);

/** A coin using the six spin frames. */
export const Coin: React.FC<{x: number; y: number; w: number; phase: number; opacity?: number}> = ({x, y, w, phase, opacity = 1}) => {
  const f = COIN[((Math.floor(phase) % 6) + 6) % 6];
  return <Sprite src={f} x={x} y={y} w={f === 'coin_04' ? w * 0.25 : w} opacity={opacity} filter="drop-shadow(0 0 10px rgba(255,190,60,0.6))" />;
};

/** Light band sweeping across an element, clipped to its alpha. */
export const Shine: React.FC<{src: string; t: number; at: number[]; dur?: number}> = ({src, t, at, dur = 0.6}) => {
  const s = at.find((a) => t >= a && t < a + dur);
  if (s === undefined) return null;
  const pos = interpolate(t, [s, s + dur], [110, -10], {easing: Easing.inOut(Easing.cubic)});
  const mask = `url(${el(src)})`;
  return (
    <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
      background: 'linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 60%)',
      backgroundSize: '300% 100%', backgroundPosition: `${pos}% 0`, mixBlendMode: 'screen'}} />
  );
};

/** Element image in a positioned box (so Shine can overlay it). */
export const Layer: React.FC<{src: string; x: number; y: number; w: number; aspect: number; transform?: string; opacity?: number; filter?: string;
  origin?: string; children?: React.ReactNode}> = ({src, x, y, w, aspect, transform, opacity = 1, filter, origin, children}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - (w * aspect) / 2, width: w, height: w * aspect, transform, opacity,
    transformOrigin: origin ?? '50% 50%'}}>
    <Img src={el(src)} style={{width: '100%', height: '100%', filter}} />
    {children}
  </div>
);

// Element aspect ratios (height / width) of the cut-outs.
export const ASPECT: Record<string, number> = {character: 518 / 596, logo_text: 251 / 549, paw: 124 / 176, back_frame: 334 / 416};

export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.07}) => (
  <svg width="1920" height="1080" style={{position: 'absolute', opacity, mixBlendMode: 'overlay'}}>
    <filter id={`grain${frame % 12}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} /></filter>
    <rect width="100%" height="100%" filter={`url(#grain${frame % 12})`} />
  </svg>
);

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`}} />
);
