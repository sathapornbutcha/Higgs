"""Synthesize 10-second soundtracks for Heist, Card and Kinetic (times match src/Heist.tsx, Card.tsx, Kinetic.tsx)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
import core

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
midi = lambda n: 440 * 2 ** ((n - 69) / 12)


def mix(seed):
    core.DUR = 10.0
    return core.Mix(seed)


def snare(m, t0, g=0.3):
    tt, nz = m.ts(0.18), m.noise(0.18)
    m.at(t0, ((nz - m.lp(nz, 3)) * np.exp(-18 * tt) + np.sin(2 * np.pi * 190 * tt) * np.exp(-30 * tt)) * g)


def saw(m, t0, f, d, g, dec=3):
    tt = m.ts(d)
    m.at(t0, (2 * ((f * tt) % 1) - 1) * np.exp(-dec * tt) * np.clip(tt / 0.005, 0, 1) * g)


def pluck(m, t0, f, g=0.18):
    tt = m.ts(0.35)
    m.at(t0, (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt)) * np.exp(-14 * tt) * g)


def riser(m, t0, d, g=0.4):
    tt = m.ts(d)
    m.at(t0, m.lp(m.noise(d), 6) * (tt / d) ** 2 * g + m.sweep(300 + 2000 * (tt / d) ** 2) * (tt / d) * g * 0.2)


# Heist: sneak 1.6, grab 3.0, alarm 3.4, dash 4.2, land 5.0, text 5.4, out 9.2
m = mix(21)
for k, t0 in enumerate(np.arange(0.0, 3.4, 0.333)):          # stealthy pizzicato
    pluck(m, t0, midi((45, 48, 52, 51, 45, 48, 53, 52)[k % 8]), 0.2)
    if k % 2 == 0:
        m.kick(t0, 0.3)
t = m.t
m.A += np.sin(2 * np.pi * 110 * t) * 0.015 * (t < 3.4)             # laser hum
m.chime(3.0, ((2637, 0.1), (3520, 0.06)), d=0.4, rise=0.0)        # grab "ting"
m.swish(3.0, 0.3, 0.6)
siren = np.sin(2 * np.pi * np.cumsum(750 + 350 * np.sin(2 * np.pi * 1.6 * t)) / 44100)
m.A += siren * 0.09 * ((t >= 3.4) & (t < 5.4)) + siren * 0.03 * ((t >= 5.4) & (t < 9.2))
m.boom(3.4, 0.8, 0.8)
m.whoosh(4.0, 0.3, 0.9); m.boom(4.45, 0.7, 0.6)
for k in range(10):
    m.clink(4.5 + k * 0.06 + m.rng.uniform(0, 0.03), m.rng.uniform(0.4, 0.8), m.rng.uniform(2800, 4300))
m.whoosh(4.7, 0.3, 0.6)
m.boom(5.4, 1.0, 1.4)
for k, b in enumerate(np.arange(5.4, 9.2, 0.43)):                 # 140 BPM action groove
    m.kick(b, 0.85)
    m.hat(b + 0.215, 0.18)
    if k % 2:
        snare(m, b, 0.3)
    saw(m, b, midi((33, 33, 36, 34)[(k // 2) % 4]), 0.4, 0.2)
riser(m, 8.4, 0.8, 0.3)
m.boom(9.2, 0.9, 0.5)
m.write(os.path.join(OUT, "sfx_heist.wav"))

# Card: spin-in 0-1.3, flip 1.7, breakout 3.2, text 4.6, out 9.0
m = mix(22)
for k in range(8):
    m.swish(0.05 + k * 0.16, 0.14, 0.25 + 0.04 * k)
tt = m.ts(1.7)
m.A[: len(tt)] += np.sin(2 * np.pi * (220 + 60 * tt) * tt) * 0.04 * (tt / 1.7)
m.chime(1.75, ((1760, 0.1), (2637, 0.08), (3520, 0.06)), d=1.0, rise=0.1)
m.boom(1.8, 0.5, 0.6)
t = m.t
pad = np.clip((t - 1.8) / 0.8, 0, 1) * np.clip((9.4 - t) / 0.6, 0, 1)
for f in (220.0, 277.2, 329.6, 440.0):
    m.A += np.sin(2 * np.pi * f * t) * 0.025 * pad
riser(m, 2.4, 0.8, 0.35)
m.boom(3.2, 1.0, 1.4)
m.boom(4.6, 0.7, 0.7)
for k, b in enumerate(np.arange(5.0, 9.0, 0.5)):
    m.kick(b, 0.8)
    m.hat(b + 0.25, 0.16)
    if k % 2:
        snare(m, b, 0.25)
    m.note(b, (55.0, 69.3, 61.7, 73.4)[(k // 2) % 4], 0.48, 0.28, 4)
for s in (5.3, 6.9, 8.3):
    m.chime(s)
m.whoosh(8.9, 0.6, 0.7)
m.write(os.path.join(OUT, "sfx_card.wav"))

# Kinetic: pops 0.1-0.35, wipes 0.6/0.9/1.2, lines 1.6, reveal 2.4, text 3.4, hold beats 4.5+, iris 9.0
m = mix(23)
for i, t0 in enumerate((0.1, 0.22, 0.34)):
    tt = m.ts(0.1)
    m.at(t0, np.sin(2 * np.pi * (600 + 200 * i) * tt) * np.exp(-30 * tt) * 0.25)
for i, t0 in enumerate((0.6, 0.9, 1.2)):
    m.swish(t0, 0.3, 0.45)
    m.kick(t0 + 0.3, 0.5)
m.whoosh(1.4, 0.4, 0.4)
for k in range(6):
    pluck(m, 1.6 + k * 0.13, midi(72 + (0, 4, 7, 12, 7, 4)[k]), 0.12)
m.boom(2.4, 0.6, 0.8)
m.swish(3.4, 0.5, 0.4)
for k, b in enumerate(np.arange(2.4, 9.0, 0.5)):               # minimal house, 120 BPM
    m.kick(b, 0.7)
    m.hat(b + 0.25, 0.16)
    if k % 2:
        snare(m, b, 0.18)
    if k % 4 == 0:
        for n in ((57, 60, 64), (53, 57, 60), (55, 59, 62), (52, 55, 59))[(k // 4) % 4]:
            saw(m, b, midi(n), 1.98, 0.03, 0.8)
for s in (4.6, 6.4, 8.2):
    m.chime(s, ((2093, 0.06), (3136, 0.04)), d=0.8, rise=0.0)
tt = m.ts(0.7)
m.at(9.0, m.sweep(1400 - 1100 * (tt / 0.7) ** 1.5) * 0.1)
m.kick(9.7, 0.5)
m.write(os.path.join(OUT, "sfx_kinetic.wav"))
print("ok")
