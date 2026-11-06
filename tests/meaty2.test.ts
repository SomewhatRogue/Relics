/**
 * The second three meaty sorts (shared/meaty2.ts, sim/meaty2.ts, sim/blast.ts): the Kegman, the Pouncer and
 * the Gorger. Each one's blow lands, is blocked by a class that blocks, is dodged by a class that dodges,
 * and its answer works: the Kegman's keg bursts where it fell (walk out; shot or killed in among its own,
 * it takes them with it); the Pouncer's circle is walked or dodged out of, and it's stuck after; the
 * Gorger eats the dead and grows, up to three times, unless they're burned or it's kept off them. Then how
 * they bleed in (shared/debut.ts), what they cost, and the same fight twice.
 */
import { describe, expect, it } from 'vitest';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { routeOf } from '../src/shared/route';
import { planRoom, type FoeVariant, type RoadId } from '../src/shared/terrain';
import { FORKER, GORGER, GUARD, HERO, KEGMAN, MEATY2_ON, POUNCER, TEMPLATES, THREAT, WEAPONS, grownBy, type Swing, type WeaponId } from '../src/shared/tuning';
import { rareRoom, stageOf, weightIn } from '../src/shared/debut';
import { foeThreat, weighOf } from '../src/shared/roombudget';
import { hitEnemy } from '../src/sim/combat';
import { damage, kill } from '../src/sim/damage';
import { toAsh } from '../src/sim/meal';
import { shotKeg } from '../src/sim/blast';
import { blastShape } from '../src/sim/blastshape';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';
import { field, run } from './foeyard';

