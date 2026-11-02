/**
 * Wickhold after the breach, and as it's mended: what the town works put right on the map. Blood on
 * the square and a cart of the dead by the church (until the square is washed), burnt carts and
 * rubble in the lanes, scorched and boarded buildings, lamp posts down, Perrin's trampled garden (dug,
 * planted, then benches), and the breach in the north wall (hurdles and rope, stakes, timber, stone).
 * Pure: the same world gives the same town on every screen. Nothing here blocks a door or a patrol.
 */
import type { Block, Mark, Npc, Round } from './arena.js';
import type { WorldState } from './story.js';
import { stagesDone, workDone } from './works.js';

export interface Mending { blocks: Block[]; rounds: Round[]; marks: Mark[]; npcs: Npc[]; breach: { x: number; w: number; stage: number } }

/** The garden, west of the well: its corner and size (tiles). */
export const GARDEN = { x: 12.3, y: 18.6, w: 7.2, h: 6.8 };
/** Where the benches stand, once they're in (for sitting by at dusk). */
export const BENCHES = [{ x: 16.8, y: 21, w: 1.6, h: 0.5 }, { x: 16.8, y: 23.4, w: 1.6, h: 0.5 }];
/** Lamp posts along the lanes, once they're put back up. */
export const LANE_LAMPS: [number, number][] = [[17, 9.3], [26, 9], [35.6, 9.3], [24.5, 28.8], [31.5, 28.8], [46, 25.6], [4.5, 26], [11.2, 18.2]];
/** The buildings that took the breach (scorched, boarded) until the shutters and roofs are mended. */
export const WORN = ['CHURCH', 'TOWN HALL', 'FORGE', 'BARRACKS', "HUNTERS' LODGE", 'INFIRMARY', 'THE DROWNED RAT'];

const mk = (kind: Mark['kind'], x: number, y: number, w: number, h: number): Mark => ({ kind, x, y, w, h });
const rd = (kind: Round['kind'], x: number, y: number, r: number): Round => ({ kind, x, y, r });

export function mending(w: WorldState): Mending {
  const blocks: Block[] = [], rounds: Round[] = [], marks: Mark[] = [], npcs: Npc[] = [];
  // The square and the gate: blood where they came through, the dead on Odric's cart, crows.
  if (!workDone(w, 'wash')) {
    marks.push(mk('blood', 26.4, 1.5, 2.4, 1.1), mk('drag', 27.6, 2.6, 0.7, 6), mk('blood', 25.4, 15.7, 1.5, 0.8), mk('blood', 30.2, 19.6, 1.7, 0.9),
      mk('blood', 26.3, 21.9, 1.2, 0.7), mk('blood', 32.3, 16.8, 0.9, 0.6), mk('blood', 9.6, 8.4, 1.6, 0.8));
    blocks.push({ x: 11.6, y: 7.8, w: 2.2, h: 1.1, kind: 'cart', look: 3 });
    rounds.push(rd('crows', 27, 3.6, 0.02), rd('crows', 10.6, 9.1, 0.02), rd('crows', 30.8, 20.2, 0.02));
  } else marks.push(mk('mound', 5, 10.2, 1, 0.45), mk('mound', 8.6, 10.3, 1, 0.45), mk('mound', 10.2, 10.6, 1, 0.45));
  // The lanes: burnt carts, tumbled stone, scorched ground.
  if (!workDone(w, 'lanes')) {
    blocks.push({ x: 3.5, y: 20.8, w: 2.2, h: 1.1, kind: 'cart', look: 1 }, { x: 28.5, y: 33.2, w: 2.2, h: 1.1, kind: 'cart', look: 1 },
      { x: 25.4, y: 31, w: 1.6, h: 1, kind: 'rubble' }, { x: 38.2, y: 24.6, w: 1.4, h: 0.9, kind: 'rubble' }, { x: 36.6, y: 8.4, w: 1.2, h: 0.7, kind: 'rubble' }, { x: 9.6, y: 24.2, w: 1.3, h: 0.8, kind: 'rubble' });
    marks.push(mk('scorch', 20, 0.4, 3.2, 1.3), mk('scorch', 33.4, 0.5, 2.6, 1.1), mk('scorch', 24.4, 30.4, 3.2, 1.6), mk('scorch', 3, 20.4, 3.2, 1.8), mk('scorch', 37.6, 24, 2.6, 1.6));
  }
  // The lamp posts along the lanes: down, or back up and lit.
  for (const [x, y] of LANE_LAMPS) workDone(w, 'lanterns') ? rounds.push(rd('post', x, y, 0.15)) : marks.push(mk('fallenpost', x - 0.2, y - 0.1, 1.6, 0.35));
  // Perrin's garden, in its stages.
  const g = stagesDone(w, 'dig'), G = GARDEN;
  if (g === 0) {
    marks.push(mk('trample', G.x, G.y, G.w, G.h), mk('planks', G.x + 0.4, G.y + 0.2, 3.6, 0.5), mk('planks', G.x - 0.2, G.y + 2.6, 0.6, 2.4));
    blocks.push({ x: 16.6, y: G.y, w: 2.9, h: 0.3, kind: 'fence', look: 1 });
    rounds.push(rd('deadtree', 18.6, 19.9, 0.45));
  } else {
    marks.push(mk('green', G.x, G.y, G.w, G.h));
    blocks.push({ x: G.x + 0.2, y: G.y, w: G.w - 0.2, h: 0.3, kind: 'fence' }, { x: G.x, y: G.y, w: 0.3, h: G.h - 0.2, kind: 'fence' });
    rounds.push(rd('stump', 18.6, 19.9, 0.35));
    for (const y of [19.5, 21.4, 23.3]) marks.push(mk(g >= 2 ? 'flowers' : 'beds', 13.2, y, 3, 1.1));
  }
  rounds.push(rd('bush', 13, 25, 0.35));
  if (g >= 2) rounds.push(rd('bush', 19, 19.2, 0.35), rd('bush', 16.6, 25.1, 0.3));
  if (g >= 3) {
    blocks.push(...BENCHES.map((b) => ({ ...b, kind: 'bench' as const })));
    rounds.push(rd('post', 19.3, 24.6, 0.15), rd('moths', 19.35, 24.7, 0.01));
  }
  npcs.push({ name: 'WIDOW PERRIN', x: 19, y: 22.6, talk: 'chat', look: 'elder', arg: 15 });
  // The breach in the north wall, either side of the gate.
  return { blocks, rounds, marks, npcs, breach: { x: 17, w: 22, stage: stagesDone(w, 'stakes') } };
}
