/**
 * Magic augments on goblins. Fire burns, and a burning goblin sets those near it alight when it dies;
 * frost chills, then freezes solid; storm jumps between wet goblins (sim/wet.ts) and arcs to javelins
 * stuck in bodies. They play off each other: fire meets frost as a steam burst, storm or a heavy blow
 * shatters the frozen, storm on the burning flares outward.
 */
import { BURN, FLARE, FROST, SHATTER, SPIDER, STEAM, STORM, STREAM, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { clearElements, damage, frozen, isDummy } from './damage';
import type { Rng } from '../shared/rng';
import type { Pickup } from './pickups';
import type { Enemy, FightEvent, Hero, Javelin, Prop, Survivor } from './types';
import { stun } from './stuns';
import { currentMap } from '../shared/arena';
import { burnFor, spreadFor } from '../shared/sky';
import { burnLonger, rimeUp } from './techmage';
import { wet } from './wet';
import { iceOn, type WorldFx } from './ice';
import { douse } from './steam';
import { poolOf, sayPool, waterOf } from './pools';
import { jolt } from './rods';
import { toAsh } from './meal';

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
  /** The floor's gold and the room's purse stream, for what a technique knocks loose (sim/techrogue.ts). */
  floor?: { pickups: Pickup[]; rng: Rng };
  /** What the world keeps of an element (sim/ice.ts, steam.ts): ice on the shallows, steam clouds. */
  fx?: WorldFx;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
export const burning = (e: Enemy, now: number) => e.burnUntil > now;
export const chilled = (e: Enemy, now: number) => e.chillUntil > now;

function ignite(e: Enemy, now: number, ev: FightEvent[]): void {
  if (!burning(e, now)) ev.push({ k: 'ignite', x: e.x, y: e.y }), (e.burnNext = now + BURN.every);
  // Butchers, heavies, shield-bearers and ironhides catch less (BURN.tough); in the rain it burns out sooner (shared/sky.ts).
  const tough = e.kind === 'butcher' || e.variant === 'heavy' || e.variant === 'shield' || e.variant === 'ironhide';
  e.burnUntil = now + BURN.time * (tough ? BURN.tough : 1) * burnFor(currentMap().theme);
}

let casts = 0;
/** A new storm cast: a wet goblin is jumped to at most once a cast (one tap, one spell, one pulse). */
export const newCast = () => ++casts;

/** How storm lands: `cast` the spell it belongs to (a new one when left out); `jump` what each jump deals,
 *  as a tick (the stream's, already counted wet), else STORM.share of the blow. */
export interface StormHow { cast?: number; jump?: number }

/** An element lands on a goblin with a blow of `n` damage (storm: jumping as `how` says). */
export function afflict(w: World, e: Enemy, el: Augment, n: number, how: StormHow = {}): void {
  if (!el || e.act === 'dead') return;
  const { now, ev } = w;
  if (el === 'fire') {
    if (frozen(e, now) || chilled(e, now)) return steam(w, e);
    // Standing in water it goes out as it lands: a cloud of steam instead (sim/steam.ts).
    if (douse(w, e)) return;
    ignite(e, now, ev);
    // ATTUNED: a Mage's fire burns longer (sim/techmage.ts).
    burnLonger(w, e);
  } else if (el === 'frost') {
    if (burning(e, now)) return steam(w, e);
    // Wading: the shallows round it ice over (sim/ice.ts).
    iceOn(w.fx, e, now, ev);
    if (frozen(e, now)) return;
    if (chilled(e, now)) {
      e.chillUntil = 0;
      // A small one stays frozen longer: a set-up for a heavy hit to send it skidding (sim/iceslide.ts).
      e.frozenUntil = now + FROST.freeze * (e.weight <= 1 ? FROST.small : 1);
      e.attack = null;
      if (e.act === 'attack' || e.act === 'chase' || e.act === 'flinch') Object.assign(e, { act: isDummy(e) ? 'idle' : 'chase', actT: 0 });
      ev.push({ k: 'freeze', x: e.x, y: e.y });
    } else {
      e.chillUntil = now + FROST.chill;
      ev.push({ k: 'chill', x: e.x, y: e.y });
    }
  } else zap(w, e, n, how.cast ?? newCast(), how.jump);
}

/** Frost that only slows (a Mage's tap, never a freeze on its own): fire on the chilled is steam, as ever.
 *  With ATTUNED, chilling hits (`share` of one each) build up and the third freezes (sim/techmage.ts). */
export function chill(w: World, e: Enemy, share = 1): void {
  if (burning(e, w.now)) return afflict(w, e, 'frost', 0);
  if (rimeUp(w, e, share)) return afflict(w, e, 'frost', 0);
  iceOn(w.fx, e, w.now, w.ev);
  if (e.chillUntil <= w.now) w.ev.push({ k: 'chill', x: e.x, y: e.y });
  e.chillUntil = Math.max(e.chillUntil, w.now + FROST.chill);
}

/** Storm on one goblin: shatters the frozen, flares the burning; wet, it jumps to every other wet goblin
 *  within STORM.reach not yet reached by `cast`. A javelin in a body draws it in (not a tick's). */
function zap(w: World, e: Enemy, n: number, cast: number, jump?: number): void {
  const { now, ev } = w;
  e.jolted = cast;
  if (frozen(e, now)) shatter(e, now, ev);
  else if (burning(e, now)) flare(w, e);
  // Standing in water: everyone in that water is jolted, friends spared (sim/pools.ts).
  const body = waterOf(e), pool = body >= 0 ? poolOf(body, e.x, e.y, w.enemies, w.heroes, w.survivors ?? [], (o) => o === e || o.jolted === cast) : null;
  if (pool) sayPool(pool, e.x, e.y, ev);
  const near = wet(e) ? w.enemies.filter((o) => o !== e && o.act !== 'dead' && o.act !== 'carried' && o.jolted !== cast && dist(o, e) <= STORM.reach && wet(o) && !pool?.foes.includes(o)) : [];
  const rods: Enemy[] = [];
  if (jump === undefined) for (const j of w.javelins) {
    const o = j.state === 'body' ? w.enemies.find((x) => x.id === j.enemy) : undefined;
    if (o && o !== e && o.act !== 'dead' && o.jolted !== cast && !near.includes(o) && !rods.includes(o) && dist(o, e) <= STORM.rodReach) rods.push(o);
  }
  for (const o of [...(pool?.foes ?? []), ...near, ...rods]) {
    o.jolted = cast;
    o.lastBy = e.lastBy;
    // (Through the water it's the crackle across it that's drawn, not an arc through the air.)
    if (!pool?.foes.includes(o)) ev.push({ k: 'shock', x: e.x, y: e.y, x2: o.x, y2: o.y });
    // An ironhide jolted: its guard breaks (sim/rods.ts).
    jolt(o, now, ev);
    const tick = jump !== undefined, hit = rods.includes(o) ? STORM.rodDmg : tick ? jump : Math.max(STORM.min, Math.round(n * STORM.share));
    if (hit <= 0) continue;
    // (A jump is storm, so a wet goblin takes it STORM.wet harder: sim/damage.ts; a tick's is counted already.)
    const was = o.hitAt;
    if (damage(o, hit, now, ev, { flinch: tick ? 0 : STORM.flinch, el: 'storm', src: 'spark', tick })) continue;
    // (A stream's tick flickers it white now and then, not every tick: sim/stream.ts.)
    if (tick && now - was < STREAM.flicker) o.hitAt = was;
    if (frozen(o, now)) shatter(o, now, ev);
    else if (burning(o, now)) flare(w, o);
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

/** Burns tick; a burning goblin that dies passes its fire to those within BURN.spread (and no sooner). */
export function stepElements(w: World): void {
  const { now, ev } = w;
  for (const e of w.enemies) {
    if (e.act === 'dead') {
      if (e.embers) passFire(w, e);
      continue;
    }
    if (!burning(e, now)) continue;
    // A nest set alight is the world's fire, not a goblin's: it burns down on its own clock (sim/torch.ts)
    // and the spiders on it catch by touch, as ever.
    if (e.ashAt) spread(w, e);
    else if (now >= e.burnNext) {
      e.burnNext = now + BURN.every;
      damage(e, BURN.dmg, now, ev, { tick: true, el: 'fire' });
    }
  }
}

/** A goblin died burning (sim/damage.ts kill): the goblins near its body catch. */
function passFire(w: World, e: Enemy): void {
  e.embers = false;
  // A small goblin's body goes to ash: nothing for a butcher (sim/meal.ts).
  if (e.kind === 'scrapper') toAsh(e, w.ev);
  spread(w, e);
}

/** Those within BURN.spread of `e` catch; in the rain it reaches only one nearly touching (shared/sky.ts). */
function spread(w: World, e: Enemy): void {
  const jump = BURN.spread * spreadFor(currentMap().theme);
  for (const o of w.enemies) {
    if (o === e || o.act === 'dead' || burning(o, w.now) || frozen(o, w.now)) continue;
    // Spiders packed together go up like tinder.
    if (dist(o, e) <= o.radius + e.radius + jump + (o.kind === 'spider' ? SPIDER.spread : 0)) ignite(o, w.now, w.ev);
  }
}
