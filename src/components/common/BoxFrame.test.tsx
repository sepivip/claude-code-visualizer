import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoxFrame } from './BoxFrame';

describe('BoxFrame', () => {
  it('renders the title and children', () => {
    render(
      <BoxFrame title="Welcome">
        <span>Inside content</span>
      </BoxFrame>,
    );
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Inside content')).toBeInTheDocument();
  });

  it('renders children without a title', () => {
    render(
      <BoxFrame>
        <span>No title here</span>
      </BoxFrame>,
    );
    expect(screen.getByText('No title here')).toBeInTheDocument();
  });
});
