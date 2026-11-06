/**
 * Pacing (docs/plans/bosses.md section 3; Kyle, 2026-11-05: "sometimes you just get swarmed. Now it feels
 * more like swarms over other things"; "not necessarily more enemies if lots of players, but more health
 * on enemies, and they hit harder"; "it's a bit too easy to kite"). Every number the pacing rules run on:
 * what a goblin costs, what a room may spend, what may be on screen at once, how a bigger or stronger party
 * makes goblins tougher, and the answers to kiting. The rules: shared/encounter.ts (laying a room out),
 * sim/packs.ts (the party), sim/pacing.ts (holding a pack back), sim/chase.ts (kiting), sim/bigone.ts.
 */
import type { Role } from './encounters.js';
import type { EnemyAttackSpec } from './tuning.js';

/** How heavy a goblin is on the fight. Chaff is the small ones; a special has one trick; meaty takes a few good hits; heavy is a butcher. */
export type ThreatTier = 'chaff' | 'special' | 'meaty' | 'heavy';
export const THREAT_TIER: Record<Role, ThreatTier> = {
  fodder: 'chaff', wolf: 'chaff', blind: 'chaff',
  lunger: 'special', archer: 'special', roofer: 'special', hexer: 'special', drummer: 'special', netter: 'special', thief: 'special', chalker: 'special',
  snarer: 'special', oiler: 'special', torch: 'special', sapper: 'special', keeper: 'special', banner: 'special',
  heavy: 'meaty', ironhide: 'meaty', shield: 'meaty', log: 'meaty', planker: 'meaty', swingle: 'meaty', forker: 'meaty',
  butcher: 'heavy',
};
/**
 * Threat points. Small fry cost `chaff` (Kyle, 2026-11-05: half a point, so a swarm is cheap to lay and
 * the budget goes on the fights that need thinking about); a banner and the log-carriers a bit more than
 * their tier. A BIG ONE costs `big` times its own sort.
 */
export const THREAT = { chaff: 0.5, special: 2, meaty: 4, heavy: 8, banner: 3, log: 5, big: 2 };
export const threatOf = (role: Role | undefined, big = false): number =>
  ((role === 'banner' ? THREAT.banner : role === 'log' ? THREAT.log : THREAT[THREAT_TIER[role ?? 'fodder']]) ?? THREAT.chaff) * (big ? THREAT.big : 1);

/**
 * A routed room's budget, alone, by room (the first, second, third, fourth and on), times the job's
 * difficulty: easy (ruin 1), normal (ruin 2), hard (ruin 3), deep. A party's is `party` times it (the few
 * more small ones it meets: sim/packs.ts); the rest of a party's weight is toughness, not numbers.
 * Sized for chaff at half a point: about what a room had before, as fewer swarms and more fights.
 * `share`: each beat's slice of the room (renormalised over the beats a room has).
 */
export const BUDGET = {
  room: [8, 13, 17, 20],
  difficulty: { easy: 0.8, normal: 1, hard: 1.2, deep: 1.35 },
  party: [1, 1.15, 1.3, 1.45],
  share: { splat: 0.3, tactic: 0.4, closer: 0.45 },
};

/**
 * What may be on screen at once: awake goblins within `near` tiles of any hero, not held back, by party
 * size 1 to 4: threat, meaty ones (heavies count as meaty too), heavies. A lone hero meets a second
 * meaty one from the third room (`meaty2`). A swarm of eight is 4; a brute with four small ones is 6.
 */
export const SCREEN = {
  near: 10,
  threat: [10, 12, 14, 16],
  meaty: [1, 2, 2, 3],
  meaty2: 2,
  heavy: [1, 1, 1, 1],
};

/**
 * Holding back: a pack that wakes while what's on screen is over the caps holds at its spot, jeering,
 * and comes when the screen drops under `free` of the cap, or after `wait` seconds, or at once if a hero
 * comes within `near` tiles of it or hits it. Hold-point waves on an expedition: one comes when the
 * screen near the hold is under `wave` of the cap, or `wait` seconds after it was due; after every
 * `every`th, `quiet` seconds with the horn silent.
 */
export const HOLD = { free: 0.6, wait: 12, near: 3, wave: 0.4, every: 3, quiet: 6 };

