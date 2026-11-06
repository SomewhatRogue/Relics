/**
 * Relics made sure (2026-11-05, Kyle: "increase the power of those items (e.g. always skewers and
 * shoves etc) but limited uses"): each relic's effect lands whatever the goblin weighs and whatever
 * the stun cap says, friends are spared, a use spends one of a few charges and the relic fades by
 * stages to dark, old saves come over with sensible charges, drops are rarer and the big jobs award
 * one, a guest sees it all through deltas, and the same fight twice is the same.
 */
import { describe, expect, it } from 'vitest';
import { BELL, BOMB, HOOK, JAVELIN, KNUCKLE, LODESTONE, SENTRY, TICK, FOUND_RELICS, type RelicId } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { RELIC_DROP, RELIC_USES, fitRelic, makeRelic, relicMax, relicStage, type RelicItem } from '../src/shared/relicitems';
import { ZONE_RELICS, awardRelic, jobRelic, jobSources, wonRelics, type Awarded } from '../src/shared/relicaward';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT, type Enemy, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { fromJson } from '../src/client/save';
import { newWorld } from '../src/shared/story';

const run = (room: ArenaRoom, s: number, each?: () => void): FightEvent[] => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) each?.(), room.step(), out.push(...room.events);
  return out;
};

/** A hero at (9, 10) facing up with a full relic of `kind`, a friend off to the side, and the goblins given (still, idle, tough). */
function setup(kind: RelicId, foes: [Enemy['kind'], number, number][], weapon?: string) {
  const room = new ArenaRoom(1);
  room.props = [];
  const h = room.join('me'), ally = room.join('ally');
  const it = makeRelic(new Rng(3), kind);
  Object.assign(h, { x: 9, y: 10, fx: 0, fy: -1, relics: ['bash', kind], relic: kind, found: [it], relicItem: it.id, ...(weapon ? { weapon } : {}) });
  h.augments[kind] = '';
  Object.assign(ally, { x: 16, y: 14 });
  room.enemies = foes.map(([k, x, y], i) => Object.assign(newEnemy(500 + i, k, x, y), { hp: 400, maxHp: 400, respawns: false, cooldown: 99, alert: false }));
  // Every goblin has just been stunned by this hero: the cap would refuse a plain stun now. A relic's lands anyway.
  for (const e of room.enemies) e.stunnedBy = { me: room.time };
  return { room, h, ally, it, foes: room.enemies };
}
const press = (room: ArenaRoom, n = 1, o: Partial<Intent> = {}) => room.setIntent('me', { ...NO_INTENT, relicSeq: n, ...o });
const untouched = (ally: Hero, ev: FightEvent[]) => {
  expect(ally.hp).toBe(ally.maxHp);
  expect(Math.hypot(ally.kvx, ally.kvy)).toBeLessThan(0.01);
  expect(ev.some((e) => e.k === 'hit' && e.on === 'hero')).toBe(false);
};
const down = (e: Enemy) => e.act === 'stunned' || e.act === 'pinned' || e.act === 'flinch';

