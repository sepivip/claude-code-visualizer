import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the trainer heading', () => {
    render(<App />);
    expect(screen.getByText(/Claude Code/i)).toBeInTheDocument();
  });
});
