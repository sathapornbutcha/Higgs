import React from 'react';
import {AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, Coin, Grain, Layer, ORANGE, PURPLE, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eOut, springT} from './lib';

// Esports / gaming stinger: hard cuts on the beat, close-ups, then a slam lockup. 150 BPM.
export const B = 0.4;
export const ES = {face: 0.4, paw: 0.8, coin: 1.2, slam: 1.6, text: 1.68, exit: 4.2, end: 5.0};
export const ES_BEATS = [2.0, 2.4, 2.8, 3.2, 3.6, 4.0];

const Bars: React.FC<{p: number; colors: string[]; dir?: 1 | -1}> = ({p, colors, dir = 1}) => (
  <>
    {colors.map((c, i) => {
      const q = clamp(p * 1.4 - i * 0.08);
      const x = dir * (-2600 + 5200 * eInOutQ(q));
      return <div key={i} style={{position: 'absolute', left: 960 - 700 + x, top: -200 + i * (1480 / colors.length), width: 1400, height: 1480 / colors.length + 4,
        background: c, transform: 'skewX(-24deg)'}} />;
    })}
  </>
);
const eInOutQ = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

const SpeedLines: React.FC<{t: number; color: string; vertical?: boolean; seed: string}> = ({t, color, vertical, seed}) => (
  <>
    {new Array(26).fill(0).map((_, i) => {
      const pos = random(`${seed}p${i}`) * 1080, len = 300 + random(`${seed}l${i}`) * 900, sp = 3000 + random(`${seed}s${i}`) * 3000;
      const x = ((random(`${seed}x${i}`) * 3000 - t * sp) % 3000 + 3000) % 3000 - 600;
      return <div key={i} style={{position: 'absolute', left: vertical ? pos * 1.78 : x, top: vertical ? x * 0.56 : pos, width: vertical ? 3 : len, height: vertical ? len * 0.56 : 3 + (i % 3),
        background: color, opacity: 0.5 + 0.5 * random(`${seed}o${i}`), borderRadius: 3}} />;
    })}
  </>
);

const CloseUps: React.FC<{t: number}> = ({t}) => {
  if (t < ES.face || t >= ES.slam) return null;
  if (t < ES.paw) {
    const p = (t - ES.face) / B;
    const w = 597 * 5.2;
    return (
      <AbsoluteFill style={{background: `linear-gradient(90deg, rgb(${PURPLE}), #2a0b52)`}}>
        <SpeedLines t={t} color="rgba(255,255,255,0.35)" seed="f" />
        <Sprite src="character" x={960 + (w * (0.5 - 0.42)) + 200 - 400 * p} y={540 + w * ASPECT.character * (0.5 - 0.42)} w={w} rot={-4 + 6 * p}
          filter="drop-shadow(8px 0 0 rgba(255,40,120,0.5)) drop-shadow(-8px 0 0 rgba(0,220,255,0.5))" />
      </AbsoluteFill>
    );
  }
  if (t < ES.coin) {
    const p = (t - ES.paw) / B;
    return (
      <AbsoluteFill style={{background: `linear-gradient(90deg, #7a3a00, rgb(${ORANGE}))`}}>
        <SpeedLines t={t} color="rgba(255,255,255,0.4)" seed="p" />
        <Sprite src="paw" x={760 + 500 * p} y={560} w={1500 + 300 * p} rot={-15 + 25 * p} filter="drop-shadow(0 30px 40px rgba(0,0,0,0.5))" />
      </AbsoluteFill>
    );
  }
  const p = (t - ES.coin) / B;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle, #3a1466, #0a0314 70%)'}}>
      {new Array(24).fill(0).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 960, top: 540, width: 1400, height: 6, background: `rgba(${i % 2 ? ORANGE : PURPLE},0.6)`,
          transformOrigin: '0 50%', transform: `rotate(${(i / 24) * 360 + t * 90}deg) translateX(${250 + 80 * p}px)`}} />
      ))}
      <Coin x={960} y={540} w={560 + 200 * p} phase={t * 30} />
    </AbsoluteFill>
  );
};

