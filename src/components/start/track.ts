// Curated, accurate content for the guided "Start here" track.
// Self-contained (no catalog lookup) so the copy stays correct and stable.
import type { Mode } from '../../data/types';

export interface TrackStep {
  heading: string;
  body: string;
}

export interface TrackKey {
  /** The keystroke or command, shown as a chip (e.g. "Shift+Tab", "/clear", "@file"). */
  label: string;
  /** One-line description. */
  desc: string;
}

export interface TrackCta {
  label: string;
  mode: Mode;
  params?: Record<string, string>;
}

export interface Chapter {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  steps: TrackStep[];
  keys: TrackKey[];
  cta: TrackCta;
}

export const TRACK: Chapter[] = [
  {
    id: 'prompt',
    title: 'The prompt',
    icon: '✻',
    blurb:
      'Claude Code is a terminal where you talk to Claude in plain English. It reads your project and does the work — you just describe what you want.',
    steps: [
      {
        heading: 'Just say what you want',
        body: 'Type things like "fix the failing test", "explain this file", or "add a dark-mode toggle". No special syntax required — Claude figures out which files to read and edit.',
      },
      {
        heading: 'Send and continue',
        body: 'Press Enter to send. For a multi-line message, end a line with a backslash \\ (or use Option/Shift+Enter). Your past prompts are one ↑ away.',
      },
      {
        heading: 'Steer mid-task',
        body: 'Press Esc to interrupt — Claude stops but keeps the work done so far, so you can redirect. Press Ctrl+C to cancel input, or again to exit.',
      },
    ],
    keys: [
      { label: 'Enter', desc: 'Send your message' },
      { label: 'Esc', desc: 'Interrupt the current response' },
      { label: 'Ctrl+C', desc: 'Cancel input / exit' },
      { label: 'Ctrl+R', desc: 'Search your prompt history' },
    ],
    cta: { label: 'Try the prompt →', mode: 'playground' },
  },
  {
    id: 'modes',
    title: 'Modes & permissions',
    icon: '🔐',
    blurb:
      'By default Claude asks before editing files or running commands. You decide how much to trust it — and switch on the fly.',
    steps: [
      {
        heading: 'Pick a permission mode',
        body: 'Default asks each time. Auto-accept stops asking for file edits. Plan mode is read-only — Claude proposes a plan without changing anything. Bypass runs everything without asking (use with care).',
      },
      {
        heading: 'Switch with one key',
        body: 'Press Shift+Tab to cycle modes. The current mode is shown in the prompt footer, so you always know what Claude can do.',
      },
      {
        heading: 'Set the rules',
        body: 'Use /permissions to allow or deny specific tools — e.g. always allow Bash(npm run test:*) or Read(./src/**), and require approval for everything else.',
      },
    ],
    keys: [
      { label: 'Shift+Tab', desc: 'Cycle permission modes' },
      { label: 'plan mode', desc: 'Read-only: propose without touching files' },
      { label: '/permissions', desc: 'Allow/deny specific tools' },
    ],
    cta: { label: 'See the modifier keys →', mode: 'keyboard' },
  },
  {
    id: 'slash',
    title: 'Slash commands',
    icon: '/',
    blurb:
      'Type / to run built-in commands — manage the conversation, switch models, set up your project, and more.',
    steps: [
      {
        heading: 'The essentials',
        body: '/help lists everything. /clear wipes the conversation to start fresh; /compact summarizes it to reclaim context when things get long.',
      },
      {
        heading: 'Configure on the fly',
        body: '/model switches the model, /config opens settings, and /init scans your repo to write a starter CLAUDE.md. /agents and /mcp manage subagents and integrations.',
      },
      {
        heading: 'Make your own',
        body: 'Drop a Markdown file in .claude/commands/ and it becomes a custom /command — great for repeatable prompts and team workflows.',
      },
    ],
    keys: [
      { label: '/help', desc: 'List every command' },
      { label: '/clear', desc: 'Start a fresh conversation' },
      { label: '/compact', desc: 'Summarize to free up context' },
      { label: '/init', desc: 'Generate a project CLAUDE.md' },
    ],
    cta: { label: 'Browse all commands →', mode: 'cheatsheet', params: { q: '/' } },
  },
  {
    id: 'files',
    title: 'Files & memory',
    icon: '📁',
    blurb:
      'Point Claude at the right files, and teach it lasting facts about your project so it gets smarter over time.',
    steps: [
      {
        heading: 'Mention files with @',
        body: 'Type @ then a path to pull a file or folder into context: @src/app.ts. Claude reads it before answering, so it works from the real code, not guesses.',
      },
      {
        heading: 'Remember things with #',
        body: 'Start a line with # to save a quick note to CLAUDE.md — e.g. "# we use pnpm, not npm". /init creates a starter file and /memory opens it for editing.',
      },
      {
        heading: 'CLAUDE.md is always loaded',
        body: 'It loads every session, so put your conventions, key commands, and gotchas there once and Claude follows them everywhere.',
      },
    ],
    keys: [
      { label: '@file', desc: 'Pull a file/folder into context' },
      { label: '#note', desc: 'Save a quick memory to CLAUDE.md' },
      { label: '/init', desc: 'Generate a starter CLAUDE.md' },
      { label: '/memory', desc: 'Edit your project memory' },
    ],
    cta: { label: 'Try @ and # in the Playground →', mode: 'playground' },
  },
  {
    id: 'power',
    title: 'Power features',
    icon: '⚡',
    blurb:
      "When you're ready to level up: hooks, MCP, and subagents turn Claude Code from a tool into a platform.",
    steps: [
      {
        heading: 'Hooks — automate on events',
        body: 'Run your own scripts when things happen (before/after a tool runs, on session start, etc.) via settings.json — e.g. auto-format on save or block edits to sensitive files.',
      },
      {
        heading: 'MCP — connect external tools',
        body: 'Model Context Protocol servers give Claude new powers: databases, browsers, docs, GitHub, and more. Add one with claude mcp add.',
      },
      {
        heading: 'Subagents — delegate work',
        body: 'Specialized agents Claude can hand tasks to (reviewers, researchers), each with its own prompt and tools. Define them in .claude/agents/ or with /agents.',
      },
    ],
    keys: [
      { label: '/hooks', desc: 'Configure event hooks' },
      { label: '/mcp', desc: 'Manage MCP servers' },
      { label: '/agents', desc: 'Create & manage subagents' },
    ],
    cta: { label: 'Explore the full cheatsheet →', mode: 'cheatsheet' },
  },
];
