// src/components/keyboard/shortcutIndex.ts
import type { CatalogItem, KeyChord, Modifier } from '../../data/types';
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

/** Every hit across the entire index, flat. */
export const ALL_HITS: ShortcutHit[] = Object.values(SHORTCUT_INDEX).flat();

/** Union of all modifier keys used across every chord. */
export const MODS_USED: Set<Modifier> = new Set(
  ALL_HITS.flatMap((h) => h.chord.mods),
);

/** Hits whose chord includes the given modifier. */
export function hitsForModifier(mod: Modifier): ShortcutHit[] {
  return ALL_HITS.filter((h) => h.chord.mods.includes(mod));
}

/** Hits indexed under a given key code (same as SHORTCUT_INDEX[code] ?? []). */
export function hitsForKeyCode(code: string): ShortcutHit[] {
  return SHORTCUT_INDEX[code] ?? [];
}
