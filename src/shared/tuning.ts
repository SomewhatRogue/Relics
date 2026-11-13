/**
 * Every number the fight runs on. The rules read these and the client draws from the same values,
 * so a wind-up you see is the wind-up that is judged. Distances are in tiles (1 tile = 16 px),
 * times in seconds, knockback in tiles per second of push (divided by the target's weight).
 */
import type { HeroClass } from './weapons.js';

export const TICK = 1 / 30;

/**
 * The Night Watch (client/watchmode.ts, sim/watch.ts): closed for now (Kyle, 2026-11-06: "the wall defense
 * is weird right now and you don't drag it back to shoot etc. also not super fun in general"). Off, Brisk
 * offers no shift and nothing in town leads up the stair; the code and its tests stay for the redo.
 * `?watch=1` in the address turns it on for a look (scripts/watch-look.cjs).
 */
export const NIGHT_WATCH = { on: false };

export const HERO = {
  hp: 100,
  radius: 0.32,
  weight: 1,
  speed: 4.4,
  stamina: 100,
  staminaRegen: 34,
  regenDelay: 0.6,
  /** A Mage's MAGIC refills slower than breath, and each cast starts the wait over (Kyle, 2026-11-04). */
  magicRegen: 14,
  magicDelay: 2,
  /** Run your breath all the way out and you're winded: nothing comes back for this long, and you can't
   *  dodge or block again until the bar is full (Kyle, 2026-11-01). */
  windedDelay: 1,
  /** Downed heroes stand back up after this (no revive yet). */
  respawn: 3,
};

export * from './instancetune.js';
export * from './weapons.js';
export * from './magic.js';
export * from './skillkit.js';
export * from './relickit.js';
export * from './loot.js';
export * from './scenetune.js';
export * from './props.js';
export * from './progress.js';
export * from './potions.js';
export * from './gear.js';
export * from './costs.js';
export * from './prices.js';
export * from './hungry.js';
export * from './drills.js';
export * from './backline.js';
export * from './spiders.js';
export * from './weakness.js';
export * from './venom.js';
export * from './warrior.js';
export * from './ranger.js';
export * from './mage.js';
export * from './spellbook.js';
export * from './ladder.js';
export * from './cleric.js';
export * from './stuncap.js';
export * from './raiders.js';
export * from './prowlers.js';
export * from './encounters.js';
export * from './worldfx.js';
export * from './staithetune.js';
export * from './shifttune.js';
export * from './hangtune.js';
export * from './fentune.js';
export * from './chalk.js';
export * from './threat.js';
export * from './meaty.js';
export * from './meaty2.js';
export * from './elites.js';
export * from './bosstune.js';
export * from './haultune.js';
export * from './listentune.js';
export * from './leechtune.js';
export * from './holdtune.js';
import { BANNER, NETTER, THIEF, LOGS, ROOF, IRONHIDE } from './raiders.js';
import { CHALKER } from './chalk.js';
import { WOLF, KEEPER, OIL, TORCH, SAPPER, CAVE } from './prowlers.js';
import { DRUMMER, HEXER } from './backline.js';
import { GAFFER, SKIMMER } from './staithetune.js';
import { SNARER } from './hangtune.js';
import { PLANKER, SWINGLE, FORKER } from './meaty.js';
import { KEGMAN, POUNCER, GORGER } from './meaty2.js';

/** Holding attack past `start` begins charging; the heavy is strongest at `full`. */
export const CHARGE = { start: 0.18, full: 0.9 };
/** A queued press is kept this long. */
export const INPUT_BUFFER = 0.25;

