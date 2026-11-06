/**
 * The movement ladder and the Mage's techniques firing, seen (sim/ladder*.ts, taunt.ts, techmage.ts
 * decide them): small tells, reusing the overlay's bursts, rings and lines. Rings that show a reach are
 * sized from the same numbers the room judged with (shared/ladder.ts), and the ground itself is drawn by
 * ladderground.ts. Words only where a number helps: +N MAGIC for SPELLTHIEF. Cosmetic only.
 */
import { BLINK_BURST, TAUNT_GUARD } from '../shared/ladder';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL, EL_LIGHT } from './palette';
import { PX, toPx } from './world';

const GOLD = ['#ffd27a', '#ffe9a8', '#ffffff'], DUST = ['#8a8494', '#6a647a', '#c8c4d0'], IRON = ['#c8c4d0', '#8a8494', '#ffffff'];
const VIOLET = ['#c9a8ff', '#ffffff', '#9a78e0'], BLOOD = ['#7a1d1d', '#9a2a2a', '#5a1414'], RED = ['#e23a30', '#ff6a50', '#ffffff'];

/** True if it was one of these (and has been drawn). */
export function ladderFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'airshot':
      // A kick of air off the jump as the string goes.
      fx.rings.push({ x, y: y - 6, life: 0.18, max: 0.18, col: '#e8f4ff', size: 8 });
      fx.burst(x, y - 4, 6, ['#e8f4ff', '#ffffff'], 40, true);
      return true;
    case 'twinsnare':
      fx.burst(x, y, 6, ['#8a6a3a', '#c8a060'], 30, false, 160, true);
      return true;
    case 'landing':
      // Dust out to the reach the landing knocked over.
      fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#c8c4d0', size: (ev.r ?? 1) * PX });
      fx.burst(x, y, 14, DUST, 70, false, 200, true);
      fx.shake = Math.max(fx.shake, 2.5);
      return true;
    case 'blinkburst': {
      const col = EL_COL[ev.el ?? ''];
      fx.burst(x, y - 6, 16, [col, '#ffffff', col], 70, true);
      fx.flashes.push({ x, y: y - 6, r: (ev.r ?? BLINK_BURST.r) * PX * 1.6, i: 1, c: EL_LIGHT[ev.el ?? ''], life: 0.18, max: 0.18 });
      return true;
    }
    case 'blinkthrough': {
      // A violet streak from the goblin's back to where you came out.
      const [x2, y2] = toPx(ev.x2 ?? ev.x, ev.y2 ?? ev.y);
      fx.arcs.push({ x: x2, y: y2, x2: x, y2: y, life: 0.25, col: '#c9a8ff', straight: true });
      fx.rings.push({ x: x2, y: y2 - 10, life: 0.25, max: 0.25, col: '#c9a8ff', size: 10 });
      return true;
    }
    case 'halfblink':
      fx.rings.push({ x, y: y - 10, life: 0.3, max: 0.3, col: '#c9a8ff', size: 12 });
      fx.burst(x, y - 10, 8, VIOLET, 40, true);
      return true;
    case 'caltrops':
      // Dropped (with its reach): a scatter of iron. A goblin stepping on: a spark and blood.
      if (ev.r) fx.burst(x, y, 10, IRON, 45, false, 240, true);
      else fx.burst(x, y - 2, 5, [...IRON.slice(0, 1), ...BLOOD], 40, false, 220, true);
      return true;
    case 'underlegs':
      fx.burst(x, y - 2, 8, DUST, 50, false, 200, true);
      return true;
    case 'legstab':
      fx.rings.push({ x, y: y - 10, life: 0.22, max: 0.22, col: '#ff6a50', size: 9 });
      return true;
    case 'shakeoff':
      fx.burst(x, y - 8, 10, ['#9ad06a', '#e8f4ff', '#ffffff'], 55, true);
      return true;
    case 'shelter':
      fx.burst(x, y - 10, 5, GOLD, 25, true);
      return true;
    case 'blockmend':
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#ffe9a8', size: (ev.r ?? 3) * PX });
      fx.burst(x, y - 8, 10, GOLD, 40, true);
      return true;
    case 'coverfor': {
      // A gold line from the Healer's guard to the friend it covered.
      const [x2, y2] = toPx(ev.x2 ?? ev.x, ev.y2 ?? ev.y);
      fx.arcs.push({ x, y, x2, y2, life: 0.25, col: '#ffe9a8', straight: true });
      fx.burst(x2, y2 - 10, 6, GOLD, 30, true);
      return true;
    }
    case 'taunt':
      fx.rings.push({ x, y: y - 6, life: 0.3, max: 0.3, col: '#e23a30', size: (ev.r ?? TAUNT_GUARD.reach) * PX * 0.35 });
      fx.burst(x, y - 14, 10, RED, 60, true);
      fx.shake = Math.max(fx.shake, 3);
      return true;
    case 'taunted':
      // A red mote over each goblin it pulled.
      fx.burst(x, y - 18, 3, RED, 20, true);
      return true;
    case 'ironstance': {
      // IRON STANCE: the goblin thrown back off the guard, a hard ring of iron.
      const [x2, y2] = toPx(ev.x2 ?? ev.x, ev.y2 ?? ev.y);
      fx.burst((x + x2) / 2, (y + y2) / 2 - 8, 12, ['#ffffff', '#d8d4cc', '#ffd27a'], 90, true);
      fx.rings.push({ x, y: y - 8, life: 0.25, max: 0.25, col: '#d8d4cc', size: 14 });
      fx.shake = Math.max(fx.shake, 3);
      return true;
    }
    case 'braced':
      fx.burst(x, y, 8, DUST, 35, false, 200, true);
      fx.rings.push({ x, y, life: 0.2, max: 0.2, col: '#e23a30', size: 10 });
      return true;
    case 'attuned': {
      const col = EL_COL[ev.el ?? ''];
      fx.rings.push({ x, y: y - 8, life: 0.22, max: 0.22, col, size: 8 });
      return true;
    }
    case 'spellthief':
      fx.say(x, y - 22, `+${ev.n ?? 0} MAGIC`, '#c9a8ff', 0.6);
      fx.burst(x, y - 10, 8, VIOLET, 30, true, -30);
      return true;
  }
  return false;
}
