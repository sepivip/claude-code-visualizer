import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders the label', () => {
    render(<Badge variant="advanced">Advanced</Badge>);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('defaults to the advanced variant when none is given', () => {
    render(<Badge>advanced</Badge>);
    expect(screen.getByText('advanced').className).toContain('cc-badge-advanced');
  });

  it('applies a variant-specific class', () => {
    render(<Badge variant="domain">slash</Badge>);
    const el = screen.getByText('slash');
    expect(el.className).toContain('cc-badge-domain');
  });

  it('applies the category variant class', () => {
    render(<Badge variant="category">hook</Badge>);
    expect(screen.getByText('hook').className).toContain('cc-badge-category');
  });
});
