# qf_audio.py — genera efectos de sonido y música de fondo por código (sin derechos de terceros)
# Uso: python3 qf_audio.py <carpeta_sfx> <carpeta_musica> [DUR=segundos de música]
import numpy as np, scipy.signal as ss, pyloudnorm as pyln, soundfile as sf, os, sys
OUTS = sys.argv[1] if len(sys.argv) > 1 else 'public/sfx'
OUTM = sys.argv[2] if len(sys.argv) > 2 else 'public/music'
os.makedirs(OUTS, exist_ok=True); os.makedirs(OUTM, exist_ok=True)
SR = 44100
import os as _os, sys
DUR = float(_os.environ.get('DUR', 60))
N = int(SR * DUR)
rng = np.random.default_rng(7)

NOTES = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
         'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def m(name):
    p, o = name[:-1], int(name[-1])
    return 12 * (o + 1) + NOTES[p]
def f(n): return 440.0 * 2 ** (((m(n) if isinstance(n, str) else n) - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR

def buf(): return np.zeros((N, 2))
def cat(*xs):
    L=max(len(x) for x in xs); o=np.zeros(L)
    for x in xs: o[:len(x)]+=x
    return o
def add(b, x, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    b[i:i + len(x), 0] += x * l * gain * 1.414
    b[i:i + len(x), 1] += x * r * gain * 1.414

def env(n, a, r, d=None):
    t = np.arange(n) / SR; L = n / SR
    e = np.minimum(1, t / max(a, 1e-4))
    e *= np.clip((L - t) / max(r, 1e-4), 0, 1)
    return e

def lp(x, fc, order=2):
    b, a = ss.butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low'); return ss.lfilter(b, a, x, axis=0)
def hp(x, fc, order=2):
    b, a = ss.butter(order, fc / (SR / 2), 'high'); return ss.lfilter(b, a, x, axis=0)
def bp(x, lo, hi, order=2):
    b, a = ss.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return ss.lfilter(b, a, x, axis=0)

# ---------- instrumentos ----------
def saw(freq, d, kmax=14, detune=(-7, 0, 7), vib=0.0, vibrate=5.0, roll=1.0):
    t = tt(d); out = np.zeros_like(t)
    for c in detune:
        fr = freq * 2 ** (c / 1200)
        ph0 = rng.uniform(0, 2 * np.pi)
        phase = 2 * np.pi * fr * t + (vib * fr / vibrate) * np.sin(2 * np.pi * vibrate * t + rng.uniform(0, 6)) + ph0
        K = int(min(kmax, 9000 / fr))
        for k in range(1, K + 1):
            out += np.sin(k * phase) / k ** roll
    return out / len(detune)

def pad(notes, d, a=1.5, r=2.0, kmax=10, cutoff=2500, vib=0.002):
    x = sum(saw(f(n), d, kmax=kmax, vib=vib) for n in notes) / len(notes)
    x = lp(x, cutoff)
    return x * env(len(x), a, r)

def choir(notes, d, a=2.0, r=2.5):
    x = sum(saw(f(n), d, kmax=24, detune=(-9, -3, 4, 10), vib=0.004, vibrate=5.2) for n in notes) / len(notes)
    y = 0.0
    for fc, bw, g in [(750, 160, 1.0), (1150, 200, 0.6), (2800, 300, 0.25)]:
        y = y + g * bp(x, fc - bw, fc + bw)
    y = lp(y, 4000) * 2.2
    return y * env(len(y), a, r)

def organ(notes, d, a=0.8, r=1.5):
    t = tt(d); x = np.zeros_like(t)
    for n in notes:
        fr = f(n)
        for k, g in [(1, 1), (2, .5), (4, .25), (3, .15)]:
            x += g * np.sin(2 * np.pi * fr * k * t)
    x /= len(notes) * 2
    return x * env(len(x), a, r)

def piano(n, d=4.0, vel=0.8, bright=1.0):
    t = tt(d); fr = f(n); x = np.zeros_like(t); B = 0.00035
    for k in range(1, 13):
        fk = k * fr * np.sqrt(1 + B * k * k)
        if fk > 12000: break
        x += (1 / k ** (1.3 / bright)) * np.exp(-t * (0.5 + 0.45 * k) * (1 + fr / 900)) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6))
    click = lp(rng.standard_normal(len(t)) * np.exp(-t * 300), 3000) * 0.15
    x = (x + click) * np.minimum(1, t / 0.004) * vel
    return x * np.clip((d - t) / 0.3, 0, 1)

def pluck(n, d=1.2, vel=0.7, bright=1.0):
    t = tt(d); fr = f(n); x = np.zeros_like(t)
    for k in range(1, 14):
        if k * fr > 11000: break
        x += (1 / k) * np.exp(-t * (2.5 + 1.6 * k / bright)) * np.sin(2 * np.pi * k * fr * t)
    return x * np.minimum(1, t / 0.002) * vel

def bell(n, d=3.0, vel=0.5, ratio=3.5, idx=2.5):
    t = tt(d); fr = f(n)
    x = np.sin(2 * np.pi * fr * t + idx * np.exp(-t * 3) * np.sin(2 * np.pi * fr * ratio * t))
    return x * np.exp(-t * 1.6) * np.minimum(1, t / 0.003) * vel

def marimba(n, d=0.8, vel=0.6):
    t = tt(d); fr = f(n)
    x = np.sin(2 * np.pi * fr * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * fr * 4 * t) * np.exp(-t * 22) + 0.1 * np.sin(2 * np.pi * fr * 10 * t) * np.exp(-t * 50)
    return x * np.minimum(1, t / 0.002) * vel

def bass(n, d, vel=0.8, cutoff=900, a=0.005, r=0.08):
    x = saw(f(n), d, kmax=12, detune=(0,)) * 0.6 + np.sin(2 * np.pi * f(n) * tt(d)) * 0.8
    x = lp(x, cutoff)
    return x * env(len(x), a, r) * vel

def sub(n, d, vel=0.8):
    t = tt(d); x = np.sin(2 * np.pi * f(n) * t) + 0.15 * np.sin(4 * np.pi * f(n) * t)
    return x * env(len(x), 0.05, 0.4) * vel

def kick(vel=1.0, low=48, d=0.45, decay=8):
    t = tt(d); fr = low + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * np.exp(-t * decay) * vel

def hat(vel=0.3, d=0.08, decay=70):
    t = tt(d); return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * decay) * vel

