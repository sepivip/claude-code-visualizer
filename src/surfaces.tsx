import type React from 'react';
import type { Mode } from './data/types';
import { Start } from './components/start/Start';
import { Playground } from './components/playground/Playground';
import { Cheatsheet } from './components/cheatsheet/Cheatsheet';
import { KeyboardVisualizer } from './components/keyboard/KeyboardVisualizer';
import { Quiz } from './components/quiz/Quiz';

export const surfaces: Record<Mode, React.ComponentType<Record<string, never>>> = {
  start: Start,
  playground: Playground,
  cheatsheet: Cheatsheet,
  keyboard: KeyboardVisualizer,
  quiz: Quiz,
};
