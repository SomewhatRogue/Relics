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
import { POTION, POTIONS, type PotionId, CLASS_KITS, CLASS_SKILL, FOUND_RELICS, HERO, abilitiesOf, rollGear, HUNGRY, WANT, type HungryId, nextLevel, reroll, REROLL, STEEL, type ArmorKind, type Augment, type HeroClass, type Item, type RelicId, type WeaponId, WEAPONS } from '../shared/tuning';
import { ArenaRoom } from '../sim/room';
import { newWood, release, skipCut, stepWood, type WoodState } from '../sim/wood';
import { LESSONS, woodMap } from '../shared/wood';
import { PACK } from '../sim/pack';
import { refreshHealth, statsOf } from '../sim/gearstats';
import { goal, interiorRoom, isFinal, newRun, runRoom, tally, type Run } from '../sim/run';
import type { FightEvent, Hero, Intent } from '../sim/types';
import { load, store, type Save } from './save';

export type Mode = 'town' | 'yard' | 'run' | 'wood';
export interface Result { won: boolean; job: Job; gold: number; xp: number; rescued: number; levels: number; relic?: RelicId }
/** Something you can use where you stand: a spot, a person, or a door. */
export interface Near { label: string; talk?: SpotId; arg?: number; key?: string; door?: Block; chest?: number }

export const ME = 'me';
const NAMES: Record<string, string> = { cottage: 'THE COTTAGE', barn: 'THE BARN', home: 'THE HOUSE' };

export class Game {
  mode: Mode = 'town';
  room!: ArenaRoom;
  run: Run | null = null;
  save: Save = load();
  /** The prologue in progress (sim/wood.ts), and whether it's a replay. */
  wood: WoodState | null = null;
  private woodReplay = false;
  /** Someone to greet a hero once (Orla, out of the wood). */
  greeting: string | null = null;
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

  /** Play hero `i`: the prologue wood if they haven't been through it, else back in town. */
  choose(i: number): void {
    this.save.current = i;
    store(this.save);
    this.run = null;
    if (this.profile.prologue) this.enterTown();
    else this.startWood();
  }

  /** The prologue (shared/wood.ts): a replay gives nothing and changes nothing. */
  startWood(replay = false): void {
    this.mode = 'wood';
    this.outside = null;
    this.run = null;
    this.woodReplay = replay;
    const room = new ArenaRoom(7, { map: woodMap() });
    this.place(room, room.map.hero);
    const h = this.hero, cls = this.profile.cls;
    // You come round with nothing but your class's weapon and its skill; a Healer's censer has gone cold.
    Object.assign(h, { relics: abilitiesOf(cls), found: [], cold: cls === 'HEALER', belt: [] });
    h.relic = h.relics[0];
    this.wood = newWood(this.room);
  }

  /** Straight to town, with what the wood would have given (a second hero's choice). */
  skipWood(): void {
    this.giveWood();
    this.enterTown(this.gateSpot());
  }

  /** What the wood leaves you: the javelin, Hew's tally stick, a cold censer for a Healer. */
  private giveWood(): void {
    const p = this.profile;
    if (!this.woodReplay) {
      Object.assign(p, { prologue: true, tally: true, cold: p.cls === 'HEALER' });
      if (!p.relics.includes('javelin')) p.relics.unshift('javelin');
      p.relic ||= 'javelin';
    }
    store(this.save);
  }

  private gateSpot(): { x: number; y: number } {
    const g = townSpots(this.world).find((s) => s.id === 'gate');
    return g ? { x: g.x, y: g.y + 1.6 } : { x: 28, y: 3 };
  }

  /** Out of the wood at the north gate: Orla knows the boots. */
  private finishWood(): void {
    this.giveWood();
    this.wood = null;
    this.greeting = this.woodReplay ? null : 'orla';
    this.enterTown(this.gateSpot());
  }

  /** Where the camera looks during the cutscene: between you and what's happening. */
  cutFocus(): { x: number; y: number } | null {
    const w = this.wood;
    if (!w || w.cut < 0) return null;
    const s = this.room.enemies.find((e) => e.id === w.stoker), n = this.room.map.npcs?.find((x) => x.talk === 'hew'), t = s ?? n;
    const h = this.hero;
    return t ? { x: (h.x + t.x) / 2, y: (h.y + t.y) / 2 } : { x: h.x, y: h.y };
  }

