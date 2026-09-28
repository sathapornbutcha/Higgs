"""Synthesize 10-second soundtracks for Chest, Gacha and CoinFlip (times match src/Chest.tsx, Gacha.tsx, CoinFlip.tsx)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
import core

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
SR = core.SR
midi = lambda n: 440 * 2 ** ((n - 69) / 12)


def mix(seed):
    core.DUR = 10.0
    return core.Mix(seed)


def snare(m, t0, g=0.3):
    tt, nz = m.ts(0.18), m.noise(0.18)
    m.at(t0, ((nz - m.lp(nz, 3)) * np.exp(-18 * tt) + np.sin(2 * np.pi * 190 * tt) * np.exp(-30 * tt)) * g)


def pluck(m, t0, f, g=0.18, d=0.35):
    tt = m.ts(d)
    m.at(t0, (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt)) * np.exp(-14 * tt) * g)


def riser(m, t0, d, g=0.4):
    tt = m.ts(d)
    m.at(t0, m.lp(m.noise(d), 6) * (tt / d) ** 2 * g + m.sweep(300 + 2000 * (tt / d) ** 2) * (tt / d) * g * 0.2)


def knock(m, t0, g=0.5, f=170):
    tt, nz = m.ts(0.15), m.noise(0.15)
    m.at(t0, (np.sin(2 * np.pi * f * tt) * np.exp(-35 * tt) + m.lp(nz, 5) * np.exp(-60 * tt) * 0.6) * g)


def boing(m, t0, g=0.4, f=220):
    tt = m.ts(0.35)
    m.at(t0, m.sweep(f * (1 + 1.2 * np.exp(-14 * tt)) + 40 * np.sin(2 * np.pi * 18 * tt)) * np.exp(-9 * tt) * g)


def groove(m, start, end, step, bass, g=0.8, notes=None):
    for k, b in enumerate(np.arange(start, end, step)):
        m.kick(b, g)
        m.hat(b + step / 2, 0.16)
        if k % 2:
            snare(m, b, 0.25)
        m.note(b, bass[(k // 2) % len(bass)], step * 0.95, 0.26, 4)
        if notes:
            pluck(m, b + step / 2, notes[k % len(notes)], 0.08)


# Chest: drop 0.3, land 0.9, rattle 1.6-3.0, open 3.0, rise 3.25, text 4.6, groove 5.0+, out 9.0, slam 9.45
m = mix(31)
m.whoosh(0.3, 0.6, 0.6)
m.boom(0.9, 0.9, 1.0); knock(m, 0.9, 0.8, 120)
for k in range(12):                                  # rattling lid, faster and louder
    t0 = (np.pi / 2 + 2 * np.pi * k) / 18
    if 1.6 <= t0 < 3.0:
        knock(m, t0, 0.25 + 0.35 * (t0 - 1.6) / 1.4, 190 + 20 * (k % 3))
        m.clink(t0 + 0.02, 0.3, 2600 + 300 * (k % 2))
riser(m, 1.8, 1.2, 0.3)
m.boom(3.0, 1.0, 1.4)
m.chime(3.0, ((1568, 0.1), (2093, 0.08), (2637, 0.06), (3136, 0.05)), d=1.4, rise=0.0)
for k in range(24):
    m.clink(3.05 + k * 0.06 + m.rng.uniform(0, 0.03), m.rng.uniform(0.3, 0.8), m.rng.uniform(2600, 4200))
m.whoosh(3.1, 0.35, 0.5)
t = m.t
pad = np.clip((t - 3.1) / 0.6, 0, 1) * np.clip((9.4 - t) / 0.4, 0, 1)
for f in (146.8, 174.6, 220.0, 293.7):
    m.A += np.sin(2 * np.pi * f * t) * 0.022 * pad
m.boom(4.6, 0.7, 0.8)
groove(m, 5.0, 9.0, 0.5, (73.4, 58.3, 65.4, 55.0), notes=[midi(n) for n in (74, 77, 81, 77, 72, 76, 79, 76)])
for s in (5.3, 6.9, 8.3):
    m.chime(s, ((2349, 0.06), (3136, 0.04)), d=0.8, rise=0.0)
m.whoosh(9.0, 0.45, 0.6)
m.boom(9.45, 1.0, 0.9); knock(m, 9.45, 0.9, 110)
m.write(os.path.join(OUT, "sfx_chest.wav"))

# Gacha: fall 0.2-0.7, bounces 0.7/1.2/1.45/1.575, roll -> 1.6, stars 1.8+0.25k, SSR 2.8, open 3.0, text 4.4, groove 4.8+, iris 9.0
m = mix(32)
tt = m.ts(0.5)
m.at(0.2, m.sweep(1800 - 1300 * (tt / 0.5)) * (tt / 0.5) * 0.1)
for k, ti in enumerate((0.7, 1.2, 1.45, 1.575)):
    boing(m, ti, 0.45 * 0.6 ** k, 200 + 30 * k)
    knock(m, ti, 0.35 * 0.6 ** k, 150)
tt = m.ts(1.0)
m.at(0.7, m.lp(m.noise(1.0), 30) * np.exp(-2 * tt) * 0.25)
for k in range(5):
    t0 = 1.8 + 0.25 * k
    m.note(t0, midi((72, 76, 79, 83, 86)[k]), 0.5, 0.2, 7)
    m.chime(t0, ((midi(84 + (0, 4, 7, 11, 14)[k]), 0.05),), d=0.3, rise=0.0)
    m.swish(t0 - 0.05, 0.12, 0.2)
riser(m, 1.8, 1.2, 0.3)
m.chime(2.8, ((1047, 0.08), (1319, 0.07), (1568, 0.07), (2093, 0.06), (2637, 0.05)), d=1.2, rise=0.02)
tt, nz = m.ts(0.12), m.noise(0.12)
m.at(3.0, (nz - m.lp(nz, 2)) * np.exp(-30 * tt) * 0.8)     # pop
m.boom(3.0, 0.9, 1.2)
for k in range(40):                                          # confetti crackle
    t0 = 3.02 + m.rng.uniform(0, 0.9)
    m.at(t0, m.noise(0.01) * np.exp(-400 * m.ts(0.01)) * m.rng.uniform(0.05, 0.2))
for k, n in enumerate((60, 64, 67, 72, 76, 79, 84)):          # fanfare arpeggio
    pluck(m, 3.1 + 0.07 * k, midi(n), 0.16, 0.5)
m.boom(4.4, 0.7, 0.7)
groove(m, 4.8, 9.0, 0.5, (65.4, 55.0, 87.3, 98.0), notes=[midi(n) for n in (72, 76, 79, 76, 77, 81, 84, 81)])
for s in (5.2, 6.8, 8.3):
    m.chime(s, ((2637, 0.05), (3520, 0.04)), d=0.7, rise=0.0)
tt = m.ts(0.7)
m.at(9.0, m.sweep(1600 - 1300 * (tt / 0.7) ** 1.5) * 0.12)
m.whoosh(9.0, 0.6, 0.5)
m.kick(9.7, 0.6); m.chime(9.7, ((2093, 0.06), (3136, 0.04)), d=0.3, rise=0.0)
m.write(os.path.join(OUT, "sfx_gacha.wav"))

# CoinFlip: paw 0.15, flick 0.8, flight -> 2.3 edge landing, spin -> 3.4 flat, rise 3.75, burst 4.1, text 4.8, groove 5.0+, out 9.0
m = mix(33)
m.swish(0.15, 0.3, 0.3)
m.chime(0.8, ((3520, 0.1), (5274, 0.05)), d=0.6, rise=0.0)
m.swish(0.78, 0.2, 0.6)
tt = m.ts(1.5)                                                # spinning flight: whoosh modulated at the flip rate
m.at(0.8, m.lp(m.noise(1.5), 12) * (0.5 + 0.5 * np.sin(2 * np.pi * 4 * tt)) ** 2 * np.sin(np.pi * tt / 1.5) * 0.35)
m.clink(2.3, 1.0, 3000); knock(m, 2.3, 0.3, 300)
tt = m.ts(1.1)                                                # coin spinning on its edge: ring + accelerating chatter
ring = np.sin(2 * np.pi * 2800 * tt) * 0.05 + np.sin(2 * np.pi * 4200 * tt) * 0.03
m.at(2.3, ring * np.clip(1 - tt / 1.1, 0, 1) ** 0.5)
ph, k = 0.0, 0
while True:
    rate = 8 + 45 * (ph / 1.1) ** 2
    ph += 1 / rate
    if ph >= 1.1:
        break
    m.clink(2.3 + ph, 0.25 + 0.35 * ph, 2500 + 900 * m.rng.random())
for k in range(4):
    m.clink(3.4 + 0.07 * k, 0.8 * 0.6 ** k, 2900)
riser(m, 3.5, 0.6, 0.35)
m.boom(4.1, 1.0, 1.4)
m.chime(4.1, ((1760, 0.1), (2637, 0.08), (3520, 0.06)), d=1.0, rise=0.05)
t = m.t
pad = np.clip((t - 4.1) / 0.6, 0, 1) * np.clip((9.3 - t) / 0.5, 0, 1)
for f in (130.8, 164.8, 196.0, 261.6):
    m.A += np.sin(2 * np.pi * f * t) * 0.022 * pad
m.boom(4.8, 0.7, 0.8)
groove(m, 5.0, 9.0, 0.5, (65.4, 51.9, 58.3, 49.0), notes=[midi(n) for n in (72, 75, 79, 75, 70, 74, 77, 74)])
for s in (5.6, 7.5):
    m.chime(s, ((2093, 0.06), (3136, 0.04)), d=0.8, rise=0.0)
m.whoosh(9.1, 0.7, 0.7)
m.chime(9.7, ((3520, 0.1), (5274, 0.05)), d=0.14, rise=0.0)
m.boom(9.7, 0.4, 0.15)
m.write(os.path.join(OUT, "sfx_coinflip.wav"))
print("ok")
