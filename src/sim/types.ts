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
  /** The class's own button (shared/signs.ts): a Rogue's SHADOW STEP, a Ranger's MARK, a Healer's MEND (V).
   *  Optional so an older guest's intent still reads. */
  signSeq?: number;
  /** A friend's Intent: the leader's room time their screen was showing when they sent it (sim/lagcomp.ts
   *  judges a blow on them by it). The leader's own, and an older guest's, have none. */
  vt?: number;
  /** The Deep: the floor this player has chosen GO DEEPER on (client/game.ts deeper); the leader goes down once all have. */
  deep?: number;
  /** The Deep: this player's curses and blessings for the run (shared/deepmarks.ts), sent standing. */
  marks?: string[];
  /** Boss loot (sim/lootroll.ts): this player's standing choice on each open roll, by the roll's id. */
  loot?: Record<number, LootPick>;
}

export const NO_INTENT: Intent = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0, weaponSeq: 0, relicSeq: 0, relicSwapSeq: 0, relicPickSeq: 0, relicPick: 0, augmentSeq: 0, classSeq: 0, grabSeq: 0, takeSeq: 0, take: 0, gearSeq: 0, gearOp: 0, gearArg: 0, potionSeq: 0, beltSeq: 0, openSeq: 0, open: 0, reload: false, reloadSeq: 0 };

/** What a trainer teaches: the class skill, and the leave-behind on a dodge. */
export type Learned = 'skill' | 'leave';
export const knows = (h: { learned?: Learned[] }, l: Learned) => !h.learned || h.learned.includes(l);

