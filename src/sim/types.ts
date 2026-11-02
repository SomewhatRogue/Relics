/** The fight's state. Plain data: the same shape is drawn locally and (later) sent to friends. */
import type { Augment, Item, PotionId, Tier, PropKind, Quality, RelicId, TraitId, WeaponId } from '../shared/tuning';

/** What a player's device sends: held state plus press counters, so a quick tap is never lost. */
export interface Intent {
  /** Move stick, length 0..1. */
  mx: number;
  my: number;
  /** Aim direction (laptop: toward the mouse; phone: 0,0 means "auto"). */
  ax: number;
  ay: number;
  attack: boolean;
  block: boolean;
  attackSeq: number;
  blockSeq: number;
  rollSeq: number;
  weaponSeq: number;
  relicSeq: number;
  relicSwapSeq: number;
  /** Equip the relic in loadout slot `relicPick` (counted by relicPickSeq). */
  relicPickSeq: number;
  relicPick: number;
  /** Cycle the equipped relic's augment (none, fire, frost, storm). */
  augmentSeq: number;
  /** Change class (the demo's class button). */
  classSeq: number;
  /** Grab a small goblin; while carrying, throw it. */
  grabSeq: number;
  /** Take the loot drop with id `take` (counted by takeSeq). */
  takeSeq: number;
  take: number;
  /** Change gear from the pack (counted by gearSeq): `gearOp` 1 equip pack item `gearArg` (-1: the plain
   * weapon), 2 drop pack item `gearArg`, 3 carry found relic `gearArg` (-1: none). See sim/pack.ts. */
  gearSeq: number;
  gearOp: number;
  gearArg: number;
  /** Drink (or throw) the potion at the front of the belt. */
  potionSeq: number;
  /** Open chest `open` (counted by openSeq). */
  openSeq: number;
  open: number;
}

export const NO_INTENT: Intent = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0, weaponSeq: 0, relicSeq: 0, relicSwapSeq: 0, relicPickSeq: 0, relicPick: 0, augmentSeq: 0, classSeq: 0, grabSeq: 0, takeSeq: 0, take: 0, gearSeq: 0, gearOp: 0, gearArg: 0, potionSeq: 0, openSeq: 0, open: 0 };

export type HeroAct = 'idle' | 'charge' | 'attack' | 'throw' | 'zip' | 'roll' | 'hurt' | 'stun' | 'down' | 'carry' | 'slam';

/** Anything that can be pushed: a slide (knockback) decays each tick. */
export interface Body {
  x: number;
  y: number;
  kvx: number;
  kvy: number;
  /** Seconds left airborne (thrown): it barely slows until it lands. */
  air?: number;
  /** Which level it stands on: 0 the ground, 1 up on a ledge (see shared/arena.ts). */
  z?: number;
  /** Set when it went off a ledge's edge (how fast it was moving); the room deals with the landing. */
  dropped?: number;
}

