// src/components/quiz/generator.ts
import type { CatalogItem, Category } from '../../data/types';
import { parseChords } from '../../lib/keys';
import type { Question, ChoiceQuestion, ShortcutQuestion, Rng } from './quizTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Pick a random integer in [0, n) using the provided rng. */
function randInt(n: number, rng: Rng): number {
  return Math.floor(rng() * n);
}

/** In-place Fisher-Yates shuffle. Returns the array. */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick `n` distractor items from `pool` that are NOT `correct`.
 * Prefers same-category items for plausibility; falls back to any category.
 */
export function pickDistractors(
  correct: CatalogItem,
  pool: CatalogItem[],
  n: number,
  rng: Rng,
): CatalogItem[] {
  const others = pool.filter((i) => i.id !== correct.id);
  const sameCategory = others.filter((i) => i.category === correct.category);
  const rest = others.filter((i) => i.category !== correct.category);

  const candidates = [...shuffle([...sameCategory], rng), ...shuffle([...rest], rng)];
  return candidates.slice(0, n);
}

/**
 * Build a valid question pool: items with non-empty name and summary.
 * If category is not 'all', filter to that category.
 */
function buildPool(catalog: CatalogItem[], category: Category | 'all'): CatalogItem[] {
  return catalog.filter(
    (item) =>
      item.name.trim() !== '' &&
      item.summary.trim() !== '' &&
      (category === 'all' || item.category === category),
  );
}

/**
 * Eligible for a type-shortcut question: category 'shortcut' AND
 * parseChords(item.name) yields exactly one chord (skips multi-stroke sequences).
 */
function isShortcutEligible(item: CatalogItem): boolean {
  if (item.category !== 'shortcut') return false;
  return parseChords(item.name).length === 1;
}

/** Build a ChoiceQuestion (name-to-summary or summary-to-name) for `item`. */
function buildChoiceQuestion(item: CatalogItem, pool: CatalogItem[], rng: Rng): ChoiceQuestion {
  const kind: 'name-to-summary' | 'summary-to-name' =
    rng() < 0.5 ? 'name-to-summary' : 'summary-to-name';

  const distractors = pickDistractors(item, pool, pool.length, rng);

  const correctOption = kind === 'name-to-summary' ? item.summary : item.name;
  const prompt =
    kind === 'name-to-summary'
      ? `What does \`${item.name}\` do?`
      : `Which one: "${item.summary}"?`;

  // Collect up to 3 distinct distractor strings (the string field depends on kind).
  const seen = new Set<string>([correctOption]);
  const distractorOptions: string[] = [];
  for (const d of distractors) {
    const opt = kind === 'name-to-summary' ? d.summary : d.name;
    if (!seen.has(opt)) {
      seen.add(opt);
      distractorOptions.push(opt);
    }
    if (distractorOptions.length === 3) break;
  }

  const options = [correctOption, ...distractorOptions];
  shuffle(options, rng);
  const answerIndex = options.indexOf(correctOption);

  return {
    id: `${item.id}-${kind}`,
    kind,
    item,
    prompt,
    options,
    answerIndex,
  };
}

/** Build a ShortcutQuestion for `item` (must be shortcut-eligible). */
function buildShortcutQuestion(item: CatalogItem): ShortcutQuestion {
  // Guaranteed by isShortcutEligible: parseChords(item.name) has exactly one chord.
  const chord = parseChords(item.name)[0];
  return {
    id: `${item.id}-type-shortcut`,
    kind: 'type-shortcut',
    item,
    prompt: `Press the shortcut for: "${item.summary}"`,
    chord,
  };
}

/**
 * Generate `count` quiz questions from `catalog`.
 *
 * Pure and deterministic when `rng` is provided.
 *
 * @param catalog - Full catalog to draw from.
 * @param opts.count - Number of questions (default 10).
 * @param opts.category - Filter to a specific category or 'all' (default 'all').
 * @param opts.rng - Injectable RNG for deterministic tests (default Math.random).
 */
export function generateQuestions(
  catalog: CatalogItem[],
  opts?: { count?: number; category?: Category | 'all'; rng?: Rng },
): Question[] {
  const count = opts?.count ?? 10;
  const category = opts?.category ?? 'all';
  const rng = opts?.rng ?? Math.random;

  const pool = buildPool(catalog, category);
  if (pool.length === 0) return [];

  // Pick items without repeats by shuffling the pool and slicing.
  const selected = shuffle([...pool], rng).slice(0, Math.min(count, pool.length));

  // Roughly half of shortcut-eligible items become type-shortcut questions.
  const eligible = selected.filter(isShortcutEligible);
  const shortcutCount = Math.round(eligible.length * 0.5);
  const asShortcut = new Set(
    shuffle([...eligible], rng)
      .slice(0, shortcutCount)
      .map((i) => i.id),
  );

  return selected.map((item): Question =>
    asShortcut.has(item.id) ? buildShortcutQuestion(item) : buildChoiceQuestion(item, pool, rng),
  );
}
