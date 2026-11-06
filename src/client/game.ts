/**
 * The loop: Wickhold, the buildings, the Training Yard, and runs. You play one of your heroes (class
 * chosen when they were made, never changed). The town is a room you walk around; walk up into a door
 * to go in; taking a job starts a run (room after room until the job is done or you're driven back);
 * the results come home to the hero and the shared world, and the town changes with them.
 */
import { placeOf, spotOf, type PastimeId } from '../shared/pastimes';
import { petSpots, type Dog } from './petting';
import { ownPetOk } from './petwhen';
import { doorAt, inArea, npcAt, pushingInto, useMap, type Area, type Block, type Npc, type Theme } from '../shared/arena';
import { travel } from '../shared/sweep';
import type { DreadRule } from '../sim/dread';
import { townInterior } from '../shared/interiors';
import { board, STORY_PARTY, type Job } from '../shared/jobs';
import { expedition, fenmere, hangmansWood } from '../shared/expedjob';
import { barnHunt, barnPosted } from '../shared/bossjobs';
import { WORKS, workDone, workOpen, workProgress, WORK_ORDER, type WorkId } from '../shared/works';
import { contribute, type Contribution } from '../shared/worldsync';
import { HERO_SLOTS, SHOP, gainXp, newProfile, perkFx, perkOffer, resetPerks, takePerk, type PerkId, type Profile } from '../shared/progress';
import { dueLevels, jobXp } from '../shared/pace';
import { Rng } from '../shared/rng';
import { CHAPTER_1, rewardMult, settle, type WorldState } from '../shared/story';
import { wayGot, wayLine } from '../shared/waypay';
import { SPOT_REACH, TOWN_PROPS, housesFor, townMap, townSpots, type SpotId } from '../shared/town';
import { buyDrill, learnLesson } from '../shared/training';
import { knowsSkill, learnSkill } from '../shared/skillteach';
import { ARRIVE_SAFE, cutMax, HOUSEBURN, PARTY, type DrillId, POTION, POTIONS, type PotionId, CLASS_KITS, CLASS_SKILL, SKILL_CHOICES, HERO, abilitiesOf, rollGear, HUNGRY, WANT, type HungryId, nextLevel, reroll, REROLL, STEEL, sellValue, giveValue, TIER_WANT, type ArmorKind, type Augment, type HeroClass, type Item, type RelicId, type WeaponId, WEAPONS } from '../shared/tuning';
import { partyLevel } from '../shared/threat';
import { ArenaRoom } from '../sim/room';
import { lessonOf, newWood, release, skipCut, stepWood, type WoodState } from '../sim/wood';
import { elementTaught } from '../sim/woodelement';
import { signTaught } from '../sim/woodsign';
import { AREAS, woodMap, WOOD_PROPS } from '../shared/wood';
import { bagFull, bagSize } from '../shared/bags';
import { refreshHealth, statsOf } from '../sim/gearstats';
import { houseCaptives, sum } from '../sim/goal';
import { HouseIndoors } from './houseindoors';
import { goal, isFinal, mine, newRun, runRoom, tally, type Run } from '../sim/run';
import { NO_INTENT, knows, type FightEvent, type Hero, type Intent, type Learned } from '../sim/types';
import { players } from '../sim/party';
import { load, store, type Save } from './save';
import { fitHound, nameTrouble, type HoundLook } from '../shared/houndlook';
import { treasure } from '../shared/treasure';
import { makeRelic, relicMax, type RelicItem } from '../shared/relicitems';
import { wonRelics } from '../shared/relicaward';
/** What a piece of treasure that won't fit in the pack fetches. */
const TREASURE_SOLD = 20;
import { rebase } from '../sim/rebase';
import { CoopGuest, CoopHost, loadRoom, saveRoom, type Friend } from './coop';
import { forgetSession, keepSession, keptJob, type Session } from './session';
import { PW } from './partywords';
import { bankEnd, bankJob, banked, soloJob, unbank } from './jobbank';
import { dropOwed, owedTo } from './owed';
import { dressKit, forgetTaken } from './keepkit';
import { gainRelics, keepKitNoting, seeRelic, type RelicMoment } from './relicnews';
import { FULL, ONLINE } from './relay';
import { townLight } from '../shared/daylight';
import { onClock, townPhase } from './townclock';
import { Followers } from './followers';
import { kitOf, nameBoard, recapOf, type Kit, type Recap } from './recaptally';
import { JobRooms, doorPushed, type DoorMark, type SavedHouses } from './jobrooms';
import { packRoom, unpackRoom } from './bigsave';
import type { Parties } from './parties';
import { again as practiceAgain, clearPractice, letOut, practiceOf, stepPractice, type Pick } from '../sim/practice';
import { RACK, sortKey } from '../shared/practice';

/** A hero's hound as the profile has it (a Ranger's; nobody else has one). */
const houndOf = (p: Profile): HoundLook | undefined => (p.cls === 'RANGER' ? fitHound(p.hound, p.id) : undefined);

/** Seconds the screen takes to go dark after a lost job, before town. */
export const FADE_OUT = 2.4;

/** `watch`: on Wickhold's wall for a shift of the Night Watch (watchmode.ts draws and runs it; the town waits underneath). */
/** `pastime`: fishing at the millpond or at the archery butts (fishmode.ts, rangemode.ts): played here alone, parked in town for everyone else. */
export type Mode = 'town' | 'yard' | 'run' | 'wood' | 'watch' | 'pastime';
/** A whole job, to lead it from (coop.ts sends it every 2 s): `me` is whoever leads. */
interface JobSave { run: Run; room: Record<string, unknown>; houses?: SavedHouses; members: [string, string][]; key?: number }
/**
 * How a job ended for this player: won; driven back (beaten, or gone home from a job alone: half the
 * gold); or gone early from a party, by LEAVE or cut off from it (the gold picked up while with them).
 */
export type How = 'won' | 'beaten' | 'left' | 'dropped';
export interface Result { won: boolean; how: How; half: boolean; job: Job; gold: number; xp: number; rescued: number; levels: number; relic?: RelicItem; /** Every relic won at the job's end (recap's RELICS row). */ relics?: RelicItem[]; treasure: Item[]; sold: Item[]; lost?: number; /** Prisoners led off out of reach (layout 4). */ ledoff?: number; /** The Staithe's folk lost off the jetty (sim/staithe.ts). */ netlost?: number; /** The way taken at a fork and what it paid (shared/waypay.ts). */ way?: string; /** Jobs of the church's light left, if it went on this one. */ lit?: number; /** What happened, for the recap (recaptally.ts). */ recap?: Recap }
/** A leader back after a reload waits this long (the room held) for a friend to answer before the job's given up. */
const HOLD = 10;
/** Something you can use where you stand: a spot, a person, or a door. */
export interface Near { label: string; talk?: SpotId; arg?: number; key?: string; door?: Block; chest?: number; npc?: Npc; /** A hound to pet (the lodge: petting.ts). */ pet?: Dog }

export const ME = 'me';
/** Wickhold, its halls and the yard: out of bounds, you're only put back (sim/dread.ts). */
const SET_BACK: DreadRule = { by: 'setback' };
const NAMES: Record<string, string> = { cottage: 'THE COTTAGE', barn: 'THE BARN', home: 'THE HOUSE' };