def clap(vel=0.5):
    t = tt(0.25); x = np.zeros_like(t); nz = bp(rng.standard_normal(len(t)), 900, 3500)
    for o in (0, 0.011, 0.022):
        tt0 = np.clip(t - o, 0, None); x += nz * np.exp(-tt0 * 60) * (t >= o)
    return x * vel * 0.6

def boom(vel=1.0):
    k = kick(vel, low=34, d=3.0, decay=1.3)
    t = tt(3.0); nz = lp(rng.standard_normal(len(t)), 200) * np.exp(-t * 2) * 0.6
    return (k + nz) * vel

def riser(d, vel=0.5):
    t = tt(d); x = bp(rng.standard_normal(len(t)), 1500, 6000)
    fr = 200 * 2 ** (t / d * 3); ph = 2 * np.pi * np.cumsum(fr) / SR
    x = x * 0.5 + np.sin(ph) * 0.25
    return x * (t / d) ** 2.5 * vel

def wind(d, vel=0.4):
    t = tt(d); x = np.cumsum(rng.standard_normal(len(t))); x = hp(x, 80); x /= np.abs(x).max()
    x = bp(x, 250, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t + 1))
    return x * vel

def gliss(f0, f1, d, vel=0.15):
    t = tt(d); fr = f0 * (f1 / f0) ** (t / d) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * np.sin(np.pi * t / d) ** 2 * vel

# ---------- efectos / master ----------
def reverb(x, T60=3.0, damp=5000, pre=0.025):
    L = int(T60 * SR); t = np.arange(L) / SR
    out = np.zeros((len(x) + L, 2))
    for ch in range(2):
        ir = rng.standard_normal(L) * np.exp(-t * 6.9 / T60)
        ir = lp(ir, damp); ir = np.concatenate([np.zeros(int(pre * SR)), ir])[:L]
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:len(x) + L - 1, ch] = ss.fftconvolve(x[:, ch], ir)[: len(x) + L - 1]
    return out[:len(x)]

