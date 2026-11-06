/**
 * RAISE: a Cleric brings back a friend who is out for the job (Kyle, 2026-11-05: "Clerics should be able
 * to res someone multiplayer even if they're fully down ... less max health for who they res for that
 * instance"). Numbers in shared/cleric.ts RAISE.
 *
 * - In a party only (a lone Cleric is never out, and can't raise itself). GRAB by a friend who is out,
 *   on your feet: you kneel there RAISE.time s. The room keeps who and when on the friend (`riseBy`,
 *   `riseAt`), so the progress is worked out on every screen and nothing goes out a tick.
 * - Goblins within RAISE.draw tiles come for the Cleric while it lasts (a Warrior's TAUNT GUARD on them
 *   keeps them: the Warrior can cover you). A hit, a swing, a block or walking off breaks it.
 * - Done: the friend is up with RAISE.hp of their new most health, a moment's grace, and RAISE.cut of their
 *   full most health gone for the rest of the job (stacking, never under RAISE.floor). Each Cleric raises
 *   each friend once a job, and then waits RAISE.cooldown s before raising anyone.
 */
import { RAISE, cutMax } from '../shared/tuning';
import { isDead, isDummy } from './damage';
import { statsOf } from './gearstats';
import { isCleric } from './mercy';
import { players } from './party';
import { count } from './score';
import type { Enemy, FightEvent, Hero, Zone } from './types';

const close = (a: Hero, b: Hero) => (a.z ?? 0) === (b.z ?? 0) && Math.hypot(a.x - b.x, a.y - b.y) <= RAISE.reach;

/** The friend who is out by this Cleric that they could raise (not one they've raised, not one another Cleric is raising). */
export function riseTarget(h: Hero, heroes: Hero[]): Hero | undefined {
  if (!isCleric(h) || h.out || h.act === 'down' || players(heroes).length < 2) return undefined;
  return players(heroes).find((o) => o !== h && o.out && o.act === 'down' && (!o.riseBy || o.riseBy === h.id) && !o.risenBy?.includes(h.id) && close(h, o));
}

/** Seconds before this Cleric may raise again (0: now). */
export const riseWait = (h: Hero, now: number): number => Math.max(0, (h.riseReadyAt ?? -9) - now);

/** For the RAISE button: 'ready' by a friend this Cleric can raise now, 'wait' by one while the cooldown runs, else null. */
export function risable(h: Hero, heroes: Hero[], now: number): 'ready' | 'wait' | null {
  const o = riseTarget(h, heroes);
  if (!o || o.riseBy === h.id) return null;
  return riseWait(h, now) > 0 ? 'wait' : h.act === 'idle' ? 'ready' : null;
}

/** GRAB by a friend who is out: begin raising them. False if there's nobody to raise, or not yet.
 *  The goblins' ring shows round the Cleric as it begins (the taunt's red ring, at RAISE.draw). */
export function startRise(h: Hero, heroes: Hero[], zones: Zone[], now: number, ev: FightEvent[]): boolean {
  const o = riseTarget(h, heroes);
  if (!o || riseWait(h, now) > 0) return false;
  h.grabQueuedAt = -9;
  if (o.riseBy === h.id) return true;
  Object.assign(o, { riseBy: h.id, riseAt: now });
  zones.push({ kind: 'taunt', x: h.x, y: h.y, r: RAISE.draw, at: now, until: now + RAISE.show, next: 0, owner: h.id, el: '' });
  ev.push({ k: 'rising', x: o.x, y: o.y, id: o.id, by: h.id }, { k: 'taunt', x: h.x, y: h.y, r: RAISE.draw });
  return true;
}

/** Each tick, after the heroes have moved: every raise going on goes on, is broken off, or is done. */
export function stepRise(heroes: Hero[], enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const o of heroes) {
    if (!o.riseBy) continue;
    const c = heroes.find((x) => x.id === o.riseBy);
    if (!c || !o.out || o.act !== 'down' || c.act !== 'idle' || c.moving || c.blocking || !close(c, o)) {
      // ('' and -9, not undefined: a patch drops an undefined field, and a friend's screen would never hear it stopped.)
      Object.assign(o, { riseBy: '', riseAt: -9 });
      if (c) ev.push({ k: 'risebroke', x: o.x, y: o.y, id: o.id, by: c.id });
      continue;
    }
    if (now - (o.riseAt ?? now) >= RAISE.time - 1e-9) {
      rise(o, c, now, ev);
      continue;
    }
    draw(c, enemies, now, ev);
  }
}

/** The light going into a friend draws the goblins near to the Cleric giving it (not off a Warrior's taunt). */
function draw(c: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const e of enemies) {
    if (isDead(e) || isDummy(e) || e.kind === 'nest' || Math.hypot(e.x - c.x, e.y - c.y) > RAISE.draw + e.radius) continue;
    const taunted = (e.tauntUntil ?? -9) > now;
    if (taunted && e.tauntBy !== c.id) continue;
    if (!taunted) ev.push({ k: 'taunted', x: e.x, y: e.y });
    Object.assign(e, { tauntBy: c.id, tauntUntil: now + RAISE.linger, tauntSoft: false, alert: true, feeding: false });
  }
}

/** Up: part of their health back, and the most they can have cut for the rest of the job. */
function rise(o: Hero, c: Hero, now: number, ev: FightEvent[]): void {
  const was = o.hpCut ?? 0, cut = Math.min(1 - RAISE.floor, was + RAISE.cut);
  const maxHp = cutMax(o.baseHp + statsOf(o).health, cut);
  Object.assign(o, {
    out: false, bleeding: false, act: 'idle', actT: 0, actDur: 0, pickT: 0, raiser: undefined, riseBy: '', riseAt: -9,
    hpCut: cut, maxHp, hp: Math.max(1, Math.round(maxHp * RAISE.hp)), safeT: Math.max(o.safeT ?? 0, RAISE.grace), risenBy: [...(o.risenBy ?? []), c.id],
  });
  c.riseReadyAt = now + RAISE.cooldown;
  count(c.id, 'rose');
  count(o.id, 'cut', Math.round((cut - was) * 100));
  ev.push({ k: 'risen', x: o.x, y: o.y, id: o.id, by: c.id, n: Math.round(cut * 100) });
}
