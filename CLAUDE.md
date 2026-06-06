# CLAUDE.md — Atlas Rouge (Claude Code-specific)

> Claude Code reads this file at session start. The portable harness
> contract lives in `AGENTS.md` and is imported below. Keep this file
> short — Claude Code-specific tips only. Everything else goes in
> AGENTS.md.

@AGENTS.md

---

## Lee primero (paquete de transferencia de contexto)

Para entender el proyecto sin depender de ningún chat previo, lee en este orden:

1. **`PROJECT_CONTEXT.md`** — qué es, arquitectura, funcionalidades, decisiones técnicas.
2. **`HANDOFF.md`** — estado actual, último trabajo, próximos pasos, qué revisar primero.
3. **`TODO.md`** — tareas pendientes priorizadas con su estado.
4. **`AUDIT_REPORT.md`** — auditoría de production-readiness (7 P0, roadmap).
5. **`HANDOFF_REPORT.md`** — historial cronológico detallado (log largo, opcional).

> ⚠️ `PROJECT_HANDBOOK.md`, `README.md`, `info.md` y `GITHUB_IDE_GUIDE.md`
> están **desactualizados** (dicen URL `atlas-rouge-immobilier.netlify.app`
> y "sitio francés"). La realidad es dominio **`atlasrouge.com`** y sitio
> **trilingüe FR/ES/EN**. No los tomes como fuente de verdad.

---

## Qué es este proyecto (resumen de 30s)

Sitio web **trilingüe (FR/ES/EN)** de una **agencia inmobiliaria de lujo en
Marrakech** (Atlas Rouge Immobilier), dirigido a **inversores europeos**
(sobre todo franceses). Es **lead-gen** (NO e-commerce): no hay pagos online;
el objetivo es captar contactos vía formularios. Cliente final: **Khalid**
(Francia). En **producción** en `atlasrouge.com` (Netlify).

## 🚀 MODO DESARROLLO — publicar a producción por defecto (ACTIVO)

> **Instrucción permanente del owner (2026-06-06).** Mientras este bloque siga
> aquí, el proyecto está en **modo desarrollo** y Claude debe **llevar todo a
> producción automáticamente, sin volver a preguntar**. Esto se mantiene **hasta
> que el owner modifique o elimine esta instrucción**.

Tras **cualquier cambio verificado**, ejecuta el ritual completo (= la frase
`CIERRA Y PUBLICA`) **de corrido, sin pedir confirmación**:

1. Verifica de verdad: `bash scripts/verify.sh` **+** comprobar prod en vivo
   (curl/headless). No supongas.
2. Actualiza `HANDOFF_REPORT.md` + `tasks/current.md` (+ `progress/` si aplica)
   con la realidad verificada.
3. **Commit enfocado + push a `main`** → Netlify auto-despliega.
4. Confirma el deploy `ready` y reporta la secuencia.

**Guardarraíles que SIGUEN vigentes incluso en este modo** (no se saltan):
- Si `verify.sh` está en **ROJO**: PARA, no publiques, avisa.
- Excluye los working files del owner (`brand/*.af`).
- Nunca `--no-verify` / `--no-gpg-sign` / `--force` sin OK explícito.
- Operaciones **destructivas** (DROP/TRUNCATE/DELETE masivo en BD, rotación de
  secretos, borrar archivos) siguen necesitando aprobación explícita en el chat.
- No tocar `.env*`.

## Stack

React 19.2 · Vite 7.2 · TypeScript 5.9 (strict) · Tailwind 3.4 · Supabase
(Auth + RLS + Storage + Postgres) · i18next (react-i18next) · GSAP ·
MapLibre GL · TipTap (editor blog) · Netlify (hosting + Functions + Edge).

## Comandos principales

```bash
npm install            # instalar dependencias
npm run dev            # servidor de desarrollo (Vite)
npm run build          # tsc -b && vite build (typecheck + build prod)
npm run lint           # eslint .
npm run preview        # previsualizar el build
bash scripts/verify.sh # pipeline de verificación del harness (lint+build)
npx tsc -b --noEmit    # typecheck aislado (NO hay script `typecheck` aún)
```
> No existen scripts `test` ni `typecheck` en package.json (P1 pendiente).

## Archivos y carpetas clave

```
src/i18n.ts                 # config i18next + registro de namespaces
src/lib/supabase.ts         # cliente Supabase (anon key, RLS)
src/services/*.ts           # capa de datos (auth, property, blog, leads, contact...)
src/services/admin/*.ts     # operaciones de admin
src/pages/*.tsx             # páginas públicas
src/pages/admin/*.tsx       # panel admin (protegido por ProtectedRoute)
src/locales/{fr,es,en}/*    # traducciones por namespace
src/components/              # componentes UI
supabase/migrations/*.sql   # esquema y RLS (aplicar a mano en Studio)
netlify/functions/*.js      # notify-lead, translate-property (server-side)
netlify/edge-functions/*.ts # img-proxy, og-rewrite
scripts/verify.sh           # verificación local
AUDIT_REPORT.md             # auditoría 13-agentes (P0-P3 + roadmap)
```

