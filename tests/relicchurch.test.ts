/** Relics as things you own: recharging and its price, the church's light, two for one, drops, old saves, and charge kept through the room. */
import { beforeEach, describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { FOUND_RELICS } from '../src/shared/tuning';
import { RELIC_DROP, makeRelic, relicMax, type RelicItem } from '../src/shared/relicitems';
import { LIT, RECHARGE, deepRelic, forge, forgeOdds, leaveRelic, litFor, recharge, rechargeCost, type RelicHolder } from '../src/shared/church';
import { dropRelic, type Pickup } from '../src/sim/pickups';
import { newEnemy } from '../src/sim/enemies';
import { litMult } from '../src/sim/charge';
import { lure } from '../src/sim/lantern';
import { newHero } from '../src/sim/hero';
import { keepKit } from '../src/client/keepkit';
import { fromJson } from '../src/client/save';
import { Game } from '../src/client/game';
import { board, deepDive } from '../src/shared/jobs';
import { newWorld } from '../src/shared/story';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;
beforeEach(() => store.clear());

let made = 1;
const relic = (kind: RelicItem['kind'], charge: number, el: RelicItem['el'] = '', tier?: RelicItem['tier']): RelicItem => ({ ...makeRelic(new Rng(made++), kind, el, tier), charge });
const holder = (relics: RelicItem[], gold = 500): RelicHolder => ({ id: 'hero1', gold, relics, relic: relics[0]?.id ?? '' });

describe('recharging at the church', () => {
  it('costs gold for each use missing; a full one costs nothing and is refused', () => {
    const r = relic('javelin', 1), p = holder([r]);
    expect(rechargeCost(r)).toBe((relicMax(r) - 1) * RECHARGE.perCharge);
    expect(recharge(p, r.id)).toBe(true);
    expect(r.charge).toBe(relicMax(r));
    expect(p.gold).toBe(500 - 3 * 18);
    expect(recharge(p, r.id)).toBe(false);
  });

  it('a dark plain relic is 72 gold; too poor, nothing happens', () => {
    const r = relic('hook', 0), p = holder([r], 71);
    expect(rechargeCost(r)).toBe(72);
    expect(recharge(p, r.id)).toBe(false);
    expect(r.charge).toBe(0);
  });

  it('an elemental relic is never recharged', () => {
    const r = relic('bomb', 2, 'frost'), p = holder([r]);
    expect(recharge(p, r.id)).toBe(false);
    expect(r.charge).toBe(2);
    expect(p.gold).toBe(500);
  });
});

describe("leaving a relic for the church's light", () => {
  it('full is three jobs, half is one, nearly dark is none; elemental ones are worth more', () => {
    expect(litFor(relic('javelin', 4))).toBe(3);
    expect(litFor(relic('javelin', 2))).toBe(1);
    expect(litFor(relic('javelin', 1))).toBe(0);
    expect(litFor(relic('javelin', 0))).toBe(0);
    expect(litFor(relic('bell', 5, 'storm'))).toBe(4);
    expect(litFor(relic('bell', 6, 'fire', 3))).toBe(5);
  });

  it('the relic goes, the light adds up to at most six jobs, and the carried slot empties', () => {
    const a = relic('javelin', 4), b = relic('hook', 6, 'fire', 3), p = holder([a, b]);
    expect(leaveRelic(p, a.id)).toBe(3);
    expect(p.relics).toEqual([b]);
    expect(p.relic).toBe('');
    expect(leaveRelic(p, b.id)).toBe(LIT.max - 3);
    expect(p.lit).toBe(LIT.max);
  });

  it('a lit hero hits harder and the goblins judge them nearer', () => {
    const h = newHero('me', 0, 0);
    expect(litMult(h)).toBe(1);
    const before = lure(h);
    h.lit = true;
    expect(litMult(h)).toBe(LIT.dmg);
    expect(lure(h)).toBe(before + LIT.lure);
  });

  it('a job spends a job of light, and the result says how much is left', () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    g.profile.lit = 2;
    g.startJob(board(1, false)[0]);
    expect(g.hero.lit).toBe(true);
    (g as unknown as { finish(how: string): void }).finish('won');
    expect(g.profile.lit).toBe(1);
    expect(g.result?.lit).toBe(1);
  });
});

