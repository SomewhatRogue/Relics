/** The fight's state. Plain data: the same shape is drawn locally and (later) sent to friends. */
import type { RelicItem } from '../shared/relicitems';
import type { Augment, Item, PotionId, Tier, PropKind, Quality, RelicId, TraitId, WeaponId, Hurt, HeroClass } from '../shared/tuning';

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
  /** Turn the belt (a long press of the potion button, or Q held): the next kind of potion comes to the
   *  front, and nothing is drunk. Optional so an older guest's intent still reads. */
  beltSeq?: number;
  /** Open chest `open` (counted by openSeq). */
  openSeq: number;
  open: number;
  /** Grown a level (counted): the room fills your health and lights you up in your class's colour
   *  (sim/grow.ts). Optional so an older guest's intent still reads. */
  levelSeq?: number;
  /** The crossbow's RELOAD held, and its presses (so a tap is never lost). Optional so an older guest's
   *  intent still reads (sim/crossbow.ts). */
  reload?: boolean;
  reloadSeq?: number;
  /** A Mage's ELEMENT button (X): turn the spellbook to the next element (sim/channel.ts). Optional so an
   *  older guest's intent still reads. */
  elementSeq?: number;
}

export const NO_INTENT: Intent = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0, weaponSeq: 0, relicSeq: 0, relicSwapSeq: 0, relicPickSeq: 0, relicPick: 0, augmentSeq: 0, classSeq: 0, grabSeq: 0, takeSeq: 0, take: 0, gearSeq: 0, gearOp: 0, gearArg: 0, potionSeq: 0, beltSeq: 0, openSeq: 0, open: 0, reload: false, reloadSeq: 0 };

/** What a trainer teaches: the class skill, and the leave-behind on a dodge. */
export type Learned = 'skill' | 'leave';
export const knows = (h: { learned?: Learned[] }, l: Learned) => !h.learned || h.learned.includes(l);

/** A Mage's held spells, by kit and element (shared/spellbook.ts). */
export type SpellWhat = 'fireball' | 'coldblast' | 'strike' | 'flamering' | 'nova' | 'stormring' | 'lunge' | 'shatter' | 'dash';

