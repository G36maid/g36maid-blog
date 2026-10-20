# AGENTS.md — blog.g36maid.dev

Tech blog (zh-Hant) on Astro 7, deployed to Cloudflare Workers as a pure
static site. Design language: lain CRT × R6 tactical UI × G36 gold.

## Development

```sh
pnpm dev        # astro dev — use background mode: `astro dev --background`
                # manage with: astro dev stop | status | logs
pnpm build      # astro build && pagefind --site dist
pnpm deploy     # pnpm build → assemble Build Output → cf deploy --prebuilt
```

- Dev server needs **no `astro.config` changes**; `pnpm build` requires the
  `mmdr` binary on PATH (see Mermaid below) — build fails-safe (keeps the code
  block, warns) if it is missing, so a missing mmdr silently degrades diagrams.
- Pagefind index exists only after `pnpm build`; the ⌘K search modal shows a
  dev-mode hint until then.

## Deploy pipeline — order matters

1. `astro build` → `dist/`
2. `pagefind --site dist` (search index)
3. `scripts/make-build-output.mjs` → assembles `.cloudflare/output/v0/`
   (Build Output Spec) from `dist/`
4. `cf deploy --prebuilt` → uploads assets + attaches `blog.g36maid.dev`

**Never run plain `cf build` / `cf deploy`** (without `--prebuilt`): cf
auto-detects Astro and runs `astro build` itself, but "Astro 6+ does not build
with cf during the beta" (its autoconfig cannot produce the v0 Build Output
for Astro 7). Hence `scripts/make-build-output.mjs` — the format was verified
against what `cf build` emits for a framework-less static site.

Cloudflare config lives in `cloudflare.config.ts` (worker `blog`,
`domains: ["blog.g36maid.dev"]`) + `wrangler.config.ts`
(`assetsDirectory: "./dist"`). cf reads these; it ignores wrangler.jsonc/toml.
The legacy Pages project was deleted — deployment is a Workers assets-only
Worker. Live site: https://blog.g36maid.dev (account a3ce3a0ebee662a88c793e3971dc282c).

### Cloudflare auth profiles

Two accounts exist on this machine:

- `default` = g36_maid@proton.me — **owns no zones**
- `miku` = personal Gmail (address scrubbed from repo) — owns `g36maid.dev`; **bound to this
  directory** (`cf auth activate miku` was run), so bare `cf …` commands here
  already hit the right account. CI (`.github/workflows/deploy.yml`) instead
  uses `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets and pins
  `cf@1.0.0-beta.12`.

## Markdown pipeline — Astro 7 Sätteri trap

Astro 7 defaults to the Rust Sätteri processor, which cannot run JS
remark/rehype plugins. `astro.config.mjs` therefore sets
`markdown.processor: unified({ … })` from `@astrojs/markdown-remark`.
Plugin order is significant:

- remark: `remark-gfm` → `remark-emoji` → `remark-math`
  (`singleDollarTextMath: false`) → `remark-github-blockquote-alert`
- rehype: `rehypeHeadingIds` (must be first) → `rehype-katex` → `rehype-mmdr`

Consequences:

- **Inline math is `$$…$$` only** — single `$` is disabled on purpose (CJK
  text like「特價$100」would be misparsed as formulas).
- `syntaxHighlight.excludeLangs: ['mermaid', 'math']` must stay, otherwise
  Shiki/Expressive Code eat mermaid/math fences before the plugins run.
- Expressive Code is dark-only (`useDarkModeMediaQuery: false`) — the whole
  site is dark-only by design; do not add a light theme casually.

## Mermaid = mmdr (pure Rust, no browser)

`src/plugins/rehype-mmdr.ts` renders ` ```mermaid ` fences at build time by
piping each diagram into the `mmdr` binary (v0.3.1, AUR `mmdr-bin` / `cargo
install mermaid-rs-renderer`). Theme tokens live in `mermaid-dark.json`
(`fontSize` there must be a bare number, not `"15px"`). Do NOT introduce
Playwright/Chromium-based mermaid rendering — this machine deliberately has
no Chromium. CI installs the prebuilt mmdr binary from GitHub releases.

## Content model

- Collections (`src/content.config.ts`): `post` (articles) and `note`
  (short memos), glob-loaded from `src/content/{post,note}`. Unknown
  frontmatter keys are silently stripped by Zod — extend the schema first if
  a new field is needed (`source` / `sourceType` / `sourceTimestamp` hold
  import provenance).
- **~1550 Facebook-imported drafts** live in `src/content/post/` with
  `draft: true`, `source: "facebook"`, timestamp-based filenames
  (`2026-01-01_002742_26ea0b65.md`), one git commit per post authored at the
  original FB post time. Drafts are excluded from routes, RSS, sitemap and
  the Pagefind index in production builds.
- Expansion workflow for a draft: rename to an English-slug filename, write
  the article, set `draft: false`, fill `tags`. Renaming changes the URL —
  fine while the site is young, do it before it gets indexed.
- Media lives in `public/media/YYYY-MM/…` and is referenced as `/media/…`
  (public dir, no astro:assets processing).
- `src/content/post/about.md` is special: it renders on `/about/` and is
  excluded from the blog list/archive (see `src/lib/content.ts`).

## Conventions

- Commits: plain English descriptions, no conventional-commit prefixes.
  Facebook imports are one commit per post with `GIT_AUTHOR_DATE` /
  `GIT_COMMITTER_DATE` set to the FB timestamp — preserve that pattern when
  importing more.
- `pnpm-workspace.yaml` `allowBuilds` gates postinstall scripts (pnpm 11
  ignores the `pnpm` field in package.json). `workerd: true` is required.
- Fonts: Google provider via Astro fonts API (declared in `astro.config.mjs`);
  the lain official font LoveLetter is self-hosted at `public/fonts/`
  (referenced by `@font-face` in `src/styles/global.css`). Noto Sans TC is
  intentionally NOT self-hosted — system CJK font stack instead.

## Reference

- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Markdown & MDX](https://docs.astro.build/en/guides/markdown-content/)
- [cf CLI: develop, build, deploy](https://developers.cloudflare.com/cf/projects/)
- [Astro on Workers (static)](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
