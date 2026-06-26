import type { ReactNode } from 'react';

interface BoxFrameProps {
  title?: string;
  children: ReactNode;
}

export function BoxFrame({ title, children }: BoxFrameProps): JSX.Element {
  return (
    <div className="relative rounded-md border border-cc-border bg-cc-panel px-4 py-3">
      {title !== undefined && (
        <div className="absolute -top-2.5 left-3 bg-cc-panel px-2 text-xs text-cc-accent">
          {title}
        </div>
      )}
      <div className="text-cc-fg">{children}</div>
    </div>
  );
}
