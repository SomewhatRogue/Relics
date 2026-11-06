/**
 * The new meaty sorts (shared/meaty.ts, sim/meaty.ts): the Planker, the Swingle and the Forker. Each one's
 * blow lands, is blocked by a class that blocks, is dodged by a class that dodges, and its answer works:
 * the Planker's front takes nothing so you flank it; the Swingle reels after its spin so you punish it;
 * inside the Forker's tines it can't touch you. Then how they bleed in (shared/debut.ts) and what they cost.
 */
import { describe, expect, it } from 'vitest';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { routeOf } from '../src/shared/route';
import { planRoom, type RoadId, type FoeVariant } from '../src/shared/terrain';
import { PLANKER, FORKER, GUARD, HERO, SWINGLE, TEMPLATES, THREAT, WEAPONS, type Swing, type WeaponId } from '../src/shared/tuning';
import { rareRoom, stageOf, weightIn } from '../src/shared/debut';
import { foeThreat, weighOf } from '../src/shared/roombudget';
import { attackCovers, hitEnemy } from '../src/sim/combat';
import { boardFor } from '../src/sim/board';
import { tinesFrom } from '../src/sim/meaty';
import { NO_INTENT, type Bolt, type Enemy, type FightEvent, type Hero } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';
import { field, run } from './foeyard';

/** One of them at (15, 10), awake, and a hero with `weapon` `gap` tiles below it, facing it. */
function yard(variant: FoeVariant, weapon: WeaponId, gap: number) {
  const f = field([{ kind: 'scrapper', variant, x: 15, y: 10 }], [['me', 15, 10 + gap]]);
  const e = f.room.enemies[0];
  Object.assign(f.h, { weapon, fx: 0, fy: -1 });
  Object.assign(e, { fx: 0, fy: 1, cooldown: 0.2 });
  return { ...f, e };
}

/** Step till its blow is about to land (the hero holding still, or blocking). */
function toBlow(room: ArenaRoom, e: Enemy, block = false): void {
  room.setIntent('me', { ...NO_INTENT, ay: -1, block, blockSeq: block ? 1 : 0 });
  run(room, 4, () => !!e.attack && e.attack.windup - e.attack.t < 0.08);
  expect(e.attack, 'it began its blow').toBeTruthy();
}

/** The blow lands now: `how` it's met. Returns the hero's health lost and the events. */
function meet(variant: FoeVariant, weapon: WeaponId, gap: number, how: 'nothing' | 'block' | 'dodge') {
  const { room, h, e } = yard(variant, weapon, gap);
  toBlow(room, e, how === 'block');
  if (how === 'dodge') Object.assign(h, { act: 'roll', actT: WEAPONS[weapon].dodge.iFrom + 0.01 });
  const ev = run(room, 0.4);
  return { lost: HERO.hp - h.hp, ev, h, e, room };
}

const SWORD = 'sword', MACE = 'mace', DODGERS: WeaponId[] = ['daggers', 'longbow', 'wand'];
const swingAll = (dmg = 10): Swing => ({ ...WEAPONS.sword.combo[0], dmg, range: 9, arc: 360, knock: 0 });

