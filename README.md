# Claude Code — Interactive Trainer

> An interactive, terminal-styled web app to help newcomers **master the Claude Code CLI** —
> like the shortcut-visualizer pages for Photoshop/Illustrator, but playful and hands-on.

The whole app presents as **one Claude Code window**. You learn by doing:

- 🎮 **Playground** — a safe *simulated* Claude Code terminal (nothing executes)
- 🔍 **Cheatsheet** — searchable, filterable catalog of every feature
- ⌨️ **Keyboard visualizer** — practice shortcuts on an interactive keyboard
- 🧠 **Quiz** — test and reinforce what you've learned
- 🚀 **Start here** — a guided track for newcomers

Built on **~728 catalogued items across 12 domains**, audited against the official Claude Code docs.

## Status

🚧 In development. Design spec:
[`docs/superpowers/specs/2026-06-26-claude-code-interactive-trainer-design.md`](docs/superpowers/specs/2026-06-26-claude-code-interactive-trainer-design.md)

## Stack

Vite · React · TypeScript · Tailwind CSS · pnpm — static build, deployable to GitHub Pages.

---

*This is an educational project and is not affiliated with Anthropic.*

## Deploy

The app deploys to **GitHub Pages** via `.github/workflows/deploy.yml` on every push to `main`
(and via manual **workflow_dispatch**). The workflow runs `pnpm install --frozen-lockfile`,
`pnpm build:catalog` (`node scripts/build-catalog.mjs`), `pnpm build`, then uploads `./dist` and
publishes it.

**One-time setup:** enable Pages in **Settings → Pages → Source: GitHub Actions**.

**Live site:** **https://cckeys.work** (custom domain; `www.cckeys.work` redirects to the apex).
The repo's `public/CNAME` pins the custom domain across deploys. Vite `base` is `./` (relative),
so the build works both at the custom-domain root and at the legacy
`https://sepivip.github.io/claude-code-visualizer/` path. Locally, `pnpm preview` serves at
`http://localhost:4173/`, which the Playwright e2e smoke test (`pnpm test:e2e`) drives.

### Custom domain DNS (Cloudflare)

`cckeys.work` is on Cloudflare. Records (all **DNS only / grey-cloud** so GitHub serves HTTPS):

| Type  | Name  | Value                                                     |
|-------|-------|-----------------------------------------------------------|
| A     | `@`   | `185.199.108.153`                                         |
| A     | `@`   | `185.199.109.153`                                         |
| A     | `@`   | `185.199.110.153`                                         |
| A     | `@`   | `185.199.111.153`                                         |
| CNAME | `www` | `sepivip.github.io`                                       |
