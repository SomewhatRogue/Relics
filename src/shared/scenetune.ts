/**
 * Layout 4's scenes in numbers (re-exported by tuning.ts): how long the torch-bearers take to get a
 * house going and how far along they are when you come in, how close you have to come to pull one off
 * its work, how long it takes to drag someone out of a burning house's door, and how fast a column of
 * prisoners, a patrol and a body being hauled move. The rings drawn are these same numbers.
 */
export const SCENE = {
  /** Seconds from a cold house to alight, with a torch-bearer at it; how far it has caught as the room begins. */
  kindle: 13, staged: 0.35,
  /** A hero this close (or a blow) takes a torch-bearer, a guard or a hauler off what it's doing. */
  stay: 2.6,
  /** Seconds standing still at a burning house's door to drag someone out, and how close to stand. */
  pull: 1.6, pullReach: 0.95,
  /** Tiles a second: prisoners on their rope and their guards; a patrol; two hauling a body. */
  led: 0.8, patrol: 1.05, haul: 0.6,
};
