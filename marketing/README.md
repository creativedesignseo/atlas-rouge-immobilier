# marketing/ — Campañas y publicidad de Atlas Rouge

> **Hogar de TODO lo que no es código pero sí es el negocio:** estrategia de
> campañas (Google Ads, Meta, etc.), keywords, segmentaciones, creatividades,
> briefs y aprendizajes. Versionado en Git como el resto del proyecto.

## Convención para agentes (Claude / Codex / Kimi)

**Cuando la conversación trate de campañas, publicidad, anuncios, Ads, Meta,
keywords o captación de leads → lee esta carpeta PRIMERO** antes de proponer nada.
Aquí está el contexto verificado y las decisiones ya tomadas; no las
relitigues sin motivo. El estado operativo del proyecto sigue viviendo en
`HANDOFF_REPORT.md` (raíz).

## Índice

| Documento | Qué contiene |
|---|---|
| [google-ads-propietarios.md](google-ads-propietarios.md) | Estrategia de captación de **propietarios** (vender/alquilar en Marrakech). Google Search en francés (keywords, negativas, anuncios, estructura), keywords en español, y el pivote a **Meta Ads para España**. Incluye el estado verificado del tracking y los formularios. |
| [google-ads-como-importar.md](google-ads-como-importar.md) | Guía paso a paso para subir la campaña **sin API**, con Google Ads Editor (app de escritorio): importar el CSV, ajustes, anuncios, duplicar campañas, publicar. |
| [google-ads-import-FR.csv](google-ads-import-FR.csv) | Archivo de importación listo para Google Ads Editor: campaña FR completa (5 grupos, keywords frase/exacta + Max CPC, negativas de campaña). |

## Notas

- Mover docs aquí **no cambia la web publicada**: Netlify solo compila `src/`.
  Un push dispara un rebuild idéntico (inofensivo).
- Contenido en español (es el idioma de trabajo con el owner); nombres de
  archivo/carpeta en inglés y sin espacios/acentos por convención de Git.
- Datos siempre **verificables**: nada de cifras inventadas. Si una afirmación
  no se ha comprobado (p. ej. volúmenes de búsqueda, entrega de leads en prod),
  marcarla como pendiente de verificar.
