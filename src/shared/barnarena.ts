/**
 * The great barn at Lowfurrow Fields, the Doorkeepers' arena (docs/plans/bosses.md: the threshing floor).
 * Sized to an upright phone (12 by 14 tiles: the pair and every telegraph on screen at once). What matters
 * on it: two hay stacks that stop a charge (Hasp or Latch stuck in one is the punish) and burn down in
 * 6 s, the roof posts down the sides (a charge stops on them too), and a barrel of lamp oil. The chained
 * chest at the back opens at the kill; the way in at the bottom is shut until then (the room's goal).
 * Pure: the same job gives the same barn on every screen.
 */
import type { Block, GameMap, Round, Theme } from './arena.js';
import type { Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { wooden } from './sitekit.js';
import { DOORKEEPERS } from './bosstune.js';
import { DOOR_NAMES } from './bosswords.js';

export const BARN = { w: 12, h: 14 };

/** Where the pair stand when you come in (facing the back wall, not yet aware), and the hay stacks. */
export const BARN_SPOTS = {
  latch: { x: 4.4, y: 4 },
  hasp: { x: 7.6, y: 4 },
  stacks: [{ x: 1.4, y: 6.6, w: 1.8, h: 1.3 }, { x: 8.8, y: 6.6, w: 1.8, h: 1.3 }],
  oil: { x: 10.6, y: 2.6 },
  chest: { x: 6, y: 1.5 },
  /** Where the small ones come in from (a party of three or four: BOSS.adds), at the side doors. */
  sides: [{ x: 0.9, y: 10.5 }, { x: 11.1, y: 10.5 }],
};

/** The barn: its floor, posts, stacks, oil and chest, and the pair. */
export function barnArena(job: Job): RoomPlan {
  const { w, h } = BARN, s = BARN_SPOTS;
  const rounds: Round[] = [
    { x: 2.6, y: 3.4, r: 0.3, kind: 'support' }, { x: 9.4, y: 3.4, r: 0.3, kind: 'support' },
    { x: 2.6, y: 10, r: 0.3, kind: 'support' }, { x: 9.4, y: 10, r: 0.3, kind: 'support' },
  ];
  const blocks: Block[] = [
    // Grain along the back wall, either side of the chest.
    { kind: 'sacks', x: 0.4, y: 0.1, w: 2.2, h: 1 }, { kind: 'sacks', x: 9.4, y: 0.1, w: 2.2, h: 1 },
    ...s.stacks.map((q) => wooden({ kind: 'haystack', ...q })),
  ];
  const night = job.twist === 'night';
  const theme: Theme = { floor: 'dirt', back: 'plaster', moon: night ? 0.18 : 0.3, ambient: night ? [0.14, 0.13, 0.18] : [0.19, 0.17, 0.19] };
  const map: GameMap = {
    name: 'THE GREAT BARN', w, h, wallFace: 3, rounds, blocks, theme,
    // Lit by two torches on the back wall and a lantern on a post by the way in.
    torches: [{ x: 3.2, y: 0.2 }, { x: 8.8, y: 0.2 }], braziers: [{ x: 1.2, y: 12.4, r: 0.3 }],
    hero: { x: w / 2, y: h - 1.5 }, exit: { x: w / 2 - 1.1, y: h - 0.7, w: 2.2, h: 0.7 },
  };
  const foe = (who: 'latch' | 'hasp') => ({ kind: 'butcher' as const, ...s[who], hp: DOORKEEPERS.hp, name: DOOR_NAMES[who], boss: who, awake: false });
  return { map, foes: [foe('latch'), foe('hasp')], props: [{ kind: 'oil', ...s.oil }], chests: [{ ...s.chest, chained: true }] };
}
