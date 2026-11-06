/**
 * What this browser tells the town's room each frame (townfolk.ts), and when it tells it nothing.
 *
 * Only Wickhold is shared: its square and its halls (shops, the vault, the barracks, a house), where
 * others can walk in on you. Everywhere else is this browser's alone and says nothing to the relay:
 * the training yard (and its practice fights: sim/practice.ts), the prologue wood, a job alone. Out of
 * Wickhold the town's socket closes (townfolk.ts `step(null)`), and coming back opens it again and
 * says `hi` once. That's cheaper than keeping it open and still: an open socket costs its instance a
 * presence beat a minute and a rejoin each 4 minute swap (about 90 commands an hour), a close and an
 * open about 8 (docs/REALTIME-REDIS-BUDGET.md, "Count the steady costs").
 */
import type { Game } from './game';
import type { Me } from './townfolk';
import { packHound } from '../shared/houndlook';

/** Is this a place others can be in with you? */
export const sharedPlace = (g: Game): boolean => g.mode === 'town';

/** Where I stand (and how I look, my hound with it), for the town's room; null (out of Wickhold, or no hero yet): the socket closes. */
export function presence(g: Game, name: string): Me | null {
  const h = sharedPlace(g) ? g.hero : null;
  if (!h) return null;
  // A Ranger's hound goes with the look, packed small (shared/houndlook.ts); it's in what others heard
  // last (townfolk.ts `gist`), so it goes again only when it's changed, never with each step.
  return { n: name, w: h.weapon, l: h.look ?? 0, ...(h.houndLook ? { d: packHound(h.houndLook) } : {}), at: g.room.map.name, p: [h.x, h.y, h.fx, h.fy, h.moving ? 1 : 0] };
}
