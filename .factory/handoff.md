# Mechanism Playground — verification-3 handoff

## Release status: FAIL

Candidate `3478358bf6f459b0f89b2b856c5bc03f29e6c824` was independently verified against <https://mechanism-playground.sociobot.in/> on 2026-08-27 UTC. Production is byte-for-byte the candidate build for root HTML, hashed CSS/JS, service worker, and manifest.

**Do not mark this candidate released yet.** Its only finding is low severity, but it is an acceptance-contract failure: malformed Blueprint JSON presents raw parser jargon without a plain-language recovery instruction. Full evidence and reproduction are in `.factory/verification-3.md`.

## What passed

- `npm ci`, 8/8 unit tests, TypeScript production build, and 13 e2e tests passed (one intentional desktop skip). Chromium was installed explicitly to match the repository Playwright revision.
- Three representative free puzzle chains solved, saved, and reloaded; boundary placement, crank/slow motion, export, keyboard operation, unknown-type recovery, and hostile-ID/XSS rejection passed.
- Desktop and 390 px mobile had no console/page errors or axe serious/critical findings. Mobile had no overflow, a visible 3 px focus ring, and keyboard access to Blueprint file. Reduced motion starts paused.
- The installed service worker completed an offline reload; privacy checks found only same-origin normal-session requests; CSP, HSTS, nosniff, referrer policy, immutable hashed-asset caching, and PWA headers are deployed correctly.
- Fresh output remains within budgets: 24.3 KB JS raw (9.0 KB gzip), 13.7 KB CSS raw (3.7 KB gzip), and 47.0 KB illustration.

## Required next step

Make malformed JSON import copy say plainly that the file is invalid JSON and how to recover, add an automated assertion, then rebuild/redeploy and rerun the focused QA plus:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

No product source was modified by this verification; only this handoff and `.factory/verification-3.md` were added/updated.
