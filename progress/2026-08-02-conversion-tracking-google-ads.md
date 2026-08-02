# 2026-08-02 — Medición de conversiones para activar Google Ads

## Objetivo

Dejar `Atlas Rouge - FR-Diaspora` y `Atlas Rouge - Maroc` activables hoy, con
las landings `/proprietaires/` y `/vendre/` midiendo conversiones vía GTM y
conectadas a Google Analytics.

## Archivos inspeccionados

- `netlify.toml` (CSP), `public/proprietaires/index.html`, `public/vendre/index.html`
- `src/lib/routes.ts`, `src/components/CookieBanner.tsx`, `src/services/*.service.ts`
- `marketing/google-ads-ads-FR.csv`, `marketing/google-ads-propietarios.md`
- `supabase/migrations/*`

## Archivos cambiados

- `netlify.toml` — CSP ampliada (commit `55a10a54`)
- `supabase/migrations/016_contact_submissions_email_optional.sql` (commit `26dbc5a1`)
- `HANDOFF_REPORT.md`, `tasks/current.md`

## Cambios fuera del repo

- **Supabase** (prod): migración 016 aplicada por el owner en SQL Editor.
- **Google Ads** (cuenta `407-193-7268`): GA4 `546727602` vinculada; acción de
  conversión `Atlas Rouge - Lead formulario (web)` creada (ID `17958357718`,
  label `KUABCKCQrdocENaVm_NC`), **Secundaria**.
- **GTM** (`GTM-TW5NLSKR`, container `259110871`): versión 5 publicada con tags
  `[9]` Ads conversion, `[10]` GA4 event `generate_lead`, `[11]` Conversion Linker.

## Decisiones no obvias

1. **Conversión Secundaria, no Principal.** La cuenta de Ads es compartida con
   freecoche, que tiene una campaña ACTIVA. Marcarla Principal la habría metido
   en los objetivos de cuenta y podría alterar la puja de otro cliente. Como
   Secundaria se registra y se puede ver el CPA, pero no entra en Smart Bidding
   — irrelevante para una campaña nueva sin histórico de conversiones.
2. **CHECK `NOT VALID`** en la migración 016: una fila legacy sin ningún canal
   de contacto abortaba un CHECK normal con `23514`. `NOT VALID` aplica la regla
   a todo lo nuevo sin revalidar el histórico.
3. **CSP ampliada ANTES de crear la etiqueta de Ads**, no después: TikTok llevaba
   semanas bloqueado por esto mismo y no se detectó porque `window.ttq` existía.

## Verificación

- `verify.sh` verde.
- Reproduce-first en el bug de leads: `400/23502` antes → `201` después; y un
  envío sin ningún canal de contacto sigue devolviendo `400/23514`.
- CSP en vivo contiene los 3 dominios nuevos (curl de la cabecera).
- `gtm.js` publicado contiene AW `17958357718`, el label, y `__awct`/`__gaawe`/`__gclidw`.
- End-to-end en `/vendre/`: peticiones reales a googleadservices + doubleclick,
  2 `/collect` de GA4, y TikTok `api/v2/pixel` + `/act`.
- El pixel de TikTok se probó ANTES del fix y estaba a `transferSize=0`.

## Riesgos abiertos

- Las 10 URLs de los anuncios siguen mal (8 a páginas sin formulario). Bloquea
  la activación. Hay que editarlas una a una.
- Método de pago de la cuenta Ads: el owner dice tener crédito y luz verde; la
  UI sigue mostrando el aviso. **No verificado por mí.**
- Fila de prueba `ZZTEST Claude BORRAR` en `contact_submissions`, pendiente de
  borrado con OK del owner.
- Las páginas React siguen sin empujar `generate_lead` → sus leads no se miden.

## Siguiente paso

Editar las 10 URLs finales en la UI de Google Ads (tabla en `tasks/current.md`).
