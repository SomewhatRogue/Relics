/**
 * A party in a fight: what changes once there's more than one player (the squire doesn't count).
 *
 * - Going down, you bleed: lie there up to PARTY.bleed seconds while a teammate stands over you for
 *   PARTY.pickUp seconds to get you up (a hit on them starts it over). Nobody comes, and you're out
 *   until the job ends. Alone (or the last one left), it's the old way: up again in a moment.
 * - Friendly fire: your own side's blows, shots and blasts land on you at PARTY.friendly.
 * - Down a teammate PARTY.grudge times in one job and they hold a grudge.
 * - More players, more goblins (scaleFoes) and tougher named ones.
 */
import { HERO, HURT_STAGGER, PARTY } from '../shared/tuning';
import { Rng } from '../shared/rng';
import { toughen } from '../shared/roster';
import type { Foe } from '../shared/terrain';
import { inArc } from './combat';
import type { Swing } from '../shared/tuning';
import type { Enemy, FightEvent, Hero } from './types';

export const players = (heroes: Hero[]) => heroes.filter((h) => h.id !== 'squire');
const inParty = (heroes: Hero[]) => players(heroes).length > 1;

/** A teammate's blow, shot or blast lands on `h` (never on yourself, never on someone down). */
export function allyHit(by: string, h: Hero, dmg: number, ev: FightEvent[], dx = 0, dy = 0): void {
  if (h.id === by || h.id === 'squire' || h.act === 'down' || h.act === 'roll') return;
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

/** A swing's live frames: any teammate in its arc takes it once a swing. */
export function sweepAllies(h: Hero, s: Swing, heroes: Hero[], ev: FightEvent[]): void {
  if (s.shot || !inParty(heroes)) return;
  for (const o of players(heroes)) {
    if (o === h || h.hitAllies?.includes(o.id) || (o.z ?? 0) !== (h.z ?? 0) || !inArc(h.x, h.y, h.fx, h.fy, o.x, o.y, s.range, s.arc, HERO.radius)) continue;
    (h.hitAllies ??= []).push(o.id);
    allyHit(h.id, o, s.dmg, ev, o.x - h.x, o.y - h.y);
  }
}

/** Bleeding, picking up, and going out, once a tick. */
export function stepParty(heroes: Hero[], dt: number, ev: FightEvent[]): void {
  const ps = players(heroes);
  if (ps.length < 2) {
    // Alone again (the rest gone home): the old way, up in a moment.
    for (const h of ps) if (h.bleeding && !h.out) Object.assign(h, { bleeding: false, actDur: HERO.respawn, actT: 0 });
    return;
  }
  for (const h of ps) {
    if (h.act !== 'down') {
      h.pickT = 0;
      continue;
    }
    if (!h.bleeding) Object.assign(h, { bleeding: true, actDur: Infinity, pickT: 0 });
    if (h.out) continue;
    if (h.actT >= PARTY.bleed) {
      h.out = true;
      ev.push({ k: 'out', x: h.x, y: h.y });
      continue;
    }
    const by = ps.find((o) => o !== h && o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= PARTY.reach);
    if (!by || by.act === 'hurt' || by.act === 'stun') {
      h.pickT = 0;
      continue;
    }
    h.pickT = (h.pickT ?? 0) + dt;
    if (h.pickT < PARTY.pickUp) continue;
    Object.assign(h, { act: 'idle', actT: 0, actDur: 0, hp: Math.round(h.maxHp * PARTY.upHp), bleeding: false, pickT: 0 });
    ev.push({ k: 'pickedup', x: h.x, y: h.y, id: h.id, by: by.id });
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
  const common = foes.filter((f) => !f.name), more = Math.round(common.length * PARTY.foes * (party - 1)), extra: Foe[] = [];
  for (let i = 0; i < more; i++) {
    const f = common[i % common.length], a = i * 2.4;
    extra.push({ ...f, x: f.x + Math.cos(a) * 0.7, y: f.y + Math.sin(a) * 0.7 });
  }
  toughen(foes, extra, party, new Rng(seed));
  return [...foes, ...extra];
}

/** Named goblins (bosses) tougher for a bigger party. */
export function scaleBosses(enemies: Enemy[], party: number): void {
  if (party <= 1) return;
  for (const e of enemies) if (e.name) e.hp = e.maxHp = Math.round(e.maxHp * (1 + PARTY.boss * (party - 1)));
}
