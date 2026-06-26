// src/engine/types.ts
import type { CatalogItem, Mode } from '../data/types';

export type LineKind = 'input' | 'output' | 'error' | 'box' | 'suggestion' | 'system';

export interface TerminalLine {
  id: string;
  kind: LineKind;
  text: string;
  title?: string;
}

export interface CommandContext {
  catalog: CatalogItem[];
}

export interface CommandResult {
  lines: TerminalLine[];
  navigate?: Mode;
  clear?: boolean;
}
