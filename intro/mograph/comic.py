"""Comic Pop: halftone background, sliding comic panels, starburst + logo stamp, manga speed lines, iris-out."""
import glob
from PIL import ImageFont
from core import *

BEATS = np.arange(1.1, 4.2, 0.5)
STAMP = 0.62
IRIS = 4.35
BASS = (65.41, 82.41, 98.0, 82.41)
WORDS = (("SNATCH!", 1.3, 2.5, 330, 190, -12), ("ZAP!", 2.8, 3.9, W - 300, H - 170, 10))
PREVIEW = (9, 24, 45, 138)


def find_font():
    pats = ("*Montserrat*Black*.ttf", "*Montserrat*ExtraBold*.ttf", "*Montserrat*Bold*.ttf", "*Metropolis*Black*.otf",
            "*Metropolis*Bold*.otf", "*DejaVuSans-Bold.ttf")
    for pat in pats:
        for root in ("/usr/share/fonts", "/usr/local/share/fonts", os.path.expanduser("~/.fonts"), os.path.expanduser("~/.local/share/fonts")):
            hits = glob.glob(os.path.join(root, "**", pat), recursive=True)
            if hits:
                return hits[0]
    return None


def burst_poly(R, n, seed, rot):
    rnd = random.Random(seed)
    pts = []
    for k in range(2 * n):
        r = R * (1 if k % 2 == 0 else 0.7) * rnd.uniform(0.9, 1.1)
        a = math.pi * k / n + math.radians(rot)
        pts.append((CX + r * math.cos(a), CY + r * math.sin(a)))
    return pts


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 800)
    HT = Image.new("RGBA", (W + 60, H + 60), (255, 150, 40, 255))
    d = ImageDraw.Draw(HT)
    step = 30
    for yi, y in enumerate(range(0, H + 60, step)):
        for x in range(0, W + 60, step):
            x2 = x + (step / 2 if yi % 2 else 0)
            r = 2 + 11 * clamp(math.hypot(x2 - CX, y - CY) / 1100)
            d.ellipse((x2 - r, y - r, x2 + r, y + r), fill=(215, 90, 15, 255))
    fp = find_font()
    word_imgs = []
    for text, t0, t1, x, y, rot in WORDS:
        if not fp:
            break
        f = ImageFont.truetype(fp, 120)
        box = f.getbbox(text, stroke_width=10)
        im = Image.new("RGBA", (box[2] - box[0] + 40, box[3] - box[1] + 40), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((20 - box[0] + 10, 20 - box[1] + 10), text, font=f, fill=(0, 0, 0, 255), stroke_width=10, stroke_fill=(0, 0, 0, 255))
        ImageDraw.Draw(im).text((20 - box[0], 20 - box[1]), text, font=f, fill=WHITE + (255,), stroke_width=10, stroke_fill=(40, 10, 70, 255))
        word_imgs.append(im)
    PANELS = ((PURPLE, -1), ((255, 255, 255), 1), ((40, 10, 70), -1))
    rnd = random.Random(9)
    STARS = [(rnd.uniform(150, W - 150), rnd.uniform(120, H - 120), rnd.uniform(18, 40), rnd.uniform(3, 6), rnd.uniform(0, 6.3)) for _ in range(12)]

    def frame(i):
        t = i / FPS
        off = int(t * 40) % 30
        im = HT.crop((off, off, off + W, off + H))
        d = ImageDraw.Draw(im, "RGBA")
        if t >= STAMP - 0.08:  # manga speed lines
            r2 = random.Random(i // 3)
            for _ in range(70):
                a = r2.uniform(0, 2 * math.pi)
                ri, wo = r2.uniform(620, 860), r2.uniform(0.012, 0.03)
                d.polygon([(CX + 1300 * math.cos(a - wo), CY + 1300 * math.sin(a - wo)), (CX + ri * math.cos(a), CY + ri * math.sin(a)),
                           (CX + 1300 * math.cos(a + wo), CY + 1300 * math.sin(a + wo))], fill=(20, 5, 35, 255))
        bs = spring(t - (STAMP - 0.05), 10, 18)
        if bs > 0:
            for R, col, rot in ((620, PURPLE, -t * 10), (520, WHITE, t * 8)):
                poly = burst_poly(R * bs, 18, int(R), rot)
                d.polygon(poly, fill=col + (255,), outline=(0, 0, 0, 255), width=14)
        for x, y, r, w_, ph in STARS:
            k = max(0, math.sin(w_ * t + ph)) * clamp((t - 1.0) / 0.3)
            if k > 0.05:
                star4(d, x, y, r * k * 1.25, (0, 0, 0, 255))
                star4(d, x, y, r * k, WHITE + (255,))
        # panels (intro)
        if t < STAMP + 0.3:
            for k, (col, sgn) in enumerate(PANELS):
                pin = e_out(clamp((t - 0.1 * k) / 0.2))
                pout = e_in(clamp((t - STAMP + 0.05) / 0.25))
                if pin <= 0:
                    continue
                x0 = k * W / 3 - 60
                sy = sgn * (1 - pin) * (H + 200)
                sx = (k - 1) * pout * 1600 if k != 1 else 0
                sy += (-pout * (H + 400) if k == 1 else 0)
                pts = [(x0 + sx + 120, sy - 20), (x0 + sx + W / 3 + 180, sy - 20), (x0 + sx + W / 3 + 60, sy + H + 20), (x0 + sx, sy + H + 20)]
                d.polygon(pts, fill=col + (255,), outline=(0, 0, 0, 255), width=16)
        # logo stamp
        if t >= STAMP:
            p = clamp((t - STAMP) / 0.14)
            s = lerp(2.4, 1.0, e_out(p))
            tau = t - STAMP - 0.14
            if tau > 0:
                s *= 1 + 0.06 * math.exp(-10 * tau) * math.cos(30 * tau)
            for b in BEATS:
                if t >= b:
                    s *= 1 + 0.025 * math.exp(-(t - b) * 12)
            rot = 2 * math.sin(2 * math.pi * t / 2.4) * clamp((t - 1.0) / 0.4)
            lg = sized(LOGO, LW, LH, s, rot)
            if 2.2 <= t < 2.7:
                lg = shine(lg, -0.2 + 1.4 * (t - 2.2) / 0.5)
            lg = with_alpha(lg, clamp(p / 0.35))
            dy = 10 * math.sin(2 * math.pi * t / 1.2) * clamp((t - 1.0) / 0.4)
            sh = Image.new("RGBA", lg.size, (20, 5, 35, 0))
            sh.putalpha(lg.getchannel("A").point(lambda v: int(v * 0.85)))
            center(im, sh, CX + 18, CY + dy + 18)
            center(im, lg, CX, CY + dy)
        for (text, t0, t1, x, y, rot), wi in zip(WORDS, word_imgs):
            if t0 <= t < t1:
                s = spring(t - t0, 12, 25) * (1 - e_in(clamp((t - t1 + 0.15) / 0.15)))
                if s > 0.02:
                    center(im, wi.resize((max(1, int(wi.width * s)), max(1, int(wi.height * s)))).rotate(rot + 4 * math.sin(t * 9), expand=True,
                                                                                                          resample=Image.BICUBIC), x, y)
        out = im.convert("RGB")
        amp = 24 * math.exp(-10 * (t - STAMP - 0.14)) if t >= STAMP + 0.14 else 0
        out = camera(out, amp * math.sin(t * 97), amp * math.cos(t * 83))
        if t >= IRIS:
            r = 1250 * (1 - e_in(clamp((t - IRIS) / 0.6)))
            mask = Image.new("L", (W, H), 0)
            ImageDraw.Draw(mask).ellipse((CX - r, CY - 40 - r, CX + r, CY - 40 + r), fill=255)
            out = Image.composite(out, Image.new("RGB", (W, H)), mask)
        return tint(out, (0, 0, 0), 1 - clamp(t / 0.12))

    m = Mix(31)
    for k in range(3):
        m.swish(0.1 * k, 0.16, 0.45)
    m.whoosh(STAMP - 0.4, 0.4, 0.6)
    m.kick(STAMP + 0.12, 1.0)
    nz = m.noise(0.03)
    m.at(STAMP + 0.12, nz * 0.6)
    tt = m.ts(0.6)
    m.at(STAMP + 0.14, m.sweep(180 * (1 + 0.8 * tt) + 70 * np.sin(2 * np.pi * 14 * tt) * np.exp(-3 * tt)) * np.exp(-3 * tt) * 0.35)
    for k, b in enumerate(BEATS):
        m.note(b, BASS[k % 4], 0.45, 0.4, 7)
        m.kick(b, 0.45)
        m.hat(b + 0.25, 0.15)
    for text, t0, *_ in WORDS:
        tt = m.ts(0.12)
        m.at(t0, m.sweep(800 + 1200 * tt / 0.12) * 0.15 * np.exp(-8 * tt))
        m.kick(t0, 0.5)
    m.zap(2.8, 0.2, 0.35)
    m.chime(2.2)
    tt = m.ts(0.6)
    m.at(IRIS, m.sweep(1600 - 1300 * (tt / 0.6) ** 1.5) * 0.14 * np.clip(tt / 0.03, 0, 1))
    m.kick(IRIS + 0.5, 0.6)
    return frame, m, PREVIEW
