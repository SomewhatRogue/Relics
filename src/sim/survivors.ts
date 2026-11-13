/**
 * The freed: whoever was in a cage is a body in the room once it breaks. They stand a moment, then run
 * for the way out on their own (Kyle, 2026-11-12: escorting them was tedious): where the party came into
 * the room (there they're safe, walk off and are gone), or a house's door, to come out with the party. Till then they're fragile:
 * the party's blows, shots, blasts and fire hurt them (survivorhits.ts), and goblins go for one that's
 * nearer them than any hero, their blows landing on the freed as on anyone (enemies.ts); one right on
 * them and they freeze, cowering. A dead one stays
 * where they fell. Out of a house with the party (walkOut) they're home at its door.
 */
import { collide, currentMap } from '../shared/arena';
import { wayTo } from './pathing';
import { burnFor } from '../shared/sky';
import { BURN, FALSE_CAGE, HERO, SURVIVOR } from '../shared/tuning';
import { slide } from './bodies';
import type { World } from './elements';
import { players } from './party';
import { survivorHazards } from './survivorhits';
import { stepLed } from './scenes';
import type { Enemy, FightEvent, Hero, Survivor } from './types';
import { isDead } from './damage';

/** Freed and still to be brought home (never a false prisoner: sim/falsecage.ts). What the goal counts. */
export const waiting = (s: Survivor) => !s.dead && s.home < 0 && s.tearAt === undefined && !s.taken;

/** The survivors still to be brought home in a world (none if it has no list): the ones that can be hurt. */
export const living = (w: { survivors?: Survivor[] }) => (w.survivors ?? []).filter(waiting);

/** A cage broke at (x, y): whoever was in it stands up there (`fake`: a false prisoner, sim/falsecage.ts). */
export function freeSurvivor(list: Survivor[], x: number, y: number, now: number, fake = false): Survivor {
  const s: Survivor = {
    id: list.length + 1, x, y, z: 0, kvx: 0, kvy: 0, hp: SURVIVOR.hp, maxHp: SURVIVOR.hp, at: now, hitAt: -9, by: '', dead: false, deadAt: -9,
    burnUntil: 0, burnNext: 0, burnBy: '', fx: 1, moving: false, home: -1, out: false, gone: false,
  };
  if (fake) s.tearAt = now + FALSE_CAGE.lurch;
  list.push(s);
  return s;
}

/** `n` damage from `by` (a hero's id, '' nobody's), pushed along (dx, dy); a burn `tick` doesn't stagger. */
export function hurtSurvivor(s: Survivor, n: number, by: string, now: number, ev: FightEvent[], dx = 0, dy = 0, tick = false): void {
  // The blow (or blast) that broke the cage this tick doesn't land on them: the bars took it.
  if (s.dead || s.home >= 0 || n <= 0 || s.at === now) return;
  s.hp -= n;
  s.hitAt = now;
  if (by) s.by = by;
  const l = Math.hypot(dx, dy);
  if (l > 0.01) (s.kvx += (dx / l) * SURVIVOR.knock), (s.kvy += (dy / l) * SURVIVOR.knock);
  ev.push(tick ? { k: 'survivorhit', x: s.x, y: s.y, id: s.id, n, by, tick } : { k: 'survivorhit', x: s.x, y: s.y, id: s.id, n, by });
  if (s.hp > 0) return;
  Object.assign(s, { hp: 0, dead: true, deadAt: now, burnUntil: 0, moving: false });
  ev.push({ k: 'survivordeath', x: s.x, y: s.y, id: s.id, by: by || s.by });
}

/** Set alight (by `by`, if anyone's): burns tick like a goblin's. */
export function igniteSurvivor(s: Survivor, by: string, now: number, ev: FightEvent[]): void {
  if (s.dead || s.home >= 0 || s.at === now) return;
  if (s.burnUntil <= now) (s.burnNext = now + BURN.every), ev.push({ k: 'ignite', x: s.x, y: s.y });
  s.burnUntil = now + BURN.time * burnFor(currentMap().theme);
  if (by) s.burnBy = by;
}

/**
 * Each tick: what hurts them, their burns, their run, and coming home. `entrance`: where the party came
 * into this room out in the open (home there), or null indoors, where they run to `door` and wait to come
 * out with the party (walkOut). Returns where
 * anyone just brought out of a house stands (for an ambush), or null.
 */