def master(dry, wet_bus, T60, wet=0.35, damp=5000, name='x', lufs=-18.0):
    mix = dry + (reverb(wet_bus, T60, damp) * wet if wet_bus is not None else 0)
    mix = hp(mix, 30)
    meter = pyln.Meter(SR)
    mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), lufs)
    mix = np.tanh(mix * 1.1) / 1.1
    pk = np.abs(mix).max()
    if pk > 0.89: mix *= 0.89 / pk
    t = np.arange(N) / SR
    fade = np.minimum(1, t / 0.6) * np.clip((DUR - t) / 3.5, 0, 1)
    mix *= fade[:, None]
    wav = f'{OUTM}/{name}.wav'
    import soundfile as sf
    sf.write(wav, mix.astype(np.float32), SR)
    print('musica', name, 'LUFS', round(meter.integrated_loudness(mix), 1), 'peak', round(float(np.abs(mix).max()), 3))

def t_default():
    dry, send = buf(), buf()
    bpm = 96; b = 60 / bpm; bar = 4 * b
    chords = [['C3', 'E3', 'G3', 'B3', 'D4'], ['A2', 'C3', 'E3', 'G3', 'B3'],
              ['F2', 'A2', 'C3', 'E3', 'G3'], ['G2', 'B2', 'D3', 'A3', 'D4']]
    roots = ['C2', 'A1', 'F1', 'G1']
    arp_src = [['E5', 'G5', 'B5', 'D6'], ['C5', 'E5', 'G5', 'B5'], ['A4', 'C5', 'E5', 'G5'], ['B4', 'D5', 'G5', 'A5']]
    nbars = int(DUR / bar) + 1
    for bi in range(0, nbars, 2):
        ci = (bi // 2) % 4; st = bi * bar
        x = pad(chords[ci], 2 * bar + 1.5, a=1.2, r=1.5, cutoff=1800)
        add(dry, x, st, -0.2, 0.25); add(send, x, st, 0.2, 0.35)
        if bi >= 2:
            add(dry, sub(roots[ci], 2 * bar), st, 0, 0.35)
        if bi >= 2:
            pat = [0, 1, 2, 3, 2, 1, 0, 2]
            for j in range(16):
                n = arp_src[ci][pat[j % 8]]
                v = 0.25 + 0.1 * (j % 4 == 0)
                x = cat(bell(n, 1.6, v, ratio=2.0, idx=1.2) * 0.7, pluck(n, 1.0, v * 0.8))
                add(dry, x, st + j * b / 2, -0.4 + 0.8 * (j % 2), 0.5); add(send, x, st + j * b / 2, 0, 0.5)
        if bi >= 8:
            for j in range(2):
                add(dry, kick(0.55), st + j * bar, 0, 0.6)
                for e in range(8):
                    add(dry, hat(0.12 + 0.06 * (e % 2)), st + j * bar + e * b / 2, 0.3, 0.6)
    master(dry, send, 2.8, 0.4, name='default')

def t_tension():
    dry, send = buf(), buf()
    bpm = 120; b = 0.5; bar = 2.0
    roots = ['D2', 'D2', 'Bb1', 'A1']
    pad_ch = [['D3', 'F3', 'A3'], ['D3', 'F3', 'A3'], ['D3', 'F3', 'Bb3'], ['C#3', 'E3', 'A3']]
    patt = [0, 0, 12, 0, 3, 0, 12, 0, 0, 0, 12, 0, 7, 0, 12, 5]
    for bi in range(30):
        st = bi * bar; ci = bi % 4
        inten = min(1, 0.35 + bi / 24)
        x = pad(pad_ch[ci], bar + 1.0, a=0.6, r=0.8, cutoff=900 + 1400 * inten)
        add(dry, x, st, 0, 0.18 * inten); add(send, x, st, 0, 0.25)
        if bi >= 2:
            for j in range(16):
                n = m(roots[ci]) + patt[j]
                x = bass(n, 0.12, 0.7, cutoff=500 + 1500 * inten, r=0.05)
                add(dry, x, st + j * b / 4, 0.15 * (-1) ** j, 0.55)
        if bi >= 4:
            for j in range(4):
                add(dry, hat(0.18, 0.05, 90), st + j * b + b / 2, 0.4, 0.6)
        if bi >= 8:
            add(dry, kick(0.9, low=45, decay=10), st, 0, 0.8)
            add(dry, kick(0.6, low=45, decay=10), st + 0.28, 0, 0.8)
        if bi >= 16:
            t = tt(bar); x = saw(f('A4'), bar, kmax=10, vib=0.003) * (0.6 + 0.4 * np.sin(2 * np.pi * 8 * t))
            x = lp(x, 3500) * env(len(x), 0.05, 0.1)
            add(dry, x, st, -0.3, 0.07); add(send, x, st, 0.3, 0.12)
    for s0 in (24.0, 48.0):
        add(dry, riser(8.0, 0.35), s0 - 8, 0, 1); add(send, riser(8.0, 0.2), s0 - 8, 0, 1)
        add(dry, boom(0.9), s0, 0, 1); add(send, boom(0.5), s0, 0, 1)
    master(dry, send, 2.2, 0.3, name='tension')

def t_miedo():
    dry, send = buf(), buf()
    t = tt(DUR)
    dr = saw(f('D1'), DUR, kmax=20, detune=(-12, 0, 9), vib=0.002) + saw(f('Eb2'), DUR, kmax=14, detune=(-8, 6), vib=0.003) * 0.6
    dr = lp(dr, 380) * (0.65 + 0.35 * np.sin(2 * np.pi * 0.09 * t))
    add(dry, dr, 0, 0, 0.5); add(send, dr, 0, 0, 0.25)
    w = wind(DUR, 0.35); add(dry, w, 0, -0.5, 0.5); add(send, w, 0, 0.5, 0.4)
    notes = [(3.0, 'D4'), (7.5, 'Ab4'), (11.0, 'Eb5'), (16.5, 'C#5'), (23.0, 'D4'), (26.0, 'G#4'),
             (31.5, 'A4'), (35.0, 'Eb4'), (41.5, 'D5'), (45.0, 'Ab4'), (49.5, 'C#4'), (54.0, 'D4')]
    for s0, n in notes:
        x = piano(n, 5.0, 0.5, bright=0.8)
        add(dry, x, s0, rng.uniform(-0.6, 0.6), 0.35); add(send, x, s0, 0, 0.8)
    for s0, a, z in [(9.0, 'A5', 'G#6'), (28.0, 'D6', 'C#5'), (43.0, 'Eb6', 'A6')]:
        x = gliss(f(a), f(z), 6.0, 0.12); add(dry, x, s0, 0.5, 0.6); add(send, x, s0, -0.5, 0.9)
    for s0 in (20.0, 38.0, 52.0):
        add(dry, riser(4.0, 0.25), s0 - 4, 0, 1)
        add(dry, boom(1.0), s0, 0, 1); add(send, boom(0.6), s0, 0, 1)
    master(dry, send, 5.0, 0.55, damp=3500, name='misterio')

def t_triste():
    dry, send = buf(), buf()
    bpm = 68; b = 60 / bpm; bar = 4 * b
    prog = [['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['C3', 'G3', 'E4'], ['G2', 'D3', 'B3'],
            ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['D2', 'A2', 'F3'], ['E2', 'B2', 'G#3']]
    mel = [[(0, 'E5', 1.5), (1.5, 'D5', .5), (2, 'C5', 1), (3, 'B4', 1)],
           [(0, 'A4', 2), (2, 'C5', 1), (3, 'F5', 1)],
           [(0, 'E5', 2), (2, 'D5', 1), (3, 'C5', 1)],
           [(0, 'D5', 3), (3, 'B4', 1)],
           [(0, 'C5', 1.5), (1.5, 'B4', .5), (2, 'A4', 1), (3, 'E5', 1)],
           [(0, 'F5', 2), (2, 'E5', 1), (3, 'D5', 1)],
           [(0, 'D5', 1), (1, 'C5', 1), (2, 'A4', 2)],
           [(0, 'G#4', 3), (3, 'B4', 1)]]
    for bi in range(17):
        st = bi * bar
        if bi == 16:
            for n in ['A2', 'E3', 'A3', 'C4', 'E4']:
                add(dry, piano(n, 6, 0.4), st, 0, 0.5); add(send, piano(n, 6, 0.3), st, 0, 0.6)
            break
        ci = bi % 8 if bi < 12 else [0, 5, 6, 7][bi - 12]
        ch = prog[ci]
        lh = [ch[0], ch[1], ch[2], ch[1], ch[0], ch[1], ch[2], ch[1]]
        for j, n in enumerate(lh):
            x = piano(n, 3.0, 0.32 if j % 4 else 0.42)
            add(dry, x, st + j * b / 2, -0.3, 0.55); add(send, x, st + j * b / 2, 0, 0.45)
        x = pad([ch[0][:-1] + '3', ch[1], ch[2]], bar + 1.5, a=1.0, r=1.5, cutoff=1400)
        add(dry, x, st, 0.3, 0.10); add(send, x, st, -0.3, 0.2)
        if bi >= 4:
            mi = (bi - 4) % 8 if bi < 12 else 4 + (bi - 12)
            for o, n, d in mel[mi]:
                x = piano(n, d * b + 1.5, 0.6, bright=1.2)
                add(dry, x, st + o * b, 0.25, 0.6); add(send, x, st + o * b, 0, 0.6)
    master(dry, send, 3.2, 0.45, damp=4500, name='emotivo')

def st(x, pan=0.0):
    if x.ndim == 2: return x
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1) * 1.414

def verb(x, T60=1.5, wet=0.3, tail=1.0):
    x = st(x); pad = np.zeros((int(tail * SR), 2)); x = np.concatenate([x, pad])
    return x + reverb(x, T60) * wet

def moving_noise(d, centers, amp, pans=None):
    """ruido filtrado cuya banda se mueve en el tiempo (centers: Hz en función de t)"""
    t = tt(d); n = len(t)
    bands = np.geomspace(200, 9000, 16)
    noise = rng.standard_normal(n)
    out = np.zeros((n, 2))
    for fc in bands:
        layer = bp(noise, fc / 1.25, fc * 1.25)
        w = np.exp(-0.5 * (np.log(fc / centers) / 0.35) ** 2)
        y = layer * w * amp
        p = pans if pans is not None else np.zeros(n)
        out[:, 0] += y * np.cos((p + 1) * np.pi / 4); out[:, 1] += y * np.sin((p + 1) * np.pi / 4)
    return out

def save(name, x, peak_db=-1.0):
    x = st(x); x = hp(x, 25)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    n_f = int(0.004 * SR); x[-n_f:] *= np.linspace(1, 0, n_f)[:, None]
    sf.write(f'{OUTS}/{name}.wav', x.astype(np.float32), SR)
    return x


fx = {}


# 1 pop de texto: blip con caída de tono
t = tt(0.16); fr = 900 * np.exp(-t * 18) + 300
x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 28)
x += lp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 400) * 0.3
fx['01_pop_texto'] = verb(x, 0.6, 0.12, 0.2)

