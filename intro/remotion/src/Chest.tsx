import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASPECT, Coin, Grain, Layer, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eInOut, eOut, el, springT} from './lib';

// 10 s loot-chest reveal: a chest drops into a dark vault, rattles with light leaking from the seam, the lid blasts
// open in a fountain of coins, the bunny rises out, title slam, glowing hold, the bunny dives back and the lid slams.
export const LT = {land: 0.9, rattle: 1.6, open: 3.0, rise: 3.25, text: 4.6, out: 9.0, slam: 9.45, end: 10.0};
export const LT_BEATS = Array.from({length: 8}, (_, i) => 5.0 + 0.5 * i);
const W = 560, H = 250, D = 340, LH = 110;
const MOUTH_Y = 600;   // screen y of the chest opening (for clipping the bunny as it rises)

const wood = (a: string, b: string): React.CSSProperties => ({
  background: `linear-gradient(90deg, #f2c14e 0 18px, #9a5a12 18px 24px, transparent 24px calc(100% - 24px), #9a5a12 calc(100% - 24px) calc(100% - 18px), #f2c14e calc(100% - 18px)),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 50px), linear-gradient(180deg, ${a}, ${b})`,
  boxShadow: 'inset 0 0 0 5px #f2c14e, inset 0 0 0 9px #7a3d0c',
});

const Face: React.FC<{w: number; h: number; tf: string; style: React.CSSProperties; children?: React.ReactNode}> = ({w, h, tf, style, children}) => (
  <div style={{position: 'absolute', left: -w / 2, top: -h / 2, width: w, height: h, transform: tf, backfaceVisibility: 'hidden', ...style}}>{children}</div>
);

const Box: React.FC<{w: number; h: number; d: number; front: React.CSSProperties; side: React.CSSProperties; top: React.CSSProperties; bottom?: React.CSSProperties;
  frontChild?: React.ReactNode; inner?: boolean}> = ({w, h, d, front, side, top, bottom, frontChild, inner}) => (
  <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d'}}>
    <Face w={w} h={h} tf={`translateZ(${d / 2}px)`} style={front}>{frontChild}</Face>
    <Face w={w} h={h} tf={`rotateY(180deg) translateZ(${d / 2}px)`} style={front} />
    <Face w={d} h={h} tf={`rotateY(90deg) translateZ(${w / 2}px)`} style={side} />
    <Face w={d} h={h} tf={`rotateY(-90deg) translateZ(${w / 2}px)`} style={side} />
    <Face w={w} h={d} tf={`rotateX(90deg) translateZ(${h / 2}px)`} style={top} />
    <Face w={w} h={d} tf={`rotateX(-90deg) translateZ(${h / 2}px)`} style={bottom ?? side} />
    {inner && <>
      {/* inside of the chest, visible once the lid is open */}
      <Face w={w - 16} h={h} tf={`translateZ(${-d / 2 + 8}px)`} style={{background: 'linear-gradient(180deg, #4a1a8a, #1c0838)'}} />
      <Face w={w - 16} h={h} tf={`translateZ(${d / 2 - 8}px) rotateY(180deg)`} style={{background: 'linear-gradient(180deg, #4a1a8a, #1c0838)'}} />
      <Face w={d - 16} h={h} tf={`translateX(${-w / 2 + 8}px) rotateY(90deg)`} style={{background: 'linear-gradient(180deg, #3b1370, #1c0838)'}} />
      <Face w={d - 16} h={h} tf={`translateX(${w / 2 - 8}px) rotateY(-90deg)`} style={{background: 'linear-gradient(180deg, #3b1370, #1c0838)'}} />
      <Face w={w - 16} h={d - 16} tf={`translateY(${h / 2 - 60}px) rotateX(90deg)`}
        style={{background: 'radial-gradient(circle at 50% 50%, #fffbe6, #ffd45c 35%, #d98a1c 70%, #7a3d0c)'}} />
    </>}
  </div>
);

