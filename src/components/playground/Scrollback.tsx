// src/components/playground/Scrollback.tsx
import { useEffect, useRef } from 'react';
import { useApp } from '../shell/AppContext';
import { BoxFrame } from '../common/BoxFrame';
import type { TerminalLine } from '../../engine/types';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function LineRow({ line }: { line: TerminalLine }): JSX.Element {
  switch (line.kind) {
    case 'input':
      return (
        <div className="font-mono text-sm text-neutral-500">
          {'> '}
          {line.text}
        </div>
      );
    case 'error':
      return (
        <div role="alert" className="font-mono text-sm text-red-400">
          {line.text}
        </div>
      );
    case 'suggestion':
      return (
        <div className="font-mono text-sm text-[#D97757]/70">{line.text}</div>
      );
    case 'box':
      return (
        <BoxFrame title={line.title}>
          <div className="whitespace-pre-wrap font-mono text-sm text-neutral-200">
            {line.text}
          </div>
        </BoxFrame>
      );
    case 'output':
    case 'system':
    default:
      return (
        <div className="whitespace-pre-wrap font-mono text-sm text-neutral-200">
          {line.text}
        </div>
      );
  }
}

export function Scrollback(): JSX.Element {
  const { lines } = useApp();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = endRef.current;
    if (!node || typeof node.scrollIntoView !== 'function') return;
    node.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [lines]);

  return (
    <div className="space-y-2" data-testid="scrollback">
      {lines.map((line) => (
        <LineRow key={line.id} line={line} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
