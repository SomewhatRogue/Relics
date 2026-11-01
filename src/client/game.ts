/**
 * The loop: Wickhold, the buildings, the Training Yard, and runs. You play one of your heroes (class
 * chosen when they were made, never changed). The town is a room you walk around; walk up into a door
 * to go in; taking a job starts a run (room after room until the job is done or you're driven back);
 * the results come home to the hero and the shared world, and the town changes with them.
 */
import { doorAt, inArea, npcAt, type Area, type Block } from '../shared/arena';
import { townInterior } from '../shared/interiors';
import { board, type Job } from '../shared/jobs';
import { workDone, WORK_ORDER, type WorkId } from '../shared/works';
import { contribute, type Contribution } from '../shared/worldsync';
import { BOUNTY, HERO_SLOTS, PERK, SHOP, gainXp, newProfile, type PerkId, type Profile } from '../shared/progress';
import { Rng } from '../shared/rng';
import { CHAPTER_1, QUORUM, rewardMult, type WorldState } from '../shared/story';
import { SPOT_REACH, TOWN_PROPS, housesFor, townMap, townSpots, type SpotId } from '../shared/town';
import { CLASS_KITS, CLASS_SKILL, FOUND_RELICS, HERO, abilitiesOf, rollItem, type Augment, type HeroClass, type Item, type RelicId, type WeaponId } from '../shared/tuning';
import { ArenaRoom } from '../sim/room';
import { PACK } from '../sim/pack';
import { goal, interiorRoom, isFinal, newRun, runRoom, tally, type Run } from '../sim/run';
import type { FightEvent, Hero, Intent } from '../sim/types';
import { load, store, type Save } from './save';

export type Mode = 'town' | 'yard' | 'run';
export interface Result { won: boolean; job: Job; gold: number; xp: number; rescued: number; levels: number; relic?: RelicId }
/** Something you can use where you stand: a spot, a person, or a door. */
export interface Near { label: string; talk?: SpotId; arg?: number; key?: string; door?: Block }

export const ME = 'me';
const NAMES: Record<string, string> = { cottage: 'THE COTTAGE', barn: 'THE BARN', home: 'THE HOUSE' };

export class Game {
  mode: Mode = 'town';
  room!: ArenaRoom;
  run: Run | null = null;
  save: Save = load();
  /** Set when a run ends; the UI shows it and clears it. */
  result: Result | null = null;
  /**
   * Inside a building: the room outside (it keeps running: fires burn, dens breed), the door you came
   * in by, and your hero there, kept aside. Online, the party leader runs every room someone is in.
   */
  outside: { room: ArenaRoom; door: Block; hero: Hero } | null = null;
  /** A run room's buildings, once entered (their goblins stay dead). */
  private insides = new Map<Block, ArenaRoom>();
  /** The line to the shared world (set by the page; none in tests). */
  link: { online: boolean; send(c: Contribution): void } | null = null;
  /** Played before a hero is chosen (the title screen's backdrop, and the tests). */
  private scratch = newProfile();

  constructor() {
    this.enterTown();
  }

  get hero(): Hero {
    return this.room.heroes.find((h) => h.id === ME)!;
  }
  get profile(): Profile {
    return this.save.heroes[this.save.current] ?? this.scratch;
  }
  get world() {
    return this.save.world;
  }
  /** The room the run's goal is judged on (outside, when you're in a cottage). */
  get fightRoom(): ArenaRoom {
    return this.outside?.room ?? this.room;
  }

  /** Play hero `i`; back in town. */
  choose(i: number): void {
    this.save.current = i;
    store(this.save);
    this.run = null;
    this.enterTown();
  }
  /** Make a hero (class for life); returns its slot, or -1 when all three are taken. */
  create(cls: HeroClass, name: string): number {
    if (this.save.heroes.length >= HERO_SLOTS) return -1;
    this.save.heroes.push(newProfile(cls, name.trim().toUpperCase().slice(0, 12) || 'HERO'));
    this.choose(this.save.heroes.length - 1);
    return this.save.current;
  }
  retire(i: number): void {
    this.save.heroes.splice(i, 1);
    this.save.current = -1;
    store(this.save);
  }

  /** Dress the hero from the profile; `keep` carries health and the relic in hand between run rooms. */
  private equip(h: Hero, keep?: Hero): void {
    const p = this.profile;
    h.weapon = p.weapon;
    h.arms = { ...p.arms };
    h.bag = [...p.bag];
    h.found = [...p.relics];
    h.perks = [...p.perks];
    h.maxHp = HERO.hp + (p.perks.includes('tough') ? PERK.tough : 0);
    h.relics = abilitiesOf(p.cls, p.relic);
    h.relic = h.relics[0];
    for (const r of h.relics) h.augments[r] = p.augments[r] ?? '';
    h.hp = h.maxHp;
    if (keep) Object.assign(h, { hp: Math.max(1, keep.hp), relic: keep.relic });
  }

