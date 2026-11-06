import { beforeEach, describe, expect, it } from 'vitest';
import { GATES, LESSONS, ROAD_OUT, lessonsFor } from '../src/shared/wood';
import { kill } from '../src/sim/damage';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { Game } from '../src/client/game';
import { ORLA } from '../src/shared/orla';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

/** Past the waking: on your feet, the move card dismissed. */
function wake(g: Game): void {
  Object.assign(g.wood!, { wake: -1, hold: null, from: null });
  Object.assign(g.hero, { act: 'idle', actT: 0, lying: false });
}
/** Walk the hero into lesson `i`'s area, let the wood notice, and dismiss its card. */
function enter(g: Game, i: number): void {
  const a = [[8, 33], [32, 36], [32, 18], [53, 20], [52, 10]][i];
  Object.assign(g.hero, { x: a[0], y: a[1] });
  g.step(0.05, NO_INTENT);
  if (g.wood!.hold) g.wood!.hold = null;
}
/** Kill everything the lesson brought, counting `n` of its moves. */
function clear(g: Game, n: number, k: FightEvent['k']): void {
  const w = g.wood!;
  for (let i = 0; i < n; i++) (g.room.events as FightEvent[]).push({ k, x: 0, y: 0 } as FightEvent);
  const ev: FightEvent[] = Array.from({ length: n }, () => ({ k, x: 0, y: 0 }) as FightEvent);
  for (const e of g.room.enemies) if (w.ids.includes(e.id)) kill(e, ev, 'burst', 0, 1);
  // Feed the counted moves to the wood through a frame.
  const before = w.count;
  w.count = before + n;
  w.praised = 99;
  g.step(0.05, NO_INTENT);
  w.hold = null;
}