export interface Hero extends Body {
  id: string;
  /** Facing, a unit vector. */
  fx: number;
  fy: number;
  moving: boolean;
  hp: number;
  stamina: number;
  staminaAt: number;
  weapon: WeaponId;
  act: HeroAct;
  actT: number;
  actDur: number;
  combo: number;
  /** The swing in progress is the charged heavy, at this power (0..1). */
  heavy: boolean;
  power: number;
  /** This swing is a counter (started inside the counter window after a parry). */
  counter: boolean;
  hitIds: number[];
  blocking: boolean;
  parryOpenAt: number;
  lastBlockPress: number;
  rollDx: number;
  rollDy: number;
  lastRollAt: number;
  /** Where the last roll started (a roll out of a blow's reach counts as dodging it). */
  rollX: number;
  rollY: number;
  /** A Mage's blink image: where, and until when (goblins near it go for it). */
  decoyX: number;
  decoyY: number;
  decoyUntil: number;
  /** The block press we last told this hero their class can't hold a block on (told once a press). */
  toldAt: number;
  counterUntil: number;
  attackQueuedAt: number;
  rollQueuedAt: number;
  relic: RelicId;
  /** The relics carried into this fight (at most RELIC_SLOTS). */
  relics: RelicId[];
  /** When each relic is ready again. */
  relicReady: Record<RelicId, number>;
  relicQueuedAt: number;
  /** The augment fitted to each relic. */
  augments: Record<RelicId, Augment>;
  /** Blessed by a healer until then: hits harder, takes less. */
  blessedUntil: number;
  /** A Healer's ward on this hero: until when, and how much more it can take. */
  wardUntil: number;
  wardHp: number;
  /** Rallied by a war horn until then: stamina comes back faster, blocking costs less. */
  rallyUntil: number;
  /** The weapon found for each kit (a kit not listed is the plain one). */
  arms: Partial<Record<WeaponId, Item>>;
  /** Coals fed to a Healer's censer (sim/lantern.ts). */
  glow: number;
  /** Potions on the belt; the front one is next (sim/flasks.ts). */
  belt: PotionId[];
  potionReady: number;
  /** Health still to come from a Bitter. */
  mendLeft: number;
  /** Wall Brandy: breath comes back faster until then. */
  brandyUntil: number;
  /** In smoke: goblins can't see you (unless close) until then. */
  hiddenUntil: number;
  /** Weapons, armor and rings carried, not worn. */
  bag: Item[];
  /** Worn armor (none: as light) and up to two rings (shared/gear.ts). */
  armor: Item | null;
  rings: Item[];
  /** Health before gear. */
  baseHp: number;
  /** Gold this hero can spend in a fight (Spendthrift, the Ransom Coat): theirs plus the job's so far. */
  purse: number;
  /** Hungry gear's counters (sim/hungry.ts): kills fed to the Larder Pike, the last kill, the next bite, the coat used. */
  fed: number;
  lastKill: number;
  biteAt: number;
  ransomed: boolean;
  /** The Want, for the eyes (never shown as a number). */
  want: number;
  /** Lying where you fell, before Hew gets you up (the wood's opening). */
  lying?: boolean;
  /** A Healer's censer gone cold (the prologue, until Isolde relights it): no heals given. */
  cold: boolean;
  /** Relics this hero has won (one at a time is carried, in relics[1]). */
  found: RelicId[];
  /** The draw in flight was released on the white flash. */
  perfect: boolean;
  /** Dodged through a blow (TEMPO): the next hit before then lands double. */
  tempoUntil: number;
  maxHp: number;
  /** Perks chosen at the trainer (see shared/progress). */
  perks: string[];
  /** The goblin held overhead (0: none). */
  carrying: number;
  /** The prop held overhead (0: none). */
  lifting: number;
  grabQueuedAt: number;
  hitstop: number;
  /** Extra parry and dodge leniency for this player's ping (seconds). */
  lenience: number;
  seen: { attack: number; block: number; roll: number; weapon: number; relic: number; relicSwap: number; relicPick: number; augment: number; cls: number; take: number; grab: number; gear: number; potion: number; open: number };
}

export type AttackKind = 'cleave' | 'slam' | 'swing' | 'stab' | 'shot' | 'draw' | 'charge';

export interface EnemyAttack {
  kind: AttackKind;
  t: number;
  windup: number;
  active: number;
  recover: number;
  dmg: number;
  knock: number;
  unblockable: boolean;
  /** Direction, locked when the wind-up starts so the telegraph never lies. */
  dx: number;
  dy: number;
  ox: number;
  oy: number;
  range: number;
  arc: number;
  /** Slam: a circle at (cx, cy). */
  cx: number;
  cy: number;
  radius: number;
  done: boolean;
  /** A charge: who it has already run through. */
  hit?: string[];
  /** Too heavy to block: a guard that meets it breaks (parry it instead). */
  crush?: boolean;
}

export type EnemyKind = 'butcher' | 'scrapper' | 'dummy' | 'swingDummy';
export type EnemyAct = 'idle' | 'chase' | 'attack' | 'stunned' | 'flinch' | 'carried' | 'pinned' | 'dead';

