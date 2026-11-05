/** Enemies' turns: the goblin butcher, goblin scrappers, and the two training dummies. */
import { blinded, stumble } from './rangershots';
import { lure, seenFrom } from './lantern';
import { visible } from './flasks';
import { HUNGRY_FX, wears } from './hungry';
import { collide, currentMap, inArea, wadeAt } from '../shared/arena';
import { FRIENDLY, DECOY, ALERT, ARCHER, BUTCHER, BROOD, NEST, SPIDER, DRUMMER, HEXER, FROST, KNOCK, NET, SCRAPPER, SWING_DUMMY, TRAIT, BANNER, LOGS, NETTER, type EnemyAttackSpec, type EnemySpec, VARIANTS, STEALTH, CLASS_DODGES, WEAPONS, HORN, HOBBLE, STILL } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { hexFriendly, isBackline, stepBackline } from './backline';
import { shove, slide } from './bodies';
import { attackCovers, hitHero } from './combat';
import { sneakSight } from './knacks';
import { damage, frozen, isDead, kill, snared } from './damage';
import { shatter } from './elements';
import { has } from './traits';
import { hunt } from './spiders';
import { glowIn, sightIn } from '../shared/timeofday';
import { noticeFor, reachFor } from '../shared/sky';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';
import { isRound } from './types';
import { vanished } from './rogue';
import { wayTo } from './pathing';
import { hearFrom, samePack } from './packs';
import { stepOwn } from './ownfoes';
import { netted } from './netter';
import { blindNotice } from './blind';
import { tauntTarget } from './taunt';
import { CALTROPS } from '../shared/ladder';
import type { Slick } from './oil';
import { gather, rushClock, rushLocked } from './rushguard';

/** The room's oil slicks, for the torch-bearers (the room sets it before its goblins move). */
export const OWN_KIT: { slicks: Slick[] } = { slicks: [] };

const SPECS: Partial<Record<Enemy['kind'], EnemySpec>> = { butcher: BUTCHER, scrapper: SCRAPPER, spider: SPIDER, brood: BROOD };

export function newEnemy(id: number, kind: Enemy['kind'], x: number, y: number): Enemy {
  const s = SPECS[kind];
  const hp = s ? s.hp : kind === 'nest' ? NEST.hp : 999;
  const e: Enemy = {
    id, kind, x, y, kvx: 0, kvy: 0, fx: 0, fy: 1, hp, maxHp: hp, radius: s ? s.radius : 0.4, weight: s ? s.weight : Infinity,
    act: s ? 'chase' : 'idle', actT: 0, actDur: 0, attack: null, cooldown: 1 + id * 0.4, hitstop: 0, hitAt: -9, moving: false, home: { x, y }, corpse: '',
    burnUntil: 0, burnNext: 0, chillUntil: 0, frozenUntil: 0, snareUntil: 0, lastBy: '', death: '', respawns: true, z: 0,
  };
  // A nest: rooted, asleep till a hero comes near (sim/spiders.ts).
  if (kind === 'nest') Object.assign(e, { radius: NEST.radius, nextWave: -1, had: 0, lighter: '', lightT: 0, ashAt: 0 });
  // Spiders come in late and in numbers: their first move isn't held back by how many came before.
  if (kind === 'spider' || kind === 'brood') e.cooldown = 1 + (id % 4) * 0.3;
  return e;
}

function nearest(e: Enemy, heroes: Hero[], now: number): Hero | null {
  // Taunted: it comes for the Warrior who roared, while it lasts (sim/taunt.ts).
  const taunter = tauntTarget(e, heroes, now);
  if (taunter) return taunter;
  // A war cry it heard: it comes for whoever gave it, and nobody else, until it wears off.
  const cried = heroes.find((h) => h.rallyUntil > now && h.act !== 'down' && Math.hypot(h.x - e.x, h.y - e.y) <= HORN.radius * 1.5);
  if (cried) return cried;
  let best: Hero | null = null, bd = Infinity;
  for (const h of heroes) {
    if (h.act === 'down') continue;
    // The Butcher's Apron: they come for you first; a named butcher looks at no one else.
    const apron = wears(h, 'apron') ? (e.name ? 999 : HUNGRY_FX.lure) : 0;
    // A netted hero: they all come for them (sim/netter.ts).
    const raw = Math.hypot(h.x - e.x, h.y - e.y), d = raw - lure(h) - apron - (netted(h, now) ? NETTER.lure : 0);
    if (!visible(h, raw, now) || vanished(h, now)) continue;
    if (d < bd) (bd = d), (best = h);
    // A Mage's blink image draws them off while it lasts: they swing at where you were.
    if (h.decoyUntil > now) {
      const dd = Math.hypot(h.decoyX - e.x, h.decoyY - e.y) - DECOY.lure;
      if (dd < bd) (bd = dd), (best = { ...h, x: h.decoyX, y: h.decoyY });
    }
  }
  return best;
}

