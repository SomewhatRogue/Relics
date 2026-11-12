/** Each class's own button taught in the wood (Kyle, 2026-11-05; sim/woodsign.ts, sim/woodheal.ts), and
 *  old Rogues brought over (shared/oldskills.ts). */
import { beforeEach, describe, expect, it } from 'vitest';
import { GATES, lessonsFor } from '../src/shared/wood';
import { SIGN_LINES, SIGN_STEP } from '../src/shared/woodsigns';
import { abilitiesOf } from '../src/shared/tuning';
import { knowsSkill } from '../src/shared/skillteach';
import { newProfile, type Profile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import { fromJson } from '../src/client/save';
import { kill } from '../src/sim/damage';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';
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
/** The clearing's lesson done, its goblins down: the class's own step comes out. */
function toSign(cls: HeroClass): Game {
  const g = new Game();
  g.create(cls, 'stray');
  wake(g);
  Object.assign(g.wood!, { stage: 2, entered: false });
  enter(g, 2);
  const w = g.wood!;
  for (const e of g.room.enemies) if (w.ids.includes(e.id) && e.act !== 'dead') kill(e, [], 'burst', 0, 1);
  w.count = lessonsFor(cls)[2].need;
  w.praised = 99;
  g.step(0.05, NO_INTENT);
  return g;
}
const mine = (g: Game) => g.room.enemies.filter((e) => g.wood!.ids.includes(e.id));
const gateShut = (g: Game) => g.room.map.blocks.some((b) => b.x === GATES[2].block.x && b.y === GATES[2].block.y);
const hew = (g: Game) => g.room.map.npcs!.find((n) => n.talk === 'hew')!;
const press = (g: Game, i: Partial<Intent> = {}) => g.step(0.05, { ...NO_INTENT, signSeq: (g.hero.seen.sign ?? 0) + 1, ...i });

describe('the button is hidden until the wood gives it', () => {
  it('before its step a press does nothing and the button is not taught; Warriors and Mages never get one', () => {
    for (const c of ['ROGUE', 'RANGER', 'HEALER'] as const) {
      store.clear();
      const g = new Game();
      g.create(c, 'stray');
      wake(g);
      enter(g, 0);
      expect(g.taught()).not.toContain('sign');
      const y = g.hero.y, before = g.hero.signReady ?? 0;
      g.hero.hp = 50;
      for (let i = 0; i < 4; i++) press(g);
      expect(g.hero.signReady ?? 0).toBe(before);
      expect(g.hero.hp).toBe(50);
      expect(Math.abs(g.hero.y - y)).toBeLessThan(0.5);
    }
    for (const c of ['WARRIOR', 'MAGE'] as const) {
      store.clear();
      const g = toSign(c);
      expect(g.wood!.sign).toBeUndefined();
      expect(g.taught()).not.toContain('sign');
    }
  });
});

describe("the Rogue's SHADOW STEP step", () => {
  it('two goblins with their backs to you across the clearing; step behind one and stab it; then the way opens', () => {
    const g = toSign('ROGUE'), w = g.wood!;
    expect(w.sign).toMatchObject({ id: 'shadow', taught: true });
    expect(w.hold).toMatchObject({ kind: 'card', move: 'shadow', need: 'continue', text: SIGN_LINES.teach.shadow });
    expect(g.taught()).toContain('sign');
    const two = mine(g);
    expect(two).toHaveLength(2);
    for (const e of two) {
      expect(e.feeding).toBe(true);
      // Backs to you: facing away from where you stand, and a few tiles off.
      expect(e.fx * (e.x - g.hero.x) + e.fy * (e.y - g.hero.y)).toBeGreaterThan(0);
      expect(Math.hypot(e.x - g.hero.x, e.y - g.hero.y)).toBeGreaterThan(3.5);
    }
    g.continueHold();
    g.step(0.05, NO_INTENT);
    expect(w.hold).toBeNull();
    // Face the first and step.
    const t = two[0], d = Math.hypot(t.x - g.hero.x, t.y - g.hero.y);
    Object.assign(g.hero, { fx: (t.x - g.hero.x) / d, fy: (t.y - g.hero.y) / d });
    press(g);
    for (let i = 0; i < 6; i++) g.step(0.05, NO_INTENT);
    expect(Math.hypot(g.hero.x - t.x, g.hero.y - t.y)).toBeLessThan(1.4);
    // In the wood the step is back in a moment, so a miss can be tried again.
    expect((g.hero.signReady ?? 0) - g.room.time).toBeLessThanOrEqual(SIGN_STEP.stepAgain);
    expect(w.count).toBe(0);
    // A stab in its back soon after counts (a real one, the daggers' tap).
    const hits: FightEvent[] = [];
    for (let i = 0; i < 8 && w.count < 1; i++) hits.push(...g.step(0.05, { ...NO_INTENT, attackSeq: g.hero.seen.attack + 1 })), hits.push(...g.step(0.25, NO_INTENT));
    expect(hits.some((e) => e.k === 'hit' && e.on === 'enemy' && e.backstab)).toBe(true);
    expect(w.count).toBe(1);
    expect(gateShut(g)).toBe(true);
    for (const e of mine(g)) kill(e, [], 'burst', 0, 1);
    g.step(0.05, NO_INTENT);
    expect(w.stage).toBe(3);
    expect(gateShut(g)).toBe(false);
    expect(g.taught()).toContain('sign');
  });

  it('a stab in the back without a step first does not count', () => {
    const g = toSign('ROGUE'), w = g.wood!, t = mine(g)[0];
    w.hold = null;
    frame(g, [{ k: 'hit', x: t.x, y: t.y, n: 30, heavy: false, on: 'enemy', backstab: true }]);
    expect(w.count).toBe(0);
  });
});

describe("the Ranger's MARK step", () => {
  it('the card lights MARK and its press marks as the world restarts; a marked goblin dying is the step', () => {
    const g = toSign('RANGER'), w = g.wood!;
    expect(w.hold).toMatchObject({ kind: 'card', move: 'mark', need: 'sign', text: SIGN_LINES.teach.mark });
    const two = mine(g);
    // Face one of them and press MARK on the card.
    const t = two[0];
    Object.assign(g.hero, { x: t.x - 4, y: t.y, fx: 1, fy: 0 });
    g.step(0.7, NO_INTENT);
    press(g);
    g.step(0.05, NO_INTENT);
    expect(w.hold).toBeNull();
    const marked = two.find((e) => e.markedBy === 'me');
    expect(marked).toBeTruthy();
    // The marked one dying is the step; the other, unmarked, counts for nothing.
    const other = two.find((e) => e !== marked)!, ev: FightEvent[] = [];
    kill(marked!, ev, 'burst', 0, 1);
    frame(g, ev);
    expect(w.count).toBe(1);
    expect(w.stage).toBe(2);
    kill(other, [], 'burst', 0, 1);
    g.step(0.05, NO_INTENT);
    expect(w.stage).toBe(3);
  });

  it('an unmarked goblin dying counts for nothing', () => {
    const g = toSign('RANGER'), w = g.wood!, ev: FightEvent[] = [];
    w.hold = null;
    kill(mine(g)[0], ev, 'burst', 0, 1);
    frame(g, ev);
    expect(w.count).toBe(0);
  });
});

describe("the Healer's MEND step", () => {
  it('an archer shoots Hew; he kneels hurt and calls out, and lives; once they are down, MEND him', () => {
    const g = toSign('HEALER'), w = g.wood!;
    // (The Bitter's card, at a first hit, is woodbitter.test.ts's.)
    w.bitter = 'done';
    expect(w.sign).toMatchObject({ id: 'heal', phase: 'aim', taught: false });
    expect(g.taught()).not.toContain('sign');
    // Out of the way of the shot, and the archer looses at Hew.
    Object.assign(g.hero, { x: 36, y: 18 });
    const seen: FightEvent[] = [];
    for (let i = 0; i < 60 && w.sign!.phase === 'aim'; i++) seen.push(...g.step(0.05, NO_INTENT));
    expect(w.sign!.phase).toBe('fight');
    expect(seen.some((e) => e.k === 'hewshot')).toBe(true);
    expect(hew(g)).toMatchObject({ kneel: true, arrow: true, hp: SIGN_STEP.hewHp, maxHp: SIGN_STEP.hewMax });
    expect(w.caption?.text).toBe(SIGN_LINES.hewHit);
    expect(mine(g)).toHaveLength(3);
    // The arrow can't kill him.
    expect(hew(g).hp).toBeGreaterThan(0);
    expect(g.taught()).not.toContain('sign');
    // Kill them: the card, MEND lit, the self-heal named on it.
    for (const e of mine(g)) kill(e, [], 'burst', 0, 1);
    g.step(0.05, NO_INTENT);
    expect(w.hold).toMatchObject({ kind: 'card', move: 'heal', need: 'sign' });
    expect(w.hold!.how).toContain('heals you');
    expect(g.taught()).toContain('sign');
    // A bit worse off than Hew yourself, it still goes to him (2026-11-06: only much worse off keeps it for
    // you, and he's at a fifth): he's up, the arrow out, the way open.
    const n = hew(g);
    Object.assign(g.hero, { x: n.x + 1.2, y: n.y, hp: 10, stamina: 100, winded: false });
    press(g);
    g.step(0.05, NO_INTENT);
    expect(g.hero.hp).toBe(10);
    expect(w.stage).toBe(3);
    expect(n.kneel).toBe(false);
    expect(n.arrow).toBe(false);
    expect(gateShut(g)).toBe(false);
    expect(w.caption?.text).toBe(SIGN_LINES.healed);
  });
});

describe('the wood end to end, each step played its own way', () => {
  it('every class reaches Wickhold', () => {
    for (const c of ['WARRIOR', 'HEALER', 'ROGUE', 'RANGER', 'MAGE'] as const) {
      store.clear();
      const g = new Game();
      g.create(c, 'stray');
      wake(g);
      const w = () => g.wood!;
      for (let i = 0; i < 4; i++) {
        enter(g, i);
        for (let k = 0; k < 6 && w().stage === i; k++) {
          for (const e of g.room.enemies) if (w().ids.includes(e.id) && e.act !== 'dead') kill(e, [], 'burst', 0, 1);
          w().count += lessonsFor(c)[i].need;
          w().praised = 99;
          g.step(0.05, NO_INTENT);
          if (w().hold) g.continueHold(), g.step(0.05, NO_INTENT);
          // The Healer's: wait for the shot, then MEND Hew at the card.
          if (w().sign?.id === 'heal' && w().sign!.phase === 'aim') for (let j = 0; j < 60 && w().sign!.phase === 'aim'; j++) g.step(0.05, NO_INTENT);
          if (w().sign?.id === 'heal' && w().sign!.phase === 'card') {
            const n = hew(g);
            Object.assign(g.hero, { x: n.x + 1, y: n.y, hp: g.hero.maxHp, stamina: 100 });
            press(g);
            g.step(0.05, NO_INTENT);
          }
        }
        expect(w().stage, c + ' lesson ' + i).toBe(i + 1);
      }
      enter(g, 4);
      for (let i = 0; i < 400 && w().cut >= 0; i++) g.step(0.05, NO_INTENT);
      kill(g.room.enemies.find((e) => e.name === 'THE STOKER')!, [], 'burst', 0, 1);
      g.step(0.05, NO_INTENT);
      g.continueHold();
      g.step(0.05, NO_INTENT);
      for (const e of g.room.enemies) if (w().ids.includes(e.id) && e.act !== 'dead') kill(e, [], 'burst', 0, 1);
      Object.assign(g.hero, { x: 54, y: 9 });
      for (let i = 0; i < 800 && w().guard?.phase !== 'lead'; i++) {
        if (w().hold) g.continueHold();
        g.step(0.05, NO_INTENT);
      }
      Object.assign(g.hero, { x: 39, y: 4 });
      g.step(0.05, NO_INTENT);
      expect(g.mode, c).toBe('town');
      expect(g.taught()).toContain('sign');
    }
  });
});

describe('old Rogues and Shadow Step', () => {
  const old = (o: Partial<Profile>): Profile => {
    const p = { ...newProfile('ROGUE', 'OLD'), ...o } as Profile;
    delete p.signs;
    return p;
  };
  const load = (p: Profile) => fromJson({ heroes: [p], current: 0, world: newWorld() })!.heroes[0];

  it('one who carried Shadow Step gets Smoke Bomb, taught and carried', () => {
    for (const p of [old({ learned: ['skill'], skill: 'shadow' as never, augments: { shadow: 'fire' } }), old({ learned: ['skill'] }), old({ learned: undefined })]) {
      const q = load(p);
      expect(q.skill).toBe('smoke');
      expect(knowsSkill(q, 'smoke')).toBe(true);
      expect(abilitiesOf('ROGUE', '', q.skill)[0]).toBe('smoke');
      expect(q.signs).toBe(true);
    }
    expect(load(old({ learned: ['skill'], skill: 'shadow' as never, augments: { shadow: 'fire' } })).augments.smoke).toBe('fire');
  });

  it('one never taught keeps nothing to carry; a new Rogue, or one brought over already, is left alone', () => {
    const fresh = load(old({ learned: [] }));
    expect(fresh.skill).toBeUndefined();
    expect(knowsSkill(fresh, 'smoke')).toBe(false);
    const made = { ...newProfile('ROGUE', 'NEW'), learned: ['skill'] as ('skill' | 'leave')[] };
    const q = load(made);
    expect(q.skill).toBeUndefined();
    expect(abilitiesOf('ROGUE', '', q.skill)[0]).toBe('vanish');
    // Loaded again, nothing changes.
    expect(load(load(old({ learned: ['skill'], skill: 'knives' }))).skill).toBe('knives');
  });
});
