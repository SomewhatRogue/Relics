/**
 * The recap's side by side (Kyle, 2026-11-05): the room counts each hero's kills, damage, parries,
 * dodges and downs (sim/score.ts, folded by run.ts tally); a friend's game reads the same numbers from
 * the end message; callouts only for a real lead; and no knack screen at a job's end.
 */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { newRun, tally, type Run } from '../src/sim/run';
import { blankScore, type Score } from '../src/sim/score';
import { BUTCHER, HERO, TICK } from '../src/shared/tuning';
import { NO_INTENT, type Intent } from '../src/sim/types';
import { board } from '../src/shared/jobs';
import { gainXp, newProfile, xpFor } from '../src/shared/progress';
import { nameBoard, partyOf, recapOf } from '../src/client/recaptally';
import { callouts } from '../src/client/recapcalls';
import { asGuest } from '../src/client/asguest';
import { showResult } from '../src/client/recap';
import { RECAPW } from '../src/client/recapwords';
import { knackCues } from '../src/client/knackcues';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const ticks = (s: number) => Math.round(s / TICK);

/** One hero `id` just under the training butcher, his `kind` blow wound up; the dummies parked. Every step is tallied. */
function fight(run: Run, id: string, kind: 'cleave' | 'slam' = 'cleave') {
  const room = new ArenaRoom(3, { scrappers: false });
  room.board = {};
  const h = room.join(id), b = room.enemies[0];
  for (const e of room.enemies.slice(1)) (e.x = 0.5), (e.y = 15.5);
  Object.assign(b, { x: 9, y: 6, cooldown: 0 });
  Object.assign(h, { x: 9, y: 7.6, fx: 0, fy: -1 });
  for (let i = 0; i < 400 && b.attack?.kind !== kind; i++) {
    room.step();
    if (b.attack && b.attack.kind !== kind) Object.assign(b, { attack: null, act: 'chase', cooldown: 0 }), Object.assign(h, { hp: HERO.hp, stamina: HERO.stamina, act: 'idle' });
    Object.assign(h, { x: 9, y: 7.6, kvx: 0, kvy: 0 });
  }
  expect(b.attack?.kind).toBe(kind);
  // (The wind-up so far wasn't the fight: the run counts from here.)
  room.board = {};
  const step = (n: number) => {
    for (let i = 0; i < n; i++) room.step(), tally(run, room, room.events, 'me');
  };
  /** Step until the blow has `left` seconds of wind-up to go. */
  const until = (left: number) => step(ticks(b.attack!.windup - b.attack!.t - left));
  return { room, h, b, step, until, press: (o: Partial<Intent>) => room.setIntent(id, intent(o)) };
}

/** The same scripted job: `me` (a Warrior) parries, parries on the press, blocks and kills; `friend` (a Ranger) dodges and goes down. */
function scripted(): Run {
  const run = newRun(board(3)[0]);
  const a = fight(run, 'me');
  a.until(0.25), a.press({ blockSeq: 1 }), a.step(ticks(0.4));
  const p = fight(run, 'me');
  p.until(0.03), p.press({ blockSeq: 1 }), p.step(ticks(0.3));
  const k = fight(run, 'me');
  k.press({ block: true, blockSeq: 1 }), k.step(ticks(BUTCHER.cleave.windup) + 2);
  // A tap on a butcher with 3 health left: the kill, and 3 of the blow counted (not the overkill).
  k.press({ block: false, blockSeq: 1 }), k.step(ticks(1.2));
  Object.assign(k.b, { hp: 3, attack: null, act: 'chase', cooldown: 99, x: 9, y: 6.6 });
  Object.assign(k.h, { x: 9, y: 7.6, fx: 0, fy: -1, act: 'idle', stamina: HERO.stamina });
  k.press({ attackSeq: 1, ay: -1 }), k.step(ticks(0.6));
  const d = fight(run, 'friend');
  d.h.weapon = 'longbow';
  d.until(0.15), d.press({ rollSeq: 1 }), d.step(ticks(0.4));
  const t = fight(run, 'friend');
  t.h.weapon = 'longbow';
  t.h.hp = 10;
  t.step(ticks(BUTCHER.cleave.windup) + 4);
  return run;
}

describe('the room counts each hero', () => {
  const run = scripted(), me = run.board!.me, friend = run.board!.friend;

  it('parries, a perfect parry on the press, a block, a kill and the damage that went in', () => {
    expect(me.parries).toBe(2);
    expect(me.perfect).toBe(1);
    expect(me.blocks).toBe(1);
    expect(me.kills).toBe(1);
    expect(me.dealt).toBe(3);
    expect(me.best).toBeGreaterThanOrEqual(3);
    expect([me.taken, me.downs, me.dodges]).toEqual([0, 0, 0]);
  });

  it("a friend's own: the dodge, the blow taken and the down", () => {
    expect(friend.dodges).toBe(1);
    expect(friend.taken).toBe(BUTCHER.cleave.dmg);
    expect(friend.downs).toBe(1);
    expect([friend.kills, friend.parries, friend.dealt]).toEqual([0, 0, 0]);
    expect(friend.cls).toBe('RANGER');
    expect(me.cls).toBe('WARRIOR');
  });

  it('plays the same every time (no dice of its own)', () => {
    expect(scripted().board).toEqual(run.board);
  });

  it('counts nothing outside a job (a room with no board)', () => {
    const room = new ArenaRoom(3, { scrappers: false });
    room.join('me');
    for (let i = 0; i < 60; i++) room.step();
    expect(room.board).toBeNull();
  });
});

