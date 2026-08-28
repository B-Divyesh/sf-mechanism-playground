import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const PRECACHE_ASSETS_PLACEHOLDER = '__PRECACHE_APP_ASSETS__';
const CACHE_VERSION_PLACEHOLDER = '__CACHE_VERSION__';

/**
 * Vite fingerprints the app entrypoints at build time. Derive the service
 * worker's install cache from the generated HTML so an offline first reload
 * never depends on the browser's ordinary HTTP cache.
 */
function precacheBuiltAppAssets(): Plugin {
  return {
    name: 'precache-built-app-assets',
    apply: 'build',
    async closeBundle() {
      const dist = resolve(process.cwd(), 'dist');
      const index = await readFile(resolve(dist, 'index.html'), 'utf8');
      const appAssets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)]
        .map((match) => match[1]);

      if (appAssets.length === 0) throw new Error('Could not find built JavaScript and CSS assets to precache.');

      const serviceWorkerPath = resolve(dist, 'sw.js');
      const serviceWorker = await readFile(serviceWorkerPath, 'utf8');
      if (!serviceWorker.includes(PRECACHE_ASSETS_PLACEHOLDER) || !serviceWorker.includes(CACHE_VERSION_PLACEHOLDER)) {
        throw new Error('Service worker precache placeholders are missing.');
      }

      const cacheVersion = `mechanism-playground-${createHash('sha256')
        .update(serviceWorker)
        .update(index)
        .update(appAssets.join('|'))
        .digest('hex')
        .slice(0, 12)}`;
      await writeFile(
        serviceWorkerPath,
        serviceWorker
          .replace(CACHE_VERSION_PLACEHOLDER, cacheVersion)
          .replace(PRECACHE_ASSETS_PLACEHOLDER, appAssets.map((asset) => `'${asset}'`).join(',\n  '))
      );
    }
  };
}

export default defineConfig({
  plugins: [precacheBuiltAppAssets()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false
  }
});
