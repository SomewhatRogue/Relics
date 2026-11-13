/**
 * A hero's progress between runs: gold, experience and levels, perks chosen at the trainer, and the
 * weapons found. Levels open choices (one of two knacks on the tree, chains.ts), never a stat that quietly climbs.
 */
import type { Drills } from './drills.js';
import type { Item } from './loot.js';
import type { Pawn } from './bags.js';
import type { PotionId } from './potions.js';
import { CLASS_ARMOR } from './gear.js';
import type { Augment, RelicId } from './magic.js';
import type { RelicItem } from './relicitems.js';
import { CLASS_KITS, type HeroClass, type WeaponId } from './weapons.js';

export { PERKS, perkFx, perkText, type Fx, type FxKey, type Knack, type PerkId } from './perks.js';
export { CHAINS, CLASS_CHAINS, chainOf, classPerks, fitPerks, nextStep, perkOffer, resetPerks, takePerk, type ChainId } from './chains.js';
import type { PerkId } from './perks.js';
import type { WatchRecord } from './watchpay.js';
import { defaultHound, type HoundLook } from './houndlook.js';
import { newErrands } from './errands.js';
import { newQuests } from './heroquests.js';
import { jobs } from './coins.js';

/** Chapter 1's level cap (it lifts when the council moves the story on). */
export const LEVEL_CAP = 10;
/**
 * Total experience to reach a level: 250, 780, 1590, 2680... (Kyle, 2026-11-02: levels came too fast).
 * A typical solo hero is level 3 after about three jobs and level 5 after about nine (docs/DECISIONS.md).
 */
export const xpFor = (level: number) => (level - 1) * (140 * (level - 1) + 110);
export const levelFor = (xp: number) => {
  let l = 1;
  while (l < LEVEL_CAP && xp >= xpFor(l + 1)) l++;
  return l;
};

/**
 * What a hero has done, for the Roll of the Brave (the leaderboard). `rescueHits` and `rescueKills`:
 * blows landed on people you'd freed, and freed people you killed. `carried` (picked up by friends) is
 * still counted but off the board.
 */
export interface Stats { jobs: number; saved: number; kills: number; given: number; dens: number; butchers: number; gold: number; raised: number; falls: number; carried: number; teamkills: number; rescueHits: number; rescueKills: number }
/** The Roll of the Brave: honours first, then the tallies nobody wants to top. */
export const STAT_ORDER: (keyof Stats)[] = ['jobs', 'saved', 'butchers', 'kills', 'gold', 'given', 'dens', 'raised', 'falls', 'rescueHits', 'rescueKills', 'teamkills'];
export const SHAME: (keyof Stats)[] = ['falls', 'rescueHits', 'rescueKills', 'teamkills'];
export const STAT_NAME: Record<keyof Stats, string> = { jobs: 'JOBS DONE', saved: 'BROUGHT HOME', butchers: 'BUTCHERS KILLED', kills: 'GOBLINS KILLED', gold: 'COIN EARNED', given: 'COIN GIVEN', dens: 'DENS BURNED', raised: 'FRIENDS PICKED UP', falls: 'TIMES KNOCKED DOWN', carried: 'PICKED UP BY FRIENDS', teamkills: 'FRIENDS FLOORED', rescueHits: 'RESCUES STRUCK', rescueKills: 'RESCUES KILLED' };
export const newStats = (): Stats => ({ jobs: 0, saved: 0, kills: 0, given: 0, dens: 0, butchers: 0, gold: 0, raised: 0, falls: 0, carried: 0, teamkills: 0, rescueHits: 0, rescueKills: 0 });

