import { describe, expect, it } from 'vitest';
import { collide, useMap } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { gainXp, levelFor, newProfile, xpFor } from '../src/shared/progress';
import { CHAPTER_1, councilOpen, decide, newWorld } from '../src/shared/story';
import { planRoom } from '../src/shared/terrain';
import { SPOTS, townMap } from '../src/shared/town';
import { Game, ME } from '../src/client/game';
import { NO_INTENT } from '../src/sim/types';
import { damageProp } from '../src/sim/props';
import { kill } from '../src/sim/damage';

const job = (kind: Job['place']['kind'], objective: Job['objective'] = 'rescue'): Job => ({
  ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === kind)!, objective, boss: 'SKARN', seed: 99,
});

describe('terrain', () => {
  it('lays out every kind of place the same way from the same seed, with spawn and exit clear', () => {
    for (const k of ['village', 'farm', 'field', 'forest', 'mine'] as const) {
      for (let i = 0; i < 3; i++) {
        const a = planRoom(job(k), i), b = planRoom(job(k), i);
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        useMap(a.map);
        for (const at of [a.map.hero, { x: 9, y: 0.6 }]) {
          const p = { ...at };
          collide(p, 0.32);
          expect(Math.hypot(p.x - at.x, p.y - at.y)).toBeLessThan(0.05);
        }
      }
    }
  });

  it('puts the objective in the last room: cages, the named butcher, the larder', () => {
    expect(planRoom(job('village', 'rescue'), 2).props.filter((p) => p.kind === 'cage').length).toBe(2);
    expect(planRoom(job('forest', 'hunt'), 2).foes.find((f) => f.name)?.name).toBe('SKARN');
    expect(planRoom(job('mine', 'larder'), 2).props.filter((p) => p.kind === 'larder').length).toBe(3);
    expect(planRoom(job('mine', 'larder'), 0).props.some((p) => p.kind === 'larder')).toBe(false);
  });
});

describe('progress and the world', () => {
  it('levels at 100, 300, 600 experience', () => {
    expect([xpFor(2), xpFor(3), xpFor(4)]).toEqual([100, 300, 600]);
    expect(levelFor(299)).toBe(2);
    const p = newProfile();
    expect(gainXp(p, 320)).toBe(2);
    expect(p.picks).toBe(2);
  });

  it("the council opens when chapter 1's goals are met, and its choice changes the town", () => {
    const w = newWorld();
    expect(councilOpen(w)).toBe(false);
    w.rescued = 6;
    w.storyDone.push(CHAPTER_1.goals.story);
    expect(councilOpen(w)).toBe(true);
    decide(w, 'farm', 4);
    expect(councilOpen(w)).toBe(false);
    expect(townMap(w).blocks.some((b) => b.kind === 'granary')).toBe(true);
    const v = newWorld();
    v.rescued = 6;
    v.storyDone.push(CHAPTER_1.goals.story);
    decide(v, 'refugees', 4);
    expect(v.rescued).toBe(10);
    expect(townMap(v).blocks.filter((b) => b.kind === 'house' && !b.label).length).toBe(5);
  });

  it('every town spot can be stood on', () => {
    const m = townMap(newWorld());
    useMap(m);
    for (const s of SPOTS) {
      const p = { x: s.x, y: s.y + 0.4 };
      collide(p, 0.32);
      expect(Math.hypot(p.x - s.x, p.y - s.y)).toBeLessThan(1.6);
    }
  });
});

describe('the loop', () => {
  it('a job runs room to room and brings its gold, experience and people home', () => {
    const g = new Game();
    const rescue = g.jobs().find((j) => j.objective === 'rescue') ?? { ...g.jobs()[1], objective: 'rescue' as const };
    g.startJob(rescue);
    expect(g.mode).toBe('run');
    for (let room = 0; room < rescue.rooms; room++) {
      expect(g.run!.index).toBe(room);
      // Win the room: every goblin dead, every cage broken, then walk out the top.
      for (const e of g.room.enemies) kill(e, g.room.events);
      for (const p of g.room.props) if (p.kind === 'cage') damageProp(p, 999, { heroes: g.room.heroes, enemies: g.room.enemies, javelins: [], props: g.room.props, now: g.room.time, ev: g.room.events });
      g.step(0.05, NO_INTENT);
      expect(g.room.exitOpen).toBe(true);
      // At the fork, take the high road.
      const way = g.room.map.roads?.[0].area ?? g.room.map.exit!;
      Object.assign(g.hero, { x: way.x + way.w / 2, y: way.y + 0.5 });
      g.step(0.05, NO_INTENT);
    }
    expect(g.mode).toBe('town');
    expect(g.result?.won).toBe(true);
    expect(g.profile.gold).toBeGreaterThan(0);
    expect(g.world.day).toBe(2);
    expect(g.hero.id).toBe(ME);
  });
});
