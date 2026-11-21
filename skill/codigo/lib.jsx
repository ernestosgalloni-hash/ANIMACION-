// Librería de animación estilo "divulgación con figuras blancas" (shorts 9:16, 30 fps)
import React, {useId} from 'react';
import {AbsoluteFill, Sequence, Audio, Img, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, random, Easing} from 'remotion';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/caveat/700.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource/noto-serif/700.css';
import '@fontsource/noto-serif-hebrew/700.css';
import '@fontsource/permanent-marker/400.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/cinzel/700.css';

export const W = 1080, H = 1920, FPS = 30;
export const C = {white: '#FFFFFF', shade: '#C9D2DE', red: '#FF2B2B', green: '#2ECC71', yellow: '#FFD23F',
  cyan: '#00D4FF', ink: '#1B1B22', blueA: '#3B76C4', blueB: '#1F4882'};
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

// ---------- tiempo / easing ----------
export const usePop = (at, soft = false) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return spring({frame: f - at, fps, config: soft ? {damping: 14, stiffness: 120} : {damping: 9, stiffness: 180, mass: 0.6}});
};
export const ramp = (f, a, b, ease = Easing.out(Easing.cubic)) => interpolate(f, [a, b], [0, 1], {...cl, easing: ease});
export const Sfx = ({at, name, vol = 0.5, len}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={len ? Math.max(1, Math.round(len)) : undefined} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={len ? (f) => vol * Math.min(1, (len - f) / 3) : vol} /></Sequence>
);

// ---------- fondos ----------
const grainId = 'grain';
const Grain = ({o = 0.08}) => (
  <svg width={W} height={H} style={{position: 'absolute', opacity: o, mixBlendMode: 'overlay'}}>
    <filter id={grainId}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" /></filter>
    <rect width={W} height={H} filter={`url(#${grainId})`} />
  </svg>
);
const stars = new Array(160).fill(0).map((_, i) => ({x: random('sx' + i) * W, y: random('sy' + i) * H, r: 0.6 + random('sr' + i) * 2, p: random('sp' + i) * 6}));
/** kind: 'sepia' (fondo del canal para explicar, por defecto) | 'parchment' (pergamino: versículos, citas, texto) | 'map' (mapa antiguo oscurecido: geografía) | 'blue' | 'space' | 'dark' | 'warm' | 'custom' (pasar from/to) */
export const Bg = ({kind = 'sepia', from, to, nebula = ['#2a6bff', '#8a2be2'], children}) => {
  const f = useCurrentFrame();
  if (kind === 'parchment') return <AbsoluteFill><Img src={staticFile(PAPER)} style={{position: 'absolute', width: W, height: H, objectFit: 'cover'}} />{children}<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 50%, rgba(30,15,5,.55) 100%)'}} /></AbsoluteFill>;
  if (kind === 'map') return <AbsoluteFill><Img src={staticFile('fondos/genericos/mapa_antiguo.jpg')} style={{position: 'absolute', width: W, height: H, objectFit: 'cover'}} /><AbsoluteFill style={{background: 'rgba(20,12,6,.45)'}} />{children}<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 50%, rgba(30,15,5,.55) 100%)'}} /></AbsoluteFill>;
  const pal = {sepia: ['#5A3E28', '#24160C'], blue: [C.blueA, C.blueB], dark: ['#2A2A2E', '#121214'], warm: ['#E9DCC0', '#B89E74'], space: ['#0B1022', '#03040A']}[kind] || [from, to];
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${pal[0]} 0%, ${pal[1]} 85%)`}}>
      {kind === 'space' && <>
        <AbsoluteFill style={{background: `radial-gradient(circle at ${30 + 5 * Math.sin(f / 80)}% 30%, ${nebula[0]}40, transparent 45%), radial-gradient(circle at 70% ${70 + 5 * Math.cos(f / 90)}%, ${nebula[1]}38, transparent 50%)`, filter: 'blur(30px)'}} />
        <svg width={W} height={H} style={{position: 'absolute'}}>{stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(f / 25 + s.p))} />)}</svg>
      </>}
      {children}
      <Grain />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,.35) 100%)'}} />
    </AbsoluteFill>
  );
};
/** Texto escrito con tinta (pluma) sobre pergamino: se escribe palabra por palabra a velocidad constante y cada palabra suena con la pluma durante lo que tarda en escribirse.
 *  font: 'IM Fell English' (antiguo, por defecto) o 'Caveat' (manuscrito). Para varias líneas, un InkText por línea con at encadenado (at2 = at1 + largo1 * speed). */
export const InkText = ({at, x = 0, y = 400, w = W, size = 84, color = '#241508', align = 'center', speed = 2.2, font = 'IM Fell English', italic = false, snd = '20_pluma', vol = 0.45, children}) => {
  const txt = typeof children === 'string' ? children : ''; const n = Math.max(1, txt.length); const D = Math.max(10, Math.round(n * speed));
  const t = ramp(useCurrentFrame(), at, at + D, Easing.linear);
  let k = 0; const words = txt.split(' ').map((wd) => { const a = at + Math.round(k * speed); k += wd.length + 1; return [a, Math.round(wd.length * speed)]; });
  return <>{snd && words.map(([a, l], i) => l > 0 && <Sfx key={i} at={a} name={snd} vol={vol} len={l + 2} />)}
    <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, fontFamily: font, fontStyle: italic ? 'italic' : 'normal', fontSize: size, color, lineHeight: 1.15}}>
      <span style={{display: 'inline-block', padding: '0 0.25em', margin: '0 -0.25em', clipPath: t >= 1 ? 'none' : `inset(-15% ${100 - t * 100}% -15% -3%)`, filter: 'drop-shadow(0 0 0.6px rgba(36,21,8,.6))'}}>{children}</span></div></>;
};
export const Grid = ({o = 0.25, step = 90, color = '#fff', at = 0}) => {
  const p = ramp(useCurrentFrame(), at, at + 20);
  return (<svg width={W} height={H} style={{position: 'absolute', opacity: o * p}}>
    {Array.from({length: Math.ceil(W / step) + 1}, (_, i) => <line key={'v' + i} x1={i * step} y1={0} x2={i * step} y2={H} stroke={color} strokeWidth="2" />)}
    {Array.from({length: Math.ceil(H / step) + 1}, (_, i) => <line key={'h' + i} x1={0} y1={i * step} x2={W} y2={i * step} stroke={color} strokeWidth="2" />)}
  </svg>);
};


// ---------- vestuario dibujado (ropitas) ----------
// dress = {type, c1, c2, c3, belt, tie, ...}. Tipos: tunic, robe, toga (c2 = franja: magistrado romano), suit, gown, habit (cape, scapular, belt), skins, pharaoh, armor, labcoat, dress,
// meso (flecos mesopotámicos), shendyt (falda egipcia), persian, queen, armorIs (soldado israelita), highpriest (efod + pectoral), priest (lino blanco), royal (manto real c2),
// prophet (manto de pelo c2), pharisee (manto con flecos), legion (legionario), emperor (clámide c2, loros), bishop (casulla antigua + palio), cassock (sotana: sash, muceta, white),
// chasuble (casulla gótica), cope (capa pluvial), kingMed (manto con armiño), coat18 (casaca s. XVIII), frock (levita victoriana), victorian (vestido de mujer), rags (harapos),
// egyptDress, slave, armorFil (filisteo), armorScale (escamas asiria), greek / philosopher (quitón + himatión c2), helleneDress, hermit (piel de oveja), sakkos (patriarca ortodoxo),
// knight (malla + sobreveste c1, cruz c2), peasant (c2 calzas), tudor (c2 piel), anglican, french17, salvation, indian (kurta c1 + dhoti c2), sari (c2 borde), dress1920 (c2 capa),
// hippie, criollo (poncho: true), bedouin (rayas c2), merchant, shroud (vendas), prisoner (rayas)
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`; };
const SLEEVES = (d) => ({pharaoh: null, skins: null, shendyt: null, armor: d.c2 || '#B3262E', toga: d.c1 || '#F4F1EA', suit: d.c1, labcoat: '#F4F6F8',
  armorIs: d.c1 || '#B9A580', highpriest: d.c1 || '#2C4A8C', priest: d.c1 || '#F4F1EA', legion: d.c1 || '#A3262E', emperor: d.c2 || '#5B1A5E', bishop: '#F4F1EA',
  chasuble: '#F4F1EA', cope: '#F4F1EA', egyptDress: null, slave: null, armorFil: d.c1 || '#C9B48A', armorScale: d.c1 || '#7A3E2A', hermit: d.c1 || '#9A8566', knight: '#8E949C', anglican: '#F7F7F2', salvation: d.c1 || '#1E2A4A', hippie: d.c1 || '#E9A23A', shroud: '#F1ECE0', prisoner: '#D8D6CE', sakkos: d.c1 || '#C9A54A', greek: d.c1, philosopher: d.c1, cassock: d.c1 || '#1E1E24', victorian: d.c1, rags: d.c1 || '#A89470', prophet: d.c2 || '#6E5236', royal: d.c2 || '#6B1F5E', kingMed: d.c2 || '#8B1E2E'});
export const sleeveColor = (d) => !d ? null : (SLEEVES(d)[d.type] !== undefined ? SLEEVES(d)[d.type] : d.c1);
const BODY = 'M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 Z';
const Folds = ({c, xs = [-24, 6, 28], y0 = 10, y1 = 150, o = 0.35}) => (
  <g stroke={c} strokeWidth="2.5" fill="none" opacity={o} strokeLinecap="round">
    {xs.map((x, i) => <path key={i} d={`M${x} ${y0 + i * 12} C${x - 4} ${(y0 + y1) / 2} ${x + 4} ${(y0 + y1) / 2 + 20} ${x - 2} ${y1}`} />)}
  </g>
);
const Rope = ({y = 58, c = '#B08850'}) => (
  <g><rect x={-47} y={y} width={94} height={9} rx={4} fill={c} stroke={shade(c, -0.35)} strokeWidth="1.5" />
    {[-38, -26, -14, -2, 10, 22, 34].map((x) => <line key={x} x1={x} y1={y} x2={x + 6} y2={y + 9} stroke={shade(c, -0.35)} strokeWidth="1.5" />)}
    <path d={`M8 ${y + 8} C6 ${y + 30} 12 ${y + 44} 8 ${y + 60}`} stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d={`M16 ${y + 8} C18 ${y + 26} 14 ${y + 40} 18 ${y + 52}`} stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" /></g>
);
export const Outfit = ({d, tex}) => {
  if (!d) return null; const t = d.type; const c1 = d.c1 || '#D9C9A3'; const dk = shade(c1, -0.3);
  const base = <path d={BODY} fill={c1} filter={tex} />;
  switch (t) {
    case 'tunic': case 'robe': return (<g>
      {base}<Folds c={dk} />
      <path d="M-14 -36 C-10 -22 10 -22 14 -36" fill={dk} opacity=".55" />
      {d.c2 && <path d="M-46 -6 C-30 -38 10 -40 30 -34 C14 -10 -6 40 -46 96 Z" fill={d.c2} filter={tex} />}
      {d.c2 && <path d="M30 -34 C14 -10 -6 40 -46 96" stroke={shade(d.c2, -0.35)} strokeWidth="3" fill="none" />}
      {d.belt === 'rope' && <Rope />}
      {d.belt === 'sash' && <rect x={-47} y={56} width={94} height={14} fill={d.c3 || '#7A4A22'} filter={tex} />}
    </g>);
    case 'toga': return (<g>{base}
      <path d="M46 -14 C10 -40 -30 -10 -46 40 L-46 70 C-20 20 20 0 46 10 Z" fill={shade(c1, -0.08)} />
      <path d="M46 -14 C10 -40 -30 -10 -46 40" stroke={d.c2 || '#9B2335'} strokeWidth="7" fill="none" />
      <Folds c={dk} xs={[-30, -8, 18]} y0={30} o={0.3} /></g>);
    case 'suit': return (<g>{base}
      <path d="M-15 -37 L0 34 L15 -37 Z" fill={d.shirt || '#F7F7F2'} />
      {d.tie && <path d="M0 -30 L-6 -22 L-5 26 L0 34 L5 26 L6 -22 Z" fill={d.tie} />}
      <path d="M-15 -37 L-4 22 L-22 -6 L-14 -14 Z" fill={dk} /><path d="M15 -37 L4 22 L22 -6 L14 -14 Z" fill={dk} />
      <line x1={0} y1={36} x2={0} y2={150} stroke={dk} strokeWidth="2" />
      {[48, 72].map((y) => <circle key={y} cx={-6} cy={y} r={3.2} fill={shade(c1, -0.5)} />)}
      <path d="M-40 36 L-22 36" stroke={dk} strokeWidth="3" /></g>);
    case 'gown': return (<g>{base}<Folds c={shade(c1, 0.25)} o={0.25} xs={[-30, -10, 12, 30]} />
      <path d="M-46 -6 C-36 -30 -18 -38 -10 -38 L-10 150 L-46 150 Z" fill={shade(c1, 0.08)} />
      <path d="M46 -6 C36 -30 18 -38 10 -38 L10 150 L46 150 Z" fill={shade(c1, 0.08)} /></g>);
    case 'habit': return (<g>{base}<Folds c={dk} />
      {d.scapular && <path d="M-18 -36 L18 -36 L18 150 L-18 150 Z" fill={d.scapular} filter={tex} />}
      {d.cape && <path d={`M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 ${d.capeLong ? 150 : 40} L-46 ${d.capeLong ? 150 : 40} Z`} fill={d.cape} filter={tex} />}
      {d.cape && d.capeLong && <path d="M-6 -30 L-10 150 L10 150 L6 -30 Z" fill={d.scapular || c1} />}
      <path d="M-30 -30 C-30 -60 30 -60 30 -30 C20 -40 -20 -40 -30 -30 Z" fill={d.cape || dk} />
      {d.belt === 'leather' ? <rect x={-47} y={56} width={94} height={9} fill="#2A1C10" /> : d.belt !== false && <Rope c="#D8C79A" />}</g>);
    case 'skins': return (<g>
      <path d="M-46 150 L-46 18 L-30 4 L-38 -10 C-20 -24 10 -30 30 -36 L40 -20 L46 0 L46 150 Z" fill={c1 || '#8B5E3C'} filter={tex} />
      <path d="M-46 112 L-36 124 L-26 110 L-16 126 L-6 112 L4 128 L14 112 L24 126 L34 110 L46 122 L46 150 L-46 150 Z" fill="#FFFFFF00" />
      {[[-20, 20], [8, 40], [-10, 70], [24, 84], [-28, 96]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l6 -3 l6 3`} stroke={shade(c1 || '#8B5E3C', -0.4)} strokeWidth="2" fill="none" />)}
      <path d="M30 -36 L40 -20" stroke={shade(c1 || '#8B5E3C', -0.4)} strokeWidth="3" /></g>);
    case 'pharaoh': return (<g>
      <path d="M-46 60 L46 60 L50 150 L-50 150 Z" fill="#F7F3E8" filter={tex} />
      <path d="M-14 66 L14 66 L22 150 L-22 150 Z" fill="#EDE5CF" /><rect x={-47} y={54} width={94} height={12} fill="#D4A62A" />
      {d.collar !== false && [0, 1, 2, 3].map((i) => <path key={i} d={`M${-44 + i * 3} ${-30 + i * 9} C-20 ${-6 + i * 11} 20 ${-6 + i * 11} ${44 - i * 3} ${-30 + i * 9}`}
        stroke={['#D4A62A', '#2B6CB0', '#C0392B', '#2AA198'][i]} strokeWidth="8" fill="none" />)}</g>);
    case 'armor': return (<g>{base}
      <path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 70 L-46 70 Z" fill="#A7ADB5" filter={tex} />
      {[-6, 10, 26, 42, 58].map((y) => <line key={y} x1={-46} y1={y} x2={46} y2={y} stroke="#6E747C" strokeWidth="3" />)}
      <line x1={0} y1={-38} x2={0} y2={70} stroke="#6E747C" strokeWidth="2" />
      {[78, 94, 110].map((y) => <rect key={y} x={-44} y={y} width={88} height={10} fill="#7A4A22" />)}</g>);
    case 'labcoat': return (<g>{base}<path d={BODY} fill="#F4F6F8" />
      <path d="M-15 -37 L0 30 L15 -37 Z" fill={c1} /><line x1={0} y1={30} x2={0} y2={150} stroke="#C9D2DE" strokeWidth="2" />
      <rect x={14} y={20} width={20} height={14} fill="none" stroke="#C9D2DE" strokeWidth="2" /></g>);
    case 'dress': return (<g>{base}<Folds c={dk} xs={[-26, 0, 26]} />
      <path d="M-14 -36 C-10 -24 10 -24 14 -36" fill={dk} opacity=".55" />
      {d.c2 && <path d="M-34 40 L34 40 L40 150 L-40 150 Z" fill={d.c2} filter={tex} />}</g>);

    // ---------- lote 2: ropa por época ----------
    case 'meso': { const f = d.c2 || shade(c1, -0.15); return (<g>{base}
      {[20, 62, 104].map((y, i) => <g key={y}><path d={`M-46 ${y} L46 ${y} L46 ${y + 30} L-46 ${y + 30} Z`} fill={i % 2 ? f : shade(c1, 0.06)} filter={tex} />
        {Array.from({length: 16}, (_, k) => <line key={k} x1={-44 + k * 5.8} y1={y + 30} x2={-44 + k * 5.8} y2={y + 40} stroke={shade(c1, -0.35)} strokeWidth="2" />)}</g>)}
      <path d="M-46 -4 C-20 -30 20 -38 40 -30 L46 -10 C20 -16 -16 4 -46 40 Z" fill={d.c3 || shade(c1, -0.2)} filter={tex} />
      {Array.from({length: 10}, (_, k) => <line key={k} x1={-44 + k * 9} y1={38 - k * 5} x2={-46 + k * 9} y2={46 - k * 5} stroke={shade(c1, -0.4)} strokeWidth="2" />)}</g>); }
    case 'shendyt': return (<g>
      <path d="M-46 64 L46 64 L52 128 L-52 128 Z" fill="#F4EFE2" filter={tex} />
      {[-36, -24, -12, 0, 12, 24, 36].map((x) => <line key={x} x1={x} y1={70} x2={x * 1.12} y2={126} stroke="#D9D0BA" strokeWidth="2" />)}
      <path d="M-12 66 L12 66 L16 128 L-16 128 Z" fill="#E9E1CC" /><rect x={-47} y={58} width={94} height={10} fill={d.c2 || '#C8A24A'} /></g>);
    case 'persian': { const c2 = d.c2 || '#3A3F6B'; return (<g>{base}<Folds c={dk} o={0.25} />
      <path d="M-46 118 L46 118 L46 150 L-46 150 Z" fill={c2} filter={tex} /><line x1={0} y1={118} x2={0} y2={150} stroke={shade(c2, -0.4)} strokeWidth="2" />
      <path d="M-6 -36 L-14 116 L14 116 L6 -36 Z" fill={d.c3 || '#C9A54A'} opacity=".9" />
      <rect x={-47} y={52} width={94} height={12} fill={d.c3 || '#C9A54A'} />
      {[90, 104].map((y) => <path key={y} d={`M-46 ${y} L46 ${y}`} stroke={shade(c1, 0.25)} strokeWidth="3" />)}</g>); }
    case 'queen': { const g = d.c3 || '#D4A62A'; return (<g>{base}<Folds c={shade(c1, 0.2)} o={0.3} xs={[-28, -8, 12, 30]} />
      <path d="M-46 -6 C-30 -30 -14 -36 0 -36 C14 -36 30 -30 46 -6 L46 150 L36 150 C34 60 26 10 0 0 C-26 10 -34 60 -36 150 L-46 150 Z" fill={d.c2 || shade(c1, -0.25)} filter={tex} />
      <path d="M-20 -34 C-14 -16 14 -16 20 -34" stroke={g} strokeWidth="6" fill="none" />{[-14, -5, 5, 14].map((x) => <circle key={x} cx={x} cy={-20 + Math.abs(x) * 0.5} r={3.5} fill="#B03030" />)}
      <rect x={-47} y={46} width={94} height={8} fill={g} /><path d="M-46 146 L46 146" stroke={g} strokeWidth="6" /></g>); }
    case 'armorIs': return (<g><path d={BODY} fill={d.c1 || '#B9A580'} filter={tex} />
      <path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 62 L-46 62 Z" fill={d.c2 || '#7A5232'} filter={tex} />
      {[[-24, 4], [0, 4], [24, 4], [-24, 30], [0, 30], [24, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="#C9A54A" />)}
      {Array.from({length: 9}, (_, k) => <rect key={k} x={-45 + k * 10.2} y={64} width={8} height={36} rx={2} fill={shade(d.c2 || '#7A5232', -0.15)} />)}
      <rect x={-47} y={58} width={94} height={8} fill="#4E3018" /></g>);
    case 'highpriest': { const blue = c1 || '#2C4A8C'; return (<g><path d={BODY} fill={blue} filter={tex} /><Folds c={shade(blue, -0.3)} o={0.3} />
      {Array.from({length: 9}, (_, k) => <circle key={k} cx={-40 + k * 10} cy={142} r={4} fill={k % 2 ? '#D4A62A' : '#B03030'} />)}
      <path d="M-40 -30 C-30 -38 30 -38 40 -30 L38 80 L-38 80 Z" fill="url(#efod)" />
      <path d="M-40 -30 C-30 -38 30 -38 40 -30 L38 80 L-38 80 Z" fill="none" stroke="#D4A62A" strokeWidth="3" />
      <rect x={-20} y={-10} width={40} height={46} rx={3} fill="#D4A62A" />
      {Array.from({length: 12}, (_, k) => <rect key={k} x={-16 + (k % 3) * 11.5} y={-6 + Math.floor(k / 3) * 10.5} width={8} height={8} rx={2} fill={['#B03030', '#2E8B57', '#2B6CB0', '#8E44AD', '#E67E22', '#16A085'][k % 6]} />)}
      <rect x={-47} y={66} width={94} height={10} fill="url(#efod)" /></g>); }
    case 'priest': return (<g><path d={BODY} fill={c1 || '#F4F1EA'} filter={tex} /><Folds c={shade(c1 || '#F4F1EA', -0.15)} o={0.35} />
      {['#2B4FA0', '#7B2A6E', '#B03030', '#F4F1EA'].map((col, i) => <rect key={i} x={-47} y={52 + i * 5} width={94} height={5} fill={col} />)}
      <path d="M-6 72 L-10 130 L-2 130 Z M6 72 L10 128 L2 128 Z" fill="#7B2A6E" /></g>);
    case 'royal': { const m = d.c2 || '#6B1F5E', g = d.c3 || '#D4A62A'; return (<g>{base}<Folds c={dk} o={0.3} />
      <path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 L24 150 C26 70 18 0 0 -20 C-18 0 -26 70 -24 150 L-46 150 Z" fill={m} filter={tex} />
      <path d="M24 150 C26 70 18 0 0 -20 C-18 0 -26 70 -24 150" stroke={g} strokeWidth="5" fill="none" />
      <circle cx={0} cy={-22} r={6} fill={g} /></g>); }
    case 'prophet': { const m = d.c2 || '#6E5236'; return (<g>{base}<Folds c={dk} o={0.25} />
      <path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 96 L-46 96 Z" fill={m} filter={tex} />
      {Array.from({length: 18}, (_, k) => <path key={k} d={`M${-46 + k * 5.4} 92 l2 10 l2 -8`} stroke={shade(m, -0.3)} strokeWidth="2" fill={m} />)}
      {Array.from({length: 26}, (_, k) => { const x = -40 + (k * 37) % 80, y = -20 + (k * 53) % 104; return <path key={'h' + k} d={`M${x} ${y} l3 7`} stroke={shade(m, -0.35)} strokeWidth="2" />; })}
      {d.belt !== false && <rect x={-47} y={56} width={94} height={9} fill="#4E3018" />}</g>); }
    case 'pharisee': { const m = d.c2 || '#EDE3CC'; return (<g>{base}<Folds c={dk} o={0.25} />
      <path d="M-46 -4 C-30 -34 30 -34 46 -4 L46 118 L-46 118 Z" fill={m} filter={tex} />
      {[-34, -20, 20, 34].map((x) => <path key={x} d={`M-46 ${x === -34 ? 20 : 60} M${x} 108 l0 14`} stroke="#2B4FA0" strokeWidth="3" />)}
      {[0, 1, 2].map((i) => <path key={i} d={`M-46 ${96 + i * 6} L46 ${96 + i * 6}`} stroke={i === 1 ? '#2B4FA0' : shade(m, -0.25)} strokeWidth="3" />)}
      {[-40, 40].map((x) => <g key={x}><line x1={x} y1={118} x2={x} y2={134} stroke="#2B4FA0" strokeWidth="2.5" /><line x1={x + 3} y1={118} x2={x + 4} y2={132} stroke="#F4F1EA" strokeWidth="2" /></g>)}</g>); }
    case 'legion': { const r = d.c1 || '#A3262E'; return (<g><path d={BODY} fill={r} filter={tex} />
      <path d="M-46 -2 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 -2 L46 54 L-46 54 Z" fill="#9DA4AD" filter={tex} />
      {[2, 14, 26, 38, 50].map((y) => <path key={y} d={`M-46 ${y} L46 ${y}`} stroke="#5E646C" strokeWidth="2.5" />)}
      <path d="M-46 -6 C-40 -24 -30 -32 -16 -36 L-14 -12 Z M46 -6 C40 -24 30 -32 16 -36 L14 -12 Z" fill="#B7BDC5" stroke="#5E646C" strokeWidth="2" />
      <rect x={-47} y={54} width={94} height={8} fill="#5A3A1E" />{Array.from({length: 7}, (_, k) => <rect key={k} x={-30 + k * 9} y={62} width={6} height={30} rx={2} fill="#6B4523" />)}</g>); }
    case 'emperor': { const pu = d.c2 || '#5B1A5E', g = d.c3 || '#D4A62A'; return (<g><path d={BODY} fill={c1 || '#F1E6CC'} filter={tex} /><Folds c={shade(c1 || '#F1E6CC', -0.2)} o={0.3} />
      <path d="M-46 -2 C-46 -26 -28 -38 0 -38 C20 -38 34 -32 40 -24 L-20 150 L-46 150 Z" fill={pu} filter={tex} />
      <circle cx={36} cy={-22} r={8} fill={g} stroke="#8A6A10" strokeWidth="2" />
      {d.loros && <path d="M-26 -34 L-14 150 L0 150 L-10 -36 Z" fill={g} />}
      {d.loros && Array.from({length: 8}, (_, k) => <circle key={k} cx={-17 + k * 1.2} cy={-20 + k * 20} r={3.5} fill={['#B03030', '#2E8B57', '#2B6CB0'][k % 3]} />)}</g>); }
    case 'bishop': { const ch = c1 || '#9B2335'; return (<g><path d={BODY} fill="#F4F1EA" filter={tex} />
      <path d="M-46 -2 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 -2 L46 116 C30 126 -30 126 -46 116 Z" fill={ch} filter={tex} />
      {d.pallium !== false && <><path d="M-30 -32 L0 10 L30 -32" stroke="#F7F4EC" strokeWidth="9" fill="none" /><path d="M0 10 L0 112" stroke="#F7F4EC" strokeWidth="9" />
        {[[-16, -12], [16, -12], [0, 40], [0, 84]].map(([x, y], i) => <path key={i} d={`M${x - 4} ${y} L${x + 4} ${y} M${x} ${y - 4} L${x} ${y + 4}`} stroke="#2B2B2B" strokeWidth="2.5" />)}</>}
      {d.pallium === false && <path d="M-8 -36 L-8 112 L8 112 L8 -36 Z" fill={d.c3 || '#D4A62A'} opacity=".85" />}</g>); }
    case 'cassock': { const k = c1 || '#1E1E24'; return (<g><path d={BODY} fill={k} filter={tex} />
      <line x1={0} y1={-34} x2={0} y2={150} stroke={shade(k, k === '#F4F4F0' || d.white ? -0.12 : 0.25)} strokeWidth="2" />
      {Array.from({length: 10}, (_, i) => <circle key={i} cx={0} cy={-26 + i * 9} r={2.2} fill={d.btn || (d.white ? '#D8D2C2' : '#B03030')} />)}
      {d.sash && <><rect x={-47} y={52} width={94} height={12} fill={d.sash} stroke={shade(d.sash, -0.18)} strokeWidth="1.5" /><path d="M22 64 L18 110 L30 110 L30 64 Z" fill={d.sash} stroke={shade(d.sash, -0.18)} strokeWidth="1.5" />{d.white && <path d="M18 110 L30 110" stroke="#D4A62A" strokeWidth="4" />}</>}
      {d.muceta && <path d="M-46 4 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 4 C30 12 -30 12 -46 4 Z" fill={d.muceta} filter={tex} stroke={shade(d.muceta, -0.18)} strokeWidth="2" />}
      <path d="M-14 -37 L14 -37 L12 -30 L-12 -30 Z" fill="#F7F7F2" /></g>); }
    case 'chasuble': { const v = c1 || '#2E6B3A', g = d.c3 || '#D4A62A'; return (<g><path d={BODY} fill="#F4F1EA" filter={tex} />
      <path d="M-46 -2 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 -2 L40 124 C20 132 -20 132 -40 124 Z" fill={v} filter={tex} />
      <path d="M-28 -34 L0 6 L28 -34 M0 6 L0 128" stroke={g} strokeWidth="10" fill="none" /></g>); }
    case 'cope': { const v = c1 || '#B8862B', g = d.c3 || '#E9C55A'; return (<g><path d={BODY} fill="#F4F1EA" filter={tex} />
      <path d="M-46 -2 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 -2 L52 150 L18 150 C14 60 8 0 0 -30 C-8 0 -14 60 -18 150 L-52 150 Z" fill={v} filter={tex} />
      <path d="M18 150 C14 60 8 0 0 -30 C-8 0 -14 60 -18 150" stroke={g} strokeWidth="8" fill="none" /><rect x={-12} y={-34} width={24} height={16} rx={3} fill={g} /></g>); }
    case 'kingMed': { const m = d.c2 || '#8B1E2E'; return (<g>{base}<Folds c={dk} o={0.3} />
      <path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 L26 150 C26 70 18 10 0 0 C-18 10 -26 70 -26 150 L-46 150 Z" fill={m} filter={tex} />
      <path d="M-46 4 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 4 C26 20 -26 20 -46 4 Z" fill="#F7F5EE" />
      {[[-34, -6], [-18, 4], [0, 8], [18, 4], [34, -6], [-26, -22], [26, -22], [0, -12]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l-2 5 l2 -1 l2 1 Z`} fill="#1E1E24" />)}</g>); }
    case 'coat18': { const v = d.c2 || '#C9B48A'; return (<g>{base}
      <path d="M-14 -37 L14 -37 L18 110 L-18 110 Z" fill={v} filter={tex} />{Array.from({length: 7}, (_, i) => <circle key={i} cx={0} cy={-20 + i * 16} r={2.6} fill={shade(v, -0.5)} />)}
      <path d="M-8 -38 C-12 -26 -6 -16 0 -12 C6 -16 12 -26 8 -38 Z" fill="#FBFBF8" />
      <path d="M-14 -37 L-20 150 M14 -37 L20 150" stroke={dk} strokeWidth="3" />{[[-34, 80], [34, 80]].map(([x, y], i) => <rect key={i} x={x - 10} y={y} width={20} height={6} fill={dk} />)}
      <rect x={-46} y={128} width={92} height={22} fill={d.c3 || '#2A2A30'} /></g>); }
    case 'frock': { const v = d.c2 || '#3A3A40'; return (<g>{base}
      <path d="M-13 -37 L0 20 L13 -37 Z" fill="#F7F7F2" />{d.tie !== false && <path d="M-8 -30 L8 -30 L4 -24 L0 -26 L-4 -24 Z" fill={d.tie || '#1E1E24'} />}
      <path d="M-13 -37 L-4 20 L-18 0 L-12 -16 Z M13 -37 L4 20 L18 0 L12 -16 Z" fill={shade(c1, -0.35)} />
      <path d="M-4 20 L4 20 L6 70 L-6 70 Z" fill={v} /><line x1={0} y1={20} x2={0} y2={110} stroke={dk} strokeWidth="2" />
      <path d="M-46 104 L-12 104 L-8 150 L-46 150 Z M46 104 L12 104 L8 150 L46 150 Z" fill={shade(c1, -0.12)} />
      <rect x={-8} y={104} width={16} height={46} fill={d.c3 || '#45454C'} /></g>); }
    case 'victorian': { const g = shade(c1, -0.25); return (<g>
      <path d="M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 40 C60 80 66 120 70 150 Z" fill={c1} filter={tex} />
      <path d="M-46 40 C-60 80 -66 120 -70 150 L-46 150 Z" fill={c1} filter={tex} />
      <path d="M-14 -40 L14 -40 L12 -28 L-12 -28 Z" fill={d.c2 || '#F4F1EA'} /><circle cx={0} cy={-20} r={5} fill="#D4A62A" />
      {[-28, -10, 10, 28].map((x) => <path key={x} d={`M${x * 0.9} 44 C${x * 1.3} 90 ${x * 1.7} 120 ${x * 2} 150`} stroke={g} strokeWidth="2.5" fill="none" />)}
      <path d="M-46 38 C-20 46 20 46 46 38" stroke={g} strokeWidth="3" fill="none" />
      {Array.from({length: 6}, (_, i) => <circle key={i} cx={0} cy={-8 + i * 9} r={2.4} fill={g} />)}</g>); }
    case 'rags': return (<g>
      <path d="M-46 136 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 132 L38 142 L30 128 L22 146 L12 130 L2 144 L-8 128 L-18 146 L-28 130 L-38 144 Z" fill={c1 || '#A89470'} filter={tex} />
      <Folds c={dk} o={0.3} /><rect x={14} y={40} width={18} height={16} fill={shade(c1 || '#A89470', -0.2)} transform="rotate(8 23 48)" />
      <rect x={-34} y={84} width={16} height={14} fill={shade(c1 || '#A89470', 0.15)} transform="rotate(-10 -26 91)" />
      <path d="M-20 10 l6 14 l-4 -2 M24 96 l-6 10" stroke={dk} strokeWidth="2" fill="none" />{d.belt === 'rope' && <Rope />}</g>);

    // ---------- lote 5: más ropa ----------
    case 'egyptDress': return (<g><path d="M-40 150 L-40 10 C-40 -4 -30 -10 -24 -12 L24 -12 C30 -10 40 -4 40 10 L40 150 Z" fill={c1 || '#F7F3E8'} filter={tex} />
      <path d="M-24 -12 L-20 -38 M24 -12 L20 -38" stroke={c1 || '#F7F3E8'} strokeWidth="6" />{[0, 1, 2].map((i) => <path key={i} d={`M-30 ${-30 + i * 7} C-12 ${-14 + i * 8} 12 ${-14 + i * 8} 30 ${-30 + i * 7}`} stroke={['#D4A62A', '#2B6CB0', '#2AA198'][i]} strokeWidth="6" fill="none" />)}
      <rect x={-41} y={54} width={82} height={6} fill="#D4A62A" /></g>);
    case 'slave': return (<g><path d="M-44 110 L-44 40 L44 40 L44 106 L36 114 L26 102 L16 116 L4 104 L-8 116 L-20 102 L-32 114 Z" fill={c1 || '#C9B48A'} filter={tex} /><Rope y={44} /></g>);
    case 'armorFil': return (<g><path d={BODY} fill={c1 || '#C9B48A'} filter={tex} />
      <path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 60 L-46 60 Z" fill="#B88A4A" filter={tex} />{[-10, 4, 18, 32, 46].map((y) => <rect key={y} x={-46} y={y} width={92} height={6} fill="#7A5A2A" />)}
      <path d="M-46 60 L46 60 L40 104 L-40 104 Z" fill={d.c2 || '#8A2E2A'} />{Array.from({length: 7}, (_, k) => <line key={k} x1={-36 + k * 12} y1={104} x2={-36 + k * 12} y2={118} stroke="#D4A62A" strokeWidth="4" />)}</g>);
    case 'armorScale': return (<g><path d={BODY} fill={c1 || '#7A3E2A'} filter={tex} /><path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 96 L-46 96 Z" fill="#9C8A5A" />
      {Array.from({length: 9}, (_, r) => Array.from({length: 9}, (_, k) => <path key={r + '-' + k} d={`M${-44 + k * 11 + (r % 2) * 5} ${-24 + r * 13} a6 7 0 0 0 11 0`} fill="#B8A26A" stroke="#6E5E36" strokeWidth="1.5" />))}
      <rect x={-47} y={92} width={94} height={8} fill="#4E3018" /></g>);
    case 'greek': case 'philosopher': { const m = d.c2 || (t === 'philosopher' ? '#8A8478' : '#C9B48A'); return (<g>{base}<Folds c={dk} o={0.25} />
      <path d="M-46 -6 C-30 -36 20 -40 46 -10 L46 150 L10 150 C14 90 -10 40 -46 30 Z" fill={m} filter={tex} />
      <path d="M46 -10 C20 -40 -30 -36 -46 -6" stroke={shade(m, -0.3)} strokeWidth="3" fill="none" />{[0, 1, 2].map((i) => <path key={i} d={`M${-30 + i * 22} ${20 + i * 10} C${-10 + i * 18} ${70 + i * 10} ${0 + i * 14} ${110} ${4 + i * 12} 150`} stroke={shade(m, -0.25)} strokeWidth="2.5" fill="none" />)}</g>); }
    case 'helleneDress': { const m = d.c2 || '#7A2E5E', g = d.c3 || '#D4A62A'; return (<g>{base}<Folds c={shade(c1, 0.2)} o={0.3} xs={[-28, -8, 12, 30]} />
      <path d="M46 -10 C20 -38 -20 -36 -46 0 L-46 70 C-20 40 20 30 46 40 Z" fill={m} filter={tex} /><path d="M46 -10 C20 -38 -20 -36 -46 0 M-46 70 C-20 40 20 30 46 40" stroke={g} strokeWidth="4" fill="none" />
      <path d="M-46 146 L46 146" stroke={g} strokeWidth="5" />{[-12, 0, 12].map((x) => <circle key={x} cx={x} cy={-24 + Math.abs(x) * 0.3} r={3} fill={g} />)}</g>); }
    case 'hermit': return (<g><path d={BODY} fill={c1 || '#9A8566'} filter={tex} /><Folds c={shade(c1 || '#9A8566', -0.3)} o={0.3} />
      <path d="M-46 4 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 4 C30 22 -30 22 -46 4 Z" fill="#EFEADF" />{Array.from({length: 16}, (_, k) => <circle key={k} cx={-40 + (k % 8) * 11.5} cy={-20 + Math.floor(k / 8) * 18 + (k % 2) * 4} r={7} fill="#F7F3EA" stroke="#D8D0BE" strokeWidth="1.5" />)}<Rope /></g>);
    case 'sakkos': { const g = c1 || '#C9A54A'; return (<g><path d={BODY} fill={g} filter={tex} />
      {Array.from({length: 12}, (_, k) => { const x = -34 + (k % 4) * 22, y = 10 + Math.floor(k / 4) * 40; return <path key={k} d={`M${x - 5} ${y} L${x + 5} ${y} M${x} ${y - 6} L${x} ${y + 6}`} stroke="#8A1E2E" strokeWidth="3" />; })}
      <path d="M-40 -30 L0 20 L40 -30 M0 20 L0 150" stroke="#F7F4EC" strokeWidth="12" fill="none" />{[[-20, -6], [20, -6], [0, 60], [0, 110]].map(([x, y], i) => <path key={i} d={`M${x - 4} ${y} L${x + 4} ${y} M${x} ${y - 4} L${x} ${y + 4}`} stroke="#B03030" strokeWidth="2.5" />)}</g>); }
    case 'knight': { const sc = c1 || '#F4F1EA'; return (<g><path d={BODY} fill="#8E949C" filter={tex} />
      {Array.from({length: 120}, (_, k) => <circle key={k} cx={-44 + (k % 12) * 8 + (Math.floor(k / 12) % 2) * 4} cy={-34 + Math.floor(k / 12) * 18} r={2} fill="#5E646C" />)}
      <path d="M-34 -26 L34 -26 L38 136 L-38 136 Z" fill={sc} filter={tex} />{d.c2 && <><rect x={-6} y={-14} width={12} height={90} fill={d.c2} /><rect x={-28} y={8} width={56} height={12} fill={d.c2} /></>}
      <rect x={-40} y={58} width={80} height={8} fill="#4E3018" /></g>); }
    case 'peasant': return (<g><path d="M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 Z" fill={d.c2 || '#6E6A5E'} filter={tex} />
      <path d="M-46 106 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 106 Z" fill={c1 || '#8A7A5A'} filter={tex} /><Folds c={shade(c1 || '#8A7A5A', -0.3)} y1={104} o={0.3} />
      <line x1={0} y1={106} x2={0} y2={150} stroke={shade(d.c2 || '#6E6A5E', -0.4)} strokeWidth="2" /><Rope /></g>);
    case 'tudor': { const fur = d.c2 || '#6B4A2E'; return (<g>{base}
      <path d="M-14 -36 L14 -36 L16 104 L-16 104 Z" fill={d.c3 || '#E8D9A8'} />{[-8, 8].map((x) => [0, 20, 40, 60, 80].map((y) => <rect key={x + '-' + y} x={x - 3} y={y} width={6} height={12} rx={2} fill="#B03030" />))}
      <path d="M-46 0 C-46 -26 -28 -38 -14 -36 L-18 150 L-46 150 Z M46 0 C46 -26 28 -38 14 -36 L18 150 L46 150 Z" fill={c1} filter={tex} />
      <path d="M-46 4 C-40 -24 -26 -36 -14 -36 L-20 150 L-30 150 L-30 0 Z M46 4 C40 -24 26 -36 14 -36 L20 150 L30 150 L30 0 Z" fill={fur} filter={tex} /></g>); }
    case 'anglican': return (<g><path d={BODY} fill="#F7F7F2" filter={tex} /><path d="M-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 L14 150 L8 -30 L-8 -30 L-14 150 L-46 150 Z" fill={c1 || '#1E1E24'} />
      <path d="M-10 -34 L-12 150 M10 -34 L12 150" stroke="#1E1E24" strokeWidth="10" /><rect x={-12} y={-37} width={24} height={8} fill="#F7F7F2" /></g>);
    case 'french17': return (<g>{base}<Folds c={dk} o={0.25} />
      <path d="M-30 -38 C-20 -16 20 -16 30 -38 L22 -6 C10 2 -10 2 -22 -6 Z" fill="#FBFBF8" stroke="#D8D2C2" strokeWidth="2" />
      {Array.from({length: 8}, (_, i) => <circle key={i} cx={0} cy={6 + i * 12} r={2.6} fill="#D4A62A" />)}<path d="M-46 30 C-10 50 20 60 46 90" stroke={d.c2 || '#B03030'} strokeWidth="10" fill="none" /></g>);
    case 'salvation': { const n = c1 || '#1E2A4A'; return (<g><path d={BODY} fill={n} filter={tex} />
      <path d="M-14 -37 L-2 -37 L-4 -22 L-14 -24 Z M14 -37 L2 -37 L4 -22 L14 -24 Z" fill="#B03030" /><text x={-11} y={-26} fontSize="10" fontWeight="700" fill="#E9C55A">S</text><text x={5} y={-26} fontSize="10" fontWeight="700" fill="#E9C55A">S</text>
      {Array.from({length: 6}, (_, i) => <circle key={i} cx={0} cy={-14 + i * 14} r={2.8} fill="#C9A54A" />)}<rect x={-47} y={60} width={94} height={8} fill="#B03030" /></g>); }
    case 'indian': return (<g><path d={BODY} fill={d.c2 || '#F7F3E8'} filter={tex} /><path d="M-46 110 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 110 Z" fill={c1 || '#E9C98A'} filter={tex} />
      <line x1={0} y1={-34} x2={0} y2={30} stroke={shade(c1 || '#E9C98A', -0.3)} strokeWidth="2" /><path d="M-10 110 L-14 150 M10 110 L14 150" stroke={shade(d.c2 || '#F7F3E8', -0.2)} strokeWidth="3" /></g>);
    case 'sari': { const b = d.c2 || '#2B5FB0'; return (<g><path d={BODY} fill={c1 || '#F7F7F2'} filter={tex} />
      <path d="M30 -36 C0 -10 -30 40 -46 100 L-46 130 C-20 70 10 20 46 -4 Z" fill={c1 || '#F7F7F2'} stroke={shade(c1 || '#F7F7F2', -0.15)} strokeWidth="2" />
      {[0, 7].map((o) => <path key={o} d={`M${30 + o} -36 C${0 + o} -10 ${-30 + o} 40 ${-46 + o} 100`} stroke={b} strokeWidth="3.5" fill="none" />)}{[140, 146].map((y) => <path key={y} d={`M-46 ${y} L46 ${y}`} stroke={b} strokeWidth="3.5" />)}</g>); }
    case 'dress1920': return (<g>{base}<Folds c={shade(c1, 0.2)} o={0.25} /><path d="M-46 4 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 4 L52 60 C20 70 -20 70 -52 60 Z" fill={d.c2 || shade(c1, -0.08)} filter={tex} />
      <path d="M-12 -36 C-8 -26 8 -26 12 -36" stroke={shade(c1, -0.2)} strokeWidth="3" fill="none" /></g>);
    case 'hippie': return (<g><path d={BODY} fill={d.c2 || '#3E5E8E'} filter={tex} /><line x1={0} y1={80} x2={0} y2={150} stroke="#2A4466" strokeWidth="2" />
      <path d="M-46 80 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 80 Z" fill={c1 || '#E9A23A'} filter={tex} />
      {[[-26, -10], [10, -18], [26, 20], [-14, 30], [0, 58], [-34, 60], [32, 62]].map(([x, y], i) => <g key={i}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + 6 * Math.cos(a * Math.PI / 180)} cy={y + 6 * Math.sin(a * Math.PI / 180)} r={4} fill={['#D9433B', '#7B3FA0', '#2E8B57'][i % 3]} />)}<circle cx={x} cy={y} r={3} fill="#FFE27A" /></g>)}</g>);
    case 'criollo': return (<g>{d.poncho ? <><path d={BODY} fill={d.c3 || '#3A3A40'} filter={tex} /><path d="M-52 -2 C-46 -28 -28 -38 0 -38 C28 -38 46 -28 52 -2 L44 96 L0 120 L-44 96 Z" fill={c1 || '#8A2E2A'} filter={tex} />
      {[30, 50, 70].map((y) => <path key={y} d={`M-48 ${y} L0 ${y + 22} L48 ${y}`} stroke={d.c2 || '#1E1E24'} strokeWidth="5" fill="none" />)}</> : <><path d={BODY} fill={c1 || '#4A4A50'} filter={tex} /><path d="M-15 -37 L0 30 L15 -37 Z" fill="#F7F7F2" /></>}</g>);
    case 'bedouin': { const st = d.c2 || '#5A3A22'; return (<g>{base}{[-36, -18, 0, 18, 36].map((x) => <rect key={x} x={x - 4} y={-30} width={8} height={180} fill={st} opacity=".6" />)}
      <rect x={-47} y={56} width={94} height={12} fill={d.c3 || '#9B2335'} /></g>); }
    case 'merchant': { const g = d.c3 || '#D4A62A'; return (<g>{base}<Folds c={dk} o={0.3} />
      <path d="M-8 -36 L-8 150 M8 -36 L8 150" stroke={g} strokeWidth="5" />{[96, 104].map((y) => <path key={y} d={`M-46 ${y} L46 ${y}`} stroke={g} strokeWidth="3" />)}
      <rect x={-47} y={52} width={94} height={14} fill={d.c2 || '#2E6B8A'} filter={tex} /><path d="M24 66 L20 100 L32 100 Z" fill={d.c2 || '#2E6B8A'} /></g>); }
    case 'shroud': return (<g><path d={BODY} fill="#F1ECE0" filter={tex} />{Array.from({length: 12}, (_, k) => <path key={k} d={`M-46 ${-24 + k * 15} L46 ${-34 + k * 15}`} stroke="#D6CDB8" strokeWidth="3" />)}
      {Array.from({length: 6}, (_, k) => <path key={'d' + k} d={`M-46 ${10 + k * 24} L46 ${30 + k * 24}`} stroke="#E2DACA" strokeWidth="5" opacity=".7" />)}</g>);
    case 'prisoner': return (<g><path d={BODY} fill="#E8E6DE" filter={tex} />{Array.from({length: 10}, (_, k) => <rect key={k} x={-46 + k * 10} y={-38} width={5} height={188} fill={c1 || '#3A4A6A'} opacity=".85" />)}</g>);
    default: return base;
  }
};

// ---------- personaje: figura blanca sin cara + accesorios ----------
// pose: 'idle' | 'point' (señala a la derecha) | 'handsHead' | 'shrug' | 'up' (brazos arriba) | 'hold' (sostiene algo al frente) | 'self' (se señala)
const POSES = {idle: [10, -10], point: [15, -80], handsHead: [140, -140], shrug: [55, -55], up: [155, -155], hold: [-65, 65], self: [15, 60],
  pray: [-38, 38], wave: [10, -150], open: [80, -80], pointUp: [10, -165], cower: [-120, 120], fist: [10, -125],
  think: [10, -140], facepalm: [10, -168], hips: [35, -35], clap: [-55, 55], stop: [10, -100], shy: [-25, 25],
  cross: [92, -92], carry: [-25, -150], preach: [20, -150], write: [-45, 40], throwBack: [10, 135], throwFwd: [10, -60]};
const TEX = 'tex';
const TexDefs = () => (
  <defs><linearGradient id="efod" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D4A62A" /><stop offset=".35" stopColor="#2B4FA0" /><stop offset=".65" stopColor="#7B2A6E" /><stop offset="1" stopColor="#B03030" /></linearGradient>
    <filter id={TEX} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="3" seed="7" result="n" />
      <feColorMatrix in="n" type="saturate" values="0" result="g" />
      <feComponentTransfer in="g" result="g2"><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
      <feComposite in="g2" in2="SourceGraphic" operator="in" result="t" />
      <feBlend in="SourceGraphic" in2="t" mode="multiply" />
    </filter>
    <linearGradient id="body" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor={C.shade} /></linearGradient>
    <radialGradient id="head" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D8DEE8" /></radialGradient>
  </defs>
);
const Arm = ({x, y, ang, len = 62, w = 22, fill, edge = false}) => (
  <g transform={`translate(${x} ${y}) rotate(${ang})`}>
    <rect x={-w / 2} y={0} width={w} height={len} rx={w / 2} fill={fill || 'url(#body)'} stroke={edge ? 'rgba(20,25,40,.28)' : 'none'} strokeWidth={edge ? 2.5 : 0} />
  </g>
);
/**
 * acc: objeto con accesorios (todos opcionales):
 *  hat: 'wizard'|'fedora'|'cap'(gorro con orejeras)|'skull'|'crown'|'turban'|'helmet'|'grad'|'top'
 *  hair: 'short'|'long'|'bun'|'curly'|'side'|'pompadour' (jopo peinado para atrás)|'tonsure' (tonsura de monje)|'braids' (trenzas: Sansón)|'flowing' (al viento: Absalón)|'waves' (ondas años 20)|'updo' (rodete alto victoriano) ; hairC
 *  beard: 'long'|'short'|'goatee'|'mustache'|'assyrian' (cuadrada con rizos: Asiria, Babilonia, Persia)|'chin' (barba de collar victoriana)|'full' (barba completa) ; beardC
 *  glasses: true ; collar: 'ruff'|'bands'|'tie' ; outfit: color de ropa (túnica/traje) ; coat: 'lab'
 *  hatC: color del sombrero ; dots: true (ojos de puntito)
 */
/** Pelo fotográfico: el hueco de la cara (openL..openR, medido en la fila hairline+8 %) mide ratio × diámetro de la cabeza;
 *  la línea del pelo cae al 18 % de la cabeza. Se dibuja DELANTE de la cabeza: la cara se ve por el hueco. */
const hairBox = (hr) => {
  const R = 44, top = -136, ratio = hr.ratio || 0.9; const k = (2 * R * ratio) / (hr.openR - hr.openL);
  const cx = (hr.openL + hr.openR) / 2;
  return {x: -cx * k, y: top + 0.18 * 2 * R - hr.hairline * k, width: hr.w * k, height: hr.h * k};
};
/** Pieza delantera (cuello, corbata, cinturón, pectoral). at: neck | chest | waist; w = ancho en fracción del torso (92). */
const FrontPiece = ({src, at = 'chest', w = 0.6, dy = 0, aspect = 1}) => {
  const bw = 92 * w; const y0 = {neck: -46, chest: -20, waist: 58}[at] + dy;
  return <image href={staticFile(src)} x={-bw / 2} y={y0} width={bw} height={bw * aspect} preserveAspectRatio="xMidYMin meet" />;
};
/** Accesorio fotográfico preparado con fit_assets.py. ph = {id, ...FIT[id]}. Regla: sus bordes tapan el contorno de la cabeza. */
const photoBox = (ph) => {
  const R = 44, top = -136; const yy = ph.depth * 2 - 1; const cf = ph.depth >= 0.99 ? 1 : Math.sqrt(Math.max(1 - yy * yy, 0));
  const k = (2 * R * cf * ph.ratio) / ph.bw;
  return {x: -ph.cx * k, y: top + ph.depth * 2 * R - ph.band * k, width: ph.w * k, height: ph.h * k};
};

// Accesorios en foto (collares, pectorales, cruces, cuellos, corbatas, cinturones, anteojos, coronas).
// layer 'body' va sobre la ropa y DETRÁS de la cabeza; 'face' delante de la cabeza; 'ring' rodea la cabeza (atrás + adelante).
const accBox = (a) => ({x: a.x - a.cx * a.k, y: a.y - a.cy * a.k, width: a.w * a.k, height: a.h * a.k});
const accSrc = (a, part) => staticFile(`${a.dir || 'acc_lib'}/${a.id}${part ? '_' + part : ''}.png`);
export const Figure = ({x, y, s = 1, pose = 'idle', acc = {}, flip = false, at = null, bob = true, look = 0, seed = 1, poseT = 1, fromPose = 'idle', photoHat = null, photoAcc = [], fabric = null, hair = null, fronts = [], fabricScale = 140, dress = null, tint = null, item = null, headDy = 0, headRot = 0, armsBack = false, greet = null, kid = false, wide = 1, spots = false, hunch = false, hairy = false}) => {
  if (kid) s = s * 0.74;   // niño: figura más chica con cabeza proporcionalmente más grande
  const uid = useId().replace(/:/g, '');
  if (dress && photoAcc.some((a) => a.hidesCollar)) dress = {...dress, collar: false};   // el collar en foto reemplaza al pintado
  if (dress && photoAcc.some((a) => a.replaces === 'collar')) dress = {...dress, collar: false};   // no pintar dos veces el collar
  const f = useCurrentFrame();
  const p0 = usePop(at == null ? -1000 : at);
  const p = at == null ? 1 : p0;
  const dy = bob ? Math.sin((f + seed * 17) / 22) * 3 : 0;
  const [a0, a1] = POSES[fromPose]; const [b0, b1] = POSES[pose];
  let L = a0 + (b0 - a0) * poseT, R = a1 + (b1 - a1) * poseT;
  // greet = {at, side: 'R'|'L', dur}: levanta la mano y saluda (va y viene) y la vuelve a bajar; usarlo al presentar un personaje
  if (greet) { const g = f - greet.at, gd = greet.dur ?? 40; if (g >= 0 && g <= gd) { const up = Math.min(1, g / 6, (gd - g) / 6); const wv = -150 + 20 * Math.sin(g * 0.55);
    if ((greet.side || 'R') === 'R') R = R * (1 - up) + wv * up; else L = L * (1 - up) - wv * up; } }
  const out = acc.outfit; const hc = acc.hairC || '#4A3426'; const bc = acc.beardC || hc; const hatC = acc.hatC || '#1E1E24';
  const sleeve = fabric ? `url(#fab${uid})` : (dress ? sleeveColor(dress) || undefined : acc.outfit);
  // Brazos adelante (sobre la barba y la ropa); un brazo levantado por encima del hombro va DETRÁS de la cabeza,
  // salvo en poses de mano en la cara (facepalm, think). armsBack = todo detrás (comportamiento viejo).
  const FACE_POSES = ['facepalm', 'think', 'cower'];
  const upArm = (a) => Math.abs(a) > 100 && !FACE_POSES.includes(pose);
  const oneArm = (sx, a, k) => <g key={k}><Arm x={sx} y={-18} ang={a} fill={sleeve} edge={!armsBack} />{tint && <g opacity={tint.o ?? 0.6}><Arm x={sx} y={-18} ang={a} fill={tint.color} /></g>}</g>;
  const itemEl = <>{item && (() => { const side = item.side || 'R'; const ang = side === 'R' ? R : L; const sx = side === 'R' ? 40 : -40; const r = (ang * Math.PI) / 180;
        const hx = sx - 62 * Math.sin(r), hy = -18 + 62 * Math.cos(r); const w = item.w || 80;
        return <image href={staticFile(item.src)} x={hx - w / 2 + (item.dx || 0)} y={hy - w / 2 + (item.dy || 0)} width={w} height={w} transform={`rotate(${item.rot || 0} ${hx} ${hy})`} preserveAspectRatio="xMidYMid meet" />; })()}</>;
  const itemUp = item && upArm((item.side || 'R') === 'R' ? R : L);
  const armsMid = armsBack ? <>{oneArm(-40, L, 'l')}{oneArm(40, R, 'r')}{itemEl}</> : <>{upArm(L) && oneArm(-40, L, 'l')}{upArm(R) && oneArm(40, R, 'r')}{itemUp && itemEl}</>;
  const armsTop = armsBack ? null : <>{!upArm(L) && oneArm(-40, L, 'l')}{!upArm(R) && oneArm(40, R, 'r')}{!itemUp && itemEl}</>;
  return (
    <svg width={200 * s} height={300 * s} viewBox="-100 -150 200 300" style={{position: 'absolute', left: x - 100 * s, top: y - 150 * s + dy * s,
      transform: `scale(${p}) ${flip ? 'scaleX(-1)' : ''} ${wide !== 1 ? `scaleX(${wide})` : ''}`, transformOrigin: '50% 100%', overflow: 'visible',
      filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.35))'}}>
      <TexDefs />
      <defs>
        {fabric && <pattern id={`fab${uid}`} patternUnits="userSpaceOnUse" x={-fabricScale / 2} y={-40} width={fabricScale} height={fabricScale}>
          <image href={staticFile(fabric)} width={fabricScale} height={fabricScale} preserveAspectRatio="xMidYMid slice" /></pattern>}
        {acc.hatFabric && <pattern id={`hat${uid}`} patternUnits="userSpaceOnUse" x={-60} y={-180} width={120} height={120}>
          <image href={staticFile(acc.hatFabric)} width={120} height={120} preserveAspectRatio="xMidYMid slice" /></pattern>}
        <pattern id={`nst${uid}`} patternUnits="userSpaceOnUse" width="20" height="14"><rect width="20" height="14" fill="#E2B33C" /><rect width="20" height="7" fill="#2B4FA0" /></pattern>
        <linearGradient id={`shd${uid}`} x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".32" /></linearGradient>
      </defs>
      {hair && hair.long && <image href={staticFile(hair.src)} {...hairBox(hair)} />}
      {/* cuerpo tipo peón/cápsula */}
      {acc.hair === 'long' && <path d="M-42 -88 C-50 -40 -46 -10 -36 4 L36 4 C46 -10 50 -40 42 -88 Z" fill={hc} filter={`url(#${TEX})`} />}
      <path d="M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 Z" fill={fabric ? `url(#fab${uid})` : (out || 'url(#body)')} filter={out && !fabric ? `url(#${TEX})` : undefined} />
      {dress && <Outfit d={dress} tex={`url(#${TEX})`} />}
      {(fabric || dress) && <path d="M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 Z" fill={`url(#shd${uid})`} />}
      {fronts.filter((p) => p.at !== 'neck').map((p, i) => <FrontPiece key={i} {...p} />)}
      {tint && <path d="M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 Z" fill={tint.color} opacity={tint.o ?? 0.6} />}
      {acc.coat === 'lab' && <path d="M-46 150 L-46 0 C-46 -26 -28 -38 0 -38 C28 -38 46 -26 46 0 L46 150 L10 150 L0 -30 L-10 150 Z" fill="#F4F6F8" />}
      {acc.collar === 'bands' && <><rect x={-12} y={-36} width={10} height={34} fill="#fff" /><rect x={2} y={-36} width={10} height={34} fill="#fff" /></>}
      {acc.collar === 'tie' && <path d="M0 -36 L-7 -28 L0 30 L7 -28 Z" fill="#B3262E" />}
      {acc.collar === 'ruff' && <g filter={`url(#${TEX})`}><ellipse cx={0} cy={-40} rx={52} ry={15} fill="#FBFBF8" stroke="#bbb" strokeWidth="2" />
        {[-36, -22, -8, 8, 22, 36].map((d) => <path key={d} d={`M${d} -52 Q${d + 5} -40 ${d} -28`} stroke="#c9c9c9" strokeWidth="2" fill="none" />)}</g>}
      {photoAcc.filter((a) => a.layer === 'body').map((a) => <image key={a.id} href={accSrc(a)} {...accBox(a)} />)}
      {armsMid}
      {hairy && Array.from({length: 40}, (_, k) => <path key={'hy' + k} d={`M${-42 + (k * 29) % 84} ${-30 + (k * 47) % 176} l3 6`} stroke={hairy === true ? '#8A3E1A' : hairy} strokeWidth="2" opacity=".7" />)}
      {spots && Array.from({length: 14}, (_, k) => <circle key={'sp' + k} cx={-38 + (k * 31) % 76} cy={-24 + (k * 53) % 170} r={4 + (k % 3) * 2} fill="#F4F2EC" opacity=".9" stroke="#D8D2C4" strokeWidth="1" />)}
      {/* cabeza separada del cuerpo */}
      <g transform={`translate(${look * 4} ${headDy + (hunch ? 22 : 0)}) rotate(${headRot + (hunch ? 8 : 0)} 0 -50)${kid ? ' translate(0 -40) scale(1.3) translate(0 40)' : ''}`}>
        {photoAcc.filter((a) => a.layer === 'ring').map((a) => <image key={a.id + 'b'} href={accSrc(a, 'back')} {...accBox(a)} />)}
        {photoHat && photoHat.back && <image href={staticFile(`${photoHat.dir || "assets"}/${photoHat.id}_back.png`)} {...photoBox(photoHat)} />}
        {acc.hair === 'longm' && <path d="M-47 -100 C-54 -150 54 -150 47 -100 L50 -52 C49 -36 42 -30 34 -31 L22 -34 L-22 -34 L-34 -31 C-42 -30 -49 -36 -50 -52 Z" fill={hc} filter={`url(#${TEX})`} />}
        <circle cx={0} cy={-92} r={44} fill="url(#head)" />
        {tint && <circle cx={0} cy={-92} r={44} fill={tint.color} opacity={tint.o ?? 0.6} />}
        {acc.dots && <><circle cx={-14 + look * 4} cy={-94} r={4.5} fill={C.ink} /><circle cx={14 + look * 4} cy={-94} r={4.5} fill={C.ink} /></>}
        <g filter={`url(#${TEX})`}>
          {acc.hair === 'short' && <path d="M-44 -96 C-46 -132 -20 -142 2 -140 C28 -138 48 -124 44 -96 C34 -116 18 -120 0 -120 C-20 -120 -34 -114 -44 -96 Z" fill={hc} />}
          {acc.hair === 'long' && <path d="M-47 -96 C-51 -154 51 -154 47 -96 C40 -110 24 -119 0 -117 C-24 -119 -40 -110 -47 -96 Z" fill={hc} />}
          {acc.hair === 'bun' && <><circle cx={0} cy={-146} r={17} fill={hc} /><path d="M-47 -96 C-51 -154 51 -154 47 -96 C40 -110 24 -119 0 -117 C-24 -119 -40 -110 -47 -96 Z" fill={hc} /></>}
          {acc.hair === 'curly' && <path d="M-46 -98 C-50 -152 50 -152 46 -98 C38 -112 22 -120 0 -118 C-22 -120 -38 -112 -46 -98 Z" fill={hc} />}
          {acc.hair === 'curly' && [[-34, -112], [-20, -128], [0, -134], [20, -128], [34, -112], [-42, -94], [42, -94]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={15} fill={hc} />)}
          {acc.hair === 'wild' && [[-46, -100, 16], [-40, -124, 17], [-24, -140, 16], [-4, -146, 16], [16, -142, 16], [34, -128, 17], [46, -104, 16], [-50, -80, 12], [50, -80, 12]].map(([a, b, r], i) => <circle key={i} cx={a} cy={b} r={r} fill={hc} />)}
          {acc.hair === 'longm' && <>
            <path d="M-47 -96 C-51 -154 51 -154 47 -96 C40 -110 24 -119 0 -117 C-24 -119 -40 -110 -47 -96 Z" fill={hc} />
            <path d="M0 -139 C-2 -130 -1 -123 0 -117" stroke={shade(hc, -0.4)} strokeWidth="2.5" fill="none" />
            <path d="M-44 -98 C-47 -80 -45 -62 -40 -50 L-35 -53 C-39 -66 -40 -82 -39 -98 Z" fill={hc} />
            <path d="M44 -98 C47 -80 45 -62 40 -50 L35 -53 C39 -66 40 -82 39 -98 Z" fill={hc} />
          </>}
          {acc.hair === 'pompadour' && <><path d="M-47 -86 C-55 -128 -42 -158 -6 -161 C32 -163 55 -136 47 -86 C44 -100 36 -110 22 -114 C10 -122 -10 -124 -24 -118 C-36 -112 -44 -100 -47 -86 Z" fill={hc} />
            <g stroke="rgba(0,0,0,.16)" strokeWidth="2.5" fill="none" strokeLinecap="round"><path d="M-26 -122 C-20 -142 4 -152 30 -144" /><path d="M-10 -126 C-2 -144 18 -150 40 -136" /><path d="M-36 -112 C-34 -134 -16 -148 10 -152" /></g>
            <path d="M-20 -140 C-10 -152 8 -156 22 -152" stroke="rgba(255,255,255,.3)" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
          {acc.hair === 'tonsure' && <><path d="M-47 -88 C-50 -100 -49 -110 -45 -118 C-30 -114 -15 -112 0 -112 C15 -112 30 -114 45 -118 C49 -110 50 -100 47 -88 C40 -98 24 -104 0 -104 C-24 -104 -40 -98 -47 -88 Z" fill={hc} />
            <path d="M-45 -118 C-30 -114 -15 -112 0 -112 C15 -112 30 -114 45 -118" stroke={shade(hc, -0.35)} strokeWidth="2" fill="none" /></>}
          {acc.hair === 'braids' && <>{[-40, -26, 26, 40].map((x, i) => <g key={x}>{Array.from({length: 7}, (_, k) => <ellipse key={k} cx={x + (k % 2 ? 2 : -2)} cy={-80 + k * 14} rx={7} ry={8} fill={k % 2 ? shade(hc, -0.15) : hc} />)}</g>)}
            <path d="M-47 -96 C-51 -154 51 -154 47 -96 C40 -110 24 -119 0 -117 C-24 -119 -40 -110 -47 -96 Z" fill={hc} /></>}
          {acc.hair === 'flowing' && <><path d="M-47 -96 C-51 -154 51 -154 47 -96 C40 -110 24 -119 0 -117 C-24 -119 -40 -110 -47 -96 Z" fill={hc} />
            <path d="M44 -110 C70 -100 86 -70 96 -40 C80 -54 70 -60 60 -62 C70 -40 72 -20 70 0 C60 -30 50 -50 42 -60 Z" fill={hc} /><path d="M-44 -100 C-50 -80 -48 -60 -42 -46 L-38 -96 Z" fill={hc} /></>}
          {acc.hair === 'waves' && <><path d="M-46 -80 C-54 -150 54 -150 46 -80 C40 -86 36 -96 34 -108 C22 -116 -16 -120 -30 -106 C-36 -98 -40 -88 -46 -80 Z" fill={hc} />
            {[-30, -10, 10, 30].map((x) => <path key={x} d={`M${x - 8} -128 q8 -8 16 0`} stroke={shade(hc, 0.25)} strokeWidth="3" fill="none" />)}</>}
          {acc.hair === 'updo' && <><ellipse cx={0} cy={-150} rx={30} ry={20} fill={hc} /><path d="M-47 -96 C-51 -154 51 -154 47 -96 C40 -110 24 -119 0 -117 C-24 -119 -40 -110 -47 -96 Z" fill={hc} /></>}
          {acc.hair === 'side' && <><path d="M-46 -104 C-50 -84 -46 -70 -40 -64 L-36 -100 Z" fill={hc} /><path d="M46 -104 C50 -84 46 -70 40 -64 L36 -100 Z" fill={hc} /></>}
          {acc.beard === 'long' && <path d="M-34 -72 C-34 -30 -14 0 0 30 C14 0 34 -30 34 -72 C24 -60 12 -55 0 -55 C-12 -55 -24 -60 -34 -72 Z" fill={bc} />}
          {acc.beard === 'short' && <path d="M-37 -74 C-35 -54 -18 -41 0 -39 C18 -41 35 -54 37 -74 C26 -61 14 -57 0 -57 C-14 -57 -26 -61 -37 -74 Z" fill={bc} />}
          {acc.beard === 'assyrian' && <g><path d="M-38 -74 C-38 -40 -32 -6 -28 18 L28 18 C32 -6 38 -40 38 -74 C26 -60 12 -56 0 -56 C-12 -56 -26 -60 -38 -74 Z" fill={bc} />
            {[-46, -30, -14, 2].map((yy, r) => [-24, -12, 0, 12, 24].map((xx) => <path key={r + '_' + xx} d={`M${xx + (r % 2) * 6 - 9} ${yy + 3} q6 -9 12 0`} stroke={shade(bc, 0.35)} strokeWidth="3" fill="none" strokeLinecap="round" />))}
            {[-22, -8, 6, 20].map((xx) => <rect key={xx} x={xx - 4} y={10} width={8} height={12} rx={3} fill={shade(bc, -0.2)} />)}</g>}
          {acc.beard === 'chin' && <path d="M-44 -96 C-46 -60 -36 -30 0 -22 C36 -30 46 -60 44 -96 C38 -70 30 -56 20 -50 C10 -46 -10 -46 -20 -50 C-30 -56 -38 -70 -44 -96 Z" fill={bc} />}
          {acc.beard === 'full' && <path d="M-44 -96 C-48 -50 -32 -14 0 -6 C32 -14 48 -50 44 -96 C36 -70 20 -58 0 -58 C-20 -58 -36 -70 -44 -96 Z" fill={bc} />}
          {acc.beard === 'goatee' && <path d="M-11 -58 C-9 -44 -4 -36 0 -32 C4 -36 9 -44 11 -58 Z" fill={bc} />}
          {(acc.beard === 'mustache' || acc.beard === 'short' || acc.beard === 'long') && <path d="M-19 -64 C-11 -71 -4 -68 0 -65 C4 -68 11 -71 19 -64 C11 -59 4 -61 0 -62 C-4 -61 -11 -59 -19 -64 Z" fill={bc} />}
          {acc.hat === 'wizard' && <><path d="M-52 -116 L0 -230 L52 -116 Z" fill={hatC || '#2B3FA8'} />{[[-12, -150], [14, -176], [-2, -200], [20, -136]].map(([a, b], i) => <text key={i} x={a} y={b} fontSize="16" fill="#E8E8FF">★</text>)}</>}
          {acc.hat === 'fedora' && <><ellipse cx={0} cy={-122} rx={62} ry={11} fill={hatC} /><path d="M-36 -122 C-38 -160 -20 -168 0 -160 C20 -168 38 -160 36 -122 Z" fill={hatC} /><rect x={-36} y={-132} width={72} height={8} fill="#000" opacity=".5" /></>}
          {acc.hat === 'cap' && <><path d="M-48 -100 C-50 -146 50 -146 48 -100 C34 -118 -34 -118 -48 -100 Z" fill={hatC} /><path d="M-48 -104 L-50 -66 C-44 -60 -38 -60 -34 -66 L-34 -108 Z" fill={hatC} /><path d="M48 -104 L50 -66 C44 -60 38 -60 34 -66 L34 -108 Z" fill={hatC} /></>}
          {acc.hat === 'skull' && <path d="M-34 -122 C-28 -146 28 -146 34 -122 C20 -130 -20 -130 -34 -122 Z" fill={hatC} />}
          {acc.hat === 'crown' && <path d="M-36 -122 L-36 -158 L-18 -138 L0 -164 L18 -138 L36 -158 L36 -122 Z" fill="#E8B923" stroke="#A67C00" strokeWidth="3" />}
          {acc.hat === 'turban' && <><ellipse cx={0} cy={-124} rx={50} ry={30} fill={hatC || '#2D6CDF'} /><circle cx={0} cy={-122} r={8} fill="#E33" /><path d="M0 -130 C6 -170 22 -176 26 -170" stroke="#3C3" strokeWidth="6" fill="none" /></>}
          {acc.hat === 'helmet' && <path d="M-50 -98 C-50 -150 50 -150 50 -98 Z" fill={hatC || '#8A8F98'} />}
          {acc.hat === 'grad' && <><path d="M-60 -132 L0 -150 L60 -132 L0 -114 Z" fill="#111" /><rect x={-28} y={-132} width={56} height={18} fill="#111" /></>}
          {acc.hat === 'nemes' && (() => { const f = acc.hatFabric ? `url(#hat${uid})` : `url(#nst${uid})`; return <g stroke="#7a5a10" strokeWidth="3">
            <path d="M-52 -106 L-38 -102 L-40 -60 L-44 20 L-70 20 L-60 -60 Z" fill={f} />
            <path d="M52 -106 L38 -102 L40 -60 L44 20 L70 20 L60 -60 Z" fill={f} />
            <path d="M-52 -104 C-56 -154 56 -154 52 -104 C30 -114 -30 -114 -52 -104 Z" fill={f} />
            <path d="M-50 -106 C-30 -116 30 -116 50 -106 L50 -100 C30 -110 -30 -110 -50 -100 Z" fill="#D4A62A" strokeWidth="1.5" />
            <path d="M0 -156 C10 -156 12 -144 6 -138 L0 -130 L-6 -138 C-12 -144 -10 -156 0 -156 Z" fill="#D4A62A" strokeWidth="1.5" />
          </g>; })()}
          {acc.beard === 'pharaoh' && <g><path d="M-5 -52 L5 -52 L6 -26 C6 -22 -6 -22 -6 -26 Z" fill="#3a2a10" stroke="#D4A62A" strokeWidth="1.5" /><line x1="-6" y1="-44" x2="6" y2="-44" stroke="#D4A62A" strokeWidth="1.5" /><line x1="-6" y1="-36" x2="6" y2="-36" stroke="#D4A62A" strokeWidth="1.5" /></g>}
          {acc.hat === 'top' && <><ellipse cx={0} cy={-124} rx={56} ry={9} fill={hatC} /><rect x={-34} y={-196} width={68} height={74} rx={4} fill={hatC} /></>}
        </g>
        {hair && hair.long && <clipPath id={`hc${uid}`}><rect x={-200} y={-260} width={400} height={260 - 136 + 0.42 * 88} /></clipPath>}
        {hair && <image href={staticFile(hair.src)} {...hairBox(hair)} clipPath={hair.long ? `url(#hc${uid})` : undefined} />}
        {photoHat && photoHat.front !== false && <image href={staticFile(`${photoHat.dir || "assets"}/${photoHat.id}_front.png`)} {...photoBox(photoHat)} />}
        {photoAcc.filter((a) => a.layer === 'ring').map((a) => <image key={a.id + 'f'} href={accSrc(a, 'front')} {...accBox(a)} />)}
        {photoAcc.filter((a) => a.layer === 'face').map((a) => <image key={a.id} href={accSrc(a)} {...accBox(a)} />)}
        {acc.glasses && <g stroke={C.ink} strokeWidth="4" fill="none"><circle cx={-16} cy={-94} r={12} /><circle cx={16} cy={-94} r={12} /><line x1={-4} y1={-94} x2={4} y2={-94} /></g>}
      </g>
      {fronts.filter((p) => p.at === 'neck').map((p, i) => <FrontPiece key={'n' + i} {...p} />)}
      {armsTop}
    </svg>
  );
};

// ---------- lote 1 de faltantes: cuerpo y poses ----------
const WOOD = 'linear-gradient(180deg,#8A5A32,#5E3B1E)';
/** Bebé envuelto en pañales. x,y = centro; s = escala; cloth = color del paño */
export const Baby = ({x, y, s = 1, cloth = '#F2EBDD', at = null, rot = 0}) => {
  const p0 = usePop(at == null ? -1000 : at); const p = at == null ? 1 : p0;
  return <svg width={160 * s} height={100 * s} viewBox="-80 -50 160 100" style={{position: 'absolute', left: x - 80 * s, top: y - 50 * s, transform: `scale(${p}) rotate(${rot}deg)`, overflow: 'visible', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.3))'}}>
    <TexDefs /><path d="M-70 -6 C-70 -34 -30 -38 10 -30 C44 -24 66 -10 66 6 C66 26 30 34 -10 32 C-50 30 -70 20 -70 -6 Z" fill={cloth} filter={`url(#${TEX})`} />
    {[-30, -8, 14, 36].map((xx) => <path key={xx} d={`M${xx} -28 C${xx + 6} -6 ${xx + 4} 14 ${xx - 2} 30`} stroke={shade(cloth, -0.18)} strokeWidth="3" fill="none" />)}
    <circle cx={-48} cy={-6} r={24} fill="url(#head)" /><path d="M-72 -6 C-74 -32 -54 -38 -40 -32 L-44 18 C-60 20 -72 10 -72 -6 Z" fill={cloth} filter={`url(#${TEX})`} /></svg>;
};
/** Sentado: la figura baja y aparece un banco/silla delante, con el regazo. (x,y) = los mismos de la Figure; color = color de la ropa; seat: 'stool'|'chair'|'rock' */
export const Seated = ({x, y, s = 1, color = null, seat = 'stool', at = null, children}) => {
  const f = useCurrentFrame(); const t = at == null ? 1 : ramp(f, at, at + 10, Easing.out(Easing.cubic)); const d = 46 * s * t; const ys = y + 112 * s;
  const seatEl = seat === 'rock' ? <div style={{position: 'absolute', left: x - 90 * s, top: ys + 6 * s, width: 180 * s, height: 70 * s, borderRadius: `${40 * s}px ${50 * s}px ${10 * s}px ${10 * s}px`, background: 'linear-gradient(180deg,#9A9184,#6B645A)'}} />
    : <><div style={{position: 'absolute', left: x - 70 * s, top: ys + 6 * s, width: 140 * s, height: 16 * s, borderRadius: 6 * s, background: WOOD}} />
      {[-58, 46].map((dx) => <div key={dx} style={{position: 'absolute', left: x + dx * s, top: ys + 20 * s, width: 12 * s, height: 62 * s, background: '#5E3B1E'}} />)}
      {seat === 'chair' && <div style={{position: 'absolute', left: x - 66 * s, top: ys - 150 * s, width: 132 * s, height: 160 * s, borderRadius: `${10 * s}px ${10 * s}px 0 0`, background: WOOD, zIndex: -1}} />}</>;
  return <>{seat === 'chair' && seatEl}<AbsoluteFill style={{transform: `translateY(${d}px)`, clipPath: `inset(0 0 ${H - ys - 8 * s}px 0)`}}>{children}</AbsoluteFill>
    {seat !== 'chair' && seatEl}{seat === 'chair' && <><div style={{position: 'absolute', left: x - 70 * s, top: ys + 6 * s, width: 140 * s, height: 16 * s, borderRadius: 6 * s, background: WOOD}} />
      {[-58, 46].map((dx) => <div key={dx} style={{position: 'absolute', left: x + dx * s, top: ys + 20 * s, width: 12 * s, height: 62 * s, background: '#5E3B1E'}} />)}</>}
    <div style={{position: 'absolute', left: x - 48 * s, top: ys - 20 * s, width: 96 * s, height: 30 * s, borderRadius: 15 * s, background: color || 'linear-gradient(180deg,#fff,#D5DCE6)', boxShadow: '0 4px 6px rgba(0,0,0,.2)'}} /></>;
};
/** Acostado: gira la figura (cabeza a la izquierda) sobre una cama, camilla o el suelo. (x,y) = los de la Figure. rise = frame en que se levanta (resucitar/sanar) */
export const Lying = ({x, y, s = 1, bed = 'bed', rise = null, dur = 18, cloth = '#E9E2D2', snd = '26_coro', children}) => {
  const f = useCurrentFrame(); const r = rise == null ? 0 : ramp(f, rise, rise + dur, Easing.inOut(Easing.cubic));
  const by = y + 26 * s; const ang = -90 * (1 - r);
  const bedEl = bed === 'ground' ? null : <><div style={{position: 'absolute', left: x - 190 * s, top: by, width: 380 * s, height: (bed === 'stretcher' ? 16 : 34) * s, borderRadius: 8 * s, background: bed === 'stretcher' ? '#C8B48A' : cloth, boxShadow: '0 8px 12px rgba(0,0,0,.3)'}} />
    {bed === 'bed' && [-180, 166].map((dx) => <div key={dx} style={{position: 'absolute', left: x + dx * s, top: by + 30 * s, width: 14 * s, height: 50 * s, background: '#5E3B1E'}} />)}
    {bed === 'stretcher' && [-200, 180].map((dx) => <div key={dx} style={{position: 'absolute', left: x + dx * s, top: by + 2 * s, width: 20 * s, height: 10 * s, background: '#7A5530', borderRadius: 4 * s}} />)}</>;
  return <><SndAt at={rise} snd={rise == null ? null : snd} vol={0.4} />{bedEl}
    <AbsoluteFill style={{transform: `rotate(${ang}deg)`, transformOrigin: `${x}px ${y + (1 - r) * 0}px`, filter: r > 0 && r < 1 ? `brightness(${1 + 0.6 * Math.sin(Math.PI * r)})` : undefined}}>{children}</AbsoluteFill></>;
};
/** Postrado rostro en tierra (vista de frente): la figura baja y se transforma en una silueta inclinada con la cabeza en el piso y los brazos adelante.
 *  color = color de la ropa; hair = color del pelo (opcional). at = inicio */
export const Prostrate = ({at = 0, x, y, s = 1, dur = 16, color = '#E8DCC0', hair = null, snd = '52_madera', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const base = y + 150 * s;
  const a = ramp(f, at + dur * 0.35, at + dur * 0.75); const fy = base - 10 * s;
  return <><SndAt at={at + dur} snd={at > 0 ? snd : null} vol={0.3} />
    <AbsoluteFill style={{opacity: 1 - a, transform: `translateY(${t * 120 * s}px)`, clipPath: `inset(0 0 ${H - base}px 0)`}}>{children}</AbsoluteFill>
    <svg width={300 * s} height={160 * s} viewBox="-150 -140 300 160" style={{position: 'absolute', left: x - 150 * s, top: fy - 140 * s + 10 * s, opacity: a, overflow: 'visible', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.3))'}}>
      <TexDefs /><path d="M-95 10 C-100 -70 -50 -110 0 -110 C50 -110 100 -70 95 10 Z" fill={color} filter={`url(#${TEX})`} />
      <path d="M-95 10 C-100 -70 -50 -110 0 -110 C50 -110 100 -70 95 10 Z" fill="url(#body)" opacity=".18" />
      <rect x={-140} y={-6} width={80} height={22} rx={11} fill={color} /><rect x={60} y={-6} width={80} height={22} rx={11} fill={color} />
      <ellipse cx={0} cy={-8} rx={40} ry={26} fill="url(#head)" />{hair && <path d="M-40 -10 C-40 -40 40 -40 40 -10 C30 -24 -30 -24 -40 -10 Z" fill={hair} />}</svg></>;
};
/** Crucificado: cruz de madera detrás (usar la Figure con pose="cross" y bob={false}). sign = texto del letrero (INRI) */
export const Crucified = ({x, y, s = 1, sign = 'INRI', at = null, children}) => {
  const p0 = usePop(at == null ? -1000 : at); const p = at == null ? 1 : p0;
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${p})`, transformOrigin: `${x}px ${y + 400 * s}px`}}>
    <div style={{position: 'absolute', left: x - 16 * s, top: y - 230 * s, width: 32 * s, height: 700 * s, background: WOOD, boxShadow: '0 0 20px rgba(0,0,0,.4)'}} />
    <div style={{position: 'absolute', left: x - 160 * s, top: y - 32 * s, width: 320 * s, height: 28 * s, background: WOOD}} />
    {sign && <div style={{position: 'absolute', left: x - 40 * s, top: y - 214 * s, width: 80 * s, height: 30 * s, background: '#E8DDC4', fontFamily: 'Cinzel', fontWeight: 700, fontSize: 20 * s, color: '#3A2614', textAlign: 'center', lineHeight: `${30 * s}px`}}>{sign}</div>}
    {children}</div>;
};
/** Cargando la cruz: la viga va sobre el hombro derecho y arrastra hacia abajo a la izquierda (Figure con pose="carry") */
export const CarryCross = ({x, y, s = 1, children}) => {
  const ang = 50, rad = (ang * Math.PI) / 180, tx = x + 120 * s, ty = y - 190 * s, len = 620 * s, bw = 30 * s;
  const cx = tx - Math.sin(rad) * 70 * s, cy = ty + Math.cos(rad) * 70 * s;
  return <>{children}
    <div style={{position: 'absolute', left: tx - bw / 2, top: ty, width: bw, height: len, background: WOOD, transform: `rotate(${ang}deg)`, transformOrigin: `${bw / 2}px 0px`, boxShadow: '0 6px 12px rgba(0,0,0,.35)'}} />
    <div style={{position: 'absolute', left: cx - 110 * s, top: cy - 13 * s, width: 220 * s, height: 26 * s, background: WOOD, transform: `rotate(${ang}deg)`, transformOrigin: '50% 50%', boxShadow: '0 4px 8px rgba(0,0,0,.3)'}} /></>;
};
/** Púlpito delante de la figura. kind: 'wood' (iglesia antigua) | 'field' (cajón de campo) | 'modern' (atril) */
export const Pulpit = ({x, y, s = 1, kind = 'wood', book = true, children}) => {
  const top = y + 30 * s;
  const st = kind === 'modern' ? {left: x - 70 * s, top, width: 140 * s, height: 130 * s, background: 'linear-gradient(180deg,rgba(220,235,255,.55),rgba(170,190,215,.45))', border: `${3 * s}px solid rgba(255,255,255,.7)`, borderRadius: 6 * s}
    : kind === 'field' ? {left: x - 80 * s, top: top + 30 * s, width: 160 * s, height: 100 * s, background: 'repeating-linear-gradient(180deg,#9A6B3E 0,#9A6B3E 22px,#7E5530 22px,#7E5530 26px)', borderRadius: 4 * s}
    : {left: x - 95 * s, top, width: 190 * s, height: 140 * s, background: WOOD, clipPath: 'polygon(0 0,100% 0,88% 100%,12% 100%)', boxShadow: 'inset 0 10px 0 #A87444'};
  return <>{children}<div style={{position: 'absolute', ...st, boxShadow: (st.boxShadow ? st.boxShadow + ',' : '') + '0 10px 14px rgba(0,0,0,.35)'}} />
    {book && kind !== 'field' && <div style={{position: 'absolute', left: x - 44 * s, top: top - 12 * s, width: 88 * s, height: 14 * s, background: '#F2EBDD', borderTop: `${4 * s}px solid #6B1F1F`, borderRadius: 3 * s, transform: 'perspective(200px) rotateX(35deg)'}} />}</>;
};
/** Escribiendo: figura detrás de un escritorio con papel y pluma que se mueve (Figure con pose="write"). from..to = frames en que escribe */
export const Writer = ({x, y, s = 1, from = 0, to = 60, quill = true, snd = '20_pluma', children}) => {
  const f = useCurrentFrame(); const w = f >= from && f <= to ? Math.sin(f * 0.9) * 6 * s : 0; const top = y + 34 * s;
  return <>{children}<SndAt at={from} snd={snd} vol={0.3} />
    <div style={{position: 'absolute', left: x - 150 * s, top, width: 300 * s, height: 24 * s, background: WOOD, borderRadius: 4 * s, boxShadow: '0 10px 14px rgba(0,0,0,.35)'}} />
    <div style={{position: 'absolute', left: x - 140 * s, top: top + 24 * s, width: 280 * s, height: 100 * s, background: 'linear-gradient(180deg,#6E4626,#4E3018)'}} />
    <div style={{position: 'absolute', left: x - 60 * s, top: top - 8 * s, width: 110 * s, height: 12 * s, background: '#EFE6D2', transform: 'perspective(200px) rotateX(40deg)'}} />
    {quill && <div style={{position: 'absolute', left: x + 34 * s + w, top: top - 62 * s, width: 6 * s, height: 66 * s, background: 'linear-gradient(180deg,#fff,#d9d2c4)', borderRadius: `${8 * s}px ${8 * s}px 1px 1px`, transform: 'rotate(18deg)', transformOrigin: 'bottom'}} />}</>;
};
/** Movimiento de cámara lento sobre una foto de fondo (Ken Burns). from/to = {x, y, z} en px y zoom */
export const KenBurns = ({src, dur, from = {x: 0, y: 0, z: 1.04}, to = {x: -30, y: -20, z: 1.14}, children}) => {
  const f = useCurrentFrame(); const t = interpolate(f, [0, dur], [0, 1], {...cl, easing: Easing.inOut(Easing.quad)});
  const L = (a, b) => a + (b - a) * t;
  return <AbsoluteFill style={{overflow: 'hidden'}}><Img src={staticFile(src)} style={{position: 'absolute', width: W, height: H, objectFit: 'cover', transform: `translate(${L(from.x, to.x)}px, ${L(from.y, to.y)}px) scale(${L(from.z, to.z)})`}} />{children}</AbsoluteFill>;
};
/** Presencia de Dios sin figura humana: haz de luz desde arriba (light) o nube luminosa (cloud), con la voz escrita (text) y coro. Regla del canal: Dios nunca como figura humana */
export const Divine = ({at = 0, kind = 'light', text, textAt, y = 520, size = 64, snd = '26_coro'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 20); const tt = textAt == null ? at + 14 : textAt; const pt = ramp(f, tt, tt + 14);
  return <><SndAt at={at} snd={snd} vol={0.45} />
    <AbsoluteFill style={{opacity: t, pointerEvents: 'none'}}>
      {kind === 'light' ? <div style={{position: 'absolute', left: W / 2 - 330, top: -100, width: 660, height: H + 200, background: 'linear-gradient(180deg,rgba(255,248,220,.95),rgba(255,240,200,.35) 55%,rgba(255,240,200,0))', clipPath: 'polygon(38% 0,62% 0,100% 100%,0 100%)', filter: 'blur(18px)'}} />
        : <>{[[-260, 80, 300], [0, 40, 380], [250, 90, 320], [-120, 170, 260], [140, 170, 280]].map(([dx, yy, r], i) => <div key={i} style={{position: 'absolute', left: W / 2 + dx - r / 2, top: yy + Math.sin(f / 30 + i) * 6, width: r, height: r * 0.6, borderRadius: '50%', background: 'radial-gradient(ellipse, #FFFDF4 30%, rgba(255,250,230,0) 72%)', filter: 'blur(6px)'}} />)}
          <div style={{position: 'absolute', left: W / 2 - 300, top: 240, width: 600, height: H, background: 'linear-gradient(180deg,rgba(255,248,220,.6),rgba(255,248,220,0) 70%)', clipPath: 'polygon(30% 0,70% 0,95% 100%,5% 100%)', filter: 'blur(14px)'}} /></>}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 8%, rgba(255,246,214,.55), transparent 55%)'}} />
    </AbsoluteFill>
    {text && <div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: 'Cinzel', fontWeight: 700, fontSize: size, color: '#FFF8E1', opacity: pt, transform: `scale(${0.92 + 0.08 * pt})`, textShadow: '0 0 24px rgba(255,220,140,.9), 0 2px 6px rgba(0,0,0,.5)', padding: '0 70px', boxSizing: 'border-box', lineHeight: 1.2}}>{text}</div>}</>;
};

// ---------- lote 3: acciones entre personajes y milagros ----------
/** Dos figuras que se acercan y se abrazan. a, b = props de Figure; x = centro; gap = distancia inicial entre ellas */
export const Hug = ({at, x = W / 2, y, s = 2, gap = 520, a = {}, b = {}, dur = 16, snd = '75_suspiro'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const d = (gap / 2) * (1 - t) + 34 * s * t;
  const pose = t > 0.7 ? 'hold' : 'open';
  return <><SndAt at={at + dur} snd={snd} vol={0.35} /><Figure x={x - d} y={y} s={s} {...a} pose={pose} /><Figure x={x + d} y={y} s={s} flip {...b} pose={pose} />
    {t >= 1 && <Emote at={at + dur} x={x} y={y - 260 * s} type="hearts" />}</>;
};
/** Apretón de manos / pacto: se acercan, se dan la mano (destello) */
export const Handshake = ({at, x = W / 2, y, s = 2, gap = 500, a = {}, b = {}, dur = 14, snd = '50_clink'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const d = (gap / 2) * (1 - t) + 70 * s * t;
  const shake = f > at + dur && f < at + dur + 16 ? Math.sin((f - at - dur) * 1.2) * 5 * s : 0;
  return <><SndAt at={at + dur} snd={snd} vol={0.4} /><Figure x={x - d} y={y} s={s} {...a} pose={t > 0.6 ? 'point' : 'idle'} /><Figure x={x + d} y={y} s={s} flip {...b} pose={t > 0.6 ? 'point' : 'idle'} />
    {t >= 1 && <div style={{position: 'absolute', left: x - 22 * s, top: y - 28 * s + shake, width: 44 * s, height: 30 * s, borderRadius: 14 * s, background: 'radial-gradient(circle, #FFF6D6, rgba(255,246,214,0))'}} />}</>;
};
/** Entregar un objeto: el objeto (src) viaja en arco de las manos de a a las de b */
export const Give = ({at, x = W / 2, y, s = 2, gap = 420, a = {}, b = {}, src, w = 90, dur = 20, snd = '04_whoosh_corto'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const x0 = x - gap / 2 + 60 * s, x1 = x + gap / 2 - 60 * s;
  const ox = x0 + (x1 - x0) * t, oy = y + 10 * s - Math.sin(Math.PI * t) * 90 * s;
  return <><SndAt at={at} snd={snd} vol={0.4} /><Figure x={x - gap / 2} y={y} s={s} {...a} pose={t < 0.5 ? 'hold' : 'idle'} /><Figure x={x + gap / 2} y={y} s={s} flip {...b} pose={t > 0.5 ? 'hold' : 'idle'} />
    <Img src={staticFile(src)} style={{position: 'absolute', left: ox - (w * s) / 2, top: oy - (w * s) / 2, width: w * s, height: w * s, objectFit: 'contain', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.35))'}} /></>;
};
/** Correr: como Walk pero más rápido, inclinado y con líneas de velocidad */
export const Run = ({at = 0, dur = 20, fromX, toX, y = 0, steps = 10, snd = '25_pasos', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.quad)); const on = f >= at && f <= at + dur;
  const k = on ? Math.abs(Math.sin(t * steps * Math.PI)) * -22 : 0; const dir = Math.sign(toX - fromX) || 1;
  return <><SndAt at={at} snd={snd} vol={0.5} /><AbsoluteFill style={{transform: `translate(${fromX + (toX - fromX) * t}px, ${y + k}px) rotate(${on ? dir * 8 : 0}deg)`}}>{children}
    {on && [0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: W / 2 - dir * (160 + i * 40) - 60, top: H * 0.5 + i * 60, width: 120, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.5)'}} />)}</AbsoluteFill></>;
};
/** Bautismo: b se sumerge hacia atrás en el agua y sale (a lo sostiene). water = altura del agua desde abajo */
export const Baptize = ({at, x = W / 2, y, s = 2, a = {}, b = {}, water = 0.38, dur = 30, snd = '58_chapoteo'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur * 0.4, Easing.inOut(Easing.cubic)) * (1 - ramp(f, at + dur * 0.6, at + dur, Easing.inOut(Easing.cubic)));
  const wy = H * (1 - water); const splash = f > at + dur * 0.4 && f < at + dur * 0.75;
  return <><SndAt at={at + dur * 0.4} snd={snd} vol={0.5} /><SndAt at={at + dur * 0.85} snd={snd} vol={0.4} />
    <Figure x={x - 120 * s} y={y} s={s} {...a} pose="hold" />
    <AbsoluteFill style={{transform: `rotate(${-75 * t}deg) translateY(${t * 60 * s}px)`, transformOrigin: `${x + 40 * s}px ${y + 150 * s}px`}}><Figure x={x + 40 * s} y={y} s={s} bob={false} {...b} pose="pray" /></AbsoluteFill>
    <div style={{position: 'absolute', left: 0, top: wy, width: W, height: H - wy, background: 'linear-gradient(180deg,rgba(90,160,200,.78),rgba(40,90,140,.92))', borderTop: '6px solid rgba(220,240,255,.7)'}} />
    {splash && Array.from({length: 10}, (_, i) => <div key={i} style={{position: 'absolute', left: x + (i - 5) * 22, top: wy - 30 - Math.abs(Math.sin(i * 1.7 + f / 3)) * 60, width: 14, height: 14, borderRadius: '50%', background: 'rgba(220,240,255,.85)'}} />)}</>;
};
/** Unción: aceite que cae del cuerno sobre la cabeza (x, y = centro de la cabeza) y brillo */
export const Anoint = ({at, x, y, s = 2, src = 'objetos/culto_y_sagrado/cuerno_aceite.png', snd = '11_brillo'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const pour = ramp(f, at + 8, at + 26); const glow = ramp(f, at + 20, at + 30) * (1 - ramp(f, at + 40, at + 55));
  return <><SndAt at={at + 20} snd={snd} vol={0.5} />
    <Img src={staticFile(src)} style={{position: 'absolute', left: x + 10 * s, top: y - 150 * s, width: 90 * s, transform: `scale(${p}) rotate(${-30 - 50 * pour}deg)`, transformOrigin: '20% 80%'}} />
    {pour > 0 && pour < 1 && Array.from({length: 6}, (_, i) => <div key={i} style={{position: 'absolute', left: x + 6 * s, top: y - 80 * s + ((f * 9 + i * 18) % (60 * s)), width: 7 * s, height: 12 * s, borderRadius: '50%', background: '#E8C35A', opacity: 0.9}} />)}
    <div style={{position: 'absolute', left: x - 120 * s, top: y - 120 * s, width: 240 * s, height: 240 * s, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,230,150,.75), rgba(255,230,150,0) 65%)', opacity: glow}} /></>;
};
/** Imposición de manos: a con la mano sobre la cabeza de b (ponerlas cerca) + luz sobre b. x,y = centro de la cabeza de b */
export const LayHands = ({at, x, y, s = 2, snd = '26_coro'}) => {
  const f = useCurrentFrame(); const g = ramp(f, at, at + 14) * (1 - ramp(f, at + 40, at + 60));
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: x - 130 * s, top: y - 150 * s, width: 260 * s, height: 300 * s, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,240,190,.7), rgba(255,240,190,0) 60%)', opacity: g}} />
    {g > 0.2 && Array.from({length: 8}, (_, i) => <div key={i} style={{position: 'absolute', left: x + Math.cos(i + f / 10) * 70 * s, top: y - 40 * s + Math.sin(i * 2 + f / 8) * 60 * s, width: 8, height: 8, borderRadius: '50%', background: '#FFF4C8', opacity: g}} />)}</>;
};
/** Sanar: la figura se ilumina, aparecen destellos y (opcional) se endereza. Envuelve la Figure; (x,y) = centro */
export const Heal = ({at, x, y, s = 2, dur = 24, straighten = 0, snd = '31_glitter', children}) => {
  const f = useCurrentFrame(); const g = Math.sin(Math.PI * ramp(f, at, at + dur)); const st = ramp(f, at + dur * 0.3, at + dur * 0.7, Easing.out(Easing.back(1.6)));
  return <><SndAt at={at} snd={snd} vol={0.5} /><SndAt at={at + dur * 0.6} snd="15_positivo" vol={0.35} />
    <AbsoluteFill style={{filter: `brightness(${1 + 0.7 * g}) drop-shadow(0 0 ${30 * g}px rgba(255,236,170,${g}))`, transform: `rotate(${straighten * (1 - st)}deg)`, transformOrigin: `${x}px ${y + 150 * s}px`}}>{children}</AbsoluteFill>
    {g > 0.1 && Array.from({length: 12}, (_, i) => { const a = i * 0.52 + f / 12; return <div key={i} style={{position: 'absolute', left: x + Math.cos(a) * 140 * s, top: y + Math.sin(a) * 160 * s - 20 * s, fontSize: 30 * s, color: '#FFF0B8', opacity: g, transform: `scale(${0.5 + 0.5 * Math.sin(f / 3 + i)})`}}>✦</div>; })}</>;
};
/** Caminar sobre el agua: superficie con olas; sink = frame en que empieza a hundirse (Pedro). Envuelve la Figure; base = y de los pies */
export const WaterWalk = ({base, sink = null, children}) => {
  const f = useCurrentFrame(); const d = sink == null ? 0 : ramp(f, sink, sink + 24, Easing.in(Easing.quad)) * 170; const bob = Math.sin(f / 10) * 6;
  return <><SndAt at={sink} snd={sink == null ? null : '58_chapoteo'} vol={0.5} /><AbsoluteFill style={{transform: `translateY(${d + bob}px)`, clipPath: `inset(0 0 ${H - base - 14}px 0)`}}>{children}</AbsoluteFill>
    <svg width={W} height={H - base + 40} style={{position: 'absolute', left: 0, top: base - 30}}>{[0, 1, 2].map((k) => <path key={k} d={`M0 ${30 + k * 26} ${Array.from({length: 13}, (_, i) => `Q${i * 90 + 45} ${30 + k * 26 + Math.sin(f / 8 + i + k) * 12} ${(i + 1) * 90} ${30 + k * 26}`).join(' ')} L${W} ${H} L0 ${H} Z`} fill={['rgba(70,120,160,.85)', 'rgba(50,95,135,.9)', 'rgba(35,70,105,.95)'][k]} />)}</svg></>;
};
/** Fuego que baja del cielo sobre un punto (altar, ciudad) */
export const FireFromSky = ({at, x = W / 2, y, w = 260, dur = 18, snd = '32_explosion'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 8); const fade = 1 - ramp(f, at + dur, at + dur + 14);
  return <><SndAt at={at} snd={snd} vol={0.5} /><SndAt at={at + 4} snd="62_fuego" vol={0.4} />
    <div style={{position: 'absolute', left: x - w / 2, top: 0, width: w, height: y * t, background: 'linear-gradient(180deg,rgba(255,240,180,.95),rgba(255,140,40,.95) 70%,rgba(255,80,20,.9))', filter: 'blur(10px)', opacity: fade, borderRadius: `0 0 ${w / 2}px ${w / 2}px`}} />
    <div style={{position: 'absolute', inset: 0, background: 'rgba(255,170,80,.25)', opacity: t * fade}} />
    {t >= 1 && <Fire at={at + 6} x={x} y={y + 40} w={w * 1.3} h={w * 1.6} snd={null} />}</>;
};
/** Clavar un papel en una puerta (Lutero): el papel se pega con 4 martillazos y la pantalla tiembla */
export const NailPaper = ({at, x = W / 2, y = 800, w = 420, h = 560, text = '95 tesis', snd = '52_madera'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const hits = [at + 10, at + 18, at + 26, at + 34]; const sh = hits.some((k) => f >= k && f < k + 4) ? (f % 2 ? 6 : -6) : 0;
  return <>{hits.map((k, i) => <SndAt key={i} at={k} snd={snd} vol={0.6} />)}
    <div style={{position: 'absolute', left: x - w / 2 + sh, top: y - h / 2, width: w, height: h, background: '#F1E8D2', boxShadow: '0 12px 24px rgba(0,0,0,.4)', transform: `scale(${p}) rotate(-2deg)`, padding: 30, boxSizing: 'border-box', fontFamily: 'IM Fell English', fontSize: 42, color: '#2A1A0C', textAlign: 'center'}}>{text}
      {Array.from({length: 9}, (_, i) => <div key={i} style={{height: 6, margin: '22px 10px 0', background: 'rgba(42,26,12,.35)', borderRadius: 3, width: `${70 + (i * 37) % 30}%`}} />)}
      {hits.map((k, i) => f >= k && <div key={i} style={{position: 'absolute', left: [16, w - 34, 16, w - 34][i], top: [16, 16, h - 34, h - 34][i], width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#bbb,#444)'}} />)}</div></>;
};
/** Barco navegando (foto), con oleaje; storm = mar picado y balanceo fuerte */
export const Sail = ({at = 0, src = 'objetos/objetos_cotidianos/bote.png', fromX = -300, toX = W + 300, y = 1250, w = 520, dur = 120, storm = false, snd = '59_viento'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.linear); const amp = storm ? 14 : 4; const rot = Math.sin(f / (storm ? 6 : 14)) * amp; const bob = Math.sin(f / (storm ? 5 : 12)) * amp * 1.6;
  return <><SndAt at={at} snd={snd} vol={0.3} /><Img src={staticFile(src)} style={{position: 'absolute', left: fromX + (toX - fromX) * t - w / 2, top: y - w * 0.6 + bob, width: w, transform: `rotate(${rot}deg)`, transformOrigin: '50% 80%', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,.35))'}} />
    <svg width={W} height={H - y + 60} style={{position: 'absolute', left: 0, top: y - 40}}>{[0, 1].map((k) => <path key={k} d={`M0 ${30 + k * 30} ${Array.from({length: 13}, (_, i) => `Q${i * 90 + 45} ${30 + k * 30 + Math.sin(f / (storm ? 4 : 9) + i + k) * (storm ? 26 : 10)} ${(i + 1) * 90} ${30 + k * 30}`).join(' ')} L${W} ${H} L0 ${H} Z`} fill={['rgba(60,110,150,.85)', 'rgba(35,75,110,.95)'][k]} />)}</svg></>;
};
/** Cárcel: barrotes que bajan delante de la figura; release = frame en que suben (liberación) */
export const Jail = ({at, x = W / 2, y = 960, w = 520, h = 760, release = null, snd = '24_candado'}) => {
  const f = useCurrentFrame(); const down = ramp(f, at, at + 10, Easing.out(Easing.bounce)); const up = release == null ? 0 : ramp(f, release, release + 16, Easing.in(Easing.cubic));
  const off = -h * (1 - down) - h * 1.2 * up;
  return <><SndAt at={at + 8} snd={snd} vol={0.5} />{release != null && <SndAt at={release} snd="23_cadena" vol={0.5} />}
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 + off, width: w, height: h}}>
      {Array.from({length: 7}, (_, i) => <div key={i} style={{position: 'absolute', left: (i * (w - 22)) / 6, top: 0, width: 22, height: h, borderRadius: 11, background: 'linear-gradient(90deg,#3A3A3E,#8A8A90 40%,#3A3A3E)'}} />)}
      {[0.12, 0.88].map((k) => <div key={k} style={{position: 'absolute', left: -10, top: h * k, width: w + 20, height: 22, borderRadius: 6, background: 'linear-gradient(180deg,#5A5A60,#2A2A2E)'}} />)}</div></>;
};
/** Montado sobre un animal (foto): la figura queda sentada sobre el lomo. animal = ruta de la foto; (x,y) = los de la Figure */
export const Mounted = ({x, y, s = 2, animal = 'objetos/animales/burro.png', w = 420, dx = 0, flipAnimal = false, children}) => {
  const W2 = w * s, back = y + 95 * s;   // lomo del animal a la altura de la cintura de la figura
  return <><Img src={staticFile(animal)} style={{position: 'absolute', left: x - W2 / 2 + dx, top: back - W2 * 0.22, width: W2, transform: flipAnimal ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.35))'}} />
    <AbsoluteFill style={{clipPath: `inset(0 0 ${H - back - 10 * s}px 0)`}}>{children}</AbsoluteFill></>;
};
/** Lanzar: un proyectil (piedra o lanza) sale de la mano y vuela en arco hasta (toX,toY). from = posición de la mano */
export const Throw = ({at, fromX, fromY, toX, toY, kind = 'stone', dur = 14, arc = 160, snd = '04_whoosh_corto', hit = '07_impacto'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur); if (f < at || f > at + dur + 2) return <><SndAt at={at} snd={snd} vol={0.5} /><SndAt at={at + dur} snd={hit} vol={0.5} /></>;
  const xx = fromX + (toX - fromX) * t, yy = fromY + (toY - fromY) * t - Math.sin(Math.PI * t) * arc; const ang = Math.atan2(toY - fromY - Math.cos(Math.PI * t) * arc * Math.PI, toX - fromX) * 180 / Math.PI;
  return <><SndAt at={at} snd={snd} vol={0.5} /><SndAt at={at + dur} snd={hit} vol={0.5} />
    {kind === 'stone' ? <div style={{position: 'absolute', left: xx - 16, top: yy - 14, width: 32, height: 28, borderRadius: '45%', background: 'radial-gradient(circle at 35% 35%,#B8AE9C,#6E6656)', transform: `rotate(${f * 30}deg)`}} />
      : <div style={{position: 'absolute', left: xx - 120, top: yy - 4, width: 240, height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#6B4523 85%,#B8BEC6 85%)', transform: `rotate(${ang}deg)`}} />}</>;
};
/** Espada de fuego (ángel guerrero, querubín del Edén). x,y = empuñadura; ang = inclinación */
export const FlameSword = ({at = 0, x, y, s = 1.5, ang = -20, snd = '73_espada'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const fl = Math.sin(f / 2) * 4;
  return <><SndAt at={at} snd={at > 0 ? snd : null} vol={0.4} /><svg width={80 * s} height={300 * s} viewBox="-40 -260 80 300" style={{position: 'absolute', left: x - 40 * s, top: y - 260 * s, transform: `scale(${p}) rotate(${ang}deg)`, transformOrigin: '50% 87%', overflow: 'visible', filter: 'drop-shadow(0 0 16px rgba(255,150,40,.9))'}}>
    <path d={`M0 -250 C${18 + fl} -200 ${14 - fl} -120 16 -20 L-16 -20 C${-14 + fl} -120 ${-18 - fl} -200 0 -250 Z`} fill="#FF8A1E" /><path d="M0 -230 C8 -180 6 -110 7 -22 L-7 -22 C-6 -110 -8 -180 0 -230 Z" fill="#FFE27A" />
    <rect x={-30} y={-22} width={60} height={10} rx={4} fill="#C9A54A" /><rect x={-6} y={-12} width={12} height={40} rx={4} fill="#6B4523" /></svg></>;
};
/** Figura oscura (Satanás / el Acusador / tentador): envuelve la Figure, la vuelve sombra con ojos rojos. x,y = centro de la cabeza */
export const Shadow = ({at = 0, x, y, s = 2, eyes = '#FF3B2F', snd = '35_drone_grave', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 12); const glow = 0.7 + 0.3 * Math.sin(f / 6);
  return <><SndAt at={at} snd={at > 0 ? snd : null} vol={0.4} /><AbsoluteFill style={{filter: `brightness(${1 - 0.85 * t}) saturate(${1 - t})`, opacity: 0.6 + 0.4 * t}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y + 40 * s}px, rgba(0,0,0,${0.35 * t}), transparent 30%)`}} />
    {[-14, 14].map((dx) => <div key={dx} style={{position: 'absolute', left: x + dx * s - 6 * s, top: y - 4 * s, width: 12 * s, height: 6 * s, borderRadius: '50%', background: eyes, opacity: t * glow, boxShadow: `0 0 ${14 * s}px ${eyes}`}} />)}</>;
};
/** Luz cegadora desde el cielo (conversión de Saulo): destello que llena la pantalla y rayos */
export const BlindingLight = ({at, x = W / 2, dur = 30, snd = '26_coro'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 6); const fade = 1 - ramp(f, at + dur * 0.6, at + dur);
  return <><SndAt at={at} snd={snd} vol={0.6} /><SndAt at={at} snd="07_impacto" vol={0.5} />
    <div style={{position: 'absolute', left: x - 500, top: -200, width: 1000, height: H + 200, background: 'linear-gradient(180deg,#fff,rgba(255,250,225,.6) 60%,rgba(255,250,225,0))', clipPath: 'polygon(40% 0,60% 0,100% 100%,0 100%)', filter: 'blur(20px)', opacity: t}} />
    <AbsoluteFill style={{background: '#FFFDF2', opacity: t * fade * 0.85}} /></>;
};
/** Cruz luminosa en el cielo (Constantino): aparece con brillo y rayos */
export const SkyCross = ({at, x = W / 2, y = 420, s = 1, text = null, snd = '26_coro'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const g = 0.8 + 0.2 * Math.sin(f / 8);
  return <><SndAt at={at} snd={snd} vol={0.5} /><HeavenRays at={at} x={x} y={y - 200} snd={null} />
    <div style={{position: 'absolute', left: x - 120 * s, top: y - 170 * s, width: 240 * s, height: 340 * s, transform: `scale(${p})`, filter: `drop-shadow(0 0 ${40 * g}px rgba(255,240,180,.95))`}}>
      <div style={{position: 'absolute', left: 100 * s, top: 0, width: 40 * s, height: 340 * s, background: '#FFF8DC', borderRadius: 8 * s}} /><div style={{position: 'absolute', left: 0, top: 80 * s, width: 240 * s, height: 40 * s, background: '#FFF8DC', borderRadius: 8 * s}} /></div>
    {text && <div style={{position: 'absolute', top: y + 220 * s, width: W, textAlign: 'center', fontFamily: 'Cinzel', fontWeight: 700, fontSize: 54, color: '#FFF4CC', opacity: ramp(f, at + 14, at + 28), textShadow: '0 0 20px rgba(255,220,140,.9)'}}>{text}</div>}</>;
};
/** Hermanos o grupo con nombre: fila de figuras con colores distintos y su nombre abajo (12 hijos de Jacob, 12 apóstoles) */
export const NamedRow = ({at = 0, names, y = 1100, s = 0.9, colors = ['#B03030', '#2B6CB0', '#2E8B57', '#C9A54A', '#8E44AD', '#E67E22', '#16A085', '#7A4A22', '#5C7FB0', '#A0522D', '#6B8E23', '#9B2335'], every = 3, acc = {beard: 'short', hair: 'short'}, rows = 2}) => {
  const fr = useCurrentFrame(); const per = Math.ceil(names.length / rows); const gx = W / (per + 0.5);
  return <>{names.map((n, i) => { const r = Math.floor(i / per), c = i % per; const x = gx * (c + 0.75), yy = y + r * 300 * s * 1.3;
    return <React.Fragment key={n}><Figure at={at + i * every} x={x} y={yy} s={s} acc={acc} dress={{type: 'tunic', c1: '#E8DCC0', c2: colors[i % colors.length]}} />
      <div style={{position: 'absolute', left: x - 90, top: yy + 155 * s, width: 180, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 26, color: '#F3E6CC', opacity: ramp(fr, at + i * every, at + i * every + 6)}}>{n}</div></React.Fragment>; })}</>;
};

// ---------- lote 5: más efectos y relatos ----------
/** Lucha: dos figuras forcejean empujándose (Jacob y el ángel, Sansón). a, b = props de Figure */
export const Wrestle = ({at = 0, x = W / 2, y, s = 2, a = {}, b = {}, dur = 60, snd = '65_esfuerzo'}) => {
  const f = useCurrentFrame(); const on = f >= at && f <= at + dur; const k = on ? Math.sin((f - at) / 4) : 0;
  return <><SndAt at={at} snd={snd} vol={0.4} /><Figure x={x - 62 * s + k * 10 * s} y={y} s={s} {...a} pose="hold" bob={false} headRot={-8 + k * 4} /><Figure x={x + 62 * s + k * 10 * s} y={y} s={s} flip {...b} pose="hold" bob={false} headRot={8 + k * 4} />
    {on && Math.abs(k) > 0.9 && <div style={{position: 'absolute', left: x - 50 * s, top: y - 90 * s, width: 100 * s, height: 100 * s, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.8), rgba(255,255,255,0) 70%)'}} />}</>;
};
/** Estatua de sal: la figura se vuelve blanca, se agrieta y se desarma en polvo. (x,y) = centro de la Figure */
export const SaltStatue = ({at, x, y, s = 2, crumble = null, snd = '70_vidrio_rompe', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 18); const c = crumble == null ? 0 : ramp(f, crumble, crumble + 24);
  return <><SndAt at={at} snd="11_brillo" vol={0.4} />{crumble != null && <SndAt at={crumble} snd={snd} vol={0.4} />}
    <AbsoluteFill style={{filter: `grayscale(${t}) brightness(${1 + 0.6 * t}) contrast(${1 - 0.3 * t})`, opacity: 1 - c, transform: `translateY(${c * 40}px)`}}>{children}</AbsoluteFill>
    {t > 0.6 && c < 1 && <svg width={200 * s} height={300 * s} viewBox="-100 -150 200 300" style={{position: 'absolute', left: x - 100 * s, top: y - 150 * s, opacity: (t - 0.6) * 2.5 * (1 - c)}}>
      {['M-10 -120 L4 -90 L-6 -60', 'M20 -20 L6 20 L18 60 L4 110', 'M-30 30 L-14 60 L-26 100'].map((d0, i) => <path key={i} d={d0} stroke="#9A958A" strokeWidth="2.5" fill="none" />)}</svg>}
    {c > 0 && Array.from({length: 40}, (_, i) => <div key={i} style={{position: 'absolute', left: x + ((i * 37) % 160 - 80) * s * (1 + c), top: y + ((i * 53) % 260 - 120) * s + c * c * 300, width: 8, height: 8, borderRadius: 2, background: '#F2F0EA', opacity: 1 - c}} />)}</>;
};
/** Objeto que habla (serpiente, burra, zarza): se balancea al ritmo del habla y muestra un globo. talk = [desde, hasta] */
export const TalkingObject = ({src, x, y, w = 360, talk = [0, 40], text, side = 'right', snd = '67_susurro'}) => {
  const f = useCurrentFrame(); const on = f >= talk[0] && f <= talk[1]; const k = on ? Math.sin(f / 2.5) : 0;
  return <><SndAt at={talk[0]} snd={snd} vol={0.35} /><Img src={staticFile(src)} style={{position: 'absolute', left: x - w / 2, top: y - w / 2, width: w, transform: `rotate(${k * 4}deg) scale(${1 + k * 0.03})`, transformOrigin: '50% 90%', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.35))'}} />
    {text && f >= talk[0] && <Bubble at={talk[0]} x={side === 'right' ? x + w * 0.3 : x - w * 0.3 - 420} y={y - w * 0.75} tail={side === 'right' ? 'left' : 'right'}>{text}</Bubble>}</>;
};
/** Demonios que salen como sombras de una figura y se van hacia (toX,toY) (Legión a los cerdos) */
export const Demons = ({at, x, y, toX, toY, n = 7, dur = 30, snd = '67_susurro'}) => {
  const f = useCurrentFrame();
  return <><SndAt at={at} snd={snd} vol={0.5} />{Array.from({length: n}, (_, i) => { const t = ramp(f, at + i * 3, at + i * 3 + dur, Easing.inOut(Easing.quad)); if (t <= 0 || t >= 1) return null;
    const xx = x + (toX - x) * t + Math.sin(t * 9 + i) * 60, yy = y + (toY - y) * t - Math.sin(Math.PI * t) * 200;
    return <div key={i} style={{position: 'absolute', left: xx - 30, top: yy - 30, width: 60, height: 60, borderRadius: '50% 50% 40% 40%', background: 'radial-gradient(circle at 50% 40%, rgba(20,10,20,.9), rgba(20,10,20,0) 70%)', opacity: Math.sin(Math.PI * t)}}>
      {[16, 36].map((ex) => <div key={ex} style={{position: 'absolute', left: ex, top: 22, width: 7, height: 4, borderRadius: '50%', background: '#FF4B3A', boxShadow: '0 0 6px #FF4B3A'}} />)}</div>; })}</>;
};
/** Escritura en la pared (Belsasar): palabras que se graban con brillo en la pared, letra por letra */
export const WallWriting = ({at, text = 'MENE MENE TEKEL UPARSIN', x = W / 2, y = 520, size = 70, speed = 2.5, snd = '74_rasguido'}) => {
  const f = useCurrentFrame(); const n = text.length; const t = ramp(f, at, at + n * speed, Easing.linear);
  return <><SndAt at={at} snd={snd} vol={0.5} /><div style={{position: 'absolute', left: 0, top: y, width: W, textAlign: 'center', fontFamily: 'Cinzel', fontWeight: 700, fontSize: size, color: '#FFE8A0', letterSpacing: 6, padding: '0 60px', boxSizing: 'border-box', textShadow: '0 0 18px rgba(255,200,90,.95), 0 0 4px #fff'}}>
    {text.slice(0, Math.round(n * t))}<span style={{opacity: 0}}>{text.slice(Math.round(n * t))}</span></div></>;
};
/** Escalera de Jacob: escalera de luz al cielo con ángeles (alas) subiendo y bajando */
export const JacobLadder = ({at = 0, x = W / 2, top = 120, bottom = 1500, n = 4, snd = '26_coro'}) => {
  const f = useCurrentFrame(); const p = ramp(f, at, at + 20); const len = bottom - top;
  return <><SndAt at={at} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: x - 90, top: bottom - len * p, width: 180, height: len * p, background: 'linear-gradient(0deg, rgba(255,240,190,.15), rgba(255,250,225,.75))', filter: 'blur(1px)', clipPath: 'polygon(30% 0,70% 0,100% 100%,0 100%)'}}>
      {Array.from({length: 16}, (_, i) => <div key={i} style={{position: 'absolute', left: '8%', right: '8%', top: `${i * 6.25}%`, height: 6, background: 'rgba(255,255,240,.85)'}} />)}</div>
    {p >= 1 && Array.from({length: n}, (_, i) => { const up = i % 2 === 0; const k = ((f - at) / 120 + i / n) % 1; const yy = up ? bottom - k * len : top + k * len;
      return <div key={i} style={{position: 'absolute', left: x - 24 + (i % 2 ? 30 : -30), top: yy - 30, width: 48, height: 48, borderRadius: '50%', background: 'radial-gradient(circle, #fff 30%, rgba(255,255,255,0) 70%)'}}>
        <div style={{position: 'absolute', left: -26, top: 6, width: 30, height: 18, borderRadius: '50% 0 50% 50%', background: 'rgba(255,255,255,.9)'}} /><div style={{position: 'absolute', right: -26, top: 6, width: 30, height: 18, borderRadius: '0 50% 50% 50%', background: 'rgba(255,255,255,.9)'}} /></div>; })}</>;
};
/** Espíritu / fantasma: figura translúcida que aparece desde el suelo (Samuel en Endor). Envuelve la Figure */
export const Ghost = ({at, rise = 120, children, snd = '67_susurro'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 24);
  return <><SndAt at={at} snd={snd} vol={0.5} /><AbsoluteFill style={{opacity: 0.55 * t, transform: `translateY(${(1 - t) * rise}px)`, filter: `grayscale(1) brightness(1.4) blur(${1.5 - t}px) drop-shadow(0 0 20px rgba(200,220,255,.9))`}}>{children}</AbsoluteFill></>;
};
/** Pez (ichthys) dibujado en la arena con el dedo, trazo a trazo */
export const IchthysDraw = ({at, x = W / 2, y = 1300, w = 360, dur = 30, color = '#6B5236', snd = '74_rasguido'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.quad)); const L = 820;
  return <><SndAt at={at} snd={snd} vol={0.5} /><svg width={w} height={w * 0.5} viewBox="0 0 400 200" style={{position: 'absolute', left: x - w / 2, top: y - w * 0.25, overflow: 'visible'}}>
    <path d="M30 40 C120 -30 270 0 360 150 M30 160 C120 230 270 200 360 50" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - t)} /></svg></>;
};
/** Lapidación: varias piedras desde los costados hacia (x,y), con temblor al impactar (sin gore) */
export const Stoning = ({at, x, y, n = 8, every = 5, snd = '04_whoosh_corto'}) => <>{Array.from({length: n}, (_, i) => { const side = i % 2 ? 1 : -1;
  return <Throw key={i} at={at + i * every} fromX={x + side * (520 + (i * 37) % 120)} fromY={y - 200 + (i * 53) % 220} toX={x + side * ((i * 13) % 50)} toY={y + (i * 29) % 80} arc={120 + (i * 17) % 80} snd={snd} hit="06_golpe_grave" />; })}</>;
/** Lluvia de maná (copos blancos) o codornices (kind: 'mana' | 'quail') */
export const MannaRain = ({at = 0, kind = 'mana', n = 70, snd = '31_glitter'}) => {
  const f = useCurrentFrame(); const k = f - at; if (k < 0) return null;
  return <><SndAt at={at} snd={snd} vol={0.35} />{Array.from({length: n}, (_, i) => { const sp = 6 + (i % 5) * 2; const yy = ((k * sp + i * 97) % (H + 100)) - 50; const xx = (i * 131) % W + Math.sin(k / 15 + i) * 20;
    return kind === 'mana' ? <div key={i} style={{position: 'absolute', left: xx, top: yy, width: 10 + (i % 3) * 4, height: 7 + (i % 3) * 3, borderRadius: '50%', background: '#FBF8EE', opacity: 0.9}} />
      : <div key={i} style={{position: 'absolute', left: xx, top: yy, fontSize: 30 + (i % 3) * 8, transform: `rotate(${Math.sin(k / 6 + i) * 15}deg)`}}>🐦</div>; })}</>;
};
/** Agua que se convierte en vino: líquido dentro de una tinaja que cambia de color con brillo. x,y = centro de la tinaja */
export const WaterToWine = ({at, x = W / 2, y = 1100, w = 300, dur = 30, snd = '31_glitter'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur); const mixc = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * t)); const c = mixc([120, 175, 215], [120, 20, 40]);
  return <><SndAt at={at} snd={snd} vol={0.5} /><div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.6, width: w, height: w * 1.1, borderRadius: '30% 30% 40% 40%', background: 'linear-gradient(90deg,#8A5A32,#B57A48 40%,#7A4A22)', boxShadow: '0 14px 20px rgba(0,0,0,.4)'}}>
    <div style={{position: 'absolute', left: '10%', right: '10%', top: '6%', height: '14%', borderRadius: '50%', background: `rgb(${c.join(',')})`, boxShadow: `0 0 ${30 * Math.sin(Math.PI * t)}px rgba(255,220,180,.9)`}} /></div></>;
};
/** Lenguas que se confunden (Babel) o que se entienden (Pentecostés): globos con la misma frase en distintos idiomas */
export const Tongues = ({at, items = ['¡Hola!', 'Hello!', 'שלום', 'Χαῖρε', 'مرحبا', 'Salve!', '你好', 'Ciao!'], every = 5, y0 = 300, snd = '29_burbuja'}) => {
  const f = useCurrentFrame();
  return <>{items.map((tx, i) => { const p = usePopAt(f, at + i * every); return <React.Fragment key={i}><SndAt at={at + i * every} snd={snd} vol={0.3} />
    <div style={{position: 'absolute', left: 80 + (i % 3) * 320 + (Math.floor(i / 3) % 2) * 80, top: y0 + Math.floor(i / 3) * 230, padding: '20px 34px', borderRadius: 40, background: '#fff', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: 44, color: '#2A2A30', transform: `scale(${p}) rotate(${(i % 2 ? 1 : -1) * 4}deg)`, boxShadow: '0 8px 16px rgba(0,0,0,.3)'}}>{tx}</div></React.Fragment>; })}</>;
};
const usePopAt = (f, at) => { const k = f - at; if (k < 0) return 0; return Math.min(1.08, 1 - Math.exp(-k / 3) * Math.cos(k / 2.2)); };
/** Quemar papel/libro: el papel se ennegrece desde abajo y se convierte en llamas y cenizas. x,y = centro del papel */
export const BurnPaper = ({at, x = W / 2, y = 900, w = 380, h = 500, text = '', dur = 40, snd = '62_fuego'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.linear);
  return <><SndAt at={at} snd={snd} vol={0.45} /><div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, background: '#F1E8D2', fontFamily: 'IM Fell English', fontSize: 40, color: '#2A1A0C', textAlign: 'center', paddingTop: 30, boxSizing: 'border-box', clipPath: `inset(0 0 ${t * 100}% 0)`, boxShadow: '0 10px 20px rgba(0,0,0,.4)'}}>{text}
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: 'linear-gradient(0deg, #2A1A0C, rgba(42,26,12,0))'}} /></div>
    {t > 0 && t < 1 && <Fire at={at} x={x} y={y + h / 2 - t * h + 30} w={w} h={160} snd={null} />}</>;
};
/** Imprenta: la prensa baja y sale una hoja impresa (repite n veces) */
export const PrintPress = ({at, x = W / 2, y = 900, n = 3, every = 20, snd = '52_madera'}) => {
  const f = useCurrentFrame(); const k = Math.max(0, f - at) % every; const cyc = Math.floor(Math.max(0, f - at) / every); const down = f >= at && cyc < n ? Math.sin(Math.min(1, k / 8) * Math.PI) : 0;
  return <>{Array.from({length: n}, (_, i) => <SndAt key={i} at={at + i * every + 4} snd={snd} vol={0.5} />)}
    <div style={{position: 'absolute', left: x - 200, top: y - 420, width: 400, height: 40, background: '#5E3B1E'}} />{[-190, 160].map((dx) => <div key={dx} style={{position: 'absolute', left: x + dx, top: y - 420, width: 30, height: 520, background: '#6B4523'}} />)}
    <div style={{position: 'absolute', left: x - 140, top: y - 360 + down * 150, width: 280, height: 70, background: 'linear-gradient(180deg,#3A3A3E,#1E1E22)', borderRadius: 6}} />
    <div style={{position: 'absolute', left: x - 170, top: y - 120, width: 340, height: 30, background: '#4E3018'}} />
    {Array.from({length: Math.min(cyc, n)}, (_, i) => <div key={i} style={{position: 'absolute', left: x + 200 + i * 20, top: y - 60 - i * 12, width: 200, height: 260, background: '#F3ECD8', boxShadow: '0 6px 10px rgba(0,0,0,.3)', transform: `rotate(${6 + i * 4}deg)`, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 22px, rgba(40,30,20,.45) 22px 26px)', backgroundClip: 'content-box', padding: 20, boxSizing: 'border-box'}} />)}</>;
};
/** Coronar (corona que baja sobre la cabeza) o destronar (sube y se va). x,y = centro de la cabeza; src = foto de la corona (o dibujada si no hay) */
export const Crown = ({at, x, y, s = 2, remove = false, src = null, snd = null}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 16, remove ? Easing.in(Easing.cubic) : Easing.out(Easing.bounce)); const off = remove ? -t * 500 : -(1 - t) * 400;
  const sfx = snd || (remove ? '14_negativo' : '77_tada');
  return <><SndAt at={remove ? at : at + 12} snd={sfx} vol={0.5} />
    {src ? <Img src={staticFile(src)} style={{position: 'absolute', left: x - 50 * s, top: y - 90 * s + off, width: 100 * s, opacity: remove ? 1 - t : 1, transform: `rotate(${remove ? t * 40 : 0}deg)`}} />
      : <svg width={100 * s} height={60 * s} viewBox="-50 -30 100 60" style={{position: 'absolute', left: x - 50 * s, top: y - 80 * s + off, opacity: remove ? 1 - t : 1, overflow: 'visible', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.3))'}}><path d="M-38 24 L-38 -12 L-20 8 L0 -26 L20 8 L38 -12 L38 24 Z" fill="#E8B923" stroke="#A67C00" strokeWidth="3" /></svg>}
    {!remove && t >= 1 && <Burst at={at + 14} x={x} y={y - 60 * s} />}</>;
};
/** Carta que vuela del autor al destinatario (epístolas): sobre con sello que viaja en arco y deja un rastro */
export const LetterFly = ({at, fromX, fromY, toX, toY, dur = 30, label = '', snd = '05_whoosh_largo'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); if (f < at || f > at + dur + 20) return <SndAt at={at} snd={snd} vol={0.4} />;
  const xx = fromX + (toX - fromX) * t, yy = fromY + (toY - fromY) * t - Math.sin(Math.PI * t) * 260;
  return <><SndAt at={at} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: xx - 70, top: yy - 45, width: 140, height: 90, background: '#EFE3C4', borderRadius: 6, boxShadow: '0 8px 14px rgba(0,0,0,.35)', transform: `rotate(${Math.sin(t * 8) * 12}deg)`}}>
    <div style={{position: 'absolute', left: 52, top: 30, width: 36, height: 36, borderRadius: '50%', background: '#8E1B1B'}} />{label && <div style={{position: 'absolute', top: 96, width: 140, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 26, color: '#F3E6CC'}}>{label}</div>}</div></>;
};
/** Cambio de época: destello que tapa la figura mientras cambia de ropa. Pasar dos Figure: before y after */
export const EraChange = ({at, x, y, s = 2, before, after, label, snd = '18_zoom'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 8) * (1 - ramp(f, at + 8, at + 18)); const showAfter = f >= at + 8;
  return <><SndAt at={at} snd={snd} vol={0.5} />{showAfter ? after : before}
    <div style={{position: 'absolute', left: x - 200 * s, top: y - 220 * s, width: 400 * s, height: 440 * s, borderRadius: '50%', background: 'radial-gradient(circle, #fff 30%, rgba(255,255,255,0) 70%)', opacity: t}} />
    {label && <div style={{position: 'absolute', top: y + 170 * s, width: W, textAlign: 'center', fontFamily: 'Cinzel', fontWeight: 700, fontSize: 56, color: '#F3E6CC', opacity: ramp(f, at + 10, at + 20)}}>{label}</div>}</>;
};
/** Concilio: un nombre o doctrina y un sello que cae encima (ANATEMA / APROBADO) con golpe */
export const Anathema = ({at, text = 'Arrio', stamp = 'ANATEMA', color = '#B3262E', y = 800, snd = '22_sello'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const st = ramp(f, at + 14, at + 22, Easing.in(Easing.cubic));
  return <><SndAt at={at + 22} snd={snd} vol={0.6} /><div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: 'Cinzel', fontWeight: 700, fontSize: 96, color: '#F3E6CC', transform: `scale(${p})`}}>{text}</div>
    <div style={{position: 'absolute', left: W / 2 - 300, top: y - 30, width: 600, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 92, color, border: `10px solid ${color}`, borderRadius: 18, opacity: st, transform: `rotate(-12deg) scale(${3 - 2 * st})`, mixBlendMode: 'multiply', background: 'rgba(255,255,255,.08)'}}>{stamp}</div></>;
};

// ---------- movimiento ----------
export const Pop = ({at, children, style}) => {
  const p = usePop(at);
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${p})`, opacity: Math.min(1, p * 2), transformOrigin: style?.origin || '50% 50%', ...style}}>{children}</div>;
};
export const SlideIn = ({at, from = 'left', dist = 700, children}) => {
  const p = usePop(at, true);
  const d = (1 - p) * dist; const t = {left: `translateX(${-d}px)`, right: `translateX(${d}px)`, bottom: `translateY(${d}px)`, top: `translateY(${-d}px)`}[from];
  return <div style={{position: 'absolute', inset: 0, transform: t}}>{children}</div>;
};
/** Cámara: push-in lento + shake opcional en frames concretos */
export const Camera = ({zoom = [1, 1.08], shakes = [], dur, children}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], zoom, cl);
  let sx = 0, sy = 0;
  for (const s of shakes) { if (f >= s && f < s + 10) { const k = (1 - (f - s) / 10) * 14; sx += (random('a' + f) - 0.5) * k; sy += (random('b' + f) - 0.5) * k; } }
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${z})`}}>{children}</AbsoluteFill>;
};
/** Transición whip-pan: la escena entra con barrido + blur en los primeros frames y sale igual */
export const Whip = ({dur, dir = 'up', inF = 8, outF = 8, children}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, inF], [1, 0], {...cl, easing: Easing.out(Easing.cubic)});
  const b = interpolate(f, [dur - outF, dur], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const off = (a - b) * (dir === 'up' ? H : W);
  const blur = (a + b) * 30;
  const t = dir === 'up' ? `translateY(${off}px)` : `translateX(${off}px)`;
  return <AbsoluteFill style={{transform: t, filter: blur > 0.5 ? `blur(${blur}px)` : 'none'}}>{children}</AbsoluteFill>;
};

// ---------- gráficos ----------
export const Title = ({at, y, size = 78, color = '#fff', children, x = 540, w = 980, rot = 0}) => {
  const p = usePop(at);
  return <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900,
    fontSize: size, color, textTransform: 'uppercase', lineHeight: 1.05, letterSpacing: 1,
    textShadow: '0 6px 14px rgba(0,0,0,.55)', transform: `scale(${p}) rotate(${rot}deg)`, opacity: Math.min(1, p * 2)}}>{children}</div>;
};
export const Hand = ({at, x, y, size = 64, color = '#fff', children, rot = -4}) => {
  const p = usePop(at, true);
  return <div style={{position: 'absolute', left: x, top: y, fontFamily: 'Caveat', fontWeight: 700, fontSize: size, color,
    textShadow: '0 3px 8px rgba(0,0,0,.5)', transform: `rotate(${rot}deg) scale(${p})`, opacity: p, whiteSpace: 'nowrap'}}>{children}</div>;
};
/** Línea/flecha dibujada (trim path). d = path SVG; arrow = punta al final */
export const Draw = ({at, d, dur = 14, color = '#fff', width = 8, dashed = false, arrow = false, len = 1200}) => {
  const t = ramp(useCurrentFrame(), at, at + dur);
  return (<svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
    <defs><marker id={`ah${at}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill={color} /></marker></defs>
    <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={dashed ? '18 14' : len}
      strokeDashoffset={dashed ? 0 : len * (1 - t)} opacity={dashed ? t : 1} markerEnd={arrow && t > 0.95 ? `url(#ah${at})` : undefined}
      style={{filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.4))'}} />
  </svg>);
};
export const RedX = ({at, x, y, size = 300, width = 30}) => {
  const f = useCurrentFrame(); const a = ramp(f, at, at + 5); const b = ramp(f, at + 4, at + 9); const L = size * 1.42;
  return (<svg width={size} height={size} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.4))'}}>
    <line x1={0} y1={0} x2={size} y2={size} stroke={C.red} strokeWidth={width} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - a)} />
    <line x1={size} y1={0} x2={0} y2={size} stroke={C.red} strokeWidth={width} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - b)} />
  </svg>);
};
export const Check = ({at, x, y, size = 120}) => {
  const t = ramp(useCurrentFrame(), at, at + 8); const L = size * 2;
  return (<svg width={size} height={size} viewBox="0 0 100 100" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible'}}>
    <path d="M12 52 L40 80 L90 18" stroke={C.green} strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={160} strokeDashoffset={160 * (1 - t)} style={{filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.4))'}} />
  </svg>);
};
export const QMarks = ({at, x, y, n = 3, color = '#fff'}) => {
  const f = useCurrentFrame();
  return <>{Array.from({length: n}, (_, i) => {
    const p = usePop(at + i * 5);
    const px = x + [-90, 70, 10][i % 3], py = y + [-20, -60, -130][i % 3] + Math.sin((f + i * 9) / 8) * 8;
    return <div key={i} style={{position: 'absolute', left: px, top: py, fontFamily: 'Montserrat', fontWeight: 900, fontSize: [90, 70, 56][i % 3],
      color, transform: `scale(${p}) rotate(${[-14, 12, -4][i % 3]}deg)`, textShadow: '0 4px 10px rgba(0,0,0,.45)'}}>?</div>;
  })}</>;
};
export const SweatDrop = ({at, x, y}) => {
  const p = usePop(at); const f = useCurrentFrame();
  return <svg width={40} height={60} style={{position: 'absolute', left: x, top: y + Math.sin(f / 6) * 3, transform: `scale(${p})`}}>
    <path d="M20 2 C28 22 38 32 38 42 A18 18 0 0 1 2 42 C2 32 12 22 20 2 Z" fill="#5AB8F0" stroke="#2D7FB8" strokeWidth="3" /></svg>;
};
/** Globo de cómic. tail: 'left'|'right' */
export const Bubble = ({at, x, y, w = 420, children, tail = 'left', size = 48}) => {
  const p = usePop(at);
  return (<div style={{position: 'absolute', left: x, top: y, width: w, transform: `scale(${p})`, transformOrigin: tail === 'left' ? '10% 100%' : '90% 100%'}}>
    <div style={{background: '#fff', border: `5px solid ${C.ink}`, borderRadius: 34, padding: '18px 26px', fontFamily: 'Montserrat', fontWeight: 800,
      fontSize: size, color: C.ink, textAlign: 'center', boxShadow: '0 8px 16px rgba(0,0,0,.3)'}}>{children}</div>
    <svg width={60} height={50} style={{position: 'absolute', top: '100%', marginTop: -6, [tail]: 50}}>
      <path d={tail === 'left' ? 'M4 0 L20 46 L44 0 Z' : 'M16 0 L40 46 L56 0 Z'} fill="#fff" stroke={C.ink} strokeWidth="5" strokeLinejoin="round" /><rect x={0} y={0} width={60} height={6} fill="#fff" /></svg>
  </div>);
};
/** Marco tipo polaroid con contenido adentro (foto o dibujo) */
export const Polaroid = ({at, x, y, w = 420, h = 360, rot = -6, children, caption}) => {
  const p = usePop(at);
  return (<div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h + 70, background: '#FAFAF5', padding: 18,
    boxShadow: '0 14px 26px rgba(0,0,0,.45)', transform: `rotate(${rot}deg) scale(${p})`}}>
    <div style={{width: w - 36, height: h - 18, overflow: 'hidden', position: 'relative', background: '#222'}}>{children}</div>
    {caption && <div style={{fontFamily: 'Caveat', fontWeight: 700, fontSize: 44, color: C.ink, textAlign: 'center', marginTop: 6}}>{caption}</div>}
  </div>);
};
export const Pin = ({at, x, y, color = C.red}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 10, Easing.bezier(0.34, 1.56, 0.64, 1));
  return <svg width={70} height={100} style={{position: 'absolute', left: x - 35, top: y - 100 - (1 - t) * 300, opacity: t > 0 ? 1 : 0}}>
    <path d="M35 98 C35 98 4 58 4 34 A31 31 0 0 1 66 34 C66 58 35 98 35 98 Z" fill={color} stroke="#7a1010" strokeWidth="3" /><circle cx={35} cy={34} r={12} fill="#fff" /></svg>;
};
export const Ticker = ({at, dur = 30, from = 0, to, x, y, size = 120, color = '#fff', suffix = '', fmt = (n) => Math.round(n).toLocaleString('es-AR')}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.out(Easing.quad));
  return <div style={{position: 'absolute', left: x - 500, top: y, width: 1000, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: size,
    color, textShadow: '0 6px 14px rgba(0,0,0,.5)', opacity: t > 0 ? 1 : 0}}>{fmt(from + (to - from) * t)}{suffix}</div>;
};
/** Rayo de luz desde arriba (selección, gracia, foco) */
export const Beam = ({at, x, top = 0, h = 700, w = 200, color = '#FFE9A8', dur = 18}) => {
  const t = ramp(useCurrentFrame(), at, at + dur);
  return <div style={{position: 'absolute', left: x - w / 2, top, width: w, height: h * t, background: `linear-gradient(180deg, ${color}00, ${color}cc)`,
    filter: 'blur(10px)', opacity: t, borderRadius: w / 2, mixBlendMode: 'screen'}} />;
};
/** Resaltado: el objeto activo crece y brilla, el resto se apaga (usar como wrapper) */
export const Focus = ({on, children, color = '#fff'}) => (
  <div style={{position: 'absolute', inset: 0, transition: 'none', opacity: on ? 1 : 0.4, filter: on ? `drop-shadow(0 0 22px ${color})` : 'grayscale(.6)'}}>{children}</div>
);
/** Glitch RGB en un rango de frames */
export const Glitch = ({at, dur = 8, children}) => {
  const f = useCurrentFrame(); const on = f >= at && f < at + dur; const k = on ? (random('g' + f) - 0.5) * 30 : 0;
  return (<AbsoluteFill>
    {on && <AbsoluteFill style={{transform: `translateX(${k}px)`, mixBlendMode: 'screen', opacity: 0.7, filter: 'hue-rotate(90deg)'}}>{children}</AbsoluteFill>}
    <AbsoluteFill style={{transform: `translateX(${-k / 2}px)`}}>{children}</AbsoluteFill>
  </AbsoluteFill>);
};
/** Sello circular dentado con texto (títulos de concepto) */
export const Seal = ({at, x, y, r = 170, color = '#E0362C', children, size = 54, rot = -8}) => {
  const p = usePop(at); const n = 28;
  const pts = Array.from({length: n * 2}, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2; const rr = i % 2 ? r : r * 0.9; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(' ');
  return (<div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, transform: `scale(${p}) rotate(${rot}deg)`}}>
    <svg width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`} style={{position: 'absolute', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.4))'}}><polygon points={pts} fill={color} /></svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Montserrat',
      fontWeight: 900, fontSize: size, color: '#fff', lineHeight: 1}}>{children}</div>
  </div>);
};

// =====================================================================
// ---------- componentes estandarizados (de los 100 shorts de referencia) ----------
// Cada uno trae su SFX por defecto (prop snd; snd={null} lo silencia).
export const PAPER = 'fondos/genericos/pergamino.jpg';  // textura de papel (bajar del kit)
const SndAt = ({at, snd, vol = 0.5}) => snd ? <Sfx at={at} name={snd} vol={vol} /> : null;
/** Tinte del cuerpo animado: usar como prop de Figure -> tint={tintAt(f, at, '#E0362C', dur)} */
export const tintAt = (f, at, color, dur = 10, o = 0.6, hold = 999) => {
  const t = ramp(f, at, at + dur) * (1 - ramp(f, at + dur + hold, at + 2 * dur + hold));
  return t > 0 ? {color, o: o * t} : null;
};
const EMOTE_SND = {'?': '29_burbuja', '!': '10_ding', sweat: '29_burbuja', hearts: '30_tintineo', stars: '31_glitter', bulb: '21_campana',
  tear: '14_negativo', anger: '40_rechazo', zzz: '02_pop_suave', dizzy: '53_resorte', smoke: '38_chispa', note: '30_tintineo',
  '?!': '10_ding', gloom: '14_negativo', shock: '07_impacto', sparkle: '31_glitter', heartbreak: '70_vidrio_rompe', money: '41_moneda', skull: '35_drone_grave',
  clock: '17_tic_tac', dots: '29_burbuja', blush: '02_pop_suave', check: '15_positivo', x: '40_rechazo', soul: '16_swell_invertido'};
/** Emoción sobre la cabeza. x,y = centro de la cabeza de la figura (en px de pantalla). type: ?|!|sweat|hearts|stars|bulb|tear|anger|zzz|dizzy|smoke|note */
export const Emote = ({at, x, y, type = '?', s = 1, snd = EMOTE_SND[type], vol = 0.45}) => {
  const f = useCurrentFrame(); const p = usePop(at); const k = f - at; const bob = Math.sin(k / 7) * 6;
  if (k < 0) return null;
  const st = (dx, dy, extra = '') => ({position: 'absolute', left: x + dx * s, top: y + dy * s + bob, transform: `translate(-50%,-50%) scale(${p * s}) ${extra}`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.4))'});
  const txt = (ch, size, color = '#fff') => <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color, lineHeight: 1}}>{ch}</div>;
  let el = null;
  if (type === '?') el = <div style={st(70, -130, 'rotate(12deg)')}>{txt('?', 110)}</div>;
  if (type === '!') el = <div style={st(70, -135, 'rotate(8deg)')}>{txt('!', 120, C.yellow)}</div>;
  if (type === 'sweat') el = <svg width={40} height={60} style={st(62, -70)}><path d="M20 2 C28 22 38 32 38 42 A18 18 0 0 1 2 42 C2 32 12 22 20 2 Z" fill="#5AB8F0" stroke="#2D7FB8" strokeWidth="3" /></svg>;
  if (type === 'tear') { const fall = (k % 30) / 30; el = <svg width={26} height={40} style={{...st(-20, -10 + fall * 60), opacity: 1 - fall}}><path d="M13 2 C18 14 24 20 24 27 A11 11 0 0 1 2 27 C2 20 8 14 13 2 Z" fill="#5AB8F0" /></svg>; }
  if (type === 'hearts' || type === 'stars') el = <>{[[-60, -120], [0, -160], [60, -120]].map(([dx, dy], i) =>
    <div key={i} style={st(dx, dy + Math.sin((k + i * 10) / 6) * 6, `rotate(${[-15, 0, 15][i]}deg)`)}>{txt(type === 'hearts' ? '♥' : '★', 64, type === 'hearts' ? '#FF4D6D' : C.yellow)}</div>)}</>;
  if (type === 'bulb') el = <svg width={110} height={150} viewBox="-55 -75 110 150" style={st(0, -170)}>
    {Array.from({length: 8}, (_, i) => { const a = i / 8 * Math.PI * 2; const r1 = 50, r2 = 50 + 14 * (0.6 + 0.4 * Math.sin(k / 3)); return <line key={i} x1={Math.cos(a) * r1} y1={-12 + Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={-12 + Math.sin(a) * r2} stroke={C.yellow} strokeWidth="6" strokeLinecap="round" />; })}
    <circle cx={0} cy={-12} r={34} fill="#FFE066" stroke="#C9A227" strokeWidth="4" /><rect x={-15} y={20} width={30} height={22} rx={4} fill="#9AA3AE" /></svg>;
  if (type === 'anger') el = <svg width={80} height={80} viewBox="-40 -40 80 80" style={st(60, -110, `scale(${1 + 0.1 * Math.sin(k / 2)})`)}>
    {[0, 90, 180, 270].map((r) => <path key={r} d="M6 -30 C6 -14 14 -6 30 -6" stroke="#E0362C" strokeWidth="9" fill="none" strokeLinecap="round" transform={`rotate(${r})`} />)}</svg>;
  if (type === 'zzz') el = <>{[0, 1, 2].map((i) => { const tt = ((k + i * 12) % 36) / 36; return <div key={i} style={{...st(50 + tt * 60, -110 - tt * 90), opacity: 1 - tt}}>{txt('z', 40 + i * 12)}</div>; })}</>;
  if (type === 'dizzy') el = <svg width={140} height={60} viewBox="-70 -30 140 60" style={st(0, -150)}><g transform={`rotate(${k * 12})`}>{[0, 120, 240].map((r) => <text key={r} x={0} y={0} transform={`rotate(${r}) translate(46 0)`} fontSize="30" fill={C.yellow} textAnchor="middle" dominantBaseline="middle">★</text>)}</g></svg>;
  if (type === 'smoke') el = <>{[0, 1, 2, 3].map((i) => { const tt = ((k + i * 8) % 32) / 32; return <div key={i} style={{...st((i % 2 ? 26 : -26) + Math.sin(tt * 6) * 10, -140 - tt * 110), opacity: 0.8 * (1 - tt), width: 50 + tt * 40, height: 50 + tt * 40, borderRadius: '50%', background: '#B9BEC6'}} />; })}</>;
  if (type === '?!') el = <div style={st(70, -135, 'rotate(10deg)')}>{txt('?!', 110, C.yellow)}</div>;
  if (type === 'gloom') { el = <><svg width={220} height={110} viewBox="-110 -55 220 110" style={st(0, -170)}><g fill="#6B7380">{[[-50, 5, 38], [0, -12, 48], [50, 5, 38], [0, 18, 40]].map(([a, b, r], i) => <circle key={i} cx={a} cy={b} r={r} />)}</g></svg>
    {Array.from({length: 7}, (_, i) => { const tt = ((k + i * 5) % 20) / 20; return <div key={i} style={{...st(-60 + i * 20, -120 + tt * 90), width: 5, height: 22, background: '#7FB6E8', borderRadius: 3, opacity: 1 - tt}} />; })}</>; }
  if (type === 'shock') el = <svg width={260} height={260} viewBox="-130 -130 260 260" style={st(0, 0)}>{Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2; const r1 = 70 + 6 * Math.sin(k), r2 = 115 + 6 * Math.sin(k);
    return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke="#fff" strokeWidth="8" strokeLinecap="round" />; })}</svg>;
  if (type === 'sparkle') el = <>{[[-75, -60, 40], [70, -95, 52], [80, -20, 30], [-60, -125, 30]].map(([dx, dy, z], i) => <svg key={i} width={z} height={z} viewBox="-10 -10 20 20" style={st(dx, dy, `rotate(${k * 4}deg) scale(${0.7 + 0.3 * Math.abs(Math.sin(k / 5 + i))})`)}><path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill={C.yellow} /></svg>)}</>;
  if (type === 'heartbreak') { const sp = Math.min(1, Math.max(0, (k - 8) / 8)) * 14; el = <svg width={110} height={100} viewBox="-55 -50 110 100" style={st(60, -140)}>
    <g transform={`translate(${-sp} ${sp / 2}) rotate(${-sp})`}><path d="M0 40 L-40 0 C-60 -25 -25 -50 0 -22 L-8 -5 L4 8 L-4 22 Z" fill="#FF4D6D" /></g>
    <g transform={`translate(${sp} ${sp / 2}) rotate(${sp})`}><path d="M0 40 L40 0 C60 -25 25 -50 0 -22 L-8 -5 L4 8 L-4 22 Z" fill="#FF4D6D" /></g></svg>; }
  if (type === 'money') el = <>{[[-60, -120], [0, -160], [60, -120]].map(([dx, dy], i) => <div key={i} style={st(dx, dy + Math.sin((k + i * 8) / 6) * 6)}>{txt('$', 70, '#3DDC84')}</div>)}</>;
  if (type === 'skull') el = <div style={st(70, -130)}>{txt('☠', 90)}</div>;
  if (type === 'clock') el = <svg width={100} height={100} viewBox="-50 -50 100 100" style={st(70, -130)}><circle r={42} fill="#fff" stroke={C.ink} strokeWidth="6" /><line x1={0} y1={0} x2={0} y2={-30} stroke={C.ink} strokeWidth="6" strokeLinecap="round" transform={`rotate(${k * 18})`} /><line x1={0} y1={0} x2={20} y2={0} stroke={C.ink} strokeWidth="6" strokeLinecap="round" /></svg>;
  if (type === 'dots') el = <div style={{...st(0, -150), background: '#fff', borderRadius: 40, padding: '6px 22px', display: 'flex', gap: 10}}>{[0, 1, 2].map((i) => <div key={i} style={{width: 18, height: 18, borderRadius: '50%', background: C.ink, opacity: 0.3 + 0.7 * ((Math.floor(k / 6) % 3) === i ? 1 : 0)}} />)}</div>;
  if (type === 'blush') el = <>{[-26, 26].map((dx) => <div key={dx} style={{...st(dx, 8), width: 26, height: 14, borderRadius: '50%', background: '#FF7A9A', opacity: 0.85}} />)}</>;
  if (type === 'check') el = <div style={st(75, -125)}>{txt('✔', 90, C.green)}</div>;
  if (type === 'x') el = <div style={st(75, -125)}>{txt('✖', 80, C.red)}</div>;
  if (type === 'soul') { const tt = Math.min(1, k / 30); el = <svg width={120} height={160} viewBox="-60 -80 120 160" style={{...st(0, -60 - tt * 200), opacity: 1 - tt * 0.7}}>
    <path d="M-40 60 C-50 0 -45 -60 0 -60 C45 -60 50 0 40 60 C30 45 20 70 10 55 C0 70 -10 45 -20 60 C-28 45 -36 70 -40 60 Z" fill="rgba(255,255,255,.85)" /><circle cx={-14} cy={-20} r={6} fill={C.ink} /><circle cx={14} cy={-20} r={6} fill={C.ink} /></svg>; }
  if (type === 'note') el = <div style={st(70, -130, `rotate(${Math.sin(k / 6) * 12}deg)`)}>{txt('♪', 90)}</div>;
  return <><SndAt at={at} snd={snd} vol={vol} />{el}</>;
};
/** Aura de color detrás de una figura (poder, elección, santidad). Poner ANTES de la Figure */
export const Aura = ({at, x, y, r = 170, color = '#FFE9A8', snd = '11_brillo'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 14); const pulse = 1 + 0.05 * Math.sin((f - at) / 6);
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
    background: `radial-gradient(circle, ${color}cc 0%, ${color}55 45%, transparent 70%)`, transform: `scale(${t * pulse})`, opacity: t, mixBlendMode: 'screen'}} /></>;
};

// ---------- transiciones ----------
/** Iris: la escena nueva (children) aparece dentro de un círculo que crece desde (x,y). ring = borde blanco (círculo flotante) */
export const Iris = ({at, x = W / 2, y = H / 2, dur = 14, ring = false, snd = '04_whoosh_corto', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const R = t * 2300;
  if (f < at) return null;
  return <><SndAt at={at} snd={snd} />
    <AbsoluteFill style={{clipPath: `circle(${R}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>
    {ring && t < 1 && <div style={{position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', border: '14px solid #fff', boxShadow: '0 0 30px rgba(0,0,0,.4)'}} />}</>;
};
/** Papel que se rasga: cubre con papel y en `at` se parte en dos dejando ver children */
export const PaperTear = ({at, dur = 16, color = '#EFE7D6', snd = '47_papel_rasga', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.in(Easing.cubic));
  const jag = Array.from({length: 25}, (_, i) => `${i * 45}px ${H / 2 + (random('pt' + i) - 0.5) * 120}px`);
  const top = `polygon(0 0, ${W}px 0, ${jag.slice().reverse().map((p) => p).join(', ')})`;
  const bot = `polygon(${jag.join(', ')}, ${W}px ${H}px, 0 ${H}px)`;
  const sheet = (clip, dy, rot) => <div style={{position: 'absolute', inset: 0, background: color, clipPath: clip, transform: `translateY(${dy}px) rotate(${rot}deg)`,
    backgroundImage: `url(${staticFile(PAPER)})`, backgroundSize: 'cover', boxShadow: 'inset 0 0 80px rgba(0,0,0,.25)'}} />;
  return <AbsoluteFill>{children}{t < 1 && <>{sheet(top, -t * 1300, -t * 8)}{sheet(bot, t * 1300, t * 6)}</>}<SndAt at={at} snd={snd} vol={0.6} /></AbsoluteFill>;
};
/** Zoom hacia adentro de un punto (x,y) de la escena saliente: envolver la escena; al final queda tapada por el detalle */
export const ZoomInto = ({at, dur = 14, x = W / 2, y = H / 2, to = 9, snd = '18_zoom', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.in(Easing.cubic));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `scale(${1 + (to - 1) * t})`, transformOrigin: `${x}px ${y}px`, filter: t > 0.5 ? `blur(${(t - 0.5) * 30}px)` : 'none', opacity: 1 - ramp(f, at + dur - 3, at + dur)}}>{children}</AbsoluteFill></>;
};
/** Destello a blanco (o color) para cortes duros, revelaciones, explosiones */
export const Flash = ({at, dur = 10, color = '#fff', snd = '07_impacto'}) => {
  const f = useCurrentFrame(); const o = interpolate(f, [at, at + 2, at + dur], [0, 1, 0], cl);
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} /></>;
};
/** Morph simple: `from` se encoge y desvanece mientras `to` aparece con rebote (botella->abrigo, semilla->árbol) */
export const Morph = ({at, dur = 10, from, to, snd = '02_pop_suave'}) => {
  const f = useCurrentFrame(); const a = 1 - ramp(f, at, at + dur * 0.6); const p = usePop(at + dur * 0.4);
  return <><SndAt at={at} snd={snd} />
    <AbsoluteFill style={{transform: `scale(${0.6 + 0.4 * a}) rotate(${(1 - a) * -10}deg)`, opacity: a}}>{from}</AbsoluteFill>
    {f >= at + dur * 0.4 && <AbsoluteFill style={{transform: `scale(${p})`, opacity: Math.min(1, p * 2)}}>{to}</AbsoluteFill>}</>;
};
/** Capa con deriva lateral (parallax): depth 0 = fija, 1 = se mueve mucho */
export const Parallax = ({depth = 0.5, drift = 0.6, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{transform: `translateX(${-f * drift * depth}px) scale(${1 + depth * 0.04})`}}>{children}</AbsoluteFill>;
};

// ---------- datos ----------
/** Barras comparativas que crecen. bars=[{label,v,color}] */
export const BarCompare = ({at, x = W / 2, y = 1300, bars, max, h = 600, bw = 190, gap = 70, stagger = 6, snd = '09_subida_corta', size = 46}) => {
  const f = useCurrentFrame(); const M = max || Math.max(...bars.map((b) => b.v)); const total = bars.length * bw + (bars.length - 1) * gap;
  return <>{bars.map((b, i) => {
    const t = ramp(f, at + i * stagger, at + i * stagger + 18, Easing.out(Easing.back(1.4))); const bh = (b.v / M) * h * t; const bx = x - total / 2 + i * (bw + gap);
    return <React.Fragment key={i}><SndAt at={at + i * stagger} snd={snd} vol={0.35} />
      <div style={{position: 'absolute', left: bx, top: y - bh, width: bw, height: bh, background: b.color || C.cyan, borderRadius: '18px 18px 0 0', boxShadow: '0 8px 16px rgba(0,0,0,.35)'}} />
      <div style={{position: 'absolute', left: bx - 40, width: bw + 80, top: y + 18, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: size, color: '#fff', opacity: t, textShadow: '0 3px 8px rgba(0,0,0,.5)'}}>{b.label}</div>
    </React.Fragment>;
  })}<div style={{position: 'absolute', left: x - total / 2 - 30, top: y, width: total + 60, height: 8, background: '#fff', borderRadius: 4}} /></>;
};
/** Dial / velocímetro con aguja (from,to en 0..1) */
export const Dial = ({at, x, y, r = 220, from = 0, to = 0.8, dur = 24, label, color = C.red, snd = '45_escaneo'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const t = ramp(f, at + 6, at + 6 + dur, Easing.out(Easing.back(1.6)));
  const v = from + (to - from) * t; const ang = -180 + 180 * v; const a = (ang * Math.PI) / 180;
  const arc = (v0, v1, c) => { const a0 = Math.PI * (1 + v0), a1 = Math.PI * (1 + v1); return <path d={`M${Math.cos(a0) * r} ${Math.sin(a0) * r} A${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r}`} stroke={c} strokeWidth={34} fill="none" />; };
  return <><SndAt at={at + 6} snd={snd} vol={0.3} />
    <svg width={2 * r + 60} height={r + 80} viewBox={`${-r - 30} ${-r - 30} ${2 * r + 60} ${r + 80}`} style={{position: 'absolute', left: x - r - 30, top: y - r - 30, transform: `scale(${p})`, transformOrigin: '50% 80%', overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.4))'}}>
      {arc(0, 0.33, C.green)}{arc(0.33, 0.66, C.yellow)}{arc(0.66, 1, C.red)}
      <line x1={0} y1={0} x2={Math.cos(a) * (r - 30)} y2={Math.sin(a) * (r - 30)} stroke="#fff" strokeWidth={14} strokeLinecap="round" /><circle r={24} fill="#fff" />
    </svg>
    {label && <div style={{position: 'absolute', left: x - 400, width: 800, top: y + 50, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 52, color: '#fff', opacity: p, textShadow: '0 4px 10px rgba(0,0,0,.5)'}}>{label}</div>}</>;
};
/** Barra de carga / energía que se llena o vacía */
export const LoadBar = ({at, x = W / 2, y, w = 760, h = 80, from = 0, to = 1, dur = 30, color = C.green, label, snd = '08_subida_larga'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const t = ramp(f, at + 4, at + 4 + dur, Easing.inOut(Easing.cubic)); const v = from + (to - from) * t;
  return <><SndAt at={at + 4} snd={snd} vol={0.3} /><div style={{position: 'absolute', left: x - w / 2, top: y, width: w, height: h, border: '8px solid #fff', borderRadius: h / 2, padding: 8, transform: `scale(${p})`, boxShadow: '0 8px 16px rgba(0,0,0,.35)'}}>
    <div style={{width: `${v * 100}%`, height: '100%', background: color, borderRadius: h / 2}} /></div>
    {label && <div style={{position: 'absolute', left: x - w / 2, width: w, top: y - 70, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 48, color: '#fff', opacity: p, textShadow: '0 4px 10px rgba(0,0,0,.5)'}}>{label}</div>}</>;
};
/** Ruta en mapa: línea punteada que se dibuja + pines que caen en orden. pins=[{x,y,at}] */
export const MapRoute = ({at, d, dur = 30, pins = [], color = C.red, len = 2400, snd = '44_pin_mapa'}) => (
  <><Draw at={at} d={d} dur={dur} color={color} width={10} len={len} />
    {pins.map((p, i) => <React.Fragment key={i}><Pin at={p.at ?? at + (i * dur) / Math.max(1, pins.length - 1)} x={p.x} y={p.y} color={color} />
      <SndAt at={(p.at ?? at + (i * dur) / Math.max(1, pins.length - 1)) + 6} snd={snd} vol={0.4} /></React.Fragment>)}</>
);
/** Lupa: muestra `children` (la misma escena o un detalle) ampliado `zoom` veces alrededor de (cx,cy), dentro de un círculo en (x,y). Línea punteada al punto */
export const Magnifier = ({at, x, y, r = 230, cx, cy, zoom = 2.5, snd = '02_pop_suave', children}) => {
  const p = usePop(at); const f = useCurrentFrame(); const t = ramp(f, at, at + 10);
  return <><SndAt at={at} snd={snd} />
    <svg width={W} height={H} style={{position: 'absolute', opacity: t}}><line x1={cx} y1={cy} x2={x} y2={y} stroke="#fff" strokeWidth={6} strokeDasharray="14 12" /><circle cx={cx} cy={cy} r={20} fill="none" stroke="#fff" strokeWidth={6} /></svg>
    <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', overflow: 'hidden', border: '12px solid #fff', boxShadow: '0 12px 26px rgba(0,0,0,.5)', transform: `scale(${p})`}}>
      <div style={{position: 'absolute', left: r - cx * zoom, top: r - cy * zoom, width: W, height: H, transform: `scale(${zoom})`, transformOrigin: '0 0'}}>{children}</div>
    </div></>;
};
/** Mano que señala (grabado antiguo / mano de Dios). dir en grados (0 = apunta a la derecha) */
export const PointHand = ({at, x, y, size = 220, dir = 0, snd = '04_whoosh_corto'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 12, Easing.out(Easing.back(1.5))); const off = (1 - t) * 400; const a = (dir * Math.PI) / 180;
  return <><SndAt at={at} snd={snd} /><svg width={size} height={size * 0.6} viewBox="0 0 200 120" style={{position: 'absolute', left: x - size - Math.cos(a) * off, top: y - size * 0.3 - Math.sin(a) * off, transform: `rotate(${dir}deg)`, transformOrigin: '100% 50%', overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.4))'}}>
    <path d="M0 40 L70 40 C80 40 86 30 96 30 L190 52 C200 55 200 66 190 68 L120 70 C126 76 126 88 116 90 L60 92 C40 100 0 96 0 96 Z" fill="#F6EFE2" stroke="#3A2E22" strokeWidth="4" strokeLinejoin="round" />
    <path d="M110 70 L60 72 M108 52 L80 50" stroke="#3A2E22" strokeWidth="3" fill="none" /><path d="M0 34 L28 34 L28 100 L0 100 Z" fill="#C9B79A" stroke="#3A2E22" strokeWidth="4" /></svg></>;
};

// =====================================================================
// ---------- tanda 2: texto ----------
const FONT = {fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', textShadow: '0 5px 12px rgba(0,0,0,.5)'};
/** Máquina de escribir (cps = caracteres por segundo) */
export const TypeText = ({at, x = W / 2, y, text, cps = 22, size = 64, w = 960, color = '#fff', hand = false, snd = '49_teclado'}) => {
  const f = useCurrentFrame(); const n = Math.max(0, Math.floor(((f - at) / 30) * cps)); const cursor = n < text.length && Math.floor(f / 8) % 2 === 0;
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', ...FONT, fontSize: size, color,
    ...(hand ? {fontFamily: 'Caveat', fontWeight: 700} : {})}}>{text.slice(0, n)}{cursor ? '|' : ''}</div></>;
};
/** Palabra por palabra con rebote (cada `every` frames). hl = índices de palabras resaltadas */
export const WordPop = ({at, x = W / 2, y, text, every = 5, size = 76, w = 980, hl = [], hlColor = C.yellow, snd = '01_pop_texto'}) => {
  const f = useCurrentFrame(); const words = text.split(' ');
  return <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', lineHeight: 1.15}}>
    {words.map((wd, i) => { const p = spring({frame: f - at - i * every, fps: 30, config: {damping: 9, stiffness: 200, mass: 0.5}});
      return <React.Fragment key={i}><SndAt at={at + i * every} snd={snd} vol={0.25} />
        <span style={{display: 'inline-block', ...FONT, fontSize: size, textTransform: 'uppercase', margin: '0 12px', transform: `scale(${p}) translateY(${(1 - p) * 30}px)`,
          opacity: Math.min(1, p * 2), color: hl.includes(i) ? hlColor : '#fff'}}>{wd}</span></React.Fragment>; })}</div>;
};
/** Post-it que entra girando y se pega con golpe */
export const PostIt = ({at, x, y, w = 320, rot = -6, color = '#FFE066', size = 46, snd = '06_golpe_grave', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 9, Easing.in(Easing.quad)); const sq = f >= at + 9 ? 1 + 0.08 * Math.exp(-(f - at - 9) / 3) * Math.cos((f - at - 9) / 1.5) : 1;
  if (f < at) return null;
  return <><SndAt at={at + 8} snd={snd} vol={0.5} /><div style={{position: 'absolute', left: x - w / 2, top: y - w / 2, width: w, height: w, background: color, padding: 26, boxSizing: 'border-box',
    fontFamily: 'Caveat', fontWeight: 700, fontSize: size, color: C.ink, lineHeight: 1.05, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    boxShadow: '0 16px 24px rgba(0,0,0,.4)', transform: `rotate(${rot + (1 - t) * 200}deg) scale(${(2.2 - 1.2 * t) * sq})`, opacity: t}}>{children}</div></>;
};
/** Círculo trazado a mano que resalta algo */
export const HandCircle = ({at, x, y, rx = 200, ry = 120, color = C.red, width = 12, dur = 12, snd = '20_pluma'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur); const L = 2 * Math.PI * Math.max(rx, ry) * 1.25;
  const d = `M${x + rx} ${y - 10} C${x + rx} ${y - ry * 1.3} ${x - rx * 1.1} ${y - ry * 1.2} ${x - rx} ${y} C${x - rx * 0.95} ${y + ry * 1.2} ${x + rx * 1.1} ${y + ry * 1.15} ${x + rx * 1.02} ${y - 5} C${x + rx} ${y - ry * 0.6} ${x + rx * 0.6} ${y - ry} ${x + rx * 0.2} ${y - ry * 1.05}`;
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}><path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - t)} style={{filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.4))'}} /></svg></>;
};
/** Tachado rojo sobre un texto (línea levemente torcida) */
export const Strike = ({at, x, y, w = 600, color = C.red, width = 14, snd = '20_pluma'}) => {
  const t = ramp(useCurrentFrame(), at, at + 7);
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}><line x1={x - w / 2} y1={y + 8} x2={x - w / 2 + w * t} y2={y - 8 * (2 * t - 1)} stroke={color} strokeWidth={width} strokeLinecap="round" /></svg></>;
};
/** Etiqueta con flecha que apunta a (tx,ty) */
export const Callout = ({at, x, y, tx, ty, text, size = 46, color = '#fff', snd = '03_click'}) => {
  const p = usePop(at); const t = ramp(useCurrentFrame(), at + 4, at + 14);
  return <><SndAt at={at} snd={snd} /><svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}><defs><marker id={`co${at}${tx}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill={color} /></marker></defs>
    <line x1={x} y1={y} x2={x + (tx - x) * t} y2={y + (ty - y) * t} stroke={color} strokeWidth={6} markerEnd={t > 0.9 ? `url(#co${at}${tx})` : undefined} /></svg>
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p})`, background: '#fff', color: C.ink, fontFamily: 'Montserrat', fontWeight: 800, fontSize: size, padding: '10px 24px', borderRadius: 16, whiteSpace: 'nowrap', boxShadow: '0 6px 14px rgba(0,0,0,.4)'}}>{text}</div></>;
};
/** Sello rectangular de texto (APROBADO, HEREJÍA, MITO...) que golpea */
export const TextStamp = ({at, x, y, text, color = C.red, size = 90, rot = -12, snd = '22_sello'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 6, Easing.in(Easing.cubic));
  if (f < at) return null;
  return <><SndAt at={at + 5} snd={snd} /><div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.4 - 1.4 * t})`, opacity: t,
    border: `10px solid ${color}`, borderRadius: 14, padding: '6px 26px', fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color, letterSpacing: 4, mixBlendMode: 'normal', textShadow: 'none', background: 'rgba(255,255,255,.08)'}}>{text}</div></>;
};
/** Lista que aparece ítem por ítem con check o X. items=[{t:'texto', ok:true|false|null}] */
export const Checklist = ({at, x = 120, y, items, every = 12, size = 58, gap = 100}) => (
  <>{items.map((it, i) => { const a = at + i * every; return <React.Fragment key={i}>
    <SlideInAt at={a} x={x + 110} y={y + i * gap} size={size}>{it.t}</SlideInAt>
    {it.ok === true && <><Check at={a + 6} x={x + 40} y={y + i * gap + size * 0.6} size={80} /><SndAt at={a + 6} snd="10_ding" vol={0.35} /></>}
    {it.ok === false && <><RedX at={a + 6} x={x + 40} y={y + i * gap + size * 0.6} size={64} width={14} /><SndAt at={a + 6} snd="14_negativo" vol={0.35} /></>}
  </React.Fragment>; })}</>
);
const SlideInAt = ({at, x, y, size, children}) => { const p = usePop(at, true);
  return <><SndAt at={at} snd="04_whoosh_corto" vol={0.25} /><div style={{position: 'absolute', left: x, top: y, ...FONT, fontWeight: 800, fontSize: size, transform: `translateX(${(1 - p) * 400}px)`, opacity: Math.min(1, p * 1.5), whiteSpace: 'nowrap'}}>{children}</div></>; };
/** Nube de pensamiento */
export const ThoughtCloud = ({at, x, y, w = 460, h = 280, tx, ty, children, snd = '29_burbuja'}) => {
  const p = usePop(at); const f = useCurrentFrame();
  const dots = tx != null ? [0.25, 0.5, 0.75].map((k, i) => ({cx: tx + (x - tx) * k, cy: ty + (y + h / 2 - ty) * k, r: 10 + i * 8, p: usePop(at - 6 + i * 2)})) : [];
  return <><SndAt at={at} snd={snd} />{dots.map((d, i) => <div key={i} style={{position: 'absolute', left: d.cx - d.r, top: d.cy - d.r, width: 2 * d.r, height: 2 * d.r, borderRadius: '50%', background: '#fff', transform: `scale(${d.p})`}} />)}
    <svg width={w + 80} height={h + 80} viewBox={`-40 -40 ${w + 80} ${h + 80}`} style={{position: 'absolute', left: x - w / 2 - 40, top: y - h / 2 - 40, transform: `scale(${p})`, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.35))', overflow: 'visible'}}>
      {Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2; return <circle key={i} cx={w / 2 + Math.cos(a) * w * 0.38} cy={h / 2 + Math.sin(a) * h * 0.34 + Math.sin(f / 10 + i) * 2} r={Math.min(w, h) * 0.26} fill="#fff" />; })}
      <ellipse cx={w / 2} cy={h / 2} rx={w * 0.42} ry={h * 0.38} fill="#fff" /></svg>
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 48, color: C.ink, textAlign: 'center'}}>{children}</div></>;
};

// ---------- tanda 2: estructura / historia ----------
/** Línea de tiempo vertical: se dibuja y van apareciendo hitos. events=[{year:'33 d.C.', label:'Pentecostés'}] */
export const Timeline = ({at, x = 300, y0 = 380, y1 = 1600, events, dur = 50, color = '#fff', accent = C.yellow, size = 50}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.quad)); const n = events.length;
  return <><SndAt at={at} snd="08_subida_larga" vol={0.25} /><div style={{position: 'absolute', left: x - 5, top: y0, width: 10, height: (y1 - y0) * t, background: color, borderRadius: 5, boxShadow: '0 0 12px rgba(0,0,0,.4)'}} />
    {events.map((e, i) => { const yy = y0 + ((y1 - y0) * (i + 0.5)) / n; const a = at + (dur * (i + 0.5)) / n; const p = usePop(a);
      return <React.Fragment key={i}><SndAt at={a} snd="01_pop_texto" vol={0.3} />
        <div style={{position: 'absolute', left: x - 26, top: yy - 26, width: 52, height: 52, borderRadius: '50%', background: accent, border: `8px solid ${color}`, boxSizing: 'border-box', transform: `scale(${p})`}} />
        <div style={{position: 'absolute', left: x - 280, width: 230, top: yy - size * 0.6, textAlign: 'right', ...FONT, fontSize: size * 0.8, color: accent, opacity: p}}>{e.year}</div>
        <div style={{position: 'absolute', left: x + 50, top: yy - size * 0.6, ...FONT, fontWeight: 800, fontSize: size, transform: `translateX(${(1 - p) * 60}px)`, opacity: p, whiteSpace: 'nowrap'}}>{e.label}</div></React.Fragment>; })}</>;
};
/** Árbol / red de relaciones (genealogías, discípulos, iglesias). nodes=[{id,x,y,label,color}], edges=[[idA,idB]] */
export const Tree = ({at, nodes, edges, every = 6, r = 46, size = 38}) => {
  const f = useCurrentFrame(); const pos = Object.fromEntries(nodes.map((n, i) => [n.id, {...n, i}]));
  return <><svg width={W} height={H} style={{position: 'absolute'}}>{edges.map(([a, b], i) => { const A = pos[a], B = pos[b]; const s = at + Math.max(A.i, B.i) * every - 2; const t = ramp(f, s, s + 8);
      return <line key={i} x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * t} y2={A.y + (B.y - A.y) * t} stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />; })}</svg>
    {nodes.map((n, i) => { const p = usePop(at + i * every); return <React.Fragment key={n.id}><SndAt at={at + i * every} snd="02_pop_suave" vol={0.25} />
      <div style={{position: 'absolute', left: n.x - r, top: n.y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: n.color || '#fff', border: '6px solid #fff', boxSizing: 'border-box', transform: `scale(${p})`, boxShadow: '0 6px 12px rgba(0,0,0,.4)'}} />
      <div style={{position: 'absolute', left: n.x - 160, width: 320, top: n.y + r + 6, textAlign: 'center', ...FONT, fontWeight: 800, fontSize: size, opacity: p}}>{n.label}</div></React.Fragment>; })}</>;
};
/** Pantalla dividida con VS que golpea */
export const VS = ({at, cA = '#B03A48', cB = '#1F9E8F', left, right, snd = '07_impacto'}) => {
  const f = useCurrentFrame(); const a = ramp(f, at, at + 8, Easing.out(Easing.cubic)); const p = usePop(at + 8);
  return <><SndAt at={at} snd="05_whoosh_largo" vol={0.4} /><SndAt at={at + 8} snd={snd} />
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H / 2, background: cA, transform: `translateX(${(a - 1) * W}px)`}}>{left}</div>
    <div style={{position: 'absolute', left: 0, top: H / 2, width: W, height: H / 2, background: cB, transform: `translateX(${(1 - a) * W}px)`}}>{right}</div>
    <div style={{position: 'absolute', left: W / 2 - 110, top: H / 2 - 110, width: 220, height: 220, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Montserrat', fontWeight: 900, fontSize: 100, color: C.ink, transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, boxShadow: '0 10px 24px rgba(0,0,0,.5)'}}>VS</div></>;
};
/** Foco: oscurece todo menos un círculo */
export const Spotlight = ({at, x, y, r = 260, dark = 0.75, dur = 10, snd = '16_swell_invertido'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur); const R = r + (1 - t) * 1600;
  return <><SndAt at={at} snd={snd} vol={0.35} /><AbsoluteFill style={{background: `radial-gradient(circle ${R}px at ${x}px ${y}px, transparent 92%, rgba(0,0,0,${dark}) 100%)`, opacity: t}} /></>;
};
/** Pergamino que se despliega hacia abajo con contenido */
export const Scroll = ({at, x = W / 2, y = 500, w = 760, h = 900, dur = 16, snd = '19_pagina', children}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.out(Easing.cubic)); const p = usePop(at);
  const rod = (yy) => <div style={{position: 'absolute', left: x - w / 2 - 40, top: yy - 22, width: w + 80, height: 44, borderRadius: 22, background: 'linear-gradient(180deg,#C79A5B,#7A5222)', boxShadow: '0 6px 10px rgba(0,0,0,.4)'}} />;
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: x - w / 2, top: y, width: w, height: h * t, overflow: 'hidden', background: '#EFE2C2', backgroundImage: `url(${staticFile(PAPER)})`, backgroundSize: 'cover',
      boxShadow: 'inset 0 0 60px rgba(120,80,30,.45)', transform: `scaleX(${p})`}}><div style={{position: 'absolute', inset: 40, fontFamily: 'Caveat', fontWeight: 700, fontSize: 64, color: '#3A2A14', textAlign: 'center'}}>{children}</div></div>
    {rod(y)}{rod(y + h * t)}</>;
};

// ---------- tanda 2: movimiento de objetos y figuras ----------
/** Envuelve algo para que camine de fromX a toX (con pasos). Usar con Figure en x=0 relativo: <Walk ...><Figure x={0} .../></Walk> */
export const Walk = ({at = 0, dur = 30, fromX, toX, y = 0, steps = 6, snd = '25_pasos', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.sin)); const k = f >= at && f <= at + dur ? Math.abs(Math.sin((t * steps * Math.PI))) * -16 : 0;
  return <><SndAt at={at} snd={snd} vol={0.4} /><AbsoluteFill style={{transform: `translate(${fromX + (toX - fromX) * t}px, ${y + k}px) rotate(${f >= at && f <= at + dur ? Math.sin(t * steps * Math.PI) * 3 : 0}deg)`}}>{children}</AbsoluteFill></>;
};
/** Salto de alegría (con squash), pivote en (x,y) = pies */
export const Jump = ({at, x, y, h = 160, n = 1, snd = '53_resorte', children}) => {
  const f = useCurrentFrame(); const k = (f - at) / 14; const on = k >= 0 && k < n; const ph = on ? k % 1 : 0;
  const dy = on ? -Math.sin(ph * Math.PI) * h : 0; const sq = on && (ph < 0.12 || ph > 0.88) ? 0.9 : 1;
  return <><SndAt at={at} snd={snd} vol={0.4} /><AbsoluteFill style={{transform: `translateY(${dy}px) scale(${2 - sq}, ${sq})`, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill></>;
};
/** Desmayo / caída de costado, pivote en los pies (x,y) */
export const Faint = ({at, x, y, dir = 1, snd = '06_golpe_grave', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 14, Easing.in(Easing.quad)); const b = f > at + 14 ? Math.exp(-(f - at - 14) / 4) * Math.sin((f - at - 14) / 1.4) * 4 : 0;
  return <><SndAt at={at + 13} snd={snd} /><AbsoluteFill style={{transform: `rotate(${dir * (88 * t + b)}deg)`, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill></>;
};
/** Caída desde arriba con aplastamiento y golpe; (x,y) = punto de apoyo */
export const Drop = ({at, x, y, from = 900, snd = '07_impacto', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 10, Easing.in(Easing.quad)); const k = f - at - 10;
  const sq = k >= 0 ? 1 - 0.25 * Math.exp(-k / 3) * Math.cos(k / 1.6) : 1;
  if (f < at) return null;
  return <><SndAt at={at + 9} snd={snd} vol={0.55} /><AbsoluteFill style={{transform: `translateY(${-(1 - t) * from}px) scale(${2 - sq}, ${sq})`, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill></>;
};
/** Temblor de un objeto (nervios, terremoto, objeto a punto de romperse) */
export const Shake = ({at, dur = 20, amp = 10, children}) => {
  const f = useCurrentFrame(); const on = f >= at && f < at + dur; const k = on ? amp * (1 - (f - at) / dur) : 0;
  return <AbsoluteFill style={{transform: `translate(${Math.sin(f * 2.3) * k}px, ${Math.cos(f * 3.1) * k * 0.6}px) rotate(${Math.sin(f * 1.7) * k * 0.15}deg)`}}>{children}</AbsoluteFill>;
};
/** Multiplicar: copia `children` (un elemento de ~cell px, dibujado en su (0,0)) en grilla, una tras otra */
export const Multiply = ({at, x, y, n = 12, cols = 4, cell = 180, every = 3, snd = '01_pop_texto', children}) => {
  const rows = Math.ceil(n / cols);
  return <>{Array.from({length: n}, (_, i) => { const p = usePop(at + i * every); const cx = x + ((i % cols) - (cols - 1) / 2) * cell, cy = y + (Math.floor(i / cols) - (rows - 1) / 2) * cell;
    return <React.Fragment key={i}><SndAt at={at + i * every} snd={snd} vol={0.18} /><div style={{position: 'absolute', left: cx, top: cy, transform: `scale(${p})`}}>{children}</div></React.Fragment>; })}</>;
};
/** Multitud de figuras simples que aparecen en ola */
export const Crowd = ({at, x = W / 2, y = 1500, n = 24, rows = 3, s = 1.3, spread = 1020, color = '#F4F6F8', snd = '68_multitud'}) => {
  const f = useCurrentFrame(); const per = Math.ceil(n / rows);
  return <><SndAt at={at} snd={snd} vol={0.35} />{Array.from({length: n}, (_, i) => { const r = Math.floor(i / per), c = i % per; const p = usePop(at + c * 1.5 + r * 3);
    const cx = x - spread / 2 + (c + 0.5 + (r % 2) * 0.5) * (spread / per); const cy = y - r * 70 * s * 1.6; const sc = s * (1 - r * 0.12); const dy = Math.sin((f + i * 7) / 9) * 3;
    return <svg key={i} width={100 * sc} height={190 * sc} viewBox="-50 -95 100 190" style={{position: 'absolute', left: cx - 50 * sc, top: cy - 190 * sc + dy, transform: `scale(${p})`, transformOrigin: '50% 100%', zIndex: 100 - r, filter: `brightness(${1 - r * 0.12})`}}>
      <circle cx={0} cy={-62} r={30} fill={color} /><path d="M-32 95 L-32 -2 C-32 -20 -20 -28 0 -28 C20 -28 32 -20 32 -2 L32 95 Z" fill={color} /></svg>; })}</>;
};

// ---------- tanda 2: partículas y atmósfera ----------
/** Estallido de destellos radial (milagro, idea, revelación) */
export const Burst = ({at, x, y, n = 16, r = 260, color = C.yellow, snd = '31_glitter'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 18, Easing.out(Easing.cubic));
  if (f < at || t >= 1) return f < at ? null : <SndAt at={at} snd={snd} />;
  return <><SndAt at={at} snd={snd} /><svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 + random('bu' + i) * 0.3; const rr = r * (0.6 + 0.4 * random('br' + i)) * t;
    return <line key={i} x1={x + Math.cos(a) * rr * 0.5} y1={y + Math.sin(a) * rr * 0.5} x2={x + Math.cos(a) * rr} y2={y + Math.sin(a) * rr} stroke={color} strokeWidth={10 * (1 - t) + 2} strokeLinecap="round" opacity={1 - t} />; })}</svg></>;
};
/** Confeti cayendo (celebración) */
export const Confetti = ({at, n = 80, dur = 60, snd = '54_aplauso'}) => {
  const f = useCurrentFrame(); const k = f - at; if (k < 0 || k > dur + 40) return null;
  const cols = [C.yellow, C.red, C.cyan, C.green, '#FF7AC6', '#fff'];
  return <><SndAt at={at} snd={snd} vol={0.35} /><svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: n}, (_, i) => { const x0 = random('cx' + i) * W, v = 14 + random('cv' + i) * 14, d = random('cd' + i) * 20;
    const yy = -40 + (k - d) * v; const xx = x0 + Math.sin((k + i) / 7) * 30; return yy > -40 && <rect key={i} x={xx} y={yy} width={18} height={30} fill={cols[i % 6]} transform={`rotate(${(k + i * 13) * 8} ${xx + 9} ${yy + 15})`} />; })}</svg></>;
};
/** Lluvia (diluvio, tormenta). Para continuo: at=0 */
export const Rain = ({at = 0, n = 140, angle = 12, o = 0.55, snd = null}) => {
  const f = useCurrentFrame(); if (f < at) return null;
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute', opacity: o}}>{Array.from({length: n}, (_, i) => { const x0 = random('rx' + i) * (W + 300), v = 60 + random('rv' + i) * 30;
    const yy = ((random('ry' + i) * H + (f - at) * v) % (H + 200)) - 100; const xx = x0 - yy * Math.tan((angle * Math.PI) / 180);
    return <line key={i} x1={xx} y1={yy} x2={xx - 10} y2={yy + 70} stroke="#CFE3FF" strokeWidth={3} />; })}</svg></>;
};
/** Partículas flotando: 'dust' (polvo dorado / ambiente sagrado), 'snow', 'embers' (brasas que suben: fuego, sacrificio) */
export const Floaters = ({kind = 'dust', n = 50, o = 0.8}) => {
  const f = useCurrentFrame(); const up = kind === 'embers' ? -1 : 1; const col = {dust: '#FFE9A8', snow: '#fff', embers: '#FF8A3D'}[kind];
  return <svg width={W} height={H} style={{position: 'absolute', opacity: o}}>{Array.from({length: n}, (_, i) => { const v = (kind === 'snow' ? 2.5 : 1.2) + random('fv' + i) * 2; const r = 2 + random('fr' + i) * (kind === 'dust' ? 4 : 6);
    const yy = ((random('fy' + i) * H + up * f * v) % H + H) % H; const xx = random('fx' + i) * W + Math.sin((f + i * 20) / 30) * 25;
    return <circle key={i} cx={xx} cy={yy} r={r} fill={col} opacity={kind === 'embers' ? 0.5 + 0.5 * Math.sin(f / 4 + i) : 0.4 + 0.6 * random('fo' + i)} style={kind !== 'snow' ? {filter: `drop-shadow(0 0 6px ${col})`} : undefined} />; })}</svg>;
};

// ---------- tanda 2: filtros de época / tiempo ----------
/** Película vieja: sepia, grano, parpadeo y rayas (archivo histórico, recuerdo) */
export const OldFilm = ({children, sepia = 0.85}) => {
  const f = useCurrentFrame(); const fl = 0.9 + 0.1 * random('fl' + f); const sx = random('sc' + Math.floor(f / 3)) * W;
  return <AbsoluteFill><AbsoluteFill style={{filter: `sepia(${sepia}) contrast(1.1) brightness(${fl})`}}>{children}</AbsoluteFill>
    <div style={{position: 'absolute', left: sx, top: 0, width: 3, height: H, background: 'rgba(255,255,255,.35)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(circle, transparent 50%, rgba(40,25,10,.6) 100%)'}} /></AbsoluteFill>;
};
/** Rebobinar: líneas VHS + desplazamiento + tinte (volver atrás en el tiempo) */
export const Rewind = ({at, dur = 24, snd = '16_swell_invertido', children}) => {
  const f = useCurrentFrame(); const on = f >= at && f < at + dur; const j = on ? (random('rw' + f) - 0.5) * 40 : 0;
  return <AbsoluteFill><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `translateX(${j}px)`, filter: on ? 'saturate(.4) hue-rotate(-20deg) contrast(1.3)' : 'none'}}>{children}</AbsoluteFill>
    {on && <><AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 3px, transparent 3px 9px)'}} />
      <div style={{position: 'absolute', left: 0, top: ((f - at) * 90) % H, width: W, height: 70, background: 'rgba(255,255,255,.25)', filter: 'blur(6px)'}} />
      <div style={{position: 'absolute', left: 60, top: 80, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 80, color: '#fff'}}>◀◀</div></>}</AbsoluteFill>;
};

// =====================================================================
// ---------- tanda 3: bíblicos ----------
/** Arrodillado / sentado: envuelve una Figure. (x,y) = pies de la figura original. low = cuánto baja (px de figura) */
export const Kneel = ({at = 0, x, y, s = 1, low = 70, dur = 10, color = null, snd = '52_madera', children}) => {  // color = color de la ropa (rodilla)
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.out(Easing.cubic)); const d = low * s * t;
  return <><SndAt at={at} snd={at > 0 ? snd : null} vol={0.3} /><AbsoluteFill style={{transform: `translateY(${d}px)`, clipPath: `inset(0 0 ${H - y}px 0)`}}>{children}</AbsoluteFill>
    {t > 0.05 && <div style={{position: 'absolute', left: x - 10 * s, top: y - 40 * s * t, width: 70 * s, height: 40 * s * t, borderRadius: `${20 * s}px ${20 * s}px 0 0`, background: color || 'linear-gradient(180deg,#fff,#D5DCE6)'}} />}</>;
};
/** Ascensión: la figura sube, se achica y se pierde en luz/nube. Envuelve la Figure; (x,y) = centro */
export const Ascend = ({at, dur = 50, x, y, rise = 900, snd = '26_coro', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.in(Easing.quad));
  return <><SndAt at={at} snd={snd} vol={0.5} /><AbsoluteFill style={{transform: `translateY(${-rise * t}px) scale(${1 - 0.5 * t})`, transformOrigin: `${x}px ${y}px`, opacity: 1 - ramp(f, at + dur * 0.7, at + dur), filter: `brightness(${1 + t})`}}>{children}</AbsoluteFill>
    <div style={{position: 'absolute', left: x - 400, top: y - rise - 260, width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,.95) 20%, rgba(255,255,255,0) 70%)', opacity: ramp(f, at + dur * 0.4, at + dur), filter: 'blur(8px)'}} /></>;
};
/** Aureola sobre la cabeza (x,y = centro cabeza) */
export const Halo = ({at = 0, x, y, s = 1, color = '#FFE08A', snd = null}) => {
  const p = usePop(at); const f = useCurrentFrame();
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: x - 60 * s, top: y - 78 * s, width: 120 * s, height: 30 * s, borderRadius: '50%', border: `${7 * s}px solid ${color}`, boxShadow: `0 0 ${18 + 6 * Math.sin(f / 8)}px ${color}`, transform: `scale(${p})`}} /></>;
};
/** Rayos de luz desde el cielo que giran lento (presencia de Dios, gloria) */
export const HeavenRays = ({at = 0, x = W / 2, y = -100, n = 12, color = '#FFF2C4', o = 0.55, snd = '26_coro'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 25); const rot = (f - at) * 0.15;
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute', opacity: o * t, mixBlendMode: 'screen'}}><defs><linearGradient id="hrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="1" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>{Array.from({length: n}, (_, i) => { const a = -60 + (i / (n - 1)) * 120; return <path key={i} d="M0 0 L-55 2200 L55 2200 Z" fill="url(#hrg)" transform={`rotate(${a})`} />; })}</g></svg></>;
};
/** Paloma que desciende con luz (bautismo, Espíritu). src = imagen de paloma */
export const DoveDescend = ({at, x, y, dur = 30, src = 'objetos/animales/paloma.png', w = 220, snd = '31_glitter'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.out(Easing.cubic)); const flap = 1 + 0.06 * Math.sin((f - at) / 2);
  if (f < at) return null;
  return <><SndAt at={at} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: x - w, top: y - w + (t - 1) * 900, width: 2 * w, height: 2 * w, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,190,.8), transparent 65%)'}} />
    <Img src={staticFile(src)} style={{position: 'absolute', left: x - w / 2, top: y - w / 2 + (t - 1) * 900, width: w, height: w, objectFit: 'contain', transform: `scaleY(${flap})`, filter: 'drop-shadow(0 0 20px #fff)'}} /></>;
};
/** Alas de ángel detrás de una figura (poner ANTES de la Figure). x,y = hombros en pantalla */
export const Wings = ({at = 0, x, y, s = 1, color = '#FFFFFF', snd = '31_glitter'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const flap = Math.sin((f - at) / 6) * 6;
  const wing = (dir) => <g transform={`scale(${dir} 1) rotate(${flap})`}>
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M10 0 C60 ${-80 + i * 22} ${150 - i * 18} ${-120 + i * 30} ${190 - i * 25} ${-60 + i * 35} C${130 - i * 10} ${-20 + i * 20} 70 ${10 + i * 8} 10 ${20 + i * 6} Z`} fill={color} stroke="#D9DEE8" strokeWidth="3" opacity={1 - i * 0.12} />)}</g>;
  return <><SndAt at={at} snd={at > 0 ? snd : null} vol={0.35} /><svg width={500 * s} height={300 * s} viewBox="-250 -150 500 300" style={{position: 'absolute', left: x - 250 * s, top: y - 150 * s, transform: `scale(${p})`, overflow: 'visible', filter: 'drop-shadow(0 0 16px rgba(255,255,255,.7))'}}>{wing(1)}{wing(-1)}</svg></>;
};
/** Llamitas sobre la cabeza (Pentecostés). x,y = centro cabeza */
export const Flame = ({at = 0, x, y, s = 1, snd = '62_fuego'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const k = f - at; const fl = 1 + 0.12 * Math.sin(k / 2) + 0.06 * Math.sin(k / 1.3);
  return <><SndAt at={at} snd={snd} vol={0.25} /><svg width={80 * s} height={110 * s} viewBox="-40 -100 80 110" style={{position: 'absolute', left: x - 40 * s, top: y - 150 * s, transform: `scale(${p}) scaleY(${fl})`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 0 14px #FF9A2E)', overflow: 'visible'}}>
    <path d="M0 0 C-30 -10 -32 -45 -8 -70 C-10 -50 4 -48 2 -95 C22 -70 34 -40 26 -18 C22 -6 12 0 0 0 Z" fill="#FF7A1A" /><path d="M0 -4 C-14 -8 -14 -30 0 -48 C4 -34 14 -30 12 -16 C10 -8 6 -4 0 -4 Z" fill="#FFD23F" /></svg></>;
};
/** Fuego animado (zarza, altar, horno). x,y = base; w = ancho */
export const Fire = ({at = 0, x, y, w = 300, h = 380, snd = '62_fuego'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 12); const n = 7;
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={w * 1.4} height={h * 1.3} viewBox={`${-w * 0.7} ${-h * 1.2} ${w * 1.4} ${h * 1.3}`} style={{position: 'absolute', left: x - w * 0.7, top: y - h * 1.2, overflow: 'visible', filter: 'drop-shadow(0 0 30px #FF7A1A)', mixBlendMode: 'screen'}}>
    {[['#E8401C', 1], ['#FF8A1F', 0.75], ['#FFD23F', 0.5]].map(([c, k], j) => <g key={j}>{Array.from({length: n}, (_, i) => { const xx = (i / (n - 1) - 0.5) * w * k; const hh = h * k * t * (0.6 + 0.4 * Math.abs(Math.sin(f / (3 + i % 3) + i))) * (1 - Math.abs(i / (n - 1) - 0.5));
      const ww = (w * k) / n * 1.6; return <path key={i} d={`M${xx - ww / 2} 0 C${xx - ww / 2} ${-hh * 0.5} ${xx + Math.sin(f / 4 + i) * 12} ${-hh * 0.8} ${xx + Math.sin(f / 5 + i) * 18} ${-hh * 1.4} C${xx + ww / 2} ${-hh * 0.6} ${xx + ww / 2} ${-hh * 0.3} ${xx + ww / 2} 0 Z`} fill={c} />; })}</g>)}</svg></>;
};
/** Cielo que pasa de día a noche (o al revés) con sol/luna en arco. t va de 0 (día) a 1 (noche) entre at y at+dur */
export const DayNight = ({at, dur = 60, reverse = false, snd = null}) => {
  const f = useCurrentFrame(); let t = ramp(f, at, at + dur, Easing.inOut(Easing.sin)); if (reverse) t = 1 - t;
  const mix = (a, b) => { const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`; };
  const ang = Math.PI * (1 - t); const sx = W / 2 + Math.cos(ang) * 420, sy = 1100 - Math.sin(ang) * 750;
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{background: `linear-gradient(180deg, ${mix('#4FA3E8', '#070B1E')} 0%, ${mix('#F6C77A', '#1B2147')} 100%)`}} />
    <div style={{position: 'absolute', left: sx - 90, top: sy - 90, width: 180, height: 180, borderRadius: '50%', background: '#FFE08A', boxShadow: '0 0 80px #FFD23F', opacity: 1 - t}} />
    <div style={{position: 'absolute', left: W - sx - 70, top: 1100 - Math.sin(Math.PI * t) * 750 - 70, width: 140, height: 140, borderRadius: '50%', background: '#F2F2F8', boxShadow: '0 0 50px #fff', opacity: t}} />
    <svg width={W} height={H} style={{position: 'absolute', opacity: t}}>{stars.slice(0, 90).map((s, i) => <circle key={i} cx={s.x} cy={s.y * 0.6} r={s.r} fill="#fff" />)}</svg></>;
};
/** Oscuridad total que cae sobre la escena (crucifixión, plaga de tinieblas) */
export const Darkness = ({at, dur = 30, o = 0.9, snd = '35_drone_grave'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur);
  return <><SndAt at={at} snd={snd} vol={0.5} /><AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(5,5,10,${o * t * 0.75}) 0%, rgba(0,0,0,${o * t}) 70%)`}} /></>;
};
/** Mar que se abre en dos paredes de agua (Mar Rojo, Jordán). Ocupa la parte de abajo */
export const SeaPart = ({at, dur = 40, top = 900, gap = 420, snd = '56_agua_corre'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const g = gap * t;
  const wall = (side) => { const x0 = side < 0 ? 0 : W / 2 + g / 2, x1 = side < 0 ? W / 2 - g / 2 : W; const crest = (xx) => top - t * 250 * (1 - Math.abs(xx - W / 2) / (W / 2)) + Math.sin(f / 5 + xx / 60) * 12;
    const pts = Array.from({length: 13}, (_, i) => { const xx = x0 + ((x1 - x0) * i) / 12; return `${xx},${crest(xx)}`; }).join(' ');
    return <polygon points={`${x0},${H} ${pts} ${x1},${H}`} fill="url(#seag)" />; };
  return <><SndAt at={at} snd={snd} vol={0.5} /><svg width={W} height={H} style={{position: 'absolute'}}><defs><linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5CC2E8" /><stop offset="1" stopColor="#0B3A6E" /></linearGradient></defs>
    <rect x={W / 2 - g / 2} y={top + 120} width={g} height={H} fill="#C9A66B" opacity={t} />{wall(-1)}{wall(1)}</svg></>;
};
/** Agua que sube (diluvio). from/to = nivel en px desde arriba */
export const FloodRise = ({at, dur = 60, from = H, to = 700, snd = '60_lluvia_trueno'}) => {
  const f = useCurrentFrame(); const lvl = from + (to - from) * ramp(f, at, at + dur, Easing.inOut(Easing.quad));
  const wave = Array.from({length: 25}, (_, i) => `${i * 45},${lvl + Math.sin(f / 6 + i / 1.5) * 14}`).join(' ');
  return <><SndAt at={at} snd={snd} vol={0.45} /><svg width={W} height={H} style={{position: 'absolute'}}><defs><linearGradient id="flg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3E8FC4" stopOpacity=".85" /><stop offset="1" stopColor="#0A2A4E" stopOpacity=".95" /></linearGradient></defs>
    <polygon points={`0,${H} ${wave} ${W},${H}`} fill="url(#flg)" /></svg></>;
};
/** Mar en tormenta con olas (Jonás, la tormenta calmada). calm = frame en que se calma */
export const StormSea = ({top = 1150, calm = 9999, snd = null}) => {
  const f = useCurrentFrame(); const a = 1 - ramp(f, calm, calm + 30);
  const layer = (dy, amp, sp, c) => <polygon points={`0,${H} ${Array.from({length: 25}, (_, i) => `${i * 45},${top + dy + Math.sin(f / sp + i / 1.3) * amp * (0.15 + 0.85 * a)}`).join(' ')} ${W},${H}`} fill={c} />;
  return <><SndAt at={0} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute'}}>{layer(0, 60, 4, '#1F5C8C')}{layer(60, 45, 3, '#174A73')}{layer(130, 35, 2.5, '#0F3556')}</svg></>;
};
/** Terremoto: grietas que se dibujan + temblor (envolver la escena) */
export const Earthquake = ({at, dur = 40, amp = 22, snd = '61_trueno', children}) => {
  const f = useCurrentFrame(); const on = f >= at && f < at + dur; const k = on ? amp * (1 - (f - at) / dur) : 0; const t = ramp(f, at + 4, at + 18);
  const cracks = ['M540 1920 L500 1820 L580 1720 L520 1600 L600 1480', 'M500 1820 L340 1760 L220 1700', 'M580 1720 L760 1680 L900 1600'];
  return <><SndAt at={at} snd={snd} vol={0.6} /><AbsoluteFill style={{transform: `translate(${(random('eq' + f) - 0.5) * k}px, ${(random('eqy' + f) - 0.5) * k}px)`}}>{children}
    <svg width={W} height={H} style={{position: 'absolute'}}>{cracks.map((d, i) => <path key={i} d={d} stroke="#16110C" strokeWidth={14 - i * 4} fill="none" strokeLinejoin="round" strokeDasharray={900} strokeDashoffset={900 * (1 - t)} />)}</svg></AbsoluteFill></>;
};
/** Relámpago con destello */
export const Lightning = ({at, x = W / 2, y0 = 0, y1 = 1100, snd = '61_trueno'}) => {
  const f = useCurrentFrame(); const k = f - at; if (k < 0 || k > 10) return k < 0 ? null : <SndAt at={at} snd={snd} />;
  const pts = Array.from({length: 9}, (_, i) => `${x + (i % 2 ? 1 : -1) * random('lt' + at + i) * 90},${y0 + ((y1 - y0) * i) / 8}`).join(' ');
  const o = k < 2 || (k > 3 && k < 5) ? 1 : 0.3;
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{background: '#fff', opacity: o * 0.5}} /><svg width={W} height={H} style={{position: 'absolute', opacity: o, filter: 'drop-shadow(0 0 20px #BFE3FF)'}}><polyline points={pts} stroke="#fff" strokeWidth={14} fill="none" strokeLinejoin="round" /></svg></>;
};
/** Arcoíris que se dibuja (pacto con Noé) */
export const Rainbow = ({at, x = W / 2, y = 1200, r = 700, dur = 24, snd = '31_glitter'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.inOut(Easing.cubic)); const cols = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#3949AB', '#8E24AA']; const L = Math.PI * r;
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute', opacity: 0.85}}>{cols.map((c, i) => { const rr = r - i * 34; const LL = Math.PI * rr;
    return <path key={i} d={`M${x - rr} ${y} A${rr} ${rr} 0 0 1 ${x + rr} ${y}`} stroke={c} strokeWidth={34} fill="none" strokeDasharray={LL} strokeDashoffset={LL * (1 - t)} />; })}</svg></>;
};
/** Estrella que guía y se mueve dejando estela (Belén) */
export const GuideStar = ({at, from = [150, 300], to = [800, 600], dur = 50, snd = '30_tintineo'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.sin)); const x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t; const tw = 1 + 0.15 * Math.sin(f / 3);
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute'}}>
    {Array.from({length: 14}, (_, i) => { const tt = Math.max(0, t - i * 0.02); return <circle key={i} cx={from[0] + (to[0] - from[0]) * tt} cy={from[1] + (to[1] - from[1]) * tt} r={10 - i * 0.6} fill="#FFF3C4" opacity={0.6 - i * 0.04} />; })}
    <g transform={`translate(${x} ${y}) scale(${tw})`} style={{filter: 'drop-shadow(0 0 24px #FFE08A)'}}><path d="M0 -70 L12 -12 L70 0 L12 12 L0 70 L-12 12 L-70 0 L-12 -12 Z" fill="#FFF6D8" /><circle r={16} fill="#fff" /></g></svg></>;
};
/** El cielo se llena de estrellas (promesa a Abraham) */
export const StarsFill = ({at, dur = 60, n = 400, snd = '31_glitter'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.in(Easing.quad)); const k = Math.floor(n * t);
  return <><SndAt at={at} snd={snd} vol={0.35} /><svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: k}, (_, i) => <circle key={i} cx={random('sf' + i) * W} cy={random('sfy' + i) * H * 0.75} r={0.8 + random('sfr' + i) * 2.6} fill="#fff" opacity={0.5 + 0.5 * Math.abs(Math.sin(f / 20 + i))} />)}</svg></>;
};
/** Enjambre (langostas, ranas, moscas): puntos que barren la pantalla */
export const Swarm = ({at, dur = 60, n = 160, color = '#3B2F1E', size = 10, snd = '39_estatica'}) => {
  const f = useCurrentFrame(); const k = f - at; if (k < 0) return null; const t = ramp(f, at, at + dur);
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: n}, (_, i) => { const y0 = random('swy' + i) * H; const sp = 0.7 + random('sws' + i) * 0.6;
    const x = -200 + (W + 400) * ((t * sp * 1.6 + random('swx' + i) * 0.5) % 1.3); const y = y0 + Math.sin(k / 3 + i) * 20; return <ellipse key={i} cx={x} cy={y} rx={size * 1.4} ry={size * 0.7} fill={color} transform={`rotate(${Math.sin(k / 4 + i) * 20} ${x} ${y})`} />; })}</svg></>;
};
/** Muro que se derrumba (Jericó): bloques que caen girando. x,y = esquina sup izq del muro */
export const WallsFall = ({at, x = 140, y = 900, cols = 8, rows = 6, b = 100, color = '#C8A26B', snd = '61_trueno'}) => {
  const f = useCurrentFrame();
  return <><SndAt at={at} snd={snd} /><SndAt at={at + 8} snd="07_impacto" vol={0.5} />{Array.from({length: cols * rows}, (_, i) => { const c = i % cols, r = Math.floor(i / cols); const d = (rows - r) * 2 + random('wf' + i) * 6; const k = Math.max(0, f - at - d);
    const dy = 0.9 * k * k; const rot = k * (random('wr' + i) - 0.5) * 14; const dx = k * (random('wd' + i) - 0.5) * 6;
    return <div key={i} style={{position: 'absolute', left: x + c * b + (r % 2) * b / 2 + dx, top: y + r * b * 0.6 + dy, width: b - 6, height: b * 0.6 - 6, background: color, border: '3px solid #8A6A3C', borderRadius: 6, transform: `rotate(${rot}deg)`, opacity: dy > 1200 ? 0 : 1}} />; })}</>;
};
/** Piedra que rueda y deja ver la entrada del sepulcro vacío */
export const StoneRoll = ({at, x = W / 2, y = 1150, r = 240, dur = 40, snd = '71_piedra_rueda'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const dx = t * r * 2.3;
  return <><SndAt at={at} snd={snd} />
    <div style={{position: 'absolute', left: x - r * 1.2, top: y - r * 1.25, width: r * 2.4, height: r * 2.5, background: '#8E7B63', borderRadius: '50% 50% 8px 8px'}} />
    <div style={{position: 'absolute', left: x - r * 0.8, top: y - r * 0.9, width: r * 1.6, height: r * 1.9, background: '#100C08', borderRadius: '50% 50% 0 0', boxShadow: `inset 0 0 ${40 + 60 * t}px rgba(255,236,170,${0.6 * t})`}} />
    <div style={{position: 'absolute', left: x - r + dx, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #B9A88E, #6E5D47)', border: '8px solid #5A4A36', transform: `rotate(${(dx / r) * 57}deg)`, boxShadow: '0 12px 24px rgba(0,0,0,.5)'}}>
      <div style={{position: 'absolute', left: '20%', top: '48%', width: '60%', height: 8, background: '#5A4A36'}} /></div></>;
};
/** Velo / cortina que se rasga de arriba abajo (velo del templo) */
export const VeilTear = ({at, dur = 18, color = '#7A1F2B', snd = '47_papel_rasga', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.in(Easing.quad)); const tear = ramp(f, at, at + dur * 0.5);
  const half = (side) => <div style={{position: 'absolute', top: 0, height: H, width: W / 2 + 10, [side < 0 ? 'left' : 'right']: 0, background: `repeating-linear-gradient(90deg, ${color} 0 40px, ${shade(color, -0.25)} 40px 80px)`,
    clipPath: side < 0 ? `polygon(0 0, 100% 0, 100% ${tear * 100}%, 95% 100%, 0 100%)` : `polygon(0 0, 100% 0, 100% 100%, 5% 100%, 0 ${tear * 100}%)`, transform: `translateX(${side * Math.max(0, t - 0.5) * 2 * W * 0.6}px) skewX(${side * Math.max(0, t - 0.5) * 10}deg)`, boxShadow: 'inset 0 0 80px rgba(0,0,0,.5)'}} />;
  return <AbsoluteFill><SndAt at={at} snd={snd} vol={0.7} />{children}{t < 1 && <>{half(-1)}{half(1)}</>}</AbsoluteFill>;
};
/** Cadenas que se rompen (libertad, Pedro en la cárcel). x,y = centro */
export const ChainsBreak = ({at, x, y, w = 600, snd = '23_cadena'}) => {
  const f = useCurrentFrame(); const k = Math.max(0, f - at); const n = 9;
  return <><SndAt at={at} snd={snd} /><SndAt at={at} snd="70_vidrio_rompe" vol={0.3} />{Array.from({length: n}, (_, i) => { const side = i < n / 2 ? -1 : 1; const off = k > 0 ? side * k * 14 : 0; const dy = k > 0 ? 0.6 * k * k : 0;
    return <div key={i} style={{position: 'absolute', left: x - w / 2 + (i * w) / n + off, top: y - 30 + dy, width: w / n + 18, height: 60, border: '12px solid #8A9099', borderRadius: 30, boxSizing: 'border-box', transform: `rotate(${(i % 2 ? 0 : 0) + k * side * 4}deg)`, background: 'transparent', boxShadow: '0 4px 8px rgba(0,0,0,.4)'}} />; })}
    {k > 0 && k < 10 && <div style={{position: 'absolute', left: x - 120, top: y - 120, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, #fff, transparent 65%)', opacity: 1 - k / 10}} />}</>;
};
/** Líquido que cambia de color dentro de un recipiente (agua en vino). Poner sobre un cántaro: x,y,w,h = zona del líquido */
export const ColorFill = ({at, x, y, w = 200, h = 160, from = '#7FC6E8', to = '#7A1030', dur = 30, snd = '31_glitter'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur);
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: '0 0 40% 40%', background: from, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: `${t * 100}%`, background: to, borderRadius: '45% 45% 0 0 / 10px 10px 0 0'}} /></div></>;
};
/** Columna de nube (día) o de fuego (noche) */
export const Pillar = ({at = 0, x = W / 2, kind = 'cloud', w = 260, snd = '35_drone_grave'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 30); const fire = kind === 'fire';
  return <><SndAt at={at} snd={snd} vol={0.3} /><svg width={W} height={H} style={{position: 'absolute', opacity: t, filter: fire ? 'blur(10px) drop-shadow(0 0 30px #FF8A1F)' : 'blur(4px)', mixBlendMode: fire ? 'screen' : 'normal'}}>
    {Array.from({length: 18}, (_, i) => { const y = H - ((i * 130 + f * (fire ? 6 : 2)) % (H + 200)); const xx = x + Math.sin(i * 1.7 + f / 30) * w * 0.25; const r = w * (0.4 + 0.2 * Math.sin(i * 2.3));
      return <circle key={i} cx={xx} cy={y} r={r} fill={fire ? ['#FF7A1A', '#FFB347', '#E8401C'][i % 3] : ['#F4F6F8', '#DCE2EA', '#FFFFFF'][i % 3]} opacity={fire ? 0.7 : 0.9} />; })}</svg></>;
};
/** Comparación de escala: silueta humana de referencia + barra de altura con etiqueta */
export const ScaleRef = ({at, x = 200, ground = 1600, human = 180, objH = 1100, label = '137 m', snd = '45_escaneo'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const t = ramp(f, at + 8, at + 30, Easing.out(Easing.cubic));
  return <><SndAt at={at + 8} snd={snd} vol={0.3} /><svg width={60} height={human} viewBox="-30 -120 60 120" style={{position: 'absolute', left: x - 30, top: ground - human, transform: `scale(${p})`, transformOrigin: '50% 100%'}}>
      <circle cx={0} cy={-100} r={18} fill="#fff" /><path d="M-20 0 L-20 -60 C-20 -74 -12 -80 0 -80 C12 -80 20 -74 20 -60 L20 0 Z" fill="#fff" /></svg>
    <div style={{position: 'absolute', left: x + 60, top: ground - objH * t, width: 8, height: objH * t, background: C.yellow}} />
    <div style={{position: 'absolute', left: x + 40, top: ground - objH * t, width: 48, height: 8, background: C.yellow}} />
    <div style={{position: 'absolute', left: x + 90, top: ground - objH * t - 30, ...FONT, fontSize: 64, color: C.yellow, opacity: t}}>{label}</div></>;
};
/** Tarjeta de versículo: texto + referencia */
export const VerseCard = ({at, y = 650, text, cite, w = 900, size = 66, snd = '19_pagina'}) => {
  const p = usePop(at, true); const f = useCurrentFrame(); const t2 = ramp(f, at + 12, at + 22);
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: (W - w) / 2, top: y, width: w, padding: '50px 56px', boxSizing: 'border-box', background: 'rgba(250,246,236,.96)', borderRadius: 28,
    boxShadow: '0 20px 40px rgba(0,0,0,.45)', transform: `translateY(${(1 - p) * 120}px) scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, p * 1.5)}}>
    <div style={{position: 'absolute', left: 28, top: -10, fontFamily: 'Georgia, serif', fontSize: 180, color: '#C9A227', lineHeight: 1}}>“</div>
    <div style={{fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: size, color: '#2A2116', lineHeight: 1.25, textAlign: 'center'}}>{text}</div>
    <div style={{marginTop: 28, textAlign: 'right', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 44, color: '#8A6A1C', opacity: t2, letterSpacing: 2}}>— {cite}</div></div></>;
};
/** Subtítulos sincronizados. words=[{w:'palabra', t: frameInicio}] ; muestra de a `per` palabras, resalta la actual */
export const Captions = ({words, y = 1450, per = 4, size = 78, hl = C.yellow}) => {
  const f = useCurrentFrame(); let cur = -1; words.forEach((w, i) => { if (f >= w.t) cur = i; }); if (cur < 0) return null;
  const g0 = Math.floor(cur / per) * per; const grp = words.slice(g0, g0 + per); const pIn = spring({frame: f - words[g0].t, fps: 30, config: {damping: 12, stiffness: 220}});
  return <div style={{position: 'absolute', left: 40, width: W - 80, top: y, textAlign: 'center', transform: `scale(${0.85 + 0.15 * pIn})`}}>{grp.map((w, i) => { const on = g0 + i === cur; const shown = g0 + i <= cur;
    return <span key={i} style={{display: 'inline-block', margin: '0 10px', fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, textTransform: 'uppercase', color: on ? hl : '#fff', opacity: shown ? 1 : 0.35,
      WebkitTextStroke: '3px #111', paintOrder: 'stroke', textShadow: '0 6px 12px rgba(0,0,0,.6)', transform: `scale(${on ? 1.08 : 1})`}}>{w.w}</span>; })}</div>;
};
/** Cierre / llamado a la acción */
export const EndCTA = ({at, text = 'Seguime para la parte 2', sub = '', snd = '10_ding'}) => {
  const p = usePop(at); const f = useCurrentFrame(); const pulse = 1 + 0.04 * Math.sin((f - at) / 5);
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{background: `rgba(0,0,0,${0.55 * ramp(f, at, at + 8)})`}} />
    <div style={{position: 'absolute', left: 90, width: W - 180, top: 760, padding: '44px 30px', borderRadius: 40, background: C.red, textAlign: 'center', transform: `scale(${p * pulse})`, boxShadow: '0 20px 40px rgba(0,0,0,.5)', ...FONT, fontSize: 70}}>
      {text}{sub && <div style={{fontSize: 40, fontWeight: 700, marginTop: 10, opacity: 0.9}}>{sub}</div>}</div></>;
};

// =====================================================================
// ---------- tanda 4: reacciones genéricas ----------
/** Movimientos de cabeza (usar como props de Figure): headDy={nodAt(f, at)} ; look={headShakeAt(f, at)} ; headRot={tiltAt(f, at)} */
export const nodAt = (f, at, n = 2, amp = 8) => { const k = f - at; return k >= 0 && k < n * 10 ? Math.sin((k / 10) * Math.PI * 2) * amp * (k < 5 ? k / 5 : 1) : 0; };
export const headShakeAt = (f, at, n = 3, amp = 2.5) => { const k = f - at; return k >= 0 && k < n * 8 ? Math.sin((k / 8) * Math.PI * 2) * amp : 0; };
export const tiltAt = (f, at, ang = 14, dur = 8) => ang * ramp(f, at, at + dur, Easing.out(Easing.back(2)));
/** Doble mirada: mira a un lado, vuelve, y otra vez rápido (look para Figure) */
export const doubleTakeAt = (f, at, dir = 1) => { const k = f - at; if (k < 0) return 0; if (k < 6) return dir * 3 * (k / 6); if (k < 12) return dir * 3 * (1 - (k - 6) / 6); if (k < 15) return dir * 4 * ((k - 12) / 3); return dir * 4; };

const Pivot = ({x, y, tf, children}) => <AbsoluteFill style={{transform: tf, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill>;
/** Temblor de miedo (rápido y chico). (x,y)= pies */
export const Tremble = ({at = 0, dur = 999, x, y, amp = 4, snd = null, children}) => {
  const f = useCurrentFrame(); const on = f >= at && f < at + dur;
  return <><SndAt at={at} snd={snd} /><Pivot x={x} y={y} tf={on ? `translateX(${Math.sin(f * 2.6) * amp}px) rotate(${Math.sin(f * 3.3) * amp * 0.3}deg)` : 'none'}>{children}</Pivot></>;
};
/** Desinflarse (desánimo): se achata y se encorva. (x,y) = pies */
export const Deflate = ({at, x, y, dur = 14, snd = '75_suspiro', children}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.out(Easing.cubic));
  return <><SndAt at={at} snd={snd} vol={0.4} /><Pivot x={x} y={y} tf={`scale(${1 + 0.06 * t}, ${1 - 0.14 * t}) rotate(${4 * t}deg)`}>{children}</Pivot></>;
};
/** Inflarse (orgullo, confianza): crece y saca pecho */
export const PuffUp = ({at, x, y, dur = 10, k = 0.15, snd = '09_subida_corta', children}) => {
  const p = spring({frame: useCurrentFrame() - at, fps: 30, config: {damping: 8, stiffness: 160}});
  return <><SndAt at={at} snd={snd} vol={0.35} /><Pivot x={x} y={y} tf={`scale(${1 + k * p})`}>{children}</Pivot></>;
};
/** Retroceso de susto: salta hacia atrás y queda inclinado */
export const Recoil = ({at, x, y, dir = -1, dist = 90, snd = '76_sorpresa', children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 6, Easing.out(Easing.cubic)); const hop = f >= at && f < at + 8 ? -Math.sin(((f - at) / 8) * Math.PI) * 50 : 0;
  return <><SndAt at={at} snd={snd} vol={0.45} /><Pivot x={x} y={y} tf={`translate(${dir * dist * t}px, ${hop}px) rotate(${dir * 8 * t}deg)`}>{children}</Pivot></>;
};
/** Reverencia / inclinarse: el cuerpo rota hacia adelante desde la cadera (x,y = cadera aprox.) */
export const Bow = ({at, x, y, ang = 35, dur = 12, hold = 20, dir = 1, snd = null, children}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur) * (1 - ramp(f, at + dur + hold, at + 2 * dur + hold));
  return <><SndAt at={at} snd={snd} /><Pivot x={x} y={y} tf={`rotate(${dir * ang * t}deg)`}>{children}</Pivot></>;
};
/** Saltitos de alegría continuos */
export const Bounce = ({at = 0, x, y, h = 30, period = 10, snd = null, children}) => {
  const f = useCurrentFrame(); const k = Math.max(0, f - at); const ph = (k % period) / period; const dy = -Math.abs(Math.sin(ph * Math.PI)) * h; const sq = ph < 0.1 || ph > 0.9 ? 0.94 : 1;
  return <><SndAt at={at} snd={snd} /><Pivot x={x} y={y} tf={f >= at ? `translateY(${dy}px) scale(${2 - sq}, ${sq})` : 'none'}>{children}</Pivot></>;
};
/** Acercamiento entre dos figuras (abrazo, reconciliación): envuelve cada una y la mueve dx */
export const MoveTo = ({at, dur = 16, dx = 0, dy = 0, snd = null, children}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.inOut(Easing.cubic));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `translate(${dx * t}px, ${dy * t}px)`}}>{children}</AbsoluteFill></>;
};
/** Corazón grande que late entre dos figuras (amor, unión) */
export const HeartBeat = ({at, x, y, size = 160, color = '#FF4D6D', snd = '13_latido'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const b = 1 + 0.12 * Math.max(0, Math.sin(((f - at) / 15) * Math.PI * 2)) ** 8;
  return <><SndAt at={at} snd={snd} vol={0.5} /><div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${p * b})`, fontSize: size, lineHeight: 1, color, textAlign: 'center', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.35))'}}>♥</div></>;
};

// ---------- tanda 4: atmósfera emocional / efectos de cómic ----------
/** Fondo de emoción: tiñe la escena (happy, sad, anger, fear, calm, holy) */
export const MoodTint = ({at = 0, mood = 'sad', dur = 15, o = 0.45}) => {
  const t = ramp(useCurrentFrame(), at, at + dur); const c = {happy: '#FFC93C', sad: '#2B4C8C', anger: '#C8102E', fear: '#2E1B4E', calm: '#3FA796', holy: '#FFF2C4'}[mood];
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, transparent 20%, ${c} 100%)`, opacity: o * t, mixBlendMode: mood === 'holy' || mood === 'happy' ? 'screen' : 'multiply'}} />;
};
/** Líneas de velocidad / concentración de manga (momento clave, sorpresa) */
export const SpeedLines = ({at = 0, x = W / 2, y = H / 2, n = 48, inner = 380, color = '#fff', o = 0.8, snd = '05_whoosh_largo'}) => {
  const f = useCurrentFrame(); if (f < at) return null;
  return <><SndAt at={at} snd={snd} vol={0.4} /><svg width={W} height={H} style={{position: 'absolute', opacity: o}}>{Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 + random('sl' + i + Math.floor(f / 2)) * 0.08; const r0 = inner + random('sr' + i + Math.floor(f / 2)) * 120; const wd = 4 + random('sw' + i) * 10;
    const x1 = x + Math.cos(a) * r0, y1 = y + Math.sin(a) * r0, x2 = x + Math.cos(a) * 2200, y2 = y + Math.sin(a) * 2200; const nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd;
    return <polygon key={i} points={`${x1},${y1} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny}`} fill={color} />; })}</svg></>;
};
/** Estallido de impacto de cómic con texto (¡PUM!, ¡NO!) */
export const ImpactBurst = ({at, x, y, r = 230, text = '¡NO!', color = C.yellow, size = 90, snd = '07_impacto'}) => {
  const p = usePop(at); const n = 14;
  const pts = Array.from({length: n * 2}, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2; const rr = i % 2 ? r * (0.62 + 0.1 * random('ib' + i)) : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(' ');
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, transform: `scale(${p}) rotate(-8deg)`}}>
    <svg width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`} style={{position: 'absolute', overflow: 'visible', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.4))'}}><polygon points={pts} fill={color} stroke={C.ink} strokeWidth="8" strokeLinejoin="round" /></svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color: C.ink}}>{text}</div></div></>;
};
/** Punch-in: zoom brusco a un punto (cara de sorpresa) y vuelta. Envolver la escena */
export const PunchIn = ({at, x, y, z = 1.6, hold = 18, snd = '18_zoom', children}) => {
  const f = useCurrentFrame(); const a = ramp(f, at, at + 3, Easing.out(Easing.cubic)) * (1 - ramp(f, at + 3 + hold, at + 9 + hold));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `scale(${1 + (z - 1) * a})`, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill></>;
};
/** Congelar imagen: desatura, aparece marco y texto (\"Sí, ese soy yo\"). Envolver la escena */
export const FreezeFrame = ({at, text, snd = '74_rasguido', children}) => {
  const f = useCurrentFrame(); const on = f >= at; const t = ramp(f, at, at + 4); const pp = usePop(at + 3);
  return <AbsoluteFill><SndAt at={at} snd={snd} /><AbsoluteFill style={{filter: on ? `grayscale(${0.8 * t}) contrast(1.15)` : 'none'}}>{children}</AbsoluteFill>
    {on && <><AbsoluteFill style={{border: '24px solid #fff', boxSizing: 'border-box', opacity: t}} />
      {text && <div style={{position: 'absolute', left: 60, top: 1500, ...FONT, fontFamily: 'Caveat', fontWeight: 700, fontSize: 90, transform: `rotate(-4deg) scale(${pp})`}}>{text}</div>}</>}</AbsoluteFill>;
};
/** Nube de lluvia sobre UNA figura (tristeza personal). x,y = centro cabeza */
export const RainCloud = ({at = 0, x, y, s = 1, snd = '14_negativo'}) => <Emote at={at} x={x} y={y} s={s} type="gloom" snd={snd} />;
/** Viñeta / foco suave que cierra hacia un punto (tensión, intimidad) */
export const Vignette = ({at = 0, x = W / 2, y = H / 2, dur = 20, strength = 0.85}) => {
  const t = ramp(useCurrentFrame(), at, at + dur);
  return <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, transparent ${55 - 25 * t}%, rgba(0,0,0,${strength * t}) 95%)`}} />;
};

// =====================================================================
// ---------- tanda 5: TEXTO EN PANTALLA ----------
const SH = '0 6px 14px rgba(0,0,0,.5)';
/** Título letra por letra con rebote */
export const LetterPop = ({at, x = W / 2, y, text, size = 110, color = '#fff', every = 2, font = 'Montserrat', snd = '01_pop_texto'}) => {
  const f = useCurrentFrame();
  return <><SndAt at={at} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center', whiteSpace: 'pre'}}>{text.split('').map((ch, i) => {
    const p = spring({frame: f - at - i * every, fps: 30, config: {damping: 8, stiffness: 220, mass: 0.5}});
    return <span key={i} style={{display: 'inline-block', fontFamily: font, fontWeight: 900, fontSize: size, color, textShadow: SH, textTransform: 'uppercase', transform: `translateY(${(1 - p) * -80}px) scale(${p})`, opacity: Math.min(1, p * 2)}}>{ch === ' ' ? ' ' : ch}</span>; })}</div></>;
};
/** Resaltador amarillo que pasa por detrás de una palabra. Texto en x,y (centro). */
export const Highlight = ({at, x = W / 2, y, text, size = 80, color = C.yellow, ink = C.ink, dur = 10, snd = '20_pluma'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur); const p = usePop(at - 6, true);
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p})`, padding: '4px 22px', fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, textTransform: 'uppercase', whiteSpace: 'nowrap', color: t > 0.5 ? ink : '#fff', textShadow: t > 0.5 ? 'none' : SH}}>
    <div style={{position: 'absolute', left: 0, top: '12%', height: '76%', width: `${t * 100}%`, background: color, borderRadius: 8, transform: 'skewX(-8deg)', zIndex: -1, opacity: 0.95}} />{text}</div></>;
};
/** Subrayado a mano (ondulado) debajo de un texto ya puesto; x,y = inicio de la línea */
export const Underline = ({at, x, y, w = 500, color = C.red, width = 10, wavy = true, dur = 10, snd = '20_pluma'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur); const n = 8;
  const d = wavy ? `M${x} ${y} ` + Array.from({length: n}, (_, i) => `Q${x + (w / n) * (i + 0.5)} ${y + (i % 2 ? 14 : -14)} ${x + (w / n) * (i + 1)} ${y}`).join(' ') : `M${x} ${y} L${x + w} ${y - 6}`;
  return <><SndAt at={at} snd={snd} vol={0.35} /><svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}><path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={w * 1.4} strokeDashoffset={w * 1.4 * (1 - t)} /></svg></>;
};
/** Cita de un personaje: texto + nombre + año (estilo libro) */
export const QuoteCard = ({at, y = 600, text, who, when, w = 920, size = 62, snd = '19_pagina'}) => {
  const p = usePop(at, true); const t2 = ramp(useCurrentFrame(), at + 14, at + 24);
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: (W - w) / 2, top: y, width: w, transform: `translateY(${(1 - p) * 80}px)`, opacity: Math.min(1, p * 1.5)}}>
    <div style={{fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 220, lineHeight: 0.6, color: C.yellow, height: 90}}>“</div>
    <div style={{fontFamily: 'Playfair Display', fontWeight: 700, fontStyle: 'italic', fontSize: size, color: '#fff', lineHeight: 1.2, textShadow: SH}}>{text}</div>
    <div style={{marginTop: 30, width: 120 * t2, height: 6, background: C.yellow}} />
    <div style={{marginTop: 14, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, color: '#fff', opacity: t2, textShadow: SH}}>{who}{when && <span style={{fontWeight: 600, opacity: 0.75}}> · {when}</span>}</div></div></>;
};
/** Definición tipo diccionario */
export const Definition = ({at, y = 650, word, kind = 'sust.', text, w = 900, snd = '19_pagina'}) => {
  const p = usePop(at); const t = ramp(useCurrentFrame(), at + 10, at + 20);
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: (W - w) / 2, top: y, width: w, padding: '44px 50px', boxSizing: 'border-box', background: '#FBF7EE', borderRadius: 20, boxShadow: '0 18px 36px rgba(0,0,0,.45)', transform: `scale(${p})`, borderLeft: `16px solid ${C.yellow}`}}>
    <div style={{fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 96, color: C.ink, lineHeight: 1}}>{word}</div>
    <div style={{fontFamily: 'Montserrat', fontWeight: 700, fontStyle: 'italic', fontSize: 36, color: '#8A6A1C', margin: '6px 0 18px'}}>{kind}</div>
    <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 46, color: '#2A2A30', lineHeight: 1.25, opacity: t}}>{text}</div></div></>;
};
/** Palabra en idioma original (griego / hebreo) + transliteración + significado */
export const OriginalWord = ({at, y = 620, word, lang = 'griego', translit, meaning, snd = '31_glitter'}) => {
  const p = usePop(at); const f = useCurrentFrame(); const t1 = ramp(f, at + 10, at + 18), t2 = ramp(f, at + 18, at + 28); const he = lang.startsWith('heb');
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center'}}>
    <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 38, letterSpacing: 6, color: C.yellow, textTransform: 'uppercase', opacity: p}}>{lang}</div>
    <div style={{fontFamily: he ? 'Noto Serif Hebrew' : 'Noto Serif', fontWeight: 700, fontSize: 190, color: '#fff', direction: he ? 'rtl' : 'ltr', transform: `scale(${p})`, textShadow: '0 0 30px rgba(255,233,168,.6), 0 8px 18px rgba(0,0,0,.5)', lineHeight: 1.2}}>{word}</div>
    <div style={{fontFamily: 'Montserrat', fontWeight: 700, fontStyle: 'italic', fontSize: 58, color: '#DCE6F5', opacity: t1}}>{translit}</div>
    <div style={{margin: '26px auto 0', width: 820, padding: '18px 28px', borderRadius: 18, background: 'rgba(255,255,255,.95)', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 52, color: C.ink, opacity: t2, transform: `translateY(${(1 - t2) * 30}px)`}}>“{meaning}”</div></div></>;
};
/** Dato grande: número que cae con golpe + unidad + aclaración */
export const BigStat = ({at, y = 650, value, unit = '', label, color = C.yellow, size = 260, snd = '06_golpe_grave'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 7, Easing.in(Easing.quad)); const k = f - at - 7; const sq = k >= 0 ? 1 + 0.12 * Math.exp(-k / 3) * Math.cos(k / 1.5) : 1; const t2 = ramp(f, at + 10, at + 20);
  if (f < at) return null;
  return <><SndAt at={at + 6} snd={snd} /><div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center'}}>
    <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color, lineHeight: 1, textShadow: '0 10px 24px rgba(0,0,0,.5)', transform: `translateY(${(1 - t) * -500}px) scale(${sq})`}}>{value}<span style={{fontSize: size * 0.4}}>{unit}</span></div>
    <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 56, color: '#fff', textShadow: SH, opacity: t2, marginTop: 10, textTransform: 'uppercase'}}>{label}</div></div></>;
};
/** Rótulo de personaje (nombre + rol + años) que entra desde el costado */
export const LowerThird = ({at, y = 1500, name, role, years, color = C.yellow, side = 'left', snd = '04_whoosh_corto'}) => {
  const p = usePop(at, true); const f = useCurrentFrame(); const t = ramp(f, at + 6, at + 14); const sx = side === 'left' ? -1 : 1;
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', [side]: 60, top: y, transform: `translateX(${sx * (1 - p) * 700}px)`, textAlign: side}}>
    <div style={{display: 'inline-block', background: color, color: C.ink, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 64, padding: '8px 26px', textTransform: 'uppercase', boxShadow: '0 8px 16px rgba(0,0,0,.35)'}}>{name}</div><br />
    <div style={{display: 'inline-block', background: 'rgba(20,20,26,.88)', color: '#fff', fontFamily: 'Montserrat', fontWeight: 700, fontSize: 40, padding: '8px 22px', opacity: t}}>{role}{years && <span style={{color, marginLeft: 14}}>{years}</span>}</div></div></>;
};
/** Lugar y fecha estilo sello de época ("WITTENBERG · 1517") */
export const DateStamp = ({at, x = W / 2, y = 320, place, date, color = '#F2E6C9', snd = '22_sello'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 6, Easing.in(Easing.cubic)); if (f < at) return null;
  return <><SndAt at={at + 5} snd={snd} /><div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${2 - t}) rotate(-3deg)`, opacity: t, textAlign: 'center', border: `6px double ${color}`, padding: '14px 40px', color, textShadow: SH}}>
    <div style={{fontFamily: 'Cinzel', fontWeight: 700, fontSize: 64, letterSpacing: 6}}>{place}</div><div style={{fontFamily: 'Cinzel', fontWeight: 700, fontSize: 110, lineHeight: 1}}>{date}</div></div></>;
};
/** Pregunta gancho grande con signo que late */
export const BigQuestion = ({at, y = 600, text, size = 92, snd = '36_tension_creciente'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const beat = 1 + 0.08 * Math.abs(Math.sin((f - at) / 6));
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: 60, width: W - 120, top: y, textAlign: 'center'}}>
    <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: 300, lineHeight: 1, color: C.yellow, transform: `scale(${p * beat})`, textShadow: '0 10px 30px rgba(0,0,0,.5)'}}>?</div>
    <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color: '#fff', textShadow: SH, textTransform: 'uppercase', lineHeight: 1.1, transform: `scale(${p})`}}>{text}</div></div></>;
};
/** Una palabra se reemplaza por otra: se tacha, se cae y entra la correcta */
export const TextSwap = ({at, x = W / 2, y, from, to, size = 90, color = C.green, snd = '20_pluma'}) => {
  const f = useCurrentFrame(); const s = ramp(f, at, at + 6); const fall = ramp(f, at + 8, at + 20, Easing.in(Easing.quad)); const p = usePop(at + 14);
  return <><SndAt at={at} snd={snd} vol={0.4} /><SndAt at={at + 14} snd="02_pop_suave" />
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translateY(${fall * 500}px) rotate(${fall * 25}deg)`, opacity: 1 - fall, fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color: '#fff', textShadow: SH, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{from}
      <div style={{position: 'absolute', left: -10, top: '50%', height: 12, width: `calc(${s * 100}% + 20px)`, background: C.red, borderRadius: 6}} /></div>
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p})`, fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color, textShadow: SH, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{to}</div></>;
};
/** Lista numerada grande ("3 razones"): números gigantes que aparecen con su texto */
export const NumberedList = ({at, x = 110, y = 480, items, every = 14, gap = 250, color = C.yellow}) => (
  <>{items.map((it, i) => { const a = at + i * every; return <NumItem key={i} at={a} x={x} y={y + i * gap} n={i + 1} color={color}>{it}</NumItem>; })}</>
);
const NumItem = ({at, x, y, n, color, children}) => { const p = usePop(at); const t = ramp(useCurrentFrame(), at + 4, at + 12);
  return <><SndAt at={at} snd="06_golpe_grave" vol={0.35} /><div style={{position: 'absolute', left: x, top: y, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 200, lineHeight: 1, color, transform: `scale(${p})`, textShadow: '0 8px 20px rgba(0,0,0,.45)'}}>{n}</div>
    <div style={{position: 'absolute', left: x + 170, top: y + 50, width: W - x - 230, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 58, color: '#fff', textShadow: SH, opacity: t, transform: `translateX(${(1 - t) * 60}px)`}}>{children}</div></>; };
/** Cinta / banda tipo pergamino con texto */
export const Ribbon = ({at, y = 400, text, color = '#B03A48', size = 64, w = 820, snd = '04_whoosh_corto'}) => {
  const t = ramp(useCurrentFrame(), at, at + 10, Easing.out(Easing.back(1.5)));
  return <><SndAt at={at} snd={snd} /><svg width={W} height={200} style={{position: 'absolute', left: 0, top: y - 100, overflow: 'visible', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.4))'}}>
    <g transform={`translate(${W / 2} 100) scale(${t} 1)`}><path d={`M${-w / 2 - 90} -20 L${-w / 2 + 10} -20 L${-w / 2 + 10} 70 L${-w / 2 - 90} 70 L${-w / 2 - 50} 25 Z`} fill={shade(color, -0.3)} /><path d={`M${w / 2 + 90} -20 L${w / 2 - 10} -20 L${w / 2 - 10} 70 L${w / 2 + 90} 70 L${w / 2 + 50} 25 Z`} fill={shade(color, -0.3)} />
      <rect x={-w / 2} y={-50} width={w} height={100} fill={color} /></g></svg>
    <div style={{position: 'absolute', left: 0, width: W, top: y - size * 0.62, textAlign: 'center', fontFamily: 'Cinzel', fontWeight: 700, fontSize: size, color: '#fff', opacity: t, letterSpacing: 3}}>{text}</div></>;
};
/** Insignia circular giratoria ("DATO", "MITO", "CLAVE") */
export const Badge = ({at, x, y, text = 'DATO', r = 110, color = C.red, snd = '02_pop_suave'}) => {
  const p = usePop(at); const f = useCurrentFrame(); const n = 20;
  const pts = Array.from({length: n * 2}, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2; const rr = i % 2 ? r : r * 0.86; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(' ');
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, transform: `scale(${p}) rotate(${-12 + Math.sin(f / 15) * 4}deg)`}}>
    <svg width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`} style={{position: 'absolute', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.4))'}}><polygon points={pts} fill={color} transform={`rotate(${f * 1.5})`} /></svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: r * 0.42, color: '#fff'}}>{text}</div></div></>;
};
/** Dos palabras que chocan en el centro (contraste) */
export const WordClash = ({at, y = 800, a, b, cA = C.yellow, cB = C.cyan, size = 110, snd = '07_impacto'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 8, Easing.in(Easing.cubic)); const k = f - at - 8; const bounce = k > 0 ? Math.exp(-k / 4) * Math.sin(k / 1.5) * 30 : 0;
  const st = (c) => ({position: 'absolute', top: y, fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color: c, textShadow: SH, textTransform: 'uppercase', whiteSpace: 'nowrap'});
  return <><SndAt at={at + 7} snd={snd} /><div style={{...st(cA), right: W / 2 + 20 - bounce + (1 - t) * 700}}>{a}</div><div style={{...st(cB), left: W / 2 + 20 - bounce + (1 - t) * 700}}>{b}</div>
    {k > 0 && k < 8 && <div style={{position: 'absolute', left: W / 2 - 80, top: y - 20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,#fff,transparent 65%)', opacity: 1 - k / 8}} />}</>;
};
/** Fuente o cita bibliográfica chica abajo */
export const Source = ({at, text, y = 1780, snd = null}) => {
  const t = ramp(useCurrentFrame(), at, at + 10);
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: 60, width: W - 120, top: y, fontFamily: 'Montserrat', fontWeight: 600, fontSize: 32, color: 'rgba(255,255,255,.8)', opacity: t, textShadow: '0 2px 6px rgba(0,0,0,.6)'}}>Fuente: {text}</div></>;
};
/** Pizarrón con texto escrito a tiza (palabras de a una) */
export const Chalkboard = ({at, y = 420, h = 900, lines = [], every = 10, snd = '20_pluma'}) => {
  const p = usePop(at, true); const f = useCurrentFrame();
  return <><SndAt at={at} snd="06_golpe_grave" vol={0.3} /><div style={{position: 'absolute', left: 60, top: y, width: W - 120, height: h, background: 'radial-gradient(circle at 40% 30%, #2F5A44, #1E3D2E)', border: '22px solid #7A5530', borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,.5)', transform: `scale(${p})`, padding: 50, boxSizing: 'border-box'}}>
    {lines.map((l, i) => { const t = ramp(f, at + 10 + i * every, at + 10 + i * every + every * 0.8); return <React.Fragment key={i}><SndAt at={at + 10 + i * every} snd={snd} vol={0.3} />
      <div style={{fontFamily: 'Permanent Marker', fontSize: 64, color: '#F2F2EC', opacity: 0.92, clipPath: `inset(0 ${100 - t * 100}% 0 0)`, marginBottom: 18, textShadow: '0 0 2px rgba(255,255,255,.4)'}}>{l}</div></React.Fragment>; })}</div></>;
};
/** Titular de diario */
export const Headline = ({at, y = 520, paper = 'LA GACETA', date = '', title, sub, snd = '19_pagina'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 14, Easing.out(Easing.back(1.4)));
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: 90, width: W - 180, top: y, background: '#F3EEDF', padding: '30px 40px', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,.45)', transform: `rotate(${(1 - t) * 540 - 3}deg) scale(${t})`}}>
    <div style={{fontFamily: 'Cinzel', fontWeight: 700, fontSize: 64, textAlign: 'center', color: C.ink, borderBottom: '4px double #333', paddingBottom: 8}}>{paper}</div>
    <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 26, color: '#555', textAlign: 'center', margin: '6px 0 18px'}}>{date}</div>
    <div style={{fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 78, lineHeight: 1.05, color: C.ink, textAlign: 'center'}}>{title}</div>
    {sub && <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 34, color: '#444', textAlign: 'center', marginTop: 16}}>{sub}</div>}</div></>;
};
/** Mensajes tipo chat (diálogo moderno). msgs=[{t:'texto', me:true|false}] */
export const ChatThread = ({at, y = 500, msgs, every = 18, snd = '42_bip'}) => (
  <>{msgs.map((m, i) => { const a = at + i * every; return <ChatMsg key={i} at={a} y={y + i * 150} me={m.me} snd={snd}>{m.t}</ChatMsg>; })}</>
);
const ChatMsg = ({at, y, me, snd, children}) => { const p = usePop(at);
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', top: y, [me ? 'right' : 'left']: 70, maxWidth: 720, padding: '22px 32px', borderRadius: 34, [me ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 8,
    background: me ? '#2F80ED' : '#fff', color: me ? '#fff' : C.ink, fontFamily: 'Montserrat', fontWeight: 700, fontSize: 46, transform: `scale(${p})`, transformOrigin: me ? '100% 100%' : '0 100%', boxShadow: '0 8px 16px rgba(0,0,0,.3)'}}>{children}</div></>; };
/** Cuenta regresiva 3, 2, 1 */
export const Countdown = ({at, from = 3, every = 15, size = 400, snd = '17_tic_tac'}) => {
  const f = useCurrentFrame(); const k = f - at; if (k < 0 || k >= from * every) return null; const n = from - Math.floor(k / every); const ph = (k % every) / every;
  return <><SndAt at={at} snd={snd} /><div style={{position: 'absolute', left: 0, width: W, top: H / 2 - size * 0.6, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: size, color: '#fff', textShadow: '0 12px 30px rgba(0,0,0,.5)', transform: `scale(${1.4 - 0.4 * Math.min(1, ph * 3)})`, opacity: 1 - Math.max(0, ph - 0.7) / 0.3}}>{n}</div></>;
};

// =====================================================================
// ---------- tanda 5: EXPLICAR ----------
const LBL = (size = 44, color = '#fff') => ({fontFamily: 'Montserrat', fontWeight: 800, fontSize: size, color, textShadow: '0 3px 8px rgba(0,0,0,.45)'});
/** Torta que se llena por porciones. slices=[{v, label, color}] */
export const PieChart = ({at, x = W / 2, y = 900, r = 330, slices, dur = 30, snd = '45_escaneo'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + dur, Easing.inOut(Easing.cubic)); const tot = slices.reduce((s, a) => s + a.v, 0); let acc = 0;
  return <><SndAt at={at} snd={snd} vol={0.3} /><svg width={W} height={H} style={{position: 'absolute', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.4))'}}>{slices.map((s, i) => {
    const a0 = (acc / tot) * Math.PI * 2 * t - Math.PI / 2; acc += s.v; const a1 = (acc / tot) * Math.PI * 2 * t - Math.PI / 2; const big = a1 - a0 > Math.PI ? 1 : 0;
    const am = (a0 + a1) / 2; return <g key={i}><path d={`M${x} ${y} L${x + Math.cos(a0) * r} ${y + Math.sin(a0) * r} A${r} ${r} 0 ${big} 1 ${x + Math.cos(a1) * r} ${y + Math.sin(a1) * r} Z`} fill={s.color || [C.yellow, C.cyan, C.red, C.green][i % 4]} stroke="#fff" strokeWidth={6} />
      {t > 0.95 && <text x={x + Math.cos(am) * r * 0.62} y={y + Math.sin(am) * r * 0.62} textAnchor="middle" dominantBaseline="middle" style={{...LBL(40, C.ink), textShadow: 'none'}}>{s.label}</text>}</g>; })}</svg></>;
};
/** Gráfico de línea que se dibuja. pts = valores 0..1 */
export const LineChart = ({at, x = 120, y = 1300, w = 840, h = 600, pts, labels = [], color = C.yellow, dur = 30, snd = '08_subida_larga'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.inOut(Easing.quad)); const n = pts.length; const P = pts.map((v, i) => [x + (w * i) / (n - 1), y - v * h]);
  const d = 'M' + P.map((p) => p.join(' ')).join(' L'); const L = 3000;
  return <><SndAt at={at} snd={snd} vol={0.3} /><svg width={W} height={H} style={{position: 'absolute'}}><line x1={x} y1={y} x2={x + w} y2={y} stroke="#fff" strokeWidth={6} /><line x1={x} y1={y} x2={x} y2={y - h} stroke="#fff" strokeWidth={6} />
    <path d={d} stroke={color} strokeWidth={12} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - t)} style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.4))'}} />
    {P.map((p, i) => i / (n - 1) <= t + 0.001 && <circle key={i} cx={p[0]} cy={p[1]} r={14} fill="#fff" stroke={color} strokeWidth={6} />)}
    {labels.map((l, i) => <text key={i} x={P[i][0]} y={y + 50} textAnchor="middle" style={LBL(34)}>{l}</text>)}</svg></>;
};
/** Diagrama de Venn de 2 o 3 círculos; mid = texto de la intersección */
export const Venn = ({at, x = W / 2, y = 950, r = 260, sets, mid, every = 8, snd = '02_pop_suave'}) => {
  const n = sets.length; const off = n === 2 ? [[-r * 0.55, 0], [r * 0.55, 0]] : [[-r * 0.5, -r * 0.3], [r * 0.5, -r * 0.3], [0, r * 0.55]];
  const cols = [C.yellow, C.cyan, C.red]; const pm = usePop(at + n * every + 4);
  return <>{sets.map((s, i) => <VennC key={i} at={at + i * every} cx={x + off[i][0]} cy={y + off[i][1]} r={r} color={s.color || cols[i]} label={s.label} lx={x + off[i][0] * 1.9} ly={y + off[i][1] * 1.9 + (n === 2 ? -r - 30 : 0)} snd={snd} />)}
    {mid && <><SndAt at={at + n * every + 4} snd="10_ding" vol={0.4} /><div style={{position: 'absolute', left: x - 150, width: 300, top: y + (n === 3 ? 0 : -30), textAlign: 'center', ...LBL(40), transform: `scale(${pm})`}}>{mid}</div></>}</>;
};
const VennC = ({at, cx, cy, r, color, label, lx, ly, snd}) => { const p = usePop(at);
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: color, opacity: 0.55, border: '6px solid #fff', boxSizing: 'border-box', transform: `scale(${p})`, mixBlendMode: 'screen'}} />
    <div style={{position: 'absolute', left: lx - 200, width: 400, top: ly - 30, textAlign: 'center', ...LBL(48), opacity: p}}>{label}</div></>; };
/** Diagrama de flujo vertical: cajas conectadas con flechas que aparecen en orden */
export const Flowchart = ({at, x = W / 2, y = 420, steps, gap = 230, w = 640, every = 14, colors}) => (
  <>{steps.map((s, i) => { const a = at + i * every; return <FlowBox key={i} at={a} x={x} y={y + i * gap} w={w} color={(colors || [])[i]} arrow={i > 0} gap={gap}>{s}</FlowBox>; })}</>
);
const FlowBox = ({at, x, y, w, color, arrow, gap, children}) => { const p = usePop(at); const t = ramp(useCurrentFrame(), at - 8, at);
  return <><SndAt at={at} snd="02_pop_suave" vol={0.35} />{arrow && <svg width={W} height={H} style={{position: 'absolute'}}><line x1={x} y1={y - gap + 110} x2={x} y2={y - gap + 110 + (gap - 120) * t} stroke="#fff" strokeWidth={8} />{t > 0.9 && <path d={`M${x - 18} ${y - 16} L${x} ${y + 4} L${x + 18} ${y - 16} Z`} fill="#fff" />}</svg>}
    <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, minHeight: 110, padding: '18px 26px', boxSizing: 'border-box', borderRadius: 24, background: color || '#fff', color: color ? '#fff' : C.ink, ...LBL(48, color ? '#fff' : C.ink), textShadow: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, boxShadow: '0 10px 20px rgba(0,0,0,.35)'}}>{children}</div></>; };
/** Ciclo: pasos alrededor de un círculo con flechas que giran (p. ej. ciclo de los Jueces) */
export const Cycle = ({at, x = W / 2, y = 950, r = 330, steps, every = 10, center, snd = '02_pop_suave'}) => {
  const f = useCurrentFrame(); const n = steps.length; const t = ramp(f, at, at + n * every + 10); const rot = (f - at) * 0.4; const L = 2 * Math.PI * r;
  return <><svg width={W} height={H} style={{position: 'absolute'}}><circle cx={x} cy={y} r={r} stroke="#fff" strokeWidth={8} fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - t)} opacity={0.8} transform={`rotate(-90 ${x} ${y})`} />
      {t > 0.99 && Array.from({length: n}, (_, i) => { const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2 + rot / 60; return <path key={i} d="M-16 -14 L12 0 L-16 14 Z" fill="#fff" transform={`translate(${x + Math.cos(a) * r} ${y + Math.sin(a) * r}) rotate(${(a * 180) / Math.PI + 90})`} />; })}</svg>
    {steps.map((s, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return <CycleNode key={i} at={at + i * every} x={x + Math.cos(a) * r} y={y + Math.sin(a) * r} snd={snd} color={[C.yellow, C.red, C.cyan, C.green, '#B48CFF'][i % 5]}>{s}</CycleNode>; })}
    {center && <div style={{position: 'absolute', left: x - 200, width: 400, top: y - 40, textAlign: 'center', ...LBL(52), opacity: t}}>{center}</div>}</>;
};
const CycleNode = ({at, x, y, color, snd, children}) => { const p = usePop(at);
  return <><SndAt at={at} snd={snd} vol={0.3} /><div style={{position: 'absolute', left: x - 140, top: y - 55, width: 280, minHeight: 110, borderRadius: 55, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...LBL(40, C.ink), textShadow: 'none', transform: `scale(${p})`, boxShadow: '0 8px 16px rgba(0,0,0,.35)', padding: '0 14px', boxSizing: 'border-box'}}>{children}</div></>; };
/** Pirámide de niveles (jerarquía). levels de arriba hacia abajo */
export const Pyramid = ({at, x = W / 2, y = 450, levels, h = 200, wTop = 260, wBot = 900, every = 8, snd = '52_madera'}) => {
  const n = levels.length;
  return <>{levels.map((l, i) => { const k = n - 1 - i; const a = at + k * every; return <PyrLevel key={i} at={a} x={x} y={y + i * h} h={h} w0={wTop + ((wBot - wTop) * i) / n} w1={wTop + ((wBot - wTop) * (i + 1)) / n} color={l.color || [C.yellow, '#F2A541', C.red, '#B03A48', '#6B2F5E'][i % 5]} snd={snd}>{l.label || l}</PyrLevel>; })}</>;
};
const PyrLevel = ({at, x, y, h, w0, w1, color, snd, children}) => { const f = useCurrentFrame(); const t = ramp(f, at, at + 8, Easing.in(Easing.quad)); if (f < at) return null;
  return <><SndAt at={at + 7} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: x - w1 / 2, top: y - (1 - t) * 600, width: w1, height: h - 8, background: color, clipPath: `polygon(${(w1 - w0) / 2}px 0, ${(w1 + w0) / 2}px 0, 100% 100%, 0 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LBL(44, '#fff')}}>{children}</div></>; };
/** Escalera de pasos que sube (progreso, etapas) */
export const Staircase = ({at, x = 100, y = 1550, steps, sw, sh, every = 10, color = C.cyan}) => { const n = steps.length; const SW = sw || (W - 2 * x) / n; const SH = sh || Math.min(170, 900 / n);
  return <>{steps.map((s, i) => <Step key={i} at={at + i * every} x={x + i * SW} y={y - i * SH} w={SW} h={(i + 1) * SH} color={color} label={s} />)}</>; };
const Step = ({at, x, y, w, h, color, label}) => { const t = ramp(useCurrentFrame(), at, at + 8, Easing.out(Easing.back(1.5)));
  return <><SndAt at={at} snd="09_subida_corta" vol={0.25} /><div style={{position: 'absolute', left: x, top: y + (1 - t) * h, width: w - 8, height: h * t, background: color, borderTop: '10px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,.3)'}} />
    <div style={{position: 'absolute', left: x - 30, width: w + 52, top: y - 80, textAlign: 'center', ...LBL(36), opacity: t}}>{label}</div></>; };
/** Tabla comparativa de dos columnas: rows=[{label, a, b}] con a/b = texto o true/false */
export const CompareTable = ({at, y = 420, colA, colB, rows, cA = '#B03A48', cB = '#1F9E8F', every = 10, rh = 150}) => {
  const p = usePop(at); const cell = (v) => v === true ? <span style={{color: C.green, fontSize: 70}}>✔</span> : v === false ? <span style={{color: C.red, fontSize: 64}}>✖</span> : v;
  return <><SndAt at={at} snd="04_whoosh_corto" /><div style={{position: 'absolute', left: 60, top: y, width: W - 120, display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', transform: `scale(${p})`, transformOrigin: '50% 0'}}>
    <div />{[[colA, cA], [colB, cB]].map(([c, col], i) => <div key={i} style={{background: col, padding: '18px 10px', textAlign: 'center', ...LBL(46), borderRadius: '18px 18px 0 0', margin: '0 6px'}}>{c}</div>)}</div>
    {rows.map((r, i) => <CTRow key={i} at={at + 8 + i * every} y={y + 100 + i * rh} h={rh} r={r} cell={cell} />)}</>;
};
const CTRow = ({at, y, h, r, cell}) => { const t = ramp(useCurrentFrame(), at, at + 8);
  return <><SndAt at={at} snd="03_click" vol={0.3} /><div style={{position: 'absolute', left: 60, top: y, width: W - 120, height: h - 10, display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', alignItems: 'center', background: 'rgba(255,255,255,.12)', borderRadius: 14, opacity: t, transform: `translateX(${(1 - t) * 80}px)`}}>
    <div style={{...LBL(42), paddingLeft: 24}}>{r.label}</div><div style={{textAlign: 'center', ...LBL(42)}}>{cell(r.a)}</div><div style={{textAlign: 'center', ...LBL(42)}}>{cell(r.b)}</div></div></>; };
/** Balanza que se inclina según pesos (left/right: textos; tilt -1..1) */
export const Balance = ({at, x = W / 2, y = 800, left, right, tilt = 0.6, dur = 24, snd = '51_balanza'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const k = ramp(f, at + 10, at + 10 + dur, Easing.out(Easing.elastic(1.2))); const ang = -tilt * 18 * k; const a = (ang * Math.PI) / 180; const arm = 330;
  const pan = (s) => { const px = x + s * arm * Math.cos(a), py = y + s * arm * Math.sin(a); return [px, py]; }; const [lx, ly] = pan(-1), [rx, ry] = pan(1);
  const Pan = ({px, py, children}) => <><svg width={W} height={H} style={{position: 'absolute'}}><line x1={px} y1={py} x2={px - 110} y2={py + 200} stroke="#E8D9A8" strokeWidth={5} /><line x1={px} y1={py} x2={px + 110} y2={py + 200} stroke="#E8D9A8" strokeWidth={5} />
    <path d={`M${px - 140} ${py + 200} Q${px} ${py + 280} ${px + 140} ${py + 200} Z`} fill="#C9A227" stroke="#8A6A1C" strokeWidth={5} /></svg><div style={{position: 'absolute', left: px - 170, width: 340, top: py + 110, textAlign: 'center', ...LBL(42)}}>{children}</div></>;
  return <><SndAt at={at + 10} snd={snd} /><div style={{position: 'absolute', inset: 0, transform: `scale(${p})`, transformOrigin: `${x}px ${y + 500}px`}}>
    <svg width={W} height={H} style={{position: 'absolute'}}><rect x={x - 12} y={y} width={24} height={560} fill="#C9A227" stroke="#8A6A1C" strokeWidth={4} /><rect x={x - 150} y={y + 550} width={300} height={36} rx={10} fill="#8A6A1C" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#C9A227" strokeWidth={18} strokeLinecap="round" /><circle cx={x} cy={y} r={26} fill="#E8B923" stroke="#8A6A1C" strokeWidth={5} /></svg>
    <Pan px={lx} py={ly}>{left}</Pan><Pan px={rx} py={ry}>{right}</Pan></div></>;
};
/** Iceberg: lo que se ve (arriba) vs lo que no se ve (abajo) */
export const Iceberg = ({at, top = 'Lo que se ve', bottom = [], water = 900, snd = '57_burbujeo'}) => {
  const f = useCurrentFrame(); const t = ramp(f, at, at + 20, Easing.out(Easing.cubic)); const bob = Math.sin(f / 18) * 6;
  return <><SndAt at={at} snd={snd} vol={0.35} /><div style={{position: 'absolute', left: 0, top: water, width: W, height: H - water, background: 'linear-gradient(#1F6FA8,#0A2A4E)'}} />
    <svg width={W} height={H} style={{position: 'absolute', transform: `translateY(${(1 - t) * 400 + bob}px)`}}><path d={`M440 ${water} L520 ${water - 260} L600 ${water - 180} L660 ${water} Z`} fill="#F4FAFF" /><path d={`M440 ${water} L660 ${water} L900 ${water + 380} L760 ${water + 820} L320 ${water + 860} L150 ${water + 420} Z`} fill="#BFE3F5" opacity={0.75} /></svg>
    <div style={{position: 'absolute', left: 0, width: W, top: water - 360, textAlign: 'center', ...LBL(56), opacity: t}}>{top}</div>
    {bottom.map((b, i) => <IceItem key={i} at={at + 20 + i * 10} y={water + 260 + i * 140}>{b}</IceItem>)}</>;
};
const IceItem = ({at, y, children}) => { const p = usePop(at); return <><SndAt at={at} snd="29_burbuja" vol={0.3} /><div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center', ...LBL(50, '#0A2A4E'), textShadow: 'none', transform: `scale(${p})`}}>{children}</div></>; };
/** Pictograma: de cada N personas, k resaltadas */
export const Pictogram = ({at, x = W / 2, y = 900, n = 10, k = 3, cols = 5, color = C.yellow, label, every = 2, snd = '01_pop_texto'}) => {
  const rows = Math.ceil(n / cols); const cw = 150, ch = 220; const t = ramp(useCurrentFrame(), at + n * every, at + n * every + 10);
  return <>{Array.from({length: n}, (_, i) => <PictoP key={i} at={at + i * every} x={x + ((i % cols) - (cols - 1) / 2) * cw} y={y + (Math.floor(i / cols) - (rows - 1) / 2) * ch} on={i < k && t > 0.5} color={color} snd={i === 0 ? snd : null} />)}
    {label && <div style={{position: 'absolute', left: 0, width: W, top: y + (rows / 2) * ch + 30, textAlign: 'center', ...LBL(60), opacity: t}}>{label}</div>}</>;
};
const PictoP = ({at, x, y, on, color, snd}) => { const p = usePop(at); const c = on ? color : '#fff';
  return <><SndAt at={at} snd={snd} vol={0.3} /><svg width={110} height={190} viewBox="-55 -95 110 190" style={{position: 'absolute', left: x - 55, top: y - 95, transform: `scale(${p * (on ? 1.08 : 1)})`, filter: on ? `drop-shadow(0 0 14px ${color})` : 'none'}}><circle cx={0} cy={-60} r={30} fill={c} /><path d="M-36 95 L-36 -2 C-36 -20 -22 -28 0 -28 C22 -28 36 -20 36 -2 L36 95 Z" fill={c} /></svg></>; };
/** Termómetro que sube (intensidad, temperatura espiritual, gravedad) */
export const Thermometer = ({at, x = W / 2, y = 400, h = 900, to = 0.8, dur = 30, label, snd = '08_subida_larga'}) => {
  const p = usePop(at); const t = ramp(useCurrentFrame(), at + 6, at + 6 + dur, Easing.out(Easing.cubic)); const lv = to * t; const col = lv > 0.66 ? C.red : lv > 0.33 ? '#F2A541' : C.cyan;
  return <><SndAt at={at + 6} snd={snd} vol={0.3} /><svg width={240} height={h + 200} viewBox={`-120 0 240 ${h + 200}`} style={{position: 'absolute', left: x - 120, top: y, transform: `scale(${p})`, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.4))'}}>
    <rect x={-50} y={0} width={100} height={h} rx={50} fill="#fff" /><circle cx={0} cy={h + 70} r={95} fill="#fff" /><circle cx={0} cy={h + 70} r={72} fill={col} /><rect x={-28} y={h - (h - 40) * lv} width={56} height={(h - 40) * lv + 40} rx={28} fill={col} />
    {[0.25, 0.5, 0.75].map((k) => <line key={k} x1={50} y1={h * (1 - k)} x2={80} y2={h * (1 - k)} stroke="#fff" strokeWidth={6} />)}</svg>
    {label && <div style={{position: 'absolute', left: x + 120, top: y + h * (1 - lv) - 30, ...LBL(52), opacity: t}}>{label}</div>}</>;
};
/** Reloj de arena animado (tiempo que se acaba) */
export const Hourglass = ({at, x = W / 2, y = 900, s = 1, dur = 60, snd = '17_tic_tac'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const t = ramp(f, at + 6, at + 6 + dur);
  return <><SndAt at={at} snd={snd} vol={0.3} /><svg width={360 * s} height={520 * s} viewBox="-180 -260 360 520" style={{position: 'absolute', left: x - 180 * s, top: y - 260 * s, transform: `scale(${p})`, filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.4))'}}>
    <defs><clipPath id={`hgt${at}`}><path d="M-120 -220 L120 -220 L10 -10 L-10 -10 Z" /></clipPath><clipPath id={`hgb${at}`}><path d="M-10 10 L10 10 L120 220 L-120 220 Z" /></clipPath></defs>
    <rect x={-170} y={-260} width={340} height={36} rx={12} fill="#8A6A1C" /><rect x={-170} y={224} width={340} height={36} rx={12} fill="#8A6A1C" />
    <path d="M-120 -220 L120 -220 L10 -10 L10 10 L120 220 L-120 220 L-10 10 L-10 -10 Z" fill="rgba(255,255,255,.25)" stroke="#fff" strokeWidth={6} />
    <rect x={-130} y={-220 + 200 * t} width={260} height={210} fill="#E8C27A" clipPath={`url(#hgt${at})`} /><rect x={-130} y={220 - 200 * t} width={260} height={210} fill="#E8C27A" clipPath={`url(#hgb${at})`} />
    {t > 0 && t < 1 && <line x1={0} y1={-10} x2={0} y2={220 - 200 * t} stroke="#E8C27A" strokeWidth={6} />}</svg></>;
};
/** Mapa mental: concepto central y ramas que salen */
export const MindMap = ({at, x = W / 2, y = 950, center, branches, r = 400, every = 8, snd = '02_pop_suave'}) => {
  const pc = usePop(at); const n = branches.length;
  return <><SndAt at={at} snd={snd} />{branches.map((b, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return <MMBranch key={i} at={at + 8 + i * every} x0={x} y0={y} x={x + Math.cos(a) * r} y={y + Math.sin(a) * r * 1.1} color={[C.yellow, C.cyan, C.red, C.green, '#B48CFF', '#F2A541'][i % 6]}>{b}</MMBranch>; })}
    <div style={{position: 'absolute', left: x - 170, top: y - 170, width: 340, height: 340, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...LBL(54, C.ink), textShadow: 'none', transform: `scale(${pc})`, boxShadow: '0 12px 24px rgba(0,0,0,.4)', padding: 20, boxSizing: 'border-box'}}>{center}</div></>;
};
const MMBranch = ({at, x0, y0, x, y, color, children}) => { const t = ramp(useCurrentFrame(), at - 6, at); const p = usePop(at);
  return <><SndAt at={at} snd="02_pop_suave" vol={0.25} /><svg width={W} height={H} style={{position: 'absolute'}}><line x1={x0} y1={y0} x2={x0 + (x - x0) * t} y2={y0 + (y - y0) * t} stroke={color} strokeWidth={12} strokeLinecap="round" /></svg>
    <div style={{position: 'absolute', left: x - 150, top: y - 50, width: 300, minHeight: 100, borderRadius: 26, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...LBL(38, C.ink), textShadow: 'none', transform: `scale(${p})`, padding: '8px 14px', boxSizing: 'border-box'}}>{children}</div></>; };
/** Círculos concéntricos (niveles: yo, familia, iglesia, mundo) */
export const Concentric = ({at, x = W / 2, y = 950, rings, r0 = 110, dr = 110, every = 8, snd = '29_burbuja'}) => {
  const n = rings.length; const cols = [C.yellow, '#F2A541', C.cyan, '#5A7BB0', '#3A4A7A'];
  return <>{rings.slice().reverse().map((l, j) => { const i = n - 1 - j; return <Ring key={i} at={at + i * every} x={x} y={y} r={r0 + i * dr} color={cols[i % 5]} label={l} ly={y - (r0 + i * dr) + (i === 0 ? r0 - 30 : 40)} snd={snd} />; })}</>;
};
const Ring = ({at, x, y, r, color, label, ly, snd}) => { const p = usePop(at);
  return <><SndAt at={at} snd={snd} vol={0.3} /><div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: color, border: '6px solid #fff', boxSizing: 'border-box', transform: `scale(${p})`, boxShadow: '0 8px 16px rgba(0,0,0,.25)'}} />
    <div style={{position: 'absolute', left: x - 200, width: 400, top: ly, textAlign: 'center', ...LBL(40, C.ink), textShadow: 'none', opacity: p}}>{label}</div></>; };
/** Causa → efecto: dos cajas y flecha con conector ("por eso") */
export const CauseEffect = ({at, y = 800, cause, effect, link = 'por eso', snd = '04_whoosh_corto'}) => {
  const f = useCurrentFrame(); const a = usePop(at); const t = ramp(f, at + 8, at + 18); const b = usePop(at + 18);
  const box = (txt, x, p, col) => <div style={{position: 'absolute', left: x - 200, top: y, width: 400, minHeight: 220, borderRadius: 28, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...LBL(48, C.ink), textShadow: 'none', transform: `scale(${p})`, padding: 20, boxSizing: 'border-box', boxShadow: '0 12px 24px rgba(0,0,0,.35)'}}>{txt}</div>;
  return <><SndAt at={at} snd="02_pop_suave" /><SndAt at={at + 8} snd={snd} /><SndAt at={at + 18} snd="07_impacto" vol={0.4} />{box(cause, 250, a, '#fff')}
    <svg width={W} height={H} style={{position: 'absolute'}}><line x1={460} y1={y + 110} x2={460 + 150 * t} y2={y + 110} stroke={C.yellow} strokeWidth={14} />{t > 0.9 && <path d={`M610 ${y + 84} L650 ${y + 110} L610 ${y + 136} Z`} fill={C.yellow} />}</svg>
    <div style={{position: 'absolute', left: 430, width: 220, top: y + 30, textAlign: 'center', fontFamily: 'Caveat', fontWeight: 700, fontSize: 48, color: C.yellow, opacity: t}}>{link}</div>{box(effect, 830, b, C.yellow)}</>;
};
/** Matriz 2x2 con ejes y elementos que caen en su cuadrante. items=[{label, qx:-1|1, qy:-1|1}] */
export const Matrix2x2 = ({at, x = W / 2, y = 1000, s = 420, xAxis = ['', ''], yAxis = ['', ''], items = [], every = 10}) => {
  const t = ramp(useCurrentFrame(), at, at + 12);
  return <><SndAt at={at} snd="04_whoosh_corto" /><svg width={W} height={H} style={{position: 'absolute'}}><line x1={x - s * t} y1={y} x2={x + s * t} y2={y} stroke="#fff" strokeWidth={8} /><line x1={x} y1={y - s * t} x2={x} y2={y + s * t} stroke="#fff" strokeWidth={8} /></svg>
    <div style={{position: 'absolute', left: x - s - 20, top: y + 16, ...LBL(34), opacity: t}}>{xAxis[0]}</div><div style={{position: 'absolute', left: x + s - 220, width: 240, textAlign: 'right', top: y + 16, ...LBL(34), opacity: t}}>{xAxis[1]}</div>
    <div style={{position: 'absolute', left: x + 16, top: y - s - 10, ...LBL(34), opacity: t}}>{yAxis[1]}</div><div style={{position: 'absolute', left: x + 16, top: y + s - 40, ...LBL(34), opacity: t}}>{yAxis[0]}</div>
    {items.map((it, i) => <MxItem key={i} at={at + 14 + i * every} x={x + it.qx * s * 0.5} y={y - it.qy * s * 0.5} color={it.color}>{it.label}</MxItem>)}</>;
};
const MxItem = ({at, x, y, color, children}) => { const p = usePop(at); return <><SndAt at={at} snd="02_pop_suave" vol={0.3} /><div style={{position: 'absolute', left: x - 140, top: y - 45, width: 280, minHeight: 90, borderRadius: 45, background: color || C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...LBL(36, C.ink), textShadow: 'none', transform: `scale(${p})`}}>{children}</div></>; };
/** Espectro: línea con dos extremos y un marcador que se mueve a una posición (0..1) */
export const Spectrum = ({at, y = 900, left, right, pos = 0.5, from = 0.5, dur = 24, label, cL = C.cyan, cR = C.red, snd = '45_escaneo'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const t = ramp(f, at + 8, at + 8 + dur, Easing.out(Easing.back(1.3))); const v = from + (pos - from) * t; const x0 = 120, w = W - 240;
  return <><SndAt at={at + 8} snd={snd} vol={0.3} /><div style={{position: 'absolute', left: x0, top: y, width: w, height: 40, borderRadius: 20, background: `linear-gradient(90deg, ${cL}, #fff, ${cR})`, transform: `scaleX(${p})`, boxShadow: '0 8px 16px rgba(0,0,0,.35)'}} />
    <div style={{position: 'absolute', left: x0, top: y + 70, ...LBL(46), opacity: p}}>{left}</div><div style={{position: 'absolute', right: 120, top: y + 70, ...LBL(46), opacity: p}}>{right}</div>
    <svg width={80} height={100} style={{position: 'absolute', left: x0 + w * v - 40, top: y - 90, opacity: p}}><path d="M40 96 L8 40 A34 34 0 1 1 72 40 Z" fill="#fff" stroke={C.ink} strokeWidth={5} /><circle cx={40} cy={30} r={12} fill={C.ink} /></svg>
    {label && <div style={{position: 'absolute', left: x0 + w * v - 200, width: 400, top: y - 160, textAlign: 'center', ...LBL(46, C.yellow), opacity: t}}>{label}</div>}</>;
};
/** Bloques que se apilan (canon, capas, etapas acumuladas). items de abajo hacia arriba */
export const Stack = ({at, x = W / 2, y = 1600, items, bh = 120, w = 620, every = 8, snd = '52_madera'}) => (
  <>{items.map((it, i) => <StackBlock key={i} at={at + i * every} x={x} y={y - (i + 1) * bh} w={w - i * 20} h={bh - 8} color={it.color || [C.yellow, C.cyan, '#F2A541', C.green, '#B48CFF', C.red][i % 6]} snd={snd}>{it.label || it}</StackBlock>)}</>
);
const StackBlock = ({at, x, y, w, h, color, snd, children}) => { const f = useCurrentFrame(); const t = ramp(f, at, at + 8, Easing.in(Easing.quad)); if (f < at) return null; const k = f - at - 8; const sq = k >= 0 ? 1 - 0.08 * Math.exp(-k / 3) * Math.cos(k / 1.5) : 1;
  return <><SndAt at={at + 7} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: x - w / 2, top: y - (1 - t) * 800, width: w, height: h, background: color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LBL(46, C.ink), textShadow: 'none', transform: `scaleY(${sq})`, transformOrigin: '50% 100%', boxShadow: '0 6px 12px rgba(0,0,0,.3)'}}>{children}</div></>; };
/** Anillo de porcentaje que se llena */
export const PercentRing = ({at, x = W / 2, y = 900, r = 260, to = 0.73, dur = 30, color = C.yellow, label, snd = '08_subida_larga'}) => {
  const f = useCurrentFrame(); const p = usePop(at); const t = ramp(f, at + 6, at + 6 + dur, Easing.out(Easing.cubic)); const L = 2 * Math.PI * r;
  return <><SndAt at={at + 6} snd={snd} vol={0.3} /><svg width={2 * r + 80} height={2 * r + 80} style={{position: 'absolute', left: x - r - 40, top: y - r - 40, transform: `scale(${p})`}}><circle cx={r + 40} cy={r + 40} r={r} stroke="rgba(255,255,255,.2)" strokeWidth={50} fill="none" />
    <circle cx={r + 40} cy={r + 40} r={r} stroke={color} strokeWidth={50} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - to * t)} transform={`rotate(-90 ${r + 40} ${r + 40})`} /></svg>
    <div style={{position: 'absolute', left: x - r, width: 2 * r, top: y - 90, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 150, color: '#fff', textShadow: SH, opacity: p}}>{Math.round(to * t * 100)}%</div>
    {label && <div style={{position: 'absolute', left: 0, width: W, top: y + r + 70, textAlign: 'center', ...LBL(54), opacity: t}}>{label}</div>}</>;
};
/** Antes / después: una cortina vertical revela la imagen "después" sobre la de "antes" */
export const BeforeAfter = ({at, before, after, dur = 24, labels = ['ANTES', 'DESPUÉS'], snd = '05_whoosh_largo'}) => {
  const t = ramp(useCurrentFrame(), at, at + dur, Easing.inOut(Easing.cubic)); const xx = W * (1 - t);
  return <><SndAt at={at} snd={snd} /><AbsoluteFill>{before}</AbsoluteFill><AbsoluteFill style={{clipPath: `inset(0 0 0 ${xx}px)`}}>{after}</AbsoluteFill>
    <div style={{position: 'absolute', left: xx - 6, top: 0, width: 12, height: H, background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,.5)'}} />
    <div style={{position: 'absolute', left: 40, top: 260, ...LBL(50), opacity: 1 - t}}>{labels[0]}</div><div style={{position: 'absolute', right: 40, top: 260, ...LBL(50, C.yellow), opacity: t}}>{labels[1]}</div></>;
};
/** Calendario con un día marcado con círculo */
export const CalendarMark = ({at, month = 'NISÁN', day = 14, days = 30, startDow = 2, x = W / 2, y = 500, snd = '20_pluma'}) => {
  const p = usePop(at); const t = ramp(useCurrentFrame(), at + 14, at + 24); const cw = 120;
  return <><SndAt at={at + 14} snd={snd} vol={0.4} /><div style={{position: 'absolute', left: x - 3.5 * cw - 30, top: y, width: 7 * cw + 60, background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 16px 32px rgba(0,0,0,.45)', transform: `scale(${p})`}}>
    <div style={{background: C.red, color: '#fff', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 64, padding: '16px 0'}}>{month}</div>
    <div style={{display: 'grid', gridTemplateColumns: `repeat(7, ${cw}px)`, padding: 30, rowGap: 10}}>{Array.from({length: startDow}, (_, i) => <div key={'e' + i} />)}
      {Array.from({length: days}, (_, i) => <div key={i} style={{position: 'relative', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, color: C.ink, lineHeight: '90px'}}>{i + 1}
        {i + 1 === day && <svg width={110} height={100} style={{position: 'absolute', left: 5, top: -5, overflow: 'visible'}}><ellipse cx={55} cy={50} rx={52} ry={44} stroke={C.red} strokeWidth={8} fill="none" strokeDasharray={320} strokeDashoffset={320 * (1 - t)} /></svg>}</div>)}</div></div></>;
};
/** Rompecabezas: piezas que llegan y encajan formando un todo. labels de las piezas (4) */
export const Puzzle = ({at, x = W / 2, y = 950, s = 300, labels = ['', '', '', ''], every = 10, snd = '52_madera'}) => {
  const f = useCurrentFrame(); const cols = [C.yellow, C.cyan, C.red, C.green]; const from = [[-700, -500], [700, -500], [-700, 600], [700, 600]];
  return <>{[0, 1, 2, 3].map((i) => { const t = ramp(f, at + i * every, at + i * every + 14, Easing.out(Easing.back(1.2))); const cx = i % 2, cy = Math.floor(i / 2);
    const px = x - s + cx * s, py = y - s + cy * s; return <React.Fragment key={i}><SndAt at={at + i * every + 13} snd={snd} vol={0.35} />
      <div style={{position: 'absolute', left: px + from[i][0] * (1 - t), top: py + from[i][1] * (1 - t), width: s - 6, height: s - 6, background: cols[i], borderRadius: 18, transform: `rotate(${(1 - t) * 90}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...LBL(44, C.ink), textShadow: 'none', boxShadow: '0 8px 16px rgba(0,0,0,.35)', padding: 16, boxSizing: 'border-box'}}>{labels[i]}</div></React.Fragment>; })}</>;
};

// =====================================================================
// ---------- tanda 6: CAMBIAR DE ESCENA ----------
// Todas reciben la escena NUEVA como children y la revelan sobre la vieja (que sigue debajo hasta at+dur).
// Duraciones cortas (8-14 frames): la atención se pierde si la transición tarda.
const easeIO = Easing.inOut(Easing.cubic);
/** La escena nueva entra como una tarjeta desde un costado, con sombra */
export const CardSlide = ({at, dur = 10, dir = 'right', snd = '04_whoosh_corto', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.out(Easing.cubic)); const d = {right: [W, 0], left: [-W, 0], up: [0, -H], down: [0, H]}[dir];
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `translate(${d[0] * (1 - t)}px, ${d[1] * (1 - t)}px) rotate(${(1 - t) * (dir === 'right' ? 6 : dir === 'left' ? -6 : 0)}deg)`, boxShadow: '0 0 60px rgba(0,0,0,.6)'}}>{children}</AbsoluteFill></>;
};
/** Persianas: franjas que se abren en cascada */
export const Blinds = ({at, dur = 12, n = 8, vertical = false, snd = '05_whoosh_largo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const step = (vertical ? W : H) / n;
  const poly = Array.from({length: n}, (_, i) => { const t = ramp(f, at + i * (dur * 0.4) / n, at + dur * 0.6 + i * (dur * 0.4) / n, easeIO); const a = i * step, b = a + step * t;
    return vertical ? `${a}px 0, ${b}px 0, ${b}px ${H}px, ${a}px ${H}px` : `0 ${a}px, ${W}px ${a}px, ${W}px ${b}px, 0 ${b}px`; });
  const done = f >= at + dur;
  return <><SndAt at={at} snd={snd} /><AbsoluteFill>{done ? children : poly.map((p, i) => <AbsoluteFill key={i} style={{clipPath: `polygon(${p})`}}>{children}</AbsoluteFill>)}</AbsoluteFill></>;
};
/** Mosaico: azulejos que aparecen en orden aleatorio girando */
export const TileReveal = ({at, dur = 14, cols = 6, rows = 10, snd = '30_tintineo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; if (f >= at + dur) return <AbsoluteFill>{children}</AbsoluteFill>; const cw = W / cols, ch = H / rows;
  return <><SndAt at={at} snd={snd} vol={0.35} />{Array.from({length: cols * rows}, (_, i) => { const c = i % cols, r = Math.floor(i / cols); const d0 = random('tr' + i) * dur * 0.6; const t = ramp(f, at + d0, at + d0 + dur * 0.4, easeIO);
    return t > 0 && <AbsoluteFill key={i} style={{clipPath: `inset(${r * ch}px ${W - (c + 1) * cw}px ${H - (r + 1) * ch}px ${c * cw}px)`, transform: `scale(${0.6 + 0.4 * t})`, transformOrigin: `${c * cw + cw / 2}px ${r * ch + ch / 2}px`, opacity: t}}>{children}</AbsoluteFill>; })}</>;
};
/** Mancha de tinta orgánica que se expande desde (x,y) */
export const InkSpread = ({at, dur = 14, x = W / 2, y = H / 2, snd = '58_chapoteo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.in(Easing.quad)); const R = t * 2400; const n = 36;
  const pts = Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2; const rr = R * (0.8 + 0.25 * random('ink' + i) + 0.1 * Math.sin(a * 5 + t * 6)); return `${x + Math.cos(a) * rr}px ${y + Math.sin(a) * rr}px`; }).join(', ');
  return <><SndAt at={at} snd={snd} vol={0.45} /><AbsoluteFill style={{clipPath: t >= 1 ? 'none' : `polygon(${pts})`}}>{children}</AbsoluteFill></>;
};
/** Barrido diagonal con banda de color en el borde */
export const DiagonalWipe = ({at, dur = 10, color = C.yellow, band = 120, snd = '04_whoosh_corto', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, easeIO); const s = -H + t * (W + 2 * H + band);
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{clipPath: `polygon(0 0, ${s}px 0, ${s - H}px ${H}px, 0 ${H}px)`}}>{children}</AbsoluteFill>
    {t < 1 && <div style={{position: 'absolute', inset: 0, background: color, clipPath: `polygon(${s}px 0, ${s + band}px 0, ${s + band - H}px ${H}px, ${s - H}px ${H}px)`}} />}</>;
};
/** Revela con una forma que crece: cross | star | heart | diamond | flame */
export const ShapeReveal = ({at, dur = 14, shape = 'cross', x = W / 2, y = H / 2, snd = '11_brillo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.in(Easing.cubic)); const s = 0.02 + t * 14;
  const P = {cross: 'M-20 -90 L20 -90 L20 -40 L60 -40 L60 0 L20 0 L20 90 L-20 90 L-20 0 L-60 0 L-60 -40 L-20 -40 Z', star: 'M0 -90 L22 -28 L88 -28 L35 10 L55 75 L0 36 L-55 75 L-35 10 L-88 -28 L-22 -28 Z',
    heart: 'M0 80 L-70 10 C-110 -30 -60 -90 0 -40 C60 -90 110 -30 70 10 Z', diamond: 'M0 -90 L70 0 L0 90 L-70 0 Z', flame: 'M0 -90 C30 -50 60 -20 50 30 C45 70 15 90 0 90 C-15 90 -45 70 -50 30 C-55 -10 -20 -30 0 -90 Z'}[shape];
  const id = `sr${at}`;
  return <><SndAt at={at} snd={snd} /><svg width={0} height={0} style={{position: 'absolute'}}><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><path d={P} transform={`translate(${x} ${y}) scale(${s}) rotate(${(1 - t) * 30})`} /></clipPath></defs></svg>
    <AbsoluteFill style={{clipPath: t >= 1 ? 'none' : `url(#${id})`}}>{children}</AbsoluteFill></>;
};
/** Giro de página / cubo: la escena entra rotando en 3D */
export const PageFlip = ({at, dur = 12, cube = false, snd = '19_pagina', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.out(Easing.cubic));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{perspective: 2200}}><AbsoluteFill style={{transform: `rotateY(${(1 - t) * (cube ? -90 : -110)}deg)`, transformOrigin: cube ? '0% 50%' : '0% 50%', boxShadow: `0 0 80px rgba(0,0,0,${0.6 * (1 - t)})`, filter: `brightness(${0.6 + 0.4 * t})`}}>{children}</AbsoluteFill></AbsoluteFill></>;
};
/** La escena nueva aparece chica en el centro y se agranda con desenfoque */
export const ZoomFrom = ({at, dur = 10, x = W / 2, y = H / 2, snd = '18_zoom', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.out(Easing.cubic));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `scale(${0.05 + 0.95 * t})`, transformOrigin: `${x}px ${y}px`, filter: t < 1 ? `blur(${(1 - t) * 20}px)` : 'none', opacity: Math.min(1, t * 3), borderRadius: (1 - t) * 400, overflow: 'hidden'}}>{children}</AbsoluteFill></>;
};
/** Corte glitch: franjas horizontales desplazadas + separación RGB */
export const GlitchCut = ({at, dur = 8, snd = '12_glitch', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; if (f >= at + dur) return <AbsoluteFill>{children}</AbsoluteFill>; const k = f - at; const n = 9;
  return <><SndAt at={at} snd={snd} />{Array.from({length: n}, (_, i) => { const y0 = (i / n) * H, y1 = ((i + 1) / n) * H; const show = random('gc' + i + k) < (k + 1) / dur + 0.2; const dx = (random('gx' + i + k) - 0.5) * 160;
    return show && <AbsoluteFill key={i} style={{clipPath: `inset(${y0}px 0 ${H - y1}px 0)`, transform: `translateX(${dx}px)`, filter: i % 3 === 0 ? 'hue-rotate(120deg) saturate(2)' : 'none'}}>{children}</AbsoluteFill>; })}</>;
};
/** Estallido de vidrio: fragmentos de color que salen volando y dejan ver la escena nueva */
export const Shatter = ({at, dur = 14, color = '#fff', snd = '70_vidrio_rompe', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const k = f - at; const t = ramp(f, at + 2, at + dur, Easing.in(Easing.quad)); const n = 22;
  return <><SndAt at={at} snd={snd} /><AbsoluteFill>{children}</AbsoluteFill>{t < 1 && <svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: n}, (_, i) => {
    const cx = random('shx' + i) * W, cy = random('shy' + i) * H; const a = Math.atan2(cy - H / 2, cx - W / 2); const r = 260; const pts = [0, 1, 2].map((j) => { const aa = random('sha' + i + j) * Math.PI * 2; return `${cx + Math.cos(aa) * r},${cy + Math.sin(aa) * r}`; }).join(' ');
    return <polygon key={i} points={pts} fill={color} stroke="rgba(0,0,0,.15)" strokeWidth={3} transform={`translate(${Math.cos(a) * t * 1400} ${Math.sin(a) * t * 1400 + t * t * 600}) rotate(${t * 240 * (i % 2 ? 1 : -1)} ${cx} ${cy})`} opacity={1 - t * 0.3} />; })}
    {k < 2 && <rect width={W} height={H} fill={color} />}</svg>}</>;
};
/** Giro: la escena entra rotando y creciendo */
export const SpinIn = ({at, dur = 12, snd = '05_whoosh_largo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.out(Easing.back(1.2)));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `rotate(${(1 - t) * -200}deg) scale(${Math.max(0.01, t)})`, opacity: Math.min(1, t * 2)}}>{children}</AbsoluteFill></>;
};
/** Puertas que se abren (dos hojas de color que se separan) */
export const DoorsOpen = ({at, dur = 14, color = '#5A3A22', snd = '52_madera', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at + 3, at + dur, easeIO);
  const leaf = (s) => <div style={{position: 'absolute', top: 0, height: H, width: W / 2, [s < 0 ? 'left' : 'right']: 0, background: `repeating-linear-gradient(90deg, ${color} 0 90px, ${shade(color, -0.2)} 90px 100px)`, border: `14px solid ${shade(color, -0.35)}`, boxSizing: 'border-box',
    transform: `perspective(1800px) rotateY(${s * -100 * t}deg)`, transformOrigin: s < 0 ? '0% 50%' : '100% 50%'}}><div style={{position: 'absolute', top: H / 2 - 40, [s < 0 ? 'right' : 'left']: 40, width: 30, height: 80, borderRadius: 15, background: '#C9A227'}} /></div>;
  return <><SndAt at={at} snd={snd} /><AbsoluteFill>{children}</AbsoluteFill>{t < 1 && <>{leaf(-1)}{leaf(1)}</>}</>;
};
/** Nube de humo blanco que tapa y se disipa (cambio de época, sueño, misterio) */
export const SmokePuff = ({at, dur = 16, color = '#fff', snd = '67_susurro', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur); const cover = t < 0.5 ? t * 2 : 2 - t * 2;
  return <><SndAt at={at} snd={snd} vol={0.6} />{t >= 0.45 && <AbsoluteFill>{children}</AbsoluteFill>}{t < 1 && <svg width={W} height={H} style={{position: 'absolute', filter: 'blur(14px)'}}>{Array.from({length: 26}, (_, i) => {
    const cx = random('smx' + i) * W, cy = random('smy' + i) * H; const r = (200 + random('smr' + i) * 260) * (0.3 + cover * 1.1); return <circle key={i} cx={cx + Math.sin(t * 4 + i) * 40} cy={cy - t * 120} r={r} fill={color} opacity={Math.min(1, cover * 1.6)} />; })}</svg>}</>;
};
/** Destello de luz cálida que barre la pantalla (light leak) */
export const LightLeak = ({at, dur = 12, color = '#FFB347', snd = '11_brillo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, easeIO); const peak = Math.sin(t * Math.PI);
  return <><SndAt at={at} snd={snd} />{t >= 0.5 && <AbsoluteFill>{children}</AbsoluteFill>}<AbsoluteFill style={{background: `radial-gradient(ellipse at ${-20 + t * 140}% 40%, #fff ${peak * 20}%, ${color} ${peak * 45}%, transparent ${peak * 85}%)`, opacity: peak * 1.3, mixBlendMode: 'screen'}} />
    <AbsoluteFill style={{background: '#FFF4DE', opacity: Math.max(0, peak - 0.6) * 2.5}} /></>;
};
/** Goteo: chorros de color caen, tapan y al subir dejan la escena nueva */
export const Drip = ({at, dur = 16, color = C.red, n = 12, snd = '57_burbujeo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, easeIO); const down = Math.min(1, t * 2), up = Math.max(0, t * 2 - 1);
  return <><SndAt at={at} snd={snd} vol={0.4} />{t >= 0.5 && <AbsoluteFill>{children}</AbsoluteFill>}{t < 1 && <svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: n}, (_, i) => {
    const w = W / n; const l = (H + 300) * Math.min(1, down * (0.7 + 0.5 * random('dr' + i))); const top = up * (H + 300);
    return <g key={i}><rect x={i * w - 1} y={top} width={w + 2} height={Math.max(0, l - top)} fill={color} /><circle cx={i * w + w / 2} cy={l} r={w / 2} fill={color} opacity={l > top ? 1 : 0} /></g>; })}</svg>}</>;
};
/** Ondas de agua concéntricas y la escena aparece desde el centro */
export const RippleReveal = ({at, dur = 14, x = W / 2, y = H / 2, snd = '58_chapoteo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.out(Easing.quad)); const R = t * 2300;
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{clipPath: t >= 1 ? 'none' : `circle(${R}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>
    {t < 1 && <svg width={W} height={H} style={{position: 'absolute'}}>{[0, 1, 2].map((i) => <circle key={i} cx={x} cy={y} r={Math.max(0, R - i * 70)} fill="none" stroke="#fff" strokeWidth={10 - i * 3} opacity={(1 - t) * (1 - i * 0.25)} />)}</svg>}</>;
};
/** Barras de colores que barren (estilo divulgación) */
export const ColorBars = ({at, dur = 12, colors = [C.yellow, C.red, C.cyan, '#fff'], snd = '05_whoosh_largo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const n = colors.length;
  return <><SndAt at={at} snd={snd} />{f >= at + dur * 0.5 && <AbsoluteFill>{children}</AbsoluteFill>}{colors.map((c, i) => { const t = ramp(f, at + i * 1.5, at + dur - (n - 1 - i) * 1.5, easeIO); const x0 = (-1 + 2 * t) * W * 1.2;
    return t > 0 && t < 1 && <div key={i} style={{position: 'absolute', top: 0, left: x0 - W * 0.6, width: W * 1.2, height: H, background: c, transform: 'skewX(-12deg)'}} />; })}</>;
};
/** Enfoque: la escena nueva aparece desenfocada y se aclara */
export const FocusIn = ({at, dur = 12, snd = null, children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, Easing.out(Easing.cubic));
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{filter: t < 1 ? `blur(${(1 - t) * 40}px) brightness(${1 + (1 - t) * 0.5})` : 'none', opacity: Math.min(1, t * 2), transform: `scale(${1.08 - 0.08 * t})`}}>{children}</AbsoluteFill></>;
};
/** Foto que cae girando y se expande hasta ser la escena */
export const PhotoDrop = ({at, dur = 16, snd = '55_obturador', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const a = ramp(f, at, at + dur * 0.5, Easing.out(Easing.back(1.4))); const b = ramp(f, at + dur * 0.55, at + dur, easeIO);
  const sc = 0.45 + 0.55 * b; const pad = 26 * (1 - b);
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `translateY(${(1 - a) * -1400}px) rotate(${(1 - b) * -8}deg) scale(${sc})`, background: '#FAFAF5', padding: pad, paddingBottom: pad * 4, boxShadow: `0 30px 60px rgba(0,0,0,${0.5 * (1 - b)})`}}>
    <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden'}}>{children}</div></AbsoluteFill></>;
};
/** Trazo de pincel que cruza y deja la escena nueva */
export const BrushWipe = ({at, dur = 14, color = '#1B1B22', snd = '20_pluma', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, easeIO); const id = `bw${at}`; const L = 9000;
  const d = Array.from({length: 7}, (_, i) => (i % 2 ? `L${W + 300} ${i * 300 + 50}` : `L-300 ${i * 300 + 50}`)).join(' ');
  return <><SndAt at={at} snd={snd} vol={0.5} /><svg width={0} height={0} style={{position: 'absolute'}}><defs><mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}><rect width={W} height={H} fill="black" />
      <path d={`M-300 -100 ${d}`} stroke="white" strokeWidth={560} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - t)} /></mask></defs></svg>
    <AbsoluteFill style={t >= 1 ? {} : {mask: `url(#${id})`, WebkitMask: `url(#${id})`}}>{children}</AbsoluteFill></>;
};
/** Tele vieja: la imagen se colapsa en una línea y se abre la nueva */
export const TVSwitch = ({at, dur = 12, snd = '39_estatica', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at + dur * 0.4, at + dur, Easing.out(Easing.cubic)); const c = ramp(f, at, at + dur * 0.4);
  return <><SndAt at={at} snd={snd} vol={0.4} />{f < at + dur * 0.4 ? <AbsoluteFill style={{background: '#000', clipPath: `inset(${c * 49.6}% 0 ${c * 49.6}% 0)`}}><AbsoluteFill style={{background: '#fff', opacity: c}} /></AbsoluteFill>
      : <AbsoluteFill style={{background: '#000'}}><AbsoluteFill style={{transform: `scaleY(${Math.max(0.005, t)}) scaleX(${0.3 + 0.7 * Math.min(1, t * 3)})`, filter: t < 1 ? `brightness(${1 + (1 - t) * 3})` : 'none'}}>{children}</AbsoluteFill></AbsoluteFill>}</>;
};
/** Rebanadas: la escena entra en franjas verticales escalonadas */
export const SliceIn = ({at, dur = 12, n = 5, snd = '04_whoosh_corto', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; if (f >= at + dur) return <AbsoluteFill>{children}</AbsoluteFill>; const w = W / n;
  return <><SndAt at={at} snd={snd} />{Array.from({length: n}, (_, i) => { const t = ramp(f, at + i * 1.5, at + dur - (n - 1 - i) * 1.5, Easing.out(Easing.cubic));
    return <AbsoluteFill key={i} style={{clipPath: `inset(0 ${W - (i + 1) * w}px 0 ${i * w}px)`, transform: `translateY(${(1 - t) * (i % 2 ? H : -H)}px)`}}>{children}</AbsoluteFill>; })}</>;
};
/** Zoom de mapa/época: la escena nueva aparece dentro de un círculo que vuela desde un punto y crece (círculo flotante) */
export const BubbleTravel = ({at, dur = 16, from = [200, 1600], r0 = 120, snd = '29_burbuja', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const a = ramp(f, at, at + dur * 0.45, Easing.out(Easing.back(1.6))); const b = ramp(f, at + dur * 0.5, at + dur, Easing.in(Easing.cubic));
  const x = from[0] + (W / 2 - from[0]) * a, y = from[1] + (H / 2 - from[1]) * a; const R = r0 * a + b * 2200;
  return <><SndAt at={at} snd={snd} /><SndAt at={at + Math.round(dur * 0.5)} snd="18_zoom" /><AbsoluteFill style={{clipPath: b >= 1 ? 'none' : `circle(${R}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>
    {b < 1 && <div style={{position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', border: '12px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,.45)', boxSizing: 'border-box'}} />}</>;
};
/** Desplazamiento de "cámara" hacia arriba (escena nueva viene de abajo empujando) con líneas de velocidad */
export const PanUp = ({at, dur = 10, snd = '05_whoosh_largo', children}) => {
  const f = useCurrentFrame(); if (f < at) return null; const t = ramp(f, at, at + dur, easeIO); const sp = Math.sin(t * Math.PI);
  return <><SndAt at={at} snd={snd} /><AbsoluteFill style={{transform: `translateY(${(1 - t) * H}px)`, filter: sp > 0.1 ? `blur(${sp * 6}px)` : 'none'}}>{children}</AbsoluteFill>
    {sp > 0.05 && <svg width={W} height={H} style={{position: 'absolute', opacity: sp}}>{Array.from({length: 14}, (_, i) => <line key={i} x1={random('pu' + i) * W} y1={0} x2={random('pu' + i) * W} y2={H} stroke="#fff" strokeWidth={2 + random('pw' + i) * 6} opacity={0.5} />)}</svg>}</>;
};

// =====================================================================
// ---------- tanda 6: AMBIENTE (capas que se ponen encima de la escena, salvo los "paisajes") ----------
/** Niebla que se desplaza en capas */
export const Fog = ({o = 0.55, color = '#E8EEF5', low = true}) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{position: 'absolute', opacity: o * 0.8, filter: 'blur(55px)', pointerEvents: 'none'}}>{Array.from({length: 20}, (_, i) => { const y = (low ? H * 0.55 : 0) + random('fgy' + i) * H * (low ? 0.45 : 1); const sp = 0.6 + random('fgs' + i);
    const x = ((random('fgx' + i) * (W + 800) + f * sp * (i % 2 ? 1 : -1)) % (W + 800) + W + 800) % (W + 800) - 400; return <ellipse key={i} cx={x} cy={y} rx={420} ry={110} fill={color} />; })}</svg>;
};
/** Haces de luz entrando en diagonal (ventana, templo, catedral) */
export const LightShafts = ({o = 0.5, color = '#FFF1C9', angle = 25, n = 5}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o, pointerEvents: 'none'}}><svg width={W} height={H}><defs><linearGradient id="lsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.9" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <filter id="lsb" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="22" /></filter><g transform={`rotate(${angle} ${W / 2} 0)`} filter="url(#lsb)">{Array.from({length: n}, (_, i) => { const x = 80 + i * (W / n) + Math.sin(f / 40 + i) * 20; const w = 60 + random('ls' + i) * 120; return <rect key={i} x={x} y={-200} width={w} height={H * 1.6} fill="url(#lsg)" opacity={0.5 + 0.5 * Math.sin(f / 25 + i * 2)} />; })}</g></svg></AbsoluteFill>;
};
/** Luz de vela / antorcha: viñeta cálida que titila */
export const Candlelight = ({x = W / 2, y = H * 0.6, o = 0.85}) => {
  const f = useCurrentFrame(); const fl = 0.9 + 0.06 * Math.sin(f / 2.3) + 0.04 * random('cl' + f);
  return <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,190,90,${0.25 * fl}) 0%, rgba(40,20,5,${0.55 * o}) ${45 * fl}%, rgba(0,0,0,${0.85 * o}) 85%)`, pointerEvents: 'none'}} />;
};
/** Luciérnagas / chispas mágicas que flotan y titilan */
export const Fireflies = ({n = 30, color = '#FFF27A'}) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{position: 'absolute', pointerEvents: 'none'}}>{Array.from({length: n}, (_, i) => { const x = random('ffx' + i) * W + Math.sin(f / 30 + i) * 60, y = random('ffy' + i) * H + Math.cos(f / 25 + i * 2) * 50; const on = Math.max(0, Math.sin(f / 12 + i * 1.7));
    return <circle key={i} cx={x} cy={y} r={5} fill={color} opacity={on} style={{filter: `drop-shadow(0 0 10px ${color})`}} />; })}</svg>;
};
/** Tormenta de arena: polvo horizontal + bruma ocre */
export const Sandstorm = ({o = 0.7}) => {
  const f = useCurrentFrame();
  return <><AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(200,150,80,.35), rgba(170,110,50,.55))', opacity: o, pointerEvents: 'none'}} /><svg width={W} height={H} style={{position: 'absolute', opacity: o, pointerEvents: 'none'}}>
    {Array.from({length: 120}, (_, i) => { const y = random('ssy' + i) * H; const sp = 18 + random('sss' + i) * 30; const x = ((random('ssx' + i) * (W + 400) + f * sp) % (W + 400)) - 200; return <line key={i} x1={x} y1={y} x2={x + 40 + sp * 2} y2={y + 3} stroke="#E8C48A" strokeWidth={2 + random('ssw' + i) * 3} opacity={0.6} />; })}</svg></>;
};
/** Bajo el agua: tinte azul, rayos de luz ondulantes y burbujas */
export const Underwater = ({o = 1}) => {
  const f = useCurrentFrame();
  return <><AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,140,200,.35), rgba(5,30,70,.7))', opacity: o, pointerEvents: 'none'}} />
    <svg width={W} height={H} style={{position: 'absolute', opacity: 0.35 * o, mixBlendMode: 'screen', pointerEvents: 'none'}}>{Array.from({length: 6}, (_, i) => <path key={i} d={`M${100 + i * 180 + Math.sin(f / 20 + i) * 40} -50 L${40 + i * 180} ${H} L${120 + i * 180} ${H} Z`} fill="#BFE9FF" style={{filter: 'blur(14px)'}} />)}</svg>
    <svg width={W} height={H} style={{position: 'absolute', pointerEvents: 'none'}}>{Array.from({length: 26}, (_, i) => { const sp = 3 + random('ubs' + i) * 4; const y = H - ((random('uby' + i) * H + f * sp) % (H + 50)); return <circle key={i} cx={random('ubx' + i) * W + Math.sin(f / 10 + i) * 12} cy={y} r={4 + random('ubr' + i) * 10} fill="none" stroke="#DFF6FF" strokeWidth={3} opacity={0.7} />; })}</svg></>;
};
/** Hojas o pétalos que caen girando */
export const FallingLeaves = ({n = 24, kind = 'leaves'}) => {
  const f = useCurrentFrame(); const cols = kind === 'petals' ? ['#FFB7C8', '#FF8FAB', '#FFE1E8'] : ['#D9822B', '#B5541C', '#E8B04A', '#8C6B2F'];
  return <svg width={W} height={H} style={{position: 'absolute', pointerEvents: 'none'}}>{Array.from({length: n}, (_, i) => { const sp = 3 + random('lfs' + i) * 3; const y = ((random('lfy' + i) * H + f * sp) % (H + 100)) - 50; const x = random('lfx' + i) * W + Math.sin(f / 18 + i) * 70;
    return <ellipse key={i} cx={x} cy={y} rx={kind === 'petals' ? 12 : 18} ry={kind === 'petals' ? 8 : 9} fill={cols[i % cols.length]} transform={`rotate(${f * (4 + i % 5) + i * 30} ${x} ${y})`} opacity={0.9} />; })}</svg>;
};
/** Nubes que pasan en capas (cielo de día) */
export const Clouds = ({n = 6, y0 = 120, y1 = 800, o = 0.9, speed = 1}) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{position: 'absolute', opacity: o, pointerEvents: 'none'}}>{Array.from({length: n}, (_, i) => { const s = 0.6 + random('cls' + i) * 0.8; const x = ((random('clx' + i) * (W + 700) + f * speed * s) % (W + 700)) - 350; const y = y0 + random('cly' + i) * (y1 - y0);
    return <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">{[[-110, 20, 70], [-40, -10, 95], [50, 0, 85], [120, 25, 60], [0, 40, 80]].map(([a, b, r], j) => <circle key={j} cx={a} cy={b} r={r} />)}</g>; })}</svg>;
};
/** Estrella fugaz ocasional (sobre cielo nocturno) */
export const ShootingStars = ({every = 50, n = 2}) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{position: 'absolute', pointerEvents: 'none'}}>{Array.from({length: n}, (_, i) => { const cyc = Math.floor((f + i * 23) / every); const k = (f + i * 23) % every; if (k > 14) return null;
    const x0 = 200 + random('sx' + cyc + i) * 700, y0 = 100 + random('sy' + cyc + i) * 500; const t = k / 14; const x = x0 + t * 500, y = y0 + t * 260;
    return <line key={i} x1={x - 160} y1={y - 83} x2={x} y2={y} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={Math.sin(t * Math.PI)} style={{filter: 'drop-shadow(0 0 8px #fff)'}} />; })}</svg>;
};
/** Resplandor de fogata desde abajo, titilante */
export const FireGlow = ({o = 0.8, y = H}) => {
  const f = useCurrentFrame(); const fl = 0.85 + 0.1 * Math.sin(f / 1.7) + 0.05 * random('fg' + f);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% ${y}px, rgba(255,140,40,${0.55 * fl}) 0%, rgba(255,90,20,${0.25 * fl}) 35%, transparent 70%)`, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};
/** Relámpagos de fondo (tormenta lejana) cada tanto */
export const StormFlash = ({every = 45, o = 0.5, snd = '61_trueno'}) => {
  const f = useCurrentFrame(); const {durationInFrames: D} = useVideoConfig(); const k = f % every; const on = k < 2 || (k > 3 && k < 5);
  return <>{Array.from({length: Math.ceil(D / every)}, (_, i) => <SndAt key={i} at={i * every} snd={snd} vol={0.3} />)}<AbsoluteFill style={{background: '#DDE8FF', opacity: on ? o : 0, mixBlendMode: 'screen', pointerEvents: 'none'}} /></>;
};
/** Sueño / recuerdo: bordes difuminados y brillo suave */
export const Dream = ({o = 1}) => {
  const f = useCurrentFrame();
  return <><AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(255,255,255,.75) 95%)', opacity: o, pointerEvents: 'none'}} /><AbsoluteFill style={{backdropFilter: 'blur(0px)', boxShadow: `inset 0 0 ${180 + 20 * Math.sin(f / 15)}px rgba(255,240,255,.8)`, pointerEvents: 'none'}} /></>;
};
/** Resplandor sagrado dorado desde arriba que late suave */
export const HolyGlow = ({o = 0.7, x = W / 2, y = 0}) => {
  const f = useCurrentFrame(); const p = 0.85 + 0.15 * Math.sin(f / 20);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at ${x}px ${y}px, rgba(255,240,190,${0.9 * p}) 0%, rgba(255,215,120,${0.4 * p}) 30%, transparent 65%)`, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};
/** Tensión: viñeta roja que late como un corazón */
export const TensionPulse = ({o = 0.7, bpm = 90, snd = null}) => {
  const f = useCurrentFrame(); const per = 1800 / bpm; const k = (f % per) / per; const b = Math.exp(-k * 8) + 0.6 * Math.exp(-Math.max(0, k - 0.18) * 10) * (k > 0.18 ? 1 : 0);
  return <><SndAt at={0} snd={snd} /><AbsoluteFill style={{background: `radial-gradient(circle, transparent ${50 - b * 8}%, rgba(170,0,20,${0.55 * o * (0.6 + 0.4 * b)}) 100%)`, pointerEvents: 'none'}} /></>;
};
/** Escarcha en las esquinas + tinte frío */
export const Frost = ({o = 0.8}) => (
  <><AbsoluteFill style={{background: 'rgba(160,200,255,.18)', opacity: o, pointerEvents: 'none'}} /><AbsoluteFill style={{background: 'radial-gradient(circle at 0 0, rgba(255,255,255,.85), transparent 30%), radial-gradient(circle at 100% 0, rgba(255,255,255,.8), transparent 28%), radial-gradient(circle at 0 100%, rgba(255,255,255,.8), transparent 30%), radial-gradient(circle at 100% 100%, rgba(255,255,255,.85), transparent 32%)', opacity: o, filter: 'blur(4px)', pointerEvents: 'none'}} /></>
);
/** Humo que sube en volutas (incienso, ofrenda, altar). x,y = base */
export const SmokeRise = ({x = W / 2, y = 1300, o = 0.6, color = '#E9E6F0'}) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{position: 'absolute', opacity: o, filter: 'blur(10px)', pointerEvents: 'none'}}>{Array.from({length: 16}, (_, i) => { const k = ((f * 1.2 + i * 18) % 280) / 280; const yy = y - k * 900; const xx = x + Math.sin(k * 6 + i) * 60 * k;
    return <circle key={i} cx={xx} cy={yy} r={20 + k * 90} fill={color} opacity={(1 - k) * 0.8} />; })}</svg>;
};
/** Rachas de viento (líneas que cruzan) */
export const WindStreaks = ({n = 18, o = 0.6, snd = null}) => {
  const f = useCurrentFrame();
  return <><SndAt at={0} snd={snd} /><svg width={W} height={H} style={{position: 'absolute', opacity: o, pointerEvents: 'none'}}>{Array.from({length: n}, (_, i) => { const sp = 30 + random('wsp' + i) * 30; const x = ((random('wsx' + i) * (W + 900) + f * sp) % (W + 900)) - 450; const y = random('wsy' + i) * H;
    return <path key={i} d={`M${x} ${y} q 120 -30 240 0 t 240 0`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />; })}</svg></>;
};
/** Luces bokeh desenfocadas que flotan (calidez, celebración, recuerdo) */
export const Bokeh = ({n = 18, colors = ['#FFD27A', '#FF9FB2', '#9FD8FF', '#FFFFFF'], o = 0.55}) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{position: 'absolute', opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}}>{Array.from({length: n}, (_, i) => { const r = 40 + random('bkr' + i) * 90; const x = random('bkx' + i) * W + Math.sin(f / 50 + i) * 40, y = random('bky' + i) * H + Math.cos(f / 60 + i) * 40;
    return <circle key={i} cx={x} cy={y} r={r} fill={colors[i % colors.length]} opacity={0.35 + 0.25 * Math.sin(f / 30 + i)} style={{filter: 'blur(6px)'}} />; })}</svg>;
};
/** PAISAJE (fondo): desierto en capas de dunas con sol y bruma de calor */
export const DesertScape = ({sunY = 520, sky = ['#F6C77A', '#E9864A']}) => {
  const f = useCurrentFrame(); const dune = (y, a, c, sp) => <path d={`M0 ${y} ${Array.from({length: 9}, (_, i) => `Q${i * 135 + 67} ${y - a * (i % 2 ? 1 : -0.4)} ${(i + 1) * 135} ${y}`).join(' ')} L${W} ${H} L0 ${H} Z`} fill={c} transform={`translate(${Math.sin(f / sp) * 8} 0)`} />;
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky[0]}, ${sky[1]})`}}><div style={{position: 'absolute', left: W / 2 - 150, top: sunY - 150, width: 300, height: 300, borderRadius: '50%', background: '#FFF1C2', boxShadow: '0 0 120px #FFE08A'}} />
    <svg width={W} height={H} style={{position: 'absolute'}}>{dune(1150, 70, '#D9A066', 90)}{dune(1350, 90, '#C2864C', 70)}{dune(1580, 110, '#A86E3A', 50)}</svg></AbsoluteFill>;
};
/** PAISAJE: colinas con olivos y cielo (Galilea, Belén de día) */
export const HillsScape = ({night = false}) => {
  const f = useCurrentFrame(); const sky = night ? ['#0B1430', '#26335E'] : ['#8EC5F2', '#DCEFFF']; const g = night ? ['#1E2B3A', '#16212D', '#0F1820'] : ['#8FB36A', '#6E9A4C', '#557E39'];
  const hill = (y, a, c) => <path d={`M0 ${y} C ${W * 0.25} ${y - a} ${W * 0.5} ${y + a * 0.4} ${W * 0.75} ${y - a * 0.6} S ${W} ${y} ${W} ${y} L${W} ${H} L0 ${H} Z`} fill={c} />;
  const olive = (x, y, s) => <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-8} y={0} width={16} height={60} fill={night ? '#0B1015' : '#6B4A2E'} /><circle cx={0} cy={-10} r={42} fill={night ? '#14202A' : '#7C9C5A'} /><circle cx={-30} cy={5} r={28} fill={night ? '#14202A' : '#7C9C5A'} /><circle cx={30} cy={5} r={30} fill={night ? '#14202A' : '#7C9C5A'} /></g>;
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky[0]}, ${sky[1]})`}}>{night && <div style={{position: 'absolute', left: 760, top: 260, width: 120, height: 120, borderRadius: '50%', background: '#F4F1DE', boxShadow: '0 0 60px #fff'}} />}
    <svg width={W} height={H} style={{position: 'absolute'}}>{hill(1150, 120, g[0])}{olive(220, 1100, 1)}{olive(820, 1060, 0.8)}{hill(1350, 160, g[1])}{olive(560, 1290, 1.3)}{hill(1600, 120, g[2])}</svg></AbsoluteFill>;
};
/** PAISAJE: horizonte de mar con olas suaves (Galilea, Mediterráneo, viajes de Pablo) */
export const SeaScape = ({sunset = false}) => {
  const f = useCurrentFrame(); const sky = sunset ? ['#F6A15A', '#F7D08A'] : ['#7FC3F0', '#D6EEFF']; const sea = sunset ? ['#C8664A', '#5A2E3A'] : ['#3E8FC4', '#0F3E66'];
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky[0]}, ${sky[1]} 55%, ${sea[0]} 55%, ${sea[1]})`}}>
    {sunset && <div style={{position: 'absolute', left: W / 2 - 130, top: 1056 - 130, width: 260, height: 260, borderRadius: '50%', background: '#FFE3A8', clipPath: 'inset(0 0 50% 0)', boxShadow: '0 0 100px #FFC56B'}} />}
    <svg width={W} height={H} style={{position: 'absolute'}}>{Array.from({length: 10}, (_, i) => { const y = 1080 + i * 85; return <path key={i} d={`M${-100 + ((f * (1 + i * 0.2)) % 200)} ${y} ${Array.from({length: 8}, (_, j) => `q 80 ${-12 - i} 160 0`).join(' ')}`} stroke="rgba(255,255,255,.45)" strokeWidth={3 + i * 0.4} fill="none" />; })}</svg></AbsoluteFill>;
};
/** PAISAJE: ciudad amurallada en silueta al atardecer (Jerusalén, Jericó, Babilonia) */
export const WalledCityScape = ({sky = ['#F08A5D', '#5B2A57'], color = '#2A1A2E'}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky[1]}, ${sky[0]})`}}><svg width={W} height={H} style={{position: 'absolute'}}>
    <path d={`M0 1300 L0 1180 ${Array.from({length: 12}, (_, i) => { const x = i * 90; return `L${x} 1180 L${x} 1150 L${x + 30} 1150 L${x + 30} 1180 L${x + 60} 1180 L${x + 60} 1150 L${x + 90} 1150`; }).join(' ')} L${W} 1300 Z`} fill={color} />
    <rect x={150} y={1000} width={120} height={300} fill={color} /><rect x={760} y={960} width={140} height={340} fill={color} /><path d="M430 1180 L430 980 Q520 880 610 980 L610 1180 Z" fill={color} /><rect x={490} y={1080} width={60} height={100} rx={30} fill="#FFB86B" opacity={0.6 + 0.2 * Math.sin(f / 10)} />
    <rect x={0} y={1290} width={W} height={H - 1290} fill={shade(color, -0.3)} /></svg></AbsoluteFill>;
};
