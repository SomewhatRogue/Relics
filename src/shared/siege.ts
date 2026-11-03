/**
 * Wickhold under siege, and alive with it: the gallows on the square's edge (an empty noose, a crow
 * on the beam), the gravedigger walking the dead from Odric's cart to the churchyard and digging, the
 * burned-out family from the north lane round a brazier inside the gate, someone drawing water, a
 * recruit at the whetstone by the barracks, wicker hurdles either side of the gate road, smoke past
 * the wall, a dog nosing about. Pure: the same on every screen. Nothing blocks a door, a spot or a
 * patrol (the town reach test walks every one of them).
 */
import type { Block, Circle, Npc, Round } from './arena.js';
import type { WorldState } from './story.js';
import { workDone } from './works.js';

export interface Siege { blocks: Block[]; rounds: Round[]; npcs: Npc[]; braziers: (Circle & { wild?: boolean })[] }

/** Who's who, by `arg` (their lines are in client/townui.ts CHAT). */
export const FOLK = { digger: 16, tull: 17, mab: 18, wat: 19 } as const;

export function siege(w: WorldState): Siege {
  const washed = workDone(w, 'wash');
  const blocks: Block[] = [{ x: 36.5, y: 24.5, w: 1.6, h: 0.7, kind: 'gallows' }];
  const rounds: Round[] = [{ kind: 'smoke', x: 45, y: 0.2, r: 0.01 }, { kind: 'dog', x: 31, y: 29.6, r: 0.01 }];
  const braziers: Siege['braziers'] = [];
  const npcs: Npc[] = [
    // The gravedigger: the dead over his shoulder from the cart to the churchyard, a while digging,
    // back for the next. Once the square's washed and the cart's gone, he tends the graves.
    { name: 'GRAVEDIGGER COBB', x: 11.2, y: 8.5, talk: 'chat', look: 'digger', arg: FOLK.digger, speed: 0.5, work: washed ? 'dig' : 'bury',
      path: [[11.2, 8.5], [4.9, 8.6], [4.3, 8.65], [4.9, 8.6], [4.3, 8.65], [4.9, 8.6]] },
    { name: 'GOODWIFE MAB', x: 23, y: 20.3, talk: 'chat', look: 'villager', arg: FOLK.mab, work: 'well' },
    { name: 'RECRUIT WAT', x: 8.4, y: 17.95, talk: 'chat', look: 'soldier', arg: FOLK.wat, work: 'whet' },
  ];
  // Burned out of the north lane when the wall came down, round a brazier inside the gate till the
  // houses are mended.
  if (!workDone(w, 'shutters')) {
    braziers.push({ x: 23.4, y: 8.7, r: 0.35, wild: true });
    npcs.push({ name: 'GOODMAN TULL', x: 24.2, y: 8.5, talk: 'chat', look: 'villager', arg: FOLK.tull },
      { name: 'TULL\'S WIFE', x: 22.6, y: 8.4, talk: 'chat', look: 'survivor', mute: true }, { name: 'A TULL', x: 23.4, y: 9.45, talk: 'chat', look: 'child', mute: true });
  }
  // Wicker hurdles either side of the gate road, till there's a timber wall to stand behind.
  if (!workDone(w, 'timber')) blocks.push({ x: 23.6, y: 2.7, w: 2.2, h: 0.45, kind: 'hurdle' }, { x: 30.4, y: 2.7, w: 2.2, h: 0.45, kind: 'hurdle' });
  return { blocks, rounds, npcs, braziers };
}
