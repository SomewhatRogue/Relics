/**
 * THE LISTENER's ground in the Deep (docs/design/deep-layer-bosses.md section 1): a cave in the Copperdeep
 * layer, sized to an upright phone (12 by 14, as the haulage). What matters on it:
 * - the holes in the floor (`map.holes`): they don't block walking; it drops into one and rises out of the
 *   one nearest the loudest hero (sim/listener.ts, sim/listenbook.ts), and small ones come out of them in phase 2;
 * - spots for the dripstone columns (`map.columns`), each leaning the way it will fall (made props in a later slice);
 * - a few torches and braziers, which phase 2 knocks out (`boss.dark`), and rough walls of rubble.
 * The chained chest at the back opens at the kill; the way in at the bottom is shut until then.
 * Pure: the same job gives the same cave on every screen.
 */
import type { Block, GameMap, Theme } from './arena.js';
import type { Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { LISTENER } from './listentune.js';
import { CAVE_NAME, LISTEN_NAME } from './bosswords.js';

export const CAVE = { w: 12, h: 14 };

export const CAVE_SPOTS = {
  listener: { x: 6, y: 3.6 },
  holes: [{ x: 3, y: 5.6 }, { x: 9, y: 5.6 }, { x: 3.4, y: 9.4 }, { x: 8.6, y: 9.4 }],
  /** Columns, each leaning toward the middle of the floor. */
  columns: [
    { x: 1.8, y: 3.2, lean: { x: 1, y: 0.6 } }, { x: 10.2, y: 3.2, lean: { x: -1, y: 0.6 } }, { x: 6, y: 7.5, lean: { x: 0, y: 1 } },
    { x: 1.4, y: 7.6, lean: { x: 1, y: 0 } }, { x: 10.6, y: 7.6, lean: { x: -1, y: 0 } }, { x: 6, y: 11.2, lean: { x: 0, y: -1 } },
  ],
  chest: { x: 6, y: 1.4 },
};

/** The cave: its floor, rough walls, holes and column spots, torches, and THE LISTENER. */
export function caveArena(job: Job): RoomPlan {
  const { w, h } = CAVE, s = CAVE_SPOTS;
  void job;
  const blocks: Block[] = [
    { kind: 'rubble', x: 0.2, y: 0.1, w: 2.4, h: 1 }, { kind: 'rubble', x: 9.4, y: 0.1, w: 2.4, h: 1.2 },
    { kind: 'rubble', x: 0, y: 4.4, w: 0.9, h: 1.4 }, { kind: 'rubble', x: 11.1, y: 8.6, w: 0.9, h: 1.4 },
    { kind: 'rubble', x: 0.2, y: 12.4, w: 1.4, h: 1.4 }, { kind: 'rubble', x: 10.4, y: 12.4, w: 1.4, h: 1.4 },
  ];
  const theme: Theme = { floor: 'rock', back: 'rockface', ambient: [0.12, 0.13, 0.18], moon: 0 };
  const map: GameMap = {
    name: CAVE_NAME, w, h, wallFace: 3, rounds: [], blocks, theme,
    torches: [{ x: 3.4, y: 0.2 }, { x: 8.6, y: 0.2 }], braziers: [{ x: 0.9, y: 6.9, r: 0.3 }, { x: 11.1, y: 6.9, r: 0.3 }, { x: 6, y: 12.6, r: 0.3 }],
    holes: s.holes, columns: s.columns,
    hero: { x: w / 2, y: h - 1.5 }, exit: { x: w / 2 - 1.1, y: h - 0.7, w: 2.2, h: 0.7 },
  };
  const listener = { kind: 'scrapper' as const, variant: 'heavy' as const, ...s.listener, hp: LISTENER.hp, name: LISTEN_NAME, boss: 'listener' as const, awake: false };
  return { map, foes: [listener], props: [], chests: [{ ...s.chest, chained: true }] };
}
