// src/engine/parser.ts
export type InputKind = 'slash' | 'file' | 'memory' | 'bash' | 'text' | 'empty';

export interface ParsedInput {
  kind: InputKind;
  command?: string;
  args: string;
  raw: string;
}

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return { kind: 'empty', args: '', raw: trimmed };
  }

  if (trimmed.startsWith('/')) {
    const spaceIndex = trimmed.indexOf(' ');
    const command =
      spaceIndex === -1 ? trimmed.toLowerCase() : trimmed.slice(0, spaceIndex).toLowerCase();
    const args = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();
    return { kind: 'slash', command, args, raw };
  }

  if (trimmed.startsWith('@')) {
    return { kind: 'file', args: trimmed.slice(1).trim(), raw };
  }

  if (trimmed.startsWith('#')) {
    return { kind: 'memory', args: trimmed.slice(1).trim(), raw };
  }

  if (trimmed.startsWith('!')) {
    return { kind: 'bash', args: trimmed.slice(1).trim(), raw };
  }

  return { kind: 'text', args: trimmed, raw };
}
