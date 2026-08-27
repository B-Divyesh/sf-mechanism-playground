# Mechanism Playground — repair-2 handoff

## Release status

This repair resolves both findings in independent verifier report
`07263c1e2bf5df14b57acfc3245275dbc6861bbe` for candidate `ff07db21`.
The Standard static deployment is built from this repaired `main` worktree;
the final production identity check is recorded below after deployment.

## What changed

- At 390 px, the top bar now retains a visible **Blueprint file** button
  rather than reducing it to an ambiguous icon. It remains a 44 px-or-larger
  touch target, accepts keyboard focus, and opens the local import/export
  dialog with Enter.
- Added a Pixel 5 / exact 390 px keyboard regression: Tab reaches Blueprint
  file, Enter opens the dialog, and Enter on Export downloads a dated JSON
  blueprint. The existing malicious-ID and unsupported-type import recovery
  regressions continue to run in the mobile project.
- The pre-existing import hardening remains in place: part IDs/types are
  validated before state mutation and imported SVG uses DOM APIs rather than
  markup concatenation.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Clean verification on 2026-08-27 UTC:

- `npm ci`: passed; 59 packages audited, 0 vulnerabilities.
- `npm test`: **8/8** passed.
- `npm run build`: passed. The emitted initial JS is 24.29 KB raw / 8.95 KB
  gzip and CSS is 13.70 KB raw / 3.67 KB gzip.
- `npm run test:e2e`: **13 passed, 1 intentionally skipped**. The skipped
  instance is the desktop copy of the mobile-only keyboard regression. The
  suite covers desktop/mobile browser smoke, 390 px overflow, axe
  serious/critical findings, keyboard export, hostile and unknown-part import
  recovery, persistence, and service-worker offline reload.

## Deployment identity and PWA

The target is the existing Standard Azure Static Web App
`sf-mechanism-playground` (`mechanism-playground.sociobot.in`). After deploy,
compare the production root document and every referenced hashed JS/CSS asset
with a clean local `dist/` build before accepting the release. This prevents
the concurrent-deployment mismatch reported by verifier-2. `sw.js` remains
no-cache while hashed assets are immutable; the service-worker offline reload
is covered by the browser suite.

## Known limits

The deterministic model teaches motion paths; it deliberately omits physical
force, collision, stress, CAD export, multiplayer, and markets. Billing
registration/return URL configuration remains a factory deployment task; no
payment secret is committed.