export type HeroAct = 'idle' | 'charge' | 'attack' | 'throw' | 'zip' | 'bash' | 'roll' | 'hurt' | 'stun' | 'down' | 'carry' | 'slam';

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
  /** Hauled toward (x, y) by a Cleric's censer chain (or a Mage's GRASP, at `speed`) until there or `until` (sim/cleric.ts). */
  tow?: { x: number; y: number; until: number; speed?: number };
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
  /** Out of breath: no dodge, block or parry until stamina is full again. */
  winded?: boolean;
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
  /** A Ranger's: when the next snare is ready, and the hound (`noHound` keeps it away). */
  snareReady: number;
  hound: Hound | null;
  noHound?: boolean;
  /** The block press we last told this hero their class can't hold a block on (told once a press). */
  toldAt: number;
  counterUntil: number;
  /** When this hero last parried (a sword's riposte: shared/warrior.ts). */
  parriedAt?: number;
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
  /** A Cleric's holy shield (a perfect's, shared/cleric.ts HOLY_SHIELD): until when, and what it can still soak. */
  shieldUntil?: number;
  shieldHp?: number;
  /** This censer swing caught its chain on a wall (sim/censer.ts): it lands at CENSER.snag. */
  snagged?: boolean;
  /** Gave a war cry: every goblin that heard it comes for this hero until then. */
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
  /** A Rogue's vanish: no goblin sees them, even close, until then (or till they strike). */
  vanishUntil?: number;
  /** A Mage's storm tether: the goblin it holds, until when, and its next strike (sim/tether.ts). */
  tether?: { id: number; until: number; next: number };
  /** Weapons, armor and rings carried, not worn. */
  bag: Item[];
  /** How many the pack holds (bought bigger in town, shared/bags.ts). */
  bagSize: number;
  /** Worn armor (none: as light) and up to two rings (shared/gear.ts). */
  armor: Item | null;
  rings: Item[];
  /** Health before gear. */
  baseHp: number;
  /** Gold this hero can spend in a fight (Spendthrift, the Ransom Coat): theirs plus the job's so far. */
  purse: number;
  /** Held in a netter's net until (sim/netter.ts), and the stick's last swing (a wiggle is a big change). */
  netUntil?: number;
  netAng?: number;
  /** Lost in a cloud of crows until (sim/crows.ts); on an oil slick this tick (sim/oil.ts). */
  crowsUntil?: number;
  slick?: boolean;
  /** The way they were going, on oil (it takes hold of the stick slowly). */
  slipX?: number;
  slipY?: number;
  /** Small goblins killed by one swing, and when the last went (SPLAT: the hold grows with each). */
  splats?: number;
  splatAt?: number;
  /** Hungry gear's counters (sim/hungry.ts): kills fed to the Larder Pike, the last kill, the next bite, the coat used. */
  fed: number;
  lastKill: number;
  biteAt: number;
  ransomed: boolean;
  /** Poison (sim/poison.ts): stacks, when the next stack wears off, and the next tick. */
  poison?: number;
  poisonUntil?: number;
  poisonNext?: number;
  /** The Want, for the eyes (never shown as a number). */
  want: number;
  /** Lying where you fell, before Hew gets you up (the wood's opening). */
  lying?: boolean;
  /**
   * What a trainer has taught this hero: their class skill, and the dodge's leave-behind (a Ranger's
   * snare, a Mage's image). Undefined: an old hero, who knows it all already.
   */
  learned?: Learned[];
  /** Walking slowly or standing still: goblins at rest see you from less far (STEALTH). */
  sneaking?: boolean;
  /** Training (the wood, the yard): the hound joins in rarely and never breaks up a blow at you. */
  calmHound?: boolean;
  /** Drills paid for at the trainer (shared/drills.ts), and a crit's own dice (seeded by the hero). */
  drills?: import('../shared/drills').Drills;
  critSeed?: number;
  /** The name shown under someone else's hero (another player in town); their id otherwise. */
  tag?: string;
  /** Which of its class's three looks it wears (drawing only). */
  look?: number;
  /** In a party: down and waiting to be picked up (`pickT` so far), or out until the job ends. */
  bleeding?: boolean;
  out?: boolean;
  pickT?: number;
  /** The teammate kneeling to get this hero up, and whether they've spent their own get-up this job. */
  raiser?: string;
  /** Crouched at a nest, setting it alight (1) or not (0): sim/torch.ts sets it, the pose reads it. */
  stoop?: number;
  /** Seconds left of the grace on coming into a new room: nothing hurts this hero till it's gone. */
  safeT?: number;
  selfUp?: boolean;
  /** Out of bounds (sim/dread.ts): seconds of dread built up (0 in bounds), what comes for them here,
   *  and seconds since they were seized (-1 not). Sent to every screen: the dread is drawn from these. */
  dread?: number;
  dreadBy?: 'shadow' | 'swarm' | 'setback';
  takenT?: number;
  /** Teammates this swing has already cut (friendly fire), and who has downed this hero how often. */
  hitAllies?: string[];
  grudges?: Record<string, number>;
  /** A Healer's censer gone cold (the prologue, until Isolde relights it): no heals given. */
  cold: boolean;
  /** Relics this hero owns, each with its charge (one at a time is carried: `relicItem`, its kind in relics[1]). */
  found: RelicItem[];
  relicItem: string;
  /** Carrying the church's light this job (shared/church.ts LIT). */
  lit?: boolean;
  /** Quickened by a bone bell until then (BELL.quick). */
  quickUntil?: number;
  /** The draw in flight was released on the white flash. */
  perfect: boolean;
  /** The crossbow (sim/crossbow.ts): no bolt on it; the reload wound so far (0 to 1); this hold is winding,
   *  not aiming; this wind began from nothing and hasn't been broken; the bolt on it glints. */
  xbowEmpty?: boolean;
  xbowWind?: number;
  winding?: boolean;
  xbowClean?: boolean;
  xbowGlint?: boolean;
  /** Dodged through a blow (TEMPO): the next hit before then lands double. */
  tempoUntil: number;
  /** A Mage just turned element: its next spell is primed (CHANNEL.primed). */
  primed?: boolean;
  /** The ELEMENT button pressed then (waiting out the switch's cooldown, as any press waits). */
  elementQueuedAt?: number;
  /** The spellblade (sim/spellblade.ts): its charge (0 to 1). */
  bladeCharge?: number;
  /** A spellblade's held spell carrying the hero (sim/rush.ts, in the act 'bash'): a burning lunge or a
   *  lightning dash, `len` tiles, `dmg` to each goblin on the way, `big` let go on the flash. */
  rush?: { el: 'fire' | 'storm'; len: number; dmg: number; big: boolean };
  /** Primed spells left (TWICE PRIMED: two). */
  primeLeft?: number;
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
  seen: { attack: number; block: number; roll: number; weapon: number; relic: number; relicSwap: number; relicPick: number; augment: number; cls: number; take: number; grab: number; gear: number; potion: number; belt?: number; open: number; level?: number; reload?: number; element?: number };
}

