/**
 * Every kit sounds like itself: the sword's ringing slice, the greatsword's long low whoosh and its
 * cleave, the spear's thrust, the daggers' quick hiss and stab, the mace's whump and crunch; bows creak
 * and twang (deeper for the longbow), the crossbow thwacks; spells crackle, hum and zap. What a blow
 * lands on matters too: a big body thuds, wood chops, a shield or the butcher's iron clanks.
 */
import { burst, ready, tone } from './sfx';

type Kit = 'sword' | 'greatsword' | 'spear' | 'daggers' | 'mace' | 'rapier' | 'flail' | 'blade' | 'shot';
const kitOf = (src?: string): Kit =>
  src === 'sword' || src === 'greatsword' || src === 'spear' || src === 'daggers' || src === 'mace' || src === 'rapier' || src === 'flail' ? src
    : src === 'poisoner' ? 'daggers' : src === 'censer' ? 'sword'
    : src === 'longbow' || src === 'shortbow' || src === 'crossbow' || src === 'wand' || src === 'staff' || src === 'rod' ? 'shot' : 'blade';

/** A blow swung (melee kits; ranged and spell kits sound on their shot instead). */
export function swingSound(src: string, heavy: boolean): void {
  if (!ready()) return;
  const k = kitOf(src), h = heavy ? 1.3 : 1;
  if (k === 'shot' || (src === 'poisoner' && heavy)) return;
  // The censer's chain rattles as it comes round.
  if (src === 'censer' && heavy) burst('highpass', 4000, 7000, 2, 0.18, 0.2), burst('highpass', 5000, 8000, 2, 0.12, 0.12, 0.12);
  if (k === 'rapier') return burst('highpass', 3500, 7000, 2, 0.28 * h, 0.06), tone('sine', 3200, 3000, 0.02, 0.06);
  if (k === 'flail') return burst('highpass', 4500, 8000, 2, 0.15, 0.12), burst('lowpass', 700, 200, 0.8, 0.5 * h, 0.3, 0.06), tone('sine', 120, 70, 0.15, 0.2, 0.06);
  if (k === 'greatsword') return burst('bandpass', 300, 1100, 1, 0.5 * h, 0.32), tone('triangle', 90, 60, 0.12, 0.3);
  if (k === 'spear') return burst('bandpass', 1400, 3200, 2, 0.4 * h, 0.1);
  if (k === 'daggers') return burst('highpass', 2600, 5200, 1.5, 0.3, 0.07), burst('highpass', 3000, 6000, 1.5, 0.2, 0.06, 0.06);
  if (k === 'mace') return burst('lowpass', 900, 250, 0.8, 0.45 * h, 0.22), tone('sine', 140, 90, 0.15, 0.15);
  if (k === 'sword') return burst('bandpass', 800, 2800, 1.3, 0.38 * h, 0.15), tone('sine', 2400, 2300, 0.03, 0.25, 0.05);
  burst('bandpass', 900, 2600, 1.2, 0.35, 0.14);
}

/** A blow or a shot lands on a goblin. */
export function hitSound(src: string | undefined, heavy: boolean, big: boolean): void {
  if (!ready()) return;
  const k = kitOf(src), body = big ? 0.75 : 1;
  // The body under it: a dull thud, deeper on the butcher.
  tone('sine', (heavy ? 110 : 150) * body, 45, heavy ? 0.85 : 0.55, heavy ? 0.22 : 0.14);
  if (big) burst('bandpass', 600, 300, 3, 0.25, 0.12), tone('square', 330, 300, 0.05, 0.12);
  if (k === 'mace' || k === 'flail') return burst('lowpass', 1400, 200, 0.8, 0.8, 0.14), burst('bandpass', 2600, 1200, 4, 0.3, 0.05), tone('triangle', 900, 880, 0.08, 0.3);
  if (k === 'greatsword') return burst('lowpass', 2600, 200, 0.7, 0.85, 0.18), burst('bandpass', 400, 120, 1, 0.5, 0.25);
  if (k === 'spear' || k === 'rapier' || src === 'arrow' || src === 'bolt' || src === 'knife') return burst('bandpass', 1800, 500, 2, 0.55, 0.07), tone('sine', 260, 90, 0.35, 0.08);
  if (k === 'daggers') return burst('highpass', 3000, 1500, 1.2, 0.4, 0.06), burst('bandpass', 700, 250, 1.5, 0.35, 0.12, 0.02);
  if (src === 'spark') return burst('highpass', 3500, 6000, 1, 0.3, 0.08), tone('square', 1500, 700, 0.06, 0.08);
  if (src === 'orb') return tone('sine', 220, 70, 0.5, 0.3), burst('lowpass', 3000, 300, 0.7, 0.6, 0.3);
  if (src === 'lance') return tone('sawtooth', 1200, 300, 0.12, 0.15), burst('highpass', 2500, 5000, 1, 0.3, 0.12);
  if (src === 'smite') return tone('sine', 1046, 1046, 0.12, 0.4), burst('lowpass', 2400, 300, 0.7, 0.6, 0.2);
  // Sword and anything else with an edge: a bright slice.
  burst('highpass', 2800, 1200, 1, 0.45, 0.07);
  burst('lowpass', 2000, 300, 0.7, heavy ? 0.6 : 0.4, 0.12);
}

