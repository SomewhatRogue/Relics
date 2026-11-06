/** The wood's dodge lesson, the goal after a count, the Ranger's parry, and Hew kept out of the trees
 *  (Kyle, 2026-11-05; sim/woodsteps.ts, sim/hewwalk.ts). */
import { beforeEach, describe, expect, it } from 'vitest';
import { GATES, LESSONS, LINES, PARRY_FOE, lessonsFor, HEW_START } from '../src/shared/wood';
import { HEW_AT } from '../src/shared/woodsigns';
import { kill } from '../src/sim/damage';
import { woodGoal } from '../src/sim/wood';
import { PARRY_BEAT } from '../src/sim/woodsteps';
import { HEW_R } from '../src/sim/hewwalk';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { Game } from '../src/client/game';
import type { HeroClass } from '../src/shared/weapons';
import type { GameMap, Npc } from '../src/shared/arena';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

type Frame = { stepWoodFrame(h: unknown, ev: FightEvent[], dt: number): FightEvent[] };
const frame = (g: Game, ev: FightEvent[] = []) => (g as unknown as Frame).stepWoodFrame(g.hero, ev, 0.05);
const CLASSES: HeroClass[] = ['WARRIOR', 'HEALER', 'ROGUE', 'RANGER', 'MAGE'];

function wake(g: Game): void {
  Object.assign(g.wood!, { wake: -1, hold: null, from: null });
  Object.assign(g.hero, { act: 'idle', actT: 0, lying: false });
}
/** On the path, its card dismissed, its goblins out. */
function onPath(cls: HeroClass): Game {
  const g = new Game();
  g.create(cls, 'stray');
  wake(g);
  Object.assign(g.wood!, { stage: 1, entered: false });
  Object.assign(g.hero, { x: 32, y: 36 });
  g.step(0.05, NO_INTENT);
  g.wood!.hold = null;
  return g;
}
const mine = (g: Game) => g.room.enemies.filter((e) => g.wood!.ids.includes(e.id));
const dodge = (g: Game) => frame(g, [{ k: 'dodge', x: 0, y: 0 }]);

describe('the dodge lesson', () => {
  it('two dodges complete it for every class: it flashes done, then the goal is the goblins, counted', () => {
    expect(LESSONS[1].need).toBe(2);
    for (const cls of CLASSES) {
      store.clear();
      const g = onPath(cls), w = g.wood!;
      expect(lessonsFor(cls)[1].count).toBe('dodge');
      expect(lessonsFor(cls)[1].need).toBe(2);
      expect(woodGoal(w, true).text).toMatch(/DODGES 0 \/ 2/);
      expect(dodge(g).some((e) => e.k === 'passed')).toBe(false);
      expect(w.passed ?? 0).toBe(0);
      w.hold = null;
      const ev = dodge(g);
      // The complete event, and the count the tracker's gold flash watches.
      expect(ev.some((e) => e.k === 'passed')).toBe(true);
      expect(w.passed).toBe(1);
      expect(w.stage).toBe(1);
      if (cls === 'RANGER') continue;
      const n = mine(g).length;
      expect(n).toBeGreaterThan(0);
      expect(w.after?.phase).toBe('kill');
      expect(woodGoal(w, true)).toEqual({ title: 'KILL THE GOBLINS', text: `KILLED 0 / ${n}` });
      // More dodges count for nothing now; kills go up the goal.
      dodge(g);
      expect(w.passed).toBe(1);
      kill(mine(g)[0], [], 'burst', 0, 1);
      frame(g);
      expect(woodGoal(w, false).text).toBe(`KILLED 1 / ${n}`);
      // All down: the way on opens.
      for (const e of mine(g)) kill(e, [], 'burst', 0, 1);
      frame(g);
      expect(w.stage).toBe(2);
      expect(w.after).toBeUndefined();
      expect(g.room.map.blocks.some((b) => b.x === GATES[1].block.x && b.y === GATES[1].block.y)).toBe(false);
    }
  });
});

