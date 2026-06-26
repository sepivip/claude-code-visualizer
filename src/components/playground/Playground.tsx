// src/components/playground/Playground.tsx
import { Scrollback } from './Scrollback';
import { WelcomeBox } from './WelcomeBox';

export function Playground(): JSX.Element {
  // WelcomeBox is rendered persistently at the top of the playground surface,
  // with the scrollback below it. The surface-playground testid is injected by
  // the App.tsx surface wrapper (Task 13), NOT here.
  return (
    <div className="space-y-4 p-4">
      <WelcomeBox />
      <Scrollback />
    </div>
  );
}
