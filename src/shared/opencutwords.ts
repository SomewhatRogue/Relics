/**
 * The Open Cut instance's words (docs/design/instances.md; docs/plans/atlas.md, Rakehead): the board's
 * posting, each area's name, the named ones and the checkpoint lines. Every line here goes through the
 * lore keeper and the line editor.
 */

/** On the board: the lead-in from Wickhold. */
export const CUT_POST = {
  kind: 'INSTANCE',
  where: 'RAKEHEAD',
  title: 'The Open Cut',
  text: "A digger got out of Rakehead last night and came over the hill on bare feet, and what he says is the hungry took everyone who could swing a pick, roped them, and walked them down to the Open Cut. Some are still in the rows, he thinks. Go up and get them back.",
  rooms: 'Four areas, about 25 minutes, a boss in each',
  pays: (n: number) => `${n} gold and what the bosses drop`,
};

/** Each area's name, shown as you come into it, in order. */
export const CUT_AREAS = ['THE ROWS', 'THE WORKINGS', 'THE WASHING FLOOR', 'THE OPEN CUT'];

/**
 * The named ones keeping each area's gate (docs/design/instances.md, Kyle 2026-11-11; none a butcher). The
 * Haulier, the last, is named in shared/bosswords.ts.
 */
export const CUT_NAMES = { drover: 'THE DROVER', brakesman: 'THE BRAKESMAN', raker: 'THE RAKER', sluicer: 'THE SLUICER' };

/** THE DROVER's fight (sim/drover.ts): the goal's line while its diggers are roped, and the rope cut. */
export const DROVER_WORDS = {
  goal: 'Stand still by a roped digger to cut them loose, then kill',
  cut: 'CUT LOOSE',
};

/** THE BRAKESMAN's fight (sim/brake.ts): the goal's line while it's on its brake. */
export const BRAKE_WORDS = {
  goal: 'GRAB a cart and send it up the rail at the brake, then kill',
};

/** THE SLUICER and THE RAKER (sim/pairfall.ts): the goal's line, and over the Sluicer as it falls and stands. */
export const PAIR_WORDS = {
  goal: (names: string) => `Kill ${names} close together. If the Sluicer drops first, the Raker drags it back out`,
  fell: 'IN THE WATER',
  up: 'STOOD UP',
};

/** The checkpoint: a gate passed, a wipe, and waiting at the gate for the rest. */
export const CHECK_WORDS = {
  passed: 'Gate passed, and if you all fall you start here',
  wiped: (left: number) => (left === 1 ? 'Back at the gate. One more and the run is lost' : `Back at the gate. ${left} more and the run is lost`),
  waiting: (here: number, all: number) => `Waiting at the gate for the rest (${here} of ${all})`,
};
