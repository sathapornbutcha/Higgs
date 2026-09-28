import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, COIN, Grain, Layer, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eInOut, eOut, el, springT} from './lib';

// 10 s game-trailer logo reveal, "THE SNATCHERS JUST STOLE THE SCREEN":
// energy awakening -> portal ignites -> coin rush, one coin gets snatched -> the mascot is assembled from its parts
// into a silhouette -> it bursts out of the portal, paw hits the lens -> purple slash wipe -> energy spiral, bell hit,
// hero pose -> logo slam (160/92/104/100) + gold slash -> coin drop -> hero frame -> fade.
export const SN = {ign: 0.8, rush: 1.0, ting: 1.8, snatch: 2.0, asm: 2.5, sil: 3.75, antic: 4.0, burst: 4.3, paw: 4.75, hit: 5.0,
  wipe: 0.35, expl: 6.0, bell: 6.5, logo: 7.7, bass: 8.0, drop: 8.2, hero: 9.0, fade: 9.7};
export const SN_BEATS = Array.from({length: 11}, (_, i) => SN.hit + 0.4 * i);   // 150 BPM from the drop
const CX = 960, CY = 480, CW = 600;                  // character placement in the assembly / attack scene
const CH = CW * ASPECT.character;
const P = '139,61,255', OR = '255,140,26';

const useT = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return f / fps; };
/** Piecewise keyframes [[t, v], ...] with a per-segment ease. */
const kf = (t: number, keys: [number, number][], ease: (p: number) => number = eInOut) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
};
const shake = (t: number) => 20 * decay(t, SN.snatch, 9) + 30 * decay(t, SN.hit, 7) + 18 * decay(t, SN.logo, 9) + 8 * decay(t, SN.ign, 10) + 10 * decay(t, SN.burst, 10)
  + [2.55, 2.62, 2.8, 2.86, 3.05, 3.3, 3.36, 3.42, 3.48, 3.6].reduce((s, l) => s + 4 * decay(t, l, 20), 0) + 8 * decay(t, SN.drop + 0.3, 14);

type Cam = {x: number; y: number; s: number; r: number};
const camA = (t: number): Cam => ({
  x: t < SN.rush ? 0 : kf(t, [[1.0, -90], [1.8, 70], [2.0, 70], [2.5, 0]]),
  y: 0,
  s: kf(t, [[0, 1], [1.0, 1.04], [1.8, 1.04], [1.93, 1.12], [2.5, 1.0], [4.0, 1.05], [4.3, 0.99]]) * (t > SN.burst ? 1 + 0.36 * eIn(clamp((t - SN.burst) / 0.7)) : 1),
  r: kf(t, [[0, 0], [1.0, -1], [2.5, 0]]) + (t > SN.burst ? 3 * eIn(clamp((t - SN.burst) / 0.7)) : 0),
});
const camB = (t: number): Cam => ({x: 0, y: 0, s: kf(t, [[5.0, 1.0], [6.0, 1.02], [7.5, 1.08], [9.0, 1.06]]) + 0.01 * Math.sin(t * 1.3) * clamp(t - SN.hero), r: 0});

const Plane: React.FC<{cam: Cam; f: number; children: React.ReactNode}> = ({cam, f, children}) => (
  <AbsoluteFill style={{transform: `translate(${-cam.x * f}px, ${-cam.y * f}px) scale(${1 + (cam.s - 1) * f}) rotate(${cam.r * f}deg)`}}>{children}</AbsoluteFill>
);

/** Spinning coin from the 6-frame sprite, with roll and blur-friendly positioning. */
const Cn: React.FC<{x: number; y: number; w: number; phase: number; rot?: number; opacity?: number; glow?: number}> = ({x, y, w, phase, rot = 0, opacity = 1, glow = 0.5}) => {
  const f = COIN[((Math.floor(phase) % 6) + 6) % 6];
  const ww = f === 'coin_04' ? w * 0.25 : w;
  return <Img src={el(f)} style={{position: 'absolute', left: x - ww / 2, top: y - w * 0.55, width: ww, opacity, transform: `rotate(${rot}deg)`,
    filter: `drop-shadow(0 0 ${6 + 14 * glow}px rgba(255,190,60,${0.4 + 0.4 * glow}))`}} />;
};

