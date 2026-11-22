"""Every sound effect and the music, synthesized from maths (numpy/scipy). No samples, no downloads.
All functions return mono float64 arrays at SR."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(1234)  # fixed seed: the mix is identical every run

def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, min(n - na, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "bp", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "lp", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "hp", fs=SR, output="sos"), x)
def noise(d): return rng.normal(0, 1, int(d * SR))
def norm(x, peak=0.9): return x / (np.abs(x).max() + 1e-9) * peak

def whoosh(d=0.45):
    n = noise(d); t = t_(d)
    # a band-pass sweep: filter the noise in short blocks with a rising-then-falling centre
    out = np.zeros_like(n); blk = 480
    for i in range(0, len(n), blk):
        k = i / len(n); fc = 400 + 3200 * np.sin(np.pi * k) ** 1.5
        out[i:i + blk] = bp(n[max(0, i - 2000):i + blk], fc * 0.6, fc * 1.4)[-len(n[i:i + blk]):]
    return norm(out * np.sin(np.pi * t / d) ** 2, 0.6)

def pop(d=0.09):
    t = t_(d); f = 900 * np.exp(-t * 30) + 300
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45), 0.55)

def click(d=0.03):
    t = t_(d); return norm(hp(noise(d), 2000) * np.exp(-t * 300) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 200), 0.35)

def sparkle(d=0.7):
    t = t_(d); x = np.zeros_like(t)
    for i, f in enumerate([2093, 2637, 3136, 4186, 3520]):
        s = int(i * 0.06 * SR); tt = t[: len(t) - s]
        x[s:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9)
    return norm(x, 0.3)

def notif(d=0.5):
    t = t_(d); x = np.sin(2 * np.pi * 1318 * t) * np.exp(-t * 10)
    s = int(0.11 * SR); x[s:] += np.sin(2 * np.pi * 1760 * t[:-s]) * np.exp(-t[:-s] * 8)
    return norm(x, 0.4)

def ding(d=1.2):
    t = t_(d); x = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(1568, 1), (3136, 0.4), (4704, 0.15)]) * np.exp(-t * 4)
    s = int(0.14 * SR); x[s:] += 0.8 * sum(a * np.sin(2 * np.pi * f * t[:-s]) for f, a in [(2093, 1), (4186, 0.3)]) * np.exp(-t[:-s] * 3.5)
    return norm(x, 0.5)

def buzz(d=0.55):
    # phone vibrating on an aluminium bleacher: 2 pulses of a rattly 160 Hz motor
    t = t_(d); motor = np.sign(np.sin(2 * np.pi * 160 * t)) * 0.6 + np.sin(2 * np.pi * 320 * t) * 0.3
    gate = ((t % 0.28) < 0.2).astype(float)
    return norm(lp(motor * gate, 1800) * env(len(t), 0.005, 0.03), 0.6)

def scratch(d=0.45):
    t = t_(d); rate = 1 + 0.9 * np.sin(2 * np.pi * 6 * t) * np.exp(-t * 2)
    x = bp(noise(d), 600, 3500) * (0.4 + 0.6 * np.abs(np.sin(np.pi * 9 * t)))
    tone = np.sin(2 * np.pi * np.cumsum(500 * rate) / SR) * 0.6
    return norm((x * 0.6 + tone) * env(len(t), 0.003, 0.08), 0.6)

def thump(d=0.35):
    t = t_(d); f = 110 * np.exp(-t * 18) + 45
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + lp(noise(d), 400) * np.exp(-t * 40) * 0.3, 0.85)

def bookdrop(d=0.9):
    x = np.zeros(int(d * SR))
    for i, (o, g) in enumerate([(0.0, 1), (0.07, 0.7), (0.16, 0.6)]):
        s = int(o * SR); hit = thump(0.25) * 0.7 + lp(noise(0.25), 2500) * np.exp(-t_(0.25) * 35) * 0.5
        x[s:s + len(hit)] += hit * g
    # papers: soft high rustle afterwards
    r = hp(noise(0.6), 3000) * np.exp(-t_(0.6) * 5) * 0.12
    x[int(0.25 * SR):int(0.25 * SR) + len(r)] += r
    return norm(x, 0.8)

def step(d=0.12):
    t = t_(d); return norm(lp(noise(d), 900) * np.exp(-t * 45) + np.sin(2 * np.pi * 80 * t) * np.exp(-t * 40) * 0.5, 0.45)

def swish(d=0.3):
    t = t_(d); return norm(bp(noise(d), 1500, 6000) * np.sin(np.pi * t / d) ** 3, 0.4)

def catch(d=0.2):
    t = t_(d); return norm(lp(noise(d), 1500) * np.exp(-t * 50) + np.sin(2 * np.pi * 140 * t) * np.exp(-t * 35), 0.6)

def cricket(d=1.6):
    t = t_(d); x = np.zeros_like(t)
    for c in range(3):  # three chirps, each 4 fast pulses of a 4.5 kHz tone
        for p in range(4):
            s = c * 0.42 + p * 0.032
            m = (t >= s) & (t < s + 0.022)
            x[m] += np.sin(2 * np.pi * 4500 * t[m]) * np.sin(np.pi * (t[m] - s) / 0.022)
    return norm(x, 0.35)

def gasp(d=1.0):
    # a small crowd inhaling: several detuned breathy noise bands swelling up
    t = t_(d); x = np.zeros_like(t)
    for i in range(6):
        fc = 700 + i * 260 + rng.uniform(-80, 80)
        x += bp(noise(d), fc * 0.7, fc * 1.3) * np.clip(t / (0.18 + i * 0.02), 0, 1) * np.exp(-np.clip(t - 0.3, 0, None) * 4)
    return norm(x, 0.55)

def sting(d=1.8):
    # end-card button: bass hit + bright major stab
    t = t_(d); x = thump(d) * 0.8
    for f in [261.6, 329.6, 392.0, 523.3]:
        x += (np.sign(np.sin(2 * np.pi * f * t)) * 0.25 + np.sin(2 * np.pi * f * t)) * np.exp(-t * 3.2) * 0.25
    return norm(lp(x, 5000), 0.8)

KINDS = dict(whoosh=whoosh, pop=pop, click=click, sparkle=sparkle, notif=notif, ding=ding, buzz=buzz, scratch=scratch,
             thump=thump, bookdrop=bookdrop, step=step, swish=swish, catch=catch, cricket=cricket, gasp=gasp, sting=sting)

# ------------------------------------------------------------------ music
def music(dur, bpm=90):
    """Original lo-fi loop: dusty drums, sub bass, soft electric-piano chords (Fmaj7 Em7 Dm7 Cmaj7)."""
    n = int(dur * SR); out = np.zeros(n + SR * 2); beat = 60 / bpm
    def add(x, at):
        s = int(at * SR); e = min(len(out), s + len(x)); out[s:e] += x[: e - s]
    kick = lambda: np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t_(0.4) * 25) + 42) / SR) * np.exp(-t_(0.4) * 9)
    snare = lambda: bp(noise(0.25), 1200, 6000) * np.exp(-t_(0.25) * 18) * 0.5 + np.sin(2 * np.pi * 190 * t_(0.25)) * np.exp(-t_(0.25) * 25) * 0.3
    hat = lambda: hp(noise(0.05), 7000) * np.exp(-t_(0.05) * 90) * 0.25
    chords = [[174.6, 220.0, 261.6, 329.6], [164.8, 196.0, 246.9, 293.7], [146.8, 174.6, 220.0, 261.6], [130.8, 164.8, 196.0, 246.9]]
    roots = [43.65, 41.2, 36.71, 32.7]
    def ep(f, d):
        tt = t_(d); m = np.sin(2 * np.pi * f * 2 * tt) * 1.2 * np.exp(-tt * 3)
        return np.sin(2 * np.pi * f * tt + m) * np.exp(-tt * 1.4) * env(len(tt), 0.01, 0.3)
    bar = beat * 4; i = 0; tm = 0.0
    while tm < dur:
        c = chords[i % 4]
        for f in c:
            add(ep(f, bar) * 0.11, tm + 0.012 * c.index(f))  # slight strum
        add(np.sin(2 * np.pi * roots[i % 4] * 2 * t_(bar)) * env(int(bar * SR), 0.02, 0.2) * 0.32, tm)
        for b in range(4):
            bt = tm + b * beat
            if b in (0, 2): add(kick() * 0.7, bt)
            if b == 2 and i % 2: add(kick() * 0.45, bt + beat * 0.75)
            if b in (1, 3): add(snare() * 0.5, bt + 0.01)
            for h in range(2):
                add(hat() * (0.9 if h == 0 else 0.55), bt + h * beat / 2 + (0.02 if h else 0))  # lazy swing
        tm += bar; i += 1
    x = lp(out[:n], 7000)
    x += lp(noise(n / SR), 3000) * 0.004  # vinyl hiss
    return x
