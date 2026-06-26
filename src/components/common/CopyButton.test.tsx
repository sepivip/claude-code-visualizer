import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Drain pending timers inside act so React state updates (e.g. setCopied(false)
    // from the 1500 ms reset) are flushed without triggering act() warnings.
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls clipboard.writeText with the text and shows Copied!', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton text="claude --help" />);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
      // Flush the microtask queue so the resolved Promise .then(setCopied) runs
      // inside act() and React processes the state update synchronously.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('claude --help');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('does not throw when clipboard is missing', () => {
    Object.assign(navigator, { clipboard: undefined });
    render(<CopyButton text="x" />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });
});
