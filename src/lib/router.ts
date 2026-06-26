// src/lib/router.ts
import type { Mode } from '../data/types';

export type RouteState = { mode: Mode; params: Record<string, string> };

const MODES: readonly Mode[] = [
  'start',
  'playground',
  'cheatsheet',
  'keyboard',
  'quiz',
];

function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

export function parseHash(hash: string): RouteState {
  const cleaned = hash.replace(/^#/, '').replace(/^\//, '');
  if (cleaned === '') {
    return { mode: 'start', params: {} };
  }
  const queryIndex = cleaned.indexOf('?');
  const path = queryIndex === -1 ? cleaned : cleaned.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : cleaned.slice(queryIndex + 1);

  const segment = path.split('/')[0] ?? '';
  const mode: Mode = isMode(segment) ? segment : 'start';

  const params: Record<string, string> = {};
  if (query !== '') {
    const search = new URLSearchParams(query);
    for (const [key, value] of search.entries()) {
      params[key] = value;
    }
  }
  return { mode, params };
}

export function buildHash(state: RouteState): string {
  const keys = Object.keys(state.params);
  if (keys.length === 0) {
    return `#/${state.mode}`;
  }
  const search = new URLSearchParams(state.params);
  return `#/${state.mode}?${search.toString()}`;
}
