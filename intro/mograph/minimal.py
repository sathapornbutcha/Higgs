"""Clean Minimal: a thin frame draws itself, the logo slides up from behind its bottom edge, soft piano, elegant exit."""
from core import *

DRAW = (0.2, 1.1)
SLIDE = (0.95, 1.65)
EXIT = 4.2
PAD = 56
PREVIEW = (18, 36, 80, 135)
PIANO = ((0.25, 523.25), (0.55, 659.25), (0.85, 783.99), (1.6, 1046.5), (2.6, 880.0), (3.1, 783.99), (3.6, 659.25))


def partial_path(pts, dist):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        seg = math.dist(a, b)
        if dist <= 0:
            break
        if dist >= seg:
            out.append(b)
        else:
            f = dist / seg
            out.append((lerp(a[0], b[0], f), lerp(a[1], b[1], f)))
        dist -= seg
    return out


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 740)
    logo = sized(LOGO, LW, LH, 1.0)
    BG = radial(W, H, (34, 22, 48), (10, 7, 14), 1.0).convert("RGB")
    x0, y0, x1, y1 = CX - LW / 2 - PAD, CY - LH / 2 - PAD, CX + LW / 2 + PAD, CY + LH / 2 + PAD
    top = [(CX, y0), (x1, y0), (x1, y1), (CX, y1)]
    bot = [(CX, y1), (x0, y1), (x0, y0), (CX, y0)]
    half = (x1 - x0) + (y1 - y0)
    rnd = random.Random(12)
    MOTES = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(8, 20), rnd.uniform(1, 2.5), rnd.uniform(0, 6.3)) for _ in range(40)]

    def frame(i):
        t = i / FPS
        im = BG.copy().convert("RGBA")
        ov, d = layer()
        for x, y0_, v, sz, ph in MOTES:
            y = (y0_ - v * t) % H
            d.ellipse((x - sz, y - sz, x + sz, y + sz), fill=LILAC + (int(70 * (0.5 + 0.5 * math.sin(t + ph))),))
        p = e_inout(clamp((t - DRAW[0]) / (DRAW[1] - DRAW[0])))
        if t >= EXIT:
            p *= 1 - e_inout(clamp((t - EXIT) / 0.45))
        if p > 0:
            for path in (top, bot):
                pts = partial_path(path, p * half)
                if len(pts) > 1:
                    d.line(pts, fill=(200, 170, 235, 230), width=3, joint="curve")
        ca = e_out(clamp((t - 1.0) / 0.3)) * (1 - clamp((t - EXIT) / 0.3))
        if ca > 0:
            for cx, cy in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)):
                s = 9 * ca
                d.rectangle((cx - s, cy - s, cx + s, cy + s), fill=ORANGE + (int(255 * ca),))
        im.alpha_composite(ov)
        if t >= SLIDE[0]:
            p = e_out(clamp((t - SLIDE[0]) / (SLIDE[1] - SLIDE[0])))
            s = 1 + 0.02 * clamp((t - SLIDE[1]) / (EXIT - SLIDE[1]))
            lg = logo if s < 1.0005 else sized(LOGO, LW, LH, s)
            if 2.7 <= t < 3.4:
                lg = shine(lg, -0.2 + 1.4 * (t - 2.7) / 0.7, width=0.07, strength=0.55)
            ly = CY - lg.height / 2 + (1 - p) * (LH + PAD)
            a = 1.0
            if t >= EXIT + 0.15:
                q = e_in(clamp((t - EXIT - 0.15) / 0.55))
                ly -= 40 * q
                a = 1 - q
            vis = int(y1 - 4 - ly)
            if vis > 0:
                comp(im, with_alpha(lg.crop((0, 0, lg.width, min(lg.height, vis))), a), CX - lg.width / 2, ly)
        out = im.convert("RGB")
        return tint(out, (0, 0, 0), max(1 - clamp(t / 0.4), clamp((t - 4.8) / 0.2)))

    m = Mix(81)
    for t0, f in PIANO:
        m.note(t0, f, 1.6, 0.14, 2.5)
        m.note(t0, f / 2, 1.6, 0.07, 2.5)
    m.whoosh(SLIDE[0] - 0.2, 0.55, 0.35)
    tt = m.ts(1.5)
    m.at(SLIDE[1] - 0.1, m.sweep(55 + 30 * np.exp(-8 * tt)) * np.exp(-2.5 * tt) * 0.5)
    env = np.clip((m.t - 1.4) / 1.0, 0, 1) * np.clip((4.9 - m.t) / 0.6, 0, 1)
    for f in (261.6, 329.6, 392.0, 493.9):
        m.A += np.sin(2 * np.pi * f * m.t) * 0.018 * env
    m.chime(2.75, ((2093, 0.06), (3136, 0.04)), d=1.0, rise=0.0)
    m.whoosh(EXIT + 0.1, 0.6, 0.25)
    m.echo(((0.18, 0.3), (0.36, 0.15)))
    return frame, m, PREVIEW