export const GUARD = {
  /** Stamina spent per point of damage blocked (a block costs no health: Kyle, 2026-11-01). */
  staminaPerDmg: 2.4,
  guardBreakStun: 0.9,
  /** After a block takes a blow, the next attack started within this window is a counter, `counterMult` as
   *  hard (no timing to it: Kyle, 2026-11-05, parry is gone; was 2.5 when only a parry earned it). */
  counterWindow: 1.6,
  counterMult: 1.5,
  /** A blow's damage counts in full toward a block's stamina up to `knee`, and only `past` of each point above
   *  it, so one big blow (a butcher's cleave) doesn't take the whole bar (Kyle, 2026-11-06: "Warrior block isn't
   *  great against butcher"). A butcher's cleave of 30 costs a sword 46 stamina (was 72); a scrapper's 8, 19 as before. */
  knee: 12,
  past: 0.4,
  /** And no one red blow costs more than `most` of it: a full bar always holds one (a striped one costs more, below). */
  most: 70,
  /** A crushing blow (a heavy's) blocked: `crushCost` times the stamina and more shove (`crushShove` of its knock). */
  crushCost: 1.25,
  crushShove: 0.8,
  /** A red blow blocked shoves you this share of its knock. */
  shove: 0.4,
  /**
   * A striped blow blocked facing it (Kyle, 2026-11-06: "Should mitigate all damage, even unblockable"): only
   * `through` of it reaches your health (a Warrior's 25%, a Healer's 40%), it costs `cost` times a red blow's
   * stamina, shoves you `shove` of its knock and opens no counter. Still worse than getting out of it.
   */
  striped: { through: { WARRIOR: 0.25, HEALER: 0.4 } as Partial<Record<HeroClass, number>>, cost: 1.3, shove: 0.75 },
  /** Hits on a stunned enemy (other than the counter) do this much more. */
  stunnedMult: 1.5,
  /** Any blow from behind does this much more (daggers do more, see WEAPONS). No extra knockback. */
  rearMult: 1.25,
  /** Behind means the attacker stands where the target's facing points away (dot below this). */
  rearCos: -0.35,
};


export const HITSTOP = { light: 0.05, heavy: 0.11, counter: 0.18 };
/**
 * Splattering the small ones: a small goblin killed by a blow slides on along it (`knock` tiles a
 * second, sliding to rest), the blow holds a beat longer (`stop`), and each more killed by the same
 * swing holds `more` again (to `most`).
 */
export const SPLAT = { knock: 7, stop: 0.07, more: 0.025, most: 0.14 };
/** Goblins hit by their own: an arrow that missed you lands on the first goblin in its line (this times
 *  its damage); a butcher's sweep, slam or charge catches small goblins under it. */
export const FRIENDLY = { shot: 1.5, blow: 0.8 };
/** Dodging: rolled clear before it landed counts (no bonus); a roll through the blow as it lands (in the
 *  roll's i-frames) staggers a close attacker for this share of its stun (EnemySpec.stun). `cost`: every dodge's
 *  stamina is multiplied by this for now (Kyle: dear at first, so there's something to grow into; perks,
 *  gear and levels bring it down). */
export const DODGE = { stun: 0.6, cost: 1.5 };
/**
 * Lag on a friend's screen (sim/lagcomp.ts): a blow on a friend's hero waits for their word on it (a
 * dodge or a block by what their screen showed) until `cap` seconds (0.35: Kyle, 2026-11-06, so an on-time press counts for a cross-country friend) after it lands at most, however far
 * behind their screen is. `most`: a lag reading above this is a hiccup, not a lag (not kept).
 */
export const LAGCOMP = { cap: 0.35, most: 1 };
/**
 * A party (more than one player in a fight). `bleed`: seconds down before you get yourself up (once a job) or are out;
 * `pickUp`: seconds a teammate kneels by you (GRAB) to get you up (a hit on them stops it), from
 * within `reach` tiles, and you come up with `upHp` of your health. `friendly`: what your own side's
 * blows, shots and blasts do to you. Each player past the first brings `foes` more goblins (as a
 * share of the room's) and `boss` more health on a named one. `grudge`: team kills by the same
 * player in one job before you hold it against them.
 */
/** `reward`: each extra player adds this share to a won job's pay and objective xp (more goblins already mean more kill gold and xp). */
/** Seconds nothing can hurt a hero who has just come into a new room on a job (no friendly fire in the doorway). */
export const ARRIVE_SAFE = 3;

export const PARTY = { bleed: 20, pickUp: 2.5, reach: 1.4, upHp: 0.4, friendly: 0.5, foes: 0.6, boss: 0.4, grudge: 3, reward: 0.25 };
export const HURT_STAGGER = 0.25;
/**
 * No stun-lock (Kyle, 2026-11-11: "I get stun locked by too many small enemies and can't fight back"): after a
 * blow staggers you, small goblins' blows can't stagger you again for `guard` seconds (they still hurt), so
 * you always get a window to dodge, block or hit back. A butcher's still staggers.
 */
export const STAGGER = { guard: 1 };

/** Knockback slides decay by this share per second; a slide this fast into a wall slams. */
export const KNOCK = { friction: 9, wallSpeed: 5, wallDmg: 6, /** A body this fast that hits another hurts both. */ bodySpeed: 6, bodyDmg: 1.5, bodyMax: 25 };

/**
 * Grabbing a small goblin: only one you've stunned, netted, frozen, staggered or got behind. Carried
 * overhead, it can be slammed into the ground (a kill pounds its head in) or thrown at its friends.
 */
