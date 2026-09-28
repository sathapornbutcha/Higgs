import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASPECT, Coin, Layer, Shine, beatPulse, clamp, eIn, eInOut, eOut, el, springT} from './lib';

// 10 s clean brand motion design: colour circles pop and wipe the frame, lines draw, the bunny is revealed in a
// circle, the title wipes in behind an orange bar, geometric shapes orbit, then an iris closes.
export const KN = {circles: 0.1, wipes: 0.6, lines: 1.6, reveal: 2.4, text: 3.4, hold: 4.2, out: 9.0, end: 10.0};
export const KN_BEATS = Array.from({length: 10}, (_, i) => 4.5 + 0.5 * i);
const C = {cream: '#fff4e6', purple: '#8b3dff', orange: '#ff8c1a', deep: '#1b0b33', lilac: '#c9a7ff'};

const Circle: React.FC<{x: number; y: number; r: number; color: string; stroke?: number; dash?: string; rot?: number; opacity?: number}> = ({x, y, r, color, stroke, dash, rot = 0, opacity = 1}) => (
  <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity}}>
    <circle cx={x} cy={y} r={Math.max(0, r)} fill={stroke ? 'none' : color} stroke={stroke ? color : 'none'} strokeWidth={stroke} strokeDasharray={dash}
      transform={`rotate(${rot} ${x} ${y})`} strokeLinecap="round" />
  </svg>
);

