"""Synthesize 10-second soundtracks for ElementsIntro, Draw, Esports, Anime, Cinematic and Cute.
Event times match the timelines in src/*.tsx."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
import core

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
DUR = 10.0
midi = lambda n: 440 * 2 ** ((n - 69) / 12)


def mix(seed):
    core.DUR = DUR
    return core.Mix(seed)


def snare(m, t0, g=0.35):
    tt = m.ts(0.18)
    nz = m.noise(0.18)
    m.at(t0, ((nz - m.lp(nz, 3)) * np.exp(-18 * tt) + np.sin(2 * np.pi * 190 * tt) * np.exp(-30 * tt)) * g)


def saw(m, t0, f, d, g, dec=4):
    tt = m.ts(d)
    m.at(t0, (2 * ((f * tt) % 1) - 1) * np.exp(-dec * tt) * np.clip(tt / 0.005, 0, 1) * g)


def riser(m, t0, d, g=0.4):
    tt = m.ts(d)
    m.at(t0, m.lp(m.noise(d), 6) * (tt / d) ** 2 * g + m.sweep(300 + 2000 * (tt / d) ** 2) * (tt / d) * g * 0.2)


def groove(m, start, stop, beat, bass, kick=0.8, snr=0.25, chords=None, chord_g=0.05):
    for k, b in enumerate(np.arange(start, stop, beat)):
        m.kick(b, kick)
        m.hat(b + beat / 2, 0.18)
        if k % 2:
            snare(m, b, snr)
        if bass:
            m.note(b, bass[k % len(bass)], beat * 0.95, 0.28, 5)
        if chords and k % 4 == 0:
            for n in chords[(k // 4) % len(chords)]:
                saw(m, b, midi(n), beat * 4 - 0.02, chord_g, 1.2)


CHORDS = ((57, 60, 64), (53, 57, 60), (55, 59, 62), (52, 55, 59))

# ElementsIntro: portal 0.15, burst 0.7, text 1.25, paw 9.0, black 9.8
m = mix(11)
tt = m.ts(0.7)
m.at(0, m.lp(m.noise(0.7), 14) * (tt / 0.7) ** 2 * 0.6)
m.swish(0.1, 0.35, 0.5); m.swish(0.25, 0.35, 0.4)
m.boom(0.7, 1.0, 1.5)
m.whoosh(1.0, 0.3, 0.5)
m.kick(1.41, 1.0); m.boom(1.41, 0.6, 0.6)
for k in range(8):
    m.clink(1.55 + k * 0.09 + m.rng.uniform(0, 0.04), m.rng.uniform(0.4, 0.8), m.rng.uniform(2800, 4300))
groove(m, 2.0, 8.9, 0.5, (55.0, 65.41, 49.0, 55.0), chords=CHORDS)
for s in (2.2, 3.7, 5.6, 7.5):
    m.chime(s)
riser(m, 8.1, 0.9, 0.35)
tt = m.ts(0.8); nz = m.noise(0.8)
m.at(9.0, (nz - m.lp(nz, 5)) * (tt / 0.8) ** 2 * 0.55)
m.boom(9.8, 1.0, 0.2)
m.write(os.path.join(OUT, "sfx_el.wav"))

# Esports: 150 BPM, close-ups 0.4/0.8/1.2, slam 1.6, exit 9.2
m = mix(1)
for k, b in enumerate(np.arange(0.0, 9.2, 0.4)):
    m.kick(b, 0.9 if b >= 1.6 else 0.6)
    m.hat(b + 0.2, 0.2)
    if k % 2:
        snare(m, b, 0.3)
    saw(m, b, midi((33, 33, 36, 31)[(k // 2) % 4]), 0.38, 0.22, 3)
for c in (0.4, 0.8, 1.2):
    m.swish(c - 0.05, 0.15, 0.7)
riser(m, 1.2, 0.4, 0.3)
m.boom(1.6, 1.0, 1.4); m.boom(1.68, 0.5, 0.5)
for b in np.arange(2.0, 9.2, 0.8):
    m.zap(b, 0.06, 0.2)
for s in (2.3, 4.3, 6.3, 8.3):
    m.chime(s)
riser(m, 8.4, 0.8, 0.35)
m.whoosh(9.15, 0.5, 0.8)
m.write(os.path.join(OUT, "sfx_esports.wav"))

# Anime: eyes 1.0, hero 1.6, text 2.1, out 9.2
m = mix(2)
arp = (72, 76, 79, 84, 83, 79, 76, 74)
for k, t0 in enumerate(np.arange(0.0, 9.2, 0.125)):
    m.note(t0, midi(arp[k % 8] + (0 if (k // 32) % 2 == 0 else -3)), 0.2, 0.05, 12)
for k, b in enumerate(np.arange(1.6, 9.2, 0.5)):
    m.kick(b, 0.7)
    snare(m, b + 0.25, 0.22)
    m.note(b, midi((48, 45, 41, 43)[(k // 2) % 4]), 0.5, 0.25, 4)
m.swish(0.95, 0.15, 0.6)
m.chime(1.25, ((3136, 0.1), (4186, 0.07)), d=0.6, rise=0.0)
m.swish(1.55, 0.15, 0.7)
m.boom(1.6, 0.8, 1.0)
m.whoosh(2.0, 0.25, 0.5)
for s in (2.9, 4.6, 6.4, 8.2):
    m.chime(s)
m.whoosh(9.1, 0.6, 0.6)
m.write(os.path.join(OUT, "sfx_anime.wav"))

# Cinematic: char 1.5, title 3.0, glint 3.9, flare 6.2, fade 9.2
m = mix(3)
t = m.t
env = np.clip(t / 1.5, 0, 1) * np.clip((9.9 - t) / 1.0, 0, 1)
m.A += (np.sin(2 * np.pi * 36.7 * t) + 0.5 * np.sin(2 * np.pi * 55 * t) + 0.25 * np.sin(2 * np.pi * 73.4 * t)) * 0.09 * env
m.A += m.lp(m.noise(DUR), 60) * 0.25 * env
for h in (0.6, 1.0, 4.8, 5.2, 7.6, 8.0):
    m.kick(h, 0.45)
m.whoosh(1.0, 0.5, 0.5)
m.boom(1.5, 1.0, 2.0)
for f, t0 in ((220.0, 1.6), (261.6, 1.6), (329.6, 1.6), (440.0, 3.0), (523.3, 3.0), (392.0, 5.6), (493.9, 5.6), (329.6, 7.8), (415.3, 7.8)):
    m.note(t0, f, 3.0, 0.05, 0.9)
m.boom(3.0, 0.7, 1.6)
m.chime(3.9, ((2637, 0.08), (3520, 0.06)), d=1.2, rise=0.0)
m.whoosh(6.0, 1.0, 0.3)
m.chime(6.6, ((2349, 0.06), (3136, 0.05)), d=1.0, rise=0.0)
m.boom(8.6, 0.8, 1.2)
m.echo(((0.21, 0.4), (0.43, 0.25), (0.71, 0.12)))
m.write(os.path.join(OUT, "sfx_cinematic.wav"))

# Cute: props 0.15-0.85, char 1.2 (+0.28 land), text 1.65, coins 1.9 & 5.5, hops 2.2+0.5k, iris 9.3
m = mix(4)
for t0 in (0.15, 0.3, 0.45, 0.55, 0.65, 0.75, 0.85):
    tt = m.ts(0.08)
    m.at(t0, m.sweep(500 + 900 * tt / 0.08) * np.exp(-25 * tt) * 0.2)
tt = m.ts(0.5)
m.at(1.48, m.sweep(160 * (1 + 0.8 * tt) + 60 * np.sin(2 * np.pi * 14 * tt) * np.exp(-3 * tt)) * np.exp(-3 * tt) * 0.35)
m.kick(1.48, 0.8)
m.at(1.65, m.sweep(220 * (1 + tt) + 80 * np.sin(2 * np.pi * 18 * tt) * np.exp(-3 * tt)) * np.exp(-4 * tt) * 0.3)
for k in range(24):
    m.clink((1.9 if k % 2 == 0 else 5.5) + m.rng.uniform(0.3, 1.6), m.rng.uniform(0.3, 0.7), m.rng.uniform(3000, 4500))
for k, b in enumerate(np.arange(1.7, 9.3, 0.25)):
    m.note(b, midi((52, 55, 57, 55, 52, 50, 48, 50)[k % 8]) / 2, 0.22, 0.25, 9)
    if k % 2 == 0:
        m.kick(b, 0.45)
    if k % 4 == 2:
        m.hat(b, 0.12)
for h in np.arange(2.2, 9.0, 0.5):
    tt = m.ts(0.3)
    m.at(h, m.sweep(300 + 500 * tt / 0.3) * np.exp(-6 * tt) * 0.06)
tt = m.ts(0.6)
m.at(9.3, m.sweep(1700 - 1300 * (tt / 0.6) ** 1.5) * 0.13)
m.kick(9.85, 0.6)
m.write(os.path.join(OUT, "sfx_cute.wav"))

# Draw: 125 BPM. sketch 0.4-2.2, color 2.2-3.2, orange 3.2 (taps 3.8, 4.3), blue 4.8 (taps 5.1, 5.45, 5.8, 6.1), dive 6.4, flash 9.3
m = mix(5)
beat = 0.48
for k, b in enumerate(np.arange(0.0, 9.3, beat)):
    m.kick(b, 0.95 if b >= 6.4 else 0.55)
    m.hat(b + beat / 2, 0.2)
    if k % 2:
        snare(m, b, 0.28 if b >= 3.2 else 0.15)
for k, b in enumerate(np.arange(3.2, 9.3, beat * 2)):
    for n in CHORDS[k % 4]:
        saw(m, b, midi(n), beat * 2 - 0.02, 0.05 if b < 6.4 else 0.08, 1.5)
for t0 in np.arange(0.4, 3.2, 0.07):
    nz = m.noise(0.06)
    m.at(t0, (nz - m.lp(nz, 2)) * np.exp(-20 * m.ts(0.06)) * 0.06)
for tap in (3.8, 4.3, 5.1, 5.45, 5.8, 6.1):
    m.chime(tap, ((1760, 0.08), (2637, 0.05)), d=0.35, rise=0.0)
riser(m, 5.5, 0.9, 0.4)
m.boom(6.4, 1.0, 1.2)
riser(m, 8.4, 0.9, 0.3)
m.boom(9.3, 0.8, 0.5)
m.write(os.path.join(OUT, "sfx_draw.wav"))
print("ok")