describe("the Ranger's parry", () => {
  it('after the two dodges PARRY is given with a card, one parry completes it, then the goblins', () => {
    const g = onPath('RANGER'), w = g.wood!;
    expect(g.taught()).not.toContain('block');
    dodge(g), dodge(g);
    expect(w.after?.phase).toBe('parry');
    // A beat for the gold flash first.
    expect(w.hold).toBeNull();
    expect(g.taught()).not.toContain('block');
    g.room.time += PARRY_BEAT + 0.05;
    frame(g);
    expect(w.hold).toMatchObject({ kind: 'card', who: 'HEW', move: 'parry', text: LINES.teach.parry, how: LINES.how.parryOnly });
    expect(g.taught()).toContain('block');
    const foe = mine(g).find((e) => e.id === w.after!.foe)!;
    expect(foe).toBeDefined();
    expect(foe.variant).toBeUndefined();
    expect(woodGoal(w, true)).toEqual({ title: 'PARRY: TAP PARRY WHILE THE RED FLASHES WHITE', text: 'PARRIES 0 / 1' });
    w.hold = null;
    // A dodge counts for nothing now.
    dodge(g);
    expect(w.count).toBe(0);
    const ev = frame(g, [{ k: 'parry', x: 0, y: 0 }]);
    expect(ev.some((e) => e.k === 'passed')).toBe(true);
    expect(w.passed).toBe(2);
    expect(w.after?.phase).toBe('kill');
    expect(woodGoal(w, true).title).toBe('KILL THE GOBLINS');
    for (const e of mine(g)) kill(e, [], 'burst', 0, 1);
    w.hold = null;
    frame(g);
    expect(w.stage).toBe(2);
    // PARRY stays given after the path.
    expect(g.taught()).toContain('block');
  });

  it('a real parry in the room counts: the swing freezes, a tap of PARRY meets it', () => {
    const g = onPath('RANGER'), w = g.wood!;
    dodge(g), dodge(g);
    // The path's own goblins out of it.
    for (const e of mine(g)) kill(e, [], 'burst', 0, 1);
    w.ids = [];
    g.room.time += PARRY_BEAT + 0.05;
    frame(g);
    g.continueHold();
    g.step(0.05, NO_INTENT);
    expect(w.hold).toBeNull();
    const foe = mine(g).find((e) => e.id === w.after!.foe)!;
    Object.assign(foe, { x: g.hero.x + 1.0, y: g.hero.y, cooldown: 0, alert: true });
    let seq = 0;
    for (let i = 0; i < 200 && w.after?.phase === 'parry'; i++) {
      const h = w.hold;
      if (h?.kind === 'act') {
        expect(h.text).toBe('NOW: TAP PARRY');
        g.step(0.05, { ...NO_INTENT, blockSeq: ++seq });
      } else g.step(0.05, NO_INTENT);
    }
    expect(w.after?.phase).toBe('kill');
    expect(w.passed).toBe(2);
  });

  it('no other class goes to it: Warrior and Healer are taught block and parry; Rogue and Mage have no guard', () => {
    for (const cls of CLASSES) expect(lessonsFor(cls)[1].then).toBe(cls === 'RANGER' ? 'parry' : undefined);
    expect(lessonsFor('WARRIOR').map((l) => l.count)).toContain('parry');
    expect(lessonsFor('HEALER').map((l) => l.count)).toContain('parry');
  });
});

/** How far a body of Hew's size at (x, y) is sunk into the nearest tree, brazier or block (0: clear). */
function sunk(m: GameMap, n: Npc): number {
  let worst = 0;
  for (const c of [...m.rounds, ...m.braziers]) worst = Math.max(worst, c.r + HEW_R - Math.hypot(n.x - c.x, n.y - c.y));
  for (const b of m.blocks) {
    if (b.ruined) continue;
    const dx = n.x - Math.max(b.x, Math.min(b.x + b.w, n.x)), dy = n.y - Math.max(b.y, Math.min(b.y + b.h, n.y));
    worst = Math.max(worst, HEW_R - Math.hypot(dx, dy));
  }
  return worst;
}
const hewOf = (g: Game) => g.room.map.npcs!.find((n) => n.talk === 'hew')!;

describe('Hew keeps out of the trees', () => {
  it('never stands in a tree or a block on any of his walks: the waking, lesson to lesson, round the hut', () => {
    const g = new Game();
    g.create('HEALER', 'stray');
    const m = () => g.room.map, check = (what: string) => expect(sunk(m(), hewOf(g)), what).toBeLessThan(0.05);
    expect(sunk(m(), { x: HEW_START[0], y: HEW_START[1] } as Npc)).toBeLessThanOrEqual(0);
    // The waking: out of the trees, round the field, to your side.
    for (let i = 0; i < 400 && g.wood!.wake >= 0; i++) {
      if (g.wood!.hold) g.continueHold();
      g.step(0.05, NO_INTENT);
      check(`waking, step ${i}`);
    }
    expect(Math.hypot(hewOf(g).x - g.hero.x, hewOf(g).y - g.hero.y)).toBeLessThan(2);
    g.wood!.hold = null;
    g.wood!.from = null;
    // Lesson to lesson: each gate open as it would be, you back on the field, him walking on alone.
    for (let s = 0; s <= 4; s++) {
      if (s > 0) g.room.map.blocks = g.room.map.blocks.filter((b) => b.x !== GATES[s - 1].block.x || b.y !== GATES[s - 1].block.y);
      Object.assign(g.wood!, { stage: s, entered: s === 0, hold: null });
      Object.assign(g.hero, { x: 8, y: 34 });
      const [tx, ty] = LESSONS[s].hew;
      for (let i = 0; i < 600 && Math.hypot(hewOf(g).x - tx, hewOf(g).y - ty) > 0.15; i++) {
        g.wood!.hold = null;
        frame(g);
        check(`to lesson ${s}, step ${i}`);
      }
      expect(Math.hypot(hewOf(g).x - tx, hewOf(g).y - ty), `reached lesson ${s}`).toBeLessThan(0.15);
    }
    // Where the Healer's arrow puts him, and where he walks from at the hut, are clear.
    expect(sunk(m(), { x: HEW_AT[0], y: HEW_AT[1] } as Npc)).toBeLessThanOrEqual(0);
    expect(sunk(m(), { x: PARRY_FOE.x, y: PARRY_FOE.y } as Npc)).toBeLessThanOrEqual(0);
    // Round the side of the hut to the cordwood (until the Stoker has him).
    Object.assign(g.wood!, { stage: 4, entered: false, hold: null });
    Object.assign(g.hero, { x: 52, y: 10 });
    for (let i = 0; i < 200 && (g.wood!.cut < 0 || g.wood!.cut < 3.4); i++) {
      g.step(0.05, NO_INTENT);
      if (g.wood!.cut >= 0 && g.wood!.cut < 3.4) check(`round the hut, ${g.wood!.cut.toFixed(2)} s`);
    }
    expect(Math.hypot(hewOf(g).x - 55.5, hewOf(g).y - 7.4)).toBeLessThan(0.6);
  });
});
