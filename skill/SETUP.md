---
name: "video-toolkit-setup"
description: "Instala y usa el kit para hacer videos animados con voz en español (Remotion, Kokoro TTS, ffmpeg, moviepy). Usar cuando Ernesto pida un video, animación o audio narrado."
---

# Kit de video: instalación y uso

Cada conversación empieza con una máquina limpia: instalar todo al comienzo (tarda unos minutos). Hacerlo en silencio, sin narrar cada paso.

## 1. Instalación

```bash
# Remotion (animación con React) + fuente redondeada local
mkdir -p /home/claude/video && cd /home/claude/video
npm init -y >/dev/null
npm i remotion @remotion/cli @remotion/renderer @remotion/bundler react react-dom @fontsource/fredoka
mkdir -p src public

# Voz con IA: Kokoro (modelo desde GitHub, NO Hugging Face)
pip install -q --break-system-packages kokoro-onnx soundfile
mkdir -p /home/claude/models && cd /home/claude/models
curl -sSL -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -sSL -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# Edición/audio en Python
pip install -q --break-system-packages moviepy opencv-python-headless pydub librosa audioop-lts
```

ffmpeg y Google Chrome ya vienen en la máquina (`/usr/bin/google-chrome`).

## 2. Limitaciones conocidas (no reintentar)

- Hugging Face, Google Fonts y openaipublic están bloqueados: no hay generación de imágenes/video con IA (Stable Diffusion, etc.), ni Whisper, ni la voz/sincronización propia de Explainroo, ni Piper. Usar fuentes de `@fontsource` (npm).
- Manim no compila (falta manimpango).
- La máquina tiene 2 núcleos sin GPU: en Remotion no pasar `--concurrency` mayor a 2.
- "Estilo Pixar"/3D: se aproxima con SVG (gradientes radiales, sombras suaves, ojos grandes con brillos); avisar que no es 3D real. No nombrar estudios ni usar personajes con copyright.

## 3. Voz (Kokoro)

Voces en español: `ef_dora` (mujer), `em_alex` (hombre), `em_santa` (voz grave tipo Papá Noel). También `pf_dora`, `pm_alex`, `pm_santa` (portugués).

```python
from kokoro_onnx import Kokoro; import soundfile as sf
k = Kokoro('/home/claude/models/kokoro-v1.0.onnx', '/home/claude/models/voices-v1.0.bin')
samples, sr = k.create('¡Hola, chicos!', voice='em_santa', speed=1.0, lang='es')
sf.write('linea1.wav', samples, sr)
```

Sincronización sin Whisper: generar un WAV por frase, medir su duración (`len(samples)/sr`) y usar esas duraciones para fijar en qué frame empieza cada frase en la animación (globos, movimiento de boca). Mezclar voz + música con ffmpeg (bajar la música ~-12 dB bajo la voz).

## 4. Remotion

- Componer en `src/index.jsx` con `registerRoot` + `<Composition>`; audio en `public/` y `<Audio src={staticFile('x.wav')}/>`.
- Short de YouTube: 1080×1920, 30 fps.
- Antes del render completo, sacar stills de los momentos más cargados y mirarlos:
  `npx remotion still src/index.jsx <Id> out.png --frame=N --browser-executable=/usr/bin/google-chrome`
- Render final (una sola vez si es posible), a nombre temporal y renombrar al terminar:
  `npx remotion render src/index.jsx <Id> tmp.mp4 --browser-executable=/usr/bin/google-chrome --crf=18`
- Música/efectos: generarlos con numpy (campanas = senos con decaimiento exponencial; bajo pulsado) para evitar problemas de derechos.

## 5. Entrega

Enviar el MP4 con SendUserFile y una línea de contexto. Si no hay voz disponible para algo, decirlo y ofrecer sincronizar una grabación del usuario.