const Bg: React.FC<{t: number; level: number; portalY: number}> = ({t, level, portalY}) => (
  <>
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% ${portalY / 10.8}%, rgba(90,30,170,${0.9 * level}) 0%, rgba(30,8,60,${level}) 45%, #030006 85%)`}} />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{position: 'absolute', left: 960 + 700 * Math.sin(t * 0.13 + i * 1.7) - 450, top: 540 + 300 * Math.cos(t * 0.11 + i * 2.3) - 300,
        width: 900, height: 600, borderRadius: '50%', opacity: 0.22 * level,
        background: `radial-gradient(ellipse, rgba(${i % 2 ? P : '90,20,140'},0.8), rgba(0,0,0,0) 70%)`, filter: 'blur(30px)'}} />
    ))}
  </>
);

const Portal: React.FC<{t: number; x: number; y: number; w: number; s: number; bright?: number}> = ({t, x, y, w, s, bright = 0}) => {
  if (s <= 0.001) return null;
  const h = w * ASPECT.back_frame;
  const flick = 1 + 0.03 * Math.sin(t * 31) * Math.sin(t * 17);
  const img = (rot: number, k: number, op: number, extra: string) => (
    <Img src={el('back_frame')} style={{position: 'absolute', left: x - (w * k) / 2, top: y - (h * k) / 2, width: w * k, height: h * k, opacity: op,
      transform: `rotate(${rot}deg) scale(${s * flick})`, filter: extra}} />
  );
  return (
    <>
      {img(t * -35, 1.15, 0.5, `blur(10px) brightness(${1.4 + bright})`)}
      {img(t * 20, 1, 1, `brightness(${1 + 0.6 * bright}) drop-shadow(0 0 ${20 + 40 * bright}px rgba(${P},0.9))`)}
      {img(t * -35 + 90, 1.12, 0.55, `brightness(${1.2 + bright})`)}
    </>
  );
};

// ---- 1.0-2.2 coin rush + snatch -------------------------------------------------------------------------------
type Path = {t0: number; d: number; a: [number, number, number]; b: [number, number, number]};
const MID_COINS: Path[] = [
  {t0: 1.0, d: 0.8, a: [300, 300, 40], b: [1500, 380, 70]},
  {t0: 1.1, d: 0.7, a: [1700, 720, 50], b: [420, 620, 80]},
  {t0: 1.05, d: 0.5, a: [-100, 520, 90], b: [2050, 420, 170]},
  {t0: 1.25, d: 0.5, a: [2050, 250, 100], b: [-120, 360, 190]},
  {t0: 1.4, d: 0.45, a: [520, 1200, 90], b: [1450, -120, 210]},
  {t0: 1.0, d: 0.4, a: [1200, -100, 80], b: [300, 1200, 260]},
  {t0: 1.2, d: 0.35, a: [-150, 900, 110], b: [1900, 150, 280]},
  {t0: 1.5, d: 0.4, a: [1000, 1250, 70], b: [700, -150, 240]},
  {t0: 1.15, d: 0.9, a: [850, 250, 30], b: [1200, 820, 60]},
  {t0: 1.35, d: 0.8, a: [1100, 700, 35], b: [650, 200, 55]},
];
const FG_COINS: Path[] = [
  {t0: 1.3, d: 0.14, a: [1450, 880, 380], b: [2500, 1350, 1600]},
  {t0: 1.62, d: 0.13, a: [420, 220, 460], b: [-700, -350, 1800]},
];
const at = (c: Path, t: number) => {
  const p = (t - c.t0) / c.d;
  return {p, x: c.a[0] + (c.b[0] - c.a[0]) * p, y: c.a[1] + (c.b[1] - c.a[1]) * p, w: c.a[2] + (c.b[2] - c.a[2]) * eIn(p)};
};
const heroCoin = (t: number) => {
  if (t < 1.8) { const p = eOut(clamp((t - 1.5) / 0.3)); return {x: 1350 - 390 * p, y: 280 + 200 * p, w: 50 + 170 * p, phase: t * 30}; }
  if (t < SN.snatch + 0.07) return {x: 960, y: 480 + 6 * (t - 1.8), w: 220 + 30 * (t - 1.8), phase: 54 + (t - 1.8) * 8};
  const p = eIn(clamp((t - SN.snatch - 0.07) / 0.1));
  return {x: 960 - 1700 * p, y: 480 + 80 * p, w: 226, phase: 60 + p * 12};
};
const snatchPaw = (t: number) => {
  if (t < SN.snatch - 0.02 || t > SN.snatch + 0.2) return null;
  if (t < SN.snatch + 0.07) { const p = eOut(clamp((t - SN.snatch + 0.02) / 0.09)); return {x: 2200 - 1180 * p, y: 520, rot: -25 + 25 * p, sx: 1.1, sy: 0.9}; }
  const p = eIn(clamp((t - SN.snatch - 0.07) / 0.1));
  return {x: 1020 - 1700 * p, y: 520 + 80 * p, rot: 10 * p, sx: 1 + 0.2 * p, sy: 1 - 0.1 * p};
};

