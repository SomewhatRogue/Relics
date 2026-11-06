/**
 * Fenmere's numbers (docs/plans/atlas.md section 7 item 7, the Fen; docs/terrain-nodes.md 2.5; re-exported
 * by tuning.ts). The zone, its reed beds and the goblins that lie in them, and its mist. What's drawn and
 * what's judged both read these.
 */

/**
 * The zone: its map (tiles), how many goblins it holds at most (the expedition's waves come on top), how far the
 * trees keep off the trail (half, tiles), how thick the wood and the carr stand, the named butcher's health
 * (the Barrowfields' named one's).
 */
export const FEN = { w: 76, h: 60, goblins: 62, trail: 1.1, trees: 2600, butcher: 520 };

/**
 * A goblin lying in the reeds (sim/lurk.ts): crouched in the water, nothing of it showing but its eyes,
 * till a hero comes within `spring`, it's hit, or its pack wakes. Then it stands up out of the reeds over
 * `rise` seconds (a tell: nothing it does lands until it's up) and fights. From `tell` tiles the reeds
 * round it shiver and its eyes show on everyone's screen, so you can see where it is before it gets up.
 */
export const LURK = { spring: 2.6, tell: 5.5, rise: 0.75 };

/**
 * Mist banks over the fen (shared/fenmist.ts): `banks` of them, each `r` tiles round (an ellipse
 * `squash` as tall as it's wide), drifting `drift` tiles about its home over `period` seconds and
 * thickening and thinning over `breathe` seconds. Inside one (its thickness at your feet, 0 to 1) a goblin
 * notices you from `sight` less as far at the thickest and an archer reaches `reach` less as far. A hero's
 * own `clear` tiles stay clear on their own screen, thickening out to `edge`. Telegraphs are never under it.
 */
export const MIST = { banks: 9, r: [5, 8] as [number, number], squash: 0.6, drift: 3.2, period: [70, 120] as [number, number], breathe: [40, 75] as [number, number], sight: 0.45, reach: 0.35, clear: 1.3, edge: 2.8, thick: 0.72 };

/** Boards over deep water (a boardwalk, a short bridge over a channel): how wide they're laid. */
export const BOARDS = { w: 1.4 };
