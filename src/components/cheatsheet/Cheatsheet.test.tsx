import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import { SearchBox } from './SearchBox';
import { Filters } from './Filters';
import { ItemCard } from './ItemCard';
import { ItemDrawer } from './ItemDrawer';
import { Cheatsheet } from './Cheatsheet';
import { AppProvider } from '../shell/AppContext';
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

afterEach(() => {
  vi.restoreAllMocks();
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

describe('Cheatsheet — deep-link seeding', () => {
  it('seeds query from URL ?q= param on mount (via AppProvider)', () => {
    window.location.hash = '#/cheatsheet?q=clear';
    render(
      <AppProvider>
        <Cheatsheet />
      </AppProvider>,
    );
    const input = screen.getByRole('searchbox', { name: /search features/i }) as HTMLInputElement;
    expect(input.value).toBe('clear');
    const grid = screen.getByTestId('results-grid');
    expect(within(grid).getAllByText('/clear').length).toBeGreaterThan(0);
  });

  it('seeds category filter from URL ?cat= param on mount (via AppProvider)', () => {
    window.location.hash = '#/cheatsheet?cat=slash-command';
    render(
      <AppProvider>
        <Cheatsheet />
      </AppProvider>,
    );
    // All visible cards should be in the slash-command category
    const cards = screen.getAllByTestId('item-card');
    expect(cards.length).toBeGreaterThan(0);
    // The slash-command category button should be active (aria-pressed=true)
    const catBtn = screen.getByRole('button', { name: 'slash-command' });
    expect(catBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('ignores invalid ?cat= values (no filter applied)', () => {
    window.location.hash = '#/cheatsheet?cat=not-a-real-category';
    render(
      <AppProvider>
        <Cheatsheet />
      </AppProvider>,
    );
    // All categories btn should be active
    const allCatBtn = screen.getByRole('button', { name: 'All categories' });
    expect(allCatBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('ignores invalid ?d= values (no domain filter applied)', () => {
    window.location.hash = '#/cheatsheet?d=garbage-domain';
    render(
      <AppProvider>
        <Cheatsheet />
      </AppProvider>,
    );
    const allDomainBtn = screen.getByRole('button', { name: 'All domains' });
    expect(allDomainBtn.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Cheatsheet — URL sync (replaceState)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('typing in the search updates window.location.hash with ?q= after debounce', async () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });

    fireEvent.change(input, { target: { value: 'compact' } });

    // Before debounce fires, replaceState should not have been called with the new value
    // Advance timers past the 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(replaceSpy).toHaveBeenCalled();
    const lastCall = replaceSpy.mock.calls[replaceSpy.mock.calls.length - 1];
    const hashArg = lastCall[2] as string;
    expect(hashArg).toContain('q=compact');
  });

  it('replaceState is used (not pushState) so no history entries are added', async () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });

    fireEvent.change(input, { target: { value: 'hook' } });

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(replaceSpy).toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
  });
});

describe('Cheatsheet — copy link button', () => {
  it('renders the copy link button with correct testid', () => {
    render(<Cheatsheet />);
    expect(screen.getByTestId('cheatsheet-copylink')).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText with current URL and shows "Copied!"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<Cheatsheet />);
    const btn = screen.getByTestId('cheatsheet-copylink');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });

    await waitFor(() => {
      expect(btn).toHaveTextContent('Copied!');
    });
  });

  it('copy link button contains the current query in the URL after typing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<Cheatsheet />);
    const input = screen.getByRole('searchbox', { name: /search features/i });
    fireEvent.change(input, { target: { value: 'clear' } });

    // Flush debounce so replaceState updates window.location
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    const btn = screen.getByTestId('cheatsheet-copylink');
    fireEvent.click(btn);

    // Use real timers for waitFor so it doesn't hang
    vi.useRealTimers();

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      const calledUrl = writeText.mock.calls[0][0] as string;
      expect(calledUrl).toContain('clear');
    });
  });
});
