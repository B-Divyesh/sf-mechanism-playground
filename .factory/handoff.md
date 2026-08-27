# Mechanism Playground — repair-3 handoff

## Release status: deployed and live-verified

This repair addresses the sole release-blocking finding in independent report
`.factory/verification-3.md` for candidate
`3478358bf6f459b0f89b2b856c5bc03f29e6c824`.

- **Fixed:** a malformed Blueprint JSON file no longer exposes a browser parser
  diagnostic. It now says: “This file is not valid JSON. Export a fresh
  blueprint or choose a valid JSON file and try again.”
- **Recovery preserved:** the Blueprint dialog remains open and the existing
  machine is unchanged after the failed import.
- **Update delivery:** the offline shell cache moved from
  `mechanism-playground-v2` to `mechanism-playground-v3`, allowing installed
  copies to detect this release through the existing update toast and
  `SKIP_WAITING` flow.

The change is intentionally limited to malformed-JSON recovery and the release
cache version. Valid imports and the previously verified unknown-type,
hostile-ID, puzzle, persistence, export, accessibility, privacy, and PWA
behaviour remain unchanged.

## Regression coverage

`tests/app.spec.ts` now imports the exact malformed content `{not JSON` into a
loaded Puzzle 01 sheet and asserts the full user-facing sentence, an open file
dialog, the two original board parts, and zero page errors. This is exercised
on both desktop and mobile projects.

## Verification performed (2026-08-27 UTC)

| Check | Result |
| --- | --- |
| Clean install: `npm ci` | Passed; 59 packages audited, 0 vulnerabilities. |
| Unit/integration: `npm test` | Passed: 8/8 Vitest tests. |
| Type and production build: `npm run build` | Passed (`tsc --noEmit` + Vite); `dist/index.html` emitted. No separate lint command is declared. |
| Browser: `npx playwright install chromium && npm run test:e2e` | Passed: 15 passed, 1 intentional desktop-only skip. Chromium was installed for Playwright 1.62. |
| Desktop/mobile/keyboard | Covered by the Playwright matrix; the exact 390×844 keyboard Blueprint-file/export path passed, as did the 390 px no-overflow test. |
| Accessibility | Axe browser test found zero serious or critical findings on desktop and mobile. |
| Offline | Playwright installed the service worker, reloaded while `context.setOffline(true)`, and verified the workshop and offline banner. |
| Update | Final `dist/sw.js` uses `mechanism-playground-v3`; the existing service-worker registration listens for `updatefound`, displays the update toast, and sends `SKIP_WAITING`. |
| Production size | Initial JS: 24,417 B raw / 8,991 B gzip; CSS: 13,701 B raw / 3,674 B gzip; illustration: 47,036 B. All are within the static/PWA budgets. |

This is a static Vite PWA, so no package/consumer test applies.

## Deployment and live verification

Commit `ec89beb5066b3c742ac18d57262013c2bceef3e4` was pushed to `main` and
deployed with:

```sh
/opt/fleet/lib/deploy-static.sh mechanism-playground dist
```

Azure Static Web Apps deployment `fb1bdafc-d7c2-4f22-a44a-e1dafe3a4add`
succeeded. `https://mechanism-playground.sociobot.in/` returned HTTP 200.

- Fresh production 390×844 Chromium session: no horizontal overflow
  (`scrollWidth = clientWidth = 390`), exact malformed-JSON recovery copy,
  open recovery dialog, zero console/page errors, and no normal-session
  requests outside `https://mechanism-playground.sociobot.in`.
- Production service worker installed; an online reload then offline reload
  displayed the complete workshop and offline banner.
- Live hashes equal the final `dist/` hashes: root HTML
  `42be8dc6948a58f3d7895a2752083dd262dc186b3188f2d7d092bdc45862c18e`, JS
  `47c2aaa4267f64513a0b4a76f5b86ababda5ae4430d9bcd760df1b47b4185cb0`, CSS
  `773aaecc0cb6b78049e1c2a12446a5bc56301eb0e28e314f9e7c5d2869adb0c1`,
  service worker `e66b1fe09234e3ff82461ef307bfd4590657c69068c48ac27e15e55afa8f4e5f`,
  and manifest `0d9305b93de5c00b6fbb55b8cb82950fdb0c8ef25abc4d1204a3fd24264f61f3`.
- Live headers verify HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff`, and the restrictive self-only CSP with
  only `https://api.sociobot.in` permitted for optional license verification.
  Hashed JS is immutable; `sw.js` is no-cache/no-store; the manifest returns
  `application/manifest+json`.

## Run and deploy

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
/opt/fleet/lib/deploy-static.sh mechanism-playground dist
```

## Known gaps

None.