describe('the Planker', () => {
  it('its bash lands, is blocked by a Warrior or Healer, and dodged by a Rogue, Ranger or Mage', () => {
    expect(meet('planker', SWORD, 1.3, 'nothing').lost).toBeGreaterThan(0);
    for (const w of [SWORD, MACE] as WeaponId[]) {
      const m = meet('planker', w, 1.3, 'block');
      expect(m.ev.some((x) => x.k === 'block'), w).toBe(true);
      expect(m.lost, w).toBe(0);
    }
    for (const w of DODGERS) expect(meet('planker', w, 1.3, 'dodge').lost, w).toBe(0);
    expect(PLANKER.bash.unblockable).toBe(false);
  });

  it('its front takes nothing, a charged blow or a shot alike; its side and back take it all', () => {
    const { room, h, e } = yard('planker', SWORD, 1.3);
    const s = swingAll(20);
    expect(hitEnemy(h, s, e, room.time, room.events)).toBe(0);
    h.hitIds = [], (h.heavy = true);
    expect(hitEnemy(h, s, e, room.time, room.events)).toBe(0);
    expect(room.events.some((x) => x.k === 'hit' && (x as { boarded?: boolean }).boarded)).toBe(true);
    h.heavy = false;
    // To its side: in full.
    Object.assign(h, { x: 16.4, y: 10, hitIds: [] });
    expect(hitEnemy(h, s, e, room.time, room.events)).toBe(20);
    // Shots: from the front stopped, a charged one too; from the side through.
    const shot = (dx: number, dy: number, charged = false) => ({ dx, dy, el: '', charged, perfect: false }) as unknown as Bolt;
    expect(boardFor(e, shot(0, -1), room.time)).toBe('blocked');
    expect(boardFor(e, shot(0, -1, true), room.time)).toBe('blocked');
    expect(boardFor(e, shot(-1, 0), room.time)).toBe('open');
  });

  it('the answer: block or dodge the bash, then step round to its side while it stands there, and hit it in full', () => {
    for (const [w, how] of [[SWORD, 'block'], ['daggers', 'dodge']] as [WeaponId, 'block' | 'dodge'][]) {
      const { room, h, e } = yard('planker', w, 1.3);
      toBlow(room, e, how === 'block');
      // A dodger dodges off to the side through the blow; a blocker holds it.
      if (how === 'dodge') room.setIntent('me', { ...NO_INTENT, mx: 1, rollSeq: 1 }), Object.assign(h, { fx: 1, fy: 0 });
      run(room, 0.2);
      expect(HERO.hp - h.hp, w).toBe(0);
      const face = { x: e.fx, y: e.fy };
      // Walk round to its side.
      room.setIntent('me', { ...NO_INTENT, mx: 1, my: -1 });
      run(room, 0.6);
      room.setIntent('me', { ...NO_INTENT });
      expect(e.fx * face.x + e.fy * face.y, `${w}: it hasn't turned`).toBeGreaterThan(0.98);
      const tx = h.x - e.x, ty = h.y - e.y;
      expect((e.fx * tx + e.fy * ty) / Math.hypot(tx, ty), `${w}: at its side`).toBeLessThan(PLANKER.cone);
      h.hitIds = [];
      // In full (a Rogue's knives more: from the side counts as its back).
      expect(hitEnemy(h, swingAll(15), e, room.time, room.events), w).toBeGreaterThanOrEqual(15);
    }
  });

  it('turns slowly: a hero circling it stays off its front', () => {
    const { room, h, e } = yard('planker', 'daggers', 1.4);
    e.cooldown = 99;
    let front = 0, n = 0;
    for (let i = 0; i < 60; i++) {
      const a = Math.PI / 2 + i * 0.12;
      Object.assign(h, { x: e.x + Math.cos(a) * 1.5, y: e.y + Math.sin(a) * 1.5 });
      run(room, 1 / 30);
      const tx = h.x - e.x, ty = h.y - e.y;
      if (i > 15) (n++, (front += (e.fx * tx + e.fy * ty) / Math.hypot(tx, ty) > PLANKER.cone ? 1 : 0));
    }
    expect(front / n).toBeLessThan(0.2);
  });
});

describe('the Swingle', () => {
  it('its spin is a striped ring round itself: it lands on one who stays, and no block holds it', () => {
    expect(SWINGLE.spin.unblockable).toBe(true);
    const { room, h, e } = yard('swingle', SWORD, 1.2);
    room.setIntent('me', { ...NO_INTENT, ay: -1 });
    run(room, 3, () => !!e.attack);
    expect(e.attack!.kind).toBe('slam');
    expect([e.attack!.cx, e.attack!.cy]).toEqual([e.x, e.y]);
    expect(e.attack!.radius).toBe(SWINGLE.spin.radius);
    expect(meet('swingle', SWORD, 1.2, 'nothing').lost).toBeGreaterThan(0);
    expect(meet('swingle', SWORD, 1.2, 'block').lost).toBeGreaterThan(0);
    void h;
  });

  it('a Warrior or Healer walks out of it; a Rogue, Ranger or Mage dodges it', () => {
    for (const w of [SWORD, MACE] as WeaponId[]) {
      const { room, h, e } = yard('swingle', w, 1.2);
      run(room, 3, () => !!e.attack);
      room.setIntent('me', { ...NO_INTENT, my: 1 });
      run(room, SWINGLE.spin.windup + 0.3);
      expect(HERO.hp - h.hp, w).toBe(0);
    }
    for (const w of DODGERS) expect(meet('swingle', w, 1.2, 'dodge').lost, w).toBe(0);
  });

  it('then it reels, stunned for SWINGLE.reel: the punish lands harder', () => {
    const { room, h, e } = yard('swingle', SWORD, 1.2);
    run(room, 3, () => !!e.attack);
    room.setIntent('me', { ...NO_INTENT, my: 1 });
    run(room, 3, () => e.act === 'stunned');
    expect(e.act).toBe('stunned');
    expect(e.actDur).toBe(SWINGLE.reel);
    Object.assign(h, { x: e.x, y: e.y + 1, hitIds: [] });
    const n = hitEnemy(h, swingAll(10), e, room.time, room.events);
    expect(n).toBe(Math.round(10 * GUARD.stunnedMult));
    run(room, SWINGLE.reel + 0.1);
    expect(e.act).not.toBe('stunned');
  });
});

