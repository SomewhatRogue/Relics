import { beforeEach, describe, expect, it } from 'vitest';
import { ELEMENT_FOES, GATES, ROAD_OUT, lessonsFor } from '../src/shared/wood';
import { weakOn } from '../src/shared/weakness';
import { damage, kill } from '../src/sim/damage';
import { castElement } from '../src/sim/channel';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';
import { Game } from '../src/client/game';
import type { HeroClass } from '../src/shared/weapons';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

type Frame = { stepWoodFrame(h: unknown, ev: FightEvent[], dt: number): void };
const frame = (g: Game, ev: FightEvent[]) => (g as unknown as Frame).stepWoodFrame(g.hero, ev, 0.05);

function wake(g: Game): void {
  Object.assign(g.wood!, { wake: -1, hold: null, from: null });
  Object.assign(g.hero, { act: 'idle', actT: 0, lying: false });
}
function enter(g: Game, i: number): void {
  const a = [[8, 33], [32, 36], [32, 18], [53, 20], [52, 10]][i];
  Object.assign(g.hero, { x: a[0], y: a[1] });
  g.step(0.05, NO_INTENT);
  if (g.wood!.hold) g.wood!.hold = null;
}
/** Kill everything the lesson brought (or the step), its count put at `n`. */
function clear(g: Game, n: number): void {
  const w = g.wood!;
  for (const e of g.room.enemies) if (w.ids.includes(e.id) && e.act !== 'dead') kill(e, [], 'burst', 0, 1);
  w.count += n;
  w.praised = 99;
  g.step(0.05, NO_INTENT);
  w.hold = null;
}
/** A Mage at the full charge, its goblins down and the count made: the element step comes out. */
function toElement(cls: HeroClass = 'MAGE'): Game {
  const g = new Game();
  g.create(cls, 'stray');
  wake(g);
  Object.assign(g.wood!, { stage: 2, entered: false });
  enter(g, 2);
  clear(g, lessonsFor(cls)[2].need);
  return g;
}
const three = (g: Game) => g.room.enemies.filter((e) => g.wood!.ids.includes(e.id));
const gateShut = (g: Game, i: number) => g.room.map.blocks.some((b) => b.x === GATES[i].block.x && b.y === GATES[i].block.y);
const weakAt = (e: Enemy, el: 'fire' | 'frost' | 'storm'): FightEvent => ({ k: 'weak', x: e.x, y: e.y, el });