export function stepSurvivors(w: World, dt: number, entrance: { x: number; y: number } | null, door: { x: number; y: number } | null = null): { x: number; y: number } | null {
  const list = w.survivors ?? [];
  if (!list.length) return null;
  survivorHazards(w, dt);
  let out: { x: number; y: number } | null = null;
  for (const s of list) {
    if (s.gone) continue;
    slide(s, SURVIVOR.radius, dt);
    s.dropped = undefined;
    // A false prisoner stands where the cage was, lurching, till it tears open (sim/falsecage.ts).
    if (s.dead || s.tearAt !== undefined) continue;
    if (s.home >= 0) {
      leaving(s, entrance, w.now, dt);
      continue;
    }
    // Roped and led off (layout 4, sim/scenes.ts) while a guard still drives them.
    if (s.led && stepLed(s, w, dt)) continue;
    if (s.burnUntil > w.now && w.now >= s.burnNext) {
      s.burnNext = w.now + BURN.every;
      hurtSurvivor(s, BURN.dmg, s.burnBy, w.now, w.ev, 0, 0, true);
      if (s.dead) continue;
    }
    // The Staithe's: standing on the jetty for the punt, or netted on the bank till someone cuts them free (sim/staithe.ts).
    if (s.stay || s.netted) continue;
    if (s.out || (entrance && Math.hypot(s.x - entrance.x, s.y - entrance.y) <= SURVIVOR.homeReach)) {
      if (s.out) out ??= { x: s.x, y: s.y };
      Object.assign(s, { home: w.now, out: false, burnUntil: 0 });
      w.ev.push({ k: 'survivorhome', x: s.x, y: s.y, id: s.id });
      continue;
    }
    run(s, entrance ?? door, w.heroes, list, w.now, dt, w.enemies);
  }
  return out;
}

/** Home: off toward the way in, and gone when there (or after a while, wherever they've got to). */
function leaving(s: Survivor, to: { x: number; y: number } | null, now: number, dt: number): void {
  const dx = (to?.x ?? s.x) - s.x, dy = (to?.y ?? s.y + 9) - s.y, d = Math.hypot(dx, dy);
  s.moving = d > 0.4;
  if (s.moving) (s.x += (dx / d) * SURVIVOR.speed * dt), (s.y += (dy / d) * SURVIVOR.speed * dt), Math.abs(dx) > 0.2 && (s.fx = dx < 0 ? -1 : 1);
  collide(s, SURVIVOR.radius);
  if (!s.moving || now - s.home > SURVIVOR.walkOff) (s.gone = true), (s.moving = false);
}

/** For the way out, round what's in the way; then off anyone they'd be standing in. */
function run(s: Survivor, out: { x: number; y: number } | null, heroes: Hero[], all: Survivor[], now: number, dt: number, foes: Enemy[] = []): void {
  s.moving = false;
  // A goblin right on them: they freeze, cowering (it picks them off unless someone's there).
  const cowed = foes.some((e) => e.alert && !isDead(e) && e.kind !== 'dummy' && (e.z ?? 0) === (s.z ?? 0) && Math.hypot(e.x - s.x, e.y - s.y) < SURVIVOR.cower);
  const shaken = cowed || (now - s.hitAt < 0.35 && s.burnUntil <= now);
  if (out && now - s.at >= SURVIVOR.standUp && !shaken && Math.hypot(s.kvx, s.kvy) < 0.5) {
    const to = wayTo({ x: s.x, y: s.y, radius: SURVIVOR.radius }, out.x, out.y), d = Math.hypot(to.x - s.x, to.y - s.y);
    if (d > 0.05) {
      const k = Math.min(SURVIVOR.run * dt, d), dx = (to.x - s.x) / d;
      s.x += dx * k;
      s.y += ((to.y - s.y) / d) * k;
      if (Math.abs(dx) > 0.2) s.fx = dx < 0 ? -1 : 1;
      s.moving = true;
    }
  }
  // Out of the way: they step off a hero (heroes never have to push past them) and off each other.
  for (const o of [...heroes, ...all]) {
    if (o === s || ('dead' in o && (o.dead || o.gone)) || ('act' in o && o.act === 'down')) continue;
    const min = 'dead' in o ? SURVIVOR.radius * 2 + 0.05 : HERO.radius + SURVIVOR.radius + SURVIVOR.room;
    const dx = s.x - o.x, dy = s.y - o.y, d = Math.hypot(dx, dy);
    if (d >= min) continue;
    const k = ('dead' in o ? 0.5 : 1) * (min - d), nx = d > 1e-6 ? dx / d : s.id % 2 ? 1 : -1, ny = d > 1e-6 ? dy / d : 0;
    (s.x += nx * k), (s.y += ny * k);
  }
  collide(s, SURVIVOR.radius);
}

/** The player a survivor follows: the nearest one on their feet within `notice`. */
function nearest(s: Survivor, heroes: Hero[]): Hero | undefined {
  let lead: Hero | undefined, ld: number = SURVIVOR.notice;
  for (const h of players(heroes)) {
    const d = Math.hypot(h.x - s.x, h.y - s.y);
    if (!h.out && d < ld) (ld = d), (lead = h);
  }
  return lead;
}

/**
 * The party walks out of a house by its door: whoever they've freed in there and are leading (a player
 * within `notice`) comes out with them, by the door at (x, y), and is home (announced on the outside
 * room's next tick, which may bring an ambush).
 */
export function walkOut(from: Survivor[], heroes: Hero[], to: Survivor[], x: number, y: number): void {
  const going = from.filter((s) => waiting(s) && !!nearest(s, heroes));
  going.forEach((s, i) => {
    from.splice(from.indexOf(s), 1);
    // (No collide here: the map in use is still the house's. The street's own tick settles them.)
    Object.assign(s, { id: to.length + 1, x: x + ((i % 3) - 1) * 0.6, y: y + Math.floor(i / 3) * 0.5, z: 0, kvx: 0, kvy: 0, out: true, burnUntil: 0, moving: false });
    to.push(s);
  });
}
