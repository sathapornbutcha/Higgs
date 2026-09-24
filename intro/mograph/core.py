"""Shared helpers for The Snatchers motion-graphic intro styles."""
import math, os, random, subprocess, time, wave
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H, FPS, DUR, SR = 1920, 1080, 30, 5.0, 44100
N = int(FPS * DUR)
CX, CY = W / 2, H / 2
ORANGE, GOLD, PURPLE, LILAC, WHITE = (255, 140, 26), (255, 205, 70), (150, 60, 255), (200, 130, 255), (255, 255, 255)
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

clamp = lambda x, a=0.0, b=1.0: max(a, min(b, x))
e_out = lambda p: 1 - (1 - p) ** 3
e_in = lambda p: p ** 3
e_inout = lambda p: 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2
lerp = lambda a, b, p: a + (b - a) * p


def spring(tau, k=12, w=22):
    """0 -> 1 with overshoot; tau in seconds since start."""
    return 0.0 if tau <= 0 else 1 - math.exp(-k * tau) * math.cos(w * tau)


def load_logo(path, h=880):
    logo = Image.open(path).convert("RGBA")
    logo = logo.crop(logo.getbbox())
    return logo, round(logo.width * h / logo.height), h


def sized(logo, lw, lh, s, rot=0.0):
    img = logo.resize((max(1, int(lw * s)), max(1, int(lh * s))), Image.BICUBIC)
    return img.rotate(rot, resample=Image.BICUBIC, expand=True) if abs(rot) > 0.05 else img


def comp(dst, src, x, y):
    x, y = int(round(x)), int(round(y))
    sx, sy = max(0, -x), max(0, -y)
    if sx or sy:
        src = src.crop((sx, sy, src.width, src.height))
        x, y = x + sx, y + sy
    if src.width > 0 and src.height > 0 and x < dst.width and y < dst.height:
        dst.alpha_composite(src, (x, y))


def center(dst, src, cx=CX, cy=CY):
    comp(dst, src, cx - src.width / 2, cy - src.height / 2)


def radial(w, h, cin, cout, power=0.8, cx=None, cy=None):
    cx, cy = (w / 2 if cx is None else cx), (h / 2 if cy is None else cy)
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.clip(np.hypot(xx - cx, yy - cy) / (w / 2), 0, 1) ** power
    arr = np.array(cin) * (1 - r)[..., None] + np.array(cout) * r[..., None]
    return Image.fromarray(arr.astype(np.uint8)).convert("RGBA")


def shine(img, c, width=0.05, strength=0.75):
    a = np.asarray(img)[..., 3].astype(np.float32) / 255
    h, w = a.shape
    y, x = np.mgrid[0:h, 0:w]
    k = np.exp(-(((x / w * 0.7 + y / h * 0.3 - c) / width) ** 2)) * strength * a
    white = np.zeros((h, w, 4), np.uint8)
    white[..., :3] = 255
    white[..., 3] = (k * 255).astype(np.uint8)
    out = img.copy()
    out.alpha_composite(Image.fromarray(white))
    return out


def with_alpha(img, a):
    if a >= 0.999:
        return img
    out = img.copy()
    out.putalpha(img.getchannel("A").point(lambda v: int(v * a)))
    return out


