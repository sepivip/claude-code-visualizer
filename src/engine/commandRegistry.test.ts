// src/engine/commandRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { runCommand, completions, NAV_COMMANDS } from './commandRegistry';
import { parseInput } from './parser';
import type { CommandContext } from './types';
import type { CatalogItem } from '../data/types';

const initItem: CatalogItem = {
  id: 'slash-init',
  name: '/init',
  category: 'slash-command',
  domain: 'slash',
  summary: 'Bootstrap a CLAUDE.md memory file for the project.',
  details: 'Scans the repo and writes a starter CLAUDE.md.',
  example: 'Run /init at the project root.',
  confidence: 'verified',
};

const compactItem: CatalogItem = {
  id: 'slash-compact',
  name: '/compact',
  category: 'slash-command',
  domain: 'slash',
  summary: 'Summarize and shrink the conversation context.',
  confidence: 'verified',
};

const ctx: CommandContext = { catalog: [initItem, compactItem] };

const run = (raw: string) => runCommand(parseInput(raw), ctx);

describe('NAV_COMMANDS', () => {
  it('maps each nav slash command to its mode', () => {
    expect(NAV_COMMANDS).toEqual({
      '/start': 'start',
      '/playground': 'playground',
      '/cheatsheet': 'cheatsheet',
      '/keyboard': 'keyboard',
      '/quiz': 'quiz',
    });
  });
});

describe('runCommand — navigation', () => {
  it('navigates to the target mode and emits a system line', () => {
    const result = run('/playground');
    expect(result.navigate).toBe('playground');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe('system');
    expect(result.lines[0].text).toContain('playground');
  });
});

describe('runCommand — built-ins', () => {
  it('/help returns a single titled box listing commands', () => {
    const result = run('/help');
    expect(result.navigate).toBeUndefined();
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe('box');
    expect(result.lines[0].title).toBe('Commands');
    expect(result.lines[0].text).toContain('/cheatsheet');
    expect(result.lines[0].text).toContain('/help');
    expect(result.lines[0].text).toContain('/clear');
  });

  it('/clear returns clear:true with no lines', () => {
    const result = run('/clear');
    expect(result.clear).toBe(true);
    expect(result.lines).toEqual([]);
  });
});

describe('runCommand — catalog slash commands', () => {
  it('renders a known catalog command as a box with its details', () => {
    const result = run('/init');
    expect(result.navigate).toBeUndefined();
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe('box');
    expect(result.lines[0].title).toBe('/init');
    expect(result.lines[0].text).toContain('Bootstrap a CLAUDE.md');
    expect(result.lines[0].text).toContain('Scans the repo');
    expect(result.lines[0].text).toContain('/init at the project root');
  });
});

describe('runCommand — unknown', () => {
  it('returns an error line plus a suggestion line', () => {
    const result = run('/inot');
    expect(result.navigate).toBeUndefined();
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].kind).toBe('error');
    expect(result.lines[0].text).toBe('Unknown command: /inot');
    expect(result.lines[1].kind).toBe('suggestion');
    expect(result.lines[1].text).toContain('/init');
  });

  it('falls back to /help when nothing shares a prefix', () => {
    const result = run('/zzz');
    expect(result.lines[1].kind).toBe('suggestion');
    expect(result.lines[1].text).toContain('/help');
  });
});

describe('runCommand — non-slash prefixes', () => {
  it('explains @ file mentions', () => {
    const result = run('@src/app.ts');
    expect(result.lines[0].text).toContain('@');
    expect(result.lines.some((l) => l.text.includes('src/app.ts'))).toBe(true);
  });

  it('explains # quick memory', () => {
    const result = run('#note to self');
    expect(result.lines[0].text).toContain('#');
    expect(result.lines.some((l) => l.text.includes('memory'))).toBe(true);
  });

  it('explains ! bash mode', () => {
    const result = run('!ls');
    expect(result.lines[0].text).toContain('!');
    expect(result.lines.some((l) => l.text.toLowerCase().includes('bash'))).toBe(true);
  });

  it('treats plain text as a simulated prompt and suggests /help', () => {
    const result = run('how do I commit?');
    expect(result.lines[0].kind).toBe('system');
    expect(result.lines.some((l) => l.text.includes('/help'))).toBe(true);
  });

  it('does nothing for empty input', () => {
    const result = run('   ');
    expect(result.lines).toEqual([]);
  });
});

describe('completions', () => {
  it('returns sorted, deduped slash names sharing the prefix from nav, built-ins and catalog', () => {
    // '/cheatsheet','/clear' come from nav+built-ins; '/compact' comes from ctx.catalog.
    expect(completions('/c', ctx)).toEqual(['/cheatsheet', '/clear', '/compact']);
  });

  it('returns all slash names for the bare slash prefix, including catalog commands', () => {
    const all = completions('/', ctx);
    expect(all).toContain('/help');
    expect(all).toContain('/start');
    expect(all).toContain('/init');
    expect(all).toContain('/compact');
    expect([...all]).toEqual([...all].sort());
  });

  it('returns an empty list when nothing matches', () => {
    expect(completions('/zzz', ctx)).toEqual([]);
  });
});

describe('id contract', () => {
  it('emits lines with empty id (ids assigned by the shell)', () => {
    for (const line of run('/help').lines) {
      expect(line.id).toBe('');
    }
  });
});