# 2 pop suave (burbuja)
t = tt(0.22); fr = 350 + 500 * (1 - np.exp(-t * 30))
x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * np.minimum(t / 0.08, 1)) * np.exp(-t * 18)
fx['02_pop_suave'] = verb(x, 0.6, 0.15, 0.2)

# 3 click de interfaz
t = tt(0.06)
x = (np.sin(2 * np.pi * 2400 * t) * 0.5 + hp(rng.standard_normal(len(t)), 3000) * 0.5) * np.exp(-t * 160)
fx['03_click'] = st(x)

# 4 whoosh corto (izq → der)
d = 0.55; t = tt(d); c = 600 * (4000 / 600) ** np.sin(np.pi * t / d)
a = np.sin(np.pi * t / d) ** 3
fx['04_whoosh_corto'] = verb(moving_noise(d, c, a, pans=np.linspace(-0.8, 0.8, len(t))), 0.8, 0.15, 0.3)

# 5 whoosh largo (para transiciones de escena)
d = 1.3; t = tt(d); c = 300 * (6000 / 300) ** (np.sin(np.pi * t / d) ** 1.5)
a = np.sin(np.pi * t / d) ** 2.5
w = moving_noise(d, c, a, pans=np.linspace(-0.9, 0.9, len(t)))
tone = np.sin(2 * np.pi * np.cumsum(120 + 200 * np.sin(np.pi * t / d)) / SR) * a * 0.25
fx['05_whoosh_largo'] = verb(w + st(tone), 1.2, 0.2, 0.5)