describe('each relic is sure', () => {
  it('the javelin skewers a whole line, a butcher too, and pins every one of them at the wall, past a friend', () => {
    const { room, ally, foes } = setup('javelin', [['scrapper', 9, 8.2], ['butcher', 9, 6.6], ['scrapper', 9, 5]]);
    Object.assign(ally, { x: 9.1, y: 7.4 });
    press(room);
    const ev = run(room, JAVELIN.windup + JAVELIN.range / JAVELIN.speed + 0.2);
    const j = room.javelins[0];
    expect(j.state).not.toBe('fly');
    for (const e of foes) expect(e.act).toBe('pinned');
    expect(j.held).toEqual(foes.map((e) => e.id));
    // All three stacked along the shaft ahead of where they stood, the butcher among them.
    for (const e of foes) expect(e.y).toBeLessThan(5);
    expect(ev.some((e) => e.k === 'spared')).toBe(true);
    untouched(ally, ev);
  });

  it('the hook drags a butcher to anyone, even a Ranger, and it lands knocked down', () => {
    const { room, h, foes } = setup('hook', [['butcher', 9, 4]], 'longbow');
    press(room);
    run(room, HOOK.windup + 1.4);
    const b = foes[0];
    expect(Math.hypot(b.x - h.x, b.y - h.y)).toBeLessThan(1.6);
    expect(b.act).toBe('stunned');
  });

  it('the hook catches a goblin a little off its line, and pulls you to a pinned one', () => {
    const { room, h, foes } = setup('hook', [['scrapper', 9.5, 5]]);
    foes[0].act = 'pinned';
    foes[0].actDur = 9;
    press(room);
    run(room, HOOK.windup + 1.2);
    expect(Math.hypot(foes[0].x - 9.5, foes[0].y - 5)).toBeLessThan(0.01);
    expect(h.y).toBeLessThan(7);
  });

  it("the butcher's knuckle knocks a butcher down and throws it as hard as a scrapper", () => {
    const { room, ally, foes } = setup('knuckle', [['scrapper', 8.6, 7.5], ['butcher', 9.6, 7.2]]);
    Object.assign(ally, { x: 9.1, y: 8.6 });
    press(room);
    const ev = run(room, KNUCKLE.windup + 0.05);
    const [s, b] = foes;
    expect(s.act).toBe('stunned');
    expect(b.act).toBe('stunned');
    expect(b.kvy).toBeLessThan(0);
    expect(Math.abs(b.kvy)).toBeCloseTo(Math.abs(s.kvy), 0);
    expect(b.markUntil).toBeGreaterThan(room.time);
    untouched(ally, ev);
  });

  it('the gall bomb knocks down and throws everything in it, big ones too, sparing a friend', () => {
    const { room, ally, foes } = setup('bomb', [['scrapper', 9.6, 6], ['butcher', 8.2, 6]]);
    Object.assign(ally, { x: 9, y: 6.4 });
    press(room, 1, { ax: 0, ay: -4 });
    const ev = run(room, BOMB.windup + BOMB.flight + 0.1);
    for (const e of foes) expect(e.act).toBe('stunned'), expect(Math.hypot(e.kvx, e.kvy)).toBeGreaterThan(1);
    untouched(ally, ev);
  });

  it('the lodestone takes every goblin near it, a butcher too, draws them in and knocks them down', () => {
    const { room, foes } = setup('lodestone', [['scrapper', 6.6, 6], ['butcher', 11.6, 6]]);
    press(room, 1, { ax: 0, ay: -4 });
    run(room, LODESTONE.windup + LODESTONE.flight + LODESTONE.time + 0.05);
    for (const e of foes) expect(Math.hypot(e.x - 9, e.y - 6)).toBeLessThan(2.2), expect(down(e)).toBe(true);
  });

  it('the bone bell breaks a butcher\'s striped blow, and quickens a friend', () => {
    const { room, ally, foes } = setup('bell', [['butcher', 9, 8]]);
    const b = foes[0];
    Object.assign(b, { act: 'attack', actT: 0, attack: { t: 0, windup: 2, active: 0.2, recover: 0.4, dmg: 30, knock: 10, unblockable: true, dx: 0, dy: 1, ox: 9, oy: 8, range: 3, arc: 1 } });
    Object.assign(ally, { x: 10.5, y: 10 });
    press(room);
    const ev = run(room, BELL.windup + 0.1);
    expect(b.attack).toBeNull();
    expect(b.act).toBe('flinch');
    expect(ally.quickUntil).toBeGreaterThan(room.time);
    untouched(ally, ev);
  });

  it('the wind-up bow never misses a goblin running across it', () => {
    const { room, foes } = setup('sentry', [['scrapper', 6, 6]]);
    const s = foes[0];
    let fired = 0;
    const seen = new Set<number>();
    press(room);
    run(room, SENTRY.windup + 3, () => {
      s.x = 6 + ((room.time * 3) % 6);
      for (const b of room.bolts) if (b.seek && !seen.has(b.id)) seen.add(b.id), fired++;
    });
    const landed = Math.round((400 - s.hp) / SENTRY.dmg);
    expect(fired).toBeGreaterThan(3);
    expect(landed).toBeGreaterThanOrEqual(fired - 1);
    expect(s.hobbleUntil).toBeGreaterThan(room.time);
  });
});

describe('few uses, fading by stages', () => {
  it('every relic holds 3 to 6, more for an elemental or LOUD one', () => {
    for (const k of FOUND_RELICS) {
      expect(RELIC_USES[k]).toBeGreaterThanOrEqual(3);
      expect(relicMax({ kind: k, tier: 3 })).toBeLessThanOrEqual(6);
      expect(relicMax({ kind: k, tier: 2 })).toBe(relicMax({ kind: k, tier: 1 }) + 1);
    }
  });

  it('a use spends one; it fades a stage at a time; the last says so and then it is dark, kept, and refuses', () => {
    const { room, h, it } = setup('knuckle', [['scrapper', 2, 2]]);
    const stages: number[] = [relicStage(it)];
    let all: FightEvent[] = [];
    for (let n = 1; n <= relicMax(it); n++) {
      h.relicReady.knuckle = 0;
      press(room, n);
      all = all.concat(run(room, KNUCKLE.windup + KNUCKLE.recover + 0.05));
      expect(it.charge).toBe(relicMax(it) - n);
      stages.push(relicStage(it));
    }
    expect(stages).toEqual([0, 1, 2, 3, 4]);
    expect(all.filter((e) => e.k === 'faded').length).toBe(1);
    h.relicReady.knuckle = 0;
    press(room, 99);
    const ev = run(room, 0.5);
    expect(ev.some((e) => e.k === 'dark')).toBe(true);
    expect(ev.some((e) => e.k === 'knuckle')).toBe(false);
    expect(h.found).toContain(it);
  });

  it('old saves come over with the same share of charge in uses; full stays full, dark stays dark', () => {
    const old = (kind: RelicId, tier: 1 | 2 | 3, el: RelicItem['el'], charge: number) => ({ id: `o${kind}${charge}`, kind, tier, el, charge });
    const s = fromJson({ heroes: [{ name: 'OLD', cls: 'WARRIOR', weapon: 'sword', relics: [old('javelin', 1, '', 24), old('hook', 1, '', 12), old('bell', 1, '', 1), old('knuckle', 1, '', 0), old('bomb', 2, 'frost', 36), old('sentry', 3, 'storm', 24)], relic: 'ohook12' } as never], current: 0, world: newWorld() })!;
    const p = s.heroes[0];
    expect(p.relics.map((r) => [r.kind, r.charge, relicMax(r)])).toEqual([['javelin', 4, 4], ['hook', 2, 4], ['bell', 1, 4], ['knuckle', 0, 4], ['bomb', 5, 5], ['sentry', 3, 5]]);
    expect(p.relic).toBe('ohook12');
    // Saved and loaded again: unchanged (they're marked as counted in uses now).
    expect(fromJson(JSON.parse(JSON.stringify(s)))!.heroes[0].relics).toEqual(p.relics);
    expect(fitRelic(fitRelic(old('lodestone', 1, '', 24)))).toMatchObject({ charge: 3, v: 2 });
  });
});

