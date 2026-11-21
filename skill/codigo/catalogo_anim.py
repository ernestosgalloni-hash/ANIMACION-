"""Catálogo de animaciones y sonidos del kit.
Las animaciones viven en 7 videos (6 grupos + fondos animados) (grupos/anim_<grupo>.mp4) y los sonidos en grupos/sonidos.mp3;
catalogo_anim.json guarda el tramo [a,b] (segundos) de cada pieza. index.html los muestra con fragmentos #t=a,b.

Uso:
  python3 catalogo_anim.py agregar <kit_dir> <clip.mp4> <id> "<etiqueta>" <grupo>
      grupo = personajes | texto | explicar | escena | ambiente | relatos | fondos (fondos animados)
      (clip vertical 360x640 con audio; se agrega al final del video del grupo)
  python3 catalogo_anim.py html <kit_dir>       # regenera las secciones de animaciones y sonidos de index.html
Después subir index.html, catalogo_anim.json y el video del grupo al artifact (publish_files, modo patch).
"""
import sys, json, subprocess, html, re, os
GR = [('personajes', '1. Personajes y objetos'), ('texto', '2. Texto en pantalla'), ('explicar', '3. Explicar'), ('escena', '4. Cambiar de escena'), ('ambiente', '5. Ambiente'), ('relatos', '6. Relatos bíblicos')]
def dur(p): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode())
def agregar(K, clip, cid, label, g):
    cat = json.load(open(f'{K}/catalogo_anim.json')); gv = f'{K}/grupos/anim_{g}.mp4'; t0 = dur(gv); tmp = f'{K}/grupos/_tmp.mp4'
    pr = lambda sel, ent: subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', sel, '-show_entries', f'stream={ent}', '-of', 'csv=p=0', gv]).decode().strip().strip(',')
    ar, pf = pr('a:0', 'sample_rate'), pr('v:0', 'pix_fmt')
    norm = f'{K}/grupos/_clip.mp4'  # se re-codifica SOLO el clip nuevo (mismos parámetros) y se concatena sin re-codificar, para no perder calidad
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', clip, '-vf', 'scale=360:640,fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', pf, '-c:a', 'aac', '-b:a', '64k', '-ar', ar, '-ac', '2', norm], check=True)
    open('/tmp/_l.txt', 'w').write(f"file '{os.path.abspath(gv)}'\nfile '{os.path.abspath(norm)}'\n")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', '/tmp/_l.txt', '-c', 'copy', '-movflags', '+faststart', tmp], check=True); os.remove(norm)
    os.replace(tmp, gv); t1 = dur(gv)
    cat['animaciones'] = [a for a in cat['animaciones'] if a['id'] != cid] + [{'id': cid, 'label': label, 'grupo': g, 'a': round(t0, 3), 'b': round(t1, 3)}]
    json.dump(cat, open(f'{K}/catalogo_anim.json', 'w'), ensure_ascii=False, indent=0)
def page(K):
    cat = json.load(open(f'{K}/catalogo_anim.json')); h = open(f'{K}/index.html').read()
    h = re.sub(r'<section><h2>(Animaciones|Sonidos|Fondos · Animados)[^<]*<small>\d+</small></h2>.*?</div></section>', '', h, flags=re.S)
    sec = lambda t, figs: f'<section><h2>{t} <small>{len(figs)}</small></h2><div class="grid">{"".join(figs)}</div></section>'
    out = []
    for g, t in GR:
        figs = [f'<figure class="vd" data-n="{html.escape((a["id"] + " " + a["label"]).lower())}"><video class="seg" data-a="{a["a"]}" data-b="{a["b"]}" src="grupos/anim_{g}.mp4#t={round(a["a"] + min(1.0, (a["b"] - a["a"]) * 0.8), 2)}" preload="metadata" playsinline controls></video><figcaption>{html.escape(a["label"])}</figcaption></figure>' for a in cat['animaciones'] if a['grupo'] == g]
        out.append(sec('Animaciones · ' + t, figs))
    sf = lambda s, lab: f'<figure class="au" data-n="{html.escape((s["id"] + " " + lab).lower())}"><figcaption>{html.escape(s["id"])}<span class="d">{html.escape(lab)}</span></figcaption><audio class="seg" data-a="{s["a"]}" data-b="{s["b"]}" src="grupos/sonidos.mp3#t={s["a"]},{s["b"]}" preload="none" controls></audio></figure>'
    out.append(sec('Sonidos · Efectos nuevos', [sf(s, s['desc']) for s in cat['sonidos'] if s['tipo'] == 'nuevo']))
    out.append(sec('Sonidos · Efectos base', [sf(s, s['desc']) for s in cat['sonidos'] if s['tipo'] == 'base']))
    out.append(sec('Sonidos · Música de fondo', [sf(m, 'música de fondo') for m in cat['musica']]))
    h = h.replace('<main>', '<main>' + ''.join(out), 1)
    fz = [f'<figure class="vd" data-n="{html.escape((a["id"] + " " + a["label"]).lower())}"><video class="seg" data-a="{a["a"]}" data-b="{a["b"]}" src="grupos/anim_fondos.mp4#t={round(a["a"] + min(1.0, (a["b"] - a["a"]) * 0.8), 2)}" preload="metadata" playsinline controls></video><figcaption>{html.escape(a["label"])}</figcaption></figure>' for a in cat['animaciones'] if a['grupo'] == 'fondos']
    if fz: h = h.replace('<section><h2>Fondos · ', sec('Fondos · Animados', fz) + '<section><h2>Fondos · ', 1)
    h = re.sub(r'\d+ animaciones · \d+ efectos de sonido', f'{len(cat["animaciones"])} animaciones · {len(cat["sonidos"])} efectos de sonido', h)
    open(f'{K}/index.html', 'w').write(h)
if __name__ == '__main__':
    if sys.argv[1] == 'agregar': agregar(*sys.argv[2:7]); page(sys.argv[2])
    else: page(sys.argv[2])