/** One of them at (15, 10), awake, and a hero with `weapon` `gap` tiles below it, facing it. */
function yard(variant: FoeVariant, weapon: WeaponId, gap: number, more: Parameters<typeof field>[0] = []) {
  const f = field([{ kind: 'scrapper', variant, x: 15, y: 10, pack: 1 }, ...more], [['me', 15, 10 + gap]]);
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

/** Its blow lands now, `how` it's met: the hero's health lost and the events. */
function meet(variant: FoeVariant, weapon: WeaponId, gap: number, how: 'nothing' | 'block' | 'dodge') {
  const { room, h, e } = yard(variant, weapon, gap);
  toBlow(room, e, how === 'block');
  if (how === 'dodge') Object.assign(h, { act: 'roll', actT: WEAPONS[weapon].dodge.iFrom + 0.01 });
  const ev = run(room, 0.4);
  return { lost: HERO.hp - h.hp, ev, h, e, room };
}

const SWORD = 'sword', MACE = 'mace', BLOCKERS: WeaponId[] = [SWORD, MACE], DODGERS: WeaponId[] = ['daggers', 'longbow', 'wand'];
const swingAll = (dmg = 10): Swing => ({ ...WEAPONS.sword.combo[0], dmg, range: 9, arc: 360, knock: 0 });
/** The slowest kit's walking pace (the striped floors are sized to it). */
const SLOWEST = HERO.speed * Math.min(...Object.values(WEAPONS).map((w) => w.speed ?? 1));

describe('the Kegman', () => {
  it('its swing is red: it lands, a blocker blocks it, a dodger dodges it', () => {
    expect(KEGMAN.swing.unblockable).toBe(false);
    expect(meet('kegman', SWORD, 1.2, 'nothing').lost).toBeGreaterThan(0);
    for (const w of BLOCKERS) {
      const m = meet('kegman', w, 1.2, 'block');
      expect(m.ev.some((x) => x.k === 'block'), w).toBe(true);
      expect(m.lost, w).toBe(0);
    }
    for (const w of DODGERS) expect(meet('kegman', w, 1.2, 'dodge').lost, w).toBe(0);
  });

  /** Killed with the hero beside it; the hero then `how`. */
  const killed = (w: WeaponId, how: 'stay' | 'block' | 'walk' | 'dodge') => {
    const { room, h, e } = yard('kegman', w, 1.1);
    e.cooldown = 99;
    e.lastBy = 'me';
    kill(e, room.events, 'fall');
    run(room, 1 / 30);
    expect(e.blast?.k).toBe('keg');
    const a = blastShape(e, room.time)!;
    expect(a.unblockable).toBe(true);
    expect(a.windup).toBe(KEGMAN.keg.fuse);
    if (how === 'block') room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    if (how === 'walk') room.setIntent('me', { ...NO_INTENT, my: 1 });
    if (how === 'dodge') run(room, KEGMAN.keg.fuse - 0.2), room.setIntent('me', { ...NO_INTENT, my: 1, rollSeq: 1 });
    run(room, KEGMAN.keg.fuse + 0.3);
    expect(e.blast!.done).toBe(true);
    return HERO.hp - h.hp;
  };

  it('killed, its keg bursts where it fell a second later: striped, so no block holds it; walked out of or dodged out of, nothing', () => {
    expect(killed(SWORD, 'stay')).toBeGreaterThan(0);
    for (const w of BLOCKERS) expect(killed(w, 'block'), w).toBeGreaterThan(0);
    for (const w of BLOCKERS) expect(killed(w, 'walk'), w).toBe(0);
    for (const w of DODGERS) expect(killed(w, 'dodge'), w).toBe(0);
    // Fair: from the middle the slowest kit is out in under 60% of the fuse.
    expect((KEGMAN.keg.r + HERO.radius) / SLOWEST).toBeLessThan(KEGMAN.keg.fuse * 0.6);
  });

  it('the answer: lit in among its own (shot, or alight), it stands there and takes them with it', () => {
    // (Its pack standing about it, not yet stirred.)
    const pack = [{ kind: 'scrapper', x: 14.2, y: 10.4, awake: false, pack: 2 }, { kind: 'scrapper', x: 15.8, y: 10.4, awake: false, pack: 2 }, { kind: 'scrapper', x: 15, y: 9.1, awake: false, pack: 2 }] as Parameters<typeof field>[0];
    for (const how of ['shot', 'fire'] as const) {
      const { room, h, e } = yard('kegman', 'longbow', 6, pack);
      e.lastBy = 'me';
      // (Held at their spot, as a pack over the screen's cap is, sim/pacing.ts: goblins chasing you walk out with you.)
      for (const o of room.enemies.slice(1)) o.held = 1;
      if (how === 'shot') shotKeg(e, room.time, room.events);
      // Set alight (as any fire of ours does it: sim/elements.ts afflict).
      else (e.burnUntil = room.time + 4), run(room, 1 / 30);
      expect(e.blast?.k, how).toBe('keg');
      expect(e.act, how).toBe('stunned');
      const at = [e.x, e.y];
      run(room, KEGMAN.keg.fuse - 0.1);
      expect(Math.hypot(e.x - at[0], e.y - at[1]), `${how}: it stood there`).toBeLessThan(0.3);
      run(room, 0.3);
      const small = room.enemies.slice(1);
      expect(small.every((o) => o.hp < 36 || o.act === 'dead'), how).toBe(true);
      expect(small.filter((o) => o.act === 'dead' || o.burnUntil > 0 || o.ashed).length, how).toBeGreaterThan(0);
      expect(HERO.hp - h.hp, `${how}: from range, nothing`).toBe(0);
    }
  });

  it('a real shot lights it: a Ranger shooting it from afar', () => {
    const { room, h, e } = yard('kegman', 'longbow', 6);
    e.cooldown = 99;
    // Drawn and loosed (a Ranger's shot is its held attack), till one lands.
    for (let i = 0; i < 6 && !e.blast; i++) {
      room.setIntent('me', { ...NO_INTENT, ax: 0, ay: -1, attack: true, attackSeq: i + 1 });
      run(room, 0.7);
      room.setIntent('me', { ...NO_INTENT, ax: 0, ay: -1, attackSeq: i + 1 });
      run(room, 0.6);
    }
    expect(e.blast?.k).toBe('keg');
    void h;
  });
});

describe('the Pouncer', () => {
  const leapAt = (w: WeaponId) => {
    const r = yard('pouncer', w, 4);
    r.room.setIntent('me', { ...NO_INTENT, ay: -1 });
    run(r.room, 3, () => !!r.e.attack);
    return r;
  };

  it('from 5 tiles it leaps: a striped circle where you stood as it crouched, locked, landing on whoever stays (no block holds it)', () => {
    const { room, h, e } = leapAt(SWORD);
    const a = e.attack!;
    expect(a.kind).toBe('slam');
    expect(a.unblockable).toBe(true);
    expect([a.cx, a.cy]).toEqual([h.x, h.y]);
    expect(a.windup).toBe(POUNCER.leap.windup);
    expect(a.radius).toBe(POUNCER.leap.radius);
    // It flies no faster than a thrown thing may (12 tiles a second), and lands on the circle.
    const far = Math.hypot(a.cx - a.ox, a.cy - a.oy);
    expect(far / (a.windup * (1 - POUNCER.crouch))).toBeLessThanOrEqual(12);
    room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    run(room, POUNCER.leap.windup + 0.1);
    expect(Math.hypot(e.x - a.cx, e.y - a.cy)).toBeLessThan(0.5);
    expect(HERO.hp - h.hp).toBeGreaterThan(0);
  });

  it('a blocker walks out of the circle; a dodger walks or dodges out; fair for the slowest kit', () => {
    for (const w of BLOCKERS) {
      const { room, h } = leapAt(w);
      room.setIntent('me', { ...NO_INTENT, mx: 1 });
      run(room, POUNCER.leap.windup + 0.2);
      expect(HERO.hp - h.hp, w).toBe(0);
    }
    for (const w of DODGERS) {
      const { room, h, e } = leapAt(w);
      run(room, 2, () => e.attack!.windup - e.attack!.t < 0.25);
      room.setIntent('me', { ...NO_INTENT, mx: 1, rollSeq: 1 });
      run(room, 0.5);
      expect(HERO.hp - h.hp, w).toBe(0);
    }
    expect((POUNCER.leap.radius! + HERO.radius) / SLOWEST).toBeLessThan(POUNCER.leap.windup * 0.6);
  });

  it('landed, it is stuck for POUNCER.stuck (the punish lands harder), then rakes red: blocked, dodged', () => {
    const { room, h, e } = leapAt(SWORD);
    room.setIntent('me', { ...NO_INTENT, mx: 1 });
    run(room, 3, () => e.act === 'stunned');
    expect(e.act).toBe('stunned');
    expect(e.actDur).toBe(POUNCER.stuck);
    Object.assign(h, { x: e.x, y: e.y + 1, hitIds: [] });
    expect(hitEnemy(h, swingAll(10), e, room.time, room.events)).toBe(Math.round(10 * GUARD.stunnedMult));
    expect(POUNCER.rake.unblockable).toBe(false);
    expect(meet('pouncer', SWORD, 1.1, 'nothing').lost).toBeGreaterThan(0);
    for (const w of BLOCKERS) expect(meet('pouncer', w, 1.1, 'block').lost, w).toBe(0);
    for (const w of DODGERS) expect(meet('pouncer', w, 1.1, 'dodge').lost, w).toBe(0);
  });

  it('never leaps from past POUNCER.from: nothing begins off screen', () => {
    const { room, h, e } = yard('pouncer', SWORD, 9);
    e.cooldown = 0;
    const begun: number[] = [];
    for (let i = 0; i < 240; i++) {
      room.setIntent('me', { ...NO_INTENT, my: i % 60 < 30 ? 1 : -1 });
      const was = !!e.attack;
      run(room, 1 / 30);
      if (!was && e.attack) begun.push(Math.hypot(h.x - e.x, h.y - e.y));
    }
    expect(begun.length).toBeGreaterThan(0);
    for (const d of begun) expect(d).toBeLessThanOrEqual(POUNCER.from + 0.2);
  });
});

describe('the Gorger', () => {
  /** A Gorger with `n` small ones' bodies lying near it and the hero away (or `near`). */
  const feast = (n: number, opts: { burn?: boolean; near?: boolean } = {}) => {
    const bodies = Array.from({ length: n }, (_, i) => ({ kind: 'scrapper', x: 13 + i * 0.9, y: 12 })) as Parameters<typeof field>[0];
    const { room, h, e } = yard('gorger', SWORD, 10, bodies);
    for (const b of room.enemies.slice(1)) (b.hitAt = room.time), kill(b, room.events, 'fall'), opts.burn && toAsh(b, room.events);
    if (opts.near) Object.assign(h, { x: e.x + 1, y: e.y });
    else Object.assign(h, { x: 15, y: 22 });
    return { room, h, e };
  };

  it('its bite is red: it lands, a blocker blocks it, a dodger dodges it', () => {
    expect(meet('gorger', SWORD, 1.2, 'nothing').lost).toBeGreaterThan(0);
    for (const w of BLOCKERS) expect(meet('gorger', w, 1.2, 'block').lost, w).toBe(0);
    for (const w of DODGERS) expect(meet('gorger', w, 1.2, 'dodge').lost, w).toBe(0);
  });

  it('pulls a body in (GORGER.pull, from GORGER.seek) and eats it: bigger, tougher and harder hitting', () => {
    const { room, e } = feast(1);
    const hp = e.maxHp, r = e.radius, ev: FightEvent[] = run(room, 0.2);
    expect(ev.some((x) => x.k === 'meal')).toBe(true);
    expect(e.meal!.until - e.meal!.at).toBeCloseTo(GORGER.pull, 5);
    run(room, GORGER.pull + 0.1);
    expect(e.grown).toBe(1);
    expect(e.maxHp).toBe(Math.round(hp * grownBy(1)));
    expect(e.radius).toBeCloseTo(r * grownBy(1), 2);
    expect(e.harm).toBeCloseTo(grownBy(1), 3);
    expect(room.enemies[1].eaten).toBe(true);
  });

  it('grows three times at most, however many it can reach', () => {
    const { room, e } = feast(6);
    const hp = e.maxHp;
    // (The dead fade in a few seconds: here they keep coming, fresh.)
    for (let i = 0; i < 24; i++) for (const b of room.enemies.slice(1)) (b.actT = 0), run(room, 0.5 / 6);
    expect(e.grown).toBe(GORGER.most);
    expect(e.maxHp).toBe(Math.round(hp * grownBy(GORGER.most)));
    expect(room.enemies.slice(1).filter((b) => b.eaten).length).toBe(GORGER.most);
    expect(e.harm).toBeCloseTo(grownBy(GORGER.most), 3);
  });

  it('the answer: burned bodies feed nothing, a hero by it keeps it off, a heavy hit breaks the pull, and killing it first ends it', () => {
    const burned = feast(3, { burn: true });
    run(burned.room, 4);
    expect(burned.e.grown ?? 0).toBe(0);
    const kept = feast(3, { near: true });
    kept.e.cooldown = 99;
    kept.room.setIntent('me', { ...NO_INTENT, block: true, blockSeq: 1 });
    run(kept.room, 3);
    expect(kept.e.grown ?? 0).toBe(0);
    const hit = feast(1);
    run(hit.room, 0.3);
    expect(hit.e.meal).toBeTruthy();
    damage(hit.e, 10, hit.room.time, hit.room.events, { heavy: true });
    expect(hit.e.meal).toBeFalsy();
    run(hit.room, GORGER.pull);
    expect(hit.e.grown ?? 0).toBe(0);
  });
});

describe('their place in a room', () => {
  const job = (place: (typeof PLACES)[number], seed: number, day: number, rooms = 5): Job => ({ ...board(day)[1], place, rooms, seed, objective: 'hunt', layout: 4 });
  const T = (id: string) => TEMPLATES.find((t) => t.id === id)!;
  const SORTS = [['keg', 'kegman', KEGMAN.debut], ['pounce', 'pouncer', POUNCER.debut], ['gorge', 'gorger', GORGER.debut]] as const;

  it('each is meaty: 4 points, one meaty in its pack, a fight to think about or a closer', () => {
    for (const [id, role] of SORTS) {
      expect(foeThreat({ role })).toBe(THREAT.meaty);
      expect(weighOf(T(id))).toEqual({ threat: THREAT.meaty, meaty: 1, heavy: 0 });
      expect(T(id).beats).toEqual(['tactic', 'closer']);
    }
    // The Gorger's crowd is the flimsy small ones, plenty of them.
    expect(T('gorge').bunch).toBe(true);
    expect(T('gorge').fodder[0]).toBeGreaterThanOrEqual(4);
  });

  it('bleed in after the Forker, two days apart: staged, then rare, then common', () => {
    const forkerCommon = FORKER.debut.from + FORKER.debut.common;
    expect(KEGMAN.debut.from + KEGMAN.debut.rare).toBe(forkerCommon);
    expect(POUNCER.debut.from - KEGMAN.debut.from).toBe(2);
    expect(GORGER.debut.from - POUNCER.debut.from).toBe(2);
    expect([68, 69, 71, 72].map((d) => stageOf(KEGMAN.debut, d))).toEqual(['staged', 'rare', 'rare', 'common']);
    expect([70, 71, 73, 74].map((d) => stageOf(POUNCER.debut, d))).toEqual(['staged', 'rare', 'rare', 'common']);
    expect([72, 73, 75, 76].map((d) => stageOf(GORGER.debut, d))).toEqual(['staged', 'rare', 'rare', 'common']);
    for (const [id, , d] of SORTS) {
      const at = (day: number) => job(PLACES[0], 77, day), rare = at(d.from + d.rare);
      expect(weightIn(T(id), at(d.from), rareRoom(at(d.from)))).toBe(0);
      expect(weightIn(T(id), rare, rareRoom(rare))).toBe(d.weight);
      expect(weightIn(T(id), job(PLACES[3], 77, d.from + d.rare), rareRoom(rare))).toBe(0);
      expect(weightIn(T(id), job(PLACES[3], 77, d.from + d.common), 2)).toBe(T(id).weight);
      MEATY2_ON.on = false;
      expect(weightIn(T(id), job(PLACES[3], 77, d.from + d.common), 2)).toBe(0);
      MEATY2_ON.on = true;
    }
  });

  it('staged in their way rooms in the Barrowfields (DRUMS and SMOKE once the Planker and Swingle there are common, QUIET), with company, not elsewhere, and the room\'s chest where it was', () => {
    const seen: Record<string, number> = {};
    const want = { drums: 'kegman', quiet: 'pouncer', smoke: 'gorger' } as Record<string, string>;
    for (const place of PLACES.slice(0, 5)) for (let s = 1; s <= 40; s++) {
      // Day 70: the Planker and the Swingle are common, so the Kegman and the Gorger have their scenes.
      const j = { ...job(place, s * 13 + 1, 70), id: 'd70-' + s };
      for (const took of ['h', 'l'] as const) {
        const r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2), road: RoadId = took === 'l' ? 'low' : 'high', way = r[f + 1]?.way;
        if (!way || !want[way]) continue;
        const plan = planRoom(j, f + 1, road, { [f + 1]: road }), u = plan.foes.filter((x) => x.variant === want[way]);
        // One new sort a scene: the one it shares the scene with is gone from it.
        expect(plan.foes.filter((x) => (x.variant === 'planker' || x.variant === 'swingle') && (x.pack ?? 0) >= 80)).toHaveLength(0);
        // And on day 1, while those two are still bleeding in, they keep their scenes and the Kegman and Gorger stay out.
        if (way !== 'quiet') expect(planRoom({ ...j, id: 'd1-' + s }, f + 1, road, { [f + 1]: road }).foes.filter((x) => x.variant === want[way])).toHaveLength(0);
        if (place.region !== 'Barrowfields') expect(u).toHaveLength(0);
        else if (u.length) {
          seen[way] = (seen[way] ?? 0) + 1;
          expect(u).toHaveLength(1);
          expect(plan.foes.filter((x) => x.pack === u[0].pack && x !== u[0]).length).toBeGreaterThanOrEqual(2);
          MEATY2_ON.on = false;
          const off = planRoom(j, f + 1, road, { [f + 1]: road });
          MEATY2_ON.on = true;
          expect(JSON.stringify(plan.chests), `${place.name} ${s} ${way}: the chest`).toBe(JSON.stringify(off.chests));
        }
      }
    }
    for (const w of Object.keys(want)) expect(seen[w] ?? 0, w).toBeGreaterThan(0);
  });

  it('in the packs: none while staged; once common, anywhere a fight or a closer fits', () => {
    const count = (day: number) => {
      let n = 0;
      for (const j of board(day)) for (let i = 0; i < j.rooms; i++) n += planRoom(j, i).foes.filter((f) => ['kegman', 'pouncer', 'gorger'].includes(f.variant ?? '') && (f.pack ?? 0) < 80).length;
      return n;
    };
    let staged = 0, common = 0;
    for (let k = 0; k < 6; k++) (staged += count(60 + k)), (common += count(GORGER.debut.from + GORGER.debut.common + k));
    expect(staged).toBe(0);
    expect(common).toBeGreaterThan(0);
  });
});

describe('determinism', () => {
  it('the same fight with all three plays the same twice', () => {
    const play = () => {
      const f = field([
        { kind: 'scrapper', variant: 'kegman', x: 12, y: 8 }, { kind: 'scrapper', variant: 'pouncer', x: 15, y: 7 }, { kind: 'scrapper', variant: 'gorger', x: 18, y: 8 },
        { kind: 'scrapper', x: 13, y: 9 }, { kind: 'scrapper', x: 17, y: 9 },
      ]);
      const log: string[] = [];
      for (let i = 0; i < 360; i++) {
        f.room.setIntent('me', { ...NO_INTENT, mx: Math.sin(i / 20), my: Math.cos(i / 31), attack: i % 9 < 2, attackSeq: Math.floor(i / 9), rollSeq: Math.floor(i / 70) });
        run(f.room, 1 / 30);
        for (const ev of f.room.events as FightEvent[]) if (ev.k === 'hit' || ev.k === 'windup' || ev.k === 'stunned' || ev.k === 'fuse' || ev.k === 'grown') log.push(`${i}:${ev.k}:${ev.x.toFixed(2)}`);
      }
      return log.join('|') + f.room.heroes[0].hp;
    };
    expect(play()).toBe(play());
  });
});
