/**
 * THE LEECHMAN's ground in the Deep (docs/design/deep-layer-bosses.md section 2): a fen pool on the Fenmere
 * layer, sized to an upright phone (12 by 14, as the Listener's cave). What matters on it:
 * - shallow water over most of the floor (`map.water`, deep false): everyone in it slows to WADE, but THE LEECHMAN
 *   is quick there (sim/leechman.ts); dry peat banks at the edges (the way in, the back, the sides) where it is slow;
 * - two deep channels (deep true): nobody crosses them, THE LEECHMAN goes round;
 * - reed beds (the fen country's soft reeds, shared/fen.ts): walked through, and small ones wade in from them;
 * - an old windlass on the west bank (`map.windlass`, with a post round it): turned by a hero's GRAB (sim/leechwind.ts); the deep channels
 *   are `span` ones a log can be laid across (sim/leechlog.ts).
 * The chained chest at the back opens at the kill; the way in at the bottom is shut until then.
 * Pure: the same job gives the same pool on every screen.
 */
import type { Block, GameMap, Round, Theme } from './arena.js';
import type { Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { LEECHMAN } from './leechtune.js';
import { LEECH_NAME, POOL_NAME } from './bosswords.js';

export const POOL = { w: 12, h: 14 };

export const POOL_SPOTS = {
  leechman: { x: 6, y: 4.4 },
  /** The shallows: the pool's floor, from the back bank to the foot bank. */
  shallows: { x: 1.6, y: 2.8, w: 8.8, h: 8.4 },
  /** Deep channels, a west one and an east one, with a way round at each end and between. */
  deep: [{ x: 2.6, y: 5.4, w: 1.6, h: 3.4 }, { x: 7.8, y: 6.8, w: 1.6, h: 3.4 }],
  /** Reed beds: where small ones come from, and what is drawn (soft blocks). */
  reeds: [{ x: 1.6, y: 2.9, w: 2.4, h: 1.5 }, { x: 8, y: 2.9, w: 2.4, h: 1.5 }, { x: 5, y: 8.2, w: 2, h: 1.4 }, { x: 1.7, y: 9.6, w: 1.8, h: 1.4 }],
  windlass: { x: 0.8, y: 7.2 },
  chest: { x: 6, y: 1.4 },
};

/** Where the small ones wade in: the middle of each reed bed, the ones far from the way in first. */
export const reedSpawns = (): { x: number; y: number }[] => POOL_SPOTS.reeds.map((r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 }));

/** The pool: its floor, shallows and channels, reeds, the windlass, torches, and THE LEECHMAN. */
export function fenArena(job: Job): RoomPlan {
  const { w, h } = POOL, s = POOL_SPOTS;
  void job;
  const rounds: Round[] = [{ x: s.windlass.x + 0.1, y: s.windlass.y, r: 0.42, kind: 'post' }];
  const blocks: Block[] = [
    ...s.reeds.map((r, i) => ({ kind: 'reeds' as const, soft: true, ...r, look: 11 + i * 7 }) as Block),
    { kind: 'rubble', x: 0.2, y: 0.1, w: 2.2, h: 1 }, { kind: 'rubble', x: 9.8, y: 0.1, w: 2, h: 1.1 },
    { kind: 'rubble', x: 10.9, y: 12.3, w: 1.1, h: 1.5 },
  ];
  const theme: Theme = { floor: 'mud', back: 'trees', ambient: [0.13, 0.17, 0.15], moon: 0.35, mist: 0.4 };
  const map: GameMap = {
    name: POOL_NAME, w, h, wallFace: 3, rounds, blocks, theme,
    torches: [{ x: 3.4, y: 0.2 }, { x: 8.6, y: 0.2 }], braziers: [{ x: 11.1, y: 6.2, r: 0.3 }, { x: 6, y: 12.6, r: 0.3 }],
    water: [{ ...s.shallows }, ...s.deep.map((d) => ({ ...d, deep: true, span: true, onlyLog: true }))], windlass: s.windlass,
    hero: { x: w / 2, y: h - 1.5 }, exit: { x: w / 2 - 1.1, y: h - 0.7, w: 2.2, h: 0.7 },
  };
  const leechman = { kind: 'scrapper' as const, variant: 'heavy' as const, ...s.leechman, hp: LEECHMAN.hp, name: LEECH_NAME, boss: 'leechman' as const, awake: false };
  return { map, foes: [leechman], props: [], chests: [{ ...s.chest, chained: true }] };
}
