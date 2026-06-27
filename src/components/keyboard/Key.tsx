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
    'bg-neutral-900/50 border-neutral-800/80 text-neutral-600 opacity-70 cursor-default',
  active:
    'bg-[#D97757]/10 border-[#D97757]/40 text-[#e7b6a3] cursor-pointer hover:bg-[#D97757]/20 hover:border-[#D97757]/70 hover:text-[#f0cdbe]',
  partner:
    'relative z-10 bg-[#D97757]/20 border-[#D97757]/80 text-[#f0c3b1] cursor-pointer shadow-[0_0_0_1px_rgba(217,119,87,0.55),0_0_9px_1px_rgba(217,119,87,0.28)]',
  selected:
    'relative z-20 bg-[#D97757] text-black border-[#D97757] font-semibold cursor-pointer shadow-[0_0_0_1px_#D97757,0_0_14px_2px_rgba(217,119,87,0.5)]',
};

export function Key({ def, state, label, onSelect }: KeyProps): JSX.Element {
  if (def.spacer) {
    return <Spacer w={def.w ?? 1} />;
  }

  const isInactive = state === 'inactive';
  const classes = [
    'rounded-md border px-1 py-2 text-xs font-mono transition-[background-color,border-color,box-shadow,color] duration-150 min-h-[var(--ku)] flex items-center justify-center text-center leading-tight',
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
