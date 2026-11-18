/**
 * Lowfurrow's two mini quests (docs/design/territories.md, "Mini quests"; words in miniwords.ts). Plain data: who asks,
 * where, what is made only once they've been heard, and what it pays.
 *
 * THE FIELDS, the sister: a woman lies under the near handcart. She speaks once the two at the dinner are dead, and
 * sends you to the rye by the pond, where three goblins are beating the crop for her sister. Kill them and the sister
 * comes out of the willows; the woman leaves with her.
 *
 * THE RISE, the rope: a man is up the tree that stands apart in the orchard. He speaks once the archers who shot at
 * him are dead, and won't come down while the big one that tied the rope is alive. It is outside the barn with two
 * more. Kill it, come back within his sight, and he climbs down; there is a chest by the carts.
 */
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import type { Mini } from './miniquest.js';
import type { Foe } from './terrain.js';

type Lv = (x: number, y: number) => number;
interface P { x: number; y: number }

function foe(lv: Lv, x: number, y: number, pack: number, role: Role, more: Partial<Foe> = {}): Foe {
  const f = Object.assign(cast({ kind: 'scrapper', x, y, pack }, role), more);
  const z = lv(x, y);
  if (z) f.z = z;
  return f;
}

/** `giver`, `rye` (the ground the beaters wake in) and `hiding` are THE FIELDS' fixed spots (lowfurrowfields.ts). */
export function fieldsMinis(lv: Lv, s: { giver: P; ryeGround: P & { r: number }; hiding: P }): Mini[] {
  const g = s.ryeGround;
  const foes = [foe(lv, g.x - 1.6, g.y + 0.8, 201, 'fodder'), foe(lv, g.x + 0.4, g.y - 1.2, 201, 'fodder'), foe(lv, g.x + 1.8, g.y + 1, 201, 'lunger')];
  return [{
    id: 'low-sister', kind: 'find', giver: { ...s.giver, look: 'villager', low: true }, after: [101], foes,
    at: { ...g }, frees: [{ ...s.hiding }], giverLeaves: 'done',
  }];
}

/**
 * `barnGround` is THE RISE's fixed spot (lowfurrowrise.ts); `tree` is the tree he is up (drawn in its boughs, just in
 * front of its trunk; `giver`, south of it, is the clear ground you talk from); `chest` stands by the barn's carts.
 */
export function riseMinis(lv: Lv, s: { giver: P; barnGround: P & { r: number } }, tree: P, chest: P): Mini[] {
  const g = s.barnGround;
  const foes = [foe(lv, g.x, g.y, 202, 'heavy', { elite: ['plated'] }), foe(lv, g.x - 2, g.y + 1.2, 202, 'fodder'), foe(lv, g.x + 2.2, g.y + 0.8, 202, 'fodder')];
  return [{
    id: 'low-rope', kind: 'hunt', giver: { ...tree, y: tree.y + 0.5, look: 'survivor', up: 26 }, after: [120], foes,
    at: { ...g }, giverLeaves: 'seen', chest: { ...chest },
  }];
}
