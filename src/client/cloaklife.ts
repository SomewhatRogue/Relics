/**
 * A Rogue's long cloak (lookkit.ts `mantle`), drawn around the posed body by herolife.ts: the skirts hang
 * behind to below the knees and sway; walking they trail; on a dash, a SHADOW STEP or a lunge they flare
 * out behind and lift off the legs, then settle. While vanished it's drawn wrapped shut round the body.
 * Walking away it covers the back. And what the kit hangs off the belt: spare knives on the strap for the
 * daggers, a scabbard for the rapier, a vial for the poisoner (the blowpipe itself is heldkits.ts).
 * Lit layer only; drawing only, from the wall clock and what the room already says.
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero } from '../sim/types';
import { LAYOUT } from './figure';

/** herolife.ts's cloth rect: sprite pixels (x from the back), a layer, and what it's attached to (0 body, 2 legs, 3 a bare detail). */
export type Put = (want: 'back' | 'front', x: number, y: number, w: number, h: number, col: string, att?: 0 | 1 | 2 | 3) => void;

/** How far each Rogue's cloak is flared out (eased: up fast, down slowly) and which way. */
const flares = new Map<string, { k: number; at: number; both: number }>();
function flare(h: Hero, now: number): { k: number; both: number } {
  let f = flares.get(h.id);
  if (!f) flares.set(h.id, (f = { k: 0, at: now, both: 0 }));
  const dt = Math.min(0.1, Math.max(0, now - f.at)), d = WEAPONS[h.weapon].dodge;
  const dash = h.act === 'roll' && d.kind === 'dash', step = h.act === 'throw' && !!h.signing;
  const lunge = h.act === 'attack' && h.heavy && WEAPONS[h.weapon].heavy.lunge > 1;
  const goal = dash || step || h.act === 'zip' ? 1 : lunge ? 0.7 : 0;
  // A dash straight at you or away, or the step's swirl, throws it out to both sides.
  if (goal) f.both = step || (dash && Math.abs(h.rollDy) > Math.abs(h.rollDx) * 1.2) ? 1 : 0;
  f.k += (goal - f.k) * Math.min(1, dt * (goal > f.k ? 22 : 5));
  f.at = now;
  return f;
}

/**
 * Draw this layer's cloak. `k`: how far walking has swung it (herolife.ts trail), `side` the same but only
 * when moving across; `wave(i, amp)` a sway; `hidden` vanished; `shade` the eye dial's darkening.
 */
export function drawMantle(put: Put, h: Hero, cols: [string, string], up: boolean, layer: 'back' | 'front', k: number, side: number, wave: (i: number, amp?: number) => number, hidden: boolean, shade: (c: string) => string, now: number): void {
  const col = shade(cols[0]), lin = shade(cols[1]), f = layer === 'back' ? flare(h, now) : flares.get(h.id) ?? { k: 0, both: 0 };
  // Below the knees, lifted as it flares; crouched, it gathers rather than going through the floor.
  const top = 7, hem = Math.min(14 - Math.round(f.k * 2), 15 - Math.max(0, LAYOUT.drop)), n = hem - top;
  for (let r = top; r <= hem; r++) {
    const i = r - top, fr = i / n, low = r >= 10;
    // Out behind: trailing a walk, thrown wide by a dash; the hem swings a pixel.
    const ext = Math.round(side * 3 * fr ** 1.2 + f.k * 5 * fr ** 0.8), sw = r >= hem - 1 ? wave(i, k > 0.2 ? 1 : 0.6) : k > 0.2 ? wave(i, 0.6) : 0;
    const fwd = Math.round(f.both * f.k * 3 * fr), cut = r === hem ? 1 : 0;
    if (!up) {
      if (hidden) continue;
      const x0 = (low ? 0 : 1) - ext - fwd + Math.min(0, sw) + cut, x1 = (low ? 11 : 10) + fwd + Math.max(0, sw) - cut;
      put('back', x0, r, x1 - x0 + 1, 1, lin);
      if (ext + fwd > 0) put('back', x0, r, ext + fwd, 1, col), fwd && put('back', x1 - fwd + 1, r, fwd, 1, col);
    } else if (low || ext + fwd > 0) {
      const x0 = (low ? 1 : 2) - ext - fwd + sw + cut, x1 = (low ? 10 : 9) + fwd + sw - cut;
      put('front', x0, r, x1 - x0 + 1, 1, col);
      if (low) put('front', 5 + sw, r, 1, 1, lin);
    }
  }
  if (up) return;
  // Vanished: the cloak drawn shut round them, the hood and the eyes over it.
  if (hidden && layer === 'front') {
    for (let r = 6; r <= 14; r++) put('front', r < 9 ? 2 : 1, r, r < 9 ? 8 : 10, 1, r === 14 ? lin : col);
    put('front', 6, 8, 1, 6, lin);
    return;
  }
  if (layer !== 'front') return gear(put, h, 'back');
  gear(put, h, 'front');
}

/** What the kit hangs on the body (facing you). */
function gear(put: Put, h: Hero, layer: 'back' | 'front'): void {
  if (h.weapon === 'daggers' && layer === 'front') {
    // Two spare throwing knives along the strap, their pommels catching the light.
    put('front', 6, 7, 1, 1, '#a8b0b8', 3), put('front', 7, 8, 1, 1, '#a8b0b8', 3);
  } else if (h.weapon === 'rapier' && layer === 'back') {
    // The empty scabbard hanging behind the off hip, a steel chape at its foot.
    put('back', 2, 10, 1, 4, '#3a2a1e'), put('back', 2, 14, 1, 1, '#9aa3ad', 3);
  } else if (h.weapon === 'poisoner' && layer === 'front') {
    // A stoppered vial of venom at the belt, and the darts' little case.
    put('front', 7, 10, 1, 1, '#5a8a32', 3), put('front', 4, 10, 1, 1, '#7a5a34', 3);
  }
}