## Reglas para Claude al editar (project-specific)

- **Nunca uses imágenes generadas por IA.** Solo fotos reales (Pexels CC0).
- **Nunca inventes datos** (precios, fiscalidad, cifras): solo hechos
  verificables. Para artículos de blog, investigar con WebSearch.
- **Todo texto visible va por i18n** (`t('clave')`), nunca hardcoded.
  Las 3 versiones FR/ES/EN deben tener el MISMO set de claves.
- **No toques `.env*`** (gitignored). Secretos solo en Netlify env vars.
- **Las migraciones SQL se aplican con `npm run migrate -- <archivo>`**
  (`scripts/apply-migration.mjs` → Management API de Supabase usando
  `SUPABASE_ACCESS_TOKEN` en `.env.local`). La REST API no ejecuta SQL
  crudo. Flujo: crea el archivo en `supabase/migrations/` (registro
  append-only), aplícalo con el script y **verifica el efecto en vivo**.
  Operaciones destructivas (`DROP TABLE`/`TRUNCATE`/`DELETE` masivo)
  requieren confirmación explícita del owner — el script las bloquea sin
  `--force`. (Antes se pegaban a mano en Studio; ya no hace falta.)
- **`DEEPSEEK_API_KEY` sin prefijo `VITE_`** (es server-side; `VITE_*`
  filtraría al bundle del navegador).

## Cosas que Claude NO debe hacer

- No borrar archivos ni hacer cambios destructivos sin permiso explícito.
- ⚠️ **Commit + deploy:** mientras el **MODO DESARROLLO** (arriba) esté activo, SÍ
  se commitea y se publica a producción sin preguntar (ese bloque manda). Si el
  owner elimina ese bloque, vuelve a regir: *no commitear ni desplegar sin que el
  owner lo pida.*
- No tratar `PROJECT_HANDBOOK.md`/`README.md` como verdad (desactualizados).
- No re-aplicar la migración 005 ni recrear el harness (ya están hechos).

## Cómo proceder en futuras sesiones

1. Lee `HANDOFF.md` + `TODO.md` + `AUDIT_REPORT.md`.
2. Confirma con el owner qué P0 atacar (el más urgente: escalada de
   privilegios, SQL listo en AUDIT_REPORT.md § P0-1).
3. Trabaja, corre `bash scripts/verify.sh`, y al cerrar actualiza
   `HANDOFF.md` + `TODO.md` + `tasks/current.md`.

---

## Claude Code session start

When a fresh Claude Code session opens this repo:

1. Invoke the `session-start` skill (under `.claude/skills/`). It
   reads HANDOFF.md (if present) + tasks/current.md + recent commits
   and reports back in ~60 seconds.
2. Ask the user what to work on — do not invent tasks.

If the skill is unavailable, do the manual equivalent: read
`HANDOFF.md` (if exists) or `README.md`, then `tasks/current.md`,
then `git log --oneline -10`.

---

## Verification

After any meaningful change, run the `verify` skill or:

```bash
bash scripts/verify.sh
```

Do not commit on red. Do not deploy without going through the
`deploy-check` skill and the `deployment-guardian` agent.

---

## Subagents available under `.claude/agents/`

- `orchestrator` — plan a multi-step change
- `implementer` — write the code per the plan
- `reviewer` — review a diff before commit
- `deployment-guardian` — gates anything deploy-shaped
- `docs-curator` — keeps README / HANDOFF / ADRs aligned

Default to the main agent. Spawn a subagent only when the task
matches one of the above and you have a self-contained brief for it.

---

## Skills available under `.claude/skills/`

- `session-start` — orient at session start
- `verify` — run the local verification pipeline
- `docs-sync` — find and fix doc/reality drift
- `deploy-check` — pre-deploy safety checklist

---

## Project owner working preferences

- Chat con el owner en **español (es-ES)**. Tutear ("tú"), tono directo, sin relleno.
- Código, comentarios y documentación commiteada en inglés (portabilidad de equipo).

- Direct tone, no fluff. Move fast, don't over-engineer.
- Never run destructive commands without explicit approval in chat.
- Always show the diff or plan before applying non-trivial changes.

<!-- Add project-specific Claude Code preferences below (e.g. global
     rules inherited from ~/.claude/CLAUDE.md, conventions specific
     to this client, deploy windows, etc.). -->
