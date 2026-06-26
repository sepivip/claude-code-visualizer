import { useEffect, useRef, useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Copy' }: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = (): void => {
    const clipboard = navigator.clipboard;
    if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
      return;
    }
    void clipboard.writeText(text).then(() => {
      setCopied(true);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded border border-cc-border px-2 py-0.5 text-xs text-cc-muted hover:text-cc-fg"
    >
      <span aria-live="polite">{copied ? 'Copied!' : label}</span>
    </button>
  );
}
