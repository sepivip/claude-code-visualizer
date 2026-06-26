// src/components/keyboard/KeyboardVisualizer.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Modifier, KeyChord } from '../../data/types';
import { chordFromEvent, chordEquals, displayChord } from '../../lib/keys';
import { useApp } from '../shell/AppContext';
import { KEY_ROWS } from './layout';
import { SHORTCUT_INDEX, type ShortcutHit } from './shortcutIndex';
import { Key } from './Key';
import { ModifierBar } from './ModifierBar';
import { PlatformToggle } from './PlatformToggle';

function modsSupersetMatch(chordMods: Modifier[], active: Set<Modifier>): boolean {
  if (active.size === 0) return false;
  for (const m of active) if (!chordMods.includes(m)) return false;
  return true;
}

function hitsForKey(key: string): ShortcutHit[] {
  return SHORTCUT_INDEX[key] ?? [];
}

export function KeyboardVisualizer(): JSX.Element {
  const { platform } = useApp();
  const [activeMods, setActiveMods] = useState<Set<Modifier>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const toggleMod = useCallback((mod: Modifier) => {
    setActiveMods((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }, []);

  const isHighlighted = useCallback(
    (key: string): boolean =>
      hitsForKey(key).some((h) => modsSupersetMatch(h.chord.mods, activeMods)),
    [activeMods],
  );

  const knownChords = useMemo<KeyChord[]>(
    () => Object.values(SHORTCUT_INDEX).flat().map((h) => h.chord),
    [],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const chord = chordFromEvent(e);
      const known = knownChords.some((c) => chordEquals(c, chord));
      if (known) {
        e.preventDefault();
        setSelectedKey(chord.key);
        setActiveMods(new Set(chord.mods));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [knownChords]);

  const selectedHits = selectedKey ? hitsForKey(selectedKey) : [];

  const grouped = useMemo(
    () =>
      Object.entries(SHORTCUT_INDEX)
        .filter(([, hits]) => hits.length > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    [],
  );

  return (
    <div data-testid="keyboard" className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlatformToggle />
        <ModifierBar active={activeMods} onToggle={toggleMod} />
      </div>

      <div className="hidden flex-col gap-1 sm:flex">
        {KEY_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((def) => (
              <Key
                key={def.key}
                def={def}
                highlighted={isHighlighted(def.key)}
                selected={selectedKey === def.key}
                onSelect={setSelectedKey}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto sm:hidden">
        {grouped.map(([key, hits]) => (
          <div key={key} className="rounded-md border border-neutral-800 p-2">
            <div className="font-mono text-xs text-[#D97757]">{key}</div>
            <ul className="mt-1 space-y-1">
              {hits.map((h, i) => (
                <li key={`${h.item.id}-${i}`} className="text-xs text-neutral-200">
                  <span className="font-mono text-[#D97757]">
                    {displayChord(h.chord, platform)}
                  </span>{' '}
                  — {h.item.summary}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        data-testid="shortcut-detail"
        className="rounded-md border border-neutral-800 p-3"
      >
        {selectedKey === null ? (
          <p className="text-xs text-neutral-400">
            Select a key or press a shortcut to see details.
          </p>
        ) : selectedHits.length === 0 ? (
          <p className="text-xs text-neutral-400">
            No shortcuts mapped to this key.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedHits.map((h, i) => (
              <li key={`${h.item.id}-${i}`} className="text-sm text-neutral-200">
                <span className="font-mono text-[#D97757]">
                  {displayChord(h.chord, platform)}
                </span>
                <span className="ml-2 font-medium">{h.item.name}</span>
                <p className="mt-0.5 text-xs text-neutral-400">{h.item.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
