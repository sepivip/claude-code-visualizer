# Claude Code Interactive Trainer — Design Spec

**Date:** 2026-06-26
**Status:** Approved (design) — pending spec review
**Working title:** CC Visualizer / "Claude Code — Interactive Trainer"

---

## 1. Purpose & vision

An interactive, educational, **terminal-styled** web app that helps newcomers master the
Claude Code terminal — the way Photoshop/Illustrator shortcut-visualizer pages help people
master those apps, but playful and hands-on.

The entire app presents as **one Claude Code window** that never breaks character. Users learn
by *doing*: typing real commands into a safe simulated terminal, exploring a searchable
cheat-sheet of every feature, practicing shortcuts on an interactive keyboard, and testing
themselves with quizzes — all wrapped in an authentic Claude Code aesthetic.

**Success criteria**
- A newcomer can discover and understand the core Claude Code workflow (prompt, modes,
  slash commands, files/memory) within ~15 minutes of play.
- Every catalogued feature is findable in the cheat-sheet with accurate syntax + an example.
- It *feels like* real Claude Code (chrome, prompt, coral accent, box-drawn UI) and is fun.
- Ships as a static site deployable to GitHub Pages with no backend.

**Non-goals (YAGNI)**
- No backend, accounts, persistence beyond `localStorage`, or analytics.
- No real Claude API calls — the terminal is a *simulation*, nothing executes.
- No i18n, no CMS. Content is generated from a static JSON catalog.
- No light theme in MVP (deferred to Phase 2, optional). No sound effects.

---

## 2. Content foundation (the audit)

A multi-agent research sweep audited Claude Code against the official docs and produced a
catalog of **~728 items across 12 domains** (saved as `content/cc-catalog.raw.json`):

| # | Domain | ~Items |
|---|--------|-------|
| 1 | Interactive shortcuts / REPL controls | 83 |
| 2 | Slash commands | 93 |
| 3 | CLI & flags | 110 |
| 4 | settings.json configuration | 53 |
| 5 | Hooks | 38 |
| 6 | MCP | 45 |
| 7 | Subagents | 51 |
| 8 | Permissions & modes | 31 |
| 9 | Memory / CLAUDE.md | 22 |
| 10 | Plugins & marketplaces | 35 |
| 11 | Customization / UX | 51 |
| 12 | Sessions / context / automation | 66 |

**Accuracy is a first-class requirement.** The audit's completeness critic surfaced
bleeding-edge items (e.g. exotic hook events, `--teammate-mode`, `advisorModel`) that may be
newer than training data. Before content ships, a verification pass (Section 6) flags each
item's confidence so the app never teaches a newcomer a wrong shortcut.

---

## 3. Information architecture & app shell

Single-page app, one persistent **terminal-window chrome**:

```
╭──────────────────────────────────────────────────╮
│ ✻ Claude Code — Interactive Trainer       ▢ ◷ ⚙  │  title bar (fake window chrome)
├──────────────────────────────────────────────────┤
│ [ Start here ] [ Playground ] [ Cheatsheet ]      │  command bar (mode switcher)
│ [ Keyboard ]   [ Quiz ]                            │
├──────────────────────────────────────────────────┤
│                                                    │
│   < active surface renders here >                  │
│                                                    │
├──────────────────────────────────────────────────┤
│ > type a command, or /help                ⏎  plan  │  persistent prompt (also drives nav)
╰──────────────────────────────────────────────────╯
```

- **Five surfaces** share one chrome and one in-memory data store: *Start here*, *Playground*,
  *Cheatsheet*, *Keyboard*, *Quiz*.
- **Navigation is dual:** click a mode tab, **or type** `/cheatsheet`, `/keyboard`, `/quiz`,
  `/start`, `/playground` at the prompt — reinforcing slash-command muscle memory.
- **Hash routing:** the URL hash mirrors state (`#/cheatsheet?q=compact`, `#/keyboard?mod=ctrl`)
  so views are shareable and survive refresh. Implemented with a tiny custom hash router
  (no router dependency).
- **State:** a small React context + `useReducer` for active mode, terminal scrollback, theme,
  and progress. No global state library.

---

## 4. The five surfaces

