/** Relics (rechargeable magic items) and the elements that can be fitted to them. */
import { CHAIN, FIRE_RING, KNIVES, LIGHT, SIC, SMOKEBOMB, STAMP, TETHER, VANISH, VOLLEY } from './skillkit.js';
import { BELL, BOMB, KNUCKLE, SENTRY } from './relickit.js';
/**
 * The relic javelin, thrown. It skewers every goblin in its line, whatever it weighs, carries them on
 * the shaft and pins them all to the first wall or pillar it reaches (or to the ground where it comes
 * down, at the end of its range). One that can't be moved is pinned where it stands and the javelin
 * goes on through. Since 2026-11-05 nothing shrugs it off: few uses, each one sure.
 */
export const JAVELIN = {
  cooldown: 4,
  windup: 0.2,
  recover: 0.28,
  speed: 16,
  range: 10,
  dmg: 20,
  knock: 9,
  /** (Before 2026-11-05 only goblins this light were carried; the rest stopped it. Kept for old tests' sake.) */
  pinWeight: 1,
  pinTime: 3,
  pinDmg: 12,
  /** Javelins stay stuck in walls, floors and bodies this long. */
  stuckLife: 9,
};

/**
 * The grappling hook relic. It latches the first thing it reaches: any goblin is yanked to you and
 * lands knocked down (one that can't be moved, or is pinned, pulls you to it instead); a wall, a
 * pillar or a heavy prop pulls you to it. Since 2026-11-05 it catches a goblin `catch` off its line too.
 */
export const HOOK = {
  cooldown: 4,
  windup: 0.12,
  recover: 0.15,
  speed: 22,
  range: 9,
  /** How far off the line a goblin can be and still be caught. */
  catch: 0.45,
  yankSpeed: 15,
  zipSpeed: 15,
  /** A yanked enemy arrives knocked down for this long. */
  yankStun: 1.3,
  dmg: 8,
};

/** The Ranger's hunting net: thrown, it opens on the first goblin it reaches. Small ones are snared flat; big ones are slowed. */
export const NET = { cooldown: 20, windup: 0.15, recover: 0.25, speed: 14, range: 8, radius: 1.3, snare: 2.6, slow: 0.35, dmg: 4 };

/** The Rogue's SHADOW STEP: step out of the dark behind the goblin you face, ready to stab its back.
 *  The goblin you land behind is stunned `stun` seconds (Kyle, 2026-11-03), unless it's mid striped blow or charge.
 *  Built in since 2026-11-05 (shared/signs.ts): its own button, not one of the three skills. */
export const SHADOWSTEP = { cooldown: 20, windup: 0.06, recover: 0.12, range: 6, stun: 1 };

/** The lodestone: lobbed, it lands and takes every goblin within `radius`, whatever it weighs: held
 *  helpless and drawn in at `draw` tiles a second for `time`, then it bursts `burst` across, `dmg`, and
 *  they're knocked down `stun`. */
export const LODESTONE = { cooldown: 6, windup: 0.2, recover: 0.3, range: 7, fallback: 4.5, flight: 0.5, radius: 3.6, draw: 3.5, time: 1.2, burst: 1.8, dmg: 18, stun: 1.2 };

/**
 * The Healer's blessed ground: a circle of light at the Healer's feet (or where they point, on a
 * laptop). Allies in it mend slowly and are blessed (hit harder, take less) while they stand there;
 * goblins in it burn with holy light. Every half second (`every`), for `time` seconds.
 */
/** The Healer's coal (sim/lantern.ts): per coal, heals x(1 + heal), goblins judge you `lure` tiles nearer and notice you `notice` further off. */
export const LANTERN = { heal: 0.08, lure: 0.35, notice: 0.25, max: 12, reach: 1.1, life: 25 };

export const BLESSING = { cooldown: 12, windup: 0.25, recover: 0.25, range: 6, radius: 2.4, time: 6, every: 0.5, heal: 3, hurt: 4, linger: 0.6, dmgMult: 1.3, taken: 0.75 };

/**
 * The Healer's ward: a shell of light on an ally (the most hurt one in reach, yourself included; where
 * you point on a laptop). It takes the blows meant for them, up to `hp`, for `time`; arrows (and,
 * later, goblin spells) bounce straight back at whoever loosed them for `reflect` times the damage,
 * stunning them.
 */
export const WARD = { cooldown: 14, windup: 0.2, recover: 0.2, range: 7, hp: 50, time: 5, reflect: 1.5, stun: 1.2 };

