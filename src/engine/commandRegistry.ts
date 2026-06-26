// src/engine/commandRegistry.ts
import type { Mode } from '../data/types';
import type { CommandContext, CommandResult, LineKind, TerminalLine } from './types';
import type { ParsedInput } from './parser';

export const NAV_COMMANDS: Record<string, Mode> = {
  '/start': 'start',
  '/playground': 'playground',
  '/cheatsheet': 'cheatsheet',
  '/keyboard': 'keyboard',
  '/quiz': 'quiz',
};

const BUILTINS = ['/help', '/clear'] as const;

function line(kind: LineKind, text: string, title?: string): TerminalLine {
  return { id: '', kind, text, title };
}

function builtinSlashNames(): string[] {
  return [...Object.keys(NAV_COMMANDS), ...BUILTINS];
}

function catalogSlashNames(ctx: CommandContext): string[] {
  return ctx.catalog
    .filter((item) => item.category === 'slash-command' && item.name.startsWith('/'))
    .map((item) => item.name);
}

function allSlashNames(ctx: CommandContext): string[] {
  return Array.from(new Set([...builtinSlashNames(), ...catalogSlashNames(ctx)])).sort();
}

export function completions(prefix: string, ctx: CommandContext): string[] {
  return allSlashNames(ctx).filter((name) => name.startsWith(prefix));
}

function longestCommonPrefixLen(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function closestCommand(command: string, ctx: CommandContext): string {
  const candidates = allSlashNames(ctx);
  let best = '/help';
  let bestLen = 1; // require sharing more than just the leading '/'
  for (const candidate of candidates) {
    const len = longestCommonPrefixLen(command, candidate);
    if (len > bestLen) {
      bestLen = len;
      best = candidate;
    }
  }
  return best;
}

function helpBox(): TerminalLine {
  const navList = Object.keys(NAV_COMMANDS).join('  ');
  const text = `${navList}\n/help  /clear\n\nTry /cheatsheet to browse everything.`;
  return line('box', text, 'Commands');
}

function catalogBox(command: string, ctx: CommandContext): TerminalLine | null {
  const item = ctx.catalog.find(
    (entry) => entry.category === 'slash-command' && entry.name === command,
  );
  if (!item) return null;
  const parts = [item.summary];
  if (item.details) parts.push(item.details);
  if (item.example) parts.push(item.example);
  return line('box', parts.join('\n\n'), item.name);
}

function runSlash(parsed: ParsedInput, ctx: CommandContext): CommandResult {
  const command = parsed.command ?? '';

  if (command in NAV_COMMANDS) {
    const mode = NAV_COMMANDS[command];
    return { lines: [line('system', `Opening ${mode}…`)], navigate: mode };
  }

  if (command === '/help') {
    return { lines: [helpBox()] };
  }

  if (command === '/clear') {
    return { lines: [], clear: true };
  }

  const box = catalogBox(command, ctx);
  if (box) {
    return { lines: [box] };
  }

  const closest = closestCommand(command, ctx);
  return {
    lines: [
      line('error', `Unknown command: ${command}`),
      line('suggestion', `Did you mean: ${closest}`),
    ],
  };
}

export function runCommand(parsed: ParsedInput, ctx: CommandContext): CommandResult {
  switch (parsed.kind) {
    case 'empty':
      return { lines: [] };
    case 'slash':
      return runSlash(parsed, ctx);
    case 'file':
      return {
        lines: [
          line(
            'system',
            `Typing @ lets you mention files and folders so Claude reads them: @${parsed.args}`,
          ),
          line(
            'output',
            ctx.catalog.some((item) => item.name === '@')
              ? 'See the @ entry in the catalog for the full file-mention reference.'
              : 'File mentions pull the referenced path into context for the next prompt.',
          ),
        ],
      };
    case 'memory':
      return {
        lines: [
          line(
            'system',
            `Starting a line with # adds a quick memory note saved to CLAUDE.md: #${parsed.args}`,
          ),
          line('output', 'Quick memory notes let you teach Claude project facts on the fly.'),
        ],
      };
    case 'bash':
      return {
        lines: [
          line(
            'system',
            `Prefixing with ! runs the rest as a bash command in your shell: !${parsed.args}`,
          ),
          line('output', 'Bash mode executes the command and feeds its output back to Claude.'),
        ],
      };
    case 'text':
    default:
      return {
        lines: [
          line(
            'system',
            'This is a simulated prompt — no model runs here. Type /help to see what you can try.',
          ),
        ],
      };
  }
}
