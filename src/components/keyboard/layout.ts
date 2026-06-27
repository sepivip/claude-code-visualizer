// src/components/keyboard/layout.ts
import type { Modifier } from '../../data/types';

export interface KeyDef {
  id: string;
  label: string;
  code: string;
  mod?: Modifier;
  w?: number;
  spacer?: boolean;
}

export interface KeyboardLayout {
  main: KeyDef[][];
  system: KeyDef[];
  nav: KeyDef[][];
  arrows: KeyDef[][];
}

function letter(ch: string): KeyDef {
  return { id: `key-${ch}`, label: ch.toUpperCase(), code: ch };
}

let _spCount = 0;
function sp(w: number): KeyDef {
  return { id: `spacer-${w}-${++_spCount}`, label: '', code: '', spacer: true, w };
}

const functionRow: KeyDef[] = [
  { id: 'escape', label: 'Esc', code: 'escape' },
  sp(0.5),
  { id: 'f1', label: 'F1', code: 'f1' },
  { id: 'f2', label: 'F2', code: 'f2' },
  { id: 'f3', label: 'F3', code: 'f3' },
  { id: 'f4', label: 'F4', code: 'f4' },
  sp(0.5),
  { id: 'f5', label: 'F5', code: 'f5' },
  { id: 'f6', label: 'F6', code: 'f6' },
  { id: 'f7', label: 'F7', code: 'f7' },
  { id: 'f8', label: 'F8', code: 'f8' },
  sp(0.5),
  { id: 'f9', label: 'F9', code: 'f9' },
  { id: 'f10', label: 'F10', code: 'f10' },
  { id: 'f11', label: 'F11', code: 'f11' },
  { id: 'f12', label: 'F12', code: 'f12' },
];

const numberRow: KeyDef[] = [
  { id: 'backtick', label: '`', code: '`' },
  { id: 'key-1', label: '1', code: '1' },
  { id: 'key-2', label: '2', code: '2' },
  { id: 'key-3', label: '3', code: '3' },
  { id: 'key-4', label: '4', code: '4' },
  { id: 'key-5', label: '5', code: '5' },
  { id: 'key-6', label: '6', code: '6' },
  { id: 'key-7', label: '7', code: '7' },
  { id: 'key-8', label: '8', code: '8' },
  { id: 'key-9', label: '9', code: '9' },
  { id: 'key-0', label: '0', code: '0' },
  { id: 'minus', label: '-', code: '-' },
  { id: 'equal', label: '=', code: '=' },
  { id: 'backspace', label: 'Backspace', code: 'backspace', w: 2 },
];

const tabRow: KeyDef[] = [
  { id: 'tab', label: 'Tab', code: 'tab', w: 1.5 },
  letter('q'), letter('w'), letter('e'), letter('r'), letter('t'),
  letter('y'), letter('u'), letter('i'), letter('o'), letter('p'),
  { id: 'bracket-l', label: '[', code: '[' },
  { id: 'bracket-r', label: ']', code: ']' },
  { id: 'backslash', label: '\\', code: '\\', w: 1.5 },
];

const capsRow: KeyDef[] = [
  { id: 'capslock', label: 'Caps', code: 'capslock', w: 1.75 },
  letter('a'), letter('s'), letter('d'), letter('f'), letter('g'),
  letter('h'), letter('j'), letter('k'), letter('l'),
  { id: 'semicolon', label: ';', code: ';' },
  { id: 'quote', label: "'", code: "'" },
  { id: 'enter', label: 'Enter', code: 'enter', w: 2.25 },
];

const shiftRow: KeyDef[] = [
  { id: 'shift-l', label: 'Shift', code: 'shift', mod: 'shift', w: 2.25 },
  letter('z'), letter('x'), letter('c'), letter('v'), letter('b'),
  letter('n'), letter('m'),
  { id: 'comma', label: ',', code: ',' },
  { id: 'period', label: '.', code: '.' },
  { id: 'slash', label: '/', code: '/' },
  { id: 'shift-r', label: 'Shift', code: 'shift', mod: 'shift', w: 2.75 },
];

const bottomRow: KeyDef[] = [
  { id: 'ctrl-l', label: 'Ctrl', code: 'control', mod: 'ctrl', w: 1.25 },
  { id: 'meta-l', label: 'Win', code: 'meta', mod: 'meta', w: 1.25 },
  { id: 'alt-l', label: 'Alt', code: 'alt', mod: 'alt', w: 1.25 },
  { id: 'space', label: 'Space', code: 'space', w: 6.25 },
  { id: 'alt-r', label: 'Alt', code: 'alt', mod: 'alt', w: 1.25 },
  { id: 'meta-r', label: 'Win', code: 'meta', mod: 'meta', w: 1.25 },
  { id: 'menu', label: 'Menu', code: 'contextmenu', w: 1.25 },
  { id: 'ctrl-r', label: 'Ctrl', code: 'control', mod: 'ctrl', w: 1.25 },
];

export const LAYOUT: KeyboardLayout = {
  main: [
    functionRow,
    numberRow,
    tabRow,
    capsRow,
    shiftRow,
    bottomRow,
  ],
  system: [
    { id: 'printscreen', label: 'PrtSc', code: 'printscreen' },
    { id: 'scrolllock', label: 'ScrLk', code: 'scrolllock' },
    { id: 'pause', label: 'Pause', code: 'pause' },
  ],
  nav: [
    [
      { id: 'insert', label: 'Ins', code: 'insert' },
      { id: 'home', label: 'Home', code: 'home' },
      { id: 'pageup', label: 'PgUp', code: 'pageup' },
    ],
    [
      { id: 'delete', label: 'Del', code: 'delete' },
      { id: 'end', label: 'End', code: 'end' },
      { id: 'pagedown', label: 'PgDn', code: 'pagedown' },
    ],
  ],
  arrows: [
    [
      { id: 'arrow-spacer-l', label: '', code: '', spacer: true, w: 1 },
      { id: 'arrowup', label: '↑', code: 'arrowup' },
      { id: 'arrow-spacer-r', label: '', code: '', spacer: true, w: 1 },
    ],
    [
      { id: 'arrowleft', label: '←', code: 'arrowleft' },
      { id: 'arrowdown', label: '↓', code: 'arrowdown' },
      { id: 'arrowright', label: '→', code: 'arrowright' },
    ],
  ],
};

export const ALL_KEYS: KeyDef[] = [
  ...LAYOUT.main.flat(),
  ...LAYOUT.system,
  ...LAYOUT.nav.flat(),
  ...LAYOUT.arrows.flat(),
].filter((k) => !k.spacer);

// Legacy export for any callers that haven't migrated yet (unused in new code)
export type LegacyKeyDef = { label: string; key: string; isMod?: boolean };
export const KEY_ROWS: LegacyKeyDef[][] = LAYOUT.main.map((row) =>
  row
    .filter((k) => !k.spacer)
    .map((k) => ({ label: k.label, key: k.mod ? k.mod : k.code, isMod: k.mod !== undefined })),
);
