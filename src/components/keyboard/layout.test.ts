// src/components/keyboard/layout.test.ts
import { describe, it, expect } from 'vitest';
import { LAYOUT, ALL_KEYS } from './layout';

describe('LAYOUT.main', () => {
  it('has exactly 6 rows', () => {
    expect(LAYOUT.main).toHaveLength(6);
  });

  it('contains exactly two mod:shift keys across the layout', () => {
    const shiftKeys = ALL_KEYS.filter((k) => k.mod === 'shift');
    expect(shiftKeys).toHaveLength(2);
    const ids = shiftKeys.map((k) => k.id);
    expect(ids).toContain('shift-l');
    expect(ids).toContain('shift-r');
  });

  it('contains exactly two mod:ctrl keys (ctrl-l and ctrl-r)', () => {
    const ctrlKeys = ALL_KEYS.filter((k) => k.mod === 'ctrl');
    expect(ctrlKeys).toHaveLength(2);
    const ids = ctrlKeys.map((k) => k.id);
    expect(ids).toContain('ctrl-l');
    expect(ids).toContain('ctrl-r');
  });

  it('contains Space key with code "space" and width >= 5', () => {
    const space = ALL_KEYS.find((k) => k.code === 'space');
    expect(space).toBeDefined();
    expect((space?.w ?? 1)).toBeGreaterThanOrEqual(5);
  });

  it('contains all 26 letters a–z', () => {
    const codes = new Set(ALL_KEYS.map((k) => k.code));
    for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
      expect(codes.has(ch), `missing letter: ${ch}`).toBe(true);
    }
  });

  it('every non-spacer KeyDef id is UNIQUE', () => {
    const ids = ALL_KEYS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('LAYOUT.nav', () => {
  it('has 2 rows of 3 keys each', () => {
    expect(LAYOUT.nav).toHaveLength(2);
    LAYOUT.nav.forEach((row) => expect(row).toHaveLength(3));
  });

  it('contains Ins/Home/PgUp in first row and Del/End/PgDn in second', () => {
    const [row1, row2] = LAYOUT.nav;
    expect(row1.map((k) => k.code)).toEqual(['insert', 'home', 'pageup']);
    expect(row2.map((k) => k.code)).toEqual(['delete', 'end', 'pagedown']);
  });
});

describe('LAYOUT.arrows', () => {
  it('contains arrowup, arrowleft, arrowdown, arrowright', () => {
    const arrowCodes = new Set(
      LAYOUT.arrows.flat().filter((k) => !k.spacer).map((k) => k.code),
    );
    expect(arrowCodes.has('arrowup')).toBe(true);
    expect(arrowCodes.has('arrowleft')).toBe(true);
    expect(arrowCodes.has('arrowdown')).toBe(true);
    expect(arrowCodes.has('arrowright')).toBe(true);
  });
});

describe('LAYOUT.system', () => {
  it('contains PrtSc, ScrLk, Pause', () => {
    const codes = LAYOUT.system.map((k) => k.code);
    expect(codes).toContain('printscreen');
    expect(codes).toContain('scrolllock');
    expect(codes).toContain('pause');
  });
});