export const GRAB = { reach: 1.3, carrySpeed: 0.6, hold: 3, throwSpeed: 16, /** Seconds a thrown goblin flies before it starts to skid. */ air: 0.35, slamWindup: 0.3, slamRecover: 0.3, slamDmg: 30, slamStun: 1.5 };

/** A killing blow this much bigger than the life left bursts the body. */
export const OVERKILL = 20;

export interface EnemyAttackSpec {
  windup: number;
  active: number;
  recover: number;
  dmg: number;
  knock: number;
  unblockable: boolean;
  range?: number;
  arc?: number;
  radius?: number;
  ahead?: number;
}

export interface EnemySpec {
  hp: number;
  radius: number;
  weight: number;
  speed: number;
  reach: number;
  respawn: number;
  /** Its full stun (a dodge through its blow staggers it DODGE.stun of this). */
  stun: number;
  pauseBetween: number;
  /** Ordinary hits interrupt its wind-up (light enemies); heavy ones need a charged hit. */
  flinches: boolean;
  /** How fast it turns to face you (radians a second): slow turners can be got behind. */
  turn: number;
}

export const BUTCHER: EnemySpec & { cleave: EnemyAttackSpec; slam: EnemyAttackSpec; slamChance: number } = {
  hp: 260, radius: 0.62, weight: 3.5, speed: 2.1, reach: 2.2, respawn: 4, stun: 2.2, pauseBetween: 0.5, flinches: false, turn: 2.4,
  cleave: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 30, knock: 8, range: 2.6, arc: 70, unblockable: false },
  slam: { windup: 1.3, active: 0.12, recover: 1.1, dmg: 40, knock: 14, radius: 1.7, ahead: 1.2, unblockable: true },
  slamChance: 0.3,
};

export const SCRAPPER: EnemySpec & { stab: EnemyAttackSpec } = {
  hp: 36, radius: 0.34, weight: 0.6, speed: 3.1, reach: 1.25, respawn: 5, stun: 1.8, pauseBetween: 0.9, flinches: true, turn: 7,
  stab: { windup: 0.55, active: 0.08, recover: 0.5, dmg: 8, knock: 3, range: 1.35, arc: 50, unblockable: false },
};

/**
 * A scrapper with a bow: keeps its distance (up on a ledge if it can), draws on you for a second with
 * a long thin telegraph, and looses. Blockable, rollable.
 */
export const ARCHER = {
  reach: 7.5,
  /** It runs from you when you're this close on its own level. */
  keep: 4.5,
  flee: 1.1,
  shot: { windup: 1.0, active: 0.08, recover: 0.7, dmg: 10, knock: 3, range: 8, arc: 7, unblockable: false } as EnemyAttackSpec,
};

/** Heights: shots from up on a ledge hit harder; something knocked off a ledge this fast takes a fall. */
/**
 * Goblins at rest: they mill about until they see you (this close, in front of them; half that from
 * behind), hear a fight (a goblin hit or killed this close), or are hurt; then they shout, and every
 * goblin within `shout` comes too.
 */
export const ALERT = { sight: 6.5, behind: 2.5, hear: 5, shout: 5.5, wander: 0.9, wanderSpeed: 0.8 };
/**
 * Creeping up: walk slowly (the stick part way over; Shift on a keyboard), and goblins
 * at rest see you at `sneak` of the distance. The first blow on one that hasn't seen you is an AMBUSH:
 * `ambush` times as hard, and it reels for `reel` seconds.
 */
/** `creep`: walking pace with the stick inside `slow` (Kyle, 2026-11-04: half-pushed sticks felt randomly slow; now it's full pace or a steady creep). */
export const STEALTH = { slow: 0.55, creep: 0.5, sneak: 0.45, ambush: 2.2, reel: 1.2 };

/**
 * The prologue wood's goblins (shared/wood.ts), each built for one lesson: looters (slow, weak,
 * picking the dead), lungers (a striped stab from further off: dodge it), the heavy (a crushing blow:
 * dear to block, GUARD.crushCost, or dodge it) and the Stoker (a one-off butcher: rake sweep, kiln drop, and the draw, a rake
 * flung along a line and hauled back).
 */
