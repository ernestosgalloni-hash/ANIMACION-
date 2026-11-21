import React from 'react';
import {registerRoot, Composition, AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {W, H, C, Bg, Figure, Pop, SlideIn, Camera, Title, Draw, Check, Sfx, Pin, usePop, ramp,
  BigQuestion, DateStamp, LowerThird, Writer, Crowd, InkText, TensionPulse, HeavenRays, Aura, Earthquake, Source, Emote,
  doubleTakeAt, Kneel, MoodTint, Dream, TextSwap, HolyGlow, KenBurns, Crucified, Darkness, Vignette, Floaters,
  SmokePuff, CardSlide, LightLeak, FocusIn, DiagonalWipe, Iris, GlitchCut, BubbleTravel, PageFlip} from './lib';
import TL from './zac_tl.json';
import A from './acc_fit.json';

const GOLD = '#E8B04A', CREAM = '#F3E6CC';
const JESUS = {acc: {hair: 'longm', hairC: '#5A3A22', beard: 'short', beardC: '#5A3A22'}, dress: {type: 'tunic', c1: '#F2EEE4', c2: '#C9A227', belt: 'rope'}};
const JESUS_CRUZ = {acc: {hair: 'longm', hairC: '#5A3A22', beard: 'short', beardC: '#5A3A22'}, dress: {type: 'tunic', c1: '#E8DCC0', c2: '#8E1F2F', belt: 'rope'},
  photoAcc: [{id: 'corona_espinas', dir: 'acc_lib', ...A.corona_espinas}]};
const ZAC = {acc: {hair: 'long', hairC: '#CFCFCF', beard: 'long', beardC: '#CFCFCF'}, dress: {type: 'prophet', c1: '#8B6B4A', c2: '#5C4630'}};
const PABLO = {acc: {hair: 'short', hairC: '#3A2A1E', beard: 'long', beardC: '#3A2A1E'}, dress: {type: 'tunic', c1: '#9C7B55', c2: '#7A2E2A', belt: 'sash'}};
const PUEBLO = [
  {acc: {hair: 'short', hairC: '#2E2018', beard: 'long', beardC: '#2E2018'}, dress: {type: 'tunic', c1: '#7D5A3C', c2: '#3F5E7A', belt: 'rope'}},
  {acc: {hair: 'long', hairC: '#3B2A1C'}, dress: {type: 'dress', c1: '#8E3B3B'}},
  {acc: {hair: 'short', hairC: '#1E1612', beard: 'short', beardC: '#1E1612'}, dress: {type: 'tunic', c1: '#C8B48E', c2: '#6B4A2E', belt: 'sash'}},
  {acc: {hair: 'bun', hairC: '#4A3020'}, dress: {type: 'dress', c1: '#3F6B5A'}},
  {acc: {hair: 'short', hairC: '#BDBDBD', beard: 'long', beardC: '#BDBDBD'}, dress: {type: 'tunic', c1: '#5E4B6B', c2: '#C8B48E', belt: 'rope'}},
];

const b = (id) => TL[id].start;
// escenas: [primer beat, transición]
const SCENES = [['z1', null], ['z2', 'smoke'], ['z3', 'card'], ['z5', 'bubble'], ['z7', 'focus'], ['z8', 'page'], ['z9', 'glitch'],
  ['z10', 'light'], ['z15', 'page'], ['z16', 'smoke'], ['z17', 'wipe'], ['z19', 'iris'], ['z20', 'card'], ['z22', 'bubble']];
const TR = 16;
const sStart = (i) => (i === 0 ? 0 : b(SCENES[i][0]));
const sEnd = (i) => (i + 1 < SCENES.length ? sStart(i + 1) : TL._total);

const Photo = ({src, dur, dim = 0.3, from, to}) => (
  <KenBurns src={src} dur={dur} from={from} to={to}><AbsoluteFill style={{background: `rgba(20,10,0,${dim})`}} /></KenBurns>);

const Star = ({at, x = 540, y = 760, r = 230}) => {
  const p = usePop(at); const f = useCurrentFrame();
  const tri = (rot) => [0, 1, 2].map((k) => { const a = (rot + k * 120 - 90) * Math.PI / 180; return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`; }).join(' ');
  return <svg width={W} height={H} style={{position: 'absolute', transform: `scale(${p})`, transformOrigin: `${x}px ${y}px`,
    filter: `drop-shadow(0 0 ${18 + 8 * Math.sin(f / 9)}px rgba(232,176,74,.8))`}}>
    <polygon points={tri(0)} fill="none" stroke={GOLD} strokeWidth={22} strokeLinejoin="round" />
    <polygon points={tri(180)} fill="none" stroke={GOLD} strokeWidth={22} strokeLinejoin="round" />
  </svg>;
};

const Spring = ({at, x = 540, y = 1300}) => {
  const f = useCurrentFrame(); const t = f - at; if (t < 0) return null;
  const g = Math.min(1, t / 20);
  const drops = Array.from({length: 40}, (_, i) => {
    const life = 34, ph = (t + i * 7) % life, a = ((i * 37) % 100) / 100 - 0.5, v = 13 + (i % 5);
    const px = x + a * 9 * ph, py = y - (v * ph - 0.45 * ph * ph) * g;
    return <circle key={i} cx={px} cy={py} r={7 + (i % 3) * 2} fill="#CFF3FF" opacity={0.85 * (1 - ph / life)} />;
  });
  return <svg width={W} height={H} style={{position: 'absolute'}}>
    <ellipse cx={x} cy={y + 20} rx={300 * g} ry={60 * g} fill="#7FD3F0" opacity={0.55} />
    {[0, 1, 2].map((k) => { const ph = ((t + k * 15) % 45) / 45; return <ellipse key={k} cx={x} cy={y + 20} rx={300 * g * ph} ry={60 * g * ph} fill="none" stroke="#E8FBFF" strokeWidth={4} opacity={1 - ph} />; })}
    <rect x={x - 16} y={y - 230 * g} width={32} height={230 * g} rx={16} fill="url(#wj)" />
    <defs><linearGradient id="wj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2FDFF" /><stop offset="1" stopColor="#7FD3F0" /></linearGradient></defs>
    {drops}
  </svg>;
};

/* 0 · gancho */
const S0 = ({dur}) => (<Camera dur={dur} zoom={[1, 1.08]}>
  <Bg kind="sepia" /><Floaters kind="dust" n={30} o={0.5} />
  <Star at={2} />
  <BigQuestion at={10} y={1260} text="¿Tiene Dios un plan para salvar a los judíos?" size={82} />
  <Sfx at={2} name="p_luz" vol={0.4} />
</Camera>);

/* 1 · hace 2500 años */
const S1 = ({dur, s0}) => (<>
  <Photo src="fondos/antiguo_testamento/jerusalen_ruinas_murallas.jpg" dur={dur} dim={0.25} />
  <DateStamp at={14} y={330} place="Jerusalén" date="c. 520 a.C." />
</>);

/* 2 · Zacarías */
const S2 = ({dur, s0}) => { const L = (id) => b(id) - s0; const f = useCurrentFrame(); const w = f >= L('z4');
  return (<Camera dur={dur} zoom={[1, 1.06]}>
    <Bg kind="warm" />
    {!w && <Pop at={2}><Figure x={540} y={1040} s={2.3} seed={2} {...ZAC} greet={{at: 8}} /></Pop>}
    {w && <Writer x={540} y={1040} s={2.3} from={L('z4') + 2} to={L('z4') + 45}><Figure x={540} y={1040} s={2.3} pose="write" seed={2} {...ZAC} /></Writer>}
    <LowerThird at={6} y={1560} name="Zacarías" role="Profeta" years="c. 520 a.C." />
    {w && <Emote at={L('z4') + 14} x={760} y={560} type="!" s={1.4} />}
    <Sfx at={2} name="p_presentacion" vol={0.4} />
  </Camera>); };

/* 3 · todas las naciones */
const ARROWS = [[40, 160], [1040, 120], [30, 900], [1050, 760], [180, 1250], [980, 1300], [520, 40]];
const S3 = ({dur, s0}) => { const L = (id) => b(id) - s0; const JX = 470, JY = 555;
  return (<Camera dur={dur} zoom={[1, 1.1]} shakes={[L('z6') + 50]}>
    <Bg kind="map" />
    <Pin at={L('z5') + 6} x={JX} y={JY} />
    <Title at={L('z5') + 10} x={JX} y={JY + 100} size={54} color={CREAM}>JERUSALÉN</Title>
    {ARROWS.map(([x, y], i) => { const k = 0.82; const ex = x + (JX - x) * k, ey = y + (JY - y) * k;
      return <Draw key={i} at={L('z6') + 4 + i * 5} d={`M${x} ${y} L${ex} ${ey}`} dur={12} color={C.red} width={16} arrow />; })}
    <Title at={L('z6') + 6} y={1560} size={84}>TODAS LAS <span style={{color: C.red}}>NACIONES</span></Title>
    <Source at={L('z6') + 20} text="Zacarías 12:3 · 14:2" />
    <Sfx at={L('z5') + 6} name="44_pin_mapa" vol={0.45} />
    {ARROWS.map((_, i) => <Sfx key={i} at={L('z6') + 4 + i * 5} name="04_whoosh_corto" vol={0.22} />)}
    <Sfx at={L('z6') + 6} name="01_pop_texto" vol={0.4} /><Sfx at={L('z6') + 50} name="06_golpe_grave" vol={0.45} />
  </Camera>); };

/* 4 · ciudad sola */
const S4 = ({dur, s0}) => (<>
  <Photo src="fondos/nuevo_testamento/murallas_jerusalen.jpg" dur={dur} dim={0.45} />
  <TensionPulse o={0.5} />
  <Crowd at={4} y={1640} n={27} rows={3} s={1.1} />
  <Title at={10} y={300} size={76}>UNA CIUDAD <span style={{color: C.yellow}}>SOLA</span></Title>
  <Sfx at={10} name="01_pop_texto" vol={0.4} />
</>);

/* 5 · Dios la defenderá */
const S5 = ({s0}) => (<>
  <Bg kind="parchment" />
  <InkText at={4} y={560} size={84}>En aquel día Jehová</InkText>
  <InkText at={34} y={680} size={84}>defenderá al morador</InkText>
  <InkText at={64} y={800} size={84}>de Jerusalén</InkText>
  <InkText at={86} y={960} size={58} italic color="#8E1B1B">Zacarías 12:8</InkText>
</>);

/* 6 · lo inesperado */
const S6 = ({dur}) => (<>
  <Bg kind="sepia" /><AbsoluteFill style={{background: 'rgba(0,0,0,.6)'}} />
  <TensionPulse o={0.8} bpm={110} />
  <Title at={8} y={900} size={110} color={CREAM}>…</Title>
  <Sfx at={2} name="36_tension_creciente" vol={0.45} />
</>);

/* 7 · Él llega · monte de los Olivos · el pueblo lo mira */
const S7 = ({dur, s0}) => { const L = (id) => b(id) - s0; const f = useCurrentFrame();
  const look = doubleTakeAt(f, L('z14'), 1) * 0.15;
  const XS = [150, 330, 540, 750, 930];
  return (<Earthquake at={L('z11') + 6} dur={36} amp={18}><Camera dur={dur} zoom={[1, 1.1]} shakes={[L('z10')]}>
    <Photo src="fondos/nuevo_testamento/monte_olivos.jpg" dur={dur} dim={0.2} />
    <HeavenRays at={L('z10')} x={540} y={-120} o={0.6} snd={null} />
    <Aura at={L('z10') + 4} x={540} y={640} r={230} snd={null} />
    <Pop at={L('z10') + 4}><Figure x={540} y={720} s={1.5} pose="open" seed={5} {...JESUS} /></Pop>
    {XS.map((x, i) => <Pop key={i} at={L('z13') + i * 4}><Figure x={x} y={1560} s={1.25} seed={10 + i} look={look} pose="idle" {...PUEBLO[i]} /></Pop>)}
    {XS.map((x, i) => <Emote key={i} at={L('z14') + 4 + i * 3} x={x} y={1560 - 92 * 1.25 - 120} type="!" s={0.9} snd={i === 0 ? undefined : null} />)}
    <Source at={L('z12')} text="Zacarías 14:4" />
  </Camera>
    <Sfx at={L('z10')} name="07_impacto" vol={0.5} /><Sfx at={L('z10') + 2} name="26_coro" vol={0.35} />
    {XS.map((_, i) => <Sfx key={i} at={L('z13') + i * 4} name={`p_pop${(i % 3) + 1}`} vol={0.22} />)}
  </Earthquake>); };

/* 8 · a quien traspasaron */
const S8 = () => (<>
  <Bg kind="parchment" />
  <InkText at={4} y={640} size={92}>Mirarán a mí,</InkText>
  <InkText at={30} y={770} size={92}>a quien traspasaron</InkText>
  <InkText at={66} y={920} size={58} italic color="#8E1B1B">Zacarías 12:10</InkText>
</>);

/* 9 · el que habían rechazado */
const S9 = ({dur}) => (<>
  <Photo src="fondos/nuevo_testamento/golgota_tres_cruces.jpg" dur={dur} dim={0.35} />
  <Crucified x={540} y={860} s={1.7}><Figure x={540} y={860} s={1.7} pose="cross" bob={false} seed={5} {...JESUS_CRUZ} /></Crucified>
  <Dream />
  <Sfx at={2} name="35_drone_grave" vol={0.4} />
</>);

/* 10 · lloran · arrepentimiento */
const S10 = ({dur, s0}) => { const L = (id) => b(id) - s0; const XS = [170, 355, 540, 725, 910], S = 1.35;
  return (<Camera dur={dur} zoom={[1, 1.06]}>
    <Bg kind="sepia" />
    {XS.map((x, i) => <Kneel key={i} at={6 + i * 4} x={x} y={1500} s={S} color={PUEBLO[i].dress.c1} snd={i === 0 ? '52_madera' : null}>
      <Figure x={x} y={1500 - 150 * S} s={S} pose={i % 2 ? 'pray' : 'facepalm'} bob={false} seed={20 + i} {...PUEBLO[i]} /></Kneel>)}
    {XS.map((x, i) => <Emote key={i} at={18 + i * 5} x={x} y={1500 - 150 * S - 92 * S + 70 - 110} type="tear" s={0.9} snd={i === 0 ? undefined : null} />)}
    <MoodTint at={4} mood="sad" o={0.35} />
    <TextSwap at={L('z18') + 4} y={520} from="MIEDO" to="ARREPENTIMIENTO" size={86} color={C.yellow} />
    <Sfx at={8} name="75_suspiro" vol={0.35} />
  </Camera>); };

/* 11 · manantial */
const S11 = ({dur}) => (<Camera dur={dur} zoom={[1, 1.08]}>
  <Bg kind="sepia" /><HolyGlow o={0.65} />
  <Spring at={6} x={540} y={1180} />
  <Title at={14} y={420} size={74}>UN <span style={{color: '#7FD3F0'}}>MANANTIAL</span> QUE LIMPIA</Title>
  <Source at={20} text="Zacarías 13:1" />
  <Sfx at={6} name="56_agua_corre" vol={0.4} /><Sfx at={14} name="31_glitter" vol={0.35} /><Sfx at={14} name="01_pop_texto" vol={0.35} />
</Camera>);

/* 12 · Pablo */
const S12 = ({dur, s0}) => { const L = (id) => b(id) - s0; const f = useCurrentFrame(); const v = f >= L('z21');
  return (<Camera dur={dur} zoom={[1, 1.06]}>
    <Bg kind="warm" />
    <Pop at={2}><Figure x={540} y={v ? 1250 : 1040} s={v ? 1.6 : 2.3} seed={7} {...PABLO} greet={{at: 8}} /></Pop>
    {!v && <LowerThird at={6} y={1560} name="Pablo" role="Apóstol" years="c. 57 d.C." />}
    {v && <><InkText at={L('z21') + 2} y={420} size={92} color="#3A2614">Todo Israel</InkText>
      <InkText at={L('z21') + 22} y={540} size={92} color="#3A2614">será salvo</InkText>
      <InkText at={L('z21') + 44} y={680} size={56} italic color="#8E1B1B">Romanos 11:26</InkText></>}
    <Sfx at={2} name="p_presentacion" vol={0.4} />
  </Camera>); };

/* 13 · cierre */
const S13 = ({dur, s0}) => { const L = (id) => b(id) - s0;
  return (<Camera dur={dur} zoom={[1, 1.08]} shakes={[L('z23') + 4]}>
    <Bg kind="sepia" /><Floaters kind="dust" n={30} o={0.5} /><HolyGlow o={0.4} />
    <Star at={2} />
    <Title at={6} y={1200} size={76}>¿Dios se olvidó de los <span style={{color: C.yellow}}>judíos</span>?</Title>
    <Check at={L('z23') + 2} x={540} y={760} size={200} />
    <Title at={L('z23') + 8} y={1420} size={92}>EL PLAN <span style={{color: C.green}}>SIGUE EN PIE</span></Title>
    <Sfx at={2} name="29_burbuja" vol={0.35} /><Sfx at={6} name="01_pop_texto" vol={0.4} />
    <Sfx at={L('z23') + 2} name="10_ding" vol={0.45} /><Sfx at={L('z23') + 8} name="07_impacto" vol={0.4} />
  </Camera>); };

const COMP = [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13];
const WRAP = {smoke: SmokePuff, card: CardSlide, bubble: BubbleTravel, focus: FocusIn, page: PageFlip, glitch: GlitchCut,
  light: LightLeak, wipe: DiagonalWipe, iris: Iris};

const Video = () => (<AbsoluteFill style={{background: '#000'}}>
  {COMP.map((Comp, i) => { const s0 = sStart(i), dur = sEnd(i) - s0 + (i + 1 < COMP.length ? TR : 0); const T = SCENES[i][1] && WRAP[SCENES[i][1]];
    const inner = <Comp dur={dur} s0={s0} />;
    return <Sequence key={i} from={s0} durationInFrames={dur}>{T ? <T at={0} dur={12}>{inner}</T> : inner}</Sequence>; })}
  {Object.entries(TL).filter(([k]) => k !== '_total').map(([k, v]) => <Sequence key={k} from={v.start} durationInFrames={v.dur + 4}><Audio src={staticFile(v.file)} /></Sequence>)}
  <Audio src={staticFile('music/emotivo.wav')} volume={0.13} />
</AbsoluteFill>);

registerRoot(() => <Composition id="Zac" component={Video} durationInFrames={TL._total} fps={30} width={W} height={H} />);