/** The Healer's skill: blessed ground at your feet and a ward on whoever needs it most, at once. */
export const SANCTUARY = { cooldown: 20, windup: 0.25, recover: 0.25 };

/** The Mage's element, switched on its own button (ELEMENT; X on a laptop): a press turns the spellbook
 *  to the next element at once (fire, frost, storm, round again), and again in `cooldown` seconds. The
 *  element decides what every tap and hold is (shared/spellbook.ts). The first spell after a turn is
 *  primed: `primed` times as hard. (Kept under the old relic id `channel`, for saves.) */
export const CHANNEL = { cooldown: 1, windup: 0.06, recover: 0.12, primed: 1.5, order: ['fire', 'frost', 'storm'] as const };

/** The Mage's class skill, GRASP (a placeholder name until the lore pass): every goblin in a cone in
 *  front, `range` tiles and `arc` degrees, is dragged at `speed` toward a spot `to` tiles ahead of you and
 *  staggers `stagger` s. A butcher or a shield-bearer barely moves: `heavy` of the way. It costs `cost` magic. */
export const GRASP = { cooldown: 9, windup: 0.2, recover: 0.25, range: 5, arc: 70, to: 1.5, speed: 14, stagger: 0.6, heavy: 0.15, cost: 25 };

/** The war cry (one of the Warrior's two skills): every goblin in earshot, awake or not, comes for you
 *  and nobody else for `time` seconds; small ones right beside you flinch. */
export const HORN = { cooldown: 18, windup: 0.25, recover: 0.3, radius: 9, time: 5, scare: 2.5 };

/** The shield charge (the Warrior's other skill): a run shield-first along where you face, `distance` in
 *  `time`. Small goblins in the way are knocked flat and reeling (grab them), big ones stagger; crates and
 *  barrels burst; a wall stops it. */
export const BASH = { cooldown: 10, windup: 0.12, recover: 0.2, distance: 5, time: 0.4, reach: 0.25, dmg: 14, knock: 10, stun: 1.2, stagger: 0.45, propDmg: 40 };