export interface Enemy extends Body {
  id: number;
  kind: EnemyKind;
  fx: number;
  fy: number;
  hp: number;
  maxHp: number;
  radius: number;
  weight: number;
  act: EnemyAct;
  actT: number;
  actDur: number;
  attack: EnemyAttack | null;
  cooldown: number;
  hitstop: number;
  /** Time of the last hit taken, for the flash and the health ring. */
  hitAt: number;
  moving: boolean;
  home: { x: number; y: number };
  /** A corpse carried on a javelin, or pinned to a wall by one. */
  corpse: '' | 'carried' | 'pinned';
  /** Elements: burning until, next burn tick, chilled until, frozen solid until (room time). */
  burnUntil: number;
  burnNext: number;
  chillUntil: number;
  frozenUntil: number;
  /** Caught in a hunter's net until then (small goblins can't move or act; big ones are slowed). */
  snareUntil: number;
  /** The hero who last hit it (who threw it into the wall). */
  lastBy: string;
  /** How it died, for the body left behind. */
  death: DeathKind;
  /** Comes back after dying (the training room); run goblins stay dead. */
  respawns: boolean;
  /** A scrapper with a bow (see ARCHER). */
  bow?: boolean;
  /** Tutorial pacing in the wood: slower wind-ups (sim/wood.ts DRILL). */
  drill?: boolean;
  /** A goblin built for one lesson in the prologue wood (shared/wood.ts VARIANTS). */
  variant?: 'looter' | 'lunger' | 'heavy' | 'stoker';
  /** False while it hasn't noticed anyone (see ALERT); undefined counts as awake. */
  alert?: boolean;
  /** A named goblin (a hunt's quarry, a story boss). */
  name?: string;
}

/** How a goblin died: fell, lost its head, burst apart, burned, or shattered. */
/** `halve`: cut in two at the waist; `opened`: cut down with a slash across the chest. */
export type DeathKind = '' | 'fall' | 'behead' | 'halve' | 'opened' | 'burst' | 'burn' | 'shatter';

/** A barrel, crate, table or broken piece: a body that can be smashed, pushed, lifted and thrown. */
export interface Prop extends Body {
  id: number;
  kind: PropKind;
  hp: number;
  radius: number;
  weight: number;
  /** Held overhead by a hero. */
  lifted: boolean;
  lastBy: string;
  hitAt: number;
  /** Broken: gone until `respawnAt` (big props) or for good (pieces, at `respawnAt` -1). */
  broken: boolean;
  respawnAt: number;
  /** Where it came back to; pieces have none and fade at `fadeAt`. */
  home: { x: number; y: number } | null;
  fadeAt: number;
  /** Spin while flying, for drawing. */
  spin: number;
}

/** Blessed ground: a circle that mends and blesses allies and burns goblins, ticking every half second. */
export interface Zone {
  x: number;
  y: number;
  r: number;
  until: number;
  next: number;
  owner: string;
  el: Augment;
}

/** A weapon lying where a goblin fell. */
export interface Drop {
  id: number;
  x: number;
  y: number;
  item: Item;
  life: number;
  /** A chest's roll: only this player sees it and can take it. */
  owner?: string;
}

