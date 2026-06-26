# Claude Code Interactive Trainer — Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, terminal-styled web app that teaches newcomers Claude Code via a searchable cheatsheet, an interactive keyboard visualizer, and a basic simulated-terminal playground — all inside one authentic Claude Code window.

**Architecture:** Single-page React app with one persistent "terminal window" chrome and five switchable surfaces (Phase 1 ships Start-here stub, Playground, Cheatsheet, Keyboard; Quiz is Phase 2). A build-time script transforms the audited content catalog (`content/cc-catalog.raw.json`, ~728 items) into typed static data. A small pure-function command engine powers the playground. State lives in a single React context; navigation is hash-based (GitHub-Pages-safe). No backend, no network at runtime.

**Tech Stack:** Vite · React 18 · TypeScript · Tailwind CSS v4 · Vitest + React Testing Library · Playwright (smoke) · pnpm. Deployed static to GitHub Pages via GitHub Actions.

## Global Constraints

- **Package manager: pnpm only.** Use a frozen lockfile (`pnpm install --frozen-lockfile`) in CI. Respect `minimumReleaseAge` / `min-release-age`; never bypass it. Add no dependency unless a task explicitly requires it; prefer existing packages and the standard library first.
- **Node:** `>=20`.
- **Static only:** no backend, no accounts, no analytics, **no real Claude API calls** — the terminal is a simulation. Persistence is `localStorage` only.
- **Theme:** dark-only in Phase 1. Authentic Claude Code palette (coral accent `#D97757`, success green, near-black bg). Playful ✻/✨ flair, tasteful. No sound effects.
- **Accessibility:** all animations gated by `prefers-reduced-motion`; full keyboard navigation; ARIA labels; visible focus rings.
- **Deploy:** Vite `base` must equal `/claude-code-visualizer/` for GitHub Pages. Hash routing (no server rewrites).
- **Method:** TDD (red→green→commit), DRY, YAGNI, frequent commits. Conventional Commit messages, each ending with the repo's `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- **No `any`** in committed TypeScript; `strict` mode on.

---

## Shared Type Contract (authoritative — every task uses these EXACT names/signatures)

```ts
// ───────────────────────── src/data/types.ts ─────────────────────────
export type Category =
  | 'shortcut' | 'slash-command' | 'cli-flag' | 'setting' | 'hook'
  | 'mcp' | 'subagent' | 'permission-mode' | 'memory' | 'plugin'
  | 'customization' | 'feature' | 'concept';

export type Confidence = 'verified' | 'advanced' | 'unverified';

export type Platform = 'mac' | 'win' | 'linux';

export type Mode = 'start' | 'playground' | 'cheatsheet' | 'keyboard' | 'quiz';

export type DomainKey =
  | 'interactive' | 'slash' | 'cli' | 'settings' | 'hooks' | 'mcp'
  | 'subagents' | 'permissions' | 'memory' | 'plugins' | 'customization' | 'sessions';

export type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

export interface KeyChord {
  mods: Modifier[];   // sorted: ctrl, meta, shift, alt
  key: string;        // normalized lowercase main key: 'r', 'c', 'enter', 'tab', 'escape', 'space', '@'
  raw: string;        // original display string, e.g. 'Ctrl+R'
}

export interface CatalogItem {
  id: string;            // stable unique slug, e.g. 'slash-clear'
  name: string;          // '/clear', 'Ctrl+C'
  category: Category;
  domain: DomainKey;
  syntax?: string;
  summary: string;
  details?: string;
  example?: string;
  newcomerTip?: string;
  platformNotes?: string;
  source?: string;
  confidence: Confidence;
  keys?: KeyChord[];     // present for category === 'shortcut' when parseable
}

// ───────────────────────── src/data/domains.ts ─────────────────────────
export interface DomainMeta { key: DomainKey; label: string; icon: string; blurb: string; }
export const DOMAINS: DomainMeta[];
export function domainOf(key: DomainKey): DomainMeta;

// ───────────────────────── src/data/catalog.ts (GENERATED) ─────────────
export const CATALOG: CatalogItem[];

// ───────────────────────── src/lib/keys.ts ─────────────────────────
export function parseChord(raw: string): KeyChord | null;
export function parseChords(raw: string): KeyChord[];           // splits "Ctrl+V / Alt+V" → [chord, chord]
export function chordFromEvent(e: KeyboardEvent): KeyChord;
export function chordEquals(a: KeyChord, b: KeyChord): boolean;
export function displayChord(chord: KeyChord, platform: Platform): string;

// ───────────────────────── src/lib/search.ts ─────────────────────────
export interface SearchResult { item: CatalogItem; score: number; }
export function searchCatalog(items: CatalogItem[], query: string): SearchResult[];

// ───────────────────────── src/lib/storage.ts ─────────────────────────
export function load<T>(key: string, fallback: T): T;
export function save<T>(key: string, value: T): void;

// ───────────────────────── src/lib/router.ts ─────────────────────────
export interface RouteState { mode: Mode; params: Record<string, string>; }
export function parseHash(hash: string): RouteState;            // '' → { mode: 'start', params: {} }
export function buildHash(state: RouteState): string;           // → '#/cheatsheet?q=compact'

// ───────────────────────── src/hooks/useHashRoute.ts ─────────────────
export function useHashRoute(): [RouteState, (next: RouteState) => void];

// ───────────────────────── src/engine/types.ts ─────────────────────────
export type LineKind = 'input' | 'output' | 'error' | 'box' | 'suggestion' | 'system';
export interface TerminalLine { id: string; kind: LineKind; text: string; title?: string; }
export interface CommandContext { catalog: CatalogItem[]; }
export interface CommandResult { lines: TerminalLine[]; navigate?: Mode; clear?: boolean; }

// ───────────────────────── src/engine/parser.ts ─────────────────────────
export type InputKind = 'slash' | 'file' | 'memory' | 'bash' | 'text' | 'empty';
export interface ParsedInput { kind: InputKind; command?: string; args: string; raw: string; }
export function parseInput(raw: string): ParsedInput;

// ───────────────────────── src/engine/commandRegistry.ts ──────────────
export function runCommand(parsed: ParsedInput, ctx: CommandContext): CommandResult;
export function completions(prefix: string, ctx: CommandContext): string[]; // tab-completion (ctx supplies catalog slash names)
export const NAV_COMMANDS: Record<string, Mode>;                // '/cheatsheet' → 'cheatsheet', etc.

// ───────────────────────── src/components/shell/AppContext.tsx ────────
export interface AppContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  params: Record<string, string>;
  setParams: (p: Record<string, string>) => void;
  lines: TerminalLine[];
  submit: (raw: string) => void;     // parse → run → append lines / navigate
  platform: Platform;
  setPlatform: (p: Platform) => void;
}
export function useApp(): AppContextValue;
export function AppProvider(props: { children: React.ReactNode }): JSX.Element;
```

**Raw catalog shape** (`content/cc-catalog.raw.json`): `{ catalogs: Array<{ domain: string; overview: string; items: RawItem[] }>, missingItems: RawItem[], gapAssessment: string }` where `RawItem = { name; category; summary; syntax?; details?; example?; newcomerTip?; platformNotes?; source?; domain? }`.

**Domain string → DomainKey map** (used by the build script):
```
'Claude Code Terminal/REPL Interactive Controls'        → 'interactive'
'Claude Code Slash Commands'                             → 'slash'
'Claude Code CLI'                                        → 'cli'
'Claude Code settings.json Configuration System'         → 'settings'
'Claude Code Hooks System'                               → 'hooks'
'Model Context Protocol (MCP) in Claude Code'            → 'mcp'
'Claude Code Subagents'                                  → 'subagents'
'Claude Code Permissions and Modes'                      → 'permissions'
'Claude Code Project Memory System (CLAUDE.md)'          → 'memory'
'Claude Code Plugins'                                    → 'plugins'
'Claude Code Customization and UX'                       → 'customization'
'Claude Code: Sessions, Context, and Workflow Automation'→ 'sessions'
```

**Category normalization** (map non-canonical raw categories): `env-flag → cli-flag`; `best-practice|troubleshooting|example → concept`; `tool → feature`; anything already in the `Category` union passes through; unknown → `concept`.

---

## Canonical DOM & Test Contract (authoritative)

To keep the shell, surfaces, integration test, and e2e test in agreement, all components conform to these
exact testids / roles / accessible names / behaviors:

- **TitleBar:** `<header>` → `<h1>` with text `✻ Claude Code — Interactive Trainer` (`getByRole('heading', {name:/Claude Code/i})`).
- **PromptBar:** container `data-testid="prompt-bar"`; the input is wrapped in a `<form onSubmit>` (preventDefault → `handleSubmit`), so Enter submits via the form (ArrowUp/Down/Tab stay on `onKeyDown`). Input has `data-testid="prompt-input"` and `aria-label="Prompt"`. Tab-completion calls `completions(value, { catalog: CATALOG })`.
- **CommandBar:** `role="tablist"`; tabs `role="tab"`; active tab `aria-current="page"`.
- **Surface wrapper (App.tsx):** renders the active surface inside `<div data-testid={\`surface-${mode}\`}>`. This is the ONLY source of `surface-<mode>` testids — individual surfaces do not set their own.
- **Playground:** persistent `WelcomeBox` at top (`data-testid="welcome"`, contains `Welcome to the Claude Code Trainer`), then `data-testid="scrollback"` below.
- **Cheatsheet:** search `<input type="search" aria-label="Search features">` (`getByRole('searchbox')`); results container `data-testid="results-grid"`; cards `data-testid="item-card"` `role="button"`; empty state `data-testid="empty-state"`; drawer `role="dialog" aria-modal="true"`.
- **KeyboardVisualizer:** root `data-testid="keyboard"`; detail panel `data-testid="shortcut-detail"`; tests pick a key proven present via `buildShortcutIndex(CATALOG)` (Ctrl+R / key `r` exists).
- **common/index.tsx (Task 12):** barrel re-exporting the REAL `BoxFrame/CopyButton/Badge/Cursor/Kbd`; the Task 10 stub bodies are deleted. `Badge.variant?` is optional (default `'advanced'`); `ItemCard` passes `variant="advanced"`. CopyButton text is `Copied!`.
- **build:catalog:** always `node scripts/build-catalog.mjs` (no `tsx`, no `.ts`). Task 15 adds only `test:e2e` and touches no other script. Vite `base` = `/claude-code-visualizer/` (repo confirmed named `claude-code-visualizer`).
- **Styling:** `cc-*` `@theme` tokens are canonical; existing hardcoded `#D97757` / `neutral-*` in shell/surfaces are acceptable interim Phase-1 values (do not refactor in fix passes).

---

## Task Index

1. Project scaffold (Vite + React + TS + Tailwind v4 + Vitest + pnpm, GH Pages base)
2. Core types + key-chord parsing (`src/data/types.ts`, `src/lib/keys.ts`)
3. Domains + content pipeline (`src/data/domains.ts`, `scripts/build-catalog.ts`, generated `src/data/catalog.ts`)
4. Fuzzy search (`src/lib/search.ts`)
5. localStorage helper (`src/lib/storage.ts`)
6. Hash router + `useHashRoute` (`src/lib/router.ts`, `src/hooks/useHashRoute.ts`)
7. Command engine (`src/engine/{types,parser,commandRegistry}.ts`)
8. App context + shell chrome (`src/components/shell/*`)
9. Playground surface (`src/components/playground/*`)
10. Cheatsheet surface (`src/components/cheatsheet/*`)
11. Keyboard visualizer surface (`src/components/keyboard/*`)
12. Theme tokens, fonts, common components (`src/styles/*`, `src/components/common/*`)
13. App integration + navigation wiring (`src/App.tsx`)
14. Content accuracy verification pass (confidence assignment)
15. Deploy (GitHub Actions → gh-pages) + Playwright smoke test

> **Execution order (IMPORTANT):** implement in the sequence **1 → 8, then 12, then 9 → 11, then 13 → 15**. Task 12 (theme tokens + common components, incl. `BoxFrame`) MUST be built before Task 9, because the Playground imports `../common/BoxFrame`. Tasks 10 and 11 do not import common components directly (Task 10 ships its own interim stub; Task 11 imports none), so only the **12-before-9** dependency is strict — but building 12 before all three surfaces keeps the shared theme consistent. The numeric task order is the reference order; the sequence above is the build order an executing agent should follow.

---
### Task 1: Project scaffold (Vite + React + TS + Tailwind v4 + Vitest + pnpm)

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: nothing (root scaffold).
- Produces: a mounting `App` component (`src/App.tsx`, default export `App(): JSX.Element`) and the toolchain config every later task builds on (Vitest env `jsdom`, globals on, setup file `./src/test/setup.ts`; Vite `base:'/claude-code-visualizer/'`).

---

- [ ] **Step 1: Bootstrap config files (no App yet) so the test harness can run.**

  Create `package.json`:

  ```json
  {
    "name": "claude-code-visualizer",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "packageManager": "pnpm@9.12.0",
    "engines": {
      "node": ">=20"
    },
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "preview": "vite preview",
      "test": "vitest run",
      "test:watch": "vitest",
      "build:catalog": "node scripts/build-catalog.mjs"
    },
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1"
    },
    "devDependencies": {
      "@tailwindcss/vite": "^4.0.0",
      "@testing-library/jest-dom": "^6.4.8",
      "@testing-library/react": "^16.0.1",
      "@testing-library/user-event": "^14.5.2",
      "@types/node": "^20.14.15",
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      "jsdom": "^24.1.1",
      "tailwindcss": "^4.0.0",
      "typescript": "^5.5.4",
      "vite": "^5.4.1",
      "vitest": "^2.0.5"
    }
  }
  ```

  Create `vite.config.ts`:

  ```ts
  /// <reference types="vitest/config" />
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: '/claude-code-visualizer/',
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  });
  ```

  Create `tsconfig.json`:

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["DOM", "DOM.Iterable", "ES2022"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "allowImportingTsExtensions": true,
      "types": ["vitest/globals", "@testing-library/jest-dom"]
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  }
  ```

  Create `tsconfig.node.json`:

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["ES2022"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "composite": true,
      "noEmit": true,
      "allowImportingTsExtensions": true,
      "types": ["node"]
    },
    "include": ["vite.config.ts"]
  }
  ```

  Create `index.html`:

  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Claude Code — Interactive Trainer</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

  Create `src/index.css`:

  ```css
  @import "tailwindcss";
  ```

  Create `src/test/setup.ts`:

  ```ts
  import '@testing-library/jest-dom';
  ```

- [ ] **Step 2: Install dependencies (creates the lockfile).**

  Run:

  ```
  pnpm install
  ```

  This creates `pnpm-lock.yaml`. Note: frozen-lockfile (`pnpm install --frozen-lockfile`) is for CI/deploy only; the initial dev install above is what generates the lockfile.

- [ ] **Step 3: Write the failing test for `App`.**

  Create `src/App.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import App from './App';

  describe('App', () => {
    it('renders the trainer heading', () => {
      render(<App />);
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 4: Run the test — expect FAIL.**

  Run:

  ```
  pnpm vitest run src/App.test.tsx
  ```

  Expected FAIL: module resolution error — `Failed to resolve import "./App"` (the file `src/App.tsx` does not exist yet), so the test cannot import the component.

- [ ] **Step 5: Implement the minimal `App` to pass.**

  Create `src/App.tsx`:

  ```tsx
  export default function App() {
    return <div>Claude Code — Interactive Trainer</div>;
  }
  ```

- [ ] **Step 6: Run the test — expect PASS.**

  Run:

  ```
  pnpm vitest run src/App.test.tsx
  ```

  Expected PASS: `App > renders the trainer heading` passes (1 passed).

- [ ] **Step 7: Add the runtime entrypoint.**

  Create `src/main.tsx`:

  ```tsx
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import App from './App';
  import './index.css';

  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element #root not found');
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  ```

- [ ] **Step 8: Commit the scaffold.**

  Run:

  ```
  git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json tsconfig.node.json index.html src/main.tsx src/index.css src/App.tsx src/App.test.tsx src/test/setup.ts
  git commit -m "chore: scaffold Vite + React + TS + Tailwind v4 + Vitest

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

### Task 2: Core types + key-chord parsing

**Files:**
- Create: `src/data/types.ts`
- Create: `src/lib/keys.ts`
- Test: `src/lib/keys.test.ts`

**Interfaces:**
- Produces (`src/data/types.ts`): `Category`, `Confidence`, `Platform`, `Mode`, `DomainKey`, `Modifier`, `KeyChord = { mods: Modifier[]; key: string; raw: string }`, `CatalogItem`
- Produces (`src/lib/keys.ts`): `parseChord(raw:string):KeyChord|null`; `parseChords(raw:string):KeyChord[]`; `chordFromEvent(e:KeyboardEvent):KeyChord`; `chordEquals(a:KeyChord,b:KeyChord):boolean`; `displayChord(chord:KeyChord,platform:Platform):string`
- Consumes: `KeyChord`, `Modifier`, `Platform` from `src/data/types.ts`

---

- [ ] **Step 1: Write `src/data/types.ts` (no test — pure type declarations consumed by later steps).**
```ts
// src/data/types.ts
export type Category =
  | 'shortcut'
  | 'slash-command'
  | 'cli-flag'
  | 'setting'
  | 'hook'
  | 'mcp'
  | 'subagent'
  | 'permission-mode'
  | 'memory'
  | 'plugin'
  | 'customization'
  | 'feature'
  | 'concept';

export type Confidence = 'verified' | 'advanced' | 'unverified';

export type Platform = 'mac' | 'win' | 'linux';

export type Mode = 'start' | 'playground' | 'cheatsheet' | 'keyboard' | 'quiz';

export type DomainKey =
  | 'interactive'
  | 'slash'
  | 'cli'
  | 'settings'
  | 'hooks'
  | 'mcp'
  | 'subagents'
  | 'permissions'
  | 'memory'
  | 'plugins'
  | 'customization'
  | 'sessions';

export type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

export interface KeyChord {
  mods: Modifier[];
  key: string;
  raw: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  domain: DomainKey;
  syntax?: string;
  summary: string;
  details?: string;
  example?: string;
  newcomerTip?: string;
  platformNotes?: string;
  source?: string;
  confidence: Confidence;
  keys?: KeyChord[];
}
```

- [ ] **Step 2: Write the failing test file `src/lib/keys.test.ts`.**
```ts
// src/lib/keys.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseChord,
  parseChords,
  chordFromEvent,
  chordEquals,
  displayChord,
} from './keys';
import type { KeyChord } from '../data/types';

describe('parseChord', () => {
  it('parses Ctrl+R', () => {
    expect(parseChord('Ctrl+R')).toEqual({ mods: ['ctrl'], key: 'r', raw: 'Ctrl+R' });
  });

  it('parses Cmd+V to meta', () => {
    expect(parseChord('Cmd+V')).toEqual({ mods: ['meta'], key: 'v', raw: 'Cmd+V' });
  });

  it('parses ⌘+K symbol to meta', () => {
    expect(parseChord('⌘+K')).toEqual({ mods: ['meta'], key: 'k', raw: '⌘+K' });
  });

  it('sorts mods ctrl,meta,shift,alt regardless of input order', () => {
    expect(parseChord('Shift+Ctrl+P')).toEqual({
      mods: ['ctrl', 'shift'],
      key: 'p',
      raw: 'Shift+Ctrl+P',
    });
    expect(parseChord('Ctrl+Shift+P')).toEqual({
      mods: ['ctrl', 'shift'],
      key: 'p',
      raw: 'Ctrl+Shift+P',
    });
  });

  it('normalizes Esc to escape', () => {
    expect(parseChord('Esc')).toEqual({ mods: [], key: 'escape', raw: 'Esc' });
  });

  it('normalizes Shift+Tab', () => {
    expect(parseChord('Shift+Tab')).toEqual({ mods: ['shift'], key: 'tab', raw: 'Shift+Tab' });
  });

  it('normalizes Enter/Return and Space', () => {
    expect(parseChord('Return')?.key).toBe('enter');
    expect(parseChord('Space')?.key).toBe('space');
  });

  it('maps Option and ^ aliases', () => {
    expect(parseChord('Option+A')).toEqual({ mods: ['alt'], key: 'a', raw: 'Option+A' });
    expect(parseChord('^+C')).toEqual({ mods: ['ctrl'], key: 'c', raw: '^+C' });
  });

  it('returns null for empty input', () => {
    expect(parseChord('')).toBeNull();
    expect(parseChord('   ')).toBeNull();
  });

  it('returns null when only modifiers present', () => {
    expect(parseChord('Ctrl+Shift')).toBeNull();
  });
});

describe('parseChords', () => {
  it('splits on " / " into two chords', () => {
    const chords = parseChords('Ctrl+V / Alt+V');
    expect(chords).toHaveLength(2);
    expect(chords[0]).toEqual({ mods: ['ctrl'], key: 'v', raw: 'Ctrl+V' });
    expect(chords[1]).toEqual({ mods: ['alt'], key: 'v', raw: 'Alt+V' });
  });

  it('splits on commas and drops invalid entries', () => {
    const chords = parseChords('Ctrl+R, , Esc');
    expect(chords).toHaveLength(2);
    expect(chords[0].key).toBe('r');
    expect(chords[1].key).toBe('escape');
  });

  it('returns empty array for empty input', () => {
    expect(parseChords('')).toEqual([]);
  });
});

describe('chordFromEvent', () => {
  it('builds a chord from a synthetic KeyboardEvent', () => {
    const e = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    expect(chordFromEvent(e)).toEqual({ mods: ['ctrl'], key: 'r', raw: 'r' });
  });

  it('normalizes Escape and sorts mods', () => {
    const e = new KeyboardEvent('keydown', {
      key: 'Escape',
      ctrlKey: false,
      metaKey: true,
      shiftKey: true,
      altKey: false,
    });
    expect(chordFromEvent(e)).toEqual({
      mods: ['meta', 'shift'],
      key: 'escape',
      raw: 'Escape',
    });
  });
});

describe('chordEquals', () => {
  it('returns true for same key and same mod set (order-independent)', () => {
    const a: KeyChord = { mods: ['ctrl', 'shift'], key: 'p', raw: 'Ctrl+Shift+P' };
    const b: KeyChord = { mods: ['shift', 'ctrl'], key: 'p', raw: 'Shift+Ctrl+P' };
    expect(chordEquals(a, b)).toBe(true);
  });

  it('returns false for different key', () => {
    const a: KeyChord = { mods: ['ctrl'], key: 'r', raw: 'Ctrl+R' };
    const b: KeyChord = { mods: ['ctrl'], key: 'v', raw: 'Ctrl+V' };
    expect(chordEquals(a, b)).toBe(false);
  });

  it('returns false for different mod count', () => {
    const a: KeyChord = { mods: ['ctrl'], key: 'p', raw: 'Ctrl+P' };
    const b: KeyChord = { mods: ['ctrl', 'shift'], key: 'p', raw: 'Ctrl+Shift+P' };
    expect(chordEquals(a, b)).toBe(false);
  });
});

describe('displayChord', () => {
  it('uses mac symbols', () => {
    const chord: KeyChord = { mods: ['ctrl', 'meta', 'shift', 'alt'], key: 'k', raw: 'x' };
    expect(displayChord(chord, 'mac')).toBe('⌃⌘⇧⌥K');
  });

  it('uses win labels with Win for meta', () => {
    const chord: KeyChord = { mods: ['ctrl', 'meta', 'shift', 'alt'], key: 'k', raw: 'x' };
    expect(displayChord(chord, 'win')).toBe('Ctrl+Win+Shift+Alt+K');
  });

  it('uses linux labels with Super for meta', () => {
    const chord: KeyChord = { mods: ['meta'], key: 'k', raw: 'x' };
    expect(displayChord(chord, 'linux')).toBe('Super+K');
  });

  it('title-cases word keys and uppercases single letters', () => {
    expect(displayChord({ mods: ['shift'], key: 'tab', raw: 'x' }, 'win')).toBe('Shift+Tab');
    expect(displayChord({ mods: [], key: 'escape', raw: 'x' }, 'mac')).toBe('Escape');
    expect(displayChord({ mods: ['ctrl'], key: 'r', raw: 'x' }, 'win')).toBe('Ctrl+R');
  });
});
```