export function begin(e: Enemy, kind: EnemyAttack['kind'], s: EnemyAttackSpec, target: Hero, ev: FightEvent[]): void {
  const dx = target.x - e.x, dy = target.y - e.y, l = Math.hypot(dx, dy) || 1;
  e.fx = dx / l;
  e.fy = dy / l;
  const ahead = s.ahead ?? 0;
  e.attack = {
    kind, aimed: target.id, t: 0, windup: s.windup, active: s.active, recover: s.recover, dmg: s.dmg, knock: s.knock, unblockable: s.unblockable,
    dx: e.fx, dy: e.fy, ox: e.x, oy: e.y, range: s.range ?? 0, arc: s.arc ?? 0,
    cx: e.x + e.fx * ahead, cy: e.y + e.fy * ahead, radius: s.radius ?? 0, done: false,
  };
  // The wood's drilled goblins wind up slower, so there's time to read the blow.
  if (e.drill) e.attack.windup *= 1.5;
  // Roused by a drum: quicker to the blow, and it lands harder (locked here, so the telegraph holds).
  if (e.roused) (e.attack.windup *= DRUMMER.rouse.windup), (e.attack.dmg = Math.round(e.attack.dmg * DRUMMER.rouse.dmg));
  // Near a banner: the same, its own way (sim/banner.ts).
  if (e.heart) (e.attack.windup *= BANNER.heart.windup), (e.attack.dmg = Math.round(e.attack.dmg * BANNER.heart.dmg));
  e.act = 'attack';
  e.actT = 0;
  ev.push({ k: 'windup', x: e.x, y: e.y, kind });
}

/** Run an attack in progress; true when it has finished (or was parried away). */
function runAttack(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], others: Enemy[] = []): boolean {
  const a = e.attack!;
  // Chilled: the wind-up drags (the telegraph fills at the same slowed pace, so what you see holds).
  // A pack rush's blow keeps the rush's own clock, so every one of them lands together (sim/rushguard.ts).
  a.t = rushClock(a, now) ?? a.t + (a.t < a.windup && e.chillUntil > now ? dt * FROST.windup : dt);
  // Netted: no running at you and no throwing the hook. Whatever it was winding up for is lost.
  if ((a.kind === 'charge' || a.kind === 'draw') && e.snareUntil > now) return ev.push({ k: 'snared', x: e.x, y: e.y }), true;
  if (a.kind === 'charge' || a.kind === 'pounce') return runCharge(e, a, heroes, now, ev, others);
  if (!a.done && a.t >= a.windup) {
    a.done = true;
    const round = isRound(a.kind);
    ev.push({ k: 'impact', x: round ? a.cx : e.x, y: round ? a.cy : e.y, kind: a.kind });
    // Blows land on your own level; arrows reach up and down.
    const before = heroes.map((h) => h.hp);
    for (const h of heroes) if (a.kind === 'shot' || (h.z ?? 0) === (e.z ?? 0)) hitHero(e, a, h, now, ev, heroes);
    if (e.attack === null) return true;
    // Their own get in the way: a missed arrow takes the first goblin in its line; a butcher's blow
    // lands on any small goblin under it.
    if (a.kind === 'hex') hexFriendly(e, a, others, now, ev);
    else friendly(e, a, others, heroes.some((h, i) => h.hp < before[i]), now, ev);
  }
  return a.t >= a.windup + a.active + a.recover;
}