describe("the Mage's element step in the wood", () => {
  it('a Mage gets it after the full charge, with the ELEMENT button; no other class does', () => {
    const g = toElement();
    const w = g.wood!;
    expect(w.stage).toBe(2);
    expect(w.element).toBeDefined();
    expect(w.hold).toBeNull();
    expect(three(g).map((e) => e.variant).sort()).toEqual(['aproned', 'kilnhot', 'soaked']);
    expect(gateShut(g, 2)).toBe(true);
    expect(g.taught()).toContain('element');
    for (const c of ['WARRIOR', 'HEALER', 'ROGUE', 'RANGER'] as const) {
      store.clear();
      const o = toElement(c);
      expect(o.wood!.element).toBeUndefined();
      expect(o.wood!.stage).toBe(3);
      expect(o.room.enemies.some((e) => e.variant === 'soaked' || e.variant === 'aproned' || e.variant === 'kilnhot')).toBe(false);
      expect(o.taught()).not.toContain('element');
    }
  });

  it("the card lights ELEMENT and waits for it; a press goes on and switches; before it, the press does nothing", () => {
    const g = new Game();
    g.create('MAGE', 'stray');
    wake(g);
    expect(g.taught()).not.toContain('element');
    g.step(0.05, { ...NO_INTENT, elementSeq: 1 });
    g.step(0.05, NO_INTENT);
    expect(castElement(g.hero)).toBe('fire');
    g.wood!.hold = null;
    // To the full charge and through it: the card.
    Object.assign(g.wood!, { stage: 2, entered: false });
    enter(g, 2);
    const w = g.wood!;
    for (const e of g.room.enemies) if (w.ids.includes(e.id)) kill(e, [], 'burst', 0, 1);
    w.count = 3;
    w.praised = 99;
    g.step(0.05, NO_INTENT);
    expect(w.hold).toMatchObject({ kind: 'card', move: 'element', need: 'element' });
    // An attack press doesn't dismiss it; ELEMENT does, and the element turns.
    const seq = (g.hero.seen.element ?? 0) + 1;
    g.step(0.7, { ...NO_INTENT, attackSeq: g.hero.seen.attack + 1 });
    expect(w.hold).not.toBeNull();
    g.step(0.05, { ...NO_INTENT, elementSeq: seq });
    expect(w.hold).toBeNull();
    expect(castElement(g.hero)).toBe('frost');
  });

  it('each goblin is weak to one element and shrugs off another; normal goblins are unchanged', () => {
    expect(weakOn({ kind: 'scrapper', variant: 'aproned' }, 'fire')).toBeGreaterThan(1);
    expect(weakOn({ kind: 'scrapper', variant: 'aproned' }, 'frost')).toBeLessThan(1);
    expect(weakOn({ kind: 'scrapper', variant: 'kilnhot' }, 'frost')).toBeGreaterThan(1);
    expect(weakOn({ kind: 'scrapper', variant: 'kilnhot' }, 'fire')).toBeLessThan(1);
    expect(weakOn({ kind: 'scrapper', variant: 'soaked' }, 'fire')).toBeLessThan(1);
    expect(weakOn({ kind: 'scrapper' }, 'fire')).toBe(1);
    expect(weakOn({ kind: 'scrapper', variant: 'looter' }, 'fire')).toBe(1.5);
    const g = toElement(), a = three(g);
    const by = (v: string) => a.find((e) => e.variant === v)!;
    const hit = (e: Enemy, el: 'fire' | 'frost' | 'storm') => {
      const ev: FightEvent[] = [], hp = e.hp;
      e.popAt = -9;
      damage(e, 10, g.room.time, ev, { el });
      return { lost: hp - e.hp, said: ev.find((x) => x.k === 'weak' || x.k === 'resist')?.k };
    };
    // The soaked one is wet: storm lands 1.5x and says WEAK (the wet rule); fire, RESIST.
    expect(hit(by('soaked'), 'storm')).toEqual({ lost: 15, said: 'weak' });
    expect(hit(by('soaked'), 'fire')).toEqual({ lost: 5, said: 'resist' });
    expect(hit(by('aproned'), 'fire')).toEqual({ lost: 16, said: 'weak' });
    expect(hit(by('aproned'), 'frost').said).toBe('resist');
    expect(hit(by('kilnhot'), 'frost')).toEqual({ lost: 16, said: 'weak' });
    expect(hit(by('kilnhot'), 'fire').said).toBe('resist');
    // A plain small goblin, dry: storm as it comes, nothing said.
    const plain = { ...by('aproned'), variant: undefined, hp: 50, popAt: -9 } as Enemy, ev: FightEvent[] = [];
    damage(plain, 10, g.room.time, ev, { el: 'storm' });
    expect(plain.hp).toBe(40);
    expect(ev.some((x) => x.k === 'weak' || x.k === 'resist')).toBe(false);
    expect(ELEMENT_FOES).toHaveLength(3);
  });

  it('done by weak hits: one on each in its own element, then the way opens once they are down', () => {
    const g = toElement(), w = g.wood!, [s, ap, k] = ['soaked', 'aproned', 'kilnhot'].map((v) => three(g).find((e) => e.variant === v)!);
    // The wrong element counts for nothing.
    frame(g, [weakAt(k, 'fire'), weakAt(ap, 'storm')]);
    expect(w.count).toBe(0);
    frame(g, [weakAt(ap, 'fire')]);
    frame(g, [weakAt(k, 'frost')]);
    expect(w.count).toBe(2);
    // The wand's storm stream held on the wet one counts too, and says WEAK.
    g.hero.stream = { id: s.id, at: g.room.time, until: g.room.time + 1, next: g.room.time + 9, tick: 1, owe: 0, oweJump: 0 };
    const ev: FightEvent[] = [];
    frame(g, ev);
    expect(w.count).toBe(3);
    expect(ev.some((x) => x.k === 'weak' && x.el === 'storm')).toBe(true);
    expect(g.room.map.blocks.some((b) => b.x === GATES[2].block.x)).toBe(true);
    clear(g, 0);
    expect(w.stage).toBe(3);
    expect(w.element).toBeUndefined();
    expect(gateShut(g, 2)).toBe(false);
    expect(g.taught()).toContain('element');
  });

  it('done by the fallback: all three dead, no weak hits, and they never come again', () => {
    const g = toElement(), w = g.wood!;
    clear(g, 0);
    expect(w.stage).toBe(3);
    expect(gateShut(g, 2)).toBe(false);
    expect(g.room.enemies.filter((e) => e.act !== 'dead' && (e.variant === 'soaked' || e.variant === 'aproned' || e.variant === 'kilnhot'))).toHaveLength(0);
  });

  it('the wood still goes end to end to Wickhold for every class', () => {
    for (const c of ['WARRIOR', 'HEALER', 'ROGUE', 'RANGER', 'MAGE'] as const) {
      store.clear();
      const g = new Game();
      g.create(c, 'stray');
      wake(g);
      const w = () => g.wood!;
      for (let i = 0; i < 4; i++) {
        enter(g, i);
        for (let k = 0; k < 4 && w().stage === i; k++) clear(g, lessonsFor(c)[i].need);
        expect(w().stage, c + ' lesson ' + i).toBe(i + 1);
      }
      enter(g, 4);
      for (let i = 0; i < 400 && w().cut >= 0; i++) g.step(0.05, NO_INTENT);
      kill(g.room.enemies.find((e) => e.name === 'THE STOKER')!, [], 'burst', 0, 1);
      g.step(0.05, NO_INTENT);
      expect(w().relic).toBe(true);
      g.continueHold();
      g.step(0.05, NO_INTENT);
      for (const e of g.room.enemies) if (w().ids.includes(e.id) && e.act !== 'dead') kill(e, [], 'burst', 0, 1);
      Object.assign(g.hero, { x: 54, y: 9 });
      for (let i = 0; i < 800 && w().guard?.phase !== 'lead'; i++) {
        if (w().hold) g.continueHold();
        g.step(0.05, NO_INTENT);
      }
      Object.assign(g.hero, { x: ROAD_OUT.x + 1, y: ROAD_OUT.y + 2 });
      g.step(0.05, NO_INTENT);
      expect(g.mode, c).toBe('town');
    }
  });
});
