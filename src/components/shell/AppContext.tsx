import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Mode, Platform } from '../../data/types';
import type { TerminalLine } from '../../engine/types';
import { parseInput } from '../../engine/parser';
import { runCommand } from '../../engine/commandRegistry';
import { CATALOG } from '../../data/catalog';
import { useHashRoute } from '../../hooks/useHashRoute';

export interface AppContextValue {
  mode: Mode;
  setMode: (m: Mode, params?: Record<string, string>) => void;
  params: Record<string, string>;
  setParams: (p: Record<string, string>) => void;
  lines: TerminalLine[];
  submit: (raw: string) => void;
  platform: Platform;
  setPlatform: (p: Platform) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'mac';
  const p = navigator.platform || '';
  if (/mac/i.test(p)) return 'mac';
  if (/win/i.test(p)) return 'win';
  return 'linux';
}

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [route, setRoute] = useHashRoute();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const turn = useRef(0);

  const setMode = (m: Mode, params: Record<string, string> = {}): void =>
    setRoute({ mode: m, params });
  const setParams = (p: Record<string, string>): void =>
    setRoute({ mode: route.mode, params: p });

  const submit = (raw: string): void => {
    const parsed = parseInput(raw);
    const result = runCommand(parsed, { catalog: CATALOG });
    if (result.clear) {
      setLines([]);
    } else {
      const echo: TerminalLine = { id: '', kind: 'input', text: raw };
      const next = [echo, ...result.lines].map((line) => ({
        ...line,
        id: `turn-${turn.current++}`,
      }));
      setLines((prev) => [...prev, ...next]);
    }
    if (result.navigate) setMode(result.navigate);
  };

  const value: AppContextValue = {
    mode: route.mode,
    setMode,
    params: route.params,
    setParams,
    lines,
    submit,
    platform,
    setPlatform,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}

export function useOptionalApp(): AppContextValue | null {
  return useContext(AppContext);
}