  /** Save the hero now (after a change a panel made). */
  keep(): void {
    store(this.save);
  }

  /** Skip the cutscene (once you've seen it). */
  skipCut(): void {
    if (this.wood && this.wood.cut >= 0 && this.profile.cutSeen) skipCut(this.wood, this.room);
  }

  /** The moves the wood has taught so far (everything outside it). */
  taught(): string[] {
    if (this.mode !== 'wood' || !this.wood) return ['attack', 'roll', 'block', 'relic', 'potion', 'grab'];
    if (this.wood.cut >= 0 || this.wood.wake >= 0) return [];
    return this.wood.stage >= 5 ? ['attack', 'roll', 'block', 'relic', 'potion', 'grab'] : LESSONS[this.wood.stage].moves;
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
    h.glow = p.glow;
    h.belt = [...p.belt];
    h.want = p.want;
    h.cold = p.cold;
    h.purse = p.gold + (this.run?.gold ?? 0);
    h.found = [...p.relics];
    h.perks = [...p.perks];
    h.armor = p.armor;
    h.rings = [...p.rings];
    h.baseHp = HERO.hp + (p.perks.includes('tough') ? PERK.tough : 0);
    h.maxHp = h.baseHp + statsOf(h).health;
    h.relics = abilitiesOf(p.cls, p.relic);
    h.relic = h.relics[0];
    for (const r of h.relics) h.augments[r] = p.augments[r] ?? '';
    h.hp = h.maxHp;
    if (keep) Object.assign(h, { hp: Math.max(1, keep.hp), relic: keep.relic, fed: keep.fed, lastKill: 0 });
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
    // The wood holds the world still for a lesson's card, a freeze-frame, a word of praise.
    if (this.mode === 'wood' && this.wood?.hold && this.holding(intent, dt)) return [];
    // Your class and kit are your hero's: changed at the smith and the relic-wright, never mid-fight.
    intent = { ...intent, classSeq: h.seen.cls, weaponSeq: h.seen.weapon, augmentSeq: h.seen.augment };
    // No fighting in town: no blows, guard, relics or grabs; rolls, dashes and blinks still work.
    if (this.mode === 'town') intent = { ...intent, attack: false, block: false, attackSeq: h.seen.attack, blockSeq: h.seen.block, relicSeq: h.seen.relic, grabSeq: h.seen.grab, potionSeq: h.seen.potion };
    // The wood: only what Hew has taught you so far; nothing at all during the cutscene.
    if (this.mode === 'wood') {
      const t = this.taught(), cut = (this.wood?.cut ?? -1) >= 0;
      intent = {
        ...intent, gearSeq: h.seen.gear, openSeq: h.seen.open,
        ...(cut ? { mx: 0, my: 0 } : {}),
        ...(t.includes('attack') ? {} : { attack: false, attackSeq: h.seen.attack }),
        ...(t.includes('roll') ? {} : { rollSeq: h.seen.roll }),
        ...(t.includes('block') ? {} : { block: false, blockSeq: h.seen.block }),
        ...(t.includes('relic') ? {} : { relicSeq: h.seen.relic, relicPickSeq: h.seen.relicPick }),
        ...(t.includes('potion') ? {} : { potionSeq: h.seen.potion }),
        ...(t.includes('grab') ? {} : { grabSeq: h.seen.grab }),
      };
    }
    this.room.setIntent(ME, intent);
    // The room outside runs on while you're in (its kills still pay); then yours.
    const out = this.outside?.room, outEv = out?.advance(dt) ?? [];
    if (out && this.run) tally(this.run, out, outEv, ME);
    const ev = this.room.advance(dt);
    if (this.mode === 'wood' && this.wood) return this.stepWoodFrame(h, ev, dt);
    this.keepGear(h);
    for (const e of ev) if (e.k === 'spend' && e.id === ME) this.spend(e.n);
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
    // Driven back in the Ransom Coat: all of it, not half.
    const ransom = !won && p.armor?.hungry === 'ransom';
    const gold = won ? run.gold + Math.round(run.job.reward * rewardMult(w)) : ransom ? 0 : Math.round(run.gold / 2);
    if (ransom) p.gold = 0;
    // The Want grows with every job finished in hungry gear, and with what it killed.
    const hungry = this.hungryWorn();
    p.want += hungry.reduce((s, it) => s + HUNGRY[it.hungry as HungryId].want, 0) + (hungry.length ? run.kills * WANT.perKill : 0);
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
    for (const c of this.room.chests) if (c.state === 'shut') all.push({ x: c.x, y: c.y, label: c.chained ? 'A CHAINED CHEST' : 'OPEN THE CHEST', chest: c.id });
    let best: Near | null = null, bd = SPOT_REACH;
    for (const n of all) {
      const d = Math.hypot(n.x - h.x, n.y - h.y) * (n.door ? 1.4 : 1);
      if (d <= bd) (bd = d), (best = n);
    }
    return best;
  }

