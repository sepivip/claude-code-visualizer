// src/lib/keys.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseChord,
  parseChords,
  chordFromEvent,
  chordEquals,
  displayChord,
} from './keys';
import type { KeyChord } from '../data/types';

describe('parseChord', () => {
  it('parses Ctrl+R', () => {
    expect(parseChord('Ctrl+R')).toEqual({ mods: ['ctrl'], key: 'r', raw: 'Ctrl+R' });
  });

  it('parses Cmd+V to meta', () => {
    expect(parseChord('Cmd+V')).toEqual({ mods: ['meta'], key: 'v', raw: 'Cmd+V' });
  });

  it('parses ⌘+K symbol to meta', () => {
    expect(parseChord('⌘+K')).toEqual({ mods: ['meta'], key: 'k', raw: '⌘+K' });
  });

  it('sorts mods ctrl,meta,shift,alt regardless of input order', () => {
    expect(parseChord('Shift+Ctrl+P')).toEqual({
      mods: ['ctrl', 'shift'],
      key: 'p',
      raw: 'Shift+Ctrl+P',
    });
    expect(parseChord('Ctrl+Shift+P')).toEqual({
      mods: ['ctrl', 'shift'],
      key: 'p',
      raw: 'Ctrl+Shift+P',
    });
  });

  it('normalizes Esc to escape', () => {
    expect(parseChord('Esc')).toEqual({ mods: [], key: 'escape', raw: 'Esc' });
  });

  it('normalizes Shift+Tab', () => {
    expect(parseChord('Shift+Tab')).toEqual({ mods: ['shift'], key: 'tab', raw: 'Shift+Tab' });
  });

  it('normalizes Enter/Return and Space', () => {
    expect(parseChord('Return')?.key).toBe('enter');
    expect(parseChord('Space')?.key).toBe('space');
  });

  it('maps Option and ^ aliases', () => {
    expect(parseChord('Option+A')).toEqual({ mods: ['alt'], key: 'a', raw: 'Option+A' });
    expect(parseChord('^+C')).toEqual({ mods: ['ctrl'], key: 'c', raw: '^+C' });
  });

  it('returns null for empty input', () => {
    expect(parseChord('')).toBeNull();
    expect(parseChord('   ')).toBeNull();
  });

  it('returns null when only modifiers present', () => {
    expect(parseChord('Ctrl+Shift')).toBeNull();
  });

  it('rejects multi-stroke sequences as not a single chord', () => {
    // "Ctrl+X Ctrl+E" is a readline two-stroke, not a single-key chord —
    // previously it was mis-parsed and shown as a bogus "Ctrl+E".
    expect(parseChord('Ctrl+X Ctrl+E')).toBeNull();
    expect(parseChord('Ctrl+X Ctrl+K (chord)')).toBeNull();
    // Genuine single chords still parse (incl. multi-modifier ones).
    expect(parseChord('Ctrl+Shift+P')?.key).toBe('p');
  });
});

describe('parseChords', () => {
  it('splits on " / " into two chords', () => {
    const chords = parseChords('Ctrl+V / Alt+V');
    expect(chords).toHaveLength(2);
    expect(chords[0]).toEqual({ mods: ['ctrl'], key: 'v', raw: 'Ctrl+V' });
    expect(chords[1]).toEqual({ mods: ['alt'], key: 'v', raw: 'Alt+V' });
  });

  it('splits on commas and drops invalid entries', () => {
    const chords = parseChords('Ctrl+R, , Esc');
    expect(chords).toHaveLength(2);
    expect(chords[0].key).toBe('r');
    expect(chords[1].key).toBe('escape');
  });

  it('returns empty array for empty input', () => {
    expect(parseChords('')).toEqual([]);
  });

  it('drops multi-stroke sequences, keeping only single-chord alternatives', () => {
    // "Ctrl+G / Ctrl+X Ctrl+E" → only Ctrl+G is a single-key chord.
    const chords = parseChords('Ctrl+G / Ctrl+X Ctrl+E');
    expect(chords).toHaveLength(1);
    expect(chords[0]).toEqual({ mods: ['ctrl'], key: 'g', raw: 'Ctrl+G' });
  });
});

describe('chordFromEvent', () => {
  it('builds a chord from a synthetic KeyboardEvent', () => {
    const e = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    expect(chordFromEvent(e)).toEqual({ mods: ['ctrl'], key: 'r', raw: 'r' });
  });

  it('normalizes Escape and sorts mods', () => {
    const e = new KeyboardEvent('keydown', {
      key: 'Escape',
      ctrlKey: false,
      metaKey: true,
      shiftKey: true,
      altKey: false,
    });
    expect(chordFromEvent(e)).toEqual({
      mods: ['meta', 'shift'],
      key: 'escape',
      raw: 'Escape',
    });
  });
});

describe('chordEquals', () => {
  it('returns true for same key and same mod set (order-independent)', () => {
    const a: KeyChord = { mods: ['ctrl', 'shift'], key: 'p', raw: 'Ctrl+Shift+P' };
    const b: KeyChord = { mods: ['shift', 'ctrl'], key: 'p', raw: 'Shift+Ctrl+P' };
    expect(chordEquals(a, b)).toBe(true);
  });

  it('returns false for different key', () => {
    const a: KeyChord = { mods: ['ctrl'], key: 'r', raw: 'Ctrl+R' };
    const b: KeyChord = { mods: ['ctrl'], key: 'v', raw: 'Ctrl+V' };
    expect(chordEquals(a, b)).toBe(false);
  });

  it('returns false for different mod count', () => {
    const a: KeyChord = { mods: ['ctrl'], key: 'p', raw: 'Ctrl+P' };
    const b: KeyChord = { mods: ['ctrl', 'shift'], key: 'p', raw: 'Ctrl+Shift+P' };
    expect(chordEquals(a, b)).toBe(false);
  });
});

describe('displayChord', () => {
  it('uses mac symbols', () => {
    const chord: KeyChord = { mods: ['ctrl', 'meta', 'shift', 'alt'], key: 'k', raw: 'x' };
    expect(displayChord(chord, 'mac')).toBe('⌃⌘⇧⌥K');
  });

  it('uses win labels with Win for meta', () => {
    const chord: KeyChord = { mods: ['ctrl', 'meta', 'shift', 'alt'], key: 'k', raw: 'x' };
    expect(displayChord(chord, 'win')).toBe('Ctrl+Win+Shift+Alt+K');
  });

  it('uses linux labels with Super for meta', () => {
    const chord: KeyChord = { mods: ['meta'], key: 'k', raw: 'x' };
    expect(displayChord(chord, 'linux')).toBe('Super+K');
  });

  it('title-cases word keys and uppercases single letters', () => {
    expect(displayChord({ mods: ['shift'], key: 'tab', raw: 'x' }, 'win')).toBe('Shift+Tab');
    expect(displayChord({ mods: [], key: 'escape', raw: 'x' }, 'mac')).toBe('Escape');
    expect(displayChord({ mods: ['ctrl'], key: 'r', raw: 'x' }, 'win')).toBe('Ctrl+R');
  });
});
