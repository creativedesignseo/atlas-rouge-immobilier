# 2026-08-02 — Landing /vendre/: menos texto, formulario de 3 campos, móvil

## Objetivo

El owner comparó con `https://www.semrush.com/lp/product-free-trial/`: la gente
aterriza y no lee. Quería menos texto, letra más grande y un formulario que
pidiera solo nombre, teléfono y e-mail. Después señaló que además no estaba
optimizada para móvil.

## Archivos cambiados

- `public/vendre/index.html` (3 commits: `2bfd4b88`, `c699efa8`, `249bfae6`)

## Qué se hizo

1. **Formulario**: de 2 pasos (3 preguntas + datos) a 1 paso con 3 campos.
2. **Intención sin preguntar**: `project` se lee de `?service=` en la URL. El
   anuncio ya sabe de dónde viene el visitante; no hay que preguntárselo.
3. **Texto**: fuera eyebrow y los 3 chips diminutos. Entra una sección de 3
   bloques en letra grande que responde "¿qué pasa después de enviar?".
4. **Móvil**: h1 y espaciado corregidos (ver abajo).

## Decisiones no obvias

- **Primera pasada cortó de más.** Se eliminaron servicios, FAQ y CTA final. El
  owner aclaró que lo que sobraba eran las micro-etiquetas, no el contenido.
  Se repuso contexto, pero como bloques grandes y legibles, no como chips.
- **`?service=` en vez de preguntar** conserva la segmentación comercial (el
  lead sigue llegando marcado "Décidé à vendre" vs "Estimation seule") con cero
  fricción para el visitante. Verificado con envíos reales.
- **El e-mail sigue opcional** a propósito: es lo que la migración 016 hizo
  almacenable, y el teléfono es el canal que importa en este negocio.

## Errores propios cazados durante el trabajo

1. **Regresión que yo introduje**: al quitar la barra de progreso, el handler de
   envío seguía haciendo `querySelector('.progress').style.display` → null →
   excepción justo antes de mostrar el mensaje de éxito. El formulario
   desaparecía sin confirmación. Detectado al probar un envío real, no leyendo
   el código.
2. **Breakpoint olvidado**: al agrandar la tipografía toqué la regla base y la
   de ≤600px, pero no la de ≤380px, que dejaba el h1 en 2.2rem (35.2px) en
   iPhone SE/mini y muchos Android. Detectado midiendo, no mirando.

## Verificación

- `verify.sh` verde.
- Envíos reales end-to-end: lead guardado en `contact_submissions` sin e-mail,
  `generate_lead` disparado, panel de éxito visible.
- Medido a 375×812: sin scroll horizontal, h1 43.2px, botón de enviar en y=782
  (30px por encima del pliegue), campos 52px y botones 61px de alto.
- Contra producción: reglas CSS nuevas presentes en el HTML servido, 0
  apariciones del subtítulo eliminado, formulario con exactamente 3 campos.

**Nota:** la herramienta de capturas devolvió fotogramas en blanco toda la
sesión. Todo lo visual se verificó con estilos calculados y posiciones del DOM.

## Riesgos abiertos

- `/proprietaires/` sigue con el formato antiguo → las dos landings de campaña
  no son coherentes entre sí.
- Las 10 URLs de los anuncios siguen apuntando al SPA (bloqueante de activación).
- 4 filas de prueba/basura en `contact_submissions`; el DELETE está bloqueado
  por el clasificador de seguridad pese a la autorización del owner.

## Siguiente paso

Aplicar el mismo rediseño a `/proprietaires/`, y después cambiar las 10 URLs.