  private place(room: ArenaRoom, at?: { x: number; y: number }, keep?: Hero): void {
    this.room = room;
    const h = room.join(ME);
    if (at) (h.x = at.x), (h.y = at.y);
    this.equip(h, keep);
  }

  /** Back to Wickhold, at `at` (in front of a door) or the square. */
  enterTown(at?: { x: number; y: number }): void {
    this.mode = 'town';
    this.outside = null;
    this.place(this.townRoom(), at);
  }

  private townRoom(): ArenaRoom {
    return new ArenaRoom(this.world.day, { map: townMap(this.world), furniture: TOWN_PROPS });
  }

  enterYard(): void {
    this.outside = null;
    this.mode = 'yard';
    this.place(new ArenaRoom(this.world.day, { squire: true }));
  }

  /** Go in through a door: a Wickhold building, or a cottage or barn on a job. */
  enter(b: Block): void {
    if (!b.door || b.ruined || (b.burning ?? -1) >= 0) return;
    const out = this.room, h = this.hero;
    let inside = this.insides.get(b);
    if (!inside) {
      if (this.mode === 'run' && this.run) inside = interiorRoom(this.run, out.map.blocks.indexOf(b), b.door);
      else (inside = new ArenaRoom(this.world.day, { map: townInterior(b.door, this.world) })), (inside.exitOpen = true);
      if (this.mode === 'run') this.insides.set(b, inside);
    }
    out.heroes.splice(out.heroes.indexOf(h), 1);
    this.outside = { room: out, door: b, hero: h };
    this.place(inside, inside.map.hero, h);
  }

  /** Back out of the door you came in by. */
  leave(): void {
    const o = this.outside!, inner = this.hero, d = doorAt(o.door), h = o.hero;
    this.outside = null;
    this.room = o.room;
    this.room.heroes.push(h);
    Object.assign(h, { x: d.x, y: d.y + 0.5, fx: 0, fy: 1, hp: Math.max(1, inner.hp), relic: inner.relic, act: 'idle', actT: 0 });
    this.room.prev.set('h:' + ME, [h.x, h.y]);
  }

  /** Today's board, with the chapter's story mission on it until it's done. */
  jobs(): Job[] {
    const list = board(this.world.day, workDone(this.world, 'sewers'));
    return this.world.storyDone.includes(CHAPTER_1.mission.id) ? list : [CHAPTER_1.mission, ...list];
  }

  startJob(job: Job): void {
    this.mode = 'run';
    this.outside = null;
    this.insides.clear();
    this.run = newRun(job);
    this.place(runRoom(this.run));
    // A coin in the well: you set out blessed.
    if (this.profile.wish) (this.hero.blessedUntil = 20), (this.profile.wish = false), store(this.save);
  }

  /** Advance with this frame's intent; returns the events (for effects and sound). */
  step(dt: number, intent: Intent): FightEvent[] {
    const h = this.hero;
    // Your class and kit are your hero's: changed at the smith and the relic-wright, never mid-fight.
    intent = { ...intent, classSeq: h.seen.cls, weaponSeq: h.seen.weapon, augmentSeq: h.seen.augment };
    // No fighting in town: no blows, guard, relics or grabs; rolls, dashes and blinks still work.
    if (this.mode === 'town') intent = { ...intent, attack: false, block: false, attackSeq: h.seen.attack, blockSeq: h.seen.block, relicSeq: h.seen.relic, grabSeq: h.seen.grab };
    this.room.setIntent(ME, intent);
    // The room outside runs on while you're in (its kills still pay); then yours.
    const out = this.outside?.room, outEv = out?.advance(dt) ?? [];
    if (out && this.run) tally(this.run, out, outEv, ME);
    const ev = this.room.advance(dt);
    this.keepGear(h);
    // Walk up into a door to go in; out the bottom of a room to come back out.
    const door = this.near()?.door;
    if (door && intent.my < -0.5 && Math.abs(h.x - doorAt(door).x) < 0.7) this.enter(door);
    else if (this.outside && inArea(this.room.map.exit, h.x, h.y)) this.leave();
    else if (this.mode === 'yard' && inArea(this.room.map.exit, h.x, h.y)) this.enterTown(this.doorOf('hall'));
    if (this.mode === 'run' && this.run) {
      tally(this.run, this.room, ev, ME);
      if (!this.outside) this.room.exitOpen = goal(this.run, this.room).done;
      if (this.run.failed) this.finish(false);
      else if (!this.outside && this.room.exitOpen) {
        // The way on takes the whole party, standing in it together; at a fork, the road they stand in.
        const road = this.room.map.roads?.find((r) => this.together(r.area));
        if (road || this.together(this.room.map.exit)) {
          if (isFinal(this.run)) this.finish(true);
          else {
            this.run.index++;
            if (road) this.run.roads[this.run.index] = road.road;
            this.insides.clear();
            this.place(runRoom(this.run), undefined, h);
          }
        }
      }
    }
    return ev;
  }

