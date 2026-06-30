// src/components/quiz/Quiz.tsx
import { useCallback, useMemo, useState } from 'react';
import { CATALOG } from '../../data/catalog';
import type { Category } from '../../data/types';
import { useApp } from '../shell/AppContext';
import { load, save } from '../../lib/storage';
import { generateQuestions } from './generator';
import { QuestionView } from './QuestionView';
import type { Question, AnswerState, Rng } from './quizTypes';

const QUESTION_COUNT = 10;

/** localStorage key for the best score of a given category. */
function scoreKey(cat: Category | 'all'): string {
  return `quiz-best:${cat}`;
}

/** Categories with at least 8 valid items in the catalog (plus 'all'). */
function useCategoryOptions(): Array<Category | 'all'> {
  return useMemo(() => {
    const counts = new Map<Category, number>();
    for (const item of CATALOG) {
      if (item.name.trim() !== '' && item.summary.trim() !== '') {
        counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
      }
    }
    const cats = [...counts.entries()]
      .filter(([, n]) => n >= 8)
      .map(([cat]) => cat);
    return ['all', ...cats];
  }, []);
}

// ── Scorebar ─────────────────────────────────────────────────────────────────

function ScoreBar({
  score,
  streak,
  index,
  total,
}: {
  score: number;
  streak: number;
  index: number;
  total: number;
}): JSX.Element {
  return (
    <div
      data-testid="quiz-score"
      className="flex items-center gap-4 rounded border border-cc-border bg-cc-panel px-4 py-2 font-mono text-sm text-cc-muted"
    >
      <span>
        Score: <span className="font-semibold text-cc-fg">{score}</span>
      </span>
      <span>
        Streak: <span className="font-semibold text-cc-accent">{streak}</span>
      </span>
      <span className="ml-auto">
        {index + 1} / {total}
      </span>
    </div>
  );
}

// ── Start screen ─────────────────────────────────────────────────────────────

function StartScreen({
  onStart,
  category,
  onCategoryChange,
  categoryOptions,
  bestScore,
}: {
  onStart: () => void;
  category: Category | 'all';
  onCategoryChange: (c: Category | 'all') => void;
  categoryOptions: Array<Category | 'all'>;
  bestScore: number | null;
}): JSX.Element {
  return (
    <div data-testid="quiz-start-screen" className="mx-auto max-w-lg space-y-6 px-4 py-8 font-mono">
      <div className="relative rounded-md border border-cc-border bg-cc-panel px-4 py-3">
        <div className="absolute -top-2.5 left-3 bg-cc-panel px-2 text-xs text-cc-accent">Quiz</div>
        <h2 className="text-base font-semibold text-cc-fg">Claude Code Quiz</h2>
        <p className="mt-1 text-sm text-cc-muted">
          Test your knowledge of shortcuts, slash commands, settings, and more. {QUESTION_COUNT}{' '}
          questions — see how many you can get right!
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="quiz-category" className="block text-sm text-cc-muted">
          Category
        </label>
        <select
          id="quiz-category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
          className="w-full rounded border border-cc-border bg-cc-panel px-3 py-2 font-mono text-sm text-cc-fg focus:border-cc-accent focus:outline-none"
        >
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {bestScore !== null && (
        <p className="text-sm text-cc-muted">
          Best score for this category:{' '}
          <span className="text-cc-accent">
            {bestScore} / {QUESTION_COUNT}
          </span>
        </p>
      )}

      <button
        type="button"
        data-testid="quiz-start"
        onClick={onStart}
        className="w-full rounded border border-cc-accent px-4 py-3 font-mono text-base font-semibold text-cc-accent transition-colors hover:bg-cc-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent"
      >
        Start quiz →
      </button>
    </div>
  );
}

// ── Results screen ───────────────────────────────────────────────────────────

function encouragementFor(pct: number): string {
  if (pct >= 90) return 'Outstanding! You know Claude Code inside-out.';
  if (pct >= 70) return "Great work! A few more sessions and you'll master it.";
  if (pct >= 50) return 'Good effort! Keep practising to build fluency.';
  return 'Keep going — every session teaches you something new.';
}