- [ ] **Step 3: Run the test — expect FAIL (module `./keys` does not exist; import error / cannot find module).**
```
pnpm vitest run src/lib/keys.test.ts
```

- [ ] **Step 4: Write the minimal implementation `src/lib/keys.ts`.**
```ts
// src/lib/keys.ts
import type { KeyChord, Modifier, Platform } from '../data/types';

const MOD_ORDER: Modifier[] = ['ctrl', 'meta', 'shift', 'alt'];

const MOD_ALIASES: Record<string, Modifier> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  '^': 'ctrl',
  cmd: 'meta',
  command: 'meta',
  '⌘': 'meta',
  meta: 'meta',
  win: 'meta',
  super: 'meta',
  shift: 'shift',
  '⇧': 'shift',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  '⌥': 'alt',
};

function normalizeKey(token: string): string {
  const lower = token.toLowerCase();
  switch (lower) {
    case 'enter':
    case 'return':
      return 'enter';
    case 'esc':
    case 'escape':
      return 'escape';
    case 'tab':
      return 'tab';
    case 'space':
    case ' ':
      return 'space';
    default:
      return lower;
  }
}

function sortMods(mods: Modifier[]): Modifier[] {
  return MOD_ORDER.filter((m) => mods.includes(m));
}

export function parseChord(raw: string): KeyChord | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const tokens = trimmed.split('+').map((t) => t.trim()).filter((t) => t !== '');
  if (tokens.length === 0) return null;

  const mods: Modifier[] = [];
  let key: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const aliasKey = token.toLowerCase();
    const mod = MOD_ALIASES[aliasKey] ?? MOD_ALIASES[token];
    const isLastToken = i === tokens.length - 1;
    if (mod && !isLastToken) {
      if (!mods.includes(mod)) mods.push(mod);
    } else if (mod && isLastToken) {
      // trailing modifier-only token: not a main key
      if (!mods.includes(mod)) mods.push(mod);
    } else {
      key = normalizeKey(token);
    }
  }

  if (key === null) return null;
  return { mods: sortMods(mods), key, raw: trimmed };
}

export function parseChords(raw: string): KeyChord[] {
  const parts = raw
    .split(/\s\/\s|,/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
  const chords: KeyChord[] = [];
  for (const part of parts) {
    const chord = parseChord(part);
    if (chord) chords.push(chord);
  }
  return chords;
}

export function chordFromEvent(e: KeyboardEvent): KeyChord {
  const mods: Modifier[] = [];
  if (e.ctrlKey) mods.push('ctrl');
  if (e.metaKey) mods.push('meta');
  if (e.shiftKey) mods.push('shift');
  if (e.altKey) mods.push('alt');
  return { mods: sortMods(mods), key: normalizeKey(e.key), raw: e.key };
}

export function chordEquals(a: KeyChord, b: KeyChord): boolean {
  if (a.key !== b.key) return false;
  if (a.mods.length !== b.mods.length) return false;
  return a.mods.every((m) => b.mods.includes(m));
}

function macSymbol(mod: Modifier): string {
  switch (mod) {
    case 'ctrl':
      return '⌃';
    case 'meta':
      return '⌘';
    case 'shift':
      return '⇧';
    case 'alt':
      return '⌥';
  }
}

function pcLabel(mod: Modifier, platform: Platform): string {
  switch (mod) {
    case 'ctrl':
      return 'Ctrl';
    case 'meta':
      return platform === 'linux' ? 'Super' : 'Win';
    case 'shift':
      return 'Shift';
    case 'alt':
      return 'Alt';
  }
}

function keyLabel(key: string): string {
  if (key.length === 1) return key.toUpperCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function displayChord(chord: KeyChord, platform: Platform): string {
  const mods = sortMods(chord.mods);
  const label = keyLabel(chord.key);
  if (platform === 'mac') {
    return mods.map(macSymbol).join('') + label;
  }
  return [...mods.map((m) => pcLabel(m, platform)), label].join('+');
}
```

- [ ] **Step 5: Run the test — expect PASS (all `parseChord`, `parseChords`, `chordFromEvent`, `chordEquals`, `displayChord` cases green).**
```
pnpm vitest run src/lib/keys.test.ts
```

- [ ] **Step 6: Commit.**
```
git add src/data/types.ts src/lib/keys.ts src/lib/keys.test.ts
git commit -m "$(printf 'feat(keys): add core types and key-chord parsing\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 3: Domains + content build pipeline

**Files:**
- Create: `src/data/domains.ts`
- Create: `scripts/transform.mjs`
- Create: `scripts/build-catalog.mjs`
- Create (generated): `src/data/catalog.ts`
- Modify: `package.json` (add `build:catalog` script)
- Test: `scripts/transform.test.mjs`

**Interfaces:**
- Consumes: `CatalogItem`, `Category`, `Confidence`, `DomainKey` from `src/data/types.ts`; raw JSON at `content/cc-catalog.raw.json` (`{ catalogs: { domain:string; items: RawItem[] }[]; missingItems: RawItem[] }`)
- Produces: `export const DOMAINS: DomainMeta[]`; `export function domainOf(key:DomainKey):DomainMeta` where `DomainMeta = {key:DomainKey;label:string;icon:string;blurb:string}`
- Produces (scripts, JS — no TS types at runtime): `slugify(name:string):string`; `mapDomain(rawDomainString:string):DomainKey`; `normalizeCategory(raw:string):Category`; `transformCatalog(raw):CatalogItem[]`
- Produces (generated): `export const CATALOG: CatalogItem[]`

---

- [ ] **Step 1: Write failing test for domains.ts**

Create `src/data/__tests__/domains.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DOMAINS, domainOf } from '../domains';

const KEYS = [
  'interactive', 'slash', 'cli', 'settings', 'hooks', 'mcp',
  'subagents', 'permissions', 'memory', 'plugins', 'customization', 'sessions',
] as const;

describe('DOMAINS', () => {
  it('has exactly 12 entries with the contract keys', () => {
    expect(DOMAINS).toHaveLength(12);
    expect(DOMAINS.map((d) => d.key)).toEqual([...KEYS]);
  });

  it('every entry has a non-empty label, icon and blurb', () => {
    for (const d of DOMAINS) {
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.icon.length).toBeGreaterThan(0);
      expect(d.blurb.length).toBeGreaterThan(0);
    }
  });

  it('keys are unique', () => {
    expect(new Set(DOMAINS.map((d) => d.key)).size).toBe(12);
  });
});

describe('domainOf', () => {
  it('returns the matching DomainMeta', () => {
    expect(domainOf('hooks').label).toBe('Hooks');
    expect(domainOf('mcp').key).toBe('mcp');
  });

  it('throws for an unknown key', () => {
    // @ts-expect-error intentionally invalid key
    expect(() => domainOf('nope')).toThrow();
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

`pnpm vitest run src/data/__tests__/domains.test.ts`

Expected FAIL: cannot resolve module `../domains` (file does not exist yet).

- [ ] **Step 3: Implement src/data/domains.ts (minimal, makes test pass)**

Create `src/data/domains.ts`:

```ts
import type { DomainKey } from './types';

export interface DomainMeta {
  key: DomainKey;
  label: string;
  icon: string;
  blurb: string;
}

export const DOMAINS: DomainMeta[] = [
  {
    key: 'interactive',
    label: 'Interactive Mode',
    icon: '⌨️',
    blurb: 'Terminal/REPL controls, keyboard shortcuts, and in-session navigation.',
  },
  {
    key: 'slash',
    label: 'Slash Commands',
    icon: '⚡',
    blurb: 'Built-in /commands you type at the prompt to drive Claude Code.',
  },
  {
    key: 'cli',
    label: 'CLI & Flags',
    icon: '🖥️',
    blurb: 'The claude binary, subcommands, and command-line flags.',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: '⚙️',
    blurb: 'settings.json configuration keys and environment variables.',
  },
  {
    key: 'hooks',
    label: 'Hooks',
    icon: '🪝',
    blurb: 'Lifecycle hook events that run your own scripts around Claude actions.',
  },
  {
    key: 'mcp',
    label: 'MCP',
    icon: '🔌',
    blurb: 'Model Context Protocol servers, tools, and resources in Claude Code.',
  },
  {
    key: 'subagents',
    label: 'Subagents',
    icon: '🤖',
    blurb: 'Specialized agents you delegate scoped tasks to.',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    icon: '🛡️',
    blurb: 'Permission rules and modes that gate tool use.',
  },
  {
    key: 'memory',
    label: 'Memory',
    icon: '🧠',
    blurb: 'CLAUDE.md project memory and how context is remembered.',
  },
  {
    key: 'plugins',
    label: 'Plugins',
    icon: '🧩',
    blurb: 'Installable plugins that bundle skills, commands, and MCP servers.',
  },
  {
    key: 'customization',
    label: 'Customization',
    icon: '🎨',
    blurb: 'Output styles, status line, themes, and UX tweaks.',
  },
  {
    key: 'sessions',
    label: 'Sessions',
    icon: '🧵',
    blurb: 'Sessions, context management, and workflow automation.',
  },
];

export function domainOf(key: DomainKey): DomainMeta {
  const found = DOMAINS.find((d) => d.key === key);
  if (!found) {
    throw new Error(`Unknown domain key: ${key}`);
  }
  return found;
}
```

- [ ] **Step 4: Run the test — expect PASS**

`pnpm vitest run src/data/__tests__/domains.test.ts`

Expected PASS: all assertions green (12 entries, labels/icons/blurbs present, `domainOf('hooks').label === 'Hooks'`, throw on unknown).

- [ ] **Step 5: Commit domains.ts**

```sh
git add src/data/domains.ts src/data/__tests__/domains.test.ts
git commit -m "feat(data): add DOMAINS metadata and domainOf lookup

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Write failing test for the transform helpers**

Create `scripts/transform.test.mjs` (Vitest can import `.mjs`):

```ts
import { describe, it, expect } from 'vitest';
import {
  slugify,
  mapDomain,
  normalizeCategory,
  transformCatalog,
} from './transform.mjs';

const RAW = {
  catalogs: [
    {
      domain: 'Claude Code Terminal/REPL Interactive Controls',
      overview: 'interactive',
      items: [
        {
          name: 'Ctrl+C',
          category: 'shortcut',
          summary: 'Interrupt running operation',
          syntax: 'Press Ctrl+C',
          details: 'First press interrupts.',
          example: 'Press Ctrl+C to stop.',
          platformNotes: 'Same everywhere',
        },
        {
          name: 'Ctrl+C',
          category: 'shortcut',
          summary: 'Duplicate name to exercise slug dedupe',
        },
      ],
    },
    {
      domain: 'Claude Code CLI',
      overview: 'cli',
      items: [
        {
          name: 'ANTHROPIC_MODEL',
          category: 'env-flag',
          summary: 'Pick the model via env var',
          source: 'https://example.test/cli',
        },
      ],
    },
  ],
  missingItems: [
    {
      name: 'Reverse search Ctrl+S',
      domain: 'Claude Code Terminal/REPL Interactive Controls',
      category: 'Keyboard Shortcuts - Reverse Search',
      summary: 'Cycle scope in reverse search',
      newcomerTip: 'Press Ctrl+R first.',
    },
  ],
};

describe('slugify', () => {
  it('lowercases, strips symbols and hyphenates', () => {
    expect(slugify('Ctrl+C')).toBe('ctrl-c');
    expect(slugify('ANTHROPIC_MODEL')).toBe('anthropic-model');
    expect(slugify('  /add-dir  ')).toBe('add-dir');
  });
});

describe('mapDomain', () => {
  it('maps the 12 raw domain strings to DomainKeys', () => {
    expect(mapDomain('Claude Code Terminal/REPL Interactive Controls')).toBe('interactive');
    expect(mapDomain('Claude Code CLI')).toBe('cli');
    expect(mapDomain('Claude Code Hooks System')).toBe('hooks');
    expect(mapDomain('Claude Code: Sessions, Context, and Workflow Automation')).toBe('sessions');
  });

  it('throws on an unmapped domain string', () => {
    expect(() => mapDomain('Totally Unknown Domain')).toThrow();
  });
});

describe('normalizeCategory', () => {
  it('maps env-flag to cli-flag', () => {
    expect(normalizeCategory('env-flag')).toBe('cli-flag');
  });
  it('maps best-practice/troubleshooting/example to concept', () => {
    expect(normalizeCategory('best-practice')).toBe('concept');
    expect(normalizeCategory('troubleshooting')).toBe('concept');
    expect(normalizeCategory('example')).toBe('concept');
  });
  it('maps tool to feature', () => {
    expect(normalizeCategory('tool')).toBe('feature');
  });
  it('passes through canonical categories', () => {
    expect(normalizeCategory('slash-command')).toBe('slash-command');
    expect(normalizeCategory('hook')).toBe('hook');
  });
  it('maps unknown free-form categories to concept', () => {
    expect(normalizeCategory('Keyboard Shortcuts - Reverse Search')).toBe('concept');
  });
});

describe('transformCatalog', () => {
  const items = transformCatalog(RAW);

  it('produces one item per raw item across catalogs + missingItems', () => {
    expect(items).toHaveLength(4);
  });

  it('assigns unique ids with numeric suffix dedupe', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('ctrl-c');
    expect(ids).toContain('ctrl-c-2');
  });

  it('maps domains and normalizes categories', () => {
    const env = items.find((i) => i.name === 'ANTHROPIC_MODEL');
    expect(env.domain).toBe('cli');
    expect(env.category).toBe('cli-flag');
  });

  it('defaults confidence: verified for catalogs, advanced for missingItems', () => {
    const fromCatalog = items.find((i) => i.name === 'Ctrl+C');
    const fromMissing = items.find((i) => i.name === 'Reverse search Ctrl+S');
    expect(fromCatalog.confidence).toBe('verified');
    expect(fromMissing.confidence).toBe('advanced');
  });

  it('copies optional fields and omits absent ones', () => {
    const ctrlC = items.find((i) => i.id === 'ctrl-c');
    expect(ctrlC.syntax).toBe('Press Ctrl+C');
    expect(ctrlC.details).toBe('First press interrupts.');
    expect(ctrlC).not.toHaveProperty('newcomerTip');
    const missing = items.find((i) => i.name === 'Reverse search Ctrl+S');
    expect(missing.newcomerTip).toBe('Press Ctrl+R first.');
  });
});
```

- [ ] **Step 7: Run the test — expect FAIL**

`pnpm vitest run scripts/transform.test.mjs`

Expected FAIL: cannot resolve `./transform.mjs` (file does not exist yet).

- [ ] **Step 8: Implement scripts/transform.mjs (makes the test pass)**

Create `scripts/transform.mjs`:

```js
// Pure content-transform helpers. Plain Node ESM — no TS runner dependency.

const DOMAIN_MAP = {
  'Claude Code Terminal/REPL Interactive Controls': 'interactive',
  'Claude Code Slash Commands': 'slash',
  'Claude Code CLI': 'cli',
  'Claude Code settings.json Configuration System': 'settings',
  'Claude Code Hooks System': 'hooks',
  'Model Context Protocol (MCP) in Claude Code': 'mcp',
  'Claude Code Subagents': 'subagents',
  'Claude Code Permissions and Modes': 'permissions',
  'Claude Code Project Memory System (CLAUDE.md)': 'memory',
  'Claude Code Plugins': 'plugins',
  'Claude Code Customization and UX': 'customization',
  'Claude Code: Sessions, Context, and Workflow Automation': 'sessions',
};

const CANONICAL_CATEGORIES = new Set([
  'shortcut',
  'slash-command',
  'cli-flag',
  'setting',
  'hook',
  'mcp',
  'subagent',
  'permission-mode',
  'memory',
  'plugin',
  'customization',
  'feature',
  'concept',
]);

const CATEGORY_ALIASES = {
  'env-flag': 'cli-flag',
  'best-practice': 'concept',
  troubleshooting: 'concept',
  example: 'concept',
  tool: 'feature',
};

const OPTIONAL_FIELDS = [
  'syntax',
  'details',
  'example',
  'newcomerTip',
  'platformNotes',
  'source',
];

export function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mapDomain(rawDomainString) {
  const key = DOMAIN_MAP[rawDomainString];
  if (!key) {
    throw new Error(`Unmapped domain string: ${rawDomainString}`);
  }
  return key;
}

export function normalizeCategory(raw) {
  if (CANONICAL_CATEGORIES.has(raw)) {
    return raw;
  }
  if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, raw)) {
    return CATEGORY_ALIASES[raw];
  }
  return 'concept';
}

function uniqueId(base, used) {
  const slug = base || 'item';
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) {
    n += 1;
  }
  const id = `${slug}-${n}`;
  used.add(id);
  return id;
}

function toCatalogItem(rawItem, domainKey, confidence, used) {
  const item = {
    id: uniqueId(slugify(rawItem.name), used),
    name: rawItem.name,
    category: normalizeCategory(rawItem.category),
    domain: domainKey,
    summary: rawItem.summary,
    confidence,
  };
  for (const field of OPTIONAL_FIELDS) {
    if (rawItem[field] !== undefined && rawItem[field] !== null && rawItem[field] !== '') {
      item[field] = rawItem[field];
    }
  }
  return item;
}

export function transformCatalog(raw) {
  const used = new Set();
  const out = [];

  for (const catalog of raw.catalogs ?? []) {
    const domainKey = mapDomain(catalog.domain);
    for (const rawItem of catalog.items ?? []) {
      out.push(toCatalogItem(rawItem, domainKey, 'verified', used));
    }
  }

  for (const rawItem of raw.missingItems ?? []) {
    const domainKey = mapDomain(rawItem.domain);
    out.push(toCatalogItem(rawItem, domainKey, 'advanced', used));
  }

  return out;
}
```

- [ ] **Step 9: Run the test — expect PASS**

`pnpm vitest run scripts/transform.test.mjs`

Expected PASS: 4 items, unique ids (`ctrl-c`, `ctrl-c-2`), `env-flag`→`cli-flag`, domain `cli`, confidence `verified`/`advanced`, optional fields copied/omitted.

- [ ] **Step 10: Implement scripts/build-catalog.mjs**

Create `scripts/build-catalog.mjs`:

```js
// Reads content/cc-catalog.raw.json, transforms it, and writes the generated
// src/data/catalog.ts. Run via `pnpm build:catalog`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { transformCatalog } from './transform.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const rawPath = resolve(here, '../content/cc-catalog.raw.json');
const outPath = resolve(here, '../src/data/catalog.ts');

const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
const items = transformCatalog(raw);

const file =
  '// AUTO-GENERATED by scripts/build-catalog.mjs — do not edit\n' +
  'import type { CatalogItem } from "./types";\n' +
  'export const CATALOG: CatalogItem[] = ' +
  JSON.stringify(items, null, 2) +
  ';\n';

writeFileSync(outPath, file, 'utf8');
console.log(`Wrote ${items.length} items to ${outPath}`);
```

- [ ] **Step 11: Add the build:catalog script to package.json**

In `package.json`, add to `"scripts"`:

```json
"build:catalog": "node scripts/build-catalog.mjs"
```

- [ ] **Step 12: Run the build and verify the generated catalog**

`pnpm build:catalog`

Expected output: `Wrote 728 items to .../src/data/catalog.ts`. Verify with:

`pnpm vitest run scripts/transform.test.mjs` (still PASS) and `node -e "import('./src/data/catalog.ts').catch(()=>{}); const t=require('fs').readFileSync('src/data/catalog.ts','utf8'); console.log(t.startsWith('// AUTO-GENERATED'), (t.match(/\"id\":/g)||[]).length)"`

Expected: `true 728` (header present, 728 generated items). The file begins with the AUTO-GENERATED comment, the `import type` line, and `export const CATALOG: CatalogItem[] = [ ... ];`.

- [ ] **Step 13: Commit the pipeline and the generated catalog**

```sh
git add scripts/transform.mjs scripts/transform.test.mjs scripts/build-catalog.mjs src/data/catalog.ts package.json
git commit -m "feat(data): add content build pipeline and generate CATALOG

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Fuzzy search

**Files:**
- Create: `src/lib/search.ts`
- Test: `src/lib/search.test.ts`

**Interfaces:**
- Consumes: `CatalogItem` (from `src/data/types.ts`) — `{ id:string; name:string; category:Category; domain:DomainKey; syntax?:string; summary:string; ...; confidence:Confidence; keys?:KeyChord[] }`
- Produces: `SearchResult = { item:CatalogItem; score:number }`; `searchCatalog(items:CatalogItem[], query:string):SearchResult[]`

- [ ] **Step 1: Write failing test for empty + ranking + no-match behavior**

```ts
// src/lib/search.test.ts
import { describe, it, expect } from 'vitest';
import { searchCatalog } from './search';
import type { CatalogItem } from '../data/types';

const fixture: CatalogItem[] = [
  {
    id: 'clear',
    name: '/clear',
    category: 'slash-command',
    domain: 'slash',
    syntax: '/clear',
    summary: 'Clear the conversation history and free up context',
    confidence: 'verified',
  },
  {
    id: 'compact',
    name: '/compact',
    category: 'slash-command',
    domain: 'slash',
    syntax: '/compact',
    summary: 'Summarize and clear earlier turns to save tokens',
    confidence: 'verified',
  },
  {
    id: 'plan-mode',
    name: 'Plan mode',
    category: 'permission-mode',
    domain: 'permissions',
    syntax: 'shift+tab',
    summary: 'Enter plan mode to draft before editing',
    confidence: 'verified',
  },
  {
    id: 'clearview',
    name: 'Clearview setting',
    category: 'setting',
    domain: 'settings',
    summary: 'Toggle a compact rendering option',
    confidence: 'advanced',
  },
];

describe('searchCatalog', () => {
  it('returns all items in input order with score 0 for empty query', () => {
    const res = searchCatalog(fixture, '   ');
    expect(res.map((r) => r.item.id)).toEqual(['clear', 'compact', 'plan-mode', 'clearview']);
    expect(res.every((r) => r.score === 0)).toBe(true);
  });

  it('ranks the /clear command first when searching "/clear"', () => {
    const res = searchCatalog(fixture, '/clear');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].item.id).toBe('clear');
  });

  it('matches an item via its summary when searching "compact"', () => {
    const res = searchCatalog(fixture, 'compact');
    const ids = res.map((r) => r.item.id);
    expect(ids).toContain('compact');
    expect(ids).toContain('clearview');
  });

  it('requires all tokens for multi-token query "plan mode"', () => {
    const res = searchCatalog(fixture, 'plan mode');
    expect(res.map((r) => r.item.id)).toEqual(['plan-mode']);
  });

  it('returns [] when no item matches', () => {
    expect(searchCatalog(fixture, 'zzzznope')).toEqual([]);
  });

  it('breaks score ties by name ascending', () => {
    const res = searchCatalog(fixture, 'clear');
    const clearIdx = res.findIndex((r) => r.item.id === 'clear');
    const viewIdx = res.findIndex((r) => r.item.id === 'clearview');
    expect(clearIdx).toBeGreaterThanOrEqual(0);
    expect(viewIdx).toBeGreaterThanOrEqual(0);
    // '/clear' sorts before 'Clearview setting' when scores tie
    if (res[clearIdx].score === res[viewIdx].score) {
      expect(clearIdx).toBeLessThan(viewIdx);
    }
  });
});
```

