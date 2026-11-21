"""Genera los efectos de sonido que faltan en public/sfx (numpy, sin derechos)."""
import numpy as np, soundfile as sf, os
from scipy.signal import butter, sosfilt

SR = 48000
OUT = '/home/claude/video/public/sfx'
rng = np.random.default_rng(7)

def t(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos'); return sosfilt(sos, x)
def lp(x, f): return filt(x, 'low', f)
def hp(x, f): return filt(x, 'high', f)
def bp(x, lo, hi): return filt(x, 'band', [lo, hi])
def sweep_lp(x, fc, blk=2048):
    y = np.zeros_like(x)
    for i in range(0, len(x), blk):
        seg = x[i:i+blk*2]; y[i:i+blk] = lp(seg, float(np.clip(fc[i], 40, SR/2-100)))[:len(x[i:i+blk])]
    return y
def expd(d, k): return np.exp(-k * t(d))
def adsr(n, a=0.005, r=0.05):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def sine_sweep(f0, f1, d, curve='exp'):
    tt = t(d)
    f = f0 * (f1 / f0) ** (tt / d) if curve == 'exp' else f0 + (f1 - f0) * tt / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def mix(*parts):
    n = max(len(p) for p in parts); y = np.zeros(n)
    for p in parts: y[:len(p)] += p
    return y
def at(x, start, total):
    y = np.zeros(int(total * SR)); s = int(start * SR); e = min(len(y), s + len(x)); y[s:e] += x[:e - s]; return y
def verb(x, T=0.8, wet=0.25):
    n = int(T * SR); ir = rng.standard_normal(n) * np.exp(-6.9 * t(T) / T); ir = lp(ir, 6000)
    w = np.convolve(x, ir); w = np.pad(w, (0, max(0, len(x)+n-len(w))))[:len(x)+n]; w /= (np.abs(w).max() + 1e-9)
    d = np.concatenate([x, np.zeros(n)]); return d * (1 - wet) + w * wet * np.abs(x).max()
def save(name, x, peak=-1.0):
    x = np.asarray(x, float); x /= (np.abs(x).max() + 1e-9); x *= 10 ** (peak / 20)
    fade = int(0.004 * SR); x[-fade:] *= np.linspace(1, 0, fade)
    sf.write(os.path.join(OUT, name), np.stack([x, x], 1), SR, subtype='PCM_16')

S = {}
# 29 burbuja / duda
S['29_burbuja'] = sine_sweep(300, 900, 0.09) * expd(0.09, 30)
# 30 tintineo
S['30_tintineo'] = mix(*[at(np.sin(2*np.pi*f*t(0.5))*expd(0.5,12), s, 0.8) for f, s in [(2093,0),(2637,0.07),(3136,0.14)]])
# 31 glitter mágico
g = np.zeros(int(1.4*SR))
for i in range(40):
    f = rng.uniform(2500, 7000); s = rng.uniform(0, 0.9)
    g += at(np.sin(2*np.pi*f*t(0.4))*expd(0.4,14)*rng.uniform(.3,1), s, 1.4)
S['31_glitter'] = verb(g * np.linspace(1, .6, len(g)), 1.2, .35)
# 32 explosión
d = 2.0; n = noise(d); cut = 6000 * np.exp(-3 * t(d)) + 150
ex = np.zeros_like(n); blk = 2048
for i in range(0, len(n), blk):
    ex[i:i+blk] = lp(n[i:i+blk+blk], float(cut[i]))[:len(n[i:i+blk])]
S['32_explosion'] = mix(ex * expd(d, 2.2), 1.5*np.sin(2*np.pi*45*t(d))*expd(d,3))
# 33 explosión caricatura
S['33_explosion_cartoon'] = mix(np.sin(2*np.pi*np.cumsum(120*np.exp(-6*t(.4)))/SR)*expd(.4,8), at(bp(noise(.5),800,3000)*expd(.5,7)*.6,.05,.6))
# 34 burbuja que revienta
S['34_revienta'] = mix(hp(noise(.04),2500)*expd(.04,90), sine_sweep(1200,500,.05)*expd(.05,60)*.6)
# 35 drone grave (2.5 s)
d = 3.0; tt = t(d); saw = sum(np.sin(2*np.pi*k*48*tt)/k for k in range(1,12))
S['35_drone_grave'] = lp(saw*(1+.3*np.sin(2*np.pi*.4*tt)), 300)*adsr(len(tt), .6, 1.0)
# 36 drone tensión creciente
d = 3.0; tt = t(d); f = 55*(1+tt/d*.5); ph = np.cumsum(f)/SR
saw = sum(np.sin(2*np.pi*k*ph)/k for k in range(1,14))
S['36_tension_creciente'] = sweep_lp(saw, 600+1800*tt/d) * (tt/d)**1.5
# 37 zumbido eléctrico
d = 1.0; tt = t(d); hum = sum(np.sin(2*np.pi*120*k*tt)/k for k in range(1,20))
S['37_zumbido_electrico'] = hum*(1+.4*np.sign(np.sin(2*np.pi*13*tt)))*adsr(len(tt),.02,.15)
# 38 chispa / chisporroteo
c = np.zeros(int(.7*SR))
for i in range(60):
    s = rng.uniform(0,.6); c += at(hp(noise(.006),3000)*rng.uniform(.2,1), s, .7)
S['38_chispa'] = c
# 39 estática
d = 1.0; st = bp(noise(d), 800, 7000); gate = (rng.random(int(d*60)) > .25).repeat(int(SR/60))[:len(st)]
S['39_estatica'] = st * np.pad(gate, (0, len(st)-len(gate))) * adsr(len(st), .01, .1)
# 40 rechazo "no"
S['40_rechazo'] = mix(at(np.sign(np.sin(2*np.pi*220*t(.15)))*adsr(int(.15*SR),.005,.04),0,.4)*.5, at(np.sign(np.sin(2*np.pi*165*t(.2)))*adsr(int(.2*SR),.005,.08),.14,.4)*.5)
S['40_rechazo'] = lp(S['40_rechazo'], 2500)
# 41 moneda / éxito
S['41_moneda'] = mix(at(np.sin(2*np.pi*988*t(.12))*adsr(int(.12*SR),.002,.02),0,.6), at(np.sin(2*np.pi*1319*t(.5))*expd(.5,6),.08,.6))
# 42 bip
S['42_bip'] = np.sin(2*np.pi*1500*t(.09))*adsr(int(.09*SR),.003,.02)
# 43 pitidos de comunicación
S['43_comunicacion'] = mix(*[at(np.sin(2*np.pi*f*t(.06))*adsr(int(.06*SR),.002,.01), s, .7) for f, s in [(1800,0),(2400,.1),(1800,.2),(2900,.3),(2400,.45)]])
# 44 pin de mapa (GPS)
S['44_pin_mapa'] = mix(at(np.sin(2*np.pi*880*t(.25))*expd(.25,12),0,.5), at(np.sin(2*np.pi*1320*t(.35))*expd(.35,9),.1,.5))
# 45 escaneo
d = 1.0; tt = t(d)
S['45_escaneo'] = sine_sweep(600, 3000, d, 'lin')*(.6+.4*(np.sin(2*np.pi*14*tt)>0))*adsr(len(tt),.02,.1)*.6
# 46 tic-tac acelerando
tk = np.zeros(int(2.6*SR)); s = 0; per = .45; i = 0
while s < 2.5:
    f = 3200 if i % 2 == 0 else 2200
    tk += at(bp(noise(.02),f*.7,f*1.3)*expd(.02,250), s, 2.6); s += per; per *= .86; i += 1
S['46_tictac_acelera'] = tk
# 47 papel rasgándose
d = .7; tear = bp(noise(d), 1500, 6000) * (rng.random(len(t(d))) ** 3 * 2 + .2)
S['47_papel_rasga'] = lp(tear, 7000) * adsr(len(t(d)), .01, .15)
# 48 libro abriéndose
S['48_libro_abre'] = mix(bp(noise(.35),400,4000)*np.sin(np.pi*t(.35)/.35)**2*.6, at(lp(noise(.08),300)*expd(.08,40),.3,.5))
# 49 teclado
kb = np.zeros(int(1.0*SR))
for s in np.cumsum(rng.uniform(.06,.14,10)):
    if s < .95: kb += at(bp(noise(.015),1500,5000)*expd(.015,300)*rng.uniform(.5,1), s, 1.0)
S['49_teclado'] = kb
# 50 metálico / clink (martillo)
tt = t(.6); S['50_clink'] = sum(np.sin(2*np.pi*f*tt)*expd(.6,k)*a for f,k,a in [(1870,9,1),(4130,14,.6),(6210,20,.4)]) + lp(noise(.6),3000)*expd(.6,80)
# 51 balanza
S['51_balanza'] = mix(S['50_clink']*.5, at(bp(noise(.3),200,1200)*(rng.random(int(.3*SR))**4)*expd(.3,6),.05,.6))
# 52 madera
tt = t(.3); S['52_madera'] = (np.sin(2*np.pi*420*tt)+.5*np.sin(2*np.pi*1150*tt))*expd(.3,28) + bp(noise(.3),500,3000)*expd(.3,120)
# 53 resorte
tt = t(.6); S['53_resorte'] = np.sin(2*np.pi*np.cumsum(500+250*np.sin(2*np.pi*18*tt)*np.exp(-4*tt))/SR)*expd(.6,6)
# 54 aplauso
ap = np.zeros(int(1.5*SR))
for i in range(160):
    s = rng.uniform(0, 1.2); ap += at(bp(noise(.02),900,4000)*expd(.02,200)*rng.uniform(.3,1), s, 1.5)
S['54_aplauso'] = ap * adsr(len(ap), .1, .4)
# 55 obturador
S['55_obturador'] = mix(at(hp(noise(.02),1500)*expd(.02,200),0,.25), at(hp(noise(.03),1000)*expd(.03,150),.09,.25))
# 56 agua corriendo
d = 2.0; w = bp(noise(d), 300, 3000); w *= 1 + .5*np.sin(2*np.pi*7*t(d))*rng.random(len(t(d)))
S['56_agua_corre'] = lp(w, 4000)*adsr(len(w), .2, .5)
# 57 burbujeo
bb = np.zeros(int(1.5*SR))
for i in range(70):
    s = rng.uniform(0,1.4); f0 = rng.uniform(300,900)
    bb += at(sine_sweep(f0, f0*2.2, .035)*expd(.035,40)*rng.uniform(.3,1), s, 1.5)
S['57_burbujeo'] = bb
# 58 chapoteo
S['58_chapoteo'] = mix(lp(noise(.6),2500)*expd(.6,7), at(bb[:int(.8*SR)]*.6,.1,.9))
# 59 viento
d = 3.0; tt = t(d); wn = noise(d); outw = np.zeros_like(wn); blk = 4096
for i in range(0, len(wn), blk):
    fc = 500 + 400*np.sin(2*np.pi*.3*tt[i]); outw[i:i+blk] = bp(wn[i:i+blk*2], fc*.6, fc*1.6)[:len(wn[i:i+blk])]
S['59_viento'] = outw * adsr(len(wn), .8, 1.0)
# 60 lluvia + trueno
d = 4.0; rain = hp(noise(d), 2000)*.25
for i in range(500):
    rain += at(hp(noise(.004),3000)*rng.uniform(.2,1), rng.uniform(0,d-.1), d)
thunder = at(lp(noise(2.5),400)*np.exp(-1.6*t(2.5))*(1+rng.random(int(2.5*SR))), 1.0, d)*1.2
S['60_lluvia_trueno'] = (rain + thunder)*adsr(int(d*SR), .5, .8)
# 61 trueno solo
S['61_trueno'] = mix(lp(noise(.15),2000)*expd(.15,25), lp(noise(3),300)*np.exp(-1.3*t(3))*(1+rng.random(int(3*SR))))
# 62 fuego
d = 3.0; fire = lp(noise(d), 500)*.5
for i in range(220):
    fire += at(bp(noise(.01),1000,6000)*expd(.01,250)*rng.uniform(.1,1), rng.uniform(0,d-.05), d)
S['62_fuego'] = fire*adsr(int(d*SR), .4, .6)
# 63 motor / despegue
d = 2.5; tt = t(d); ph = np.cumsum(60+80*tt/d)/SR
S['63_despegue'] = (lp(sum(np.sin(2*np.pi*k*ph)/k for k in range(1,10)), 800)*.5 + sweep_lp(noise(d), 300+3000*tt/d)) * (tt/d)**.7 * adsr(len(tt),.05,.3)
# 64 latido → línea plana
d = 4.0; hb = np.zeros(int(d*SR)); s = 0; per = .8
def beat(): return lp(np.sin(2*np.pi*55*t(.12))*expd(.12,30), 200)
while s < 2.6:
    hb += at(beat(), s, d) + at(beat()*.7, s+.16, d); s += per; per *= .82
bipc = at(np.sin(2*np.pi*1000*t(1.3))*adsr(int(1.3*SR),.005,.2)*.35, 2.6, d)
S['64_latido_plano'] = hb + bipc
# 65 esfuerzo (gruñido)
d = .7; tt = t(d); ph = np.cumsum(110+20*np.sin(2*np.pi*3*tt))/SR
S['65_esfuerzo'] = bp(sum(np.sin(2*np.pi*k*ph)/k for k in range(1,25)) + .3*noise(d), 300, 1800)*np.sin(np.pi*tt/d)
# 66 Doppler
d = 1.2; tt = t(d); f = 700 - 300*np.tanh((tt-d/2)*8); amp = 1/(1+((tt-d/2)*5)**2)
S['66_doppler'] = np.sin(2*np.pi*np.cumsum(f)/SR)*amp + lp(noise(d),1500)*amp*.4
# 67 susurro místico
d = 2.5; tt = t(d); S['67_susurro'] = bp(noise(d), 2000, 7000)*(.5+.5*np.sin(2*np.pi*1.3*tt)**2)*adsr(len(tt),.6,.8)
# 68 multitud
d = 3.0; cr = np.zeros(int(d*SR))
for i in range(40):
    s = rng.uniform(0, d-.6); f0 = rng.uniform(120, 260); dd = rng.uniform(.3,.6); tt2 = t(dd)
    ph = np.cumsum(f0*(1+.1*np.sin(2*np.pi*rng.uniform(3,6)*tt2)))/SR
    cr += at(bp(sum(np.sin(2*np.pi*k*ph)/k for k in range(1,15)),300,2500)*np.sin(np.pi*tt2/dd)*rng.uniform(.3,1), s, d)
S['68_multitud'] = cr*adsr(len(cr),.4,.6)
# 69 Geiger
gg = np.zeros(int(1.5*SR))
for s in np.cumsum(rng.exponential(.05, 40)):
    if s < 1.45: gg += at(hp(noise(.003),2000), s, 1.5)
S['69_geiger'] = gg
# 70 cristal / vidrio que se rompe
gl = at(hp(noise(.08),2000)*expd(.08,40), 0, 1.2)
for i in range(30):
    f = rng.uniform(3000,8000); gl += at(np.sin(2*np.pi*f*t(.3))*expd(.3,15)*rng.uniform(.2,.7), rng.uniform(0,.6), 1.2)
S['70_vidrio_rompe'] = gl
# 71 piedra que rueda (sepulcro)
d = 2.0; tt = t(d); S['71_piedra_rueda'] = lp(noise(d), 250)*(1+.6*np.sin(2*np.pi*3*tt))*adsr(len(tt),.3,.5) + at(lp(noise(.3),200)*expd(.3,10)*1.5, 1.7, d)
# 72 cuerno / shofar
d = 1.8; tt = t(d); f = 233*(1+.06*np.minimum(tt/.3,1)); ph = np.cumsum(f)/SR
S['72_shofar'] = lp(sum(np.sin(2*np.pi*k*ph)/k**.8 for k in range(1,18)), 2500)*adsr(len(tt),.15,.4)*(1+.05*np.sin(2*np.pi*5*tt))
# 73 espada (desenvainar)
d = .7; tt = t(d); S['73_espada'] = mix(hp(noise(d),3000)*np.linspace(.2,1,len(tt))*adsr(len(tt),.01,.1)*.6, at(sum(np.sin(2*np.pi*f*t(.5))*expd(.5,6) for f in (2600,5300)),.6,1.2))

# 74 rasguido de disco (freeze frame)
d = .5; tt = t(d); f = 300 + 900*np.sin(np.pi*tt/d)**2; S['74_rasguido'] = bp(noise(d)*(1+np.sin(2*np.pi*np.cumsum(f)/SR)), 400, 4000)*adsr(len(tt),.01,.1)
# 75 suspiro (desánimo)
d = 1.2; tt = t(d); S['75_suspiro'] = sweep_lp(bp(noise(d),200,5000), 2500*np.exp(-1.5*tt)+300)*np.sin(np.pi*tt/d)**1.5
# 76 sorpresa (gasp)
d = .35; tt = t(d); S['76_sorpresa'] = sweep_lp(bp(noise(d),300,6000), 800+3000*tt/d)*np.sin(np.pi*tt/d)
# 77 ta-da (logro)
def tone(fr, d): tt = t(d); return sum(np.sin(2*np.pi*fr*k*tt)/k**1.3 for k in range(1,7))*expd(d,3)
S['77_tada'] = mix(at(tone(523,.25),0,1.4)*.6, at(mix(tone(659,1.2),tone(784,1.2),tone(1047,1.2)),.14,1.4))
# 78 boing (rebote cómico)
d = .7; tt = t(d); S['78_boing'] = np.sin(2*np.pi*np.cumsum(180+140*np.sin(2*np.pi*9*tt)*np.exp(-4*tt)+60*tt)/SR)*expd(d,4)




# ---------- lote 4 de sonidos (79-88) ----------
def ks(freq, d, damp=0.996, seed=1):  # cuerda pulsada (Karplus-Strong)
    r = np.random.default_rng(seed); n = int(d * SR); N = int(SR / freq); buf = r.uniform(-1, 1, N); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % N]; buf[i % N] = damp * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return out
