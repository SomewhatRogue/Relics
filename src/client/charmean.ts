/**
 * The new look's characters (docs/decisions/new-look-characters.md): the knight and the goblins redrawn meaner,
 * behind `?sharp` with the sharper painting (charpaint.ts). Kyle, 2026-11-16: the villagers sharpened "look really
 * good"; the knight and the goblins didn't. The trouble was their shapes, not the paint: a grey face under a red
 * plume on a blue box, and a round green blob in brown shorts. These keep the very same sizes and cuts, so every
 * pose, swing and timing is as it was; only what is drawn in them changes, after the concepts (the sprite sheet in
 * Kyle's ElevenLabs flow "Relic: HD-2D look tests"): a closed great helm, blackened plate, gold-edged pauldrons, a
 * dark red cape; sickly goblins with red eyes, in rust and black leather.
 */
import type { Part } from './sprites';

/** The knight (the Warrior's first look): a closed great helm with a black visor slit, the eyes two dim glints in it
 *  (they go red with the eye dial, heroeyes.ts, at the look's eye pixels), breathing holes below, gold-tipped points
 *  rising off the pauldrons beside the gorget. No plume. */
export const KNIGHT_HEAD = ['......hAAAAa......', '.....hAAAAAAa.....', '.....hAAAAAAa.....', '.....OOEOOEOa.....', '.....AAAAAAAa.....', '.....aAaAaAAa.....', '..k...aAAAAa...k..'];
export const KNIGHT_BACK = ['......hAAAAa......', '.....hAAAAAAa.....', '.....AAAAAAAa.....', '.....AAAAAAAa.....', '.....AAAAAAAa.....', '.....aAAAAAAa.....', '..k...aAAAAa...k..'];
/** Blackened steel, the plate darker than the helm, a crimson surcoat down the middle, gold at the edges. */
export const KNIGHT_PAL: Record<string, string> = {
  A: '#4a505a', a: '#22262e', h: '#8a929e', O: '#08080c', E: '#c8c0b0', P: '#3a3f48', p: '#c8962e', B: '#22252c', b: '#16181e',
  T: '#6a1a1c', M: '#30343c', m: '#1e2128', K: '#1a1412', k: '#d4a537', L: '#20232a', F: '#121014',
};
export const KNIGHT_CAPE: [string, string] = ['#5a1416', '#2e0a0c'];
/** The knight's heater shield (sprites.ts shieldParts): a blackened steel rim, a deep crimson field, old gold. */
export const SHIELD_MEAN = ['#7a828c', '#3a3f48', '#c8a040', '#8a6a24', '#5a1416', '#3e0e10'];

/** The goblins' colours: sicklier yellow-green skin, a rust-red rag of a jerkin, black leather, redder eyes. */
export const MEAN_GOB = { S: '#6a7a30', s: '#46521e', L: '#3c4620', F: '#262c14', B: '#5e2a1c', b: '#3e1c14', K: '#141012', m: '#1a0c0a', T: '#e8dcc0', E: '#ff3a2a' };

/** Drawn over the goblin's face (sprites.ts gobFace): brows slanting down to the nose, the eyes two pixels each, dark
 *  under them, a grin wider and jagged with the teeth apart, fangs, a pale scar down one cheek. */
export const MEAN_FACE: Part[] = [
  ['p', 5, 3, MEAN_GOB.K], ['p', 6, 4, MEAN_GOB.K], ['p', 7, 4, MEAN_GOB.K], ['p', 11, 3, MEAN_GOB.K], ['p', 10, 4, MEAN_GOB.K], ['p', 9, 4, MEAN_GOB.K],
  ['p', 6, 5, MEAN_GOB.E], ['p', 7, 5, MEAN_GOB.E], ['p', 9, 5, MEAN_GOB.E], ['p', 10, 5, MEAN_GOB.E],
  ['p', 6, 6, MEAN_GOB.s], ['p', 7, 6, MEAN_GOB.s], ['p', 9, 6, MEAN_GOB.s], ['p', 10, 6, MEAN_GOB.s], ['p', 8, 6, MEAN_GOB.m],
  ['r', 5, 7, 7, 1, MEAN_GOB.m], ['p', 6, 7, MEAN_GOB.T], ['p', 8, 7, MEAN_GOB.T], ['p', 10, 7, MEAN_GOB.T],
  ['r', 6, 8, 5, 1, MEAN_GOB.m], ['p', 6, 8, MEAN_GOB.T], ['p', 10, 8, MEAN_GOB.T],
  ['p', 12, 4, '#8a5e4a'], ['p', 12, 5, '#8a5e4a'], ['p', 11, 6, '#8a5e4a'],
];
/** Drawn over its head: the ears longer, swept up and back to points, dark inside. */
export const MEAN_EARS: Part[] = [
  ['p', 0, 3, MEAN_GOB.S], ['p', 1, 4, MEAN_GOB.S], ['p', 0, 2, MEAN_GOB.s], ['p', 2, 5, MEAN_GOB.s],
  ['p', 16, 3, MEAN_GOB.S], ['p', 15, 4, MEAN_GOB.S], ['p', 16, 2, MEAN_GOB.s], ['p', 14, 5, MEAN_GOB.s],
];
/** Drawn over its body: black leather pads on the shoulders with a bone spike each, a black harness across the rag. */
export const MEAN_BODY: Part[] = [
  ['r', 2, 9, 3, 1, MEAN_GOB.K], ['r', 12, 9, 3, 1, MEAN_GOB.K], ['p', 2, 8, MEAN_GOB.T], ['p', 14, 8, MEAN_GOB.T],
  ['p', 5, 9, MEAN_GOB.K], ['p', 6, 10, MEAN_GOB.K], ['p', 7, 11, MEAN_GOB.K], ['r', 3, 13, 11, 1, MEAN_GOB.K], ['p', 8, 13, '#8a7a50'],
];

/** A Warrior's own shield (shieldart.ts, the barracks' choices kept): each field deeper and darker, each metal older
 *  and duller, the rims blackened. Field: dark, then the lit left of it. Trim: the device's light and dark, the rim's. */
export const SHIELD_FIELDS_MEAN: [string, string][] = [['#4a1012', '#66181a'], ['#14244a', '#1e3460'], ['#16341c', '#22462a'], ['#141218', '#221f28'], ['#8a867e', '#a8a49c'], ['#5e4818', '#7a5e22']];
export const SHIELD_TRIMS_MEAN = { gold: ['#c8a040', '#8a6a24', '#7a828c', '#3a3f48'], silver: ['#c8ced4', '#7a828c', '#7a828c', '#3a3f48'], iron: ['#4a4652', '#2a2830', '#4a4652', '#24222a'] };
