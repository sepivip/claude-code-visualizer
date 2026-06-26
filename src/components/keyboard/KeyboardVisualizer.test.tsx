// src/components/keyboard/KeyboardVisualizer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CATALOG } from '../../data/catalog';
import { AppProvider } from '../shell/AppContext';
import { buildShortcutIndex, type ShortcutHit } from './shortcutIndex';
import { KeyboardVisualizer } from './KeyboardVisualizer';

// Pick a real single-letter key that has a Ctrl-modified chord in the index
// built from the REAL generated CATALOG, so assertions stay robust to content.
// Falls back to 'r' (the documented expected Ctrl+R shortcut).
function pickCtrlLetterKey(index: Record<string, ShortcutHit[]>): string {
  for (const [key, hits] of Object.entries(index)) {
    if (!/^[a-z]$/.test(key)) continue;
    if (hits.some((h) => h.chord.mods.includes('ctrl') && h.chord.key === key)) {
      return key;
    }
  }
  return 'r';
}

const INDEX = buildShortcutIndex(CATALOG);
const CTRL_KEY = pickCtrlLetterKey(INDEX);

function renderViz() {
  return render(
    <AppProvider>
      <KeyboardVisualizer />
    </AppProvider>,
  );
}

function keyButton(key: string): HTMLElement {
  const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!el) throw new Error(`key ${key} not rendered`);
  return el as HTMLElement;
}

describe('KeyboardVisualizer', () => {
  it('renders the keyboard surface root with the canonical testid', () => {
    renderViz();
    expect(screen.getByTestId('keyboard')).toBeInTheDocument();
  });

  it('renders keyboard keys including the chosen ctrl key', () => {
    renderViz();
    expect(keyButton(CTRL_KEY)).toBeInTheDocument();
  });

  it('activating Ctrl highlights the chosen ctrl key', () => {
    renderViz();
    expect(keyButton(CTRL_KEY).getAttribute('data-highlighted')).toBe('false');
    // Click the Ctrl button in the ModifierBar (has aria-label="Ctrl")
    fireEvent.click(screen.getByRole('button', { name: /^ctrl$/i }));
    expect(keyButton(CTRL_KEY).getAttribute('data-highlighted')).toBe('true');
  });

  it('clicking a key shows its shortcut detail with the displayed chord', () => {
    renderViz();
    fireEvent.click(keyButton(CTRL_KEY));
    const panel = screen.getByTestId('shortcut-detail');
    const expected = new RegExp(`Ctrl\\+${CTRL_KEY}`, 'i');
    // There may be multiple elements (chord display + item name) — assert at least one
    expect(within(panel).getAllByText(expected).length).toBeGreaterThan(0);
  });

  it('a real ctrl+<key> keydown selects that key', () => {
    renderViz();
    fireEvent.keyDown(window, { key: CTRL_KEY, ctrlKey: true });
    expect(keyButton(CTRL_KEY).getAttribute('data-selected')).toBe('true');
  });
});