export interface Profile {
  /** Who this hero is on the Roll of the Brave (made once, never shown). */
  id: string;
  /** The hero's name, and the class chosen when they were made (for life). */
  name: string;
  cls: HeroClass;
  /** The purse, in copper (shared/coins.ts). */
  gold: number;
  /** The coins' save version: set once the purse is carried over to copper at the new prices (coins.ts fitPurse). */
  coin?: number;
  /** A bid for the statue in the square, paid and waiting on the world's answer (shared/statue.ts). */
  statueBid?: import('./statue.js').BidNote;
  xp: number;
  level: number;
  perks: PerkId[];
  /** Drills paid for at the trainer (drills.ts). */
  drills?: Drills;
  /** What the trainer has taught: the class skill, the dodge's leave-behind. Undefined on old heroes (they know it all). */
  learned?: ('skill' | 'leave')[];
  /** The class skills taught after the first (shared/skillteach.ts). Undefined on heroes taught before
   *  there were three: a Warrior of then knows the War Cry too. */
  taught?: RelicId[];
  /** The Deep's deepest floor this hero has ever reached, alone or with friends (shared/deepskill.ts). */
  deepBest?: number;
  /** Taught their class's Deep skill at the trainer (shared/deepskill.ts). */
  deepTaught?: boolean;
  /** Level ups not yet spent at the trainer. */
  picks: number;
  /** The weapon in hand (`weapon`, plain if `arms` has nothing for it) and the pack. */
  arms: Partial<Record<WeaponId, Item>>;
  weapon: WeaponId;
  bag: Item[];
  /** Pack cells bought, the vault under the counting house and its shelves, Tobin's buyback (shared/bags.ts). */
  bagSize?: number;
  stash?: Item[];
  stashSize?: number;
  buyback?: Pawn[];
  /** What's been bought off a vendor's stock this ten minutes (shared/vendors.ts). */
  bought?: string[];
  /** Coals fed to a Healer's censer (sim/lantern.ts). */
  glow: number;
  /** Potions on the belt (shared/potions.ts). */
  belt: PotionId[];
  /** Finished the prologue wood; carrying Hew's tally stick for Odric; a Healer's censer still cold; seen the cutscene. */
  prologue: boolean;
  tally: boolean;
  cold: boolean;
  cutSeen: boolean;
  /** Sorts of goblin this hero has met (shared/practice.ts sortKey): the yard's pens offer those. */
  met?: string[];
  /** The Want: hidden, never shown as a number (shared/hungry.ts, docs/lore/story-bible.md). */
  want: number;
  /** Steel from melting gear down (Halvard's upgrades). */
  steel: number;
  /** Worn armor and rings (shared/gear.ts). */
  armor: Item | null;
  rings: Item[];
  /** Relics owned, each with its charge (shared/relicitems.ts), and the id of the one carried ('' none). */
  relics: RelicItem[];
  relic: string;
  /** Relics gained but not looked at yet (ids; the pack marks them NEW), and whether the first relic's tip has been shown. */
  relicNew?: string[];
  /** The first named butcher this hero killed gave its sure relic (sim/namedrelic.ts): once a hero. */
  namedRelic?: boolean;
  relicTip?: boolean;
  /** Jobs left carrying the church's light (shared/church.ts), and relics forged two for one so far (seeds the next). */
  lit?: number;
  forges?: number;
  /** The class skill carried, when the class has a choice of them (the first, until picked). */
  skill?: RelicId;
  /** Which of its class's three looks (chosen when made). */
  look?: number;
  /** A Ranger's hound: breed, coat, white and name, chosen with Maeve at the lodge (shared/houndlook.ts). Cosmetic. */
  hound?: HoundLook;
  /** A Warrior's shield: shape, field, device and trim, chosen with Master Cole at the barracks (shared/shieldlook.ts). Cosmetic. */
  shield?: import('./shieldlook.js').ShieldLook;
  /** Elements the relic-wright has fitted to this hero's skill and relics. */
  augments: Partial<Record<RelicId, Augment>>;
  runs: number;
  stats: Stats;
  /** A coin in the well: the next job starts blessed. */
  wish: boolean;
  /** Dice games played (seeds the next roll). */
  dice: number;
  /** Its name turned out to be another hero's (api/names.ts): asked for a new one before it plays. */
  rename?: boolean;
  /** The last few jobs this hero has been paid for (client/jobbank.ts): a job is never paid twice. */
  paid?: string[];
  /** Made, or brought over, since each class's own button (shared/signs.ts, shared/oldskills.ts). */
  signs?: boolean;
  /** The Night Watch: best score on the wall, and the pay taken tonight (shared/watchpay.ts). */
  watch?: WatchRecord;
  /** Fishing at the millpond: casts made (seeds the next), fish landed, the biggest of each kind (shared/fishing.ts). Just for fun. */
  fishing?: import('./fishing.js').FishRecord;
  /** The archery range at the hunters' lodge: rounds shot (seeds the next) and the best (shared/range.ts). */
  range?: import('./range.js').RangeRecord;
  /** Down in the Deep: the kit taken down, and the last checkpoint's (shared/deepkit.ts). Gone once out. */
  /** The word last given to Cobb at the grate (shared/deepgate.ts): it lets you down while it's the week's. */
  deepSaid?: string;
  deep?: import('./deepkit.js').DeepRun;
  /** Arm-wrestling at the Drowned Rat: bouts (seeds the next), wins, who you've put down (shared/armwrestle.ts). */
  arm?: import('./armwrestle.js').ArmRecord;
  /** The Rat's knife board: rounds thrown (seeds the next) and the best (shared/knives.ts). */
  knives?: import('./knives.js').KnifeRecord;
  /** Shifts at Halvard's forge: how many (seeds the next), the best, the rest before the next paid one (shared/shiftpay.ts). */
  shift?: import('./shiftpay.js').ShiftRecord;
  /** Strikes made at Halvard's anvil (seeds the next: shared/forgestrike.ts). */
  strikes?: number;
  /** A bet down on a bout or a round at the Rat, till it's settled (shared/stakes.ts). */
  stake?: import('./stakes.js').Stake;
  /** Town errands: the first two, and the trainer's word on a new skill (shared/errands.ts). Undefined: none due (old heroes). */
  errands?: import('./errands.js').Errands;
  /** Hero quests: the one in hand and those done (shared/heroquests.ts). Undefined: an old hero, done up to their level. */
  quests?: import('./heroquests.js').Quests;
}

