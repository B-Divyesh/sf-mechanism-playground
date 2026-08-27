# Independent release verification — FAIL

**Candidate:** `9513ff036eb485b16571d6c9feacb8f006fa9466` (`main` at start of
verification)  
**Production URL:** https://mechanism-playground.sociobot.in/  
**Verified:** 2026-08-27 UTC

## Decision

**FAIL — do not release this candidate.** A crafted blueprint imported through
the advertised local JSON import feature can execute arbitrary JavaScript in
the app origin when the imported part is clicked. This is a high-severity DOM
XSS vulnerability in an end-user input/recovery path.

## Defects

### High — H1: imported blueprint ID is executable DOM injection

`validatePlayground` accepts every string as `part.id` (`src/storage.ts`), and
`renderBoard` interpolates that ID unescaped into an `innerHTML` template
(`src/app.ts`). A shared/imported JSON file can therefore close the
`data-part-id` attribute and supply an event handler. On this exact production
build, I imported a valid `gearSmall` record whose ID supplied a harmless
`onclick` handler, clicked the imported part, and observed the handler's
test-only `data-qa-executed=yes` effect on `<body>`.

Impact: opening a blueprint received from a teacher, student, or the web can
run attacker JavaScript under `mechanism-playground.sociobot.in`, with access
to its local blueprints and license token. The live response has no
`Content-Security-Policy`, so there is no deployed mitigation for inline event
handlers.

Fix before release: treat imported data as untrusted; validate IDs against a
strict UUID/allowed-character format and `type` against `PART_TYPES`; render
with DOM/SVG creation APIs or attribute escaping rather than concatenated
`innerHTML`; add a restrictive CSP that disallows inline script/event handlers.
Add an automated regression test with quote-containing IDs and an attempted
event attribute.

### Medium — M1: unknown imported part types are accepted and corrupt the
current render

The same validator only checks `typeof part.type === 'string'`. Importing
`{"type":"not-a-part"}` passes validation, then produces the technical UI
error `Cannot read properties of undefined (reading 'ports')` while rendering.
There is no browser `pageerror`, but the import leaves stale UI until the user
closes the dialog and chooses **Clear**; that recovery was manually confirmed.
The importer must reject this file before mutating application state and show a
plain-language error.

### Low — L1: production cache policy misses the static-asset policy

The deployed fingerprinted JS and CSS each return
`Cache-Control: public, must-revalidate, max-age=30`, not a long-lived
immutable policy. The service worker makes repeat/offline use work, but this
does not meet the specified immutable caching expectation for hashed static
assets. Configure immutable, long-lived cache headers for `/assets/*` and
icons; retain short/no-cache behaviour for HTML and `sw.js`.

## Evidence: clean build and repository checks

The checkout was clean before verification and `git rev-parse HEAD` returned
the candidate SHA above.

| Check | Fresh result |
| --- | --- |
| `npm ci` | Passed; 59 packages audited, 0 vulnerabilities |
| `npm test` | Passed: 3/3 Vitest engine tests |
| `npm run build` | Passed: TypeScript check and Vite build; `dist/` emitted |
| `npm run test:e2e` | Passed: 8/8 Chromium tests after `npx playwright install chromium` (desktop and Pixel 5) |
| Lint/type scripts | No lint script/tool is declared; `npm run build` runs `tsc --noEmit` |

Fresh build output: JS 23,106 bytes raw / 8,540 gzip; CSS 13,587 bytes raw /
3,650 gzip; illustration 47,036 bytes. All are below the 200 KB JS, 50 KB
CSS, and 300 KB image budgets.

## Evidence: independent product exercise

- On production, Puzzle 01 was opened, a small gear placed at its snap point,
  and it became `Solved · First turn. The bell has power!`; the selected gear
  rotated to 45 degrees by keyboard `R`; Turn crank changed to Pause and
  paused correctly.
- Boundary placement at the top-left and bottom-right stayed clamped/snap-safe
  (`Hand crank, at 64, 48`; `Bell, at 736, 448`).
- Malformed JSON stayed in the import dialog with a readable parse error. A
  normal exported blueprint downloaded as a 272-byte dated JSON file. The
  invalid-type case above is the failing recovery path.
- Restore with a non-valid license was intercepted to the documented billing
  endpoint and displayed `This license is no longer active...`; it did not
  unlock paid puzzles. No billing request is made on a normal first visit.
- A fresh normal production visit made requests only to the same-origin HTML,
  JS, CSS, and product illustration. There were no third-party, analytics, or
  console/page-error requests. The only product outbound endpoint in source is
  the documented Sociobot license verification after an optional license action.

## Evidence: UX, accessibility, PWA, and performance

- Desktop and 390×844 reduced-motion smoke tests had no horizontal overflow;
  the keyboard's first Tab reached the visible Skip to workbench link and its
  computed focus outline was 3 px. Reduced motion reduced transitions to
  `0.01ms` and did not start the crank.
- Independent axe scans on production desktop and 390 px mobile found zero
  serious or critical findings. Production browser exercise recorded zero
  console errors and zero `pageerror`s. The checked-in suite independently
  covers both viewports, keyboard rotation/undo, persistence, axe, and offline
  reload.
- The live service worker controlled the production page at scope `/`; after
  installation, offline reload displayed Mechanism Playground and the offline
  banner. A separate temporary two-version service-worker fixture verified the
  candidate's actual update path: changing `sw.js` produced a waiting worker
  and visible `A fresh workshop is ready` update toast. Source inspection also
  confirms `SKIP_WAITING`, cache cleanup, and `clients.claim`.
- Lighthouse 12.8.2 mobile production run: Performance 99, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1.4 s, CLS 0.035, TBT 150 ms, Speed Index
  1.0 s.
- Live response headers included HSTS, `Referrer-Policy:
  strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.
  They lacked CSP and long-lived immutable asset caching (L1); the manifest was
  served as `application/octet-stream`.

## Deployment identity

Production is the tested candidate, not a stale deployment. The live root
HTML SHA-256 was identical to the fresh `dist/index.html`:
`1fe446e834f0b21a0f7a2615e4240c4fae618c9e5bee4f837b3b449343ec44d3`.
All inspected published artifacts also matched their fresh-build counterparts
byte-for-byte: JS, CSS, illustration, service worker, manifest, offline,
privacy, terms, and all three icons.

## Reproduce

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

For H1, import a JSON document with `version: 1`, a known type such as
`gearSmall`, and a quote-containing part ID that adds a harmless test-only
event attribute; inspect the rendered SVG and click the part. Do not use this
method against a public deployment except for authorized QA.
