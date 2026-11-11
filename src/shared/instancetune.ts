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
};