# 6 golpe grave
fx['06_golpe_grave'] = verb(boom(1.0)[: int(2.2 * SR)], 2.0, 0.25, 0.5)

# 7 impacto cinematográfico (golpe + crack + cola larga)
t = tt(3.0)
crack = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 25) * 0.5
metal = sum(np.sin(2 * np.pi * fr_ * t) * np.exp(-t * 2.5) for fr_ in (97, 213, 389, 577)) * 0.12
x = boom(1.0) + crack + metal
fx['07_impacto'] = verb(x, 3.5, 0.45, 1.5)

# 8 subida (riser) 3 s, termina seco para que caiga en el golpe
fx['08_subida_larga'] = verb(riser(3.0, 1.0), 1.0, 0.2, 0.05)

# 9 subida corta 1.5 s
fx['09_subida_corta'] = verb(riser(1.5, 1.0), 0.8, 0.2, 0.05)

# 10 ding de revelación
x = bell('E6', 2.5, 0.9, ratio=1.0, idx=0.7) + bell('B6', 2.5, 0.4, ratio=1.0, idx=0.5) * 0.5
fx['10_ding'] = verb(x, 2.0, 0.35, 1.0)

# 11 brillo mágico (arpegio de destellos)
d = 1.8; x = np.zeros(int(d * SR))
for i, n in enumerate(['E6', 'G#6', 'B6', 'E7', 'G#7', 'B7']):
    b_ = bell(n, 1.2, 0.5 - 0.05 * i, ratio=1.0, idx=0.4); s0 = int(i * 0.055 * SR)
    x[s0:s0 + len(b_)] += b_[: len(x) - s0]