export class Game {
  mode: Mode = 'town';
  /** Grown on the last job: say so over the hero once, back in town (main.ts). */
  levelPop = 0;
  /** Relics just gained, each waiting to be shown (relicmoment.ts; main.ts takes them when nothing's in the way). */
  relicNews: RelicMoment[] = [];
  room!: ArenaRoom;
  run: Run | null = null;
  save: Save = load();
  /** The prologue in progress (sim/wood.ts), and whether it's a replay. */
  wood: WoodState | null = null;
  private woodReplay = false;
  /** Something to show a hero once (the road into Wickhold, out of the wood). */
  greeting: string | null = null;
  /** Set when a run ends; the UI shows it and clears it. */
  result: Result | null = null;
  /** When the job was lost (room time), for the fade out before town. */
  beatenAt: number | null = null;
  /**
   * Inside a building: the room outside (it keeps running: fires burn, dens breed), the door you came
   * in by, and your hero there (in town, kept aside). Online, the party leader runs every room someone is in.
   */
  outside: { room: ArenaRoom; door: Block; hero: Hero } | null = null;
  /** The line to the shared world (set by the page; none in tests). */
  link: { online: boolean; send(c: Contribution): void } | null = null;
  /** Played before a hero is chosen (the title screen's backdrop, and the tests). */
  private scratch = newProfile();
  /** Online with friends: leading (this browser runs the job: coop.ts) or following a leader's. */
  coop: CoopHost | null = null;
  remote: CoopGuest | null = null;
  /** Handed the job on while out of sight (hidehost.ts): back in sight, follow whoever has it. */
  private handed: { code: string; lead: string; job: Job } | null = null;
  /** Who this page last knew to host its job (a change mid-job is said over my hero: hostNote). */
  private hostSeen: string | null = null;
  /** A word over my hero when the job moves to another device (main.ts shows it once). */
  hostNote: string | null = null;
  /** Parties at the board (online only). */
  parties: Parties | null = null;
  /** Counts up each time the room changes (friends rebuild their copy when it does). */
  roomKey = 0;
  /** The town's own light, before the day turns it (daylight.ts). */
  private townTheme: Theme | null = null;
  /** Goblins following you through a door (followers.ts). */
  private followers = new Followers();
  /** On a job: the street and its houses, each player in whichever they walked into (jobrooms.ts). */
  readonly rooms = new JobRooms(this.followers);
  /** What's inside the job's houses, for a house set alight (houseindoors.ts). */
  private indoors = (this.rooms.inside = new HouseIndoors(this.rooms, () => (this.mode === 'run' ? this.run : null), (r) => this.coop?.fresh?.(r)));
  /** Each room's events from the latest step (the leader sends each friend their own room's). */
  stepped = new Map<ArenaRoom, FightEvent[]>();
  /** Each room's own number, for friends to know when theirs is a different one. */
  private keys = new WeakMap<ArenaRoom, number>();
  /** The last input given (a new room's hero takes its presses as already seen). */
  private lastIntent: Intent = NO_INTENT;
  /** Friends whose press counters have been matched to their hero's (so no old press fires). */
  private synced = new Set<string>();
  /** Levels grown, counted out to the room (sim/grow.ts); and how many of this job's are lit already. */
  levelSeq = 0;
  private grown = 0;
  /** The job's own name (the party's room code, or this device's for a job alone): paid once, by it. */
  jobKey = '';
  /** Leading again after a reload: the room waits till this for a friend to answer (HOLD). */
  private holdUntil = 0;
  private settling = false;
  /** What this hero carried when the job began (the recap's FOUND and RELICS). */
  private startKit: Kit | null = null;
  /** The leader's kit word last looked at, and their run last tallied (following a friend's job). */
  private kitSeen = -1;
  private bankedRun: Run | null = null;

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
    this.rooms.reset(null);
    this.run = null;
    this.woodReplay = replay;
    const room = new ArenaRoom(7, { map: woodMap(), furniture: WOOD_PROPS });
    // Past the tree wall something waits; every clearing counts as ground, gates shut or not (sim/dread.ts).
    room.dread = { by: 'shadow', seeds: AREAS.map((a) => ({ x: a.x + a.w / 2, y: a.y + a.h / 2 })) };
    this.place(room, room.map.hero);
    const h = this.hero, cls = this.profile.cls;
    // You come round with nothing but your class's weapon (your skill is your trainer's to teach); a
    // Healer's censer has gone cold. (A Ranger's hound is with them: it lay by them all night.)
    Object.assign(h, { relics: abilitiesOf(cls), found: [], cold: cls === 'HEALER', belt: [], learned: this.profile.learned ?? [], calmHound: true, look: this.profile.look ?? 0, houndLook: houndOf(this.profile) });
    h.relic = h.relics[0];
    this.wood = newWood(this.room, cls);
  }

  /** Straight to town, with what the wood would have given (a second hero's choice). */
  skipWood(): void {
    this.wood = null;
    this.giveWood();
    this.enterTown(this.gateSpot());
  }

  /** What the wood leaves you: the javelin, Odric's word about Hew's tally (Orla took it), a cold censer for a Healer. */
  private giveWood(): void {
    const p = this.profile;
    if (!this.woodReplay) {
      Object.assign(p, { prologue: true, tally: true, cold: p.cls === 'HEALER' });
      if (!p.relics.some((r) => r.kind === 'javelin')) p.relics.unshift(makeRelic(new Rng(p.xp * 31 + p.runs + 7), 'javelin'));
      p.relic ||= p.relics.find((r) => r.kind === 'javelin')!.id;
    }
    store(this.save);
  }

  private gateSpot(): { x: number; y: number } {
    const g = townSpots(this.world).find((s) => s.id === 'gate');
    return g ? { x: g.x, y: g.y + 1.6 } : { x: 28, y: 3 };
  }

  /** Out of the wood at the north gate, Orla of the watch having walked you there (sim/woodguard.ts). */
  private finishWood(): void {
    this.giveWood();
    this.wood = null;
    this.greeting = this.woodReplay ? null : 'road';
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
    if (this.mode !== 'wood' || !this.wood) return ['attack', 'roll', 'block', 'relic', 'potion', 'grab', 'sign'];
    if (this.wood.cut >= 0 || this.wood.wake >= 0) return [];
    // A Mage's ELEMENT comes with its element step, after the full charge (sim/woodelement.ts); a Rogue's,
    // Ranger's or Healer's own button with theirs, after the clearing's lesson (sim/woodsign.ts).
    const el = [...(elementTaught(this.wood) ? ['element'] : []), ...(signTaught(this.wood) ? ['sign'] : [])];
    return this.wood.stage >= 5 ? ['attack', 'roll', 'block', 'relic', 'potion', 'grab', ...el] : [...lessonOf(this.wood).moves.filter((m) => m !== 'grab' || this.wood!.stage > 0 || this.wood!.more), ...el];
  }
  /** Your hound as chosen with Maeve (houndui.ts): kept on the hero, and your hero shows it at once
   *  (friends hear it with your look: townpresence.ts, and a party's hero). Its name must pass the chat
   *  filter; false (nothing changed) if it doesn't, or this hero has no hound. */
  chooseHound(look: HoundLook): boolean {
    const p = this.profile;
    if (p.cls !== 'RANGER' || nameTrouble(look.name)) return false;
    p.hound = fitHound(look, p.id);
    if (this.hero) this.hero.houndLook = { ...p.hound };
    store(this.save);
    return true;
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
    h.bagSize = bagSize(p);
    h.glow = p.glow;
    h.belt = [...p.belt];
    h.want = p.want;
    h.cold = p.cold;
    h.purse = p.gold + (this.run?.gold ?? 0);
    // Copies: the room spends charge on its own, and keepkit.ts brings it home.
    h.found = p.relics.map((r) => ({ ...r }));
    const carried = p.relics.find((r) => r.id === p.relic);
    h.relicItem = carried?.id ?? '';
    // Their first named butcher's sure relic, had already (sim/namedrelic.ts): from the save, or this run.
    h.namedRelic = !!p.namedRelic || !!keep?.namedRelic || undefined;
    h.lit = (p.lit ?? 0) > 0;
    h.perks = [...p.perks];
    h.drills = p.drills;
    h.armor = p.armor;
    h.rings = [...p.rings];
    h.baseHp = HERO.hp + (perkFx(p.perks).health ?? 0);
    // Raised this job (sim/raise.ts): the most health stays cut till it ends, and who raised you stays known.
    if (keep) Object.assign(h, { hpCut: keep.hpCut, risenBy: keep.risenBy });
    h.maxHp = cutMax(h.baseHp + statsOf(h).health, h.hpCut);
    h.relics = abilitiesOf(p.cls, carried?.kind, p.skill);
    h.learned = p.learned;
    h.look = p.look ?? 0;
    h.houndLook = houndOf(p);
    // Your skill in hand, or (not yet taught it) the relic you carry.
    h.relic = knows(h, 'skill') ? h.relics[0] : (h.relics[1] ?? h.relics[0]);
    for (const r of h.relics) h.augments[r] = p.augments[r] ?? '';
    // A found relic's element is its own (shared/relicitems.ts).
    if (carried) h.augments[carried.kind] = carried.el;
    h.hp = h.maxHp;
    if (keep) Object.assign(h, { hp: Math.max(1, keep.hp), relic: keep.relic, fed: keep.fed, lastKill: 0 });
    // Down or out carries on into the next room with you, and so does your one get-up, spent or not.
    if (keep) h.selfUp = keep.selfUp;
    if (keep?.act === 'down' && keep.bleeding) Object.assign(h, { act: 'down', hp: 0, bleeding: true, out: keep.out, actDur: Infinity });
  }

  private place(room: ArenaRoom, at?: { x: number; y: number }, keep?: Hero, fresh = this.mode === 'run'): void {
    const from = this.room;
    this.room = room;
    this.roomKey++;
    const h = room.join(ME);
    if (at) (h.x = at.x), (h.y = at.y);
    this.equip(h, keep);
    // A Cleric's RAISE cooldown goes on through the door (the room's clock starts again in each room).
    if (keep?.riseReadyAt !== undefined && from) h.riseReadyAt = room.time + Math.max(0, keep.riseReadyAt - from.time);
    // A fresh hero in the new room: every press made so far counts as seen (so the last swing or
    // roll doesn't fire again on the doorstep), and it starts standing still.
    syncSeen(h, this.lastIntent);
    Object.assign(h, { act: h.act === 'down' ? 'down' : 'idle', actT: 0, kvx: 0, kvy: 0, rollQueuedAt: -9, attackQueuedAt: -9, relicQueuedAt: -9, grabQueuedAt: -9 });
    // Leading a party: your friends come with you (from the street or a house), each with the health they had.
    for (const [id, f] of this.coop?.friends ?? []) {
      const [was, old] = this.pluck(id, room, from);
      if (!f.gone) this.bring(id, f, old, was?.time ?? room.time);
    }
    // First time in this room on a job: a moment's grace for everyone, so nobody's cut down in the doorway.
    if (fresh) for (const x of room.heroes) if (x.id !== 'squire') x.safeT = ARRIVE_SAFE;
  }

  /** A friend's hero, next to yours in this room (dressed from their own profile). */
  private bring(id: string, f: Friend, keep?: Hero, was = this.room.time): void {
    const me = this.hero;
    let h: Hero;
    // Their own hero, carried over as it is (health, potions, cooldowns); a new one dressed from their profile.
    if (keep) this.room.heroes.push((h = keep)), rebase(h, was, this.room.time);
    else if (f.profile) (h = this.room.join(id)), this.equip(h, undefined, f.profile), this.mode === 'run' && (h.safeT = ARRIVE_SAFE);
    else return;
    const n = this.room.heroes.indexOf(h);
    // Beside you, as far as the ground allows (never into a wall you're standing against).
    useMap(this.room.map), (h.x = me.x), (h.y = me.y), travel(h, n % 2 ? 0.8 : -0.8, 0.3 * n, HERO.radius);
    Object.assign(h, { fx: me.fx, fy: me.fy, kvx: 0, kvy: 0, act: h.act === 'down' ? 'down' : 'idle', actT: h.act === 'down' ? h.actT : 0, tag: f.name });
    this.room.prev.set('h:' + id, [h.x, h.y]);
  }

  /** Take a player's hero out of whichever room has it (not `into`): `from`, or the job's street or a house. */
  private pluck(id: string, into: ArenaRoom, from?: ArenaRoom): [ArenaRoom | undefined, Hero | undefined] {
    for (const r of new Set([from, ...this.rooms.all()])) {
      const i = r && r !== into ? r.heroes.findIndex((x) => x.id === id) : -1;
      if (r && i >= 0) return [r, r.heroes.splice(i, 1)[0]];
    }
    return [undefined, undefined];
  }

  /** A friend arrives in the job (or back after losing their signal: their hero is still here). */
  addFriend(id: string, f: Friend): void {
    if (this.mode !== 'run') return;
    // Already here from the job as it was saved (a reload, a takeover): their kit as their own save has it.
    const had = this.roomOf(id)?.heroes.find((x) => x.id === id);
    if (had && f.profile) return dressKit(had, f.profile), forgetTaken(this.rooms.all(), f.profile);
    if (had) return;
    this.synced.delete(id);
    this.bring(id, f);
  }

  /** A friend gone a minute: their hero leaves the fight. */
  dropFriend(id: string): void {
    for (const r of new Set([this.room, this.outside?.room, ...this.rooms.all()])) {
      const i = r ? r.heroes.findIndex((x) => x.id === id) : -1;
      if (r && i >= 0) r.heroes.splice(i, 1);
    }
  }

  goalText(): string {
    // Following a friend's job: their game's words (it knows their houses).
    if (this.remote) return this.remote.goal;
    return this.run ? goal(this.run, this.fightRoom, sum(this.houses())).text : '';
  }

  /** The caged and the freed in this room's houses, by door (sim/goal.ts). */
  houses(): ReturnType<typeof houseCaptives> {
    if (this.remote) return this.remote.houses;
    return this.run && this.mode === 'run' ? houseCaptives(this.run, this.fightRoom, this.rooms.houses) : [];
  }

  /** Over each house door in the street, who's gone in (for whoever's out there to see). */
  doorMarks(): DoorMark[] {
    if (this.remote) return this.remote.doorMarks;
    return this.mode === 'run' ? this.rooms.marks((h) => (h.id === ME ? this.profile.name : this.coop?.friends.get(h.id)?.name ?? h.tag ?? '')) : [];
  }

  /** The room this player's hero is in on the job (the leader's own, off one). */
  roomOf(id: string): ArenaRoom | undefined {
    return this.mode === 'run' ? this.rooms.roomOf(id) : this.room.heroes.some((h) => h.id === id) ? this.room : undefined;
  }

  /** A room's own number (a new one each time a room is first asked about). */
  keyOf(room: ArenaRoom): number {
    let k = this.keys.get(room);
    if (k === undefined) this.keys.set(room, (k = ++this.roomKey));
    return k;
  }

  /** The whole job to hand on: the street, and every house anyone's been in (with whoever's in them). */
  jobSave(): { room: Record<string, unknown>; houses: SavedHouses } {
    // (An expedition's street goes compact: bigsave.ts.)
    return { room: packRoom(saveRoom(this.rooms.street ?? this.fightRoom), this.run?.job), houses: this.rooms.save() };
  }

  /** Back to Wickhold, at `at` (in front of a door) or the square. */
  enterTown(at?: { x: number; y: number }): void {
    this.mode = 'town';
    this.outside = null;
    this.startKit = null;
    this.rooms.reset(null);
    this.place(this.townRoom(), at);
  }

  private townRoom(): ArenaRoom {
    return Object.assign(new ArenaRoom(this.world.day, { map: townMap(this.world), furniture: TOWN_PROPS }), { dread: SET_BACK });
  }

  enterYard(): void {
    this.outside = null;
    this.rooms.reset(null);
    this.mode = 'yard';
    this.place(Object.assign(new ArenaRoom(this.world.day, { squire: true }), { dread: SET_BACK }));
    this.hero.calmHound = true;
  }

  /** The yard's straw men (sim/practice.ts): set going `pick` (and the yard's own go back on the rack). */
  practice(pick: Pick): boolean {
    return this.mode === 'yard' && !!letOut(this.room, pick);
  }
  /** Everything back on the rack. */
  clearPractice(): void {
    if (this.mode === 'yard') clearPractice(this.room);
  }
  /** The same practice again, from the start. */
  practiceAgain(): boolean {
    return this.mode === 'yard' && !!practiceAgain(this.room);
  }
  /** The practice going on, and its small line ("BLOCKED 8 OF 10"). */
  get drill() {
    return this.mode === 'yard' ? practiceOf(this.room) : null;
  }

  /** Sorts of goblin met on a job or in the wood (within sight), kept on the hero for the yard's straw men. */
  private metAt = -1;
  private noteMet(): void {
    if ((this.mode !== 'run' && this.mode !== 'wood') || Math.abs(this.room.time - this.metAt) < 1 || !this.room.heroes.length) return;
    this.metAt = this.room.time;
    const h = this.room.heroes.find((x) => x.id === ME), p = this.profile;
    if (!h || p === this.scratch) return;
    let grew = false;
    for (const e of this.room.enemies) {
      const k = e.act === 'dead' || Math.hypot(e.x - h.x, e.y - h.y) > 9 ? null : sortKey(e);
      if (k && !(p.met ??= []).includes(k)) p.met.push(k), (grew = true);
    }
    if (grew) store(this.save);
  }

  /** Up the stair for a shift on the wall: out of the town's room online, as the yard is (watchmode.ts). */
  enterWatch(): void {
    this.mode = 'watch';
  }
  /** Back down the stair, where you stood. */
  leaveWatch(): void {
    if (this.mode === 'watch') this.mode = 'town';
  }

  /** The pastime being played (shared/pastimes.ts), or null. */
  pastime: PastimeId | null = null;
  /** Sit down at the millpond, step up to the butts, sit at the Rat's table or its knife line, take the hammer at the anvil: the hero goes to its spot, and the town hears it once (townpresence.ts). Only in the pastime's own place. */
  enterPastime(id: PastimeId): void {
    if (this.mode !== 'town' || this.room.map.name !== placeOf(id)) return;
    const h = this.hero, sp = spotOf(id);
    Object.assign(h, { x: sp.seat[0], y: sp.seat[1], fx: sp.face[0], fy: sp.face[1], moving: false });
    this.pastime = id;
    this.mode = 'pastime';
  }
  /** Up from the bank or off the line: back in town where you sat, and the town hears that once too. */
  leavePastime(): void {
    if (this.mode === 'pastime') this.mode = 'town';
    this.pastime = null;
  }

  /**
   * Go in through a door: a Wickhold building, or a cottage or barn on a job. On a job only you go in
   * (your friends go in and out on their own: jobrooms.ts); following a friend's job, their game decides.
   */
  enter(b: Block): void {
    if (this.remote || !b.door || b.ruined || (b.burning ?? -1) >= 0) return;
    if (this.mode === 'run') return this.goIn(ME, b);
    const out = this.room, h = this.hero, inside = new ArenaRoom(this.world.day, { map: townInterior(b.door, this.world) });
    inside.exitOpen = true;
    inside.dread = SET_BACK;
    out.heroes.splice(out.heroes.indexOf(h), 1);
    this.outside = { room: out, door: b, hero: h };
    this.place(inside, inside.map.hero, h, false);
  }

  /** On a job: player `id` goes in at door `b` (alone; the small goblins after them follow). */
  private goIn(id: string, b: Block): void {
    const street = this.rooms.street, h = street?.heroes.find((x) => x.id === id), inside = h && this.run ? this.rooms.goIn(this.run, h, b) : null;
    if (!inside || id !== ME) return;
    this.outside = { room: street!, door: b, hero: h! };
    this.room = inside;
    this.roomKey++;
  }

  /** On a job: player `id` walks out of the house they're in, into the street. */
  private comeOut(id: string): void {
    const h = this.rooms.roomOf(id)?.heroes.find((x) => x.id === id), street = h ? this.rooms.comeOut(h) : null;
    if (!street || id !== ME) return;
    this.outside = null;
    this.room = street;
    this.roomKey++;
  }

  /** Back out of the door you came in by. */
  leave(): void {
    if (this.mode === 'run') return this.comeOut(ME);
    const o = this.outside!, inner = this.hero, d = doorAt(o.door), h = o.hero;
    this.outside = null;
    this.room = o.room;
    this.room.heroes.push(h);
    // Dressed again from the save: what you bought, put on or swapped inside comes out with you (the
    // street's hero was left as it went in, and would otherwise be saved back over it).
    this.equip(h, inner);
    Object.assign(h, { x: d.x, y: d.y + 0.5, fx: 0, fy: 1, hp: Math.max(1, inner.hp), relic: inner.relic, act: 'idle', actT: 0, kvx: 0, kvy: 0, rollQueuedAt: -9, attackQueuedAt: -9, relicQueuedAt: -9, grabQueuedAt: -9 });
    syncSeen(h, this.lastIntent);
    this.room.prev.set('h:' + ME, [h.x, h.y]);
    this.roomKey++;
  }

  /** Today's board, with the chapter's story mission on it until it's done. */
  jobs(): Job[] {
    // The day's expedition (THE BARROWFIELDS) at the foot of the board, its own posting.
    // Then Hangman's Wood, the first of the atlas's curated places (docs/plans/atlas.md), posted the same way in Greyhollow.
    // Then Fenmere, the second (shared/fen.ts).
    const list = [...board(this.world.day, workDone(this.world, 'sewers')), expedition(this.world.day), hangmansWood(this.world.day), fenmere(this.world.day)];
    // The Doorkeepers in the great barn, a boss hunt, from late in chapter 1 (shared/bossjobs.ts).
    if (barnPosted(this.world)) list.splice(list.length - 3, 0, barnHunt(this.world.day));
    return this.world.storyDone.includes(CHAPTER_1.mission.id) ? list : [CHAPTER_1.mission, ...list];
  }

  startJob(job: Job, party = 1): void {
    this.followers.clear();
    this.mode = 'run';
    this.outside = null;
    this.rooms.reset(null);
    this.run = newRun(job);
    this.run.party = party;
    // The party's average level, fixed for the job: the goblins and the loot go by it (shared/threat.ts LEVEL_SCALE).
    this.run.level = partyLevel([this.profile.level, ...[...(this.coop?.friends.values() ?? [])].filter((f) => f.profile && !f.gone).map((f) => f.profile!.level)]);
    this.run.began = Date.now();
    this.jobKey = soloJob();
    this.place(runRoom(this.run));
    this.rooms.reset(this.room);
    // A coin in the well: you set out blessed.
    if (this.profile.wish) (this.hero.blessedUntil = 20), (this.profile.wish = false), store(this.save);
  }

  /** Advance with this frame's intent; returns the events (for effects and sound). */
  step(dt: number, intent: Intent): FightEvent[] {
    // Following a friend's job: their room is drawn here; nothing runs in this browser.
    if (this.mode === 'run' && !this.startKit) this.startKit = kitOf(this.profile);
    // (Handed the job on while out of sight, and a frame came before the page said it's back.)
    if (this.handed) return this.backAsGuest(), [];
    if (this.remote) return this.noteMet(), this.stepRemote();
    intent = this.own(intent);
    // Back to lead after a reload: the room waits for a friend to answer (nobody does: the job's gone).
    if (this.holdUntil && this.waiting()) return [];
    const h = this.hero;
    // The wood holds the world still for a lesson's card, a freeze-frame, a word of praise.
    if (this.mode === 'wood' && this.wood?.hold && this.holding(intent, dt)) return [];
    // Your class and kit are your hero's: changed at the smith and the relic-wright, never mid-fight.
    intent = { ...intent, classSeq: h.seen.cls, weaponSeq: h.seen.weapon, augmentSeq: h.seen.augment };
    // No fighting in town: no blows, guard, relics or grabs; rolls, dashes and blinks still work.
    // The works' crew walk on Wickhold's wall clock, the same on every screen (townclock.ts).
    if (this.mode === 'town') onClock(this.room.map.npcs, this.room.time);
    if (this.mode === 'town') intent = { ...intent, attack: false, block: false, attackSeq: h.seen.attack, blockSeq: h.seen.block, relicSeq: h.seen.relic, grabSeq: h.seen.grab, potionSeq: h.seen.potion, reload: false, reloadSeq: h.seen.reload ?? 0, elementSeq: h.seen.element ?? 0, signSeq: h.seen.sign ?? 0 };
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
        ...(t.includes('potion') ? {} : { potionSeq: h.seen.potion, beltSeq: h.seen.belt }),
        ...(t.includes('grab') ? {} : { grabSeq: h.seen.grab }),
        ...(t.includes('element') ? {} : { elementSeq: h.seen.element ?? 0 }),
        ...(t.includes('sign') ? {} : { signSeq: h.seen.sign ?? 0 }),
      };
    }
    this.room.setIntent(ME, intent);
    this.lastIntent = intent;
    // (The leader's own hero has no lag: its blows are judged at once. A friend's is theirs: sim/lagcomp.ts.)
    if (h.lag) h.lag = 0;
    // Leading a party: each friend's latest input, in whichever room they're in (their old presses matched first, so none fires).
    for (const [id, f] of this.coop?.friends ?? []) {
      const r = this.roomOf(id) ?? this.room, fh = r.heroes.find((x) => x.id === id);
      if (!fh) continue;
      if (!this.synced.has(id) && f.intent !== null) (this.synced.add(id), syncSeen(fh, f.intent));
      r.setIntent(id, { ...f.intent, classSeq: fh.seen.cls, weaponSeq: fh.seen.weapon, augmentSeq: fh.seen.augment });
      fh.lag = f.lag ?? 0;
    }
    // The other rooms run on beside yours (the street while you're in, any house a friend's in; their kills still pay); then yours.
    const here = this.room, stepped = new Map<ArenaRoom, FightEvent[]>();
    for (const r of this.mode === 'run' ? this.rooms.live() : this.outside ? [this.outside.room] : []) {
      if (r === here) continue;
      const e = r.advance(dt);
      stepped.set(r, e);
      if (this.run) tally(this.run, r, e, ME);
      this.followers.step(r);
    }
    const ev = here.advance(dt);
    stepped.set(here, ev);
    this.stepped = stepped;
    this.followers.step(here);
    if (this.mode === 'run' && this.run) tally(this.run, here, ev, ME);
    // (The run only changes on the room's events: the tally's kept when there were some.)
    if (this.mode === 'run' && this.run && [...stepped.values()].some((e) => e.length)) this.bankIt(this.run);
    this.growing();
    // Wickhold keeps the shared day: the light turns with the clock, the same on every screen.
    if (this.mode === 'town' && !this.outside) this.room.map.theme = townLight(this.townTheme ??= this.room.map.theme, townPhase());
    // The yard's straw men: drills counted, a fall started over, nothing to pick up (sim/practice.ts).
    if (this.mode === 'yard') stepPractice(here, ev, ME);
    this.noteMet();
    if (this.mode === 'wood' && this.wood) return this.stepWoodFrame(h, ev, dt);
    this.keepGear(h);
    for (const e of ev) if (e.k === 'spend' && e.id === ME) this.spend(e.n);
    // Walk up into a door (or into a side way, its way) to go in; out by the way you came in to come back out.
    const door = this.near()?.door;
    if (door && pushingInto(door, h, intent)) this.enter(door);
    else if (this.outside && inArea(this.room.map.exit, h.x, h.y)) this.leave();
    // Out of the yard by walking out of its gate (pushing down into it), never by being knocked into it.
    else if (this.mode === 'yard' && inArea(this.room.map.exit, h.x, h.y) && intent.my > 0.3 && h.act !== 'hurt' && h.act !== 'stun' && h.act !== 'down') this.enterTown(this.doorOf('hall'));
    // Your friends go in and out on their own; a house set alight with anyone in throws them out as it falls.
    if (this.mode === 'run') (this.friendDoors(), this.outOfTheFire(), this.indoors.cries());
    if (this.mode === 'run' && this.run) {
      const street = this.fightRoom;
      street.exitOpen = goal(this.run, street, sum(this.houses())).done;
      // Beaten: a slow fade from where you fell (main.ts), then town.
      if (this.run.failed) {
        this.beatenAt ??= this.room.time;
        if (this.room.time - this.beatenAt >= FADE_OUT) (this.beatenAt = null), this.finish('beaten');
      }
      else if (!this.outside && this.room.exitOpen) {
        // The way on takes the whole party, standing in it together; at a fork, the road they stand in.
        const road = this.room.map.roads?.find((r) => this.together(r.area));
        if (road || this.together(this.room.map.exit)) {
          if (isFinal(this.run)) this.finish('won');
          else {
            this.run.index++;
            if (road) this.run.roads[this.run.index] = road.road;
            // The goblins ahead are counted for whoever's still with you.
            this.run.party = 1 + [...(this.coop?.friends.values() ?? [])].filter((f) => f.profile && !f.gone).length;
            this.place(runRoom(this.run), undefined, h);
            this.rooms.reset(this.room);
          }
        }
      }
    }
    return ev;
  }

  /** A house set alight from outside falling in: everyone still in it out in the street (sim/houseburn.ts). */
  private outOfTheFire(): void {
    const out: string[] = [];
    for (const [b, r] of this.rooms.houses) if (r.blaze?.fallen && (b.burning ?? -1) >= 0) out.push(...players(r.heroes).map((h) => h.id));
    for (const id of out) this.comeOut(id);
  }

  /**
   * Leading a job: each friend walks up into a door to go in, and out the bottom of a house to come
   * out, the same as you do, wherever you are.
   */
  private friendDoors(): void {
    const moves: [string, Block | null][] = [];
    for (const r of this.rooms.all()) for (const fh of players(r.heroes)) {
      if (fh.id === ME) continue;
      const i = this.coop?.friends.get(fh.id)?.intent ?? NO_INTENT;
      if (fh.act === 'down' || fh.out || this.coop?.away(fh.id)) continue;
      if (r !== this.rooms.street) {
        if (inArea(r.map.exit, fh.x, fh.y)) moves.push([fh.id, null]);
        continue;
      }
      const b = doorPushed(r.map, fh, i);
      if (b) moves.push([fh.id, b]);
    }
    for (const [id, b] of moves) b ? this.goIn(id, b) : this.comeOut(id);
  }

  /**
   * Leave the job now, for town. Alone, it's lost (driven back: half the gold). Following a friend,
   * they carry on without you. Leading one, your friends take it on from here and carry on.
   */
  leaveJob(): void {
    if (this.mode !== 'run' || !this.run || this.result) return;
    const g = this.remote;
    if (g) {
      g.leave();
      this.remote = null;
      this.run = g.run ?? this.run;
      return this.finish('left', true, true);
    }
    const c = this.coop, party = !!c?.company;
    if (party) (c!.handOver(), (this.coop = null));
    this.finish('left', false, party);
  }

  /** Test hook: end the run now (won or lost), as if its last room were done. */
  endForTest(won: boolean): void {
    if (this.run) this.finish(won ? 'won' : 'beaten');
  }

  /** Leading a party: set out, and this browser runs the job for everyone in it. */
  /** Can this job be set out on with this many? (A story mission needs a party, online.) */
  canTake(job: Job, party: number): boolean {
    return job.objective !== 'story' || !this.link?.online || party >= STORY_PARTY;
  }

  setOut(told?: ReturnType<Parties['setOut']>): void {
    // (`told`: the party was already told where to go, at the start of the setting-out beat: setout.ts.)
    const mine = this.parties?.current(), job = this.parties?.myJob;
    if (!told && mine && job && !this.canTake(job, mine.members.length)) return;
    const go = told ?? this.parties?.setOut();
    if (!go) return;
    // (One job's socket at a time: anything still open from before goes.)
    this.coop?.close();
    this.remote?.close();
    this.remote = null;
    // The room runs on whoever has the best link (shared/hostpick.ts): not me, so I follow them, still
    // the party's leader, as any friend would.
    if (go.host && go.host !== this.profile.id) return this.startRemote(new CoopGuest(go.room, this.profile.id, go.host, () => this.profile, go.job));
    this.hostSeen = this.profile.id;
    this.coop = new CoopHost(go.room, this.profile.id, this.profile.name, this, go.members);
    this.startJob(go.job, go.members.length);
    this.jobKey = go.room;
    keepSession({ code: go.room, lead: '', job: go.job, hero: this.profile.id });
    this.stepDown(go.job);
  }

  /**
   * Leading, and the relay says a friend leads now (this page was frozen or away long enough for them
   * to take the job on): follow them, in the job as they have it, rather than run a second one.
   */
  private stepDown(job: Job): void {
    const c = this.coop!;
    c.onRefused = (lead) => {
      if (this.coop !== c) return;
      c.close();
      this.coop = null;
      this.startRemote(new CoopGuest(c.room, this.profile.id, lead, () => this.profile, job));
    };
  }

  /** Back after a reload in a job with friends: lead it again from the job as this page left it, or follow. */
  resume(s: Session): void {
    const kept = s.lead ? null : keptJob();
    if (kept) return this.leadFrom(s.code, JSON.parse(kept), 'host');
    this.startRemote(new CoopGuest(s.code, this.profile.id, s.lead, () => this.profile, s.job));
  }

  /**
   * Hosting with friends and this page out of sight (hidehost.ts): the job to the friend first in line,
   * my hero left in it, and back in sight I follow them. Whether it went.
   */
  handOn(): boolean {
    const c = this.coop;
    if (this.mode !== 'run' || !c?.company || !this.run || this.result || !c.firstInLine()) return false;
    const to = c.handOver(true)!, job = this.run.job;
    this.coop = null;
    this.handed = { code: c.room, lead: to, job };
    // (A reload meanwhile follows them too, rather than leading again from this page's own save.)
    keepSession({ code: c.room, lead: to, job, hero: this.profile.id });
    return true;
  }

  /** Back in sight after handing the job on: a guest of whoever has it now. */
  backAsGuest(): void {
    const h = this.handed;
    if (!h) return;
    this.handed = null;
    this.startRemote(new CoopGuest(h.code, this.profile.id, h.lead, () => this.profile, h.job), true);
  }

  /** Follow a friend's job (they lead): their room is drawn here as it comes. `told`: say who hosts once known. */
  startRemote(g: CoopGuest, told = false): void {
    this.handed = null;
    this.hostSeen = told ? null : g.lead;
    // (One job's socket at a time: a follower before this one, or a job led here, closes.)
    if (this.remote && this.remote !== g) this.remote.close();
    this.coop?.close();
    this.coop = null;
    this.mode = 'run';
    this.outside = null;
    this.rooms.reset(null);
    this.remote = g;
    this.holdUntil = 0;
    this.jobKey = g.code;
    // The end, heard while this page is hidden, is kept at once (a phone may kill the page before it's back).
    g.onEnd = (e) => bankEnd(this.profile.id, g.code, e);
    // Until the leader's room arrives: the job as it was posted.
    this.run = newRun(g.job);
    keepSession({ code: g.code, lead: g.lead, job: g.job, hero: this.profile.id });
  }

  /** The leader's gone: take their job on from the last whole job they sent, and lead it. */
  private takeOver(g: CoopGuest): void {
    // Their `me` is them again; mine is me.
    const o = JSON.parse(g.save!.split('"me"').join(`"${g.lead}"`).split(`"${g.myId}"`).join('"me"')) as JobSave;
    g.close();
    this.leadFrom(g.code, { ...o, members: o.members.map(([id, name]) => [id === 'me' ? g.myId : id, name]) }, 'take');
    // They went home (LEAVE): their hero goes with them, not left standing in the way.
    const f = g.left ? this.coop?.friends.get(g.lead) : undefined;
    if (f) (f.gone = true), this.dropFriend(g.lead);
    if (this.coop) (this.hostSeen = this.profile.id), (this.hostNote = PW.youHostNow);
  }

  /**
   * Online play went off (the month's Redis budget is used up): no parties gathering, and whatever job
   * is on goes on in this browser alone, the room running here as in the one-file build. Leading: the
   * friends are let go. Following: this page takes the job on from the leader's last whole job (or,
   * with none heard yet, the job is lost, as when a leader never comes).
   */
  playAlone(): void {
    this.parties?.quit();
    this.parties = null;
    this.holdUntil = 0;
    this.coop?.cutOff();
    if (this.remote) this.remote.cut = true;
  }

  /** Run the party's job here from a whole-job save, and lead it (if the relay agrees: else follow). */
  private leadFrom(code: string, o: JobSave, want: 'host' | 'take'): void {
    this.remote = null;
    this.mode = 'run';
    this.followers.clear();
    this.run = o.run;
    // The street and every house anyone's been in, as they were; you're wherever your hero was.
    const street = loadRoom(unpackRoom(o.room, o.run.job));
    this.rooms.load(street, o.houses);
    if (!this.rooms.roomOf(ME)) Object.assign(street.join(ME), street.map.hero), this.equip(street.heroes.find((x) => x.id === ME)!);
    this.room = this.rooms.roomOf(ME)!;
    // My kit as my save has it (newer than the job's save: a pickup in its last moments stays mine, and isn't on the floor again).
    dressKit(this.hero, this.profile);
    forgetTaken(this.rooms.all(), this.profile);
    this.jobKey = code;
    this.holdUntil = want === 'host' ? performance.now() / 1000 + HOLD : 0;
    const door = this.rooms.doorOf(this.room);
    this.outside = door ? { room: street, door, hero: this.hero } : null;
    this.roomKey = Math.max(this.roomKey, o.key ?? 0) + 2;
    this.synced.clear();
    this.coop = new CoopHost(code, this.profile.id, this.profile.name, this, o.members, want);
    keepSession({ code, lead: '', job: o.run.job, hero: this.profile.id });
    this.stepDown(o.run.job);
    // (Taken on because online play went off: nobody's coming.)
    if (FULL) this.playAlone();
  }

  private stepRemote(): FightEvent[] {
    const g = this.remote!, now = performance.now() / 1000;
    // Their room once it has me in it (until then, the town stands still behind the wait).
    if (g.room?.heroes.some((x) => x.id === ME)) {
      (this.room = g.room), (this.run = g.run ?? this.run);
      if (g.kitSeq !== this.kitSeen) (this.kitSeen = g.kitSeq), this.keepRemoteGear(this.hero);
    }
    // (Only the leader's word goes in the tally, when a new one comes: not the job as posted, while I wait to get back in.)
    if (g.run && g.run !== this.bankedRun) this.bankIt((this.bankedRun = g.run));
    const ev = g.take();
    this.growing();
    // Someone else hosts now (a takeover, a hidden host's hand-on): said once over my hero, by name.
    if (g.lead !== this.hostSeen && g.leadName) (this.hostSeen = g.lead), (this.hostNote = PW.hostMoved(g.leadName));
    if (g.shouldTake(now)) return this.takeOver(g), ev;
    if (g.ended) {
      g.close();
      this.remote = null;
      this.run = g.ended.run;
      this.finish(g.ended.won ? 'won' : 'beaten', true, true);
    } else if (g.lost(now)) this.dead();
    return ev;
  }

  /** This player's tally for the job, kept on this device as it changes (jobbank.ts: only used if the server's out of reach). */
  private bankIt(run: Run): void {
    if (this.jobKey && this.profile.id) bankJob(this.profile.id, { job: this.jobKey, run, party: !!(this.remote || (this.coop && this.coop.members.length > 1)) });
  }

  /** Leading again after a reload and the room held: still nobody? Then the party's gone. */
  private waiting(): boolean {
    if (!this.coop || [...this.coop.friends.values()].some((f) => f.profile)) return (this.holdUntil = 0), false;
    if (performance.now() / 1000 > this.holdUntil) this.dead();
    return true;
  }

  /**
   * The job can't be got back into (its leader gone and nobody took it on; back to lead it and nobody
   * answered): home, and what it owes me comes from the leader's record (settle).
   */
  private dead(): void {
    this.coop?.close();
    this.remote?.close();
    this.coop = this.remote = null;
    this.holdUntil = 0;
    forgetSession();
    this.run = null;
    this.enterTown({ x: 24.1, y: 14.8 });
    void this.settle();
  }

  /**
   * Whatever a job still owes this hero (it ended while they were away, or fell apart under them):
   * the leader's record on the server, or (that out of reach, or a job alone) this device's tally.
   * Paid once: the job goes in the hero's save as paid in the same store as the gold.
   */
  async settle(): Promise<void> {
    const p = this.profile, id = p.id;
    if (!id || this.settling) return;
    this.settling = true;
    try {
      const list = ONLINE ? await owedTo(id) : null;
      // (Moved on meanwhile: another hero, or out on a job. It waits for next time.)
      if (this.profile !== p || this.mode !== 'town' || this.run || this.result) return;
      const paid = new Set(p.paid ?? []), bank = banked(id);
      for (const o of list ?? []) if (paid.has(o.job)) dropOwed(id, o.job);
      const due = (list ?? []).find((o) => !paid.has(o.job));
      // This device's own: a job alone (never on the server), or any when the server's out of reach.
      const mine = bank && !paid.has(bank.job) && (!bank.party || list === null) ? bank : null;
      if (bank && (!mine || due?.job === bank.job)) unbank(id);
      const pay: { job: string; run: Run; end?: How; party: boolean } | null = due ? { job: due.job, run: due.run, end: due.run.end, party: true } : mine && { job: mine.job, run: mine.end?.run ?? mine.run, end: mine.end ? (mine.end.won ? 'won' : 'beaten') : undefined, party: mine.party };
      if (!pay) return;
      this.jobKey = pay.job;
      // Nothing earned: let it go quietly.
      if (!pay.end && !pay.run.gold && !pay.run.xp) return void ((p.paid = [...paid, pay.job].slice(-12)), store(this.save), unbank(id), ONLINE && dropOwed(id, pay.job));
      this.run = pay.run;
      this.finish(pay.end ?? 'dropped', true, pay.party);
    } finally {
      this.settling = false;
    }
  }

  /**
   * Every player in the room (not the squire, not anyone down, not a friend who's gone quiet) stands in
   * `a`, and nobody who could walk is still indoors (they come out to go on with you).
   */
  together(a: Area | null): boolean {
    if (this.mode === 'run' && this.rooms.indoors().some((x) => x.act !== 'down' && !this.coop?.away(x.id))) return false;
    const ps = this.room.heroes.filter((x) => x.id !== 'squire' && x.act !== 'down' && !this.coop?.away(x.id));
    return !!a && ps.length > 0 && ps.every((x) => inArea(a, x.x, x.y));
  }

  /** In front of a Wickhold building's door. */
  private doorOf(door: string): { x: number; y: number } | undefined {
    const b = townMap(this.world).blocks.find((x) => x.door === door);
    return b && { x: doorAt(b).x, y: doorAt(b).y + 0.5 };
  }

  /**
   * The run's over, `how` (see How). `followed`: it was a friend's job (they write it on the board, not
   * you). `withParty`: a job with friends (going early keeps the pot as it was; alone, the job's lost).
   */
  private finish(how: How, followed = false, withParty = false): void {
    this.beatenAt = null;
    const run = this.run!, p = this.profile, w = this.world, won = how === 'won', key = this.jobKey;
    const party = this.coop ? this.coop.members.map(([id, name]) => (id === p.id ? p.name : name)) : [p.name];
    // Leading: everyone's told how it went (each friend's game pays them from the run), each hero named on its board.
    if (!followed) nameBoard(run, ME, p, this.coop?.members);
    this.coop?.end(won, run);
    forgetSession();
    this.coop?.close();
    this.coop = null;
    this.holdUntil = 0;
    // Paid already (a reload in the middle of paying it): never twice.
    if (key && p.paid?.includes(key)) return void ((this.run = null), unbank(p.id), this.enterTown({ x: 24.1, y: 14.8 }));
    // Driven back (or gone home from a job alone): half the gold. Gone early from a party: what was picked up while with them.
    const half = !won && !(withParty && (how === 'left' || how === 'dropped'));
    // Driven back in the Ransom Coat: all of it, not half.
    const ransom = half && p.armor?.hungry === 'ransom';
    // A bigger party: more pay and a better treasure; experience shared out so it's a little more, not a multiple (shared/pace.ts).
    const crowd = Math.max(1, run.party ?? 1), bonus = 1 + PARTY.reward * (crowd - 1);
    // Each one lost to a fire takes a share off the job's pay (shared/tuning.ts HOUSEBURN).
    const spared = 1 - Math.min(HOUSEBURN.lostMost, (run.lost ?? 0) * HOUSEBURN.lostCut);
    // The way taken at a fork (layout 4): a share more or less of the pay, more for each one saved down it (shared/waypay.ts).
    const way = wayGot(run.job, run.roads, run.saved), wayPay = won && way ? way.pay : 0;
    const gold = won ? run.gold + Math.round(run.job.reward * rewardMult(w) * bonus * spared * Math.max(0, 1 + wayPay)) : ransom ? 0 : half ? Math.round(run.gold / 2) : run.gold;
    if (ransom) p.gold = 0;
    // The Want grows with every job finished in hungry gear, and with what it killed.
    const hungry = this.hungryWorn();
    p.want += hungry.reduce((s, it) => s + HUNGRY[it.hungry as HungryId].want, 0) + (hungry.length ? run.kills * WANT.perKill : 0);
    // TOUCHED and TURNING gear grows it a little too, for every job it's worn on (shared/costs.ts).
    p.want += [p.arms[p.weapon], p.armor, ...p.rings].reduce((s, it) => s + (it ? TIER_WANT[it.quality] ?? 0 : 0), 0);
    const xp = jobXp(run.xp, won, crowd), rescued = won ? run.rescued : 0;
    p.gold += gold;
    p.runs++;
    // The recap's counts, before the deep relic and the treasure go in the pack (recaptally.ts).
    const recap = recapOf(run, this.mode === 'run' ? this.fightRoom : null, p, this.startKit, won, ME);
    this.startKit = null;
    const levels = gainXp(p, xp);
    if (levels) this.levelPop = p.level;
    // Grown on the way home (the job's pay): lit up back in Wickhold.
    if (levels > this.grown) this.levelSeq += levels - this.grown;
    this.grown = 0;
    // The sure relics (shared/relicaward.ts): a curated zone's climax (already noted on the run), else a
    // story mission, the expedition's beacon or a deep dive's butcher; each player's own roll. The first
    // is carried at once if nothing is.
    const relics = won ? wonRelics(run, run.job.seed * 977 + p.runs * 31 + p.xp, p.relics) : [], relic = relics[0];
    for (const r of relics) (p.relics.push(r), (p.relic ||= r.id));
    // Each one NEW in the pack, and its moment once the recap is closed (relicnews.ts).
    this.relicNews.push(...gainRelics(p, relics, true));
    // The church's light: one job less (any job, won or not).
    const lit = p.lit ?? 0;
    if (lit > 0) p.lit = lit - 1;
    // The treasure at the end: yours alone. What won't fit in the pack is sold on the spot.
    const found = won ? treasure(run.job, p.cls, p.id, p.runs, crowd, (run.sides ?? 0) + (way?.treasure ?? 0), run.level ?? 1) : [], kept = found.slice(0, Math.max(0, bagSize(p) - p.bag.length)), sold = found.slice(kept.length);
    p.bag.push(...kept);
    p.gold += sold.length * TREASURE_SOLD;
    this.result = { won, how, half, job: run.job, gold, xp, rescued, levels, relic, relics, treasure: kept, sold, lost: run.lost ?? 0, ledoff: run.ledoff ?? 0, netlost: run.netlost ?? 0, way: way ? wayLine(way) : undefined, lit: lit > 0 ? p.lit : undefined, recap };
    this.run = null;
    // Paid: marked so in the same store as the pay (the give below), then the tallies let go.
    if (key) p.paid = [...(p.paid ?? []), key].slice(-12);
    this.give({
      stats: { jobs: won ? 1 : 0, saved: rescued, kills: run.kills, dens: run.dens, butchers: run.butchers ?? 0, gold, raised: mine(run.raised, ME), falls: mine(run.falls, ME), carried: mine(run.carried, ME), teamkills: mine(run.teamkills, ME), rescueHits: run.rescueHits?.[ME] ?? 0, rescueKills: run.rescueKills?.[ME] ?? 0 }, rescued, dens: run.dens, days: 1,
      story: won && run.job.objective === 'story' ? run.job.id : undefined,
      deed: won && !followed ? { title: run.job.title, place: run.job.place.name, party } : undefined,
    });
    unbank(p.id);
    if (ONLINE && key && !key.startsWith('solo-')) dropOwed(p.id, key);
    this.enterTown({ x: 24.1, y: 14.8 });
  }

  /** The nearest thing to use where the hero stands: a person, a door, a spot in the open. */
  near(): Near | null {
    const h = this.hero, map = this.room.map, all: (Near & { x: number; y: number; reach?: number })[] = [];
    for (const n of map.npcs ?? []) {
      if (n.pose || n.mute) continue;
      const at = npcAt(n, this.room.time);
      all.push({ x: at.x, y: at.y, label: n.name, talk: n.talk as SpotId, arg: n.arg, npc: n, reach: n.reach });
    }
    for (const b of map.blocks) {
      if (!b.door || b.ruined || (b.burning ?? -1) >= 0) continue;
      const d = doorAt(b), name = b.label ?? NAMES[b.door.split(':')[0]] ?? 'THE BUILDING';
      all.push(b.locked ? { x: d.x, y: d.y, label: name + ' (BARRED)', talk: 'locked', key: b.door } : { x: d.x, y: d.y, label: 'ENTER ' + name, door: b });
    }
    if (this.mode === 'town' && !this.outside) for (const s of townSpots(this.world)) all.push({ x: s.x, y: s.y, label: s.label, talk: s.id, key: s.key });
    if (this.mode === 'yard') all.push({ x: RACK.post.x, y: RACK.post.y, label: 'THE STRAW MEN', talk: 'practice' });
    // Maeve's hound by the lodge's fire, and a Ranger's own wherever it's at heel and all's quiet (petting.ts, petwhen.ts).
    const pets = petSpots(this.mode === 'town' ? this.outside?.door.door : null, h, ownPetOk(h, this.room, this.mode));
    for (const s of pets) if (!s.last) all.push({ x: s.x, y: s.y, label: s.label, pet: s.pet, reach: s.reach });
    for (const c of this.room.chests) if (c.state === 'shut') all.push({ x: c.x, y: c.y, label: c.chained ? 'A CHAINED CHEST' : 'OPEN THE CHEST', chest: c.id });
    let best: Near | null = null, bd = SPOT_REACH;
    for (const n of all) {
      const d = Math.hypot(n.x - h.x, n.y - h.y) * (n.door ? 1.4 : 1) - (n.reach ?? 0);
      if (d <= bd) (bd = d), (best = n);
    }
    // Your own hound, at heel: only when there's nothing else here to use.
    for (const s of pets) if (!best && s.last && Math.hypot(s.x - h.x, s.y - h.y) - s.reach <= SPOT_REACH) best = { label: s.label, pet: s.pet };
    return best;
  }

  /**
   * Buy into the pack: a weapon of kind `kit` (your class's), armor of `armor` weight, or a ring.
   * Fine (green) at the smith, Forged (blue) from the trader. Null: too poor, or the pack is full.
   */
  buy(quality: 'fine' | 'forged', kit: WeaponId = this.profile.weapon, slot: 'weapon' | 'armor' | 'ring' = 'weapon', armor?: ArmorKind): Item | null {
    const p = this.profile, cost = SHOP[quality];
    if (p.gold < cost || bagFull(p) || (slot === 'weapon' && !CLASS_KITS[p.cls].includes(kit))) return null;
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
    const pressed = intent.attackSeq !== h.seen.attack || intent.rollSeq !== h.seen.roll || intent.blockSeq !== h.seen.block || intent.relicSeq !== h.seen.relic || (hold.need === 'element' && (intent.elementSeq ?? 0) !== (h.seen.element ?? 0)) || (hold.need === 'sign' && (intent.signSeq ?? 0) !== (h.seen.sign ?? 0));
    // Still talking: a tap or a key finishes the line first.
    if ((hold.need === 'continue' || hold.need === 'move' || hold.need === 'element' || hold.need === 'sign') && (this.continued || pressed) && this.typing()) {
      this.finishTyping();
      this.continued = false;
      Object.assign(h.seen, { attack: intent.attackSeq, roll: intent.rollSeq, block: intent.blockSeq, relic: intent.relicSeq, element: intent.elementSeq ?? h.seen.element, sign: intent.signSeq ?? h.seen.sign });
      return true;
    }
    let done = false;
    if (hold.need === 'time') done = hold.t >= hold.until;
    else if (hold.need === 'continue') done = this.continued || (hold.t > 0.6 && pressed);
    else if (hold.need === 'move') done = hold.t > (hold.kind === 'act' ? 0.1 : 0.6) && (Math.hypot(intent.mx, intent.my) > 0.3 || this.continued);
    else if (hold.need === 'roll') done = intent.rollSeq !== h.seen.roll;
    else if (hold.need === 'block') done = intent.blockSeq !== h.seen.block || intent.block;
    else if (hold.need === 'attack') done = intent.attackSeq !== h.seen.attack;
    // The element card: a press of ELEMENT goes on and switches as the world restarts (or a tap on the card).
    else if (hold.need === 'element') done = (intent.elementSeq ?? 0) !== (h.seen.element ?? 0) || this.continued;
    // A MARK or MEND card: the press goes on and goes off as the world restarts.
    else if (hold.need === 'sign') done = (intent.signSeq ?? 0) !== (h.seen.sign ?? 0) || this.continued;
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
    stepWood(w, this.room, ev, dt);
    if (cut >= 0 && w.cut < 0 && !this.woodReplay) (this.profile.cutSeen = true), store(this.save);
    // Out of the Stoker: the javelin, on the RELIC button at once.
    if (w.relic && !h.found.some((r) => r.kind === 'javelin')) {
      const jav = makeRelic(new Rng(7), 'javelin');
      h.found = [jav];
      h.relicItem = jav.id;
      h.relics = abilitiesOf(this.profile.cls, 'javelin', this.profile.skill);
      if (!knows(h, 'skill')) h.relic = 'javelin';
    }
    // Practice throws in the wood are free: the javelin is topped up after every step, so it never fades
    // here and every hero reaches Wickhold with it full (the lore keeper, 2026-11-05).
    for (const r of h.found) r.charge = relicMax(r);
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
    return !!this.levelUp(it);
  }
  /** The same, and the piece as it is now (to strike it yourself after: anvilmode.ts). */
  levelUp(it: Item): Item | null {
    const p = this.profile, cost = nextLevel(it);
    if (!cost || p.gold < cost.gold || p.steel < cost.steel) return null;
    p.gold -= cost.gold;
    p.steel -= cost.steel;
    const next = { ...it, level: (it.level ?? 0) + 1 };
    this.replace(it, next);
    return next;
  }
  /** Struck well at the anvil (shared/forgestrike.ts): a little more on top of the upgrade just paid for. */
  temper(it: Item, add: number): Item {
    if (add <= 0 || !this.gearList().includes(it)) return it;
    const next = { ...it, temper: Math.round(((it.temper ?? 0) + add) * 1000) / 1000 };
    this.replace(it, next);
    return next;
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
  /** (Kit as keepkit.ts keeps it: a weapon swapped from the pack, a relic carried, the Mage's element too.) */
  private keepRemoteGear(h: Hero): void {
    this.keepNoting(h, true);
  }

  private keepGear(h: Hero): void {
    this.keepNoting(h, false);
  }

  /** The room's word on my kit into my save; a relic it brought (a pickup, mine or in the leader's room) gets its moment. */
  private keepNoting(h: Hero, copy: boolean): void {
    const k = keepKitNoting(this.profile, h, copy);
    if (!k.changed) return;
    this.relicNews.push(...k.news);
    store(this.save);
  }

  /** A relic looked at in the pack: no longer NEW. */
  seeRelic(id: string): void {
    if (seeRelic(this.profile, id)) store(this.save);
  }

  /** Carry a relic you own into your next job (by its id; '' none). */
  carry(id: string): void {
    const p = this.profile;
    if (id && !p.relics.some((r) => r.id === id)) return;
    p.relic = id;
    this.relicsChanged();
  }

  /** The church changed this hero's relics or light (relicchurch.ts): dress the hero again and keep it. */
  relicsChanged(): void {
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** The relic-wright fits an element to a relic (or takes it off, free). */
  fitAugment(r: RelicId, el: Augment): boolean {
    const p = this.profile, cost = el ? SHOP.augment : 0;
    // Found relics come with their element or none (shared/relicitems.ts): only the class skills take one.
    if (p.gold < cost || !SKILL_CHOICES[p.cls].includes(r)) return false;
    p.gold -= cost;
    p.augments[r] = el;
    this.hero.augments[r] = el;
    store(this.save);
    return true;
  }

  /**
   * What this hero does to the shared world: applied here at once, sent to the world server, and on
   * the hero's own line. (The council's week closes the same way online or off: story.ts settle.)
   */
  give(c: Omit<Contribution, 'hero'>): void {
    const p = this.profile, before = this.townKey();
    const full: Contribution = { ...c, hero: { id: p.id, name: p.name, cls: p.cls } };
    // Online the world server rolls the nights for raids (everyone sees the same one); off it, this browser does.
    contribute(this.world, full, Date.now(), !this.link?.online);
    for (const [k, n] of Object.entries(c.stats ?? {})) p.stats[k as keyof typeof p.stats] += n ?? 0;
    store(this.save);
    this.link?.send(full);
    if (this.townKey() !== before) this.rebuildTown();
  }

  /** The council's week, looked at now (each frame): past its close, it's decided here too, online or off. */
  settleCouncil(): void {
    const before = this.townKey();
    if (!settle(this.world, Date.now())) return;
    store(this.save);
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

  /** Knacks are taken and given back anywhere out of a fight: in town (the job's end is shown there too). */
  get knacksOpen(): boolean {
    return this.mode === 'town';
  }

  /** Take one of the two knacks on offer (shared/chains.ts). */
  pickPerk(id: PerkId): void {
    if (!this.knacksOpen || !takePerk(this.profile, id)) return;
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** Give every knack back, free: each comes back as a pick. */
  resetPerks(): void {
    if (!this.knacksOpen || !this.profile.perks.length) return;
    resetPerks(this.profile);
    this.equip(this.hero, this.hero);
    store(this.save);
  }

  /** Your vote at the council (it decides once enough heroes have voted). */
  /** Pay your trainer to teach you your class skill, or your dodge's leave-behind (once your level allows). */
  learn(what: Learned): void {
    const p = this.profile;
    if (!learnLesson(p, what)) return;
    const h = this.hero;
    h.learned = p.learned;
    if (what === 'skill') h.relic = h.relics[0];
    store(this.save);
  }

  /** Pay your trainer to teach you another of your class's skills (shared/skillteach.ts); you carry it at once. */
  learnSkill(r: RelicId): void {
    const p = this.profile;
    if (!learnSkill(p, r)) return;
    const h = this.hero;
    h.learned = p.learned;
    this.chooseSkill(r);
    store(this.save);
  }

  /** Carry another of your class's skills (once taught; free, at the trainer). */
  chooseSkill(r: RelicId): void {
    const p = this.profile, h = this.hero;
    if (!SKILL_CHOICES[p.cls].includes(r) || !knowsSkill(p, r)) return;
    const was = h.relics[0];
    p.skill = r;
    h.relics = abilitiesOf(p.cls, h.relics[1], r);
    if (h.relic === was) h.relic = r;
    h.augments[r] = p.augments[r] ?? '';
    store(this.save);
  }

  /** Pay the trainer for the next rank of a drill (if you can afford it and your level allows). */
  buyDrill(id: DrillId): void {
    const p = this.profile;
    if (!buyDrill(p, id)) return;
    const h = this.hero;
    h.drills = p.drills;
    refreshHealth(h);
    store(this.save);
  }

  /** My input as it goes to the room: with the levels I've grown counted in. */
  own(i: Intent): Intent {
    return { ...i, levelSeq: this.levelSeq };
  }

  /** On a job: a level surely earned (kills and rescues so far) is lit now, in the room, for everyone to see. */
  private growing(): void {
    if (!this.run || this.mode !== 'run') return;
    const due = dueLevels(this.profile, this.run.xp, Math.max(1, this.run.party ?? 1));
    if (due > this.grown) (this.levelSeq += due - this.grown), (this.grown = due);
  }

  vote(choice: string): void {
    this.give({ vote: choice, voter: device() });
  }
}

/** A friend's hero takes their press counters as already seen (so nothing pressed in town fires). */
function syncSeen(h: Hero, i: Intent): void {
  Object.assign(h.seen, { attack: i.attackSeq, block: i.blockSeq, roll: i.rollSeq, weapon: i.weaponSeq, relic: i.relicSeq, relicSwap: i.relicSwapSeq, relicPick: i.relicPickSeq, augment: i.augmentSeq, cls: i.classSeq, take: i.takeSeq, grab: i.grabSeq, gear: i.gearSeq, potion: i.potionSeq, belt: i.beltSeq ?? 0, open: i.openSeq, level: i.levelSeq ?? 0, reload: i.reloadSeq ?? 0, element: i.elementSeq ?? 0, sign: i.signSeq ?? 0 });
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
