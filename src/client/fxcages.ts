/**
 * What a blow on a breakable thing looks like, and a false prisoner tearing open. Drawn by the shared
 * effects (fx.ts), so the flat view and the 2.5D overlay show the same (Kyle, 2026-11-04: in 2.5D "it's
 * not clear when you're hitting the cage"):
 * - a cage that holds: sparks off its bars, a few chips of wood, a jolt;
 * - a barrel, crate or table that holds: splinters and dust;
 * - a larder rack: splinters and a spatter off what hangs on it;
 * - a den or a wooden wall chopped (`chop`): splinters at the spot (it had only a sound before);
 * - `torn`: the false prisoner coming apart (gore.ts torn); its goblins' "!" and cackle are `spotted`.
 * The prop's own shudder and flash are drawn where it is (propsdraw.ts, three/prophit3d.ts). Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

const WOOD = ['#8b6a3a', '#7a5230', '#5a3d22'], BARS = ['#ffffff', '#e8e4f0', '#ffd27a'], DUST = ['#6a647a', '#57525e'];

/** True if it was one of these (and has been drawn). */
export function cageFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'prophit': {
      const big = ev.kind === 'cage' || ev.kind === 'larder', h = big ? 12 : 6;
      if (ev.kind === 'cage') fx.burst(x + ev.dx * 4, y - h, 9, BARS, 70, true), fx.flashes.push({ x, y: y - h, r: 30, i: 0.6, c: [1, 0.9, 0.7], life: 0.07, max: 0.07 });
      if (ev.kind === 'larder') fx.burst(x, y - h, 6, ['#7a1d1d', '#5a1414'], 50, false, 200, true);
      fx.gore.fling(x, y, h, big ? 5 : 4, WOOD, 45, 70, 1, ev.dx, ev.dy);
      fx.burst(x, y - 3, 4, DUST, 25, false);
      fx.shake = Math.max(fx.shake, big ? 1.5 : 1);
      return true;
    }
    case 'chop':
      fx.gore.fling(x, y, 10, 5, WOOD, 50, 70, 1);
      fx.burst(x, y - 8, 5, DUST, 30, false);
      fx.shake = Math.max(fx.shake, 1);
      return true;
    case 'torn':
      fx.gore.torn(x, y);
      fx.flashes.push({ x, y: y - 8, r: 50, i: 0.5, c: [1, 0.4, 0.3], life: 0.12, max: 0.12 });
      return true;
  }
  return false;
}