t = tt(d); x += hp(rng.standard_normal(len(t)), 8000) * np.exp(-t * 4) * np.minimum(1, t / 0.05) * 0.15
fx['11_brillo'] = verb(x, 2.5, 0.45, 0.8)

# 12 glitch digital
d = 0.6; x = np.zeros(int(d * SR)); pos = 0
while pos < len(x) - 800:
    L = int(rng.uniform(0.012, 0.05) * SR); kind = rng.integers(0, 3); tt_ = np.arange(L) / SR
    if kind == 0: seg = np.sign(np.sin(2 * np.pi * rng.uniform(80, 1600) * tt_)) * 0.5
    elif kind == 1: seg = rng.standard_normal(L) * 0.4
    else: seg = np.round(np.sin(2 * np.pi * rng.uniform(200, 3000) * tt_) * 3) / 3 * 0.6
    if rng.random() < 0.3: seg *= 0
    x[pos:pos + L] = seg[: len(x) - pos]; pos += L
x = lp(x, 9000)
fx['12_glitch'] = st(x, 0)

# 13 latido de corazón
x = np.zeros(int(1.2 * SR))
for s0, v in [(0.0, 1.0), (0.28, 0.7)]:
    k = lp(kick(v, low=45, d=0.35, decay=12), 200); i = int(s0 * SR); x[i:i + len(k)] += k
fx['13_latido'] = verb(x, 1.0, 0.15, 0.3)

