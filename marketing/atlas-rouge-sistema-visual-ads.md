# Atlas Rouge — Sistema visual para creatividades publicitarias

Línea editorial de marca extraída de la pieza de referencia del owner
("Sécurité et sérénité pour votre famille", 2026-08-17). Toda creatividad de
Meta/Google Display debe salir de este sistema — no inventar estilo por anuncio.

## Paleta

| Rol | Valor | Uso |
|---|---|---|
| Fondo | Crema cálido `#F5F0EA` | Fondo dominante, plano |
| Acento | Terracota rojo-ocre `#C0492F` | Arcos, palabra destacada, URL, botón |
| Texto | Gris carbón azulado (casi negro) | Titular principal |

Inversión permitida: fondo terracota + tipografía crema (ver variante A2). Es la
única inversión válida — no crear otras.

## Retícula y elementos

1. **Fondo plano crema.** Nada de degradados ni texturas.
2. **Arcos circulares gruesos en terracota**, recortados por los bordes del
   lienzo. Dos por pieza: normalmente esquina superior derecha + inferior. Son
   anillos (rings), no círculos rellenos.
3. **Foto enmascarada en un círculo perfecto**, grande, apoyada en el lado
   derecho o centrada. La foto NUNCA va a sangre completa — siempre dentro del
   círculo. Esto es lo que hace reconocible la marca.
4. **Logotipo arriba a la izquierda**: capitales serif finas muy espaciadas
   "ATLAS ROUGE" con la línea de pico de montaña en rojo encima.
5. **Titular serif elegante**, 2-3 líneas, alineado a la izquierda. **La última
   línea va en terracota** — es la firma tipográfica del sistema.
6. **Pie abajo a la izquierda**: descriptor pequeño en carbón + `atlasrouge.com`
   en terracota.
7. **Mucho aire.** El espacio en blanco es el que comunica el lujo, no los
   adornos.

## Dirección fotográfica

**Arquitectura moderna de Marrakech**, no folclore. Tadelakt y yeso ocre,
geometría limpia, aperturas de suelo a techo, láminas de agua, olivos, luz
natural rasante. Fotografía arquitectónica editorial, no foto de portal
inmobiliario.

Evitar: zellige recargado, lámparas de latón caladas, bazar, cojines apilados,
saturación turística. El público objetivo (propietario diáspora en Francia) ya
conoce Marruecos — el cliché le resulta condescendiente.

## Prompt base para Higgsfield (nano_banana_pro)

> Editorial luxury real-estate brand advertisement, vertical 4:5. Design system:
> flat warm off-white cream background (#F5F0EA). Thick terracotta red-ochre
> (#C0492F) circular ring arcs cropped by the canvas edges, top-right and
> bottom-left. A large perfect circle masks an architectural photograph:
> **[ESCENA]**. Top-left: small elegant wordmark, thin letter-spaced serif
> capitals "ATLAS ROUGE" with a minimal red mountain-peak line above it. Left
> side, large elegant serif headline in dark charcoal-navy: "**[LINEA 1]**" /
> "**[LINEA 2]**" with the final line "**[LINEA 3]**" in terracotta red.
> Bottom-left small sans-serif: "**[DESCRIPTOR]**" in charcoal, "atlasrouge.com"
> in terracotta red. Generous negative space, refined, editorial. Perfect
> spelling of the French text. No watermark.

## Estado de producción (2026-08-17)

| # | Pieza | Formato | Estado |
|---|---|---|---|
| 4 | Story "Marrakech vous manque" | 9:16 | Generada |
| 1 | A1 vendre — interior villa moderna | 4:5 | Pendiente (límite diario Higgsfield) |
| 2 | B1 louer — villa + lámina de agua | 4:5 | Pendiente (límite diario) |
| 3 | A2 vendre — fondo terracota invertido | 4:5 | Pendiente (límite diario) |

## Aviso sobre las imágenes generadas

Son piezas **de marca**, conceptuales. Las escenas arquitectónicas son
ilustrativas y NO corresponden a inmuebles de la cartera. Prohibido presentarlas
como un bien concreto en venta o alquiler.

Comprobar siempre la ortografía francesa del texto renderizado antes de publicar
(acentos: année, à, sérénité). El modelo falla con diacríticos y un acento
ausente destruye la credibilidad ante un público francófono.