export const newProfile = (cls: HeroClass = 'WARRIOR', name = 'HERO', id = heroId()): Profile =>
  ({ id, ...(cls === 'RANGER' ? { hound: defaultHound(id) } : {}), name, cls, gold: 0, coin: 1, xp: 0, level: 1, perks: [], learned: [], picks: 0, arms: {}, weapon: CLASS_KITS[cls][0], bag: [], glow: 0, belt: ['bitter'], armor: { slot: 'armor', armor: CLASS_ARMOR[cls], quality: 'plain', traits: [], mods: [], level: 0 }, rings: [], steel: 0, want: 0, prologue: false, tally: false, cold: false, cutSeen: false, relics: [], relic: '', augments: {}, runs: 0, stats: newStats(), wish: false, dice: 0, signs: true, errands: newErrands(), quests: newQuests() });

export function heroId(): string {
  const c = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = 'h';
  for (let i = 0; i < 11; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

/** Up to three heroes per player; each keeps its own class, level and kit (the world is shared). */
/** One hero of each class (Kyle, 2026-11-13: "only one of each class"), so five at most. */
export const HERO_SLOTS = 5;
/** A new hero of `cls` may be made: none of that class yet. */
export const canMake = (heroes: readonly { cls: string }[], cls: string): boolean => !heroes.some((h) => h.cls === cls);

/** Add experience; returns how many levels were gained (each is a pick at the trainer). */
export function gainXp(p: Profile, n: number): number {
  p.xp += n;
  const l = levelFor(p.xp), gained = l - p.level;
  if (gained > 0) (p.level = l), (p.picks += gained);
  return gained;
}

/** Gold and experience for a kill. */
/** `spider`, `brood`, `nest`: xp for spiders (they carry no gold). */
export const BOUNTY = { scrapper: { gold: 4, xp: 5 }, butcher: { gold: 30, xp: 30 }, boss: { gold: 80, xp: 80 }, spider: { gold: 0, xp: 2 }, brood: { gold: 0, xp: 30 }, nest: { gold: 0, xp: 10 }, rescue: 15, objective: 40 };
export const SHOP = { fine: jobs(1.2), forged: jobs(3.5), augment: jobs(1), wish: 5 };