/** A ranged kit or spell looses. */
export function shotSound(kind: string, src?: string): void {
  if (!ready()) return;
  if (kind === 'arrow') {
    // The string: deep on the longbow, high and quick on the shortbow; then the arrow's hiss.
    const f = src === 'longbow' ? 130 : 210;
    tone('triangle', f, f * 0.7, 0.35, 0.12);
    tone('sine', f * 2, f * 1.4, 0.1, 0.1);
    return burst('highpass', 2500, 5500, 1, 0.22, 0.16, 0.02);
  }
  if (kind === 'bolt') return tone('square', 150, 60, 0.4, 0.09), burst('bandpass', 1600, 500, 2, 0.65, 0.12), tone('square', 2400, 2200, 0.05, 0.04, 0.14), tone('square', 2000, 1900, 0.05, 0.04, 0.2);
  if (kind === 'spark') return tone('sine', 1300, 500, 0.16, 0.14), burst('bandpass', 3500, 1500, 3, 0.25, 0.1);
  if (kind === 'orb') return tone('sine', 180, 520, 0.3, 0.4), tone('triangle', 270, 780, 0.12, 0.4), burst('lowpass', 600, 2000, 0.7, 0.2, 0.4);
  if (kind === 'lance') return tone('sawtooth', 300, 1800, 0.18, 0.22), burst('highpass', 2000, 5000, 1, 0.3, 0.18);
}

/** A bow drawn to full, a spell gathered: a creak or a rising hum. */
export function chargedSound(src: string): void {
  if (!ready()) return;
  if (src === 'longbow' || src === 'shortbow') return burst('bandpass', 400, 900, 8, 0.25, 0.2), tone('triangle', 1320, 1760, 0.12, 0.15);
  if (src === 'staff' || src === 'rod' || src === 'wand') return tone('sine', 440, 880, 0.15, 0.3), tone('sine', 660, 1320, 0.08, 0.3);
  tone('triangle', 1320, 1760, 0.2, 0.2);
}

/** Hit on your guard: a shield clangs, a blade rings, a staff knocks. */
export function blockSound(src: string): void {
  if (!ready()) return;
  if (src === 'sword') return tone('triangle', 520, 480, 0.35, 0.25), burst('bandpass', 1800, 900, 4, 0.4, 0.1), tone('sine', 1560, 1500, 0.08, 0.4);
  if (src === 'greatsword' || src === 'spear' || src === 'daggers' || src === 'rapier' || src === 'poisoner' || src === 'censer') return tone('sine', 2200, 2150, 0.12, 0.35), burst('bandpass', 3000, 1500, 5, 0.35, 0.06);
  tone('triangle', 180, 120, 0.5, 0.12), burst('bandpass', 1400, 700, 3, 0.4, 0.1);
}

/** Wood: a blow on a wall, a building catching, a building falling in. */
export const woodSounds = {
  chop() {
    if (ready()) burst('bandpass', 900, 400, 3, 0.6, 0.1), tone('triangle', 180, 120, 0.3, 0.1);
  },
  blaze() {
    if (ready()) burst('lowpass', 400, 2400, 0.6, 0.6, 0.6), tone('sine', 80, 50, 0.4, 0.5);
  },
  collapse() {
    if (!ready()) return;
    tone('sine', 60, 25, 1, 0.9);
    burst('lowpass', 1200, 60, 0.6, 1, 1.1);
    for (let i = 0; i < 6; i++) burst('bandpass', 1400 - i * 120, 400, 3, 0.35, 0.12, 0.1 + i * 0.09);
  },
  /** A pop or two of a building on fire (called now and then while one burns). */
  crackle(near: number) {
    if (!ready()) return;
    for (let i = 0; i < 3; i++) burst('highpass', 2000 + Math.random() * 3000, 1500, 2, 0.08 * near + Math.random() * 0.06 * near, 0.03, Math.random() * 0.4);
    burst('lowpass', 500, 200, 0.6, 0.12 * near, 0.5);
  },
  door() {
    if (!ready()) return;
    tone('sawtooth', 210, 160, 0.06, 0.35);
    tone('sawtooth', 320, 260, 0.04, 0.3, 0.08);
    burst('lowpass', 600, 200, 0.7, 0.35, 0.12, 0.35);
  },
};
