/**
 * The goblins that fight from the back of the pack, and how often they turn up. Numbers only: the
 * rules (sim/backline.ts) and the drawing (client/backline.ts) both read them, so the circle you see
 * is the one that bursts, and the ring round a drummer is the reach of its drum.
 */
import type { EnemyAttackSpec } from './tuning.js';

/**
 * The hexer: a small goblin with a staff and a fetish. It keeps its distance (runs when you're closer
 * than `keep`, comes in when you're past `reach`) and calls the ground up under you: a red circle,
 * striped because no guard stops it, centred where you stood when it began, that bursts when the
 * wind-up is done. Step out of it or roll through; any blow on the hexer breaks the spell. `pause`:
 * seconds between spells. Goblins caught in the burst take FRIENDLY.blow of it.
 */
export const HEXER = {
  hp: 20,
  reach: 7,
  keep: 4,
  flee: 1.05,
  pause: 1.9,
  hex: { windup: 1.25, active: 0.12, recover: 0.7, dmg: 16, knock: 6, radius: 1.15, unblockable: true } as EnemyAttackSpec,
};

/**
 * The drummer: a small goblin with a drum on a strap. It hangs `behind` tiles back of its pack, and
 * while it stands and beats (awake, on its feet, not running) every other goblin within `radius` on its
 * level is roused: wind-ups take `rouse.windup` of the time, they move `rouse.pace` as fast, and their
 * blows do `rouse.dmg` as much. It runs from anyone closer than `keep`, and stops drumming while it
 * runs; it pokes with a drumstick if it's cornered. `beat`: seconds between beats (sound and ripple).
 */
export const DRUMMER = {
  hp: 24,
  keep: 3.5,
  flee: 1.15,
  behind: 2.2,
  radius: 4.5,
  beat: 0.5,
  rouse: { windup: 0.8, pace: 1.2, dmg: 1.2 },
  poke: { windup: 0.7, active: 0.08, recover: 0.6, dmg: 5, knock: 2, range: 1.25, arc: 50, unblockable: false } as EnemyAttackSpec,
};

/**
 * How often the back of the pack turns up in a job's rooms. Each small goblin with a blade rolls
 * `base + room * perRoom + ruin * perRuin` (plus `long` on a long job, `deep` on a deep one) to be a
 * hexer or a drummer; at most `most[room]` in a room (the last number for any room past the list).
 * A room always keeps `blades` goblins that fight up close, and a drummer needs `drumFor` of them to
 * drum for. In a party of three or more, each extra goblin past the room's own rolls `tougher` per
 * player past two to come as one of `picks` (weights) instead; a bigger party may bring `partyMore`
 * more of the back of the pack than the room had.
 */
export const ROSTER = {
  base: 0.02,
  perRoom: 0.04,
  perRuin: 0.015,
  long: 0.025,
  deep: 0.025,
  most: [1, 2, 2, 3],
  blades: 2,
  drumFor: 3,
  tougher: 0.15,
  partyMore: 1,
  picks: { lunger: 3, shield: 2, heavy: 2, hexer: 1, drummer: 1 },
};
