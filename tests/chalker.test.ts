/** The chalker (sim/chalker.ts) and how a new sort bleeds in (shared/debut.ts). */
import { describe, expect, it } from 'vitest';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { routeOf } from '../src/shared/route';
import { planRoom, type RoadId } from '../src/shared/terrain';
import { CHALKER, SCRAPPER, TEMPLATES, TICK } from '../src/shared/tuning';
import { jobDay, rareRoom, stageOf, weightIn } from '../src/shared/debut';
import { kill } from '../src/sim/damage';
import { begin } from '../src/sim/enemies';
import { hitHero } from '../src/sim/combat';
import { chalkTarget, chalkTaken } from '../src/sim/chalker';
import type { Enemy, FightEvent, Hero } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { field, run } from './foeyard';

const chalker = (heroes: [string, number, number][] = [['me', 15, 14]], more: Parameters<typeof field>[0] = []) => {
  const f = field([{ kind: 'scrapper', variant: 'chalker', x: 15, y: 6 }, ...more], heroes);
  return { ...f, e: f.room.enemies[0] };
};
const strokes = (ev: FightEvent[]) => ev.filter((x) => x.k === 'chalk');
/** The damage a blow of `dmg` from `g`, stood beside `h`, does to them. */
function blow(g: Enemy, h: Hero, now: number, dmg = 20): number {
  Object.assign(g, { x: h.x, y: h.y - 1, fx: 0, fy: 1, cooldown: 0, act: 'chase' });
  begin(g, 'stab', SCRAPPER.stab, h, []);
  g.attack!.dmg = dmg;
  g.attack!.t = g.attack!.windup;
  const hp = h.hp;
  hitHero(g, g.attack!, h, now, []);
  Object.assign(g, { attack: null, act: 'chase' });
  return hp - h.hp;
}

