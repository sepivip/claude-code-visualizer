import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls clipboard.writeText with the text and shows Copied!', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton text="claude --help" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith('claude --help');

    await vi.waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('does not throw when clipboard is missing', () => {
    Object.assign(navigator, { clipboard: undefined });
    render(<CopyButton text="x" />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });
});
