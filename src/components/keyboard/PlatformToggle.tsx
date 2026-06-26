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
