import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { load, save } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips an object via save then load', () => {
    const value = { a: 1, b: 'two', c: [3, 4] };
    save('round-trip', value);
    expect(load('round-trip', null as unknown as typeof value)).toEqual(value);
  });

  it('namespaces keys under cc-trainer:', () => {
    save('ns', 42);
    expect(localStorage.getItem('cc-trainer:ns')).toBe('42');
    expect(localStorage.getItem('ns')).toBeNull();
  });

  it('returns fallback for a missing key', () => {
    expect(load('missing', 'default')).toBe('default');
  });

  it('returns fallback when stored JSON is corrupt', () => {
    localStorage.setItem('cc-trainer:corrupt', 'not json');
    expect(load('corrupt', 'fallback')).toBe('fallback');
  });

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => save('quota', { big: true })).not.toThrow();
  });
});