export const VARIANTS = {
  looter: { hp: 14, speed: 0.55, stab: { windup: 0.85, active: 0.08, recover: 0.7, dmg: 5, knock: 2, range: 1.3, arc: 50, unblockable: false } as EnemyAttackSpec },
  lunger: { hp: 30, reach: 2.8, stab: { windup: 0.8, active: 0.1, recover: 0.8, dmg: 10, knock: 5, range: 3.0, arc: 24, unblockable: true } as EnemyAttackSpec },
  /**
   * Run goblins with a board (sim/board.ts), Kyle 2026-11-11: "shield goblins still aren't really shielding". Within
   * `cone` of its facing (the cosine: 0.34 is 70 degrees either side) the board stops everything: blows, shots,
   * charged or perfect, fire, frost and lightning, and bursts that go off in front of it. Two ways in: it lowers
   * the board `drop` seconds before each of its own blows land and `after` seconds past it (hit it then, from the
   * front: a Warrior's counter just makes it), or get round it: it
   * walks at `speed` of a goblin's pace and turns `turn` radians a second (a small goblin's 7). From the side or
   * behind, or with it stunned, pinned, frozen, netted or unaware, everything lands.
   */
  shield: { hp: 44, cone: 0.34, drop: 1, after: 0.35, speed: 0.75, turn: 1.4 },
  /** The back of the pack (shared/backline.ts): a caster and a drummer. */
  hexer: HEXER,
  drummer: DRUMMER,
  /** The new sorts (shared/raiders.ts, prowlers.ts): their health here, the rest there. */
  banner: { hp: BANNER.hp }, netter: { hp: NETTER.hp }, thief: { hp: THIEF.hp }, log: { hp: LOGS.hp }, roofer: { hp: ROOF.hp },
  ironhide: { hp: IRONHIDE.hp }, chalker: { hp: CHALKER.hp },
  /** The Staithe's sorts (shared/staithetune.ts). */
  gaffer: { hp: GAFFER.hp }, skimmer: { hp: SKIMMER.hp },
  /** Hangman's Wood's (shared/hangtune.ts). */
  snarer: { hp: SNARER.hp },
  /** The new meaty sorts (shared/meaty.ts). */
  planker: { hp: PLANKER.hp }, swingle: { hp: SWINGLE.hp }, forker: { hp: FORKER.hp },
  kegman: { hp: KEGMAN.hp }, pouncer: { hp: POUNCER.hp }, gorger: { hp: GORGER.hp },
  wolf: { hp: WOLF.hp }, keeper: { hp: KEEPER.hp }, oiler: { hp: OIL.hp }, torch: { hp: TORCH.hp }, sapper: { hp: SAPPER.hp }, blind: { hp: CAVE.hp },
  /** The Mage's element lesson (shared/wood.ts ELEMENT_FOES): plain small goblins but for what they're weak to. */
  soaked: { hp: 24 }, aproned: { hp: 24 }, kilnhot: { hp: 24 },
  heavy: { hp: 110, reach: 1.7, speed: 0.75, swing: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 18, knock: 8, range: 1.9, arc: 100, unblockable: false } as EnemyAttackSpec },
  /** The Stoker, the wood's last fight and a new hero's first big one (Kyle, 2026-11-06: "tutorial is too hard"):
   *  was 520 health, 26 a sweep, 34 a drop, 30 a charge, each wind-up as written; now softer, its wind-ups
   *  WOOD_EASE.stoker as long. */
  stoker: {
    hp: 380,
    sweep: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 18, knock: 8, range: 3.0, arc: 150, unblockable: false } as EnemyAttackSpec,
    drop: { windup: 1.2, active: 0.12, recover: 1.0, dmg: 24, knock: 14, radius: 2.0, ahead: 1.0, unblockable: true } as EnemyAttackSpec,
    draw: { windup: 1.0, active: 0.1, recover: 0.6, dmg: 6, knock: 0, range: 8, arc: 8, unblockable: true } as EnemyAttackSpec,
    drawFrom: 3.2, drawEvery: 0.45, pullTo: 1.2, pullStun: 0.7,
    /** The charge: a long striped run straight at you. A block only takes the edge off, and no blow stops it
     *  once it's coming; get out of its line. Run into a wall or a tree and it stuns itself. */
    charge: { windup: 1.15, active: 0.55, recover: 1.0, dmg: 20, knock: 14, range: 8, arc: 0, radius: 0.95, unblockable: true } as EnemyAttackSpec,
    chargeFrom: 3.5, chargeChance: 0.3, chargeStun: 1.8,
  },
};