/** The charge: it runs the line it showed you, through anyone on it (once each), and stops at the end. */
function runCharge(e: Enemy, a: EnemyAttack, heroes: Hero[], now: number, ev: FightEvent[], others: Enemy[]): boolean {
  const going = a.t >= a.windup && a.t < a.windup + a.active, speed = a.range / a.active;
  if (going && !a.done) (a.done = true), ev.push({ k: 'impact', x: e.x, y: e.y, kind: a.kind });
  e.kvx = going ? a.dx * speed : 0;
  e.kvy = going ? a.dy * speed : 0;
  e.moving = going;
  if (going) {
    a.cx = e.x + a.dx * 0.4;
    a.cy = e.y + a.dy * 0.4;
    for (const h of heroes) if (!(a.hit ??= []).includes(h.id) && (h.z ?? 0) === (e.z ?? 0) && attackCovers(a, h)) (a.hit.push(h.id), hitHero(e, a, h, now, ev, heroes));
    // Its own in the way go flying.
    if (a.kind === 'charge') for (const o of others) if (o !== e && o.kind === 'scrapper' && !isDead(o) && !a.hit!.includes('g' + o.id) && attackCovers(a, o as unknown as Hero)) a.hit!.push('g' + o.id), damage(o, Math.round(a.dmg * FRIENDLY.blow), now, ev, { heavy: true, how: 'burst' }), shove(o, a.dx, a.dy, a.knock, o.weight);
    if (e.attack === null) return true;
  }
  // Ran its line and missed the one it was meant for: if that's a hero with no dodge, they stepped out.
  if (a.t >= a.windup + a.active && !a.missed) {
    a.missed = true;
    const h = heroes.find((x) => x.id === a.aimed);
    if (h && !(a.hit ?? []).includes(h.id) && h.act !== 'down' && !CLASS_DODGES[WEAPONS[h.weapon].cls]) ev.push({ k: 'dodge', x: h.x, y: h.y });
  }
  return a.t >= a.windup + a.active + a.recover;
}

/** Goblins hit by their own: an arrow that missed you, or a butcher's sweep, slam or charge. */
function friendly(e: Enemy, a: EnemyAttack, others: Enemy[], landed: boolean, now: number, ev: FightEvent[]): void {
  const near = others.filter((o) => o !== e && !isDead(o) && o.kind === 'scrapper' && (o.z ?? 0) === (e.z ?? 0));
  if (a.kind === 'shot') {
    if (landed) return;
    const inLine = near.filter((o) => attackCovers(a, o as unknown as Hero)).sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y));
    if (inLine[0]) damage(inLine[0], Math.round(a.dmg * FRIENDLY.shot), now, ev, { src: 'arrow', how: 'fall' });
    return;
  }
  if (e.kind !== 'butcher') return;
  for (const o of near) if (attackCovers(a, o as unknown as Hero)) damage(o, Math.round(a.dmg * FRIENDLY.blow), now, ev, { heavy: true, how: 'burst' }), shove(o, o.x - e.x, o.y - e.y, a.knock, o.weight);
}

const after = (e: Enemy) => (e.kind === 'swingDummy' || e.kind === 'dummy' ? 'idle' : 'chase');

