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
  rooms: 'Down through Rakehead to the pit, about 30 minutes, someone keeping each gate',
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
  goal: 'CUT FREE the roped diggers, then kill',
  cut: 'CUT LOOSE',
};

/** THE BRAKESMAN's fight (sim/brake.ts): the goal's line while it's on its brake. */
export const BRAKE_WORDS = {
  goal: 'Hit a cart back, then kill',
  /** Over a climber the first carts are aimed at. */
  how: 'HOLD ATTACK, LET GO AS IT REACHES YOU',
  /** Over a cart hit back up the incline. */
  flip: 'SENT BACK',
};

/** THE SLUICER and THE RAKER (sim/pairfall.ts): the goal's line, and over the Sluicer as it falls and stands. */
export const PAIR_WORDS = {
  goal: (names: string) => `Kill ${names} close together. If the Sluicer drops first, the Raker drags it back out`,
  fell: 'IN THE WATER',
  up: 'STOOD UP',
};

/** An instance on one map: the goal once a stretch's named ones are dead, and the gate opening (sim/stretches.ts). */
export const GATE_WORDS = {
  on: 'Everyone stand at the gate together',
  /** A gate kept by a pack, not a named one. */
  guards: 'Kill the goblins at the gate',
  open: 'GATE OPEN',
};

/** The fork yard (sim/fork.ts): its two ways, the goal while the party votes, and once it's chosen. */
export const FORK_WORDS = {
  over: 'OVER THE TOP',
  under: 'UNDER THE HILL',
  yard: 'THE FORK YARD',
  vote: 'Everyone stand on one of the two ways. The way with most of you on it wins',
  on: (way: string) => `Way on: ${way}`,
};

/** The checkpoint: a gate passed, a wipe, and waiting at the gate for the rest. */
export const CHECK_WORDS = {
  passed: 'Gate passed, and if you all fall you start here',
  wiped: (left: number) => (left === 1 ? 'Back at the gate. One more and the run is lost' : `Back at the gate. ${left} more and the run is lost`),
  waiting: (here: number, all: number) => `Waiting at the gate for the rest (${here} of ${all})`,
};
