// src/components/cheatsheet/Filters.tsx
import { DOMAINS } from '../../data/domains';
import type { Category, DomainKey } from '../../data/types';

const CATEGORIES: Category[] = [
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
];

function chipClass(active: boolean): string {
  return [
    'rounded-full border px-3 py-1 text-sm transition',
    active
      ? 'border-[#D97757] bg-[#D97757]/20 text-[#D97757]'
      : 'border-neutral-700 text-neutral-300 hover:border-neutral-500',
  ].join(' ');
}

export function Filters({
  domain,
  category,
  onDomain,
  onCategory,
}: {
  domain: DomainKey | null;
  category: Category | null;
  onDomain: (d: DomainKey | null) => void;
  onCategory: (c: Category | null) => void;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Domain filters">
        <button
          type="button"
          aria-label="All domains"
          aria-pressed={domain === null}
          className={chipClass(domain === null)}
          onClick={() => onDomain(null)}
        >
          All
        </button>
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            type="button"
            aria-label={d.label}
            aria-pressed={domain === d.key}
            className={chipClass(domain === d.key)}
            onClick={() => onDomain(domain === d.key ? null : d.key)}
          >
            <span aria-hidden="true">{d.icon} </span>
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
        <button
          type="button"
          aria-label="All categories"
          aria-pressed={category === null}
          className={chipClass(category === null)}
          onClick={() => onCategory(null)}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={category === c}
            className={chipClass(category === c)}
            onClick={() => onCategory(category === c ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