/**
 * The wood is a first run (Kyle, 2026-11-06: "Right now tutorial is too hard unfortunately"). Its drilled
 * goblins (every one but the Stoker) wind up `windup` times as slow and hit `dmg` as hard; the Stoker winds up
 * `stoker` times as slow; you start each lesson at full health and breath (`heal`); and falling to the Stoker
 * gives it back only `mends` of the health you'd taken off it (it used to start again whole), with the friends
 * it called gone and not called again.
 */
export const WOOD_EASE = { windup: 1.5, dmg: 0.7, stoker: 1.25, heal: true, mends: 0.25 };

export const HEIGHT = { shot: 1.25, fallSpeed: 3, fallDmg: 12, fallStun: 0.8 };

export const SWING_DUMMY = {
  every: 2.6,
  reach: 2.2,
  stun: 1.8,
  swing: { windup: 0.8, active: 0.08, recover: 0.6, dmg: 8, knock: 3, range: 2.0, arc: 80, unblockable: false } as EnemyAttackSpec,
};

/**
 * Pack rushes (Kyle, 2026-11-04: "I want to have to block sometimes and parry"; "as long as the ones that
 * wind up can all be blocked or parried at once"; parry went on 2026-11-05, so block or dodge). The rules: sim/packrush.ts. While a pack fights (an awake
 * goblin of it within `fight` tiles of a hero), `first` seconds into the fight and then every `every`
 * (seeded between the two), a free goblin of it calls a rush on a hero it stands in front of, if two more
 * of the pack are in the fight there too. For `call` seconds packmates within `near` of it join as each
 * comes free, till `join` more (2 or 3, seeded) have; every one within `seen` tiles of that hero and not
 * behind them (`side`: the cosine off where they face). They step into a fan before the hero on the
 * pack's side (`slot` tiles out, `spread` radians apart, in place within `at`, `gather` seconds at most),
 * and once each is in place and the fan's middle is in front of the hero (`front`, the cosine) they wind up
 * together for `blow.windup` seconds, so every blow lands in the one instant. Judged from the fan's
 * middle, so one guard covers it all: one block takes every blow for one blow's stamina (and opens
 * the counter), a dodge through it slips them all. A call
 * that finds too few tries again `retry` seconds later. One rush on a hero at a time. `big`: a brute's or
 * an ironhide's blow in one.
 */
export const RUSH = {
  first: [0.5, 1.5] as [number, number], every: [6, 10] as [number, number], retry: 1.5, fight: 8,
  join: [2, 3] as [number, number], near: 4.5, front: 0.55, side: -0.1, seen: 5.5,
  call: 1.2, slot: 1.55, spread: 0.42, at: 0.6, gather: 2.4,
  blow: { windup: 1.3, active: 0.1, recover: 0.8, dmg: 9, knock: 4, range: 1.9, arc: 50, unblockable: false } as EnemyAttackSpec,
  big: 14,
};

/** How long a light enemy flinches when hit. */
export const FLINCH = 0.3;
/** Quick blows never break a wind-up: only a charged blow, a perfect or a big breaker does (Kyle,
 *  2026-11-04: "most people are slamming quick attack, so it's not skill based"). A quick blow still
 *  knocks an idle small goblin off balance, but not again for `relock` seconds, so mashing can't lock it. */
export const POISE = { relock: 1.2 };

/**
 * A house on fire inside (shared/blaze.ts, sim/blaze.ts). A patch smokes `warn` seconds before it
 * catches, then burns anyone standing in it `dps`; a beam's circle shows `beamWarn` before it lands
 * (`beamR`, `beamDmg`), and it burns where it fell for `beamBurn`. The roof gives `fallWarn` seconds of
 * falling dust before it comes in at the plan's `fall`: everyone inside is thrown out the door hurt
 * (never below 1 health), and anyone still caged is lost.
 */
export const HOUSEFIRE = { warn: 3, dps: 14, beamWarn: 1.6, beamR: 0.95, beamDmg: 22, beamBurn: 5, fallWarn: 10, fallDmg: 18, fallMin: 52, fallMax: 64 };

/**
 * Setting a house on a job alight (Kyle, 2026-11-03: shared/kindling.ts, sim/kindle.ts, sim/houseburn.ts).
 * Each small house has one kindling spot by a side wall: it glints within `glint` tiles; within `reach`
 * GRAB crouches `light` seconds (`lightBig` for a longhouse, manor or tithe barn) and it's alight. It
 * `catch`es (smoke, small flames) then burns `burn` more seconds (`burnBarn`, `burnBig`) and the roof
 * comes in: a burnt shell. Goblins inside choke `smoke` a second until they're out: the awake ones from
 * `wakeOut` seconds, one every `wakeGap`; the sleeping ones somewhere in the `sleepOut` window, later
 * in a bigger house; out burning for `outBurn` seconds. Players inside get `grace` seconds, then the
 * smoke takes `heroSmoke` a second. A chest inside leaves a charred drop at the door: `charGold` gold
 * and, `charItem` of the time, one plain piece. Each caged person lost to it takes `lostCut` off the job's
 * pay (at most `lostMost`).
 */