- [ ] **Step 2: Run the test (expect FAIL)**

`pnpm vitest run src/lib/search.test.ts`

Expected FAIL: module `./search` cannot be resolved / `searchCatalog` is not exported (no `src/lib/search.ts` yet).

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/search.ts
import type { CatalogItem } from '../data/types';

export type SearchResult = { item: CatalogItem; score: number };

type WeightedField = { value: string; weight: number };

const STARTS_WITH_BONUS = 0.5;

function fieldsOf(item: CatalogItem): WeightedField[] {
  const fields: WeightedField[] = [
    { value: item.name, weight: 5 },
    { value: item.summary, weight: 2 },
    { value: item.domain, weight: 1 },
  ];
  if (item.syntax) {
    fields.push({ value: item.syntax, weight: 3 });
  }
  return fields;
}

function tokenScore(item: CatalogItem, token: string): number {
  let best = 0;
  for (const field of fieldsOf(item)) {
    const value = field.value.toLowerCase();
    if (!value.includes(token)) {
      continue;
    }
    let score = field.weight;
    if (value.startsWith(token)) {
      score += STARTS_WITH_BONUS;
    }
    if (score > best) {
      best = score;
    }
  }
  return best;
}

export function searchCatalog(items: CatalogItem[], query: string): SearchResult[] {
  const normalized = query.toLowerCase().trim();

  if (normalized === '') {
    return items.map((item) => ({ item, score: 0 }));
  }

  const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);

  const results: SearchResult[] = [];
  for (const item of items) {
    let total = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const score = tokenScore(item, token);
      if (score === 0) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll && total > 0) {
      results.push({ item, score: total });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.item.name.localeCompare(b.item.name);
  });

  return results;
}
```

- [ ] **Step 4: Run the test (expect PASS)**

`pnpm vitest run src/lib/search.test.ts`

Expected PASS: empty query returns all 4 in order with score 0; `/clear` ranks `clear` first (name weight 5 + starts-with bonus beats summary-only matches); `compact` matches `compact` (name) and `clearview` (summary); `plan mode` requires both tokens so only `plan-mode` survives; `zzzznope` yields `[]`; ties broken by name asc.

- [ ] **Step 5: Commit**

```
git add src/lib/search.ts src/lib/search.test.ts
git commit -m "feat(search): add weighted fuzzy searchCatalog over catalog fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: localStorage helper

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Produces: `load<T>(key: string, fallback: T): T`
- Produces: `save<T>(key: string, value: T): void`

Both namespace keys under `'cc-trainer:'`, guard for absent `window`/`localStorage`, and wrap all access in `try/catch`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { load, save } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips an object via save then load', () => {
    const value = { a: 1, b: 'two', c: [3, 4] };
    save('round-trip', value);
    expect(load('round-trip', null as unknown as typeof value)).toEqual(value);
  });

  it('namespaces keys under cc-trainer:', () => {
    save('ns', 42);
    expect(localStorage.getItem('cc-trainer:ns')).toBe('42');
    expect(localStorage.getItem('ns')).toBeNull();
  });

  it('returns fallback for a missing key', () => {
    expect(load('missing', 'default')).toBe('default');
  });

  it('returns fallback when stored JSON is corrupt', () => {
    localStorage.setItem('cc-trainer:corrupt', 'not json');
    expect(load('corrupt', 'fallback')).toBe('fallback');
  });

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => save('quota', { big: true })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test (expected FAIL)**

```
pnpm vitest run src/lib/storage.test.ts
```

Expected FAIL: `src/lib/storage.ts` does not exist, so the import of `load`/`save` cannot be resolved.

- [ ] **Step 3: Write minimal implementation**

`src/lib/storage.ts`:

```ts
const PREFIX = 'cc-trainer:';

function getStore(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (typeof window.localStorage === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function load<T>(key: string, fallback: T): T {
  const store = getStore();
  if (store === null) return fallback;
  try {
    const raw = store.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  const store = getStore();
  if (store === null) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* swallow quota / private-mode errors */
  }
}
```

- [ ] **Step 4: Run the test (expected PASS)**

```
pnpm vitest run src/lib/storage.test.ts
```

Expected PASS: round-trip restores the object, namespaced key `cc-trainer:ns` is written, missing key and corrupt JSON both return the fallback, and the mocked throwing `setItem` is swallowed by `save`.

- [ ] **Step 5: Commit**

```
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(lib): add namespaced localStorage load/save helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Hash router + useHashRoute hook

**Files:**
- Create: `src/lib/router.ts`
- Create: `src/hooks/useHashRoute.ts`
- Test: `src/lib/router.test.ts`
- Test: `src/hooks/useHashRoute.test.tsx`

**Interfaces:**
- Consumes: `Mode = 'start'|'playground'|'cheatsheet'|'keyboard'|'quiz'` (from `src/data/types.ts`)
- Produces (`src/lib/router.ts`): `RouteState = {mode:Mode;params:Record<string,string>}`; `parseHash(hash:string):RouteState`; `buildHash(state:RouteState):string`
- Produces (`src/hooks/useHashRoute.ts`): `useHashRoute():[RouteState,(next:RouteState)=>void]`

- [ ] **Step 1: Write failing test for `parseHash` / `buildHash`**

```ts
// src/lib/router.test.ts
import { describe, it, expect } from 'vitest';
import { parseHash, buildHash, type RouteState } from './router';

describe('parseHash', () => {
  it('empty hash → start with no params', () => {
    expect(parseHash('')).toEqual({ mode: 'start', params: {} });
  });

  it('strips leading # and / and reads mode segment', () => {
    expect(parseHash('#/cheatsheet')).toEqual({ mode: 'cheatsheet', params: {} });
  });

  it('parses query string after ? into params', () => {
    expect(parseHash('#/cheatsheet?q=compact')).toEqual({
      mode: 'cheatsheet',
      params: { q: 'compact' },
    });
  });

  it('parses multiple query params', () => {
    expect(parseHash('#/quiz?domain=hooks&n=5')).toEqual({
      mode: 'quiz',
      params: { domain: 'hooks', n: '5' },
    });
  });

  it('falls back to start for an invalid mode', () => {
    expect(parseHash('#/nope')).toEqual({ mode: 'start', params: {} });
  });

  it('keeps params even when mode is invalid', () => {
    expect(parseHash('#/nope?q=x')).toEqual({ mode: 'start', params: { q: 'x' } });
  });
});

describe('buildHash', () => {
  it('builds start with no params explicitly', () => {
    expect(buildHash({ mode: 'start', params: {} })).toBe('#/start');
  });

  it('builds mode with a query string', () => {
    expect(buildHash({ mode: 'cheatsheet', params: { q: 'compact' } })).toBe(
      '#/cheatsheet?q=compact',
    );
  });

  it('round-trips through parseHash', () => {
    const states: RouteState[] = [
      { mode: 'start', params: {} },
      { mode: 'playground', params: {} },
      { mode: 'cheatsheet', params: { q: 'compact' } },
      { mode: 'quiz', params: { domain: 'hooks', n: '5' } },
      { mode: 'keyboard', params: {} },
    ];
    for (const s of states) {
      expect(parseHash(buildHash(s))).toEqual(s);
    }
  });
});
```

- [ ] **Step 2: Run the test (expected FAIL)** — `pnpm vitest run src/lib/router.test.ts`. Fails: `src/lib/router.ts` does not exist, so `parseHash`/`buildHash`/`RouteState` cannot be imported (module resolution error).

- [ ] **Step 3: Write the minimal `src/lib/router.ts`**

```ts
// src/lib/router.ts
import type { Mode } from '../data/types';

export type RouteState = { mode: Mode; params: Record<string, string> };

const MODES: readonly Mode[] = [
  'start',
  'playground',
  'cheatsheet',
  'keyboard',
  'quiz',
];

function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

export function parseHash(hash: string): RouteState {
  const cleaned = hash.replace(/^#/, '').replace(/^\//, '');
  if (cleaned === '') {
    return { mode: 'start', params: {} };
  }
  const queryIndex = cleaned.indexOf('?');
  const path = queryIndex === -1 ? cleaned : cleaned.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : cleaned.slice(queryIndex + 1);

  const segment = path.split('/')[0] ?? '';
  const mode: Mode = isMode(segment) ? segment : 'start';

  const params: Record<string, string> = {};
  if (query !== '') {
    const search = new URLSearchParams(query);
    for (const [key, value] of search.entries()) {
      params[key] = value;
    }
  }
  return { mode, params };
}

export function buildHash(state: RouteState): string {
  const keys = Object.keys(state.params);
  if (keys.length === 0) {
    return `#/${state.mode}`;
  }
  const search = new URLSearchParams(state.params);
  return `#/${state.mode}?${search.toString()}`;
}
```

- [ ] **Step 4: Run the test (expected PASS)** — `pnpm vitest run src/lib/router.test.ts`. All `parseHash`/`buildHash` cases pass, including the round-trip.

- [ ] **Step 5: Commit router module**

```bash
git add src/lib/router.ts src/lib/router.test.ts
git commit -m "feat(router): add parseHash/buildHash hash routing helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Write failing test for `useHashRoute`**

```tsx
// src/hooks/useHashRoute.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('initial state reflects window.location.hash', () => {
    window.location.hash = '#/cheatsheet?q=compact';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({
      mode: 'cheatsheet',
      params: { q: 'compact' },
    });
  });

  it('defaults to start when hash is empty', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({ mode: 'start', params: {} });
  });

  it('updates state when a hashchange event fires', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      window.location.hash = '#/quiz?domain=hooks';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0]).toEqual({
      mode: 'quiz',
      params: { domain: 'hooks' },
    });
  });

  it('setter updates window.location.hash', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      result.current[1]({ mode: 'playground', params: {} });
    });
    expect(window.location.hash).toBe('#/playground');
  });

  it('setter then hashchange flows back into state', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      result.current[1]({ mode: 'cheatsheet', params: { q: 'compact' } });
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0]).toEqual({
      mode: 'cheatsheet',
      params: { q: 'compact' },
    });
  });
});
```

- [ ] **Step 7: Run the test (expected FAIL)** — `pnpm vitest run src/hooks/useHashRoute.test.tsx`. Fails: `src/hooks/useHashRoute.ts` does not exist, so `useHashRoute` cannot be imported (module resolution error).

- [ ] **Step 8: Write the minimal `src/hooks/useHashRoute.ts`**

```ts
// src/hooks/useHashRoute.ts
import { useCallback, useEffect, useState } from 'react';
import { buildHash, parseHash, type RouteState } from '../lib/router';

export function useHashRoute(): [RouteState, (next: RouteState) => void] {
  const [state, setState] = useState<RouteState>(() =>
    parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = (): void => {
      setState(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const navigate = useCallback((next: RouteState): void => {
    window.location.hash = buildHash(next);
  }, []);

  return [state, navigate];
}
```

- [ ] **Step 9: Run the test (expected PASS)** — `pnpm vitest run src/hooks/useHashRoute.test.tsx`. Initial-state, hashchange-update, and setter cases all pass under jsdom.

- [ ] **Step 10: Commit the hook**

```bash
git add src/hooks/useHashRoute.ts src/hooks/useHashRoute.test.tsx
git commit -m "feat(router): add useHashRoute hook bound to window hashchange

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Command engine (parser + registry)

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/parser.ts`
- Create: `src/engine/commandRegistry.ts`
- Test: `src/engine/parser.test.ts`
- Test: `src/engine/commandRegistry.test.ts`

**Interfaces:**
- Consumes: `CatalogItem` (`src/data/types.ts`), `Mode` (`src/data/types.ts`)
- Produces:
  - `src/engine/types.ts`: `LineKind='input'|'output'|'error'|'box'|'suggestion'|'system'`; `TerminalLine={id:string;kind:LineKind;text:string;title?:string}`; `CommandContext={catalog:CatalogItem[]}`; `CommandResult={lines:TerminalLine[];navigate?:Mode;clear?:boolean}`
  - `src/engine/parser.ts`: `InputKind='slash'|'file'|'memory'|'bash'|'text'|'empty'`; `ParsedInput={kind:InputKind;command?:string;args:string;raw:string}`; `parseInput(raw:string):ParsedInput`
  - `src/engine/commandRegistry.ts`: `runCommand(parsed:ParsedInput,ctx:CommandContext):CommandResult`; `completions(prefix:string,ctx:CommandContext):string[]`; `export const NAV_COMMANDS:Record<string,Mode>`

> **Contract note:** `completions` takes `(prefix, ctx)` and is built from `allSlashNames(ctx)` — the sorted, deduped union of `NAV_COMMANDS` keys, the `['/help','/clear']` built-ins, and every `ctx.catalog` item with `category==='slash-command'` whose name starts with `/`. There is NO hardcoded hint list: real catalog slash commands flow through `ctx`. Task 8's PromptBar calls `completions(value, { catalog: CATALOG })`.

---

- [ ] **Step 1: Write failing test for engine types module**

```ts
// src/engine/types.test.ts
import { describe, it, expect } from 'vitest';
import type { LineKind, TerminalLine, CommandContext, CommandResult } from './types';

describe('engine/types', () => {
  it('constructs a TerminalLine with required fields', () => {
    const kind: LineKind = 'output';
    const line: TerminalLine = { id: 'x1', kind, text: 'hello' };
    expect(line.id).toBe('x1');
    expect(line.kind).toBe('output');
    expect(line.text).toBe('hello');
    expect(line.title).toBeUndefined();
  });

  it('allows an optional title on a box line', () => {
    const line: TerminalLine = { id: 'b1', kind: 'box', text: 'body', title: 'Heading' };
    expect(line.title).toBe('Heading');
  });

  it('builds a CommandContext and CommandResult', () => {
    const ctx: CommandContext = { catalog: [] };
    const result: CommandResult = { lines: [], clear: true };
    expect(ctx.catalog).toEqual([]);
    expect(result.lines).toEqual([]);
    expect(result.clear).toBe(true);
    expect(result.navigate).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

`pnpm vitest run src/engine/types.test.ts`

Expected FAIL: module `./types` does not exist — `Cannot find module './types'` / no exported members `LineKind`, `TerminalLine`, `CommandContext`, `CommandResult`.

- [ ] **Step 3: Implement `src/engine/types.ts` (minimal, makes test PASS)**

```ts
// src/engine/types.ts
import type { CatalogItem, Mode } from '../data/types';

export type LineKind = 'input' | 'output' | 'error' | 'box' | 'suggestion' | 'system';

export interface TerminalLine {
  id: string;
  kind: LineKind;
  text: string;
  title?: string;
}

export interface CommandContext {
  catalog: CatalogItem[];
}

export interface CommandResult {
  lines: TerminalLine[];
  navigate?: Mode;
  clear?: boolean;
}
```

- [ ] **Step 4: Run the test — expect PASS**

`pnpm vitest run src/engine/types.test.ts`

Expected PASS: all three assertions resolve; types compile under strict TS.

- [ ] **Step 5: Commit engine types**

```bash
git add src/engine/types.ts src/engine/types.test.ts
git commit -m "$(cat <<'EOF'
feat(engine): add terminal line and command result types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Write failing test for `parseInput`**

```ts
// src/engine/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseInput } from './parser';

describe('parseInput', () => {
  it('treats empty / whitespace-only input as empty', () => {
    expect(parseInput('')).toEqual({ kind: 'empty', args: '', raw: '' });
    expect(parseInput('   ')).toEqual({ kind: 'empty', args: '', raw: '' });
  });

  it('parses a bare slash command', () => {
    expect(parseInput('/help')).toEqual({
      kind: 'slash',
      command: '/help',
      args: '',
      raw: '/help',
    });
  });

  it('lowercases the slash command and keeps args verbatim', () => {
    expect(parseInput('/Cheatsheet Some Args')).toEqual({
      kind: 'slash',
      command: '/cheatsheet',
      args: 'Some Args',
      raw: '/Cheatsheet Some Args',
    });
  });

  it('parses an @ file mention', () => {
    expect(parseInput('@src/index.ts')).toEqual({
      kind: 'file',
      args: 'src/index.ts',
      raw: '@src/index.ts',
    });
  });

  it('parses a # quick memory note', () => {
    expect(parseInput('#remember this')).toEqual({
      kind: 'memory',
      args: 'remember this',
      raw: '#remember this',
    });
  });

  it('parses a ! bash command and keeps args after the prefix', () => {
    expect(parseInput('!ls -la')).toEqual({
      kind: 'bash',
      args: 'ls -la',
      raw: '!ls -la',
    });
  });

  it('falls back to text for ordinary prompts', () => {
    expect(parseInput('hello world')).toEqual({
      kind: 'text',
      args: 'hello world',
      raw: 'hello world',
    });
  });

  it('preserves the original raw including leading whitespace', () => {
    const parsed = parseInput('  /help  ');
    expect(parsed.kind).toBe('slash');
    expect(parsed.command).toBe('/help');
    expect(parsed.raw).toBe('  /help  ');
  });
});
```

- [ ] **Step 7: Run the test — expect FAIL**

`pnpm vitest run src/engine/parser.test.ts`

Expected FAIL: module `./parser` does not exist — `Cannot find module './parser'` / `parseInput is not a function`.

- [ ] **Step 8: Implement `src/engine/parser.ts` (minimal, makes test PASS)**

```ts
// src/engine/parser.ts
export type InputKind = 'slash' | 'file' | 'memory' | 'bash' | 'text' | 'empty';

export interface ParsedInput {
  kind: InputKind;
  command?: string;
  args: string;
  raw: string;
}

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return { kind: 'empty', args: '', raw };
  }

  if (trimmed.startsWith('/')) {
    const spaceIndex = trimmed.indexOf(' ');
    const command =
      spaceIndex === -1 ? trimmed.toLowerCase() : trimmed.slice(0, spaceIndex).toLowerCase();
    const args = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();
    return { kind: 'slash', command, args, raw };
  }

  if (trimmed.startsWith('@')) {
    return { kind: 'file', args: trimmed.slice(1).trim(), raw };
  }

  if (trimmed.startsWith('#')) {
    return { kind: 'memory', args: trimmed.slice(1).trim(), raw };
  }

  if (trimmed.startsWith('!')) {
    return { kind: 'bash', args: trimmed.slice(1).trim(), raw };
  }

  return { kind: 'text', args: trimmed, raw };
}
```

- [ ] **Step 9: Run the test — expect PASS**

`pnpm vitest run src/engine/parser.test.ts`

Expected PASS: all input kinds (empty, slash w/ and w/o args, file, memory, bash, text) resolve; command lowercasing and arg trimming verified.

- [ ] **Step 10: Commit parser**

```bash
git add src/engine/parser.ts src/engine/parser.test.ts
git commit -m "$(cat <<'EOF'
feat(engine): add input parser for slash/file/memory/bash/text

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 11: Write failing test for `commandRegistry`**

```tsx
// src/engine/commandRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { runCommand, completions, NAV_COMMANDS } from './commandRegistry';
import { parseInput } from './parser';
import type { CommandContext } from './types';
import type { CatalogItem } from '../data/types';

const initItem: CatalogItem = {
  id: 'slash-init',
  name: '/init',
  category: 'slash-command',
  domain: 'slash',
  summary: 'Bootstrap a CLAUDE.md memory file for the project.',
  details: 'Scans the repo and writes a starter CLAUDE.md.',
  example: 'Run /init at the project root.',
  confidence: 'verified',
};

const compactItem: CatalogItem = {
  id: 'slash-compact',
  name: '/compact',
  category: 'slash-command',
  domain: 'slash',
  summary: 'Summarize and shrink the conversation context.',
  confidence: 'verified',
};

const ctx: CommandContext = { catalog: [initItem, compactItem] };

const run = (raw: string) => runCommand(parseInput(raw), ctx);

describe('NAV_COMMANDS', () => {
  it('maps each nav slash command to its mode', () => {
    expect(NAV_COMMANDS).toEqual({
      '/start': 'start',
      '/playground': 'playground',
      '/cheatsheet': 'cheatsheet',
      '/keyboard': 'keyboard',
      '/quiz': 'quiz',
    });
  });
});

describe('runCommand — navigation', () => {
  it('navigates to the target mode and emits a system line', () => {
    const result = run('/playground');
    expect(result.navigate).toBe('playground');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe('system');
    expect(result.lines[0].text).toContain('playground');
  });
});

describe('runCommand — built-ins', () => {
  it('/help returns a single titled box listing commands', () => {
    const result = run('/help');
    expect(result.navigate).toBeUndefined();
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe('box');
    expect(result.lines[0].title).toBe('Commands');
    expect(result.lines[0].text).toContain('/cheatsheet');
    expect(result.lines[0].text).toContain('/help');
    expect(result.lines[0].text).toContain('/clear');
  });

  it('/clear returns clear:true with no lines', () => {
    const result = run('/clear');
    expect(result.clear).toBe(true);
    expect(result.lines).toEqual([]);
  });
});

describe('runCommand — catalog slash commands', () => {
  it('renders a known catalog command as a box with its details', () => {
    const result = run('/init');
    expect(result.navigate).toBeUndefined();
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe('box');
    expect(result.lines[0].title).toBe('/init');
    expect(result.lines[0].text).toContain('Bootstrap a CLAUDE.md');
    expect(result.lines[0].text).toContain('Scans the repo');
    expect(result.lines[0].text).toContain('/init at the project root');
  });
});

describe('runCommand — unknown', () => {
  it('returns an error line plus a suggestion line', () => {
    const result = run('/inot');
    expect(result.navigate).toBeUndefined();
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].kind).toBe('error');
    expect(result.lines[0].text).toBe('Unknown command: /inot');
    expect(result.lines[1].kind).toBe('suggestion');
    expect(result.lines[1].text).toContain('/init');
  });

  it('falls back to /help when nothing shares a prefix', () => {
    const result = run('/zzz');
    expect(result.lines[1].kind).toBe('suggestion');
    expect(result.lines[1].text).toContain('/help');
  });
});

