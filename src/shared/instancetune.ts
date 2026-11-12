/**
 * Instances (docs/design/instances.md): a dungeon of areas taken in turn, each area's gate a checkpoint.
 * The frame's numbers; what's decided and what's drawn both read them.
 */
export const INSTANCE = {
  /**
   * A goblin is stepped only while a hero is this near (sim/sleep.ts); past `doze` it holds where it
   * stands again. An area's, smaller than a big map's (SLEEP), so a pack down the way waits its turn.
   */
  wake: 15,
  doze: 19,
  /** A wipe: the beat lying there before everyone is up again at the area's gate. */
  regroup: 3,
  /** Out of a fight your friends are still in: this long after going out, you're up at the area's gate. */
  walkBack: 10,
  /** Wipes since the last gate before the run is lost (a gate passed starts the count again). */
  wipes: 3,
  /** Seconds nothing hurts a hero just got up at the gate. */
  safe: 2,
  /**
   * Who it's built for (Kyle, 2026-11-11): three heroes, and never easier below that (two well-geared can just
   * about do it, one can't). Each hero past three: every goblin this much tougher and harder hitting, never more
   * of them; the named ones as any named one (PARTY.boss), from three up.
   */
  party: 3,
  more: { hp: 0.3, harm: 0.15 },
  /**
   * Harder than a job's goblins at any size (Kyle, 2026-11-11, after playing it: "enemies even harder on the
   * instances"): every goblin's health and hits, the named ones' health.
   */
  // (Twice that, 2026-11-11, with half as many goblins: "less goblins and each one takes longer for the group".)
  tough: { hp: 3, harm: 1.3, named: 1.5 },
  /**
   * Fierce (Kyle, 2026-11-11: "too easy to dodge everything without even skill"): every instance goblin winds up in
   * `windup` of the time (never under an elite Quick one's floors, so it's still a tell), rests `pause` as long
   * between blows, and moves `pace` as fast.
   */
  fierce: { windup: 0.8, pause: 0.7, pace: 1.1 },
  /** Every pack's leader an elite, its affix drawn from these by the seed (shared/cutkit.ts). */
  leaders: ['quick', 'plated', 'gorging', 'oiled', 'horn', 'ember'] as const,
  /**
   * Opened up (no blow is ever cut down: "low damage numbers to bosses felt like a self punishment"): the Drover cut
   * off its line, the Brakesman knocked off its brake, take `mult` for `time` s.
   */
  open: { mult: 1.5, time: 5 },
};

/**
 * THE DROVER (Rakehead's square, sim/drover.ts): CUT FREE (GRAB) this near a roped digger, staying by them this
 * long, cuts the line (it's OPEN after: INSTANCE.open).
 */
// `notice`: anyone this near and it leaves its line to come for them (Kyle, 2026-11-11: "the first boss didn't actually
// ever attack"; it walked on unless you were right on it), its guards walking the line on.
/**
 * Instance puzzles (sim/tubs.ts, docs/design/instance-puzzles.md). A tub goes a square when a hero holds the stick
 * into it `push` s, touching it (within `touch` of it); it slides at `speed` tiles a second. GRAB within `lever` of
 * the lever puts the tubs back. Two or more up and near (`near` tiles of the grid), and it's unsolved: one of
 * `wave.kinds` out of its drift every `wave.every` s (the first after `wave.first`), `wave.most` of them about at once.
 */
export const PUZZLE = { push: 0.3, touch: 0.32, speed: 4.5, lever: 1.6, near: 4, wave: { first: 5, every: 9, most: 3 } };
export const DROVER = { reach: 1.1, cut: 1.6, notice: 5 };

/**
 * THE BRAKESMAN (the workings' last chamber, sim/brake.ts): on its brake at the top of the rail it lets a cart go
 * every `every` s (`fast` below `below` of its health): the lane striped `warn` s, then the cart runs the rail at
 * `speed`, knocking flat whoever's in its lane (`width`) for `dmg` and `knock`, striped (only out of the lane saves
 * you). GRAB held `grab` s by a cart standing on the rail sends it
 * back up; it knocks the Brakesman off the brake (`hit` damage, stunned `down` s and OPEN, no carts for `off` s). At most
 * `most` carts on the rail (the oldest at the bottom tipped off for a new one). Back to the brake at `walk` tiles a second.
 */
/** `flip`: a power hit landing on a cart coming down your lane sends it back up, from as far as the blow reaches (at
 * most `flip` tiles, so a bow's shot can't do it from the foot), the blow's strike or `flipLate` s after it. The first
 * `told` carts it lines up on a climber, how to is said over them. */
export const BRAKE = { told: 2, flip: 2.6, flipLate: 0.08, every: 4, fast: 2.6, below: 0.4, warn: 1, speed: 9, dmg: 22, knock: 10, width: 0.9, grab: 0.6, hit: 30, down: 3, off: 6, most: 4, walk: 2.4 };

/**
 * THE SLUICER and THE RAKER (the washing floor, sim/pairfall.ts): the Sluicer falls in the water instead of dying
 * while the Raker stands; the Raker walks to it at `walk` and, `reach` from its body, lifts it `lift` s (a stun starts that over), and it's
 * up at `back` of its health. Kill the Raker while it lies there and it's dead too.
 */
export const PAIR = { walk: 3, lift: 2.5, back: 0.5, reach: 0.9 };
