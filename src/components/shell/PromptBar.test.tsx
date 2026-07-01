import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppContextValue } from './AppContext';
import { PromptBar } from './PromptBar';

const submit = vi.fn();

vi.mock('./AppContext', async () => {
  const actual =
    await vi.importActual<typeof import('./AppContext')>('./AppContext');
  return {
    ...actual,
    useApp: (): AppContextValue => ({
      mode: 'playground',
      setMode: vi.fn(),
      params: {},
      setParams: vi.fn(),
      lines: [],
      submit,
      platform: 'mac',
      setPlatform: vi.fn(),
      catalog: [],
    }),
  };
});

describe('PromptBar', () => {
  beforeEach(() => {
    submit.mockClear();
  });

  it('exposes prompt-bar and prompt-input testids with an accessible name', () => {
    render(<PromptBar />);
    expect(screen.getByTestId('prompt-bar')).toBeInTheDocument();
    const input = screen.getByTestId('prompt-input');
    expect(input).toBe(screen.getByRole('textbox', { name: /prompt/i }));
    expect(input.closest('form')).toBeInstanceOf(HTMLFormElement);
  });

  it('shows the current mode label as a pill', () => {
    render(<PromptBar />);
    expect(screen.getByText(/playground/i)).toBeInTheDocument();
  });

  it('submits on Enter then clears the input', async () => {
    const user = userEvent.setup();
    render(<PromptBar />);
    const input = screen.getByRole('textbox', { name: /prompt/i });
    await user.type(input, 'hello{Enter}');
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('hello');
    expect(input).toHaveValue('');
  });

  it('submits via the form (fireEvent.submit) then clears the input', () => {
    render(<PromptBar />);
    const input = screen.getByTestId('prompt-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'world' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('world');
    expect(input).toHaveValue('');
  });

  it('does not submit on empty Enter', async () => {
    const user = userEvent.setup();
    render(<PromptBar />);
    const input = screen.getByRole('textbox', { name: /prompt/i });
    await user.type(input, '{Enter}');
    expect(submit).not.toHaveBeenCalled();
  });

  it('ArrowUp recalls the last submitted entry', async () => {
    const user = userEvent.setup();
    render(<PromptBar />);
    const input = screen.getByRole('textbox', { name: /prompt/i });
    await user.type(input, 'first{Enter}');
    expect(input).toHaveValue('');
    await user.type(input, '{ArrowUp}');
    expect(input).toHaveValue('first');
  });
});
