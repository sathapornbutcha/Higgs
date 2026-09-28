"""Synthesize public/sfx.wav for the SnatchPro composition (times match T in src/SnatchPro.tsx)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
from core import Mix

T = dict(titleIn=0.2, titleLand=0.55, pounce=0.72, land=1.08, out=4.1, zip=4.28, punch=4.5, flash=4.72)
BEATS = [1.5, 2, 2.5, 3, 3.5, 4]
SHINES = [2.0, 3.2]

m = Mix(7)
m.whoosh(0.0, T["titleLand"], 0.7)
m.boom(T["titleLand"], 0.7, 0.8)
m.whoosh(T["pounce"] - 0.1, T["land"] - T["pounce"] + 0.1, 1.0)
m.boom(T["land"], 1.0, 1.5)
for k in range(10):
    m.clink(T["land"] + 0.1 + k * 0.07 + m.rng.uniform(0, 0.04), m.rng.uniform(0.4, 0.9), m.rng.uniform(2800, 4300))
bass = (55.0, 65.41, 49.0, 55.0, 65.41, 73.42)
for k, b in enumerate(BEATS):
    m.kick(b, 0.85)
    m.hat(b + 0.25, 0.18)
    m.note(b, bass[k], 0.45, 0.3, 5)
    m.chime(b, ((2600, 0.03), (3900, 0.02)), d=0.4, rise=0.0)
for s in SHINES:
    m.chime(s)
m.drone(55, 0.06, start=T["land"], end=T["flash"])
m.whoosh(T["out"] - 0.15, 0.3, 0.4)
m.swish(T["zip"], 0.22, 0.8)
m.kick(T["punch"], 0.9)
m.boom(T["flash"], 0.8, 0.28)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "sfx.wav"))
print("ok")
