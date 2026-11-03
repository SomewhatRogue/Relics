/**
 * Setting a house alight on purpose (Kyle, 2026-11-03). Each small house has one kindling spot by a
 * side wall (shared/kindling.ts). A hero who stands at it and presses GRAB crouches and lights it: the
 * house's light time of staying put (a hit, a swing, a dodge or a step away puts it out, and it starts
 * again from nothing, like a nest: sim/torch.ts). Then the house is alight (`burning`), and the house
 * fire takes it from there (sim/houseburn.ts). The state is on the block, so a friend's screen has it.
 */
import type { Block, Round } from '../shared/arena';
import { burnable, fireTimes, kindling } from '../shared/kindling';
import { HOUSEBURN } from '../shared/tuning';
import type { FightEvent, Hero } from './types';

interface Street { blocks: Block[]; rounds?: Round[]; w: number; h: number }

const unlit = (b: Block) => burnable(b) && (b.burning ?? -1) < 0 && !b.ruined;
const near = (h: Hero, b: Block, m: Street) => {
  const k = kindling(b, m);
  return !!k && (h.z ?? 0) === 0 && Math.hypot(h.x - k.x, h.y - k.y) <= HOUSEBURN.reach;
};

/** The house `h` could set alight now (for the BURN button), if any. */
export const kindleable = (h: Hero, m: Street): Block | undefined =>
  h.id === 'squire' || h.act !== 'idle' ? undefined : m.blocks.find((b) => unlit(b) && near(h, b, m));

/** GRAB at a kindling spot: start lighting it. False if there's none in reach. */
export function startKindle(h: Hero, m: Street, ev: FightEvent[]): boolean {
  const b = kindleable(h, m);
  if (!b) return false;
  h.grabQueuedAt = -9;
  // Someone else already at it: the press is spent, theirs goes on.
  if (b.lighter && b.lighter !== h.id) return true;
  if (b.lighter !== h.id) Object.assign(b, { lighter: h.id, lightT: 0 });
  const k = kindling(b, m)!;
  ev.push({ k: 'housekindle', x: k.x, y: k.y, by: h.id });
  return true;
}

/** Each tick: whoever's lighting a house keeps at it, or it goes out; lit, it's alight. */
export function stepKindle(m: Street, heroes: Hero[], now: number, dt: number, ev: FightEvent[]): void {
  for (const b of m.blocks) {
    if (!b.lighter) continue;
    const h = heroes.find((x) => x.id === b.lighter), still = !!h && unlit(b) && h.act === 'idle' && !h.moving && near(h, b, m);
    if (!still) {
      if (h) h.stoop = 0;
      Object.assign(b, { lighter: '', lightT: 0 });
      continue;
    }
    h.stoop = 1;
    b.lightT = (b.lightT ?? 0) + dt;
    if (b.lightT < fireTimes(b).light) continue;
    h.stoop = 0;
    Object.assign(b, { lighter: '', lightT: 0, burning: now });
    const k = kindling(b, m)!;
    ev.push({ k: 'houselit', x: k.x, y: k.y, by: h.id }, { k: 'blaze', x: b.x + b.w / 2, y: b.y + b.h / 2 });
  }
}
