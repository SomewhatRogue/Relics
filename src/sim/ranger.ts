/**
 * The Ranger's own: the snare left where they jump back from, and the hound.
 *
 * A snare sits where you stood: the first goblin to step in is held (a butcher only slowed). One every
 * SNARE.cooldown, two down at once at most.
 *
 * The hound runs at your heel and joins in now and then: it picks out what you've been hitting (or
 * the nearest small goblin), runs it down and worries it, then comes back. It can't be killed; a
 * butcher winding up near it scares it off for a while, and it comes back when it's ready.
 */
import { HOUND, SNARE, WEAPONS } from '../shared/tuning';
import { catches } from './techranger';
import { snareSpots } from './ladderranger';
import { damage, isDead } from './damage';
import { houndBite, houndBites, houndWait, snareHold, snareMax, snareWait } from './knacks';
import { knows, type Enemy, type FightEvent, type Hero, type Hound, type Snare } from './types';
import { stun } from './stuns';
import { markOf } from './mark';

/** Jumped back as a Ranger: leave a snare where you stood (if one's ready). */
export function laySnare(h: Hero, snares: Snare[], now: number, ev: FightEvent[]): void {
  if (WEAPONS[h.weapon].cls !== 'RANGER' || now < h.snareReady || !knows(h, 'leave')) return;
  h.snareReady = now + snareWait(h);
  // TWO SNARES: a pair across the jump, and twice as many down at once (sim/ladderranger.ts).
  const spots = snareSpots(h), most = snareMax(h) * spots.length;
  for (const [x, y] of spots) {
    const mine = snares.filter((s) => s.owner === h.id);
    if (mine.length >= most) snares.splice(snares.indexOf(mine[0]), 1);
    snares.push({ owner: h.id, x, y, until: now + SNARE.life, hold: snareHold(h), left: catches(h) });
    ev.push({ k: 'snareset', x, y });
  }
  if (spots.length > 1) ev.push({ k: 'twinsnare', x: h.rollX, y: h.rollY });
}

/** A goblin steps in: held (or slowed, if big). False once it has gone off or worn out. With TRAPPER
 *  it stays set for a second goblin (not the one it already holds), and shows it's set again. */
export function stepSnare(s: Snare, enemies: Enemy[], now: number, ev: FightEvent[]): boolean {
  if (now > s.until) return false;
  const e = enemies.find((o) => !isDead(o) && o.kind !== 'dummy' && o.kind !== 'swingDummy' && (o.z ?? 0) === 0 && !s.got?.includes(o.id) && Math.hypot(o.x - s.x, o.y - s.y) < SNARE.radius + o.radius);
  if (!e) return true;
  const hold = s.hold ?? SNARE.hold, more = (s.left ?? 1) > 1;
  (s.got ??= []).push(e.id);
  s.left = (s.left ?? 1) - 1;
  if (more) ev.push({ k: 'snareset', x: s.x, y: s.y });
  // (A small one held is a stun: the same Ranger's snare doesn't hold it twice running. The catch is spent either way.)
  if (e.weight <= 1 && !stun(e, s.owner, now, hold, ev)) return more;
  e.snareUntil = now + hold;
  ev.push({ k: 'snared', x: e.x, y: e.y });
  return more;
}

const newHound = (h: Hero): Hound => ({ x: h.x - h.fx, y: h.y - h.fy + 0.6, fx: h.fx, fy: h.fy, state: 'heel', target: 0, t: 0, next: 4, back: 0, bites: 0, moving: false });