describe('the chalker', () => {
  it('chalks a stroke on the hero it sees every couple of seconds, and none once it is dead', () => {
    const { room, e, h } = chalker();
    expect(e.hp).toBe(CHALKER.hp);
    const ev = run(room, CHALKER.first + CHALKER.every * 2 + 0.2);
    expect(strokes(ev)).toHaveLength(3);
    expect(h.chalk).toBe(3);
    expect(ev.filter((x) => x.k === 'chalk').every((x) => (x as { on: string }).on === 'me')).toBe(true);
    // It kept back out of reach while it did.
    expect(Math.hypot(e.x - h.x, e.y - h.y)).toBeGreaterThan(CHALKER.keep - 0.5);
    kill(e, room.events);
    const after = run(room, CHALKER.every * 2.5);
    expect(strokes(after)).toHaveLength(0);
    expect(h.chalk).toBe(3);
    // Left with nobody at them, the strokes fade.
    run(room, CHALKER.linger);
    expect(h.chalk).toBe(0);
  });

  it("can't chalk who it can't see: the clock stands still while it's blinded by smoke", () => {
    const { room, e, h } = chalker();
    run(room, CHALKER.first + 0.1);
    expect(h.chalk).toBe(1);
    const ev = run(room, CHALKER.every * 2, () => ((e.smokedUntil = room.time + TICK * 1.5), false));
    expect(strokes(ev)).toHaveLength(0);
    expect(run(room, CHALKER.every + 0.1).some((x) => x.k === 'chalk')).toBe(true);
  });

  it('at five its pack turns on that hero, their blows 1.3x on them only, for the turn and no longer', () => {
    const { room, e, hs } = chalker([['me', 15, 14], ['h2', 6, 14]], [{ kind: 'scrapper', x: 7, y: 12 }]);
    const [me, h2] = hs, g = room.enemies[1];
    // Before the turn the goblin by h2 goes for h2.
    const plain = blow(g, me, room.time);
    me.hp = me.maxHp;
    me.chalk = CHALKER.five - 1;
    // It picks `me` (nearest it), and the fifth stroke lands.
    const ev = run(room, CHALKER.first + CHALKER.every + 0.2, () => (me.chalkedUntil ?? -9) > room.time);
    expect(ev.some((x) => x.k === 'chalked' && x.on === 'me')).toBe(true);
    expect(me.chalk).toBe(CHALKER.five);
    expect(e.quarry).toBe('');
    expect(g.turnedOn).toBe('me');
    expect(chalkTarget(g, room.heroes, room.time)).toBe(me);
    const marked = blow(g, me, room.time);
    expect(marked).toBe(Math.round(plain * CHALKER.dmg));
    expect(chalkTaken(g, me, room.time)).toBe(CHALKER.dmg);
    // Only on that hero: the same goblin's blow on the other is as ever.
    expect(blow(g, h2, room.time)).toBe(plain);
    me.hp = h2.hp = 100;
    // Walking: the turned goblin comes for `me`, though `h2` is nearer it.
    Object.assign(g, { x: 7, y: 12, attack: null });
    const d0 = Math.hypot(g.x - me.x, g.y - me.y);
    run(room, 1);
    expect(Math.hypot(g.x - me.x, g.y - me.y)).toBeLessThan(d0 - 1);
    // The turn runs its time (a second of it gone), then the chalk is spent.
    run(room, CHALKER.turn - 1 + 0.3);
    expect(me.chalk).toBe(0);
    expect(chalkTarget(g, room.heroes, room.time)).toBe(null);
    expect(chalkTaken(g, me, room.time)).toBe(1);
  });

  for (const [what, hide] of [
    ['Vanish', (h: Hero, room: ReturnType<typeof field>['room']) => void (h.vanishUntil = room.time + 2)],
    ['smoke', (h: Hero, room: ReturnType<typeof field>['room']) => void room.smokes.push({ x: h.x, y: h.y, until: room.time + 4, r: 2 })],
    ['SANCTUARY', (h: Hero, room: ReturnType<typeof field>['room']) => void room.zones.push({ x: h.x, y: h.y, r: 2, until: room.time + 4, next: room.time, owner: h.id, el: '' })],
  ] as const) it(`${what} wipes the strokes, and calls off a turn already on`, () => {
    const { room, e, hs } = chalker([['me', 15, 14]], [{ kind: 'scrapper', x: 20, y: 12 }]);
    const [me] = hs, g = room.enemies[1];
    me.chalk = 3;
    hide(me, room);
    const ev = run(room, 0.6);
    expect(me.chalk).toBe(0);
    expect(ev.some((x) => x.k === 'chalkwipe' && x.on === 'me')).toBe(true);
    // A turn already on: wiped, the pack lets go and the blows land as ever.
    Object.assign(room, { smokes: [], zones: [] }), (me.vanishUntil = -9), (me.hiddenUntil = -9);
    me.chalk = CHALKER.five - 1;
    e.quarry = 'me';
    e.chalkT = CHALKER.every;
    run(room, TICK * 2);
    expect(g.turnedOn).toBe('me');
    hide(me, room);
    run(room, 0.6);
    expect(me.chalk).toBe(0);
    expect(chalkTarget(g, room.heroes, room.time)).toBe(null);
    expect(chalkTaken(g, me, room.time)).toBe(1);
  });

  it('a guest sees the strokes, sent as the changed fields only', () => {
    const { room, h } = chalker();
    const enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(stateOf(room), true), true);
    let got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room)))));
    for (let i = 0; i < Math.round((CHALKER.first + CHALKER.every + 0.2) / TICK); i++) {
      room.step();
      const p = enc.encode(stateOf(room)), mine = p.heroes?.u.find(([k]) => k === 'me')?.[1];
      // Only what changed goes: never the hero whole.
      if (mine) expect(Object.keys(mine)).not.toContain('maxHp');
      got = dec.apply(JSON.parse(JSON.stringify(p)));
    }
    expect(h.chalk).toBe(2);
    expect(got.heroes.find((x) => x.id === 'me')!.chalk).toBe(2);
    expect(got.heroes.find((x) => x.id === 'me')!.chalkAt).toBeCloseTo(h.chalkAt!, 1);
  });

  it('the same fight twice is the same', () => {
    const go = () => {
      const { room, hs } = chalker([['me', 15, 14], ['h2', 9, 15]], [{ kind: 'scrapper', x: 12, y: 9 }, { kind: 'scrapper', x: 18, y: 9 }]);
      for (const h of hs) h.hp = h.maxHp = 1000;
      const out: unknown[] = [];
      for (let i = 0; i < 600; i++) {
        hs[1].x = 9 + Math.sin(i / 40) * 3;
        room.step();
        out.push(room.events.filter((x) => x.k.startsWith('chalk')), hs.map((h) => [h.chalk, h.chalkedUntil, h.hp]));
      }
      return JSON.stringify(out);
    };
    const a = go();
    expect(a).toContain('chalked');
    expect(go()).toBe(a);
  });
});

