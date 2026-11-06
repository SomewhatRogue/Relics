// The Night Watch (sim/watch.ts): hit zones, helmets and shields, the streak and score, the clock,
// goblins under the wall, night-only, nothing to the relay, and the same seed playing the same.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { advance, newWatch, stepWatch } from '../src/sim/watch';
import { newGob } from '../src/sim/watchnight';
import { flyArrows } from '../src/sim/watchshot';
import { feet, zones } from '../src/sim/watchzones';
import { streakMult } from '../src/sim/watchscore';
import type { Gob, WatchIntent, WatchState } from '../src/sim/watchtypes';
import { BOW, FIELDS, FOES, GOBS, SCORE, SHAPES, WATCH, WATCH_PAY, groundY } from '../src/shared/watchtune';
import { nightOf, settleWatch, watchOpen } from '../src/shared/watchpay';

const IDLE: WatchIntent = { ax: 100, ay: 100, held: false, looses: 0 };
/** A goblin of `kind` standing at x (near line), the only one on the field. */
function field(kind: Gob['kind'], x = 100): { s: WatchState; g: Gob } {
  const s = newWatch(1);
  s.nextSpawn = 1e9;
  const g = newGob(s, kind, x, 0);
  s.gobs.push(g);
  return { s, g };
}
/** An arrow flying flat and fast into the goblin from the wall's side, at height `dy` above its feet. */
function shoot(s: WatchState, g: Gob, dy: number, power = 0, dx = 12): void {
  const [fx, fy] = feet(g);
  s.arrows.push({ x: fx + dx, y: fy + dy, vx: -600, vy: 0, power });
  for (let i = 0; i < 300 && s.arrows.length; i++) flyArrows(s, 1 / 60);
}
const headY = (g: Gob) => SHAPES[g.kind].head.y;
const bodyY = (g: Gob) => (SHAPES[g.kind].body.y0 + SHAPES[g.kind].body.y1) / 2;
const legY = (g: Gob) => (SHAPES[g.kind].legs.y0 + SHAPES[g.kind].legs.y1) / 2;
const kinds = (s: WatchState) => s.events.map((e) => e.k);

describe('the night watch: hit zones', () => {
  it('a tap to the head kills a plain goblin, for double points', () => {
    const { s, g } = field('plain');
    shoot(s, g, headY(g));
    expect(g.state).toBe('dead');
    expect(g.how).toBe('head');
    expect(s.heads).toBe(1);
    expect(s.score).toBe(GOBS.plain.points * SCORE.head);
  });
  it('a tap to the body hurts (it takes two); a full draw kills outright', () => {
    const { s, g } = field('plain');
    shoot(s, g, bodyY(g));
    expect(g.state).toBe('walk');
    expect(g.hp).toBe(GOBS.plain.hp - 1);
    shoot(s, g, bodyY(g));
    expect(g.state).toBe('dead');
    expect(g.how).toBe('body');
    const b = field('plain');
    shoot(b.s, b.g, bodyY(b.g), 1);
    expect(b.g.state).toBe('dead');
  });
  it('the legs slow it', () => {
    const { s, g } = field('plain');
    shoot(s, g, legY(g));
    expect(g.limp).toBe(true);
    const x = g.x;
    stepWatch(s, IDLE, 1);
    expect(g.x - x).toBeCloseTo(GOBS.plain.speed * BOW.limp, 5);
  });
  it('a shot just over the head misses, and breaks the streak', () => {
    const { s, g } = field('plain');
    s.streak = 4;
    shoot(s, g, headY(g) - SHAPES.plain.head.r - 1.5);
    expect(g.hp).toBe(GOBS.plain.hp);
    expect(s.streak).toBe(0);
  });
  it('the zones are the drawn shapes, at the goblin\'s feet', () => {
    const { g } = field('shield');
    const [fx, fy] = feet(g), z = zones(g);
    expect(z.map((q) => q.part)).toEqual(['shield', 'head', 'body', 'legs']);
    expect(z[0].box).toEqual({ x0: fx + SHAPES.shield.shield!.x0, y0: fy + SHAPES.shield.shield!.y0, x1: fx + SHAPES.shield.shield!.x1, y1: fy + SHAPES.shield.shield!.y1 });
  });
});