/** The hound, a tick at a time (only with a Ranger). */
export function stepHound(h: Hero, enemies: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  if (WEAPONS[h.weapon].cls !== 'RANGER' || h.noHound) return void (h.hound = null);
  const d = (h.hound ??= newHound(h));
  // You're out cold: it lies across your legs and doesn't stir.
  if (h.lying) return void Object.assign(d, { x: h.x + 0.55, y: h.y + 0.12, fx: -1, fy: 0, state: 'heel', moving: false, down: true, next: now + 3 });
  d.down = false;
  d.t += dt;
  const to = (x: number, y: number, speed: number, stop: number) => {
    const dx = x - d.x, dy = y - d.y, l = Math.hypot(dx, dy);
    d.moving = l > stop;
    if (l > stop) (d.x += (dx / l) * Math.min(l - stop, speed * dt)), (d.y += (dy / l) * Math.min(l - stop, speed * dt)), (d.fx = dx / l), (d.fy = dy / l);
    return l;
  };
  // Scared off: away from the danger, gone a while, then back at your heel.
  if (d.state === 'fled') {
    if (d.t < 2) to(d.x + d.fx * 5, d.y + d.fy * 5, HOUND.speed, 0);
    if (now >= d.back) Object.assign(d, newHound(h), { next: now + 3 }), ev.push({ k: 'bark', x: d.x, y: d.y });
    return;
  }
  // A butcher winding up close by: it bolts.
  const big = enemies.find((e) => e.kind === 'butcher' && !isDead(e) && e.attack && e.attack.t < e.attack.windup && Math.hypot(e.x - d.x, e.y - d.y) < HOUND.scare);
  if (big) {
    const l = Math.hypot(d.x - big.x, d.y - big.y) || 1;
    Object.assign(d, { state: 'fled', t: 0, back: now + HOUND.away, fx: (d.x - big.x) / l, fy: (d.y - big.y) / l, target: 0 });
    return void ev.push({ k: 'yelp', x: d.x, y: d.y });
  }
  const prey = enemies.find((e) => e.id === d.target && !isDead(e));
  if (d.state === 'heel') {
    const side = Math.sin(h.id.length + d.next) > 0 ? 1 : -1;
    to(h.x - h.fx * 1.1 - h.fy * side * 0.8, h.y - h.fy * 1.1 + h.fx * side * 0.8 + 0.2, HOUND.speed, 0.3);
    if (now < d.next) return;
    // Now and then: what you've been hitting, or the nearest small goblin near you.
    // Training: never one that's swinging at you (that's yours to dodge or parry).
    const awake = enemies.filter((e) => !isDead(e) && e.alert !== false && e.kind === 'scrapper' && Math.hypot(e.x - h.x, e.y - h.y) < HOUND.reach && !(h.calmHound && e.attack));
    // Your MARK first, wherever it is in reach (sim/mark.ts); then what you've been hitting.
    const pick = markOf(h.id, enemies, now) ?? awake.find((e) => e.lastBy === h.id && e.hitAt > now - 2) ?? awake.sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    if (!pick) return void (d.next = now + 1);
    Object.assign(d, { state: 'run', target: pick.id, t: 0, bites: 0 });
    return void ev.push({ k: 'bark', x: d.x, y: d.y });
  }
  const every = houndWait(h) * (h.calmHound ? 1.5 : 1);
  if (!prey || d.t > 6) return void Object.assign(d, { state: 'heel', target: 0, next: now + every + (h.id.length % 3) });
  if (d.state === 'run') {
    if (to(prey.x, prey.y, HOUND.speed * 1.3, 0.6) <= 0.65) Object.assign(d, { state: 'bite', t: HOUND.biteEvery });
    return;
  }
  // Worrying it: a bite every so often, the small ones knocked off their feet, then back to you.
  to(prey.x, prey.y, HOUND.speed, 0.6);
  if (d.t < HOUND.biteEvery) return;
  d.t = 0;
  d.target = prey.id;
  damage(prey, houndBite(h), now, ev, { src: 'hound', how: 'opened' });
  // It knocks a small one off its stride (not while you're training: you're meant to meet that blow).
  if (prey.kind === 'scrapper' && !isDead(prey) && !h.calmHound) Object.assign(prey, { attack: null, act: 'flinch', actT: 0, actDur: 0.35 });
  if (++d.bites >= houndBites(h) || isDead(prey)) Object.assign(d, { state: 'heel', target: 0, next: now + every + (h.id.length % 3) });
}
