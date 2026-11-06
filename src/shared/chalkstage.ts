/**
 * The chalker staged (shared/debut.ts): in the CRIES way's room, where captives are led off, it stands at
 * a tally board near where they're led from, chalking them up in fives, one of the guards' pack. When it
 * sees you it turns its chalk on you (sim/tasks.ts `tally`, sim/chalker.ts). No dice: the room's stream
 * is left as it was, so everything else in the room lands where it always did.
 */
import { atArc } from './scenes4.js';
import type { Lay } from './vignettes.js';

/** The prisoners' guards' pack (shared/scenes4.ts). */
const GUARDS = 82;

export function stageChalker(l: Lay): void {
  const pts = l.led?.pts;
  if (!pts) return;
  const start = atArc(pts, 0);
  // The board, and the goblin a step in front of it facing it: free ground off the track (the room keeps
  // the track clear), the nearest to where the captives are led off from.
  let best: { bx: number; by: number; x: number; y: number } | null = null, bd = Infinity;
  for (let by = 2; by <= l.H - 4.5; by += 0.5) for (let bx = 1.5; bx <= l.W - 1.5; bx += 0.5) {
    const d = Math.hypot(bx - start.x, by - start.y);
    if (d >= bd || d > 9 || !l.free(bx, by, 0.45)) continue;
    const x = bx, y = by + 0.8;
    if (l.free(x, y, 0.4)) (best = { bx, by, x, y }), (bd = d);
  }
  if (!best) return;
  l.claim(best.bx, best.by, 0.45), l.claim(best.x, best.y, 0.4);
  // Ten already up, and the ones on the rope now. Not one of the room's specials: it's the scene's, as the guards are.
  l.foes.push({ kind: 'scrapper', variant: 'chalker', x: best.x, y: best.y, pack: GUARDS, task: { k: 'tally', x: best.bx, y: best.by, n: 10 + l.led!.n } });
}