export function stepEnemy(e: Enemy, heroes: Hero[], rng: Rng, now: number, dt: number, ev: FightEvent[], others: Enemy[] = []): void {
  // Dead for good and lying still: its clocks stop (nothing changes, so nothing is sent).
  if (e.act === 'dead' && !e.respawns && e.actT >= STILL) return;
  if (e.hitstop > 0 && !rushLocked(e)) return void (e.hitstop -= dt);
  if (e.hitstop > 0) e.hitstop -= dt;
  e.actT += dt;
  e.moving = false;
  e.cooldown -= dt;
  const spec = SPECS[e.kind];
  if (e.act === 'carried') return;
  if (e.act === 'pinned') {
    if (e.actT >= e.actDur) Object.assign(e, { act: 'flinch', actT: 0, actDur: 0.4 });
    return;
  }
  if (e.act === 'dead') {
    // Killed by a blow, a small one slides on a little way (SPLAT).
    if (e.kvx || e.kvy) slide(e, e.radius, dt);
    if (e.respawns && e.actT >= e.actDur) Object.assign(e, { act: 'chase', hp: e.maxHp, x: e.home.x, y: e.home.y, kvx: 0, kvy: 0, actT: 0, cooldown: 1.5, corpse: '', death: '' });
    return;
  }
  // A nest never moves; its waves are the room's (sim/spiders.ts stepNests).
  if (e.kind === 'nest') return;
  if (spec) {
    const hit = slide(e, e.radius, dt);
    // A spider's pounce into a wall just stops it.
    if (hit && e.attack?.kind === 'pounce') e.kvx = e.kvy = 0;
    else if (hit) {
      const ice = frozen(e, now), by = heroes.find((h) => h.id === e.lastBy);
      // CRUSHING: whoever threw it there makes the wall hurt more.
      const n = KNOCK.wallDmg * (by && has(by, 'crushing') ? TRAIT.crushing : 1);
      e.hp -= n;
      e.hitAt = now;
      ev.push({ k: 'wallhit', x: e.x, y: e.y });
      ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: n > KNOCK.wallDmg, on: 'enemy' });
      if (e.hp <= 0) return kill(e, ev, 'burst', e.kvx, e.kvy);
      // Charged into a wall or a tree: it stuns itself.
      if (e.attack?.kind === 'charge' && e.attack.t >= e.attack.windup) {
        Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: e.variant === 'log' ? LOGS.stun : VARIANTS.stoker.chargeStun, kvx: 0, kvy: 0 });
        ev.push({ k: 'stunned', x: e.x, y: e.y });
        return;
      }
      // Thrown frozen into a wall: it breaks.
      if (ice) shatter(e, now, ev);
      if (isDead(e)) return;
    }
  }
  // Frozen solid, or a small goblin under a net: slides if thrown, does nothing else.
  if (frozen(e, now) || snared(e, now)) return;
  if (e.act === 'stunned' || e.act === 'flinch') {
    if (e.actT >= e.actDur) Object.assign(e, { act: after(e), actT: 0, cooldown: e.act === 'stunned' ? 0.6 : 0.3 });
    return;
  }
  // Blinded by a longbow's perfect arrow: it gropes about and goes for nobody (sim/rangershots.ts).
  if (blinded(e, now)) return void (spec && stumble(e, spec.speed, now, dt));
  if (e.act === 'attack') {
    if (runAttack(e, heroes, now, dt, ev, others) && e.act === 'attack') {
      Object.assign(e, { attack: null, act: after(e), actT: 0, cooldown: e.variant === 'hexer' ? HEXER.pause : e.attack?.kind === 'spit' ? BROOD.spitPause : spec ? spec.pauseBetween : SWING_DUMMY.every });
    }
    return;
  }
  if (e.alert === false && e.feeding) {
    if (!notice(e, heroes, others, now, ev)) return;
    e.feeding = false;
  }
  if (e.alert === false && !notice(e, heroes, others, now, ev)) return wander(e, rng, now, dt);
  // Called into a pack rush: to its place in the fan (sim/packrush.ts).
  if (e.rushTo && gather(e, (e.chillUntil > now ? FROST.slow : 1) * (e.roused ? DRUMMER.rouse.pace : 1), dt)) return;
  const t = nearest(e, heroes, now);
  if (!t || e.kind === 'dummy') return;
  const d = Math.hypot(t.x - e.x, t.y - e.y);
  if (e.kind === 'swingDummy') {
    if (d <= SWING_DUMMY.reach && e.cooldown <= 0) begin(e, 'swing', SWING_DUMMY.swing, t, ev);
    return;
  }
  if (!spec) return;
  // On another level: a goblin with a blade goes round by the nearest ramp; an archer just shoots.
  const level = (t.z ?? 0) === (e.z ?? 0), via = level || e.bow ? null : rampFor(e);
  // On the ground, round water and anything long in the way: by the ford, the bridge, the gap (sim/pathing.ts).
  const go = !e.bow && !e.z ? wayTo(e, via ? via.x : t.x, via ? via.y : t.y) : via ?? t;
  const gx = go.x, gy = go.y, gd = Math.hypot(gx - e.x, gy - e.y) || 1;
  // Turn toward where it's going at this enemy's own pace; it only attacks once it faces you.
  const ux = (gx - e.x) / gd, uy = (gy - e.y) / gd;
  const want = Math.atan2(uy, ux), have = Math.atan2(e.fy, e.fx);
  let diff = want - have;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const slow = (e.chillUntil > now ? FROST.slow : 1) * (e.snareUntil > now ? NET.slow : 1) * (e.roused ? DRUMMER.rouse.pace : 1) * ((e.hobbleUntil ?? -9) > now ? HOBBLE.slow : 1) * ((e.caltropUntil ?? -9) > now ? CALTROPS.slow : 1);
  const rate = e.variant === 'log' ? LOGS.turn : spec.turn, turn = Math.max(-rate * slow * dt, Math.min(rate * slow * dt, diff)), na = have + turn;
  e.fx = Math.cos(na);
  e.fy = Math.sin(na);
  const facing = e.fx * ux + e.fy * uy;
  // The newer sorts (sim/ownfoes.ts): each its own way.
  if (stepOwn(e, { t, d, level, via: !!via, ux, uy, facing, speed: spec.speed * slow, slow }, heroes, others, rng, now, dt, ev, OWN_KIT)) return;
  if (e.bow) {
    // In fog it shoots, keeps off and comes in at a shorter reach, its telegraph as short (shared/sky.ts).
    const fr = reachFor(currentMap().theme), reach = ARCHER.reach * fr;
    if (d <= reach && e.cooldown <= 0 && facing > 0.9) return begin(e, 'shot', fr < 1 ? { ...ARCHER.shot, range: (ARCHER.shot.range ?? ARCHER.reach) * fr } : ARCHER.shot, t, ev);
    // Runs from you when you get close on its level (along its perch, up high); comes in if you're far on the ground.
    const back = level && d < ARCHER.keep * fr, on = !e.z && d > reach;
    if (back) {
      // Away, and a little to the side, so it doesn't back itself into a corner.
      const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
      walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, spec.speed * slow * ARCHER.flee, dt);
    } else if (on) walk(e, ux, uy, spec.speed * slow * Math.max(0.2, facing), dt);
    return;
  }
  // Spiders (sim/spiders.ts): skitter, circle and pounce; the brood mother bites and spits.
  if (e.kind === 'spider' || e.kind === 'brood') return hunt(e, t, d, ux, uy, facing, spec.speed * slow, level && !via, rng, now, dt, ev);
  // The back of the pack (sim/backline.ts): a hexer or a drummer keeps its distance.
  if (isBackline(e)) return stepBackline(e, t, d, !!via || !level, ux, uy, facing, spec.speed * slow, others, now, dt, ev);
  // The wood's goblins: each fights the way its lesson needs.
  const v = e.variant, reach = v === 'lunger' ? VARIANTS.lunger.reach : v === 'heavy' ? VARIANTS.heavy.reach : spec.reach;
  const netted = e.snareUntil > now;
  if (v === 'stoker' && !netted && level && e.cooldown <= 0 && facing > 0.85 && d > VARIANTS.stoker.chargeFrom && d < VARIANTS.stoker.charge.range! - 1 && rng.next() < VARIANTS.stoker.chargeChance) return begin(e, 'charge', VARIANTS.stoker.charge, t, ev);
  if (v === 'stoker' && !netted && level && e.cooldown <= 0 && facing > 0.8 && d > VARIANTS.stoker.drawFrom && d < VARIANTS.stoker.draw.range! - 0.5 && rng.next() < VARIANTS.stoker.drawEvery) return begin(e, 'draw', VARIANTS.stoker.draw, t, ev);
  if (level && d <= reach && e.cooldown <= 0 && facing > 0.75) {
    if (v === 'looter') return begin(e, 'stab', VARIANTS.looter.stab, t, ev);
    if (v === 'lunger') return begin(e, 'stab', VARIANTS.lunger.stab, t, ev);
    if (v === 'heavy') return begin(e, 'cleave', VARIANTS.heavy.swing, t, ev), e.attack && (e.attack.crush = true), undefined;
    if (v === 'stoker') {
      const drop = rng.next() < 0.35;
      return begin(e, drop ? 'slam' : 'cleave', drop ? VARIANTS.stoker.drop : VARIANTS.stoker.sweep, t, ev);
    }
    if (e.kind === 'butcher') {
      const slam = rng.next() < BUTCHER.slamChance;
      begin(e, slam ? 'slam' : 'cleave', slam ? BUTCHER.slam : BUTCHER.cleave, t, ev);
    } else begin(e, 'stab', SCRAPPER.stab, t, ev);
    return;
  }
  if (via || d > reach * 0.8) {
    // Scrappers sidle a little rather than queueing straight in.
    const side = e.kind === 'scrapper' && !via ? Math.sin(now * 1.3 + e.id * 2) * 0.5 : 0;
    // Walks where it faces: something turning round is slow to come after you.
    const pace = v === 'looter' ? VARIANTS.looter.speed : v === 'heavy' ? VARIANTS.heavy.speed : 1;
    walk(e, ux - uy * side, uy + ux * side, spec.speed * slow * pace * Math.max(0.2, facing), dt);
  }
}

