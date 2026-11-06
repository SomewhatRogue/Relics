/**
 * A boss's sure chest (docs/plans/bosses.md "The payoff"; numbers shared/bosstune.ts BOSS.chest): the chained
 * chest in its arena opens at the kill, and every hero in the room gets their own, rolled on their own
 * seed (the chest's and their id): one Forged piece or better (PRE-WAR BOSS.chest.prewar of the time; plate
 * or a weapon), and BOSS.chest.relic of the time a relic out of its hoard (`awardRelic`, source `boss`),
 * straight into their found relics (the relic moment comes from that, sim/pickups.ts takeRelic). The gold
 * (BOSS.chest.gold, one pile on the chest's own seed) goes in the party's pot, so each hero is paid it.
 * Hempen's hoard (`sure: 'hempen'`, a named butcher's: HEMPEN_BOSS.chest) rolls higher, its hungry piece
 * among them, no gold, and its relic is never the wood's own (the grappling hook: the zone gives that one).
 */
import { BOSS, COINS, HEMPEN_BOSS, WEAPONS, rollAny, type Item, type Tier } from '../shared/tuning';
import { FOUND_RELICS } from '../shared/magic';
import { ZONE_RELICS } from '../shared/relicaward';
import { Rng } from '../shared/rng';
import { awardRelic } from '../shared/relicaward';
import type { RelicItem } from '../shared/relicitems';
import { lift } from './loot';
import { takeRelic, type Pickup } from './pickups';
import type { Chest } from './chests';
import type { FightEvent, Hero } from './types';

/** One hero's own stream for chest `seed`. */
export const heroSeed = (seed: number, id: string) => [...id].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, (seed * 2654435761) >>> 0) || 1;

/** What a hero finds in it: their piece, and maybe a relic. */
export function bossRoll(seed: number, h: Pick<Hero, 'id' | 'weapon' | 'found'>, lv = 1, sure?: 'hempen'): { item: Item; relic?: RelicItem } {
  if (sure === 'hempen') return hoardRoll(seed, h, lv);
  const c = BOSS.chest, rng = new Rng(heroSeed(seed, h.id)), cls = WEAPONS[h.weapon].cls;
  const tier = rng.next() < c.prewar ? 'tolmouth' : 'forged', slot = rng.next() < c.armor ? 'armor' : 'weapon';
  const item = lift(rollAny(rng, cls, tier, slot), lv);
  return rng.next() < c.relic ? { item, relic: awardRelic(null, rng, 'boss', h.found ?? []) } : { item };
}

/** Hempen's hoard: a named butcher's odds, its own hungry piece among them; a relic, never the hook. */
function hoardRoll(seed: number, h: Pick<Hero, 'id' | 'weapon' | 'found'>, lv: number): { item: Item; relic?: RelicItem } {
  const c = HEMPEN_BOSS.chest, rng = new Rng(heroSeed(seed, h.id)), cls = WEAPONS[h.weapon].cls, u = rng.next();
  const bands: [number, Tier][] = [[c.hungry, 'hungry'], [c.turning, 'turning'], [c.touched, 'touched'], [c.prewar, 'tolmouth']];
  let at = 0, tier: Tier = 'forged';
  for (const [p, t] of bands) if (tier === 'forged' && u < (at += p)) tier = t;
  const slot = rng.next() < c.armor ? 'armor' : 'weapon';
  const item = lift(rollAny(rng, cls, tier, slot, undefined, 'HEMPEN'), lv);
  const kinds = FOUND_RELICS.filter((k) => k !== ZONE_RELICS.hangman.kind);
  return rng.next() < c.relic ? { item, relic: awardRelic(null, rng, 'boss', h.found ?? [], kinds) } : { item };
}

/** The chest's gold (one pile, the party's pot). */
export const bossGold = (seed: number, sure?: 'hempen') => {
  const [lo, hi] = sure === 'hempen' ? HEMPEN_BOSS.chest.gold : BOSS.chest.gold, rng = new Rng((seed * 7349 + 11) >>> 0 || 1);
  return lo + Math.floor(rng.next() * (hi - lo + 1));
};

/** Rolled as it starts to open (so its light is true), for every hero in the room. */
export function rollBossChest(c: Chest, heroes: Hero[], lv: number): void {
  for (const p of heroes) {
    if (c.rolls[p.id]) continue;
    const r = bossRoll(c.boss!, p, lv, c.sure);
    c.rolls[p.id] = [r.item];
    if (r.relic) (c.relics ??= {})[p.id] = r.relic;
  }
}

/** Open: each hero's relic is theirs at once (the moment), and the pile of gold. */
export function openBossChest(c: Chest, heroes: Hero[], pickups: Pickup[], id: () => number, ev: FightEvent[]): void {
  for (const [hid, r] of Object.entries(c.relics ?? {})) {
    const h = heroes.find((x) => x.id === hid);
    if (h && !(h.found ?? []).some((x) => x.id === r.id)) takeRelic(h, r, ev);
  }
  const gold = bossGold(c.boss!, c.sure);
  if (gold > 0) pickups.push({ id: id(), x: c.x + 0.9, y: c.y + 0.6, life: COINS.life, gold });
}
