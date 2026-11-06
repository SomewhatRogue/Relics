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
import { playSfx } from './sfxplay';

/** Snaps and pops strung over `spread` seconds: fire catching as it goes. Cosmetic, so Math.random. */
function crackle(n: number, spread: number, peak: number, delay = 0): void {
  for (let i = 0; i < n; i++) {
    const f = 2600 + Math.random() * 3800;
    burst('highpass', f, f * 1.3, 5, peak * (0.55 + Math.random() * 0.6), 0.006 + Math.random() * 0.012, delay + Math.random() * spread);
  }
}

/** A quick cast going out: a crackle and hiss of the element, moving fast (Kyle, 2026-11-04). */
function castSound(el: Augment): void {
  if (playSfx(el === 'frost' ? 'frost_cast' : el === 'storm' ? 'storm_cast' : 'fire_cast', { vol: 0.7 })) return;
  if (el === 'frost') return burst('highpass', 8000, 4500, 1.2, 0.22, 0.14), crackle(4, 0.1, 0.12), tone('triangle', 3136, 3100, 0.04, 0.1, 0.03);
  if (el === 'storm') return crackle(10, 0.14, 0.22), tone('square', 2600, 900, 0.05, 0.06, 0.01), burst('bandpass', 3000, 1200, 2, 0.16, 0.08);
  // Fire, and a bare spark: a roaring whoosh with pops on it.
  burst('bandpass', 2200, 600, 0.9, 0.24, 0.2);
  crackle(7, 0.2, 0.2);
}

/** The element under a quick blow or spell landing. */
function landSound(el: Augment): void {
  // Frost and storm land on their cast's recording, quiet under the kit's hit; fire's crackle stays synthesized.
  if ((el === 'frost' || el === 'storm') && playSfx(el === 'frost' ? 'frost_cast' : 'storm_cast', { vol: 0.45, rate: 1.06 })) return;
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
