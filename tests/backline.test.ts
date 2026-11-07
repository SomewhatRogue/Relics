/** The back of the pack: the hexer's circle, the drummer's drum, and how they turn up in jobs and parties. */
import { describe, expect, it } from 'vitest';
import { board, type Job } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { DRUMMER, GUARD, HERO, HEXER, ROSTER, SCRAPPER, TICK, VARIANTS } from '../src/shared/tuning';
import { mostIn } from '../src/shared/roster';
import { rouse } from '../src/sim/backline';
import { kill } from '../src/sim/damage';
import { begin, newEnemy } from '../src/sim/enemies';
import { scaleFoes } from '../src/sim/party';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';

/** The yard emptied, one hero at (9, 12), and these goblins awake. */
function yard(...foes: [Enemy['variant'] | undefined, number, number][]) {
  const room = new ArenaRoom(3, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { x: 9, y: 12, fx: 0, fy: -1 });
  room.enemies.length = 0;
  for (const [v, x, y] of foes) {
    const e = newEnemy(room.enemies.length + 1, 'scrapper', x, y);
    if (v) (e.variant = v), (e.hp = e.maxHp = VARIANTS[v].hp);
    Object.assign(e, { respawns: false, alert: true });
    room.enemies.push(e);
  }
  return { room, h };
}
const run = (room: ArenaRoom, s: number, until?: () => boolean) => {
  const ev: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK) && !until?.(); i++) room.step(), ev.push(...room.events);
  return ev;
};

describe('the hexer', () => {
  it('puts a striped circle down where you stand, and it bursts there when the wind-up is done', () => {
    const { room, h } = yard(['hexer', 9, 6.5]);
    const x = room.enemies[0];
    run(room, 4, () => x.attack?.kind === 'hex');
    const a = x.attack!;
    expect(a).toBeTruthy();
    // The circle you see is the one judged: on you, its size from HEXER, and no guard stops it.
    expect([a.cx, a.cy]).toEqual([h.x, h.y]);
    expect(a.radius).toBe(HEXER.hex.radius);
    expect(a.unblockable).toBe(true);
    // Standing in it, even holding a block, it lands (a Warrior's block takes most of a striped blow: 2026-11-06).
    room.setIntent('me', { ...NO_INTENT, block: true, blockSeq: 1 });
    const ev = run(room, a.windup + 0.2);
    expect(h.hp).toBe(HERO.hp - Math.round(HEXER.hex.dmg * GUARD.striped.through.WARRIOR!));
    expect(ev).toContainEqual(expect.objectContaining({ k: 'impact', kind: 'hex', x: a.cx, y: a.cy }));
  });

  it('stepping out of the circle before it bursts, nothing', () => {
    const { room, h } = yard(['hexer', 9, 6.5]);
    const x = room.enemies[0];
    run(room, 4, () => x.attack?.kind === 'hex');
    const a = x.attack!;
    // Just outside the edge, after it went down: it stays where it was put.
    h.x = a.cx + a.radius + HERO.radius + 0.05;
    run(room, a.windup + 0.2);
    expect(h.hp).toBe(HERO.hp);
  });

  it('a blow on the hexer breaks the spell, and it is fragile', () => {
    const { room, h } = yard(['hexer', 9, 6.5]);
    const x = room.enemies[0];
    run(room, 4, () => x.attack?.kind === 'hex');
    expect(x.attack?.kind).toBe('hex');
    // Caught mid-spell: you're on it with a sword.
    Object.assign(x, { x: 9, y: 11 });
    room.setIntent('me', { ...NO_INTENT, attackSeq: 1 });
    run(room, 0.5);
    expect(x.attack).toBeNull();
    expect(h.hp).toBe(HERO.hp);
    expect(HEXER.hp).toBeLessThan(SCRAPPER.hp);
  });

  it('runs from you when you come close', () => {
    const { room } = yard(['hexer', 9, 10]);
    const x = room.enemies[0];
    x.cooldown = 9;
    run(room, 1);
    expect(Math.hypot(x.x - 9, x.y - 12)).toBeGreaterThan(2.5);
  });

  it('goblins caught in its circle are hurt too', () => {
    const { room, h } = yard(['hexer', 9, 6.5], [undefined, 3, 3]);
    const [x, o] = room.enemies;
    run(room, 4, () => x.attack?.kind === 'hex');
    Object.assign(o, { x: h.x + 0.3, y: h.y - 0.3, cooldown: 99 });
    o.alert = true;
    const hp = o.hp;
    run(room, x.attack!.windup + 0.1);
    expect(o.hp).toBeLessThan(hp);
  });
});

