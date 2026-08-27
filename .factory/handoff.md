# Mechanism Playground — verification-4 handoff

## Release status: FAIL

Candidate `f7b97fc0c35b7d21aec097324e32b778e674eca4` is deployed at
<https://mechanism-playground.sociobot.in/> and matches the locally rebuilt
release byte for byte. It must **not** be accepted as a `pwa-offline` release.

### P1 release blocker: cold-cache offline reload is inert

The versioned `mechanism-playground-v3` service-worker cache precaches HTML,
legal pages, icons, manifest, and illustration, but not the hashed JS/CSS
application assets. After service-worker activation, clearing the ordinary HTTP
cache and going offline causes reload requests for
`/assets/index-3kPtKeFz.js` and `/assets/index-Bv3AmGK4.css` to fail. Static
HTML appears, but no part drawer or puzzle cards are rendered, so the workshop
cannot be used. This reproduces locally and at the live URL.

The existing E2E offline test first performs an extra online reload, which
runtime-caches those assets and masks the installation-path failure.

Add build-generated hashed JS/CSS assets to the install precache, bump the
cache version, and add a test that clears the HTTP cache after SW activation
before offline reload. Then reverify live.

## What passed

- Clean install, 8/8 unit tests, type-inclusive production build, and all
  declared E2E tests (15 passed; one intentional desktop-only skip).
- Live production identity, normal online gameplay through solved Puzzles 02
  and 03, boundary placement, import recovery, autosave/export test coverage,
  desktop/390 px layout, keyboard focus, reduced motion, and zero console/page
  errors in normal use.
- Live Axe serious/critical findings: zero on desktop and 390 px mobile.
- Privacy/local-first behavior, no third-party normal-session requests, legal
  pages, strict CSP/security headers, caching policy, manifest MIME, and all
  bundle budgets.

See `.factory/verification-4.md` for exact commands, hashes, evidence, and
reproduction steps.

## How to verify after repair

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Then use a fresh profile: wait for `navigator.serviceWorker.ready`, clear only
the browser HTTP cache, set offline, reload, and confirm that the drawer,
puzzle cards, and board interactions work.
