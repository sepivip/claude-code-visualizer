import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BoxFrame, CopyButton, Badge, Cursor, Kbd } from './index';

describe('common barrel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('re-exports all five real components', () => {
    expect(typeof BoxFrame).toBe('function');
    expect(typeof CopyButton).toBe('function');
    expect(typeof Badge).toBe('function');
    expect(typeof Cursor).toBe('function');
    expect(typeof Kbd).toBe('function');
  });

  it('re-exports the real variant-aware Badge (variant optional)', () => {
    render(<Badge>advanced</Badge>);
    expect(screen.getByText('advanced').className).toContain('cc-badge-advanced');
  });

  it('re-exports the real CopyButton with Copied! confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton text="x" />);
    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledWith('x');
    await screen.findByText('Copied!');
  });
});