export const HOUSEBURN = {
  glint: 2.5, reach: 1.05, light: 1.5, lightBig: 2.4, catch: 3, burn: 24, burnBarn: 30, burnBig: 40,
  smoke: 2.5, wakeOut: 1.6, wakeGap: 0.9, sleepOut: [4, 14] as [number, number], sleepOutBig: [4, 22] as [number, number], outBurn: 1,
  grace: 4, heroSmoke: 5, charGold: [6, 14] as [number, number], charItem: 0.5, cryReach: 1.6, lostCut: 0.15, lostMost: 0.6,
};
/**
 * How likely fire is to set a house alight by accident (rolled once on the room's fire stream, so it's
 * the same on every screen). A Lamp Oil flask bursting against it (or at its kindling spot) nearly
 * always; a fire spell or a fire relic's burst against the wall most of the time; the edge of a fire
 * burst or a spark that hits the wall now and then; a Fire Ring reaching it sometimes. A burning goblin
 * rubbing on it, and a neighbour's fire, take their chance a second. Other wood (dens, sheds, fences) still
 * catches every time.
 */
export const CATCH = { oil: 0.9, barrel: 0.9, blast: 0.75, edge: 0.12, spark: 0.12, ring: 0.3, rub: 0.04, spread: 0.02, wall: 0.4, spot: 0.9 };
/**
 * A big map (shared/bigmap.ts): a goblin farther than `wake` tiles from every hero dozes (sim/sleep.ts):
 * it holds where it stands and costs the room nothing. It wakes inside `wake` and dozes again only past
 * `doze`, so one on the edge doesn't flicker. A laptop screen is about 23 tiles across, a phone's about
 * 26 tall: `wake` is about two screens of a hero's reach, well past any goblin's sight or an arrow's.
 */
export const SLEEP = { wake: 24, doze: 30 };
/** A goblin dead for good stops its clocks after this long (its fall and a nest's embers are done by then): nothing ticks to send. */
export const STILL = 8;

/**
 * An expedition (shared/expedmap.ts, sim/exped.ts): one big map, dropped in, two or three pinned jobs,
 * pressure that rises, a way out to call and hold. `goblins` placed at the start and `cap` alive at once
 * are a phone host's numbers (DECISIONS 2026-11-03: 150 to 200 with dozing). Times in seconds, sizes in tiles.
 * - `poison` at the cookpot, `hold` at the barrow shrine (`holdR` its ring), `pray` at a wayside shrine
 *   (the party `blessed` that long), `call` standing in the way out's ring (`extractR`) to light the
 *   beacon, then `extract` held in it before the watch comes. `standR`: the cookpot's and a wayside
 *   shrine's ring. Every ring is drawn and judged at the same size (shared/expedrings.ts).
 * - The two holds (Kyle, 2026-11-04: "I want the area you can hold to be larger so you can be agile if
 *   you're an agile class"): rings of 6 tiles, room for a Rogue or Ranger to roll, kite and come back,
 *   and `grace` seconds with nobody in the ring before the hold stops (it never starts with nobody in it).
 * - Pressure: every `escalate` the level (ALARM) goes up one (to `maxLevel`); noise (`noise`: a blow, a
 *   death, a building down, oil fire, a horn) gathers where it's made and `fade`s; past `wave` heat, once
 *   `waveEvery[level]` has gone by, `waveSize[level]` (and one more a friend) come from `waveFrom` tiles
 *   off; a camp that sees you blows its horn (`horn` heat, a wave toward it at once). During a hold a
 *   wave every `holdWave` to anyone within `holdNear` of the ring's edge; a new patrol from the edge every
 *   `patrolEvery`, sooner as it goes on.
 * - The map screen counts ground as seen `seen` tiles round anyone, in cells of `cell`.
 * - Pay: each main job done puts `goalPay` of the posting's pay in the pot, each side job `sidePay`.
 */