  /**
   * Buy into the pack: a weapon of kind `kit` (your class's), armor of `armor` weight, or a ring.
   * Fine (green) at the smith, Forged (blue) from the trader. Null: too poor, or the pack is full.
   */
  buy(quality: 'fine' | 'forged', kit: WeaponId = this.profile.weapon, slot: 'weapon' | 'armor' | 'ring' = 'weapon', armor?: ArmorKind): Item | null {
    const p = this.profile, cost = SHOP[quality];
    if (p.gold < cost || p.bag.length >= PACK || (slot === 'weapon' && !CLASS_KITS[p.cls].includes(kit))) return null;
    p.gold -= cost;
    const item = rollGear(new Rng(p.runs * 131 + p.gold * 7 + 5), p.cls, quality, slot, kit, armor);
    p.bag.push(item);
    this.hero.bag = [...p.bag];
    store(this.save);
    return item;
  }

  /** Buy a potion for the belt (Agne, Gannet, Moll, Ivo). False: too poor, or the belt is full. */
  buyPotion(id: PotionId): boolean {
    const p = this.profile, cost = POTIONS[id].price;
    if (p.gold < cost || p.belt.length >= POTION.belt) return false;
    p.gold -= cost;
    p.belt.push(id);
    this.hero.belt = [...p.belt];
    store(this.save);
    return true;
  }

  /** Hungry gear spends gold in a fight: the job's first, then the purse at home. */
  private spend(n: number): void {
    const run = this.run, p = this.profile, fromRun = Math.min(n, run?.gold ?? 0);
    if (run) run.gold -= fromRun;
    p.gold = Math.max(0, p.gold - (n - fromRun));
    store(this.save);
  }

  /** The hungry pieces this hero wears. */
  hungryWorn(): Item[] {
    const p = this.profile, held = p.arms[p.weapon];
    return [held, p.armor, ...p.rings].filter((x): x is Item => !!x && x.quality === 'hungry');
  }

