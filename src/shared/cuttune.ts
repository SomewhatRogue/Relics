/**
 * The Rogue's Deep skill, the long cut (docs/design/deep-skills.md; Kyle's pick): a still beat, a line on the
 * floor showing where; one long slash along it, through everything on it; the Rogue puts the blade away, and
 * only then does everything behind them take the cut, all at once. The room: sim/samuraicut.ts. Drawn from the
 * same numbers: client/cutdraw.ts, three/cut3d.ts.
 *
 * - `stance` s still, the line showing (the stick or the mouse can still swing it), then the slash.
 * - `reach` tiles at most, stopped short by a wall; `band` tiles either side of the line is on it.
 * - `dash` s to cross it (untouchable while it runs), then `sheathe` s putting the blade away; the cut lands
 *   as it closes, `dmg` times the hero's damage on each one cut. Goblins on the line stand still till then
 *   (a boss shrugs most of that off, as it does any stun: sim/bosshold.ts).
 * - `cooldown` s between: a fight's turning point, not a rotation.
 */
export const CUT = { stance: 0.55, reach: 9, band: 0.75, dash: 0.14, sheathe: 0.75, dmg: 150, knock: 6, cooldown: 40 };

/** Seconds from the press to the cut landing (the stance, the dash, the sheathe). */
export const CUT_TOTAL = CUT.stance + CUT.dash + CUT.sheathe;
