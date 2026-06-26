import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';

function Probe() {
  const { mode, lines, submit } = useApp();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <ul data-testid="lines">
        {lines.map((l) => (
          <li key={l.id} data-id={l.id} data-kind={l.kind}>
            {l.text}
          </li>
        ))}
      </ul>
      <button onClick={() => submit('hi')}>hi</button>
      <button onClick={() => submit('/clear')}>clear</button>
      <button onClick={() => submit('/keyboard')}>kbd</button>
    </div>
  );
}

function setup() {
  return render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('useApp throws without a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Bad = () => {
      useApp();
      return null;
    };
    expect(() => render(<Bad />)).toThrow(/AppProvider/);
    spy.mockRestore();
  });

  it('submit("hi") appends an input echo plus result lines with unique ids', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'hi' }));
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]).toHaveAttribute('data-kind', 'input');
    expect(items[0]).toHaveTextContent('hi');
    const ids = items.map((el) => el.getAttribute('data-id'));
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^turn-\d+$/));
  });

  it('submit("/clear") empties the lines', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'hi' }));
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.queryAllByRole('listitem').length).toBe(0);
  });

  it('submit("/keyboard") navigates mode to keyboard', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByTestId('mode')).not.toHaveTextContent('keyboard');
    await user.click(screen.getByRole('button', { name: 'kbd' }));
    expect(screen.getByTestId('mode')).toHaveTextContent('keyboard');
  });

  it('ids stay unique across multiple submits', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'hi' }));
    await user.click(screen.getByRole('button', { name: 'hi' }));
    const ids = screen
      .getAllByRole('listitem')
      .map((el) => el.getAttribute('data-id'));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