const MidCoins: React.FC = () => {
  const t = useT();
  if (t < SN.rush || t > SN.snatch + 0.25) return null;
  const h = heroCoin(t);
  return (
    <AbsoluteFill>
      {MID_COINS.map((c, i) => { const s = at(c, t); return s.p < 0 || s.p > 1 ? null : <Cn key={i} x={s.x} y={s.y} w={s.w} phase={t * 30 + i * 2} rot={t * 90 * (i % 2 ? 1 : -1)} />; })}
      {t >= 1.5 && <Cn x={h.x} y={h.y} w={h.w} phase={h.phase} glow={1 + 2 * decay(t, SN.ting, 6)} />}
    </AbsoluteFill>
  );
};
const FgCoins: React.FC = () => {
  const t = useT();
  const sp = snatchPaw(t);
  return (
    <AbsoluteFill>
      {FG_COINS.map((c, i) => { const s = at(c, t); return s.p < 0 || s.p > 1 ? null : <Cn key={i} x={s.x} y={s.y} w={s.w} phase={t * 30 + i} rot={t * 200} />; })}
      {sp && <Sprite src="paw" x={sp.x} y={sp.y} w={330} rot={sp.rot} sx={-sp.sx} sy={sp.sy} filter="drop-shadow(0 12px 16px rgba(0,0,0,0.6))" />}
    </AbsoluteFill>
  );
};

// ---- 2.5-3.75 assembly ------------------------------------------------------------------------------------------
// target = where the part sits on the character art (normalised), wn = its width as a fraction of the character width
const PARTS: {src: string; lock: number; nx: number; ny: number; wn: number; from: [number, number]; rot: number}[] = [
  {src: 'ear_left', lock: 2.55, nx: 0.2, ny: 0.22, wn: 0.4, from: [-500, -300], rot: -160},
  {src: 'ear_right', lock: 2.62, nx: 0.73, ny: 0.17, wn: 0.5, from: [2400, -350], rot: 170},
  {src: 'cloth_01', lock: 2.8, nx: 0.36, ny: 0.8, wn: 0.55, from: [-600, 1300], rot: 120},
  {src: 'cloth_02', lock: 2.86, nx: 0.83, ny: 0.52, wn: 0.33, from: [2500, 900], rot: -140},
  {src: 'rope_bell', lock: 3.05, nx: 0.55, ny: 0.68, wn: 0.56, from: [960, -500], rot: 60},
  {src: 'eye_right', lock: 3.3, nx: 0.47, ny: 0.43, wn: 0.1, from: [2300, 200], rot: 360},
  {src: 'eye_left', lock: 3.36, nx: 0.35, ny: 0.51, wn: 0.09, from: [-400, 250], rot: -360},
  {src: 'mouth', lock: 3.42, nx: 0.43, ny: 0.59, wn: 0.16, from: [700, 1400], rot: 90},
  {src: 'face_mark', lock: 3.48, nx: 0.56, ny: 0.41, wn: 0.08, from: [1500, -400], rot: 540},
  {src: 'paw', lock: 3.6, nx: 0.66, ny: 0.83, wn: 0.38, from: [2400, 1300], rot: -90},
];
const FLY = 0.28;
const partPos = (pt: typeof PARTS[number], t: number) => {
  const p = clamp((t - (pt.lock - FLY)) / FLY);
  const e = eOut(p);
  const tx = CX + (pt.nx - 0.5) * CW, ty = CY + (pt.ny - 0.5) * CH;
  const cx = (pt.from[0] + tx) / 2 + (ty - pt.from[1]) * 0.35, cy = (pt.from[1] + ty) / 2 - (tx - pt.from[0]) * 0.35;   // curved path
  const x = (1 - e) * (1 - e) * pt.from[0] + 2 * (1 - e) * e * cx + e * e * tx;
  const y = (1 - e) * (1 - e) * pt.from[1] + 2 * (1 - e) * e * cy + e * e * ty;
  return {p, x, y, rot: pt.rot * (1 - e)};
};