describe('how the chalker bleeds in', () => {
  const chalk = TEMPLATES.find((t) => t.id === 'chalk')!, d = chalk.debut!;
  const job = (place: (typeof PLACES)[number], seed: number, day: number, rooms = 5): Job => ({ ...board(day)[1], place, rooms, seed, objective: 'hunt', layout: 4 });
  const chalkersIn = (j: Job) => Array.from({ length: j.rooms }, (_, i) => planRoom(j, i).foes.filter((f) => f.variant === 'chalker' && !f.task).length);

  it('is staged first in the CRIES way room in the Barrowfields, at its tally, one of the guards', () => {
    let found = 0, elsewhere = 0;
    for (const place of [PLACES[0], PLACES[2], PLACES[3], PLACES[4]]) for (let s = 1; s <= 40; s++) {
      const j = job(place, s * 13 + 1, 1);
      for (const took of ['h', 'l'] as const) {
        const r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2), road: RoadId = took === 'l' ? 'low' : 'high';
        if (r[f + 1]?.way !== 'cries') continue;
        const plan = planRoom(j, f + 1, road, { [f + 1]: road }), c = plan.foes.filter((x) => x.variant === 'chalker');
        if (place.region !== d.home) (elsewhere++, expect(c).toHaveLength(0));
        else {
          found++;
          expect(c).toHaveLength(1);
          expect(c[0].task?.k).toBe('tally');
          expect(c[0].pack).toBe(plan.foes.find((x) => x.task?.k === 'escort')!.pack);
        }
      }
    }
    expect(found).toBeGreaterThan(3);
    expect(elsewhere).toBeGreaterThan(0);
  });

  it("goes by the board's day: staged, then rare, then common", () => {
    expect(jobDay(board(12)[0])).toBe(12);
    expect(jobDay({ ...board(3)[0], id: 'barrowby-bell' })).toBe(null);
    expect(stageOf(d, null)).toBe('staged');
    expect(stageOf(d, d.from + d.rare - 1)).toBe('staged');
    expect(stageOf(d, d.from + d.rare)).toBe('rare');
    expect(stageOf(d, d.from + d.common - 1)).toBe('rare');
    expect(stageOf(d, d.from + d.common)).toBe('common');
    const day = d.from + d.rare + 2, home = job(PLACES[0], 77, day), away = job(PLACES[3], 77, day), at = rareRoom(home);
    // Staged: in no pack anywhere.
    expect(weightIn(chalk, job(PLACES[0], 77, d.from + 1), at)).toBe(0);
    // Rare: the home region only, one room of the job, weight 0.5.
    expect(weightIn(chalk, home, at)).toBe(d.weight);
    expect(d.weight).toBe(0.5);
    for (let i = 0; i < home.rooms; i++) if (i !== at) expect(weightIn(chalk, home, i)).toBe(0);
    expect(weightIn(chalk, away, at)).toBe(0);
    // Common: its own weight, anywhere.
    const late = d.from + d.common + 3;
    expect(weightIn(chalk, job(PLACES[3], 77, late), 2)).toBe(chalk.weight);
  });

  it('in the packs: none while staged, one a job at most in the Barrowfields while rare, more and anywhere once common', () => {
    const count = (days: number[]) => {
      let n = 0, away = 0, most = 0;
      for (const day of days) for (const j of board(day)) {
        const per = chalkersIn(j), all = per.reduce((s, k) => s + k, 0);
        n += all, most = Math.max(most, all);
        if (j.place.region !== d.home) away += all;
        if (all && j.layout === 4) per.forEach((k, i) => k && expect(i).toBeGreaterThanOrEqual(1));
      }
      return { n, away, most };
    };
    const span = (a: number, n = 20) => Array.from({ length: n }, (_, i) => a + i);
    const staged = count(span(d.from, d.rare)), rare = count(span(d.from + d.rare)), common = count(span(d.from + d.common));
    expect(staged.n).toBe(0);
    expect(rare.most).toBeLessThanOrEqual(1);
    expect(rare.away).toBe(0);
    expect(common.n).toBeGreaterThan(rare.n);
    expect(common.away).toBeGreaterThan(0);
  });
});
