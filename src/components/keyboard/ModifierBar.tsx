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