### 4.1 🎮 Playground — simulated terminal (hero)
A faithful, *safe* Claude Code prompt. Nothing executes; responses are scripted from catalog data.
- Accepts slash commands and the special prefixes `@` (file mention), `#` (memory), `!` (bash),
  `/` (command launcher). Each returns a realistic, box-drawn simulated response built from the
  item's `details`/`example`.
- **Affordances that teach by mimicry:** Tab-completion of slash commands, ↑/↓ history,
  blinking block cursor, "Unknown command — did you mean…" suggestions, mode indicator in the
  prompt footer (cycled with Shift+Tab — simulated).
- **Guided scenarios:** scripted multi-step walkthroughs (e.g. "Fix a failing test") where the
  terminal prompts the user to type the right thing and validates it. Scenarios are reused by
  the Start-here track.

### 4.2 🔍 Cheatsheet
- Responsive grid of all catalog items as cards (name, syntax chip, one-line summary, domain tag).
- **Filter** by domain and category; **fuzzy search** by name/summary/syntax. `/` focuses the
  search box (a deliberate meta nod to Claude Code).
- Click a card → **detail drawer**: exact syntax, full description, **copyable** example,
  newcomer tip, platform notes (mac/win/linux), confidence badge, and doc source link.
- Fully keyboard-navigable (arrow keys move selection, Enter opens, Esc closes).

### 4.3 ⌨️ Keyboard visualizer
- CSS/SVG keyboard with shortcuts overlaid on keys.
- **Modifier toggles** (Ctrl/Cmd/Shift/Alt) filter the shortcut set; **platform switch**
  (macOS/Windows/Linux) swaps Cmd↔Ctrl and adjusts labels.
- **Live key capture:** pressing real keys highlights them — practice a shortcut and see it
  light up. Click a key → its associated shortcut(s) in a detail popover.
- Sourced from catalog items where `category = shortcut`. Degrades gracefully on mobile
  (tap-to-explore list fallback).