const ChestObj: React.FC<{t: number}> = ({t}) => {
  // drop in, land, rattle, blast open, slam shut
  const drop = eIn(clamp((t - 0.3) / (LT.land - 0.3)));
  let y = -900 * (1 - drop) + 30 * decay(t, LT.land, 9) * Math.abs(Math.sin((t - LT.land) * 20));
  const rattleAmt = clamp((t - LT.rattle) / (LT.open - LT.rattle)) * (t < LT.open ? 1 : 0);
  const kick = rattleAmt * Math.max(0, Math.sin(t * 18)) ** 6;
  y -= 30 * kick;
  const rz = rattleAmt * 4 * Math.sin(t * 37);
  let lid = -6 * kick - 3 * rattleAmt;                                        // lid lifts a crack while rattling
  if (t >= LT.open) lid = -118 * springT(t - LT.open, 6, 14);
  if (t >= LT.out) lid = -118 + 118 * eIn(clamp((t - LT.out) / (LT.slam - LT.out)));
  if (t >= LT.slam) { lid = 6 * decay(t, LT.slam, 12) * Math.sin((t - LT.slam) * 40); y -= 40 * decay(t, LT.slam, 10) * Math.abs(Math.sin((t - LT.slam) * 16)); }
  const yaw = -38 + 18 * eInOut(clamp((t - 0.3) / 2.7)) + 3 * Math.sin(t * 0.7);
  const scale = 1 + 0.08 * clamp((t - LT.open) / 0.6);
  const glowLid = 0.6 + 0.4 * Math.sin(t * 5);
  return (
    <div style={{position: 'absolute', left: 960, top: 690, transformStyle: 'preserve-3d',
      transform: `perspective(1800px) translateY(${y}px) rotateX(-26deg) rotateY(${yaw}deg) rotateZ(${rz}deg) scale(${scale})`}}>
      <Box w={W} h={H} d={D} inner front={wood('#6b2bc4', '#2a0c54')} side={wood('#5a22a8', '#220944')} top={{background: 'transparent', boxShadow: 'inset 0 0 0 14px #f2c14e, inset 0 0 0 18px #7a3d0c'}}
        frontChild={<>
          <Img src={el('paw')} style={{position: 'absolute', left: W / 2 - 70, top: 80, width: 140, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))'}} />
          <div style={{position: 'absolute', left: W / 2 - 38, top: -6, width: 76, height: 70, borderRadius: '0 0 18px 18px', background: 'linear-gradient(180deg, #ffe07a, #c7801c)',
            boxShadow: 'inset 0 0 0 4px #7a3d0c'}}>
            <div style={{position: 'absolute', left: 30, top: 24, width: 16, height: 26, borderRadius: 8, background: '#3b1370'}} />
          </div>
        </>} />
      <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transformOrigin: '0 0',
        transform: `translateY(${-H / 2}px) translateZ(${-D / 2}px) rotateX(${-lid}deg) translateZ(${D / 2}px) translateY(${-LH / 2}px)`}}>
        <Box w={W + 16} h={LH} d={D + 16} front={wood('#7b35e0', '#3b1370')} side={wood('#6b2bc4', '#2a0c54')}
          top={{...wood('#8b45f0', '#4a1a8a'), backgroundSize: 'auto'}} bottom={{background: `radial-gradient(circle, rgba(255,230,150,${glowLid}), #7a3d0c)`}}
          frontChild={<Img src={el('coin_01')} style={{position: 'absolute', left: (W + 16) / 2 - 38, top: 14, width: 76}} />} />
      </div>
    </div>
  );
};

