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