/** `range` is how far the phone's auto-aim looks; `cls` who may carry it. */
export const RELICS = {
  javelin: { name: 'RELIC JAVELIN', short: 'JAVELIN', cooldown: JAVELIN.cooldown, windup: JAVELIN.windup, recover: JAVELIN.recover, range: JAVELIN.range * 0.8 },
  hook: { name: 'GRAPPLING HOOK', short: 'HOOK', cooldown: HOOK.cooldown, windup: HOOK.windup, recover: HOOK.recover, range: HOOK.range },
  net: { name: "HUNTER'S NET", short: 'NET', cooldown: NET.cooldown, windup: NET.windup, recover: NET.recover, range: NET.range },
  shadow: { name: 'SHADOWSTEP', short: 'SHADOW', cooldown: SHADOWSTEP.cooldown, windup: SHADOWSTEP.windup, recover: SHADOWSTEP.recover, range: SHADOWSTEP.range },
  channel: { name: 'ELEMENT', short: 'ELEMENT', cooldown: CHANNEL.cooldown, windup: CHANNEL.windup, recover: CHANNEL.recover, range: 0 },
  grasp: { name: 'ROUND UP', short: 'ROUND UP', cooldown: GRASP.cooldown, windup: GRASP.windup, recover: GRASP.recover, range: GRASP.range },
  lodestone: { name: 'LODESTONE', short: 'LODESTONE', cooldown: LODESTONE.cooldown, windup: LODESTONE.windup, recover: LODESTONE.recover, range: LODESTONE.range },
  horn: { name: 'WAR CRY', short: 'WAR CRY', cooldown: HORN.cooldown, windup: HORN.windup, recover: HORN.recover, range: HORN.radius },
  bash: { name: 'SHIELD CHARGE', short: 'SHIELD', cooldown: BASH.cooldown, windup: BASH.windup, recover: BASH.recover, range: BASH.distance },
  blessing: { name: 'BLESSED GROUND', short: 'BLESS', cooldown: BLESSING.cooldown, windup: BLESSING.windup, recover: BLESSING.recover, range: BLESSING.range },
  ward: { name: 'WARD', short: 'WARD', cooldown: WARD.cooldown, windup: WARD.windup, recover: WARD.recover, range: WARD.range },
  sanctuary: { name: 'SANCTUARY', short: 'SANCTUARY', cooldown: SANCTUARY.cooldown, windup: SANCTUARY.windup, recover: SANCTUARY.recover, range: WARD.range },
  // The skills taught after the first (shared/skillkit.ts).
  stamp: { name: 'SHIELD STAMP', short: 'STAMP', cooldown: STAMP.cooldown, windup: STAMP.windup, recover: STAMP.recover, range: STAMP.radius },
  volley: { name: 'VOLLEY', short: 'VOLLEY', cooldown: VOLLEY.cooldown, windup: VOLLEY.windup, recover: VOLLEY.recover, range: VOLLEY.range },
  sic: { name: 'SEND THE HOUND', short: 'HOUND', cooldown: SIC.cooldown, windup: SIC.windup, recover: SIC.recover, range: SIC.range },
  vanish: { name: 'VANISH', short: 'VANISH', cooldown: VANISH.cooldown, windup: VANISH.windup, recover: VANISH.recover, range: 0 },
  knives: { name: 'KNIFE FAN', short: 'KNIVES', cooldown: KNIVES.cooldown, windup: KNIVES.windup, recover: KNIVES.recover, range: KNIVES.range },
  smoke: { name: 'SMOKE BOMB', short: 'SMOKE', cooldown: SMOKEBOMB.cooldown, windup: SMOKEBOMB.windup, recover: SMOKEBOMB.recover, range: SMOKEBOMB.range },
  firering: { name: 'FIRE RING', short: 'RING', cooldown: FIRE_RING.cooldown, windup: FIRE_RING.windup, recover: FIRE_RING.recover, range: FIRE_RING.radius },
  tether: { name: 'STORM TETHER', short: 'TETHER', cooldown: TETHER.cooldown, windup: TETHER.windup, recover: TETHER.recover, range: TETHER.range },
  chain: { name: 'CENSER CHAIN', short: 'CHAIN', cooldown: CHAIN.cooldown, windup: CHAIN.windup, recover: CHAIN.recover, range: CHAIN.range },
  light: { name: 'CENSER LIGHT', short: 'LIGHT', cooldown: LIGHT.cooldown, windup: LIGHT.windup, recover: LIGHT.recover, range: LIGHT.radius },
  // The found relics beyond the javelin, hook and lodestone (shared/relickit.ts).
  bomb: { name: 'GALL BOMB', short: 'BOMB', cooldown: BOMB.cooldown, windup: BOMB.windup, recover: BOMB.recover, range: BOMB.range },
  sentry: { name: 'WIND-UP BOW', short: 'WIND-UP', cooldown: SENTRY.cooldown, windup: SENTRY.windup, recover: SENTRY.recover, range: 0 },
  bell: { name: 'BONE WHISTLE', short: 'WHISTLE', cooldown: BELL.cooldown, windup: BELL.windup, recover: BELL.recover, range: BELL.radius },
  knuckle: { name: "BUTCHER'S KNUCKLE", short: 'KNUCKLE', cooldown: KNUCKLE.cooldown, windup: KNUCKLE.windup, recover: KNUCKLE.recover, range: KNUCKLE.length },
};
export type RelicId = keyof typeof RELICS;
export const RELIC_ORDER: RelicId[] = ['javelin', 'hook', 'bash', 'horn', 'stamp', 'net', 'volley', 'sic', 'shadow', 'vanish', 'knives', 'smoke', 'grasp', 'lodestone', 'firering', 'tether', 'blessing', 'ward', 'sanctuary', 'chain', 'light', 'bomb', 'sentry', 'bell', 'knuckle'];
/** Two abilities at most: the class's own skill, and one found relic carried with it. */
export const RELIC_SLOTS = 2;
/** Each class's skill (on the SKILL button): the first of its choices, until the hero picks another. */
export const CLASS_SKILL: Record<'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER', RelicId> = {
  WARRIOR: 'bash',
  RANGER: 'net',
  ROGUE: 'vanish',
  MAGE: 'grasp',
  HEALER: 'sanctuary',
};
/**
 * Relics are found, never given (the javelin aside, from the wood): rarely off a named butcher, and
 * surely at the bottom of a won deep dive. Any class can carry one (on the RELIC button); each is an
 * item with its own charge (shared/relicitems.ts). None of them ever hurts a friend.
 */
