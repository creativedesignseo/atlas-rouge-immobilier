# saas-audit (13 agentes) + migración i18n de 3 páginas

**Date:** 2026-05-26 (late session)
**Status:** completed
**Related:** `AUDIT_REPORT.md`, tasks/current.md, commits `593e47ae`, `8987f624`

## Objective

(1) Ejecutar una auditoría profesional de production-readiness con el
skill `saas-audit` en modo full. (2) Aprovechar el modelo multi-agente
para cerrar trabajo real en paralelo — empezando por los P0 de i18n
que la auditoría destapó.

## Qué se hizo

### Auditoría (read-only, 13 agentes en paralelo)
Lanzados 11 especialistas + reporter: arquitectura, seguridad, pagos,
BD, admin, UI/UX, QA, SEO/perf, deploy, stack, legal. Resultado en
`AUDIT_REPORT.md`. **Score 22/100 🛑 BLOCKED**, con la salvedad de que
19,5 de esos puntos vienen del área Pagos (N/A en un sitio lead-gen).

Hallazgos clave (7 P0):
- Escalada de privilegios vía RLS (triple-detectado SEC/DB/ADM)
- Drift de migraciones (tablas base solo en schema.sql)
- Canonical/hreflang estáticos (SEO)
- i18n roto en 3 páginas
- Sin Política de Privacidad ni Mentions Légales (legal, UE/Francia)

Descubrimientos que corrigen suposiciones previas:
- El sitemap dinámico **nunca llegó a main** (solo en worktree).
- Las policies de leads que creamos hoy quedaron **duplicadas**.
- `translate-property` sigue **abierta sin auth** (la key estaba bien,
  el endpoint no).

### Migración i18n (3 agentes implementadores en paralelo)
About (`about`, 31 claves), GestionLocative (`services`, 40),
BuyerGuide (`buyerGuide`, 147). Total 218 claves FR/ES/EN con calidad
editorial. Cierra UX-001 y UX-002.

Orquestación: el lead preparó el andamiaje compartido (`i18n.ts` +
stubs, typecheck verde) ANTES de spawnar, de modo que cada agente
editó solo su página + sus 3 JSON → cero conflicto de archivo
compartido. Patrón replicable para futuras migraciones masivas.

## Files changed

- `src/i18n.ts` — registrado namespace `buyerGuide` (imports + resources)
- `src/pages/{About,GestionLocative,BuyerGuide}.tsx` — cableados a t()
- `src/locales/{fr,es,en}/{about,services,buyerGuide}.json` — 9 archivos
- `AUDIT_REPORT.md` — **nuevo**, reporte consolidado
- `.gitignore` — añadido `.saas-audit/`

## Verification

- Paridad de claves fr/es/en: 31/40/147 idénticas ✅
- `tsc -b --noEmit` exit 0 ✅
- `npm run build` verde ✅
- 0 literales franceses residuales en JSX (heurística acentos) ✅
- `bash scripts/verify.sh` all checks passed ✅

## Open risks

1. **El score 22 NO refleja mala ingeniería** — es la cantidad de P0.
   No interpretar como "hay que reescribir"; es ~1 sprint de cierre.
2. **5 P0 siguen abiertos** (ver tasks/current.md). El más urgente y
   barato es la escalada de privilegios (SQL listo, 30 min).
3. **Decisión editorial pendiente de validar:** "pensé pour les
   Français" → adaptado a "compradores internacionales" en ES/EN.
4. Las policies RLS duplicadas (DB-003) siguen sin limpiar → migración
   006 pendiente.

## Next step

Aplicar P0-1 (escalada de privilegios) en Supabase Studio con el SQL
de `AUDIT_REPORT.md` § P0-1. Luego P0-4 (canonical SEO) y P0-5
(000_base_schema). En paralelo, Khalid + abogado con las páginas
legales.