describe('the Forker', () => {
  it('its jab is a red lane from its reach that pushes you well off; blocked by a blocker, dodged by a dodger', () => {
    const m = meet('forker', SWORD, 2.6, 'nothing');
    expect(m.lost).toBeGreaterThan(0);
    expect(m.h.y - (10 + 2.6)).toBeGreaterThan(0.6);
    for (const w of [SWORD, MACE] as WeaponId[]) {
      const b = meet('forker', w, 2.6, 'block');
      expect(b.ev.some((x) => x.k === 'block'), w).toBe(true);
      expect(b.lost, w).toBe(0);
    }
    for (const w of DODGERS) expect(meet('forker', w, 2.6, 'dodge').lost, w).toBe(0);
    expect(FORKER.jab.unblockable).toBe(false);
  });

  it('the answer: inside FORKER.inner its tines are past you, it backs off slower than you walk, and it never jabs there', () => {
    const { room, h, e } = yard('forker', 'daggers', 2.6);
    toBlow(room, e);
    const a = e.attack!;
    // The lane starts at the tines: on it at 2.6, off it at 1.1.
    expect(Math.hypot(a.ox - e.x, a.oy - e.y)).toBeCloseTo(tinesFrom(), 5);
    expect(attackCovers(a, h)).toBe(true);
    Object.assign(h, { x: e.x, y: e.y + FORKER.inner - 0.05 });
    expect(attackCovers(a, h)).toBe(false);
    // Kept inside by walking at it: no jab begins, and no blow lands.
    run(room, 1);
    const hp = h.hp;
    let jabs = 0;
    for (let i = 0; i < 90; i++) {
      const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
      room.setIntent('me', { ...NO_INTENT, mx: d > 0.8 ? dx / d : 0, my: d > 0.8 ? dy / d : 0 });
      run(room, 1 / 30);
      if (e.attack && e.actT < 0.05) jabs++;
      expect(Math.hypot(e.x - h.x, e.y - h.y)).toBeLessThan(FORKER.inner + 0.3);
    }
    expect(jabs).toBe(0);
    expect(h.hp).toBe(hp);
  });
});

