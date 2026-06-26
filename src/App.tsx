import { AppProvider, useApp } from './components/shell/AppContext';
import { TerminalWindow } from './components/shell/TerminalWindow';
import { surfaces } from './surfaces';

function Surface(): JSX.Element {
  const { mode } = useApp();
  const Active = surfaces[mode];
  return (
    <div data-testid={`surface-${mode}`}>
      <Active />
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
