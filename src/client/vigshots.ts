/**
 * The scenes past the wood's trees that play once, when you first come near enough to see them
 * (vignettes.ts starts them; `s` is when), and then stay as they ended: the goblins at what they've
 * done. Before that, each is waiting to happen. Paint only.
 */
import type { Npc } from '../shared/arena';
import { drawDeer } from './beasts';
import { blit, line, shadow } from './draw';
import { drawNpc, personSprite } from './npcs';
import { bump, ease, gob, put, stab, type Script } from './vigkit';

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const BLADE = '#cfd6dc';

/** One of the column's dead, pulled by the arms into the trees by two of them, a step at a time. */
export const drag: Script = (out, v, t, s, i) => {
  const [tx, ty] = v.to!, k = `v${i}`, u = s === undefined ? -1 : t - s, dur = 9;
  // Hauled in jerks: a heave, a breath, a heave.
  const p = u < 0 ? 0 : u >= dur ? 1 : ease(u / dur) * 0.6 + (Math.floor(u * 1.4) + ease((u * 1.4) % 1)) / (dur * 1.4) * 0.4;
  const bx = lerp(v.x, tx, p), by = lerp(v.y, ty, p), dx = tx - v.x, dy = ty - v.y, l = Math.hypot(dx, dy) || 1, nx = dx / l, ny = dy / l;
  const body: Npc = { x: v.x, y: v.y, name: '', talk: '', look: 'soldier2', pose: 'corpse', mute: true };
  out.push({ key: k + 'body', x: bx, y: by, floor: true, draw: (c, px, py) => drawNpc(c, body, px, py, false) });
  const pulling = u > 0 && u < dur;
  for (const [j, side] of [[0, -1], [1, 1]] as const) {
    // At it (crouched, feeding) before and after; on their feet hauling, backwards, while they drag it.
    const gx = bx + (pulling ? nx * 0.9 : 0) + side * (pulling ? 0.35 : 0.7) * -ny, gy = by + (pulling ? ny * 0.9 : 0.25) + side * (pulling ? 0.35 : 0.2) * nx;
    put(out, k + j, gx, gy, gob(i * 10 + j, pulling ? -nx : -side * 0.4, pulling ? -ny : 0.3, pulling ? { moving: (u * 1.4) % 1 < 0.6 } : { feeding: true }));
  }
};

/** A deer out of the trees and two of them after it; the spear goes in, it goes down, they're on it. */
export const deer: Script = (out, v, t, s, i) => {
  const [fx, fy] = v.to!, k = `v${i}`, u = s === undefined ? -1 : t - s;
  // Grazing where it'll start from; startled; running west; down where it's caught.
  const run = ease((u - 0.6) / 2.4), down = u >= 3;
  const dx = u < 0.6 ? fx : lerp(fx, v.x, run), dy = u < 0.6 ? fy : lerp(fy, v.y, run) + Math.sin(run * 9) * 0.12;
  out.push({ key: k + 'deer', x: dx, y: dy, floor: down, draw: (c, px, py) => drawDeer(c, down ? 'down' : u > 0.6 ? 'run' : 'stand', px, py, u > 0.3, c.now) });
  if (u < 0) return;
  // The spear behind it, the other cutting across from the south.
  const ax = down ? v.x + 0.9 : lerp(fx + 2.2, v.x + 1, ease(u / 2.8)), ay = down ? v.y - 0.2 : lerp(fy + 0.8, v.y - 0.1, ease(u / 2.8));
  const bx = down ? v.x - 0.6 : lerp(v.x - 2, v.x - 0.6, ease((u - 1) / 2)), by = down ? v.y + 0.5 : lerp(v.y + 1.6, v.y + 0.5, ease((u - 1) / 2));
  const at = (n: number) => (u > 3 && u < 6 ? stab((u - 3 - n) % 1.1, 0, 0.3) : {});
  put(out, k + 'a', ax, ay, gob(i * 10, -1, 0.1, { variant: 'lunger', moving: !down, ...(u > 2.4 && u < 3.3 ? stab(u - 2.4, -1, 0.1) : u > 6 ? { feeding: true } : at(0)) }));
  put(out, k + 'b', bx, by, gob(i * 10 + 1, 0.6, -0.4, { moving: !down && u > 1, ...(u > 6 ? { feeding: true } : at(0.55)) }));
};

/** The last of the column on his feet in there, three round him. He takes one with him. */
export const lastman: Script = (out, v, t, s, i) => {
  const { x, y } = v, k = `v${i}`, u = s === undefined ? -1 : t - s, man = personSprite('soldier');
  // Before: they circle and feint, he turns to each. After: he's down and they're at him.
  const feint = (n: number) => (u < 0 ? bump((t + n * 1.3) % 4, 0, 0.8) * 0.4 : 0);
  const kneel = u >= 3.1 && u < 4.2, fallen = u >= 4.2, faceL = u < 0 ? Math.floor(t / 1.3) % 2 === 0 : u < 1.6;
  // Hit (in the side at 2.25, from behind at 3.05): he flinches, and bleeds.
  const hurt = u >= 2.25, struck = Math.max(bump(u, 2.25, 0.3), bump(u, 3.05, 0.3));
  const body: Npc = { x, y, name: '', talk: '', look: 'soldier', pose: 'corpse', mute: true };
  out.push({ key: k + 'man', x, y, floor: fallen, draw: (c, px, py) => {
    if (fallen) return drawNpc(c, body, px, py, false), line(c.lit, px + 6, py + 2, 0.2, 0, 8, BLADE);
    shadow(c, px, py, 5);
    blit(c, man, px + (faceL ? 1 : -1) * Math.round(struck * 2), py + (kneel ? 2 : 0), faceL, struck > 0.5 ? 0.6 : 0, kneel ? 0.78 : 1);
    if (hurt) (c.lit.fillStyle = '#7a1010'), c.lit.fillRect(Math.round(px - 2), Math.round(py - 8), 3, 2);
    // His sword: up and ready, swung through the first of them, down in the grass when he kneels.
    const side = faceL ? -1 : 1, sw = u > 0.5 && u < 1.1 ? ease((u - 0.5) / 0.4) : 0;
    if (kneel) line(c.lit, px + 5, py, 0, 0, 8, BLADE);
    else line(c.lit, px + side * 5, py - 9 + (kneel ? 2 : 0), side < 0 ? Math.PI + 0.9 - sw * 2.2 : -0.9 + sw * 2.2, 0, 8, BLADE);
  } });
  // West (he cuts it down), east (gets him in the side), north (from behind).
  const ring: [number, number, number][] = [[-1.2, 0.1, 0.5], [1.2, 0.2, 1.8], [0.2, -1, 2.6]];
  ring.forEach(([ox, oy, go], j) => {
    const toward = Math.hypot(ox, oy), fx = -ox / toward, fy = -oy / toward, closing = fallen ? 0.35 : 0;
    const gx = x + ox * (1 - closing) + fx * feint(j), gy = y + oy * (1 - closing) + fy * feint(j);
    if (j === 0 && u >= 1.0) return put(out, k + j, gx, gy, gob(i * 10 + j, fx, fy, { act: 'dead', death: 'opened', actT: 0, actDur: 1e9 }));
    const more = u < 0 ? stab((t + j * 1.3) % 4 - 0.1, fx, fy) : fallen ? (u < 6.5 ? stab((u - 4.2 + j * 0.5) % 1.1, fx, fy) : { feeding: true }) : stab(u - go, fx, fy);
    put(out, k + j, gx, gy, gob(i * 10 + j, fx, fy, more), j === 0 ? u - 0.95 : undefined);
  });
};
