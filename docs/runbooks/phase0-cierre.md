# Runbook: Cerrar Phase 0 (stop-the-bleed) en producción

**Versión:** 2026-05-30
**Severity:** P0 (hay una escalada de privilegios viva en producción)
**Tiempo medio de cierre:** ~30 min (la mayoría es del owner)
**Audiencia:** owner del sitio (Khalid / Jonatan), desarrolladores que
retoman el proyecto, IA que continúa la sesión.

---

## Por qué existe este runbook

La **Phase 0** (seguridad + SEO) está **implementada y `verify.sh`
verde**, pero vive en el working tree **sin commitear y sin deploy**.
Hasta que se ejecute este runbook, producción sigue con los agujeros
originales — el más grave: **cualquier agente puede auto-promocionarse
a admin** (P0-1).

Detalle técnico de cada fix en:
- `progress/2026-05-29-phase0-security-seo.md`
- `AUDIT_REPORT.md` §Phase 0
- `tasks/current.md` §Phase 0

**Regla de oro:** el paso 1 (SQL) NO depende del deploy. Cierra el
riesgo de seguridad al instante. Hazlo primero, aunque no toques nada
más hoy.

---

## Quién hace qué

| Paso | Acción | Responsable | ¿Toca prod? |
|------|--------|-------------|-------------|
| 1 | Aplicar SQL `006` en Supabase Studio | **Owner** | Sí (BD) |
| 2 | Verificar env vars en Netlify | **Owner** (o IA vía MCP) | No (solo lee) |
| 3 | Commit de Phase 0 (sin push) | **IA / dev** | No |
| 4 | Aprobar push → deploy | **Owner** | Sí (deploy) |
| 5 | Actualizar HANDOFF / TODO / tasks | **IA / dev** | No |

---

## Checklist

```
[ ] 1. Aplicar SQL 006 en Supabase Studio + verificar no-autopromoción
[ ] 2. Verificar env vars Netlify (SUPABASE_URL + SUPABASE_ANON_KEY)
[ ] 3. Commit Phase 0 (working tree -> commit, sin push)
[ ] 4. Aprobar push a main -> Netlify auto-deploya
[ ] 5. Actualizar HANDOFF.md / TODO.md / tasks/current.md
```

---

## Paso 1 — Aplicar SQL `006` (cierra P0-1) 🔴

**Responsable:** owner. **No depende del deploy. Hazlo primero.**

**Dónde:** Supabase Studio → proyecto `slxlkbrqcjabsfuhlwdf` → **SQL
Editor** → New query → pega → **Run**.

**Qué hace:** recrea la policy de UPDATE de `agents` con un `WITH CHECK`
que congela `role` e `is_active` (un agente solo edita
name/phone/bio/photo_url, nunca su rol/estado), y fija el `search_path`
de 3 funciones `SECURITY DEFINER`. No borra ni modifica filas.

**Fuente:** `supabase/migrations/006_fix_agent_update_rls.sql` (pega el
contenido íntegro de ese archivo).

```sql
-- 1. Cerrar la escalada de privilegios en `agents`
DROP POLICY IF EXISTS "Agent can update own row" ON agents;

CREATE POLICY "Agent can update own row"
  ON agents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role      = (SELECT a.role      FROM agents a WHERE a.user_id = auth.uid())
    AND is_active = (SELECT a.is_active FROM agents a WHERE a.user_id = auth.uid())
  );

-- 2. Hardening: fijar search_path en los helpers SECURITY DEFINER (DB-005)
ALTER FUNCTION public.is_agent()        SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin_role()   SET search_path = public, pg_temp;
ALTER FUNCTION public.is_active_agent() SET search_path = public, pg_temp;
```

**Criterio de done (verificar SIEMPRE, no asumir):** como un agente NO
admin, intenta:

```sql
UPDATE agents SET role = 'admin' WHERE user_id = auth.uid();
```

- ✅ Debe **fallar**: *"new row violates row-level security policy for
  table agents"*.
- ✅ Editar `name`/`phone` de la propia fila debe **seguir funcionando**.

Si el UPDATE de rol pasa → el fix NO está aplicado; revisar que el
`CREATE POLICY` corrió sin error.

> ⚠️ No re-aplicar `000_base_schema.sql` sobre prod (es para
> reconstruir desde cero, no para correr encima de la BD viva).

---

## Paso 2 — Verificar env vars en Netlify

**Responsable:** owner (o IA vía Netlify MCP, solo lectura).

**Por qué:** tras el deploy, las funciones serverless exigen JWT y el
sitemap se genera en el `prebuild`. Ambos necesitan estas variables. Si
faltan, el sitemap se degrada y la auth de funciones no puede validar
tokens.

**Dónde:** Netlify → site `7af94674-6d3f-4258-94bf-4776f8a7e9c6` →
Site configuration → Environment variables.

