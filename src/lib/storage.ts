const PREFIX = 'cc-trainer:';

function getStore(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (typeof window.localStorage === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function load<T>(key: string, fallback: T): T {
  const store = getStore();
  if (store === null) return fallback;
  try {
    const raw = store.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  const store = getStore();
  if (store === null) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* swallow quota / private-mode errors */
  }
}
