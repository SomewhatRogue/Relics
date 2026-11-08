/**
 * The Ranger's kit rules (Kyle's weapons rework, 2026-11-03). Every bow is a short sword on a tap and
 * the bow on a hold. The longbow's draw grows to full; let go on the white flash and the arrow is a sure
 * crit that BLINDS what it strikes. The shortbow is unchanged. The crossbow aims if a bolt is on it and
 * winds if not; a bolt pierces a line and shoves, and a reload wound in one go glints for a harder,
 * further shot. The room judges with these numbers and the client draws from the same ones.
 */

/** The longbow's perfect release: what it strikes is blinded `time` s (a butcher `big` as long). A
 *  blinded goblin drops its blow, can't pick out a hero, and blunders about at `pace` of its speed. */
export const BLIND = { time: 2, big: 0.5, pace: 0.45, turn: 0.7 };

/**
 * The crossbow. A reload is `reload` s of winding (it keeps what you've wound if you let go or move). A
 * plain bolt runs through `pierce` goblins; a glinted one (wound full in one go) does `glint` times the
 * damage, shoves `shove` times harder and runs through the whole line.
 */
/** The shortbow (Kyle, 2026-11-08): quick to full, and let go early it's a full shot anyway, so its flash
 *  has to be worth catching: a shot loosed on it does `perfect` times the damage. */
export const SHORTBOW = { perfect: 1.4 };
export const XBOW = { reload: 1, glint: 1.5, shove: 1.6, pierce: 3 };
