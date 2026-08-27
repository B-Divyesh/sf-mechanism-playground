# Mechanism Playground — repair handoff

## Release status

Repair candidate for QA report `7e767373043f24f23969bc6d020e41eb1ce906c5`.
This change fixes the unsafe blueprint-import path, unknown-part recovery, and
static caching policy while retaining the deterministic simulator, local-first
storage, and installable PWA behaviour.

## What changed

- Blueprint input is treated as untrusted data. Part IDs must match a compact
  `[A-Za-z0-9_-]` identifier, are unique, and are limited to 250 parts.
- Imported part types must be one of the ten supported `PART_TYPES`. An unknown
  type is rejected before state changes with a plain-language recovery message
  in the still-open Blueprint file dialog.
- Saved IndexedDB records now use the same validation as imports.
- The board now creates SVG nodes and attributes with DOM APIs. Imported IDs are
  data attributes only; they are never concatenated into SVG/HTML markup or
  CSS selectors.
- Added exact unit and Playwright regressions for the quote/event-attribute ID
  payload and an `not-a-part` type. The browser regressions also confirm no
  page errors, no state mutation, and continued crank operation after rejection.
- Added a restrictive CSP (HTTP header for Azure Static Web Apps, plus a local
  document policy) that disallows inline scripts/event handlers. It permits
  only same-origin resources and the documented optional Sociobot license API.
- Added `staticwebapp.config.json`: fingerprinted `/assets/*` and icons receive
  `Cache-Control: public, max-age=31536000, immutable`; HTML defaults to
  revalidation and `sw.js` is explicitly no-cache. The service-worker cache was
  bumped to `v2` so installed clients receive the repaired shell.
- On small screens, Blueprint file remains reachable as a compact 44 px icon,
  preserving mobile import/export recovery.

## Run and verify

```sh
npm ci
npm test
npm run build
npx playwright install chromium   # once on a new worker
npm run test:e2e
npm run preview
```

Clean verification on 2026-08-27 UTC:

- `npm ci`: passed; 59 packages audited, 0 vulnerabilities.
- `npm test`: **6/6** passed (engine and exact import validation).
- `npm run build`: passed; `dist/` includes the Azure Static Web Apps config.
  Initial JS is 24.27 KB raw / 8.93 KB gzip; CSS is 13.67 KB raw / 3.68 KB
  gzip, both well within budget.
- `npm run test:e2e`: **12/12** passed across Desktop Chrome and Pixel 5.
  This covers the simulator/puzzle path, keyboard/undo/persistence, mobile
  overflow, axe serious/critical, service-worker offline reload, and both
  import regressions.
- Mobile Lighthouse against the clean production build: Performance **100**,
  Accessibility **100**, Best Practices **100**, SEO **100**; LCP 1.5 s,
  CLS 0.035, TBT 0 ms.

## Deployment

Deploy as Standard Azure Static Web Apps from `dist/`:

```sh
/opt/fleet/lib/deploy-static.sh mechanism-playground /work/repo/dist
```

After deploy, verify `https://mechanism-playground.sociobot.in/` with
`/opt/fleet/lib/verify-url.sh` and inspect headers for CSP, immutable
`/assets/` and `/icons/`, and no-cache `sw.js`.

## Known limits

- The deterministic model teaches motion paths; it deliberately omits physical
  force, collision, stress, CAD export, multiplayer, and markets.
- Real-user Core Web Vitals are unavailable before traffic. The recorded values
  are a clean local Lighthouse lab run.
- Sociobot billing registration/return URL remains a factory deployment task;
  no payment secrets are committed.
