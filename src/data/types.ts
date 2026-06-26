// src/data/types.ts
export type Category =
  | 'shortcut'
  | 'slash-command'
  | 'cli-flag'
  | 'setting'
  | 'hook'
  | 'mcp'
  | 'subagent'
  | 'permission-mode'
  | 'memory'
  | 'plugin'
  | 'customization'
  | 'feature'
  | 'concept';

export type Confidence = 'verified' | 'advanced' | 'unverified';

export type Platform = 'mac' | 'win' | 'linux';

export type Mode = 'start' | 'playground' | 'cheatsheet' | 'keyboard' | 'quiz';

export type DomainKey =
  | 'interactive'
  | 'slash'
  | 'cli'
  | 'settings'
  | 'hooks'
  | 'mcp'
  | 'subagents'
  | 'permissions'
  | 'memory'
  | 'plugins'
  | 'customization'
  | 'sessions';

export type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

export interface KeyChord {
  mods: Modifier[];
  key: string;
  raw: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  domain: DomainKey;
  syntax?: string;
  summary: string;
  details?: string;
  example?: string;
  newcomerTip?: string;
  platformNotes?: string;
  source?: string;
  confidence: Confidence;
  keys?: KeyChord[];
}