const Assembly: React.FC<{t: number}> = ({t}) => {
  if (t < SN.asm - 0.05 || t >= SN.sil) return null;
  return (
    <>
      {PARTS.map((pt, i) => {
        const s = partPos(pt, t);
        if (s.p <= 0) return null;
        const w = pt.wn * CW;
        const pop = t >= pt.lock ? 1 + 0.12 * decay(t, pt.lock, 14) * Math.cos((t - pt.lock) * 30) : 1;
        const trails = s.p < 1 ? [0.06, 0.04, 0.02].map((dt, k) => { const q = partPos(pt, t - dt); return q.p > 0 ? (
          <Sprite key={k} src={pt.src} x={q.x} y={q.y} w={w} rot={q.rot} opacity={0.35 - 0.1 * k}
            filter={`brightness(0.4) sepia(1) hue-rotate(230deg) saturate(6) drop-shadow(0 0 12px rgba(${P},1))`} />) : null; }) : null;
        return (
          <React.Fragment key={i}>
            {trails}
            <Sprite src={pt.src} x={s.x} y={s.y} w={w} rot={s.rot} sx={pop} sy={pop}
              filter={`drop-shadow(0 0 ${s.p < 1 ? 16 : 6}px rgba(${P},0.9))`} />
            {t >= pt.lock && t < pt.lock + 0.3 && [0, 1, 2, 3, 4].map((k) => {
              const q = (t - pt.lock) / 0.3, a = (k / 5) * Math.PI * 2 + i;
              return <Sprite key={`s${k}`} src={k % 2 ? 'effect_05' : 'effect_08'} x={s.x + (20 + 110 * eOut(q)) * Math.cos(a)} y={s.y + (20 + 110 * eOut(q)) * Math.sin(a)}
                w={50} rot={a * 57.3} opacity={1 - q} blend="screen" />;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---- 3.75-5.0 silhouette, burst, paw hits the lens -------------------------------------------------------------
const MascotA: React.FC = () => {
  const t = useT();
  if (t < SN.asm || t >= SN.hit + 0.1) return null;
  const holo = t < SN.sil ? 0.18 + 0.1 * clamp((t - SN.asm) / 1.2) + 0.05 * Math.sin(t * 40) : 0;
  const color = clamp((t - SN.burst) / 0.1);
  const antic = kf(t, [[SN.antic, 1], [SN.burst, 0.94]], eOut);
  const push = t > SN.burst ? 0.46 * eIn(clamp((t - SN.burst) / 0.6)) : 0;
  const s = antic + push;
  const y = CY + 60 * push;
  const sil = t >= SN.sil;
  const chrom = 6 * decay(t, SN.burst, 12);
  return (
    <AbsoluteFill>
      {(holo > 0 || sil) && color < 1 && (
        <Layer src="character" x={CX} y={y} w={CW} aspect={ASPECT.character} transform={`scale(${s})`} opacity={sil ? 1 - color : holo}
          filter={`brightness(0) drop-shadow(0 0 3px rgba(200,150,255,1)) drop-shadow(0 0 18px rgba(${P},1))`} />
      )}
      {color > 0 && (
        <Layer src="character" x={CX} y={y} w={CW} aspect={ASPECT.character} transform={`scale(${s}) rotate(${-3 * push}deg)`} opacity={color}
          filter={`drop-shadow(${chrom}px 0 0 rgba(255,40,90,0.6)) drop-shadow(${-chrom}px 0 0 rgba(40,200,255,0.6)) drop-shadow(0 0 30px rgba(${P},0.9))`} />
      )}
    </AbsoluteFill>
  );
};

const AttackPaw: React.FC = () => {
  const t = useT();
  if (t < SN.paw || t > SN.hit + 0.12) return null;
  const s0 = 0.94 + 0.46 * eIn(clamp((SN.paw - SN.burst) / 0.6));
  const x0 = CX + (0.66 - 0.5) * CW * s0, y0 = CY + 60 * (s0 - 0.94) / 0.46 + (0.83 - 0.5) * CH * s0;
  const p = clamp((t - SN.paw) / (SN.hit - SN.paw));
  const e = eIn(p);
  const post = clamp((t - SN.hit) / 0.12);
  const w = 0.38 * CW * s0 * (1 + 11 * e + 10 * post);
  return <Sprite src="paw" x={x0 + (960 - x0) * e} y={y0 + (560 - y0) * e} w={w} rot={-8 * e} opacity={1 - post}
    filter="drop-shadow(0 20px 30px rgba(0,0,0,0.6))" />;
};

const SpeedLines: React.FC<{t: number}> = ({t}) => {
  if (t < SN.burst || t > SN.hit) return null;
  const op = clamp((t - SN.burst) / 0.1);
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: op}}>
      {new Array(56).fill(0).map((_, i) => {
        const a = random(`la${i}`) * Math.PI * 2, len = 200 + 300 * random(`ll${i}`);
        const r0 = 380 + (((random(`lr${i}`) * 900 - t * 4200) % 900) + 900) % 900;
        return <line key={i} x1={960 + r0 * Math.cos(a)} y1={540 + r0 * Math.sin(a)} x2={960 + (r0 + len) * Math.cos(a)} y2={540 + (r0 + len) * Math.sin(a)}
          stroke={i % 3 ? 'rgba(230,210,255,0.8)' : `rgba(${OR},0.9)`} strokeWidth={2 + 4 * random(`lw${i}`)} strokeLinecap="round" />;
      })}
    </svg>
  );
};

// ---- scene B: hero ---------------------------------------------------------------------------------------------
const ORBIT = [0, 1, 2];
const orbitPos = (i: number, t: number) => {
  const a = t * 1.3 + (i / 3) * Math.PI * 2, tilt = -0.2;
  const ex = 560 * Math.cos(a), ey = 130 * Math.sin(a);
  return {x: 960 + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: 450 + ex * Math.sin(tilt) + ey * Math.cos(tilt), front: Math.sin(a) > 0, depth: (Math.sin(a) + 1) / 2};
};
const logoScale = (t: number) => {
  const f = (t - SN.logo) * 30;
  if (f < 0) return 0;
  return kf(f, [[0, 1.6], [3, 0.92], [6, 1.04], [9, 1.0]], eOut);
};

const SceneB: React.FC<{t: number; beat: number}> = ({t, beat}) => {
  const portalS = kf(t, [[5.0, 0.72], [6.0, 0.78], [7.5, 1.12]], eOut);
  const bright = 0.8 * decay(t, SN.expl, 5) + 0.6 * decay(t, SN.logo, 6) + 6 * beat;
  const hero = springT(t - SN.expl, 7, 14);
  const floatY = t < SN.expl ? -20 * clamp((t - SN.hit) / 1.0) : -20 + 30 * hero;
  const mY = 420 + floatY + 7 * Math.sin(t * 2.2) * clamp(t - SN.expl - 0.6);
  const mRot = t < SN.expl ? -4 + 2 * clamp(t - SN.hit) : -2 + 2 * clamp(hero) + 1.2 * Math.sin(t * 1.3) * clamp(t - SN.expl - 0.6);
  const flutter = 1 + 1.5 * clamp((t - SN.expl) / 0.3) * (1 - clamp((t - 7.5) / 0.8));
  const ls = logoScale(t);
  const chromL = 7 * decay(t, SN.logo, 10);
  const bellT = t - 6.25;
  const bellY = bellT < 0 ? -400 : 205 - 600 * (1 - springT(bellT, 8, 12));
  const bellA = bellT < 0 ? 0 : 26 * decay(t, 6.25, 3) * Math.cos(bellT * 7) + 22 * decay(t, SN.bell, 2.2) * Math.sin((t - SN.bell) * 9) * (t >= SN.bell ? 1 : 0)
    + 3 * Math.sin(t * 2.4);
  const orbitOn = clamp((t - 6.2) / 0.5);
  const drop = (() => {
    if (t < SN.drop) return null;
    const p = clamp((t - SN.drop) / 0.32);
    if (p < 1) return {x: 1760 - 500 * eOut(p), y: -150 + 1150 * eIn(p), w: 900 - 810 * eOut(p), ph: t * 26, rot: 200 * p};
    const q = t - SN.drop - 0.32;
    const hop = q < 0.22 ? 50 * Math.sin((Math.PI * q) / 0.22) : q < 0.34 ? 14 * Math.sin((Math.PI * (q - 0.22)) / 0.12) : 0;
    return {x: 1260 + 20 * clamp(q / 0.34), y: 1000 - hop, w: 90, ph: q < 0.34 ? 60 + q * 18 : 66, rot: 0};
  })();
  const slashP = clamp((t - SN.bass) / 0.28);
  return (
    <AbsoluteFill>
      <Plane cam={camB(t)} f={0.35}>
        <Bg t={t} level={1} portalY={430} />
        {[0, 1, 2].map((i) => {
          const p = ((t * 0.35 + i * 0.33) % 1);
          return <div key={i} style={{position: 'absolute', left: -600 + 3000 * p, top: 180 + 300 * i, width: 900, height: 3, opacity: 0.5 * Math.sin(Math.PI * p),
            background: `linear-gradient(90deg, rgba(${P},0), rgba(255,220,255,0.9), rgba(${P},0))`, transform: 'rotate(-12deg)'}} />;
        })}
        <Portal t={t} x={960} y={430} w={1000} s={portalS} bright={bright} />
        {new Array(40).fill(0).map((_, i) => {
          const x = random(`bx${i}`) * 1920 + 30 * Math.sin(t + i), y = ((random(`by${i}`) * 1200 - t * (20 + 30 * random(`bv${i}`))) % 1200 + 1200) % 1200 - 60;
          const r = 1.5 + 3 * random(`br${i}`);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 2 * r, height: 2 * r, borderRadius: '50%',
            background: i % 3 ? `rgba(200,160,255,${0.3 + 0.4 * Math.sin(t * 3 + i) ** 2})` : `rgba(${OR},0.7)`, boxShadow: `0 0 8px rgba(${P},0.8)`}} />;
        })}
      </Plane>
      <Plane cam={camB(t)} f={0.7}>
        {/* cloth ribbons behind the mascot */}
        <Sprite src="cloth_01" x={600} y={560} w={540} rot={-14 + 4 * flutter * Math.sin(t * 1.7)} sy={1 + 0.06 * flutter * Math.sin(t * 2.3)}
          filter="drop-shadow(0 10px 14px rgba(0,0,0,0.5))" />
        <Sprite src="cloth_02" x={1340} y={330} w={320} rot={18 + 5 * flutter * Math.sin(t * 1.9 + 1)} sy={1 + 0.08 * flutter * Math.sin(t * 2.6 + 1)}
          filter="drop-shadow(0 10px 14px rgba(0,0,0,0.5))" />
        {ORBIT.map((i) => { const o = orbitPos(i, t); return o.front ? null : <Cn key={i} x={o.x} y={o.y} w={(70 + 40 * o.depth) * orbitOn} phase={t * 12 + i * 2} opacity={orbitOn} />; })}
        {/* shockwave + logo */}
        {t >= SN.logo && [0, 1].map((i) => {
          const q = clamp((t - SN.logo - 0.06 * i) / 0.6);
          return <div key={i} style={{position: 'absolute', left: 960 - 1100 * eOut(q), top: 830 - 420 * eOut(q), width: 2200 * eOut(q), height: 840 * eOut(q), borderRadius: '50%',
            border: `${30 * (1 - q)}px solid rgba(${i ? OR : '180,120,255'},${1 - q})`, boxShadow: `0 0 40px rgba(${P},${1 - q})`}} />;
        })}
        {ls > 0 && (
          <Layer src="logo_text" x={960} y={836} w={820} aspect={ASPECT.logo_text} transform={`scale(${ls * (1 + beat)})`}
            filter={`drop-shadow(${chromL}px 0 0 rgba(255,40,90,0.6)) drop-shadow(${-chromL}px 0 0 rgba(40,200,255,0.6)) drop-shadow(0 0 22px rgba(${P},0.8)) drop-shadow(0 14px 18px rgba(0,0,0,0.8))`}>
            <Shine src="logo_text" t={t} at={[SN.bass, 9.1]} dur={0.35} />
          </Layer>
        )}
        {t >= SN.bass && slashP < 1 && <Sprite src="effect_03" x={420 + 1100 * eInOut(slashP)} y={820} w={420} sx={3} rot={-8} opacity={Math.sin(Math.PI * slashP)} blend="screen" />}
      </Plane>
      <Plane cam={camB(t)} f={1}>
        {/* bell charm hanging off the portal */}
        <div style={{position: 'absolute', left: 1400 - 150, top: bellY, width: 300, height: 300 * (191 / 342), transformOrigin: '50% 0%', transform: `rotate(${bellA}deg)`}}>
          <Img src={el('rope_bell')} style={{width: '100%', filter: `drop-shadow(0 0 ${10 + 30 * decay(t, SN.bell, 5)}px rgba(255,210,90,0.9))`}} />
        </div>
        <Layer src="character" x={960} y={mY} w={700} aspect={ASPECT.character} transform={`scale(${1 + beat}) rotate(${mRot}deg)`}
          filter={`drop-shadow(0 0 ${24 + 50 * beat}px rgba(${P},0.9)) drop-shadow(0 26px 30px rgba(0,0,0,0.6))`}>
          <Shine src="character" t={t} at={[6.9, 9.2]} />
        </Layer>
        {ORBIT.map((i) => { const o = orbitPos(i, t); return o.front ? <Cn key={i} x={o.x} y={o.y} w={(70 + 40 * o.depth) * orbitOn} phase={t * 12 + i * 2} opacity={orbitOn} /> : null; })}
        {/* energy spiral pulling in */}
        {t >= SN.expl && t < 7.3 && new Array(10).fill(0).map((_, i) => {
          const t0 = SN.expl + 0.08 * i, p = clamp((t - t0) / 0.6);
          if (p <= 0 || p >= 1) return null;
          const a0 = i * 2.4, r = 950 * (1 - eIn(p)), a = a0 + 2.6 * p;
          return <Sprite key={i} src={['effect_01', 'effect_12', 'effect_06', 'effect_03', 'effect_07'][i % 5]} x={960 + r * Math.cos(a) * 1.2} y={440 + r * Math.sin(a) * 0.8}
            w={200 * (0.5 + 0.5 * (1 - p))} rot={a * 57.3 + 90} opacity={p < 0.8 ? 1 : (1 - p) * 5} blend="screen" />;
        })}
      </Plane>
      <Plane cam={camB(t)} f={1.6}>
        {drop && <Cn x={drop.x} y={drop.y} w={drop.w} phase={drop.ph} rot={drop.rot} glow={0.8} />}
        {new Array(10).fill(0).map((_, i) => {
          const x = random(`fx${i}`) * 1920 + 60 * Math.sin(t * 0.7 + i), y = ((random(`fy${i}`) * 1300 - t * 45) % 1300 + 1300) % 1300 - 100;
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 14, height: 14, borderRadius: '50%', filter: 'blur(5px)',
            background: i % 2 ? 'rgba(210,170,255,0.6)' : `rgba(${OR},0.5)`}} />;
        })}
      </Plane>
    </AbsoluteFill>
  );
};

export const Snatch: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const beat = beatPulse(t, SN_BEATS, 0.018);
  const cam = camA(t);
  const level = 0.15 + 0.85 * eOut(clamp((t - SN.ign) / 0.4));
  const portalS = t < SN.ign ? 0 : springT(t - SN.ign, 8, 16) * (1 - 0.06 * eOut(clamp((t - SN.antic) / 0.3)) + 0.25 * eIn(clamp((t - SN.burst) / 0.7)));
  const portalBright = 0.5 * decay(t, SN.ign, 5) + 0.6 * clamp((t - SN.antic) / 0.3) + 1.2 * decay(t, SN.burst, 5);
  const amp = shake(t);
  const flash = 0.35 * decay(t, SN.ign, 12) + 0.3 * decay(t, SN.snatch, 16) + 0.55 * decay(t, SN.sil, 16) + 0.6 * decay(t, SN.burst, 12)
    + 0.95 * decay(t, SN.hit, 8) + 0.3 * decay(t, SN.expl, 10) + 0.45 * decay(t, SN.logo, 12) + 0.25 * decay(t, SN.bass, 16);
  const lightning = [15, 16, 20, 21].includes(frame);
  const wipeP = clamp((t - SN.hit) / SN.wipe);
  const xt = -700 + 3300 * eInOut(wipeP), xb = xt - 800;
  const showA = t < SN.hit + SN.wipe;
  const showB = t >= SN.hit;
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_snatch.wav')} />
      <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${amp * Math.cos(t * 83)}px)`}}>
        {showA && (
          <AbsoluteFill>
            <Plane cam={cam} f={0.35}>
              <Bg t={t} level={level + (lightning ? 0.3 : 0)} portalY={CY} />
              {/* awakening: particles spiral into the centre */}
              {t < SN.antic + 0.4 && new Array(70).fill(0).map((_, i) => {
                const d = 0.9 + 0.8 * random(`pd${i}`), t0 = -0.3 + random(`pt${i}`) * 1.2 + (i >= 40 ? 2.8 : 0);
                const p = clamp((t - t0) / d);
                if (p <= 0 || p >= 1) return null;
                const r = (500 + 700 * random(`pr${i}`)) * (1 - eIn(p)), a = random(`pa${i}`) * Math.PI * 2 + 2.2 * p;
                return <div key={i} style={{position: 'absolute', left: CX + r * Math.cos(a) * 1.3, top: CY + r * Math.sin(a) * 0.8, width: 6, height: 6, borderRadius: 3,
                  background: i % 5 ? 'rgba(190,140,255,0.9)' : `rgba(${OR},0.9)`, boxShadow: `0 0 10px rgba(${P},1)`, opacity: Math.sin(Math.PI * p)}} />;
              })}
              {lightning && <>
                <Sprite src={frame < 18 ? 'effect_06' : 'effect_12'} x={frame < 18 ? 760 : 1150} y={frame < 18 ? 420 : 560} w={520} rot={frame < 18 ? -20 : 25} blend="screen"
                  filter={`drop-shadow(0 0 30px rgba(${P},1))`} />
                <Sprite src="effect_02" x={frame < 18 ? 1180 : 820} y={frame < 18 ? 620 : 380} w={380} rot={160} blend="screen" />
              </>}
              <Portal t={t} x={CX} y={CY} w={900} s={portalS} bright={portalBright} />
            </Plane>
            <Plane cam={cam} f={1}>
              <CameraMotionBlur shutterAngle={220} samples={5}><MidCoins /></CameraMotionBlur>
              {t >= SN.snatch - 0.03 && t < SN.snatch + 0.01 && <Sprite src="effect_09" x={960} y={480} w={420} rot={-15} blend="screen" />}
              {t >= SN.snatch + 0.07 && t < SN.snatch + 0.5 && (
                <Sprite src="effect_12" x={960 - 500 * eOut(clamp((t - SN.snatch - 0.07) / 0.15))} y={500} w={700} sx={-2.4} sy={0.6} rot={0}
                  opacity={1 - clamp((t - SN.snatch - 0.1) / 0.4)} blend="screen" />
              )}
              {t >= SN.snatch + 0.05 && t < 3.2 && [0, 1, 2, 3].map((i) => {
                const q = t - SN.snatch - 0.05;
                return <Sprite key={i} src={i % 2 ? 'ear_fluff_01' : 'ear_fluff_02'} x={960 + (i - 1.5) * 90 + (i - 1.5) * 60 * q} y={470 + 90 * q * q - 60 * q + 20 * Math.sin(q * 3 + i)}
                  w={70} rot={q * 90 * (i % 2 ? 1 : -1) + i * 40} opacity={1 - clamp((q - 0.6) / 0.5)} />;
              })}
              <Assembly t={t} />
              <CameraMotionBlur shutterAngle={200} samples={5}><MascotA /></CameraMotionBlur>
              {t >= SN.burst && t < SN.hit && new Array(22).fill(0).map((_, i) => {
                const q = clamp((t - SN.burst - 0.02 * (i % 6)) / 0.5), a = random(`oa${i}`) * Math.PI * 2, r = 120 + 900 * eOut(q);
                return q <= 0 || q >= 1 ? null : <Sprite key={i} src="effect_05" x={CX + r * Math.cos(a)} y={CY + r * Math.sin(a)} w={70} rot={a * 57.3 + 45} opacity={1 - q} blend="screen" />;
              })}
            </Plane>
            <Plane cam={cam} f={1.6}>
              <CameraMotionBlur shutterAngle={220} samples={5}><FgCoins /></CameraMotionBlur>
            </Plane>
            <SpeedLines t={t} />
            <CameraMotionBlur shutterAngle={200} samples={5}><AttackPaw /></CameraMotionBlur>
          </AbsoluteFill>
        )}
        {showB && (
          <AbsoluteFill style={{clipPath: wipeP < 1 ? `polygon(-2000px -100px, ${xt}px -100px, ${xb}px 1180px, -2000px 1180px)` : undefined}}>
            <SceneB t={t} beat={beat} />
          </AbsoluteFill>
        )}
        {showB && wipeP < 1 && <>
          <Sprite src="effect_01" x={(xt + xb) / 2} y={540} w={1500} rot={-58} sy={1.3} blend="screen" filter={`drop-shadow(0 0 40px rgba(${P},1)) brightness(1.4)`} />
          <Sprite src="effect_12" x={(xt + xb) / 2 + 60} y={520} w={1300} rot={-60} opacity={0.9} blend="screen" />
        </>}
      </AbsoluteFill>
      <Vignette strength={0.7} />
      <Grain frame={frame} opacity={0.05} />
      <AbsoluteFill style={{backgroundColor: 'rgb(245,235,255)', opacity: Math.min(1, flash)}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: Math.max(1 - clamp(t / 0.25), eIn(clamp((t - SN.fade) / 0.3)))}} />
    </AbsoluteFill>
  );
};
