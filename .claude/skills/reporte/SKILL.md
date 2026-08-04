---
description: Genera el informe de todo lo que se ha hecho en la web, para rendir cuentas al cliente. Lee docs/BITACORA.md, la actualiza con los commits nuevos desde la última entrada, y presenta el informe. Úsala cuando el owner pida "un reporte de lo que hemos hecho", una auditoría de trabajo, un resumen para Khalid, o un parte de estado del proyecto.
---

# reporte

Produce el informe de rendición de cuentas del proyecto Atlas Rouge a partir
de la bitácora versionada, y la deja al día antes de presentarla.

La fuente es `docs/BITACORA.md`. Su prueba es el historial de git: cada
afirmación del documento lleva el hash del commit que la respalda.

## Argumentos

El owner puede acotar el informe. Interpreta el argumento libremente:

| Lo que escribe | Qué devolver |
|---|---|
| *(nada)* | Informe completo, todo el proyecto |
| un mes o fecha (`agosto`, `2026-07`) | Solo ese periodo |
| `cliente`, `Khalid`, `WhatsApp` | Versión corta, sin tecnicismos, lista para enviar |
| `incidentes`, `fallos` | Solo la sección de incidentes en producción |
| `desde el último` | Solo lo posterior a la última entrada de la bitácora |

## Procedimiento

1. Lee `docs/BITACORA.md`. Anota la fecha de última actualización y el
   último commit registrado (aparecen en la cabecera).

2. Comprueba si hay trabajo sin registrar:

   ```
   git log <ultimo-hash-registrado>..HEAD --date=short --format='%h|%ad|%s'
   ```

   Si no hay nada nuevo, salta al paso 5.

3. Si hay commits nuevos, reconstruye qué se hizo **leyéndolos**, no
   suponiendo. Para los que el asunto no baste: `git show --stat <hash>`.
   Consulta también `HANDOFF_REPORT.md`, `tasks/current.md` y lo más
   reciente de `progress/` — ahí está el "por qué" que el commit no cuenta.

4. Añade los hitos nuevos a `docs/BITACORA.md`: en la cronología del mes que
   toque, en "Incidentes en producción" si algo llegó a fallar en vivo, y
   actualiza la cabecera (fecha, último commit, total de intervenciones).
   El documento es **append-only en espíritu**: se corrigen errores de hecho,
   no se borra historia. Si algo resultó estar mal documentado, se anota la
   corrección con su fecha, no se reescribe en silencio.

5. Presenta el informe en el chat, con el alcance que pidiera el argumento.

6. Si has modificado la bitácora, haz commit (`docs: update project log …`)
   y push. El MODO DESARROLLO de `CLAUDE.md` lo autoriza sin preguntar.

## Reglas de redacción

- Español de España, directo, sin marketing. Prohibido "robusto", "potente",
  "listo para producción", "de nivel empresarial".
- El lector no es programador. Cada cambio técnico se traduce a su
  consecuencia de negocio.
- **Cero invención.** Si el historial no dice por qué se hizo algo, escribe
  "no consta". Nunca inventes cifras de rendimiento, conversión o tiempo.
- Distingue siempre **verificado en producción** de **desplegado sin
  verificar**. Es la diferencia que da valor al documento.
- Los incidentes no se suavizan. Un informe que solo cuenta aciertos no
  sirve para rendir cuentas.
- Sin emojis en el documento (en el chat sí valen).

## No hagas

- No reescribas entradas antiguas para que el proyecto luzca mejor.
- No cuentes como hecho algo que solo está desplegado y sin comprobar.
- No incluyas datos personales de leads reales (nombres, teléfonos, correos)
  en el documento: es un informe de trabajo, no un volcado de la base.
- No ejecutes nada destructivo ni despliegues fuera del commit de la bitácora.
