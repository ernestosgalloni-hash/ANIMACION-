DBG=False
import sys, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
def split(path, names, out, labels=False, single=False, grid=3, tol=24):
    im = np.array(Image.open(path).convert('RGB')).astype(float); H, W, _ = im.shape
    q=(im//8).astype(int); key=q[...,0]*1024+q[...,1]*32+q[...,2]; v,c=np.unique(key,return_counts=True); mm=key==v[c.argmax()]; bg=im[mm].mean(0)
    if DBG: print('bg',bg)
    lum=im.mean(2); sat=im.max(2)-im.min(2)
    near = (np.sqrt(((im - bg) ** 2).sum(2)) < tol) | ((lum>225)&(sat<14)) | ((np.abs(lum-bg.mean())<40)&(sat<10)&(lum>170))
    lab, _ = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes=ndimage.sum(near,lab,range(1,lab.max()+1)); ob=ndimage.find_objects(lab); big={i+1 for i,z in enumerate(sizes) if z>0.01*W*H and ob[i] is not None and ((ob[i][1].stop-ob[i][1].start)>0.6*W or (ob[i][0].stop-ob[i][0].start)>0.6*H)}
    fg = ~np.isin(lab, list(border|big))
    fg = ndimage.binary_opening(fg, iterations=1)
    if labels:
        fl,fn=ndimage.label(fg); objs=ndimage.find_objects(fl); ar=ndimage.sum(fg,fl,range(1,fn+1))
        for i,sl in enumerate(objs):
            hh=sl[0].stop-sl[0].start
            if hh<0.05*H and ar[i]<0.002*W*H: fg[fl==i+1]=False
    grow = ndimage.binary_dilation(fg, iterations=int(W * 0.010))
    if not single:
        for g in (1,2):
            grow[int(g*H/grid)-1:int(g*H/grid)+1,:]=False; grow[:,int(g*W/grid)-1:int(g*W/grid)+1]=False
    cl, n = ndimage.label(grow)
    res = {}
    for k in range(1, n + 1):
        m = cl == k
        if DBG: ys_,xs_=np.where(m); print('raw',xs_.min(),ys_.min(),xs_.max()-xs_.min(),ys_.max()-ys_.min(),int(m.sum()))
        if m.sum() < W * H * 0.002: continue
        ys, xs = np.where(m); h=ys.max()-ys.min(); w=xs.max()-xs.min()
        if labels and h < 0.075*H and w > 2.2*h: continue   # renglón de texto
        if h>0.9*H or w>0.9*W: continue                       # líneas de grilla
        cx, cy = xs.mean(), ys.mean()
        if DBG: print('comp',xs.min(),ys.min(),w,h,int(m.sum()))
        cell = 0 if single else int(cy // (H / grid)) * grid + int(cx // (W / grid))
        res.setdefault(cell, np.zeros_like(m)); res[cell] |= m
    saved = []
    for cell, m in sorted(res.items()):
        if cell >= len(names) or not names[cell]: continue
        a = (fg & m).astype(float)
        a = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)))
        ys, xs = np.where(a > 20); pad = 6
        y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad, H), max(xs.min() - pad, 0), min(xs.max() + pad, W)
        rgba = np.dstack([im, a]).astype(np.uint8)[y0:y1, x0:x1]
        o=f'{out}/{names[cell]}.png'; Image.fromarray(rgba).save(o); saved.append(o)
    missing = [x for x in names if x and f'{out}/{x}.png' not in saved]
    print(path.split('/')[-1], len(saved), 'ok', ('FALTAN: ' + ', '.join(missing)) if missing else '')
    return saved
if __name__=='__main__':
    cfg = json.load(open(sys.argv[1])); allp=[]
    for s in cfg: allp+=split(s['src'], s['names'], sys.argv[2], s.get('labels',False), s.get('single',False))
    open(sys.argv[3],'w').write('\n'.join(allp))