describe('the prologue wood', () => {
  it('opens with you down and still; Hew walks over, talks, hauls you up; then a card to walk', () => {
    const g = new Game();
    g.create('ROGUE', 'stray');
    expect(g.hero.act).toBe('down');
    expect(g.taught()).toEqual([]);
    const x = g.hero.x;
    for (let i = 0; i < 60; i++) g.step(0.1, { ...NO_INTENT, mx: 1 });
    expect(g.hero.x).toBeCloseTo(x);
    // He talks; each line waits for a tap, and the world with it.
    for (let i = 0; i < 80 && !g.wood!.hold; i++) g.step(0.1, NO_INTENT);
    expect(g.wood!.hold?.kind).toBe('talk');
    const held = g.room.time;
    g.step(0.5, NO_INTENT);
    expect(g.room.time).toBe(held);
    for (let i = 0; i < 20 && g.wood!.wake >= 0; i++) {
      if (g.wood!.hold?.kind === 'talk') g.continueHold();
      g.step(0.1, NO_INTENT);
    }
    expect(g.hero.act).toBe('idle');
    expect(g.wood!.hold?.need).toBe('move');
    // The world waits for you to walk.
    const t = g.room.time;
    g.step(0.1, NO_INTENT);
    g.step(0.5, NO_INTENT);
    expect(g.room.time).toBe(t);
    g.step(0.1, { ...NO_INTENT, mx: 1 });
    expect(g.wood!.hold).toBeNull();
  });

  it('a lesson card holds the world until dismissed; the first blows freeze until you answer', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    wake(g);
    Object.assign(g.wood!, { stage: 1, entered: false });
    Object.assign(g.hero, { x: 32, y: 36 });
    g.step(0.05, NO_INTENT);
    expect(g.wood!.hold?.kind).toBe('card');
    const t = g.room.time;
    g.step(0.7, NO_INTENT);
    expect(g.room.time).toBe(t);
    g.continueHold();
    g.step(0.05, NO_INTENT);
    expect(g.wood!.hold).toBeNull();
    // A lunger comes and winds up: the world stops before the stab, until you move (a Warrior has no
    // roll, so it walks out of the stripes).
    const l = g.room.enemies.find((e) => e.variant === 'lunger' && e.alert)!;
    Object.assign(l, { x: g.hero.x + 2, y: g.hero.y, fx: -1, fy: 0, cooldown: 0 });
    for (let i = 0; i < 80 && !g.wood!.hold; i++) g.step(0.05, NO_INTENT);
    expect(g.wood!.hold?.need).toBe('move');
    g.step(0.3, NO_INTENT);
    expect(g.wood!.hold?.need).toBe('move');
    g.step(0.15, { ...NO_INTENT, mx: 0, my: 1 });
    expect(g.wood!.hold).toBeNull();
    // Walk on out of the line, and it's counted as a dodge.
    for (let i = 0; i < 30; i++) g.step(0.05, { ...NO_INTENT, mx: 0, my: 1 });
    expect(g.wood!.count).toBeGreaterThanOrEqual(1);
  });

  it('a Rogue on the same path is stopped until it dodges', () => {
    const g = new Game();
    g.create('ROGUE', 'stray');
    wake(g);
    Object.assign(g.wood!, { stage: 1, entered: false });
    Object.assign(g.hero, { x: 32, y: 36 });
    g.step(0.05, NO_INTENT);
    g.continueHold();
    g.step(0.05, NO_INTENT);
    const l = g.room.enemies.find((e) => e.variant === 'lunger' && e.alert)!;
    Object.assign(l, { x: g.hero.x + 2, y: g.hero.y, fx: -1, fy: 0, cooldown: 0 });
    for (let i = 0; i < 80 && !g.wood!.hold; i++) g.step(0.05, NO_INTENT);
    expect(g.wood!.hold?.need).toBe('roll');
    g.step(0.05, { ...NO_INTENT, rollSeq: 1, mx: 0, my: 1 });
    expect(g.wood!.hold).toBeNull();
    expect(g.hero.act).toBe('roll');
  });

  it('a new hero starts in the wood; only attack is taught at first; a gate stands across each way on', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    expect(g.mode).toBe('wood');
    wake(g);
    expect(g.taught()).toEqual(['attack']);
    for (const gate of GATES) expect(g.room.map.blocks.some((b) => b.x === gate.block.x && b.y === gate.block.y)).toBe(true);
    // A roll press does nothing yet.
    const x = g.hero.x;
    g.step(0.3, { ...NO_INTENT, rollSeq: 1, mx: 0, my: 0 });
    expect(g.hero.act).not.toBe('roll');
    expect(g.hero.x).toBeCloseTo(x);
  });

  it('each lesson opens its gate once done, and teaches the next move; Hew picks you up when you fall', () => {
    const g = new Game();
    g.create('RANGER', 'stray');
    wake(g);
    enter(g, 0);
    clear(g, 0, 'hit');
    expect(g.wood!.more).toBe(true);
    clear(g, 0, 'hit');
    expect(g.wood!.stage).toBe(1);
    expect(g.room.map.blocks.some((b) => b.x === GATES[0].block.x && b.y === GATES[0].block.y)).toBe(false);
    expect(g.taught()).toContain('roll');
    // Down in the wood: up again at once.
    g.hero.hp = 0;
    g.hero.act = 'down';
    (g as unknown as { stepWoodFrame(h: unknown, ev: FightEvent[], dt: number): void }).stepWoodFrame(g.hero, [{ k: 'down', x: g.hero.x, y: g.hero.y }], 0.05);
    expect(g.hero.act).toBe('idle');
    expect(g.hero.hp).toBe(g.hero.maxHp);
    for (let i = 1; i < 4; i++) {
      enter(g, i);
      clear(g, LESSONS[i].need, 'dodge');
      // (No PARRY step on the Ranger's path any more: two dodges, then straight to the goblins.)
      expect(g.wood!.hold?.move).not.toBe('parry');
      // (A Ranger's clearing goes on to its MARK step: its two cleared, the way opens.)
      if (i === 2) expect(g.wood!.sign?.id).toBe('mark'), clear(g, 0, 'dodge');
      expect(g.wood!.stage).toBe(i + 1);
    }
    expect(g.taught()).toContain('block');
  });

  it('each class has its own way through: a block for the heavy kits, behind and full shots and the last second for the light', () => {
    for (const c of ['ROGUE', 'RANGER', 'MAGE'] as const) {
      const ls = lessonsFor(c);
      expect(ls.slice(0, 4).every((l) => !l.moves.includes('block'))).toBe(true);
      expect(ls[3].count).toBe('slip');
    }
    expect(lessonsFor('ROGUE')[2].count).toBe('backstab');
    expect(lessonsFor('RANGER')[2].count).toBe('heavy');
    expect(lessonsFor('WARRIOR')[2].count).toBe('block');
    // The stream's PARRY lesson is gone: a Warrior or Healer walks on by (no goblins, no card).
    for (const c of ['WARRIOR', 'HEALER'] as const) expect([lessonsFor(c)[3].count, lessonsFor(c)[3].foes.length]).toEqual(['none', 0]);
    // The rogue's third lesson counts blows from behind, and nothing else.
    const g = new Game();
    g.create('ROGUE', 'stray');
    wake(g);
    Object.assign(g.wood!, { stage: 2, entered: false });
    enter(g, 2);
    expect(g.wood!.entered).toBe(true);
    const step = (ev: FightEvent[]) => (g as unknown as { stepWoodFrame(h: unknown, ev: FightEvent[], dt: number): void }).stepWoodFrame(g.hero, ev, 0.05);
    g.wood!.hold = null;
    step([{ k: 'hit', x: 0, y: 0, n: 5, heavy: false, on: 'enemy' }]);
    expect(g.wood!.count).toBe(0);
    g.wood!.hold = null;
    step([{ k: 'hit', x: 0, y: 0, n: 5, heavy: false, on: 'enemy', backstab: true }]);
    expect(g.wood!.count).toBe(1);
  });

  it('the hut: the cutscene kills Hew; the Stoker gives up the javelin; Orla of the watch meets you and walks you to Wickhold', () => {
    const g = new Game();
    g.create('MAGE', 'stray');
    wake(g);
    const w = () => g.wood!;
    Object.assign(w(), { stage: 4, entered: false });
    enter(g, 4);
    expect(w().cut).toBeGreaterThanOrEqual(0);
    expect(g.taught()).toEqual([]);
    // Grabbed, screaming, his head gone, thrown into his hut's wall, down it; it bellows and never speaks.
    const said = new Set<string>(), evs = new Set<string>();
    let slid = false;
    for (let i = 0; i < 400 && w().cut >= 0; i++) {
      for (const e of g.step(0.05, NO_INTENT)) evs.add(e.k);
      if (w().caption) said.add(w().caption!.who + ': ' + w().caption!.text);
      const n = g.room.map.npcs?.find((x) => x.talk === 'hew');
      if (n?.smear && n.pose === 'headless') slid = true;
    }
    expect([...said].some((l) => l.startsWith('HEW: ') && l.includes('AAAH'))).toBe(true);
    expect([...said].every((l) => l.startsWith('HEW: '))).toBe(true);
    expect(evs.has('bite') && evs.has('thud') && evs.has('bellow')).toBe(true);
    expect(slid).toBe(true);
    expect(w().hewAlive).toBe(false);
    expect(g.room.map.npcs?.some((n) => n.talk === 'hew')).toBe(false);
    const body = g.room.map.npcs?.find((n) => n.talk === 'hewdead');
    expect(body).toMatchObject({ pose: 'body', smear: 13 });
    const s = g.room.enemies.find((e) => e.name === 'THE STOKER')!;
    expect(s.alert).toBe(true);
    // It comes for you at once.
    expect(s.cooldown).toBeLessThan(1);
    kill(s, [], 'burst', 0, 1);
    g.step(0.05, NO_INTENT);
    expect(w().relic).toBe(true);
    expect(g.hero.relics).toEqual(['grasp', 'javelin']);
    // The find stops everything until you've seen it.
    expect(w().hold?.kind).toBe('relic');
    g.continueHold();
    g.step(0.05, NO_INTENT);
    expect(w().hold).toBeNull();
    // Walking straight to the road out before she comes doesn't leave the wood.
    Object.assign(g.hero, { x: ROAD_OUT.x + 1, y: ROAD_OUT.y + 2 });
    g.step(0.05, NO_INTENT);
    expect(g.mode).toBe('wood');
    // Hew's last words are gone: he only screams.
    expect([...said].some((l) => l.includes('Odric'))).toBe(false);
    // Orla waits for the Stoker's callers to be dead.
    expect(g.room.map.npcs?.some((n) => n.talk === 'orla')).toBe(false);
    for (const e of g.room.enemies) if (w().ids.includes(e.id) && e.act !== 'dead') kill(e, [], 'burst', 0, 1);
    // Orla of the watch comes along the road from the west, up to you, and says her piece.
    Object.assign(g.hero, { x: 54, y: 9 });
    const orla = () => g.room.map.npcs?.find((n) => n.talk === 'orla');
    g.step(0.05, NO_INTENT);
    expect(orla()).toMatchObject({ name: ORLA.name, look: 'guard' });
    expect(orla()!.x).toBeLessThan(g.hero.x - 8);
    // Not yet: the road out waits for her.
    const heard: string[] = [];
    for (let i = 0; i < 400 && heard.length < ORLA.meet.length; i++) {
      const h = w().hold;
      if (h) {
        expect(h.kind).toBe('talk');
        heard.push(h.who + ': ' + h.text);
        expect(Math.hypot(orla()!.x - g.hero.x, orla()!.y - g.hero.y)).toBeLessThanOrEqual(ORLA.near + 0.01);
        g.continueHold();
      }
      g.step(0.05, NO_INTENT);
    }
    expect(heard).toEqual(ORLA.meet.map((t) => 'ORLA: ' + t));
    // Then she stoops by Hew for the tally stick and leads you west.
    for (let i = 0; i < 200 && w().guard?.phase !== 'lead'; i++) g.step(0.05, NO_INTENT);
    expect(w().guard?.phase).toBe('lead');
    const was = orla()!.x;
    g.step(0.5, NO_INTENT);
    expect(orla()!.x).toBeLessThan(was);
    // The road out is a few steps west of the hut, not the length of the wood.
    expect(Math.hypot(ROAD_OUT.x - 52, ROAD_OUT.y - 6)).toBeLessThan(16);
    Object.assign(g.hero, { x: ROAD_OUT.x + 1, y: ROAD_OUT.y + 2 });
    g.step(0.05, NO_INTENT);
    expect(g.mode).toBe('town');
    expect(g.profile).toMatchObject({ prologue: true, tally: true });
    expect(g.profile.relics.find((r) => r.id === g.profile.relic)?.kind).toBe('javelin');
    expect(g.greeting).toBe('road');
  });

  it('a second hero can skip the wood and still gets the javelin; a Healer comes out with a cold censer', () => {
    const g = new Game();
    g.create('HEALER', 'ivy');
    g.skipWood();
    expect(g.mode).toBe('town');
    expect(g.profile).toMatchObject({ prologue: true, cold: true });
    expect(g.profile.relics.find((r) => r.id === g.profile.relic)).toMatchObject({ kind: 'javelin', tier: 1, el: '', charge: 4 });
    expect(g.hero.cold).toBe(true);
  });
});
