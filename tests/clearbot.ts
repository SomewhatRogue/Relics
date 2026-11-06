/**
 * A simulated clear (not a test on its own: tests/threat.test.ts and scripts/encounters/clear.ts use it).
 * One hero who can't be hurt clears a job's room: it walks (ghosted, so walls never stick it) to the
 * nearest awake goblin on the ground (else the nearest one at all), faces it and fights by Intent like a
 * plain player: a Rogue's daggers tap away at whatever is in reach; a Mage's staff taps its slash and,
 * with three or more about it and the magic for it, holds for the element's big spell. The room decides
 * the rest. A room is clear when every goblin on the ground is dead or gone (roof archers left out: no
 * blade reaches them), or after `most` seconds.
 */
import { board, type Job } from '../src/shared/jobs';
import { HERO, SPELL, TICK, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { isDead } from '../src/sim/damage';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type Enemy, type Hero } from '../src/sim/types';

export interface Clear { secs: number; kills: number; left: number; skipped: number; taken: number }

const fighter = (e: Enemy) => (e.kind === 'scrapper' || e.kind === 'butcher') && !((e.z ?? 0) > 0) && e.variant !== 'roofer';
const gone = (e: Enemy) => isDead(e) || !!e.escaped;

/** Clear room `index` of `job` alone with `weapon`. */
export function clearRoom(job: Job, index: number, weapon: WeaponId, most = 180, party = 1): Clear {
  const run = { ...newRun(job), index, party };
  const room = runRoom(run);
  room.dread = null;
  const hs: Hero[] = Array.from({ length: party }, (_, k) => Object.assign(room.join('p' + k), { weapon, safeT: 0 }));
  let foes = room.enemies.filter(fighter);
  // Stuck on something (a wall, the water) or at one it can't get at (in a house): hop on, then give it up.
  const on = new Map<string, { id: number; best: number; at: number; since: number; hp: number }>();
  let skipped = 0, taken = 0;
  const pace = HERO.speed * (WEAPONS[weapon].speed ?? 1);
  const seq = new Map<string, number>(), next = new Map<string, number>(), holdT = new Map<string, number>();
  let t = 0;
  for (; t < most / TICK; t++) {
    const live = foes.filter((e) => !gone(e));
    if (!live.length) break;
    for (const h of hs) {
      // It can't go down, but every blow it takes is counted (the swarm's pressure on a kit that can't sweep).
      taken += h.maxHp - h.hp;
      h.hp = h.maxHp;
      const d = (e: Enemy) => Math.hypot(e.x - h.x, e.y - h.y);
      const woke = live.filter((e) => e.alert !== false && !e.under);
      const foe = (woke.length ? woke : live).reduce((a, b) => (d(b) < d(a) ? b : a));
      const dist = d(foe), ux = (foe.x - h.x) / (dist || 1), uy = (foe.y - h.y) / (dist || 1);
      let o = on.get(h.id);
      if (!o || o.id !== foe.id) on.set(h.id, (o = { id: foe.id, best: dist, at: room.time, since: room.time, hp: foe.hp }));
      if (dist < o.best - 0.3 || foe.hp < o.hp) (o.best = Math.min(o.best, dist)), (o.at = room.time), (o.hp = foe.hp);
      else if (room.time - o.at > 2.5 && dist > 2) (h.x += ux * Math.min(dist - 1, 2.5)), (h.y += uy * Math.min(dist - 1, 2.5)), (o.at = room.time);
      if (room.time - o.since > 12 && foe.hp >= foe.maxHp) (foes = foes.filter((e) => e !== foe)), skipped++, on.delete(h.id);
      const reach = weapon === 'staff' ? 1.7 : 1.05;
      // Ghosted walking: straight at it, stopping just inside reach.
      if (dist > reach && h.act !== 'charge' && h.act !== 'attack') {
        const step = Math.min(dist - reach * 0.8, pace * TICK);
        (h.x += ux * step), (h.y += uy * step);
      }
      const i = { ...NO_INTENT, ax: ux, ay: uy };
      const crowd = live.filter((e) => e.alert !== false && d(e) < 2.6).length;
      const held = holdT.get(h.id);
      if (held !== undefined) {
        // Holding for the staff's spell: let go once it's drawn.
        if (room.time - held < (WEAPONS.staff.draw ?? 1) + 0.05) Object.assign(i, { attack: true, attackSeq: seq.get(h.id) ?? 0 });
        else holdT.delete(h.id);
      } else if (h.act === 'stun' && room.time >= (next.get(h.id) ?? 0)) {
        // Netted (or held): struggle, as a player mashes.
        seq.set(h.id, (seq.get(h.id) ?? 0) + 1), next.set(h.id, room.time + 0.12);
      } else if (dist < reach + 0.4 && room.time >= (next.get(h.id) ?? 0)) {
        seq.set(h.id, (seq.get(h.id) ?? 0) + 1);
        const spell = weapon === 'staff' && crowd >= 3 && !h.winded && h.stamina >= SPELL.staff;
        if (spell) holdT.set(h.id, room.time), Object.assign(i, { attack: true });
        next.set(h.id, room.time + (weapon === 'staff' ? 0.5 : 0.22));
      }
      room.setIntent(h.id, { ...i, attackSeq: seq.get(h.id) ?? 0 });
    }
    room.step();
  }
  return { secs: +(t * TICK).toFixed(1), kills: foes.filter((e) => isDead(e)).length, left: foes.filter((e) => !gone(e)).length, skipped, taken };
}

/** The same seeded rooms every time: the board's ordinary jobs (no deep dives), every second room. */
export function sampleRooms(days: number, step = 2): { job: Job; index: number }[] {
  const out: { job: Job; index: number }[] = [];
  for (let day = 1; day <= days; day++) for (const job of board(day).filter((j) => !j.deep)) for (let i = 0; i < job.rooms; i += step) out.push({ job, index: i });
  return out;
}

/** Mean seconds to clear the sample with each kit. */
export function clearTimes(rooms: { job: Job; index: number }[], kits: WeaponId[], most = 180): Record<string, { mean: number; worst: number; unclear: number; skipped: number; taken: number }> {
  const out: Record<string, { mean: number; worst: number; unclear: number; skipped: number; taken: number }> = {};
  for (const k of kits) {
    const r = rooms.map(({ job, index }) => clearRoom(job, index, k, most));
    out[k] = { taken: Math.round(r.reduce((s, x) => s + x.taken, 0) / r.length), skipped: r.reduce((s, x) => s + x.skipped, 0), mean: +(r.reduce((s, x) => s + x.secs, 0) / r.length).toFixed(1), worst: Math.max(...r.map((x) => x.secs)), unclear: r.filter((x) => x.left > 0).length };
  }
  return out;
}
