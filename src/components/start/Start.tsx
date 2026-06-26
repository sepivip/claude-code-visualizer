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
