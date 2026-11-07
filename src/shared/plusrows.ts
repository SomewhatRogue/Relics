/**
 * A piece's own numbers at a plus (Kyle, 2026-11-06: "It's not really clear what forge upgrades give
 * you"), for the forge's NOW and AFTER and the card. Worked out by gearStats on the piece alone, so what
 * the forge shows is what the room fights with: a weapon's HIT and FULL CHARGE, armor's DAMAGE TAKEN, a
 * ring's HEALTH, then each modifier at its grown value. A modifier that the slot's main row already
 * counts (DAMAGE on a weapon, TOUGHNESS on armor, HEALTH on a ring) goes into that row.
 */
import { MODS, gearStats, levelOf, slotOf, type ModId } from './gear.js';
import { WEAPONS } from './weapons.js';
import { PLUS, plusOf, PLUS_CAP } from './forgeplus.js';
import type { Item } from './loot.js';

export interface PlusRow { id: string; label: string; v: number; unit: '' | 's' | '%'; low?: boolean }

/** The piece at plus `lv` (its temper kept; gear.ts temperOf reads it up to the new plus). */
export const atPlus = (it: Item, lv: number): Item => ({ ...it, level: Math.max(0, Math.min(PLUS_CAP, lv)) });

const MAIN: Record<'weapon' | 'armor' | 'ring', ModId> = { weapon: 'damage', armor: 'tough', ring: 'health' };

/** The rows, at the piece's own plus or at `lv`. */
export function plusRows(it: Item, lv = plusOf(it)): PlusRow[] {
  const at = atPlus(it, lv), s = slotOf(it), out: PlusRow[] = [];
  if (s === 'weapon') {
    const k = WEAPONS[it.kit ?? 'sword'], g = gearStats(at, null);
    out.push({ id: 'hit', label: 'HIT', v: k.combo[0].dmg * (1 + g.damage), unit: '' });
    out.push({ id: 'charge', label: 'FULL CHARGE', v: k.heavy.dmgFull * (1 + g.damage), unit: '' });
  } else if (s === 'armor') {
    // Costs (costs.ts) stay on the card's COST row, not here.
    out.push({ id: 'taken', label: 'DAMAGE TAKEN', v: gearStats(undefined, { ...at, cost: undefined }).taken, unit: '%', low: true });
  } else {
    out.push({ id: 'health', label: 'HEALTH', v: gearStats(undefined, null, [{ ...at, cost: undefined }]).health, unit: '' });
  }
  // Each modifier as the piece alone gives it (gearStats grows it the same way, before the caps).
  const grow = 1 + levelOf(at) * PLUS.mods;
  for (const m of it.mods ?? []) {
    if (m.id === MAIN[s] || !(m.id in MODS)) continue;
    const v = m.v * grow;
    out.push({ id: m.id, label: MODS[m.id as ModId].name, v: m.id === 'thrift' ? -v : v, unit: MODS[m.id as ModId].unit as PlusRow['unit'] });
  }
  return out;
}

/** What the next plus changes: each row now and after. Null at +5 or for hungry gear. */
export function plusStep(it: Item): { now: PlusRow[]; after: PlusRow[] } | null {
  if (it.quality === 'hungry' || it.hungry || plusOf(it) >= PLUS_CAP) return null;
  return { now: plusRows(it), after: plusRows(it, plusOf(it) + 1) };
}

