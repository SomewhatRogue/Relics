/**
 * The sapper (numbers: shared/prowlers.ts SAPPER). Once it has seen you from close enough it digs in and
 * goes under, a line of heaving dirt on the floor, making for a spot behind whoever it's after; there it
 * comes up through a cracking striped circle with its pick. Under the ground no blade, arrow or spell
 * finds it (it's held like a carried goblin: nothing in the room touches it), but a heavy blow on the
 * dirt over it, a blast, or fire on its trail forces it up, stunned.
 */
import { SAPPER, SCRAPPER } from '../shared/tuning';
import { damage, isDead } from './damage';
import { begin, walk } from './enemies';
import type { World } from './elements';
import type { Enemy, FightEvent, Hero } from './types';

const ready = (e: Enemy, now: number) => now - (e.upAt ?? -99) >= SAPPER.again;

/** Above ground: dig in when it's seen you and is close enough and ready; true if it went under. */
export function maybeDig(e: Enemy, t: Hero, d: number, now: number, ev: FightEvent[]): boolean {
  if (e.under || !ready(e, now) || d > SAPPER.from || d < 2.5 || e.act !== 'chase') return false;
  Object.assign(e, { under: true, act: 'carried', z: -1, attack: null, digT: 0, upAt: now, kvx: 0, kvy: 0 });
  e.goX = t.x - t.fx * SAPPER.behind;
  e.goY = t.y - t.fy * SAPPER.behind;
  ev.push({ k: 'dig', x: e.x, y: e.y });
  return true;
}

/** Up out of the ground where it stands: the cracking circle, then its pick. */
function surface(e: Enemy, t: Hero, now: number, ev: FightEvent[]): void {
  Object.assign(e, { under: false, act: 'chase', z: 0, upAt: now, cooldown: 0 });
  begin(e, 'erupt', SAPPER.burst, t, ev);
  if (e.attack) (e.attack.cx = e.x), (e.attack.cy = e.y);
  ev.push({ k: 'surface', x: e.x, y: e.y });
}

/** Forced up by a heavy blow, a blast or fire: stunned where it comes up, and hurt. */
function unearth(e: Enemy, w: World): void {
  Object.assign(e, { under: false, act: 'stunned', actT: 0, actDur: SAPPER.stun, z: 0, upAt: w.now, attack: null });
  w.ev.push({ k: 'unearthed', x: e.x, y: e.y });
  damage(e, 10, w.now, w.ev, { heavy: true });
}

/** Does anything this tick drive it up? A heavy swing in front of a hero over it, a blast, fire. */
function flushed(e: Enemy, w: World): boolean {
  for (const v of w.ev) {
    const d = Math.hypot(v.x - e.x, v.y - e.y);
    if (v.k === 'swing' && v.heavy) {
      const h = w.heroes.find((q) => Math.abs(q.x - v.x) < 0.01 && Math.abs(q.y - v.y) < 0.01);
      const ahead = h ? ((e.x - h.x) * h.fx + (e.y - h.y) * h.fy) / (d || 1) > 0.3 : true;
      if (d <= SAPPER.flush + 1 && ahead) return true;
    }
    if (v.k === 'burst' && d <= v.r + SAPPER.flush) return true;
    if ((v.k === 'oilup' || v.k === 'oilfire' || v.k === 'firering' || v.k === 'ignite' || v.k === 'stamp') && d <= SAPPER.flush + 1.3) return true;
  }
  return false;
}

/** Once a tick, the sappers under the ground: on toward the spot, up when they're there (or too long under). */
export function stepSappers(w: World, dt: number): void {
  for (const e of w.enemies) {
    if (e.variant !== 'sapper' || !e.under || isDead(e)) continue;
    if (flushed(e, w)) {
      unearth(e, w);
      continue;
    }
    const t = w.heroes.filter((h) => h.act !== 'down').sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
    e.digT = (e.digT ?? 0) + dt;
    if (!t) continue;
    // It follows its quarry: the spot behind them, wherever they've gone.
    (e.goX = t.x - t.fx * SAPPER.behind), (e.goY = t.y - t.fy * SAPPER.behind);
    const dx = e.goX - e.x, dy = e.goY - e.y, l = Math.hypot(dx, dy);
    if (e.digT < SAPPER.dig) continue;
    if (l < 0.35 || e.digT > SAPPER.most) {
      surface(e, t, w.now, w.ev);
      continue;
    }
    (e.fx = dx / l), (e.fy = dy / l);
    walk(e, dx, dy, SCRAPPER.speed * SAPPER.under, dt);
  }
}