describe("a friend's recap", () => {
  it('reads the same numbers as the leader, their own column first', () => {
    const run = scripted(), lead = newProfile('WARRIOR', 'KYLE'), guest = newProfile('RANGER', 'WREN');
    lead.id = 'k1';
    guest.id = 'friend';
    nameBoard(run, 'me', lead, [['k1', 'KYLE'], ['friend', 'WREN']]);
    // The end message, as the friend's game reads it (coop.ts).
    const heard = asGuest({ won: true, run }, 'friend');
    const mine = partyOf(run, lead, 'me'), theirs = partyOf(heard.run, guest, 'me');
    const byName = (ls: typeof mine) => Object.fromEntries(ls.map((l) => [l.name, { ...l.s, name: undefined, cls: l.cls }]));
    expect(byName(theirs)).toEqual(byName(mine));
    expect(theirs[0]).toMatchObject({ me: true, name: 'WREN', cls: 'RANGER' });
    expect(mine[0]).toMatchObject({ me: true, name: 'KYLE' });
    expect(theirs.map((l) => l.name)).toEqual(['WREN', 'KYLE']);
  });
});

describe('callouts', () => {
  const s = (o: Partial<Score>): Score => ({ ...blankScore(), ...o });

  it('a party of one leads nobody', () => {
    expect(callouts([s({ kills: 40, dealt: 900 })])).toEqual([undefined]);
  });

  it('only a real lead: more than anyone, not tied, not nothing', () => {
    expect(callouts([s({ kills: 4 }), s({ kills: 4 })])).toEqual([undefined, undefined]);
    expect(callouts([s({}), s({})])).toEqual([undefined, undefined]);
    expect(callouts([s({ kills: 5 }), s({ kills: 4 })])).toEqual(['kills', undefined]);
  });

  it('one each, the first thing they led at; a Cleric who healed most is MOST HEALING', () => {
    const c = callouts([s({ kills: 9, dealt: 800, parries: 5 }), s({ kills: 3, dealt: 200, healed: 140 }), s({ kills: 1, dodges: 6, downs: 1 })]);
    expect(c).toEqual(['kills', 'healed', 'dodges']);
    expect(RECAPW.call[c[1]!]).toBe('MOST HEALING');
  });

  it('NEVER WENT DOWN only when everyone else did', () => {
    expect(callouts([s({ downs: 0 }), s({ downs: 2 }), s({ downs: 1 })])).toEqual(['standing', undefined, undefined]);
    expect(callouts([s({ downs: 0 }), s({ downs: 0 }), s({ downs: 1 })])).toEqual([undefined, undefined, undefined]);
  });
});

describe("no knack screen at a job's end", () => {
  /** A finished job's result as game.ts finish leaves it, a level gained on the way home. */
  function ended() {
    const p = newProfile('WARRIOR', 'KYLE'), run = scripted();
    p.id = 'k1';
    const levels = gainXp(p, xpFor(2));
    const recap = recapOf(run, null, p, null, true, 'me');
    const result = { won: true, how: 'won', half: false, job: run.job, gold: 50, xp: xpFor(2), rescued: 0, levels, treasure: [], sold: [], lost: 0, ledoff: 0, recap };
    const shown: { title: string; html: string; buttons: { label: string; act: () => void }[] }[] = [];
    let hidden = false;
    const panel = { show: (title: string, html: string, buttons: { label: string; act: () => void }[]) => void shown.push({ title, html, buttons }), hide: () => void (hidden = true) };
    const g = { result, profile: p, mode: 'town', hero: { x: 0, y: 0 }, levelPop: p.level };
    return { p, g, panel, shown, hidden: () => hidden };
  }

  it('one button home; the knack is banked and the card says where it is', () => {
    const e = ended();
    expect(e.p.picks).toBeGreaterThan(0);
    const picks = e.p.picks;
    showResult(e.g as never, e.panel as never);
    expect(e.shown).toHaveLength(1);
    expect(e.shown[0].buttons.map((b) => b.label)).toEqual([RECAPW.home]);
    expect(e.shown[0].html).toContain(RECAPW.knack(picks));
    expect(e.shown[0].html).not.toContain('PICK A KNACK');
    e.shown[0].buttons[0].act();
    expect(e.hidden()).toBe(true);
    // Nothing else opened, nothing spent.
    expect(e.shown).toHaveLength(1);
    expect(e.p.picks).toBe(picks);
  });

  it('the recap shows every hero side by side', () => {
    const e = ended();
    showResult(e.g as never, e.panel as never);
    const html = e.shown[0].html;
    expect(html).toContain('class="party" style="--n:2"');
    expect(html).toContain('KYLE');
    expect(html).toContain('KYLE');
    for (const k of ['kills', 'dealt', 'taken', 'dodges', 'parries', 'downs', 'blocks', 'raised', 'healed', 'best']) expect(html).toContain(RECAPW.stat[k]);
  });

  it('back in town the PACK button carries the count', () => {
    const e = ended(), btn = { dataset: {} as Record<string, string> };
    showResult(e.g as never, e.panel as never);
    e.g.result = null as never;
    knackCues(e.g as never, false, btn as never, () => {});
    expect(btn.dataset.picks).toBe(String(e.p.picks));
  });
});
