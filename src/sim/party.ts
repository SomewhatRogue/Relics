/**
 * A party in a fight: what changes once there's more than one player (the squire doesn't count).
 *
 * - Going down, you lie there PARTY.bleed seconds. A teammate who presses GRAB by you kneels and gets
 *   you up in PARTY.pickUp seconds (a Cleric twice as quick); a hit, a swing or walking off stops it.
 *   Nobody comes: the first time in a job you get yourself up; the next, you're out until it ends.
 *   Raised by a friend, your own get-up isn't spent. Alone (or the last one left), it's the old way:
 *   up again in a moment.
 * - Friendly fire: your own side's blows, shots and blasts land on you at PARTY.friendly (never a Cleric's).
 * - Down a teammate PARTY.grudge times in one job and they hold a grudge.
 * - More players, more goblins (scaleFoes) and tougher named ones.
 */
import { HERO, HURT_STAGGER, PARTY, WEAPONS } from '../shared/tuning';
import { Rng } from '../shared/rng';
import { toughen } from '../shared/roster';
import { scalePacks } from './packs';
import { waveFor } from './spiders';
import type { Foe } from '../shared/terrain';
import { inArc } from './combat';
import { isCleric } from './mercy';
import type { Swing } from '../shared/tuning';
import type { Enemy, FightEvent, Hero } from './types';
import { raiseRate } from './techcleric';

export const players = (heroes: Hero[]) => heroes.filter((h) => h.id !== 'squire');
const inParty = (heroes: Hero[]) => players(heroes).length > 1;

/** A teammate's blow, shot or blast lands on `h` (never on yourself, never on someone down). */
export function allyHit(by: string, h: Hero, dmg: number, ev: FightEvent[], dx = 0, dy = 0): void {
  if (h.id === by || h.id === 'squire' || h.act === 'down' || h.act === 'roll' || h.safeT) return;
  const n = Math.max(1, Math.round(dmg * PARTY.friendly));
  h.hp -= n;
  Object.assign(h, { act: 'hurt', actT: 0, actDur: HURT_STAGGER });
  const l = Math.hypot(dx, dy);
  if (l > 0.01) (h.kvx += (dx / l) * 3), (h.kvy += (dy / l) * 3);
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: false, on: 'hero', src: 'friendly' });
  if (h.hp > 0) return;
  Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn, kvx: 0, kvy: 0 });
  ev.push({ k: 'down', x: h.x, y: h.y, id: h.id, by });
  const g = (h.grudges ??= {});
  if ((g[by] = (g[by] ?? 0) + 1) === PARTY.grudge) ev.push({ k: 'grudge', x: h.x, y: h.y, id: h.id, by });
}

/** A swing's live frames: any teammate in its arc takes it once a swing (never a Cleric's: sim/mercy.ts). */
export function sweepAllies(h: Hero, s: Swing, heroes: Hero[], ev: FightEvent[]): void {
  if (s.shot || !inParty(heroes) || isCleric(h)) return;
  for (const o of players(heroes)) {
    if (o === h || h.hitAllies?.includes(o.id) || (o.z ?? 0) !== (h.z ?? 0) || !inArc(h.x, h.y, h.fx, h.fy, o.x, o.y, s.range, s.arc, HERO.radius)) continue;
    (h.hitAllies ??= []).push(o.id);
    allyHit(h.id, o, s.dmg, ev, o.x - h.x, o.y - h.y);
  }
}

/** GRAB by a teammate who's down (and not out): start getting them up. False if nobody's there. */
export function startRaise(h: Hero, heroes: Hero[], ev: FightEvent[]): boolean {
  if (h.id === 'squire') return false;
  const o = players(heroes).find((x) => x !== h && x.act === 'down' && x.bleeding && !x.out && (x.z ?? 0) === (h.z ?? 0) && Math.hypot(x.x - h.x, x.y - h.y) <= PARTY.reach);
  if (!o) return false;
  if (o.raiser !== h.id) Object.assign(o, { raiser: h.id, pickT: 0 });
  h.grabQueuedAt = -9;
  ev.push({ k: 'raising', x: o.x, y: o.y, id: o.id, by: h.id });
  // MENDING HANDS shows on the friend being got up (sim/techcleric.ts).
  if (raiseRate(h) > 1) ev.push({ k: 'mending', x: o.x, y: o.y });
  return true;
}

