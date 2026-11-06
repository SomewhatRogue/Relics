// The Doorkeepers (docs/plans/bosses.md rollout item 2; numbers shared/bosstune.ts): each of their moves
// lands, is blocked (or a block doesn't save you from a striped one) and is dodged or walked out of; the
// door; the pair's interplay; one clock a hero; fairness on a phone; the posting; clear times by kit.
import { describe, expect, it } from 'vitest';
import { BARN } from '../src/shared/barnarena';
import { barnHunt, barnPosted } from '../src/shared/bossjobs';
import { BOSS, DOORKEEPERS, HERO, TICK, WEAPONS, type DoorMove } from '../src/shared/tuning';
import { hitEnemy } from '../src/sim/combat';
import { doorShut } from '../src/sim/doorwall';
import { rotation } from '../src/sim/bosskit';
import { shoot } from '../src/sim/bolts';
import { newRun, runRoom } from '../src/sim/run';
import { barn, blow, place, run, still, wake } from './bossarena';
import { doorkeepersClear, fightBoss } from './bossbot';

const hurt = (b: ReturnType<typeof barn>) => b.heroes[0].hp < b.heroes[0].maxHp;
const evs = (list: { k: string }[], k: string) => list.filter((e) => e.k === k).length;

describe('each Doorkeeper move: lands, blocked, dodged or walked out of', () => {
  /** Hasp (the mover) does `move` at the one hero at (hx, hy) from (ex, ey); Latch stands aside. */
  function one(move: DoorMove, kit: 'sword' | 'daggers', hx: number, hy: number, ex: number, ey: number, say: Parameters<typeof run>[2] = () => ({})) {
    const b = barn([kit], [[hx, hy]]);
    wake(b);
    still(b.latch);
    place(b.latch, 1.2, 1.6);
    place(b.hasp, ex, ey, hx - ex, hy - ey);
    blow(b.hasp, move, b.heroes[0]);
    const ev = run(b, 2.2, say);
    return { b, ev };
  }
  const land = (move: DoorMove) => one(move, 'sword', 6, move === 'charge' ? 9 : 7, 6, move === 'spin' ? 6 : 5);
  const block = (move: DoorMove) => one(move, 'sword', 6, move === 'charge' ? 9 : 7, 6, move === 'spin' ? 6 : 5, () => ({ block: true, ax: 0, ay: -1 }));
  // A dodger leaves it to the last moment: the dash goes off the tick the floor's nearly full.
  const windup = (m: DoorMove) => DOORKEEPERS[m].windup + BOSS.tell;
  const dodge = (move: DoorMove) => one(move, 'daggers', 6, move === 'charge' ? 9 : 7, 6, move === 'spin' ? 6 : 5, (_h, t) => (t >= windup(move) - 0.08 ? { mx: 1, my: 0, rollSeq: 1 } : {}));
  const walkOut = (move: DoorMove) => one(move, 'sword', 6, move === 'charge' ? 9 : 7, 6, move === 'spin' ? 6 : 5, (h) => (move === 'spin' ? { mx: 0, my: 1 } : { mx: 1, my: 0 }));

  it('Door Sweep (red): lands; a held block takes it (BRACED); a dodge goes through it', () => {
    expect(hurt(land('sweep').b)).toBe(true);
    const bl = block('sweep');
    expect(hurt(bl.b)).toBe(false);
    expect(evs(bl.ev, 'block')).toBeGreaterThan(0);
    const dg = dodge('sweep');
    expect(hurt(dg.b)).toBe(false);
    expect(evs(dg.ev, 'dodge')).toBeGreaterThan(0);
  });

  for (const move of ['charge', 'spin'] as DoorMove[]) {
    it(`${move} (striped): lands; a block doesn't save you; you walk out, or a dodger dodges`, () => {
      expect(hurt(land(move).b)).toBe(true);
      expect(hurt(block(move).b)).toBe(true);
      expect(hurt(walkOut(move).b)).toBe(false);
      expect(hurt(dodge(move).b)).toBe(false);
    });
  }

  it('Locked Doors (both): within 2.5 of each other they shove together, 3 wide; a block fails, walking out works; both stand open after', () => {
    const go = (say: Parameters<typeof run>[2] = () => ({})) => {
      const b = barn(['sword'], [[6, 7.6]]);
      wake(b);
      place(b.latch, 5, 5);
      place(b.hasp, 7, 5);
      const ev = run(b, 2.6, say);
      return { b, ev };
    };
    const hit = go();
    expect(hit.ev.some((e) => e.k === 'windup' && (e as { kind?: string }).kind === 'charge')).toBe(true);
    expect(hit.b.heroes[0].hp).toBeLessThan(hit.b.heroes[0].maxHp);
    const bl = go(() => ({ block: true, ax: 0, ay: -1 }));
    expect(bl.b.heroes[0].hp).toBeLessThan(bl.b.heroes[0].maxHp);
    const out = go(() => ({ mx: 1, my: 0.15 }));
    expect(out.b.heroes[0].hp).toBe(out.b.heroes[0].maxHp);
    // After the shove, both have their doors aside for the punish.
    expect(doorShut(out.b.latch, out.b.room.time) || doorShut(out.b.hasp, out.b.room.time)).toBe(false);
  });
});

