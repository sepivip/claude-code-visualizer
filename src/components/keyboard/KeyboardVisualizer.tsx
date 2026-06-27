// src/components/keyboard/KeyboardVisualizer.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Platform } from '../../data/types';
import { chordFromEvent, chordEquals, displayChord } from '../../lib/keys';
import { useApp } from '../shell/AppContext';
import { LAYOUT, ALL_KEYS, type KeyDef } from './layout';
import {
  SHORTCUT_INDEX,
  ALL_HITS,
  MODS_USED,
  hitsForModifier,
  hitsForKeyCode,
  type ShortcutHit,
} from './shortcutIndex';
import { Key, type KeyState } from './Key';
import { PlatformToggle } from './PlatformToggle';

/** All chords known across the catalog (for keydown matching). */
const KNOWN_CHORDS = ALL_HITS.map((h) => h.chord);

/** Is this non-spacer key "active" (has at least one shortcut)? */
function isActive(def: KeyDef): boolean {
  if (def.spacer) return false;
  if (def.mod) return MODS_USED.has(def.mod);
  return (SHORTCUT_INDEX[def.code]?.length ?? 0) > 0;
}

/** Hits for the currently selected key. */
function selectionHits(selected: KeyDef): ShortcutHit[] {
  if (selected.mod) return hitsForModifier(selected.mod);
  return hitsForKeyCode(selected.code);
}

/** Build the set of partner key ids for a given selected key + its hits. */
function buildPartnerIds(selected: KeyDef, hits: ShortcutHit[]): Set<string> {
  const involvedMainCodes = new Set(hits.map((h) => h.chord.key));
  const involvedMods = new Set(hits.flatMap((h) => h.chord.mods));

  const partners = new Set<string>();
  for (const def of ALL_KEYS) {
    if (def.id === selected.id) continue;
    const isPartner =
      involvedMainCodes.has(def.code) ||
      (def.mod !== undefined && involvedMods.has(def.mod));
    if (isPartner) partners.add(def.id);
  }
  return partners;
}

function keyState(
  def: KeyDef,
  selected: KeyDef | null,
  partnerIds: Set<string>,
  active: boolean,
): KeyState {
  if (selected && def.id === selected.id) return 'selected';
  if (partnerIds.has(def.id)) return 'partner';
  if (active) return 'active';
  return 'inactive';
}

/** Platform-adjusted label for modifier keys. */
function modLabel(def: KeyDef, platform: Platform): string {
  if (!def.mod) return def.label;
  switch (def.mod) {
    case 'ctrl':
      return platform === 'mac' ? '⌃ Ctrl' : 'Ctrl';
    case 'meta':
      return platform === 'mac' ? '⌘' : platform === 'linux' ? 'Super' : 'Win';
    case 'alt':
      return platform === 'mac' ? '⌥ Opt' : 'Alt';
    case 'shift':
      return '⇧ Shift';
  }
}

function resolveLabel(def: KeyDef, platform: Platform): string {
  if (def.spacer) return '';
  return def.mod ? modLabel(def, platform) : def.label;
}

/** Deduplicated hits by (item.id + displayChord on win platform). */
function dedupeHits(hits: ShortcutHit[]): ShortcutHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = `${h.item.id}::${h.chord.raw}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function KeyboardVisualizer(): JSX.Element {
  const { platform } = useApp();
  const [selected, setSelected] = useState<KeyDef | null>(null);

  const handleSelect = useCallback(
    (def: KeyDef) => {
      setSelected((prev) => (prev?.id === def.id ? null : def));
    },
    [],
  );

  // Live keydown: press a real chord → select the matching physical key.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const chord = chordFromEvent(e);
      const known = KNOWN_CHORDS.some((c) => chordEquals(c, chord));
      if (known) {
        e.preventDefault();
        // Find a physical key whose code matches the main key of the chord.
        const match = ALL_KEYS.find((d) => d.code === chord.key);
        if (match) setSelected(match);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Compute selection hits + partner ids whenever selected changes.
  const { selectedHits, partnerIds } = useMemo(() => {
    if (!selected) return { selectedHits: [], partnerIds: new Set<string>() };
    const hits = dedupeHits(selectionHits(selected));
    return { selectedHits: hits, partnerIds: buildPartnerIds(selected, hits) };
  }, [selected]);

  // Mobile grouped list (sm:hidden).
  const grouped = useMemo(
    () =>
      Object.entries(SHORTCUT_INDEX)
        .filter(([, hits]) => hits.length > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    [],
  );

  function renderKeyRow(row: KeyDef[], rowKey: string | number): JSX.Element {
    return (
      <div key={rowKey} className="flex gap-1">
        {row.map((def) => {
          const active = isActive(def);
          const state = keyState(def, selected, partnerIds, active);
          const label = resolveLabel(def, platform);
          return (
            <Key
              key={def.id}
              def={def}
              state={state}
              label={label}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div data-testid="keyboard" className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <PlatformToggle />
      </div>

      {/* TKL board — hidden on mobile (sm:block) */}
      <div className="hidden sm:block overflow-x-auto">
        <div
          className="inline-flex gap-4 min-w-max"
          style={{ '--ku': '2.5rem' } as React.CSSProperties}
        >
          {/* Main block (6 rows) */}
          <div className="flex flex-col gap-1">
            {LAYOUT.main.map((row, ri) => renderKeyRow(row, ri))}
          </div>

          {/* Right cluster: system row + nav 2×3 + arrows */}
          <div className="flex flex-col gap-1 justify-between">
            {/* System row */}
            <div className="flex gap-1">
              {LAYOUT.system.map((def) => {
                const active = isActive(def);
                const state = keyState(def, selected, partnerIds, active);
                const label = resolveLabel(def, platform);
                return (
                  <Key
                    key={def.id}
                    def={def}
                    state={state}
                    label={label}
                    onSelect={handleSelect}
                  />
                );
              })}
            </div>

            {/* Nav cluster 2×3 */}
            <div className="flex flex-col gap-1">
              {LAYOUT.nav.map((row, ri) => renderKeyRow(row, `nav-${ri}`))}
            </div>

            {/* Arrow cluster */}
            <div className="flex flex-col gap-1">
              {LAYOUT.arrows.map((row, ri) => renderKeyRow(row, `arr-${ri}`))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fallback grouped list */}
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

      {/* Shortcut detail panel */}
      <div
        data-testid="shortcut-detail"
        className="rounded-md border border-neutral-800 p-3"
      >
        {selected === null ? (
          <p className="text-xs text-neutral-400">
            Click a highlighted key or press a shortcut to see details.
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
