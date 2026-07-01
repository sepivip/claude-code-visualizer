import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { completions } from '../../engine/commandRegistry';
import { useApp } from './AppContext';

export function PromptBar(): JSX.Element {
  const { mode, submit, catalog } = useApp();
  const [value, setValue] = useState('');
  const [hint, setHint] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef<number>(-1);

  const handleSubmit = (): void => {
    const raw = value.trim();
    if (!raw) return;
    history.current = [...history.current, raw];
    cursor.current = history.current.length;
    submit(raw);
    setValue('');
    setHint('');
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    handleSubmit();
  };

  const recall = (delta: number): void => {
    const list = history.current;
    if (list.length === 0) return;
    let next = cursor.current === -1 ? list.length : cursor.current;
    next = Math.min(Math.max(next + delta, 0), list.length);
    cursor.current = next;
    setValue(next >= list.length ? '' : list[next]);
  };

  const handleTab = (): void => {
    if (!value.startsWith('/')) return;
    const matches = completions(value, { catalog });
    if (matches.length === 1) {
      setValue(matches[0]);
      setHint('');
    } else if (matches.length > 1) {
      setHint(matches.join('  '));
    } else {
      setHint('');
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      recall(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      recall(1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTab();
    }
  };

  return (
    <div
      data-testid="prompt-bar"
      className="border-t border-neutral-800 px-3 py-2"
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <span
          className="rounded bg-[#D97757] px-2 py-0.5 text-xs font-medium text-black"
          aria-label={`Current mode: ${mode}`}
        >
          {mode}
        </span>
        <span className="text-[#D97757]" aria-hidden="true">
          {'>'}
        </span>
        <input
          type="text"
          data-testid="prompt-input"
          aria-label="Prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-neutral-100 outline-none"
        />
      </form>
      {hint ? (
        <div
          data-kind="system"
          className="mt-1 text-xs text-neutral-500"
          role="status"
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
