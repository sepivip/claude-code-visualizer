// src/components/playground/Playground.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useApp } from '../shell/AppContext';
import { Playground } from './Playground';

function Harness() {
  const { submit } = useApp();
  return (
    <div>
      <button onClick={() => submit('/help')}>go</button>
      <Playground />
    </div>
  );
}

describe('Playground', () => {
  it('renders the welcome box persistently at the top', () => {
    render(
      <AppProvider>
        <Playground />
      </AppProvider>,
    );
    const welcome = screen.getByTestId('welcome');
    expect(welcome).toBeInTheDocument();
    expect(welcome).toHaveTextContent(/Welcome to the Claude Code Trainer/i);
    expect(
      screen.getByText(/Type \/help to see commands, or click a tab above/i),
    ).toBeInTheDocument();
  });

  it('always renders an empty scrollback container before any submit', () => {
    render(
      <AppProvider>
        <Playground />
      </AppProvider>,
    );
    expect(screen.getByTestId('scrollback')).toBeInTheDocument();
  });

  it('keeps the welcome box and appends a Commands box after submit("/help")', () => {
    render(
      <AppProvider>
        <Harness />
      </AppProvider>,
    );
    act(() => {
      screen.getByText('go').click();
    });
    // Welcome box is persistent — it stays visible after submitting.
    expect(screen.getByTestId('welcome')).toBeInTheDocument();
    // The /help command yields a `box` line titled "Commands" inside scrollback.
    expect(screen.getByTestId('scrollback')).toHaveTextContent(/Commands/i);
  });

  it('does not set its own surface testid (injected by App wrapper)', () => {
    render(
      <AppProvider>
        <Playground />
      </AppProvider>,
    );
    expect(screen.queryByTestId('surface-playground')).not.toBeInTheDocument();
  });
});
