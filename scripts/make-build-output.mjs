/**
 * make-build-output.mjs — assemble the Cloudflare Build Output Specification
 * (.cloudflare/output/v0/) from the static Astro build in ./dist.
 *
 * Why: `cf build`/`cf deploy` auto-detect Astro and run `astro build` — but
 * Astro 6+ "does not build with cf during the beta" (the framework integration
 * cannot produce the v0 Build Output for our pure-static site). `--prebuilt`
 * skips framework detection entirely, so we produce the spec ourselves:
 *
 *   .cloudflare/output/v0/
 *   ├── config.json                          → { buildContext }
 *   └── workers/default/
 *       ├── worker.config.json               → name / compatibilityDate / domains
 *       └── assets/                          ← ./dist (site root, incl. pagefind)
 *
 * Verified against the output `cf build` produces for a framework-less static
 * site (2026-10, cf 1.0.0-beta.12).
 */
import { cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}.cloudflare/output/v0`;

// keep in sync with cloudflare.config.ts
const worker = {
	name: 'blog',
	compatibilityDate: '2026-10-04',
	observability: { enabled: true },
	domains: ['blog.g36maid.dev'],
};

await rm(out, { recursive: true, force: true });
await mkdir(`${out}/workers/default`, { recursive: true });

await writeFile(
	`${out}/config.json`,
	JSON.stringify({ buildContext: { isPreview: false } }),
);

await writeFile(`${out}/workers/default/worker.config.json`, JSON.stringify(worker));

// static site → ./dist is the entire asset tree (pages, _headers, pagefind, fonts)
await cp(`${root}dist`, `${out}/workers/default/assets`, { recursive: true });

console.log(`[make-build-output] Build Output written to .cloudflare/output/v0`);
