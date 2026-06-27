# CLAUDE.md — project conventions

Context for any AI/dev session working in this repo. Keep it short and current.

**Project:** cckeys — "Claude Code — Interactive Trainer". A static, terminal-styled
React/TS app teaching the Claude Code CLI (shortcuts, slash commands, settings, live keyboard
map). Open source. Live at **https://cckeys.work** · repo **sepivip/claude-code-visualizer**.

## Versioning (IMPORTANT — keep this updated)

- **Single source of truth:** the `version` field in `package.json` (semver).
- It is injected at build time by Vite `define` → the global `__APP_VERSION__` (see `vite.config.ts`
  and `src/global.d.ts`) and **displayed in the app header (top-right, next to the GitHub icon)**,
  linking to the repo's `/releases`.
- **Bump it when shipping a notable change** before/with the deploy:
  - patch (`0.1.x`) — bug fixes / small tweaks
  - minor (`0.x.0`) — new features (e.g. Quiz, guided track)
  - major (`x.0.0`) — big/breaking redesigns
- That's the only step — no other file needs editing; the header updates automatically on deploy.
  Consider tagging a matching GitHub release when bumping a minor/major.

## Deploy

- **Push to `main` → GitHub Actions runs the tests, and only if they pass, deploys to GitHub Pages
  → https://cckeys.work.** Every push to `main` auto-deploys. Branches/PRs run CI too.
- Custom domain is pinned by `public/CNAME` (`cckeys.work`). Vite `base` is `'./'` (relative) so the
  build works at the apex domain and the legacy project subpath — **do not** change it back to an
  absolute base. DNS for `cckeys.work` is on Cloudflare (A records → GitHub Pages IPs, `www` CNAME →
  `sepivip.github.io`, all DNS-only).

## Working conventions

- Stack: Vite · React 18 · TypeScript (strict, **no `any`**) · Tailwind v4 · Vitest · Playwright · pnpm.
- Work on a **feature branch**, keep `pnpm test` + `pnpm build` green, then fast-forward merge to `main`.
- **Verify visual/UI changes in a real browser** (Playwright screenshot) before merging — this repo
  cares about looking seamless. Aesthetic: dark terminal, coral accent `#D97757`, JetBrains Mono.
- Content lives in `content/cc-catalog.raw.json` → generated to `src/data/catalog.ts` via
  `pnpm build:catalog`. The keyboard derives chords at runtime; multi-stroke sequences
  (e.g. `Ctrl+X Ctrl+E`) are intentionally not mapped to a single key.

## Docs

- Spec: `docs/superpowers/specs/2026-06-26-claude-code-interactive-trainer-design.md`
- Phase 1 plan: `docs/superpowers/plans/2026-06-26-cc-trainer-phase1.md`
- **Phase 2 backlog:** Quiz + guided Start track (the two real remaining features), catalog dedupe,
  catalog lazy-load/code-split, cheatsheet `q` two-way URL binding, optional light theme.
