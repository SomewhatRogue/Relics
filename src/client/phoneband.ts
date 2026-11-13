/**
 * Where the hero may stand on an upright phone (Kyle, 2026-11-04: "Your potion and things can cover your
 * character while in game"): between the top HUD (the unit frame and the folded tracker, with the hero's
 * height under them) and the touch cluster's top (cluster.css: nothing above about 300px). Both cameras
 * keep the hero's feet in this band (scene.ts, three/camera3d.ts), past the room's edge if need be.
 */
/** CSS pixels from the screen's bottom to the cluster's top, with a little air. */
export const CLUSTER_H = 312;
/** CSS pixels from the screen's top to the highest the hero's feet may go (the HUD, then the hero's height). */
export const HUD_H = 150;

/** An upright screen (`w` by `h`, any unit). */
export const upright = (w: number, h: number) => h > w * 1.2;

/**
 * CSS pixels a boss's plate adds under the top HUD while it's up (client/bossplate.ts sets it): the
 * tracker steps down by it, the feet band's top too, and both cameras let the room's top come down by it,
 * so the plate never sits over the floor where a boss stands at the back (Kyle, 2026-11-06).
 */
let push = 0;
export const setTopPush = (px: number): void => void (push = px);

/**
 * The top HUD's lowest edge with nothing extra up (the unit frame and the folded tracker), CSS px. Anything
 * docked at the top that reaches lower (the loot roll card, an opened tracker) pushes by the difference: the
 * lowest edge is measured on a phone each quarter second (uncover.ts, setTopLine).
 */
export const HUD_LINE = 100;
let line = 0;
export const setTopLine = (px: number): void => void (line = px);
/** How far under the top HUD the feet band's top and the room's top come down: the plate's or the line's, the larger. */
export const topPush = () => Math.max(push, line - HUD_LINE);

/**
 * The band for the hero's feet in a view `h` units tall, `css` CSS pixels per unit: [top, bottom], in
 * the view's units. A screen too short for both gets the middle of what's left.
 */
export function feetBand(h: number, css: number): [number, number] {
  const top = (HUD_H + topPush()) / css, bottom = h - CLUSTER_H / css;
  return top <= bottom ? [top, bottom] : [(top + bottom) / 2, (top + bottom) / 2];
}