export type FightEvent =
  /** `src`: what landed it (a kit, or a shot's kind), for its sound; `big`: on the butcher. */
  | { k: 'hit'; x: number; y: number; n: number; heavy: boolean; on: 'enemy' | 'hero'; counter?: boolean; backstab?: boolean; tick?: boolean; src?: string; big?: boolean }
  | { k: 'swing'; x: number; y: number; src: string; heavy: boolean }
  | { k: 'death'; x: number; y: number; how: DeathKind; dx: number; dy: number; kind: EnemyKind }
  | { k: 'block' | 'parry' | 'guardbreak' | 'dodge' | 'slip' | 'down' | 'roll' | 'stunned' | 'wallhit' | 'charged' | 'heavy'; x: number; y: number }
  | { k: 'windup' | 'impact'; x: number; y: number; kind: AttackKind }
  /** The prologue's cutscene: the ground shaking, the bite, a body landing, the Stoker's bellow. */
  | { k: 'rumble' | 'bite' | 'thud' | 'bellow' | 'fanfare'; x: number; y: number }
  /** A Ranger or Rogue holding block (it does nothing), or a Mage pressing it at all. */
  | { k: 'noblock' | 'noguard'; x: number; y: number }
  | { k: 'weapon'; x: number; y: number; name: string }
  | { k: 'throw' | 'pinned' | 'javwall' | 'javstick' | 'hookfire' | 'latch' | 'yank' | 'land'; x: number; y: number; dx: number; dy: number }
  | { k: 'relic' | 'loot'; x: number; y: number; name: string }
  | { k: 'coal'; x: number; y: number; n: number }
  | { k: 'gold'; id: string; x: number; y: number; n: number }
  | { k: 'potion' | 'drink'; x: number; y: number; kind: PotionId }
  | { k: 'smoke'; x: number; y: number }
  | { k: 'chest'; x: number; y: number; tier: Tier; state: 'opening' | 'shut' | 'open' }
  | { k: 'chained'; x: number; y: number }
  | { k: 'spend'; id: string; x: number; y: number; n: number }
  | { k: 'ransom' | 'tooth'; x: number; y: number }
  | { k: 'drop'; x: number; y: number; q: Quality }
  | { k: 'shoot'; x: number; y: number; dx: number; dy: number; kind: Bolt['kind']; el: Augment }
  | { k: 'burst'; x: number; y: number; r: number; el: Augment }
  | { k: 'shock' | 'beam'; x: number; y: number; x2: number; y2: number }
  | { k: 'heal'; x: number; y: number; n: number }
  | { k: 'ignite' | 'chill' | 'freeze' | 'shatter' | 'steam' | 'flare' | 'blink' | 'bless' | 'blessed' | 'rally' | 'rallied' | 'smite' | 'net' | 'snared' | 'well' | 'shadow' | 'perfect' | 'tempo' | 'grab' | 'hurl' | 'slam' | 'bodyhit' | 'wriggle' | 'lift' | 'oilfire' | 'freed' | 'exitopen' | 'blaze' | 'chop' | 'denspawn' | 'hallow' | 'ward' | 'warded' | 'reflect' | 'wardbreak' | 'spotted'; x: number; y: number }
  | { k: 'collapse'; x: number; y: number; w: number; h: number }
  | { k: 'propbreak'; x: number; y: number; kind: PropKind; dx: number; dy: number };

/** A grappling hook: flying out, reeling an enemy in, pulling its owner along, or coming back. */
export interface Hook {
  id: number;
  owner: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  state: 'fly' | 'yank' | 'zip' | 'back';
  travelled: number;
  /** Enemy hooked (0 for a wall). */
  enemy: number;
  el: Augment;
}

/** A thrown relic javelin: flying (maybe carrying a goblin), or stuck in a wall, the floor or a body. */
export interface Javelin {
  id: number;
  owner: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  state: 'fly' | 'wall' | 'floor' | 'body';
  travelled: number;
  /** Enemy carried (flying) or pinned / stuck in (stuck), or 0. */
  enemy: number;
  /** Offset from the enemy's centre while stuck in a body. */
  ox: number;
  oy: number;
  hit: number[];
  life: number;
  el: Augment;
}

/**
 * A shot, a smite or a thrown relic: arrows and crossbow bolts, the mage's sparks, orbs and lances, a
 * smite waiting to fall, the hunter's net, the lodestone (which lands and becomes a pulling well).
 */
export interface Bolt {
  id: number;
  owner: string;
  kind: 'arrow' | 'bolt' | 'spark' | 'orb' | 'lance' | 'smite' | 'net' | 'lodestone' | 'flask';
  /** A thrown flask's potion. */
  potion?: PotionId;
  /** The Jealous Rod: this shot jumps to every goblin near what it hits. */
  chain?: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  range: number;
  travelled: number;
  dmg: number;
  knock: number;
  pierce: boolean;
  burst: number;
  el: Augment;
  hit: number[];
  /** Stun on hit (a smite). */
  stun: number;
  /** The shooter's weapon traits (BRUTAL counts on a shot). */
  traits: TraitId[];
  /** Lobbed and dropped things go from (sx, sy) to (tx, ty) over `flight` seconds, `t` so far. */
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  flight: number;
  /** An arrow stays stuck in a wall or the floor a moment; a landed lodestone pulls ('well'). */
  state: 'fly' | 'stuck' | 'well';
  life: number;
}
