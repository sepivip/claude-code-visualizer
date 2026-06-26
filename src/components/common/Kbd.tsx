import type { ReactNode } from 'react';

interface KbdProps {
  children: ReactNode;
}

export function Kbd({ children }: KbdProps): JSX.Element {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-cc-border bg-cc-panel px-1.5 py-0.5 text-xs text-cc-fg">
      {children}
    </kbd>
  );
}
