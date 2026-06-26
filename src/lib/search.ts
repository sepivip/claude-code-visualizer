// src/lib/search.ts
import type { CatalogItem } from '../data/types';

export type SearchResult = { item: CatalogItem; score: number };

type WeightedField = { value: string; weight: number };

const STARTS_WITH_BONUS = 0.5;

function fieldsOf(item: CatalogItem): WeightedField[] {
  const fields: WeightedField[] = [
    { value: item.name, weight: 5 },
    { value: item.summary, weight: 2 },
    { value: item.domain, weight: 1 },
  ];
  if (item.syntax) {
    fields.push({ value: item.syntax, weight: 3 });
  }
  return fields;
}

function tokenScore(item: CatalogItem, token: string): number {
  let best = 0;
  for (const field of fieldsOf(item)) {
    const value = field.value.toLowerCase();
    if (!value.includes(token)) {
      continue;
    }
    let score = field.weight;
    if (value.startsWith(token)) {
      score += STARTS_WITH_BONUS;
    }
    if (score > best) {
      best = score;
    }
  }
  return best;
}

export function searchCatalog(items: CatalogItem[], query: string): SearchResult[] {
  const normalized = query.toLowerCase().trim();

  if (normalized === '') {
    return items.map((item) => ({ item, score: 0 }));
  }

  const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);

  const results: SearchResult[] = [];
  for (const item of items) {
    let total = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const score = tokenScore(item, token);
      if (score === 0) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll && total > 0) {
      results.push({ item, score: total });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.item.name.localeCompare(b.item.name);
  });

  return results;
}
