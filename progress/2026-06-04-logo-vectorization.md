# 2026-06-04 — Logo vectorization + tagline font ID

## Objective
Owner request: vectorize the Atlas Rouge brand-book logo (wordmark + mountain
isotype + AR monogram) and identify the tagline typeface. Inputs were the
brand-book raster images pasted in chat; no source vector existed in the repo.

## Files inspected
- `public/favicon.svg` — only existing mark; placeholder "AR" in Georgia, not the brand mark.
- `src/components/Navbar.tsx:56` — site "logo" is just text (`font-display` = Schibsted Grotesk), not the brand-book wordmark.
- `src/index.css` (font system) — confirms web type stack: Schibsted Grotesk / Newsreader / Inter.

## Key decision (non-obvious): the wordmark is mixed/custom
The brand book lists Schibsted Grotesk, Newsreader, and Inter for the broader
type system, but the logo artwork itself is not a single live font. The final
reconstruction treats it as:
- `ATLAS` — custom crossbarless grotesk, based on Schibsted Grotesk proportions.
- `ROUGE` — Cormorant SemiBold ~600, chosen for the curved R leg and high
  contrast.
- Tagline — Cormorant Medium ~500, title case, +0.05em tracking.

## Files created
- `brand/build_logo.py` — generator: flattens Cormorant glyphs to `<path>` via fontTools, hand-builds the mountain mark, composes lockups. Single source of truth.
- `brand/render.sh` — SVG→PNG via headless Chrome (verification).
- `brand/fonts/` — OFL fonts used by the generator.
- `brand/out/*.svg` — deliverable SVGs (primary lockup ×3, wordmark ×3, mountains ×3, monogram ×3, kit preview) in terracotta/midnight/cream.
- `brand/out/kit-preview.png` — overview preview.
- `brand/README.md`, `brand/.gitignore` (ignores .venv).

## Update — 16:9 logotype artboards
Owner asked for the logotype in 16:9. Added two exact 1920×1080 presentation
artboards generated from the same vector source:
- `brand/out/logo-16x9-on-cream.svg` + `.png` — primary terracotta on warm cream.
- `brand/out/logo-16x9-reverse.svg` + `.png` — reverse cream/sand on near-black.

Design direction: lots of negative space, no touristic references, centered
mountain mark, `ATLAS ROUGE` as the main signal, and the existing tagline
`Luxury Real Estate — Marrakech`.

## Update — independent fresh logo concept
Owner clarified they wanted a new logo concept, not an evolution contaminated
by the existing logo. Created a separate folder:
`brand/concepts/fresh-logo-16x9/`.

Fresh concept outputs:
- `out/atlas-rouge-fresh-logo-16x9-caps-light.svg` + `.png` — recommended
  uppercase luxury real-estate route on warm cream.
- `out/atlas-rouge-fresh-logo-16x9-caps-dark.svg` + `.png` — reverse version.
- `out/atlas-rouge-fresh-logo-16x9-light.svg` + `.png` — softer title-case
  editorial route.
- `out/atlas-rouge-fresh-logo-16x9-dark.svg` + `.png` — reverse version.

Design direction: new typographic composition from the brand brief only;
Newsreader serif wordmark, `Atlas` in midnight/cream, `Rouge` in terracotta,
French descriptor `IMMOBILIER DE LUXE - MARRAKECH`, abstract contour line as a
subtle Atlas/red-earth reference. No old mountain mark, no old custom ATLAS
geometry, no tourist clichés.

## Commands run
- `python3 -m venv brand/.venv && pip install fonttools` (4.63)
- font downloads from github.com/google/fonts (curl, OFL)
- `brand/.venv/bin/python brand/build_logo.py`
- `bash brand/render.sh ...` for visual verification
- `bash brand/render.sh brand/out/logo-16x9-on-cream.svg brand/out/logo-16x9-on-cream.png 1`
- `bash brand/render.sh brand/out/logo-16x9-reverse.svg brand/out/logo-16x9-reverse.png 1`
- `brand/.venv/bin/python brand/concepts/fresh-logo-16x9/build.py`
- `bash brand/render.sh brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-light.svg brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-light.png 1`
- `bash brand/render.sh brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-dark.svg brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-dark.png 1`
- `bash brand/render.sh brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-caps-light.svg brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-caps-light.png 1`
- `bash brand/render.sh brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-caps-dark.svg brand/concepts/fresh-logo-16x9/out/atlas-rouge-fresh-logo-16x9-caps-dark.png 1`

## Verification
Each asset rendered to PNG via headless Chrome and visually compared to the
brand book. Wordmark, tagline, divider, mountains, and reverse-on-dark all
match. Did NOT run `scripts/verify.sh` — no app/source code changed (assets
live under `brand/`, outside the build).

## Open risks / caveats
- AR monogram is `A`+`R` set tight in Cormorant — an approximation of the
  custom interlocked lettering in the brand book, not the exact glyph.
- Mountains and the crossbarless `ATLAS` are hand-matched paths/strokes, not a
  pixel trace.
- These are recreations from raster; prefer the designer's original vector for
  the wordmark if it ever surfaces.

## Update — v1 logo delivered + implemented on the site
Owner delivered a finished v1 vector (`logo-atlasrouge-v1.svg`, Affinity/Serif
export): a centered **stacked lockup** — terracotta mountain isotype above the
`ATLAS ROUGE` wordmark. Colors are the exact brand tokens: mountain
`rgb(181,83,58)` = `#B5533A` (terracotta), wordmark `rgb(23,32,51)` = `#172033`
(midnight). viewBox `0 0 2002 423` (~4.73:1).

Assets added (in repo, served statically):
- `public/logo.svg` — full color (navbar, light backgrounds). Cleaned the
  Affinity export: dropped `width/height=100%`, `DOCTYPE`, serif metadata; kept
  `viewBox` + added `role="img"`/`aria-label`. Path data unchanged.
- `public/logo-reverse.svg` — wordmark recolored to cream `#FAF7F1`, mountain
  kept terracotta (footer on `bg-midnight`).

Wired into components (`<img>` from `public/`, no svgr dependency):
- `src/components/Navbar.tsx` — replaced the two text spans (terracotta wordmark
  text + tagline) with `<img src="/logo.svg" className="h-11 w-auto">`.
- `src/components/Footer.tsx` — bottom-bar `Atlas Rouge` text span replaced with
  `<img src="/logo-reverse.svg" className="h-10 w-auto">`; divider + tagline kept.

Favicon left as-is: the mountain isotype is too wide-flat (~4.5:1) to read at
16px, and the existing `AR` monogram favicon already uses the brand palette
(`#0F1419` + terracotta). Not worth a bad mountain favicon.

Verification: `bash scripts/verify.sh` green (lint + build). Rendered both logos
via headless Chrome on their real backgrounds (white navbar / midnight footer) —
legible, correct contrast, mountain centered over the wordmark. **Not deployed**
(owner commits/pushes on request → Netlify auto-deploys `main`).

## Next step (if owner wants)
- Commit + push (Netlify auto-deploys).
- Source `logo-atlasrouge-v1.svg` lives in `~/Downloads` (outside repo); the path
  data is preserved in `public/logo.svg`.
Not committed (owner commits on request).