export const Chest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const beat = beatPulse(t, LT_BEATS, 0.02);
  const open = t >= LT.open && t < LT.slam;
  const openP = open ? eOut(clamp((t - LT.open) / 0.4)) * (1 - clamp((t - LT.out) / 0.45)) : 0;
  const amp = 26 * decay(t, LT.land, 10) + 30 * decay(t, LT.open, 7) + 26 * decay(t, LT.slam, 10) + 4 * clamp((t - LT.rattle) / 1.4) * (t < LT.open ? 1 : 0);
  const flash = 0.7 * decay(t, LT.open, 10) + 0.3 * decay(t, LT.text, 18) + 0.5 * decay(t, LT.slam, 14);
  // bunny: rises out of the chest mouth, clipped below the rim while inside
  const rise = springT(t - LT.rise, 7, 13);
  const dive = eIn(clamp((t - LT.out) / 0.4));
  const by = 700 - 360 * rise + 520 * dive + 8 * Math.sin(t * 2.2) * clamp((t - LT.text) / 0.5);
  const inside = t < LT.text || t >= LT.out;
  const ts = springT(t - LT.text, 10, 24);
  const seam = clamp((t - LT.rattle) / (LT.open - LT.rattle)) * (t < LT.open ? 1 : 0);
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_chest.wav')} />
      <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${amp * Math.cos(t * 83)}px) scale(${1.04 + 0.05 * clamp((t - LT.text) / 4.4)})`}}>
        {/* vault room: back wall, floor, light cone */}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #3a1270 0%, #160530 50%, #050109 100%)'}} />
        <div style={{position: 'absolute', left: 0, top: 700, width: 1920, height: 380, background: 'linear-gradient(180deg, #1c0838, #07020f)',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,205,70,0.06) 0 2px, transparent 2px 160px), linear-gradient(180deg, #1c0838, #07020f)'}} />
        <div style={{position: 'absolute', left: 960 - 520, top: 820, width: 1040, height: 150, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,190,70,${0.1 + 0.45 * openP}) 0%, rgba(0,0,0,0) 70%)`}} />
        {/* god rays out of the chest */}
        {openP > 0 && (
          <div style={{position: 'absolute', left: 960 - 1400, top: MOUTH_Y - 1400, width: 2800, height: 2800, opacity: openP * (0.85 + 6 * beat), transform: `rotate(${t * 10}deg)`,
            background: 'repeating-conic-gradient(from 0deg, rgba(255,220,120,0.35) 0deg 5deg, rgba(0,0,0,0) 5deg 14deg)', mixBlendMode: 'screen',
            WebkitMaskImage: 'radial-gradient(circle, black 3%, transparent 45%)', maskImage: 'radial-gradient(circle, black 3%, transparent 45%)'}} />
        )}
        {new Array(36).fill(0).map((_, i) => {
          const x = random(`dx${i}`) * 1920, y = ((random(`dy${i}`) * 1080 - t * 18) % 1080 + 1080) % 1080, r = 1.5 + 3 * random(`dr${i}`);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 2 * r, height: 2 * r, borderRadius: '50%',
            background: `rgba(255,220,140,${(0.15 + 0.35 * openP) * (0.5 + 0.5 * Math.sin(t * 2 + i))})`}} />;
        })}
        {/* shadow under the chest */}
        <div style={{position: 'absolute', left: 960 - 380, top: 850, width: 760, height: 90, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', filter: 'blur(18px)',
          opacity: eIn(clamp((t - 0.3) / 0.6))}} />
        <AbsoluteFill style={{filter: `drop-shadow(0 30px 40px rgba(0,0,0,0.7)) drop-shadow(0 0 ${20 + 40 * seam}px rgba(255,200,80,${0.25 + 0.5 * seam}))`}}>
          <ChestObj t={t} />
        </AbsoluteFill>
        {/* bunny inside the chest: clipped at the front rim */}
        {t >= LT.rise && inside && (
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: MOUTH_Y, overflow: 'hidden'}}>
            <Layer src="character" x={960} y={by} w={640} aspect={ASPECT.character} transform={`scale(${0.7 + 0.3 * rise})`}
              filter={`drop-shadow(0 0 30px rgba(255,200,90,0.8))`} />
          </div>
        )}
        {/* light leaking out of the seam while rattling */}
        {seam > 0 && <div style={{position: 'absolute', left: 960 - 330, top: MOUTH_Y - 30, width: 660, height: 60, borderRadius: '50%', mixBlendMode: 'screen',
          background: `radial-gradient(ellipse, rgba(255,235,160,${0.9 * seam}), rgba(255,160,40,0) 70%)`, transform: `scaleX(${0.8 + 0.3 * Math.sin(t * 30)})`}} />}
        {/* coin fountain */}
        {t >= LT.open && t < LT.slam && new Array(34).fill(0).map((_, i) => {
          const t0 = LT.open + 0.04 * i + (i > 20 ? 1.2 + 0.25 * (i - 20) : 0);
          const tau = t - t0;
          if (tau < 0 || tau > 2.2) return null;
          const vx = (random(`vx${i}`) - 0.5) * 1300, vy = -900 - 600 * random(`vy${i}`);
          const x = 960 + (random(`ox${i}`) - 0.5) * 300 + vx * tau, y = MOUTH_Y + vy * tau + 1300 * tau * tau;
          return <Coin key={i} x={x} y={y} w={60 + 50 * random(`cw${i}`)} phase={t * 14 + i} opacity={clamp((2.2 - tau) / 0.3)} />;
        })}
        {t >= LT.open && t < LT.open + 0.7 && new Array(14).fill(0).map((_, i) => {
          const p = (t - LT.open) / 0.7, a = -Math.PI * (0.1 + 0.8 * random(`ea${i}`)), r = 150 + 750 * eOut(p);
          return <Sprite key={i} src={['effect_03', 'effect_05', 'effect_08'][i % 3]} x={960 + r * Math.cos(a) * 1.3} y={MOUTH_Y + r * Math.sin(a)} w={120}
            rot={a * 57 + 90} opacity={1 - p} blend="screen" />;
        })}
        {/* bunny once clear of the chest */}
        {t >= LT.rise && !inside && (
          <Layer src="character" x={960} y={by} w={640} aspect={ASPECT.character} transform={`scale(${(0.7 + 0.3 * rise) * (1 + beat)}) rotate(${2 * Math.sin(t * 1.1)}deg)`}
            filter={`drop-shadow(0 0 ${30 + 60 * beat}px rgba(255,200,90,0.8)) drop-shadow(0 26px 30px rgba(0,0,0,0.6))`}>
            <Shine src="character" t={t} at={[5.6, 7.4]} />
          </Layer>
        )}
        {t >= LT.text && t < LT.out + 0.5 && (
          <Layer src="logo_text" x={960} y={872} w={700} aspect={ASPECT.logo_text} transform={`scale(${(2.3 - 1.3 * ts) * (1 + beat)})`}
            opacity={clamp(ts * 5) * (1 - clamp((t - LT.out) / 0.35))} filter="drop-shadow(0 0 22px rgba(255,205,70,0.7)) drop-shadow(0 14px 18px rgba(0,0,0,0.8))">
            <Shine src="logo_text" t={t} at={[5.3, 6.9, 8.3]} />
          </Layer>
        )}
        <Vignette strength={0.75} />
      </AbsoluteFill>
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{backgroundColor: 'rgb(255,240,200)', opacity: flash}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: Math.max(1 - clamp(t / 0.35), clamp((t - LT.slam - 0.2) / 0.35))}} />
    </AbsoluteFill>
  );
};
