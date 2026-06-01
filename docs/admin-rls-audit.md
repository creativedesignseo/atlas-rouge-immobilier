# Admin RLS health map

Systematic audit of Row-Level Security across every table the admin panel
touches, cross-checked against the actual write operations in `src/services/**`.
Run `npm run audit:rls` to re-check in seconds (flags PII exposed to `anon` and
tables with RLS off/no-policies).

Last full audit: **2026-06-01** (verified live via the Management API).

## Status by table

| Table | Admin op (code) | RLS gate | Status |
|-------|-----------------|----------|--------|
| `properties` | create/update/delete (`propertyAdmin.service`) | `is_admin()` | ✅ (008 made `is_admin()` recognise `agents.role='admin'`) |
| `contact_submissions` | read/delete (admin) · insert (public form) | admin `is_admin()` · insert `true` | ✅ (009 removed the **anon SELECT** PII leak) |
| `site_settings` | update (`settings.service`) | `is_admin()` | ✅ (008) |
| `blog_posts` / `blog_post_translations` | CRUD (`blog.service`) | `is_active_agent()` | ✅ |
| `estimation_requests` | insert (public) · read/update (agents) | `true` / `is_active_agent()` | ✅ (duplicate policies = harmless debt) |
| `newsletter_subscribers` | upsert (public, `ignoreDuplicates`) · read (agents) | `true` / `is_active_agent()` | ✅ |
| `agents` | self-update profile | `agents_update_own` (frozen role/is_active via 006) | ✅ |
| `neighborhoods` | read only (no admin writes) | public read | ✅ |
| `favorites` | anon own | `anonymous_id` | ✅ |
| storage `property-images` | upload/delete (admin) | authenticated (007) | ✅ |
| storage `agent-avatars` | upload (upsert) avatar | INSERT/SELECT authenticated | 🟠 falta UPDATE/DELETE — reemplazar avatar puede fallar (pendiente, no bloquea) |

## Two role systems (important)
Production has **two desynced admin systems**: table `agents` (`role='admin'`,
used by the whole panel) and a legacy table `admins`. Policies on `properties`/
`contact_submissions`/`site_settings` use `is_admin()`; everything else uses
`is_active_agent()`. Migration **008** unified `is_admin()` to accept both, so
`agents` is now the de-facto source of truth and `admins` is obsolete (deprecate
later, don't drop yet). In prod only `is_admin()` and `is_active_agent()` exist —
the migrations' `is_admin_role()`/`is_agent()` do **not**.

## Known debt (non-blocking)
- 🟠 `agent-avatars` storage lacks UPDATE/DELETE policies (avatar replace).
- 🟡 Duplicate RLS policies on `estimation_requests` / `newsletter_subscribers`.
- 🟡 Legacy `admins` table obsolete after 008.

## Migrations involved
`006` (agent self-update freeze + search_path) · `007` (property-images storage)
· `008` (unify is_admin) · `009` (close contact_submissions PII leak).
Applied via `npm run migrate -- <file>` (Management API + PAT). See
`docs/supabase-connection.md`.
