# Independent release verification 3 — FAIL

**Candidate:** `3478358bf6f459b0f89b2b856c5bc03f29e6c824`  
**Production URL:** <https://mechanism-playground.sociobot.in/>  
**Verified:** 2026-08-27 UTC

## Decision

**FAIL — one low-severity acceptance defect remains.** The repaired candidate works end to end, is the code deployed at production, and has no security, functional, accessibility, privacy, PWA, or performance-budget blocker found. However, malformed JSON in the advertised Blueprint file import flow exposes a raw JavaScript parser diagnostic rather than the product-required plain-language error saying what happened and what to do next. The factory contract requires error/recovery paths and the attached acceptance criteria require errors to say both.

## Defects

### Low — L1: malformed blueprint error is raw parser jargon

**Reproduction:** Open **Blueprint file**, select a `.json` file containing `{not JSON`.

**Observed on production and the fresh candidate build:**

```
Expected property name or '}' in JSON at position 1 (line 1 column 2)
```

The dialog stays open and the prior machine remains intact, so recovery is not blocked. But this message is implementation-specific, is not written for the ages-10+ audience, and gives no corrective action. It does not meet the stated error-language acceptance criterion. Unknown part types and hostile IDs use clear recovery copy and preserve the existing board.

**Required fix:** Replace it with clear copy such as: “This file is not valid JSON. Export a fresh blueprint or choose a valid JSON file and try again.” Add an automated assertion.

## Fresh local evidence

The checkout was clean and `HEAD` was exactly the candidate SHA before the verification-only documentation changes.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 59 packages audited, 0 vulnerabilities. |
| `npm test` | Passed: 8/8 Vitest tests. |
| `npm run build` | Passed: `tsc --noEmit` and Vite build; `dist/` emitted. |
| `npm run test:e2e` | Passed after `npx playwright install chromium`: 13 passed, 1 intentional desktop skip. |
| Lint/type checks | No lint command/tool is declared. Type checking is part of `npm run build`. |

The initial e2e invocation could not find Chromium revision 1234 because this repository resolves Playwright 1.62 while the supplied browser cache was for another revision. Installing Chromium as documented by the work order fixed this environment setup issue; it is not a product test failure.

Fresh build budgets: JS `index-oX4eCrPy.js` is 24,287 B raw / 8,954 B gzip; CSS `index-Bv3AmGK4.css` is 13,701 B raw / 3,674 B gzip; the first-run illustration is 47,036 B. All are within the 200 KB JS, 50 KB CSS, and 300 KB image budgets. A fresh Lighthouse CLI run could not complete because Lighthouse closed against the supplied Chromium during BFCache collection, so no Lighthouse score is claimed here. Browser/axe and bundle checks completed successfully.

## Product exercise and recovery evidence

- In a fresh production Chromium profile, built and solved Puzzles 01–03 by snapping the required parts between the crank and bell: small gear; large + small gear; cam + follower. Each displayed `Solved`.
- Reloaded after autosave; Puzzle 03 remained solved, confirming local persistence.
- Keyboard focus on a placed part accepted `R` and showed `45°`; the checked-in e2e suite also covers keyboard undo/deletion and 390 px export.
- Turn crank changed to Pause; Slow could be enabled; Pause returned to Turn crank. Reduced motion initially left the machine paused.
- Export produced a dated `mechanism-blueprint-YYYY-MM-DD.json` file.
- Boundary placement stayed at `Hand crank, at 64, 48` and `Bell, at 736, 448`.
- An unknown imported type produced clear recovery text, left the two existing parts untouched, and produced no page error.
- A quote/event-handler-containing ID was rejected before render with the unsupported-character message. The test-only `data-qa-executed` marker was absent: the earlier DOM-XSS finding is fixed.

## Production identity, privacy, response policy, and PWA

The live root HTML and inspected candidate assets match fresh `dist/` byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `b3f70a8a3f7180bdfa132b7506ccb2af43fc007beacb41e2a1e356a5bceba8be` |
| `assets/index-Bv3AmGK4.css` | `773aaecc0cb6b78049e1c2a12446a5bc56301eb0e28e314f9e7c5d2869adb0c1` |
| `assets/index-oX4eCrPy.js` | `344a6c712ae37837f015cde73e57e5e7fe1e7e44460488a7d71670de2d1aff44` |
| `sw.js` | `7a6a429886e94e0b1e797eb9c77f390d6d115f628bd2136de819ea9e4cde7721` |
| `manifest.webmanifest` | `0d9305b93de5c00b6fbb55b8cb82950fdb0c8ef25abc4d1204a3fd24264f61f3` |

- A normal first-use session requested only `https://mechanism-playground.sociobot.in`; no analytics, third-party fonts, or outbound calls occurred. Source and CSP limit the sole optional outbound endpoint to Sociobot license verification after a user supplies a license.
- Production responses have HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and restrictive self-only CSP. Hashed JS/CSS are `public, max-age=31536000, immutable`; HTML and manifest revalidate; `sw.js` is `no-cache, no-store, must-revalidate`; manifest content type is `application/manifest+json`.
- The PWA service worker controlled scope `/`. After installation, an offline reload rendered the full workshop; the offline event displayed the status banner. Source confirms versioned cache cleanup, `SKIP_WAITING`, `clients.claim`, and the in-app update-toast path.

## Accessibility and responsive evidence

- Desktop: `lang=en`, one `h1`, `main`, title, semantic controls, zero console/page errors, and zero axe serious/critical findings.
- Exact 390×844 mobile with `prefers-reduced-motion: reduce`: no horizontal overflow (`scrollWidth = clientWidth = 390`), no automatic running, Blueprint file was the second Tab stop with a vermilion 3 px visible outline, Enter opened the dialog, axe had zero serious/critical findings, and there were no console/page errors.

## Reverify after remediation

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```
