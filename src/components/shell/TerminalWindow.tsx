import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { CommandBar } from './CommandBar';
import { PromptBar } from './PromptBar';

export function TerminalWindow({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <TitleBar />
      <CommandBar />
      <main className="flex-1 overflow-auto p-4">{children}</main>
      <PromptBar />
    </div>
  );
}
