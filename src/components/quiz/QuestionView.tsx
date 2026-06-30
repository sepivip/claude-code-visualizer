// src/components/quiz/QuestionView.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Platform, KeyChord } from '../../data/types';
import { chordFromEvent, chordEquals, displayChord } from '../../lib/keys';
import type { Question, AnswerState } from './quizTypes';

export interface QuestionViewProps {
  question: Question;
  answered: AnswerState | null;
  onAnswer: (correct: boolean, given: string) => void;
  onNext: () => void;
  platform: Platform;
}

// ── Choice question sub-view ─────────────────────────────────────────────────

function ChoiceView({
  question,
  answered,
  onAnswer,
}: {
  question: Extract<Question, { kind: 'name-to-summary' | 'summary-to-name' }>;
  answered: AnswerState | null;
  onAnswer: (correct: boolean, given: string) => void;
}): JSX.Element {
  const handleOption = useCallback(
    (option: string, idx: number) => {
      if (answered !== null) return;
      onAnswer(idx === question.answerIndex, option);
    },
    [answered, onAnswer, question.answerIndex],
  );

  // Number keys 1–4 select options (ignored while typing in an input/textarea).
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (answered !== null) return;
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= 4 && question.options[n - 1] !== undefined) {
        handleOption(question.options[n - 1], n - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answered, handleOption, question.options]);

  return (
    <div className="mt-4 grid gap-2">
      {question.options.map((option, idx) => {
        let borderClass = 'border-cc-border hover:border-cc-accent';
        let textClass = 'text-cc-fg';

        if (answered !== null) {
          if (idx === question.answerIndex) {
            borderClass = 'border-cc-green';
            textClass = 'text-cc-green';
          } else if (option === answered.given && !answered.correct) {
            borderClass = 'border-cc-error';
            textClass = 'text-cc-error';
          } else {
            borderClass = 'border-cc-border opacity-40';
          }
        }

        return (
          <button
            key={idx}
            type="button"
            data-testid="quiz-option"
            disabled={answered !== null}
            onClick={() => handleOption(option, idx)}
            className={`w-full rounded border ${borderClass} bg-cc-panel px-4 py-2.5 text-left font-mono text-sm ${textClass} transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent disabled:cursor-default`}
          >
            <span className="mr-3 text-cc-muted">{idx + 1}.</span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ── Shortcut-capture sub-view ────────────────────────────────────────────────

function ShortcutView({
  question,
  answered,
  onAnswer,
  platform,
}: {
  question: Extract<Question, { kind: 'type-shortcut' }>;
  answered: AnswerState | null;
  onAnswer: (correct: boolean, given: string) => void;
  platform: Platform;
}): JSX.Element {
  const [captured, setCaptured] = useState('');
  const [capturedChord, setCapturedChord] = useState<KeyChord | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCaptured('');
    setCapturedChord(null);
    captureRef.current?.focus();
  }, [question.id]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (answered !== null) return;
      // Ignore pure modifier keypresses — wait for a real key.
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
      e.preventDefault();
      const chord = chordFromEvent(e.nativeEvent);
      setCaptured(displayChord(chord, platform));
      setCapturedChord(chord);
    },
    [answered, platform],
  );

  const handleSubmit = useCallback(() => {
    if (answered !== null || capturedChord === null) return;
    onAnswer(chordEquals(capturedChord, question.chord), captured);
  }, [answered, capturedChord, question.chord, captured, onAnswer]);

  const correctLabel = displayChord(question.chord, platform);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div
        ref={captureRef}
        data-testid="quiz-shortcut-capture"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="textbox"
        aria-label="Press the shortcut key combination"
        aria-readonly="true"
        className="flex min-h-[3rem] cursor-text items-center rounded border border-cc-border bg-cc-panel px-4 py-3 font-mono text-sm focus:border-cc-accent focus:outline-none focus:ring-1 focus:ring-cc-accent"
      >
        {captured !== '' ? (
          <span className="text-cc-accent">{captured}</span>
        ) : (
          <span className="text-cc-muted">Click here and press the shortcut…</span>
        )}
      </div>

      {answered === null && (
        <button
          type="button"
          disabled={captured === ''}
          onClick={handleSubmit}
          className="self-start rounded border border-cc-accent px-4 py-2 font-mono text-sm text-cc-accent transition-colors hover:bg-cc-accent hover:text-black disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent"
        >
          Submit
        </button>
      )}

      {answered !== null && (
        <p className="font-mono text-sm text-cc-muted">
          Correct shortcut:{' '}
          <span className="rounded border border-cc-green px-1.5 py-0.5 text-cc-green">
            {correctLabel}
          </span>
        </p>
      )}
    </div>
  );
}

// ── Main QuestionView ────────────────────────────────────────────────────────

export function QuestionView({
  question,
  answered,
  onAnswer,
  onNext,
  platform,
}: QuestionViewProps): JSX.Element {
  return (
    <div className="font-mono">
      <div className="relative rounded-md border border-cc-border bg-cc-panel px-4 py-3">
        <div className="absolute -top-2.5 left-3 bg-cc-panel px-2 text-xs text-cc-accent">
          Question
        </div>
        <p className="text-sm text-cc-fg">{question.prompt}</p>
      </div>

      {(question.kind === 'name-to-summary' || question.kind === 'summary-to-name') && (
        <ChoiceView question={question} answered={answered} onAnswer={onAnswer} />
      )}

      {question.kind === 'type-shortcut' && (
        <ShortcutView
          question={question}
          answered={answered}
          onAnswer={onAnswer}
          platform={platform}
        />
      )}

      {answered !== null && (
        <div className="mt-4 space-y-3">
          <p
            className={`font-mono text-sm font-semibold ${
              answered.correct ? 'text-cc-green' : 'text-cc-error'
            }`}
          >
            {answered.correct ? '✓ Correct' : '✗ Incorrect'}
          </p>

          <div className="rounded border border-cc-border bg-cc-panel px-4 py-3 font-mono text-sm">
            <p className="text-cc-fg">{question.item.summary}</p>
            {question.item.example !== undefined && (
              <p className="mt-2 text-cc-muted">
                <span className="text-cc-accent">Example:</span> {question.item.example}
              </p>
            )}
          </div>

          <button
            type="button"
            data-testid="quiz-next"
            onClick={onNext}
            className="rounded border border-cc-accent px-4 py-2 font-mono text-sm text-cc-accent transition-colors hover:bg-cc-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
