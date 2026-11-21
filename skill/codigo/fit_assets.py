# fit_assets.py — prepara accesorios fotográficos (sombreros, etc.) para ponerlos en las figuras.
# Uso: python3 fit_assets.py assets.json <carpeta_fuentes> public/assets
# Por cada accesorio genera <id>_front.png (va delante de la cabeza) y, si corresponde,
# <id>_back.png (forro/interior, va detrás de la cabeza), y escribe public/assets/fit.json.
#
# REGLA DE ENCAJE (no cambiar): los bordes del accesorio tienen que TAPAR el contorno de la cabeza.
#   - band  : fila (px de la imagen fuente) donde el accesorio apoya en la cabeza (borde inferior del ala/banda).
#             "auto_narrow" = primera fila, desde la mitad hacia abajo, donde el ancho cae por debajo del 35 %
#             (sirve para mitras/sombreros con cintas: corta las cintas).
#   - ref   : [x0, x1] ancho de referencia en esa fila. "auto" = ancho del accesorio en la fila band-5.
#             En gorros con orejeras, ref = la ABERTURA entre orejeras.
#   - ratio : ancho de ref / ancho de la cabeza a esa altura. >1 para sombreros que apoyan encima (1.06–1.15);
#             <1 cuando ref es una abertura (0.85–0.9) para que orejeras/bordes cubran los costados de la cabeza.
#   - depth : altura de apoyo medida desde la coronilla, en fracción del diámetro (frente ≈ 0.36–0.45).
#   - sag   : curvatura del borde (fracción del diámetro). SOLO sombreros altos y rígidos (mitra ≈ 0.10).
#             En gorros bajos (solideo, gorras) usar 0: si se curva, las puntas suben y la cabeza asoma.
#   - hole  : [x0, x1, y0] zona que se ve "por dentro" (abertura). Se quita del frente y queda en el back.
#   - trim_below : cortar todo lo que esté debajo de esa fila (cintas, tiras largas).
#   - drop_below_band : true = quitar del frente todo lo que esté debajo de band (interior visto desde abajo).
import json, sys, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

cfg = json.load(open(sys.argv[1])); src = sys.argv[2]; out = sys.argv[3]
os.makedirs(out, exist_ok=True)

def cut(path, tol=28):
    img = Image.open(path)
    if img.mode == 'RGBA':                      # recorte ya transparente (biblioteca lib/)
        arr = np.array(img).astype(float); return arr[:, :, :3], (arr[:, :, 3] > 128).astype(float)
    im = np.array(img.convert('RGB')).astype(float)
    bg = np.median(np.array([im[5, 5], im[5, -6], im[-6, 5], im[-6, -6]]), 0)
    lab, _ = ndimage.label(np.sqrt(((im - bg) ** 2).sum(2)) < tol)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return im, ndimage.binary_opening(~np.isin(lab, list(edge)), iterations=2).astype(float)

def rgba(im, a):
    al = np.array(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)))
    return np.dstack([im, al]).astype(np.uint8)

def bend(arr, cx, hw, sag):
    s_max = int(np.ceil(sag)) + 1
    o = np.zeros((arr.shape[0] + s_max, arr.shape[1], 4), np.uint8)
    for x in range(arr.shape[1]):
        t = (x - cx) / hw; s = int(round(sag * max(0.0, 1 - t * t)))
        o[s:s + arr.shape[0], x] = arr[:, x]
    return o

def chord_frac(depth):  # ancho de la cabeza a esa altura / diámetro
    if depth >= 0.99: return 1.0                 # cascos que cubren toda la cabeza: se mide contra el diámetro
    y = depth * 2 - 1
    return float(np.sqrt(max(1 - y * y, 0)))

fit = {}

