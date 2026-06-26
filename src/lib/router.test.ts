// src/lib/router.test.ts
import { describe, it, expect } from 'vitest';
import { parseHash, buildHash, type RouteState } from './router';

describe('parseHash', () => {
  it('empty hash → start with no params', () => {
    expect(parseHash('')).toEqual({ mode: 'start', params: {} });
  });

  it('strips leading # and / and reads mode segment', () => {
    expect(parseHash('#/cheatsheet')).toEqual({ mode: 'cheatsheet', params: {} });
  });

  it('parses query string after ? into params', () => {
    expect(parseHash('#/cheatsheet?q=compact')).toEqual({
      mode: 'cheatsheet',
      params: { q: 'compact' },
    });
  });

  it('parses multiple query params', () => {
    expect(parseHash('#/quiz?domain=hooks&n=5')).toEqual({
      mode: 'quiz',
      params: { domain: 'hooks', n: '5' },
    });
  });

  it('falls back to start for an invalid mode', () => {
    expect(parseHash('#/nope')).toEqual({ mode: 'start', params: {} });
  });

  it('keeps params even when mode is invalid', () => {
    expect(parseHash('#/nope?q=x')).toEqual({ mode: 'start', params: { q: 'x' } });
  });
});

describe('buildHash', () => {
  it('builds start with no params explicitly', () => {
    expect(buildHash({ mode: 'start', params: {} })).toBe('#/start');
  });

  it('builds mode with a query string', () => {
    expect(buildHash({ mode: 'cheatsheet', params: { q: 'compact' } })).toBe(
      '#/cheatsheet?q=compact',
    );
  });

  it('round-trips through parseHash', () => {
    const states: RouteState[] = [
      { mode: 'start', params: {} },
      { mode: 'playground', params: {} },
      { mode: 'cheatsheet', params: { q: 'compact' } },
      { mode: 'quiz', params: { domain: 'hooks', n: '5' } },
      { mode: 'keyboard', params: {} },
    ];
    for (const s of states) {
      expect(parseHash(buildHash(s))).toEqual(s);
    }
  });
});
