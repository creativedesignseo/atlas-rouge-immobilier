# Cómo subir las 3 campañas a Google Ads SIN API (Google Ads Editor)

> Para montar las campañas sin tener acceso a la API. Herramienta: **Google Ads
> Editor**, app de escritorio gratuita (Mac/Windows). Entras con tu login normal
> de Google Ads (cuenta `freecoche`, 407-193-7268). Dos archivos de importación,
> ambos en esta carpeta: `google-ads-import-FR.csv` (keywords + negativas) y
> `google-ads-ads-FR.csv` (anuncios).

> **Actualizado 2026-07-06** — revisado en vivo contra el Editor: la campaña
> `Atlas Rouge - FR-France` ya existía con sus 5 grupos, keywords y negativas
> (venían de una importación previa de `google-ads-import-FR.csv`), pero tenía
> **0 anuncios** y solo 1 de las 3 campañas del plan. Ambos CSV se ampliaron
> para cubrir las 3 campañas de una sola pasada y los anuncios llevan ya las
> UTM en la URL final (antes no las tenían).

## Qué incluye cada CSV

**`google-ads-import-FR.csv`** — las 3 campañas completas (`Atlas Rouge -
FR-France`, `Atlas Rouge - FR-Diaspora`, `Atlas Rouge - Maroc`), cada una con
sus 5 grupos de anuncios (A-Vendre, B1-Gestion locative, B2-Gestion Airbnb,
C-Estimation, D-Agence), todas las keywords (frase + exacta) con su Max CPC, y
las **negativas a nivel de campaña**. Las 3 campañas llevan exactamente las
mismas keywords/negativas (así lo pide el plan — solo cambia geo y presupuesto,
ver §3).

> Nota de diseño: como el grupo **B2 capta vacacional/Airbnb**, las negativas
> NO incluyen `courte durée` ni `saisonnière` (chocarían con B2). Solo se
> negativiza `location vacances` (turista que busca alquilar, no propietario).

**`google-ads-ads-FR.csv`** — 1 Responsive Search Ad por grupo × 3 campañas (15
anuncios). Ya incluyen la URL final con UTM: `utm_source=google&utm_medium=cpc
&utm_campaign=<fr-france|fr-diaspora|maroc>&utm_content=<grupo>`.

**Ninguno de los dos CSV trae presupuesto, ubicaciones ni idioma** — eso Google
Ads Editor no lo acepta en este formato de importación simple; son ajustes de
campaña que se ponen una vez por campaña, a mano, en Editor (§3, ~1 minuto cada
una). Sin inventar atajos: es el único paso que de verdad requiere el editor.

## 1. Instalar y abrir

1. Descarga Google Ads Editor: https://ads.google.com/intl/es_es/home/tools/ads-editor/
2. Ábrelo → cuenta `freecoche` (ya vinculada) → **Obtener cambios recientes**.

## 2. Importar los 2 CSV

1. Menú **Account → Import → From file…**
2. Selecciona `google-ads-import-FR.csv` → confirma el mapeo de columnas
   (`Campaign`, `Ad Group`, `Keyword`, `Criterion Type`, `Max CPC`) → **Apply**.
   Esto crea `FR-Diaspora` y `Maroc` (nuevas) y no toca `FR-France` si ya
   coincide con lo que había.
3. Repite **Account → Import → From file…** con `google-ads-ads-FR.csv` →
   confirma el mapeo (`Campaign`, `Ad Group`, `Ad type`, `Headline 1-12`,
   `Description 1-4`, `Path 1`, `Path 2`, `Final URL`) → **Apply**.
4. **Revisa los cambios propuestos** (Editor los muestra en verde) antes de
   aplicar. Aún NO está publicado en Google: sigue local.

## 3. Ajustes de campaña (una vez por campaña, en Editor) — esto SÍ es manual

No hay forma de que un CSV simple de Editor fije esto; son ~4 campos por
campaña:

| Campaña | Ubicación (Presence, no "interested in") | Presupuesto/día | Idioma | Red de Display |
|---|---|---|---|---|
| `Atlas Rouge - FR-France` | Francia | 15 € | Français | Desmarcada |
| `Atlas Rouge - FR-Diaspora` | Bélgica, España, Italia, Países Bajos, Suiza | 9 € | Français | Desmarcada |
| `Atlas Rouge - Maroc` | Maroc | 6 € | Français | Desmarcada |

Estrategia de puja en las 3: **"Maximizar clics"** con CPC máx. limitado (los
Max CPC del CSV ya están puestos como tope por keyword).

## 4. Publicar

1. Botón **Post** (arriba a la derecha) → revisa el resumen → **Post**.
2. Esto SÍ sube todo a Google Ads. Las campañas quedan listas pero **NO las
   actives todavía** si aún no está el tracking de conversión (ver abajo).

## ⚠️ Antes de activar (gasto real): el tracking

Verificado (2026-06-05): **el sitio no tiene NINGÚN tracking** (ni GA4 ni
conversión de Google Ads). Sin eso, Google no puede optimizar y gastas a ciegas.
**Instala la conversión de Google Ads + GA4 y prueba un envío de lead real ANTES
de poner las campañas en "Activa".** Ver `google-ads-propietarios.md` §7.

---

*Archivos de importación: `google-ads-import-FR.csv` + `google-ads-ads-FR.csv`.
Estrategia completa: `google-ads-propietarios.md`.*
