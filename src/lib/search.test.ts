// src/lib/search.test.ts
import { describe, it, expect } from 'vitest';
import { searchCatalog } from './search';
import type { CatalogItem } from '../data/types';

const fixture: CatalogItem[] = [
  {
    id: 'clear',
    name: '/clear',
    category: 'slash-command',
    domain: 'slash',
    syntax: '/clear',
    summary: 'Clear the conversation history and free up context',
    confidence: 'verified',
  },
  {
    id: 'compact',
    name: '/compact',
    category: 'slash-command',
    domain: 'slash',
    syntax: '/compact',
    summary: 'Summarize and clear earlier turns to save tokens',
    confidence: 'verified',
  },
  {
    id: 'plan-mode',
    name: 'Plan mode',
    category: 'permission-mode',
    domain: 'permissions',
    syntax: 'shift+tab',
    summary: 'Enter plan mode to draft before editing',
    confidence: 'verified',
  },
  {
    id: 'clearview',
    name: 'Clearview setting',
    category: 'setting',
    domain: 'settings',
    summary: 'Toggle a compact rendering option',
    confidence: 'advanced',
  },
];

/**
 * Tie-break fixture: two items engineered to produce IDENTICAL scores for the
 * query "xyztoken".
 *
 * Scoring (from search.ts):
 *   - name weight=5, summary weight=2, domain weight=1, syntax weight=3
 *   - startsWith bonus = +0.5
 *   - tokenScore = best matching field score
 *
 * For query token "xyztoken":
 *   - Both items have domain="cli" which contains "xyztoken"? No — we put the
 *     token only in the summary of each item at a non-leading position so the
 *     summary score is weight=2 (no startsWith bonus).
 *   - Neither name, syntax, nor domain contains "xyztoken".
 *   - Therefore both items score exactly 2 for token "xyztoken".
 *   - Tiebreak resolves by name ascending: "Alpha feature" < "Beta feature".
 */
const tieFixture: CatalogItem[] = [
  {
    id: 'tie-beta',
    name: 'Beta feature',
    category: 'feature',
    domain: 'cli',
    summary: 'A tool that uses xyztoken internally',
    confidence: 'verified',
  },
  {
    id: 'tie-alpha',
    name: 'Alpha feature',
    category: 'feature',
    domain: 'cli',
    summary: 'Another tool that uses xyztoken internally',
    confidence: 'verified',
  },
];

describe('searchCatalog', () => {
  it('returns all items in input order with score 0 for empty query', () => {
    const res = searchCatalog(fixture, '   ');
    expect(res.map((r) => r.item.id)).toEqual(['clear', 'compact', 'plan-mode', 'clearview']);
    expect(res.every((r) => r.score === 0)).toBe(true);
  });

  it('ranks the /clear command first when searching "/clear"', () => {
    const res = searchCatalog(fixture, '/clear');
    // Only '/clear' matches the token "/clear"; full ranked order must be exact.
    expect(res.map((r) => r.item.id)).toEqual(['clear']);
  });

  it('matches an item via its summary when searching "compact"', () => {
    const res = searchCatalog(fixture, 'compact');
    const ids = res.map((r) => r.item.id);
    expect(ids).toContain('compact');
    expect(ids).toContain('clearview');
  });

  it('requires all tokens for multi-token query "plan mode"', () => {
    const res = searchCatalog(fixture, 'plan mode');
    expect(res.map((r) => r.item.id)).toEqual(['plan-mode']);
  });

  it('returns [] when no item matches', () => {
    expect(searchCatalog(fixture, 'zzzznope')).toEqual([]);
  });

  it('breaks score ties by name ascending', () => {
    // tieFixture is engineered so both items score exactly 2 for "xyztoken":
    // the token appears mid-summary (weight=2, no startsWith bonus) in both
    // items, and no other field matches. Scores are provably equal, so the
    // tiebreak (localeCompare on name) MUST be the deciding factor.
    const res = searchCatalog(tieFixture, 'xyztoken');
    expect(res).toHaveLength(2);
    expect(res[0].score).toBe(2);
    expect(res[1].score).toBe(2);
    // "Alpha feature" < "Beta feature" → tie-alpha must come first.
    expect(res.map((r) => r.item.id)).toEqual(['tie-alpha', 'tie-beta']);
  });
});
