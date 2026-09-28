import React from 'react';
import {AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASPECT, Coin, Layer, PURPLE, Shine, Sprite, beatPulse, clamp, eIn, springT} from './lib';

// Cute / playful: pastel polka dots, props pop in, the character drops in with squash-and-stretch, jelly title, coin rain, iris out.
export const CU = {char: 1.2, text: 1.65, coins: 1.9, iris: 9.3, end: 10.0};
export const CU_HOPS = Array.from({length: 14}, (_, i) => 2.2 + 0.5 * i);
const FLOOR = 1045;

const PROPS = [
  {src: 'paw', x: 250, y: 820, w: 300, t0: 0.15, rot: -12},
  {src: 'rope_bell', x: 1640, y: 250, w: 420, t0: 0.3, rot: 8},
  {src: 'face_mark', x: 1700, y: 760, w: 130, t0: 0.45, rot: 0},
  {src: 'eye_left', x: 330, y: 260, w: 140, t0: 0.55, rot: -10},
  {src: 'eye_right', x: 520, y: 180, w: 120, t0: 0.65, rot: 10},
  {src: 'ear_fluff_02', x: 1480, y: 560, w: 120, t0: 0.75, rot: 20},
  {src: 'cloth_02', x: 1450, y: 920, w: 330, t0: 0.85, rot: -6},
];

const Squash: React.FC<{tau: number; children: (sx: number, sy: number, y: number) => React.ReactNode}> = ({tau, children}) => {
  const land = 0.28;
  if (tau < land) {
    const p = clamp(tau / land);
    return <>{children(0.85, 1.2, -700 * (1 - p * p))}</>;
  }
  const s = springT(tau - land, 7, 24);
  const osc = 1 - s;
  return <>{children(1 + 0.25 * osc, 1 - 0.25 * osc, 0)}</>;
};

export const Cute: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const beat = beatPulse(t, CU_HOPS, 0.03);
  const irisR = t < CU.iris ? 3000 : Math.max(0, 1300 * (1 - eIn(clamp((t - CU.iris) / 0.6))));
  return (
    <AbsoluteFill style={{backgroundColor: '#1a0833', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_cute.wav')} />
      <AbsoluteFill style={{clipPath: `circle(${irisR}px at 960px 330px)`}}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #f3e8ff 0%, #ffe7cf 100%)'}} />
        <AbsoluteFill style={{backgroundImage: 'radial-gradient(circle, rgba(139,61,255,0.18) 0 14px, transparent 15px)', backgroundSize: '90px 90px',
          backgroundPosition: `${t * 40}px ${t * 40}px`}} />
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.9), rgba(255,255,255,0) 55%)'}} />
        {PROPS.map((p, i) => {
          const s = springT(t - p.t0, 8, 22);
          if (s <= 0) return null;
          const wob = 4 * Math.sin(t * 3 + i);
          const push = clamp((t - CU.char - 0.25) / 0.3);
          const dx = (p.x - 960) * 0.08 * push, dy = (p.y - 540) * 0.08 * push;
          return <Sprite key={i} src={p.src} x={p.x + dx} y={p.y + dy} w={p.w} rot={p.rot + wob + (p.src === 'face_mark' ? t * 60 : 0)}
            sx={s * (1 + beat)} sy={(p.src.startsWith('eye') && (t % 1.7) < 0.1 ? 0.1 : 1) * s * (1 + beat)}
            filter="drop-shadow(0 12px 10px rgba(80,30,140,0.25))" />;
        })}
        {t >= CU.char && <Squash tau={t - CU.char}>{(sx, sy, y) => {
          let hy = 0, hsx = 1, hsy = 1;
          for (const h of CU_HOPS) {
            const q = (t - h) / 0.4;
            if (q >= 0 && q < 1) { hy = -60 * Math.sin(Math.PI * q); hsy = 1 + 0.06 * Math.sin(Math.PI * q) - (q > 0.85 ? 0.08 : 0); hsx = 2 - hsy; }
          }
          return <Layer src="character" x={960} y={400 + y + hy} w={680} aspect={ASPECT.character} origin="50% 100%"
            transform={`scale(${sx * hsx}, ${sy * hsy})`} filter={`drop-shadow(0 0 16px rgba(${PURPLE},0.5)) drop-shadow(0 26px 18px rgba(80,30,140,0.3))`} />;
        }}</Squash>}
        {t >= CU.char && (
          <div style={{position: 'absolute', left: 960 - 260, top: 715, width: 520, height: 50, borderRadius: '50%', background: 'rgba(80,30,140,0.18)', filter: 'blur(8px)'}} />
        )}
        {t >= CU.coins && new Array(14).fill(0).map((_, i) => {
          const t0 = CU.coins + random(`ct${i}`) * 1.2 + (i % 2 ? 3.6 : 0), tau = t - t0;
          if (tau < 0) return null;
          const x = 120 + random(`cx${i}`) * 1680;
          const g = 2600, v0 = 0;
          let y = -120 + v0 * tau + 0.5 * g * tau * tau, bt = Math.sqrt((2 * (FLOOR + 120)) / g);
          if (tau > bt) { const q = tau - bt, v = g * bt * 0.45; y = FLOOR - (v * q - 0.5 * g * q * q); if (y > FLOOR) y = FLOOR; }
          return <Coin key={i} x={x} y={Math.min(FLOOR, y)} w={80 + 30 * random(`cw${i}`)} phase={t * 14 + i} />;
        })}
        {t >= CU.text && (() => {
          const tau = t - CU.text, s = springT(tau, 6, 26), j = 1 - s;
          return <Layer src="logo_text" x={960} y={860 + 300 * (1 - clamp(tau / 0.2))} w={860} aspect={ASPECT.logo_text}
            transform={`scale(${(1 + 0.3 * j) * (1 + beat)}, ${(1 - 0.3 * j) * (1 + beat)}) rotate(${3 * Math.sin(t * 2.5) * clamp((tau - 0.6) / 0.4)}deg)`}
            filter="drop-shadow(0 0 14px rgba(255,255,255,0.9)) drop-shadow(0 16px 14px rgba(80,30,140,0.35))">
            <Shine src="logo_text" t={t} at={[2.6, 4.6, 6.6, 8.4]} />
          </Layer>;
        })()}
        {CU_HOPS.map((h, i) => {
          const p = (t - h - 0.3) / 0.4;
          if (p < 0 || p > 1) return null;
          return <Sprite key={i} src="effect_08" x={i % 2 ? 1320 : 600} y={360 - 60 * p} w={160} sx={Math.sin(Math.PI * p)} sy={Math.sin(Math.PI * p)} rot={p * 90} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
