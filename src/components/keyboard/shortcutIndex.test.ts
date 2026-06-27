// src/components/keyboard/shortcutIndex.test.ts
import { describe, it, expect } from 'vitest';
import type { ShortcutHit } from './shortcutIndex';
import type { CatalogItem } from '../../data/types';
import { CATALOG } from '../../data/catalog';
import {
  buildShortcutIndex,
  SHORTCUT_INDEX,
  ALL_HITS,
  MODS_USED,
  hitsForModifier,
  hitsForKeyCode,
} from './shortcutIndex';

// Robust picker: find a real single-letter key that has a Ctrl-modified chord
// in the index built from the REAL generated CATALOG. Falls back to 'r'.
function pickCtrlLetterKey(index: Record<string, ShortcutHit[]>): string {
  for (const [key, hits] of Object.entries(index)) {
    if (!/^[a-z]$/.test(key)) continue;
    if (hits.some((h) => h.chord.mods.includes('ctrl') && h.chord.key === key)) {
      return key;
    }
  }
  return 'r';
}

describe('buildShortcutIndex', () => {
  it('indexes at least one Ctrl+<letter> shortcut from the real catalog', () => {
    const index = buildShortcutIndex(CATALOG);
    const key = pickCtrlLetterKey(index);
    const hits = index[key] ?? [];
    const ctrlHit = hits.find(
      (h) => h.chord.mods.includes('ctrl') && h.chord.key === key,
    );
    expect(ctrlHit).toBeDefined();
    expect(ctrlHit?.item.category).toBe('shortcut');
  });

  it('indexes Ctrl+R under main key r (documented content expectation)', () => {
    const index = buildShortcutIndex(CATALOG);
    const hits = index['r'] ?? [];
    const ctrlR = hits.find(
      (h) => h.chord.mods.includes('ctrl') && h.chord.key === 'r',
    );
    expect(ctrlR).toBeDefined();
    expect(ctrlR?.item.category).toBe('shortcut');
  });

  it('only indexes shortcut-category items', () => {
    const index = buildShortcutIndex(CATALOG);
    Object.values(index)
      .flat()
      .forEach((h) => expect(h.item.category).toBe('shortcut'));
  });

  it('does not index a multi-stroke sequence under a single key', () => {
    // "Ctrl+G / Ctrl+X Ctrl+E" (open external editor): only Ctrl+G is a single
    // key chord. The two-stroke "Ctrl+X Ctrl+E" must NOT surface under e or x.
    const item: CatalogItem = {
      id: 'ext-editor',
      name: 'Ctrl+G / Ctrl+X Ctrl+E',
      category: 'shortcut',
      domain: 'interactive',
      summary: 'Open prompt in external text editor',
      confidence: 'verified',
    };
    const index = buildShortcutIndex([item]);
    expect((index['g'] ?? []).some((h) => h.item.id === 'ext-editor')).toBe(true);
    expect((index['e'] ?? []).some((h) => h.item.id === 'ext-editor')).toBe(false);
    expect((index['x'] ?? []).some((h) => h.item.id === 'ext-editor')).toBe(false);
  });

  it('exports a prebuilt index over CATALOG', () => {
    const key = pickCtrlLetterKey(SHORTCUT_INDEX);
    expect((SHORTCUT_INDEX[key] ?? []).length).toBeGreaterThan(0);
  });
});

describe('ALL_HITS', () => {
  it('is non-empty', () => {
    expect(ALL_HITS.length).toBeGreaterThan(0);
  });

  it('every hit has category shortcut', () => {
    ALL_HITS.forEach((h) => expect(h.item.category).toBe('shortcut'));
  });
});

describe('MODS_USED', () => {
  it('includes ctrl', () => {
    expect(MODS_USED.has('ctrl')).toBe(true);
  });

  it('is a Set of Modifier values', () => {
    const validMods = new Set(['ctrl', 'meta', 'shift', 'alt']);
    MODS_USED.forEach((m) => {
      expect(validMods.has(m)).toBe(true);
    });
  });
});

describe('hitsForModifier', () => {
  it('returns non-empty array for ctrl', () => {
    const hits = hitsForModifier('ctrl');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('every returned chord includes ctrl in mods', () => {
    const hits = hitsForModifier('ctrl');
    hits.forEach((h) => {
      expect(h.chord.mods).toContain('ctrl');
    });
  });
});

describe('hitsForKeyCode', () => {
  it('returns same as SHORTCUT_INDEX[code] for a known key', () => {
    const key = pickCtrlLetterKey(SHORTCUT_INDEX);
    expect(hitsForKeyCode(key)).toEqual(SHORTCUT_INDEX[key] ?? []);
  });

  it('returns empty array for unknown code', () => {
    expect(hitsForKeyCode('__nonexistent__')).toEqual([]);
  });
});