def fit_cavity(aid, c, im, a):
    """Accesorio con cavidad (turbante, capucha, casco con abertura): la cabeza va DENTRO.
    Cavidad = píxeles oscuros o transparentes encerrados por el objeto (por arriba y a los costados),
    limitada opcionalmente por cav_box [x0,y0,x1,y1]. Se busca el círculo mínimo (centro en el eje de la
    cavidad) que la contiene: ese círculo es la cabeza. Frente = objeto sin la cavidad; fondo = objeto entero."""
    from scipy import ndimage as ndi
    H, W = a.shape; yy, xx = np.mgrid[0:H, 0:W]
    if c.get('trim_below'): a = a.copy(); a[yy > c['trim_below']] = 0     # coletas/moños que caerían sobre el pecho
    rgb = np.asarray(im)[..., :3].astype(float); lum = rgb @ [0.299, 0.587, 0.114]
    op = a > 0.5
    med = np.median(lum[op]); dark = op & (lum < med * c.get('dark', 0.5))
    # encerrado: hay objeto arriba en la columna y a ambos lados en la fila
    above = np.maximum.accumulate(op, axis=0)
    left = np.maximum.accumulate(op, axis=1); right = np.maximum.accumulate(op[:, ::-1], axis=1)[:, ::-1]
    cand = (dark | ~op) & above & left & right
    if c.get('cav_box'):
        x0, y0, x1, y1 = c['cav_box']; cand &= (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
    cand = ndi.binary_opening(cand, iterations=2)
    lab, n = ndi.label(cand); sizes = ndi.sum(cand, lab, range(1, n + 1))
    cav = lab == (int(np.argmax(sizes)) + 1) if n else np.zeros_like(cand)
    if c.get('cav_ellipse'):                    # cara del maniquí (velos, tocas): óvalo fijado a mano [cx, cy, rx, ry]
        ex, ey, rx, ry = c['cav_ellipse']; cav = ((xx - ex) / rx) ** 2 + ((yy - ey) / ry) ** 2 <= 1
    if c.get('all_dark'):                       # todas las aberturas oscuras (ojos y ranura de cascos cerrados), no solo la mayor
        cav = cand.copy()
    if c.get('cav_poly'):                       # interior trazado a mano siguiendo los bordes reales (polígono en px de la foto)
        from PIL import ImageDraw
        k = 4; m = Image.new('L', (W * k, H * k), 0)
        ImageDraw.Draw(m).polygon([(x * k, y * k) for x, y in c['cav_poly']], fill=255)
        cav = np.asarray(m.resize((W, H), Image.LANCZOS)) > 127
    if c.get('cav_rects'):                      # interior hecho de varios rectángulos [x0,y0,x1,y1] (entre carrilleras, nuca)
        cav = cav.copy() if c.get('cav_ellipse') else np.zeros_like(cand)   # se suma al óvalo si hay
        for x0, y0, x1, y1 in c['cav_rects']: cav |= (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
    if c.get('cav_rect'):                       # abertura fijada a mano: todo lo que hay ahí (interior y nuca del casco) va detrás de la cara
        x0, y0, x1, y1 = c['cav_rect']; cav = (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
    if c.get('close'): cav = ndi.binary_closing(cav, iterations=c['close'])
    cav = ndi.binary_fill_holes(cav)
    if c.get('close'): cav = ndi.binary_opening(cav, iterations=c['close'])
    if c.get('open_below'):                     # lo que queda debajo de la cavidad (interior trasero) también se va
        ext = np.maximum.accumulate(cav, axis=0) & ~cav
    else:
        ext = np.zeros_like(cav)
    cy_, cx_ = np.where(cav); cx = (cx_.min() + cx_.max()) / 2
    best = None
    for y in np.linspace(cy_.min(), cy_.max(), 200):
        r = np.sqrt(((cx_ - cx) ** 2 + (cy_ - y) ** 2).max())
        if best is None or r < best[1]: best = (y, r)
    cy, R = best; R *= c.get('margin', 1.04)
    if c.get('fit') == 'width':                 # capuchas: la cabeza llena el ANCHO de la abertura; arriba/abajo se ve la sombra
        rows = cav.sum(1); R = rows.max() / 2 * c.get('margin', 1.08)
        cx = float(np.average(cx_)); cy = cy_.min() + c.get('cy_frac', 0.45) * (cy_.max() - cy_.min())
    if c.get('fit') == 'shell':                 # cascos cerrados: la cabeza llena el interior; por las aberturas se ve la cabeza
        ys_, xs_ = np.where(op); W_ = xs_.max() - xs_.min()
        R = c.get('shell', 0.86) * W_ / 2; cx = (xs_.min() + xs_.max()) / 2; cy = ys_.max() - R * c.get('chin', 1.05)
    if c.get('head'): cx, cy, R = c['head']        # cascos: cabeza fijada a mano en px de la foto [cx, cy, R]          # cabeza un poco más grande que la cavidad: no se ve el interior
    cavd = ndi.binary_dilation(cav | ext, iterations=c.get('grow', 3)) if c.get('grow', 3) else (cav | ext)
    front = a.copy(); front[cavd] = 0
    back = a.copy(); back[ndi.binary_dilation(ext, iterations=3)] = 0
    if c.get('front_cut_below'): front[yy > c['front_cut_below']] = 0   # coletas, moños: van detrás del cuello
    layers = {'front': rgba(im, front), 'back': rgba(im, back)}
    al = a; ys, xs = np.where(al > 0.04); y0c, y1c, x0c, x1c = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    for k, v in layers.items():
        Image.fromarray(v[y0c:y1c, x0c:x1c]).save(os.path.join(out, f'{aid}_{k}.png'))
    # depth 1 / ratio 1 en photoBox: k = 88/bw, y0 = -48 - band*k  ->  bw = 2R, band = cy + R
    fit[aid] = {'w': int(x1c - x0c), 'h': int(y1c - y0c), 'cx': float(cx - x0c), 'band': float(cy + R - y0c), 'bw': float(2 * R),
                'ratio': 1.0, 'depth': 1.0, 'back': True}
    print(aid, fit[aid])
for aid, c in cfg.items():
    im, a = cut(os.path.join(src, c['src']), c.get('tol', 28))
    H, W = a.shape; yy, xx = np.mgrid[0:H, 0:W]
    if c.get('trim_below'): a[yy > c['trim_below']] = 0
    if c.get('kind') == 'cavity':
        fit_cavity(aid, c, im, a); continue
    band = c['band']
    if band == 'auto_narrow':
        rows = (a > 0.5).sum(1)
        band = next(y for y in range(int(H * 0.45), H) if rows[y] < W * 0.35)
    if band == 'bottom':                          # última fila con ancho >= 40 % del máximo (ignora cintas y tiras)
        rows = (a > 0.5).sum(1); band = int(np.where(rows >= rows.max() * 0.4)[0][-1])
    elif isinstance(band, float) and band < 1:    # fracción de la altura
        ys_ = np.where(a.sum(1) > 0)[0]; band = int(ys_[0] + band * (ys_[-1] - ys_[0]))
    ref = c.get('ref', 'auto')
    if ref == 'max':
        rows = (a > 0.5).sum(1); r0 = int(rows.argmax()); cols = np.where(a[r0] > 0.5)[0]; ref = [int(cols[0]), int(cols[-1])]
    if ref == 'auto':
        cols = np.where(a[band - 5] > 0.5)[0]; ref = [int(cols[0]), int(cols[-1])]
    front = a.copy()
    if c.get('drop_below_band') or c.get('kind') == 'tall': front[yy >= band] = 0
    back = None
    if c.get('hole'):
        x0, x1, y0 = c['hole']; front[(xx > x0) & (xx < x1) & (yy > y0)] = 0; back = a
    if c.get('back_full'):                       # lo que se corta del frente (interior, barboquejo) queda detrás de la cabeza
        back = a
    if c.get('kind') == 'behind':               # capuchas/velos: todo detrás, la cabeza va delante dentro de la abertura
        back = a; front = np.zeros_like(a)
    bw = ref[1] - ref[0]; cx = (ref[0] + ref[1]) / 2
    if c.get('ref_row'):                         # medir el ancho en otra fila (copa de sombreros con ala)
        ys_ = np.where(a.sum(1) > 0)[0]; hh = ys_[-1] - ys_[0]
        rr = int(c['ref_row']) if c['ref_row'] > 1 else int(band - c['ref_row'] * hh)
        cols = np.where(a[rr] > 0.5)[0]; ref = [int(cols[0]), int(cols[-1])]; bw = ref[1] - ref[0]; cx = (ref[0] + ref[1]) / 2
    layers = {'front': rgba(im, front)}
    if back is not None: layers['back'] = rgba(im, back)
    sag_src = c.get('sag', 0) * bw / (c['ratio'] * chord_frac(c['depth']))
    if sag_src > 0:
        layers = {k: bend(v, cx, bw / 2, sag_src) for k, v in layers.items()}
    # recorte común para que front y back queden alineados
    al = np.maximum.reduce([v[:, :, 3] for v in layers.values()])
    ys, xs = np.where(al > 10); y0c, y1c, x0c, x1c = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    for k, v in layers.items():
        Image.fromarray(v[y0c:y1c, x0c:x1c]).save(os.path.join(out, f'{aid}_{k}.png'))
    fit[aid] = {'w': int(x1c - x0c), 'h': int(y1c - y0c), 'cx': float(cx - x0c), 'band': float(band - y0c), 'bw': float(bw),
                'ratio': c['ratio'], 'depth': c['depth'], 'back': 'back' in layers}
    print(aid, fit[aid])
json.dump(fit, open(os.path.join(out, 'fit.json'), 'w'), indent=1)
