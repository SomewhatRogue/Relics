/**
 * Pressure on an expedition (sim/exped.ts): it gets worse the longer you stay and the more noise you
 * make. Every EXPED.escalate the level goes up; blows, deaths, buildings coming down and oil fire make
 * noise where they happen, and once enough has gathered (and the level's wait is up) a wave comes in
 * from out of sight toward whoever's nearest it. A camp that sees you blows its war-horn: the whole camp
 * comes, and a wave with it. Patrols walk their roads; new hunting parties come in from the edge toward
 * where you were last heard. Holding the shrine or the beacon brings a wave every EXPED.holdWave, once the
 * screen has room for it (or HOLD.wait after it was due), with a quiet stretch after every third (shared/threat.ts HOLD).
 * Nothing past EXPED.cap goblins alive. Rolls are the expedition's own (a counter on its seed).
 */
import { collide, inArea, useMap } from '../shared/arena';
import { EXPED, EXPED_PACKS, HOLD, SLEEP } from '../shared/tuning';
import { capsFor } from '../shared/roombudget';
import { onScreen } from './pacing';
import { ringOf } from '../shared/expedrings';
import { isDead } from './damage';
import { walk } from './enemies';
import { everyone, type ExpedState } from './exped';
import { nearest, roomFor, toughen, waveFoe, waveRoles } from './expedwave';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent, Hero } from './types';