def layer():
    """Transparent overlay + drawer. ImageDraw on an RGBA image replaces pixels (alpha included) instead of blending,
    so translucent shapes go on an overlay that is then alpha_composite()d."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return ov, ImageDraw.Draw(ov, "RGBA")


def tint(img, color, a):
    return Image.blend(img, Image.new("RGB", img.size, color), a) if a > 0.005 else img


def glow_layer(draw_fn, blur=6):
    """Draw at half resolution with draw_fn(ImageDraw, scale), blur, return full-size RGBA."""
    g = Image.new("RGBA", (W // 2, H // 2), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(g, "RGBA"), 0.5)
    return g.filter(ImageFilter.GaussianBlur(blur)).resize((W, H), Image.BILINEAR)


def camera(img, dx=0.0, dy=0.0, z=1.0):
    if dx == 0 and dy == 0 and z == 1:
        return img
    z = max(z, CX / (CX - abs(dx)), CY / (CY - abs(dy))) * 1.0005  # zoom just enough that shake never leaves the frame
    bw, bh = W / z, H / z
    return img.resize((W, H), Image.BILINEAR, box=(CX + dx - bw / 2, CY + dy - bh / 2, CX + dx + bw / 2, CY + dy + bh / 2))


def rgb_split(img, dx):
    if dx == 0:
        return img
    r, g, b = img.split()
    return Image.merge("RGB", (ImageChops.offset(r, dx, 0), g, ImageChops.offset(b, -dx, 0)))


def coin(d, x, y, R, flip, alpha=255):
    f = max(0.12, abs(flip))
    d.ellipse((x - R * f, y - R, x + R * f, y + R), fill=(230, 150, 30, alpha), outline=(120, 60, 10, alpha), width=max(2, int(R / 12)))
    d.ellipse((x - R * f * 0.7, y - R * 0.7, x + R * f * 0.7, y + R * 0.7), fill=(255, 205, 70, alpha))


def star4(d, x, y, r, color, width_ratio=0.18):
    w = r * width_ratio
    d.polygon([(x, y - r), (x + w, y - w), (x + r, y), (x + w, y + w), (x, y + r), (x - w, y + w), (x - r, y), (x - w, y - w)], fill=color)


class Mix:
    def __init__(self, seed=3):
        self.n = int(SR * DUR)
        self.t = np.arange(self.n) / SR
        self.A = np.zeros(self.n)
        self.rng = np.random.default_rng(seed)

    def at(self, t0, sig):
        i = int(t0 * SR)
        if i >= self.n:
            return
        j = min(self.n, i + len(sig))
        self.A[i:j] += sig[: j - i]

    ts = staticmethod(lambda d: np.arange(int(d * SR)) / SR)
    lp = staticmethod(lambda x, k: np.convolve(x, np.ones(k) / k, "same"))

    def noise(self, d):
        return self.rng.standard_normal(int(d * SR))

    def sweep(self, f):
        return np.sin(2 * np.pi * np.cumsum(f) / SR)

    def whoosh(self, t0, d=0.6, gain=0.9):
        tt, nz = self.ts(d), self.noise(d)
        p = tt / d
        self.at(t0, (self.lp(nz, 40) * (1 - p) + (nz - self.lp(nz, 6)) * 0.5 * p) * p ** 2 * gain)

    def swish(self, t0, d=0.18, gain=0.5):
        tt, nz = self.ts(d), self.noise(d)
        self.at(t0, (nz - self.lp(nz, 3)) * np.sin(np.pi * tt / d) ** 2 * gain)

    def boom(self, t0, gain=1.0, d=1.2):
        tt = self.ts(d)
        s = self.sweep(40 + 80 * np.exp(-12 * tt)) * np.exp(-4 * tt) + self.lp(self.noise(d), 8) * np.exp(-25 * tt) * 0.8
        self.at(t0, np.tanh(s * 1.5) * gain)

    def kick(self, t0, gain=0.7):
        tt = self.ts(0.3)
        self.at(t0, self.sweep(50 + 90 * np.exp(-30 * tt)) * np.exp(-14 * tt) * gain)

    def hat(self, t0, gain=0.15):
        h = self.noise(0.06)
        self.at(t0, (h - self.lp(h, 3)) * np.exp(-70 * self.ts(0.06)) * gain)

    def chime(self, t0, freqs=((2100, 0.12), (3150, 0.08), (4400, 0.06)), d=0.7, rise=0.5):
        tt = self.ts(d)
        s = sum(np.sin(2 * np.pi * (f + f * rise * tt) * tt) * a for f, a in freqs)
        self.at(t0, s * np.exp(-5 * tt) * np.clip(tt / 0.01, 0, 1))

    def note(self, t0, f, d=0.5, gain=0.15, decay=6):
        tt = self.ts(d)
        self.at(t0, (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-decay * tt) * np.clip(tt / 0.005, 0, 1) * gain)

    def zap(self, t0, d=0.16, gain=0.35):
        tt, nz = self.ts(d), self.noise(d)
        self.at(t0, (nz - self.lp(nz, 4)) * (np.sin(2 * np.pi * 70 * tt) > 0) * np.exp(-12 * tt) * gain)

    def clink(self, t0, gain=1.0, f=3300):
        tt = self.ts(0.4)
        self.at(t0, (np.sin(2 * np.pi * f * tt) * 0.12 + np.sin(2 * np.pi * f * 1.5 * tt) * 0.07) * np.exp(-14 * tt) * gain)

    def drone(self, f=55, gain=0.06, start=0.6, end=4.9):
        t = self.t
        self.A += np.sin(2 * np.pi * f * t) * gain * np.clip((t - start) / 0.3, 0, 1) * np.clip((end - t) / 0.4, 0, 1)

    def echo(self, delays=((0.11, 0.35), (0.23, 0.2), (0.37, 0.1))):
        src = self.A.copy()
        for dl, g in delays:
            k = int(dl * SR)
            self.A[k:] += src[:-k] * g

    def write(self, path):
        A = self.A * np.clip((DUR - self.t) / 0.15, 0, 1)
        A = A / (np.max(np.abs(A)) + 1e-9) * 0.89
        pcm = (A * 32767).astype(np.int16)
        with wave.open(path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(np.repeat(pcm, 2).tobytes())


def render(frame, mix, out_path, prev_frames=(), log=print):
    t0 = time.time()
    wav = out_path + ".wav"
    mix.write(wav)
    ff = subprocess.Popen([FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    prev = {}
    for i in range(N):
        fr = frame(i)
        ff.stdin.write(fr.tobytes())
        if i in prev_frames:
            prev[i] = fr.resize((480, 270))
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    log(f"{out_path}: {time.time() - t0:.1f}s rc={ff.returncode}")
    return [prev[i] for i in prev_frames]
