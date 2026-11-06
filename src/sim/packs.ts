/**
 * Packs in a fight (shared/encounter.ts lays them out): a bigger party's goblins, and who wakes whom. A
 * party meets tougher goblins, not many more (Kyle, 2026-11-05: "not necessarily more enemies if lots of
 * players, but more health on enemies, and they hit harder"): every goblin of a pack has PARTY_TOUGH.hp
 * times its health and hits PARTY_TOUGH.harm times as hard, a pack meets PARTY_TOUGH.chaff more small ones
 * a player past the first, and from three players the pack's one `more` special if the meaty cap allows,
 * all of it within the room's threat grown to the party's budget (BUDGET.party):
 * never copies of the specials, so a fight stays readable however many come. A BIG ONE is the more so
 * (shared/threat.ts BIG). A pack's shout wakes only its own, and a fight in another pack is heard only from
 * close by: a room plays as fights in turn.
 */
import { ALERT, BUDGET, ENCOUNTER, PARTY_TOUGH, VARIANTS, levelHarm, levelHp } from '../shared/tuning';
import { isSpecial, cast } from '../shared/encounter';
import { capsFor, foeThreat, meaty, threatIn } from '../shared/roombudget';
import { Rng } from '../shared/rng';
import type { Foe } from '../shared/terrain';
import { shapeBig } from './bigone';
import type { Enemy } from './types';

/** Do these two wake each other? (Goblins without a pack, an old job's, all do.) */
export const samePack = (a: { pack?: number }, b: { pack?: number }) => a.pack === undefined || b.pack === undefined || a.pack === b.pack;
/** How near a fight must be for this goblin to hear it. */
export const hearFrom = (a: { pack?: number }, b: { pack?: number }) => (samePack(a, b) ? ALERT.hear : ENCOUNTER.hearOther);

/** A routed room's goblins for a party of `party` (the room's own first). `chaff`: more small ones a pack, a player past the first. */
export function scalePacks(foes: Foe[], party: number, seed: number, chaff = PARTY_TOUGH.chaff): Foe[] {
  const n = Math.max(1, Math.min(4, party)), hp = PARTY_TOUGH.hp[n - 1], harm = PARTY_TOUGH.harm[n - 1];
  if (party <= 1) return foes;
  const rng = new Rng(seed), extra: Foe[] = [], packs = [...new Set(foes.filter((f) => f.pack !== undefined).map((f) => f.pack!))];
  // What the extra may come to: the room's own threat grown to the party's budget (shared/threat.ts BUDGET.party).
  let room = threatIn(foes.filter((f) => f.pack !== undefined && !f.name && (f.kind === 'scrapper' || f.kind === 'butcher'))) * (BUDGET.party[n - 1] - 1);
  for (const id of packs) {
    const mine = foes.filter((f) => f.pack === id), small = mine.filter((f) => !isSpecial(f) && !f.name && f.kind === 'scrapper' && !f.task);
    for (const f of mine) if (!f.name) Object.assign(f, { hp: Math.round(hpOf(f) * hp), harm: +((f.harm ?? 1) * harm).toFixed(3) });
    const more = Math.round(small.length * chaff * (party - 1));
    for (let i = 0; i < more && room >= foeThreat(small[i % small.length]); i++) {
      const f = small[i % small.length], a = i * 2.4 + rng.range(-0.3, 0.3);
      extra.push({ ...f, x: f.x + Math.cos(a) * 0.75, y: f.y + Math.sin(a) * 0.75 });
      room -= foeThreat(f);
    }
    const centre = mine.find((f) => isSpecial(f) && !f.bow);
    if (party >= 3 && centre?.more) {
      const add = cast({ kind: 'scrapper', x: centre.x + 0.8, y: centre.y + 0.5, pack: id }, centre.more);
      if (room >= foeThreat(add) && (!meaty(add) || mine.filter(meaty).length < capsFor(party).meaty)) extra.push(Object.assign(add, { hp: Math.round(hpOf(add) * hp), harm })), (room -= foeThreat(add));
    }
  }
  return [...foes, ...extra];
}

/** A foe's health as the room will give it (shared/tuning.ts). */
export function hpOf(f: Foe): number {
  if (f.hp) return f.hp;
  if (f.variant) return VARIANTS[f.variant].hp;
  return f.kind === 'butcher' ? 260 : 36;
}

/** The pack and role a goblin came with, onto the room's goblin, and how hard it hits; a BIG ONE's body (sim/bigone.ts). */
export function packOnto(e: Enemy, f: Foe): void {
  if (f.pack !== undefined) e.pack = f.pack;
  if (f.role) e.role = f.role;
  if (f.harm && f.harm !== 1) e.harm = f.harm;
  if (f.big) (e.big = true), shapeBig(e);
  // (A boss of the kit is never an elite: it has its own kit, sim/bosskit.ts.)
  if (f.elite?.length && !f.boss) e.elite = [...f.elite];
}

/**
 * A goblin for a party of average level `lv` (shared/threat.ts LEVEL_SCALE): every goblin, butchers and
 * BIG ONEs too, a little tougher and harder hitting a level, on top of the party's size, capped.
 */
export function levelOn(e: Enemy, lv: number): void {
  if (lv <= 1 || (e.kind !== 'scrapper' && e.kind !== 'butcher')) return;
  e.hp = e.maxHp = Math.round(e.maxHp * levelHp(lv));
  e.harm = +((e.harm ?? 1) * levelHarm(lv)).toFixed(3);
}
