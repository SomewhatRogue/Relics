/**
 * THE LEECHMAN's pool as effects and sounds (events from sim/leechhook.ts, leechbook.ts, leechwind.ts, leechlog.ts; the
 * bodies are client/leechdraw.ts, leechhero.ts, windlassdraw.ts, fendraw.ts): leeches thrown, latched, draining, shaken off;
 * the line's cast and haul; peat landing in mud; the windlass taken, turned, draining the shallows and giving them back; the
 * water rising; a log laid, knocked in (a big splash), and the Leechman hauling out. Cosmetic only; the kit's own sounds.
 */
import { POOL_SPOTS } from '../shared/fenarena';
import { LEECHMAN } from '../shared/leechtune';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { isFen, LEECH, leechTick, leechmanOf } from './leechstate';
import { sfx } from './sfx';
import { OX, OY, PX } from './world';

const WATER = ['#9fe8ff', '#5a8aa8', '#e8fbff'], MUD = ['#2e2216', '#4a3a22', '#1a130c', '#5a4a2a'], DARK = ['#2a1a28', '#8a6a86', '#1a0f1c'], BLOOD = ['#8a2e44', '#c01828', '#5a1020'], IRON = ['#8a8a94', '#c8c8d0', '#4a4a54'], WOOD = ['#4a3420', '#2e2016', '#6a5034'];
const px = (tx: number, ty: number): [number, number] => [OX + tx * PX, OY + ty * PX];
const KINDS = new Set(['leech', 'windlass', 'flood', 'log']);
/** Which of a blow's moments have had their sound and burst already (once per blow). */
const done = new WeakMap<object, Set<string>>();
let lastMud = -9;

function splash(fx: Fx, x: number, y: number, n: number, ring = 1): void {
  fx.burst(x, y - 2, n, WATER, 70, false, 170);
  fx.rings.push({ x, y, life: 0.5, max: 0.5, col: '#cfeeee', size: 8 + 5 * ring });
  fx.wet.ring((x - OX) / PX, (y - OY) / PX, 0.7 + ring * 0.3);
}

/** True if it was one of these (and has been drawn). (x, y) is the event's spot on screen. */
export function leechFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  const fen = !!LEECH.map && isFen(LEECH.map);
  if (KINDS.has(ev.k) || (ev.k === 'hooked' && fen)) LEECH.q.push(ev);
  switch (ev.k) {
    case 'leech':
      if (ev.what === 'throw') fx.burst(x, y - 22, 6, DARK, 40, false, 60);
      else if (ev.what === 'latch') (fx.burst(x, y - 14, 8, [...DARK, ...BLOOD], 45, false, 60), fx.rings.push({ x, y: y - 12, life: 0.25, max: 0.25, col: '#8a2e44', size: 12 }));
      else if (ev.what === 'drain') fx.burst(x, y - 14, 3, BLOOD, 22, false, 120);
      else fx.burst(x, y - 12, 10, DARK, 60, false, 160);
      return true;
    case 'mud':
      fx.burst(x, y - 2, 7, MUD, 55, false, 200, true);
      fx.burst(x, y - 6, 3, ['#6a5a40', '#3a2c1a'], 40, false, 240);
      return true;
    case 'hooked': {
      if (!fen) return false;
      // The line out and back: a run of cord specks from the Leechman to who it took, and the mud kicked up where they landed.
      const [x2, y2] = px(ev.x2, ev.y2), n = Math.max(4, Math.round(Math.hypot(x2 - x, y2 - y) / 3));
      for (let i = 0; i <= n; i++) fx.burst(x + ((x2 - x) * i) / n, y - 8 + ((y2 - y) * i) / n, 1, ['#c8b480', '#8a7a50'], 8, false);
      fx.burst(x2, y2 - 3, 12, MUD, 60, false, 200, true);
      return true;
    }
    case 'windlass': {
      if (ev.what === 'take') fx.burst(x, y - 14, 8, IRON, 50, true, 80);
      else if (ev.what === 'turn') fx.burst(x + 14, y - 10, 5, IRON, 40, true, 100);
      else if (ev.what === 'stuck') (fx.burst(x, y - 14, 6, ['#7a4a2a', '#4a4a54'], 40, false, 100), (fx.shake = Math.max(fx.shake, 2)));
      else if (ev.what === 'drained') {
        // The gurgle: water pouring away along the shallows toward the windlass, rings and spray the length of them.
        const s = POOL_SPOTS.shallows;
        for (let i = 0; i < 16; i++) { const [sx, sy] = px(s.x + ((i % 8) / 7) * s.w, s.y + (i < 8 ? 0.25 : 0.75) * s.h); splash(fx, sx, sy, 6, 0.5 + (i % 3) * 0.5); }
        fx.shake = Math.max(fx.shake, 4);
      } else if (ev.what === 'back') {
        const s = POOL_SPOTS.shallows;
        for (let i = 0; i < 12; i++) { const [sx, sy] = px(s.x + ((i % 6) / 5) * s.w, s.y + (i < 6 ? 0.3 : 0.7) * s.h); splash(fx, sx, sy, 7, 1 + (i % 2)); }
        fx.shake = Math.max(fx.shake, 3);
      }
      return ev.what !== 'let';
    }
    case 'flood':
      for (const d of ev.deep) {
        for (let i = 0; i < 7; i++) { const [sx, sy] = px(d.x + (d.w * (i % 2)), d.y + (d.h * (i + 0.5)) / 7); splash(fx, sx, sy, 6, 1); }
      }
      fx.shake = Math.max(fx.shake, 5);
      return true;
    case 'log': {
      const along = ev.w >= ev.h, half = (along ? ev.w : ev.h) / 2;
      if (ev.what === 'lay') {
        for (const s of [-1, 1]) { const [sx, sy] = px(ev.x + (along ? s * half : 0), ev.y + (along ? 0 : s * half)); splash(fx, sx, sy, 7, 1); fx.burst(sx, sy - 4, 8, WOOD, 40, false, 160); }
        fx.shake = Math.max(fx.shake, 3);
      } else if (ev.what === 'fall') {
        // Knocked in: a great splash up the whole length of it, and rings; bigger with the Leechman on it.
        for (let i = 0; i < 6; i++) { const [sx, sy] = px(ev.x + (along ? (i / 5 - 0.5) * 2 * half : 0), ev.y + (along ? 0 : (i / 5 - 0.5) * 2 * half)); splash(fx, sx, sy, ev.down ? 14 : 9, ev.down ? 2 : 1.4); }
        fx.burst(x, y - 8, ev.down ? 26 : 14, WOOD, 70, false, 200);
        fx.shake = Math.max(fx.shake, ev.down ? 10 : 6);
        if (ev.down) fx.flashes.push({ x, y: y - 8, r: 90, i: 0.9, c: [0.7, 0.9, 1], life: 0.2, max: 0.2 });
      } else if (ev.what === 'shrug') fx.burst(x, y - 14, 10, ['#cfeeee', '#7aa8b0', '#4a3a22'], 55, false, 160);
      else splash(fx, x, y, 16, 2);
      return true;
    }
  }
  return false;
}

