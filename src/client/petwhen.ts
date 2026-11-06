/**
 * When a Ranger is offered PET for their own hound (petting.ts; Kyle, 2026-11-06: "whenever"): anywhere
 * but the prologue wood, the Night Watch and a pastime, with the hound at heel and in reach (game.ts
 * `near`), standing about (not mid-swing, not carrying), no goblin awake within PETTING.calm tiles, and
 * nothing more urgent for the context slot: a friend to help up, raise or cut free, something to burn,
 * a log to shove, a crate or a goblin to grab. Talking, a chest and a door already come first (`near`
 * offers your own hound only when nothing else is in reach).
 */
import { PETTING } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';
import { raisable } from '../sim/party';
import { risable } from '../sim/raise';
import { cuttable } from '../sim/netter';
import { torchable } from '../sim/torch';
import { kindleable } from '../sim/kindle';
import { liftable } from '../sim/props';
import { grabbable } from '../sim/grab';
import { staitheGrabbable } from '../sim/staithebits';
import type { Mode } from './game';

/** The BUTTONS box's line for PET (legend.ts). For the lore keeper and the line editor. */
export const PET_LEGEND = 'Pet your hound while it\'s at your side and nothing nearby is awake.';

/** No goblin awake within `r` tiles. */
export function quietAround(h: Hero, room: Pick<ArenaRoom, 'enemies'>, r = PETTING.calm): boolean {
  for (const e of room.enemies) if (e.act !== 'dead' && e.alert !== false && (e.x - h.x) ** 2 + (e.y - h.y) ** 2 < r * r) return false;
  return true;
}

/** Something else wants the context slot (or the G key) right now. */
export function slotClaimed(h: Hero, room: ArenaRoom, mode: Mode): boolean {
  const run = mode === 'run';
  return !!h.carrying || raisable(h, room.heroes) || (run && !!risable(h, room.heroes, room.time)) || cuttable(h, room.heroes, room.time) ||
    !!torchable(h, room.enemies) || (run && !!kindleable(h, room.map)) || (run && !!staitheGrabbable(h, room.survivors, room.map)) ||
    room.enemies.some((e) => grabbable(h, e, room.time)) || room.props.some((p) => liftable(h, p));
}

/** May this hero be offered PET for their own hound here and now? */
export function ownPetOk(h: Hero, room: ArenaRoom, mode: Mode): boolean {
  if (mode === 'wood' || mode === 'watch' || mode === 'pastime') return false;
  if (h.act !== 'idle' || h.blocking || h.lifting || h.stoop) return false;
  return quietAround(h, room) && !slotClaimed(h, room, mode);
}
