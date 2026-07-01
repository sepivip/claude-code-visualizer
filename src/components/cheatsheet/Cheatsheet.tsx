// src/components/cheatsheet/Cheatsheet.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchBox } from './SearchBox';
import { Filters } from './Filters';
import { ItemCard } from './ItemCard';
import { ItemDrawer } from './ItemDrawer';
import { CATALOG } from '../../data/catalog';
import { searchCatalog } from '../../lib/search';
import { useOptionalApp } from '../shell/AppContext';
import { buildHash } from '../../lib/router';
import { DOMAINS } from '../../data/domains';
import type { CatalogItem, Category, DomainKey } from '../../data/types';

const VALID_DOMAIN_KEYS = new Set<string>(DOMAINS.map((d) => d.key));

const VALID_CATEGORIES = new Set<string>([
  'shortcut',
  'slash-command',
  'cli-flag',
  'setting',
  'hook',
  'mcp',
  'subagent',
  'permission-mode',
  'memory',
  'plugin',
  'customization',
  'feature',
  'concept',
]);

function parseDomain(raw: string | undefined): DomainKey | null {
  if (raw !== undefined && VALID_DOMAIN_KEYS.has(raw)) return raw as DomainKey;
  return null;
}

function parseCategory(raw: string | undefined): Category | null {
  if (raw !== undefined && VALID_CATEGORIES.has(raw)) return raw as Category;
  return null;
}

export function Cheatsheet(): JSX.Element {
  const app = useOptionalApp();
  const [query, setQuery] = useState(app?.params.q ?? '');
  const [domain, setDomain] = useState<DomainKey | null>(() =>
    parseDomain(app?.params.d),
  );
  const [category, setCategory] = useState<Category | null>(() =>
    parseCategory(app?.params.cat),
  );
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [cursor, setCursor] = useState(-1);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync filters → URL via replaceState (no history spam, debounced for query)
  useEffect(() => {
    const params: Record<string, string> = {};
    if (query !== '') params['q'] = query;
    if (domain !== null) params['d'] = domain;
    if (category !== null) params['cat'] = category;

    if (syncTimerRef.current !== null) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const hash = buildHash({ mode: 'cheatsheet', params });
      window.history.replaceState(null, '', hash);
    }, 300);

    return () => {
      if (syncTimerRef.current !== null) clearTimeout(syncTimerRef.current);
    };
  }, [query, domain, category]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    };
  }, []);

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

  const handleCopyLink = (): void => {
    const clipboard = navigator.clipboard;
    if (clipboard === undefined || typeof clipboard.writeText !== 'function') return;
    void clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBox
            value={query}
            onChange={(v) => {
              setQuery(v);
              setCursor(-1);
            }}
          />
        </div>
        <button
          type="button"
          data-testid="cheatsheet-copylink"
          onClick={handleCopyLink}
          className="shrink-0 rounded border border-[#D97757]/50 px-3 py-2 font-mono text-xs text-[#D97757] transition hover:border-[#D97757] hover:bg-[#D97757]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]"
        >
          <span aria-live="polite">{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
      </div>
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
          tabIndex={0}
          aria-label="Search results"
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