const Lockup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < ES.slam) return null;
  const cs = springT(t - ES.slam, 10, 22);
  const ts = springT(t - ES.text, 11, 26);
  const beat = beatPulse(t, ES_BEATS, 0.03);
  const glitch = ES_BEATS.some((b) => t >= b && t < b + 0.05);
  const rgb = glitch ? 'drop-shadow(10px 0 0 rgba(255,40,120,0.7)) drop-shadow(-10px 0 0 rgba(0,220,255,0.7))' : '';
  const jx = glitch ? (random(`j${frame}`) - 0.5) * 30 : 0;
  const glow = `drop-shadow(0 0 ${24 + 80 * beat}px rgba(${PURPLE},0.85)) drop-shadow(0 20px 26px rgba(0,0,0,0.6))`;
  const breathe = 1 + 0.012 * Math.sin(t * 5);
  return (
    <>
      <Layer src="character" x={960 + jx} y={430} w={700} aspect={ASPECT.character} origin="50% 85%"
        transform={`scale(${(2.2 - 1.2 * cs) * (1 + beat)}, ${(2.2 - 1.2 * cs) * (1 + beat) * breathe}) rotate(${(1 - cs) * -8}deg)`}
        opacity={clamp(cs * 5)} filter={`${glow} ${rgb}`} />
      {t >= ES.text && (
        <Layer src="logo_text" x={960 - jx} y={860} w={900} aspect={ASPECT.logo_text}
          transform={`scale(${(2.6 - 1.6 * ts) * (1 + beat)}) skewX(${(1 - ts) * -18}deg)`} opacity={clamp(ts * 5)} filter={`${glow} ${rgb}`}>
          <Shine src="logo_text" t={t} at={[2.3, 3.5]} />
        </Layer>
      )}
    </>
  );
};

const LockupBg: React.FC<{t: number}> = ({t}) => {
  if (t < ES.slam) return null;
  const inP = eOut(clamp((t - ES.slam) / 0.25));
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #3b1270 0%, #14052a 55%, #050109 100%)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: -400, opacity: 0.18, transform: `translateX(${(t * 160) % 80}px)`,
        background: `repeating-linear-gradient(-60deg, rgba(${ORANGE},0.7) 0 14px, transparent 14px 80px)`}} />
      <div style={{position: 'absolute', left: -700 + 520 * inP, top: -100, width: 800, height: 1300, background: `linear-gradient(180deg, rgb(${PURPLE}), #3a0e7a)`,
        transform: 'skewX(-18deg)', boxShadow: `0 0 60px rgba(${PURPLE},0.8)`}} />
      <div style={{position: 'absolute', right: -700 + 520 * inP, top: -100, width: 800, height: 1300, background: `linear-gradient(180deg, rgb(${ORANGE}), #8a3a00)`,
        transform: 'skewX(-18deg)', boxShadow: `0 0 60px rgba(${ORANGE},0.8)`}} />
      <div style={{position: 'absolute', left: -560 + 520 * inP, top: -100, width: 18, height: 1300, background: 'white', transform: 'skewX(-18deg)'}} />
      <div style={{position: 'absolute', right: -560 + 520 * inP, top: -100, width: 18, height: 1300, background: 'white', transform: 'skewX(-18deg)'}} />
      {new Array(10).fill(0).map((_, i) => {
        const th = (i / 10) * Math.PI * 2 + t * 1.4;
        return <Coin key={i} x={960 + 820 * Math.cos(th)} y={500 + 330 * Math.sin(th)} w={90 + 40 * (Math.sin(th) + 1) / 2} phase={t * 12 + i}
          opacity={0.55 * clamp((t - ES.slam - 0.3) / 0.4)} />;
      })}
    </AbsoluteFill>
  );
};

