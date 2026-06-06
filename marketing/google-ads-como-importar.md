# Cómo subir la campaña a Google Ads SIN API (Google Ads Editor)

> Para montar la campaña sin tener acceso a la API. Herramienta: **Google Ads
> Editor**, app de escritorio gratuita (Mac/Windows). Entras con tu login normal
> de Google Ads. Archivo de importación: `google-ads-import-FR.csv` (esta carpeta).

## Qué incluye el CSV

La campaña **`Atlas Rouge - FR-France`** completa: 5 grupos de anuncios
(A-Vendre, B1-Gestion locative, B2-Gestion Airbnb, C-Estimation, D-Agence), todas
las keywords (frase + exacta) con su Max CPC, y las **negativas a nivel de
campaña**.

> Nota de diseño: como el grupo **B2 capta vacacional/Airbnb**, las negativas
> NO incluyen `courte durée` ni `saisonnière` (chocarían con B2). Solo se
> negativiza `location vacances` (turista que busca alquilar, no propietario).

El CSV **no** trae presupuesto, ubicaciones ni idioma: eso son ajustes de campaña
que pones una vez en Editor (2 minutos, pasos abajo). Tampoco trae los anuncios
(los pegas a mano — ver §4).

## 1. Instalar y abrir

1. Descarga Google Ads Editor: https://ads.google.com/intl/es_es/home/tools/ads-editor/
2. Ábrelo → **Add account** → inicia sesión con tu cuenta de Google Ads → descarga la cuenta.

## 2. Importar el CSV

1. Menú **Account → Import → From file…**
2. Selecciona `google-ads-import-FR.csv`.
3. En la pantalla de mapeo, confirma que las columnas se reconocen:
   `Campaign`, `Ad Group`, `Keyword`, `Criterion Type`, `Max CPC`.
4. **Revisa los cambios propuestos** (Editor los muestra en verde antes de aplicar)
   → **Process / Apply**. Aún NO está publicado en Google: sigue local.

## 3. Ajustes de campaña (una vez, en Editor)

Selecciona la campaña `Atlas Rouge - FR-France` y completa:
- **Tipo:** Search (Búsqueda). Desmarca la **Red de Display**.
- **Presupuesto diario:** p. ej. 15 €/día.
- **Ubicaciones:** France. Opción "Presence: people regularly in this location"
  (no "interested in").
- **Idioma:** Français.
- **Estrategia de puja:** "Maximizar clics" con CPC máx. limitado (los Max CPC del
  CSV ya están puestos como tope por keyword).

## 4. Anuncios (pegar a mano — 5 min)

Por cada grupo, crea un **Responsive Search Ad** (Editor: selecciona el grupo →
pestaña Ads → + → Responsive search ad) y pega:

**Títulos (pega varios; máx 15):**
```
Vendez Votre Bien à Marrakech
Estimation Gratuite en 24h
Agence Francophone à Marrakech
Confiez-nous Votre Appartement
Vente & Gestion Locative
Gestion Airbnb Clé en Main
Experts Immobilier Marrakech
Réseau d'Acheteurs Internationaux
Accompagnement de A à Z
Sans Engagement
Vous Possédez un Bien à Marrakech ?
Votre Bien, Notre Expertise
```
**Descripciones (máx 4):**
```
Vous possédez un bien à Marrakech ? Confiez sa vente ou sa location à notre agence francophone. Estimation gratuite, sans engagement.
Photos pro, diffusion internationale et accompagnement jusqu'à la signature. Demandez votre estimation gratuite dès aujourd'hui.
Gestion locative et conciergerie Airbnb clé en main. Nous gérons tout : locataires, ménage, encaissements. Vous percevez vos revenus.
Une équipe francophone à Marrakech qui s'occupe de tout. Vente, location longue durée ou saisonnière. Parlons de votre projet.
```
**Título fijado (pin posición 1) por grupo:**
- A → "Vendez Votre Bien à Marrakech" · B1 → "Gestion Locative à Marrakech"
- B2 → "Gestion Airbnb Clé en Main" · C → "Estimation Gratuite en 24h"
- D → "Agence Francophone à Marrakech"

**URL final por grupo** (la del idioma FR):
- A y D → `https://atlasrouge.com/fr/vendre`
- B1 y B2 → `https://atlasrouge.com/fr/gestion-locative`
- C → `https://atlasrouge.com/fr/estimation`

> Añade UTMs en la URL final: `?utm_source=google&utm_medium=cpc&utm_campaign=fr-france`

## 5. Duplicar para las otras 2 campañas francesas

No hace falta re-importar. En Editor:
1. Click derecho sobre `Atlas Rouge - FR-France` → **Copy** → **Paste**.
2. Renombra la copia a `Atlas Rouge - FR-Diaspora` y cambia SOLO:
   - Ubicaciones → Bélgica, España, Italia, Países Bajos, Suiza.
   - Presupuesto → p. ej. 9 €/día.
3. Repite para `Atlas Rouge - Maroc`: ubicación Maroc, presupuesto ~6 €/día.

Las keywords, negativas y anuncios viajan con la copia. Solo cambia geo + budget.

## 6. Publicar

1. Botón **Post** (arriba a la derecha) → revisa el resumen → **Post**.
2. Esto SÍ sube todo a Google Ads. Las campañas quedan listas pero **NO las
   actives todavía** si aún no está el tracking de conversión (ver abajo).

## ⚠️ Antes de activar (gasto real): el tracking

Verificado (2026-06-05): **el sitio no tiene NINGÚN tracking** (ni GA4 ni
conversión de Google Ads). Sin eso, Google no puede optimizar y gastas a ciegas.
**Instala la conversión de Google Ads + GA4 y prueba un envío de lead real ANTES
de poner las campañas en "Activa".** Ver `google-ads-propietarios.md` §7.

---

*Archivo de importación: `google-ads-import-FR.csv`. Estrategia completa:
`google-ads-propietarios.md`.*
