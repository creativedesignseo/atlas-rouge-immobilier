# Guiones de vídeo — Atlas Rouge

> Archivo consultable y editable de **todos** los guiones/textos usados en los
> vídeos del proyecto (carpeta `brand/Agente/remotion/`). Es la fuente de
> verdad del TEXTO; los tiempos exactos en frames/segundos viven en el código
> (`src/captions.ts`, `src/theme.ts`, o inline en cada `src/Video*.tsx`).
>
> **Cómo editarlo:** cambia el texto aquí primero, luego refleja el cambio en
> el archivo de código correspondiente (columna "Fuente en código" de cada
> tabla) y vuelve a renderizar. Este archivo no se lee automáticamente por el
> render — es documentación para humanos/IA, no código.
>
> **Convención de estado:**
> - ✅ Confirmado por el owner / transcrito de audio real (Whisper)
> - 📝 Reconstruido (el audio de la IA salía distorsionado; se sustituyó por
>   voz TTS sobre este texto corregido)
> - 🎙️ Solo audio — no hay texto en pantalla, y el guion hablado no está
>   transcrito en ningún archivo (pendiente si se necesita)

---

## Índice

1. [Vídeo Conciergerie (FR, vertical)](#1-vídeo-conciergerie-fr-vertical)
2. [Vídeo 1 — Conciergerie/Airbnb (EN, con foto de referencia)](#2-vídeo-1--conciergerieairbnb-en-con-foto-de-referencia)
3. [Vídeo 2 — Kinetic typography FR](#3-vídeo-2--kinetic-typography-fr)
4. [Vídeo 2 — Kinetic typography ES](#4-vídeo-2--kinetic-typography-es)
5. [Vídeo 2 Premium V2 — Kinetic motion-graphics ES](#5-vídeo-2-premium-v2--kinetic-motion-graphics-es)
6. [Vídeo Riad Médina — Kinetic GSAP (FR)](#6-vídeo-riad-médina--kinetic-gsap-fr)
7. [Vídeo Marca/Servicios 3D (FR)](#7-vídeo-marcaservicios-3d-fr)
8. [Vídeo Kinetic Montage (FR)](#8-vídeo-kinetic-montage-fr)
9. [Vídeo 3 — Vendre, testimonial (FR)](#9-vídeo-3--vendre-testimonial-fr)
10. [Vídeo Kinetic Conciergerie (FR)](#10-vídeo-kinetic-conciergerie-fr)
11. [Vídeos sin guion en texto (solo audio)](#11-vídeos-sin-guion-en-texto-solo-audio)
12. [Outro compartido](#12-outro-compartido)

---

## 1. Vídeo Conciergerie (FR, vertical)

**Composición:** `AtlasRougeConciergerie` · **Fuente en código:** `src/captions.ts` (`CAPTIONS_C1/C2/C3`) + `src/ConciergerieVideo.tsx`

| Clip | Texto (FR) | Tiempo | Keyword en pantalla | Estado |
|---|---|---|---|---|
| C1 | Marrakech vous manque, mais votre appartement vous inquiète ? | 0.0–3.0s | MARRAKECH | ✅ |
| C1 | Réservations, arrivées, ménage… tout ça, à distance ? | 3.0–8.0s | À DISTANCE | ✅ |
| C2 | Notre conciergerie s'occupe de tout, jour et nuit. | 0.0–2.5s | CONCIERGERIE | ✅ |
| C2 | Vous ne gérez rien. Vous recevez vos revenus, chaque mois. | 2.5–5.2s | VOS REVENUS | ✅ |
| C2 | Une équipe locale à Marrakech, disponible en permanence. | 5.2–8.0s | ÉQUIPE LOCALE | ✅ |
| C3 | Confiez votre bien, profitez de Marrakech. | 0.0–6.0s | MARRAKECH | ✅ |

---

## 2. Vídeo 1 — Conciergerie/Airbnb (EN, con foto de referencia)

**Composición:** `AtlasRougeVideo1` · **Fuente en código:** `src/captions.ts` (`CAPTIONS_V1_1` a `V1_5`)

| Plano | Texto (EN) | Tiempo | Estado |
|---|---|---|---|
| 1 | You miss Marrakech, but your apartment worries you? | 0.0–4.0s | ✅ |
| 2 | Reservations, arrivals, cleaning... all that, from a distance? | 0.0–5.0s | ✅ |
| 3 | Our concierge takes care of everything, day and night. | 0.0–3.5s | ✅ |
| 4 | You manage nothing. | 0.0–2.0s | ✅ |
| 4 | You receive your income, every month. | 3.0–6.0s | ✅ |
| 5 | A local team in Marrakech, always available. | 2.0–5.0s | ✅ |

---

## 3. Vídeo 2 — Kinetic typography FR

**Composición:** `AtlasRougeVideo2Kinetic` · **Fuente en código:** `src/Video2Kinetic.tsx` (paneles) + `src/captions.ts` (`CAPTIONS_V2_WOMAN_1/2`)

> 📝 Audio original de la IA distorsionado → voz TTS (ElevenLabs vía
> Higgsfield) narra este guion corregido; el audio de la modelo se silencia.

| Escena | Texto en pantalla | Estado |
|---|---|---|
| Hook (modelo) | Tu as une propriété à Marrakech, mais la gestion des invités et réservations prend tout ton temps ? | 📝 |
| Panel 1 | **Gestion touristique** / Atlas Rouge | 📝 |
| Panel 2 | **Multipliez vos revenus** / Airbnb · Booking | 📝 |
| Panel 3 | **Du début** / à la fin | 📝 |
| Modelo (2º tramo) | Ménage premium constant. | 📝 |
| Panel 4 | **Tarifs optimisés** / Disponible 24h/24 | 📝 |

---

## 4. Vídeo 2 — Kinetic typography ES

**Composición:** `AtlasRougeVideo2KineticES` · **Fuente en código:** `src/Video2KineticES.tsx` + `src/captions.ts` (`CAPTIONS_V2_WOMAN_1_ES/2_ES`)

| Escena | Texto en pantalla | Estado |
|---|---|---|
| Hook (modelo) | ¿Tienes una propiedad en Marrakech, pero la gestión de huéspedes y reservas te quita todo tu tiempo? | 📝 |
| Panel 1 | **Gestión turística** / Atlas Rouge | 📝 |
| Panel 2 | **Multiplica tus ingresos** / Airbnb · Booking | 📝 |
| Panel 3 | **De principio** / a fin | 📝 |
| Modelo (2º tramo) | Limpieza premium constante. | 📝 |
| Panel 4 | **Tarifas optimizadas** / Disponible 24h/24 | 📝 |

---

## 5. Vídeo 2 Premium V2 — Kinetic motion-graphics ES

**Composición:** `AtlasRougeVideo2PremiumV2` · **Fuente en código:** `src/Video2PremiumV2.tsx`

> Sin vídeo de la modelo — todo tipografía animada + iconografía vectorial,
> voz TTS ES masterizada. Duración de cada escena = duración exacta del audio.

| Escena | Texto en pantalla | Estado |
|---|---|---|
| 1 | CON LA GESTIÓN / **TURÍSTICA** | 📝 |
| 2 | **MULTIPLICAMOS** / TUS INGRESOS | 📝 |
| 3 | ENCARGÁNDONOS / DE TODO / **PRINCIPIO** / **A FIN** | 📝 |
| 4 | OPTIMIZACIÓN / **TARIFAS DIARIAS** / ATENCIÓN / **HUÉSPEDES** | 📝 |

---

## 6. Vídeo Riad Médina — Kinetic GSAP (FR)

**Composición:** `AtlasRougeVideoKineticGsap` · **Fuente en código:** `src/VideoKineticGsap.tsx`

> ✅ Guion basado en la ficha real del riad publicada en atlasrouge.com (datos
> verificables, no inventados). Voz real ElevenLabs ("Adina", francés).

| Línea | Texto | Tiempo |
|---|---|---|
| 1 | L'âme de **Marrakech** à vendre. | 0.0–2.3s |
| 2 | **2000 M²** | 2.42–4.52s |
| 3 | 6 chambres | 4.58–5.9s |
| 4 | Piscine privée | 6.0–7.3s |
| 5 | Sécurité 24/7 | 7.4–9.8s |
| 6 | **300 000 €** | 9.86–11.4s |
| 7 | Médina, Marrakech | 11.56–13.2s |
| 8 | Découvrez-le sur | 13.3–14.32s |

---

## 7. Vídeo Marca/Servicios 3D (FR)

**Composición:** `AtlasRougeVideoKinetic3D` · **Fuente en código:** `src/VideoKinetic3D.tsx`

> Guion de posicionamiento/servicios. Voz real ElevenLabs ("Liam", enérgica).

| Línea | Texto | Tiempo |
|---|---|---|
| 1 | Un projet **Immobilier** à Marrakech ? | 0.0–2.08s |
| 2 | Nous nous occupons **de tout.** | 2.08–3.9s |
| 3 | **Acheter** · **Vendre** · **Louer** · **Estimer** · **Gérer** | 3.92–8.02s |
| 4 | Accompagnement complet | 8.02–9.3s |
| 5 | De la visite à la signature | 9.3–11.2s |
| 6 | Des conseillers | 11.2–11.84s |
| 7 | Qui connaissent Marrakech | 11.84–13.12s |
| 8 | Quartier par quartier | 13.12–14.76s |
| 9 | **Estimation** **Gratuite** | 14.76–15.72s |

---

## 8. Vídeo Kinetic Montage (FR)

**Composición:** `AtlasRougeKineticMontage` · **Fuente en código:** `src/VideoKineticMontage.tsx`

> Montaje de clips con label + kicker por escena (sin voz propia registrada
> en el archivo — revisar `KineticConciergerie`/`voiceover` si aplica).

| Escena | Label | Kicker |
|---|---|---|
| 1 | UN PROJET IMMOBILIER | Marrakech |
| 2 | À MARRAKECH | Une expertise locale |
| 3 | NOUS NOUS OCCUPONS DE TOUT. | Votre projet, notre priorité |
| 4 | ACHETER · VENDRE | Louer |
| 5 | ESTIMER · GÉRER | — |
| 6 | ACCOMPAGNEMENT COMPLET | — |
| 7 | DE LA VISITE À LA SIGNATURE | Un seul interlocuteur |
| 8 | DES CONSEILLERS | Une expertise de terrain |
| 9 | QUI CONNAISSENT MARRAKECH | L'immobilier autrement |
| 10 | QUARTIER PAR QUARTIER | Proche de vous, proche du marché |

---

## 9. Vídeo 3 — Vendre, testimonial (FR)

**Composición:** `AtlasRougeVideo3Vendre` · **Fuente en código:** `src/captions.ts` (`CAPTIONS_VENDRE`)

> ✅ Transcrito con Whisper (modelo small, fr) sobre el clip real
> `Woman_speaking_French_about_selling_202607292121.mp4`. Corregido:
> Whisper transcribió "l'acquérure" → debía ser **"l'acquéreur"**.

| Línea | Texto | Tiempo | Keyword |
|---|---|---|---|
| 1 | Vendre à Marrakech ne devrait pas être un casse-tête. | 0.0–1.84s | VENDRE |
| 2 | Estimation gratuite, diffusion à notre réseau. | 1.98–4.1s | ESTIMATION GRATUITE |
| 3 | Nous nous occupons de tout, de la visite aux notaires, | 4.2–5.96s | — |
| 4 | les honoraires à la charge de l'acquéreur. | 6.14–8.18s | 0% À VOTRE CHARGE |
| 5 | Vendez en toute sérénité. | 8.46–9.64s | SÉRÉNITÉ |

---

## 10. Vídeo Kinetic Conciergerie (FR)

**Composición:** `KineticConciergerie` · **Fuente en código:** `src/KineticConciergerie.tsx`

> Paneles de texto sincronizados a una voz real (`kinetic-conciergerie/voiceover.mp3`, no transcrita aparte — el texto de los paneles ES el guion).

| Línea | Texto | Tiempo |
|---|---|---|
| 1 | VOUS VIVEZ EN EUROPE | 0.0–1.8s |
| 2 | **BIEN À MARRAKECH** | 1.8–3.0s |
| 3 | LOCATAIRES | 3.0–3.7s |
| 4 | **MÉNAGE** | 3.7–4.35s |
| 5 | URGENCES | 4.35–5.05s |
| 6 | **À DISTANCE** | 5.15–6.3s |
| 7 | TOUT DEVIENT VITE COMPLIQUÉ | 6.3–8.15s |
| 8 | **ATLAS ROUGE** | 8.25–9.0s |
| 9 | PREND LE RELAIS | 9.0–10.05s |

---

## 11. Vídeos sin guion en texto (solo audio)

Estas composiciones usan un clip real + una pista de voz ya grabada/masterizada
(`voice-mastered.mp3` o `voiceover.mp3`), **sin subtítulos ni texto en
pantalla**. El guion hablado no está transcrito en ningún archivo del
proyecto — si se necesita el texto exacto (para reutilizarlo, traducirlo o
crear subtítulos), hay que transcribirlo con Whisper como se hizo con el
Vídeo 3 (sección 9).

| Composición | Fuente en código | Audio | Estado |
|---|---|---|---|
| `InmobiliariaVendeEdit` | `src/InmobiliariaVendeEdit.tsx` | `inmobiliaria-vende/voice-mastered.mp3` | 🎙️ sin transcribir |
| `InmobiliariaVendeWomanEdit` | `src/InmobiliariaVendeWomanEdit.tsx` | `inmobiliaria-vende-woman/voice-mastered.mp3` | 🎙️ sin transcribir |
| `VideoCon` | `src/VideoCon.tsx` | `video-con/voiceover.mp3` | 🎙️ sin transcribir |

---

## 12. Outro compartido

**Fuente en código:** `src/components/Outro.tsx` — usado en la mayoría de vídeos verticales (Conciergerie, Vídeo 1, Vídeo 2, Vídeo 3 Vendre).

> Logo Atlas Rouge + divisor terracota + tagline en cursiva + URL.

- **Tagline:** *"Confiez votre bien, profitez de Marrakech."*
- **URL:** ATLASROUGE.COM

Algunas composiciones más recientes (`InmobiliariaVendeEdit`,
`InmobiliariaVendeWomanEdit`) usan un outro propio inline (mismo logo/tagline/
URL, pero definido dentro del propio archivo del vídeo en vez del componente
compartido) — si se quiere unificar, hay que migrarlas a `Outro.tsx`.

---

## Cómo añadir un guion nuevo

1. Escribe el texto aquí primero (nueva sección, mismo formato de tabla).
2. Si el vídeo tiene un clip real con voz hablada: transcribe con Whisper
   (`whisper archivo.mp4 --language French --model small --word_timestamps True`)
   para tiempos exactos, y corrige solo errores obvios de transcripción —
   nunca inventes texto que no se oye en el audio.
3. Refleja el texto/tiempos en el archivo de código correspondiente
   (`captions.ts` para clips con `ConciergerieScene`, o inline en el propio
   `src/VideoX.tsx` para paneles kinetic/`KineticPanel`).
4. Marca el estado (✅ / 📝 / 🎙️) y actualiza el índice si es una sección nueva.
