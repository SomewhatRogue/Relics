/** Drawing props: standing, tumbling through the air, lying as broken pieces, or held overhead. */
import type { Prop } from '../sim/types';
import { blit, shadow, spin, type Ctx } from './draw';
import { SPRITES } from './sprites';
import { propFlash, propShake } from './propshake';
import { PX } from './world';
import { drawCart } from './sumpdraw';
import { drawTub } from './tubdraw';
import { drawColumn } from './columndraw';
import { HS, hs } from './heroscale';

/** (x, y) is the prop's foot on screen; `t` the room's time (for the hit flash). */
export function drawProp(c: Ctx, p: Prop, x: number, y: number, t: number): void {
  const s = SPRITES[p.kind as Exclude<typeof p.kind, 'tub'>], flash = propFlash(p, t) ? 0.8 : 0, fast = Math.hypot(p.kvx, p.kvy) > 4, [jx, jy] = propShake(p, t);
  const piece = p.kind === 'plank' || p.kind === 'stave';
  // The Haulier's ore cart: wheels, dust and sparks on the rail (sumpdraw.ts).
  if (p.kind === 'cart') return drawCart(c, p, x, y, t);
  // THE LISTENER's dripstone column: standing, toppling, rubble (columndraw.ts).
  if (p.kind === 'column') return drawColumn(c, p, x, y, t);
  // An instance puzzle's ore tub (tubdraw.ts).
  if (p.kind === 'tub') return drawTub(c, p, x, y);
  // (Props at hand height are drawn 1.5x in the art pass: sprites.ts `grown`.)
  shadow(c, x, y, Math.round(p.radius * 14 * HS));
  if (fast) return spin(c, s, x, y - hs(p.air && p.air > 0 ? 10 : 5), p.spin);
  if (piece) return spin(c, s, x, y - 1, (p.id * 1.7) % Math.PI, Math.min(1, p.fadeAt - t));
  // A blow it held: it shudders on its spot (propshake.ts).
  blit(c, s, x + Math.round(jx * PX), y + 1 + Math.round(jy * PX), false, flash);
}

/** Held overhead by a hero at (x, y); while slamming, `slam` (0..1) lifts it high and brings it down in front. */
export function drawLifted(c: Ctx, p: Prop, x: number, y: number, fx: number, fy: number, slam: number): void {
  const s = SPRITES[p.kind as Exclude<typeof p.kind, 'tub'>];
  if (slam > 0) {
    const up = HS * (slam < 0.6 ? 26 + 8 * (slam / 0.6) : 34 * (1 - (slam - 0.6) / 0.4)), ahead = HS * (slam < 0.6 ? 0 : 14 * ((slam - 0.6) / 0.4));
    return blit(c, s, x + fx * ahead, y - up + fy * ahead * 0.5);
  }
  blit(c, s, x, y - hs(18) + Math.round(Math.sin(c.now * 6)));
}
