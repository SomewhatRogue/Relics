/**
 * The living world's light in 2.5D (../alive.ts, LIVING WORLD; docs/decisions/new-look-characters.md). With it on:
 * - the sun keeps the hour: high at midday, low in the east at dawn and in the west at dusk, so shadows reach long
 *   across the ground morning and evening (the flat view's `sun`, shared/timeofday.ts: + east at dusk, - west at
 *   dawn). Low light is boosted a little so a dusk floor isn't dim. Night keeps its moon where it was.
 * - the figures throw shadows: each card (figs3d.ts) gets a twin turned side-on to the sun, drawn only into the
 *   shadow map, so the shadow is the figure's own outline stretched away from the light while the
 *   card itself still faces the camera. The twin draws nothing on screen (no colour, no depth): three.js picks what
 *   goes in the shadow map by the main camera's layers, so it can't hide on a layer of its own.
 * lights3d.ts calls `sunAt` after setting the sky; figs3d.ts calls `castFigures` at the end of each frame.
 */
import * as THREE from 'three';
import type { Theme } from '../../shared/arena';
import { ALIVE } from '../alive';

/** Where the sun stands from the middle of the view (tiles across, up, toward the camera) and how much brighter
 *  it shines than the fixed key it replaces. Dawn and dusk: about 25 degrees up, so a thing casts twice its height. */
const SUN = { day: [-5, 24, 8, 1.05], dawn: [18, 9, 5, 1.6], dusk: [-18, 9, 5, 1.6] } as const;

/** Which way the sun shines across the ground now (for the figures' twins), or null (no sun to speak of). */
let across: number | null = null;

/** Set the sky light for the hour (after lights3d.ts `setSky`). */
export function sunAt(sky: THREE.DirectionalLight, t: Theme, cx: number, cz: number): void {
  const s = ALIVE.on && t.time && t.time !== 'night' ? SUN[t.time] : null;
  if (s) sky.position.set(cx + s[0], s[1], cz + s[2]), (sky.intensity = Math.PI * s[3]);
  across = ALIVE.on ? Math.atan2(sky.position.x - cx, sky.position.z - cz) : null;
}

const twins = new WeakMap<THREE.Mesh, THREE.Mesh>();
const mats = new WeakMap<THREE.Texture, THREE.MeshBasicMaterial>();
function matFor(tex: THREE.Texture): THREE.MeshBasicMaterial {
  let m = mats.get(tex);
  if (!m) mats.set(tex, (m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, colorWrite: false, depthWrite: false })));
  return m;
}

/** Each frame, after the cards are placed: every shown card's twin set side-on to the sun, or all hidden. */
export function castFigures(slots: readonly ({ card: THREE.Mesh } | undefined)[], tex: THREE.Texture): void {
  for (const sl of slots) {
    if (!sl) continue;
    const card = sl.card;
    let tw = twins.get(card);
    if (!tw) {
      if (across === null) continue;
      tw = new THREE.Mesh(card.geometry, matFor(tex));
      tw.castShadow = true;
      tw.frustumCulled = false;
      twins.set(card, tw);
      card.parent?.add(tw);
    }
    tw.visible = across !== null && card.visible;
    if (!tw.visible) continue;
    tw.material = matFor(tex);
    tw.position.copy(card.position);
    // Its face toward the sun: the outline it throws is the figure's. The floor half of the card folds away.
    tw.rotation.set(0, across!, 0);
    tw.scale.set(card.scale.x, card.scale.y, 1e-4);
  }
}
