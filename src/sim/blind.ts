/**
 * The blind hunters of the deep workings (numbers: shared/prowlers.ts CAVE). They never see you. They
 * hear anyone walking near (not creeping), any fight within a long way, and anyone who touches them;
 * they go to the sound and strike whoever is there. Creep away, and when they've heard nothing for a
 * while they've lost you and sniff about where you were.
 */
import { CAVE, SCRAPPER } from '../shared/tuning';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

const loud = (h: Hero) => h.act !== 'down' && h.id !== 'squire' && (h.act === 'attack' || h.act === 'charge' || h.act === 'roll' || (h.moving && !h.sneaking));

/** What it can hear this tick: the noisiest hero it hears, or a fight (a goblin hit or killed), or nothing. */
function hear(e: Enemy, heroes: Hero[], others: Enemy[], now: number): { x: number; y: number; h?: Hero } | null {
  let best: { x: number; y: number; h?: Hero } | null = null, bd = Infinity;
  for (const h of heroes) {
    if (h.act === 'down' || h.id === 'squire') continue;
    const d = Math.hypot(h.x - e.x, h.y - e.y), fighting = h.act === 'attack' || h.act === 'charge';
    if (d <= CAVE.touch || (loud(h) && d <= (fighting ? CAVE.fight : CAVE.hear))) if (d < bd) (bd = d), (best = { x: h.x, y: h.y, h });
  }
  if (best) return best;
  for (const o of others) if (o !== e && (isDead(o) ? o.actT < 0.5 : o.hitAt > now - 0.2) && Math.hypot(o.x - e.x, o.y - e.y) <= CAVE.fight) return { x: o.x, y: o.y };
  return null;
}

/** At rest: does it hear something? (It's woken by nothing it sees.) True once it has. */
export function blindNotice(e: Enemy, heroes: Hero[], others: Enemy[], now: number, ev: FightEvent[]): boolean {
  const s = hear(e, heroes, others, now);
  if (!s) return false;
  Object.assign(e, { alert: true, heardX: s.x, heardY: s.y, heardAt: now, feeding: false });
  ev.push({ k: 'listen', x: e.x, y: e.y });
  return true;
}

/** Hunting by ear: to the last sound, a slash at whoever's there, and lost if it's been quiet too long. */
export function stepBlind(e: Enemy, heroes: Hero[], others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  const s = hear(e, heroes, others, now);
  if (s) (e.heardX = s.x), (e.heardY = s.y), (e.heardAt = now);
  if (now - (e.heardAt ?? -99) > CAVE.forget) {
    // Lost you: it stops, listening, and goes back to waiting.
    Object.assign(e, { alert: false, home: { x: e.x, y: e.y } });
    return;
  }
  const gx = e.heardX ?? e.x, gy = e.heardY ?? e.y, gd = Math.hypot(gx - e.x, gy - e.y) || 1;
  (e.fx = (gx - e.x) / gd), (e.fy = (gy - e.y) / gd);
  // Whoever it heard, close enough: the slash.
  const h = s?.h;
  if (h && e.cooldown <= 0 && Math.hypot(h.x - e.x, h.y - e.y) <= CAVE.slash.range!) return begin(e, 'stab', CAVE.slash, h, ev);
  if (gd > 0.5) walk(e, gx - e.x, gy - e.y, SCRAPPER.speed * CAVE.pace, dt);
}