export const EXPED = {
  goblins: 150, cap: 200,
  poison: 7, hold: 75, holdR: 6, pray: 3, blessed: 90, call: 2, extract: 60, extractR: 6, standR: 1.6, grace: 1.5,
  escalate: 150, maxLevel: 5,
  noise: { hit: 1, death: 2, collapse: 5, oil: 4, horn: 14 }, fade: 25, wave: 12,
  waveEvery: [50, 42, 35, 29, 24, 20], waveSize: [3, 4, 4, 5, 6, 7], waveFrom: [25, 28] as [number, number],
  holdWave: 9, holdNear: 2, patrolEvery: 110, patrolSpeed: 1.1,
  seen: 9, cell: 6,
  goalPay: 0.15, sidePay: 0.1,
};

/**
 * The expedition's fights as packs (Kyle, 2026-11-04: "I didn't see too many enemy types, just big guys
 * and little guys"). Each camp, each stretch's set piece, each patrol and each wave is one pack from the
 * templates (shared/encounters.ts), laid by shared/expedpacks.ts and sent by sim/expedwave.ts. `where`:
 * the templates each kind of ground draws from (as long as the job's ruin, its roofs and the cap allow):
 * `open` the fields, the river's banks and the wood's edge; `hamlet` the ruined hamlet; `camp` the
 * hungry's camps; `road` the north road where the drove road leaves it; `patrol` the other roads.
 * `waves[level]`: what a wave or a hunting party can be at each ALARM (sappers only late). Specials (any
 * goblin past a small one) are capped so a fight reads: `specials` a pack (`wave[level]` for a wave), and
 * a wave brings none past `near` already awake within `nearR` of who it's coming for (or
 * of an earlier wave still on its way). A party: `party`
 * more small ones a pack a player past the first (a job's packs take 0.5; a phone hosts this map), the
 * centrepiece tougher and the template's one `more` from three players, as on a job (sim/packs.ts).
 * `crows`: at most this many flocks on the dead out in the open, a body `crowChance` (one a stretch).
 */
export const EXPED_PACKS = {
  where: {
    open: ['wolves', 'netter', 'swarm', 'brute', 'thief'],
    hamlet: ['roof', 'oil', 'banner', 'thief', 'swarm'],
    camp: ['banner', 'oil', 'butcher', 'wall', 'drum', 'hexer', 'brute', 'iron'],
    road: ['logs'],
    patrol: ['swarm', 'brute', 'netter', 'wolves', 'wall'],
  } as Record<'open' | 'hamlet' | 'camp' | 'road' | 'patrol', string[]>,
  waves: [
    ['swarm', 'brute', 'netter'],
    ['swarm', 'brute', 'netter', 'wolves', 'thief'],
    ['swarm', 'brute', 'netter', 'wolves', 'banner', 'oil', 'iron'],
    ['brute', 'netter', 'wolves', 'banner', 'oil', 'sapper', 'logs', 'iron'],
    ['netter', 'wolves', 'banner', 'oil', 'sapper', 'logs', 'butcher', 'wall', 'iron'],
    ['wolves', 'banner', 'oil', 'sapper', 'logs', 'butcher', 'wall', 'drum', 'iron'],
  ],
  specials: { camp: 3, scene: 2, patrol: 2, wave: [1, 1, 2, 2, 2, 3] },
  near: 3, nearR: 14,
  /** A wave's pack number: this plus the expedition's roll counter when it came (never one of the map's). */
  wave0: 1000,
  /** More small ones a pack a player past the first (was 0.3; 2026-11-05 a party meets tougher goblins, not many more: shared/threat.ts PARTY_TOUGH). */
  party: 0.12,
  crows: 3, crowChance: 0.75,
};

/**
 * Gold on the floor of an expedition (Kyle, 2026-11-04: "A tonnnn of gold drop, maybe too much"). Measured
 * (`npx tsx scripts/bigmap/expedtour.ts`, eight runs alone): about 155 kills a run left 103 piles and 526
 * coins on the ground (93% of it from kills at 3.2 coins a kill, a pile for two goblins in three; chests
 * 13, a burnt house's or a thief's 22), next to 242 of pay from the jobs. Here a small goblin leaves a pile
 * one time in five, but a bigger one: measured again, 183 kills left 30 piles and 308 coins (1.7 a kill,
 * 10.7 a pile). About half the coins in under a third of the piles, so a pile reads as a find. A butcher's pile
 * is as big, half as often; a named one's as on a job; wolves leave none. Potions drop as ever; the jobs'
 * pay is unchanged. (Economy, 2026-11-13: kept at about half a job's goblin copper in under a third of the
 * piles after goblins went to copper, shared/potions.ts COINS; a butcher's half a job's, a named one half.)
 */
