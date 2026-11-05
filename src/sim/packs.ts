/**
 * Packs in a fight (shared/encounter.ts lays them out): a bigger party's extra goblins, and who wakes
 * whom. A party meets more small ones in each pack (ENCOUNTER.party.fodder a player past the first), a
 * tougher centrepiece (ENCOUNTER.party.centre), and from three players the pack's one `more` special:
 * never more specials copied, so a fight stays readable however many come. A pack's shout wakes only
 * its own, and a fight in another pack is heard only from close by: a room plays as fights in turn.
 */
import { ALERT, ENCOUNTER, VARIANTS } from '../shared/tuning';
import { isSpecial, cast } from '../shared/encounter';
import { Rng } from '../shared/rng';
import type { Foe } from '../shared/terrain';
import type { Enemy } from './types';

/** Do these two wake each other? (Goblins without a pack, an old job's, all do.) */
export const samePack = (a: { pack?: number }, b: { pack?: number }) => a.pack === undefined || b.pack === undefined || a.pack === b.pack;
/** How near a fight must be for this goblin to hear it. */
export const hearFrom = (a: { pack?: number }, b: { pack?: number }) => (samePack(a, b) ? ALERT.hear : ENCOUNTER.hearOther);

/** A routed room's goblins for a party of `party` (the room's own first, unchanged). `fodder`: small ones a pack a player past the first. */
export function scalePacks(foes: Foe[], party: number, seed: number, fodder = ENCOUNTER.party.fodder): Foe[] {
  if (party <= 1) return foes;
  const rng = new Rng(seed), extra: Foe[] = [], packs = [...new Set(foes.filter((f) => f.pack !== undefined).map((f) => f.pack!))];
  for (const id of packs) {
    const mine = foes.filter((f) => f.pack === id), small = mine.filter((f) => !isSpecial(f) && !f.name && f.kind === 'scrapper' && !f.task);
    const more = Math.round(small.length * fodder * (party - 1));
    for (let i = 0; i < more; i++) {
      const f = small[i % small.length], a = i * 2.4 + rng.range(-0.3, 0.3);
      extra.push({ ...f, x: f.x + Math.cos(a) * 0.75, y: f.y + Math.sin(a) * 0.75 });
    }
    const centre = mine.find((f) => isSpecial(f) && !f.bow);
    if (centre) centre.hp = Math.round((centre.hp ?? hpOf(centre)) * (1 + ENCOUNTER.party.centre * (party - 1)));
    if (party >= 3 && centre?.more) extra.push(cast({ kind: 'scrapper', x: centre.x + 0.8, y: centre.y + 0.5, pack: id }, centre.more));
  }
  return [...foes, ...extra];
}

/** A foe's health as the room will give it (shared/tuning.ts). */
function hpOf(f: Foe): number {
  if (f.variant) return VARIANTS[f.variant].hp;
  return f.kind === 'butcher' ? 260 : 36;
}

/** The pack and role a goblin came with, onto the room's goblin. */
export function packOnto(e: Enemy, f: Foe): void {
  if (f.pack !== undefined) e.pack = f.pack;
  if (f.role) e.role = f.role;
}