describe('the night watch: helmets and shields', () => {
  it('the first head hit knocks the helmet off, spinning; then the head counts', () => {
    const { s, g } = field('helmet');
    shoot(s, g, headY(g));
    expect(g.helmet).toBe(false);
    expect(g.hp).toBe(GOBS.helmet.hp);
    expect(kinds(s)).toContain('helmet');
    expect(s.bits.some((b) => b.kind === 'helmet' && b.spin !== 0)).toBe(true);
    shoot(s, g, headY(g));
    expect(g.state).toBe('dead');
    expect(g.how).toBe('head');
  });
  it('a shield splinters and breaks on the last of its hits; then the body behind it counts', () => {
    const { s, g } = field('shield');
    for (let i = 1; i < FOES.shieldHits; i++) {
      shoot(s, g, bodyY(g), 1);
      expect(g.shieldHp).toBe(FOES.shieldHits - i);
      expect(g.stuck.filter((k) => k.on === 'shield').length).toBe(i);
    }
    expect(g.hp).toBe(GOBS.shield.hp);
    s.events = [];
    shoot(s, g, bodyY(g), 1);
    expect(g.shieldHp).toBe(0);
    expect(kinds(s)).toContain('shieldbreak');
    expect(g.stuck.length).toBe(0);
    shoot(s, g, bodyY(g), 1);
    expect(g.state).toBe('dead');
  });
  it('the head over the shield\'s rim can be hit while the shield stands', () => {
    const { s, g } = field('shield');
    shoot(s, g, headY(g) - 2);
    expect(g.state).toBe('dead');
    expect(g.shieldHp).toBe(FOES.shieldHits);
  });
  it('a torch hit drops it and burns its bearer, for the fire\'s bonus', () => {
    const { s, g } = field('torch');
    shoot(s, g, -22);
    expect(g.torch).toBe(false);
    expect(g.burning).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 120; i++) stepWatch(s, IDLE, 1 / 60);
    expect(g.state).toBe('dead');
    expect(g.how).toBe('fire');
  });
});

describe('the night watch: streak and score', () => {
  it('hits in a row raise the multiplier; a miss breaks it', () => {
    expect(streakMult(0)).toBe(1);
    expect(streakMult(SCORE.step)).toBe(1 + SCORE.add);
    expect(streakMult(1000)).toBe(SCORE.max);
    const { s, g } = field('shield');
    for (let i = 0; i < SCORE.step; i++) shoot(s, g, bodyY(g));
    expect(s.streak).toBe(SCORE.step);
    shoot(s, g, headY(g));
    expect(s.score).toBe(Math.round(GOBS.shield.points * SCORE.head * streakMult(SCORE.step + 1)));
    expect(s.bestStreak).toBe(SCORE.step + 1);
    s.arrows.push({ x: 150, y: 20, vx: -600, vy: -50, power: 1 });
    for (let i = 0; i < 200 && s.arrows.length; i++) flyArrows(s, 1 / 60);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(SCORE.step + 1);
  });
});

describe('the night watch: the clock and the wall', () => {
  it('a shift ends at three minutes', () => {
    const s = newWatch(3);
    for (let t = 0; t < 200 && !s.over; t += 0.1) advance(s, IDLE, 0.1);
    expect(s.over).toBe(true);
    expect(s.t).toBeGreaterThanOrEqual(WATCH.duration);
    expect(s.t).toBeLessThan(WATCH.duration + 0.05);
  });
  it('a goblin reaching the wall drops out of sight: the watch have it, its points and your streak gone', () => {
    const { s, g } = field('plain', WATCH.reachX - 0.05);
    s.streak = 5;
    stepWatch(s, IDLE, 1 / 60);
    expect(g.state).toBe('gone');
    expect(s.lost).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.score).toBe(0);
    expect(kinds(s)).toContain('wall');
    expect(zones(g)).toEqual([]);
  });
});