export const EXPED_COINS = {
  scrapper: { chance: 0.06, min: 4, max: 6 },
  archer: { chance: 0.07, min: 4, max: 7 },
  butcher: { chance: 0.25, min: 100, max: 100 },
  named: { chance: 1, min: 50, max: 50 },
  wolf: { chance: 0, min: 0, max: 0 },
  life: 30,
  reach: 0.9,
};

/**
 * How goblins find their way round water and anything long in the way (sim/pathing.ts, sim/pathgrid.ts):
 * a grid of `cell` tiles for each size of body, a cell open only if a body `fit` times that size fits
 * there (not in something solid, deep water or a ledge's face); wading costs `shallow` times a dry step,
 * about what it costs in time (1 / WADE), so a ford is taken when it's the quicker way; a hero more than
 * `reach` tiles off isn't pathed to (they head straight for them, as before).
 */
export const PATH = { cell: 0.5, fit: 1, shallow: 1.4, reach: 30 };
/**
 * Out of bounds (sim/dread.ts): past a map's edge, inside something solid, or on ground nobody can walk
 * to (shared/reach.ts). Out there the dread builds a second a second: the warning at once, worse at
 * `late`, and at `take` the hero is seized and `crush` seconds later crushed (a job's wild places) or
 * pulled down (its settled ones): downed, and the body put back on the last spot they stood in bounds.
 * Back in bounds it drains `lift` times as fast as it came. In town and the yard nothing kills: out for
 * `setback` seconds and you're put back after a dark flicker.
 */
/** `off`: switched off for now (Kyle, 2026-11-11: "it's not working right, can we nix that feature entirely for now");
 * nobody's warned, seized or set back, so nothing's drawn. Set false to bring it back (tests/dread.test.ts does). */
export const DREAD = { off: true, late: 4, take: 8, crush: 1.1, lift: 5, setback: 1.2 };

/**
 * Weather that changes the fight (Kyle, 2026-11-04: "Let's do some weather and forget about wind
 * affecting shots for now"; shared/sky.ts). Rain, and a storm's rain: a goblin's burn lasts `burn` as
 * long (a fire spell still sets it alight), a lit oil slick burns `slick` as long, and fire jumps from a
 * burning goblin to one `spread` as far off; goblins notice you from `hush` as far (the rain covers your
 * feet, so creeping up is easier). Fog: goblins see and wake at `sight` of the distance, and archers and
 * roof archers reach `reach` as far. Never a hero's pace (Kyle: his hero "randomly seems slowed") and
 * never a shot's flight (no wind, for now).
 */
export const WEATHER = { rain: { burn: 0.6, slick: 0.6, spread: 0.35, hush: 0.7 }, fog: { sight: 0.6, reach: 0.6 } };

/**
 * A storm's lightning (sim/storm.ts). Every `every` seconds (seeded) it picks something tall or metal
 * out in the open within `near` tiles of a hero: a lone tree (no other tree within `lone`), a banner pole,
 * a siege engine, or a goblin standing `open` tiles clear of any wall (a hero rarely), by `weights`; with
 * nothing to pick, bare ground near a hero. Its red circle (radius `r`, the striped edge: no block) shows
 * `warn` seconds before it lands. Landing: `dmg` to each goblin in it and a `stun` on the small ones (the
 * storm counts as one stunner under the 6 s cap), `heroDmg` to a hero (a roll gets out of it), `engine`
 * off a siege engine's health, everyone in it thrown `knock`. Never indoors or underground. On screen the
 * flash lasts `flash` seconds and the strike is kept `fade` seconds for drawing.
 */
export const LIGHTNING = {
  every: [8, 14] as [number, number], warn: 1, r: 1.3, dmg: 30, heroDmg: 20, stun: 1.2, knock: 5, engine: 60,
  open: 3, edge: 2.5, near: 14, lone: 2.5,
  weights: { tree: 3, banner: 3, engine: 3, goblin: 1, hero: 0.15 },
  flash: 0.25, fade: 0.6,
};

/**
 * Petting your own hound (client/petwhen.ts): PET is offered in a fight only with no goblin awake
 * within `calm` tiles of the Ranger. Drawing only; the room never hears of a pet.
 */
export const PETTING = { calm: 5 };

/**
 * The statue in Lantern Square (shared/statue.ts): a hero may pay for one only once they've given this much
 * gold to the town, all told (their GOLD GIVEN on the Roll: the Lantern, the public works, gear for the walls).
 * Kyle, 2026-11-06: "You can only make a statue of yourself after you donate enough to the town."
 */
export const STATUE_GIVEN = 1000;