/** Their sounds, from the kit we have. True when it was one of theirs. */
export function leechSound(ev: FightEvent): boolean {
  const fen = !!LEECH.map && isFen(LEECH.map), now = performance.now() / 1000;
  switch (ev.k) {
    case 'leech':
      return ev.what === 'throw' ? sfx.throw() : ev.what === 'latch' ? sfx.latch() : ev.what === 'drain' ? sfx.bite() : sfx.roll(), true;
    case 'mud':
      if (now - lastMud > 0.35) sfx.thud(), sfx.smoke();
      return (lastMud = now), true;
    case 'hooked':
      return fen ? (sfx.yank(), true) : false;
    case 'windlass':
      if (ev.what === 'take') sfx.grab(), sfx.latch();
      else if (ev.what === 'turn') sfx.latch(), sfx.lift();
      else if (ev.what === 'drained') sfx.steam(), sfx.rumble(), sfx.drop();
      else if (ev.what === 'back') sfx.slam(), sfx.steam();
      else if (ev.what === 'stuck') sfx.block();
      else sfx.drop();
      return true;
    case 'flood':
      return sfx.rumble(), sfx.boom(), true;
    case 'log':
      if (ev.what === 'lay') sfx.thud(), sfx.propbreak();
      else if (ev.what === 'fall') (sfx.slam(), sfx.boom(), ev.down && sfx.heavy());
      else if (ev.what === 'shrug') sfx.block();
      else sfx.heavy(), sfx.steam();
      return true;
  }
  return false;
}

/**
 * Once a frame (flat view): the stamps and the windlass guess (leechstate.ts), then the blows' own moments, once each: the line
 * cast, the peat heaved and landing, the leeches flung, the swing.
 */
export function leechFrame(room: ArenaRoom, now: number, fx: Fx): void {
  leechTick(room, now);
  const e = leechmanOf(room), a = e?.attack;
  if (!e || !a || e.act === 'dead') return;
  let seen = done.get(a);
  if (!seen) done.set(a, (seen = new Set()));
  const once = (k: string, cond: boolean, f: () => void) => { if (cond && !seen!.has(k)) (seen!.add(k), f()); };
  const move = e.boss?.cmove, [ex, ey] = px(e.x, e.y), w = a.windup, t = a.t, tell = a.tell ?? 0;
  if (move === 'line') {
    once('whirl', t >= tell, () => sfx.swing());
    once('cast', t >= w, () => (sfx.hookfire(), fx.burst(ex + a.dx * 14, ey - 18 + a.dy * 14, 6, ['#c8b480', '#8a7a50'], 50, false)));
  } else if (move === 'peat') {
    once('heave', t >= w - 0.4, () => sfx.throw());
    once('land', t >= w, () => {
      const L = (a.range ?? LEECHMAN.peat.range!), ox = ex + a.dx * L * PX, oy = ey + a.dy * L * PX;
      sfx.slam(), sfx.thud();
      fx.burst(ox, oy - 4, 22, MUD, 90, false, 240, true);
      fx.rings.push({ x: ox, y: oy, life: 0.4, max: 0.4, col: '#5a4a2a', size: 30 });
      fx.shake = Math.max(fx.shake, 6);
    });
  } else if (move === 'leeches') {
    once('fling', t >= w - 0.35, () => sfx.throw());
    once('land', t >= w, () => { const [lx, ly] = px(a.cx, a.cy); fx.burst(lx, ly - 4, 12, DARK, 60, false, 160); });
  } else if (move === 'wade' || move === 'punish') once('swing', t >= w, () => sfx.swing());
}
