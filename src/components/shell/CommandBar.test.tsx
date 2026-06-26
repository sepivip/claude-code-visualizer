import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';
import { CommandBar } from './CommandBar';

function ModeReadout() {
  const { mode } = useApp();
  return <span data-testid="mode">{mode}</span>;
}

function setup() {
  return render(
    <AppProvider>
      <ModeReadout />
      <CommandBar />
    </AppProvider>,
  );
}

describe('CommandBar', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders one tab per mode', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    ['start', 'playground', 'cheatsheet', 'keyboard', 'quiz'].forEach((m) => {
      expect(
        screen.getByRole('tab', { name: new RegExp(m, 'i') }),
      ).toBeInTheDocument();
    });
  });

  it('marks the active tab with aria-current', () => {
    setup();
    const active = screen.getByRole('tab', { name: /start/i });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('clicking a tab switches the mode', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('tab', { name: /quiz/i }));
    expect(screen.getByTestId('mode')).toHaveTextContent('quiz');
    expect(screen.getByRole('tab', { name: /quiz/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
