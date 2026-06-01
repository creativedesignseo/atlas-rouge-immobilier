# Supabase connection & environment variables

How this project talks to Supabase, and **which variable belongs where**
(local dev vs Netlify production). Read this before touching env config.

Project: `slxlkbrqcjabsfuhlwdf` · Supabase account: `adspublioficial@gmail.com`.

---

## Three ways we connect to Supabase

| Way | Credential | Used by | Can run DDL? |
|-----|-----------|---------|--------------|
| **1. App client (RLS)** | `anon` key | The website + Netlify Functions (browser/server, governed by RLS) | No — rows only, under RLS |
| **2. Management API** | **Personal Access Token (`sbp_…`)** | `scripts/apply-migration.mjs` to apply SQL migrations | **Yes — raw SQL/DDL** |
| **3. Admin login** | agent email + password | local verification scripts / live testing | No — acts as an agent |

- The **REST API (PostgREST) cannot run raw SQL** — that's why migrations need
  the Management API (way 2), not the anon/service keys.
- Migrations are applied with: `npm run migrate -- supabase/migrations/<file>.sql`
  (see `scripts/apply-migration.mjs`). It reads `SUPABASE_ACCESS_TOKEN` from
  `.env.local`, derives the project ref from `SUPABASE_URL`, and POSTs the SQL to
  `https://api.supabase.com/v1/projects/{ref}/database/query`. Destructive
  statements (`DROP TABLE`/`TRUNCATE`/unscoped `DELETE`) are blocked without
  `--force` and require explicit owner approval.

---

## Where each variable lives

### Netlify (production) — the live site & Functions need these
The browser bundle only sees `VITE_*` vars; Functions see all configured vars.

| Variable | Why | Scope in Netlify |
|----------|-----|------------------|
| `VITE_SUPABASE_URL` | App client (browser) | All |
| `VITE_SUPABASE_ANON_KEY` | App client (browser) | All |
| `VITE_MAPBOX_TOKEN` | Property maps (browser) | All |
| `DEEPSEEK_API_KEY` | `translate-property` function | Builds, Functions, Runtime |
| `DEEPSEEK_MODEL` *(optional)* | Override model (defaults to `deepseek-chat`) | Functions |
| `ALLOWED_ORIGINS` *(optional)* | CORS allowlist for functions (has a default) | Functions |
| `AGENT_NOTIFY_EMAIL` / `AGENT_NOTIFY_FROM` *(optional)* | `notify-lead` email fields | Functions |
| `RESEND_API_KEY` *(optional, not set yet)* | `notify-lead` email delivery | Functions |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` *(optional, not set yet)* | `notify-lead` Telegram | Functions |
| `SITE_URL` *(optional)* | Sitemap origin (defaults to `https://atlasrouge.com`) | Builds |
| `CONTEXT` | Set automatically by Netlify | — |

### Local only (`.env.local`, gitignored) — dev/admin tooling, **NOT in Netlify**
These power scripts and migrations that run from a developer's machine. The
production site never needs them, so **do not add them to Netlify** — it would
only widen the attack surface for no benefit.

| Variable | Why it's local-only |
|----------|---------------------|
| **`SUPABASE_ACCESS_TOKEN`** (PAT) | Applying migrations from the repo. The live site never applies migrations, so this must **stay local**. Powerful (account-wide) — keep it out of Netlify and out of git. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` (no `VITE_`) | Local scripts: `generate-sitemap`, `apply-migration`, `translate:properties`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Local verification (login as agent to test flows). |
| `SUPABASE_SERVICE_ROLE_KEY` *(if/when added)* | Local batch jobs that must bypass RLS (e.g. translating existing properties). Never in the browser bundle, never in Netlify. |
| `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` | Local photo downloads. |

---

## Rules of thumb

- **`VITE_*`** → safe for the browser, configured in Netlify. Never put a secret
  behind a `VITE_` prefix (it ships in the public bundle).
- **Server secrets used by Functions** (e.g. `DEEPSEEK_API_KEY`) → Netlify
  Functions scope, never `VITE_`.
- **Dev/admin tooling** (e.g. `SUPABASE_ACCESS_TOKEN`, service role) → `.env.local`
  only. **Not in Netlify.**
- `.env.local` is gitignored; never commit it. The committed template is
  `.env.example` (no real values).
