# Quita fondo blanco residual y sombras claras de recortes: (1) desde lo transparente avanza por píxeles claros
# y sin color (sombras, fondo entre piezas); (2) borra huecos blancos encerrados.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
def clean(path, white_obj=False):
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    rgb = a[..., :3]; al = a[..., 3]
    lum = rgb.mean(2); sat = (rgb.max(2) - rgb.min(2)) / 255
    if white_obj: light = (lum > 240) & (sat < 0.04)
    else: light = (lum > 196) & (sat < 0.09)
    seed = al < 20
    reach = ndi.binary_propagation(seed, mask=seed | light)
    rm = reach & ~seed
    if not white_obj:                                  # huecos encerrados claros
        lab, n = ndi.label(light & ~reach)
        if n:
            sz = ndi.sum(np.ones_like(lum), lab, range(1, n + 1))
            for i, s in enumerate(sz, 1):
                if s > 30: rm |= lab == i
    rm = ndi.binary_dilation(rm, iterations=1) & (al > 0)
    a[rm, 3] = 0
    a[..., 3] = ndi.uniform_filter(a[..., 3], 2) if False else a[..., 3]
    Image.fromarray(a.astype(np.uint8)).save(path)
    return int(rm.sum())
if __name__ == '__main__':
    wl = set(sys.argv[2].split(',')) if len(sys.argv) > 2 else set()
    for p in open(sys.argv[1]).read().split():
        n = p.rsplit('/', 1)[-1][:-4]; print(n, clean(p, n in wl))