function ResultsScreen({
  score,
  total,
  bestStreak,
  onRestart,
  onBrowse,
}: {
  score: number;
  total: number;
  bestStreak: number;
  onRestart: () => void;
  onBrowse: () => void;
}): JSX.Element {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div data-testid="quiz-results" className="mx-auto max-w-lg space-y-6 px-4 py-8 font-mono">
      <div className="relative rounded-md border border-cc-border bg-cc-panel px-4 py-5">
        <div className="absolute -top-2.5 left-3 bg-cc-panel px-2 text-xs text-cc-accent">
          Results
        </div>
        <p className="text-3xl font-bold text-cc-fg">
          {score}
          <span className="text-lg font-normal text-cc-muted"> / {total}</span>
        </p>
        <p className="mt-1 text-sm text-cc-muted">
          Best streak: <span className="text-cc-accent">{bestStreak}</span>
        </p>
        <p className="mt-3 text-sm text-cc-fg">{encouragementFor(pct)}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="quiz-restart"
          onClick={onRestart}
          className="flex-1 rounded border border-cc-accent px-4 py-2.5 font-mono text-sm text-cc-accent transition-colors hover:bg-cc-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent"
        >
          Play again →
        </button>
        <button
          type="button"
          onClick={onBrowse}
          className="flex-1 rounded border border-cc-border px-4 py-2.5 font-mono text-sm text-cc-muted transition-colors hover:border-cc-fg hover:text-cc-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cc-accent"
        >
          Browse cheatsheet
        </button>
      </div>
    </div>
  );
}

// ── Quiz surface ─────────────────────────────────────────────────────────────

type QuizPhase = 'idle' | 'playing' | 'done';

interface PlayingState {
  questions: Question[];
  index: number;
  score: number;
  streak: number;
  bestStreak: number;
  answered: AnswerState | null;
}

interface FinalState {
  score: number;
  total: number;
  bestStreak: number;
}

export function Quiz({ rng }: { rng?: Rng }): JSX.Element {
  const { platform, setMode } = useApp();
  const categoryOptions = useCategoryOptions();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [playing, setPlaying] = useState<PlayingState | null>(null);
  const [final, setFinal] = useState<FinalState | null>(null);

  const bestScore = load<number | null>(scoreKey(category), null);

  const handleStart = useCallback(() => {
    const questions = generateQuestions(CATALOG, {
      count: QUESTION_COUNT,
      category,
      rng: rng ?? Math.random,
    });
    setPlaying({ questions, index: 0, score: 0, streak: 0, bestStreak: 0, answered: null });
    setPhase('playing');
  }, [category, rng]);

  const handleAnswer = useCallback((correct: boolean, given: string) => {
    setPlaying((prev) => {
      if (prev === null) return prev;
      const score = correct ? prev.score + 1 : prev.score;
      const streak = correct ? prev.streak + 1 : 0;
      const bestStreak = Math.max(prev.bestStreak, streak);
      return { ...prev, score, streak, bestStreak, answered: { correct, given } };
    });
  }, []);

  const handleNext = useCallback(() => {
    setPlaying((prev) => {
      if (prev === null) return prev;
      const nextIndex = prev.index + 1;
      if (nextIndex >= prev.questions.length) {
        const best = load<number | null>(scoreKey(category), null);
        if (best === null || prev.score > best) {
          save(scoreKey(category), prev.score);
        }
        setFinal({ score: prev.score, total: prev.questions.length, bestStreak: prev.bestStreak });
        setPhase('done');
        return prev;
      }
      return { ...prev, index: nextIndex, answered: null };
    });
  }, [category]);

  const handleRestart = useCallback(() => {
    setPhase('idle');
    setPlaying(null);
    setFinal(null);
  }, []);

  const handleBrowse = useCallback(() => {
    setMode('cheatsheet');
  }, [setMode]);

  return (
    <div data-testid="quiz" className="h-full overflow-auto bg-cc-bg">
      {phase === 'idle' && (
        <StartScreen
          onStart={handleStart}
          category={category}
          onCategoryChange={setCategory}
          categoryOptions={categoryOptions}
          bestScore={bestScore}
        />
      )}

      {phase === 'playing' && playing !== null && (
        <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
          <ScoreBar
            score={playing.score}
            streak={playing.streak}
            index={playing.index}
            total={playing.questions.length}
          />
          <QuestionView
            key={playing.questions[playing.index].id}
            question={playing.questions[playing.index]}
            answered={playing.answered}
            onAnswer={handleAnswer}
            onNext={handleNext}
            platform={platform}
          />
        </div>
      )}

      {phase === 'done' && final !== null && (
        <ResultsScreen
          score={final.score}
          total={final.total}
          bestStreak={final.bestStreak}
          onRestart={handleRestart}
          onBrowse={handleBrowse}
        />
      )}
    </div>
  );
}