/** A teammate down by `h`, close enough to get up (for the RAISE button). */
export const raisable = (h: Hero, heroes: Hero[]) =>
  players(heroes).some((x) => x !== h && x.act === 'down' && x.bleeding && !x.out && Math.hypot(x.x - h.x, x.y - h.y) <= PARTY.reach);

const up = (h: Hero) => Object.assign(h, { act: 'idle', actT: 0, actDur: 0, hp: Math.round(h.maxHp * PARTY.upHp), bleeding: false, pickT: 0, raiser: undefined });

/** Lying there, being got up, getting up, and going out, once a tick. */
export function stepParty(heroes: Hero[], dt: number, ev: FightEvent[]): void {
  const ps = players(heroes);
  if (ps.length < 2) {
    // Alone again (the rest gone home): the old way, up in a moment.
    for (const h of ps) if (h.bleeding && !h.out) Object.assign(h, { bleeding: false, actDur: HERO.respawn, actT: 0, raiser: undefined });
    return;
  }
  for (const h of ps) {
    if (h.act !== 'down') {
      if (h.pickT || h.raiser) Object.assign(h, { pickT: 0, raiser: undefined });
      continue;
    }
    if (!h.bleeding) Object.assign(h, { bleeding: true, actDur: Infinity, pickT: 0, raiser: undefined });
    if (h.out) continue;
    // A friend kneeling by you: only while they stay close and aren't doing anything else.
    const by = h.raiser ? ps.find((o) => o.id === h.raiser) : undefined;
    if (by && by.act === 'idle' && !by.moving && Math.hypot(by.x - h.x, by.y - h.y) <= PARTY.reach) {
      h.pickT = (h.pickT ?? 0) + dt * (WEAPONS[by.weapon].cls === 'HEALER' ? 2 : 1) * raiseRate(by);
      if (h.pickT >= PARTY.pickUp) (up(h), ev.push({ k: 'pickedup', x: h.x, y: h.y, id: h.id, by: by.id }));
      continue;
    }
    if (h.raiser) Object.assign(h, { raiser: undefined, pickT: 0 });
    if (h.actT < PARTY.bleed) continue;
    // Nobody came: your one get-up of the job, or you're out.
    if (!h.selfUp) {
      h.selfUp = true;
      up(h);
      ev.push({ k: 'gotup', x: h.x, y: h.y, id: h.id });
      continue;
    }
    h.out = true;
    ev.push({ k: 'out', x: h.x, y: h.y });
  }
}

/** Everyone in the party is out: the job is lost. */
export const allOut = (heroes: Hero[]) => inParty(heroes) && players(heroes).every((h) => h.out);

/**
 * More goblins for more players: the room's own, then more of them, a step off each. Named ones once.
 * In a party of three or more, some of the extras come tougher (shared/roster.ts), rolled from `seed`.
 */
export function scaleFoes(foes: Foe[], party: number, seed = 1): Foe[] {
  if (party <= 1) return foes;
  // A routed room's packs: more small ones, a tougher centrepiece, never more specials (sim/packs.ts).
  if (foes.some((f) => f.pack !== undefined)) return scalePacks(foes, party, seed);
  // Nests aren't copied: their waves grow instead. One brood mother is enough (she gets tougher, scaleBosses).
  for (const f of foes) if (f.kind === 'nest') f.wave = waveFor(party);
  const common = foes.filter((f) => !f.name && f.kind !== 'nest' && f.kind !== 'brood'), more = Math.round(common.length * PARTY.foes * (party - 1)), extra: Foe[] = [];
  for (let i = 0; i < more; i++) {
    const f = common[i % common.length], a = i * 2.4;
    extra.push({ ...f, x: f.x + Math.cos(a) * 0.7, y: f.y + Math.sin(a) * 0.7 });
  }
  toughen(foes, extra, party, new Rng(seed));
  return [...foes, ...extra];
}

/** Named goblins (bosses) and brood mothers tougher for a bigger party. */
export function scaleBosses(enemies: Enemy[], party: number): void {
  if (party <= 1) return;
  for (const e of enemies) if (e.name || e.kind === 'brood') e.hp = e.maxHp = Math.round(e.maxHp * (1 + PARTY.boss * (party - 1)));
}