  /** Every player in the room (not the squire, not anyone down) stands in `a`. */
  together(a: Area | null): boolean {
    const ps = this.room.heroes.filter((x) => x.id !== 'squire' && x.act !== 'down');
    return !!a && ps.length > 0 && ps.every((x) => inArea(a, x.x, x.y));
  }

  /** In front of a Wickhold building's door. */
  private doorOf(door: string): { x: number; y: number } | undefined {
    const b = townMap(this.world).blocks.find((x) => x.door === door);
    return b && { x: doorAt(b).x, y: doorAt(b).y + 0.5 };
  }

  private finish(won: boolean): void {
    const run = this.run!, p = this.profile, w = this.world;
    const gold = won ? run.gold + Math.round(run.job.reward * rewardMult(w)) : Math.round(run.gold / 2);
    const xp = run.xp + (won ? BOUNTY.objective : 0), rescued = won ? run.rescued : 0;
    p.gold += gold;
    p.runs++;
    const levels = gainXp(p, xp);
    // The bottom of a deep dive: a relic pried out of the butcher (one you don't have; the first is carried at once).
    const relic = won && run.job.deep ? FOUND_RELICS.find((r) => !p.relics.includes(r)) : undefined;
    if (relic) (p.relics.push(relic), p.relic ||= relic);
    this.result = { won, job: run.job, gold, xp, rescued, levels, relic };
    this.run = null;
    this.give({
      stats: { jobs: won ? 1 : 0, saved: rescued, kills: run.kills, dens: run.dens }, rescued, dens: run.dens, days: 1,
      story: won && run.job.objective === 'story' ? run.job.id : undefined,
    });
    this.enterTown({ x: 24.1, y: 14.8 });
  }

  /** The nearest thing to use where the hero stands: a person, a door, a spot in the open. */
  near(): Near | null {
    const h = this.hero, map = this.room.map, all: (Near & { x: number; y: number })[] = [];
    for (const n of map.npcs ?? []) {
      const at = npcAt(n, this.room.time);
      all.push({ x: at.x, y: at.y, label: n.name, talk: n.talk as SpotId, arg: n.arg });
    }
    for (const b of map.blocks) {
      if (!b.door || b.ruined || (b.burning ?? -1) >= 0) continue;
      const d = doorAt(b), name = b.label ?? NAMES[b.door.split(':')[0]] ?? 'THE BUILDING';
      all.push(b.locked ? { x: d.x, y: d.y, label: name + ' (BARRED)', talk: 'locked', key: b.door } : { x: d.x, y: d.y, label: 'ENTER ' + name, door: b });
    }
    if (this.mode === 'town' && !this.outside) for (const s of townSpots(this.world)) all.push({ x: s.x, y: s.y, label: s.label, talk: s.id, key: s.key });
    let best: Near | null = null, bd = SPOT_REACH;
    for (const n of all) {
      const d = Math.hypot(n.x - h.x, n.y - h.y) * (n.door ? 1.4 : 1);
      if (d <= bd) (bd = d), (best = n);
    }
    return best;
  }

  /** Buy a weapon of kind `kit` for your class into the pack: fine at the smith, forged from the trader. Null: too poor, or the pack is full. */
  buy(quality: 'fine' | 'forged', kit: WeaponId = this.profile.weapon): Item | null {
    const p = this.profile, cost = SHOP[quality];
    if (p.gold < cost || p.bag.length >= PACK || !CLASS_KITS[p.cls].includes(kit)) return null;
    p.gold -= cost;
    const item = rollItem(new Rng(p.runs * 131 + p.gold * 7 + 5), p.cls, quality === 'forged' ? 1 : 0, kit);
    p.bag.push(item);
    this.hero.bag = [...p.bag];
    store(this.save);
    return item;
  }