/** A Mage's held spells, by kit and element (shared/spellbook.ts). */
export type SpellWhat = 'fireball' | 'coldblast' | 'strike' | 'firewall' | 'nova' | 'stormring' | 'lunge' | 'shatter' | 'dash';

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
  /** When a blow last staggered this hero (shared/tuning.ts STAGGER: no stun-lock). */
  staggerAt?: number;
  id: string;
  /** Facing, a unit vector. */
  fx: number;
  fy: number;
  moving: boolean;
  hp: number;
  stamina: number;
  staminaAt: number;
  /** Out of breath: no dodge or block until stamina is full again. */
  winded?: boolean;
  weapon: WeaponId;
  act: HeroAct;
  actT: number;
  actDur: number;
  combo: number;
  /** The swing in progress is the charged heavy, at this power (0..1). */
  heavy: boolean;
  power: number;
  /** This swing is a counter (started inside the counter window after a block took a blow). */
  counter: boolean;
  hitIds: number[];
  blocking: boolean;
  /** Blocking last tick, and when the block last went up (TAUNT GUARD's ring: sim/taunt.ts). */
  wasBlocking?: boolean;
  blockUpAt?: number;
  /** When TAUNT GUARD's ring last showed. */
  tauntRingAt?: number;
  /** IRON STANCE: untouchable until then (sim/taunt.ts). */
  ironUntil?: number;
  /** SHARED WARD: the friend this Cleric's guard covers now (sim/holyguard.ts). */
  wardFor?: string;
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
  /** When a spellblade's dodge through a blow last gave magic back (sim/manashield.ts slipRefills). */
  slipFillAt?: number;
  /** A blow started before this is a counter (a block took a blow just before: sim/combat.ts). */
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
  /** A chalker's strokes on this hero (sim/chalker.ts), when the last went on, and the pack turned on them until then. Drawn over them on every screen. */
  chalk?: number;
  chalkAt?: number;
  chalkedUntil?: number;
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
  /** Hoisted by the ankle in a snare or Hempen's noose (sim/snares.ts): held as in a net (netUntil), no struggling out of it. */
  hoisted?: boolean;
  /** Lost in a cloud of crows until (sim/crows.ts); on an oil slick this tick (sim/oil.ts). */
  crowsUntil?: number;
  slick?: boolean;
  /** The Staithe (sim/staithe.ts): when a hung net last caught them (not again for a moment). */
  snagAt?: number;
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
  /**
   * The eye dial, -1 (red) to +1 (gold); unset or 0 is the middle, plain eyes (PLAN.md "red eyes and
   * gold eyes"). Only drawn for now (client/heroeyes.ts); nothing sets it yet.
   */
  dial?: number;
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
  /** The movement ladder (shared/ladder.ts, sim/ladder*.ts): a JUMP SHOT spent this jump; a blink's own
   *  reach (BLINK THROUGH) and the goblin it went through; the last PERFECT hold (PERFECT BLINK); the
   *  next CALTROPS; THROUGH THE LEGS until then, and the goblin it was spent on; fireproof (SHAKE IT OFF)
   *  until then; the TAUNT ready again, and the roar lasting (STAND FAST). Room times. */
  airShot?: boolean;
  /** When the last dodge ended (room time). */
  landedAt?: number;
  rollReach?: number;
  throughId?: number;
  perfectAt?: number;
  caltropReady?: number;
  legsUntil?: number;
  legsStab?: number;
  fireproofUntil?: number;
  tauntReady?: number;
  tauntUntil?: number;
  /** The name shown under someone else's hero (another player in town); their id otherwise. */
  tag?: string;
  /** Which of its class's three looks it wears (drawing only). */
  look?: number;
  /** A Ranger's hound as its player chose it with Maeve (shared/houndlook.ts): breed, coat, white, name.
   *  Drawing only; the room never reads it, so every hound fights the same. */
  houndLook?: import('../shared/houndlook').HoundLook;
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
  /** RAISE (sim/raise.ts): out, the Cleric kneeling to raise this hero and the room time they began
   *  ('' and -9 when none; the progress is worked out from it, so nothing goes out a tick); the share of the most health taken
   *  off by being raised this job, and the Clerics who have raised them; on a Cleric, when they may again. */
  riseBy?: string;
  riseAt?: number;
  hpCut?: number;
  risenBy?: string[];
  riseReadyAt?: number;
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
  /** The Deep's curses and blessings this hero carries for the run (shared/deepmarks.ts; set from its player's input: sim/deepmarks.ts). */
  marks?: string[];
  /** The Deep: the floor its player has chosen GO DEEPER on (sim/deepmarks.ts, from their input), shown to the party. */
  deepVote?: number;
  /** Has had the sure relic of their first named butcher (sim/namedrelic.ts; Profile.namedRelic). Set once. */
  namedRelic?: boolean;
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
  /** The class's own button (sim/signature.ts): pressed then, and ready again then. */
  signQueuedAt?: number;
  signReady?: number;
  /** In a SHADOW STEP's short wind-up and recovery (the act 'throw'). */
  signing?: boolean;
  /** The spellblade's mana shield (sim/manashield.ts): when a hit last took magic, and when one last
   *  ran it out (the ward cracks, then breaks, on screen). Old snapshots' `bladeCharge` is ignored. */
  wardAt?: number;
  wardBrokeAt?: number;
  /** A spellblade's held spell carrying the hero (sim/rush.ts, in the act 'bash'): a burning lunge or a
   *  lightning dash, `len` tiles, `dmg` to each goblin on the way, `big` let go on the flash. */
  rush?: { el: 'fire' | 'storm'; len: number; dmg: number; big: boolean; cast?: number };
  /** The storm cast a Mage's slash or cut belongs to, new each swing (sim/spellblade.ts). */
  swingCast?: number;
  /** A wand's storm stream (sim/stream.ts): on until `until`, held on goblin `id` (0 none yet), built to
   *  `step` (1 to 3), last tapped at `at`, its next tick, the spark's share a tick, and what's owed below a
   *  whole point. */
  stream?: { id: number; step: number; at: number; until: number; next: number; tick: number; owe: number; oweJump: number; hop?: number; oweHop?: number };
  /** The pack rush (sim/packrush.ts) this hero last met with a guard, the instant it landed, how, and how many blows. */
  rushGuard?: { id: number; at: number; n: number };
  /** Primed spells left (TWICE PRIMED: two). */
  primeLeft?: number;
  /** Techniques (shared/techniques.ts): SHOULDER CHARGE's straight walk (seconds, which way, last walked
   *  then) and the swing carrying it; QUICK NOCK's last perfect shot and the shot ending at once. */
  strideT?: number;
  strideX?: number;
  strideY?: number;
  strideAt?: number;
  shoulder?: boolean;
  nockAt?: number;
  nocked?: boolean;
  maxHp: number;
  /** Perks chosen at the trainer (see shared/progress). */
  perks: string[];
  /** The goblin held overhead (0: none). */
  carrying: number;
  /** The prop held overhead (0: none). */
  lifting: number;
  grabQueuedAt: number;
  hitstop: number;
  /** Extra dodge leniency for this player's ping (seconds). */
  lenience: number;
  /** A friend's lag (seconds): how far behind the leader's room their screen is when their input gets
   *  here (the trip there and back and the playout). The leader's own hero has none. A blow on a hero
   *  with lag waits for their word on it (sim/lagcomp.ts). */
  lag?: number;
  /** The `vt` of the latest dodge press, and of the one the dodge under way began from. */
  rollPressVt?: number;
  rollVt?: number;
  /** The `vt` the guard went up at, and came down at (undefined: held, or never). */
  guardVt?: number;
  guardOffVt?: number;
  seen: { attack: number; block: number; roll: number; weapon: number; relic: number; relicSwap: number; relicPick: number; augment: number; cls: number; take: number; grab: number; gear: number; potion: number; belt?: number; open: number; level?: number; reload?: number; element?: number; sign?: number };
}

