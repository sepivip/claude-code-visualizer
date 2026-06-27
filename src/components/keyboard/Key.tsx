// src/components/keyboard/Key.tsx
import type { KeyDef } from './layout';

export type KeyState = 'inactive' | 'active' | 'selected' | 'partner';

type KeyProps = {
  def: KeyDef;
  state: KeyState;
  label: string;
  onSelect: (def: KeyDef) => void;
};

// Spacer: invisible block for layout gap.
function Spacer({ w }: { w: number }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{ width: `calc(${w} * var(--ku))`, flexShrink: 0 }}
    />
  );
}

const STATE_CLASSES: Record<KeyState, string> = {
  inactive:
    'bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-default opacity-60',
  active:
    'bg-[#D97757]/12 border-[#D97757]/60 text-[#e8b9a6] cursor-pointer hover:bg-[#D97757]/25 hover:border-[#D97757]',
  partner:
    'bg-[#D97757]/25 border-[#D97757] text-[#D97757] ring-2 ring-[#D97757]/70 cursor-pointer',
  selected:
    'bg-[#D97757] text-black border-[#D97757] ring-2 ring-[#D97757] ring-offset-2 ring-offset-neutral-950 cursor-pointer',
};

export function Key({ def, state, label, onSelect }: KeyProps): JSX.Element {
  if (def.spacer) {
    return <Spacer w={def.w ?? 1} />;
  }

  const isInactive = state === 'inactive';
  const classes = [
    'rounded-md border px-1 py-2 text-xs font-mono transition-colors min-h-[var(--ku)] flex items-center justify-center text-center leading-tight',
    STATE_CLASSES[state],
  ].join(' ');

  return (
    <button
      type="button"
      data-testid="kb-key"
      data-code={def.code}
      data-state={state}
      aria-label={`${label} key`}
      aria-pressed={state === 'selected'}
      disabled={isInactive}
      className={classes}
      style={{ width: `calc(${def.w ?? 1} * var(--ku))`, flexShrink: 0 }}
      onClick={isInactive ? undefined : () => onSelect(def)}
    >
      {label}
    </button>
  );
}
