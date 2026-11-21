# Genera un WAV por "beat" (frase corta) y un timeline con el frame de inicio de cada beat.
import json, sys, os, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
FPS, GAP, LEAD = 30, 6, 6
beats = json.load(open(sys.argv[1]))          # [{"id": "b1", "text": "..."}]
out = sys.argv[2]                             # p.ej. src/qf/demo_tl.json
voice = sys.argv[3] if len(sys.argv) > 3 else 'em_alex'
k = Kokoro('/home/claude/models/kokoro-v1.0.onnx', '/home/claude/models/voices-v1.0.bin')
os.makedirs('public/vo', exist_ok=True)
t, tl = LEAD, {}
for b in beats:
    s, sr = k.create(b['text'], voice=voice, speed=1.1, lang='es')
    nz = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, nz[0] - 500): nz[-1] + 900]
    fn = f"vo/{b['id']}.wav"; sf.write('public/' + fn, s, sr)
    d = int(np.ceil(len(s) / sr * FPS))
    tl[b['id']] = {'start': t, 'dur': d, 'file': fn}
    t += d + GAP
tl['_total'] = t + 24
json.dump(tl, open(out, 'w'), indent=1); print(tl['_total'] / FPS, 's')
