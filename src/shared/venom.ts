/**
 * The Rogue's blood and poison on goblins (sim/venom.ts judges them; the client draws the same values).
 * A rapier's perfect thrust skewers a goblin on the tip: it staggers and bleeds. The poisoner's darts
 * poison: a stack a dart, ticking for a few seconds; a dart loosed on the white flash makes the goblin
 * retch first (helpless a moment), then its poison ticks harder. Some goblins shrug poison off.
 */

/** A skewer: `dmg` a tick every `every` seconds for `time` seconds; it staggers `stagger` seconds. */
export const SKEWER = { dmg: 3, every: 0.5, time: 3, stagger: 0.7 };

/**
 * Poison on a goblin: `dmg` a stack a tick every `every` seconds, for `time` seconds after the last dart,
 * up to `most` stacks. A perfect dart: it retches `puke` seconds (held fast), and its ticks are `hard` times.
 */
export const VENOM = { dmg: 2, every: 0.5, time: 4, most: 3, hard: 2, puke: 1 };

/**
 * How much of the poison a foe takes, by its weakness row (shared/weakness.ts foeKind): butchers and
 * the big ones half; spiders, their mother and the nests none (shows RESIST). Anything else takes it all.
 */
export const VENOM_TAKES: Record<string, number> = { butcher: 0.5, boss: 0.5, stoker: 0.5, spider: 0, brood: 0, nest: 0 };
export const venomTakes = (row: string) => VENOM_TAKES[row] ?? 1;
