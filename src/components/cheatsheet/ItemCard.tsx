// src/components/cheatsheet/ItemCard.tsx
import { Badge } from '../common';
import { domainOf } from '../../data/domains';
import type { CatalogItem } from '../../data/types';

export function ItemCard({
  item,
  active = false,
  onOpen,
}: {
  item: CatalogItem;
  active?: boolean;
  onOpen: (i: CatalogItem) => void;
}): JSX.Element {
  const dm = domainOf(item.domain);
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="item-card"
      aria-label={item.name}
      aria-current={active ? 'true' : undefined}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={[
        'flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition',
        active
          ? 'border-[#D97757] bg-neutral-900'
          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-600',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-neutral-100">{item.name}</span>
        {item.confidence === 'advanced' && <Badge variant="advanced">advanced</Badge>}
      </div>
      {item.syntax && (
        <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-[#D97757]">
          {item.syntax}
        </code>
      )}
      <p className="text-sm text-neutral-400">{item.summary}</p>
      <span className="text-xs text-neutral-500">
        <span aria-hidden="true">{dm.icon} </span>
        {dm.label}
      </span>
    </div>
  );
}
