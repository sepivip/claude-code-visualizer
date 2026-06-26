// src/components/keyboard/shortcutIndex.test.ts
import { describe, it, expect } from 'vitest';
import type { ShortcutHit } from './shortcutIndex';
import { CATALOG } from '../../data/catalog';
import { buildShortcutIndex, SHORTCUT_INDEX } from './shortcutIndex';

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

  it('exports a prebuilt index over CATALOG', () => {
    const key = pickCtrlLetterKey(SHORTCUT_INDEX);
    expect((SHORTCUT_INDEX[key] ?? []).length).toBeGreaterThan(0);
  });
});
