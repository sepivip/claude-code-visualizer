// src/components/keyboard/shortcutIndex.ts
import type { CatalogItem, KeyChord } from '../../data/types';
import { CATALOG } from '../../data/catalog';
import { parseChords } from '../../lib/keys';

export type ShortcutHit = { item: CatalogItem; chord: KeyChord };

export function buildShortcutIndex(
  items: CatalogItem[],
): Record<string, ShortcutHit[]> {
  const index: Record<string, ShortcutHit[]> = {};
  for (const item of items) {
    if (item.category !== 'shortcut') continue;
    let chords = parseChords(item.name);
    if (chords.length === 0) chords = parseChords(item.syntax ?? '');
    for (const chord of chords) {
      const key = chord.key;
      if (!key) continue;
      (index[key] ??= []).push({ item, chord });
    }
  }
  return index;
}

export const SHORTCUT_INDEX: Record<string, ShortcutHit[]> =
  buildShortcutIndex(CATALOG);
