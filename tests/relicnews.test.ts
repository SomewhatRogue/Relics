/**
 * Relics you can see (Kyle, 2026-11-05: "it's not clear when you get a relic right now, or how to
 * equip it, since it's not in your inventory pack"): an award marks the relic NEW and makes its moment
 * (with the tip the first time), found relics have their own row in the pack, CARRY or a drag from the
 * shelf swaps the carried one, and a guest who picks one up in the leader's room gets the moment too.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Rng } from '../src/shared/rng';
import { makeRelic } from '../src/shared/relicitems';
import { wonRelics } from '../src/shared/relicaward';
import { newProfile, TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { GEAR, applyGear } from '../src/sim/pack';
import type { Hero } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { gainRelics, isNewRelic, keepKitNoting, seeRelic } from '../src/client/relicnews';
import { relicRow } from '../src/client/relicshelf';
import { moveOf } from '../src/client/packmoves';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

/** A hero's relics as the room has them: `carried` the index carried (-1 none). */
function holding(kinds: Parameters<typeof makeRelic>[1][], carried: number): Pick<Hero, 'found' | 'relicItem' | 'relics'> {
  const rng = new Rng(5), found = kinds.map((k) => makeRelic(rng, k));
  return { found, relicItem: carried >= 0 ? found[carried].id : '', relics: ['bash', ...(carried >= 0 ? [found[carried].kind] : [])] as Hero['relics'] };
}

describe('the moment a relic is yours', () => {
  it('a job-end award is marked NEW and makes a moment with the fanfare, the tip only the first time', () => {
    const p = newProfile('WARRIOR');
    const run = { job: { zone: 'hangman' } };
    const got = wonRelics(run, 77, p.relics);
    p.relics.push(...got);
    p.relic ||= got[0].id;
    const news = gainRelics(p, got, true);
    expect(news).toHaveLength(1);
    expect(news[0]).toMatchObject({ carried: true, tip: true, sound: true });
    expect(news[0].item.kind).toBe('hook');
    expect(isNewRelic(p, got[0].id)).toBe(true);
    // The same relic again is not news; a second one is, without the tip.
    expect(gainRelics(p, got, true)).toHaveLength(0);
    const more = makeRelic(new Rng(9), 'bomb');
    p.relics.push(more);
    expect(gainRelics(p, [more], true)[0]).toMatchObject({ carried: false, tip: false });
    // Looked at in the pack: no longer NEW.
    expect(seeRelic(p, more.id)).toBe(true);
    expect(isNewRelic(p, more.id)).toBe(false);
    expect(seeRelic(p, more.id)).toBe(false);
  });

  it("a pickup in the hero's own room reaches the save as NEW, a moment queued on the game", () => {
    const g = new Game();
    g.create('RANGER', 'stray');
    g.skipWood();
    const h = g.hero, jav = g.profile.relics[0];
    expect(g.profile.relic).toBe(jav.id);
    const bomb = makeRelic(new Rng(3), 'bomb');
    h.found = [...h.found, bomb];
    (g as unknown as { keepGear: (h: Hero) => void }).keepGear(h);
    expect(g.profile.relics.map((r) => r.id)).toContain(bomb.id);
    expect(g.relicNews).toHaveLength(1);
    expect(g.relicNews[0]).toMatchObject({ carried: false, tip: true, sound: false });
    expect(g.profile.relicNew).toEqual([bomb.id]);
    g.seeRelic(bomb.id);
    expect(g.profile.relicNew).toEqual([]);
  });
});

describe('relics in the pack', () => {
  it('every relic owned has its square, with pips, NEW on the unseen; the empty slot pulses and says TAP', () => {
    const h = holding(['javelin', 'hook', 'bomb'], 0);
    const html = relicRow(h, null, [h.found[2].id]);
    expect(html).toContain('data-src="relic"');
    expect(html).toContain('data-src="found:1"');
    expect(html).toContain('data-src="found:2"');
    expect(html).not.toContain('data-src="found:0"');
    expect(html.match(/class="rpips"/g)).toHaveLength(3);
    expect(html.match(/class="rnew"/g)).toHaveLength(1);
    expect(html).not.toContain('pulse');
    const none = relicRow(holding(['hook'], -1), null, []);
    expect(none).toContain('rslot pulse');
    expect(none).toContain('TAP');
    expect(none).toContain('data-src="found:0"');
    expect(relicRow(holding([], -1), null, [])).toBe('');
  });

  it('CARRY from the shelf (a tap or a drag onto RELIC) swaps the carried relic; the carried one dragged to the shelf is put away', () => {
    const room = new ArenaRoom(1), h = room.join('me');
    Object.assign(h, holding(['javelin', 'hook'], 0));
    expect(moveOf(h, 'found:0', 'relic')).toBeNull();
    const m = moveOf(h, 'found:1', 'relic')!;
    expect(m).toEqual([GEAR.carry, 1]);
    applyGear(h, m[0], m[1], []);
    expect(h.relicItem).toBe(h.found[1].id);
    expect(h.relics[1]).toBe('hook');
    // The javelin is back on the shelf.
    expect(relicRow(h, null, [])).toContain('data-src="found:0"');
    expect(moveOf(h, 'relic', 'shelf')).toEqual([GEAR.carry, -1]);
    applyGear(h, GEAR.carry, -1, []);
    expect(h.relicItem).toBe('');
    expect(h.relics[1]).toBeUndefined();
  });
});

describe('online', () => {
  it("a guest who picks a relic up in the leader's room gets it NEW in their save, and the moment", () => {
    const room = new ArenaRoom(2);
    room.props = [];
    room.enemies = [];
    room.join('me');
    const guest = room.join('g2');
    Object.assign(guest, { x: 12, y: 12 });
    const enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(stateOf(room), true), true);
    const hook = makeRelic(new Rng(11), 'hook');
    room.pickups.push({ id: 900, x: 12, y: 12.1, life: 60, relic: hook });
    let got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room)))));
    for (let i = 0; i < Math.round(0.3 / TICK); i++) {
      room.step();
      got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room)))));
    }
    const seen = got.heroes.find((x) => x.id === 'g2') as unknown as Hero;
    expect(seen.found.map((r) => r.id)).toContain(hook.id);
    // The guest's own game: its save follows its hero as the leader has it (keepRemoteGear).
    const p = newProfile('MAGE');
    const k = keepKitNoting(p, seen, true);
    expect(k.changed).toBe(true);
    expect(k.news.map((n) => n.item.id)).toEqual([hook.id]);
    expect(k.news[0]).toMatchObject({ carried: true, tip: true });
    expect(isNewRelic(p, hook.id)).toBe(true);
  });
});
