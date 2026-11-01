/**
 * The loop: Wickhold, the Training Yard, and runs. The town is a room you walk around; taking a job
 * starts a run (room after room until the job is done or you're driven back); the results come home
 * to the hero's profile and the shared world, and the town changes with them.
 */
import { inArea } from '../shared/arena';
import { board, type Job } from '../shared/jobs';
import { BOUNTY, PERK, SHOP, gainXp, type PerkId } from '../shared/progress';
import { Rng } from '../shared/rng';
import { CHAPTER_1, decide, rewardMult } from '../shared/story';
import { SPOTS, SPOT_REACH, townMap, type Spot, type SpotId } from '../shared/town';
import { CLASS_RELICS, HERO, WEAPONS, rollItem, type Item } from '../shared/tuning';
import { ArenaRoom } from '../sim/room';
import { goal, isFinal, newRun, runRoom, tally, type Run } from '../sim/run';
import type { FightEvent, Hero, Intent } from '../sim/types';
import { load, store, type Save } from './save';

export type Mode = 'town' | 'yard' | 'run';
export interface Result { won: boolean; job: Job; gold: number; xp: number; rescued: number; levels: number }

export const ME = 'me';

export class Game {
  mode: Mode = 'town';
  room!: ArenaRoom;
  run: Run | null = null;
  save: Save = load();
  /** Set when a run ends; the UI shows it and clears it. */
  result: Result | null = null;

  constructor() {
    this.enterTown();
  }

  get hero(): Hero {
    return this.room.heroes.find((h) => h.id === ME)!;
  }
  get profile() {
    return this.save.profile;
  }
  get world() {
    return this.save.world;
  }

  /** Dress the hero from the profile; `keep` carries health and relic state between run rooms. */
  private equip(h: Hero, keep?: Hero): void {
    const p = this.profile, cls = WEAPONS[p.weapon].cls;
    h.weapon = p.weapon;
    h.arms = { ...p.arms };
    h.perks = [...p.perks];
    h.maxHp = HERO.hp + (p.perks.includes('tough') ? PERK.tough : 0);
    h.relics = [...CLASS_RELICS[cls]];
    h.relic = h.relics[0];
    h.hp = h.maxHp;
    if (keep) Object.assign(h, { hp: Math.max(1, keep.hp), relic: keep.relic, augments: { ...keep.augments } });
  }

  private place(room: ArenaRoom, at?: { x: number; y: number }, keep?: Hero): void {
    this.room = room;
    const h = room.join(ME);
    if (at) (h.x = at.x), (h.y = at.y);
    this.equip(h, keep);
  }

  enterTown(at?: SpotId): void {
    this.mode = 'town';
    const spot = SPOTS.find((s) => s.id === at);
    this.place(new ArenaRoom(this.world.day, { map: townMap(this.world) }), spot ? { x: spot.x, y: spot.y + 0.8 } : undefined);
  }

  enterYard(): void {
    this.mode = 'yard';
    this.place(new ArenaRoom(this.world.day, { squire: true }));
  }

  /** Today's board, with the chapter's story mission on it until it's done. */
  jobs(): Job[] {
    const list = board(this.world.day);
    return this.world.storyDone.includes(CHAPTER_1.mission.id) ? list : [CHAPTER_1.mission, ...list];
  }

  startJob(job: Job): void {
    this.mode = 'run';
    this.run = newRun(job);
    this.place(runRoom(this.run));
  }

  /** Advance with this frame's intent; returns the events (for effects and sound). */
  step(dt: number, intent: Intent): FightEvent[] {
    const h = this.hero;
    // No changing class in the middle of a job.
    if (this.mode === 'run') intent = { ...intent, classSeq: h.seen.cls };
    this.room.setIntent(ME, intent);
    const ev = this.room.advance(dt);
    for (const e of ev) {
      if (e.k === 'loot') (this.profile.arms = { ...h.arms }), store(this.save);
      if (e.k === 'weapon') (this.profile.weapon = h.weapon), store(this.save);
    }
    if (this.mode === 'yard' && inArea(this.room.map.exit, h.x, h.y)) this.enterTown('yard');
    if (this.mode === 'run' && this.run) {
      tally(this.run, this.room, ev, ME);
      this.room.exitOpen = goal(this.run, this.room).done;
      if (this.run.failed) this.finish(false);
      else if (this.room.exitOpen && inArea(this.room.map.exit, h.x, h.y)) {
        if (isFinal(this.run)) this.finish(true);
        else {
          this.run.index++;
          this.place(runRoom(this.run), undefined, h);
        }
      }
    }
    return ev;
  }

  private finish(won: boolean): void {
    const run = this.run!, p = this.profile, w = this.world;
    const gold = won ? run.gold + Math.round(run.job.reward * rewardMult(w)) : Math.round(run.gold / 2);
    const xp = run.xp + (won ? BOUNTY.objective : 0), rescued = won ? run.rescued : 0;
    p.gold += gold;
    p.runs++;
    const levels = gainXp(p, xp);
    w.rescued += rescued;
    w.day++;
    if (won && run.job.objective === 'story' && !w.storyDone.includes(run.job.id)) w.storyDone.push(run.job.id);
    this.result = { won, job: run.job, gold, xp, rescued, levels };
    this.run = null;
    store(this.save);
    this.enterTown('board');
  }

  /** The town spot the hero is standing at, if any. */
  nearSpot(): Spot | null {
    if (this.mode !== 'town') return null;
    const h = this.hero;
    return SPOTS.find((s) => Math.hypot(s.x - h.x, s.y - h.y) <= SPOT_REACH) ?? null;
  }

  /** Buy a weapon for your class: fine at the smith, forged from the trader. Returns it (or null: too poor). */
  buy(quality: 'fine' | 'forged'): Item | null {
    const p = this.profile, cost = SHOP[quality];
    if (p.gold < cost) return null;
    p.gold -= cost;
    const item = rollItem(new Rng(p.runs * 131 + p.gold * 7 + 5), WEAPONS[this.hero.weapon].cls, quality === 'forged' ? 1 : 0);
    p.arms[item.kit] = item;
    this.hero.arms = { ...p.arms };
    store(this.save);
    return item;
  }

  donate(n: number): boolean {
    if (this.profile.gold < n) return false;
    this.profile.gold -= n;
    this.world.lantern += n;
    store(this.save);
    return true;
  }

  pickPerk(id: PerkId): void {
    const p = this.profile;
    if (p.picks <= 0 || p.perks.includes(id)) return;
    p.perks.push(id);
    p.picks--;
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** The council decides (`voters` present); the town is rebuilt around the hero. */
  decide(choice: string, voters: number): void {
    decide(this.world, choice, voters);
    store(this.save);
    const h = this.hero;
    this.place(new ArenaRoom(this.world.day, { map: townMap(this.world) }), { x: h.x, y: h.y });
  }
}
