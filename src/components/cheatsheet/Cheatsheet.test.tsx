import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SearchBox } from './SearchBox';
import { Filters } from './Filters';
import { ItemCard } from './ItemCard';
import { ItemDrawer } from './ItemDrawer';
import { Cheatsheet } from './Cheatsheet';
import { CATALOG } from '../../data/catalog';
import { DOMAINS } from '../../data/domains';
import type { CatalogItem } from '../../data/types';

const clearItem = (): CatalogItem => {
  const found = CATALOG.find((i) => i.name === '/clear');
  if (!found) throw new Error('expected /clear in CATALOG');
  return found;
};

beforeEach(() => {
  window.location.hash = '';
});

describe('SearchBox', () => {
  it('renders an accessible searchbox and focuses on "/"', () => {
    let value = '';
    render(<SearchBox value={value} onChange={(v) => (value = v)} />);
    const input = screen.getByRole('searchbox', { name: /search features/i }) as HTMLInputElement;
    expect(input).toBe(screen.getByLabelText('Search features'));
    expect(input.placeholder).toContain('Search features');
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);
  });

  it('ignores "/" while focus is already in an input', () => {
    render(
      <div>
        <input aria-label="other" />
        <SearchBox value="" onChange={() => {}} />
      </div>,
    );
    const other = screen.getByLabelText('other');
    other.focus();
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(other);
  });
});

describe('Filters', () => {
  it('renders an All chip plus one chip per domain with aria-pressed', () => {
    render(
      <Filters domain={null} category={null} onDomain={() => {}} onCategory={() => {}} />,
    );
    const all = screen.getByRole('button', { name: 'All domains' });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    for (const d of DOMAINS) {
      expect(screen.getByRole('button', { name: d.label })).toBeInTheDocument();
    }
  });
});

describe('ItemCard', () => {
  it('renders item name and fires onOpen', () => {
    const item = clearItem();
    let opened: CatalogItem | null = null;
    render(<ItemCard item={item} onOpen={(i) => (opened = i)} />);
    const card = screen.getByRole('button', { name: new RegExp(item.name, 'i') });
    fireEvent.click(card);
    expect(opened).toBe(item);
  });
});

describe('ItemDrawer', () => {
  it('is a modal dialog and closes on Escape', () => {
    const item = clearItem();
    let closed = false;
    render(<ItemDrawer item={item} onClose={() => (closed = true)} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(closed).toBe(true);
  });
});

describe('Cheatsheet', () => {
  it('renders cards with a results count', () => {
    render(<Cheatsheet />);
    expect(screen.getByTestId('results-count')).toHaveTextContent(/\d+/);
    expect(screen.getAllByTestId('item-card').length).toBeGreaterThan(0);
  });

  it('typing "clear" narrows results so /clear appears', () => {
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'clear' } });
    const grid = screen.getByTestId('results-grid');
    // Multiple /clear items exist in catalog; assert at least one is visible
    expect(within(grid).getAllByText('/clear').length).toBeGreaterThan(0);
  });

  it('selecting a domain filter reduces the set', () => {
    render(<Cheatsheet />);
    const before = screen.getAllByTestId('item-card').length;
    fireEvent.click(screen.getByRole('button', { name: DOMAINS[0].label }));
    const after = screen.getAllByTestId('item-card').length;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
  });

  it('clicking a card opens the drawer with its details', () => {
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'clear' } });
    const grid = screen.getByTestId('results-grid');
    // Multiple /clear items exist; click the first one
    const firstClearText = within(grid).getAllByText('/clear')[0];
    fireEvent.click(firstClearText.closest('[data-testid="item-card"]')!);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByText('/clear').length).toBeGreaterThan(0);
  });

  it('a no-match query shows the empty state', () => {
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'zzzznotathing_qqq' } });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('Arrow Down then Enter opens the drawer', () => {
    render(<Cheatsheet />);
    const grid = screen.getByTestId('results-grid');
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not set its own surface-* testid (App.tsx owns surface-cheatsheet)', () => {
    render(<Cheatsheet />);
    expect(screen.queryByTestId('surface-cheatsheet')).toBeNull();
  });
});
