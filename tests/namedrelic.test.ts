/**
 * A hero's first named butcher gives a relic for sure, once a hero (sim/namedrelic.ts; Kyle approved
 * 2026-11-06): through awardRelic, into their relics with the found moment, seeded on the room's own
 * stream; the flag rides from the save onto the hero and back. Later kills keep the floor's chance.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { ArenaRoom } from '../src/sim/room';
import { firstNamedRelic, namedButcher } from '../src/sim/namedrelic';
import { keepKitNoting } from '../src/client/relicnews';
import { Game } from '../src/client/game';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;
beforeEach(() => store.clear());

const named = (id = 1) => Object.assign(newEnemy(id, 'butcher', 5, 5), { name: 'GRISTLE', respawns: false, lastBy: 'ava' }) as Enemy;

describe("a hero's first named butcher", () => {
  it('gives its killer a relic for sure, with the found moment; never again for them', () => {
    const h = newHero('ava', 4, 5), ev: FightEvent[] = [], rng = new Rng(9);
    expect(firstNamedRelic(named(), [h], rng, ev)).toBe(true);
    expect(h.found).toHaveLength(1);
    expect(h.namedRelic).toBe(true);
    expect(ev.some((e) => e.k === 'relicfound')).toBe(true);
    // Carried at once when nothing is.
    expect(h.relicItem).toBe(h.found[0].id);
    // The next named butcher: nothing sure (the floor's chance is pickups.ts's, as before).
    expect(firstNamedRelic(named(2), [h], rng, [])).toBe(false);
    expect(h.found).toHaveLength(1);
  });

  it('only for the one who killed it, and only a named butcher off its own kit (no boss, no zone climax, no straw)', () => {
    const a = newHero('ava', 4, 5), b = newHero('bo', 6, 5);
    firstNamedRelic(named(), [a, b], new Rng(3), []);
    expect([a.found.length, b.found.length]).toEqual([1, 0]);
    expect(namedButcher(Object.assign(named(), { boss: {} as never }))).toBe(false);
    expect(namedButcher(Object.assign(named(), { zoned: true }))).toBe(false);
    expect(namedButcher(Object.assign(named(), { respawns: true }))).toBe(false);
    expect(namedButcher(Object.assign(newEnemy(1, 'butcher', 5, 5), { respawns: false }))).toBe(false);
    // The squire never takes it.
    const sq = newHero('squire', 4, 5);
    expect(firstNamedRelic(Object.assign(named(), { lastBy: 'squire' }), [sq], new Rng(3), [])).toBe(false);
  });

  it('seeded: the same stream gives the same relic, a kind they lack first', () => {
    const one = newHero('ava', 4, 5), two = newHero('ava', 4, 5);
    firstNamedRelic(named(), [one], new Rng(21), []);
    firstNamedRelic(named(), [two], new Rng(21), []);
    expect(two.found[0]).toEqual(one.found[0]);
    const owns = newHero('ava', 4, 5);
    owns.found = [{ ...one.found[0] }];
    firstNamedRelic(named(), [owns], new Rng(21), []);
    expect(owns.found[1].kind).not.toBe(one.found[0].kind);
  });

  it('in the room: killed with a blow, the killer has it at once', () => {
    const room = new ArenaRoom(5, { scrappers: false, squire: false, props: false });
    room.enemies = [];
    const me = room.join('ava'), e = named();
    Object.assign(e, { x: me.x + 0.9, y: me.y, hp: 1, alert: false, lastBy: '' });
    room.enemies.push(e);
    Object.assign(me, { fx: 1, fy: 0 });
    room.setIntent('ava', { ...NO_INTENT, ax: 1, ay: 0, attackSeq: 1 });
    for (let i = 0; i < 40 && e.hp > 0; i++) room.step();
    expect(e.hp).toBeLessThanOrEqual(0);
    expect(me.namedRelic).toBe(true);
    expect(me.found.length).toBe(1);
  });

  it('the flag goes into the save (a friend following too, with their NEW RELIC moment) and back onto the hero next time', () => {
    const g = new Game();
    g.create('WARRIOR', 'AVA');
    const p = g.profile, h = newHero('me', 4, 5);
    Object.assign(h, { found: p.relics.map((r) => ({ ...r })), relicItem: p.relic, relics: [...g.hero.relics] });
    firstNamedRelic(Object.assign(named(), { lastBy: 'me' }), [h], new Rng(4), []);
    // As a friend's hero from the leader's patches (copied).
    const k = keepKitNoting(p, JSON.parse(JSON.stringify(h)), true);
    expect(k.changed).toBe(true);
    expect(p.namedRelic).toBe(true);
    expect(k.news).toHaveLength(1);
    expect(p.relics.some((r) => r.id === h.found[h.found.length - 1].id)).toBe(true);
    // Next job: the hero is dressed with it, so no second sure one.
    const again = newHero('me', 4, 5);
    (g as unknown as { equip(h: unknown): void }).equip(again);
    expect(again.namedRelic).toBe(true);
    expect(firstNamedRelic(Object.assign(named(), { lastBy: 'me' }), [again], new Rng(4), [])).toBe(false);
  });
});
