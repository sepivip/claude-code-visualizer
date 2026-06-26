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
