/**
 * The Night Watch, one shift on Wickhold's wall (Kyle 2026-11-05; docs/plans/town-activities.md). It
 * runs only in this browser: nothing goes to the relay. Three minutes of goblins coming over the
 * fields; shoot as many as you can, as cleanly as you can. Anything that gets under the wall drops
 * out of sight and the watch below have it: you lose its points and your streak. No fail state but
 * the clock. Stepped in fixed steps from its own seed, so the same seed and inputs play the same.
 */
import { Rng } from '../shared/rng';
import { BOW, FIELDS, FOES, GOBS, WATCH, groundY, type FieldName } from '../shared/watchtune';
import { rollNight, spawnDue } from './watchnight';
import { aimOf, flyArrows, kill, loose } from './watchshot';
import { breakStreak } from './watchscore';
import { feet } from './watchzones';
import type { Gob, WatchIntent, WatchState } from './watchtypes';

export function newWatch(seed: number, field: FieldName = 'wide'): WatchState {
  const rng = new Rng(seed), night = rollNight(rng, field);
  return {
    seed, field, rng, t: 0, over: false, gobs: [], arrows: [], pins: [], bits: [], darts: [], ...night, nextId: 1, nextSpawn: 1.2, met: [],
    draw: 0, nockAt: 0, queued: false, looses: 0, ax: (FIELDS[field].from + WATCH.reachX) / 2, ay: groundY((FIELDS[field].from + WATCH.reachX) / 2, field) - 14, shakeUntil: -9,
    score: 0, streak: 0, bestStreak: 0, kills: 0, heads: 0, shots: 0, hits: 0, lost: 0, events: [], carry: 0,
  };
}

/** Run the shift on by `dt` seconds of play, in fixed steps; the events of all of them are in `s.events`. */
export function advance(s: WatchState, intent: WatchIntent, dt: number): void {
  s.events = [];
  s.carry += Math.min(dt, 0.25);
  while (s.carry >= WATCH.step && !s.over) {
    s.carry -= WATCH.step;
    stepWatch(s, intent, WATCH.step);
  }
}

/** One fixed step. */
export function stepWatch(s: WatchState, i: WatchIntent, dt: number): void {
  s.t += dt;
  s.ax = Math.max(FIELDS[s.field].from - 20, Math.min(WATCH.w, i.ax));
  s.ay = Math.max(0, Math.min(FIELDS[s.field].h, i.ay));
  // The bow: held, it draws; each release looses (one waiting till the next arrow's on the string).
  if (i.looses > s.looses) (s.looses = i.looses), (s.queued = true);
  if (s.queued && s.t >= s.nockAt) {
    loose(s);
    s.queued = false;
    s.draw = 0;
    s.nockAt = s.t + BOW.nock;
  } else if (i.held && s.t >= s.nockAt && !s.queued) s.draw += dt;
  else if (!i.held) s.draw = 0;
  spawnDue(s);
  for (const g of s.gobs) stepGob(s, g, dt);
  flyArrows(s, dt);
  flyDarts(s);
  fallBits(s, dt);
  // The fallen lie a while; the arrows in the ground stay a little longer.
  s.gobs = s.gobs.filter((g) => !(g.state === 'dead' && s.t - g.at > FOES.corpse) && !(g.state === 'gone' && s.t - g.at > 1));
  s.pins = s.pins.filter((p) => s.t - p.t < 20);
  if (s.t >= WATCH.duration) (s.over = true), s.events.push({ k: 'end' });
}

function stepGob(s: WatchState, g: Gob, dt: number): void {
  if (g.state === 'dead' || g.state === 'gone') return;
  if (g.burning >= 0 && s.t - g.burning >= FOES.burn) return kill(s, g, 'fire');
  // An archer stops in its band and looses at the wall, then walks on.
  if (g.kind === 'archer' && g.state === 'walk' && g.shots < FOES.archerShots && g.x >= g.stopX) (g.state = 'aim'), (g.at = s.t), (g.nextShot = s.t + 0.8);
  if (g.state === 'aim') {
    if (g.burning < 0 && s.t >= g.nextShot) shootAtWall(s, g);
    if (g.shots >= FOES.archerShots && s.t >= g.nextShot - FOES.archerEvery + 0.6) (g.state = 'walk'), (g.at = s.t);
    return;
  }
  const v = GOBS[g.kind].speed * FIELDS[s.field].pace * (g.limp ? BOW.limp : 1) * (g.burning >= 0 ? FOES.burnRun : 1);
  g.x += v * dt;
  g.walked += v * dt;
  if (g.x >= WATCH.reachX) {
    // Down in the ditch under the wall, out of your sight: the watch below have it.
    g.state = 'gone';
    g.at = s.t;
    s.lost++;
    breakStreak(s);
    s.events.push({ k: 'wall', x: g.x, y: groundY(g.x, s.field) - 10, gob: g.id });
  }
}

/** An archer's arrow at the wall: it always falls short or flies over, but close enough to shake you. */
function shootAtWall(s: WatchState, g: Gob): void {
  const [fx, fy] = feet(g), over = s.rng.next() < 0.5;
  s.darts.push({ x0: fx + 4, y0: fy - 13, x1: WATCH.bowX + s.rng.range(-6, 4), y1: over ? WATCH.bowY - s.rng.range(10, 18) : WATCH.parapetTop + 2, t0: s.t });
  g.shots++;
  g.nextShot = s.t + FOES.archerEvery;
  s.events.push({ k: 'dart', x: fx, y: fy - 13 });
}

function flyDarts(s: WatchState): void {
  s.darts = s.darts.filter((d) => {
    if (s.t - d.t0 < FOES.arrowFlight) return true;
    s.shakeUntil = s.t + FOES.shake;
    s.events.push({ k: 'nearmiss', x: d.x1, y: d.y1 });
    return false;
  });
}

/** Helmets, planks, torches and glanced arrows fall, spin and come to rest on the ground. */
function fallBits(s: WatchState, dt: number): void {
  for (const b of s.bits) {
    if (b.rest) continue;
    b.vy += 140 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rot += b.spin * dt;
    const gy = groundY(b.x, s.field) - 1;
    if (b.y >= gy) (b.y = gy), (b.rest = true);
  }
  s.bits = s.bits.filter((b) => s.t - b.t < 12);
}

/** Where the bow is pointing now (the sight, with any shake). */
export const sightOf = aimOf;