/** `pounce`: a spider's leap along its line; `bite`: the brood mother's; `spit`: her lobbed glob (a circle). */
export type AttackKind = 'cleave' | 'slam' | 'swing' | 'stab' | 'shot' | 'draw' | 'charge' | 'hex' | 'pounce' | 'bite' | 'spit' | 'net' | 'grab' | 'lob' | 'erupt' | 'torch';
/** Attacks that come down as a circle at (cx, cy) rather than a wedge from the attacker. */
export const isRound = (k: AttackKind) => k === 'slam' || k === 'hex' || k === 'spit' || k === 'net' || k === 'lob' || k === 'erupt' || k === 'torch';

export interface EnemyAttack {
  kind: AttackKind;
  /** Who it was swung at (a striped blow stepped out of counts as a dodge for them). */
  aimed?: string;
  /** (A charge) its run is over: a hero with no dodge who wasn't on its line has stepped out. */
  missed?: boolean;
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
  /** Slam or hex: a circle at (cx, cy). */
  cx: number;
  cy: number;
  radius: number;
  done: boolean;
  /** A charge: who it has already run through. */
  hit?: string[];
  /** Too heavy to block: a guard that meets it breaks (parry it instead). */
  crush?: boolean;
}

export type EnemyKind = 'butcher' | 'scrapper' | 'dummy' | 'swingDummy' | 'spider' | 'brood' | 'nest';
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
  /** The Rogue's (sim/venom.ts): bleeding from a skewer until, its next tick; poison stacks, until, next
   *  tick, ticking harder (a perfect dart); retching until. */
  bleedUntil?: number;
  bleedNext?: number;
  venom?: number;
  venomUntil?: number;
  venomNext?: number;
  venomHard?: boolean;
  pukeUntil?: number;
  /** Blinded by a longbow's perfect arrow until (sim/rangershots.ts): it can't pick out a hero. */
  blindUntil?: number;
  /** When it last retched (once every VENOM.pukeEvery seconds at most). */
  pukeAt?: number;
  /** When each hero last took its turn (a stun, pin, blind and so on: sim/stuns.ts), and when it last said it shrugged one off. */
  stunnedBy?: Record<string, number>;
  shrugAt?: number;
  /** Caught in a hunter's net until then (small goblins can't move or act; big ones are slowed). */
  snareUntil: number;
  /** A relic's marks: the next blow lands harder (MARK) until `markUntil`; hobbled (HOBBLE) until `hobbleUntil`. */
  markUntil?: number;
  hobbleUntil?: number;
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
  variant?: import('../shared/terrain').FoeVariant;
  /** The fight it belongs to (shared/encounter.ts): a pack's shout wakes only its own. */
  pack?: number;
  role?: import('../shared/encounters').Role;
  /** When it last showed WEAK or RESIST (sim/damage.ts sayWeak). */
  popAt?: number;
  /** A drummer standing and beating its drum this tick (shared/backline.ts DRUMMER). */
  drumming?: boolean;
  /** Within reach of a drumming drummer this tick: faster wind-ups and feet, harder blows. */
  roused?: boolean;
  /** Crouched at the dead, eating: stays put and doesn't look up until something comes close. */
  feeding?: boolean;
  /** False while it hasn't noticed anyone (see ALERT); undefined counts as awake. */
  alert?: boolean;
  /** A named goblin (a hunt's quarry, a story boss). */
  name?: string;
  /** A nest: spiders a wave, and when the next one hatches (-1 asleep). A spider: the nest it came from. */
  wave?: number;
  nextWave?: number;
  nest?: number;
  /** A nest: how many of its spiders were alive last tick (a wave all dead gives a breather). */
  had?: number;
  /** A nest being set alight: by whom ('' nobody) and how far along (sim/torch.ts). */
  lighter?: string;
  lightT?: number;
  /** A nest alight: the room time it's ash (0 not alight). */
  ashAt?: number;
  /** Too far from every hero to think or move this tick (sim/sleep.ts, on a big map). */
  dozing?: boolean;
  /** Near a standing banner this tick (sim/banner.ts); routed until; a fallen banner whose rout is done. */
  heart?: boolean;
  routUntil?: number;
  spent?: boolean;
  /** A sneak-thief's haul (sim/thief.ts), how long it has lurked, and one that got away (no body). */
  loot?: { gold?: number; potion?: PotionId };
  lurkT?: number;
  escaped?: boolean;
  /** A wolf's keeper (its id), and scattered until (sim/wolves.ts); its side of the circle. */
  keeper?: number;
  scatterUntil?: number;
  side?: number;
  /** A sapper under the ground (sim/sapper.ts): where it's making for, how long it's been under, when it last came up. */
  under?: boolean;
  digT?: number;
  goX?: number;
  goY?: number;
  upAt?: number;
  /** A blind hunter (sim/blind.ts): where it last heard something, and when. */
  heardX?: number;
  heardY?: number;
  heardAt?: number;
}