const Shape: React.FC<{kind: number; x: number; y: number; s: number; rot: number; color: string}> = ({kind, x, y, s, rot, color}) => (
  <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {kind === 0 && <polygon points="0,-26 23,14 -23,14" fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round" />}
      {kind === 1 && <circle r={18} fill="none" stroke={color} strokeWidth={7} />}
      {kind === 2 && <path d="M-18,0 H18 M0,-18 V18" stroke={color} strokeWidth={8} strokeLinecap="round" />}
      {kind === 3 && <rect x={-16} y={-16} width={32} height={32} rx={6} fill={color} />}
    </g>
  </svg>
);

export const Kinetic: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const beat = beatPulse(t, KN_BEATS, 0.02);
  // 1) three dots pop, 2) each expands to fill the frame in turn
  const wipeColors = [C.purple, C.orange, C.deep];
  let bg = C.cream;
  wipeColors.forEach((c, i) => { if (t >= KN.wipes + 0.3 * i + 0.3) bg = c; });
  const layers: React.ReactNode[] = [];
  wipeColors.forEach((c, i) => {
    const pop = springT(t - KN.circles - 0.12 * i, 10, 26);
    const grow = eIn(clamp((t - KN.wipes - 0.3 * i) / 0.32));
    if (pop <= 0 || t >= KN.wipes + 0.3 * i + 0.32) return;
    const r = 40 * pop + 1300 * grow;
    layers.push(<Circle key={i} x={960 + (i - 1) * 140 * (1 - grow)} y={540} r={r} color={c} />);
  });
  // 3) lines draw across the deep background
  const lp = eInOut(clamp((t - KN.lines) / 0.8));
  const lineFade = 1 - clamp((t - KN.reveal - 0.4) / 0.5) * 0.6;
  // 4) the bunny revealed inside a growing circle, ring drawn around it
  const rv = eOut(clamp((t - KN.reveal) / 0.7));
  const ringDraw = eInOut(clamp((t - KN.reveal - 0.2) / 0.9));
  const R = 330 * rv * (1 + beat);
  // 5) title wipe behind an orange bar
  const tw = eInOut(clamp((t - KN.text) / 0.7));
  const bar = t >= KN.text && t < KN.text + 0.95;
  // 6) iris out
  const iris = t < KN.out ? 3000 : 1400 * (1 - eIn(clamp((t - KN.out) / 0.7)));
  const hold = clamp((t - KN.hold) / 0.6);
  const cy = 420;
  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_kinetic.wav')} />
      <AbsoluteFill style={{clipPath: `circle(${iris}px at 960px ${cy}px)`}}>
        <AbsoluteFill style={{backgroundColor: bg}} />
        {bg === C.deep && <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, rgba(201,167,255,0.18) 0 2px, transparent 3px)`, backgroundSize: '44px 44px',
          backgroundPosition: `${t * 12}px 0`}} />}
        {layers}
        {t >= KN.lines && (
          <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: lineFade}}>
            <line x1={0} y1={250} x2={1920 * lp} y2={250} stroke={C.orange} strokeWidth={6} strokeLinecap="round" />
            <line x1={1920} y1={830} x2={1920 * (1 - lp)} y2={830} stroke={C.lilac} strokeWidth={6} strokeLinecap="round" />
            <line x1={330} y1={0} x2={330} y2={1080 * lp} stroke={C.purple} strokeWidth={10} strokeLinecap="round" />
            <line x1={1590} y1={1080} x2={1590} y2={1080 * (1 - lp)} stroke={C.orange} strokeWidth={10} strokeLinecap="round" />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={380 + i * 30} y={880} width={16} height={16 + 60 * lp * (0.5 + 0.5 * Math.sin(t * 6 + i))} rx={8} fill={C.orange} />)}
            {[0, 1, 2, 3].map((i) => <circle key={`c${i}`} cx={1480 - i * 34} cy={210} r={9 * lp} fill={C.lilac} />)}
          </svg>
        )}
        {rv > 0 && (
          <>
            <Circle x={960} y={cy} r={R} color={C.purple} />
            <Circle x={960} y={cy} r={R + 34} color={C.orange} stroke={10} dash={`${2 * Math.PI * (R + 34) * ringDraw} 99999`} rot={-90 + t * 30} />
            <Circle x={960} y={cy} r={R + 70} color={C.lilac} stroke={4} dash="14 22" rot={-t * 20} opacity={hold} />
            <div style={{position: 'absolute', left: 960 - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: '50%', overflow: 'hidden'}}>
              <Img src={el('back_frame')} style={{position: 'absolute', left: -R * 0.3, top: -R * 0.3, width: R * 2.6, height: R * 2.6, opacity: 0.55, transform: `rotate(${t * 25}deg)`}} />
            </div>
            <Layer src="character" x={960} y={cy + 20 - 60 * (1 - rv)} w={620 * (0.6 + 0.4 * rv)} aspect={ASPECT.character}
              transform={`translateY(${8 * Math.sin(t * 2.2) * hold}px) rotate(${2 * Math.sin(t * 1.3) * hold}deg) scale(${1 + beat})`}
              opacity={clamp(rv * 3)} filter="drop-shadow(0 18px 18px rgba(20,5,40,0.45))">
              <Shine src="character" t={t} at={[5.2, 7.4]} />
            </Layer>
          </>
        )}
        {t >= KN.text && (
          <div style={{position: 'absolute', left: 960 - 440, top: 845 - 110, width: 880, height: 230, clipPath: `inset(0 ${100 - 100 * tw}% 0 0)`}}>
            <Layer src="logo_text" x={440} y={110} w={860} aspect={ASPECT.logo_text} transform={`scale(${1 + beat})`} filter="drop-shadow(0 10px 12px rgba(0,0,0,0.4))">
              <Shine src="logo_text" t={t} at={[4.6, 6.4, 8.2]} />
            </Layer>
          </div>
        )}
        {bar && <div style={{position: 'absolute', left: 960 - 460 + 920 * tw - 20, top: 740, width: 40, height: 220, borderRadius: 20, background: C.orange,
          transform: `scaleY(${Math.sin(Math.PI * clamp((t - KN.text) / 0.95))})`}} />}
        {hold > 0 && new Array(12).fill(0).map((_, i) => {
          const th = (i / 12) * Math.PI * 2 + t * 0.5 * (i % 2 ? 1 : -1);
          const rr = (560 + 60 * Math.sin(t + i)) * eOut(hold);
          const col = [C.orange, C.lilac, C.purple, '#ffffff'][i % 4];
          return <Shape key={i} kind={i % 4} x={960 + rr * Math.cos(th) * 1.25} y={cy + 30 + rr * Math.sin(th) * 0.62} s={eOut(hold) * (1 + 3 * beat)} rot={t * 60 + i * 30} color={col} />;
        })}
        {hold > 0 && [0, 1, 2, 3].map((i) => {
          const th = (i / 4) * Math.PI * 2 + t * 0.8;
          return <Coin key={`k${i}`} x={960 + 470 * Math.cos(th)} y={cy + 180 * Math.sin(th)} w={70} phase={t * 10 + i} opacity={hold * (Math.sin(th) > -0.2 ? 1 : 0.5)} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