def bell(f0, d, partials=((0.56, 1), (0.92, .7), (1.19, .9), (1.71, .6), (2, .8), (2.74, .4), (3, .3), (3.76, .25), (4.07, .2))):
    tt = t(d); return sum(a * np.sin(2 * np.pi * f0 * k * tt) * np.exp(-tt * (1.2 + k * 0.9)) for k, a in partials)
d = .45; tt = t(d)
S['79_martillazo'] = mix(lp(np.sin(2*np.pi*95*tt)*expd(d,18), 400)*1.2, bp(noise(d),1200,5000)*expd(d,90)*.8, np.sin(2*np.pi*2400*tt)*expd(d,30)*.15)
d = 1.6; tt = t(d)
S['80_puerta_pesada'] = mix(at(sweep_lp(bp(noise(.9),300,2500), 600+300*np.sin(np.linspace(0,9,int(.9*SR))))*np.sin(np.pi*t(.9)/.9)*.35, 0, d),
                            at(lp(np.sin(2*np.pi*55*t(.7))*expd(.7,6)+noise(.7)*expd(.7,25)*.5, 300)*1.3, .85, d))
d = .35; tt = t(d)
S['81_latigazo'] = mix(sweep_lp(noise(d), 300+9000*np.clip(tt/.12,0,1))*np.clip((tt-.0)/.12,0,1)**3*np.exp(-np.clip(tt-.12,0,1)*60)*.6, at(hp(noise(.03),2000)*expd(.03,120)*1.4, .12, d))
d = 6.0
S['82_campanas_iglesia'] = verb(mix(at(bell(196, 4.5), 0, d), at(bell(164.8, 4.5)*.8, 1.3, d), at(bell(196, 3.2)*.7, 2.6, d)), T=1.6, wet=.3)
d = 2.4; tt = t(d)
vib = np.sin(2*np.pi*5*tt)*0.006
def voice(f, ph):
    car = sum(np.sin(2*np.pi*f*k*(tt+ph) * (1+vib)) / k for k in range(1, 18))
    return bp(car, 500, 1300)*0.6 + bp(car, 900, 1300)*0.3 + bp(car, 2400, 3200)*0.15