/** `pounce`: a spider's leap along its line; `bite`: the brood mother's; `spit`: her lobbed glob (a circle). */
export type AttackKind = 'cleave' | 'slam' | 'swing' | 'stab' | 'shot' | 'draw' | 'charge' | 'hex' | 'pounce' | 'bite' | 'spit' | 'net' | 'grab' | 'lob' | 'erupt' | 'torch' | 'hook' | 'pour';
/** Attacks that come down as a circle at (cx, cy) rather than a wedge from the attacker. */
export const isRound = (k: AttackKind) => k === 'slam' || k === 'hex' || k === 'spit' || k === 'net' || k === 'lob' || k === 'erupt' || k === 'torch' || k === 'pour';

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
  /** A crushing blow (the heavy's): a block that meets it costs GUARD.crushCost the stamina and shoves harder. */
  crush?: boolean;
  /** One blow of a pack rush (sim/packrush.ts): the rush, the room time every blow of it lands, and the
   *  fan's middle (a guard facing it covers every blow). */
  rush?: number;
  land?: number;
  rcx?: number;
  rcy?: number;
  /** A boss's blow (sim/bosskit.ts): its move, and the pose before the floor shows (`tell` s, inside the wind-up). */
  boss?: import('../shared/bosstune').DoorMove | import('../shared/hangtune').HempenMove;
  tell?: number;
  /** A charge run from beside its body (Locked Doors: the middle of the pair), as an offset from it. */
  mid?: [number, number];
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
  /** CUTPURSE has shaken this one's purse (once a goblin). */
  cut?: boolean;
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
  /** A Ranger's MARK (sim/mark.ts): which Ranger, and until when. Shown over it on every screen. */
  markedBy?: string;
  markedUntil?: number;
  /** Stood in smoke until then (sim/smokebomb.ts): it sees nobody but those close. */
  smokedUntil?: number;
  /** The movement ladder: taunted by a Warrior (`tauntBy`) until then, its blows `tauntSoft` (STAND FAST);
   *  slowed by caltrops until then; rime built up by an ATTUNED Mage's chilling hits (sim/techmage.ts). */
  tauntBy?: string;
  tauntUntil?: number;
  tauntSoft?: boolean;
  caltropUntil?: number;
  rime?: number;
  /** A chalker (sim/chalker.ts): the hero it's chalking, seconds of seeing them toward the next stroke, when it last
   *  chalked one. Any goblin of its pack at the fifth: the hero it's turned on, until then (blows on them harder). */
  quarry?: string;
  chalkT?: number;
  chalkAt?: number;
  turnedOn?: string;
  turnedUntil?: number;
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
  /** THE DROVER (sim/drover.ts): it drives the roped line, and while any of it is roped it stands behind them (`screened`). */
  drives?: boolean;
  /** Opened up (sim/drover.ts, brake.ts; INSTANCE.open): blows land at `takes` till room time `openUntil`. */
  takes?: number;
  openUntil?: number;
  /** An instance's goblin (INSTANCE.fierce): quicker wind-ups and rests (sim/elite.ts). */
  fierce?: boolean;
  /** THE BRAKESMAN (sim/brake.ts): it works the brake at the top of the rail; when it lets the next cart go, and its brake out of use until. */
  brakes?: { next: number; off: number; /** Times it's shown a climber how to send one back (BRAKE.told). */ told?: number };
  /** THE SLUICER and THE RAKER (sim/pairfall.ts): which of the pair; the Sluicer's room time it fell in the water; the Raker's lift so far (s). */
  pair?: 'sluicer' | 'raker';
  fallen?: number;
  lift?: number;
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
  /** Died burning: its fire passes to those near it on the next tick (sim/elements.ts). */
  embers?: boolean;
  /** The last storm cast that reached it (sim/elements.ts): jumped to at most once a cast. */
  jolted?: number;
  /** Too far from every hero to think or move this tick (sim/sleep.ts, on a big map). */
  dozing?: boolean;
  /** Near a standing banner this tick (sim/banner.ts); routed until; a fallen banner whose rout is done. */
  heart?: boolean;
  routUntil?: number;
  /** When a quick blow last knocked it off balance (sim/combat.ts, POISE.relock). */
  flinchAt?: number;
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
  /** Called into a pack rush (sim/packrush.ts): its rush, where it's making for (its place in the fan) and
   *  the hero it's for. Null once it winds up or the rush is off. */
  rushTo?: { id: number; x: number; y: number; hx: number; hy: number } | null;
  /** An ironhide (sim/ironhide.ts): its guard broken until, when it broke, and broken now (for drawing). */
  crackUntil?: number;
  crackAt?: number;
  cracked?: boolean;
  /** Layout 4 (sim/tasks.ts): what it's busy at till it sees you, and the body it's hauling (where that lies). */
  task?: import('../shared/scenes4').FoeTask;
  haul?: { x: number; y: number; sack?: boolean };
  /** Hangman's Wood (sim/hempen.ts, sim/snares.ts): throws a noose (Hempen); its relic is the zone's award, never a drop; a snarer's last snare laid at. */
  noose?: boolean;
  zoned?: boolean;
  snareAt?: number;
  /** The Staithe's sorts (sim/skimmer.ts): pinned by frost until; a hung net last caught it. */
  pinUntil?: number;
  snagAt?: number;
  pourAt?: number;
  /** Frozen and skidding off a heavy hit (sim/iceslide.ts): who sent it, its velocity, how fast it slows, charged. */
  sled?: { by: string; vx: number; vy: number; decel: number; hard: boolean } | null;
  /** World effects (shared/worldfx.ts). A butcher at a body (sim/meal.ts): the body (`b` a goblin's id, or
   *  `s` a freed one's), where it lies, when it began and when it's eaten; not before `mealCool`; FED until
   *  `fedUntil` (`fed` this tick). A body eaten, or burned to ash (sim/worldfire.ts). Held on ice this tick
   *  (sim/ice.ts). Lightning drawn to it as a rod at `rodAt` (sim/rods.ts). */
  meal?: { b: number; s?: boolean; x: number; y: number; at: number; until: number } | null;
  mealCool?: number;
  fedUntil?: number;
  fed?: boolean;
  eaten?: boolean;
  ashed?: boolean;
  onIce?: boolean;
  rodAt?: number;
  /** Pacing (sim/pacing.ts, chase.ts, bigone.ts; numbers shared/threat.ts): how much harder its blows land (a
   *  bigger or stronger party); a BIG ONE; held back at its spot, jeering, since (0: not held); the hero it's
   *  chasing and since when; when its sprint's lean began; its last stomp. Each changes only when that happens, so nothing more goes out a tick. */
  harm?: number;
  /** On a Deep floor: its wind-ups and rests between blows as multiples (sim/deepedge.ts). */
  edge?: { windup: number; pause: number };
  /** A boss or BIG ONE: it can't be frozen again until `thawUntil`, nor stunned until `holdUntil` (sim/bosshold.ts). */
  thawUntil?: number;
  holdUntil?: number;
  big?: boolean;
  held?: number;
  chaseOn?: string;
  chaseAt?: number;
  sprintAt?: number;
  stompAt?: number;
  /** An elite's affixes (shared/elites.ts, sim/elite.ts), set as it's made and never again. */
  elite?: import('../shared/elites').Affix[];
  /** A Swingle's last spin and the reel after it (sim/meaty.ts): room times, each set once a spin. */
  spinAt?: number;
  reelAt?: number;
  /** A shield-bearer's board knocked aside (sim/board.ts): the room time it went, open VARIANTS.shield.out after. Set once a knock, so sent once. */
  boardOutAt?: number;
  /** A burst on the floor (sim/blast.ts): a Kegman's keg, an Oil-soaked one alight, a Smouldering one's embers.
   *  Where it lies, how far it reaches, the room time it goes off, and `done` once it has. Set once, so sent once. */
  blast?: { k: 'keg' | 'oiled' | 'ember'; x: number; y: number; r: number; at: number; done?: boolean };
  /** A Hornblower's call (sim/hornblow.ts): begun at `at`, blown at `until`, its small ones coming from (x, y)
   *  at the room's edge; `cut` if it was stopped, `blown` once they're called. Each set once. */
  call?: { at: number; until: number; x: number; y: number; cut?: boolean; blown?: boolean };
  /** A Pouncer's last leap and the time it was stuck after it (sim/meaty2.ts): room times, each set once a leap. */
  leapAt?: number;
  stuckAt?: number;
  /** A Gorger: how many bodies it has eaten (sim/meaty2.ts), at most GORGER.most. */
  grown?: number;
  /** A boss of the kit (sim/bosskit.ts): POISE, its phase, its job, its door. Changes only when one of those does. */
  boss?: import('./bosskit').BossOn;
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
  /** Led off on a rope (layout 4, sim/scenes.ts): how far along the room's led path; taken off out of the room for good. */
  led?: { s: number };
  /** Being cut loose off THE DROVER's rope (sim/drover.ts): seconds of it so far. */
  cutT?: number;
  taken?: boolean;
  /** Their body eaten by a butcher, or burned to ash first (sim/meal.ts, worldfire.ts). */
  eaten?: boolean;
  ashed?: boolean;
  /** The Staithe (sim/staithe.ts): on the jetty, standing (the punt takes them over); netted on the bank (GRAB, as CUT FREE). */
  stay?: boolean;
  netted?: boolean;
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
  /** An ore cart rolling down the rail (sim/haulbook.ts): its speed along it, tiles a second (+ right, - left), and who sent it. */
  roll?: number;
  rollBy?: string;
  /** A thrown or shoved Haulier's cart: its way (a unit vector), off the rail; the hero holding one at rest (sim/haulcarts.ts). */
  wx?: number;
  wy?: number;
  heldBy?: string;
  /** A puzzle's tub sliding to its next square (sim/tubs.ts). */
  to?: { x: number; y: number };
  /** THE BRAKESMAN's cart at the top of the rail, its lane striped till it goes at this room time (sim/brake.ts). */
  goAt?: number;
  fadeAt: number;
  /** Spin while flying, for drawing. */
  spin: number;
}

