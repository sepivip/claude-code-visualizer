import { lazy } from 'react';
import type React from 'react';
import type { Mode } from './data/types';
import { Start } from './components/start/Start';

// Start is eager — it's the default surface and is light.
// All other surfaces are lazy-loaded for code-splitting.
const Playground = lazy(() =>
  import('./components/playground/Playground').then((m) => ({
    default: m.Playground,
  })),
);
const Cheatsheet = lazy(() =>
  import('./components/cheatsheet/Cheatsheet').then((m) => ({
    default: m.Cheatsheet,
  })),
);
const KeyboardVisualizer = lazy(() =>
  import('./components/keyboard/KeyboardVisualizer').then((m) => ({
    default: m.KeyboardVisualizer,
  })),
);
const Quiz = lazy(() =>
  import('./components/quiz/Quiz').then((m) => ({ default: m.Quiz })),
);

export const surfaces: Record<Mode, React.ComponentType<Record<string, never>>> = {
  start: Start,
  playground: Playground,
  cheatsheet: Cheatsheet,
  keyboard: KeyboardVisualizer,
  quiz: Quiz,
};
