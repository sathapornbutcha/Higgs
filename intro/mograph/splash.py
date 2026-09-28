"""Paint Splash: purple and orange paint splats burst onto the screen, the logo pops, paint drips, a final splat covers all."""
from core import *

SPLATS = ((0.2, CX - 520, CY - 120, 380, PURPLE), (0.35, CX + 540, CY + 140, 360, ORANGE), (0.5, CX, CY, 620, (70, 20, 120)))
POP = 0.62
BEATS = np.arange(1.1, 4.2, 0.5)
FINAL = 4.3
PREVIEW = (8, 17, 60, 138)


def splat_shape(seed, R):
    rnd = random.Random(seed)
    body = []
    n = 48
    phase = [rnd.uniform(0, 6.3) for _ in range(3)]
    for k in range(n):
        a = 2 * math.pi * k / n
        r = R * (1 + 0.08 * math.sin(3 * a + phase[0]) + 0.06 * math.sin(7 * a + phase[1]) + 0.05 * math.sin(11 * a + phase[2]))
        body.append((a, r))
    spikes = [(rnd.uniform(0, 2 * math.pi), rnd.uniform(1.15, 1.6), rnd.uniform(0.04, 0.09)) for _ in range(9)]
    drops = [(rnd.uniform(0, 2 * math.pi), rnd.uniform(1.3, 2.1), rnd.uniform(0.03, 0.08)) for _ in range(14)]
    return body, spikes, drops


