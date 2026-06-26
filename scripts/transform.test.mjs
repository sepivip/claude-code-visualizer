import { describe, it, expect } from 'vitest';
import {
  slugify,
  mapDomain,
  normalizeCategory,
  transformCatalog,
} from './transform.mjs';

const RAW = {
  catalogs: [
    {
      domain: 'Claude Code Terminal/REPL Interactive Controls',
      overview: 'interactive',
      items: [
        {
          name: 'Ctrl+C',
          category: 'shortcut',
          summary: 'Interrupt running operation',
          syntax: 'Press Ctrl+C',
          details: 'First press interrupts.',
          example: 'Press Ctrl+C to stop.',
          platformNotes: 'Same everywhere',
        },
        {
          name: 'Ctrl+C',
          category: 'shortcut',
          summary: 'Duplicate name to exercise slug dedupe',
        },
      ],
    },
    {
      domain: 'Claude Code CLI',
      overview: 'cli',
      items: [
        {
          name: 'ANTHROPIC_MODEL',
          category: 'env-flag',
          summary: 'Pick the model via env var',
          source: 'https://example.test/cli',
        },
      ],
    },
  ],
  missingItems: [
    {
      name: 'Reverse search Ctrl+S',
      domain: 'Claude Code Terminal/REPL Interactive Controls',
      category: 'Keyboard Shortcuts - Reverse Search',
      summary: 'Cycle scope in reverse search',
      newcomerTip: 'Press Ctrl+R first.',
    },
  ],
};

describe('slugify', () => {
  it('lowercases, strips symbols and hyphenates', () => {
    expect(slugify('Ctrl+C')).toBe('ctrl-c');
    expect(slugify('ANTHROPIC_MODEL')).toBe('anthropic-model');
    expect(slugify('  /add-dir  ')).toBe('add-dir');
  });
});

describe('mapDomain', () => {
  it('maps the 12 raw domain strings to DomainKeys', () => {
    expect(mapDomain('Claude Code Terminal/REPL Interactive Controls')).toBe('interactive');
    expect(mapDomain('Claude Code CLI')).toBe('cli');
    expect(mapDomain('Claude Code Hooks System')).toBe('hooks');
    expect(mapDomain('Claude Code: Sessions, Context, and Workflow Automation')).toBe('sessions');
  });

  it('throws on an unmapped domain string', () => {
    expect(() => mapDomain('Totally Unknown Domain')).toThrow();
  });
});

describe('normalizeCategory', () => {
  it('maps env-flag to cli-flag', () => {
    expect(normalizeCategory('env-flag')).toBe('cli-flag');
  });
  it('maps best-practice/troubleshooting/example to concept', () => {
    expect(normalizeCategory('best-practice')).toBe('concept');
    expect(normalizeCategory('troubleshooting')).toBe('concept');
    expect(normalizeCategory('example')).toBe('concept');
  });
  it('maps tool to feature', () => {
    expect(normalizeCategory('tool')).toBe('feature');
  });
  it('passes through canonical categories', () => {
    expect(normalizeCategory('slash-command')).toBe('slash-command');
    expect(normalizeCategory('hook')).toBe('hook');
  });
  it('maps unknown free-form categories to concept', () => {
    expect(normalizeCategory('Keyboard Shortcuts - Reverse Search')).toBe('concept');
  });
});

describe('transformCatalog', () => {
  const items = transformCatalog(RAW);

  it('produces one item per raw item across catalogs + missingItems', () => {
    expect(items).toHaveLength(4);
  });

  it('assigns unique ids with numeric suffix dedupe', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('ctrl-c');
    expect(ids).toContain('ctrl-c-2');
  });

  it('maps domains and normalizes categories', () => {
    const env = items.find((i) => i.name === 'ANTHROPIC_MODEL');
    expect(env.domain).toBe('cli');
    expect(env.category).toBe('cli-flag');
  });

  it('defaults confidence: verified for catalogs, advanced for missingItems', () => {
    const fromCatalog = items.find((i) => i.name === 'Ctrl+C');
    const fromMissing = items.find((i) => i.name === 'Reverse search Ctrl+S');
    expect(fromCatalog.confidence).toBe('verified');
    expect(fromMissing.confidence).toBe('advanced');
  });

  it('copies optional fields and omits absent ones', () => {
    const ctrlC = items.find((i) => i.id === 'ctrl-c');
    expect(ctrlC.syntax).toBe('Press Ctrl+C');
    expect(ctrlC.details).toBe('First press interrupts.');
    expect(ctrlC).not.toHaveProperty('newcomerTip');
    const missing = items.find((i) => i.name === 'Reverse search Ctrl+S');
    expect(missing.newcomerTip).toBe('Press Ctrl+R first.');
  });
});
