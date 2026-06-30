import { useCallback, useState } from 'react';
import { TRACK } from './track';
import type { Chapter } from './track';
import { useApp } from '../shell/AppContext';
import { load, save } from '../../lib/storage';

const STORAGE_KEY = 'guided-progress';
const TOTAL = TRACK.length;

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }): JSX.Element {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div
      data-testid="track-progress"
      className="flex items-center gap-3 font-mono text-xs text-cc-muted"
      aria-label={`Progress: ${completed} of ${total} chapters completed`}
    >
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cc-border">
        <div
          className="h-full rounded-full bg-cc-accent transition-[width] motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
      <span className="shrink-0 tabular-nums">
        {completed}/{total}
      </span>
    </div>
  );
}

// ── Chapter nav ───────────────────────────────────────────────────────────────

function ChapterNav({
  chapters,
  activeId,
  completedIds,
  onSelect,
}: {
  chapters: Chapter[];
  activeId: string;
  completedIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <nav aria-label="Chapters">
      <ol className="flex flex-col gap-1">
        {chapters.map((ch, i) => {
          const isActive = ch.id === activeId;
          const isDone = completedIds.has(ch.id);
          return (
            <li key={ch.id}>
              <button
                type="button"
                data-testid="chapter-nav-item"
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onSelect(ch.id)}
                className={[
                  'flex w-full items-center gap-2 rounded px-3 py-2 text-left font-mono text-sm transition-colors motion-reduce:transition-none',
                  isActive
                    ? 'border border-cc-accent bg-cc-panel text-cc-accent'
                    : 'border border-transparent text-cc-muted hover:border-cc-border hover:text-cc-fg',
                ].join(' ')}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs">
                  {isDone ? '✓' : String(i + 1)}
                </span>
                <span className="mr-1 text-base leading-none">{ch.icon}</span>
                <span className="truncate">{ch.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Chapter content ───────────────────────────────────────────────────────────

function ChapterContent({
  chapter,
  isComplete,
  isFirst,
  isLast,
  onComplete,
  onPrev,
  onNext,
}: {
  chapter: Chapter;
  isComplete: boolean;
  isFirst: boolean;
  isLast: boolean;
  onComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
}): JSX.Element {
  const { setMode } = useApp();

  const handleCta = useCallback(() => {
    setMode(chapter.cta.mode, chapter.cta.params ?? {});
  }, [chapter.cta, setMode]);

  return (
    <div data-testid="chapter-content" className="flex flex-col gap-5">
      {/* Blurb */}
      <p className="font-mono text-sm text-cc-muted">{chapter.blurb}</p>

      {/* Steps */}
      <ol className="flex flex-col gap-3">
        {chapter.steps.map((step, i) => (
          <li
            key={i}
            className="rounded-md border border-cc-border bg-cc-panel p-4 font-mono"
          >
            <p className="text-xs font-semibold text-cc-accent">
              {String(i + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-cc-fg">{step.heading}</h3>
            <p className="mt-1 text-sm text-cc-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      {/* Keys & commands */}
      {chapter.keys.length > 0 && (
        <div>
          <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-cc-muted">
            Keys &amp; commands
          </h4>
          <ul className="flex flex-col gap-2">
            {chapter.keys.map((k) => (
              <li key={k.label} className="flex items-center gap-3 font-mono text-sm">
                <span className="shrink-0 rounded border border-cc-accent px-2 py-0.5 text-xs text-cc-accent">
                  {k.label}
                </span>
                <span className="text-cc-muted">{k.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        data-testid="chapter-cta"
        onClick={handleCta}
        className="self-start rounded border border-cc-accent px-4 py-2 font-mono text-sm text-cc-accent transition-colors hover:bg-cc-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent motion-reduce:transition-none"
      >
        {chapter.cta.label}
      </button>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-3 border-t border-cc-border pt-4">
        <button
          type="button"
          data-testid="chapter-complete"
          onClick={onComplete}
          className={[
            'rounded border px-3 py-1.5 font-mono text-sm transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent',
            isComplete
              ? 'border-cc-accent text-cc-accent hover:bg-cc-accent hover:text-black'
              : 'border-cc-border text-cc-muted hover:border-cc-fg hover:text-cc-fg',
          ].join(' ')}
          aria-pressed={isComplete}
        >
          {isComplete ? '✓ Completed' : 'Mark complete'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={onPrev}
              className="rounded border border-cc-border px-3 py-1.5 font-mono text-sm text-cc-muted transition-colors hover:border-cc-fg hover:text-cc-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent motion-reduce:transition-none"
              aria-label="Previous chapter"
            >
              ← Prev
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={onNext}
              className="rounded border border-cc-border px-3 py-1.5 font-mono text-sm text-cc-muted transition-colors hover:border-cc-fg hover:text-cc-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent motion-reduce:transition-none"
              aria-label="Next chapter"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Start surface ─────────────────────────────────────────────────────────────

function firstUncompletedOrFirst(completedIds: ReadonlySet<string>): string {
  const uncompleted = TRACK.find((ch) => !completedIds.has(ch.id));
  return uncompleted?.id ?? TRACK[0].id;
}

export function Start(): JSX.Element {
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(() => {
    const saved = load<string[]>(STORAGE_KEY, []);
    return new Set(saved);
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = load<string[]>(STORAGE_KEY, []);
    const ids = new Set(saved);
    return firstUncompletedOrFirst(ids);
  });

  const completedCount = completedIds.size;
  const allDone = completedCount === TOTAL;

  const activeIndex = TRACK.findIndex((ch) => ch.id === activeId);
  const activeChapter = TRACK[activeIndex] ?? TRACK[0];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === TRACK.length - 1;

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleComplete = useCallback(() => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(activeChapter.id)) {
        next.delete(activeChapter.id);
      } else {
        next.add(activeChapter.id);
      }
      save(STORAGE_KEY, [...next]);
      return next;
    });
  }, [activeChapter.id]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) setActiveId(TRACK[activeIndex - 1].id);
  }, [activeIndex]);

  const handleNext = useCallback(() => {
    if (activeIndex < TRACK.length - 1) setActiveId(TRACK[activeIndex + 1].id);
  }, [activeIndex]);

  return (
    <div data-testid="start" className="h-full overflow-auto bg-cc-bg font-mono">
      {/* Intro */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 rounded-md border border-cc-border bg-cc-panel px-4 py-3">
          <p className="text-base font-semibold text-cc-fg">
            New to Claude Code? Start here.
          </p>
          <p className="mt-1 text-sm text-cc-muted">
            Work through the 5 chapters below to learn the essentials — or jump to any section.
          </p>
          <div className="mt-3">
            <ProgressBar completed={completedCount} total={TOTAL} />
          </div>
        </div>

        {allDone && (
          <div className="mb-4 rounded-md border border-cc-accent bg-cc-panel px-4 py-3 text-sm text-cc-accent">
            🎉 You've finished the tour — go build something.
          </div>
        )}

        {/* Two-pane layout */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Chapter nav — stacks above on mobile, left column on sm+ */}
          <div className="sm:w-52 sm:shrink-0">
            <ChapterNav
              chapters={TRACK}
              activeId={activeId}
              completedIds={completedIds}
              onSelect={handleSelect}
            />
          </div>

          {/* Chapter content */}
          <div className="min-w-0 flex-1">
            <ChapterContent
              key={activeChapter.id}
              chapter={activeChapter}
              isComplete={completedIds.has(activeChapter.id)}
              isFirst={isFirst}
              isLast={isLast}
              onComplete={handleComplete}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
