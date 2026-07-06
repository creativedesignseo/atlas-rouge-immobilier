# 2026-07-06 — Google Ads: de borrador local a campañas en vivo

## Objetivo

El owner tenía una campaña de Google Ads sin terminar (creada en Google Ads
Editor, nunca publicada) y quería un flujo por archivo, sin depender de la UI
de Editor, para dejar las 3 campañas del plan (`google-ads-propietarios.md`)
completas y subidas.

## Files inspeccionados

- `marketing/google-ads-propietarios.md` (estrategia, ya existente)
- `marketing/google-ads-import-FR.csv`, `marketing/google-ads-ads-FR.csv`,
  `marketing/google-ads-como-importar.md` (flujo antiguo vía Editor)
- Google Ads Editor en vivo (computer-use + screenshots): cuenta `freecoche`
  (407-193-7268), campaña `Atlas Rouge - FR-France` con 5 grupos/34 keywords/
  22 negativas pero **0 anuncios** y nunca publicada.
- Plantillas reales de Google (`Bulk Actions → Uploads → Descargar
  plantillas`): `campaign_mcc_template.csv`, `ad_group_mcc_template.csv`,
  `keyword_mcc_template.csv`, `ad_group_negative_keyword_mcc_template.csv`,
  `responsive_search_ad_mcc_template.csv` — formato MCC oficial con columnas
  `Row Type`/`Action`/`Customer ID`, a diferencia del CSV simple de Editor
  (que no permite fijar presupuesto/ubicación/idioma de campaña).

## Files changed

1. `marketing/google-ads-import-FR.csv` + `marketing/google-ads-ads-FR.csv`:
   ampliados de 1 a 3 campañas (FR-France/FR-Diaspora/Maroc), UTMs añadidas a
   los anuncios. (Quedó como referencia del flujo vía Editor; el flujo real
   usado al final fue el de abajo.)
2. `marketing/google-ads-como-importar.md`: reescrito para el flujo de 2
   archivos + tabla de los 3 campos que Editor no puede llevar.
3. 5 plantillas MCC rellenas con las 3 campañas completas (presupuesto,
   ubicación, idioma, red, grupos, keywords, negativas, anuncios con UTM) —
   verificadas por columnas con `csv.reader` antes de entregarlas (2 errores
   de conteo de columnas detectados y corregidos con `python3 -c` antes de que
   el owner las subiera).
4. A petición del owner, las 5 + la nueva de ajuste se movieron (`git mv`) a
   `marketing/google-ads-templates/` (carpeta que él mismo creó), quitando
   duplicados sueltos en `marketing/`.
5. `keyword_remove_low_volume_mcc_template.csv` (nuevo): 18 filas
   (`Action: Remove`) para 6 keywords marcadas "Entidad no apta - Volumen de
   búsquedas bajo" en `A - Vendre`, replicado en las 3 campañas.

## Commands run

- `bash scripts/verify.sh` (verde en cada cierre)
- `python3 -c "import csv..."` para verificar recuento de columnas de cada
  CSV MCC antes de que el owner los subiera (2 archivos tenían 1 columna de
  menos cada uno — corregido antes de la subida real)
- `curl -s -o /dev/null -w "%{http_code}" https://atlasrouge.com` (200 en
  cada cierre)
- `git mv` para preservar historia al mover a `google-ads-templates/`

## Verificación real (no solo build)

El owner subió las 5 plantillas en la cuenta real (`Google Ads →
Herramientas → Acciones masivas → Cargas`) y compartió capturas de pantalla
de cada resultado: **"Ha finalizado correctamente"** con 3, 15, 102, 66 y 15
cambios respectivamente. Confirmado en pantalla que las 3 campañas existen
con su presupuesto correcto (15€/9€/6€) y estado "Pendiente — anuncios en
revisión".

## Decisiones no obvias

- **Por qué 5 archivos y no 1:** Google separa las plantillas por tipo de
  entidad; el enlace entre ellas es por coincidencia exacta de texto en las
  columnas `Campaign`/`Ad group`, no por estar en el mismo archivo — se
  explicó esto al owner con la analogía de carpetas/subcarpetas.
- **Por qué no se buscaron keywords nuevas para reemplazar las de bajo
  volumen:** las 6 marcadas son variantes de concordancia exacta/frase muy
  específica de keywords de frase ya activas en el mismo grupo — son
  redundantes, no hace falta keyword research nuevo, solo borrarlas. Se dejó
  documentado que Semrush no está disponible con el plan actual y que el
  Planificador de palabras clave de Google Ads es la fuente a usar en el
  futuro para no repetir el error de cargar keywords sin volumen verificado.

## Riesgos abiertos

- No confirmado que `keyword_remove_low_volume_mcc_template.csv` se haya
  subido.
- Bloqueante de facturación (banner "nuevo método de pago") sin resolver.
- Tracking de conversión sin re-verificar en código esta sesión.
- Ninguna campaña debe activarse hasta cerrar los 2 puntos anteriores.

## Próximo paso

Confirmar la subida del archivo de ajuste, resolver el método de pago, y
re-verificar en código si GA4/conversión de Ads ya existen antes de activar.
