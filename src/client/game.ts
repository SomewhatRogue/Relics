/**
 * The loop: Wickhold, the buildings, the Training Yard, and runs. You play one of your heroes (class
 * chosen when they were made, never changed). The town is a room you walk around; walk up into a door
 * to go in; taking a job starts a run (room after room until the job is done or you're driven back);
 * the results come home to the hero and the shared world, and the town changes with them.
 */
import { doorAt, inArea, npcAt, type Area, type Block, type Npc, type Theme } from '../shared/arena';
import { townInterior } from '../shared/interiors';
import { board, type Job } from '../shared/jobs';
import { WORKS, workDone, workOpen, workProgress, WORK_ORDER, type WorkId } from '../shared/works';
import { contribute, type Contribution } from '../shared/worldsync';
import { BOUNTY, HERO_SLOTS, PERK, SHOP, gainXp, newProfile, type PerkId, type Profile } from '../shared/progress';
import { Rng } from '../shared/rng';
import { CHAPTER_1, QUORUM, rewardMult, type WorldState } from '../shared/story';
import { SPOT_REACH, TOWN_PROPS, housesFor, townMap, townSpots, type SpotId } from '../shared/town';
import { LEAVES, TEACHES, drillCap, drillPrice, type DrillId, POTION, POTIONS, type PotionId, CLASS_KITS, CLASS_SKILL, SKILL_CHOICES, FOUND_RELICS, HERO, abilitiesOf, rollGear, HUNGRY, WANT, type HungryId, nextLevel, reroll, REROLL, STEEL, sellValue, giveValue, type ArmorKind, type Augment, type HeroClass, type Item, type RelicId, type WeaponId, WEAPONS } from '../shared/tuning';
import { ArenaRoom } from '../sim/room';
import { lessonOf, newWood, release, skipCut, stepWood, type WoodState } from '../sim/wood';
import { woodMap, WOOD_PROPS } from '../shared/wood';
import { PACK } from '../sim/pack';
import { refreshHealth, statsOf } from '../sim/gearstats';
import { goal, interiorRoom, isFinal, newRun, runRoom, tally, type Run } from '../sim/run';
import { NO_INTENT, knows, type FightEvent, type Hero, type Intent, type Learned } from '../sim/types';
import { load, store, type Save } from './save';
import { treasure } from '../shared/treasure';
/** What a piece of treasure that won't fit in the pack fetches. */
const TREASURE_SOLD = 20;
import { CoopHost, loadRoom, type CoopGuest, type Friend } from './coop';
import { forgetSession, keepSession } from './session';
import { dayPhase, townLight } from '../shared/daylight';
import { Followers } from './followers';
import type { Parties } from './parties';

