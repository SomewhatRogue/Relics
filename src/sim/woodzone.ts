/**
 * Hangman's Wood's own rules on top of an expedition's (sim/exped.ts runs them when the map is the wood:
 * shared/hangwood.ts). The beats: as the first hero comes up to each scene on the way, it's said once over
 * their head (shared/hangwords.ts WOOD_BEATS), so the wood tells its story a few seconds at a time. The
 * mid-point's fire (numbers: shared/hangtune.ts CHECK): stand by it a moment to light it; from then on the
 * run is saved there (alone, your three downs start again from nothing: sim/run.ts), and anyone down with
 * nobody at them gets up by the fire after a while (alone, as soon as you'd get up anyway), even someone out,
 * so a party that all goes down after the fire hasn't lost the job.
 */
import { CHECK, HERO } from '../shared/tuning';
import type { ExpedState } from './exped';
import type { ArenaRoom } from './room';
import type { FightEvent, Hero } from './types';

export interface WoodState { check: { x: number; y: number; p: number; lit: boolean }; beats: boolean[] }

export function newWood(room: { map: ArenaRoom['map'] }): WoodState | undefined {
  const h = room.map.hang;
  return h && { check: { ...h.check, p: 0, lit: false }, beats: h.beats.map(() => false) };
}

const players = (hs: Hero[]) => hs.filter((h) => h.id !== 'squire');

export function stepWood(room: ArenaRoom, x: ExpedState, heroes: Hero[], ev: FightEvent[], dt: number): void {
  const w = x.wood, hang = room.map.hang;
  if (!w || !hang) return;
  // The beats, in whatever order you come to them.
  hang.beats.forEach((b, i) => {
    if (w.beats[i] || !heroes.some((h) => Math.hypot(h.x - b.x, h.y - b.y) <= b.r)) return;
    w.beats[i] = true;
    const h = heroes.find((o) => Math.hypot(o.x - b.x, o.y - b.y) <= b.r)!;
    ev.push({ k: 'exped', x: h.x, y: h.y, what: 'beat', i });
  });
  const c = w.check;
  if (!c.lit) {
    if (heroes.some((h) => Math.hypot(h.x - c.x, h.y - c.y) <= CHECK.r)) c.p = Math.min(1, c.p + dt / CHECK.call);
    if (c.p >= 1) (c.lit = true), ev.push({ k: 'exped', x: c.x, y: c.y, what: 'check' }, { k: 'checklit', x: c.x, y: c.y });
    return;
  }
  const alone = players(room.heroes).length < 2;
  players(room.heroes).forEach((h, i) => {
    if (h.act !== 'down') return;
    const due = alone ? h.actT >= HERO.respawn - 0.1 : h.out || (h.actT >= CHECK.back && !h.raiser);
    if (!due) return;
    const a = (i / 4) * Math.PI * 2;
    Object.assign(h, {
      act: 'idle', actT: 0, actDur: 0, hp: Math.round(h.maxHp * CHECK.up), bleeding: false, out: false, pickT: 0, raiser: undefined,
      x: c.x + Math.cos(a) * 1.1, y: c.y + 0.9 + Math.sin(a) * 0.6, kvx: 0, kvy: 0, netUntil: undefined, hoisted: undefined,
    });
    ev.push({ k: 'gotup', x: h.x, y: h.y, id: h.id });
  });
}
