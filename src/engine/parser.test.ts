// src/engine/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseInput } from './parser';

describe('parseInput', () => {
  it('treats empty / whitespace-only input as empty', () => {
    expect(parseInput('')).toEqual({ kind: 'empty', args: '', raw: '' });
    expect(parseInput('   ')).toEqual({ kind: 'empty', args: '', raw: '' });
  });

  it('parses a bare slash command', () => {
    expect(parseInput('/help')).toEqual({
      kind: 'slash',
      command: '/help',
      args: '',
      raw: '/help',
    });
  });

  it('lowercases the slash command and keeps args verbatim', () => {
    expect(parseInput('/Cheatsheet Some Args')).toEqual({
      kind: 'slash',
      command: '/cheatsheet',
      args: 'Some Args',
      raw: '/Cheatsheet Some Args',
    });
  });

  it('parses an @ file mention', () => {
    expect(parseInput('@src/index.ts')).toEqual({
      kind: 'file',
      args: 'src/index.ts',
      raw: '@src/index.ts',
    });
  });

  it('parses a # quick memory note', () => {
    expect(parseInput('#remember this')).toEqual({
      kind: 'memory',
      args: 'remember this',
      raw: '#remember this',
    });
  });

  it('parses a ! bash command and keeps args after the prefix', () => {
    expect(parseInput('!ls -la')).toEqual({
      kind: 'bash',
      args: 'ls -la',
      raw: '!ls -la',
    });
  });

  it('falls back to text for ordinary prompts', () => {
    expect(parseInput('hello world')).toEqual({
      kind: 'text',
      args: 'hello world',
      raw: 'hello world',
    });
  });

  it('preserves the original raw including leading whitespace', () => {
    const parsed = parseInput('  /help  ');
    expect(parsed.kind).toBe('slash');
    expect(parsed.command).toBe('/help');
    expect(parsed.raw).toBe('  /help  ');
  });
});