describe('the night watch: entry, pay, the relay, the seed', () => {
  it('stands only at night', () => {
    expect(watchOpen(0)).toBe(true);
    expect(watchOpen(0.95)).toBe(true);
    expect(watchOpen(0.5)).toBe(false);
    expect(watchOpen(0.3)).toBe(false);
  });
  it('pays by score, capped a night; keeps the best', () => {
    const n = nightOf(Date.UTC(2026, 10, 5, 3));
    const a = settleWatch(undefined, 40 * WATCH_PAY.per, n);
    expect(a.pay).toBe(WATCH_PAY.cap);
    expect(a.capped).toBe(true);
    expect(a.best).toBe(true);
    const b = settleWatch(a.record, 10 * WATCH_PAY.per, n);
    expect(b.pay).toBe(0);
    expect(b.best).toBe(false);
    expect(b.record.best).toBe(40 * WATCH_PAY.per);
    expect(settleWatch(b.record, 10 * WATCH_PAY.per, n + 1).pay).toBe(10);
  });
  it('sends nothing: no fetch, no socket, and no watch file reaches for the relay', () => {
    const g = globalThis as unknown as Record<string, unknown>, was = [g.fetch, g.WebSocket];
    let calls = 0;
    g.fetch = () => (calls++, Promise.reject(new Error('no')));
    g.WebSocket = class { constructor() { calls++; } };
    try {
      const s = newWatch(9);
      for (let i = 0; i < 1900 && !s.over; i++) advance(s, { ax: 60, ay: 120, held: i % 30 < 20, looses: Math.floor(i / 30) }, 0.1);
      expect(s.over).toBe(true);
    } finally {
      [g.fetch, g.WebSocket] = was;
    }
    expect(calls).toBe(0);
    for (const dir of ['src/sim', 'src/client', 'src/shared']) {
      for (const f of readdirSync(dir).filter((n) => /^watch/.test(n))) {
        expect(readFileSync(`${dir}/${f}`, 'utf8'), f).not.toMatch(/from '\.\/(relay|townfolk|coop|worldlink|netline|chatnet)'/);
      }
    }
  });
  it('the same seed and the same hands play the same shift', () => {
    const play = (seed: number) => {
      const s = newWatch(seed), log: string[] = [];
      for (let i = 0; i < 1800; i++) {
        advance(s, { ax: 40 + ((i * 7) % 140), ay: 110 + ((i * 3) % 50), held: i % 25 < 15, looses: Math.floor(i / 25) }, 0.1);
        for (const e of s.events) log.push(JSON.stringify(e));
      }
      return { log, score: s.score, kills: s.kills, shots: s.shots, gobs: s.nextId };
    };
    const a = play(42), b = play(42), c = play(43);
    expect(a.shots).toBeGreaterThan(50);
    expect(a).toEqual(b);
    expect(c.log).not.toEqual(a.log);
  });
});

describe('the night watch: the tall field (a phone held upright)', () => {
  it('goblins come in at its own edge, walk down its slope at its pace, and the watch have them at the same ditch', () => {
    const s = newWatch(5, 'tall');
    s.nextSpawn = 0;
    stepWatch(s, IDLE, 1 / 60);
    const g = s.gobs[0];
    expect(g.f).toBe('tall');
    expect(g.x).toBeCloseTo(FIELDS.tall.from + WATCH.spawnX, 0);
    expect(feet(g)[1]).toBe(Math.round(groundY(g.x, 'tall') - g.lane));
    const x = g.x;
    stepWatch(s, IDLE, 1);
    expect(g.x - x).toBeCloseTo(GOBS[g.kind].speed * FIELDS.tall.pace, 5);
    g.x = WATCH.reachX - 0.01;
    stepWatch(s, IDLE, 1 / 60);
    expect(g.state).toBe('gone');
  });
  it('a head shot on the slope lands where the head is drawn', () => {
    const s = newWatch(1, 'tall');
    s.nextSpawn = 1e9;
    const g = newGob(s, 'plain', 140, 0);
    s.gobs.push(g);
    shoot(s, g, headY(g));
    expect(g.how).toBe('head');
  });
  it('plays the same from the same seed', () => {
    const play = () => {
      const s = newWatch(11, 'tall');
      for (let i = 0; i < 1800; i++) advance(s, { ax: 120 + ((i * 5) % 60), ay: 100 + ((i * 3) % 70), held: i % 20 < 12, looses: Math.floor(i / 20) }, 0.1);
      return [s.score, s.kills, s.shots, s.hits, s.lost, s.nextId];
    };
    expect(play()).toEqual(play());
  });
});
