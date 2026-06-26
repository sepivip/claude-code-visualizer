// Pure content-transform helpers. Plain Node ESM — no TS runner dependency.

const DOMAIN_MAP = {
  'Claude Code Terminal/REPL Interactive Controls': 'interactive',
  'Claude Code Slash Commands': 'slash',
  'Claude Code CLI': 'cli',
  'Claude Code settings.json Configuration System': 'settings',
  'Claude Code Hooks System': 'hooks',
  'Model Context Protocol (MCP) in Claude Code': 'mcp',
  'Claude Code Subagents': 'subagents',
  'Claude Code Permissions and Modes': 'permissions',
  'Claude Code Project Memory System (CLAUDE.md)': 'memory',
  'Claude Code Plugins': 'plugins',
  'Claude Code Customization and UX': 'customization',
  'Claude Code: Sessions, Context, and Workflow Automation': 'sessions',
};

const CANONICAL_CATEGORIES = new Set([
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

const CATEGORY_ALIASES = {
  'env-flag': 'cli-flag',
  'best-practice': 'concept',
  troubleshooting: 'concept',
  example: 'concept',
  tool: 'feature',
};

const OPTIONAL_FIELDS = [
  'syntax',
  'details',
  'example',
  'newcomerTip',
  'platformNotes',
  'source',
];

export function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mapDomain(rawDomainString) {
  const key = DOMAIN_MAP[rawDomainString];
  if (!key) {
    throw new Error(`Unmapped domain string: ${rawDomainString}`);
  }
  return key;
}

export function normalizeCategory(raw) {
  if (CANONICAL_CATEGORIES.has(raw)) {
    return raw;
  }
  if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, raw)) {
    return CATEGORY_ALIASES[raw];
  }
  return 'concept';
}

function uniqueId(base, used) {
  const slug = base || 'item';
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) {
    n += 1;
  }
  const id = `${slug}-${n}`;
  used.add(id);
  return id;
}

function toCatalogItem(rawItem, domainKey, confidence, used) {
  const item = {
    id: uniqueId(slugify(rawItem.name), used),
    name: rawItem.name,
    category: normalizeCategory(rawItem.category),
    domain: domainKey,
    summary: rawItem.summary,
    confidence,
  };
  for (const field of OPTIONAL_FIELDS) {
    if (rawItem[field] !== undefined && rawItem[field] !== null && rawItem[field] !== '') {
      item[field] = rawItem[field];
    }
  }
  return item;
}

export function transformCatalog(raw) {
  const used = new Set();
  const out = [];

  for (const catalog of raw.catalogs ?? []) {
    const domainKey = mapDomain(catalog.domain);
    for (const rawItem of catalog.items ?? []) {
      out.push(toCatalogItem(rawItem, domainKey, 'verified', used));
    }
  }

  for (const rawItem of raw.missingItems ?? []) {
    const domainKey = mapDomain(rawItem.domain);
    out.push(toCatalogItem(rawItem, domainKey, 'advanced', used));
  }

  return out;
}
