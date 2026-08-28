# Mechanism Playground — repair-4 handoff

## Release status: repaired and ready to deploy

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
| Privacy/response policy | Source/build inspection confirmed no normal-session third-party assets; CSP only permits the documented optional Sociobot license endpoint, immutable `/assets/*` and `/icons/*`, no-store `sw.js`, and manifest MIME policy remain in `dist/staticwebapp.config.json`. |

Verified build sizes: JS 24,417 B raw / 8,991 B gzip; CSS 13,701 B raw /
3,674 B gzip; illustration 47,036 B. All are within the static-PWA budgets.
There is no package/consumer artifact for this static PWA.

## Deploy and live verification

Deploy `dist/` with `/opt/fleet/lib/deploy-static.sh mechanism-playground dist`.
Post-deploy evidence and the final commit SHA are recorded below once the
production upload completes.

## Known gaps / next steps

None known. The static deployment and live URL verification are the remaining
handoff steps at the time this file was written.
