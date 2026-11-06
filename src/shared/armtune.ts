/**
 * Arm-wrestling at the Drowned Rat (docs/plans/town-activities.md): every number the rules
 * (shared/armwrestle.ts) and the picture (client/armview.ts) use, so the band you see is the one judged.
 *
 * The bar is your grip, 0 at the foot and 1 at the top: hold to bear down and it climbs, let go and it
 * sinks. The sweet spot is a band on the bar that drifts about; while your grip is in it you push their
 * arm over, and while it isn't they push yours back. Now and then they heave (a tell first), shoving the
 * band away and pushing twice as hard while it lasts. Past `tired` seconds they push harder each second,
 * so a bout always ends.
 */

export type ArmFoeId = 'drunk' | 'sharp' | 'watch' | 'gannet';

/**
 * One of the regulars across the table.
 * - `width`: half the sweet spot's height; `drift`: how far it wanders; `hz`: how fast.
 * - `push`: how fast they win while you're out of it (lean a second); `give`: how fast you win while in.
 * - `heave`: seconds between heaves (from, to); `move`: how far a heave throws the band.
 * - `cap`: the most they'll bet. `look`: how they're drawn (an npc look).
 */
export interface ArmFoe {
  id: ArmFoeId; name: string; look: string;
  width: number; drift: number; hz: number; push: number; give: number;
  heave: readonly [number, number]; move: number; cap: number;
}

/** Weakest first. The drunk's arm wanders and gives; the card sharp is quick and slight; the watch are strong; Gannet is stronger. */
export const ARM_FOES: readonly ArmFoe[] = [
  { id: 'drunk', name: 'A DRUNK', look: 'villager', width: 0.15, drift: 0.22, hz: 0.14, push: 0.1, give: 0.15, heave: [5, 8], move: 0.16, cap: 10 },
  { id: 'sharp', name: 'A CARD SHARP', look: 'rogue', width: 0.12, drift: 0.26, hz: 0.26, push: 0.14, give: 0.14, heave: [3, 5], move: 0.24, cap: 25 },
  { id: 'watch', name: 'A WATCHMAN OFF DUTY', look: 'guard', width: 0.11, drift: 0.26, hz: 0.2, push: 0.2, give: 0.13, heave: [3.2, 5.5], move: 0.26, cap: 50 },
  { id: 'gannet', name: 'BARKEEP GANNET', look: 'villager', width: 0.1, drift: 0.27, hz: 0.23, push: 0.24, give: 0.12, heave: [2.6, 4.4], move: 0.3, cap: 50 },
];
export const armFoe = (id: string): ArmFoe => ARM_FOES.find((f) => f.id === id) ?? ARM_FOES[0];

/**
 * - `fps`: the rules' fixed steps. `rise`, `fall`: the grip climbing while held and sinking when let go
 *   (a second). `start`: the grip as the bout begins.
 * - `near`: the middle share of the band where you push half again as hard (`nearBonus`).
 * - `tell`: the warning before a heave; `heaveFor`: how long it shoves; `heavePush`: how much harder.
 * - `tired`, `tiredBy`: from then, their push grows this share a second.
 * - `cap`: the longest a bout can go (whoever's ahead takes it, the table to them on a dead level).
 */
export const ARM = {
  fps: 60, rise: 1.3, fall: 1.1, start: 0.35,
  near: 0.4, nearBonus: 0.5,
  tell: 0.6, heaveFor: 0.9, heavePush: 1.8, back: 0.9,
  tired: 16, tiredBy: 0.08, cap: 45,
} as const;
