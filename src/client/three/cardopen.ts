/**
 * The canopy opens (docs/design/forest-redraw.md, "Behind a tree"; Kyle, 2026-11-24: "I don't love the current
 * approach", the hero a chequered ghost through the leaves). A tall card (a tree) standing between the camera and a
 * body, a hero or a foe near yours (wind3d.ts `setMovers`), is cut away round that body: a window a good deal
 * bigger than the body (the ground and the trunks behind show round them, so they read as behind, not in front), its rim leafy and dark-lined like every edge in the tile art, so they are seen as
 * themselves, lit and in colour, through the leaves. The hole is in the card's own pixels and moves with the body.
 * Drawing only. Low cards (a bush, a rock, a reed) hide nobody for long and stay whole.
 */
import type * as THREE from 'three';
import { KY, KZ } from '../tilekit';
import { MOVERS, MAX_MOVERS, chain } from './wind3d';

/** A card this tall (pixels) or taller opens. */
export const OPENS_AT = 34;
const OPEN = { uOpenTan: { value: KZ / KY } };

export function openCards(m: THREE.Material): void {
  chain(m, (sh) => {
    Object.assign(sh.uniforms, MOVERS, OPEN);
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec2 aTall;\nvarying vec3 vOpenW;\nvarying float vOpenT;\nvarying float vOpenF;\nvoid main() {')
      .replace('#include <project_vertex>', 'vOpenW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvOpenT = aTall.x;\nvOpenF = aTall.y;\n#include <project_vertex>');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', `uniform vec2 uMovers[${MAX_MOVERS}];\nuniform int uNM;\nuniform float uOpenTan;\nvarying vec3 vOpenW;\nvarying float vOpenT;\nvarying float vOpenF;\nvoid main() {
bool openRim = false;
// (Its trunk stays, the lowest 13 pixels of it: thin, and it is what says they stand behind.)
if (vOpenT > 0.5 && vOpenW.y - vOpenF > 13.0 / ${KY.toFixed(1)}) {
  for (int i = 0; i < ${MAX_MOVERS}; i++) {
    if (i >= uNM) break;
    // How far behind this card the body stands (tiles), and so how high up the card its middle shows.
    float dz = vOpenW.z - uMovers[i].y;
    if (dz < 0.1 || dz > 12.0) continue;
    vec2 d = vec2((vOpenW.x - uMovers[i].x) * 20.0 / 23.0, (vOpenW.y - dz * uOpenTan - 0.7) * ${KY.toFixed(1)} / 27.0);
    // (A leafy edge, not an oval: the rim swells and pinches round it, each tree its own way; a dark line along it,
    // as every edge in the tile art has, so it reads as a window cut in the leaves.)
    float a = atan(d.y, d.x), e = length(d) + 0.07 * sin(a * 6.0 + vOpenW.z * 3.1) + 0.04 * sin(a * 11.0 + vOpenW.z);
    if (e < 0.93) discard;
    if (e < 1.0) openRim = true;
  }
}`).replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (openRim) gl_FragColor.rgb = vec3(0.035, 0.03, 0.045);');
  }, '|cardopen');
}
