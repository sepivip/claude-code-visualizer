// src/components/quiz/generator.test.ts
import { describe, it, expect } from 'vitest';
import type { CatalogItem } from '../../data/types';
import { generateQuestions, pickDistractors } from './generator';
import type { ChoiceQuestion, ShortcutQuestion, Rng } from './quizTypes';

// ── Fixture catalog ──────────────────────────────────────────────────────────
// 12 shortcut items (Ctrl+A … Ctrl+L): single-chord, eligible for type-shortcut
// 10 slash-command items: eligible only for choice questions
// 2 shortcut items with multi-stroke name: should NOT become type-shortcut

const makeShortcut = (letter: string): CatalogItem => ({
  id: `ctrl-${letter}`,
  name: `Ctrl+${letter.toUpperCase()}`,
  category: 'shortcut',
  domain: 'interactive',
  summary: `Summary for Ctrl+${letter.toUpperCase()}`,
  confidence: 'verified',
});

const makeSlash = (cmd: string): CatalogItem => ({
  id: `slash-${cmd}`,
  name: `/${cmd}`,
  category: 'slash-command',
  domain: 'slash',
  summary: `Summary for /${cmd}`,
  confidence: 'verified',
});

const makeMultiStroke = (i: number): CatalogItem => ({
  id: `multi-${i}`,
  name: `Ctrl+X Ctrl+${String.fromCharCode(65 + i)}`,
  category: 'shortcut',
  domain: 'interactive',
  summary: `Multi-stroke summary ${i}`,
  confidence: 'verified',
});

const FIXTURE: CatalogItem[] = [
  ...['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map(makeShortcut),
  ...['help', 'clear', 'status', 'config', 'cost', 'memory', 'doctor', 'init', 'login', 'logout'].map(
    makeSlash,
  ),
  makeMultiStroke(0),
  makeMultiStroke(1),
];

// Deterministic seeded RNG (simple LCG)
function makeSeed(seed: number): Rng {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

describe('generateQuestions', () => {
  it('returns exactly count questions (default 10)', () => {
    const qs = generateQuestions(FIXTURE, { rng: makeSeed(42) });
    expect(qs).toHaveLength(10);
  });

  it('honours explicit count', () => {
    const qs = generateQuestions(FIXTURE, { count: 5, rng: makeSeed(1) });
    expect(qs).toHaveLength(5);
  });

  it('no item repeats within a session', () => {
    const qs = generateQuestions(FIXTURE, { rng: makeSeed(99) });
    const ids = qs.map((q) => q.item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('choice questions have exactly 4 distinct options with correct answerIndex', () => {
    const qs = generateQuestions(FIXTURE, { rng: makeSeed(7) });
    for (const q of qs) {
      if (q.kind === 'name-to-summary' || q.kind === 'summary-to-name') {
        const cq: ChoiceQuestion = q;
        expect(cq.options).toHaveLength(4);
        expect(new Set(cq.options).size).toBe(4);
        expect(cq.answerIndex).toBeGreaterThanOrEqual(0);
        expect(cq.answerIndex).toBeLessThan(4);
      }
    }
  });

  it('name-to-summary options are summaries; summary-to-name options are names', () => {
    const qs = generateQuestions(FIXTURE, { count: FIXTURE.length, rng: makeSeed(13) });
    for (const q of qs) {
      if (q.kind === 'name-to-summary') {
        const cq: ChoiceQuestion = q;
        expect(cq.prompt).toContain(q.item.name);
        expect(cq.options[cq.answerIndex]).toBe(q.item.summary);
      }
      if (q.kind === 'summary-to-name') {
        const cq: ChoiceQuestion = q;
        expect(cq.prompt).toContain(q.item.summary);
        expect(cq.options[cq.answerIndex]).toBe(q.item.name);
      }
    }
  });

  it('type-shortcut questions only come from single-chord shortcut items', () => {
    const qs = generateQuestions(FIXTURE, { count: FIXTURE.length, rng: makeSeed(55) });
    for (const q of qs) {
      if (q.kind === 'type-shortcut') {
        const sq: ShortcutQuestion = q;
        expect(sq.item.category).toBe('shortcut');
        expect(sq.chord.key).toBeTruthy();
        expect(sq.item.name).not.toMatch(/Ctrl\+[A-Z] Ctrl\+/);
      }
    }
  });

  it('respects category filter — only returns items from that category', () => {
    const qs = generateQuestions(FIXTURE, { count: 5, category: 'shortcut', rng: makeSeed(3) });
    for (const q of qs) {
      expect(q.item.category).toBe('shortcut');
    }
  });

  it('category "all" uses all items', () => {
    let sawSlash = false;
    for (let seed = 0; seed < 20; seed++) {
      const qs = generateQuestions(FIXTURE, { count: 10, category: 'all', rng: makeSeed(seed) });
      if (qs.some((q) => q.item.category === 'slash-command')) {
        sawSlash = true;
        break;
      }
    }
    expect(sawSlash).toBe(true);
  });

  it('returns fewer questions when pool is smaller than count', () => {
    const smallCatalog = FIXTURE.slice(0, 3);
    const qs = generateQuestions(smallCatalog, { count: 10, rng: makeSeed(1) });
    expect(qs.length).toBeLessThanOrEqual(3);
  });

  it('is deterministic when rng is provided (same seed → same questions)', () => {
    const a = generateQuestions(FIXTURE, { rng: makeSeed(123) });
    const b = generateQuestions(FIXTURE, { rng: makeSeed(123) });
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });
});

describe('pickDistractors', () => {
  it('returns 3 items from pool that are not the correct item', () => {
    const correct = FIXTURE[0];
    const distractors = pickDistractors(correct, FIXTURE, 3, makeSeed(1));
    expect(distractors).toHaveLength(3);
    expect(distractors.every((d) => d.id !== correct.id)).toBe(true);
  });

  it('prefers same-category distractors', () => {
    const shortcutPool = FIXTURE.filter((i) => i.category === 'shortcut');
    const correct = shortcutPool[0];
    const distractors = pickDistractors(correct, shortcutPool, 3, makeSeed(2));
    expect(distractors.every((d) => d.category === 'shortcut')).toBe(true);
  });
});
