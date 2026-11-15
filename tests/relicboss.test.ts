/** A great boss's first kill gives its relic (sim/relicboss.ts, docs/design/relics.md section 1). */
import { describe, expect, it, vi } from 'vitest';

// A kill in the middle of a room's step, as a blow would land (after the step notes who's alive).
const due: Enemy[] = [];
vi.mock('../src/sim/deepmarks', async (orig) => {
  const m = await orig<typeof import('../src/sim/deepmarks')>();
  return { ...m, syncMarks: (...a: Parameters<typeof m.syncMarks>) => (m.syncMarks(...a), void due.splice(0).forEach((e) => Object.assign(e, { hp: 0, act: 'dead' }))) };
});
import { hangmansWood } from '../src/shared/expedjob';
import { RELIC_HOMES, bossRelic } from '../src/shared/relichomes';
import { makeRelic } from '../src/shared/relicitems';
import { Rng } from '../src/shared/rng';
import { expedRoom } from '../src/sim/expedroom';
import { giveHome } from '../src/sim/relicboss';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';
import { newProfile } from '../src/shared/progress';
import { keepKitNoting } from '../src/client/relicnews';
import { barn } from './bossarena';

const kill = (e: Enemy) => void due.push(e);
const steps = (room: { step(): void; events: FightEvent[] }, n = 1) => {
  const ev: FightEvent[] = [];
  for (let i = 0; i < n; i++) room.step(), ev.push(...room.events);
  return ev;
};

describe('the homes', () => {
  it("one home a relic, never twice; Hempen the knuckle, the Doorkeepers the lodestone, the Open Cut's end the hook", () => {
    const kinds = RELIC_HOMES.map((h) => h.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(bossRelic('hempen')).toBe('knuckle');
    expect(bossRelic('doorkeepers')).toBe('lodestone');
    expect(bossRelic('opencut')).toBe('hook');
  });
});

describe('the Doorkeepers', () => {
  it('both down: every hero gets the lodestone, carried if nothing is, with its moment and where it came from', () => {
    const b = barn(['sword', 'longbow']);
    const [a, c] = b.heroes;
    a.found = [makeRelic(new Rng(1), 'javelin')];
    kill(b.latch);
    expect(steps(b.room).some((e) => e.k === 'relicfound')).toBe(false);
    kill(b.hasp);
    const ev = steps(b.room);
    expect(ev.filter((e) => e.k === 'relicfound')).toHaveLength(2);
    for (const h of [a, c]) expect(h.found.filter((r) => r.kind === 'lodestone')).toHaveLength(1);
    expect(c.found[0]).toMatchObject({ kind: 'lodestone', el: '', tier: 1, from: 'doorkeepers' });
    expect(c.relics[1]).toBe('lodestone');
    // Home with the hero: NEW in the save.
    const k = keepKitNoting(newProfile('RANGER'), c, true);
    expect(k.news.map((x) => x.item.kind)).toEqual(['lodestone']);
  });

  it('already holding one: nothing more, and a second kill gives nothing', () => {
    const b = barn(['sword']), h = b.heroes[0];
    h.found = [makeRelic(new Rng(2), 'lodestone')];
    kill(b.latch), kill(b.hasp);
    expect(steps(b.room).some((e) => e.k === 'relicfound')).toBe(false);
    expect(h.found).toHaveLength(1);
  });

  it('on a Deep floor they give none (their home is the great barn)', () => {
    const b = barn(['sword']);
    b.room.floor = 5;
    kill(b.latch), kill(b.hasp);
    steps(b.room);
    expect(b.heroes[0].found ?? []).toHaveLength(0);
  });
});

describe('Hempen', () => {
  it("Hangman's Wood's end: the butcher's knuckle", () => {
    const room = expedRoom(hangmansWood(3), 1);
    room.dread = null;
    const h = room.join('p0'), hm = room.enemies.find((e) => e.boss?.who === 'hempen')!;
    room.setIntent('p0', { ...NO_INTENT });
    // (Beside it: on a big map only the goblins near a hero are stepped.)
    Object.assign(h, { x: hm.x, y: hm.y + 2, safeT: 0 });
    kill(hm);
    expect(steps(room).filter((e) => e.k === 'relicfound')).toHaveLength(1);
    expect(h.found.map((r) => [r.kind, r.from])).toEqual([['knuckle', 'hempen']]);
  });
});

describe('giveHome, for the Instances chat', () => {
  it("gives the Open Cut's hook to each hero without one, never the squire, seeded", () => {
    const b = barn(['sword', 'longbow']), ev: FightEvent[] = [];
    const got = giveHome('opencut', b.heroes, new Rng(7), ev);
    expect(got).toHaveLength(2);
    expect(giveHome('opencut', b.heroes, new Rng(7), ev)).toHaveLength(0);
    const again = barn(['sword', 'longbow']);
    giveHome('opencut', again.heroes, new Rng(7), []);
    expect(again.heroes.map((h) => h.found[0].id)).toEqual(b.heroes.map((h) => h.found[0].id));
  });
});