env = np.clip(tt/0.5, 0, 1) * np.clip((d-tt)/0.8, 0, 1)
S['83_coro_aah'] = verb(sum(voice(f, i*0.003) for i, f in enumerate([220, 277.2, 329.6, 440, 554.4])) * env, T=1.8, wet=.4)
d = 2.2
S['84_arpa_glissando'] = verb(sum(at(ks(f, 1.6, 0.997, i)*0.6, i*0.07, d) for i, f in enumerate([261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5])), T=1.2, wet=.3)
d = 3.0; tt = t(d); trem = 1 + 0.05*np.sin(2*np.pi*6*tt)
org = sum(sum(np.sin(2*np.pi*f*h*tt)*a for h, a in ((1, 1), (2, .5), (3, .3), (4, .25), (8, .12))) for f in (130.8, 196, 261.6, 329.6, 392))
S['85_organo_acorde'] = verb(org*trem*np.clip(tt/.08,0,1)*np.clip((d-tt)/.6,0,1), T=2.2, wet=.35)
d = 5.0; tt = t(d)
S['86_gong'] = verb(sum(a*np.sin(2*np.pi*f*tt)*np.exp(-tt*k) for f, a, k in ((70, 1, .6), (113, .8, .7), (151, .6, .9), (197, .5, 1.1), (262, .35, 1.3), (341, .25, 1.6), (467, .15, 2)))*np.clip(tt/.04,0,1) + noise(d)*expd(d,30)*.15, T=1.5, wet=.25)
d = 2.0; tt = t(d)
S['87_radio_antigua'] = mix(bp(noise(d), 800, 4000)*.35*(0.6+0.4*np.sin(2*np.pi*3*tt)), np.sin(2*np.pi*np.cumsum(900+700*np.sin(2*np.pi*.6*tt))/SR)*.12*np.clip(1-tt/1.4,0,1))
d = 2.6; tt = t(d)
S['88_shofar'] = verb(lp(sum(np.sin(2*np.pi*(233*(1+0.04*np.clip(tt*8,0,1))*k)*tt)/k**0.8 for k in range(1, 14)) * (np.clip(tt/.15,0,1)*np.clip((d-tt)/.3,0,1)) * (1+0.08*np.sin(2*np.pi*6*tt)) + noise(d)*0.05, 3500), T=1.0, wet=.25)

import sys
only = sys.argv[1:]
for k, v in S.items():
    if not only or any(k.startswith(o) for o in only): save(k + '.wav', v)
print(len(S), 'sfx generados')
