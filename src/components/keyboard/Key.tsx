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
      aria-label={`${def.label} key`}
      className={classes}
      onClick={() => onSelect(def.key)}
    >
      {def.label}
    </button>
  );
}