export type Mode = 'town' | 'yard' | 'run' | 'wood';
export interface Result { won: boolean; job: Job; gold: number; xp: number; rescued: number; levels: number; relic?: RelicId; treasure: Item[]; sold: Item[] }
/** Something you can use where you stand: a spot, a person, or a door. */
export interface Near { label: string; talk?: SpotId; arg?: number; key?: string; door?: Block; chest?: number; npc?: Npc }

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
  /** Online with friends: leading (this browser runs the job: coop.ts) or following a leader's. */
  coop: CoopHost | null = null;
  remote: CoopGuest | null = null;
  /** Parties at the board (online only). */
  parties: Parties | null = null;
  /** Counts up each time the room changes (friends rebuild their copy when it does). */
  roomKey = 0;
  /** The town's own light, before the day turns it (daylight.ts). */
  private townTheme: Theme | null = null;
  /** Goblins following you through a door (followers.ts). */
  private followers = new Followers();
  /** The last input given (a new room's hero takes its presses as already seen). */
  private lastIntent: Intent = NO_INTENT;
  /** Friends whose press counters have been matched to their hero's (so no old press fires). */
  private synced = new Set<string>();

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
    const room = new ArenaRoom(7, { map: woodMap(), furniture: WOOD_PROPS });
    this.place(room, room.map.hero);
    const h = this.hero, cls = this.profile.cls;
    // You come round with nothing but your class's weapon (your skill is your trainer's to teach); a
    // Healer's censer has gone cold. (A Ranger's hound is with them: it lay by them all night.)
    Object.assign(h, { relics: abilitiesOf(cls), found: [], cold: cls === 'HEALER', belt: [], learned: this.profile.learned ?? [], calmHound: true, look: this.profile.look ?? 0 });
    h.relic = h.relics[0];
    this.wood = newWood(this.room, cls);
  }

  /** Straight to town, with what the wood would have given (a second hero's choice). */
  skipWood(): void {
    this.wood = null;
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
    // The camera stays on Hew, then on Hew and the thing that has him.
    const s = this.room.enemies.find((e) => e.id === w.stoker), n = this.room.map.npcs?.find((x) => x.talk === 'hew');
    if (s && n) return { x: (s.x + n.x) / 2, y: (s.y + n.y) / 2 - 0.4 };
    const t = s ?? n ?? this.hero;
    return { x: t.x, y: t.y - 0.4 };
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
    return this.wood.stage >= 5 ? ['attack', 'roll', 'block', 'relic', 'potion', 'grab'] : lessonOf(this.wood).moves.filter((m) => m !== 'grab' || this.wood!.stage > 0 || this.wood!.more);
  }
  /** Make a hero (class for life); returns its slot, or -1 when all three are taken. */
  create(cls: HeroClass, name: string, look = 0): number {
    if (this.save.heroes.length >= HERO_SLOTS) return -1;
    this.save.heroes.push({ ...newProfile(cls, name.trim().toUpperCase().slice(0, 12) || 'HERO'), look });
    this.choose(this.save.heroes.length - 1);
    return this.save.current;
  }
  /** Heroes brought from another device (a recovery code): they replace these, kept as saved there. */
  adopt(s: Save): void {
    this.save = { ...s, current: -1 };
    store(this.save, s.savedAt);
    this.run = null;
    this.wood = null;
    this.enterTown();
  }
  retire(i: number): void {
    this.save.heroes.splice(i, 1);
    this.save.current = -1;
    store(this.save);
  }

  /** Dress the hero from the profile; `keep` carries health and the relic in hand between run rooms. */
  private equip(h: Hero, keep?: Hero, p: Profile = this.profile): void {
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
    h.drills = p.drills;
    h.armor = p.armor;
    h.rings = [...p.rings];
    h.baseHp = HERO.hp + (p.perks.includes('tough') ? PERK.tough : 0);
    h.maxHp = h.baseHp + statsOf(h).health;
    h.relics = abilitiesOf(p.cls, p.relic, p.skill);
    h.learned = p.learned;
    h.look = p.look ?? 0;
    // Your skill in hand, or (not yet taught it) the relic you carry.
    h.relic = knows(h, 'skill') ? h.relics[0] : (h.relics[1] ?? h.relics[0]);
    for (const r of h.relics) h.augments[r] = p.augments[r] ?? '';
    h.hp = h.maxHp;
    if (keep) Object.assign(h, { hp: Math.max(1, keep.hp), relic: keep.relic, fed: keep.fed, lastKill: 0 });
  }

  private place(room: ArenaRoom, at?: { x: number; y: number }, keep?: Hero): void {
    const from = this.room;
    this.room = room;
    this.roomKey++;
    const h = room.join(ME);
    if (at) (h.x = at.x), (h.y = at.y);
    this.equip(h, keep);
    // A fresh hero in the new room: every press made so far counts as seen (so the last swing or
    // roll doesn't fire again on the doorstep), and it starts standing still.
    syncSeen(h, this.lastIntent);
    Object.assign(h, { act: h.act === 'down' ? 'down' : 'idle', actT: 0, kvx: 0, kvy: 0, rollQueuedAt: -9, attackQueuedAt: -9, relicQueuedAt: -9, grabQueuedAt: -9 });
    // Leading a party: your friends come with you, each with the health they had.
    for (const [id, f] of this.coop?.friends ?? []) {
      const old = from?.heroes.find((x) => x.id === id);
      if (old && from !== room) from.heroes.splice(from.heroes.indexOf(old), 1);
      if (!f.gone) this.bring(id, f, old);
    }
  }

  /** A friend's hero, next to yours in this room (dressed from their own profile). */
  private bring(id: string, f: Friend, keep?: Hero): void {
    const me = this.hero;
    let h: Hero;
    // Their own hero, carried over as it is (health, potions, cooldowns); a new one dressed from their profile.
    if (keep) this.room.heroes.push((h = keep));
    else if (f.profile) (h = this.room.join(id)), this.equip(h, undefined, f.profile);
    else return;
    const n = this.room.heroes.indexOf(h);
    Object.assign(h, { x: me.x + (n % 2 ? 0.8 : -0.8), y: me.y + 0.3 * n, fx: me.fx, fy: me.fy, kvx: 0, kvy: 0, act: h.act === 'down' ? 'down' : 'idle', actT: h.act === 'down' ? h.actT : 0, tag: f.name });
    this.room.prev.set('h:' + id, [h.x, h.y]);
  }

  /** A friend arrives in the job (or back after losing their signal: their hero is still here). */
  addFriend(id: string, f: Friend): void {
    if (this.mode !== 'run' || this.room.heroes.some((x) => x.id === id)) return;
    this.synced.delete(id);
    this.bring(id, f);
  }

  /** A friend gone a minute: their hero leaves the fight. */
  dropFriend(id: string): void {
    for (const r of [this.room, this.outside?.room]) {
      const i = r ? r.heroes.findIndex((x) => x.id === id) : -1;
      if (r && i >= 0) r.heroes.splice(i, 1);
    }
  }

  goalText(): string {
    return this.run ? goal(this.run, this.fightRoom).text : '';
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
    this.hero.calmHound = true;
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
    // On a job, the goblins after you come in after you.
    if (this.mode === 'run') this.followers.through(out, inside, h, inside.map.hero.x, inside.map.hero.y);
    this.place(inside, inside.map.hero, h);
  }

  /** Back out of the door you came in by. */
  leave(): void {
    const o = this.outside!, inner = this.hero, d = doorAt(o.door), h = o.hero;
    // ...and out after you.
    if (this.mode === 'run') this.followers.through(this.room, o.room, inner, d.x, d.y + 0.6);
    this.outside = null;
    this.room = o.room;
    this.room.heroes.push(h);
    Object.assign(h, { x: d.x, y: d.y + 0.5, fx: 0, fy: 1, hp: Math.max(1, inner.hp), relic: inner.relic, act: 'idle', actT: 0, kvx: 0, kvy: 0, rollQueuedAt: -9, attackQueuedAt: -9, relicQueuedAt: -9, grabQueuedAt: -9 });
    syncSeen(h, this.lastIntent);
    this.room.prev.set('h:' + ME, [h.x, h.y]);
    this.roomKey++;
    // Your friends come back out with you.
    for (const [id, f] of this.coop?.friends ?? []) {
      const old = o.room.heroes.find((x) => x.id === id) ? undefined : this.insideHero(id);
      if (old && !f.gone) this.bring(id, f, old);
    }
  }

  private insideHero(id: string): Hero | undefined {
    for (const r of this.insides.values()) {
      const i = r.heroes.findIndex((x) => x.id === id);
      if (i >= 0) return r.heroes.splice(i, 1)[0];
    }
    return undefined;
  }

  /** Today's board, with the chapter's story mission on it until it's done. */
  jobs(): Job[] {
    const list = board(this.world.day, workDone(this.world, 'sewers'));
    return this.world.storyDone.includes(CHAPTER_1.mission.id) ? list : [CHAPTER_1.mission, ...list];
  }

  startJob(job: Job, party = 1): void {
    this.followers.clear();
    this.mode = 'run';
    this.outside = null;
    this.insides.clear();
    this.run = newRun(job);
    this.run.party = party;
    this.place(runRoom(this.run));
    // A coin in the well: you set out blessed.
    if (this.profile.wish) (this.hero.blessedUntil = 20), (this.profile.wish = false), store(this.save);
  }

  /** Advance with this frame's intent; returns the events (for effects and sound). */
  step(dt: number, intent: Intent): FightEvent[] {
    // Following a friend's job: their room is drawn here; nothing runs in this browser.
    if (this.remote) return this.stepRemote();
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
    this.lastIntent = intent;
    // Leading a party: each friend's latest input (their old presses matched first, so none fires).
    for (const [id, f] of this.coop?.friends ?? []) {
      const fh = this.room.heroes.find((x) => x.id === id);
      if (!fh) continue;
      if (!this.synced.has(id) && f.intent !== null) (this.synced.add(id), syncSeen(fh, f.intent));
      this.room.setIntent(id, { ...f.intent, classSeq: fh.seen.cls, weaponSeq: fh.seen.weapon, augmentSeq: fh.seen.augment });
    }
    // The room outside runs on while you're in (its kills still pay); then yours.
    const out = this.outside?.room, outEv = out?.advance(dt) ?? [];
    if (out && this.run) tally(this.run, out, outEv, ME);
    const ev = this.room.advance(dt);
    this.followers.step(this.room);
    // Wickhold keeps the shared day: the light turns with the clock, the same on every screen.
    if (this.mode === 'town' && !this.outside) this.room.map.theme = townLight(this.townTheme ??= this.room.map.theme, dayPhase(Date.now()));
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
            // The goblins ahead are counted for whoever's still with you.
            this.run.party = 1 + [...(this.coop?.friends.values() ?? [])].filter((f) => f.profile && !f.gone).length;
            this.place(runRoom(this.run), undefined, h);
          }
        }
      }
    }
    return ev;
  }

  /** Test hook: end the run now (won or lost), as if its last room were done. */
  endForTest(won: boolean): void {
    if (this.run) this.finish(won);
  }

  /** Leading a party: set out, and this browser runs the job for everyone in it. */
  setOut(): void {
    const go = this.parties?.setOut();
    if (!go) return;
    this.coop = new CoopHost(go.room, this.profile.id, this.profile.name, this, go.members);
    this.startJob(go.job, go.members.length);
    keepSession({ code: go.room, lead: '', job: go.job, hero: this.profile.id });
  }

  /** Follow a friend's job (they lead): their room is drawn here as it comes. */
  startRemote(g: CoopGuest): void {
    this.mode = 'run';
    this.outside = null;
    this.insides.clear();
    this.remote = g;
    // Until the leader's room arrives: the job as it was posted.
    this.run = newRun(g.job);
    keepSession({ code: g.code, lead: g.lead, job: g.job, hero: this.profile.id });
  }

  /** The leader's gone: take their job on from the last whole job they sent, and lead it. */
  private takeOver(g: CoopGuest): void {
    // Their `me` is them again; mine is me.
    const o = JSON.parse(g.save!.split('"me"').join(`"${g.lead}"`).split(`"${g.myId}"`).join('"me"')) as { run: Run; room: Record<string, unknown>; members: [string, string][] };
    g.close();
    this.remote = null;
    this.outside = null;
    this.insides.clear();
    this.run = o.run;
    this.room = loadRoom(o.room);
    this.roomKey += 2;
    this.synced.clear();
    const members = o.members.map(([id, name]) => [id === 'me' ? g.myId : id, name] as [string, string]);
    this.coop = new CoopHost(g.code, g.myId, this.profile.name, this, members, 'take');
    keepSession({ code: g.code, lead: '', job: o.run.job, hero: this.profile.id });
  }

  private stepRemote(): FightEvent[] {
    const g = this.remote!, now = performance.now() / 1000;
    // Their room once it has me in it (until then, the town stands still behind the wait).
    if (g.room?.heroes.some((x) => x.id === ME)) (this.room = g.room), (this.run = g.run ?? this.run), this.keepRemoteGear(this.hero);
    const ev = g.take();
    if (g.shouldTake(now)) return this.takeOver(g), ev;
    const end = g.ended ?? (g.lost(now) ? { won: false, run: g.run ?? newRun(g.job) } : null);
    if (end) {
      g.close();
      this.remote = null;
      this.run = end.run;
      this.finish(end.won, true);
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

  /** The run's over. `followed`: it was a friend's job (they write it on the board, not you). */
  private finish(won: boolean, followed = false): void {
    const run = this.run!, p = this.profile, w = this.world;
    const party = this.coop ? this.coop.members.map(([id, name]) => (id === p.id ? p.name : name)) : [p.name];
    // Leading: everyone's told how it went (each friend's game pays them from the run).
    this.coop?.end(won, run);
    forgetSession();
    this.coop?.close();
    this.coop = null;
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
    // The treasure at the end: yours alone. What won't fit in the pack is sold on the spot.
    const found = won ? treasure(run.job, p.cls, p.id, p.runs) : [], kept = found.slice(0, Math.max(0, PACK - p.bag.length)), sold = found.slice(kept.length);
    p.bag.push(...kept);
    p.gold += sold.length * TREASURE_SOLD;
    this.result = { won, job: run.job, gold, xp, rescued, levels, relic, treasure: kept, sold };
    this.run = null;
    this.give({
      stats: { jobs: won ? 1 : 0, saved: rescued, kills: run.kills, dens: run.dens, butchers: run.butchers ?? 0, gold, raised: run.raised ?? 0, falls: run.falls ?? 0, carried: run.carried ?? 0, teamkills: run.teamkills ?? 0 }, rescued, dens: run.dens, days: 1,
      story: won && run.job.objective === 'story' ? run.job.id : undefined,
      deed: won && !followed ? { title: run.job.title, place: run.job.place.name, party } : undefined,
    });
    this.enterTown({ x: 24.1, y: 14.8 });
  }

  /** The nearest thing to use where the hero stands: a person, a door, a spot in the open. */
  near(): Near | null {
    const h = this.hero, map = this.room.map, all: (Near & { x: number; y: number })[] = [];
    for (const n of map.npcs ?? []) {
      if (n.pose || n.mute) continue;
      const at = npcAt(n, this.room.time);
      all.push({ x: at.x, y: at.y, label: n.name, talk: n.talk as SpotId, arg: n.arg, npc: n });
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
    // Still talking: a tap or a key finishes the line first.
    if ((hold.need === 'continue' || hold.need === 'move') && (this.continued || pressed) && this.typing()) {
      this.finishTyping();
      this.continued = false;
      Object.assign(h.seen, { attack: intent.attackSeq, roll: intent.rollSeq, block: intent.blockSeq, relic: intent.relicSeq });
      return true;
    }
    let done = false;
    if (hold.need === 'time') done = hold.t >= hold.until;
    else if (hold.need === 'continue') done = this.continued || (hold.t > 0.6 && pressed);
    else if (hold.need === 'move') done = hold.t > (hold.kind === 'act' ? 0.1 : 0.6) && (Math.hypot(intent.mx, intent.my) > 0.3 || this.continued);
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
  /** Set by the lesson view: is a line still typing, and finish it. */
  typing: () => boolean = () => false;
  finishTyping: () => void = () => {};

  /** The wood's own rules after the room's: the lessons, the cutscene, the relic, the road. */
  private stepWoodFrame(h: Hero, ev: FightEvent[], dt: number): FightEvent[] {
    const w = this.wood!, cut = w.cut;
    stepWood(w, this.room, ev, dt, WEAPONS[h.weapon].parryWindow + h.lenience);
    if (cut >= 0 && w.cut < 0 && !this.woodReplay) (this.profile.cutSeen = true), store(this.save);
    // Out of the Stoker: the javelin, on the RELIC button at once.
    if (w.relic && !h.found.includes('javelin')) {
      h.found = ['javelin'];
      h.relics = abilitiesOf(this.profile.cls, 'javelin', this.profile.skill);
      if (!knows(h, 'skill')) h.relic = 'javelin';
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

  /** Halvard: sell a packed piece for gold (never a hungry one). */
  sell(it: Item): boolean {
    const p = this.profile, i = p.bag.indexOf(it), n = sellValue(it);
    if (i < 0 || n <= 0) return false;
    p.bag.splice(i, 1);
    this.hero.bag = [...p.bag];
    p.gold += n;
    store(this.save);
    return true;
  }

  /** Give a packed piece to a town work: it counts for more than it would sell for. */
  giveGear(it: Item, id: WorkId): boolean {
    const p = this.profile, i = p.bag.indexOf(it), n = giveValue(it);
    if (i < 0 || n <= 0 || !workOpen(this.world, id)) return false;
    p.bag.splice(i, 1);
    this.hero.bag = [...p.bag];
    this.give({ works: { [id]: n }, stats: { given: n } });
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
  /** Following a friend's job: what my hero picks up, drinks or puts on there is mine to keep. */
  private keepRemoteGear(h: Hero): void {
    const p = this.profile, now = { bag: h.bag ?? p.bag, arms: h.arms ?? p.arms, armor: h.armor ?? p.armor, rings: h.rings ?? p.rings, belt: h.belt ?? p.belt, glow: h.glow ?? p.glow };
    if (JSON.stringify(now) === JSON.stringify({ bag: p.bag, arms: p.arms, armor: p.armor, rings: p.rings, belt: p.belt, glow: p.glow })) return;
    Object.assign(p, JSON.parse(JSON.stringify(now)));
    store(this.save);
  }

  private keepGear(h: Hero): void {
    const p = this.profile, relic = h.relics[1] ?? '';
    // The Mage's channelled element goes with it from room to room.
    if ((h.augments.channel ?? '') !== (p.augments.channel ?? '')) (p.augments.channel = h.augments.channel), store(this.save);
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
    if (p.gold < cost || (!SKILL_CHOICES[p.cls].includes(r) && !p.relics.includes(r))) return false;
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
    // Online the world server rolls the nights for raids (everyone sees the same one); off it, this browser does.
    contribute(this.world, full, this.link?.online ? QUORUM : 1, !this.link?.online);
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
    // Never more than it still needs; never to a stage whose turn hasn't come.
    n = Math.min(n, WORKS[id].need - workProgress(this.world, id));
    if (n <= 0 || this.profile.gold < n || !workOpen(this.world, id)) return false;
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
  /** Pay your trainer to teach you your class skill, or your dodge's leave-behind (once your level allows). */
  learn(what: Learned): void {
    const p = this.profile, t = TEACHES[what];
    if (!p.learned || p.learned.includes(what) || p.level < t.level || p.gold < t.price || (what === 'leave' && !LEAVES[p.cls])) return;
    p.gold -= t.price;
    p.learned = [...p.learned, what];
    const h = this.hero;
    h.learned = p.learned;
    if (what === 'skill') h.relic = h.relics[0];
    store(this.save);
  }

  /** Carry another of your class's skills (once taught; free, at the trainer). */
  chooseSkill(r: RelicId): void {
    const p = this.profile, h = this.hero;
    if (!SKILL_CHOICES[p.cls].includes(r) || !knows(h, 'skill')) return;
    const was = h.relics[0];
    p.skill = r;
    h.relics = abilitiesOf(p.cls, h.relics[1], r);
    if (h.relic === was) h.relic = r;
    h.augments[r] = p.augments[r] ?? '';
    store(this.save);
  }

  /** Pay the trainer for the next rank of a drill (if you can afford it and your level allows). */
  buyDrill(id: DrillId): void {
    const p = this.profile, r = p.drills?.[id] ?? 0, price = drillPrice(id, r);
    if (r >= drillCap(id, p.level) || p.gold < price) return;
    p.gold -= price;
    // A new object, so everything that keeps the old numbers sees the change.
    p.drills = { ...p.drills, [id]: r + 1 };
    const h = this.hero;
    h.drills = p.drills;
    refreshHealth(h);
    store(this.save);
  }

  vote(choice: string): void {
    this.give({ vote: choice, voter: device() });
  }
}

/** A friend's hero takes their press counters as already seen (so nothing pressed in town fires). */
function syncSeen(h: Hero, i: Intent): void {
  Object.assign(h.seen, { attack: i.attackSeq, block: i.blockSeq, roll: i.rollSeq, weapon: i.weaponSeq, relic: i.relicSeq, relicSwap: i.relicSwapSeq, relicPick: i.relicPickSeq, augment: i.augmentSeq, cls: i.classSeq, take: i.takeSeq, grab: i.grabSeq, gear: i.gearSeq, potion: i.potionSeq, open: i.openSeq });
}

/** This browser, as one voter (all its heroes share it): made once, kept. */
export function device(): string {
  try {
    let d = localStorage.getItem('relic-device');
    if (!d) localStorage.setItem('relic-device', (d = 'd' + Math.random().toString(36).slice(2, 14)));
    return d;
  } catch {
    return 'dnostorage';
  }
}
