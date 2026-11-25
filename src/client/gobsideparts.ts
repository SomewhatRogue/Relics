/**
 * The small goblin in profile (its pixels and when to turn it; gobside.ts makes the sprites), facing east (mirrored for west), for a goblin going mostly across the screen
 * (Kyle, 2026-11-25: "lets do it for all gobbos"). The same 17 by 20 canvas and SCRAPPER_CUT as the front
 * (sprites.ts gobBody): rows above 9 the head, the legs from 14, so the walk's side stride (figure.ts, steps
 * 21 to 24) swings them: the far leg in the left half, darker, the near one in the right. Hunched, the head
 * pushed forward on its neck, a long pointed nose, one ear swept back, one eye burning, teeth and a fang; the
 * near arm reaching forward to the hand the kits are drawn at. The pale blind hunters the same, ears up.
 */
import type { GobCols, Part } from './sprites';

const CLAW = '#c8c0a8';

export function body(k: GobCols): Part[] {
  return [
    // The far leg (left half: legL), a shade darker, a step behind; its foot pointing forward.
    ['r', 6, 15, 2, 4, k.F], ['r', 5, 19, 4, 1, k.F], ['p', 8, 19, CLAW], ['r', 6, 17, 2, 1, k.s],
    // The jerkin, hunched: the back rounded out behind, the belly in; ragged at the hem.
    ['r', 5, 9, 6, 5, k.B], ['p', 4, 10, k.B], ['p', 4, 11, k.B], ['p', 4, 12, k.B], ['p', 6, 10, k.b], ['p', 9, 12, k.b],
    ['r', 5, 14, 6, 1, k.K], ['p', 8, 14, '#6a5a3a'], ['p', 5, 15, k.B], ['p', 10, 15, k.B],
    // The strap over the shoulder with a tooth tied on it.
    ['p', 9, 9, k.K], ['p', 8, 10, k.K], ['p', 7, 11, k.T], ['p', 6, 12, k.K],
    // The near leg (right half: legR): bandy, a knobbly knee, rags round the shin, a clawed foot forward.
    ['r', 9, 15, 2, 4, k.L], ['p', 11, 16, k.F], ['r', 9, 17, 2, 1, k.b], ['r', 9, 19, 4, 1, k.F], ['p', 12, 19, CLAW], ['p', 13, 19, CLAW],
    // The far hand, just showing behind the back (the off arm's box).
    ['p', 3, 12, k.s],
    // The near arm from the shoulder, down and forward to the hand (the weapon arm's box from x 13), claws out.
    ['p', 10, 10, k.S], ['p', 11, 10, k.S], ['p', 11, 11, k.s], ['p', 12, 11, k.S], ['p', 12, 12, k.s], ['r', 13, 11, 1, 2, k.S], ['r', 14, 12, 1, 2, k.S], ['p', 15, 13, CLAW],
  ];
}

export function head(k: GobCols, pale: boolean): Part[] {
  return [
    // The skull pushed forward on a short neck, the jaw and the long nose out in front.
    ['e', 8.5, 5, 3.6, 3.8, k.S], ['r', 7, 8, 3, 1, k.s], ['r', 10, 5, 3, 3, k.S], ['p', 13, 5, k.S], ['p', 13, 6, k.s], ['p', 14, 6, k.S],
    // The brow over the eye, the eye burning (pale: an empty socket), a nostril.
    ['r', 9, 3, 3, 1, k.s], ['p', 11, 4, k.E], ['p', 12, 6, k.s],
    // The grin: teeth, the gum, a fang over the lip.
    ['r', 10, 7, 3, 1, k.T], ['p', 11, 7, k.m], ['r', 10, 8, 2, 1, k.m], ['p', 12, 8, k.T],
    ...(pale
      ? ([['r', 5, 0, 2, 3, k.S], ['p', 4, 0, k.S], ['p', 6, 3, k.s]] as Part[])
      : ([
          // The ear swept back, long, a notch bitten out of it, a ring in it; a few wiry hairs on top.
          ['r', 1, 4, 4, 1, k.S], ['p', 0, 3, k.S], ['r', 2, 5, 3, 1, k.s], ['p', 1, 5, k.S], ['p', 2, 4, k.s], ['p', 3, 6, '#c0a050'],
          ['p', 7, 1, k.K], ['p', 8, 0, k.K], ['p', 10, 1, k.K],
        ] as Part[])),
  ];
}

/** How far |fx| must lead |fy| to turn a goblin side on, and how far it may fall behind before it turns back (sideview.ts's). */
const IN = 0.12, OUT = -0.12;
const was = new Map<number, boolean>();
/** This goblin is going (or facing) mostly across the screen: draw it in profile. */
export function gobSideOn(e: { id: number; fx: number; fy: number }): boolean {
  const lead = Math.abs(e.fx) - Math.abs(e.fy), on = lead > (was.get(e.id) ? OUT : IN);
  if (was.size > 2000) was.clear();
  was.set(e.id, on);
  return on;
}
