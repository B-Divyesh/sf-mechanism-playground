# Mechanism Playground — verification-5 handoff

## Release status: FAIL — keyboard-only core flow is blocked

Independent verification of candidate
`402d7d7eca186ead558fa03d59c753e76e423b57` at
<https://mechanism-playground.sociobot.in/> found a P1 accessibility/function
defect. A keyboard-only player can select a drawer part but cannot reach or
operate the SVG drawing sheet to place it; the core crank-to-output task cannot
therefore be completed without a pointer. Focused placed `role=button` parts
also do not select themselves on Enter/Space, causing R/Delete/arrows to act
on a previously selected part. Do not release this candidate until that path is
fixed and covered by an end-to-end keyboard test. See
`.factory/verification-5.md` for exact reproduction and the additional
low-severity cached-invalid-license notice defect.

All other checks were successful: clean install; 8/8 unit tests; production
build; 15 Playwright passes (one intentional skip); cold-cache offline reload;
desktop and 390 px Axe with zero serious/critical findings; no normal-session
third-party requests or browser errors; Lighthouse mobile 99 performance/100
accessibility; and byte-for-byte live/candidate identity. The PWA repair
described below remains verified, but it does not remedy the keyboard blocker.

---

## Release status: deployed and verified

This repair resolves the P1 cold-cache offline failure reported in
`.factory/verification-4.md` for candidate
`f7b97fc0c35b7d21aec097324e32b778e674eca4`.

Vite now derives the service-worker precache entries from the final generated
`dist/index.html`, so the service worker always installs the fingerprinted JS
and CSS that bootstrap the workshop. The generated cache name is content-based
(`mechanism-playground-e359a476ff4d` for the verified build). The worker uses
its own versioned cache with `ignoreVary` for same-origin precached resources;
this prevents a host-added `Vary: Origin` response header from defeating an
otherwise valid install-time cache entry. Existing update behavior remains:
old caches are deleted on activation, `clients.claim()` is retained, and
`SKIP_WAITING` still supports the in-app update toast.

## Regression coverage

`tests/app.spec.ts` now performs the verifier's exact cold-cache sequence in
both declared Playwright projects:

1. load online and wait for a controlling service worker;
2. clear only Chromium's ordinary HTTP cache with CDP;
3. set the context offline and reload;
4. assert all 10 part tools and all 10 puzzle cards render; and
5. place a small gear on the board and verify the placed part is usable.

This catches the prior false pass, where an extra online reload populated a
runtime cache before the offline assertion.

## Verification performed

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 61 packages audited, 0 vulnerabilities. |
| `npm test` | Passed; 8/8 Vitest unit tests. |
| `npm run build` | Passed; TypeScript `--noEmit` plus Vite production build, with `dist/index.html` at its root. |
| `npm run test:e2e -- --workers=4` | Passed; 15 tests across desktop and Pixel 5/390 px, with 1 intentional desktop-only mobile-keyboard skip. Axe serious/critical scan is included and passed. |
| Cold-cache offline regression | Passed independently on desktop and mobile: Cache Storage held both hashed app assets after installation; after HTTP-cache clear and offline reload, 10 tools, 10 cards, and offline part placement all worked with no failed requests. |
| Keyboard/mobile/reduced motion | Covered by the existing desktop/mobile suite: 390 px overflow, Blueprint-file keyboard path, rotation/undo, and the product's reduced-motion behavior remain passing. |
| Import/security recovery | Existing suite passed hostile quoted-ID rejection, unknown-part recovery, malformed JSON recovery, and prior-board preservation. |
| Privacy/response policy | Source/build inspection and live request capture confirmed no normal-session third-party assets; CSP only permits the documented optional Sociobot license endpoint, immutable `/assets/*` and `/icons/*`, no-store `sw.js`, and manifest MIME policy remain in `dist/staticwebapp.config.json`. |

Verified build sizes: JS 24,417 B raw / 8,991 B gzip; CSS 13,701 B raw /
3,674 B gzip; illustration 47,036 B. All are within the static-PWA budgets.
There is no package/consumer artifact for this static PWA.

## Deploy and live verification

Deployment used `/opt/fleet/lib/deploy-static.sh mechanism-playground dist` and
completed successfully to <https://mechanism-playground.sociobot.in/>. The
repair commits are `e40f0b1d1a1fe3c349325e4636fc00f268c5650b` and the final
handoff-evidence commit below.

`verify-url.sh` completed against production with HTTP 200, a 991 ms browser
load, no console/page errors, the expected title and `lang=en`, one `<h1>`, a
`<main>`, and no missing image alt text or unlabeled buttons. Live headers
confirm HSTS, the restrictive self-only CSP, `Referrer-Policy`, `nosniff`,
one-year immutable app-asset caching, no-store service-worker caching, and
`application/manifest+json` for the manifest.

The live output exactly matches the verified build:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `42be8dc6948a58f3d7895a2752083dd262dc186b3188f2d7d092bdc45862c18e` |
| `assets/index-3kPtKeFz.js` | `47c2aaa4267f64513a0b4a76f5b86ababda5ae4430d9bcd760df1b47b4185cb0` |
| `assets/index-Bv3AmGK4.css` | `773aaecc0cb6b78049e1c2a12446a5bc56301eb0e28e314f9e7c5d2869adb0c1` |
| `sw.js` | `9ea99c247c9b41a094d195575f2840e5f54a16392bca1f53b34169f7976853bc` |

Fresh live desktop and 390×844/reduced-motion profiles each showed only the
same-origin production host in normal requests. In each profile, the installed
cache held the hashed JS and CSS; after DevTools HTTP-cache clear and offline
reload, all 10 tools and all 10 cards rendered, a small gear could be placed,
there was no overflow, motion stayed paused, and no console/page error occurred.

## Known gaps / next steps

None known.
