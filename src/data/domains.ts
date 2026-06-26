import type { DomainKey } from './types';

export interface DomainMeta {
  key: DomainKey;
  label: string;
  icon: string;
  blurb: string;
}

export const DOMAINS: DomainMeta[] = [
  {
    key: 'interactive',
    label: 'Interactive Mode',
    icon: '⌨️',
    blurb: 'Terminal/REPL controls, keyboard shortcuts, and in-session navigation.',
  },
  {
    key: 'slash',
    label: 'Slash Commands',
    icon: '⚡',
    blurb: 'Built-in /commands you type at the prompt to drive Claude Code.',
  },
  {
    key: 'cli',
    label: 'CLI & Flags',
    icon: '🖥️',
    blurb: 'The claude binary, subcommands, and command-line flags.',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: '⚙️',
    blurb: 'settings.json configuration keys and environment variables.',
  },
  {
    key: 'hooks',
    label: 'Hooks',
    icon: '🪝',
    blurb: 'Lifecycle hook events that run your own scripts around Claude actions.',
  },
  {
    key: 'mcp',
    label: 'MCP',
    icon: '🔌',
    blurb: 'Model Context Protocol servers, tools, and resources in Claude Code.',
  },
  {
    key: 'subagents',
    label: 'Subagents',
    icon: '🤖',
    blurb: 'Specialized agents you delegate scoped tasks to.',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    icon: '🛡️',
    blurb: 'Permission rules and modes that gate tool use.',
  },
  {
    key: 'memory',
    label: 'Memory',
    icon: '🧠',
    blurb: 'CLAUDE.md project memory and how context is remembered.',
  },
  {
    key: 'plugins',
    label: 'Plugins',
    icon: '🧩',
    blurb: 'Installable plugins that bundle skills, commands, and MCP servers.',
  },
  {
    key: 'customization',
    label: 'Customization',
    icon: '🎨',
    blurb: 'Output styles, status line, themes, and UX tweaks.',
  },
  {
    key: 'sessions',
    label: 'Sessions',
    icon: '🧵',
    blurb: 'Sessions, context management, and workflow automation.',
  },
];

export function domainOf(key: DomainKey): DomainMeta {
  const found = DOMAINS.find((d) => d.key === key);
  if (!found) {
    throw new Error(`Unknown domain key: ${key}`);
  }
  return found;
}
