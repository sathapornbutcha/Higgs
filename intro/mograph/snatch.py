"""Snatch (layered hero): the title slams up from below, the bunny pounces down onto it, coins burst,
independent bunny/title motion while holding, then the bunny snatches away and the screen cuts to black.

Uses <logo dir>/layers/top.png (bunny) and layers/bottom.png (title), both the same size as the logo and
aligned so that top over bottom == logo. Without them the logo is split horizontally at 62%.
"""
from core import *

TEXT_IN = (0.3, 0.62)
POUNCE = (0.7, 1.05)
BEATS = np.arange(1.55, 4.1, 0.5)
SHINES = ((2.0, "text"), (3.0, "top"))
LIGHT = (1.8, 2.8, 3.55)
OUT = 4.25
PREVIEW = (16, 27, 60, 136)


def load_layers(logo_path, h):
    base = os.path.join(os.path.dirname(os.path.abspath(logo_path)), "layers")
    logo = Image.open(logo_path).convert("RGBA")
    if os.path.exists(os.path.join(base, "top.png")) and os.path.exists(os.path.join(base, "bottom.png")):
        top, bot = (Image.open(os.path.join(base, f)).convert("RGBA") for f in ("top.png", "bottom.png"))
    else:
        cut = int(logo.height * 0.62)
        top, bot = logo.copy(), logo.copy()
        ImageDraw.Draw(top).rectangle((0, cut, logo.width, logo.height), fill=(0, 0, 0, 0))
        ImageDraw.Draw(bot).rectangle((0, 0, logo.width, cut), fill=(0, 0, 0, 0))
    box = logo.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    w = round((box[2] - box[0]) * h / (box[3] - box[1]))
    return [im.crop(box).resize((w, h), Image.LANCZOS) for im in (top, bot)]


