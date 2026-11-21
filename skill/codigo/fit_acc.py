# fit_acc.py — prepara accesorios de cuerpo y cara en foto (collares, pectorales, cruces, cuellos, corbatas,
# cinturones, anteojos, auriculares, coronas de laurel/espinas) para la figura.
# Uso: python3 -I fit_acc.py acc_lib/acc.json acc_lib public/acc_lib   -> PNGs + acc_fit.json
# Cada entrada: layer   'body' (sobre la ropa, DETRÁS de la cabeza: lo que sube al cuello queda tapado por la cabeza),
#                       'face' (DELANTE de la cabeza: anteojos, auriculares) o 'ring' (corona alrededor de la cabeza:
#                       la mitad de arriba va detrás y la de abajo delante; split = fila de corte en fracción).
#               width   ancho en unidades de la figura (cuerpo = 92, cabeza = 88) que debe medir ref.
#               ref     [x0, x1] en px de la foto, o 'max' (ancho total).
#               at      [x, y] en unidades de la figura donde va el punto (centro de ref, refY).
#               refY    fila (px o fracción de la altura) que se apoya en at.
#               squash  achatar en vertical (corona de espinas vista desde arriba -> de frente).
import json, sys, os, numpy as np
from PIL import Image
cfg = json.load(open(sys.argv[1])); src = sys.argv[2]; out = sys.argv[3]; os.makedirs(out, exist_ok=True)
fit = {}
for aid, c in cfg.items():
    im = Image.open(os.path.join(src, c['src'])).convert('RGBA')
    if c.get('squash'): im = im.resize((im.width, max(1, int(im.height * c['squash']))), Image.LANCZOS)
    if c.get('squash_top'):                      # achatar solo la parte de arriba (vincha de auriculares), las copas quedan igual
        r, f = c['squash_top']; top = im.crop((0, 0, im.width, r)).resize((im.width, max(1, int(r * f))), Image.LANCZOS)
        bot = im.crop((0, r, im.width, im.height)); new = Image.new('RGBA', (im.width, top.height + bot.height), (0, 0, 0, 0))
        new.paste(top, (0, 0)); new.paste(bot, (0, top.height)); im = new
        if isinstance(c.get('refY'), int) and c['refY'] > r: c['refY'] = int(r * f) + c['refY'] - r
    a = np.array(im); H, W = a.shape[:2]
    if c.get('crop_x'):                         # quitar lo que sobra a los costados (patillas de anteojos)
        cx0, cx1 = c['crop_x']; a[:, :cx0, 3] = 0; a[:, cx1 + 1:, 3] = 0
    yy_, xx_ = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    for ex, ey, rx, ry in c.get('clear_ellipses', []):   # interior de los cristales: se borra lo que se ve a través (patillas, reflejos)
        a[((xx_ - ex) / rx) ** 2 + ((yy_ - ey) / ry) ** 2 <= 1, 3] = 0
    if c.get('clear_polys'):                     # patillas vistas a través del cristal, trazadas a mano
        from PIL import ImageDraw
        m = Image.new('L', (a.shape[1], a.shape[0]), 0)
        for poly in c['clear_polys']: ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=255)
        a[np.asarray(m) > 0, 3] = 0
    for x0, y0, x1, y1 in c.get('clear_rects', []):
        a[y0:y1 + 1, x0:x1 + 1, 3] = 0
    if c.get('min_blob'):                        # borrar restos chicos sueltos (puntitos de las patillas)
        from scipy import ndimage as ndi
        lab, n = ndi.label(a[..., 3] > 60, structure=np.ones((3, 3)))
        if n:
            sz = ndi.sum(np.ones(lab.shape), lab, range(1, n + 1))
            for i, z in enumerate(sz, 1):
                if z < c['min_blob']: a[lab == i, 3] = 0
    if c.get('hole_ellipse'):                   # agujero del cuello (gorguera): transparente, lo tapa la cabeza
        hx, hy, rx, ry = c['hole_ellipse']; yy, xx = np.mgrid[0:H, 0:W]
        a[((xx - hx) / rx) ** 2 + ((yy - hy) / ry) ** 2 <= 1, 3] = 0
    op = a[..., 3] > 128
    ys, xs = np.where(op)
    ref = c.get('ref', 'max')
    x0, x1 = (xs.min(), xs.max()) if ref == 'max' else ref
    ry = c.get('refY', 0); ry = ry * (H - 1) if isinstance(ry, float) and ry <= 1 else ry - c.get('_shift', 0)
    k = c['width'] / (x1 - x0)
    e = {'w': W, 'h': H, 'cx': float((x0 + x1) / 2), 'cy': float(ry), 'k': k, 'x': c['at'][0], 'y': c['at'][1], 'layer': c['layer'], 'hidesCollar': bool(c.get('hides_collar'))}
    if c.get('replaces'): e['replaces'] = c['replaces']   # la foto reemplaza lo pintado en la ropa (ej. collar del faraón)
    if c['layer'] == 'ring':
        sp = int(c.get('split', 0.5) * H)
        b = a.copy(); b[sp:, :, 3] = 0; f = a.copy(); f[:sp, :, 3] = 0
        Image.fromarray(b).save(f'{out}/{aid}_back.png'); Image.fromarray(f).save(f'{out}/{aid}_front.png')
    else:
        Image.fromarray(a).save(f'{out}/{aid}.png')
    fit[aid] = e
json.dump(fit, open(f'{out}/acc_fit.json', 'w'), indent=1)
print(len(fit), 'accesorios')
