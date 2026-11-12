/**
 * THE LISTENER's cave as effects and sounds (events from sim/columns.ts, sim/listenbook.ts, sim/rangershots.ts;
 * the bodies are client/listendraw.ts, client/columndraw.ts, client/cavedraw.ts): a column cracking as it is set
 * falling, landing in rubble and a ring (a big hit when it brings THE LISTENER down), shrugged off; it going down a
 * hole and bursting up out of one; the rock it threw breaking; a blinding shot that finds it already blind. Cosmetic only.
 */
import { LISTEN_BLIND } from '../shared/bosswords';
import { LISTENER } from '../shared/listentune';
import type { FightEvent } from '../sim/types';
import { CAVE } from './cavedraw';
import type { Fx } from './fx';
import { sfx } from './sfx';
import { PX } from './world';

const STONE = ['#8a889c', '#6c6a80', '#4c4a5e', '#a8a6ba'];
const near = (ev: { x: number; y: number }, p: { x: number; y: number } | null, r: number) => !!p && Math.hypot(ev.x - p.x, ev.y - p.y) <= r;

/** True if it was one of these (and has been drawn). (x, y) is the event's spot on screen. */
export function listenFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'column') {
    const dx = ev.dx, dy = ev.dy;
    if (ev.what === 'start') {
      // The crack at its foot, grit shaken down off it.
      fx.crack(x, y, 5);
      fx.burst(x, y - 10, 10, STONE, 40, false, 90, true);
      fx.burst(x + dx * 6, y - 40, 6, ['#bfe0f4', '#d4ecff'], 30, true, 60);
      fx.shake = Math.max(fx.shake, 2);
    } else if (ev.what === 'land') {
      // Down along the lane: stone thrown up all the way, a ring where it struck.
      const L = LISTENER.column.len * PX;
      for (let i = -2; i <= 2; i++) fx.burst(x + dx * i * (L / 5), y + dy * i * (L / 5) - 2, 8, STONE, 70, false, 200, true);
      fx.burst(x, y - 6, 12, ['#d8d4cc', '#a8a4b4'], 50, false, -20);
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#c8b8a0', size: 30 });
      fx.crater(x + dx * L * 0.5, y + dy * L * 0.5, 7);
      fx.flashes.push({ x, y: y - 6, r: ev.down ? 110 : 60, i: ev.down ? 1.5 : 0.8, c: [0.9, 0.95, 1], life: ev.down ? 0.3 : 0.14, max: ev.down ? 0.3 : 0.14 });
      fx.shake = Math.max(fx.shake, ev.down ? 11 : 7);
      if (ev.down) {
        // It was under it: the big hit, gold stars and a ring of dust.
        fx.burst(x, y - 14, 26, ['#ffffff', '#ffe070', '#fff1b0'], 110, true);
        fx.rings.push({ x, y, life: 0.55, max: 0.55, col: '#ffe070', size: 46 });
      }
    } else {
      // Shrugged off: it takes the weight on its back, grit and a spark.
      fx.burst(x, y - 18, 12, ['#d8d4cc', '#a8a4b4', '#ffe070'], 60, false, 120, true);
      fx.rings.push({ x, y, life: 0.25, max: 0.25, col: '#d8d4cc', size: 22 });
      fx.shake = Math.max(fx.shake, 3);
    }
    return true;
  }
  if (ev.k === 'listenblind') {
    fx.say(x, y - 56, LISTEN_BLIND, '#d4e0c4', 1.8);
    fx.burst(x, y - 36, 6, ['#ffffff', '#cfe0c8'], 40, true);
    return true;
  }
  // Down a hole, and up out of one (the sapper's dig and surface, when it is THE LISTENER's).
  if ((ev.k === 'dig' || ev.k === 'surface') && near(ev, CAVE.at, 1.2)) {
    const up = ev.k === 'surface';
    fx.burst(x, y - 2, up ? 30 : 18, STONE, up ? 100 : 60, false, 220, true);
    fx.burst(x, y - 4, up ? 12 : 6, ['#d8d4cc', '#a8a4b4'], 40, false, -30);
    fx.rings.push({ x, y, life: up ? 0.4 : 0.3, max: up ? 0.4 : 0.3, col: '#c8b8a0', size: up ? 36 : 26 });
    if (up) fx.flashes.push({ x, y: y - 8, r: 70, i: 0.9, c: [0.85, 0.92, 1], life: 0.14, max: 0.14 }), (fx.shake = Math.max(fx.shake, 6));
    else fx.shake = Math.max(fx.shake, 3);
    return true;
  }
  // The rock coming down where it was thrown: more stone than the usual crater.
  if (ev.k === 'impact' && CAVE.rock && Math.hypot(ev.x - CAVE.rock.x, ev.y - CAVE.rock.y) < 0.4) {
    fx.burst(x, y - 4, 16, STONE, 85, false, 220, true);
    fx.burst(x, y - 8, 8, ['#d8d4cc', '#ffffff'], 60, true);
  }
  return false;
}

/** Their sounds, from the kit we have. True when it was one of theirs. */
export function listenSound(ev: FightEvent): boolean {
  if (ev.k === 'column') {
    if (ev.what === 'start') return sfx.propbreak(), sfx.rumble(), true;
    if (ev.what === 'land') return sfx.slam(), sfx.boom(), ev.down ? (sfx.wardbreak(), sfx.heavy(), true) : sfx.rumble(), true;
    return sfx.block(), sfx.thud(), true;
  }
  if (ev.k === 'listenblind') return sfx.stunned(), true;
  if ((ev.k === 'dig' || ev.k === 'surface') && CAVE.at && Math.hypot(ev.x - CAVE.at.x, ev.y - CAVE.at.y) <= 1.2) return ev.k === 'surface' ? (sfx.slam(), sfx.rumble(), true) : (sfx.thud(), sfx.rumble(), true);
  return false;
}
