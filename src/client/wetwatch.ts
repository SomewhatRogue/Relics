/**
 * Feet in the water, from what bodies do between room ticks (paint only): anyone wading the shallows,
 * hero or goblin, leaves a ring at their feet every couple of steps; a roll, jump or dash that lands in
 * water splashes, as does a butcher's leap coming down and a body falling in. Bigger for butchers.
 * Cosmetic (Math.random is fine); the rings are capped (wetfx.ts).
 */
import type { ArenaRoom } from '../sim/room';
import type { Fx } from './fx';
import { DEEP, DRY } from './waterfield';
import { toPx } from './world';

interface Track { x: number; y: number; act: string; walked: number; k: number }
const seen = new Map<string, Track>();
let room: ArenaRoom | null = null, last = -1;

/** How far (tiles) a body wades between rings: about every second step. */
const STRIDE = 0.7;
const SPRAY = ['#c8dcdc', '#9ab8bc', '#7a9aa4'];

/** Water thrown up at (x, y) tiles: droplets and two rings, `k` bigger for a butcher. */
export function splash(fx: Fx, x: number, y: number, k = 1): void {
  if (fx.wet.at(x, y) === DRY) return;
  const [px, py] = toPx(x, y), n = Math.round(7 * k);
  for (let i = 0; i < n; i++) {
    const a = Math.PI + Math.random() * Math.PI, s = (30 + Math.random() * 40) * Math.sqrt(k), life = 0.25 + Math.random() * 0.2;
    fx.parts.push({ x: px + (Math.random() - 0.5) * 6 * k, y: py, vx: Math.cos(a) * s * 0.6, vy: Math.sin(a) * s, life, max: life, col: SPRAY[i % 3], glow: false, grav: 260, stick: false });
  }
  fx.wet.ring(x, y, 1.4 * k);
  fx.wet.ring(x, y, 0.8 * k);
}

function track(key: string, x: number, y: number, act: string): Track {
  let s = seen.get(key);
  if (!s) seen.set(key, (s = { x, y, act, walked: 0, k: 0 }));
  return s;
}

/** Wading: a ring every STRIDE tiles (a big body's wider). */
function wade(fx: Fx, s: Track, x: number, y: number, k: number): void {
  const lv = fx.wet.at(x, y);
  if (lv === DRY || lv === DEEP) return void (s.walked = 0);
  s.walked += Math.hypot(x - s.x, y - s.y);
  if (s.walked >= STRIDE * Math.sqrt(k)) (s.walked = 0), fx.wet.ring(x + (Math.random() - 0.5) * 0.1, y + 0.05, k);
}

/** Look at the room once a tick (between ticks nothing has moved). */
export function watchWater(r: ArenaRoom, fx: Fx): void {
  fx.wet.use(r.map);
  if (r !== room) (room = r), seen.clear(), (last = r.time);
  if (!fx.wet.field || r.time - last <= 0) return;
  last = r.time;
  for (const h of r.heroes) {
    const s = track('h:' + h.id, h.x, h.y, h.act), lands = (s.act === 'roll' || s.act === 'bash' || s.act === 'zip') && h.act !== s.act;
    if (lands) splash(fx, h.x, h.y, 0.9);
    else if (h.act !== 'down' && !h.z) wade(fx, s, h.x, h.y, 1);
    (s.x = h.x), (s.y = h.y), (s.act = h.act);
  }
  for (const e of r.enemies) {
    if (e.act === 'carried' || e.kind === 'nest') continue;
    const big = e.kind === 'butcher' ? 1.7 : e.kind === 'brood' ? 1.4 : 1, s = track('e:' + e.id, e.x, e.y, e.act), a = e.attack;
    if (e.act === 'dead') {
      // A body falling in (once).
      if (s.act !== 'dead') splash(fx, e.x, e.y, big);
    } else {
      // A butcher's leap (the slam) coming down; a body thrown that comes to rest; feet.
      const k = a ? a.t / a.windup : 0;
      if (a?.kind === 'slam' && s.k < 1 && k >= 1) splash(fx, e.x, e.y, big * 1.2);
      else if (!e.z) wade(fx, s, e.x, e.y, big);
      s.k = a ? k : 0;
    }
    (s.x = e.x), (s.y = e.y), (s.act = e.act);
  }
}
