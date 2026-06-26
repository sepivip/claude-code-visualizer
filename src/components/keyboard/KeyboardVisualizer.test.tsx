// src/components/keyboard/KeyboardVisualizer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CATALOG } from '../../data/catalog';
import { AppProvider } from '../shell/AppContext';
import { buildShortcutIndex, type ShortcutHit } from './shortcutIndex';
import { KeyboardVisualizer } from './KeyboardVisualizer';
import { displayChord } from '../../lib/keys';

// Pick a real single-letter key that has a Ctrl-modified chord in the index
// built from the REAL generated CATALOG, so assertions stay robust to content.
// Falls back to 'r' (the documented expected Ctrl+R shortcut).
function pickCtrlLetterKey(index: Record<string, ShortcutHit[]>): { key: string; hit: ShortcutHit } {
  for (const [key, hits] of Object.entries(index)) {
    if (!/^[a-z]$/.test(key)) continue;
    const hit = hits.find((h) => h.chord.mods.includes('ctrl') && h.chord.key === key);
    if (hit) return { key, hit };
  }
  // Fallback: construct a minimal hit for 'r' so the type is consistent
  const fallbackHits = index['r'] ?? [];
  const fallbackHit = fallbackHits.find((h) => h.chord.mods.includes('ctrl')) ?? fallbackHits[0];
  if (!fallbackHit) throw new Error('No ctrl+r shortcut in CATALOG – update the fallback key');
  return { key: 'r', hit: fallbackHit };
}

const INDEX = buildShortcutIndex(CATALOG);
const { key: CTRL_KEY, hit: CTRL_HIT } = pickCtrlLetterKey(INDEX);

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
    // Force a deterministic non-mac platform so displayChord produces "Ctrl+<key>"
    // rather than mac symbols (⌃<key>). Click the Windows platform toggle button.
    fireEvent.click(screen.getByRole('button', { name: 'Windows' }));
    fireEvent.click(keyButton(CTRL_KEY));
    const panel = screen.getByTestId('shortcut-detail');
    // Compute the expected label via the real displayChord to ensure the assertion
    // exercises displayChord logic and fails if displayChord is broken.
    const expectedChord = displayChord(CTRL_HIT.chord, 'win');
    expect(within(panel).getAllByText(expectedChord).length).toBeGreaterThan(0);
  });

  it('a real ctrl+<key> keydown selects that key', () => {
    renderViz();
    fireEvent.keyDown(window, { key: CTRL_KEY, ctrlKey: true });
    expect(keyButton(CTRL_KEY).getAttribute('data-selected')).toBe('true');
  });
});