/** Blessed ground: a circle that mends and blesses allies and burns goblins, ticking every half second. */
/** The movement ladder's ground (sim/ladder*.ts, drawn by client/ladderground.ts at the judged size):
 *  a Rogue's caltrops, and the rings of a BLINK BURST and a TAUNT, shown the moment they're judged. */
export type LadderZone = 'caltrops' | 'blinkburst' | 'taunt';
export interface Zone {
  x: number;
  y: number;
  r: number;
  until: number;
  next: number;
  owner: string;
  el: Augment;
  /** Not blessed ground but a skill's area (sim/areas.ts): a Ranger's volley (falling from `at`), a
   *  Mage's fire ring burning on, a staff's wall of fire (sim/firewall.ts: rolling to (`tx`, `ty`) along
   *  (`ax`, `ay`), `r` half its length, standing from `at`) or charged ring (sim/staffrings.ts). */
  kind?: 'volley' | 'fire' | 'sentry' | 'firewall' | 'stormring' | 'skystrike' | LadderZone;
  /** A staff's wall or ring: let go on the flash, and what it deals a touch (`n`). */
  big?: boolean;
  n?: number;
  /** A wall of fire: where it stops, and when each thing it has touched is due to burn again ('e' and a
   *  goblin's id, 'h' and a hero's, 'v' and a survivor's, 'b' and a block's place: wood is tried once). */
  tx?: number;
  ty?: number;
  hit?: Record<string, number>;
  /** A wand's lightning strike (sim/skystrike.ts): it falls at `at`; `fell` once it has. A wall of fire: `fell` once it stands. */
  fell?: boolean;
  /** A wand's lightning strike drawn to an ironhide (sim/rods.ts): the rod's id, and where it was aimed. */
  rod?: number;
  rx?: number;
  ry?: number;
  /** A wind-up bow's aim (for drawing it turned to what it shoots); a wall of fire's way of going. */
  ax?: number;
  ay?: number;
  at?: number;
  /** SANCTUARY STEP: blessed ground that moves with its owner until then, kept at (ox, oy) from them. */
  follow?: number;
  ox?: number;
  oy?: number;
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

/** Boss loot (docs/design/boss-loot.md): a player's choice on a roll. */
export type LootPick = 'need' | 'greed' | 'pass';
/**
 * A unique piece up for the group's roll (sim/lootroll.ts), on the room and sent to every screen. Open
 * until everyone still in has chosen or `until` (room time); then `rolls` (each NEED, or else each GREED,
 * rolled 1 to 100 on the room's seed) and `winner` (null: everyone passed, the piece is left on the floor).
 */
export interface LootRoll {
  id: number;
  x: number;
  y: number;
  item: import('../shared/loot').Item;
  until: number;
  picks: Record<string, LootPick>;
  rolls?: [string, LootPick, number][];
  winner?: string | null;
}

export type FightEvent =
  /** A chalker's stroke on hero `on` (`n` now), the fifth turning its pack on them, the strokes wiped (sim/chalker.ts). */
  | { k: 'chalk'; x: number; y: number; n: number; on: string }
  | { k: 'chalked' | 'chalkwipe'; x: number; y: number; on: string }
  /** A staff's wall of fire coming to a stop and standing (sim/firewall.ts), `r` half its length, square to (`dx`, `dy`). */
  | { k: 'wallup'; x: number; y: number; r: number; dx: number; dy: number; big: boolean }
  /** An expedition (sim/exped.ts): a job or side job done (`i` its place in the list), the way out open, lit, the watch come; a horn, worse, a wave. */
  | { k: 'exped'; x: number; y: number; what: import('./exped').ExpedWhat; i?: number }
  /** Hangman's Wood: a hero hoisted in a snare or cut down, a dropper coming down and landing, burning wood off the oak, the fire lit, a snare laid. */
  | { k: 'hoisted' | 'cutdown' | 'perchdrop' | 'perchland' | 'oakfall' | 'checklit' | 'noosed' | 'snarelaid' | 'lurkrise'; x: number; y: number; id?: string }
  /** The boss kit (sim/poise.ts, doorwall.ts, doorpair.ts): STAGGERED, BRACED's rebound (at the blocker), a door cut down, a phase's roar, the pair swapping jobs. */
  | { k: 'staggered' | 'rebound' | 'doordown' | 'roar' | 'doorswap' | 'growl'; x: number; y: number }
  /** A teammate downed you once too often this job. */
  | { k: 'grudge'; x: number; y: number; id: string; by: string }
  /** The newer sorts (sim/ownfoes.ts): a banner down and the goblins it routs; a net (who's in it, a struggle, cut out, free); a thief's grab, its loot back, gone. */
  /** A storm (sim/storm.ts): a strike's circle shown (the crackle), and the strike landing (the flash, the thunder after). */
  | { k: 'strikewarn' | 'strike'; x: number; y: number }
  | { k: 'bannerfall' | 'routed' | 'struggle' | 'recovered' | 'escaped' | 'rooffall' | 'whip' | 'scatter' | 'howl' | 'dig' | 'surface' | 'unearthed' | 'slick' | 'oilwarn' | 'oilup' | 'crows' | 'listen' | 'ledoff' | 'pulled'
    /** The Staithe (sim/staithe.ts): the log across, shoved in, a net caught someone, a jetty burnt through, the punt over, someone lost off it, a skimmer pinned, a hook snapped. */
    | 'logacross' | 'logshoved' | 'snagged' | 'thrown' | 'puntover' | 'trip' | 'folklost' | 'skimpin' | 'smokehouse'; x: number; y: number }
  /** A hook flung from (x, y) to (x2, y2): the gaffer taking someone off the jetty, or a hero hauled to its brute. */
  | { k: 'gaffed' | 'hooked'; x: number; y: number; x2: number; y2: number }
  | { k: 'netted' | 'netfree'; x: number; y: number; id: string }
  /** A pack rush winding up (`n` goblins, `id` the hero it's on, at the fan's middle);
   *  an ironhide's guard broken (sim/packrush.ts, sim/ironhide.ts). */
  | { k: 'rush'; x: number; y: number; n: number; id: string }
  | { k: 'cracked'; x: number; y: number }
  /** The Haulier's working (sim/haulbook.ts, sim/haulcarts.ts; drawn client/hauldraw.ts): a cart set rolling (`by` a hero, or the Haulier's shove),
   *  hitting a hero or the Haulier (`on`), or stopping at a stop; lightning falling on the winding gear; the Haulier's plate off for good (phase 2). */
  | { k: 'cart'; what: 'go' | 'hit' | 'stop' | 'flip' | 'aim' | 'grab'; x: number; y: number; by?: string; on?: string }
  | { k: 'tub'; what: 'push' | 'plate' | 'reset' | 'solved'; x: number; y: number; by?: string }
  | { k: 'gear'; x: number; y: number; hit: boolean }
  | { k: 'bare'; x: number; y: number }
  /** The Haulier landing a leap; its sparks coming down on a spot (sim/haulbook.ts). */
  | { k: 'haulleap'; x: number; y: number }
  | { k: 'sparks'; x: number; y: number }
  /** A Doorkeeper's quake circle landing (sim/doorpair.ts). */
  | { k: 'quake'; x: number; y: number }
  /** Boss loot (sim/lootroll.ts): a unique piece dropped and up for the group's roll (`id`), and the roll settled (`winner`, or none if all passed). */
  | { k: 'lootroll'; what: 'open' | 'done'; id: number; x: number; y: number; winner?: string }
  | { k: 'cutfree'; x: number; y: number; id: string; by: string }
  | { k: 'stolen'; x: number; y: number; id: string; n: number; potion?: PotionId }
  /** A hero down (`by`: the teammate whose blow did it), or picked up (`by`: who picked them up). */
  | { k: 'down' | 'pickedup' | 'raising' | 'gotup'; x: number; y: number; id?: string; by?: string }
  /** RAISE (sim/raise.ts): a Cleric (`by`) begins raising a friend who is out (`id`), is broken off, or has raised them (`n`: the cut, in %). */
  | { k: 'rising' | 'risebroke' | 'risen'; x: number; y: number; id: string; by: string; n?: number }
  /** A press that did nothing, said to that hero: GRAB with nothing to take hold of, ATTACK held on an empty crossbow. */
  | { k: 'nograb' | 'reloadcue'; x: number; y: number; id: string }
  /** The class's own button (sim/signature.ts): a Ranger's MARK on a goblin (`id` the Ranger); a Healer's
   *  MEND from (x, y) to (x2, y2), `n` given (`self` on themselves); a press that did nothing (`why`). */
  | { k: 'hunted'; x: number; y: number; id: string }
  | { k: 'mended'; x: number; y: number; x2: number; y2: number; n: number; self: boolean }
  | { k: 'nosign'; x: number; y: number; id: string; why: 'mark' | 'hurt' | 'breath' }
  /** The wood (sim/woodheal.ts): Hew struck by the archer's arrow; a smoke bomb thrown. */
  | { k: 'hewshot' | 'smokebomb'; x: number; y: number }
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
  | { k: 'hit'; x: number; y: number; n: number; heavy: boolean; on: 'enemy' | 'hero'; counter?: boolean; crit?: boolean; ambush?: boolean; boarded?: boolean; backstab?: boolean; tick?: boolean; src?: string; big?: boolean; plated?: boolean; marked?: boolean }
  | { k: 'swing'; x: number; y: number; src: string; heavy: boolean }
  | { k: 'death'; x: number; y: number; how: DeathKind; dx: number; dy: number; kind: EnemyKind }
  /** A shot stopped dead on a shield-bearer's board (sim/board.ts): a thunk, sparks, BLOCKED. */
  | { k: 'deflect'; x: number; y: number }
  /** THE DROVER's roped line cut loose (sim/drover.ts). */
  | { k: 'cutloose'; x: number; y: number; by: string }
  /** THE SLUICER in the water, and stood up again by THE RAKER (sim/pairfall.ts). */
  | { k: 'pairfell'; x: number; y: number }
  /** A named one opened up: OPEN (INSTANCE.open). */
  | { k: 'opened'; x: number; y: number }
  /** An instance's gate between stretches opened for the party (sim/stretches.ts). */
  | { k: 'gateopen'; x: number; y: number }
  /** An instance's fork decided by the party's vote (sim/fork.ts). */
  | { k: 'wayopen'; x: number; y: number; way: number }
  | { k: 'pairup'; x: number; y: number }
  | { k: 'boardout'; x: number; y: number }
  /** `more`: another blow of a pack rush met by the same guard in the same instant (its words said once). */
  | { k: 'block' | 'guardbreak' | 'winded' | 'breath' | 'bash' | 'dodge' | 'slip' | 'out' | 'roll' | 'stunned' | 'wallhit' | 'charged' | 'heavy'; x: number; y: number; more?: boolean; striped?: boolean }
  | { k: 'windup' | 'impact'; x: number; y: number; kind: AttackKind }
  /** The prologue's cutscene: the ground shaking, the bite, a body landing, the Stoker's bellow. */
  | { k: 'rumble' | 'bite' | 'thud' | 'bellow' | 'fanfare'; x: number; y: number }
  /** A wood objective done (sim/woodsteps.ts): the tracker's gold flash. */
  | { k: 'passed'; x: number; y: number }
  /** A Ranger or Rogue holding block (it does nothing), or a Mage pressing it at all. */
  | { k: 'noguard'; x: number; y: number; dodge?: string }
  /** The Ranger's snare laid; the hound barking or yelping off. */
  | { k: 'snareset' | 'bark' | 'yelp'; x: number; y: number }
  /** The Mage's channel: its spells now `el`, the first one primed. */
  | { k: 'channeled'; x: number; y: number; el: string }
  /** The Mage's kits (sim/spells.ts, manashield.ts): magic spent (`n`), a spell fizzled for want of it, a
   *  blow broken off by a wand's tap, a staff's slash (along dx, dy). The spellblade's shield: a hit took
   *  `n` magic, the shield ran out, a dodge through a blow gave `n` back. */
  | { k: 'magic' | 'manaward'; x: number; y: number; n: number }
  | { k: 'fizzle' | 'interrupt' | 'manabreak'; x: number; y: number }
  /** A hold let go before its full draw, on a kit that does nothing then (shared/weapons.ts `early`). */
  | { k: 'early'; x: number; y: number }
  | { k: 'manaup'; x: number; y: number; n: number }
  | { k: 'slash'; x: number; y: number; dx: number; dy: number; el: Augment }
  /** A Mage's held spell going off (sim/holds.ts): `what` it is, from (x, y) along (dx, dy), `r` its size
   *  (a cone's or ring's radius, a rush's length), `big` let go on the flash. */
  | { k: 'spell'; x: number; y: number; dx: number; dy: number; el: Augment; what: SpellWhat; r: number; big: boolean }
  /** A wand's lightning strike falling where it was called, `r` round (sim/skystrike.ts). */
  | { k: 'skystrike'; x: number; y: number; r: number; big: boolean }
  /** GRASP (sim/grasp.ts): cast from (x, y) along (dx, dy), `r` its reach; each goblin dragged, to (x2, y2). */
  | { k: 'grasp'; x: number; y: number; dx: number; dy: number; r: number; arc: number; n: number }
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
  | { k: 'ignite' | 'chill' | 'freeze' | 'shatter' | 'steam' | 'flare' | 'blink' | 'bless' | 'blessed' | 'rally' | 'rallied' | 'smite' | 'net' | 'snared' | 'well' | 'shadow' | 'perfect' | 'tempo' | 'grab' | 'hurl' | 'slam' | 'bodyhit' | 'wriggle' | 'lift' | 'oilfire' | 'freed' | 'exitopen' | 'blaze' | 'chop' | 'denspawn' | 'hallow' | 'ward' | 'warded' | 'reflect' | 'wardbreak' | 'spotted' | 'skewer' | 'envenom' | 'shieldbash' | 'quake' | 'pin' | 'blinded' | 'wind' | 'loaded' | 'glint' | 'trueshot' | 'holyshield' | 'shieldsoak' | 'shieldgone' | 'coalburst' | 'coalflare' | 'snag' | 'flailstun' | 'holysmite' | 'shrug'
      /** Techniques firing (shared/techniques.ts): SLAM's bursts, SHOULDER CHARGE ready and landing, IRON FEET,
       *  KNIFEWORK's bleed, SLIP AWAY, CUTPURSE, QUICK NOCK, STEADY, MENDING HANDS, SANCTUARY STEP, JUDGEMENT. */
      | 'slamburst' | 'shoulderready' | 'shoulder' | 'ironfeet' | 'cutbleed' | 'slipaway' | 'cutpurse' | 'quicknock' | 'steady' | 'mending' | 'sanctstep' | 'judged'; x: number; y: number }
  /** The movement ladder and the Mage's techniques firing (shared/ladder.ts, techniques.ts): `r` a reach,
   *  `el` an element, `n` magic given back, (x2, y2) the friend covered or the goblin gone through. */
  | { k: 'airshot' | 'twinsnare' | 'landing' | 'blinkburst' | 'blinkthrough' | 'halfblink' | 'caltrops' | 'underlegs' | 'legstab' | 'shakeoff' | 'shelter' | 'blockmend' | 'coverfor' | 'ironstance' | 'taunt' | 'taunted' | 'braced' | 'attuned' | 'spellthief'; x: number; y: number; r?: number; el?: Augment; n?: number; x2?: number; y2?: number }
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
  /** A relic's last use gone: its short name (JAVELIN), said over the hero with DARK. */
  | { k: 'faded'; x: number; y: number; name: string }
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
  /** A frozen goblin sent skidding along (dx, dy) for `r` tiles, and its crash (`r` the burst; sim/iceslide.ts). */
  | { k: 'fling' | 'icecrash'; x: number; y: number; dx: number; dy: number; r: number; big: boolean }
  /** A hero grew a level: full health, and a flash in the class's colour (sim/grow.ts). */
  | { k: 'levelup'; x: number; y: number; id: string; cls: HeroClass }
  /** World effects (shared/worldfx.ts): lightning drawn from (x, y) into an ironhide at (x2, y2); a jolt through
   *  a body of water from (x, y) to the goblins at `to` and passing the friends at `spared` (`body` which water,
   *  `wild` the sky's own); a butcher sitting down to a body, taken off it, FED (`n` healed); a body burned to
   *  ash; shallows iced `r` round, ice melted; a steam cloud rising `r` round. */
  | { k: 'rodhit'; x: number; y: number; x2: number; y2: number }
  | { k: 'pooljolt'; x: number; y: number; to: [number, number][]; spared: [number, number][]; body: number; wild?: boolean }
  | { k: 'meal' | 'mealbroken' | 'ashed' | 'thaw'; x: number; y: number }
  | { k: 'fed'; x: number; y: number; n: number }
  /** The second wave (sim/blast.ts, hornblow.ts, meaty2.ts): a burst's fuse lit, a horn raised, cut off, its call answered; a Gorger grown. */
  | { k: 'fuse' | 'horn' | 'horncut' | 'called' | 'grown'; x: number; y: number }
  | { k: 'iced' | 'steamup'; x: number; y: number; r: number };

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
  /** Every goblin skewered on the shaft, tip first (2026-11-05: it carries them all). */
  held?: number[];
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
  kind: 'arrow' | 'bolt' | 'knife' | 'dart' | 'spark' | 'orb' | 'lance' | 'smite' | 'net' | 'lodestone' | 'flask' | 'bomb';
  /** A relic's: it never hurts a friend or anyone freed (friends caught in it are told they're spared). */
  relic?: boolean;
  /** A mace's smite: its light mends friends in the burst this much; `holy`: let go on the flash, it shields them (sim/holy.ts). */
  heal?: number;
  holy?: boolean;
  /** Hobbles what it hits (a wind-up bow's bolt). */
  hobble?: boolean;
  /** A wind-up bow's bolt: the goblin (id) it flies at, turning as it goes, so it never misses. */
  seek?: number;
  /** A Mage's frost burst: freezes solid at once (frost twice). */
  freeze?: boolean;
  /** A Mage's tap: frost only chills (never freezes). */
  chills?: boolean;
  /** Its storm cast: a wet goblin is jumped to once a shot (sim/elements.ts). */
  cast?: number;
  /** A wand's: landing on a goblin mid wind-up, it breaks the blow off (sim/spells.ts). */
  interrupts?: boolean;
  /** A wand's burst loosed on the white flash: it breaks off whatever the goblin it hits is doing. */
  breaks?: boolean;
  /** A thrown flask's potion; a smoke bomb's smoke, its size and how long it lasts (sim/smokebomb.ts). */
  potion?: PotionId;
  smokeR?: number;
  smokeTime?: number;
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

/**
 * A storm's lightning strike (sim/storm.ts): its circle at (x, y), radius `r`, landing at room time `at`
 * (shown from STRIKE.warn before), on what it picked (`on`, for drawing a tree or pole lit up). One shape,
 * drawn and judged (shared/storm.ts strikeShape, inStrike).
 */
export interface Strike { id: number; x: number; y: number; r: number; at: number; on: 'tree' | 'banner' | 'engine' | 'goblin' | 'hero' | 'ground' | 'rod'; done?: boolean; /** Drawn to an ironhide (sim/rods.ts): where it would have fallen, and the rod's id. */ ox?: number; oy?: number; rod?: number }

/** Shallows iced over by frost (sim/ice.ts, ICE): a circle, iced only where the water is shallow. */
export interface Ice { id: number; x: number; y: number; r: number; at: number; until: number }

/** A poison puddle where the brood mother's glob landed (sim/puddles.ts). */
export interface Puddle { id: number; x: number; y: number; r: number; until: number }

/** A Ranger's snare on the ground. */
export interface Snare { owner: string; x: number; y: number; until: number; /** How long it holds what steps in. */ hold?: number; /** TRAPPER: catches left (one when unset), and who it has caught. */ left?: number; got?: number[] }
/** A Ranger's hound: at heel, running something down, worrying it, or scared off till `back`. */
export interface Hound { x: number; y: number; fx: number; fy: number; state: 'heel' | 'run' | 'bite' | 'fled'; target: number; t: number; next: number; back: number; bites: number; moving: boolean; /** Lying down (across you while you're out). */ down?: boolean; /** Sent in by SEND THE HOUND: pins what it reaches. */ pin?: boolean }
