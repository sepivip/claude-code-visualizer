// src/lib/keys.ts
import type { KeyChord, Modifier, Platform } from '../data/types';

const MOD_ORDER: Modifier[] = ['ctrl', 'meta', 'shift', 'alt'];

const MOD_ALIASES: Record<string, Modifier> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  '^': 'ctrl',
  cmd: 'meta',
  command: 'meta',
  '⌘': 'meta',
  meta: 'meta',
  win: 'meta',
  super: 'meta',
  shift: 'shift',
  '⇧': 'shift',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  '⌥': 'alt',
};

function normalizeKey(token: string): string {
  const lower = token.toLowerCase();
  switch (lower) {
    case 'enter':
    case 'return':
      return 'enter';
    case 'esc':
    case 'escape':
      return 'escape';
    case 'tab':
      return 'tab';
    case 'space':
    case ' ':
      return 'space';
    default:
      return lower;
  }
}

function sortMods(mods: Modifier[]): Modifier[] {
  return MOD_ORDER.filter((m) => mods.includes(m));
}

export function parseChord(raw: string): KeyChord | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const tokens = trimmed.split('+').map((t) => t.trim()).filter((t) => t !== '');
  if (tokens.length === 0) return null;

  const mods: Modifier[] = [];
  let key: string | null = null;

  for (const token of tokens) {
    const mod = MOD_ALIASES[token.toLowerCase()];
    if (mod) {
      if (!mods.includes(mod)) mods.push(mod);
    } else {
      key = normalizeKey(token);
    }
  }

  if (key === null) return null;
  return { mods: sortMods(mods), key, raw: trimmed };
}

export function parseChords(raw: string): KeyChord[] {
  const parts = raw
    .split(/\s\/\s|,/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
  const chords: KeyChord[] = [];
  for (const part of parts) {
    const chord = parseChord(part);
    if (chord) chords.push(chord);
  }
  return chords;
}

export function chordFromEvent(e: KeyboardEvent): KeyChord {
  const mods: Modifier[] = [];
  if (e.ctrlKey) mods.push('ctrl');
  if (e.metaKey) mods.push('meta');
  if (e.shiftKey) mods.push('shift');
  if (e.altKey) mods.push('alt');
  return { mods: sortMods(mods), key: normalizeKey(e.key), raw: e.key };
}

export function chordEquals(a: KeyChord, b: KeyChord): boolean {
  if (a.key !== b.key) return false;
  if (a.mods.length !== b.mods.length) return false;
  return a.mods.every((m) => b.mods.includes(m));
}

function macSymbol(mod: Modifier): string {
  switch (mod) {
    case 'ctrl':
      return '⌃';
    case 'meta':
      return '⌘';
    case 'shift':
      return '⇧';
    case 'alt':
      return '⌥';
  }
}

function pcLabel(mod: Modifier, platform: Platform): string {
  switch (mod) {
    case 'ctrl':
      return 'Ctrl';
    case 'meta':
      return platform === 'linux' ? 'Super' : 'Win';
    case 'shift':
      return 'Shift';
    case 'alt':
      return 'Alt';
  }
}

function keyLabel(key: string): string {
  if (key.length === 1) return key.toUpperCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function displayChord(chord: KeyChord, platform: Platform): string {
  const mods = sortMods(chord.mods);
  const label = keyLabel(chord.key);
  if (platform === 'mac') {
    return mods.map(macSymbol).join('') + label;
  }
  return [...mods.map((m) => pcLabel(m, platform)), label].join('+');
}