  /** At the church: give a hungry piece up, wherever it is. The Want falls hard. */
  giveUp(it: Item): void {
    const p = this.profile;
    if (it.quality !== 'hungry') return;
    for (const k of Object.keys(p.arms) as WeaponId[]) if (p.arms[k] === it) (delete p.arms[k]), (p.weapon = CLASS_KITS[p.cls][0]);
    if (p.armor === it) p.armor = null;
    p.rings = p.rings.filter((r) => r !== it);
    p.bag = p.bag.filter((r) => r !== it);
    p.want = Math.max(0, p.want - WANT.giveUp);
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** While the wood holds: true to stay held. A card waits for a tap or a key (its press goes nowhere);
   *  a freeze-frame waits for the very move it asks for, which then goes through as the world restarts. */
  private holding(intent: Intent, dt: number): boolean {
    const w = this.wood!, hold = w.hold!, h = this.hero;
    hold.t += dt;
    const pressed = intent.attackSeq !== h.seen.attack || intent.rollSeq !== h.seen.roll || intent.blockSeq !== h.seen.block || intent.relicSeq !== h.seen.relic;
    let done = false;
    if (hold.need === 'time') done = hold.t >= hold.until;
    else if (hold.need === 'continue') done = this.continued || (hold.t > 0.6 && pressed);
    else if (hold.need === 'move') done = hold.t > 0.6 && (Math.hypot(intent.mx, intent.my) > 0.3 || this.continued);
    else if (hold.need === 'roll') done = intent.rollSeq !== h.seen.roll;
    else if (hold.need === 'block') done = intent.blockSeq !== h.seen.block || intent.block;
    else if (hold.need === 'attack') done = intent.attackSeq !== h.seen.attack;
    this.continued = false;
    if (!done) return true;
    release(w);
    // A card's key press only dismissed it.
    if (hold.need === 'continue') Object.assign(h.seen, { attack: intent.attackSeq, roll: intent.rollSeq, block: intent.blockSeq, relic: intent.relicSeq });
    return hold.need === 'continue';
  }

  /** The card's own button (or Enter): go on. */
  continueHold(): void {
    this.continued = true;
  }
  private continued = false;

  /** The wood's own rules after the room's: the lessons, the cutscene, the relic, the road. */
  private stepWoodFrame(h: Hero, ev: FightEvent[], dt: number): FightEvent[] {
    const w = this.wood!, cut = w.cut;
    stepWood(w, this.room, ev, dt, WEAPONS[h.weapon].parryWindow + h.lenience);
    if (cut >= 0 && w.cut < 0 && !this.woodReplay) (this.profile.cutSeen = true), store(this.save);
    // Out of the Stoker: the javelin, on the RELIC button at once.
    if (w.relic && !h.found.includes('javelin')) {
      h.found = ['javelin'];
      h.relics = abilitiesOf(this.profile.cls, 'javelin');
    }
    if (w.done) this.finishWood();
    return ev;
  }

  /** Every piece this hero owns, worn or packed, for the forge. */
  gearList(): Item[] {
    const p = this.profile, held = p.arms[p.weapon];
    return [...(held ? [held] : []), ...(p.armor ? [p.armor] : []), ...p.rings, ...p.bag];
  }

  /** Swap one piece for its changed copy, wherever it is (profile and hero alike). */
  private replace(old: Item, next: Item): void {
    const p = this.profile, h = this.hero, swap = (xs: Item[]) => xs.map((x) => (x === old ? next : x));
    for (const o of [p, h] as { arms: Partial<Record<WeaponId, Item>>; armor: Item | null; rings: Item[]; bag: Item[] }[]) {
      for (const k of Object.keys(o.arms) as WeaponId[]) if (o.arms[k] === old) o.arms[k] = next;
      if (o.armor === old) o.armor = next;
      o.rings = swap(o.rings);
      o.bag = swap(o.bag);
    }
    refreshHealth(h);
    store(this.save);
  }

  /** Halvard: one level up, for gold and steel. */
  upgrade(it: Item): boolean {
    const p = this.profile, cost = nextLevel(it);
    if (!cost || p.gold < cost.gold || p.steel < cost.steel) return false;
    p.gold -= cost.gold;
    p.steel -= cost.steel;
    this.replace(it, { ...it, level: (it.level ?? 0) + 1 });
    return true;
  }

  /** Halvard: melt a packed piece down for steel (never a hungry one). */
  melt(it: Item): boolean {
    const p = this.profile, i = p.bag.indexOf(it);
    if (i < 0 || it.quality === 'hungry') return false;
    p.bag.splice(i, 1);
    this.hero.bag = [...p.bag];
    p.steel += STEEL[it.quality];
    store(this.save);
    return true;
  }

  /** Ivo: reroll modifier `k` on a green, blue or purple piece. */
  rerollMod(it: Item, k: number): boolean {
    const p = this.profile;
    if (p.gold < REROLL || it.quality === 'plain' || it.quality === 'hungry' || !it.mods?.[k]) return false;
    p.gold -= REROLL;
    this.replace(it, reroll(new Rng(p.runs * 97 + p.gold * 13 + k), it, k, p.cls));
    return true;
  }

  /** The room changed what's in hand, in the pack, or carried: the hero's save follows. */
  private keepGear(h: Hero): void {
    const p = this.profile, relic = h.relics[1] ?? '';
    if (h.weapon === p.weapon && h.bag.length === p.bag.length && h.arms[h.weapon] === p.arms[p.weapon] && relic === p.relic && h.glow === p.glow && h.armor === p.armor && h.rings.join() === p.rings.join() && h.rings.every((r, i) => r === p.rings[i]) && h.rings.length === p.rings.length && h.belt.join() === p.belt.join() && h.bag.every((it, i) => it === p.bag[i])) return;
    Object.assign(p, { weapon: h.weapon, arms: { ...h.arms }, bag: [...h.bag], relic, glow: h.glow, belt: [...h.belt], armor: h.armor, rings: [...h.rings] });
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
    // The Ransom Coat won't let you give.
    if (this.profile.gold < n || this.profile.armor?.hungry === 'ransom') return false;
    this.profile.gold -= n;
    this.profile.want = Math.max(0, this.profile.want - n * WANT.perGold);
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