describe('where relics come from', () => {
  it('a named butcher drops one rarer than before (12 in 100 then)', () => {
    expect(RELIC_DROP.named).toBeLessThan(0.12);
  });

  it("Hangman's Wood's climax gives the grappling hook, noted on the run; once you have it, one from the wood's pool", () => {
    const r: Awarded = {};
    const got = awardRelic(r, new Rng(5), { zone: 'hangman' });
    expect(got).toMatchObject({ kind: 'hook', tier: 1, el: '', charge: relicMax(got) });
    expect(r.relicsWon).toEqual([{ item: got, from: 'zone:hangman' }]);
    const next = awardRelic(r, new Rng(6), { zone: 'hangman' }, [got]);
    expect(ZONE_RELICS.hangman.pool).toContain(next.kind);
    expect(next.kind).not.toBe('hook');
    expect(r.relicsWon?.length).toBe(2);
  });

  it('a story job, the beacon and a deep dive each give one sure relic; a zone award on the run is not given twice', () => {
    expect(jobSources({ objective: 'story' })).toEqual(['story']);
    expect(jobSources({ exped: 'barrowfields', objective: 'hunt' })).toEqual(['beacon']);
    expect(jobSources({ deep: true })).toEqual(['deep']);
    expect(jobSources({ objective: 'rescue' })).toEqual([]);
    const story = { job: { objective: 'story' } };
    expect(jobRelic(story, 7, [])).toBeDefined();
    const zone: Awarded & { job: { zone: string } } = { job: { zone: 'hangman' } };
    awardRelic(zone, new Rng(1), { zone: 'hangman' });
    const home = wonRelics(zone, 9, []);
    expect(home.map((x) => x.kind)).toEqual(['hook']);
  });

  it('awards are seeded: the same seed, the same relic', () => {
    const a = awardRelic(null, new Rng(11), 'beacon', FOUND_RELICS.map((k) => makeRelic(new Rng(1), k)));
    const b = awardRelic(null, new Rng(11), 'beacon', FOUND_RELICS.map((k) => makeRelic(new Rng(1), k)));
    expect(a).toEqual(b);
  });
});

describe('online and determinism', () => {
  it('a guest sees the skewered line, the pins and the charge spent, sent as changed fields only', () => {
    const { room, h, it, foes } = setup('javelin', [['scrapper', 9, 8.2], ['butcher', 9, 6.6]]);
    const enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(stateOf(room), true), true);
    let got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room)))));
    press(room);
    for (let i = 0; i < Math.round((JAVELIN.windup + 1) / TICK); i++) {
      room.step();
      const p = enc.encode(stateOf(room)), mine = p.heroes?.u.find(([k]) => k === 'me')?.[1];
      if (mine) expect(Object.keys(mine)).not.toContain('maxHp');
      got = dec.apply(JSON.parse(JSON.stringify(p)));
    }
    const gh = got.heroes.find((x) => x.id === 'me') as unknown as Hero;
    expect(gh.found.find((r) => r.id === h.relicItem)!.charge).toBe(it.charge);
    expect(it.charge).toBe(relicMax(it) - 1);
    expect((got.javelins[0] as { held?: number[] }).held).toEqual(foes.map((e) => e.id));
    for (const e of foes) expect(got.enemies.find((x) => x.id === e.id)!.act).toBe('pinned');
  });

  it('the same throws twice are the same', () => {
    const go = () => {
      const { room, h, foes } = setup('javelin', [['scrapper', 9, 8.2], ['butcher', 9, 6.6], ['scrapper', 8, 5]]);
      const out: unknown[] = [];
      press(room, 1);
      for (let i = 0; i < 120; i++) {
        if (i === 60) (h.relicReady.javelin = 0), (h.fx = -1), (h.fy = 0), press(room, 2);
        room.step();
        out.push(foes.map((e) => [e.x, e.y, e.hp, e.act]), room.javelins.map((j) => [j.x, j.y, j.state, j.held]));
      }
      return JSON.stringify(out);
    };
    expect(go()).toBe(go());
  });
});
