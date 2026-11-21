# ANIMACION-

Shorts animados (1080×1920, 30 fps) de historia cristiana, de Génesis a hoy, con figuras blancas sin cara. Se hacen con Remotion, voz Kokoro (borrador) y ElevenLabs (final). Este repo existe para que Claude retome el trabajo leyendo el grafo (Graphify) en vez de releer chats enteros.

## Estructura

- `skill/SKILL.md`: la skill `shorts-figuras-blancas` completa (flujo, estilo, reglas, componentes, recetas de personajes).
- `skill/SETUP.md`: cómo instalar el entorno en una máquina nueva.
- `skill/codigo/`:
  - `lib.jsx`: librería de componentes, personajes, ropa, transiciones, ambientes y escenas bíblicas.
  - `sfx_lib.py` y `qf_audio.py`: efectos y música sintetizados.
  - `vo_beats.py`: voz por beat y línea de tiempo.
  - `fit_assets.py` y `fit_acc.py`: encaje de tocados y accesorios en foto.
  - `split_sheets.py` y `clean_white.py`: recorte de las hojas 3×3 de Gemini.
  - `catalogo_anim.py`: catálogo de animaciones.
- `catalogo/INDICE.md`: una línea por recurso (fondos, objetos, tocados, accesorios), la lista de componentes y la lista de animaciones.
- `catalogo/catalogo.json`: ficha de cada pieza (tipo, categoría, ruta, usos).
- `videos/video-NN-tema/`: cada video con su `.jsx`, `beats.json` y línea de tiempo.

## Dónde están los archivos pesados (no van en el repo)

- Kit principal (artifact `2bbe2452-aa04-4a44-9a2f-1027cf5de8cf`): https://claude.ai/artifact/6QHnKUQGhyQ6g8fabpcgia
  - Tiene animaciones, sonidos, tocados, accesorios y objetos.
  - Límite de 512 archivos (hoy tiene ~400).
- Kit de fondos (artifact `53039076-bf08-4c01-80cb-b6698a7a0c50`): https://claude.ai/artifact/BFZ5ASfeszN4SchbtxGsvX
  - 127 fondos de 1080×1920.
- Planilla de faltantes (Sheets `6430d70f-8dde-4674-b61f-45821a5c3d3c`, nodo `b8641322-f6f1`): https://claude.ai/artifact/DNaMi11mVo1HaygnGwEYZR
  - Hojas: Resumen, Prompts Gemini (200 prompts), Faltantes (502) y Personajes (506).

## Reparto de tareas

- Ernesto genera en Gemini los fondos (de a uno, vertical 9:16) y las hojas 3×3 sobre gris #D9D9D9. También consigue la música y los efectos (YouTube Audio Library).
- Claude hace todo lo que es código.

## Estado actual (noviembre 2026)

- **Prompts de Gemini 1–100:** procesados y publicados; la planilla está al día. Faltan generar y procesar los prompts 101–200.
- **Pendientes de lo ya recibido:**
  - Ajustar a la figura los 18 tocados y los 19 accesorios nuevos (hoy están como "sin ajustar").
  - Gorro de Zuinglio: viene con pelo, hay que pedirlo de nuevo.
  - Tumba de Lázaro cerrada (opcional).
- **Video 01 (Zacarías: "¿Tiene Dios un plan para salvar a los judíos?"):** v1 de 52 s entregada.
  - A Ernesto le gustó la estética.
  - Los **efectos de sonido sintetizados son malos**: hay que reemplazarlos por efectos grabados reales (YouTube Audio Library u otra fuente CC0) en todo el kit.
  - La v2 debe citar los versículos (Zac 12:3, 14:4, 13:1).
  - Voz final con ElevenLabs cuando esté aprobado.
  - Al aprobarse, guardar en el kit la estrella de David y el manantial.
- **Pendiente general:** integrar la música de YouTube (16–18 temas) y los efectos grabados.

## Reglas del canal

- **Versículos:** cuando se menciona un versículo, se cita, con el texto en pantalla (pergamino con `InkText`) y leído por la voz. No alcanza con la referencia.
- **Fondos:**
  - sepia: por defecto, para explicar;
  - pergamino: versículos;
  - mapa: geografía;
  - espacio: recursos modernos y personajes contemporáneos;
  - cálido: ubicar la historia y presentar personajes.
  - No se usan el azul ni el pizarrón.
- **Presentar un personaje:** sin objetos en la mano, saludando, con `LowerThird`.
- **Personajes históricos:** tienen que ser representativos.
- **Dios:** nunca se muestra como figura humana.
- **Temas doctrinales:** presentar cada postura con justicia.
- **Recursos nuevos:** se guardan en el kit solo cuando el video se aprueba como final.
- **Transiciones:** cortas (8–14 frames), sin repetir la misma dos veces seguidas.