describe('the door', () => {
  it('Door Wall: its front takes nothing; its back takes a blow in full', () => {
    const b = barn(['sword'], [[6, 6.4]]);
    wake(b);
    place(b.latch, 6, 5, 0, 1);
    const h = b.heroes[0], s = WEAPONS.sword.combo[0], ev: { k: string }[] = [];
    Object.assign(h, { fx: 0, fy: -1, hitIds: [] });
    expect(hitEnemy(h, s, b.latch, b.room.time, ev as never)).toBe(0);
    expect(b.latch.hp).toBe(b.latch.maxHp);
    expect(evs(ev, 'deflect')).toBe(1);
    Object.assign(h, { x: 6, y: 3.6, fx: 0, fy: 1, hitIds: [] });
    expect(hitEnemy(h, s, b.latch, b.room.time, ev as never)).toBeGreaterThan(0);
    expect(b.latch.hp).toBeLessThan(b.latch.maxHp);
  });

  it('shots into a shut door cut its straps: three and the door is DOWN 4 s, and then its front takes them', () => {
    const b = barn(['longbow'], [[6, 9]]);
    wake(b);
    still(b.hasp);
    place(b.hasp, 10.5, 12.5);
    const h = b.heroes[0], hold = () => place(b.latch, 6, 5, 0, 1);
    hold();
    const ev: { k: string }[] = [];
    for (let k = 0; k < 4; k++) {
      Object.assign(h, { x: 6, y: 9, fx: 0, fy: -1 });
      b.room.bolts.push(shoot(h, WEAPONS.longbow.heavy!, ''));
      ev.push(...run(b, 0.5, () => (hold(), {})));
      if (k < 2) expect(b.latch.hp).toBe(b.latch.maxHp);
    }
    expect(evs(ev, 'doordown')).toBe(1);
    expect(b.latch.hp).toBeLessThan(b.latch.maxHp);
    expect(b.latch.boss!.downUntil - b.room.time).toBeLessThanOrEqual(DOORKEEPERS.down);
  });

  it("a charge into a hay stack: stuck, stunned 2.5 s (the punish), front open; a stack burns down in 6 s", () => {
    const b = barn(['sword'], [[2.3, 9.8]]);
    wake(b);
    still(b.latch);
    place(b.latch, 11, 1.6);
    place(b.hasp, 2.3, 4.2, 0, 1);
    blow(b.hasp, 'charge', b.heroes[0]);
    let stuckAt = -1;
    run(b, 2.5, () => (b.hasp.act === 'stunned' && stuckAt < 0 && (stuckAt = b.room.time), {}));
    expect(stuckAt).toBeGreaterThan(0);
    expect(hurt(b)).toBe(false);
    expect(b.hasp.actDur).toBeCloseTo(DOORKEEPERS.stuck, 5);
    expect(doorShut(b.hasp, b.room.time)).toBe(false);
    const stack = b.room.map.blocks.find((x) => x.kind === 'haystack')!;
    stack.burning = b.room.time;
    run(b, 5.8);
    expect(stack.ruined).toBeFalsy();
    run(b, 0.4);
    expect(stack.ruined).toBe(true);
  });
});