/**
 * A goblin at rest looks about: a hero in front of it and near enough (or right behind it), or a fight
 * close by, wakes it, and it shouts the others awake. Returns true when it's awake.
 */
function notice(e: Enemy, heroes: Hero[], others: Enemy[], now: number, ev: FightEvent[]): boolean {
  // The blind hunters never see you: they hear (sim/blind.ts).
  if (e.variant === 'blind') return blindNotice(e, heroes, others, now, ev);
  let seen = false;
  const theme = currentMap().theme;
  for (const h of heroes) {
    if (h.act === 'down' || h.id === 'squire') continue;
    const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy);
    if (!visible(h, d, now) || vanished(h, now)) continue;
    const ahead = (dx * e.fx + dy * e.fy) / (d || 1) > -0.2;
    // Looters picking the dead don't look up until something comes close.
    // Darker hours, less far (shared/timeofday.ts); a censer's glow carries less by day.
    const far = (e.kind === 'spider' ? SPIDER.sight : ALERT.sight) * sightIn(theme);
    const sight = e.variant === 'looter' ? 1.6 : e.feeding ? far * 0.5 : ahead ? far : ALERT.behind;
    // Rain covers your feet and fog hides you: noticed from less far (shared/sky.ts).
    if (d < sight * noticeFor(theme) * (h.sneaking && h.act !== 'roll' ? sneakSight(h) : 1) + seenFrom(h) * glowIn(theme)) seen = true;
  }
  for (const o of noisy(others, now)) if (o !== e && o.alert && (isDead(o) || o.hitAt > now - 0.2) && Math.hypot(o.x - e.x, o.y - e.y) < hearFrom(e, o)) seen = true;
  if (!seen) return false;
  // The shout wakes its own pack (sim/packs.ts): the next fight waits its turn.
  for (const o of others) if (o.alert === false && samePack(o, e) && Math.hypot(o.x - e.x, o.y - e.y) < ALERT.shout) o.alert = true;
  e.alert = true;
  e.cooldown = Math.max(e.cooldown, 0.6);
  ev.push({ k: 'spotted', x: e.x, y: e.y });
  return true;
}