const Impact: React.FC<{t: number}> = ({t}) => {
  const rings = [{t0: ES.slam, c: ORANGE}, {t0: ES.text, c: PURPLE}, {t0: ES.text + 0.06, c: '255,255,255'}];
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {rings.map((r, i) => {
        const p = (t - r.t0) / 0.5;
        if (p < 0 || p > 1) return null;
        const R = 150 + 1300 * eOut(p);
        return <circle key={i} cx={960} cy={560} r={R} fill="none" stroke={`rgba(${r.c},${1 - p})`} strokeWidth={Math.max(1, 40 * (1 - p))} />;
      })}
      {t >= ES.slam && t < ES.slam + 0.3 && new Array(20).fill(0).map((_, i) => {
        const a = (i / 20) * Math.PI * 2, p = (t - ES.slam) / 0.3, r0 = 250 + 1000 * p;
        return <polygon key={i} fill={`rgba(255,240,220,${1 - p})`}
          points={`${960 + r0 * Math.cos(a - 0.02)},${540 + r0 * Math.sin(a - 0.02)} ${960 + (r0 + 400) * Math.cos(a)},${540 + (r0 + 400) * Math.sin(a)} ${960 + r0 * Math.cos(a + 0.02)},${540 + r0 * Math.sin(a + 0.02)}`} />;
      })}
    </svg>
  );
};

const FX: React.FC<{t: number}> = ({t}) => {
  const hits = [
    {t0: ES.slam, n: 'effect_09', x: 470, y: 330, w: 520, r: -20}, {t0: ES.slam, n: 'effect_06', x: 1450, y: 350, w: 520, r: 20},
    {t0: ES.text, n: 'effect_03', x: 450, y: 900, w: 460, r: 10}, {t0: ES.text, n: 'effect_12', x: 1480, y: 880, w: 440, r: -10},
    ...ES_BEATS.map((b, i) => ({t0: b, n: i % 2 ? 'effect_02' : 'effect_10', x: i % 2 ? 380 : 1540, y: 300 + 90 * i, w: 360, r: i % 2 ? -30 : 30})),
  ];
  return <>{hits.map((h, i) => {
    const p = (t - h.t0) / 0.35;
    if (p < 0 || p > 1) return null;
    return <Sprite key={i} src={h.n} x={h.x} y={h.y} w={h.w} rot={h.r} sx={0.7 + 0.6 * eOut(p)} sy={0.7 + 0.6 * eOut(p)} opacity={Math.sin(Math.PI * p)} blend="screen" />;
  })}</>;
};

export const Esports: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const amp = 34 * decay(t, ES.slam, 9) + 16 * decay(t, ES.text, 12) + ES_BEATS.reduce((s, b) => s + 6 * decay(t, b, 20), 0);
  const dx = amp * Math.sin(t * 97), dy = amp * Math.cos(t * 83);
  const cutFlash = [ES.face, ES.paw, ES.coin].some((c) => t >= c && t < c + 1 / 30) ? 0.7 : 0;
  const flash = Math.max(cutFlash, 0.45 * decay(t, ES.slam, 20), 0.2 * decay(t, ES.text, 24));
  const push = 1 + 0.04 * clamp((t - ES.slam) / 2.6);
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_esports.wav')} />
      {t < ES.face && <Bars p={t / ES.face} colors={[`rgb(${ORANGE})`, '#ffffff', `rgb(${PURPLE})`, '#16052b', `rgb(${ORANGE})`]} />}
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${push})`}}>
        <CameraMotionBlur shutterAngle={220} samples={4}>
          <CloseUps t={t} />
        </CameraMotionBlur>
        <LockupBg t={t} />
        <Impact t={t} />
        <CameraMotionBlur shutterAngle={200} samples={4}>
          <Lockup />
        </CameraMotionBlur>
        <FX t={t} />
        <Vignette strength={0.55} />
      </AbsoluteFill>
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: flash}} />
      {t >= ES.exit && <Bars p={(t - ES.exit) / 0.55} colors={[`rgb(${PURPLE})`, `rgb(${ORANGE})`, '#000000', `rgb(${PURPLE})`, '#000000']} dir={-1} />}
      {t >= ES.exit + 0.45 && <AbsoluteFill style={{backgroundColor: 'black', opacity: clamp((t - ES.exit - 0.45) / 0.1)}} />}
    </AbsoluteFill>
  );
};
