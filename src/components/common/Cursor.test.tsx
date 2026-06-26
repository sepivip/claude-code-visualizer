import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Cursor } from './Cursor';

describe('Cursor', () => {
  it('renders a blinking cursor span', () => {
    const { container } = render(<Cursor />);
    const span = container.querySelector('span.cc-cursor');
    expect(span).not.toBeNull();
    expect(span?.getAttribute('aria-hidden')).toBe('true');
  });
});
