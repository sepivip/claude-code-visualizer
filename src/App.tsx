import { Suspense } from 'react';
import { AppProvider, useApp } from './components/shell/AppContext';
import { TerminalWindow } from './components/shell/TerminalWindow';
import { surfaces } from './surfaces';

function LoadingFallback(): JSX.Element {
  return (
    <div className="flex items-center gap-2 p-4 font-mono text-sm text-[#D97757]">
      <span>loading</span>
      <span className="animate-pulse">▌</span>
    </div>
  );
}

function Surface(): JSX.Element {
  const { mode } = useApp();
  const Active = surfaces[mode];
  return (
    <div data-testid={`surface-${mode}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Active />
      </Suspense>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <AppProvider>
      <TerminalWindow>
        <Surface />
      </TerminalWindow>
    </AppProvider>
  );
}