def build(logo_path):
    TOP, BOT = load_layers(logo_path, 860)
    LW, LH = TOP.size
    BG = radial(W, H, (70, 20, 120), (6, 2, 12), 0.85)
    RS = int(math.hypot(W, H)) + 4
    yy, xx = np.mgrid[0:RS, 0:RS] - RS / 2
    rays = np.zeros((RS, RS, 4), np.uint8)
    rays[..., :3] = (170, 80, 255)
    wedge = (np.floor(np.arctan2(yy, xx) / (2 * np.pi / 24)) % 2) == 0
    rays[..., 3] = (wedge * np.clip(1 - np.hypot(xx, yy) / (RS / 2), 0, 1) ** 1.3 * 70).astype(np.uint8)
    RAYS = Image.fromarray(rays).filter(ImageFilter.GaussianBlur(4))
    del yy, xx, rays, wedge
    rnd = random.Random(21)
    EMB = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(30, 80), rnd.uniform(2, 4.5), rnd.uniform(0, 6.3), rnd.choice((ORANGE, GOLD, LILAC)))
           for _ in range(60)]
    COINS = [(rnd.uniform(0, 2 * math.pi), rnd.uniform(700, 1500), rnd.uniform(26, 44), rnd.uniform(6, 12)) for _ in range(16)]
    DUST = [(rnd.uniform(-1, 1), rnd.uniform(200, 700), rnd.uniform(6, 14), rnd.uniform(0.2, 1)) for _ in range(40)]
    SPEED = [(rnd.uniform(0, 2 * math.pi), rnd.uniform(0, 0.12), rnd.randint(3, 6)) for _ in range(40)]

    def place(dst, img, dx, dy, s=1.0, rot=0.0, alpha=1.0):
        im = img if (abs(s - 1) < 0.002 and abs(rot) < 0.05) else img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BICUBIC)
        if abs(rot) >= 0.05:
            im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
        center(dst, with_alpha(im, alpha), CX + dx, CY + dy)

    def trail(dst, img, path, s_fn, rot_fn, n=4):
        """Motion blur: ghosts along the last few positions, faintest first."""
        for k, (dx, dy, t_) in enumerate(path[-n:]):
            a = (k + 1) / (n + 1) * 0.35 if k < n - 1 else 1.0
            place(dst, img, dx, dy, s_fn(t_), rot_fn(t_), a if k < n - 1 else 1.0)

    def text_pos(t):
        tau = t - TEXT_IN[0]
        if tau < 0:
            return None
        p = spring(tau, 10, 20)
        dy = (1 - p) * 760
        s = 1.0
        for b in BEATS:
            if t >= b:
                s *= 1 + 0.025 * math.exp(-(t - b) * 12)
        if t >= OUT + 0.3:
            s *= 1 + 0.25 * e_in(clamp((t - OUT - 0.3) / 0.35))
        return 0, dy, s, 0.0

    def top_pos(t):
        tau = t - POUNCE[0]
        if tau < 0:
            return None
        p = e_in(clamp(tau / (POUNCE[1] - POUNCE[0])))
        dx, dy = (1 - p) * 900, -(1 - p) * 950
        s, rot = 1 + 0.35 * (1 - p), 18 * (1 - p)
        land = t - POUNCE[1]
        if land >= 0:
            squash = 0.06 * math.exp(-9 * land) * math.cos(26 * land)
            s = 1 - squash
            dy = squash * 200
            dy += 7 * math.sin(2 * math.pi * (t - POUNCE[1]) / 1.4) * clamp((t - 1.5) / 0.4)
        if t >= OUT:
            q = t - OUT
            dy += 30 * math.sin(math.pi * clamp(q / 0.15))                 # anticipation dip
            dy -= 1400 * e_in(clamp((q - 0.15) / 0.2))                      # zip up and away
            s *= 1 - 0.1 * e_in(clamp((q - 0.15) / 0.2))
        return dx, dy, s, rot

    def frame(i):
        t = i / FPS
        im = BG.copy()
        ra = clamp((t - 0.5) / 0.5) * (1 - clamp((t - OUT) / 0.5))
        if ra > 0:
            rr = RAYS.rotate(t * 10, resample=Image.BILINEAR)
            o = ((RS - W) // 2, (RS - H) // 2)
            rr = rr.crop((o[0], o[1], o[0] + W, o[1] + H))
            rr.putalpha(rr.getchannel("A").point(lambda v: int(v * ra)))
            im.alpha_composite(rr)
        ov, d = layer()
        ea = clamp((t - 0.6) / 0.5)
        for x0, y0, v, sz, ph, col in EMB:
            y = (y0 - v * t) % H
            x = x0 + 18 * math.sin(t + ph)
            d.ellipse((x - sz, y - sz, x + sz, y + sz), fill=col + (int(200 * ea * (0.5 + 0.5 * math.sin(3 * t + ph))),))
        if t < TEXT_IN[0] + 0.3:  # converging speed lines
            for a, dl, wd in SPEED:
                pk = clamp((t - dl) / (TEXT_IN[1] - dl))
                if 0 < pk < 1:
                    rh = 1300 - 1150 * e_in(pk)
                    d.line((CX + rh * math.cos(a), CY + rh * math.sin(a), CX + (rh + 300) * math.cos(a), CY + (rh + 300) * math.sin(a)),
                           fill=(255, 200, 150, int(200 * (1 - pk))), width=wd)
        for st, col in ((TEXT_IN[1], LILAC), (POUNCE[1], ORANGE), (POUNCE[1] + 0.07, PURPLE)):
            if st <= t < st + 0.6:
                p = (t - st) / 0.6
                r = 120 + 1200 * e_out(p)
                d.ellipse((CX - r, CY + 80 - r * 0.55, CX + r, CY + 80 + r * 0.55), outline=col + (int(230 * (1 - p)),), width=max(1, int(26 * (1 - p))))
        im.alpha_composite(ov)
        lflash = 0
        for te in LIGHT:
            if te <= t < te + 0.12 and int((t - te) * FPS) % 3 != 2:
                random.seed(int(te * 100) + i // 2)
                def bolts(gd, k):
                    for _ in range(2):
                        a = random.choice((-1, 1)) * random.uniform(0.1, 0.5) + (0 if random.random() < 0.5 else math.pi)
                        p0 = (CX + 380 * math.cos(a), CY + 250 + 120 * math.sin(a))
                        p1 = (CX + 1000 * math.cos(a), CY + 250 + 500 * math.sin(a))
                        pts = [p0]
                        for j in range(1, 9):
                            f = j / 8
                            pts.append((lerp(p0[0], p1[0], f) + random.uniform(-40, 40), lerp(p0[1], p1[1], f) + random.uniform(-40, 40)))
                        gd.line([(x * k, y * k) for x, y in pts], fill=(200, 120, 255, 255), width=int(24 * k) if k < 1 else 5)
                state = random.getstate()
                im.alpha_composite(glow_layer(bolts, 6))
                random.setstate(state)
                bolts(ImageDraw.Draw(im, "RGBA"), 1)
                lflash = 0.08
        if t >= POUNCE[1]:  # coin burst, behind the logo so it never covers the face or title
            tau = t - POUNCE[1]
            cv, d = layer()
            for a, v, R, fs in COINS:
                if tau < 1.4:
                    r = 160 + v * (1 - math.exp(-2.6 * tau)) / 2.6
                    x, y = CX + r * math.cos(a), CY + 60 + r * math.sin(a) * 0.7 + 900 * tau * tau
                    coin(d, x, y, R, math.cos(fs * tau), int(255 * (1 - clamp((tau - 1.0) / 0.4))))
            im.alpha_composite(cv)
        tp = text_pos(t)
        if tp:
            dx, dy, s, rot = tp
            if t < TEXT_IN[0] + 0.25:
                path = [(0, text_pos(t - k / FPS / 2)[1] if text_pos(t - k / FPS / 2) else 760, t - k / FPS / 2) for k in range(3, -1, -1)]
                trail(im, BOT, path, lambda t_: 1.0, lambda t_: 0.0)
            else:
                b = BOT
                for st, which in SHINES:
                    if which == "text" and st <= t < st + 0.5:
                        b = shine(BOT, -0.2 + 1.4 * (t - st) / 0.5)
                place(im, b, dx, dy, s, rot)
        pp = top_pos(t)
        if pp and pp[1] > -1300:
            dx, dy, s, rot = pp
            g = TOP
            for st, which in SHINES:
                if which == "top" and st <= t < st + 0.5:
                    g = shine(TOP, -0.2 + 1.4 * (t - st) / 0.5)
            fast = t < POUNCE[1] or (OUT + 0.15 <= t < OUT + 0.4)
            if fast:
                path = []
                for k in range(3, -1, -1):
                    t_ = t - k / FPS / 2
                    q = top_pos(t_)
                    if q:
                        path.append((q[0], q[1], t_))
                trail(im, g, path, lambda t_: top_pos(t_)[2], lambda t_: top_pos(t_)[3])
            else:
                place(im, g, dx, dy, s, rot)
        ov, d = layer()
        if t >= POUNCE[1]:
            tau = t - POUNCE[1]
            for dxn, v, sz, vy in DUST:
                if tau < 0.8:
                    x = CX + dxn * (300 + v * tau)
                    y = CY + 330 - 60 * vy - 380 * vy * tau + 500 * tau * tau
                    d.ellipse((x - sz, y - sz, x + sz, y + sz), fill=(230, 210, 255, int(160 * (1 - tau / 0.8))))
        if TEXT_IN[1] <= t < TEXT_IN[1] + 0.5:
            tau = t - TEXT_IN[1]
            for dxn, v, sz, vy in DUST:
                x = CX + dxn * (450 + v * 0.8 * tau)
                y = CY + 470 - 70 * vy - 320 * vy * tau + 600 * tau * tau
                d.ellipse((x - sz, y - sz, x + sz, y + sz), fill=(200, 160, 255, int(140 * (1 - tau / 0.5))))
        im.alpha_composite(ov)
        out = im.convert("RGB")
        fl = 0
        if t >= POUNCE[1]:
            fl = max(fl, 0.35 * math.exp(-(t - POUNCE[1]) * 26))
        if t >= TEXT_IN[1]:
            fl = max(fl, 0.12 * math.exp(-(t - TEXT_IN[1]) * 26))
        out = tint(out, (255, 235, 255), fl)
        out = tint(out, (190, 120, 255), lflash)
        amp = 0
        if t >= TEXT_IN[1]:
            amp += 16 * math.exp(-10 * (t - TEXT_IN[1]))
        if t >= POUNCE[1]:
            amp += 30 * math.exp(-8 * (t - POUNCE[1]))
        amp += 5 * (lflash > 0)
        out = camera(out, amp * math.sin(t * 97), amp * math.cos(t * 83), 1 + 0.03 * clamp((t - 1.2) / 3))
        if t >= OUT + 0.62:
            out = tint(out, WHITE, 0.8 * (1 - clamp((t - OUT - 0.62) / 0.06)))
        fade = max(1 - clamp(t / 0.15), clamp((t - OUT - 0.62) / 0.05))
        return tint(out, (0, 0, 0), fade)

    m = Mix(91)
    m.whoosh(0.0, TEXT_IN[1], 0.7)
    m.boom(TEXT_IN[1], 0.7, 0.8)
    m.whoosh(POUNCE[0] - 0.05, POUNCE[1] - POUNCE[0] + 0.05, 0.9)
    m.boom(POUNCE[1], 1.0, 1.4)
    for k in range(10):
        m.clink(POUNCE[1] + 0.08 + k * 0.07 + m.rng.uniform(0, 0.04), m.rng.uniform(0.4, 0.9), m.rng.uniform(2800, 4300))
    for b in BEATS:
        m.kick(b, 0.8)
        m.hat(b + 0.25, 0.18)
        nz = m.noise(0.1)
        m.at(b + 0.25, (nz - m.lp(nz, 4)) * np.exp(-28 * m.ts(0.1)) * 0.12)
    for st, _ in SHINES:
        m.chime(st)
    for te in LIGHT:
        m.zap(te, 0.14, 0.3)
    m.drone(55, 0.06, start=POUNCE[1], end=OUT + 0.6)
    m.whoosh(OUT - 0.2, 0.35, 0.4)
    m.swish(OUT + 0.15, 0.2, 0.8)
    m.boom(OUT + 0.6, 0.9, 0.4)
    return frame, m, PREVIEW
