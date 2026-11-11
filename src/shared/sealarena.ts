/**
 * The Doorkeepers' ground in the Deep (docs/design/deep-bosses.md, build order 3): a sealed door in the
 * rock with the pair standing guard before it, sized to an upright phone as the barn is (12 by 14). What
 * matters on it, as the barn's: two stacks of old pit props that stop a charge (one stuck in them is the
 * punish) and burn, posts down the sides (a charge stops on them too), a barrel of lamp oil; the side
 * tunnels (`map.adits`) where the small ones come in for a bigger party (sim/doorpair.ts). The sealed
 * door itself is only drawn (`map.sealed`: client/sealdraw.ts): it never opens. The chained chest before
 * it opens at the kill; the way in at the bottom is shut until then. Pure: the same on every screen.
 */
import type { Block, GameMap, Round, Theme } from './arena.js';
import type { Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { wooden } from './sitekit.js';
import { DOORKEEPERS } from './bosstune.js';
import { DOOR_NAMES, SEAL_NAME } from './bosswords.js';
import { BARN, BARN_SPOTS } from './barnarena.js';

export const SEAL_SPOTS = {
  stacks: [{ x: 1.4, y: 6.6, w: 1.8, h: 1.1 }, { x: 8.8, y: 6.6, w: 1.8, h: 1.1 }],
  door: { x: 3.8, w: 4.4 },
  adits: [{ x: 0.7, y: 10.2 }, { x: 11.3, y: 10.2 }],
};

export function sealArena(job: Job): RoomPlan {
  void job;
  const { w, h } = BARN, s = BARN_SPOTS, d = SEAL_SPOTS;
  const rounds: Round[] = [
    { x: 2.6, y: 3.4, r: 0.3, kind: 'support' }, { x: 9.4, y: 3.4, r: 0.3, kind: 'support' },
    { x: 2.6, y: 10, r: 0.3, kind: 'support' }, { x: 9.4, y: 10, r: 0.3, kind: 'support' },
  ];
  const blocks: Block[] = [
    // Fallen rock either side of the door, and the pit-prop stacks the pair charge into.
    { kind: 'rubble', x: 0.2, y: 0.1, w: 2.6, h: 1 }, { kind: 'rubble', x: 9.2, y: 0.1, w: 2.6, h: 1 },
    ...d.stacks.map((q) => wooden({ kind: 'log', ...q })),
  ];
  const theme: Theme = { floor: 'rock', back: 'rockface', ambient: [0.15, 0.14, 0.19], moon: 0 };
  const map: GameMap = {
    name: SEAL_NAME, w, h, wallFace: 3, rounds, blocks, theme,
    // A torch either side of the door, fire baskets along the sides, one by the way in.
    torches: [{ x: d.door.x - 0.4, y: 0.2 }, { x: d.door.x + d.door.w + 0.4, y: 0.2 }],
    braziers: [{ x: 0.9, y: 5.2, r: 0.3 }, { x: 11.1, y: 5.2, r: 0.3 }, { x: 1.2, y: 12.4, r: 0.3 }],
    adits: d.adits, sealed: { x: d.door.x, w: d.door.w },
    hero: { x: w / 2, y: h - 1.5 }, exit: { x: w / 2 - 1.1, y: h - 0.7, w: 2.2, h: 0.7 },
  };
  const foe = (who: 'latch' | 'hasp') => ({ kind: 'butcher' as const, ...s[who], hp: DOORKEEPERS.hp, name: DOOR_NAMES[who], boss: who, awake: false });
  return { map, foes: [foe('latch'), foe('hasp')], props: [{ kind: 'oil', ...s.oil }], chests: [{ ...s.chest, chained: true }] };
}
