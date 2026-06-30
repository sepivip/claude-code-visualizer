// src/components/start/Start.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../shell/AppContext';
import { Start } from './Start';
import { TRACK } from './track';
import { load } from '../../lib/storage';

function renderStart() {
  return render(
    <AppProvider>
      <Start />
    </AppProvider>,
  );
}

/** Probe component that reads the current app mode into the DOM. */
function Probe(): JSX.Element {
  const { mode } = useApp();
  return <span data-testid="probe-mode">{mode}</span>;
}

beforeEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
});

describe('Start', () => {
  it('renders data-testid="start" and NOT "surface-start"', () => {
    renderStart();
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.queryByTestId('surface-start')).toBeNull();
  });

  it('renders all 5 chapter nav items', () => {
    renderStart();
    const items = screen.getAllByTestId('chapter-nav-item');
    expect(items).toHaveLength(TRACK.length);
    // Each chapter title should appear inside a nav item
    for (const ch of TRACK) {
      expect(screen.getAllByText(ch.title).length).toBeGreaterThan(0);
    }
  });

  it('shows progress bar with 0/5 initially', () => {
    renderStart();
    const bar = screen.getByTestId('track-progress');
    expect(bar).toHaveTextContent('0/5');
  });

  it('shows the first uncompleted chapter content by default', () => {
    renderStart();
    const content = screen.getByTestId('chapter-content');
    // Chapter 1 blurb should be visible
    expect(content).toHaveTextContent(TRACK[0].blurb);
  });

  it('clicking a different chapter nav item swaps the content', async () => {
    const user = userEvent.setup();
    renderStart();

    // Click the second chapter nav item
    const navItems = screen.getAllByTestId('chapter-nav-item');
    await user.click(navItems[1]);

    const content = screen.getByTestId('chapter-content');
    expect(content).toHaveTextContent(TRACK[1].blurb);
  });

  it('"Mark complete" toggles completion and bumps the progress bar', async () => {
    const user = userEvent.setup();
    renderStart();

    // Initially 0/5
    expect(screen.getByTestId('track-progress')).toHaveTextContent('0/5');

    const completeBtn = screen.getByTestId('chapter-complete');
    expect(completeBtn).toHaveTextContent('Mark complete');

    await user.click(completeBtn);

    // Progress bar should now show 1/5
    expect(screen.getByTestId('track-progress')).toHaveTextContent('1/5');
    // Button text should reflect completion
    expect(screen.getByTestId('chapter-complete')).toHaveTextContent('✓ Completed');
  });

  it('"Mark complete" persists to localStorage', async () => {
    const user = userEvent.setup();
    renderStart();

    await user.click(screen.getByTestId('chapter-complete'));

    // Check that the active chapter id is saved in storage
    const saved = load<string[]>('guided-progress', []);
    expect(saved).toContain(TRACK[0].id);
  });

  it('a fresh render reflects previously saved progress', async () => {
    const user = userEvent.setup();
    // First render: mark chapter 1 complete
    const { unmount } = renderStart();
    await user.click(screen.getByTestId('chapter-complete'));
    unmount();

    // Second render: should still show 1/5
    renderStart();
    expect(screen.getByTestId('track-progress')).toHaveTextContent('1/5');
  });

  it('"Mark complete" can be toggled off (unchecks)', async () => {
    const user = userEvent.setup();
    renderStart();

    const btn = screen.getByTestId('chapter-complete');
    await user.click(btn); // mark complete
    expect(screen.getByTestId('track-progress')).toHaveTextContent('1/5');

    await user.click(screen.getByTestId('chapter-complete')); // unmark
    expect(screen.getByTestId('track-progress')).toHaveTextContent('0/5');
  });

  it('CTA button on chapter 1 (prompt) navigates to playground', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <Probe />
        <Start />
      </AppProvider>,
    );

    // Initial mode should be 'start'
    expect(screen.getByTestId('probe-mode')).toHaveTextContent('start');

    const cta = screen.getByTestId('chapter-cta');
    await user.click(cta);

    expect(window.location.hash).toContain('playground');
  });

  it('CTA button on slash chapter navigates to cheatsheet', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <Probe />
        <Start />
      </AppProvider>,
    );

    // Navigate to the slash chapter (id='slash', index 2)
    const navItems = screen.getAllByTestId('chapter-nav-item');
    const slashIndex = TRACK.findIndex((ch) => ch.id === 'slash');
    await user.click(navItems[slashIndex]);

    // Verify we're on the slash chapter
    expect(screen.getByTestId('chapter-content')).toHaveTextContent(TRACK[slashIndex].blurb);

    // Click CTA
    await user.click(screen.getByTestId('chapter-cta'));

    expect(window.location.hash).toContain('cheatsheet');
  });

  it('active chapter nav item has aria-current="step"', () => {
    renderStart();
    const navItems = screen.getAllByTestId('chapter-nav-item');
    // First item should be active by default
    expect(navItems[0]).toHaveAttribute('aria-current', 'step');
    // Others should not
    for (let i = 1; i < navItems.length; i++) {
      expect(navItems[i]).not.toHaveAttribute('aria-current');
    }
  });

  it('shows completion banner when all chapters are marked complete', async () => {
    const user = userEvent.setup();
    renderStart();

    const navItems = screen.getAllByTestId('chapter-nav-item');

    for (let i = 0; i < TRACK.length; i++) {
      await user.click(navItems[i]);
      await user.click(screen.getByTestId('chapter-complete'));
    }

    expect(screen.getByText(/you've finished the tour/i)).toBeInTheDocument();
  });

  it('chapter content shows keys & commands section', () => {
    renderStart();
    // Chapter 1 has keys defined
    expect(screen.getByText(/keys & commands/i)).toBeInTheDocument();
    // Check a specific key chip from chapter 1
    const content = screen.getByTestId('chapter-content');
    expect(within(content).getByText('Enter')).toBeInTheDocument();
  });
});
