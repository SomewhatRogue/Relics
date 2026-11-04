/**
 * Magic augments on goblins. Fire burns and spreads by touch; frost chills, then freezes solid;
 * storm arcs to the nearest goblins and to javelins stuck in bodies. They play off each other:
 * fire meets frost as a steam burst, storm or a heavy blow shatters the frozen, storm on the
 * burning flares outward.
 */
import { BURN, FLARE, FROST, SHATTER, SPIDER, STEAM, STORM, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { clearElements, damage, frozen, isDummy } from './damage';
import type { Rng } from '../shared/rng';
import type { Enemy, FightEvent, Hero, Javelin, Prop, Survivor } from './types';
import { stun } from './stuns';

/** Everything an element can reach, for one tick. */
export interface World {
  heroes: Hero[];
  enemies: Enemy[];
  javelins: Javelin[];
  props: Prop[];
  /** The freed (sim/survivors.ts); a world without them leaves them out. */
  survivors?: Survivor[];
  now: number;
  ev: FightEvent[];
  /** The room's fire stream: whether a house catches (sim/catching.ts). */
  rng?: Rng;
  /** The room's cage stream, only where a cage can hold a false prisoner (sim/falsecage.ts). */
  cages?: Rng;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
export const burning = (e: Enemy, now: number) => e.burnUntil > now;
export const chilled = (e: Enemy, now: number) => e.chillUntil > now;

function ignite(e: Enemy, now: number, ev: FightEvent[]): void {
  if (!burning(e, now)) ev.push({ k: 'ignite', x: e.x, y: e.y }), (e.burnNext = now + BURN.every);
  e.burnUntil = now + BURN.time;
}

/** An element lands on a goblin with a blow of `n` damage. */
export function afflict(w: World, e: Enemy, el: Augment, n: number): void {
  if (!el || e.act === 'dead') return;
  const { now, ev } = w;
  if (el === 'fire') {
    if (frozen(e, now) || chilled(e, now)) return steam(w, e);
    ignite(e, now, ev);
  } else if (el === 'frost') {
    if (burning(e, now)) return steam(w, e);
    if (frozen(e, now)) return;
    if (chilled(e, now)) {
      e.chillUntil = 0;
      e.frozenUntil = now + FROST.freeze;
      e.attack = null;
      if (e.act === 'attack' || e.act === 'chase' || e.act === 'flinch') Object.assign(e, { act: isDummy(e) ? 'idle' : 'chase', actT: 0 });
      ev.push({ k: 'freeze', x: e.x, y: e.y });
    } else {
      e.chillUntil = now + FROST.chill;
      ev.push({ k: 'chill', x: e.x, y: e.y });
    }
  } else zap(w, e, n, true);
}

/** Storm on one goblin: shatters the frozen, flares the burning, and (once) arcs onward. */
function zap(w: World, e: Enemy, n: number, chain: boolean): void {
  const { now, ev } = w;
  if (frozen(e, now)) shatter(e, now, ev);
  else if (burning(e, now)) flare(w, e);
  if (!chain) return;
  const near = w.enemies
    .filter((o) => o !== e && o.act !== 'dead' && dist(o, e) <= STORM.reach)
    .sort((a, b) => dist(a, e) - dist(b, e))
    .slice(0, STORM.chains);
  const rods: Enemy[] = [];
  for (const j of w.javelins) {
    const o = j.state === 'body' ? w.enemies.find((x) => x.id === j.enemy) : undefined;
    if (o && o !== e && o.act !== 'dead' && !near.includes(o) && !rods.includes(o) && dist(o, e) <= STORM.rodReach) rods.push(o);
  }
  for (const o of [...near, ...rods]) {
    ev.push({ k: 'shock', x: e.x, y: e.y, x2: o.x, y2: o.y });
    const hit = rods.includes(o) ? STORM.rodDmg : Math.max(STORM.min, Math.round(n * STORM.share));
    if (!damage(o, hit, now, ev, { flinch: STORM.flinch, el: 'storm' })) zap(w, o, 0, false);
  }
}

/** A frozen goblin breaks: big damage, the ice gone. */
export function shatter(e: Enemy, now: number, ev: FightEvent[]): void {
  e.frozenUntil = 0;
  ev.push({ k: 'shatter', x: e.x, y: e.y });
  damage(e, SHATTER.dmg, now, ev, { heavy: true, how: 'shatter', el: 'frost' });
}

/** Fire meets frost: both gone in a scalding cloud that stuns everything around. */
function steam(w: World, e: Enemy): void {
  const { now, ev } = w;
  clearElements(e);
  ev.push({ k: 'steam', x: e.x, y: e.y });
  for (const o of w.enemies) {
    if (o.act === 'dead' || dist(o, e) > STEAM.radius + o.radius) continue;
    if (damage(o, STEAM.dmg, now, ev)) continue;
    // (A stun from whoever set the steam off, so not twice running from them: sim/stuns.ts.)
    if (o.act !== 'pinned' && o.act !== 'carried') stun(o, e.lastBy, now, STEAM.stun, ev);
  }
}

/** Storm on the burning: the fire bursts outward and throws everything near. */
function flare(w: World, e: Enemy): void {
  const { now, ev } = w;
  e.burnUntil = 0;
  ev.push({ k: 'flare', x: e.x, y: e.y });
  for (const o of w.enemies) {
    const d = dist(o, e);
    if (o.act === 'dead' || d > FLARE.radius + o.radius) continue;
    if (damage(o, FLARE.dmg, now, ev, { heavy: true, flinch: 0.4, how: 'burst', dx: o.x - e.x, dy: o.y - e.y, el: 'fire' })) continue;
    if (o !== e && o.act !== 'pinned' && o.act !== 'carried') shove(o, (o.x - e.x) / (d || 1), (o.y - e.y) / (d || 1), FLARE.knock, o.weight);
  }
}

/** Burns tick and spread by touch. */
export function stepElements(w: World): void {
  const { now, ev } = w;
  for (const e of w.enemies) {
    if (e.act === 'dead' || !burning(e, now)) continue;
    // A nest set alight burns down on its own clock (sim/torch.ts), not by the tick.
    if (now >= e.burnNext && !e.ashAt) {
      e.burnNext = now + BURN.every;
      if (damage(e, BURN.dmg, now, ev, { tick: true, el: 'fire' })) continue;
    }
    for (const o of w.enemies) {
      if (o === e || o.act === 'dead' || burning(o, now) || frozen(o, now)) continue;
      // Spiders packed together go up like tinder.
      if (dist(o, e) <= o.radius + e.radius + BURN.spread + (o.kind === 'spider' ? SPIDER.spread : 0)) ignite(o, now, ev);
    }
  }
}