/**
 * Who could be heard: in a crowd (a big map), the goblins that are fighting, hurt this moment or lying
 * dead, found once a tick rather than once for every goblin at rest; a room's few are just all checked.
 */
let heard: { list: Enemy[]; now: number; out: Enemy[] } | null = null;
function noisy(others: Enemy[], now: number): Enemy[] {
  if (others.length <= 80) return others;
  if (heard?.list !== others || heard.now !== now) heard = { list: others, now, out: others.filter((o) => o.alert && (isDead(o) || o.hitAt > now - 0.2)) };
  return heard.out;
}

/** At rest: a few steps here and there about where it was put, turning to look. */
function wander(e: Enemy, rng: Rng, now: number, dt: number): void {
  const k = Math.floor(now / 2.2 + e.id * 0.37);
  if (Math.sin(k * 12.9898 + e.id * 78.233) > ALERT.wander - 1.4) {
    const a = Math.sin(k * 3.7 + e.id) * Math.PI, hx = e.home.x - e.x, hy = e.home.y - e.y, far = Math.hypot(hx, hy) > 1.5;
    const mx = far ? hx : Math.cos(a), my = far ? hy : Math.sin(a), ml = Math.hypot(mx, my) || 1;
    e.fx = mx / ml;
    e.fy = my / ml;
    walk(e, mx, my, ALERT.wanderSpeed, dt);
  }
  void rng;
}

export function walk(e: Enemy, mx: number, my: number, k: number, dt: number): void {
  const ml = Math.hypot(mx, my) || 1, wade = wadeAt(e.x, e.y);
  e.x += (mx / ml) * k * wade * dt;
  e.y += (my / ml) * k * wade * dt;
  e.moving = true;
  collide(e, e.radius);
}

/** Where to head to change level: the middle of the nearest ramp (or straight on, once on it). */
function rampFor(e: Enemy): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null, bd = Infinity;
  for (const l of currentMap().ledges ?? []) for (const r of l.ramps) {
    if (inArea(r, e.x, e.y)) return null;
    const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 }, d = Math.hypot(c.x - e.x, c.y - e.y);
    if (d < bd) (bd = d), (best = c);
  }
  return best;
}

