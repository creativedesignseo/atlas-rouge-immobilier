# 2026-08-03 — Why the ads were not capturing leads

## Objective

The owner asked where the data collected by his ad's landing URL ends up:

```
https://atlasrouge.com/fr/vendre?utm_source=google&utm_medium=cpc&utm_campaign=fr-diaspora&utm_content=vendre
```

Answer had to be verified against production, not inferred.

## Files inspected

- `src/App.tsx:157-176` — public routes with lang prefix; `/fr/vendre` resolves
  to `<Sell />` through `getAllSlugsForKey('sell')`.
- `src/pages/Sell.tsx` — no form component imported, no Supabase insert, only
  three links (`path('/valuation')`, `path('/contact')`, `#comment`).
- `src/services/contact.service.ts:46` — inserts into `contact_submissions`.
- `src/services/leads.service.ts:40` — inserts into `estimation_requests`.
- `public/vendre/index.html:726-730, 864-896` — hidden UTM fields, message
  assembly, insert + `notify-lead` + `generate_lead`.

## Verification (production, Playwright)

| URL | Result |
|---|---|
| `/fr/vendre?utm...` | `forms: 0`, `inputs: []` — no form at all |
| `/vendre/?service=vendre&utm...` | `forms: 1`, `project=vendre`, UTMs captured |
| `/proprietaires/?service=airbnb&utm...` | `forms: 1`, `project=airbnb`, UTMs captured |

`bash scripts/verify.sh` — green (lint + build; typecheck/test still have no
script).

## Findings

1. `/fr/vendre` is the SPA's informational section, not a landing page. The
   click is paid for, the visitor reads, and a **second click** is required
   before any data can be submitted. No conversion fires there either.
2. `/fr/vendre` and `/vendre/` are two different pages with near-identical
   names — differing only by the `/fr` prefix and the trailing slash. This
   naming trap is what made the misconfiguration easy to miss.
3. UTM parameters are concatenated into the lead's `message` field rather than
   stored in dedicated columns, so per-campaign filtering or aggregation is not
   possible with a query.
4. The UTM scheme was authored by Claude in an earlier session and handed to the
   owner without explanation. Do not ship ads configuration without explaining
   what each parameter means.

## Files changed

None — diagnosis and documentation only. `HANDOFF_REPORT.md`,
`tasks/current.md` and this entry updated.

## Open risks

- 9 of 10 ad URLs still point at pages without a form. Until they are fixed,
  spend on those groups produces no measurable leads.
- Lead notifications still have no configured channel; leads are only visible
  in `/admin/contacts`.

## Next step

Owner edits the remaining 9 URLs one by one in the Ads UI (bulk edit is unsafe
here — some groups target `/vendre/`, others `/proprietaires/`). Then decide on
promoting UTMs to their own columns.
