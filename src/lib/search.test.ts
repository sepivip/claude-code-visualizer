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

describe('searchCatalog', () => {
  it('returns all items in input order with score 0 for empty query', () => {
    const res = searchCatalog(fixture, '   ');
    expect(res.map((r) => r.item.id)).toEqual(['clear', 'compact', 'plan-mode', 'clearview']);
    expect(res.every((r) => r.score === 0)).toBe(true);
  });

  it('ranks the /clear command first when searching "/clear"', () => {
    const res = searchCatalog(fixture, '/clear');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].item.id).toBe('clear');
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
    const res = searchCatalog(fixture, 'clear');
    const clearIdx = res.findIndex((r) => r.item.id === 'clear');
    const viewIdx = res.findIndex((r) => r.item.id === 'clearview');
    expect(clearIdx).toBeGreaterThanOrEqual(0);
    expect(viewIdx).toBeGreaterThanOrEqual(0);
    // '/clear' sorts before 'Clearview setting' when scores tie
    if (res[clearIdx].score === res[viewIdx].score) {
      expect(clearIdx).toBeLessThan(viewIdx);
    }
  });
});
