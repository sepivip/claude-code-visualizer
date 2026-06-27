// src/components/keyboard/KeyboardVisualizer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { AppProvider } from '../shell/AppContext';
import { KeyboardVisualizer } from './KeyboardVisualizer';

function renderViz() {
  return render(
    <AppProvider>
      <KeyboardVisualizer />
    </AppProvider>,
  );
}

describe('KeyboardVisualizer', () => {
  it('renders root data-testid="keyboard"', () => {
    renderViz();
    expect(screen.getByTestId('keyboard')).toBeInTheDocument();
  });

  it('at least one kb-key has data-state="active" — e.g. the key with data-code="r"', () => {
    renderViz();
    // data-code="r" has Ctrl+R in the catalog → should be active
    const rKey = document.querySelector('[data-testid="kb-key"][data-code="r"]');
    expect(rKey).toBeInTheDocument();
    expect(rKey?.getAttribute('data-state')).toBe('active');
  });

  it('a key with no shortcut (e.g. data-code="f7") is inactive and disabled', () => {
    renderViz();
    const f7 = document.querySelector('[data-testid="kb-key"][data-code="f7"]');
    expect(f7).toBeInTheDocument();
    expect(f7?.getAttribute('data-state')).toBe('inactive');
    expect(f7 as HTMLButtonElement).toBeDisabled();
  });

  it('clicking C key → it becomes selected; a ctrl key becomes partner; panel shows Ctrl+C item', async () => {
    renderViz();

    // Force Windows platform for deterministic chord display (Ctrl+C not ⌃C)
    const winBtn = screen.getByRole('button', { name: 'Windows' });
    await act(async () => {
      fireEvent.click(winBtn);
    });

    const cKey = document.querySelector('[data-testid="kb-key"][data-code="c"]') as HTMLElement;
    expect(cKey).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(cKey);
    });

    // C key becomes selected
    expect(cKey.getAttribute('data-state')).toBe('selected');

    // At least one ctrl key becomes partner
    const ctrlKeys = document.querySelectorAll('[data-testid="kb-key"][data-code="control"]');
    expect(ctrlKeys.length).toBeGreaterThan(0);
    const partnerCtrl = Array.from(ctrlKeys).find(
      (el) => el.getAttribute('data-state') === 'partner',
    );
    expect(partnerCtrl).toBeDefined();

    // shortcut-detail panel contains the Ctrl+C catalog item name (may appear
    // multiple times as chord display + item name — use getAllByText)
    const panel = screen.getByTestId('shortcut-detail');
    expect(within(panel).getAllByText('Ctrl+C').length).toBeGreaterThan(0);
  });

  it('keydown Ctrl+R → data-code="r" key becomes selected, a ctrl key becomes partner', async () => {
    renderViz();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'r', ctrlKey: true });
    });

    const rKey = document.querySelector('[data-testid="kb-key"][data-code="r"]');
    expect(rKey?.getAttribute('data-state')).toBe('selected');

    const ctrlKeys = document.querySelectorAll('[data-testid="kb-key"][data-code="control"]');
    const partnerCtrl = Array.from(ctrlKeys).find(
      (el) => el.getAttribute('data-state') === 'partner',
    );
    expect(partnerCtrl).toBeDefined();
  });

  it('renders shortcut-detail panel', () => {
    renderViz();
    expect(screen.getByTestId('shortcut-detail')).toBeInTheDocument();
  });
});
