// src/engine/types.test.ts
import { describe, it, expect } from 'vitest';
import type { LineKind, TerminalLine, CommandContext, CommandResult } from './types';

describe('engine/types', () => {
  it('constructs a TerminalLine with required fields', () => {
    const kind: LineKind = 'output';
    const line: TerminalLine = { id: 'x1', kind, text: 'hello' };
    expect(line.id).toBe('x1');
    expect(line.kind).toBe('output');
    expect(line.text).toBe('hello');
    expect(line.title).toBeUndefined();
  });

  it('allows an optional title on a box line', () => {
    const line: TerminalLine = { id: 'b1', kind: 'box', text: 'body', title: 'Heading' };
    expect(line.title).toBe('Heading');
  });

  it('builds a CommandContext and CommandResult', () => {
    const ctx: CommandContext = { catalog: [] };
    const result: CommandResult = { lines: [], clear: true };
    expect(ctx.catalog).toEqual([]);
    expect(result.lines).toEqual([]);
    expect(result.clear).toBe(true);
    expect(result.navigate).toBeUndefined();
  });
});
