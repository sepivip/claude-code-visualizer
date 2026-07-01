# How cckeys was built — with Claude Code

**[cckeys.work](https://cckeys.work)** · [source (MIT)](https://github.com/sepivip/claude-code-visualizer)

I kept forgetting Claude Code's shortcuts. Was it `Ctrl+R` or `Ctrl+O`? What did double-`Esc` do again?
So I built **cckeys** — a free, terminal-styled web app to learn the Claude Code CLI by doing. And I
built the whole thing *with* Claude Code, which turned out to be the more interesting story.

## What it is

The app is one Claude Code window in your browser. Five ways to learn:

- **⌨️ Keyboard visualizer** — a full keyboard where shortcut keys glow. Click a key and its partner
  keys light up (click `Ctrl` and every Ctrl-shortcut key lights up), with mac / Windows / Linux views.
- **🔍 Cheatsheet** — searchable, filterable catalog of every feature, with examples and shareable links.
- **🎮 Playground** — a safe simulated terminal (nothing executes) to try commands.
- **🧠 Quiz** — multiple-choice and *type-the-shortcut* questions, scored, with explanations.
- **🚀 Start here** — a guided, chaptered track for newcomers.

No install, no backend, no tracking. Static site on GitHub Pages.

## How it got built

This is the part I found genuinely surprising. The whole thing came together through a fairly
disciplined agent workflow:

1. **Brainstorm → spec.** Nailed the vision (terminal-styled, interactive, for newcomers) and wrote it
   to a design doc before any code.
2. **Audited the docs with a fleet of agents.** A dozen agents each researched one Claude Code domain
   (shortcuts, slash commands, CLI flags, hooks, MCP, subagents…) against the official docs, producing
   a catalog of ~700 features. A "completeness critic" agent then hunted for gaps.
3. **Wrote a task-by-task TDD plan** — then ran *two adversarial review rounds* over the plan itself,
   which caught **8 blockers** (interface drift between independently-drafted tasks) *before a line of
   app code existed*.
4. **Built it subagent-driven:** a fresh agent implemented each task test-first, an independent agent
   reviewed each one, and every UI change was verified with **real browser screenshots** (Playwright) —
   not just "tests pass," but "does it actually look right?"
5. **Shipped** to a custom domain (`cckeys.work`) with CI that gates the deploy on tests, then kept
   iterating: a full-size TKL keyboard with soft partner-glow highlighting, the quiz, the guided track,
   lazy-loaded the catalog to cut first paint from ~740KB to ~165KB, and ran a multi-agent accuracy
   pass to re-check every shortcut and command against the docs.

A few things that made it work:

- **Screenshot verification.** Tests catch logic bugs; they don't catch "these glows overlap and look
  ugly." Having an agent take an actual screenshot and *look* caught real visual issues every time.
- **A shared "contract."** When many agents build pieces in parallel, they drift. Pinning exact type
  signatures and DOM testids up front — and adversarially reviewing for drift — was the difference
  between a plan that assembles and one that doesn't.
- **The bugs it caught are the fun ones.** The keyboard once mislabeled the "open external editor"
  shortcut because a two-stroke binding (`Ctrl+X Ctrl+E`) got mis-parsed into a single `Ctrl+E` — a
  subtle "it's teaching the wrong thing" bug that a user (correctly) called out and we fixed. The later
  accuracy pass caught more: `/vim` was removed in a recent version, `/workflow` is actually
  `/workflows`, and the mode-cycle uses `acceptEdits`, not "auto-accept."

## By the numbers

- ~660 catalogued features across 12 domains, verified against the official docs
- 220+ unit tests + a Playwright end-to-end smoke, gating every deploy
- 5 interactive surfaces, one terminal aesthetic (coral `#D97757`, JetBrains Mono)
- ~165KB initial JS (catalog lazy-loaded on demand)
- 0 backend, 0 trackers

## Try it

**[cckeys.work](https://cckeys.work)** — and it's open source, so if I got a shortcut wrong, open an
issue or a PR: **[github.com/sepivip/claude-code-visualizer](https://github.com/sepivip/claude-code-visualizer)**.

*Not affiliated with Anthropic — just a fan of the tool who kept forgetting the shortcuts.*