/** How a goblin died: fell, lost its head, burst apart, burned, or shattered. */
/** `halve`: cut in two at the waist; `opened`: cut down with a slash across the chest. */
export type DeathKind = '' | 'fall' | 'behead' | 'halve' | 'opened' | 'burst' | 'burn' | 'shatter';

/**
 * Someone freed from a cage (sim/survivors.ts): fragile, following the nearest player till they're
 * brought home, and hurt by anything of the party's that reaches them. A dead one stays where they fell.
 */
export interface Survivor extends Body {
  id: number;
  hp: number;
  maxHp: number;
  /** When the cage broke (they stand and give thanks a moment before they follow). */
  at: number;
  /** Last hurt (the flash), and who last hurt them. */
  hitAt: number;
  by: string;
  dead: boolean;
  deadAt: number;
  /** Burning, ticking, set alight by whom. */
  burnUntil: number;
  burnNext: number;
  burnBy: string;
  /** Facing left or right, and walking this tick (for drawing). */
  fx: number;
  moving: boolean;
  /** When they were brought home (-1 not yet); just brought out of a house (announced next tick); walked off. */
  home: number;
  out: boolean;
  gone: boolean;
  /** A false prisoner (sim/falsecage.ts): the room time it tears open. Never counted as freed. */
  tearAt?: number;
}

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
  /** Not blessed ground but a skill's area (sim/areas.ts): a Ranger's volley (falling from `at`), a
   *  Mage's fire ring burning on, a staff's ring of fire or charged ring (sim/staffrings.ts). */
  kind?: 'volley' | 'fire' | 'sentry' | 'flamering' | 'stormring';
  /** A staff's ring (sim/staffrings.ts): let go on the flash, and what it deals a touch (`n`). */
  big?: boolean;
  n?: number;
  /** A wind-up bow's aim (for drawing it turned to what it shoots). */
  ax?: number;
  ay?: number;
  at?: number;
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
  /** An expedition (sim/exped.ts): a job or side job done (`i` its place in the list), the way out open, lit, the watch come; a horn, worse, a wave. */
  | { k: 'exped'; x: number; y: number; what: import('./exped').ExpedWhat; i?: number }
  /** A teammate downed you once too often this job. */
  | { k: 'grudge'; x: number; y: number; id: string; by: string }
  /** The newer sorts (sim/ownfoes.ts): a banner down and the goblins it routs; a net (who's in it, a struggle, cut out, free); a thief's grab, its loot back, gone. */
  | { k: 'bannerfall' | 'routed' | 'struggle' | 'recovered' | 'escaped' | 'rooffall' | 'whip' | 'scatter' | 'howl' | 'dig' | 'surface' | 'unearthed' | 'slick' | 'oilwarn' | 'oilup' | 'crows' | 'listen'; x: number; y: number }
  | { k: 'netted' | 'netfree'; x: number; y: number; id: string }
  | { k: 'cutfree'; x: number; y: number; id: string; by: string }
  | { k: 'stolen'; x: number; y: number; id: string; n: number; potion?: PotionId }
  /** A hero down (`by`: the teammate whose blow did it), or picked up (`by`: who picked them up). */
  | { k: 'down' | 'pickedup' | 'raising' | 'gotup'; x: number; y: number; id?: string; by?: string }
  /** A press that did nothing, said to that hero: GRAB with nothing to take hold of, ATTACK held on an empty crossbow. */
  | { k: 'nograb' | 'reloadcue'; x: number; y: number; id: string }
  /** Out of bounds (sim/dread.ts): `n` 1 the warning, 2 worse, 3 seized, 4 crushed or pulled down where
   *  they stood (x, y), 5 set back (town), 0 back in bounds. `by`: what came for them. */
  | { k: 'dread'; x: number; y: number; id: string; n: number; by: 'shadow' | 'swarm' | 'setback' }
  /** A nest: someone crouching to set it alight; it catches. */
  | { k: 'kindling' | 'torched'; x: number; y: number; by: string }
  /** A house: someone crouching at its kindling spot; it's alight (sim/kindle.ts). */
  | { k: 'housekindle' | 'houselit'; x: number; y: number; by: string }
  /** A house alight (sim/houseburn.ts): a goblin driven out of its door; a chest inside burned, its charred leavings at the door; the smoke getting to someone inside. */
  | { k: 'flushed' | 'charred' | 'choke'; x: number; y: number }
  /** `src`: what landed it (a kit, or a shot's kind), for its sound; `big`: on the butcher. */
  | { k: 'hit'; x: number; y: number; n: number; heavy: boolean; on: 'enemy' | 'hero'; counter?: boolean; crit?: boolean; ambush?: boolean; boarded?: boolean; backstab?: boolean; tick?: boolean; src?: string; big?: boolean }
  | { k: 'swing'; x: number; y: number; src: string; heavy: boolean }
  | { k: 'death'; x: number; y: number; how: DeathKind; dx: number; dy: number; kind: EnemyKind }
  /** A shot stopped dead on a shield-bearer's board (sim/board.ts): a thunk, sparks, BLOCKED. */
  | { k: 'deflect'; x: number; y: number }
  | { k: 'block' | 'parry' | 'guardbreak' | 'winded' | 'breath' | 'bash' | 'dodge' | 'slip' | 'out' | 'roll' | 'stunned' | 'wallhit' | 'charged' | 'heavy'; x: number; y: number }
  | { k: 'windup' | 'impact'; x: number; y: number; kind: AttackKind }
  /** The prologue's cutscene: the ground shaking, the bite, a body landing, the Stoker's bellow. */
  | { k: 'rumble' | 'bite' | 'thud' | 'bellow' | 'fanfare'; x: number; y: number }
  /** A Ranger or Rogue holding block (it does nothing), or a Mage pressing it at all. */
  | { k: 'noblock' | 'noguard'; x: number; y: number; dodge?: string }
  /** The Ranger's snare laid; the hound barking or yelping off. */
  | { k: 'snareset' | 'bark' | 'yelp'; x: number; y: number }
  /** The Mage's channel: its spells now `el`, the first one primed. */
  | { k: 'channeled'; x: number; y: number; el: string }
  /** The Mage's kits (sim/spells.ts, spellblade.ts): magic spent (`n`), a spell fizzled for want of it, a
   *  blow broken off by a wand's tap, the blade full of charge, a staff's slash (along dx, dy). */
  | { k: 'magic'; x: number; y: number; n: number }
  | { k: 'fizzle' | 'interrupt' | 'bladefull'; x: number; y: number }
  | { k: 'slash'; x: number; y: number; dx: number; dy: number; el: Augment }
  /** A Mage's held spell going off (sim/holds.ts): `what` it is, from (x, y) along (dx, dy), `r` its size
   *  (a cone's or ring's radius, a rush's length), `big` let go on the flash. */
  | { k: 'spell'; x: number; y: number; dx: number; dy: number; el: Augment; what: SpellWhat; r: number; big: boolean }
  /** GRASP (sim/grasp.ts): cast from (x, y) along (dx, dy), `r` its reach; each goblin dragged, to (x2, y2). */
  | { k: 'grasp'; x: number; y: number; dx: number; dy: number; r: number }
  | { k: 'grasped'; x: number; y: number; x2: number; y2: number }
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
  | { k: 'shoot'; x: number; y: number; dx: number; dy: number; kind: Bolt['kind']; el: Augment; primed?: boolean }
  | { k: 'burst'; x: number; y: number; r: number; el: Augment }
  | { k: 'shock' | 'beam' | 'boltline'; x: number; y: number; x2: number; y2: number }
  | { k: 'heal'; x: number; y: number; n: number }
  | { k: 'ignite' | 'chill' | 'freeze' | 'shatter' | 'steam' | 'flare' | 'blink' | 'bless' | 'blessed' | 'rally' | 'rallied' | 'smite' | 'net' | 'snared' | 'well' | 'shadow' | 'perfect' | 'tempo' | 'grab' | 'hurl' | 'slam' | 'bodyhit' | 'wriggle' | 'lift' | 'oilfire' | 'freed' | 'exitopen' | 'blaze' | 'chop' | 'denspawn' | 'hallow' | 'ward' | 'warded' | 'reflect' | 'wardbreak' | 'spotted' | 'skewer' | 'envenom' | 'riposte' | 'shieldbash' | 'quake' | 'pin' | 'blinded' | 'wind' | 'loaded' | 'glint' | 'trueshot' | 'holyshield' | 'shieldsoak' | 'shieldgone' | 'coalburst' | 'coalflare' | 'snag' | 'flailstun' | 'holysmite' | 'shrug'; x: number; y: number }
  /** A goblin retching up a perfect dart's poison, facing (dx, dy) (sim/venom.ts). */
  | { k: 'puke'; x: number; y: number; dx: number; dy: number }
  | { k: 'collapse'; x: number; y: number; w: number; h: number }
  /** The skills taught after the first (sim/skills.ts): a stamp, arrows falling, a vanish, knives, a fire
   *  ring, a tether strike (to x2, y2), a chain (to x2, y2), the lantern light, a hound sent or pinning. */
  | { k: 'stamp' | 'volleyshot' | 'arrowfall' | 'vanish' | 'knives' | 'firering' | 'lanternlight' | 'sic' | 'houndpin'; x: number; y: number }
  | { k: 'tetherzap' | 'chainpull'; x: number; y: number; x2: number; y2: number }
  /** Found relics (sim/foundrelics.ts): a bell rung, a friend quickened, a bomb thrown, a wind-up bow set
   *  down or winding down, a goblin marked or hobbled, a friend in a relic's reach spared, a dark relic pressed. */
  | { k: 'bell' | 'quick' | 'bombthrow' | 'sentry' | 'sentryend' | 'marked' | 'hobbled' | 'spared' | 'dark' | 'relicfound'; x: number; y: number }
  | { k: 'knuckle' | 'hookprop'; x: number; y: number; x2: number; y2: number }
  /** A house on fire (sim/blaze.ts): a beam down, the roof in, someone caged lost with it. */
  | { k: 'rafter' | 'housefall' | 'cagelost'; x: number; y: number }
  /** Spiders: a wave hatching, a hero poisoned or cured, a glob landing. */
  | { k: 'hatch' | 'poisoned' | 'cured' | 'splat'; x: number; y: number }
  /** A blow on a weakness or a resistance (shared/weakness.ts), and what it was made of. */
  | { k: 'weak' | 'resist'; x: number; y: number; el: Hurt }
  /** A freed survivor hurt by the party (`by` the hero, '' nobody's; `tick` a burn), or killed. */
  | { k: 'survivorhit'; x: number; y: number; id: number; n: number; by: string; tick?: boolean }
  | { k: 'survivordeath'; x: number; y: number; id: number; by: string }
  /** A survivor brought home: out of their house, or back to where the party came in. */
  | { k: 'survivorhome'; x: number; y: number; id: number }
  | { k: 'propbreak'; x: number; y: number; kind: PropKind; dx: number; dy: number }
  /** A blow a prop took and held (it shakes and flashes; drawn the same in both views). */
  | { k: 'prophit'; x: number; y: number; kind: PropKind; dx: number; dy: number }
  /** A false prisoner tearing open, goblins coming out of it (sim/falsecage.ts). */
  | { k: 'torn'; x: number; y: number }
  /** A hero grew a level: full health, and a flash in the class's colour (sim/grow.ts). */
  | { k: 'levelup'; x: number; y: number; id: string; cls: HeroClass };

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
  kind: 'arrow' | 'bolt' | 'knife' | 'dart' | 'spark' | 'orb' | 'lance' | 'smite' | 'net' | 'lodestone' | 'flask' | 'bomb' | 'strike';
  /** A relic's: it never hurts a friend or anyone freed (friends caught in it are told they're spared). */
  relic?: boolean;
  /** A mace's smite: its light mends friends in the burst this much; `holy`: let go on the flash, it shields them (sim/holy.ts). */
  heal?: number;
  holy?: boolean;
  /** Hobbles what it hits (a wind-up bow's bolt). */
  hobble?: boolean;
  /** A Mage's frost burst: freezes solid at once (frost twice). */
  freeze?: boolean;
  /** A Mage's tap: frost only chills (never freezes); storm jumps on to this many (STORM.chains if unset). */
  chills?: boolean;
  jumps?: number;
  /** A wand's: landing on a goblin mid wind-up, it breaks the blow off (sim/spells.ts). */
  interrupts?: boolean;
  /** A wand's burst loosed on the white flash: it breaks off whatever the goblin it hits is doing. */
  breaks?: boolean;
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
  /** Teammates it has already passed through (friendly fire). */
  hitHeroes?: string[];
  /** Stun on hit (a smite). */
  stun: number;
  /** A poisoner's dart: poisons what it hits (2: loosed perfect, it retches first). */
  poison?: 1 | 2;
  /** Loosed on the white flash (a clean hit shows); a longbow's blinds and is a sure crit. */
  perfect?: boolean;
  blind?: boolean;
  /** A plain crossbow bolt runs through this many goblins at most (a glinted one, the whole line). */
  pierceLeft?: number;
  /** Loosed on a full charge: it gets through a shield-bearer's board (sim/board.ts). */
  charged?: boolean;
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

/** A poison puddle where the brood mother's glob landed (sim/puddles.ts). */
export interface Puddle { id: number; x: number; y: number; r: number; until: number }

/** A Ranger's snare on the ground. */
export interface Snare { owner: string; x: number; y: number; until: number; /** How long it holds what steps in (a Ranger's TRAPPER drill lengthens it). */ hold?: number }
/** A Ranger's hound: at heel, running something down, worrying it, or scared off till `back`. */
export interface Hound { x: number; y: number; fx: number; fy: number; state: 'heel' | 'run' | 'bite' | 'fled'; target: number; t: number; next: number; back: number; bites: number; moving: boolean; /** Lying down (across you while you're out). */ down?: boolean; /** Sent in by SEND THE HOUND: pins what it reaches. */ pin?: boolean }