# 14 negativo / error (dos tonos que bajan)
x = np.zeros(int(0.7 * SR))
for s0, n in [(0.0, 'A4'), (0.18, 'D#4')]:
    y = saw(f(n), 0.3, kmax=8, detune=(0,)) ; y = lp(y, 2500); y *= np.exp(-tt(0.3) * 6) * np.minimum(1, tt(0.3) / 0.005)
    i = int(s0 * SR); x[i:i + len(y)] += y * 0.6
fx['14_negativo'] = verb(x, 0.8, 0.2, 0.3)

# 15 positivo / acierto (dos tonos que suben)
x = np.zeros(int(1.0 * SR))
for s0, n in [(0.0, 'C6'), (0.11, 'G6')]:
    y = bell(n, 0.8, 0.7, ratio=1.0, idx=0.5); i = int(s0 * SR); x[i:i + len(y)] += y[: len(x) - i]
fx['15_positivo'] = verb(x, 1.2, 0.3, 0.5)

# 16 swell invertido (platillo al revés) que termina en seco
d = 1.6; t = tt(d)
y = hp(rng.standard_normal(len(t)), 3000) * np.exp(-(d - t) * 3.5) * (t / d) ** 1.5
y += sum(np.sin(2 * np.pi * fr_ * t) for fr_ in (3200, 4700, 6100)) * 0.05 * (t / d) ** 3
fx['16_swell_invertido'] = st(lp(y, 12000))

# 17 tic-tac de reloj (2 s)
x = np.zeros(int(2.0 * SR))
for i in range(4):
    t0 = int(i * 0.5 * SR); tt_ = tt(0.03)
    y = bp(rng.standard_normal(len(tt_)), 2000 if i % 2 == 0 else 1500, 5000) * np.exp(-tt_ * 200)
    x[t0:t0 + len(y)] += y
fx['17_tic_tac'] = verb(x, 0.5, 0.15, 0.2)

# 18 zoom / acercamiento (tono que sube con ruido)
d = 0.8; t = tt(d); fr = 150 * (2000 / 150) ** ((t / d) ** 2)
y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * (t / d) ** 1.5 * 0.4
w = moving_noise(d, 400 * (5000 / 400) ** (t / d), (t / d) ** 2)
fx['18_zoom'] = verb(st(y) + w, 0.8, 0.2, 0.2)



# hoja de papel que pasa (transición de escena)
d = 0.7; t = tt(d)
env_ = np.exp(-((t - 0.25) / 0.12) ** 2) + 0.5 * np.exp(-((t - 0.45) / 0.06) ** 2)
x = bp(rng.standard_normal(len(t)), 1200, 7000) * env_
crinkle = np.zeros(len(t))
for _ in range(40):
    i = int(rng.uniform(0.1, 0.55) * SR); L = int(0.004 * SR)
    crinkle[i:i + L] += rng.standard_normal(L) * rng.uniform(0.3, 1)
x += hp(crinkle, 2500) * 0.5
fx['p_pagina'] = st(x * np.linspace(-1, 1, len(t)) * 0 + x, 0.2)

# lápiz trazando (1.2 s)
d = 1.2; t = tt(d)
stroke = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.2 * t))
x = bp(rng.standard_normal(len(t)), 2500, 9000) * stroke
x += bp(rng.standard_normal(len(t)), 500, 1500) * 0.25 * stroke
x *= np.minimum(1, t / 0.05) * np.clip((d - t) / 0.15, 0, 1)
fx['p_lapiz'] = st(x, -0.1)

# presentación de personaje (glissando de arpa)
d = 1.6; x = np.zeros(int(d * SR))
for i, n in enumerate(['G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6']):
    y = pluck(n, 1.4, 0.6, bright=0.8); s0 = int(i * 0.035 * SR)
    x[s0:s0 + len(y)] += y[: len(x) - s0]
fx['p_presentacion'] = verb(x, 1.8, 0.3, 0.6)

# luz divina (acorde que se abre, sin coro)
d = 2.0; t = tt(d); x = np.zeros(len(t))
for n in ['D5', 'F#5', 'A5', 'D6', 'A6']:
    x += np.sin(2 * np.pi * f(n) * t) * (1 + 0.003 * np.sin(2 * np.pi * 5 * t))
