/**
 * The goblin in the Keeping Room (Kyle, 2026-11-24: "the underchurch area HAS a goblin but no explanation"). It
 * walks its round (shared/keepingroom.ts) and keeps the place: it crouches at the trough, the cradle and the brazier
 * and reaches up into the hoard. It never speaks, can't be fought, has no name over it and pays heroes no mind; nothing
 * on screen says why it's there. The scrapper's body without its kit, its eyes on the glow. Paint only.
 */
import type { Npc } from '../shared/arena';
import { blitPose, shadow, type Ctx } from './draw';
import { hs } from './heroscale';
import { SPRITES } from './sprites';

/** Its look's name in the room's people (drawNpc hands it here). */
export const KEEP_GOB = 'keepgob';

/** Stopped at the hoard (the side shelves and the back wall), by its tile x: it reaches up. Elsewhere it crouches. */
const atHoard = (tx: number) => tx < 2.6 || (tx > 5.5 && tx < 7);

export function drawKeepGob(c: Ctx, n: Npc, x: number, y: number, fx: number, walking: boolean, tx: number, fy: number): void {
  const t = c.now + n.x * 0.3, left = fx < -0.2;
  shadow(c, x, y, hs(4));
  if (walking) {
    // A low, quick shuffle, the head down.
    const bob = Math.floor(t * 6) % 2 ? -1 : 0;
    return blitPose(c, fy < -0.55 ? SPRITES.scrapperUp : SPRITES.scrapper, x, y + bob, left, 1, 0.96, 0, 0);
  }
  if (atHoard(tx)) {
    // Up on its toes into the shelf, now and then shifting what's on it, back down, and again.
    const k = (t * 0.5) % 1, up = k < 0.55 ? 1.08 : 1;
    return blitPose(c, SPRITES.scrapperUp, x + (k > 0.3 && k < 0.45 ? 1 : 0), y, left, 1, up, 0, 0);
  }
  // Crouched at its work: low, rocking a little, a long stillness in the middle.
  const k = (t * 0.35) % 1, rock = k < 0.6 ? Math.round(Math.sin(t * 2.2)) : 0;
  blitPose(c, SPRITES.scrapper, x + rock, y, left, 1, 0.84, rock * 0.5, 0);
}
