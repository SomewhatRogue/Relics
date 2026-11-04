/**
 * The scenes past the trees in the prologue wood (shared/woodscenes.ts says where), played on the
 * room's clock so they stop when the world is held. Paint only: each frame they're a list of
 * figures for the flat view (scene.ts) and the 2.5D one (three/cards3d.ts) to draw like any other,
 * made here and thrown away; nothing in them is ever in the room. The goblins are drawn by the very
 * code that draws the real ones (foes.ts), so they move the same. Some go round and round (the
 * squabble at the ox, the fire); the rest play once, when you first come near enough to see them
 * (vigshots.ts), and leave the goblins at what they've done.
 */
import type { GameMap } from '../shared/arena';
import type { Vignette, VignetteKind } from '../shared/woodscenes';
import { drawOx, drawSpit } from './beasts';
import { drawEnemy } from './foes';
import { bump, ease, gob, put, stab, type Script, type VigFig } from './vigkit';
import { deer, drag, lastman } from './vigshots';
export type { VigFig };

/** Two of them at each other over the ox, knife against knife; a third eating while they do. */
const squabble: Script = (out, v, t, _s, i) => {
  const { x, y } = v, u = t % 7, k = `v${i}`;
  out.push({ key: k + 'ox', x, y, floor: true, draw: (c, px, py) => drawOx(c, px, py) });
  put(out, k + 'a', x - 1.2, y - 0.25, gob(i * 10, 1, 0.2, { feeding: true }));
  // B eats a while (4.6 to 6.6), the rest of the time it's up and facing C down.
  const bEats = u > 4.6 && u < 6.6, cBack = bump(u, 1.65, 0.7) * 0.35 + ease((u - 4.2) / 0.5) * (1 - ease((u - 6.6) / 0.4)) * 0.6, bBack = bump(u, 3.05, 0.7) * 0.35;
  const bx = x + 1.0 - bBack, by = y + 0.5, cx = x + 2.1 + cBack, cy = y + 0.25 + Math.sin(u * 1.7) * 0.08;
  put(out, k + 'b', bx, by, gob(i * 10 + 1, bEats ? -1 : 1, bEats ? -0.3 : -0.2, bEats ? { feeding: true } : stab(u - 1.2, 1, -0.2)), u - 3.05);
  put(out, k + 'c', cx, cy, gob(i * 10 + 2, -1, 0.2, { moving: u > 4.2 && u < 4.7, ...stab(u - 2.6, -1, 0.2) }), u - 1.65);
};

/** Round their fire: one sees to the spit, two crouched eating, one asleep with its back to the heat. */
const spit: Script = (out, v, t, _s, i) => {
  const { x, y } = v, k = `v${i}`;
  out.push({ key: k + 'fire', x, y: y + 0.3, draw: (c, px, py) => drawSpit(c, px, py, t) });
  put(out, k + 'a', x + 1.7, y + 0.1, gob(i * 10, -1, 0.1, { moving: Math.floor(t / 2.2) % 2 === 0 && t % 2.2 < 0.4 }));
  put(out, k + 'b', x - 1.6, y + 0.8, gob(i * 10 + 1, 1, -0.2, { feeding: true }));
  put(out, k + 'c', x + 0.4, y + 1.3, gob(i * 10 + 2, -0.2, -1, { feeding: true }));
  out.push({ key: k + 'd', x: x - 1.2, y: y - 0.9, draw: (c, px, py) => drawEnemy(c, gob(i * 10 + 3, 1, 0, { feeding: true, alert: false }), px, py, true) });
};

const SCRIPTS: Record<VignetteKind, Script> = { squabble, spit, drag, deer, lastman };
/** When each of a map's scenes started playing (by its place in the list). */
const started = new WeakMap<GameMap, (number | undefined)[]>();

/** This frame's figures for every scene on the map; `me`, where you are (a scene starts when you're near). */
export function vignetteFigs(map: GameMap, t: number, me?: { x: number; y: number }): VigFig[] {
  const vs = map.vignettes;
  if (!vs?.length) return [];
  const s = started.get(map) ?? (started.set(map, []), started.get(map)!), out: VigFig[] = [];
  vs.forEach((v, i) => {
    // (The clock went back: a new run of the wood on the same map. Start over.)
    if (s[i] !== undefined && s[i]! > t + 1) s[i] = undefined;
    if (s[i] === undefined && me && Math.abs(me.x - v.x) < 10 && Math.abs(me.y - v.y) < 7.5) s[i] = t + 0.6;
    SCRIPTS[v.kind](out, v, t, s[i], i);
  });
  return out;
}
