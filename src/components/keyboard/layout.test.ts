// src/components/keyboard/layout.test.ts
import { describe, it, expect } from 'vitest';
import { KEY_ROWS } from './layout';

describe('KEY_ROWS', () => {
  it('contains qwerty letter r and esc/tab with normalized keys', () => {
    const all = KEY_ROWS.flat();
    expect(all.find((k) => k.key === 'r')?.label).toBe('R');
    expect(all.find((k) => k.key === 'escape')?.label).toBe('Esc');
    expect(all.find((k) => k.key === 'tab')?.label).toBe('Tab');
  });

  it('marks modifier keys with isMod', () => {
    const all = KEY_ROWS.flat();
    expect(all.find((k) => k.key === 'ctrl')?.isMod).toBe(true);
    expect(all.find((k) => k.key === 'shift')?.isMod).toBe(true);
    expect(all.find((k) => k.key === 'alt')?.isMod).toBe(true);
    expect(all.find((k) => k.key === 'meta')?.isMod).toBe(true);
  });

  it('keys are unique and lowercase-normalized', () => {
    const keys = KEY_ROWS.flat().map((k) => k.key);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((k) => expect(k).toBe(k.toLowerCase()));
  });
});
