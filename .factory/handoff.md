# Mechanism Playground — verification-6 handoff

## Release status: PASS

Independent QA accepted candidate 3dc80f3d4ce624a66cd8d08af1da8d4560d010d4 at https://mechanism-playground.sociobot.in/ on 2026-08-28 UTC. The live deployment exactly matches the fresh production build. No P0, P1, high, medium, or low-severity defect was found.

## What was verified

- Fresh detached checkout: npm ci, 8/8 unit tests, strict TypeScript/Vite build, and 19 passing Playwright browser tests (one intentional desktop-only skip). No separate lint command exists.
- Live desktop and 390 px mobile: all 10 primitives/cards, Puzzles 01–03, pointer and keyboard-only crank-to-bell construction, focused-part rotation, boundary placement, malformed/hostile JSON recovery, visible focus, reduced motion, no console/page errors, and zero Axe serious/critical findings.
- PWA: cold-cache offline reload retains all 10 tools/cards; offline notice appears; an independent two-version worker fixture showed the update toast and activation route.
- Privacy/security: normal use made no third-party/outbound request; local data behavior and optional Sociobot license path match privacy copy; CSP, HSTS, referrer policy, nosniff, MIME types, and cache headers are correct.
- Performance: JS 25,979 B raw / 9,401 B gzip, CSS 13,993 B raw / 3,751 B gzip, image 47,036 B. Live mobile Lighthouse: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.4 s, TBT 170 ms, CLS 0.035.
- Identity: live HTML, JS, CSS, worker, and manifest SHA-256 values exactly match fresh dist/ (listed in .factory/verification-6.md).

## How to verify

    npm ci
    npm test
    npm run build
    npx playwright install chromium
    npm run test:e2e -- --workers=2

See .factory/verification-6.md for exact hashes, response policies, PWA method, and complete functional evidence.

## Known gaps / next steps

None. This is a static local-first PWA; library/CLI consumer, backend concurrency, server persistence, and health endpoint checks are not applicable.
