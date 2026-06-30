// One-time (idempotent) normalizer for content/cc-catalog.raw.json.
// Fixes data-quality issues from the original multi-agent audit:
//   1. Recategorizes items to the canonical Category set (name-based override
//      first, then maps the audit's free-form category labels like
//      "CLI Flags - Hooks" / "Hook Events - X" / "Settings - X" to canonical).
//   2. Dedupes by name, keeping the most complete copy.
// Re-running on already-clean data is a no-op. After running: `pnpm build:catalog`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAW = fileURLToPath(new URL('../content/cc-catalog.raw.json', import.meta.url));

const CANON = new Set([
  'shortcut', 'slash-command', 'cli-flag', 'setting', 'hook', 'mcp', 'subagent',
  'permission-mode', 'memory', 'plugin', 'customization', 'feature', 'concept',
]);

function recategorize(name, rawCat) {
  const c = String(rawCat ?? '');
  // Name is the strongest signal.
  if (/^\//.test(name)) return 'slash-command';
  if (/^-/.test(name)) return 'cli-flag';
  if (/^claude\s/i.test(name)) return 'cli-flag';
  // Audit's free-form "<Group> - <Sub>" labels → canonical.
  if (/^keyboard shortcuts/i.test(c)) return 'shortcut';
  if (/^cli flags/i.test(c)) return 'cli-flag';
  if (/^hook events/i.test(c)) return 'hook';
  if (/^settings/i.test(c)) return 'setting';
  if (/^environment variables/i.test(c)) return 'setting';
  if (/^code review commands/i.test(c)) return 'slash-command';
  // Known aliases (mirror scripts/transform.mjs normalizeCategory).
  if (c === 'env-flag') return 'setting';
  if (c === 'best-practice' || c === 'troubleshooting' || c === 'example') return 'concept';
  if (c === 'tool') return 'feature';
  if (CANON.has(c)) return c;
  return 'feature'; // vague leftovers (e.g. "Workflows", "Cloud & Remote")
}

const FIELDS = ['syntax', 'details', 'example', 'newcomerTip', 'platformNotes', 'source'];
function completeness(it) {
  let s = 0;
  for (const f of FIELDS) if (it[f] && String(it[f]).trim()) s += 1;
  s += Math.min(String(it.details ?? '').length, 600) / 200; // slight bias to richer entries
  return s;
}

const raw = JSON.parse(readFileSync(RAW, 'utf8'));

// Flatten, tagging source so we can route kept items back.
const all = [];
for (const cat of raw.catalogs ?? []) {
  for (const it of cat.items ?? []) all.push({ it, domain: cat.domain, src: 'catalog' });
}
for (const it of raw.missingItems ?? []) all.push({ it, domain: it.domain, src: 'missing' });

const before = all.length;
const catsBefore = new Set(all.map((e) => e.it.category)).size;

// Recategorize in place.
for (const e of all) e.it.category = recategorize(e.it.name, e.it.category);

// Dedupe by name (keep most complete).
const best = new Map();
for (const e of all) {
  const ex = best.get(e.it.name);
  if (!ex || completeness(e.it) > completeness(ex.it)) best.set(e.it.name, e);
}
const kept = [...best.values()];

// Rebuild: catalog-sourced items grouped by their original domain (preserving
// order + overview); missing-sourced kept in missingItems with their domain.
const byDomain = new Map();
const missing = [];
for (const e of kept) {
  if (e.src === 'catalog') {
    if (!byDomain.has(e.domain)) byDomain.set(e.domain, []);
    byDomain.get(e.domain).push(e.it);
  } else {
    missing.push({ ...e.it, domain: e.domain });
  }
}
const catalogs = (raw.catalogs ?? [])
  .map((c) => ({ domain: c.domain, overview: c.overview, items: byDomain.get(c.domain) ?? [] }))
  .filter((c) => c.items.length > 0);

const out = { catalogs, missingItems: missing, gapAssessment: raw.gapAssessment };
writeFileSync(RAW, JSON.stringify(out, null, 2) + '\n');

const catsAfter = [...new Set(kept.map((e) => e.it.category))].sort();
console.log(`items: ${before} -> ${kept.length} (removed ${before - kept.length} duplicates)`);
console.log(`distinct categories: ${catsBefore} -> ${catsAfter.length}`);
console.log(`final categories: ${catsAfter.join(', ')}`);
const nonCanon = catsAfter.filter((c) => !CANON.has(c));
console.log(`non-canonical leftovers: ${nonCanon.length ? nonCanon.join(', ') : 'none ✓'}`);