describe('their place in a room', () => {
  const job = (place: (typeof PLACES)[number], seed: number, day: number, rooms = 5): Job => ({ ...board(day)[1], place, rooms, seed, objective: 'hunt', layout: 4 });
  const T = (id: string) => TEMPLATES.find((t) => t.id === id)!;

  it('each is meaty: 4 points, one meaty in its pack, a fight to think about or a closer', () => {
    for (const [id, role] of [['plank', 'planker'], ['swing', 'swingle'], ['fork', 'forker']] as const) {
      expect(foeThreat({ role })).toBe(THREAT.meaty);
      expect(weighOf(T(id))).toEqual({ threat: THREAT.meaty, meaty: 1, heavy: 0 });
      expect(T(id).beats).toEqual(['tactic', 'closer']);
    }
  });

  it('bleed in one after another: staged, then rare, then common, each a couple of board days behind the last', () => {
    const ds = [PLANKER.debut, SWINGLE.debut, FORKER.debut];
    for (let i = 1; i < ds.length; i++) expect(ds[i].from).toBeGreaterThan(ds[i - 1].from);
    // Staged on the live world's day (about 60) and before; all common within about a week of the first going rare.
    for (const d of ds) expect(stageOf(d, 60)).toBe('staged');
    expect(FORKER.debut.from + FORKER.debut.common - (PLANKER.debut.from + PLANKER.debut.rare)).toBeLessThanOrEqual(8);
    const by = (d: typeof PLANKER.debut, day: number) => stageOf(d, day);
    expect([62, 64, 66].map((day) => by(PLANKER.debut, day))).toEqual(['rare', 'rare', 'common']);
    expect([62, 64, 66].map((day) => by(SWINGLE.debut, day))).toEqual(['staged', 'rare', 'rare']);
    expect([62, 64, 66].map((day) => by(FORKER.debut, day))).toEqual(['staged', 'staged', 'rare']);
    for (const [id, d] of [['plank', PLANKER.debut], ['swing', SWINGLE.debut], ['fork', FORKER.debut]] as const) {
      const at = (day: number) => job(PLACES[0], 77, day), rare = at(d.from + d.rare);
      expect(weightIn(T(id), at(d.from), rareRoom(at(d.from)))).toBe(0);
      expect(weightIn(T(id), rare, rareRoom(rare))).toBe(d.weight);
      expect(weightIn(T(id), job(PLACES[3], 77, d.from + d.rare), rareRoom(rare))).toBe(0);
      expect(weightIn(T(id), job(PLACES[3], 77, d.from + d.common), 2)).toBe(T(id).weight);
    }
  });

  it('staged in their way rooms in the Barrowfields (DRUMS, SMOKE, CRIES), with company (two small ones, or the guards of the captives), and not elsewhere', () => {
    const seen: Record<string, number> = {}, away: Record<string, number> = {};
    const want = { drums: 'planker', smoke: 'swingle', cries: 'forker' } as Record<string, string>;
    for (const place of [PLACES[0], PLACES[1], PLACES[2], PLACES[3], PLACES[4]]) for (let s = 1; s <= 40; s++) {
      const j = job(place, s * 13 + 1, 1);
      for (const took of ['h', 'l'] as const) {
        const r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2), road: RoadId = took === 'l' ? 'low' : 'high', way = r[f + 1]?.way;
        if (!way || !want[way]) continue;
        const plan = planRoom(j, f + 1, road, { [f + 1]: road }), u = plan.foes.filter((x) => x.variant === want[way]);
        if (place.region !== 'Barrowfields') (away[way] = (away[way] ?? 0) + 1), expect(u).toHaveLength(0);
        else if (u.length) (seen[way] = (seen[way] ?? 0) + 1), expect(u).toHaveLength(1), expect(plan.foes.filter((x) => x.pack === u[0].pack && x !== u[0]).length).toBeGreaterThanOrEqual(2);
      }
    }
    for (const w of Object.keys(want)) expect(seen[w] ?? 0, w).toBeGreaterThan(0);
  });

  it('in the packs: none while staged; once common, anywhere a fight or a closer fits', () => {
    const count = (day: number) => {
      let n = 0;
      for (const j of board(day)) for (let i = 0; i < j.rooms; i++) n += planRoom(j, i).foes.filter((f) => ['planker', 'swingle', 'forker'].includes(f.variant ?? '') && f.pack !== 83 && f.pack !== 84 && f.pack !== 82).length;
      return n;
    };
    let staged = 0, common = 0;
    for (let k = 0; k < 6; k++) (staged += count(55 + k)), (common += count(FORKER.debut.from + FORKER.debut.common + k));
    expect(staged).toBe(0);
    expect(common).toBeGreaterThan(0);
  });

  it('nothing hits from off screen: every blow begins within a few tiles of its hero', () => {
    for (const v of ['planker', 'swingle', 'forker'] as FoeVariant[]) {
      const { room, h, e } = yard(v, SWORD, 7);
      e.cooldown = 0;
      const begun: number[] = [];
      for (let i = 0; i < 240; i++) {
        room.setIntent('me', { ...NO_INTENT, my: i % 60 < 30 ? 1 : -1 });
        const was = !!e.attack;
        run(room, 1 / 30);
        if (!was && e.attack) begun.push(Math.hypot(h.x - e.x, h.y - e.y));
      }
      for (const d of begun) expect(d, v).toBeLessThan(FORKER.reach + 0.5);
    }
  });
});

describe('determinism', () => {
  it('the same fight with all three plays the same twice', () => {
    const play = () => {
      const f = field([{ kind: 'scrapper', variant: 'planker', x: 12, y: 8 }, { kind: 'scrapper', variant: 'swingle', x: 15, y: 8 }, { kind: 'scrapper', variant: 'forker', x: 18, y: 8 }]);
      const log: string[] = [];
      for (let i = 0; i < 300; i++) {
        f.room.setIntent('me', { ...NO_INTENT, mx: Math.sin(i / 20), my: Math.cos(i / 31), attack: i % 9 < 2, attackSeq: Math.floor(i / 9), rollSeq: Math.floor(i / 70) });
        run(f.room, 1 / 30);
        for (const ev of f.room.events as FightEvent[]) if (ev.k === 'hit' || ev.k === 'windup' || ev.k === 'stunned') log.push(`${i}:${ev.k}:${ev.x.toFixed(2)}`);
      }
      return log.join('|') + (f.room.heroes[0] as Hero).hp;
    };
    expect(play()).toBe(play());
  });
});
