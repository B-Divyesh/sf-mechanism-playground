# Independent release verification 4 — FAIL

**Candidate:** `f7b97fc0c35b7d21aec097324e32b778e674eca4`  
**Production URL:** <https://mechanism-playground.sociobot.in/>  
**Verified:** 2026-08-27 UTC

## Decision

**FAIL — P1 offline-PWA defect.** The production deployment is exactly the
candidate built locally, and the normal online product is functional. However,
the advertised offline workshop is not reliably usable after service-worker
installation: the service worker precaches HTML and static images but omits the
hashed JavaScript and CSS app assets. With the normal HTTP cache cleared, an
offline reload renders only the inert HTML shell; there are no part tools,
puzzle cards, or working app logic. This violates the `pwa-offline` artifact
contract and the required offline-reload acceptance check.

## Release-blocking defect

### P1 — service worker does not precache the application bundle

**Reproduction, on the candidate build and production:**

1. Open the app online in a fresh Chromium profile and wait for
   `navigator.serviceWorker.ready` (the client is controlled).
2. Clear only Chromium's ordinary HTTP browser cache using DevTools Protocol
   `Network.clearBrowserCache`; leave Cache Storage intact.
3. Set the context offline and reload.

**Observed Cache Storage (`mechanism-playground-v3`):** `/`, `/index.html`,
manifest, offline/legal pages, illustration, and icons only. It contains neither
`/assets/index-3kPtKeFz.js` nor `/assets/index-Bv3AmGK4.css`.

**Observed production result:** requests for those two assets fail with
`net::ERR_FAILED`; static HTML still shows one `h1`, but the app has
`partTools: 0` and `puzzleCards: 0`. It is not a usable offline workshop.
There are no JavaScript page errors because the bundle never loads.

The checked-in E2E offline test reloads online once after service-worker
readiness, which fills the runtime asset cache, before it goes offline. That
does not cover this cold-cache installation/reload case.

**Required remediation:** add the final hashed JS and CSS assets to the
versioned install precache (prefer build-generated precache input rather than
hard-coding hashes), then verify an offline reload immediately after install
with the HTTP cache cleared. Keep the existing version bump, `skipWaiting`,
`clients.claim`, and in-app update toast behavior.

## Clean local quality gates

The checkout was clean and `HEAD` matched the candidate before these
verification-document changes.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 59 packages audited, 0 vulnerabilities. |
| `npm test` | Passed: 8/8 Vitest tests. |
| `npm run build` | Passed: `tsc --noEmit` and Vite build; `dist/` emitted. No separate lint command/tool is declared. |
| `npx playwright install chromium` | Passed for repository Playwright 1.62.1 (Chromium v1234). |
| `npm run test:e2e` | Passed: 15 passed, 1 intentional desktop-only skip. This covers both declared desktop and mobile projects. |
| Bundle budgets | Passed: JS 24,417 B raw / 8,991 B gzip; CSS 13,701 B raw / 3,674 B gzip; illustration 47,036 B. All are within 200 KB JS, 50 KB CSS, and 300 KB image budgets. |

This is a static PWA, not a library, CLI, or backend; no package-consumer,
concurrency, persistence-server, or health/build-identity test applies.

## Product exercise

Fresh live Chromium exercise, with no console or page errors:

- The drawer exposes all ten primitives and the notebook exposes all ten local
  cards. The age label is present (`ages 10+`).
- Built Puzzle 02 by placing large gear at `(200,248)` and small gear at
  `(286,248)` between the starter crank and bell: `Solved · Gear train. The
  bell has power!`.
- Built Puzzle 03 with cam at `(189,248)` and follower at `(268,248)`:
  `Solved · Lift off. The bell has power!`.
- Boundary placement at the top-left snapped to the announced
  `Hand crank · 64, 48 · 0°`; the canvas stayed usable.
- The checked-in E2E suite additionally passes Puzzle 01 persistence through
  reload, keyboard rotation/undo, export filename, malformed JSON recovery,
  unknown part-type recovery, and hostile quoted-ID rejection before SVG
  rendering.
- The invalid-import UI preserves the current sheet and uses plain recovery
  language. The prior malformed JSON issue is fixed.

## Accessibility, responsive, and motion checks

- Live desktop (1440 px) and 390 x 844 mobile Axe Playwright scans found **0
  serious or critical violations** (with only the app's documented
  `aria-roledescription` exclusion).
- The live page has `lang=en`, a descriptive title, exactly one `h1`, and one
  `main`. No console/page errors occurred in normal exercise.
- At exactly 390 px with `prefers-reduced-motion: reduce`,
  `scrollWidth = clientWidth = 390`; the crank starts paused. The second Tab
  stop is the visible `Blueprint file` control; its designed focus is a 3 px
  vermilion outline plus cream ring, and Enter opens its dialog.
- Source review confirms versioned service-worker cache cleanup,
  `SKIP_WAITING`, `clients.claim`, and an update-toast listener. The cold-cache
  offline failure above prevents a PWA pass despite those update mechanisms.

## Privacy, production identity, and response policy

The deployed release matches the candidate's fresh `dist/` byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `42be8dc6948a58f3d7895a2752083dd262dc186b3188f2d7d092bdc45862c18e` |
| `assets/index-3kPtKeFz.js` | `47c2aaa4267f64513a0b4a76f5b86ababda5ae4430d9bcd760df1b47b4185cb0` |
| `assets/index-Bv3AmGK4.css` | `773aaecc0cb6b78049e1c2a12446a5bc56301eb0e28e314f9e7c5d2869adb0c1` |
| `sw.js` | `e66b1fe09234e3ff82461ef307bfd4590657c69068c48ac27e15e55afa8f4e5f` |
| `manifest.webmanifest` | `0d9305b93de5c00b6fbb55b8cb82950fdb0c8ef25abc4d1204a3fd24264f61f3` |

- A normal fresh session requested only
  `https://mechanism-playground.sociobot.in`; no analytics, third-party
  scripts, fonts, or outbound requests appeared. The only permitted optional
  outbound destination is the disclosed Sociobot license verification endpoint
  after a user supplies a license.
- The privacy page accurately describes IndexedDB/localStorage, export, and
  the optional license check. Privacy and terms both return 200.
- Production sends HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff`, and a self-only CSP that allows only
  `https://api.sociobot.in` for `connect-src`. Hashed JS/CSS/assets are
  immutable for one year; HTML/manifest revalidate; `sw.js` is
  `no-cache, no-store, must-revalidate`; manifest MIME is
  `application/manifest+json`.

## Reverify after repair

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Add a browser test that clears the ordinary HTTP cache after service-worker
activation, then asserts an offline reload contains the part drawer and puzzle
cards and can place a part. Recheck the same sequence at the live URL.
