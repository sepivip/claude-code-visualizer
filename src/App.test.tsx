import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
});

describe('App integration', () => {
  it('renders inside the provider with the prompt bar visible', () => {
    render(<App />);
    expect(screen.getByTestId('prompt-bar')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input')).toBeInTheDocument();
  });

  it('shows the Start surface by default', () => {
    render(<App />);
    // Start is eager — no need to await
    expect(screen.getByTestId('surface-start')).toBeInTheDocument();
  });

  it('switches to the cheatsheet surface when the Cheatsheet tab is clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /cheatsheet/i }));
    // Cheatsheet is lazy — wait for it to resolve
    expect(await screen.findByTestId('surface-cheatsheet')).toBeInTheDocument();
    expect(screen.queryByTestId('surface-start')).not.toBeInTheDocument();
  });

  it('switches surface when a nav slash command is submitted through the prompt', async () => {
    render(<App />);
    const input = screen.getByTestId('prompt-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '/keyboard' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    // Keyboard is lazy — wait for it to resolve
    expect(await screen.findByTestId('surface-keyboard')).toBeInTheDocument();
  });

  it('reacts to external hash changes', async () => {
    render(<App />);
    window.location.hash = '#/cheatsheet';
    fireEvent(window, new HashChangeEvent('hashchange'));
    // Cheatsheet is lazy — wait for it to resolve
    expect(await screen.findByTestId('surface-cheatsheet')).toBeInTheDocument();
  });

  it('navigates from the Start track CTA to the playground', async () => {
    render(<App />);
    const start = screen.getByTestId('surface-start');
    fireEvent.click(within(start).getByRole('button', { name: /try the prompt/i }));
    // Playground is lazy — wait for it to resolve
    expect(await screen.findByTestId('surface-playground')).toBeInTheDocument();
  });
});
