/**
 * A worn ring on the hero (docs/design/gear-looks.md slice 4): one pixel on the off hand in the ring's stuff
 * (plain iron, fine gold, forged silver, the cursed tiers tarnished; a named ring its own: bone, dripstone,
 * a rivet), and every few seconds a glint in the tier's colour. armourlook.ts puts it in the armour figure, on
 * the hand of the off arm (the near arm in profile, the far one's behind the body), so it moves with the hand.
 */
import { TIERS } from '../shared/gear';
import type { RingLook } from '../shared/gearlook';
import type { Tier } from '../shared/loot';
import type { Joint } from './joints';

const STUFF: Record<Tier, string> = { plain: '#8a8e94', fine: '#d9b13a', forged: '#c8d0dc', tolmouth: '#8a7aa0', touched: '#6a6050', turning: '#4a4650', hungry: '#3a3438' };
/** Named rings as their lines say (shared/uniques.ts, shared/hungry.ts). */
const NAMED: Record<string, string> = {
  cartlink: '#6a6e74', keepersring: '#7a7e84', knucklering: '#e8dcb8', gutcollar: '#5e6268', rustthimble: '#a07050', brutering: '#55585e',
  ironrivet: '#7a7e84', dripring: '#a8b8c0', leechring: '#5a4030', wedding: '#ffd860', tooth: '#e8dcb8',
};

export const ringStuff = (l: RingLook) => (l.named && NAMED[l.named]) || STUFF[l.tier];
/** The glint: the tier's colour; a unique's (always PRE-WAR) a plain bright one, since it's not cursed. */
export const ringGlint = (l: RingLook) => (l.named && l.tier === 'tolmouth' ? '#f0ece0' : TIERS[l.tier].col);

/** When this hero's ring glints: a fifth of a second every few seconds, each hero at their own moment. */
/** (The armour page holds every glint on, so a shot catches them.) */
export const RING_SHOW = { always: false };
export const glinting = (now: number, seed: number) => RING_SHOW.always || (now + seed * 0.37) % 3.4 < 0.2;

/** The hand: the lowest row of a part with an inside pixel, its middle such pixel (sprite coordinates). */
export function handOf(p: Joint, inside: (x: number, y: number) => boolean, own: Uint8ClampedArray, W: number): [number, number] | null {
  for (let Y = p.y1 - 1; Y >= p.y0; Y--) {
    const xs: number[] = [];
    for (let X = p.x0; X < p.x1; X++) if (own[(Y * W + X) * 4 + 3] && inside(X, Y)) xs.push(X);
    if (xs.length) return [xs[Math.floor(xs.length / 2)], Y];
  }
  return null;
}
