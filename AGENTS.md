# AGENTS.md — Atlas Rouge project harness

Portable instructions for any agent (Claude Code, Cursor, other) working
on this repository. If your tool reads `CLAUDE.md` it imports this file.
If your tool only reads `AGENTS.md`, this file alone is enough to work
safely.

---

## What is Atlas Rouge?

Atlas Rouge Immobilier is a multilingual (FR/ES/EN) real-estate website
for Marrakech, targeting European investors looking for villas, riads
and new-build apartments. The owner is **Khalid** (France). The site
showcases 3,500+ listings with a French-speaking concierge value
proposition end-to-end. SEO and lead-capture are the primary
conversion goals; the blog (FR-first, ES/EN translated) is the main
top-of-funnel asset.

Stack: React 18 + Vite + TypeScript + Tailwind, Supabase (Auth + RLS +
Storage + Postgres), i18next, GSAP, MapLibre GL, TipTap.
Hosting: Netlify (site id `7af94674-6d3f-4258-94bf-4776f8a7e9c6`,
domain `atlasrouge.com`). Supabase project
`slxlkbrqcjabsfuhlwdf.supabase.co`.

The operational source of truth is **`HANDOFF_REPORT.md`** (not
`HANDOFF.md`) — same role, different filename for historical reasons.
Treat it as the `HANDOFF.md` slot wherever this contract refers to it.

---

## Sources of truth (in this order)

When two documents disagree, **the higher-numbered source wins**. If
the higher source is silent on a question, fall back to the next.

1. **`HANDOFF_REPORT.md`** — current operational state, last commit,
   what works today in production. Read first on every fresh session.
   (Filled the `HANDOFF.md` slot; same role, different name.)
2. **`docs/decisions/ADR-NNN-*.md`** — architectural decisions. Do not
   relitigate without a new ADR.
3. **`tasks/current.md`** — what is being worked on right now, P0/P1
   queue, blockers.
4. **`progress/YYYY-MM-DD-*.md`** — what was done in past multi-step
   sessions.
5. **`CLAUDE.md`** — Claude Code-specific instructions (loads this
   file).
6. **`README.md` / strategic docs** — context that may lag the
   production reality; trust HANDOFF.md on conflict.

---

## Read on session start

1. `HANDOFF.md` if it exists, else `README.md`
2. `tasks/current.md` — active tasks
3. `git log --oneline -10` — recent context
4. Newest file under `progress/` if a multi-step task is in flight

If those four are clear, ask the user what to work on. Do not start
inventing tasks.

---

## Do not touch without explicit permission

- `.env*` files and anything under `secrets/`, `credentials/`,
  `**/*.key`, `**/token*.json` — secrets must never be read, logged,
  or transmitted.
- Hosting config files for Netlify (`fly.toml` /
  `vercel.json` / `netlify.toml` / equivalent) — small comment edits
  are fine; config changes need a heads-up.
- Migration history (`prisma/migrations/`, `migrations/`, `db/migrate/`
  or equivalent) — append-only by convention. Do not rewrite history
  unless explicitly asked.
- Any file the project owner explicitly flags as "do not touch" in
  `tasks/current.md` or `HANDOFF.md`.

---

## Do not run without explicit permission

The following commands affect production or are otherwise destructive.
Repeat the exact command back to the user and wait for a clear yes
("deploy", "envía", "ship", "go") in the same chat message before
running.

- `netlify deploy --prod`
- `netlify deploy` (preview — menos crítico, pero igual confirmar)
- `netlify env:set` / `netlify env:unset` (cambia variables de producción)
- `git push --force` and `git push --force-with-lease`
- Any command that prints or transmits the contents of `.env*`
- Any database write against production
- Any operation behind `--no-verify`, `--no-gpg-sign`, or similar
  safety bypass flags

---

## How to verify a change

Run `bash scripts/verify.sh` from the repo root. The script runs the
checks appropriate for the stack (Node.js) and exits non-zero
if anything fails. It does not deploy and does not touch production
data.

Do not commit on red. Do not deploy on red. If a failure is unrelated
to your change, capture it in `tasks/current.md` under "Known
pre-existing failures" and surface it to the user.

---

## When to use subagents

Use a single-purpose subagent (via the Claude Code Agent tool or your
tool's equivalent) when:

- The task involves searching across many files for a pattern.
- The task is an independent audit (security, performance, etc.)
  whose result you will consolidate.
- You want a second opinion on a non-trivial change.

Do not spawn a subagent for tasks you can do in one or two tool calls.
Agents inherit no context, so brief them with file paths and goals;
never write "based on your findings, fix the bug" — synthesize
yourself.

Predefined agents available under `.claude/agents/`:

- `orchestrator` — plans a multi-step change before code is touched
- `implementer` — writes the code per the plan
- `reviewer` — reviews a diff before commit
- `deployment-guardian` — gates any deploy-shaped action
- `docs-curator` — keeps README / HANDOFF / ADRs aligned

---

## When to write in `progress/`

For any task that:

- Touches three or more files, OR
- Spans more than one session, OR
- Involves a non-obvious decision worth recording

Create `progress/YYYY-MM-DD-short-slug.md` with: objective, files
inspected, files changed, commands run, verification result, open
risks, next step. See `progress/README.md` for the template.

Trivial single-file fixes do not need a progress entry — commit
messages suffice.

---

## Commit conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`,
  `chore:`, `test:`.
- One logical change per commit.
- Imperative mood, English (`Add ...`, not `Added ...`).
- Co-author trailer for AI-assisted commits when applicable.
- Never `--no-verify`, never `--no-gpg-sign`, never `--amend` on a
  pushed commit unless the user asks.

---

## Documentation discipline

- ADRs for any decision expensive to reverse → `docs/decisions/
  ADR-NNN-*.md`. Follow the structure: Status / Context / Decision /
  Alternatives / Consequences.
- Update `HANDOFF.md` (if it exists) after any change that affects
  "what works in production today".
- Do not delete historical docs; mark them historical at the top and
  link to the current version.

---

## Working language

<!-- Adjust the line below per project. The default reflects what
     was chosen at harness setup time. -->

- Chat with the project owner in their preferred language (see
  `CLAUDE.md`).
- Code, code comments, and committed documentation in English (for
  team portability).
- No emojis in code or committed files unless the user asks. Chat
  is fine.