### 4.4 🧠 Quiz
- Questions generated from catalog data, four types:
  1. Multiple-choice ("Which command does X?")
  2. **Type-the-shortcut** (captures the user's keypress combo)
  3. Type-the-command (text match, lenient)
  4. Fill-in-the-blank (syntax)
- Score + streak, immediate feedback with an explanation that links to the cheatsheet item.
- Optional domain filter ("quiz me on hooks").

### 4.5 🚀 Start here — guided track
- A short chaptered path for newcomers, progress saved to `localStorage`:
  1. The Prompt & basics
  2. Modes & permissions (plan / acceptEdits / bypass, Shift+Tab)
  3. Slash commands
  4. Files & memory (`@`, `#`, CLAUDE.md, `/init`)
  5. Power features (hooks, MCP, subagents) — overview level
- Each chapter = a few explanatory cards + an embedded interactive task executed in the
  Playground engine (reusing scenarios from 4.1).

---

## 5. Content model & data pipeline

**Type (`src/data/types.ts`):**
```ts
type Category =
  | 'shortcut' | 'slash-command' | 'cli-flag' | 'setting' | 'hook'
  | 'mcp' | 'subagent' | 'permission-mode' | 'memory' | 'plugin'
  | 'customization' | 'feature' | 'concept';

type Confidence = 'verified' | 'advanced' | 'unverified';

interface CatalogItem {
  id: string;            // stable slug, e.g. "slash--clear"
  name: string;          // "/clear", "Ctrl+C"
  category: Category;
  domain: string;        // one of the 12 domain keys
  syntax?: string;
  summary: string;
  details?: string;
  example?: string;
  newcomerTip?: string;
  platformNotes?: string;
  source?: string;       // doc URL or "model-knowledge"
  confidence: Confidence;
  keys?: KeyChord[];     // parsed key chords for shortcut items (keyboard visualizer)
}
```

**Build script (`scripts/build-catalog.ts`):** transforms `content/cc-catalog.raw.json` →
typed, **deduped**, slugged dataset in `src/data/catalog.ts` (and a derived shortcut→key-chord
map for the keyboard). Runs as a one-shot/prebuild step; the app imports static data (zero
network at runtime). Domains and categories are derived into constants used by filters.

---

## 6. Accuracy verification

A gating step before content ships:
- Each item is assigned a `confidence`: `verified` (matches current docs / well-known),
  `advanced` (real but niche/new — shown with a subtle badge), or `unverified` (cut or
  quarantined until confirmed).
- **Core newcomer-facing items** (the Start-here track + common shortcuts/commands) must be
  `verified`. Uncertain bleeding-edge items are either verified against docs, demoted to
  `advanced` with a badge, or dropped.
- Implemented as a review pass over the generated catalog (can be assisted by a
  docs-checking agent), recording confidence per item.

---

## 7. Simulated-terminal engine

A small, pure, testable engine — **not** a real shell emulator:
- `engine/parser.ts` — tokenizes prompt input; classifies as slash-command, prefix
  (`@ # ! /`), plain text, or unknown.
- `engine/commandRegistry.ts` — maps recognized inputs → handlers returning scripted output
  "lines" (text, box, error, suggestion). Handlers read from catalog data.
- `engine/scenarios.ts` — scripted multi-step lessons with per-step validation, shared by the
  Playground and the Start-here track.
- Pure functions in / structured output out → straightforward unit testing.

---

## 8. Visual design — the Claude Code look

- **Dark, near-black** terminal background; **monospace** UI (bundled JetBrains Mono).
- **Authentic Claude Code palette:** coral/terracotta accent (`~#D97757`), success green,
  muted grays; box-drawing borders (`╭─╮ │ ╰─╯`) for welcome/tip boxes; blinking block cursor.
- **Playful flair (approved):** the ✻/✨ sparkle motif, light ASCII touches, friendly empty
  states and a small mascot personality — kept tasteful, never noisy.
- Subtle type-on / cursor animations, **gated by `prefers-reduced-motion`**.
- **Dark-only in MVP.** Light theme + toggle deferred to Phase 2 (and doubles as a teaching
  moment about CC themes).
- Responsive down to mobile; keyboard visualizer has a list fallback on small screens.

---

## 9. Tech architecture

- **Stack:** Vite + React + TypeScript + Tailwind CSS. **pnpm** package manager, frozen
  lockfile for CI. Minimal dependencies — custom hash router and a tiny fuzzy matcher instead
  of heavy libraries; no dependency that violates the project's security rules.
- **Foldering:**
  ```
  src/
    components/{shell,playground,cheatsheet,keyboard,quiz,guided,common}/
    engine/        parser.ts, commandRegistry.ts, scenarios.ts
    data/          types.ts, catalog.ts (generated), domains.ts
    lib/           search.ts, storage.ts, platform.ts, keys.ts, router.ts
    hooks/         useKeyboard.ts, useHistory.ts, useHashRoute.ts
    styles/
  scripts/         build-catalog.ts
  content/         cc-catalog.raw.json
  ```
- **Testing:** Vitest + React Testing Library for engine (parser/registry), search, quiz logic,
  key-chord parsing. One Playwright smoke test (boot, switch modes, run a command, search).
- **Deploy:** GitHub Actions → `gh-pages`; Vite `base` set to the repo name; SPA-safe hash
  routing avoids 404s on refresh.

---

## 10. Error handling & edge cases

- Unknown terminal command → friendly "Unknown command, did you mean …" with closest matches
  (mirrors real Claude Code).
- Empty search results → helpful empty state with reset.
- `localStorage` access guarded (private-mode / disabled storage degrades to in-memory).
- Static data import → no network failure modes at runtime.
- Reduced-motion and keyboard-only navigation supported throughout (accessibility:
  ARIA labels, focus management, visible focus rings).

---

## 11. Scope & phasing

**Phase 1 (MVP):** app shell + content pipeline + accuracy pass + Cheatsheet + Keyboard
visualizer + basic Playground (slash-command simulation). A genuinely useful, shippable app.

**Phase 2 (delight):** Quiz + Start-here guided track + terminal scenarios + tab-completion &
history polish + animations + deep-linking refinements + mobile polish + optional light theme.

Final product includes **all four interactive features**; phasing is sequencing only.

---

## 12. Open questions / risks

- **Content accuracy** of bleeding-edge items — mitigated by the Section 6 verification pass.
- **Keyboard visualizer fidelity** across OS/terminal differences — handled via platform toggle
  + per-item `platformNotes`; some shortcuts are terminal-dependent and will be labeled as such.
- **Catalog size** (603 KB raw) — build script trims to only fields the app needs; consider
  lazy-loading detail text if bundle size becomes a concern.
