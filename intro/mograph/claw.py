"""Claw Snatch: three claw swipes tear the screen open to reveal the logo, coins rain, screen splits apart."""
from core import *

BEATS = np.arange(1.1, 4.2, 0.5)
SLASHES = ((0.25, CX - 260, CY - 40, -58), (0.42, CX + 200, CY + 30, -42), (0.59, CX - 20, CY + 10, -70))
REVEAL = 0.95
SPLIT = (4.3, -60)
PREVIEW = (16, 27, 50, 140)


def claw_polys(cx, cy, ang, u_max, width, length=1500, gap=70, bow=60):
    a = math.radians(ang)
    ux, uy, nx, ny = math.cos(a), math.sin(a), -math.sin(a), math.cos(a)
    polys = []
    for j in (-1, 0, 1):
        left, right = [], []
        for k in range(25):
            u = u_max * k / 24
            along = (u - 0.5) * length * (1 - 0.1 * abs(j))
            off = j * gap + bow * math.sin(math.pi * u)
            x, y = cx + ux * along + nx * off, cy + uy * along + ny * off
            w = width * max(0.05, math.sin(math.pi * u) ** 0.7) / 2
            left.append((x + nx * w, y + ny * w))
            right.append((x - nx * w, y - ny * w))
        polys.append(left + right[::-1])
    return polys


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 860)
    DARK = radial(W, H, (26, 8, 44), (3, 2, 6), 0.9).convert("RGB")
    BRIGHT = radial(W, H, (120, 40, 190), (20, 6, 36), 0.7)
    STRIPES = Image.new("RGBA", (W + 200, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(STRIPES)
    for x in range(-H, W + 200, 90):
        sd.polygon([(x, 0), (x + 30, 0), (x + 30 + H, H), (x + H, H)], fill=(255, 140, 26, 20))
    rnd = random.Random(5)
    COINS = [(rnd.uniform(0.95, 2.4), rnd.uniform(80, W - 80), rnd.uniform(28, 50), rnd.uniform(4, 9), rnd.uniform(-200, 200))
             for _ in range(28)]
    FLOOR = H - 50

    def coin_pos(t, t0, x0, R, vx):
        tau, y, vy, x = t - t0, -R, 0.0, x0
        if tau < 0:
            return None
        # integrate with bounces (closed form per segment)
        g, e = 2600.0, 0.45
        while True:
            # time to hit floor from y with velocity vy
            disc = vy * vy + 2 * g * (FLOOR - R - y)
            th = (-vy + math.sqrt(max(0, disc))) / g
            if tau <= th or abs(vy) < 1 and y >= FLOOR - R - 1:
                yy = min(FLOOR - R, y + vy * tau + 0.5 * g * tau * tau)
                return x + vx * (t - t0), yy
            tau -= th
            y, vy = FLOOR - R, -(vy + g * th) * e
            if abs(vy) < 60:
                return x + vx * (t - t0), FLOOR - R

    def revealed(t, s, dy):
        im = BRIGHT.copy()
        off = int(t * 60) % 90
        im.alpha_composite(STRIPES.crop((off, 0, off + W, H)))
        ov, d = layer()
        sa = 1 - clamp((t - 1.2) / 0.8)
        if t >= REVEAL and sa > 0:
            for st, cx, cy, ang in SLASHES:
                for poly in claw_polys(cx, cy, ang, 1, 22):
                    d.polygon(poly, fill=(30, 8, 50, int(150 * sa)))
        for t0, x0, R, fs, vx in COINS:
            p = coin_pos(t, t0, x0, R, vx)
            if p:
                coin(d, p[0], p[1], R, math.cos(t * fs), int(255 * (1 - clamp((t - 3.9) / 0.4))))
        im.alpha_composite(ov)
        lg = sized(LOGO, LW, LH, s)
        if 2.3 <= t < 2.8:
            lg = shine(lg, -0.2 + 1.4 * (t - 2.3) / 0.5)
        center(im, lg, CX, CY + dy)
        return im

    def frame(i):
        t = i / FPS
        tau = t - REVEAL
        s = 1 + (0.1 * math.exp(-6 * tau) * math.cos(20 * tau) if tau >= 0 else 0)
        for b in BEATS:
            if t >= b:
                s *= 1 + 0.02 * math.exp(-(t - b) * 12)
        dy = 8 * math.sin(2 * math.pi * t / 2) * clamp((t - 1.2) / 0.5)
        rev = revealed(t, s, dy).convert("RGB")
        if t < REVEAL:
            mask = Image.new("L", (W, H), 0)
            md = ImageDraw.Draw(mask)
            fx = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            fd = ImageDraw.Draw(fx, "RGBA")
            for st, cx, cy, ang in SLASHES:
                if t < st:
                    continue
                u = e_out(clamp((t - st) / 0.1))
                opening = 14 + 90 * e_out(clamp((t - st - 0.1) / 0.35))
                for poly in claw_polys(cx, cy, ang, u, opening):
                    md.polygon(poly, fill=255)
                ea = 1 - clamp((t - st - 0.1) / 0.25)
                if ea > 0:
                    for poly in claw_polys(cx, cy, ang, u, opening + 16):
                        fd.polygon(poly, fill=ORANGE + (int(230 * ea),))
                    for poly in claw_polys(cx, cy, ang, u, max(6, opening * 0.4)):
                        fd.polygon(poly, fill=WHITE + (int(255 * ea),))
            out = Image.composite(rev, DARK, mask).convert("RGBA")
            out.alpha_composite(fx.filter(ImageFilter.GaussianBlur(2)))
            out = out.convert("RGB")
        else:
            out = tint(rev, WHITE, 0.8 * math.exp(-(t - REVEAL) * 14))
        amp = 26 * math.exp(-9 * (t - REVEAL)) if t >= REVEAL else 0
        for st, *_ in SLASHES:
            if st <= t < st + 0.2:
                amp += 10 * (1 - (t - st) / 0.2)
        out = camera(out, amp * math.sin(t * 97), amp * math.cos(t * 83))
        st, ang = SPLIT
        if t >= st:
            a = math.radians(ang)
            ux, uy, nx, ny = math.cos(a), math.sin(a), -math.sin(a), math.cos(a)
            u = e_out(clamp((t - st) / 0.12))
            if t < st + 0.15:
                o = out.convert("RGBA")
                o.alpha_composite(glow_layer(lambda gd, k: gd.line(((CX - ux * 1300 * u) * k, (CY - uy * 1300 * u) * k,
                                                                     (CX + ux * 1300 * u) * k, (CY + uy * 1300 * u) * k),
                                                                    fill=ORANGE + (255,), width=int(40 * k)), 6))
                ImageDraw.Draw(o).line((CX - ux * 1300 * u, CY - uy * 1300 * u, CX + ux * 1300 * u, CY + uy * 1300 * u),
                                       fill=WHITE + (255,), width=6)
                out = o.convert("RGB")
            dd = 1300 * e_in(clamp((t - st - 0.15) / 0.55))
            if dd > 0:
                half = Image.new("L", (W, H), 0)
                ImageDraw.Draw(half).polygon([(CX - ux * 3000, CY - uy * 3000), (CX + ux * 3000, CY + uy * 3000),
                                              (CX + ux * 3000 + nx * 3000, CY + uy * 3000 + ny * 3000),
                                              (CX - ux * 3000 + nx * 3000, CY - uy * 3000 + ny * 3000)], fill=255)
                mv = lambda img, sx, sy: img.transform((W, H), Image.AFFINE, (1, 0, -sx, 0, 1, -sy))
                black = Image.new("RGB", (W, H))
                res = Image.composite(mv(out, nx * dd, ny * dd), black, mv(half, nx * dd, ny * dd))
                other = ImageChops.invert(half)
                out = Image.composite(mv(out, -nx * dd, -ny * dd), res, mv(other, -nx * dd, -ny * dd))
        return tint(out, (0, 0, 0), max(1 - clamp(t / 0.15), clamp((t - 4.8) / 0.2)))

    m = Mix(21)
    for st, *_ in SLASHES:
        m.swish(st - 0.02, 0.2, 0.7)
        tt, nz = m.ts(0.3), m.noise(0.3)
        m.at(st + 0.08, (nz - m.lp(nz, 6)) * (m.rng.random(len(tt)) > 0.6) * np.exp(-8 * tt) * 0.25)
    m.whoosh(0.4, 0.55, 0.6)
    m.boom(REVEAL, 1.0)
    for _ in range(16):
        m.clink(m.rng.uniform(1.2, 3.2), m.rng.uniform(0.4, 0.9), m.rng.uniform(2800, 4200))
    for b in BEATS:
        m.kick(b, 0.7)
        m.hat(b + 0.25, 0.15)
    m.chime(2.3)
    m.swish(SPLIT[0] - 0.02, 0.2, 0.7)
    m.whoosh(SPLIT[0] + 0.1, 0.6, 0.6)
    m.drone(55, 0.05, start=REVEAL)
    return frame, m, PREVIEW