describe('the pair together', () => {
  it('they swap jobs every 20 s (once neither is mid-blow)', () => {
    const b = barn(['sword'], [[6, 11]]);
    wake(b);
    const was = b.hasp.boss!.job;
    const ev = run(b, 24, (h) => ((h.hp = h.maxHp), {}));
    expect(evs(ev, 'doorswap')).toBeGreaterThan(0);
    expect(b.hasp.boss!.job).not.toBe(was);
  });

  it('prised more than 7 apart for 4 s, the mover walks back to its partner with its back open', () => {
    const b = barn(['sword'], [[10.5, 2.2]]);
    wake(b);
    still(b.latch);
    place(b.latch, 1.2, 1.6);
    place(b.hasp, 10.5, 12.4, 0, -1);
    let back = -1;
    run(b, 9, (h) => ((h.hp = h.maxHp), b.hasp.boss!.backUntil > b.room.time && back < 0 && (back = b.room.time), {}));
    expect(back).toBeGreaterThan(DOORKEEPERS.apartFor);
  });

  it('one down: phase 2, the survivor roars 2 s (nothing lands either way), then carries both doors and spins, dizzy after', () => {
    const b = barn(['sword'], [[6, 7]]);
    wake(b);
    Object.assign(b.latch, { hp: 0, act: 'dead' });
    const ev = run(b, 0.1);
    expect(evs(ev, 'roar')).toBe(1);
    expect(b.hasp.boss!.phase).toBe(2);
    // In the roar: a blow from behind takes nothing, and it strikes nothing.
    const h = b.heroes[0];
    place(b.hasp, 6, 5, 0, 1);
    Object.assign(h, { x: 6, y: 3.6, fx: 0, fy: 1, hitIds: [] });
    expect(hitEnemy(h, WEAPONS.sword.combo[0], b.hasp, b.room.time, [])).toBe(0);
    run(b, 1.8, (x) => ((x.hp = x.maxHp), {}));
    expect(b.hasp.attack).toBe(null);
    expect(b.hasp.boss!.job).toBe('move');
    // Its rotation now has the spin, and a spin leaves it dizzy (its recover, its door aside).
    expect(DOORKEEPERS.rotation[2]).toContain('spin');
    run(b, 0.4);
    Object.assign(h, { x: 6, y: 6.6 });
    blow(b.hasp, 'spin', h);
    run(b, DOORKEEPERS.spin.windup + BOSS.tell + DOORKEEPERS.spin.active + 0.1);
    expect(b.hasp.attack?.boss).toBe('spin');
    expect(doorShut(b.hasp, b.room.time)).toBe(false);
  });

  it('a party of two: the wall swings at the second hero just after the mover begins on the first', () => {
    const b = barn(['sword', 'sword'], [[7.6, 6.2], [4.4, 6]]);
    wake(b);
    place(b.hasp, 7.6, 4.6, 0, 1);
    place(b.latch, 4.4, 4.6, 0, 1);
    // Far enough apart not to lock, and the mover's next is a sweep.
    b.room.bosses!.lockCool = 1e9;
    b.hasp.cooldown = b.latch.cooldown = 0;
    const rot = b.hasp.boss!, list = rotation(1, 2, b.room.bosses!.swaps[0]);
    rot.rot = list.indexOf('sweep');
    rot.rotAt = b.room.time;
    const seen: { who: string; at: number; aimed: string }[] = [];
    run(b, 2, (h) => {
      h.hp = h.maxHp;
      for (const e of [b.hasp, b.latch]) if (e.attack && !seen.some((x) => x.who === e.name)) seen.push({ who: e.name!, at: b.room.time, aimed: e.attack.aimed! });
      return {};
    });
    const m = seen.find((x) => x.who === 'HASP'), w = seen.find((x) => x.who === 'LATCH');
    expect(m).toBeDefined();
    expect(w).toBeDefined();
    expect(w!.aimed).not.toBe(m!.aimed);
    expect(w!.at - m!.at).toBeCloseTo(DOORKEEPERS.split, 1);
  });
});

describe('one clock a hero', () => {
  it('while a boss winds up at a hero, no other boss blow is aimed at them and the hungry near them hold theirs', () => {
    const b = barn(['sword'], [[6, 7]]);
    wake(b);
    still(b.latch);
    place(b.hasp, 6, 5, 0, 1);
    const add = b.room.addFoe('scrapper', 6.9, 7.2);
    Object.assign(add, { alert: true, cooldown: 0 });
    blow(b.hasp, 'sweep', b.heroes[0]);
    const lands = b.room.time + DOORKEEPERS.sweep.windup + BOSS.tell;
    let first = -1;
    run(b, 3, (h) => ((h.hp = h.maxHp), add.attack && first < 0 && (first = b.room.time), {}));
    expect(first).toBeGreaterThan(lands - 1e-6);
    expect(b.room.bosses).not.toBe(null);
  });
});