describe('two for one', () => {
  it('both go, one comes back, kept with the hero; the same two on a reload give the same one', () => {
    const a = relic('javelin', 4), b = relic('hook', 0);
    const p1 = holder([a, b]), p2 = JSON.parse(JSON.stringify(p1)) as RelicHolder;
    const got = forge(p1, a.id, b.id)!;
    expect(p1.relics).toEqual([got]);
    expect(got.charge).toBe(relicMax(got));
    expect(p1.relic).toBe(got.id);
    expect(p1.forges).toBe(1);
    // A reload before the save: the same hero, the same count, the same two: the same relic.
    expect(forge(p2, a.id, b.id)).toEqual(got);
  });

  it('the next forge is a new roll, and two of the same relic is refused', () => {
    const p = holder([relic('javelin', 4), relic('hook', 4), relic('bell', 4), relic('bomb', 4)]);
    const first = forge(p, p.relics[0].id, p.relics[1].id)!;
    const second = forge(p, p.relics[0].id, p.relics[1].id)!;
    expect(p.forges).toBe(2);
    expect(second.id).not.toBe(first.id);
    expect(forge(p, p.relics[0].id, p.relics[0].id)).toBeNull();
  });

  it('two bright ones or an elemental raise the odds of an elemental back, and the rolls follow the odds', () => {
    const dull = forgeOdds(relic('javelin', 0), relic('hook', 0)), bright = forgeOdds(relic('javelin', 4), relic('hook', 4)), el = forgeOdds(relic('bell', 5, 'fire'), relic('hook', 4));
    expect(dull.elemental).toBeCloseTo(0.1);
    expect(bright.elemental).toBeGreaterThan(dull.elemental);
    expect(el.elemental).toBeGreaterThan(bright.elemental);
    const rate = (mk: () => [RelicItem, RelicItem]) => {
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const [a, b] = mk(), p: RelicHolder = { id: 'h' + i, gold: 0, relics: [a, b], relic: '' };
        if (forge(p, a.id, b.id)!.el) n++;
      }
      return n / 400;
    };
    const lo = rate(() => [relic('javelin', 0), relic('hook', 0)]), hi = rate(() => [relic('bell', 5, 'fire'), relic('bomb', 5, 'storm')]);
    expect(lo).toBeLessThan(0.2);
    expect(hi).toBeGreaterThan(0.6);
  });
});

describe('drops', () => {
  it(`a named butcher leaves a relic about ${RELIC_DROP.named * 100} times in 100, by the room's own dice; nobody else does`, () => {
    const rng = new Rng(42);
    let n = 0, el = 0;
    for (let i = 0; i < 4000; i++) {
      const e = Object.assign(newEnemy(i, 'butcher', 5, 5), { name: 'GRISTLE', respawns: false }), out: Pickup[] = [];
      dropRelic(e, out, rng);
      if (out[0]?.relic) (n++, out[0].relic.el && el++);
    }
    expect(n / 4000).toBeGreaterThan(RELIC_DROP.named - 0.012);
    expect(n / 4000).toBeLessThan(RELIC_DROP.named + 0.012);
    expect(el / n).toBeLessThan(0.3);
    const plain: Pickup[] = [];
    for (let i = 0; i < 200; i++) dropRelic(Object.assign(newEnemy(i, 'butcher', 5, 5), { respawns: false }), plain, rng), dropRelic(newEnemy(i, 'scrapper', 5, 5), plain, rng);
    expect(plain.length).toBe(0);
  });

  it('a won deep dive gives a kind you lack, plain and full; with all of them, any one', () => {
    expect(deepRelic([], FOUND_RELICS, 5)).toMatchObject({ kind: 'javelin', tier: 1, el: '', charge: 4 });
    const all = FOUND_RELICS.map((k) => relic(k, 1));
    expect(FOUND_RELICS).toContain(deepRelic(all, FOUND_RELICS, 5).kind);
    const g = new Game();
    g.create('ROGUE', 'q');
    g.startJob(deepDive(1));
    (g as unknown as { finish(how: string): void }).finish('won');
    expect(g.profile.relics.map((r) => r.kind)).toEqual(['javelin']);
  });
});

describe('old saves and the room', () => {
  it('a hero saved before relics had charge keeps each one, full and plain, still carrying the same', () => {
    const s = fromJson({ heroes: [{ name: 'OLD', cls: 'WARRIOR', weapon: 'sword', relics: ['javelin', 'hook'], relic: 'hook' } as never], current: 0, world: newWorld() })!;
    const p = s.heroes[0];
    expect(p.relics.map((r) => [r.kind, r.tier, r.el, r.charge])).toEqual([['javelin', 1, '', 4], ['hook', 1, '', 4]]);
    expect(p.relics.find((r) => r.id === p.relic)?.kind).toBe('hook');
    // Saved again and loaded: the same.
    expect(fromJson(JSON.parse(JSON.stringify(s)))!.heroes[0].relics).toEqual(p.relics);
  });

  it("charge spent in the room comes home to the save (a friend's copy too)", () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    const p = g.profile, h = g.hero, it = h.found.find((r) => r.id === h.relicItem)!;
    expect(it).not.toBe(p.relics[0]);
    it.charge -= 3;
    expect(keepKit(p, h, true)).toBe(true);
    expect(p.relics[0].charge).toBe(relicMax(it) - 3);
    expect(p.relics[0]).not.toBe(it);
    expect(keepKit(p, h, true)).toBe(false);
  });
});
