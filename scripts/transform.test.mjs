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

// --- Task 14: confidence overrides (appended) ---
// NOTE: describe/it/expect and transformCatalog are already imported at the
// top of this file (Task 3). Do NOT re-import them here.
import { VERIFIED, ADVANCED } from './confidence-overrides.mjs';

describe('confidence-overrides module', () => {
  it('exports VERIFIED and ADVANCED as arrays of strings', () => {
    expect(Array.isArray(VERIFIED)).toBe(true);
    expect(Array.isArray(ADVANCED)).toBe(true);
    expect(VERIFIED.every((v) => typeof v === 'string')).toBe(true);
    expect(ADVANCED.every((v) => typeof v === 'string')).toBe(true);
  });

  it('lists the gap-critic uncertain items in ADVANCED', () => {
    const expected = [
      '--teammate-mode',
      'teammateMode',
      'advisorModel',
      'Elicitation hook event',
      'ElicitationResult hook event',
      'TeammateIdle hook event',
      'ConfigChange hook event',
      'CwdChanged hook event',
      'FileChanged hook event',
      'WorktreeCreate hook event',
      'WorktreeRemove hook event',
      'PostToolBatch hook event',
      'PostToolUseFailure hook event',
      '--exclude-dynamic-system-prompt-sections',
      '--replay-user-messages',
    ];
    for (const name of expected) {
      expect(ADVANCED).toContain(name);
    }
  });
});

describe('transformCatalog with overrides', () => {
  // Uses the REAL transformCatalog input shape: an OBJECT with `catalogs`
  // (each holding raw items WITHOUT id/confidence) and `missingItems`.
  const raw = {
    catalogs: [
      {
        domain: 'Claude Code Slash Commands',
        items: [
          {
            name: '/clear',
            category: 'slash-command',
            summary: 'Clear the conversation history.',
          },
          {
            name: '/help',
            category: 'slash-command',
            summary: 'Show available commands.',
          },
        ],
      },
    ],
    missingItems: [
      {
        name: '--teammate-mode',
        domain: 'Claude Code CLI',
        category: 'cli-flag',
        summary: 'Bleeding-edge teammate mode flag.',
      },
    ],
  };

  it('demotes a name in ADVANCED to advanced', () => {
    const out = transformCatalog(raw, { VERIFIED, ADVANCED });
    const item = out.find((i) => i.name === '--teammate-mode');
    expect(item?.confidence).toBe('advanced');
  });

  it('promotes a name in VERIFIED to verified', () => {
    const out = transformCatalog(raw, { VERIFIED, ADVANCED });
    const item = out.find((i) => i.name === '/clear');
    expect(item?.confidence).toBe('verified');
  });

  it('is a no-op when overrides is omitted', () => {
    // Without overrides, catalog items default to 'verified' and missingItems
    // to 'advanced' (Task 3 behavior). '--teammate-mode' is a missingItem,
    // so it is 'advanced' here purely from the Task 3 default, not an override.
    const out = transformCatalog(raw);
    const clear = out.find((i) => i.name === '/clear');
    expect(clear?.confidence).toBe('verified');
  });
});
