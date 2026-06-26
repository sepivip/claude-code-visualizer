import { describe, it, expect } from 'vitest';
import { DOMAINS, domainOf } from '../domains';

const KEYS = [
  'interactive', 'slash', 'cli', 'settings', 'hooks', 'mcp',
  'subagents', 'permissions', 'memory', 'plugins', 'customization', 'sessions',
] as const;

describe('DOMAINS', () => {
  it('has exactly 12 entries with the contract keys', () => {
    expect(DOMAINS).toHaveLength(12);
    expect(DOMAINS.map((d) => d.key)).toEqual([...KEYS]);
  });

  it('every entry has a non-empty label, icon and blurb', () => {
    for (const d of DOMAINS) {
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.icon.length).toBeGreaterThan(0);
      expect(d.blurb.length).toBeGreaterThan(0);
    }
  });

  it('keys are unique', () => {
    expect(new Set(DOMAINS.map((d) => d.key)).size).toBe(12);
  });
});

describe('domainOf', () => {
  it('returns the matching DomainMeta', () => {
    expect(domainOf('hooks').label).toBe('Hooks');
    expect(domainOf('mcp').key).toBe('mcp');
  });

  it('throws for an unknown key', () => {
    // @ts-expect-error intentionally invalid key
    expect(() => domainOf('nope')).toThrow();
  });
});
