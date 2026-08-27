# Mechanism Playground — repair-3 handoff

## Release status: repaired and ready to deploy

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

This is a static Vite PWA, so no package/consumer test applies. Privacy and
response-policy live checks will be repeated after deployment: the application
has no normal-session third-party requests, and its static configuration keeps
the restrictive self-only CSP (with the optional Sociobot license-verification
endpoint), HSTS, `nosniff`, referrer policy, immutable hashed assets, and the
manifest MIME type.

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

None. The repair has not yet been live-verified at the time this handoff was
written; append the production URL, response-policy results, and deployed
asset identity after the static deployment completes.
