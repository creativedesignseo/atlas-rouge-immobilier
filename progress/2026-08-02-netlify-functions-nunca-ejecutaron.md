# 2026-08-02 — Las Netlify Functions nunca ejecutaron

## Cómo se encontró

El owner preguntó algo aparentemente simple: *"¿dónde llegan los leads de estas
campañas?"*. En vez de responder de memoria, se probó la función real:

```
POST https://atlasrouge.com/.netlify/functions/notify-lead  -> 502
```

Llamando directo a Netlify (saltando Cloudflare) apareció la causa:

```
ReferenceError: module is not defined in ES module scope
'/var/task/package.json' contains "type": "module"
```

## Diagnóstico

`package.json` declara `"type": "module"` **desde el commit inicial**
(`git log -S '"type": "module"'` → `cd29ec35`, initial commit). Las tres
funciones estaban escritas en CommonJS:

- `netlify/functions/notify-lead.js` → `exports.handler`
- `netlify/functions/report-error.js` → `exports.handler`
- `netlify/functions/translate-property.js` → `exports.handler`

Node las cargaba como ESM y reventaba antes de ejecutar una sola línea útil.
**Ninguna ha funcionado nunca.**

## Impacto real

Los leads sí llegaban a `contact_submissions` (el insert va directo a PostgREST
desde el navegador, no pasa por la función). Lo que nunca ocurrió es el **aviso
al agente**. Y falló en silencio: las landings llaman a `notify-lead` dentro de
un `try/catch` con `keepalive`, así que el usuario veía "gracias" igualmente.

Es la misma familia de fallo que el `email NOT NULL` de esta mañana: algo roto
en producción durante meses, invisible porque el error estaba tragado.

## Arreglo

Una línea por archivo: `exports.handler` → `export const handler`.
No hay `require()` ni `__dirname` en ninguna, así que no hizo falta nada más.
`node --check` pasa en las tres.

## Verificación

- Antes: 502 (Cloudflare) y 502 con traza de error (directo a Netlify).
- Después: **HTTP 200** por ambas vías.
- Respuesta: `{"ok":true,"channels":[{"skipped":"no RESEND_API_KEY"},
  {"skipped":"no TELEGRAM env"}]}`.

## Lo que el arreglo NO resuelve

La función ya corre, pero **no envía nada** porque no hay ninguna variable de
entorno de notificación configurada en Netlify. Eso es configuración, no
código, y requiere al owner. Opciones ya soportadas por el código sin tocar
nada: Resend (`RESEND_API_KEY`) o Telegram (`TELEGRAM_BOT_TOKEN` +
`TELEGRAM_CHAT_ID`).

**Aclaración:** el owner preguntó por qué aparecía Resend, sospechando que era
una propuesta comercial de esta sesión. No lo es: entró el 2026-05-20 en el
commit `75ef1ff6`. Verificado con `git log -S 'RESEND_API_KEY'`.

## Riesgo abierto

Hay leads reales sin trabajar (`status = 'new'`) desde abril y julio. Conviene
que alguien los revise en `/admin/contacts` — puede haber negocio perdido.