/** The expedition's own roll: a hash of its seed and a counter, kept in the state (so a save carries it). */
export function roll(x: ExpedState): number {
  let t = (x.seed * 2654435761 + ++x.n * 1013904223) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function stepPressure(room: ArenaRoom, x: ExpedState, heroes: Hero[], ev: FightEvent[], dt: number): void {
  const t = room.time, all = everyone(room), alive = all.filter((e) => !isDead(e)).length;
  const lv = Math.min(EXPED.maxLevel, Math.floor(t / EXPED.escalate));
  if (lv > x.level) (x.level = lv), ev.push({ k: 'exped', x: x.hx, y: x.hy, what: 'worse' });
  x.heat *= Math.exp(-dt / EXPED.fade);
  for (const e of ev) {
    const n = e.k === 'hit' && e.on === 'enemy' ? EXPED.noise.hit : e.k === 'death' ? EXPED.noise.death : e.k === 'collapse' ? EXPED.noise.collapse : e.k === 'oilfire' ? EXPED.noise.oil : 0;
    if (n) heard(x, e.x, e.y, n);
  }
  horns(room, x, all, ev);
  if (!heroes.length) return;
  // A friend more, half a goblin more a wave (a party meets tougher goblins, not many more: sim/expedwave.ts toughen).
  const size = EXPED.waveSize[x.level] + Math.floor(Math.max(0, x.party - 1) / 2);
  if (t >= x.nextWave && x.heat >= EXPED.wave && alive < EXPED.cap) {
    x.nextWave = t + EXPED.waveEvery[x.level];
    x.heat *= 0.4;
    if (wave(room, x, heroes, x.hx, x.hy, Math.min(size, EXPED.cap - alive))) ev.push({ k: 'exped', x: x.hx, y: x.hy, what: 'wave' });
  }
  // Holding the shrine or the beacon: they keep coming while you're there.
  // (The gibbet's winch in Hangman's Wood is a hold too.)
  const job = x.goals.find((g) => (g.kind === 'shrine' || g.kind === 'winch') && !g.done && g.p > 0);
  const hold = x.phase === 'hold' ? x.zone : job;
  const holdR = ringOf(x.phase === 'hold' ? 'beacon' : job?.kind === 'winch' ? 'winch' : 'shrine') + EXPED.holdNear;
  if (hold && t >= x.nextHold && alive < EXPED.cap && heroes.some((h) => Math.hypot(h.x - hold.x, h.y - hold.y) < holdR) && holdReady(room, x, heroes, t)) {
    // After every HOLD.every-th, a quiet stretch with the horn silent (shared/threat.ts HOLD).
    x.holds = (x.holds ?? 0) + 1;
    x.nextHold = t + EXPED.holdWave * (x.phase === 'hold' ? 0.8 : 1) + (x.holds % HOLD.every === 0 ? HOLD.quiet : 0);
    x.holdDue = undefined;
    wave(room, x, heroes, hold.x, hold.y, Math.min(size + (x.phase === 'hold' ? 2 : 0), EXPED.cap - alive));
  }
  // A hunting party in from the edge, toward where you were last heard.
  if (t >= x.nextPatrol && alive < EXPED.cap - 10) {
    x.nextPatrol = t + EXPED.patrolEvery / (1 + x.level * 0.25);
    const ids = wave(room, x, heroes, x.hx, x.hy, 3 + Math.floor(x.level / 2), false);
    if (ids.length) x.patrols.push({ ids, path: [{ x: x.hx, y: x.hy }], i: 0, dir: 1 });
  }
  patrol(room, x, dt);
}

/** A hold wave that's due comes when the screen is under HOLD.wave of the party's cap, or HOLD.wait seconds after it was due. */
function holdReady(room: ArenaRoom, x: ExpedState, heroes: Hero[], t: number): boolean {
  x.holdDue ??= t;
  return t - x.holdDue >= HOLD.wait || onScreen(room.enemies, heroes).threat < capsFor(heroes.length, 2).threat * HOLD.wave;
}

function heard(x: ExpedState, px: number, py: number, n: number): void {
  const k = n / (x.heat + n);
  (x.hx += (px - x.hx) * k), (x.hy += (py - x.hy) * k), (x.heat += n);
}

/** A camp whose goblins have seen you: the horn, everyone in it comes, and a wave on its heels. */
function horns(room: ArenaRoom, x: ExpedState, all: Enemy[], ev: FightEvent[]): void {
  for (const c of x.camps) {
    if (c.alerted) continue;
    const mine = all.filter((e) => c.ids.includes(e.id));
    if (!mine.some((e) => e.alert === true && !isDead(e))) continue;
    c.alerted = c.known = true;
    for (const e of mine) if (e.alert === false) e.alert = true;
    heard(x, c.x, c.y, EXPED.noise.horn);
    x.nextWave = Math.min(x.nextWave, room.time + 4);
    ev.push({ k: 'exped', x: c.x, y: c.y, what: 'horn' });
  }
}

/** Open ground for a body at (px, py): on the map, out of water, nothing solid there. */
function open(room: ArenaRoom, px: number, py: number): boolean {
  const m = room.map;
  if (px < 2 || py < 2.5 || px > m.w - 2 || py > m.h - 2) return false;
  if ((m.water ?? []).some((w) => inArea({ x: w.x - 0.6, y: w.y - 0.6, w: w.w + 1.2, h: w.h + 1.2 }, px, py))) return false;
  useMap(m);
  const q = { x: px, y: py };
  collide(q, 0.5);
  return Math.hypot(q.x - px, q.y - py) < 1e-6;
}

/**
 * `n` goblins come in out of sight, as one pack (sim/expedwave.ts): round the hero nearest (px, py),
 * EXPED.waveFrom tiles off (inside the wake ring, so they don't doze), on open ground, and at least 18
 * from every hero. `hunt`: they come for you at once; else they walk to (px, py) and look about (a
 * hunting party).
 */
export function wave(room: ArenaRoom, x: ExpedState, heroes: Hero[], px: number, py: number, n: number, hunt = true): number[] {
  if (n <= 0) return [];
  const h = nearest(heroes, px, py);
  const base = Math.atan2(h.y - py, h.x - px) + Math.PI;
  for (let t = 0; t < 24; t++) {
    const a = base + (roll(x) - 0.5) * Math.PI * (t < 8 ? 1 : 2), d = EXPED.waveFrom[0] + roll(x) * (EXPED.waveFrom[1] - EXPED.waveFrom[0]);
    const cx = h.x + Math.cos(a) * d, cy = h.y + Math.sin(a) * d;
    if (!open(room, cx, cy) || heroes.some((o) => Math.hypot(o.x - cx, o.y - cy) < 18) || d > SLEEP.doze - 0.5) continue;
    const { roles, bunch } = waveRoles(x, n, roomFor(room, h), () => roll(x)), pack = EXPED_PACKS.wave0 + x.n, made: Enemy[] = [];
    for (const role of roles) {
      const ox = cx + (roll(x) - 0.5) * 2.4, oy = cy + (roll(x) - 0.5) * 2.4;
      if (!open(room, ox, oy)) continue;
      const e = waveFoe(room, role, ox, oy, pack, bunch);
      if (!hunt) e.alert = false;
      made.push(e);
    }
    toughen(made, x.party);
    return made.map((e) => e.id);
  }
  return [];
}

/** Patrols at rest walk their path (back and forth); once they've seen you they're just goblins. */
function patrol(room: ArenaRoom, x: ExpedState, dt: number): void {
  const awake = new Map(room.enemies.map((e) => [e.id, e]));
  x.patrols = x.patrols.filter((p) => {
    const mine = p.ids.map((id) => awake.get(id)).filter((e): e is Enemy => !!e && !isDead(e) && e.alert === false && !e.feeding);
    if (!mine.length) return p.ids.some((id) => !awake.has(id));
    const to = p.path[p.i], lead = mine[0];
    if (Math.hypot(to.x - lead.x, to.y - lead.y) < 1.2) {
      if (p.path.length < 2) return true;
      if (p.i + p.dir < 0 || p.i + p.dir >= p.path.length) p.dir = -p.dir;
      p.i += p.dir;
    }
    mine.forEach((e, k) => {
      const tx = to.x + (k % 2 ? 0.7 : -0.7) * (k ? 1 : 0), ty = to.y + k * 0.5, dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy);
      if (l < 0.3) return;
      (e.fx = dx / l), (e.fy = dy / l), (e.home = { x: e.x, y: e.y });
      walk(e, dx, dy, EXPED.patrolSpeed, dt);
    });
    return true;
  });
}
