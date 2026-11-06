/**
 * Getting a relic made plain (Kyle, 2026-11-05: "it's not clear when you get a relic right now, or how
 * to equip it"). Every relic a hero gains, however it came (a named butcher's drop picked up in the
 * room, a zone's climax, a story job, the beacon, a deep dive), is marked NEW on their save until they
 * look at it in the pack, and makes one moment (relicmoment.ts): its picture, name, uses and how to use
 * it, with a short tip the first time. Pure: the game calls it, the tests too.
 */
import type { Profile } from '../shared/progress';
import type { RelicItem } from '../shared/relicitems';
import type { Hero } from '../sim/types';
import { keepKit } from './keepkit';

/** One relic's moment: the item, whether it's already on the RELIC button, the first-relic tip, its sound. */
export interface RelicMoment { item: RelicItem; carried: boolean; tip: boolean; sound: boolean }

/** At most this many NEW marks kept (older ones just stop being new). */
const KEEP = 12;

export const relicIds = (p: Pick<Profile, 'relics'>) => p.relics.map((r) => r.id);
export const isNewRelic = (p: Pick<Profile, 'relicNew'>, id: string) => !!p.relicNew?.includes(id);

/** Looked at: no longer NEW. True when it was (the caller keeps the save). */
export function seeRelic(p: Pick<Profile, 'relicNew'>, id: string): boolean {
  if (!isNewRelic(p, id)) return false;
  p.relicNew = p.relicNew!.filter((x) => x !== id);
  return true;
}

/**
 * Relics just added to `p.relics`: each marked NEW, and a moment for each. The first moment a hero ever
 * gets carries the tip. `sound`: the moment plays the fanfare (a pickup in the room has rung it already).
 */
export function gainRelics(p: Profile, items: readonly RelicItem[], sound: boolean): RelicMoment[] {
  const owned = new Set(relicIds(p)), fresh = items.filter((r, i) => owned.has(r.id) && !isNewRelic(p, r.id) && items.findIndex((o) => o.id === r.id) === i);
  if (!fresh.length) return [];
  p.relicNew = [...(p.relicNew ?? []).filter((id) => owned.has(id)), ...fresh.map((r) => r.id)].slice(-KEEP);
  return fresh.map((item) => {
    const tip = !p.relicTip;
    p.relicTip = true;
    return { item, carried: p.relic === item.id, tip, sound };
  });
}

/** What's in `p.relics` now that wasn't among `before` (ids). */
export const gainedSince = (before: readonly string[], p: Pick<Profile, 'relics'>) => p.relics.filter((r) => !before.includes(r.id));

/**
 * keepKit (the room's word on a hero's kit into their save), noting any relic it brought: a pickup
 * in your own room, or in the leader's for a guest. Returns whether the save changed and the moments.
 */
export function keepKitNoting(p: Profile, h: Hero, copy: boolean): { changed: boolean; news: RelicMoment[] } {
  const before = relicIds(p);
  // The first named butcher's sure relic had (sim/namedrelic.ts): kept in the save, so it's once a hero.
  const named = !!h.namedRelic && !p.namedRelic;
  if (named) p.namedRelic = true;
  if (!keepKit(p, h, copy)) return { changed: named, news: [] };
  return { changed: true, news: gainRelics(p, gainedSince(before, p), false) };
}