describe('fair on a phone', () => {
  const slowest = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));
  it('every blow telegraphed: red at least 0.9 s, striped at least 1.1 s, a hero at the middle walks out in 60%', () => {
    for (const m of ['sweep', 'charge', 'lock', 'spin'] as DoorMove[]) {
      const s = DOORKEEPERS[m];
      if (!s.unblockable) expect(s.windup).toBeGreaterThanOrEqual(0.9);
      else {
        expect(s.windup).toBeGreaterThanOrEqual(1.1);
        const out = (m === 'spin' ? s.radius! : s.radius!) + HERO.radius;
        expect(out / slowest).toBeLessThanOrEqual(s.windup * 0.6);
      }
    }
  });

  it('the pose comes first, the floor after; its aim follows its hero until 70% of the wind-up, then holds', () => {
    const b = barn(['sword'], [[6, 7.2]]);
    wake(b);
    still(b.latch);
    place(b.hasp, 6, 5, 0, 1);
    blow(b.hasp, 'sweep', b.heroes[0]);
    const a = b.hasp.attack!;
    expect(a.tell).toBe(BOSS.tell);
    expect(a.windup).toBeCloseTo(DOORKEEPERS.sweep.windup + BOSS.tell, 6);
    const dirs: [number, number, number][] = [];
    run(b, a.windup - TICK, () => (dirs.push([b.hasp.attack!.t, b.hasp.attack!.dx, b.hasp.attack!.dy]), { mx: 1, my: 0 }));
    const lock = dirs.filter(([t]) => t >= a.windup * BOSS.aimLock + TICK);
    expect(lock.length).toBeGreaterThan(2);
    for (const [, dx, dy] of lock) expect(Math.hypot(dx - lock[0][1], dy - lock[0][2])).toBeLessThan(1e-9);
    const early = dirs.filter(([t]) => t < a.windup * BOSS.aimLock);
    expect(Math.hypot(early[0][1] - lock[0][1], early[0][2] - lock[0][2])).toBeGreaterThan(0.05);
  });

  it('the barn fits an upright phone across (12 tiles), and the charge stays inside it', () => {
    expect(BARN.w).toBeLessThanOrEqual(12.2);
    expect(DOORKEEPERS.charge.range!).toBeLessThan(BARN.h);
    expect(DOORKEEPERS.charge.range! / DOORKEEPERS.charge.active).toBeLessThanOrEqual(12);
  });
});

describe('posted as a hunt', () => {
  it('on the board from late in chapter 1; the fields, then the barn', () => {
    expect(barnPosted({ rescued: 2, storyDone: [] })).toBe(false);
    expect(barnPosted({ rescued: 3, storyDone: [] })).toBe(true);
    expect(barnPosted({ rescued: 0, storyDone: ['barrowby-bell'] })).toBe(true);
    const job = barnHunt(4);
    expect(job).toMatchObject({ objective: 'hunt', boss: 'THE DOORKEEPERS', arena: 'doorkeepers', rooms: 2 });
    expect(runRoom({ ...newRun(job), index: 0 }).map.name).not.toBe('THE GREAT BARN');
    const r = runRoom({ ...newRun(job), index: 1 });
    expect(r.map.name).toBe('THE GREAT BARN');
    expect(r.enemies.filter((e) => e.boss).map((e) => e.name)).toEqual(['LATCH', 'HASP']);
    expect(r.chests).toHaveLength(1);
  });
});

describe('clear times: a single-target kit and an area kit can both win', () => {
  const kits = ['daggers', 'staff', 'sword'] as const;
  for (const k of kits) {
    it(`${k} alone beats the Doorkeepers`, () => {
      const r = doorkeepersClear(3, [k]);
      console.log(`doorkeepers, ${k}: ${r.secs} s, won ${r.won}, health lost ${r.taken}, staggers ${r.staggers}, blocks ${r.blocks}, dodges ${r.dodges}`);
      expect(r.won).toBe(true);
    }, 60000);
  }

  it('the same fight twice is the same fight', () => {
    const one = () => {
      const room = runRoom({ ...newRun(barnHunt(6, true)), party: 2 });
      const r = fightBoss(room, ['daggers', 'sword'], 60);
      return JSON.stringify({ r, e: room.enemies.map((e) => [e.x.toFixed(4), e.y.toFixed(4), e.hp, e.boss]) });
    };
    expect(one()).toBe(one());
  }, 60000);
});
