// src/components/cheatsheet/ItemDrawer.tsx
import { useEffect, useRef } from 'react';
import { CopyButton } from '../common';
import { domainOf } from '../../data/domains';
import type { CatalogItem } from '../../data/types';

export function ItemDrawer({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [item.id]);

  const dm = domainOf(item.domain);

  const trap = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = ref.current?.querySelectorAll<HTMLElement>(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} details`}
      tabIndex={-1}
      onKeyDown={trap}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5 outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{item.name}</h2>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {item.category} · {dm.label}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded px-2 py-1 text-neutral-400 hover:text-neutral-100"
        >
          ✕
        </button>
      </div>

      {item.syntax && (
        <code className="block rounded bg-neutral-800 px-2 py-1 text-sm text-[#D97757]">
          {item.syntax}
        </code>
      )}

      <p className="text-sm text-neutral-300">{item.summary}</p>
      {item.details && <p className="text-sm text-neutral-400">{item.details}</p>}

      {item.example && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-neutral-500">Example</span>
            <CopyButton text={item.example} />
          </div>
          <pre className="overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-200">
            {item.example}
          </pre>
        </div>
      )}

      {item.newcomerTip && (
        <p className="rounded border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-300">
          <span className="font-medium text-[#D97757]">Tip: </span>
          {item.newcomerTip}
        </p>
      )}

      {item.platformNotes && (
        <p className="text-xs text-neutral-500">{item.platformNotes}</p>
      )}

      {item.source && (
        <a
          href={item.source}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#D97757] underline"
        >
          Source
        </a>
      )}
    </div>
  );
}