**Confirmar que existen (no vacías):**

```
[ ] SUPABASE_URL          = https://slxlkbrqcjabsfuhlwdf.supabase.co
[ ] SUPABASE_ANON_KEY     (anon key, pública por diseño)
```

(El build del sitemap puede usar la service key si está disponible; la
anon key es suficiente para el caso degradado tolerante a fallos.)

**Ya verificadas en sesiones previas (no tocar):** `DEEPSEEK_API_KEY`,
`RESEND_API_KEY`, `AGENT_NOTIFY_EMAIL`, `AGENT_NOTIFY_FROM`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

**Criterio de done:** las dos variables existen y tienen valor. Si
falta alguna, añadirla antes del paso 4.

---

## Paso 3 — Commit de Phase 0 (sin push)

**Responsable:** IA / dev. **No toca prod** (no hay push).

**Por qué:** el working tree lleva días sin commitear — es deuda y
riesgo de pérdida. Commitear NO despliega (Netlify solo auto-deploya al
hacer **push** a `main`).

**Archivos del commit (18):** 5 nuevos (`000_base_schema.sql`,
`006_fix_agent_update_rls.sql`, `scripts/generate-sitemap.mjs`,
`src/components/ErrorBoundary.tsx`, el progress) + 13 modificados +
`public/sitemap.xml` untracked.

**Antes de commitear:**

```bash
git status --short
bash scripts/verify.sh        # debe salir verde
git check-ignore -v public/sitemap.xml   # confirmar que está ignorado
```

**Mensaje sugerido (conventional commit):**

```
feat(security,seo): Phase 0 stop-the-bleed

- fix(rls): freeze role/is_active in agent self-update (migration 006)
- harden(db): set search_path on SECURITY DEFINER helpers (DB-005)
- feat(seo): per-route canonical/hreflang + dynamic trilingual sitemap
- chore(db): idempotent base schema (000) to fix migration drift
- fix(functions): require active-agent JWT + CORS on serverless functions
- feat(ux): global ErrorBoundary with i18n fallback
```

**Criterio de done:** commit creado en `main` (local), `verify.sh`
verde, nada pusheado todavía.

> ⚠️ Nunca `--no-verify`. El owner debe poder revisar el diff antes del
> paso 4.

---

## Paso 4 — Aprobar push → deploy

**Responsable:** owner. **Toca prod** (Netlify auto-deploya `main`).

**Pre-requisitos:** pasos 1, 2 y 3 hechos (SQL aplicado, env vars OK,
commit listo y revisado).

**Confirmación explícita requerida** (frontera de deploy del harness):
el owner debe decir "push" / "deploy" / "envía" en el chat.

```bash
git push origin main
```

**Criterio de done (verificar en producción tras el deploy):**

```
[ ] Netlify deploy en verde (dashboard)
[ ] https://atlasrouge.com/sitemap.xml devuelve XML con URLs FR/ES/EN
[ ] Ver el <head> de /es/ y /fr/: canonical + hreflang por ruta (no la home)
[ ] POST a /.netlify/functions/translate-property SIN JWT -> 401/403
[ ] Forzar un error de render -> aparece el ErrorBoundary, no pantalla blanca
```

---

## Paso 5 — Actualizar documentación

**Responsable:** IA / dev. **No toca prod.**

Marcar Phase 0 como **desplegada y verificada** en:

```
[ ] HANDOFF.md          (§1 estado, §4 problemas: P0-1/4/5 -> cerrados)
[ ] TODO.md             (T1/T3/T4/T5 -> ✅ cerradas)
[ ] tasks/current.md    (mover Phase 0 de "pending apply/deploy" a done)
[ ] progress/2026-05-29-phase0-security-seo.md  (Status -> done + fecha)
```

Actualizar "último commit en `main`" con el hash del push.

---

## Fuera de este runbook (no nos bloquea)

- **P0-2 / P0-3 legales** (Política de Privacidad + Mentions Légales):
  responsabilidad de Khalid + abogado. Requiere datos RC/ICE
  marroquíes. Ver `TODO.md` T2.

---

## Si algo sale mal

- **El UPDATE de rol sigue pasando tras el paso 1** → el `CREATE POLICY`
  no se aplicó; re-correr el SQL y revisar errores en el editor.
- **El sitemap sale vacío tras el deploy** → faltan env vars (paso 2) o
  la BD no respondió; el generador es tolerante a fallos y no rompe el
  build, pero el sitemap quedará mínimo. Revisar logs del build en
  Netlify.
- **Las funciones devuelven 500 en vez de 401** → faltan
  `SUPABASE_URL`/`SUPABASE_ANON_KEY` en el runtime de funciones.
- **Rollback de deploy:** Netlify → Deploys → seleccionar el deploy
  previo → "Publish deploy". El SQL del paso 1 NO necesita rollback (es
  un endurecimiento de seguridad correcto).