describe('runCommand — non-slash prefixes', () => {
  it('explains @ file mentions', () => {
    const result = run('@src/app.ts');
    expect(result.lines[0].text).toContain('@');
    expect(result.lines.some((l) => l.text.includes('src/app.ts'))).toBe(true);
  });

  it('explains # quick memory', () => {
    const result = run('#note to self');
    expect(result.lines[0].text).toContain('#');
    expect(result.lines.some((l) => l.text.includes('memory'))).toBe(true);
  });

  it('explains ! bash mode', () => {
    const result = run('!ls');
    expect(result.lines[0].text).toContain('!');
    expect(result.lines.some((l) => l.text.toLowerCase().includes('bash'))).toBe(true);
  });

  it('treats plain text as a simulated prompt and suggests /help', () => {
    const result = run('how do I commit?');
    expect(result.lines[0].kind).toBe('system');
    expect(result.lines.some((l) => l.text.includes('/help'))).toBe(true);
  });

  it('does nothing for empty input', () => {
    const result = run('   ');
    expect(result.lines).toEqual([]);
  });
});

describe('completions', () => {
  it('returns sorted, deduped slash names sharing the prefix from nav, built-ins and catalog', () => {
    // '/cheatsheet','/clear' come from nav+built-ins; '/compact' comes from ctx.catalog.
    expect(completions('/c', ctx)).toEqual(['/cheatsheet', '/clear', '/compact']);
  });

  it('returns all slash names for the bare slash prefix, including catalog commands', () => {
    const all = completions('/', ctx);
    expect(all).toContain('/help');
    expect(all).toContain('/start');
    expect(all).toContain('/init');
    expect(all).toContain('/compact');
    expect([...all]).toEqual([...all].sort());
  });

  it('returns an empty list when nothing matches', () => {
    expect(completions('/zzz', ctx)).toEqual([]);
  });
});

describe('id contract', () => {
  it('emits lines with empty id (ids assigned by the shell)', () => {
    for (const line of run('/help').lines) {
      expect(line.id).toBe('');
    }
  });
});
```

- [ ] **Step 12: Run the test — expect FAIL**

`pnpm vitest run src/engine/commandRegistry.test.ts`

Expected FAIL: module `./commandRegistry` does not exist — `Cannot find module './commandRegistry'` / no exports `runCommand`, `completions`, `NAV_COMMANDS`.

- [ ] **Step 13: Implement `src/engine/commandRegistry.ts` (minimal, makes test PASS)**

```ts
// src/engine/commandRegistry.ts
import type { Mode } from '../data/types';
import type { CommandContext, CommandResult, LineKind, TerminalLine } from './types';
import type { ParsedInput } from './parser';

export const NAV_COMMANDS: Record<string, Mode> = {
  '/start': 'start',
  '/playground': 'playground',
  '/cheatsheet': 'cheatsheet',
  '/keyboard': 'keyboard',
  '/quiz': 'quiz',
};

const BUILTINS = ['/help', '/clear'] as const;

function line(kind: LineKind, text: string, title?: string): TerminalLine {
  return { id: '', kind, text, title };
}

function builtinSlashNames(): string[] {
  return [...Object.keys(NAV_COMMANDS), ...BUILTINS];
}

function catalogSlashNames(ctx: CommandContext): string[] {
  return ctx.catalog
    .filter((item) => item.category === 'slash-command' && item.name.startsWith('/'))
    .map((item) => item.name);
}

function allSlashNames(ctx: CommandContext): string[] {
  return Array.from(new Set([...builtinSlashNames(), ...catalogSlashNames(ctx)])).sort();
}

export function completions(prefix: string, ctx: CommandContext): string[] {
  return allSlashNames(ctx).filter((name) => name.startsWith(prefix));
}

function longestCommonPrefixLen(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function closestCommand(command: string, ctx: CommandContext): string {
  const candidates = allSlashNames(ctx);
  let best = '/help';
  let bestLen = 1; // require sharing more than just the leading '/'
  for (const candidate of candidates) {
    const len = longestCommonPrefixLen(command, candidate);
    if (len > bestLen) {
      bestLen = len;
      best = candidate;
    }
  }
  return best;
}

function helpBox(): TerminalLine {
  const navList = Object.keys(NAV_COMMANDS).join('  ');
  const text = `${navList}\n/help  /clear\n\nTry /cheatsheet to browse everything.`;
  return line('box', text, 'Commands');
}

function catalogBox(command: string, ctx: CommandContext): TerminalLine | null {
  const item = ctx.catalog.find(
    (entry) => entry.category === 'slash-command' && entry.name === command,
  );
  if (!item) return null;
  const parts = [item.summary];
  if (item.details) parts.push(item.details);
  if (item.example) parts.push(item.example);
  return line('box', parts.join('\n\n'), item.name);
}

function runSlash(parsed: ParsedInput, ctx: CommandContext): CommandResult {
  const command = parsed.command ?? '';

  if (command in NAV_COMMANDS) {
    const mode = NAV_COMMANDS[command];
    return { lines: [line('system', `Opening ${mode}…`)], navigate: mode };
  }

  if (command === '/help') {
    return { lines: [helpBox()] };
  }

  if (command === '/clear') {
    return { lines: [], clear: true };
  }

  const box = catalogBox(command, ctx);
  if (box) {
    return { lines: [box] };
  }

  const closest = closestCommand(command, ctx);
  return {
    lines: [
      line('error', `Unknown command: ${command}`),
      line('suggestion', `Did you mean: ${closest}`),
    ],
  };
}

export function runCommand(parsed: ParsedInput, ctx: CommandContext): CommandResult {
  switch (parsed.kind) {
    case 'empty':
      return { lines: [] };
    case 'slash':
      return runSlash(parsed, ctx);
    case 'file':
      return {
        lines: [
          line(
            'system',
            `Typing @ lets you mention files and folders so Claude reads them: @${parsed.args}`,
          ),
          line(
            'output',
            ctx.catalog.some((item) => item.name === '@')
              ? 'See the @ entry in the catalog for the full file-mention reference.'
              : 'File mentions pull the referenced path into context for the next prompt.',
          ),
        ],
      };
    case 'memory':
      return {
        lines: [
          line(
            'system',
            `Starting a line with # adds a quick memory note saved to CLAUDE.md: #${parsed.args}`,
          ),
          line('output', 'Quick memory notes let you teach Claude project facts on the fly.'),
        ],
      };
    case 'bash':
      return {
        lines: [
          line(
            'system',
            `Prefixing with ! runs the rest as a bash command in your shell: !${parsed.args}`,
          ),
          line('output', 'Bash mode executes the command and feeds its output back to Claude.'),
        ],
      };
    case 'text':
    default:
      return {
        lines: [
          line(
            'system',
            'This is a simulated prompt — no model runs here. Type /help to see what you can try.',
          ),
        ],
      };
  }
}
```

- [ ] **Step 14: Run the test — expect PASS**

`pnpm vitest run src/engine/commandRegistry.test.ts`

Expected PASS: nav navigates, `/help` box, `/clear` clears, catalog `/init` box with details, unknown error+suggestion, `/zzz` falls back to `/help`, and `completions(prefix, ctx)` returns sorted/deduped slash names drawn from nav + built-ins + `ctx.catalog` (so `completions('/c', ctx)` === `['/cheatsheet','/clear','/compact']` and `/compact` is surfaced from the catalog), plus every emitted line carries `id === ''`.

- [ ] **Step 15: Run the full engine suite — expect PASS**

`pnpm vitest run src/engine`

Expected PASS: `types.test.ts`, `parser.test.ts`, and `commandRegistry.test.ts` all green together.

- [ ] **Step 16: Commit the command registry**

```bash
git add src/engine/commandRegistry.ts src/engine/commandRegistry.test.ts
git commit -m "$(cat <<'EOF'
feat(engine): add command registry with nav, help, clear and catalog lookup

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

---

### Task 8: App context + shell chrome (incl. global prompt)

**Files:**
- Create: `src/components/shell/AppContext.tsx`
- Create: `src/components/shell/TitleBar.tsx`
- Create: `src/components/shell/CommandBar.tsx`
- Create: `src/components/shell/PromptBar.tsx`
- Create: `src/components/shell/TerminalWindow.tsx`
- Test: `src/components/shell/AppContext.test.tsx`
- Test: `src/components/shell/CommandBar.test.tsx`
- Test: `src/components/shell/PromptBar.test.tsx`

**Interfaces:**
- Consumes:
  - `useHashRoute():[RouteState,(next:RouteState)=>void]` from `src/hooks/useHashRoute.ts`
  - `RouteState={mode:Mode;params:Record<string,string>}` from `src/lib/router.ts`
  - `parseInput(raw:string):ParsedInput` from `src/engine/parser.ts`
  - `runCommand(parsed:ParsedInput,ctx:CommandContext):CommandResult` and `completions(prefix:string,ctx:CommandContext):string[]` from `src/engine/commandRegistry.ts`
  - `TerminalLine={id:string;kind:LineKind;text:string;title?:string}`, `CommandContext={catalog:CatalogItem[]}`, `CommandResult={lines:TerminalLine[];navigate?:Mode;clear?:boolean}` from `src/engine/types.ts`
  - `CATALOG:CatalogItem[]` from `src/data/catalog.ts`
  - `Mode='start'|'playground'|'cheatsheet'|'keyboard'|'quiz'`, `Platform='mac'|'win'|'linux'` from `src/data/types.ts`
- Produces:
  - `AppContextValue={mode:Mode;setMode:(m:Mode)=>void;params:Record<string,string>;setParams:(p:Record<string,string>)=>void;lines:TerminalLine[];submit:(raw:string)=>void;platform:Platform;setPlatform:(p:Platform)=>void}`
  - `useApp():AppContextValue`
  - `AppProvider({children}):JSX.Element`
  - `TitleBar():JSX.Element`, `CommandBar():JSX.Element`, `PromptBar():JSX.Element`, `TerminalWindow({children}):JSX.Element`

**DOM contract (canonical — Task 13 App test + Task 15 e2e depend on these):**
- `TitleBar` renders a `<header>` containing an `<h1>` whose text is `✻ Claude Code — Interactive Trainer` so `getByRole('heading', { name: /Claude Code/i })` resolves.
- `PromptBar` container element has `data-testid="prompt-bar"`. The `<input>` is wrapped in a `<form>` whose `onSubmit` calls `e.preventDefault()` then `handleSubmit()` (so `input.closest('form')` is a real `HTMLFormElement` and `fireEvent.submit(form)` works; Enter submits via the form). The `<input>` has `data-testid="prompt-input"` and `aria-label="Prompt"` so both `getByRole('textbox', { name: /prompt/i })` and `getByTestId('prompt-input')` resolve. The mode pill shows the current `mode` text.
- `PromptBar` calls `completions(value, { catalog: CATALOG })`, importing `CATALOG` from `../../data/catalog`.
- `CommandBar` is `role="tablist"`; each tab is `role="tab"`; the active tab carries `aria-current="page"`.

---

- [ ] **Step 1: Write failing test for AppContext submit semantics**

Create `src/components/shell/AppContext.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';

function Probe() {
  const { mode, lines, submit } = useApp();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <ul data-testid="lines">
        {lines.map((l) => (
          <li key={l.id} data-id={l.id} data-kind={l.kind}>
            {l.text}
          </li>
        ))}
      </ul>
      <button onClick={() => submit('hi')}>hi</button>
      <button onClick={() => submit('/clear')}>clear</button>
      <button onClick={() => submit('/keyboard')}>kbd</button>
    </div>
  );
}

function setup() {
  return render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('useApp throws without a provider', () => {
    const Bad = () => {
      useApp();
      return null;
    };
    expect(() => render(<Bad />)).toThrow(/AppProvider/);
  });

  it('submit("hi") appends an input echo plus result lines with unique ids', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('hi'));
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]).toHaveAttribute('data-kind', 'input');
    expect(items[0]).toHaveTextContent('hi');
    const ids = items.map((el) => el.getAttribute('data-id'));
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^turn-\d+$/));
  });

  it('submit("/clear") empties the lines', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('hi'));
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    await user.click(screen.getByText('clear'));
    expect(screen.queryAllByRole('listitem').length).toBe(0);
  });

  it('submit("/keyboard") navigates mode to keyboard', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByTestId('mode')).not.toHaveTextContent('keyboard');
    await user.click(screen.getByText('kbd'));
    expect(screen.getByTestId('mode')).toHaveTextContent('keyboard');
  });

  it('ids stay unique across multiple submits', async () => {
    const user = userEvent.setup();
    setup();
    await act(async () => {
      await user.click(screen.getByText('hi'));
    });
    await act(async () => {
      await user.click(screen.getByText('hi'));
    });
    const ids = screen
      .getAllByRole('listitem')
      .map((el) => el.getAttribute('data-id'));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```
pnpm vitest run src/components/shell/AppContext.test.tsx
```

Expected FAIL reason: `Failed to resolve import "./AppContext"` — the module does not exist yet.

- [ ] **Step 3: Implement `AppContext.tsx` (minimal, green)**

Create `src/components/shell/AppContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Mode, Platform } from '../../data/types';
import type { TerminalLine } from '../../engine/types';
import { parseInput } from '../../engine/parser';
import { runCommand } from '../../engine/commandRegistry';
import { CATALOG } from '../../data/catalog';
import { useHashRoute } from '../../hooks/useHashRoute';

