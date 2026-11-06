/**
 * Every player-facing word of the boss kit and the Doorkeepers, in one place for the lore keeper and
 * the line editor (Latch, Hasp and the Doorkeepers are proposals, plan names marked † in docs/plans/bosses.md).
 * Attack names (Door Sweep, Door Charge, Locked Doors, Door Spin, Door Wall) are design words only, never on screen.
 */

/** Over a boss, said by the room's events (client/fxboss.ts). */
export const BOSS_CALLS = { staggered: 'STAGGERED', braced: 'BRACED', doorDown: 'DOOR DOWN' };

/** The pair's names: the boss plate's title, and each one's under its bar. */
export const DOOR_NAMES = { plate: 'THE DOORKEEPERS', latch: 'LATCH', hasp: 'HASP' };

/** The hunt's posting on the board (shared/bossjobs.ts). */
export const BARN_POST = {
  title: 'Hunt the Doorkeepers',
  text: "Two of the hungry have taken the doors off the great barn at Lowfurrow Fields and carry them about like shields. They've dragged the carts across the doorway and sat down in there with whatever was stored. Go in and put them down.",
};