export const FOUND_RELICS: RelicId[] = ['javelin', 'hook', 'lodestone', 'bomb', 'sentry', 'bell', 'knuckle'];
/** A hero's abilities: their skill, then the relic they carry (if any). */
export const abilitiesOf = (cls: keyof typeof CLASS_SKILL, carried?: RelicId | '', skill?: RelicId) => [skill && SKILL_CHOICES[cls].includes(skill) ? skill : CLASS_SKILL[cls], ...(carried ? [carried] : [])];
/** The skills a class's trainer teaches, in the order taught (levels and prices: SKILL_STEPS in
 *  drills.ts); a hero carries one at a time and changes it at the trainer. */
export const SKILL_CHOICES: Record<keyof typeof CLASS_SKILL, RelicId[]> = {
  WARRIOR: ['bash', 'horn', 'stamp'],
  RANGER: ['net', 'volley', 'sic'],
  // (Shadow Step is the Rogue's own button now, shared/signs.ts; Smoke Bomb took its place, third.)
  ROGUE: ['vanish', 'knives', 'smoke'],
  MAGE: ['grasp', 'firering', 'tether'],
  HEALER: ['sanctuary', 'chain', 'light'],
};

/**
 * Magic augments: an element fitted to a relic (the Mage's spells cast with the equipped relic's).
 * Each element alone: fire burns, and a burning goblin that dies sets those near it alight; frost
 * chills, and a second frost freezes solid; storm ignores shields, lands harder on wet goblins and jumps
 * between them, and arcs to javelins stuck in bodies. Together: fire meets frost
 * as a scalding steam burst; storm or a heavy blow shatters the frozen; storm on the burning flares.
 */
export type Element = 'fire' | 'frost' | 'storm';
export type Augment = Element | '';
export const AUGMENTS: Augment[] = ['', 'fire', 'frost', 'storm'];
export const ELEMENT_NAME: Record<Element, string> = { fire: 'FIRE', frost: 'FROST', storm: 'STORM' };

/** Fire's job, swarms: `dmg` every `every` s for `time` s, and a burning goblin passes it on only when it
 *  dies, to anything within `spread` of it (beyond both bodies; Kyle, 2026-11-04: fire was too strong
 *  spreading by touch). Kyle 2026-11-04 ("the fire burns a ton"): 7 a tick to 4, so a burn alone no
 *  longer kills a small goblin outright; big ones and shield-bearers burn `tough` as long. */
export const BURN = { time: 3, every: 0.5, dmg: 4, spread: 0.7, tough: 0.5 };
/** Frost's job, control: chilled goblins move and turn at `slow` and wind up at `windup` of their pace;
 *  a second frost freezes them solid for `freeze` (a heavy blow then shatters them: SHATTER). A small one
 *  (weight 1 or less) stays frozen `small` times as long, a set-up for a heavy hit (FLING; Kyle, 2026-11-05). */
export const FROST = { chill: 3, slow: 0.5, windup: 0.6, freeze: 2.2, small: 1.8 };
/** Storm's job, shields and water (Kyle, 2026-11-04). It ignores a shield-bearer's board, front block
 *  and all. Dry, it jumps nowhere. On a wet goblin (in water, or out in the rain: sim/wet.ts) it lands
 *  `wet` times harder and jumps to every other wet goblin within `reach`, each taking `share` of the
 *  blow (at least `min`), once each a cast. A javelin stuck in a body is a lightning rod. */
export const STORM = { reach: 3, wet: 1.5, share: 0.5, min: 6, flinch: 0.25, rodReach: 6, rodDmg: 10 };
export const STEAM = { radius: 1.8, dmg: 10, stun: 0.9 };
export const SHATTER = { dmg: 30 };
/** A frozen small goblin hit by a heavy blow skids off on its ice (sim/iceslide.ts; Kyle, 2026-11-05): away
 *  from the hitter at `speed` for `len` tiles, slowing evenly (`hardSpeed`, `hardLen` for a charged blow, a
 *  smite or a Warrior's throw). The first wall, prop, goblin or hero it meets, it crashes into and shatters:
 *  goblins within `r` take `dmg` and are chilled, the one it ploughed into takes `plough` and is knocked down
 *  `down` s (`downBig` a big one; under the stun cap) and shoved `knock`; props in `r` take `propDmg`.
 *  Heroes and the freed take nothing. Slid its whole length, it shatters there for less (`endR`, `endDmg`). */
export const FLING = { speed: 11, len: 5.5, hardSpeed: 15, hardLen: 7, r: 1.5, dmg: 20, plough: 28, down: 1.2, downBig: 0.6, knock: 8, propDmg: 30, endR: 1, endDmg: 10 };
export const FLARE = { radius: 1.6, dmg: 12, knock: 12 };
