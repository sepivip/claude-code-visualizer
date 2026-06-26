// src/components/cheatsheet/Cheatsheet.tsx
import { useMemo, useState } from 'react';
import { SearchBox } from './SearchBox';
import { Filters } from './Filters';
import { ItemCard } from './ItemCard';
import { ItemDrawer } from './ItemDrawer';
import { CATALOG } from '../../data/catalog';
import { searchCatalog } from '../../lib/search';
import { useOptionalApp } from '../shell/AppContext';
import type { CatalogItem, Category, DomainKey } from '../../data/types';

export function Cheatsheet(): JSX.Element {
  const app = useOptionalApp();
  const [query, setQuery] = useState(app?.params.q ?? '');
  const [domain, setDomain] = useState<DomainKey | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [cursor, setCursor] = useState(-1);

  const list = useMemo<CatalogItem[]>(() => {
    const ranked = searchCatalog(CATALOG, query).map((r) => r.item);
    return ranked.filter(
      (i) =>
        (domain === null || i.domain === domain) &&
        (category === null || i.category === category),
    );
  }, [query, domain, category]);

  const onGridKey = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(list.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = cursor < 0 ? 0 : cursor;
      if (list[idx]) setSelected(list[idx]);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <SearchBox
        value={query}
        onChange={(v) => {
          setQuery(v);
          setCursor(-1);
        }}
      />
      <Filters
        domain={domain}
        category={category}
        onDomain={(d) => {
          setDomain(d);
          setCursor(-1);
        }}
        onCategory={(c) => {
          setCategory(c);
          setCursor(-1);
        }}
      />
      <p data-testid="results-count" className="text-sm text-neutral-500">
        {list.length} result{list.length === 1 ? '' : 's'}
      </p>

      {list.length === 0 ? (
        <div data-testid="empty-state" className="text-neutral-500">
          No features match your search.
        </div>
      ) : (
        <div
          data-testid="results-grid"
          role="listbox"
          tabIndex={0}
          aria-label="Results"
          onKeyDown={onGridKey}
          className="grid grid-cols-1 gap-3 overflow-y-auto outline-none sm:grid-cols-2 lg:grid-cols-3"
        >
          {list.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              active={i === cursor}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      {selected && <ItemDrawer item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