/**
 * A bigger party (Kyle: "not necessarily more enemies if lots of players, but more health on enemies, and
 * they hit harder"). By party size 1 to 4: every goblin of a pack's health and damage, and `chaff` more
 * small ones a pack a player past the first (the extra count: 0.12 is one more in a pack of four or five
 * at two players, about a third more at four). A named one toughens as ever (PARTY.boss).
 */
export const PARTY_TOUGH = { hp: [1, 1.35, 1.65, 1.95], harm: [1, 1.15, 1.25, 1.35], chaff: 0.12 };

/**
 * The party's average level (shared/progress.ts; fixed when the job starts): every goblin, butchers and
 * BIG ONEs too, gets `hp` more health and `harm` more damage a level past the first, on top of the
 * party's size, up to `hpMost` and `harmMost` (reached about level 8 to 9, so the last levels and gear
 * are all yours). Loot the same, up to `most` levels' worth: a level past the first, plain is `lean.plain`
 * less likely, Forged and PRE-WAR `lean` more, the rare three only `rare` more, and Fine takes up the
 * difference (never under `floor` of what it was); and from level `itemFrom`, a drop comes a level up
 * (+1), and +2 from `item2`.
 */
export const LEVEL_SCALE = { hp: 0.06, harm: 0.04, hpMost: 0.45, harmMost: 0.3, most: 9, lean: { plain: -0.06, forged: 0.04, tolmouth: 0.04 }, rare: 0.03, floor: 0.05, itemFrom: 5, item2: 9 };
export const levelHp = (lv: number) => 1 + Math.min(LEVEL_SCALE.hpMost, LEVEL_SCALE.hp * Math.max(0, lv - 1));
export const levelHarm = (lv: number) => 1 + Math.min(LEVEL_SCALE.harmMost, LEVEL_SCALE.harm * Math.max(0, lv - 1));
/** The party's level for the job: the heroes' average, to one place (a level-1 party is 1). */
export const partyLevel = (levels: number[]) => (levels.length ? Math.round((levels.reduce((s, l) => s + Math.max(1, l), 0) / levels.length) * 10) / 10 : 1);

/**
 * BIG ONEs (Kyle: "mini bosses also work. Things that require a few hits"): one or two a job, a brute or
 * an ironhide `hp` times as tough, `size` times as big, `harm` as hard, with its own moves and one more:
 * the stomp, a striped ring round itself (`stomp`) when a hero is within `stompFrom`, every `every` s.
 * It drops a sure handful of gold (`gold`) and a sure piece (rolled as a butcher's).
 */
export const BIG = {
  hp: 2.5, size: 1.3, weight: 1.8, harm: 1.2, gold: [15, 25] as [number, number], stompFrom: 2.2, every: 7,
  stomp: { windup: 1.25, active: 0.12, recover: 1.2, dmg: 18, knock: 10, radius: 1.8, ahead: 0, unblockable: true } as EnemyAttackSpec,
};

/**
 * Kiting (Kyle: "it's a bit too easy to kite right now"):
 * - SPRINT: a goblin that has chased the same hero `after` s without getting in reach leans (`lean` s,
 *   at `leanPace` of its pace, dust kicked up: the tell) and bursts for `burst` s at `pace` times its pace,
 *   from within `near` tiles. Then it's winded for the next `after` s.
 * - LEAP: a lunger on a hero running from it leaps instead of stabbing (a red lane, blockable), from
 *   past its stab's reach out to the leap's length.
 * - FLANK: in a pack chasing one hero, every second goblin by its place (from `from` of them) goes wide,
 *   `angle` radians round from the pack's line and `lead` tiles ahead of a running hero, till it's within
 *   `close` of them.
 * - RANGED: archers, netters and oil throwers count a hero running in the open (nothing solid within
 *   `cover` tiles) `pull` tiles nearer when they choose who to aim at.
 */
export const SPRINT = { after: 3, lean: 0.4, leanPace: 0.3, burst: 1.3, pace: 2, near: 7 };
export const LEAP = { from: 2.6, spec: { windup: 0.7, active: 0.28, recover: 0.9, dmg: 10, knock: 5, range: 4.6, radius: 0.55, unblockable: false } as EnemyAttackSpec };
export const FLANK = { from: 3, angle: 1.1, lead: 2.2, close: 2.2 };
export const RANGED = { pull: 3, cover: 1.6 };