  /** The room changed what's in hand, in the pack, or carried: the hero's save follows. */
  private keepGear(h: Hero): void {
    const p = this.profile, relic = h.relics[1] ?? '';
    if (h.weapon === p.weapon && h.bag.length === p.bag.length && h.arms[h.weapon] === p.arms[p.weapon] && relic === p.relic && h.bag.every((it, i) => it === p.bag[i])) return;
    Object.assign(p, { weapon: h.weapon, arms: { ...h.arms }, bag: [...h.bag], relic });
    store(this.save);
  }

  /** Carry a relic you've found into your next job (at the relic-wright). */
  carry(r: RelicId): void {
    const p = this.profile;
    if (!p.relics.includes(r)) return;
    p.relic = r;
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** The relic-wright fits an element to a relic (or takes it off, free). */
  fitAugment(r: RelicId, el: Augment): boolean {
    const p = this.profile, cost = el ? SHOP.augment : 0;
    if (p.gold < cost || (r !== CLASS_SKILL[p.cls] && !p.relics.includes(r))) return false;
    p.gold -= cost;
    p.augments[r] = el;
    this.hero.augments[r] = el;
    store(this.save);
    return true;
  }

  /**
   * What this hero does to the shared world: applied here at once (the council needs a quorum online;
   * alone and offline, your vote decides), sent to the world server, and on the hero's own line.
   */
  give(c: Omit<Contribution, 'hero'>): void {
    const p = this.profile, before = this.townKey();
    const full: Contribution = { ...c, hero: { id: p.id, name: p.name, cls: p.cls } };
    contribute(this.world, full, this.link?.online ? QUORUM : 1);
    for (const [k, n] of Object.entries(c.stats ?? {})) p.stats[k as keyof typeof p.stats] += n ?? 0;
    store(this.save);
    this.link?.send(full);
    if (this.townKey() !== before) this.rebuildTown();
  }

  /** The world as the server has it now (another player's gift, a vote, the next day). */
  syncWorld(w: WorldState): void {
    const before = this.townKey();
    this.save.world = { ...this.world, ...w };
    store(this.save);
    if (this.townKey() !== before) this.rebuildTown();
  }

  /** What shapes the town: houses lit, the council's choices, the works finished. */
  private townKey(): string {
    const w = this.world;
    return JSON.stringify([housesFor(w.rescued), w.flags, WORK_ORDER.map((k) => workDone(w, k))]);
  }

  /** The town rebuilt around you (outside, or the street you'll step back out into). */
  private rebuildTown(): void {
    if (this.mode !== 'town') return;
    if (!this.outside) return this.place(this.townRoom(), { x: this.hero.x, y: this.hero.y });
    const town = this.townRoom(), h = town.join(ME), door = this.outside.door.door;
    this.equip(h);
    town.heroes.splice(town.heroes.indexOf(h), 1);
    this.outside = { room: town, door: town.map.blocks.find((b) => b.door === door) ?? this.outside.door, hero: h };
  }

  /** Gold to the Last Lantern. */
  donate(n: number): boolean {
    if (this.profile.gold < n) return false;
    this.profile.gold -= n;
    this.give({ lantern: n, stats: { given: n } });
    return true;
  }

  /** Gold to a town work. */
  fund(id: WorkId, n: number): boolean {
    if (this.profile.gold < n || workDone(this.world, id)) return false;
    this.profile.gold -= n;
    this.give({ works: { [id]: n }, stats: { given: n } });
    return true;
  }

  /** A coin in the well: the next job starts blessed. */
  wish(): boolean {
    const p = this.profile;
    if (p.gold < SHOP.wish || p.wish) return false;
    p.gold -= SHOP.wish;
    p.wish = true;
    store(this.save);
    return true;
  }

  /**
   * Knucklebones with Dicer Moll: two dice each, high roll takes the pot. Ties go to Moll, unless
   * you're a Rogue (it takes one to know one). Returns the dice and whether you won.
   */
  dice(bet: number): { you: number[]; moll: number[]; won: boolean } | null {
    const p = this.profile;
    if (p.gold < bet || bet <= 0) return null;
    const r = new Rng(p.id.length * 7919 + p.dice * 104729 + p.gold * 31 + p.runs);
    p.dice++;
    const roll = () => [1 + r.int(6), 1 + r.int(6)], you = roll(), moll = roll(), a = you[0] + you[1], b = moll[0] + moll[1];
    const won = a > b || (a === b && p.cls === 'ROGUE');
    p.gold += won ? bet : -bet;
    store(this.save);
    return { you, moll, won };
  }

  pickPerk(id: PerkId): void {
    const p = this.profile;
    if (p.picks <= 0 || p.perks.includes(id)) return;
    p.perks.push(id);
    p.picks--;
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** Your vote at the council (it decides once enough heroes have voted). */
  vote(choice: string): void {
    this.give({ vote: choice });
  }
}