describe('the drummer', () => {
  /** A drummer drumming at (5, 5), a goblin inside its reach and one outside it. */
  function band() {
    const d = newEnemy(1, 'scrapper', 5, 5), near = newEnemy(2, 'scrapper', 5 + DRUMMER.radius - 0.2, 5), far = newEnemy(3, 'scrapper', 5 + DRUMMER.radius + 0.3, 5);
    Object.assign(d, { variant: 'drummer', drumming: true, act: 'chase' });
    return { d, near, far, all: [d, near, far] };
  }

  it('rouses only the goblins within its reach, and not itself', () => {
    const { d, near, far, all } = band();
    rouse(all, 0);
    expect([d.roused, near.roused, far.roused]).toEqual([false, true, false]);
  });

  it('a roused goblin winds up faster and hits harder; the telegraph is locked to it', () => {
    const { near, all } = band();
    rouse(all, 0);
    const room = new ArenaRoom(3, { scrappers: false });
    const h = room.join('me');
    begin(near, 'stab', SCRAPPER.stab, h, []);
    expect(near.attack!.windup).toBeCloseTo(SCRAPPER.stab.windup * DRUMMER.rouse.windup);
    expect(near.attack!.dmg).toBe(Math.round(SCRAPPER.stab.dmg * DRUMMER.rouse.dmg));
  });

  it('stops when it dies, or is stunned', () => {
    const { d, near, all } = band();
    rouse(all, 0);
    expect(near.roused).toBe(true);
    kill(d, []);
    rouse(all, TICK);
    expect(near.roused).toBe(false);
    const b = band();
    b.d.act = 'stunned';
    rouse(b.all, 0);
    expect(b.near.roused).toBeFalsy();
  });

  it('in a fight it drums from behind its pack, and stops drumming while it runs from you', () => {
    const { room, h } = yard(['drummer', 9, 4], [undefined, 8, 7], [undefined, 10, 7]);
    const [d, a] = room.enemies;
    run(room, 0.3);
    expect(d.drumming).toBe(true);
    expect(a.roused).toBe(true);
    // Walk up on it: it runs and the drum stops.
    Object.assign(h, { x: d.x, y: d.y + 2 });
    run(room, 0.2);
    expect(d.drumming).toBe(false);
    expect(a.roused).toBe(false);
  });
});

describe('in jobs', () => {
  const jobs = Array.from({ length: 200 }, (_, s) => board(s + 1)).flat();
  const rooms = jobs.flatMap((j) => Array.from({ length: j.rooms }, (_, i) => ({ j, i, foes: planRoom(j, i).foes })));
  const back = (f: Foe) => f.variant === 'hexer' || f.variant === 'drummer';

  it('turn up deeper in, one to a pack (shared/encounters.ts), never more than a room may hold', () => {
    const share = (i: number) => {
      const at = rooms.filter((r) => r.i === i);
      return at.filter((r) => r.foes.some(back)).length / at.length;
    };
    // Since packs (2026-11-04): a hexer or a drummer backs a pack from the second room on.
    expect(share(0)).toBe(0);
    expect(share(2)).toBeGreaterThan(0.05);
    for (const r of rooms) expect(r.foes.filter(back).length).toBeLessThanOrEqual(mostIn(r.i));
    for (const r of rooms) for (const p of new Set(r.foes.filter(back).map((f) => f.pack))) expect(r.foes.filter((f) => back(f) && f.pack === p)).toHaveLength(1);
    expect(rooms.some((r) => r.foes.some((f) => f.variant === 'hexer'))).toBe(true);
    expect(rooms.some((r) => r.foes.some((f) => f.variant === 'drummer'))).toBe(true);
  });

  it('a room never opens with only the back of the pack: there are always goblins with blades', () => {
    for (const r of rooms) {
      if (!r.foes.some(back)) continue;
      const blades = r.foes.filter((f) => f.kind === 'butcher' || (f.kind === 'scrapper' && !f.bow && !back(f))).length;
      expect(blades).toBeGreaterThanOrEqual(ROSTER.blades);
      if (r.foes.some((f) => f.variant === 'drummer')) expect(blades).toBeGreaterThanOrEqual(ROSTER.drumFor - 1);
    }
  });

  it('the same job rolls the same goblins', () => {
    const j: Job = jobs[7];
    expect(planRoom(j, 1).foes).toEqual(planRoom(j, 1).foes);
  });
});

describe('a bigger party', () => {
  const room: Foe[] = [
    { kind: 'scrapper', x: 3, y: 3 }, { kind: 'scrapper', x: 5, y: 3 }, { kind: 'scrapper', x: 7, y: 3 },
    { kind: 'scrapper', x: 9, y: 3, variant: 'hexer' }, { kind: 'scrapper', x: 11, y: 3 }, { kind: 'butcher', x: 6, y: 6, name: 'GRISTLE' },
  ];
  const extras = (party: number, seed: number) => scaleFoes(room.map((f) => ({ ...f })), party, seed).slice(room.length);
  const tough = (fs: Foe[]) => fs.filter((f) => f.variant).length / Math.max(1, fs.length);

  it('alone, the room as it is; a pair, more of the same but no more hexers', () => {
    expect(scaleFoes(room, 1, 5)).toEqual(room);
    for (let s = 1; s < 50; s++) expect(extras(2, s).filter((f) => f.variant)).toEqual([]);
  });

  it('three or more: the extras are more often the tougher kinds, a little more with each player', () => {
    const avg = (party: number) => Array.from({ length: 300 }, (_, s) => tough(extras(party, s + 1))).reduce((a, b) => a + b, 0) / 300;
    const two = avg(2), three = avg(3), four = avg(4);
    expect(three).toBeGreaterThan(two);
    expect(four).toBeGreaterThan(three);
    expect(four).toBeLessThan(0.5);
    // Never more than one more of the back of the pack than the room had.
    for (let s = 1; s < 200; s++) expect(scaleFoes(room, 4, s).filter(back).length).toBeLessThanOrEqual(1 + ROSTER.partyMore);
  });

  it('the same seed, the same goblins', () => {
    expect(scaleFoes(room, 4, 9)).toEqual(scaleFoes(room, 4, 9));
  });
});
const back = (f: Foe) => f.variant === 'hexer' || f.variant === 'drummer';
