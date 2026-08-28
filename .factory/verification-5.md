# Independent release verification 5 — FAIL

**Candidate:** `402d7d7eca186ead558fa03d59c753e76e423b57`  
**Production URL:** <https://mechanism-playground.sociobot.in/>  
**Verified:** 2026-08-28 UTC

## Decision

**FAIL — P1 keyboard-only interaction is not end to end.** The deployed site is
the exact production build of the candidate, and the ordinary pointer/touch,
offline, privacy, performance, and responsive paths pass. However, a
keyboard-only player cannot place a selected mechanism part on the drawing
sheet, which prevents the central crank-to-output job from being completed
without a pointer. Focused placed parts also do not select themselves, so their
advertised keyboard controls can operate a different, previously selected part.
This violates the product contract's explicit keyboard requirement and the
accessibility acceptance baseline.

## Defects

### P1 — no keyboard-only path to place or select a mechanism part

**Reproduction on production and the candidate build:**

1. Use Tab/Enter to choose a part in **Parts drawer** (for example, Small
   gear). The button correctly enters its selected state.
2. Continue with the keyboard. `#board` is an SVG with no `tabindex`, therefore
   it is not a tab stop and has no keyboard placement action. Its only placement
   handlers are pointer click/drop handlers. There is no way to add the selected
   part to the board without using a pointer.
3. To isolate the second issue, seed Puzzle 01 with a pointer, add its Small
   gear, then focus the `Hand crank, at …` element (it is exposed as a
   `role=button`). Pressing Enter leaves the selection as `Small gear · 182,
   248 · 0°`; pressing `R` rotates that previously selected small gear instead
   (`Small gear · 172, 272 · 45°`) and refocuses it. The focused crank is not
   operable as a button.

The checked-in browser coverage proves rotation for an already mouse-selected
part, but does not test keyboard-only placement or changing selection between
placed parts. The issue affects the core task rather than a secondary shortcut.

**Required remediation:** make the board a reachable keyboard interaction with
a clear place-at-cursor/center action after a drawer selection, and make each
focusable mechanism part select itself on Enter/Space (or expose it with an
appropriate non-button role). Ensure arrows, R, and Delete act on the focused
or explicitly selected part predictably. Add desktop and 390 px regression
tests that build and solve Puzzle 01 with no pointer input.

### Low — revoked/invalid license notice disappears on later launch

With the license verification endpoint mocked to return
`{ "valid": false, "reason": "invalid" }`, the first launch correctly locks
Forge Edition and says “This license is no longer active…”. A reload uses the
cached invalid verdict (`verifyCalls: 1`, so the once-per-day policy works) but
leaves `#license-status` empty. The paid-unlock contract requires a quiet notice
whenever a cached verdict is invalid. The entitlement remains locked, so this is
not a payment-security bypass.

## Clean local quality gates

The worktree was clean and `HEAD` was the requested candidate before these
verifier-document changes. This static PWA has no library/CLI/backend consumer,
server persistence, concurrency, or health endpoint to test.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 61 packages audited, 0 vulnerabilities. |
| `npm test` | Passed: 8/8 Vitest tests. |
| `npm run build` | Passed: TypeScript `--noEmit` and Vite production build. |
| Lint | No lint script or lint tool is declared. |
| Browser runtime | The initial E2E invocation could not find Playwright 1.62's Chromium revision; `npx playwright install chromium` installed the documented runtime without changing product files. |
| `npm run test:e2e` | Passed: 15 passed, 1 intentional desktop-project skip. |
| Bundle budgets | Passed: JS 24,417 B raw / 8,991 B gzip; CSS 13,701 B raw / 3,674 B gzip; first-run illustration 47,036 B. |

## Functional, PWA, accessibility, and responsive evidence

- Fresh live desktop exercise exposed all 10 primitives and 10 local cards;
  Puzzle 01 solved by snapping a Small gear between crank and bell. Delete and
  Undo recovered the placed mechanism with no console/page errors.
- At 390 x 844, top-level `scrollWidth = clientWidth = 390`. Live Axe scans on
  desktop and 390 px found **zero serious or critical** violations (the
  repository's documented `aria-roledescription` exclusion was retained).
  The page has `lang=en`, one descriptive `title`, exactly one `h1`, and a
  `main`; visible keyboard focus measured a 3 px outline.
- With `prefers-reduced-motion: reduce`, the media query was active and control
  transitions reduced to `0.00001s`; the machine begins paused.
- Boundary placement at the sheet's top-left safely snapped to `Small gear ·
  64, 48 · 0°`. A 251-part imported JSON produced the clear safe-limit error
  and preserved the one-part sheet; malformed JSON produced the clear recovery
  message, preserved the sheet, and the crank remained usable afterward.
- The production worker controlled the page. After clearing Chromium's normal
  HTTP cache, setting the context offline, and reloading, the live workshop
  still rendered 10 tools and 10 cards; the offline banner displayed and no
  console/page error occurred. The passing local regression performs the same
  cold-cache sequence and places a part offline. Source inspection confirms
  content-versioned cache cleanup, `clients.claim`, `SKIP_WAITING`, and the
  in-app update-toast path; no new worker was available to activate during this
  single-version production check.
- Live Lighthouse mobile: **Performance 99**, **Accessibility 100**, LCP
  1.4 s, CLS 0.035, TBT 90 ms.

## Privacy, response policy, and deployment identity

A fresh normal browser session made requests only to
`https://mechanism-playground.sociobot.in`; no analytics, third-party scripts,
fonts, chat, or outbound requests were observed. Source review limits the sole
optional external request to the disclosed Sociobot license verification API
after a license is supplied. The privacy text accurately discloses IndexedDB,
localStorage fallback, export, and the optional license check.

Production returns HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Content-Type-Options: nosniff`, and the expected self-only CSP with only
`https://api.sociobot.in` in `connect-src`. HTML and the manifest revalidate;
hashed JS/CSS are one-year immutable; `sw.js` is no-store; the manifest has
`application/manifest+json` MIME.

Fresh `dist/` bytes exactly match the live deployment:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `42be8dc6948a58f3d7895a2752083dd262dc186b3188f2d7d092bdc45862c18e` |
| `assets/index-3kPtKeFz.js` | `47c2aaa4267f64513a0b4a76f5b86ababda5ae4430d9bcd760df1b47b4185cb0` |
| `assets/index-Bv3AmGK4.css` | `773aaecc0cb6b78049e1c2a12446a5bc56301eb0e28e314f9e7c5d2869adb0c1` |
| `sw.js` | `9ea99c247c9b41a094d195575f2840e5f54a16392bca1f53b34169f7976853bc` |
| `manifest.webmanifest` | `0d9305b93de5c00b6fbb55b8cb82950fdb0c8ef25abc4d1204a3fd24264f61f3` |

## Reverify after remediation

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Then exercise Puzzle 01 at desktop and exactly 390 px using only Tab,
Enter/Space, arrows, R, Delete, and Escape: select a drawer part, place it,
select each placed item, solve the card, and recover with Undo. Repeat the
invalid-license cached-verdict reload and confirm the quiet inactive-license
notice remains visible.
