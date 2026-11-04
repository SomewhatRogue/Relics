/**
 * The Mage's quick cast, heard: a crisp flick as it goes (a bright chirp and a tick, coloured by the
 * element: a soft whoosh of fire, a glassy tink of frost, a zip of storm), and as it lands a small
 * sound of the element under the kit's own hit (a crackle, a chime of ice, a snap). Quieter and
 * shorter than a held spell's sounds, so the heavy still sounds bigger. Layered: it never stops the others.
 */
import type { Augment } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { TAP_SRC, heroAt, hitEl, tapCast, tapEl } from './magetap';
import { burst, ready, tone } from './sfx';

/** The flick of a quick cast going out. */
function castSound(el: Augment): void {
  tone('sine', 1700, 2600, 0.07, 0.06);
  burst('highpass', 6000, 8000, 1.5, 0.12, 0.03);
  if (el === 'fire') burst('bandpass', 700, 1800, 1, 0.14, 0.1);
  else if (el === 'frost') tone('triangle', 3136, 3100, 0.05, 0.12, 0.02);
  else if (el === 'storm') tone('square', 2400, 1300, 0.04, 0.04, 0.01);
  else tone('sine', 1320, 1760, 0.05, 0.1, 0.02);
}

/** The element under a quick blow or spell landing. */
function landSound(el: Augment): void {
  if (el === 'fire') return burst('lowpass', 1800, 300, 0.8, 0.22, 0.16), burst('highpass', 2500, 4000, 2, 0.08, 0.05, 0.04);
  if (el === 'frost') return tone('triangle', 2637, 2600, 0.07, 0.12), tone('triangle', 3520, 3480, 0.05, 0.1, 0.03);
  if (el === 'storm') return tone('square', 1600, 700, 0.05, 0.05), burst('highpass', 3500, 6500, 1, 0.14, 0.05, 0.02);
  tone('sine', 900, 600, 0.06, 0.1);
}

/** Layers a quick cast's sounds on an event (the kit's own still play). */
export function mageTapSound(ev: FightEvent, room: ArenaRoom): void {
  if (!ready()) return;
  if (ev.k === 'shoot' || ev.k === 'slash' || (ev.k === 'swing' && ev.src === 'spellblade' && !ev.heavy)) {
    const h = heroAt(room.heroes, ev.x, ev.y);
    if (h && (ev.k === 'swing' || tapCast(h))) castSound(tapEl(h));
    return;
  }
  if (ev.k === 'hit' && ev.on === 'enemy' && !ev.tick && TAP_SRC.has(ev.src ?? '')) landSound(hitEl(ev.src!, ev.x, ev.y, room.heroes));
}