export interface AppContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  params: Record<string, string>;
  setParams: (p: Record<string, string>) => void;
  lines: TerminalLine[];
  submit: (raw: string) => void;
  platform: Platform;
  setPlatform: (p: Platform) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'mac';
  const p = navigator.platform || '';
  if (/mac/i.test(p)) return 'mac';
  if (/win/i.test(p)) return 'win';
  return 'linux';
}

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [route, setRoute] = useHashRoute();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const turn = useRef(0);

  const setMode = (m: Mode): void => setRoute({ mode: m, params: {} });
  const setParams = (p: Record<string, string>): void =>
    setRoute({ mode: route.mode, params: p });

  const submit = (raw: string): void => {
    const parsed = parseInput(raw);
    const result = runCommand(parsed, { catalog: CATALOG });
    if (result.clear) {
      setLines([]);
    } else {
      const echo: TerminalLine = { id: '', kind: 'input', text: raw };
      const next = [echo, ...result.lines].map((line) => ({
        ...line,
        id: `turn-${turn.current++}`,
      }));
      setLines((prev) => [...prev, ...next]);
    }
    if (result.navigate) setMode(result.navigate);
  };

  const value: AppContextValue = {
    mode: route.mode,
    setMode,
    params: route.params,
    setParams,
    lines,
    submit,
    platform,
    setPlatform,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
```

- [ ] **Step 4: Run the test — expect PASS**

```
pnpm vitest run src/components/shell/AppContext.test.tsx
```

Expected PASS: all AppContext cases green.

- [ ] **Step 5: Commit AppContext**

```
git add src/components/shell/AppContext.tsx src/components/shell/AppContext.test.tsx
git commit -m "feat(shell): add AppContext with provider, useApp and submit pipeline

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Write failing test for CommandBar**

Create `src/components/shell/CommandBar.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';
import { CommandBar } from './CommandBar';

function ModeReadout() {
  const { mode } = useApp();
  return <span data-testid="mode">{mode}</span>;
}

function setup() {
  return render(
    <AppProvider>
      <ModeReadout />
      <CommandBar />
    </AppProvider>,
  );
}

describe('CommandBar', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders one tab per mode', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    ['start', 'playground', 'cheatsheet', 'keyboard', 'quiz'].forEach((m) => {
      expect(
        screen.getByRole('tab', { name: new RegExp(m, 'i') }),
      ).toBeInTheDocument();
    });
  });

  it('marks the active tab with aria-current', () => {
    setup();
    const active = screen.getByRole('tab', { name: /start/i });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('clicking a tab switches the mode', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('tab', { name: /quiz/i }));
    expect(screen.getByTestId('mode')).toHaveTextContent('quiz');
    expect(screen.getByRole('tab', { name: /quiz/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
```

- [ ] **Step 7: Run the test — expect FAIL**

```
pnpm vitest run src/components/shell/CommandBar.test.tsx
```

Expected FAIL reason: `Failed to resolve import "./CommandBar"` — the component does not exist yet.

- [ ] **Step 8: Implement `CommandBar.tsx` (minimal, green)**

Create `src/components/shell/CommandBar.tsx`:

```tsx
import type { Mode } from '../../data/types';
import { useApp } from './AppContext';

const TABS: { mode: Mode; label: string }[] = [
  { mode: 'start', label: 'Start' },
  { mode: 'playground', label: 'Playground' },
  { mode: 'cheatsheet', label: 'Cheatsheet' },
  { mode: 'keyboard', label: 'Keyboard' },
  { mode: 'quiz', label: 'Quiz' },
];

export function CommandBar(): JSX.Element {
  const { mode, setMode } = useApp();
  return (
    <nav
      role="tablist"
      aria-label="Modes"
      className="flex gap-1 border-b border-neutral-800 px-2 py-1"
    >
      {TABS.map((tab) => {
        const active = tab.mode === mode;
        return (
          <button
            key={tab.mode}
            role="tab"
            type="button"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => setMode(tab.mode)}
            className={
              'rounded px-3 py-1 text-sm transition-colors ' +
              (active
                ? 'bg-[#D97757] text-black'
                : 'text-neutral-400 hover:text-neutral-100')
            }
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 9: Run the test — expect PASS**

```
pnpm vitest run src/components/shell/CommandBar.test.tsx
```

Expected PASS: 5 tabs render, click switches mode, aria-current tracks active.

- [ ] **Step 10: Commit CommandBar**

```
git add src/components/shell/CommandBar.tsx src/components/shell/CommandBar.test.tsx
git commit -m "feat(shell): add CommandBar mode tabs with accent active state

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: Write failing test for PromptBar**

Create `src/components/shell/PromptBar.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppContextValue } from './AppContext';
import { PromptBar } from './PromptBar';

const submit = vi.fn();

vi.mock('./AppContext', async () => {
  const actual =
    await vi.importActual<typeof import('./AppContext')>('./AppContext');
  return {
    ...actual,
    useApp: (): AppContextValue => ({
      mode: 'playground',
      setMode: vi.fn(),
      params: {},
      setParams: vi.fn(),
      lines: [],
      submit,
      platform: 'mac',
      setPlatform: vi.fn(),
    }),
  };
});

describe('PromptBar', () => {
  beforeEach(() => {
    submit.mockClear();
  });

  it('exposes prompt-bar and prompt-input testids with an accessible name', () => {
    render(<PromptBar />);
    expect(screen.getByTestId('prompt-bar')).toBeInTheDocument();
    const input = screen.getByTestId('prompt-input');
    expect(input).toBe(screen.getByRole('textbox', { name: /prompt/i }));
    expect(input.closest('form')).toBeInstanceOf(HTMLFormElement);
  });

  it('shows the current mode label as a pill', () => {
    render(<PromptBar />);
    expect(screen.getByText(/playground/i)).toBeInTheDocument();
  });

  it('submits on Enter then clears the input', async () => {
    const user = userEvent.setup();
    render(<PromptBar />);
    const input = screen.getByRole('textbox', { name: /prompt/i });
    await user.type(input, 'hello{Enter}');
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('hello');
    expect(input).toHaveValue('');
  });

  it('submits via the form (fireEvent.submit) then clears the input', () => {
    render(<PromptBar />);
    const input = screen.getByTestId('prompt-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'world' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('world');
    expect(input).toHaveValue('');
  });

  it('does not submit on empty Enter', async () => {
    const user = userEvent.setup();
    render(<PromptBar />);
    const input = screen.getByRole('textbox', { name: /prompt/i });
    await user.type(input, '{Enter}');
    expect(submit).not.toHaveBeenCalled();
  });

  it('ArrowUp recalls the last submitted entry', async () => {
    const user = userEvent.setup();
    render(<PromptBar />);
    const input = screen.getByRole('textbox', { name: /prompt/i });
    await user.type(input, 'first{Enter}');
    expect(input).toHaveValue('');
    await user.type(input, '{ArrowUp}');
    expect(input).toHaveValue('first');
  });
});
```

- [ ] **Step 12: Run the test — expect FAIL**

```
pnpm vitest run src/components/shell/PromptBar.test.tsx
```

Expected FAIL reason: `Failed to resolve import "./PromptBar"` — the component does not exist yet.

- [ ] **Step 13: Implement `PromptBar.tsx` (minimal, green)**

Create `src/components/shell/PromptBar.tsx`:

```tsx
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { completions } from '../../engine/commandRegistry';
import { CATALOG } from '../../data/catalog';
import { useApp } from './AppContext';

export function PromptBar(): JSX.Element {
  const { mode, submit } = useApp();
  const [value, setValue] = useState('');
  const [hint, setHint] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef<number>(-1);

  const handleSubmit = (): void => {
    const raw = value.trim();
    if (!raw) return;
    history.current = [...history.current, raw];
    cursor.current = history.current.length;
    submit(raw);
    setValue('');
    setHint('');
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    handleSubmit();
  };

  const recall = (delta: number): void => {
    const list = history.current;
    if (list.length === 0) return;
    let next = cursor.current === -1 ? list.length : cursor.current;
    next = Math.min(Math.max(next + delta, 0), list.length);
    cursor.current = next;
    setValue(next >= list.length ? '' : list[next]);
  };

  const handleTab = (): void => {
    const matches = completions(value, { catalog: CATALOG });
    if (matches.length === 1) {
      setValue(matches[0]);
      setHint('');
    } else if (matches.length > 1) {
      setHint(matches.join('  '));
    } else {
      setHint('');
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      recall(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      recall(1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTab();
    }
  };

  return (
    <div
      data-testid="prompt-bar"
      className="border-t border-neutral-800 px-3 py-2"
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <span
          className="rounded bg-[#D97757] px-2 py-0.5 text-xs font-medium text-black"
          aria-label={`Current mode: ${mode}`}
        >
          {mode}
        </span>
        <span className="text-[#D97757]" aria-hidden="true">
          {'>'}
        </span>
        <input
          type="text"
          data-testid="prompt-input"
          aria-label="Prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-neutral-100 outline-none"
        />
      </form>
      {hint ? (
        <div
          data-kind="system"
          className="mt-1 text-xs text-neutral-500"
          role="status"
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 14: Run the test — expect PASS**

```
pnpm vitest run src/components/shell/PromptBar.test.tsx
```

Expected PASS: prompt-bar/prompt-input testids resolve, the input is the `name:/prompt/i` textbox wrapped in a real `<form>`, Enter and `fireEvent.submit(form)` both submit + clear, empty Enter no-ops, ArrowUp recalls last entry.

- [ ] **Step 15: Commit PromptBar**

```
git add src/components/shell/PromptBar.tsx src/components/shell/PromptBar.test.tsx
git commit -m "feat(shell): add persistent PromptBar form with history, completions and mode pill

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 16: Implement `TitleBar.tsx` and `TerminalWindow.tsx` (no new test; covered via composition + the Task 13 App test)**

Create `src/components/shell/TitleBar.tsx` (the `<h1>` text must read `✻ Claude Code — Interactive Trainer` so `getByRole('heading', { name: /Claude Code/i })` resolves):

```tsx
export function TitleBar(): JSX.Element {
  return (
    <header className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
      </span>
      <h1 className="text-sm font-medium text-neutral-200">
        {'✻'} Claude Code — Interactive Trainer
      </h1>
    </header>
  );
}
```

Create `src/components/shell/TerminalWindow.tsx`:

```tsx
import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { CommandBar } from './CommandBar';
import { PromptBar } from './PromptBar';

export function TerminalWindow({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <TitleBar />
      <CommandBar />
      <main className="flex-1 overflow-auto p-4">{children}</main>
      <PromptBar />
    </div>
  );
}
```

- [ ] **Step 17: Typecheck and run the full shell suite — expect PASS**

```
pnpm vitest run src/components/shell
```

Expected PASS: all AppContext, CommandBar and PromptBar tests green; TitleBar/TerminalWindow compile under strict TS (no `any`).

- [ ] **Step 18: Commit TitleBar + TerminalWindow**

```
git add src/components/shell/TitleBar.tsx src/components/shell/TerminalWindow.tsx
git commit -m "feat(shell): add TitleBar chrome with h1 heading and TerminalWindow frame composing shell parts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

---

### Task 9: Playground surface (scrollback rendering)

**Files:**
- Create: `src/components/playground/Scrollback.tsx`
- Create: `src/components/playground/WelcomeBox.tsx`
- Create: `src/components/playground/Playground.tsx`
- Test: `src/components/playground/Playground.test.tsx`
- Modify: _none_
- **Depends on Task 12** (`src/components/common/BoxFrame.tsx`) — `Scrollback` and `WelcomeBox` import `BoxFrame` from `../common/BoxFrame`. Task 12 MUST be completed before this task; do not create a local placeholder.
- **Canonical contract note:** The Playground root MUST NOT set its own `surface-*` testid. The `surface-playground` testid is injected once by the Task 13 `App.tsx` surface wrapper (`<div data-testid={`surface-${mode}`}>`). The `WelcomeBox` is rendered **persistently at the top** of the playground (always visible on this surface, regardless of scrollback contents), with the scrollback below it. `WelcomeBox` root carries `data-testid="welcome"` and includes the text `Welcome to the Claude Code Trainer`; the scrollback container carries `data-testid="scrollback"`. This is what the Task 15 Playwright smoke test asserts after navigating to `/playground`.

**Interfaces:**
- Consumes: `useApp():AppContextValue` from `src/components/shell/AppContext.tsx` (`{ lines:TerminalLine[]; submit:(raw:string)=>void; ... }`); `AppProvider({children}):JSX.Element`
- Consumes: `TerminalLine={id:string;kind:LineKind;text:string;title?:string}` and `LineKind='input'|'output'|'error'|'box'|'suggestion'|'system'` from `src/engine/types.ts`
- Consumes: `BoxFrame({title?:string;children:React.ReactNode}):JSX.Element` from `src/components/common/BoxFrame` (Task 12)
- Produces: `Scrollback():JSX.Element`, `WelcomeBox():JSX.Element`, `Playground():JSX.Element`

**Steps:**

- [ ] **Step 1: Write failing test for Playground (persistent welcome + scrollback)**
```tsx
// src/components/playground/Playground.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useApp } from '../shell/AppContext';
import { Playground } from './Playground';

function Harness() {
  const { submit } = useApp();
  return (
    <div>
      <button onClick={() => submit('/help')}>go</button>
      <Playground />
    </div>
  );
}

describe('Playground', () => {
  it('renders the welcome box persistently at the top', () => {
    render(
      <AppProvider>
        <Playground />
      </AppProvider>,
    );
    const welcome = screen.getByTestId('welcome');
    expect(welcome).toBeInTheDocument();
    expect(welcome).toHaveTextContent(/Welcome to the Claude Code Trainer/i);
    expect(
      screen.getByText(/Type \/help to see commands, or click a tab above/i),
    ).toBeInTheDocument();
  });

  it('always renders an empty scrollback container before any submit', () => {
    render(
      <AppProvider>
        <Playground />
      </AppProvider>,
    );
    expect(screen.getByTestId('scrollback')).toBeInTheDocument();
  });

  it('keeps the welcome box and appends a Commands box after submit("/help")', () => {
    render(
      <AppProvider>
        <Harness />
      </AppProvider>,
    );
    act(() => {
      screen.getByText('go').click();
    });
    // Welcome box is persistent — it stays visible after submitting.
    expect(screen.getByTestId('welcome')).toBeInTheDocument();
    // The /help command yields a `box` line titled "Commands" inside scrollback.
    expect(screen.getByTestId('scrollback')).toHaveTextContent(/Commands/i);
  });

  it('does not set its own surface testid (injected by App wrapper)', () => {
    render(
      <AppProvider>
        <Playground />
      </AppProvider>,
    );
    expect(screen.queryByTestId('surface-playground')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test (expect FAIL)**
  - `pnpm vitest run src/components/playground/Playground.test.tsx`
  - Expected FAIL: cannot resolve `./Playground` (module does not exist) — `Failed to resolve import "./Playground"`.

- [ ] **Step 3: Create WelcomeBox (minimal implementation)**
```tsx
// src/components/playground/WelcomeBox.tsx
import { BoxFrame } from '../common/BoxFrame';

export function WelcomeBox(): JSX.Element {
  return (
    <div data-testid="welcome">
      <BoxFrame title="✻ Welcome to the Claude Code Trainer">
        <div className="space-y-2 text-sm">
          <p className="text-neutral-200">
            Type /help to see commands, or click a tab above to explore.
          </p>
          <p className="text-neutral-400">
            Tip: this is a faux terminal — nothing here touches your real
            machine, so experiment freely.
          </p>
        </div>
      </BoxFrame>
    </div>
  );
}
```

- [ ] **Step 4: Create Scrollback (minimal implementation)**
```tsx
// src/components/playground/Scrollback.tsx
import { useEffect, useRef } from 'react';
import { useApp } from '../shell/AppContext';
import { BoxFrame } from '../common/BoxFrame';
import type { TerminalLine } from '../../engine/types';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function LineRow({ line }: { line: TerminalLine }): JSX.Element {
  switch (line.kind) {
    case 'input':
      return (
        <div className="font-mono text-sm text-neutral-500">
          {'> '}
          {line.text}
        </div>
      );
    case 'error':
      return (
        <div role="alert" className="font-mono text-sm text-red-400">
          {line.text}
        </div>
      );
    case 'suggestion':
      return (
        <div className="font-mono text-sm text-[#D97757]/70">{line.text}</div>
      );
    case 'box':
      return (
        <BoxFrame title={line.title}>
          <div className="whitespace-pre-wrap font-mono text-sm text-neutral-200">
            {line.text}
          </div>
        </BoxFrame>
      );
    case 'output':
    case 'system':
    default:
      return (
        <div className="whitespace-pre-wrap font-mono text-sm text-neutral-200">
          {line.text}
        </div>
      );
  }
}

export function Scrollback(): JSX.Element {
  const { lines } = useApp();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = endRef.current;
    if (!node) return;
    node.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [lines]);

  return (
    <div className="space-y-2" data-testid="scrollback">
      {lines.map((line) => (
        <LineRow key={line.id} line={line} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 5: Create Playground (minimal implementation)**
```tsx
// src/components/playground/Playground.tsx
import { Scrollback } from './Scrollback';
import { WelcomeBox } from './WelcomeBox';

export function Playground(): JSX.Element {
  // WelcomeBox is rendered persistently at the top of the playground surface,
  // with the scrollback below it. The surface-playground testid is injected by
  // the App.tsx surface wrapper (Task 13), NOT here.
  return (
    <div className="space-y-4 p-4">
      <WelcomeBox />
      <Scrollback />
    </div>
  );
}
```

- [ ] **Step 6: Run the test (expect PASS)**
  - `pnpm vitest run src/components/playground/Playground.test.tsx`
  - Expected PASS: the `welcome` testid is always present and contains "Welcome to the Claude Code Trainer"; the `scrollback` container is always rendered; after `submit('/help')` the `/help` command yields a `box` line titled "Commands" inside scrollback while the welcome box remains visible; the Playground does not set a `surface-playground` testid.

- [ ] **Step 7: Commit**
  - `git add src/components/playground/Scrollback.tsx src/components/playground/WelcomeBox.tsx src/components/playground/Playground.tsx src/components/playground/Playground.test.tsx`
  - ```
    git commit -m "feat(playground): persistent welcome box and scrollback rendering

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
    ```

---

---

### Task 10: Cheatsheet surface (search + filter + drawer)

**Files:**
- Create: `src/components/common/index.tsx` (interim stub — **Task 12 deletes these stub bodies and re-points this file to the real components**)
- Create: `src/components/cheatsheet/SearchBox.tsx`
- Create: `src/components/cheatsheet/Filters.tsx`
- Create: `src/components/cheatsheet/ItemCard.tsx`
- Create: `src/components/cheatsheet/ItemDrawer.tsx`
- Create: `src/components/cheatsheet/Cheatsheet.tsx`
- Test: `src/components/cheatsheet/Cheatsheet.test.tsx`
- Modify: (none)

**Interfaces:**
- Consumes:
  - `CATALOG: CatalogItem[]` from `src/data/catalog.ts`
  - `DOMAINS: DomainMeta[]`, `domainOf(key:DomainKey):DomainMeta` from `src/data/domains.ts`
  - `searchCatalog(items:CatalogItem[],query:string):SearchResult[]` (`SearchResult={item:CatalogItem;score:number}`) from `src/lib/search.ts`
  - `useApp():AppContextValue` from `src/components/shell/AppContext.tsx` (reads `params.q`)
  - `CopyButton`, `Badge` from `src/components/common` (Task 12 — **dependency**; an interim stub is created here in Step 1 and replaced by Task 12)
  - Types `CatalogItem`, `Category`, `DomainKey` from `src/data/types.ts`
- Produces:
  - `SearchBox({value,onChange}:{value:string;onChange:(v:string)=>void}):JSX.Element`
  - `Filters({domain,category,onDomain,onCategory}:{domain:DomainKey|null;category:Category|null;onDomain:(d:DomainKey|null)=>void;onCategory:(c:Category|null)=>void}):JSX.Element`
  - `ItemCard({item,active,onOpen}:{item:CatalogItem;active?:boolean;onOpen:(i:CatalogItem)=>void}):JSX.Element`
  - `ItemDrawer({item,onClose}:{item:CatalogItem;onClose:()=>void}):JSX.Element`
  - `Cheatsheet():JSX.Element`

**Canonical DOM contract (must match exactly — Task 13 App test and Task 15 e2e depend on these):**
- Search input is `<input type="search">` with `aria-label="Search features"` so both `getByRole('searchbox')` and `getByLabelText('Search features')` resolve.
- Results container `data-testid="results-grid"`; each card `data-testid="item-card"` with `role="button"`; empty state `data-testid="empty-state"`; detail drawer `role="dialog"` + `aria-modal="true"`.
- `Cheatsheet` root MUST NOT set a `surface-*` testid. The single source of `data-testid="surface-cheatsheet"` is the surface wrapper in Task 13 `App.tsx` (`<div data-testid={\`surface-${mode}\`}>`). Do **not** add `data-testid="surface-cheatsheet"` here.
- `Badge` is invoked with an explicit variant: `<Badge variant="advanced">advanced</Badge>`. Per the canonical contract, Task 12's real `Badge` declares `variant?: 'advanced' | 'domain' | 'category'` (OPTIONAL, default `'advanced'`); the interim stub below mirrors that optional shape so this code typechecks both before and after Task 12.

---

- [ ] **Step 1: Failing test — common stub + SearchBox renders, exposes a searchbox role, and the `/` shortcut focuses it**

Create an interim `src/components/common/index.tsx` so the suite compiles ahead of Task 12. **Task 12 deletes these stub bodies and rewrites this file to `export * from './BoxFrame'; export * from './CopyButton'; export * from './Badge'; export * from './Cursor'; export * from './Kbd';`** — so `'../common'` then resolves to the real components. The stub `Badge` accepts the same OPTIONAL `variant` prop the real Badge will declare (default `'advanced'`), and the stub `CopyButton` uses the canonical `Copied!` confirmation text (single source of truth), so nothing about the public surface changes when Task 12 swaps in the real implementations:

```tsx
// src/components/common/index.tsx
// INTERIM STUB — replaced by Task 12 with re-exports of the real components.
import { useState } from 'react';
import type { ReactNode } from 'react';

export type BadgeVariant = 'advanced' | 'domain' | 'category';

export function Badge({
  variant = 'advanced',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}): JSX.Element {
  return (
    <span className="badge" data-variant={variant}>
      {children}
    </span>
  );
}

export function CopyButton({ text }: { text: string }): JSX.Element {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
      }}
    >
      {done ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

Then write the first failing test:

```tsx
// src/components/cheatsheet/Cheatsheet.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SearchBox } from './SearchBox';
import { Filters } from './Filters';
import { ItemCard } from './ItemCard';
import { ItemDrawer } from './ItemDrawer';
import { Cheatsheet } from './Cheatsheet';
import { CATALOG } from '../../data/catalog';
import { DOMAINS } from '../../data/domains';
import type { CatalogItem } from '../../data/types';

const clearItem = (): CatalogItem => {
  const found = CATALOG.find((i) => i.name === '/clear');
  if (!found) throw new Error('expected /clear in CATALOG');
  return found;
};

beforeEach(() => {
  window.location.hash = '';
});

describe('SearchBox', () => {
  it('renders an accessible searchbox and focuses on "/"', () => {
    let value = '';
    render(<SearchBox value={value} onChange={(v) => (value = v)} />);
    const input = screen.getByRole('searchbox', { name: /search features/i }) as HTMLInputElement;
    expect(input).toBe(screen.getByLabelText('Search features'));
    expect(input.placeholder).toContain('Search features');
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);
  });

  it('ignores "/" while focus is already in an input', () => {
    render(
      <div>
        <input aria-label="other" />
        <SearchBox value="" onChange={() => {}} />
      </div>,
    );
    const other = screen.getByLabelText('other');
    other.focus();
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(other);
  });
});

describe('Filters', () => {
  it('renders an All chip plus one chip per domain with aria-pressed', () => {
    render(
      <Filters domain={null} category={null} onDomain={() => {}} onCategory={() => {}} />,
    );
    const all = screen.getByRole('button', { name: 'All domains' });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    for (const d of DOMAINS) {
      expect(screen.getByRole('button', { name: d.label })).toBeInTheDocument();
    }
  });
});

describe('ItemCard', () => {
  it('renders item name and fires onOpen', () => {
    const item = clearItem();
    let opened: CatalogItem | null = null;
    render(<ItemCard item={item} onOpen={(i) => (opened = i)} />);
    const card = screen.getByRole('button', { name: new RegExp(item.name, 'i') });
    fireEvent.click(card);
    expect(opened).toBe(item);
  });
});

describe('ItemDrawer', () => {
  it('is a modal dialog and closes on Escape', () => {
    const item = clearItem();
    let closed = false;
    render(<ItemDrawer item={item} onClose={() => (closed = true)} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(closed).toBe(true);
  });
});

describe('Cheatsheet', () => {
  it('renders cards with a results count', () => {
    render(<Cheatsheet />);
    expect(screen.getByTestId('results-count')).toHaveTextContent(/\d+/);
    expect(screen.getAllByTestId('item-card').length).toBeGreaterThan(0);
  });

  it('typing "clear" narrows results so /clear appears', () => {
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'clear' } });
    const grid = screen.getByTestId('results-grid');
    expect(within(grid).getByText('/clear')).toBeInTheDocument();
  });

  it('selecting a domain filter reduces the set', () => {
    render(<Cheatsheet />);
    const before = screen.getAllByTestId('item-card').length;
    fireEvent.click(screen.getByRole('button', { name: DOMAINS[0].label }));
    const after = screen.getAllByTestId('item-card').length;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
  });

  it('clicking a card opens the drawer with its details', () => {
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'clear' } });
    const grid = screen.getByTestId('results-grid');
    fireEvent.click(within(grid).getByText('/clear').closest('[data-testid="item-card"]')!);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('/clear')).toBeInTheDocument();
  });

  it('a no-match query shows the empty state', () => {
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'zzzznotathing_qqq' } });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('Arrow Down then Enter opens the drawer', () => {
    render(<Cheatsheet />);
    const grid = screen.getByTestId('results-grid');
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not set its own surface-* testid (App.tsx owns surface-cheatsheet)', () => {
    render(<Cheatsheet />);
    expect(screen.queryByTestId('surface-cheatsheet')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it (expected FAIL)**

`pnpm vitest run src/components/cheatsheet/Cheatsheet.test.tsx`

Expected FAIL: cannot resolve `./SearchBox`, `./Filters`, `./ItemCard`, `./ItemDrawer`, `./Cheatsheet` — modules do not exist yet.

- [ ] **Step 3: Implement `SearchBox.tsx` (minimal, green for SearchBox specs)**

```tsx
// src/components/cheatsheet/SearchBox.tsx
import { useEffect, useRef } from 'react';

export function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== '/') return;
      const el = document.activeElement;
      const tag = el?.tagName;
      const editable = el instanceof HTMLElement && el.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <input
      ref={ref}
      type="search"
      aria-label="Search features"
      placeholder="Search features…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-neutral-900 px-3 py-2 text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-[#D97757]"
    />
  );
}
```

- [ ] **Step 4: Implement `Filters.tsx`**

```tsx
// src/components/cheatsheet/Filters.tsx
import { DOMAINS } from '../../data/domains';
import type { Category, DomainKey } from '../../data/types';

const CATEGORIES: Category[] = [
  'shortcut',
  'slash-command',
  'cli-flag',
  'setting',
  'hook',
  'mcp',
  'subagent',
  'permission-mode',
  'memory',
  'plugin',
  'customization',
  'feature',
  'concept',
];

function chipClass(active: boolean): string {
  return [
    'rounded-full border px-3 py-1 text-sm transition',
    active
      ? 'border-[#D97757] bg-[#D97757]/20 text-[#D97757]'
      : 'border-neutral-700 text-neutral-300 hover:border-neutral-500',
  ].join(' ');
}

export function Filters({
  domain,
  category,
  onDomain,
  onCategory,
}: {
  domain: DomainKey | null;
  category: Category | null;
  onDomain: (d: DomainKey | null) => void;
  onCategory: (c: Category | null) => void;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Domain filters">
        <button
          type="button"
          aria-label="All domains"
          aria-pressed={domain === null}
          className={chipClass(domain === null)}
          onClick={() => onDomain(null)}
        >
          All
        </button>
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            type="button"
            aria-label={d.label}
            aria-pressed={domain === d.key}
            className={chipClass(domain === d.key)}
            onClick={() => onDomain(domain === d.key ? null : d.key)}
          >
            <span aria-hidden="true">{d.icon} </span>
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
        <button
          type="button"
          aria-label="All categories"
          aria-pressed={category === null}
          className={chipClass(category === null)}
          onClick={() => onCategory(null)}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={category === c}
            className={chipClass(category === c)}
            onClick={() => onCategory(category === c ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement `ItemCard.tsx`**

`ItemCard` passes the variant explicitly: `<Badge variant="advanced">advanced</Badge>`. This typechecks against the interim stub (Step 1) AND against Task 12's real `Badge` (whose `variant` is optional with default `'advanced'`), so the swap in Task 12 is transparent and strict TypeScript stays satisfied with no `any`.

```tsx
// src/components/cheatsheet/ItemCard.tsx
import { Badge } from '../common';
import { domainOf } from '../../data/domains';
import type { CatalogItem } from '../../data/types';

export function ItemCard({
  item,
  active = false,
  onOpen,
}: {
  item: CatalogItem;
  active?: boolean;
  onOpen: (i: CatalogItem) => void;
}): JSX.Element {
  const dm = domainOf(item.domain);
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="item-card"
      aria-pressed={active}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={[
        'flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition',
        active
          ? 'border-[#D97757] bg-neutral-900'
          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-600',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-neutral-100">{item.name}</span>
        {item.confidence === 'advanced' && <Badge variant="advanced">advanced</Badge>}
      </div>
      {item.syntax && (
        <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-[#D97757]">
          {item.syntax}
        </code>
      )}
      <p className="text-sm text-neutral-400">{item.summary}</p>
      <span className="text-xs text-neutral-500">
        <span aria-hidden="true">{dm.icon} </span>
        {dm.label}
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Implement `ItemDrawer.tsx`**

```tsx
// src/components/cheatsheet/ItemDrawer.tsx
import { useEffect, useRef } from 'react';
import { CopyButton } from '../common';
import { domainOf } from '../../data/domains';
import type { CatalogItem } from '../../data/types';

export function ItemDrawer({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [item.id]);

  const dm = domainOf(item.domain);

  const trap = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = ref.current?.querySelectorAll<HTMLElement>(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} details`}
      tabIndex={-1}
      onKeyDown={trap}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5 outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{item.name}</h2>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {item.category} · {dm.label}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded px-2 py-1 text-neutral-400 hover:text-neutral-100"
        >
          ✕
        </button>
      </div>

      {item.syntax && (
        <code className="block rounded bg-neutral-800 px-2 py-1 text-sm text-[#D97757]">
          {item.syntax}
        </code>
      )}

      <p className="text-sm text-neutral-300">{item.summary}</p>
      {item.details && <p className="text-sm text-neutral-400">{item.details}</p>}

      {item.example && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-neutral-500">Example</span>
            <CopyButton text={item.example} />
          </div>
          <pre className="overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-200">
            {item.example}
          </pre>
        </div>
      )}

      {item.newcomerTip && (
        <p className="rounded border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-300">
          <span className="font-medium text-[#D97757]">Tip: </span>
          {item.newcomerTip}
        </p>
      )}

      {item.platformNotes && (
        <p className="text-xs text-neutral-500">{item.platformNotes}</p>
      )}

      {item.source && (
        <a
          href={item.source}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#D97757] underline"
        >
          Source
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Implement `Cheatsheet.tsx`**

The `Cheatsheet` root is a plain `<div>` with **no** `surface-*` testid — Task 13's `App.tsx` wraps the active surface in `<div data-testid={\`surface-${mode}\`}>`, which is the single source of `surface-cheatsheet`.

```tsx
// src/components/cheatsheet/Cheatsheet.tsx
import { useMemo, useState } from 'react';
import { SearchBox } from './SearchBox';
import { Filters } from './Filters';
import { ItemCard } from './ItemCard';
import { ItemDrawer } from './ItemDrawer';
import { CATALOG } from '../../data/catalog';
import { searchCatalog } from '../../lib/search';
import { useApp } from '../shell/AppContext';
import type { CatalogItem, Category, DomainKey } from '../../data/types';

export function Cheatsheet(): JSX.Element {
  const { params } = useApp();
  const [query, setQuery] = useState(params.q ?? '');
  const [domain, setDomain] = useState<DomainKey | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [cursor, setCursor] = useState(-1);

  const list = useMemo<CatalogItem[]>(() => {
    const ranked = searchCatalog(CATALOG, query).map((r) => r.item);
    return ranked.filter(
      (i) =>
        (domain === null || i.domain === domain) &&
        (category === null || i.category === category),
    );
  }, [query, domain, category]);

  const onGridKey = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(list.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = cursor < 0 ? 0 : cursor;
      if (list[idx]) setSelected(list[idx]);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <SearchBox value={query} onChange={(v) => { setQuery(v); setCursor(-1); }} />
      <Filters
        domain={domain}
        category={category}
        onDomain={(d) => { setDomain(d); setCursor(-1); }}
        onCategory={(c) => { setCategory(c); setCursor(-1); }}
      />
      <p data-testid="results-count" className="text-sm text-neutral-500">
        {list.length} result{list.length === 1 ? '' : 's'}
      </p>

      {list.length === 0 ? (
        <div data-testid="empty-state" className="text-neutral-500">
          No features match your search.
        </div>
      ) : (
        <div
          data-testid="results-grid"
          role="listbox"
          tabIndex={0}
          aria-label="Results"
          onKeyDown={onGridKey}
          className="grid grid-cols-1 gap-3 overflow-y-auto outline-none sm:grid-cols-2 lg:grid-cols-3"
        >
          {list.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              active={i === cursor}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      {selected && <ItemDrawer item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
```

- [ ] **Step 8: Run the suite (expected PASS)**

`pnpm vitest run src/components/cheatsheet/Cheatsheet.test.tsx`

Expected PASS: all SearchBox, Filters, ItemCard, ItemDrawer, and Cheatsheet specs green (real `CATALOG` from Task 3 contains `/clear`; the `searchbox` role, `Search features…` placeholder, `aria-pressed` chips, modal drawer, arrow/enter selection, empty state, and the "no surface-* testid" assertion all satisfied).

- [ ] **Step 9: Commit**

```bash
git add src/components/common/index.tsx src/components/cheatsheet/SearchBox.tsx src/components/cheatsheet/Filters.tsx src/components/cheatsheet/ItemCard.tsx src/components/cheatsheet/ItemDrawer.tsx src/components/cheatsheet/Cheatsheet.tsx src/components/cheatsheet/Cheatsheet.test.tsx
git commit -m "feat(cheatsheet): add searchable filterable cheatsheet with item drawer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

---

### Task 11: Keyboard visualizer surface

**Files:**
- Create: `src/components/keyboard/layout.ts`
- Create: `src/components/keyboard/shortcutIndex.ts`
- Create: `src/components/keyboard/Key.tsx`
- Create: `src/components/keyboard/ModifierBar.tsx`
- Create: `src/components/keyboard/PlatformToggle.tsx`
- Create: `src/components/keyboard/KeyboardVisualizer.tsx`
- Test: `src/components/keyboard/KeyboardVisualizer.test.tsx`

**Interfaces:**
- Consumes: `parseChords(raw:string):KeyChord[]`, `chordFromEvent(e:KeyboardEvent):KeyChord`, `chordEquals(a,b):boolean`, `displayChord(chord:KeyChord,platform:Platform):string` from `src/lib/keys.ts`; `CATALOG:CatalogItem[]` from `src/data/catalog.ts`; `CatalogItem`, `KeyChord`, `Modifier`, `Platform` from `src/data/types.ts`; `useApp():AppContextValue` from `src/components/shell/AppContext.tsx`.
- Produces: `KEY_ROWS:KeyDef[][]`, `KeyDef={label:string;key:string;isMod?:boolean}` (layout.ts); `SHORTCUT_INDEX:Record<string,ShortcutHit[]>`, `ShortcutHit={item:CatalogItem;chord:KeyChord}`, `buildShortcutIndex(items:CatalogItem[]):Record<string,ShortcutHit[]>` (shortcutIndex.ts); `Key`, `ModifierBar`, `PlatformToggle`, `KeyboardVisualizer` React components.

**Canonical DOM contract (from `canonical-contract.md`):**
- The `KeyboardVisualizer` **root element** carries `data-testid="keyboard"` (single source of the keyboard surface testid; this is what the Task 13 App test and the Task 15 Playwright smoke assert via `getByTestId('keyboard')`). It MUST NOT set `data-testid="surface-keyboard"` — the `surface-<mode>` wrapper is owned solely by Task 13's `App.tsx`.
- The shortcut detail panel carries `data-testid="shortcut-detail"`.

**Content dependency (verify before relying on Ctrl+R):**
- `buildShortcutIndex(CATALOG)` is a *runtime/content* dependency: it only produces a `key === 'r'` hit if Task 3's transform emitted a `category === 'shortcut'` item whose `name` (or `syntax`) parses via `parseChords` to a chord `{ mods: ['ctrl'], key: 'r' }`. Verified against the real data: a `Ctrl+R` item is present in the main `catalogs` of `content/cc-catalog.raw.json` (category `shortcut`, confidence `verified`). Note that `missingItems` do **not** feed the keyboard index — their free-form categories normalize to `concept`, not `shortcut`.
- To avoid a brittle hardcoded `'r'`, the `KeyboardVisualizer` and `shortcutIndex` tests below derive the asserted key **from `buildShortcutIndex(CATALOG)` itself** (they pick a real Ctrl-modified single-letter chord and assert robustly), and additionally assert that `'r'` specifically is present (the documented expectation). If the Ctrl+R content is ever removed upstream, the `'r'`-specific assertion is the single place that flags it.

**Mobile fallback note (spec 4.3/8):**
- The "tap-to-explore list fallback" for mobile is implemented with Tailwind breakpoints only: the desktop keyboard grid is `hidden sm:flex` and the mobile shortcut list is `flex sm:hidden`. This is **CSS-only and not asserted by a test** — in jsdom both branches render into the DOM regardless of viewport, so a viewport assertion would be meaningless here. Accepted for Phase 1; manual/visual verification covers the breakpoint behavior.

- [ ] **Step 1: Failing test for KEY_ROWS layout**

```ts
// src/components/keyboard/layout.test.ts
import { describe, it, expect } from 'vitest';
import { KEY_ROWS } from './layout';

describe('KEY_ROWS', () => {
  it('contains qwerty letter r and esc/tab with normalized keys', () => {
    const all = KEY_ROWS.flat();
    expect(all.find((k) => k.key === 'r')?.label).toBe('R');
    expect(all.find((k) => k.key === 'escape')?.label).toBe('Esc');
    expect(all.find((k) => k.key === 'tab')?.label).toBe('Tab');
  });

  it('marks modifier keys with isMod', () => {
    const all = KEY_ROWS.flat();
    expect(all.find((k) => k.key === 'ctrl')?.isMod).toBe(true);
    expect(all.find((k) => k.key === 'shift')?.isMod).toBe(true);
    expect(all.find((k) => k.key === 'alt')?.isMod).toBe(true);
    expect(all.find((k) => k.key === 'meta')?.isMod).toBe(true);
  });

  it('keys are unique and lowercase-normalized', () => {
    const keys = KEY_ROWS.flat().map((k) => k.key);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((k) => expect(k).toBe(k.toLowerCase()));
  });
});
```

Run: `pnpm vitest run src/components/keyboard/layout.test.ts` — expected FAIL: `Cannot find module './layout'`.

- [ ] **Step 2: Implement layout.ts (minimal green)**

```ts
// src/components/keyboard/layout.ts
export type KeyDef = { label: string; key: string; isMod?: boolean };

export const KEY_ROWS: KeyDef[][] = [
  [
    { label: 'Esc', key: 'escape' },
    { label: 'F1', key: 'f1' },
    { label: 'F2', key: 'f2' },
    { label: 'F3', key: 'f3' },
    { label: 'F4', key: 'f4' },
    { label: 'F5', key: 'f5' },
    { label: 'F6', key: 'f6' },
    { label: 'F7', key: 'f7' },
    { label: 'F8', key: 'f8' },
    { label: 'F9', key: 'f9' },
    { label: 'F10', key: 'f10' },
    { label: 'F11', key: 'f11' },
    { label: 'F12', key: 'f12' },
  ],
  [
    { label: '`', key: '`' },
    { label: '1', key: '1' },
    { label: '2', key: '2' },
    { label: '3', key: '3' },
    { label: '4', key: '4' },
    { label: '5', key: '5' },
    { label: '6', key: '6' },
    { label: '7', key: '7' },
    { label: '8', key: '8' },
    { label: '9', key: '9' },
    { label: '0', key: '0' },
    { label: '-', key: '-' },
    { label: '=', key: '=' },
    { label: 'Backspace', key: 'backspace' },
  ],
  [
    { label: 'Tab', key: 'tab' },
    { label: 'Q', key: 'q' },
    { label: 'W', key: 'w' },
    { label: 'E', key: 'e' },
    { label: 'R', key: 'r' },
    { label: 'T', key: 't' },
    { label: 'Y', key: 'y' },
    { label: 'U', key: 'u' },
    { label: 'I', key: 'i' },
    { label: 'O', key: 'o' },
    { label: 'P', key: 'p' },
    { label: '[', key: '[' },
    { label: ']', key: ']' },
    { label: '\\', key: '\\' },
  ],
  [
    { label: 'Caps', key: 'capslock' },
    { label: 'A', key: 'a' },
    { label: 'S', key: 's' },
    { label: 'D', key: 'd' },
    { label: 'F', key: 'f' },
    { label: 'G', key: 'g' },
    { label: 'H', key: 'h' },
    { label: 'J', key: 'j' },
    { label: 'K', key: 'k' },
    { label: 'L', key: 'l' },
    { label: ';', key: ';' },
    { label: "'", key: "'" },
    { label: 'Enter', key: 'enter' },
  ],
  [
    { label: 'Shift', key: 'shift', isMod: true },
    { label: 'Z', key: 'z' },
    { label: 'X', key: 'x' },
    { label: 'C', key: 'c' },
    { label: 'V', key: 'v' },
    { label: 'B', key: 'b' },
    { label: 'N', key: 'n' },
    { label: 'M', key: 'm' },
    { label: ',', key: ',' },
    { label: '.', key: '.' },
    { label: '/', key: '/' },
  ],
  [
    { label: 'Ctrl', key: 'ctrl', isMod: true },
    { label: 'Alt', key: 'alt', isMod: true },
    { label: 'Cmd', key: 'meta', isMod: true },
    { label: 'Space', key: ' ' },
  ],
];
```

Run: `pnpm vitest run src/components/keyboard/layout.test.ts` — expected PASS.

- [ ] **Step 3: Commit layout**

```bash
git add src/components/keyboard/layout.ts src/components/keyboard/layout.test.ts
git commit -m "feat(keyboard): add US ANSI KEY_ROWS layout constant

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Failing test for shortcut index**

```ts
// src/components/keyboard/shortcutIndex.test.ts
import { describe, it, expect } from 'vitest';
import type { ShortcutHit } from './shortcutIndex';
import { CATALOG } from '../../data/catalog';
import { buildShortcutIndex, SHORTCUT_INDEX } from './shortcutIndex';

// Robust picker: find a real single-letter key that has a Ctrl-modified chord
// in the index built from the REAL generated CATALOG. Falls back to 'r'.
function pickCtrlLetterKey(index: Record<string, ShortcutHit[]>): string {
  for (const [key, hits] of Object.entries(index)) {
    if (!/^[a-z]$/.test(key)) continue;
    if (hits.some((h) => h.chord.mods.includes('ctrl') && h.chord.key === key)) {
      return key;
    }
  }
  return 'r';
}

describe('buildShortcutIndex', () => {
  it('indexes at least one Ctrl+<letter> shortcut from the real catalog', () => {
    const index = buildShortcutIndex(CATALOG);
    const key = pickCtrlLetterKey(index);
    const hits = index[key] ?? [];
    const ctrlHit = hits.find(
      (h) => h.chord.mods.includes('ctrl') && h.chord.key === key,
    );
    expect(ctrlHit).toBeDefined();
    expect(ctrlHit?.item.category).toBe('shortcut');
  });

  it('indexes Ctrl+R under main key r (documented content expectation)', () => {
    const index = buildShortcutIndex(CATALOG);
    const hits = index['r'] ?? [];
    const ctrlR = hits.find(
      (h) => h.chord.mods.includes('ctrl') && h.chord.key === 'r',
    );
    expect(ctrlR).toBeDefined();
    expect(ctrlR?.item.category).toBe('shortcut');
  });

  it('only indexes shortcut-category items', () => {
    const index = buildShortcutIndex(CATALOG);
    Object.values(index)
      .flat()
      .forEach((h) => expect(h.item.category).toBe('shortcut'));
  });

  it('exports a prebuilt index over CATALOG', () => {
    const key = pickCtrlLetterKey(SHORTCUT_INDEX);
    expect((SHORTCUT_INDEX[key] ?? []).length).toBeGreaterThan(0);
  });
});
```

Run: `pnpm vitest run src/components/keyboard/shortcutIndex.test.ts` — expected FAIL: `Cannot find module './shortcutIndex'`.

- [ ] **Step 5: Implement shortcutIndex.ts**

```ts
// src/components/keyboard/shortcutIndex.ts
import type { CatalogItem, KeyChord } from '../../data/types';
import { CATALOG } from '../../data/catalog';
import { parseChords } from '../../lib/keys';

export type ShortcutHit = { item: CatalogItem; chord: KeyChord };

export function buildShortcutIndex(
  items: CatalogItem[],
): Record<string, ShortcutHit[]> {
  const index: Record<string, ShortcutHit[]> = {};
  for (const item of items) {
    if (item.category !== 'shortcut') continue;
    let chords = parseChords(item.name);
    if (chords.length === 0) chords = parseChords(item.syntax ?? '');
    for (const chord of chords) {
      const key = chord.key;
      if (!key) continue;
      (index[key] ??= []).push({ item, chord });
    }
  }
  return index;
}

export const SHORTCUT_INDEX: Record<string, ShortcutHit[]> =
  buildShortcutIndex(CATALOG);
```

Run: `pnpm vitest run src/components/keyboard/shortcutIndex.test.ts` — expected PASS.

- [ ] **Step 6: Commit shortcut index**

```bash
git add src/components/keyboard/shortcutIndex.ts src/components/keyboard/shortcutIndex.test.ts
git commit -m "feat(keyboard): build runtime shortcut index from CATALOG via parseChords

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7: Implement Key.tsx (consumed by next test; no standalone test)**

```tsx
// src/components/keyboard/Key.tsx
import type { KeyDef } from './layout';

type KeyProps = {
  def: KeyDef;
  highlighted: boolean;
  selected: boolean;
  onSelect: (key: string) => void;
};

export function Key({ def, highlighted, selected, onSelect }: KeyProps): JSX.Element {
  const classes = [
    'rounded-md border px-2 py-2 text-xs font-mono transition-colors',
    'border-neutral-700 bg-neutral-900 text-neutral-200',
    highlighted ? 'bg-[#D97757] text-black border-[#D97757]' : '',
    selected ? 'ring-2 ring-[#D97757] ring-offset-1 ring-offset-neutral-950' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      data-key={def.key}
      data-highlighted={highlighted ? 'true' : 'false'}
      data-selected={selected ? 'true' : 'false'}
      aria-pressed={selected}
      className={classes}
      onClick={() => onSelect(def.key)}
    >
      {def.label}
    </button>
  );
}
```

- [ ] **Step 8: Implement ModifierBar.tsx**

```tsx
// src/components/keyboard/ModifierBar.tsx
import type { Modifier } from '../../data/types';

const MODS: { mod: Modifier; label: string }[] = [
  { mod: 'ctrl', label: 'Ctrl' },
  { mod: 'meta', label: 'Cmd' },
  { mod: 'shift', label: 'Shift' },
  { mod: 'alt', label: 'Alt' },
];

type ModifierBarProps = {
  active: Set<Modifier>;
  onToggle: (mod: Modifier) => void;
};

export function ModifierBar({ active, onToggle }: ModifierBarProps): JSX.Element {
  return (
    <div role="group" aria-label="Modifiers" className="flex gap-2">
      {MODS.map(({ mod, label }) => {
        const pressed = active.has(mod);
        return (
          <button
            key={mod}
            type="button"
            aria-pressed={pressed}
            aria-label={label}
            onClick={() => onToggle(mod)}
            className={[
              'rounded-md border px-3 py-1 text-xs font-mono transition-colors',
              pressed
                ? 'border-[#D97757] bg-[#D97757] text-black'
                : 'border-neutral-700 bg-neutral-900 text-neutral-200',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 9: Implement PlatformToggle.tsx**

```tsx
// src/components/keyboard/PlatformToggle.tsx
import type { Platform } from '../../data/types';
import { useApp } from '../shell/AppContext';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'mac', label: 'macOS' },
  { value: 'win', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
];

export function PlatformToggle(): JSX.Element {
  const { platform, setPlatform } = useApp();
  return (
    <div role="group" aria-label="Platform" className="flex overflow-hidden rounded-md border border-neutral-700">
      {PLATFORMS.map(({ value, label }) => {
        const active = platform === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setPlatform(value)}
            className={[
              'px-3 py-1 text-xs font-mono transition-colors',
              active ? 'bg-[#D97757] text-black' : 'bg-neutral-900 text-neutral-200',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 10: Failing test for KeyboardVisualizer**

```tsx
// src/components/keyboard/KeyboardVisualizer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CATALOG } from '../../data/catalog';
import { AppProvider } from '../shell/AppContext';
import { buildShortcutIndex, type ShortcutHit } from './shortcutIndex';
import { KeyboardVisualizer } from './KeyboardVisualizer';

// Pick a real single-letter key that has a Ctrl-modified chord in the index
// built from the REAL generated CATALOG, so assertions stay robust to content.
// Falls back to 'r' (the documented expected Ctrl+R shortcut).
function pickCtrlLetterKey(index: Record<string, ShortcutHit[]>): string {
  for (const [key, hits] of Object.entries(index)) {
    if (!/^[a-z]$/.test(key)) continue;
    if (hits.some((h) => h.chord.mods.includes('ctrl') && h.chord.key === key)) {
      return key;
    }
  }
  return 'r';
}

const INDEX = buildShortcutIndex(CATALOG);
const CTRL_KEY = pickCtrlLetterKey(INDEX);

function renderViz() {
  return render(
    <AppProvider>
      <KeyboardVisualizer />
    </AppProvider>,
  );
}

function keyButton(key: string): HTMLElement {
  const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!el) throw new Error(`key ${key} not rendered`);
  return el as HTMLElement;
}

describe('KeyboardVisualizer', () => {
  it('renders the keyboard surface root with the canonical testid', () => {
    renderViz();
    expect(screen.getByTestId('keyboard')).toBeInTheDocument();
  });

  it('renders keyboard keys including the chosen ctrl key', () => {
    renderViz();
    expect(keyButton(CTRL_KEY)).toBeInTheDocument();
  });

  it('activating Ctrl highlights the chosen ctrl key', () => {
    renderViz();
    expect(keyButton(CTRL_KEY).getAttribute('data-highlighted')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Ctrl' }));
    expect(keyButton(CTRL_KEY).getAttribute('data-highlighted')).toBe('true');
  });

  it('clicking a key shows its shortcut detail with the displayed chord', () => {
    renderViz();
    fireEvent.click(keyButton(CTRL_KEY));
    const panel = screen.getByTestId('shortcut-detail');
    const expected = new RegExp(`Ctrl\\+${CTRL_KEY}`, 'i');
    expect(within(panel).getByText(expected)).toBeInTheDocument();
  });

  it('a real ctrl+<key> keydown selects that key', () => {
    renderViz();
    fireEvent.keyDown(window, { key: CTRL_KEY, ctrlKey: true });
    expect(keyButton(CTRL_KEY).getAttribute('data-selected')).toBe('true');
  });
});
```

Run: `pnpm vitest run src/components/keyboard/KeyboardVisualizer.test.tsx` — expected FAIL: `Cannot find module './KeyboardVisualizer'`.

- [ ] **Step 11: Implement KeyboardVisualizer.tsx**

```tsx
// src/components/keyboard/KeyboardVisualizer.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Modifier, KeyChord } from '../../data/types';
import { chordFromEvent, chordEquals, displayChord } from '../../lib/keys';
import { useApp } from '../shell/AppContext';
import { KEY_ROWS } from './layout';
import { SHORTCUT_INDEX, type ShortcutHit } from './shortcutIndex';
import { Key } from './Key';
import { ModifierBar } from './ModifierBar';
import { PlatformToggle } from './PlatformToggle';

function modsSupersetMatch(chordMods: Modifier[], active: Set<Modifier>): boolean {
  if (active.size === 0) return false;
  for (const m of active) if (!chordMods.includes(m)) return false;
  return true;
}

function hitsForKey(key: string): ShortcutHit[] {
  return SHORTCUT_INDEX[key] ?? [];
}

export function KeyboardVisualizer(): JSX.Element {
  const { platform } = useApp();
  const [activeMods, setActiveMods] = useState<Set<Modifier>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const toggleMod = useCallback((mod: Modifier) => {
    setActiveMods((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }, []);

  const isHighlighted = useCallback(
    (key: string): boolean =>
      hitsForKey(key).some((h) => modsSupersetMatch(h.chord.mods, activeMods)),
    [activeMods],
  );

  const knownChords = useMemo<KeyChord[]>(
    () => Object.values(SHORTCUT_INDEX).flat().map((h) => h.chord),
    [],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const chord = chordFromEvent(e);
      const known = knownChords.some((c) => chordEquals(c, chord));
      if (known) {
        e.preventDefault();
        setSelectedKey(chord.key);
        setActiveMods(new Set(chord.mods));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [knownChords]);

  const selectedHits = selectedKey ? hitsForKey(selectedKey) : [];

  const grouped = useMemo(
    () =>
      Object.entries(SHORTCUT_INDEX)
        .filter(([, hits]) => hits.length > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    [],
  );

  return (
    <div data-testid="keyboard" className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlatformToggle />
        <ModifierBar active={activeMods} onToggle={toggleMod} />
      </div>

      <div className="hidden flex-col gap-1 sm:flex">
        {KEY_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((def) => (
              <Key
                key={def.key}
                def={def}
                highlighted={isHighlighted(def.key)}
                selected={selectedKey === def.key}
                onSelect={setSelectedKey}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto sm:hidden">
        {grouped.map(([key, hits]) => (
          <div key={key} className="rounded-md border border-neutral-800 p-2">
            <div className="font-mono text-xs text-[#D97757]">{key}</div>
            <ul className="mt-1 space-y-1">
              {hits.map((h, i) => (
                <li key={`${h.item.id}-${i}`} className="text-xs text-neutral-200">
                  <span className="font-mono text-[#D97757]">
                    {displayChord(h.chord, platform)}
                  </span>{' '}
                  — {h.item.summary}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        data-testid="shortcut-detail"
        className="rounded-md border border-neutral-800 p-3"
      >
        {selectedKey === null ? (
          <p className="text-xs text-neutral-400">
            Select a key or press a shortcut to see details.
          </p>
        ) : selectedHits.length === 0 ? (
          <p className="text-xs text-neutral-400">
            No shortcuts mapped to this key.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedHits.map((h, i) => (
              <li key={`${h.item.id}-${i}`} className="text-sm text-neutral-200">
                <span className="font-mono text-[#D97757]">
                  {displayChord(h.chord, platform)}
                </span>
                <span className="ml-2 font-medium">{h.item.name}</span>
                <p className="mt-0.5 text-xs text-neutral-400">{h.item.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

Run: `pnpm vitest run src/components/keyboard/KeyboardVisualizer.test.tsx` — expected PASS.

- [ ] **Step 12: Commit visualizer components**

```bash
git add src/components/keyboard/Key.tsx src/components/keyboard/ModifierBar.tsx src/components/keyboard/PlatformToggle.tsx src/components/keyboard/KeyboardVisualizer.tsx src/components/keyboard/KeyboardVisualizer.test.tsx
git commit -m "feat(keyboard): add Key, ModifierBar, PlatformToggle and KeyboardVisualizer surface

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

---

### Task 12: Theme tokens, fonts, common components

**Ordering note:** Implement this task BEFORE (or alongside) Tasks 9/10/11 — those tasks import `BoxFrame`, `CopyButton`, and `Badge` from `src/components/common/` (the barrel `src/components/common/index.tsx`). This task introduces the REAL components and the barrel that re-exports them.

**Reconciliation note (resolves cross-task drift):**
- Task 10 created a temporary stub `src/components/common/index.tsx` (a variant-less `Badge({ children })` plus a `CopyButton` rendering `Copied`). **Task 12 OWNS the final `src/components/common/index.tsx`**: it DELETES those stub bodies and replaces the file with a barrel that re-exports the real components from this task.
- `Badge`'s `variant` prop is **OPTIONAL with default `'advanced'`** (per the canonical contract). Task 10's `ItemCard` passes the variant explicitly: `<Badge variant="advanced">advanced</Badge>`. The optional default keeps both usages type-safe under strict TypeScript (no `any`).
- `CopyButton` has a single canonical confirmation text: `Copied!`. The stub's `Copied` text is deleted with the stub.

**Styling note (canonical tokens):** The `cc-*` Tailwind v4 `@theme` tokens defined here (accent/border/bg/panel/fg/muted/green/error) are the canonical color source and drive utilities like `bg-cc-panel`, `border-cc-border`, `text-cc-accent`. The hardcoded `#D97757` / `neutral-*` utilities already present in the shell/surfaces (Tasks 8/9/11/13) are acceptable interim Phase 1 values and are intentionally NOT churned in this task.

**Files:**
- Modify: `package.json` (add devDep `@fontsource-variable/jetbrains-mono`)
- Modify: `src/main.tsx` (import the font CSS)
- Modify: `src/index.css` (theme tokens + base styles + cursor keyframe)
- Create: `src/components/common/BoxFrame.tsx`
- Create: `src/components/common/CopyButton.tsx`
- Create: `src/components/common/Badge.tsx`
- Create: `src/components/common/Cursor.tsx`
- Create: `src/components/common/Kbd.tsx`
- Replace: `src/components/common/index.tsx` (delete the Task 10 stub bodies; re-export the real components)
- Test: `src/components/common/BoxFrame.test.tsx`
- Test: `src/components/common/CopyButton.test.tsx`
- Test: `src/components/common/Badge.test.tsx`
- Test: `src/components/common/Cursor.test.tsx`
- Test: `src/components/common/index.test.tsx`

**Interfaces:**
- Consumes: (none from contract — pure presentational; `navigator.clipboard` browser API; `prefers-reduced-motion` media query)
- Produces:
  - `BoxFrame({ title?: string; children: React.ReactNode }): JSX.Element`
  - `CopyButton({ text: string; label?: string }): JSX.Element`
  - `Badge({ children: React.ReactNode; variant?: 'advanced' | 'domain' | 'category' }): JSX.Element` (`variant` optional, default `'advanced'`)
  - `Cursor(): JSX.Element`
  - `Kbd({ children: React.ReactNode }): JSX.Element`
  - Barrel `src/components/common/index.tsx` re-exporting all five real components.

---

- [ ] **Step 1: Add the font devDependency**
  Run (respects pnpm-only + `minimumReleaseAge`; frozen lockfile only in CI, not here):
  ```bash
  pnpm add -D @fontsource-variable/jetbrains-mono
  ```
  Then import it in `src/main.tsx` (add as the first import, before any local CSS):
  ```tsx
  import '@fontsource-variable/jetbrains-mono/index.css';
  ```

- [ ] **Step 2: Write the theme tokens + base styles in `src/index.css`**
  Replace the contents of `src/index.css` with:
  ```css
  @import "tailwindcss";

  @theme {
    --color-cc-bg: #0d0d0d;
    --color-cc-panel: #161616;
    --color-cc-fg: #e6e6e6;
    --color-cc-muted: #8a8a8a;
    --color-cc-border: #2a2a2a;
    --color-cc-accent: #D97757;
    --color-cc-green: #7bb87b;
    --color-cc-error: #e06c6c;
    --font-mono: 'JetBrains Mono Variable', ui-monospace, Menlo, Consolas, monospace;
  }

  html,
  body {
    background-color: var(--color-cc-bg);
    color: var(--color-cc-fg);
    font-family: var(--font-mono);
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  .cc-cursor {
    display: inline-block;
    width: 0.6ch;
    height: 1em;
    vertical-align: text-bottom;
    background-color: var(--color-cc-accent);
  }

  @media (prefers-reduced-motion: no-preference) {
    .cc-cursor {
      animation: cc-blink 1s steps(2, start) infinite;
    }
    @keyframes cc-blink {
      to {
        visibility: hidden;
      }
    }
  }
  ```
  (No `tailwind.config.js` — Tailwind v4 reads `@theme` tokens directly. Each `--color-cc-*` token generates the matching `*-cc-*` utilities, e.g. `border-cc-border`, `bg-cc-panel`, `text-cc-accent`.)

- [ ] **Step 3: RED — BoxFrame test**
  Create `src/components/common/BoxFrame.test.tsx`:
  ```tsx
  import { render, screen } from '@testing-library/react';
  import { describe, it, expect } from 'vitest';
  import { BoxFrame } from './BoxFrame';

  describe('BoxFrame', () => {
    it('renders the title and children', () => {
      render(
        <BoxFrame title="Welcome">
          <span>Inside content</span>
        </BoxFrame>,
      );
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Inside content')).toBeInTheDocument();
    });

    it('renders children without a title', () => {
      render(
        <BoxFrame>
          <span>No title here</span>
        </BoxFrame>,
      );
      expect(screen.getByText('No title here')).toBeInTheDocument();
    });
  });
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/BoxFrame.test.tsx
  ```
  Expected FAIL: cannot resolve module `./BoxFrame` (file does not exist).

- [ ] **Step 4: GREEN — implement `src/components/common/BoxFrame.tsx`**
  ```tsx
  import type { ReactNode } from 'react';

  interface BoxFrameProps {
    title?: string;
    children: ReactNode;
  }

  export function BoxFrame({ title, children }: BoxFrameProps): JSX.Element {
    return (
      <div className="relative rounded-md border border-cc-border bg-cc-panel px-4 py-3">
        {title !== undefined && (
          <div className="absolute -top-2.5 left-3 bg-cc-panel px-2 text-xs text-cc-accent">
            {title}
          </div>
        )}
        <div className="text-cc-fg">{children}</div>
      </div>
    );
  }
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/BoxFrame.test.tsx
  ```
  Expected PASS.

- [ ] **Step 5: RED — Badge test**
  Create `src/components/common/Badge.test.tsx`:
  ```tsx
  import { render, screen } from '@testing-library/react';
  import { describe, it, expect } from 'vitest';
  import { Badge } from './Badge';

  describe('Badge', () => {
    it('renders the label', () => {
      render(<Badge variant="advanced">Advanced</Badge>);
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('defaults to the advanced variant when none is given', () => {
      render(<Badge>advanced</Badge>);
      expect(screen.getByText('advanced').className).toContain('cc-badge-advanced');
    });

    it('applies a variant-specific class', () => {
      render(<Badge variant="domain">slash</Badge>);
      const el = screen.getByText('slash');
      expect(el.className).toContain('cc-badge-domain');
    });

    it('applies the category variant class', () => {
      render(<Badge variant="category">hook</Badge>);
      expect(screen.getByText('hook').className).toContain('cc-badge-category');
    });
  });
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/Badge.test.tsx
  ```
  Expected FAIL: cannot resolve module `./Badge`.

- [ ] **Step 6: GREEN — implement `src/components/common/Badge.tsx`**
  `variant` is OPTIONAL and defaults to `'advanced'` (per the canonical contract), so Task 10's `<Badge variant="advanced">advanced</Badge>` and a bare `<Badge>…</Badge>` both type-check under strict mode.
  ```tsx
  import type { ReactNode } from 'react';

  type BadgeVariant = 'advanced' | 'domain' | 'category';

  interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
  }

  const VARIANT_CLASS: Record<BadgeVariant, string> = {
    advanced: 'cc-badge-advanced border-cc-accent text-cc-accent',
    domain: 'cc-badge-domain border-cc-green text-cc-green',
    category: 'cc-badge-category border-cc-muted text-cc-muted',
  };

  export function Badge({ variant = 'advanced', children }: BadgeProps): JSX.Element {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${VARIANT_CLASS[variant]}`}
      >
        {children}
      </span>
    );
  }
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/Badge.test.tsx
  ```
  Expected PASS.

- [ ] **Step 7: RED — Cursor test**
  Create `src/components/common/Cursor.test.tsx`:
  ```tsx
  import { render } from '@testing-library/react';
  import { describe, it, expect } from 'vitest';
  import { Cursor } from './Cursor';

  describe('Cursor', () => {
    it('renders a blinking cursor span', () => {
      const { container } = render(<Cursor />);
      const span = container.querySelector('span.cc-cursor');
      expect(span).not.toBeNull();
      expect(span?.getAttribute('aria-hidden')).toBe('true');
    });
  });
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/Cursor.test.tsx
  ```
  Expected FAIL: cannot resolve module `./Cursor`.

- [ ] **Step 8: GREEN — implement `src/components/common/Cursor.tsx`**
  ```tsx
  export function Cursor(): JSX.Element {
    return <span className="cc-cursor" aria-hidden="true" />;
  }
  ```
  (The blink animation lives in `.cc-cursor` and is disabled automatically under `prefers-reduced-motion: reduce`, since the keyframe only applies inside the `no-preference` media query from Step 2.)
  Run:
  ```bash
  pnpm vitest run src/components/common/Cursor.test.tsx
  ```
  Expected PASS.

- [ ] **Step 9: RED — CopyButton test**
  Create `src/components/common/CopyButton.test.tsx`:
  ```tsx
  import { render, screen, fireEvent } from '@testing-library/react';
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import { CopyButton } from './CopyButton';

  describe('CopyButton', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('calls clipboard.writeText with the text and shows Copied!', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<CopyButton text="claude --help" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(writeText).toHaveBeenCalledWith('claude --help');

      await vi.waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('does not throw when clipboard is missing', () => {
      Object.assign(navigator, { clipboard: undefined });
      render(<CopyButton text="x" />);
      expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
  });
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/CopyButton.test.tsx
  ```
  Expected FAIL: cannot resolve module `./CopyButton`.

- [ ] **Step 10: GREEN — implement `src/components/common/CopyButton.tsx`**
  Confirmation text is the single canonical `Copied!`.
  ```tsx
  import { useEffect, useRef, useState } from 'react';

  interface CopyButtonProps {
    text: string;
    label?: string;
  }

  export function CopyButton({ text, label = 'Copy' }: CopyButtonProps): JSX.Element {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);

    const handleClick = (): void => {
      const clipboard = navigator.clipboard;
      if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
        return;
      }
      void clipboard.writeText(text).then(() => {
        setCopied(true);
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => setCopied(false), 1500);
      });
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className="rounded border border-cc-border px-2 py-0.5 text-xs text-cc-muted hover:text-cc-fg"
      >
        <span aria-live="polite">{copied ? 'Copied!' : label}</span>
      </button>
    );
  }
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/CopyButton.test.tsx
  ```
  Expected PASS.

- [ ] **Step 11: GREEN — implement `src/components/common/Kbd.tsx`** (no separate test; covered indirectly by the keyboard surface in a later task)
  ```tsx
  import type { ReactNode } from 'react';

  interface KbdProps {
    children: ReactNode;
  }

  export function Kbd({ children }: KbdProps): JSX.Element {
    return (
      <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-cc-border bg-cc-panel px-1.5 py-0.5 text-xs text-cc-fg">
        {children}
      </kbd>
    );
  }
  ```

- [ ] **Step 12: RED — barrel re-export test (replaces the Task 10 stub)**
  This test guards that `'../common'` resolves to the REAL components: the optional-variant `Badge` and the `Copied!` `CopyButton`. Create `src/components/common/index.test.tsx`:
  ```tsx
  import { render, screen, fireEvent } from '@testing-library/react';
  import { describe, it, expect, vi, afterEach } from 'vitest';
  import { BoxFrame, CopyButton, Badge, Cursor, Kbd } from './index';

  describe('common barrel', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('re-exports all five real components', () => {
      expect(typeof BoxFrame).toBe('function');
      expect(typeof CopyButton).toBe('function');
      expect(typeof Badge).toBe('function');
      expect(typeof Cursor).toBe('function');
      expect(typeof Kbd).toBe('function');
    });

    it('re-exports the real variant-aware Badge (variant optional)', () => {
      render(<Badge>advanced</Badge>);
      expect(screen.getByText('advanced').className).toContain('cc-badge-advanced');
    });

    it('re-exports the real CopyButton with Copied! confirmation', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<CopyButton text="x" />);
      fireEvent.click(screen.getByRole('button'));

      expect(writeText).toHaveBeenCalledWith('x');
      await screen.findByText('Copied!');
    });
  });
  ```
  Run:
  ```bash
  pnpm vitest run src/components/common/index.test.tsx
  ```
  Expected FAIL: the Task 10 stub `index.tsx` exports a variant-less `Badge` and a `Copied` (no `!`) `CopyButton`, so the variant-class and `Copied!` assertions fail.

- [ ] **Step 13: GREEN — replace `src/components/common/index.tsx` with the real barrel**
  DELETE the temporary stub component bodies that Task 10 placed in this file and replace the entire file with re-exports of the real components:
  ```tsx
  export * from './BoxFrame';
  export * from './CopyButton';
  export * from './Badge';
  export * from './Cursor';
  export * from './Kbd';
  ```
  After this step, every `import { … } from '../common'` (e.g. Cheatsheet's `ItemCard` importing `Badge`, `ItemDrawer` importing `CopyButton`) resolves to the real components — there is one source of truth for `Badge` (variant optional, default `'advanced'`) and `CopyButton` (`Copied!`).
  Run:
  ```bash
  pnpm vitest run src/components/common/index.test.tsx
  ```
  Expected PASS.

- [ ] **Step 14: Run the full common suite green**
  ```bash
  pnpm vitest run src/components/common
  ```
  Expected PASS (BoxFrame, Badge, Cursor, CopyButton, and the barrel all green).

- [ ] **Step 15: Commit**
  ```bash
  git add package.json pnpm-lock.yaml src/main.tsx src/index.css src/components/common
  git commit -m "feat(ui): add Claude Code theme tokens, fonts, and common components

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

---

### Task 13: App integration + navigation wiring

**Depends on Tasks 8/9/10/11 (do first).** This task relies on the canonical DOM contract delivered by the earlier tasks and adds NOTHING to those testids here:
- Task 8 `PromptBar` renders the container `data-testid="prompt-bar"`, the input `data-testid="prompt-input"` with `aria-label="Prompt"`, wrapped in a `<form onSubmit>` (so `input.closest('form')` is a real `HTMLFormElement` and `fireEvent.submit` works).
- Task 8 `TitleBar` renders a `<header>` with an `<h1>` `✻ Claude Code — Interactive Trainer`.
- Tasks 9/10/11 surfaces (Playground, Cheatsheet, KeyboardVisualizer) do NOT carry their own `surface-*` testid.

The `surface-<mode>` testid is owned EXCLUSIVELY by this task's `Surface` wrapper in `App.tsx`, which renders `<div data-testid={`surface-${mode}`}>{<Active />}</div>`. Individual surfaces (Start, ComingSoon, Playground, Cheatsheet, KeyboardVisualizer) MUST NOT set their own `surface-*` testid, to avoid duplicate/empty testids.

**Files:**
- Create: `src/components/start/Start.tsx`
- Create: `src/surfaces.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useApp():AppContextValue` and `AppProvider({children}):JSX.Element` from `src/components/shell/AppContext.tsx` where `AppContextValue={mode:Mode;setMode:(m:Mode)=>void;params:Record<string,string>;setParams:(p:Record<string,string>)=>void;lines:TerminalLine[];submit:(raw:string)=>void;platform:Platform;setPlatform:(p:Platform)=>void}`
- Consumes: `Mode = 'start'|'playground'|'cheatsheet'|'keyboard'|'quiz'` from `src/data/types.ts`
- Consumes: `TerminalWindow` (renders `TitleBar` + `CommandBar` tabs that call `setMode` + `PromptBar`), `Playground`, `Cheatsheet`, `KeyboardVisualizer` surface components
- Produces: `export function Start():JSX.Element`
- Produces: `export const surfaces: Record<Mode, React.ComponentType>` in `src/surfaces.tsx`
- Produces: `export default function App():JSX.Element` in `src/App.tsx`
- Produces: the SINGLE source of `data-testid="surface-${mode}"` (via the `Surface` wrapper in `App.tsx`)

**Steps:**

- [ ] **Step 1: Write failing test for Start surface as default + tab navigation + prompt nav + hashchange**

```tsx
// src/App.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
});

describe('App integration', () => {
  it('renders inside the provider with the prompt bar visible', () => {
    render(<App />);
    expect(screen.getByTestId('prompt-bar')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input')).toBeInTheDocument();
  });

  it('shows the Start surface by default', () => {
    render(<App />);
    expect(screen.getByTestId('surface-start')).toBeInTheDocument();
  });

  it('switches to the cheatsheet surface when the Cheatsheet tab is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /cheatsheet/i }));
    expect(screen.getByTestId('surface-cheatsheet')).toBeInTheDocument();
    expect(screen.queryByTestId('surface-start')).not.toBeInTheDocument();
  });

  it('switches surface when a nav slash command is submitted through the prompt', () => {
    render(<App />);
    const input = screen.getByTestId('prompt-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '/keyboard' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(screen.getByTestId('surface-keyboard')).toBeInTheDocument();
  });

  it('reacts to external hash changes', () => {
    render(<App />);
    window.location.hash = '#/cheatsheet';
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(screen.getByTestId('surface-cheatsheet')).toBeInTheDocument();
  });

  it('navigates from a Start card button to the playground', () => {
    render(<App />);
    const start = screen.getByTestId('surface-start');
    fireEvent.click(within(start).getByRole('button', { name: /open playground/i }));
    expect(screen.getByTestId('surface-playground')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```
pnpm vitest run src/App.test.tsx
```

Expected FAIL: the old Task 1 smoke test is replaced; `App` does not yet render the `Surface` wrapper with `data-testid="surface-start"`, has no surface map, and `Start` does not exist (module/type errors and missing testids).

- [ ] **Step 3: Implement the Start surface (Phase-1 stub)**

The Start surface MUST NOT set its own `surface-*` testid — the `Surface` wrapper in `App.tsx` provides it. Use a plain root element here.

```tsx
// src/components/start/Start.tsx
import { useApp } from '../shell/AppContext';
import type { Mode } from '../../data/types';

interface PathCard {
  step: number;
  title: string;
  blurb: string;
  go: { mode: Mode; label: string } | null;
}

const CARDS: PathCard[] = [
  {
    step: 1,
    title: 'Meet the terminal',
    blurb: 'See how Claude Code reads your prompt, slash commands, and file mentions.',
    go: { mode: 'playground', label: 'Open playground' },
  },
  {
    step: 2,
    title: 'Run slash commands',
    blurb: 'Type / to discover built-in commands and how each one responds.',
    go: { mode: 'playground', label: 'Try slash commands' },
  },
  {
    step: 3,
    title: 'Browse the cheatsheet',
    blurb: 'Search every shortcut, flag, setting, and hook in one place.',
    go: { mode: 'cheatsheet', label: 'Open cheatsheet' },
  },
  {
    step: 4,
    title: 'Master the keyboard',
    blurb: 'Visualise key chords and practise the shortcuts that matter most.',
    go: { mode: 'keyboard', label: 'Open keyboard' },
  },
  {
    step: 5,
    title: 'Guided track (Phase 2)',
    blurb: 'A step-by-step interactive lesson flow is coming soon.',
    go: null,
  },
];

export function Start(): JSX.Element {
  const { setMode } = useApp();
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-md border border-neutral-700 bg-neutral-900/60 p-6 font-mono text-sm text-neutral-200">
        <pre aria-hidden className="text-[#D97757]">
{`╭─ Start here ─────────────────────────────╮
│  Welcome to the Claude Code Trainer       │
╰───────────────────────────────────────────╯`}
        </pre>
        <p className="mt-3 text-neutral-400">
          Follow the path below, or jump straight in from the tabs above.
        </p>
      </div>

      <ol className="mt-6 grid gap-4">
        {CARDS.map((card) => (
          <li
            key={card.step}
            className="rounded-md border border-neutral-800 bg-neutral-900/40 p-4"
          >
            <div className="flex items-baseline gap-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D97757] text-sm font-semibold text-black"
              >
                {card.step}
              </span>
              <h3 className="text-base font-semibold text-neutral-100">{card.title}</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-400">{card.blurb}</p>
            {card.go && (
              <button
                type="button"
                onClick={() => setMode(card.go!.mode)}
                className="mt-3 rounded border border-[#D97757] px-3 py-1.5 text-sm text-[#D97757] transition-colors hover:bg-[#D97757] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D97757]"
              >
                {card.go.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: Implement the surfaces map**

`ComingSoon` MUST NOT set its own `surface-*` testid either — the `Surface` wrapper provides `surface-quiz`. Import `React` for the `React.ComponentType` type used in the map.

```tsx
// src/surfaces.tsx
import type React from 'react';
import type { Mode } from './data/types';
import { Start } from './components/start/Start';
import { Playground } from './components/playground/Playground';
import { Cheatsheet } from './components/cheatsheet/Cheatsheet';
import { KeyboardVisualizer } from './components/keyboard/KeyboardVisualizer';

function ComingSoon(): JSX.Element {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center font-mono text-neutral-400">
      <h2 className="text-lg font-semibold text-neutral-200">Quiz mode</h2>
      <p className="mt-2 text-sm">Coming in Phase 2.</p>
    </section>
  );
}

export const surfaces: Record<Mode, React.ComponentType> = {
  start: Start,
  playground: Playground,
  cheatsheet: Cheatsheet,
  keyboard: KeyboardVisualizer,
  quiz: ComingSoon,
};
```

- [ ] **Step 5: Wire App.tsx to provider + surface switch**

The `Surface` wrapper is the SINGLE source of the `surface-<mode>` testid: it wraps the active surface in `<div data-testid={`surface-${mode}`}>`.

```tsx
// src/App.tsx
import { AppProvider, useApp } from './components/shell/AppContext';
import { TerminalWindow } from './components/shell/TerminalWindow';
import { surfaces } from './surfaces';

function Surface(): JSX.Element {
  const { mode } = useApp();
  const Active = surfaces[mode];
  return (
    <div data-testid={`surface-${mode}`}>
      <Active />
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <AppProvider>
      <TerminalWindow>
        <Surface />
      </TerminalWindow>
    </AppProvider>
  );
}
```

- [ ] **Step 6: Run the test — expect PASS**

```
pnpm vitest run src/App.test.tsx
```

Expected PASS: the `Surface` wrapper renders `data-testid="surface-start"` by default; the Cheatsheet tab and the `/keyboard` prompt submit (via the `PromptBar` `<form>` whose `onSubmit` calls `preventDefault()` + `handleSubmit()`) swap the surface; an external `hashchange` to `#/cheatsheet` updates the surface (via `useHashRoute` → `setMode`); and a Start card button navigates to the playground. `TitleBar`, `CommandBar`, and `PromptBar` (inside `TerminalWindow`) stay mounted across all surfaces.

- [ ] **Step 7: Commit**

```
git add src/components/start/Start.tsx src/surfaces.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: wire app surfaces and navigation in App shell

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

---

### Task 14: Content accuracy verification pass

**Files:**
- Create: `scripts/confidence-overrides.mjs`
- Modify: `scripts/transform.mjs`
- Modify: `scripts/build-catalog.mjs`
- Modify (append): `scripts/transform.test.mjs`
- Modify (regenerated): `src/data/catalog.ts`

**Interfaces:**
- Consumes: `CatalogItem = { id; name; category:Category; domain:DomainKey; summary; confidence:Confidence; ... }`, `Confidence = 'verified'|'advanced'|'unverified'`
- Produces: `export const VERIFIED: string[]`, `export const ADVANCED: string[]` (`scripts/confidence-overrides.mjs`); `transformCatalog(raw, overrides?)` (`scripts/transform.mjs`) returning `CatalogItem[]` whose `confidence` is re-mapped by item **name**: name in `ADVANCED` → `'advanced'`, name in `VERIFIED` → `'verified'`, otherwise unchanged.

This task builds directly on Task 3. From Task 3, `scripts/transform.mjs` already exports `slugify`, `mapDomain`, `normalizeCategory`, and `transformCatalog(raw)`. The REAL `transformCatalog(raw)` takes an **object** `raw` (shape `{ catalogs: { domain; items: RawItem[] }[]; missingItems: RawItem[] }`), iterates `raw.catalogs ?? []` and each catalog's `.items`, then iterates `raw.missingItems ?? []`, building an `out` array via the `toCatalogItem(rawItem, domainKey, confidence, used)` helper (with a `used` Set for slug dedupe). There is **no** `normalizeItem` helper and `raw` is **never** an array. The steps below add an optional second parameter `overrides` and a pure `applyConfidenceOverrides` helper, leaving Task 3's two-loop body and all existing behavior intact when `overrides` is omitted.

Also from Task 3, `scripts/transform.test.mjs` already imports at the top of the file:

```ts
import { describe, it, expect } from 'vitest';
import {
  slugify,
  mapDomain,
  normalizeCategory,
  transformCatalog,
} from './transform.mjs';
```

So `describe`, `it`, `expect`, and `transformCatalog` are already in scope for anything appended to that file. The appended test blocks below MUST NOT re-import them — re-importing `describe`/`it`/`expect`/`transformCatalog` would be a duplicate-binding ESM error (`Identifier '...' has already been declared`). The only new import the appended code may add is `VERIFIED`/`ADVANCED` from `./confidence-overrides.mjs`.

- [ ] **Step 1: Write a failing test for the overrides module + `transformCatalog` overrides behavior**

  **Append** the following to the END of the existing `scripts/transform.test.mjs`. Note: this adds exactly ONE new `import` line (`VERIFIED`, `ADVANCED`). It deliberately does **not** re-import `describe`, `it`, `expect`, or `transformCatalog` — those are already imported at the top of the file from Task 3 and are in scope here.

  ```ts
  // --- Task 14: confidence overrides (appended) ---
  // NOTE: describe/it/expect and transformCatalog are already imported at the
  // top of this file (Task 3). Do NOT re-import them here.
  import { VERIFIED, ADVANCED } from './confidence-overrides.mjs';

  describe('confidence-overrides module', () => {
    it('exports VERIFIED and ADVANCED as arrays of strings', () => {
      expect(Array.isArray(VERIFIED)).toBe(true);
      expect(Array.isArray(ADVANCED)).toBe(true);
      expect(VERIFIED.every((v) => typeof v === 'string')).toBe(true);
      expect(ADVANCED.every((v) => typeof v === 'string')).toBe(true);
    });

    it('lists the gap-critic uncertain items in ADVANCED', () => {
      const expected = [
        '--teammate-mode',
        'teammateMode',
        'advisorModel',
        'Elicitation hook event',
        'ElicitationResult hook event',
        'TeammateIdle hook event',
        'ConfigChange hook event',
        'CwdChanged hook event',
        'FileChanged hook event',
        'WorktreeCreate hook event',
        'WorktreeRemove hook event',
        'PostToolBatch hook event',
        'PostToolUseFailure hook event',
        '--exclude-dynamic-system-prompt-sections',
        '--replay-user-messages',
      ];
      for (const name of expected) {
        expect(ADVANCED).toContain(name);
      }
    });
  });

  describe('transformCatalog with overrides', () => {
    // Uses the REAL transformCatalog input shape: an OBJECT with `catalogs`
    // (each holding raw items WITHOUT id/confidence) and `missingItems`.
    const raw = {
      catalogs: [
        {
          domain: 'Claude Code Slash Commands',
          items: [
            {
              name: '/clear',
              category: 'slash-command',
              summary: 'Clear the conversation history.',
            },
            {
              name: '/help',
              category: 'slash-command',
              summary: 'Show available commands.',
            },
          ],
        },
      ],
      missingItems: [
        {
          name: '--teammate-mode',
          domain: 'Claude Code CLI',
          category: 'cli-flag',
          summary: 'Bleeding-edge teammate mode flag.',
        },
      ],
    };

    it('demotes a name in ADVANCED to advanced', () => {
      const out = transformCatalog(raw, { VERIFIED, ADVANCED });
      const item = out.find((i) => i.name === '--teammate-mode');
      expect(item?.confidence).toBe('advanced');
    });

    it('promotes a name in VERIFIED to verified', () => {
      const out = transformCatalog(raw, { VERIFIED, ADVANCED });
      const item = out.find((i) => i.name === '/clear');
      expect(item?.confidence).toBe('verified');
    });

    it('is a no-op when overrides is omitted', () => {
      // Without overrides, catalog items default to 'verified' and missingItems
      // to 'advanced' (Task 3 behavior). '--teammate-mode' is a missingItem,
      // so it is 'advanced' here purely from the Task 3 default, not an override.
      const out = transformCatalog(raw);
      const clear = out.find((i) => i.name === '/clear');
      expect(clear?.confidence).toBe('verified');
    });
  });
  ```

- [ ] **Step 2: Run the test — expect FAIL**

  ```
  pnpm vitest run scripts/transform.test.mjs
  ```

  Expected FAIL: `Failed to resolve import "./confidence-overrides.mjs"` — the overrides module does not exist yet. (Once the module exists but before Step 4 wires the parameter, the `transformCatalog with overrides` cases would also fail because the second argument is ignored.)

- [ ] **Step 3: Create `scripts/confidence-overrides.mjs` (minimal impl)**

  Create `scripts/confidence-overrides.mjs`:

  ```js
  // Confidence-override policy layer.
  //
  // POLICY:
  //   - Core, newcomer-facing items (shortcuts, common slash commands, the flags
  //     and settings a beginner will actually touch) MUST be 'verified'. They are
  //     taught as fact, so they must be correct. List them in VERIFIED.
  //   - Real-but-bleeding-edge / uncertain items (unreleased or unstable hook
  //     events, experimental flags, internal-sounding settings) are BADGED
  //     'advanced', not hidden. Newcomers see them flagged so they don't trust
  //     them blindly. List them in ADVANCED.
  //   - Clearly-wrong / hallucinated items must NOT be demoted here — DELETE them
  //     from content/cc-catalog.raw.json so they never reach the catalog at all.
  //
  // This file is the single source of truth for confidence corrections;
  // transform.mjs applies it deterministically so a rebuild is reproducible.
  // Entries are matched by item NAME (not id).

  /** Names that must be promoted to 'verified' (core newcomer items). */
  export const VERIFIED = [
    'Ctrl+C',
    'Ctrl+L',
    'Ctrl+R',
    'Esc',
    '/clear',
    '/help',
    '/init',
    '/model',
    '--print',
    '--continue',
    '--resume',
    'CLAUDE.md',
  ];

  /** Names that are real but uncertain/bleeding-edge — demote to 'advanced'. */
  export const ADVANCED = [
    '--teammate-mode',
    'teammateMode',
    'advisorModel',
    'Elicitation hook event',
    'ElicitationResult hook event',
    'TeammateIdle hook event',
    'ConfigChange hook event',
    'CwdChanged hook event',
    'FileChanged hook event',
    'WorktreeCreate hook event',
    'WorktreeRemove hook event',
    'PostToolBatch hook event',
    'PostToolUseFailure hook event',
    '--exclude-dynamic-system-prompt-sections',
    '--replay-user-messages',
  ];
  ```

- [ ] **Step 4: Add the `overrides` parameter to `transformCatalog` + the `applyConfidenceOverrides` helper**

  In `scripts/transform.mjs`, add the pure `applyConfidenceOverrides` helper and thread an optional second parameter `overrides` through `transformCatalog`. Keep Task 3's REAL two-loop body exactly as-is (the `catalogs[].items` loop and the `missingItems` loop that push into `out` via `toCatalogItem`); only add the second parameter and wrap the return value. The complete modified `transformCatalog` and the new helper:

  ```js
  /**
   * Apply confidence overrides by item NAME. Pure: returns a new array.
   * `overrides` = { VERIFIED?: string[], ADVANCED?: string[] } of item names.
   * ADVANCED is applied first, then VERIFIED, so a name appearing in both would
   * end up 'verified'; in practice the curated lists are disjoint.
   *
   * @param {Array<object>} items - already-transformed catalog items.
   * @param {{ VERIFIED?: string[], ADVANCED?: string[] } | undefined} overrides
   * @returns {Array<object>}
   */
  export function applyConfidenceOverrides(items, overrides) {
    if (!overrides) return items;
    const advanced = new Set(overrides.ADVANCED ?? []);
    const verified = new Set(overrides.VERIFIED ?? []);
    return items.map((item) => {
      if (advanced.has(item.name)) return { ...item, confidence: 'advanced' };
      if (verified.has(item.name)) return { ...item, confidence: 'verified' };
      return item;
    });
  }

  export function transformCatalog(raw, overrides) {
    const used = new Set();
    const out = [];

    for (const catalog of raw.catalogs ?? []) {
      const domainKey = mapDomain(catalog.domain);
      for (const rawItem of catalog.items ?? []) {
        out.push(toCatalogItem(rawItem, domainKey, 'verified', used));
      }
    }

    for (const rawItem of raw.missingItems ?? []) {
      const domainKey = mapDomain(rawItem.domain);
      out.push(toCatalogItem(rawItem, domainKey, 'advanced', used));
    }

    return applyConfidenceOverrides(out, overrides);
  }
  ```

  (This replaces the Task 3 `transformCatalog`. The only changes versus Task 3 are: the added `overrides` parameter, and the final line which now returns `applyConfidenceOverrides(out, overrides)` instead of `out`. `slugify`, `mapDomain`, `normalizeCategory`, `uniqueId`, and `toCatalogItem` are unchanged.)

- [ ] **Step 5: Run the test — expect PASS**

  ```
  pnpm vitest run scripts/transform.test.mjs
  ```

  Expected PASS: the `confidence-overrides module` cases, all `transformCatalog with overrides` cases (`--teammate-mode` → `'advanced'`, `/clear` → `'verified'`, omitted-overrides no-op), AND all pre-existing Task 3 `slugify` / `mapDomain` / `normalizeCategory` / `transformCatalog` cases stay green.

- [ ] **Step 6: Wire overrides into `scripts/build-catalog.mjs`**

  Modify `scripts/build-catalog.mjs` to import the override lists and pass them as the second argument to `transformCatalog`. The complete corrected file:

  ```js
  // Reads content/cc-catalog.raw.json, transforms it, and writes the generated
  // src/data/catalog.ts. Run via `pnpm build:catalog`.
  import { readFileSync, writeFileSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';
  import { dirname, resolve } from 'node:path';
  import { transformCatalog } from './transform.mjs';
  import { VERIFIED, ADVANCED } from './confidence-overrides.mjs';

  const here = dirname(fileURLToPath(import.meta.url));
  const rawPath = resolve(here, '../content/cc-catalog.raw.json');
  const outPath = resolve(here, '../src/data/catalog.ts');

  const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
  const items = transformCatalog(raw, { VERIFIED, ADVANCED });

  const file =
    '// AUTO-GENERATED by scripts/build-catalog.mjs — do not edit\n' +
    'import type { CatalogItem } from "./types";\n' +
    'export const CATALOG: CatalogItem[] = ' +
    JSON.stringify(items, null, 2) +
    ';\n';

  writeFileSync(outPath, file, 'utf8');
  console.log(`Wrote ${items.length} items to ${outPath}`);
  ```

  (Only two changes versus Task 3: the added `import { VERIFIED, ADVANCED } from './confidence-overrides.mjs';` line, and `transformCatalog(raw, { VERIFIED, ADVANCED })` instead of `transformCatalog(raw)`. The JSON read and the `src/data/catalog.ts` emit are untouched.)

- [ ] **Step 7: Regenerate the catalog and confirm a demoted item now reads `'advanced'`**

  ```
  node scripts/build-catalog.mjs
  ```

  Expected output: `Wrote <N> items to .../src/data/catalog.ts` (same item count as Task 3 — overrides only change `confidence`, never add or drop items). Then re-run the tests to confirm nothing regressed:

  ```
  pnpm vitest run scripts/transform.test.mjs
  ```

  Expected PASS. Finally, manually verify the regenerated `src/data/catalog.ts` actually carries a demotion: grep it for `--replay-user-messages` (or any ADVANCED name present in the raw JSON) and confirm that entry's object has `"confidence": "advanced"`. If an ADVANCED name is absent from `src/data/catalog.ts`, it was never in `content/cc-catalog.raw.json` — that is fine (the override is a no-op for missing names); but if a name is present yet still shows `"verified"`/`"unverified"`, the Step 6 wiring is wrong — fix it and re-run `node scripts/build-catalog.mjs`.

- [ ] **Step 8: Commit the overrides layer and the regenerated catalog**

  ```
  git add scripts/confidence-overrides.mjs scripts/transform.mjs scripts/build-catalog.mjs scripts/transform.test.mjs src/data/catalog.ts
  ```

  ```
  git commit -m "feat(catalog): add reproducible confidence-override layer

Demote uncertain bleeding-edge items to 'advanced' and promote core
newcomer items to 'verified' via scripts/confidence-overrides.mjs, applied
by name in transformCatalog(raw, overrides) and wired through
build-catalog.mjs. Regenerate src/data/catalog.ts.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

---

### Task 15: Deploy (GitHub Actions → Pages) + Playwright smoke test

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (add `@playwright/test` devDep + `test:e2e` script)
- Modify: `README.md` (add `## Deploy` section)
- Test: `tests/e2e/smoke.spec.ts` (the Playwright smoke spec is itself the test artifact for this task)

**Interfaces:**
- Consumes (build pipeline): `pnpm build:catalog` → `node scripts/build-catalog.mjs` generates `src/data/catalog.ts` (`export const CATALOG: CatalogItem[]`); `pnpm build` → emits `./dist` with Vite `base = '/claude-code-visualizer/'`.
- Consumes (runtime surface, via served DOM): TitleBar renders a `<header>` with an `<h1>` (`✻ Claude Code — Interactive Trainer`); Mode tabs `'cheatsheet' | 'keyboard' | 'playground'` (`Mode` from `src/data/types.ts`) live in CommandBar (`role="tablist"` / `role="tab"`); the playground prompt is `getByTestId('prompt-input')` with `aria-label="Prompt"`; `/playground` is parsed by `parseInput`/`runCommand` (`src/engine/parser.ts`, `src/engine/commandRegistry.ts`) to navigate; the Playground surface renders `WelcomeBox` (`data-testid="welcome"`, text `Welcome to the Claude Code Trainer`) persistently at the top; the Cheatsheet search box is `getByRole('searchbox')` (`<input type="search">`, `aria-label="Search features"`) backed by `searchCatalog` (`src/lib/search.ts`), results in `data-testid="results-grid"` with cards `data-testid="item-card"`; the KeyboardVisualizer root carries `data-testid="keyboard"`.
- Produces: a GitHub Pages deployment of `./dist` and an e2e smoke spec run via `pnpm test:e2e` (`playwright test`).

Notes: Vitest unit tests live under `src/**` (jsdom); Playwright e2e lives under `tests/e2e` so Vitest never picks up `.spec.ts` browser tests. The Vite preview server serves at `http://localhost:4173/claude-code-visualizer/`. Every selector below targets the canonical DOM contract exactly so the smoke test passes against the real components from Tasks 8–13.

- [ ] **Step 1: Add the e2e smoke test (red).** Create `tests/e2e/smoke.spec.ts` with the complete spec. It cannot pass yet because there is no `playwright.config.ts` / `test:e2e` script.

```ts
import { test, expect } from '@playwright/test';

test.describe('Claude Code Interactive Trainer smoke', () => {
  test('loads, switches surfaces, and runs a command', async ({ page }) => {
    // Home — base path is applied by baseURL in playwright.config.ts.
    // TitleBar renders <header><h1>✻ Claude Code — Interactive Trainer</h1></header>.
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Claude Code/i }),
    ).toBeVisible();

    // Cheatsheet tab → searchbox 'clear' → expect at least one result card.
    // SearchBox is <input type="search" aria-label="Search features">; results
    // live in data-testid="results-grid" with cards data-testid="item-card".
    await page.getByRole('tab', { name: /Cheatsheet/i }).click();
    const search = page.getByRole('searchbox');
    await search.fill('clear');
    await expect(
      page.getByTestId('results-grid').getByTestId('item-card').first(),
    ).toBeVisible();

    // Keyboard tab → expect the interactive keyboard (root data-testid="keyboard").
    await page.getByRole('tab', { name: /Keyboard/i }).click();
    await expect(page.getByTestId('keyboard')).toBeVisible();

    // Playground via the prompt: the input has data-testid="prompt-input"
    // and aria-label="Prompt". Type '/playground' + Enter to navigate; the
    // Playground surface shows WelcomeBox (data-testid="welcome") persistently.
    await page.getByRole('tab', { name: /Playground/i }).click();
    const prompt = page.getByTestId('prompt-input');
    await prompt.click();
    await prompt.fill('/playground');
    await prompt.press('Enter');
    await expect(page.getByTestId('welcome')).toContainText(
      /Welcome to the Claude Code Trainer/i,
    );
  });
});
```

- [ ] **Step 2: Run it — confirm RED.** Run `pnpm exec playwright test tests/e2e/smoke.spec.ts`.
  Expected FAIL: Playwright is not installed / `playwright.config.ts` missing → `Error: Cannot find module '@playwright/test'` (or `No configuration found`). This proves the test is wired before the harness exists.

- [ ] **Step 3: Add the devDep + script (minimal).** Install Playwright as a frozen-respecting devDep and add the `test:e2e` script.
  Run: `pnpm add -D @playwright/test`
  Then edit `package.json` `scripts` to add **only** the new `test:e2e` line, leaving every existing script untouched:

```json
"test:e2e": "playwright test"
```

  Do NOT reprint or rewrite the surrounding `scripts` block. In particular, `"build:catalog"` MUST remain `"node scripts/build-catalog.mjs"` (the pipeline file is `scripts/build-catalog.mjs`, plain Node ESM). Do NOT introduce `tsx` or a `.ts` build script — that would reference a nonexistent file and an undeclared dependency, breaking the CI "Build catalog" step. For reference, after this edit the `scripts` block reads:

```json
{
  "scripts": {
    "dev": "vite",
    "build:catalog": "node scripts/build-catalog.mjs",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 4: Create `playwright.config.ts` (green harness).** Point `baseURL` at the served base path and boot `pnpm preview` as the web server.

```ts
import { defineConfig, devices } from '@playwright/test';

const BASE_PATH = '/claude-code-visualizer/';
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Install the browser + run e2e — confirm GREEN.**
  Run: `pnpm build:catalog && pnpm build` (the preview server needs a fresh `./dist`).
  Run: `pnpm exec playwright install --with-deps chromium`
  Run: `pnpm test:e2e`
  Expected PASS: `1 passed` — Playwright boots `pnpm preview`, loads `http://localhost:4173/claude-code-visualizer/`, and the smoke assertions all resolve: the `<h1>` heading matches `/Claude Code/i`; the Cheatsheet searchbox + `results-grid`/`item-card` show a result for `clear`; the KeyboardVisualizer root (`data-testid="keyboard"`) is visible; and typing `/playground` + Enter into `prompt-input` navigates to the Playground surface whose `welcome` box contains `Welcome to the Claude Code Trainer`. (CI installs the browser too — see Step 6.)

- [ ] **Step 6: Create `.github/workflows/deploy.yml` (build + deploy to Pages).**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build catalog
        run: pnpm build:catalog

      - name: Build site
        run: pnpm build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7: Add the `## Deploy` README section.** Append to `README.md`:

```markdown
## Deploy

The app deploys to **GitHub Pages** via `.github/workflows/deploy.yml` on every push to `main`
(and via manual **workflow_dispatch**). The workflow runs `pnpm install --frozen-lockfile`,
`pnpm build:catalog` (`node scripts/build-catalog.mjs`), `pnpm build`, then uploads `./dist` and
publishes it.

**One-time setup:** enable Pages in **Settings → Pages → Source: GitHub Actions**.

The site is served under the base path **`/claude-code-visualizer/`** (Vite `base`), so the live
URL is `https://<owner>.github.io/claude-code-visualizer/`. The same base is used locally by
`pnpm preview` (`http://localhost:4173/claude-code-visualizer/`), which is what the Playwright
e2e smoke test (`pnpm test:e2e`) drives.
```

- [ ] **Step 8: Commit.**
  Run:
```
git add .github/workflows/deploy.yml playwright.config.ts tests/e2e/smoke.spec.ts package.json pnpm-lock.yaml README.md
```
```
git commit -m "$(cat <<'EOF'
ci: deploy to GitHub Pages and add Playwright smoke test

Add Actions workflow building dist and publishing to Pages, plus a
Playwright e2e smoke test served from the /claude-code-visualizer/ base.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```
