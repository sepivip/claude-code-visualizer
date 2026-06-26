// src/components/cheatsheet/SearchBox.tsx
import { useEffect, useRef } from 'react';

export function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== '/') return;
      const el = document.activeElement;
      const tag = el?.tagName;
      const editable = el instanceof HTMLElement && el.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <input
      ref={ref}
      type="search"
      aria-label="Search features"
      placeholder="Search features…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-neutral-900 px-3 py-2 text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-[#D97757]"
    />
  );
}
