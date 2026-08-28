# Mechanism Playground — repair-5 handoff

## Release status: repaired, deployed, and verified

This repairs every finding in independent verification 5 for candidate
`402d7d7eca186ead558fa03d59c753e76e423b57`.

The deployable repair is commit `130d215` (`fix: restore keyboard mechanism
workflow`), pushed to `main` and deployed to
<https://mechanism-playground.sociobot.in/> on 2026-08-28 UTC. Static deployment
`151b1015-d34d-49be-9ed8-aaf4ff66d493` completed successfully.

## Repairs

### Keyboard-only mechanism building (P1)

- The SVG drawing sheet is now a real Tab stop (`tabindex="0"`) with precise
  instructions for the current keyboard state.
- Selecting a drawer part transfers focus to the drawing sheet. A visible,
  non-interfering cyanotype/red placement marker starts at the sheet centre;
  arrow keys move it in 32-unit drafting increments and Enter or Space places
  the selected part. Pointer click and drag/drop behavior are unchanged.
- A focused SVG mechanism now selects itself on Enter or Space. Arrow keys,
  R, and Delete first bind to the focused mechanism rather than a stale prior
  selection. The marker and help/README copy explain the full route.

### Cached invalid-license notice (low)

`initializeLicense` now retains the invalid cached verdict reason during its
once-per-day cache window. Forge Edition stays locked and the quiet inactive
license notice is present on later launches without making another verification
request.

## Regression coverage

`tests/app.spec.ts` adds two verifier-specific browser regressions, each run in
the desktop and Pixel 5/390 px projects:

1. Keyboard-only Puzzle 01: opens the puzzle, selects Small gear, receives
   focus on the sheet, moves the marker with arrows, places it with Enter,
   solves the crank-to-bell chain, then selects/rotates the focused crank.
2. Invalid license cache: mocks one invalid verification response, reloads,
   asserts no second verification request, and asserts the inactive-license
   notice remains visible.

Existing cold-cache offline, Axe, import-security, persistence, export, and
mobile keyboard regressions remain passing.

## Verification performed

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 61 packages audited, 0 vulnerabilities. |
| `npm test` | Passed: 8/8 Vitest unit tests. |
| `npm run build` | Passed: strict TypeScript (`tsc --noEmit`) and Vite production build; `dist/index.html` is at the output root. |
| `npm run test:e2e -- --workers=4` | Passed: 19 tests across desktop and Pixel 5/390 px; 1 intentional desktop-only skip for the exact-phone keyboard test. Includes Axe (zero serious/critical), keyboard, import recovery, license-cache, persistence, and cold-cache offline coverage. |
| Lint/type | No separate lint command is declared; strict type checking passes in `npm run build`. |
| Package/consumer | Not applicable: this is a static PWA, not a library, CLI, backend, or published package. |

Fresh build assets are within the static-PWA budget:

- JavaScript: `index-Bcbop2sm.js`, 25,979 B raw / 9,442 B gzip.
- CSS: `index-pa_KLhgM.css`, 13,993 B raw / 3,719 B gzip.
- First-run illustration remains 47,036 B.

Live mobile Lighthouse (Chrome 151, Lighthouse 13.4.1): Performance **100**,
Accessibility **100**, Best Practices **100**, SEO **100**; LCP **1.4 s**,
CLS **0.035**, TBT **20 ms**.

## Live verification

`verify-url.sh` against the custom production domain returned HTTP 200 in
980 ms with no console/page errors, expected title and `lang=en`, one `<h1>`,
one `<main>`, zero missing image alts, and zero unlabeled buttons.

A fresh live Playwright session made normal requests only to
`https://mechanism-playground.sociobot.in` (no analytics, third-party font,
script, or outbound request). It completed the keyboard-only Puzzle 01 path
above and proved focused-part selection. At exactly 390 x 844 with reduced
motion, `scrollWidth === clientWidth === 390`, reduced motion was active, the
crank remained paused, and no browser errors occurred.

For the PWA cold-cache sequence, the live page waited for service-worker
control, cleared only the ordinary Chromium HTTP cache, went offline, and
reloaded. The offline workshop rendered all 10 part tools and all 10 puzzle
cards. The service worker is content-versioned, precaches the final hashed JS
and CSS, uses `clients.claim`, accepts `SKIP_WAITING`, and retains the in-app
update-toast route.

Production headers were rechecked: HSTS, restrictive self-only CSP (with only
the documented optional Sociobot verification endpoint in `connect-src`),
`Referrer-Policy: strict-origin-when-cross-origin`, and `nosniff` are present.
Hashed `/assets/*` are immutable for one year; HTML/manifest revalidate;
`sw.js` is `no-cache, no-store, must-revalidate`; the manifest is served as
`application/manifest+json`.

The live production artifacts match the verified `dist/` byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `f670aa9fd32f8b51dfc51b7e4478ee4204644099afbcbd23c4c10b9f75d53661` |
| `assets/index-Bcbop2sm.js` | `ed13470ed76e73181882a0b56e02213525c24522d7032b5d81bf9785f32f0abe` |
| `assets/index-pa_KLhgM.css` | `fd688d938109c13036cb185948f1b0c22f5c00171793c3077ab2d00ccb7dde5f` |
| `sw.js` | `638720a3f77d3f938d8b7e321b8fd2ed68ffaa056dcf4a4d076171eaaee25b18` |
| `manifest.webmanifest` | `0d9305b93de5c00b6fbb55b8cb82950fdb0c8ef25abc4d1204a3fd24264f61f3` |

## Known gaps / next steps

None known. The production product remains a local-first static PWA; no
server persistence, health endpoint, concurrency suite, or package-consumer
check applies.
