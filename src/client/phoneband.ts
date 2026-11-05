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
 * The band for the hero's feet in a view `h` units tall, `css` CSS pixels per unit: [top, bottom], in
 * the view's units. A screen too short for both gets the middle of what's left.
 */
export function feetBand(h: number, css: number): [number, number] {
  const top = HUD_H / css, bottom = h - CLUSTER_H / css;
  return top <= bottom ? [top, bottom] : [(top + bottom) / 2, (top + bottom) / 2];
}