def draw_splat(d, cx, cy, shape, R, s, col):
    body, spikes, drops = shape
    if s <= 0:
        return
    d.polygon([(cx + r * s * math.cos(a), cy + r * s * math.sin(a)) for a, r in body], fill=col)
    for a, L, w in spikes:
        tip = R * s * L
        d.polygon([(cx + R * s * 0.8 * math.cos(a - w), cy + R * s * 0.8 * math.sin(a - w)), (cx + tip * math.cos(a), cy + tip * math.sin(a)),
                   (cx + R * s * 0.8 * math.cos(a + w), cy + R * s * 0.8 * math.sin(a + w))], fill=col)
        rr = R * s * w * 0.8
        d.ellipse((cx + tip * math.cos(a) - rr, cy + tip * math.sin(a) - rr, cx + tip * math.cos(a) + rr, cy + tip * math.sin(a) + rr), fill=col)
    for a, dist, rad in drops:
        dd, rr = R * dist * e_out(min(1, s * 1.1)), R * rad * s
        d.ellipse((cx + dd * math.cos(a) - rr, cy + dd * math.sin(a) - rr, cx + dd * math.cos(a) + rr, cy + dd * math.sin(a) + rr), fill=col)


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 820)
    paper = np.full((H, W, 3), (244, 236, 222), np.float32)
    paper += np.random.default_rng(2).normal(0, 5, (H, W, 1))
    BG = Image.fromarray(np.clip(paper, 0, 255).astype(np.uint8))
    SHAPES = [splat_shape(k + 1, R) for k, (_, _, _, R, _) in enumerate(SPLATS)]
    rnd = random.Random(8)
    DRIPS = [(CX + rnd.uniform(-420, 420), rnd.uniform(0.6, 1.2), rnd.uniform(14, 30), rnd.uniform(120, 360)) for _ in range(7)]
    DOTS = [(b, rnd.uniform(150, W - 150), rnd.uniform(120, H - 120), rnd.uniform(40, 90), rnd.choice((PURPLE, ORANGE, GOLD)), rnd.randint(10, 99))
            for b in BEATS]
    DOT_SHAPES = {seed: splat_shape(seed, R) for _, _, _, R, _, seed in DOTS}
    FIN = splat_shape(77, 700)

    def frame(i):
        t = i / FPS
        im = BG.copy()
        d = ImageDraw.Draw(im)
        for b, x, y, R, col, seed in DOTS:
            if t >= b:
                draw_splat(d, x, y, DOT_SHAPES[seed], R, e_out(clamp((t - b) / 0.1)), col)
        for (st, x, y, R, col), sh in zip(SPLATS, SHAPES):
            if t >= st:
                draw_splat(d, x, y, sh, R, e_out(clamp((t - st) / 0.12)), col)
        for x, st, w, L in DRIPS:
            if t >= st:
                ln = L * e_out(clamp((t - st) / 2.2))
                y0 = CY + 420
                d.rounded_rectangle((x - w / 2, y0 - 40, x + w / 2, y0 + ln), radius=w / 2, fill=(70, 20, 120))
                d.ellipse((x - w * 0.7, y0 + ln - w * 0.7, x + w * 0.7, y0 + ln + w * 0.7), fill=(70, 20, 120))
        im = im.convert("RGBA")
        if t >= POP:
            tau = t - POP
            sx = spring(tau, 9, 20)
            sy = spring(tau - 0.03, 9, 20)
            for b in BEATS:
                if t >= b:
                    k = 0.03 * math.exp(-(t - b) * 12)
                    sx, sy = sx * (1 + k), sy * (1 - k * 0.6)
            if sx > 0.02 and sy > 0.02:
                lg = LOGO.resize((max(1, int(LW * sx)), max(1, int(LH * sy))), Image.BICUBIC)
                if 2.4 <= t < 2.9:
                    lg = shine(lg, -0.2 + 1.4 * (t - 2.4) / 0.5)
                rot = 3 * math.sin(2 * math.pi * t / 2.0) * clamp((t - 1.2) / 0.5)
                if abs(rot) > 0.05:
                    lg = lg.rotate(rot, resample=Image.BICUBIC, expand=True)
                center(im, lg, CX, CY + (1 - sy) * LH / 2)
        out = im.convert("RGB")
        if t >= FINAL:
            d = ImageDraw.Draw(out)
            draw_splat(d, CX, CY, FIN, 700, 2.4 * e_in(clamp((t - FINAL) / 0.35)), (40, 10, 70))
        amp = 0
        for st, *_ in SPLATS:
            if st <= t < st + 0.25:
                amp += 14 * (1 - (t - st) / 0.25)
        out = camera(out, amp * math.sin(t * 97), amp * math.cos(t * 83))
        return tint(out, (0, 0, 0), max(1 - clamp(t / 0.15), clamp((t - 4.75) / 0.25)))

    m = Mix(71)

    def splat(t0, gain=1.0):
        nz = m.noise(0.25)
        tt = m.ts(0.25)
        m.at(t0, (m.lp(nz, 5) * np.exp(-18 * tt) * 0.9 + m.sweep(90 * np.exp(-8 * tt) + 40) * np.exp(-10 * tt)) * gain)
        for k in range(3):
            t1 = m.ts(0.08)
            f = m.rng.uniform(900, 1500)
            m.at(t0 + 0.08 + 0.05 * k, m.sweep(f - 600 * t1 / 0.08) * np.exp(-30 * t1) * 0.08 * gain)

    for st, *_ in SPLATS:
        splat(st)
    tt = m.ts(0.5)
    m.at(POP, m.sweep(200 + 500 * tt) * np.exp(-6 * tt) * 0.2)
    m.kick(POP, 0.9)
    for k, b in enumerate(BEATS):
        m.kick(b, 0.7)
        splat(b, 0.35)
        nz = m.noise(0.1)
        m.at(b + 0.25, (nz - m.lp(nz, 3)) * np.exp(-30 * m.ts(0.1)) * 0.35)
        m.note(b, (82.41, 98.0, 73.42, 98.0)[k % 4], 0.45, 0.3, 6)
    m.chime(2.4)
    m.whoosh(FINAL - 0.3, 0.4, 0.5)
    splat(FINAL + 0.2, 1.2)
    return frame, m, PREVIEW