x *= np.sin(np.pi * np.minimum(t / 1.6, 1) / 2) ** 2 * np.clip((d - t) / 0.6, 0, 1) * 0.2
x += hp(rng.standard_normal(len(t)), 7000) * np.exp(-((t - 0.6) / 0.35) ** 2) * 0.12
fx['p_luz'] = verb(x, 2.5, 0.45, 1.0)

# pasos alejándose (4)
x = np.zeros(int(1.6 * SR))
for i in range(4):
    tt_ = tt(0.12); v = 1 - 0.18 * i
    y = lp(rng.standard_normal(len(tt_)), 900) * np.exp(-tt_ * 45) + np.sin(2 * np.pi * 90 * tt_) * np.exp(-tt_ * 30) * 0.6
    s0 = int(i * 0.34 * SR); x[s0:s0 + len(y)] += y * v
fx['p_pasos'] = verb(x, 0.8, 0.2, 0.3)

# sello (golpe de tampón)
t = tt(0.35)
x = lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 35) + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) * 0.9
x += hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 120) * 0.3
fx['p_sello'] = verb(x, 0.6, 0.15, 0.2)

# candado que cierra
x = np.zeros(int(0.45 * SR))
for s0, fr0, v in [(0.0, 3200, 0.6), (0.09, 1800, 1.0)]:
    tt_ = tt(0.08); y = (bp(rng.standard_normal(len(tt_)), fr0 * 0.7, fr0 * 1.6) + np.sin(2 * np.pi * fr0 * tt_) * 0.4) * np.exp(-tt_ * 90)
    i = int(s0 * SR); x[i:i + len(y)] += y * v
fx['p_candado'] = verb(x, 0.5, 0.15, 0.2)

# cuerdas (una nota por línea que sale de la cruz)
for i, n in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#5']):
    fx[f'p_cuerda{i + 1}'] = verb(pluck(n, 1.5, 0.8, bright=1.1), 1.2, 0.25, 0.4)

# duda (silbato que sube y baja un poco)
d = 0.45; t = tt(d); fr = 600 + 500 * np.sin(np.pi * t / d * 0.8)
x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / d) * 0.6
fx['p_duda'] = verb(x, 0.6, 0.15, 0.2)

# barrera (golpe metálico pesado)
t = tt(1.6)
x = sum(np.sin(2 * np.pi * fr_ * t) * np.exp(-t * dc) * g for fr_, dc, g in [(110, 3, 1), (247, 4, .6), (431, 5, .4), (733, 7, .25), (1190, 9, .15)])
x += lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 30) * 0.6 + kick(0.8, low=40, d=1.6, decay=5)
fx['p_barrera'] = verb(x, 1.6, 0.3, 0.5)

# pops con distinta altura (para figuras que aparecen)
for i, base in enumerate([300, 380, 470]):
    t = tt(0.2); fr = base + 450 * (1 - np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * np.minimum(t / 0.07, 1)) * np.exp(-t * 20)
    fx[f'p_pop{i + 1}'] = verb(x, 0.5, 0.12, 0.15)


# extras
t=tt(0.45); x=saw(130,0.45,kmax=20,detune=(0,8))+saw(138,0.45,kmax=20,detune=(0,))*0.6
fx['qf_buzzer']=verb(lp(x,2200)*np.minimum(1,t/0.01)*np.clip((0.45-t)/0.08,0,1),0.4,0.1,0.15)
t=tt(0.25); fr=900*np.exp(-t*14)+200; fx['qf_plop']=verb(np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*16),0.4,0.1,0.1)
x=np.zeros(int(1.2*SR))
for i in range(30):
    tt_=tt(0.02); y=bp(rng.standard_normal(len(tt_)),2500,7000)*np.exp(-tt_*300); s0=int(i*0.04*SR); x[s0:s0+len(y)]+=y*(0.6+0.4*(i%2))
fx['qf_ticker']=st(x)

for k, v in fx.items(): save(k, v)
print(len(fx), 'efectos en', OUTS)
for t_ in (t_default, t_tension, t_miedo, t_triste): t_()
