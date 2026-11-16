/**
 * Named pieces' own looks (docs/design/gear-looks.md slice 2): each Hungry weapon (shared/hungry.ts) as the
 * thing it's named for, on its kit's shape. A named look is its own stuff (ramps by role over its tier's, and
 * exact colours swapped, weaponlook.ts) and a few strokes along the weapon in hand, drawn after the kit
 * (weaponmarks.ts), so the hands hold it as they hold the kit. Its floor sprite and bag picture: namedart.ts.
 * The unique weapons (shared/uniques.ts) are in uniquelooks.ts, by their ids. Drawing only.
 */
import type { Hero } from '../sim/types';
import type { Ramp, Role } from './weaponlook';
import { UNIQUE_LOOKS } from './uniquelooks';

/** Strokes in the hand's frame: `r` along the weapon from the hand, `o` across it (hero units), as held.ts draws. */
export interface Strokes {
  along(r0: number, r1: number, o: number, col: string, w?: number): void;
  across(r: number, o0: number, o1: number, col: string, w?: number): void;
  /** A pixel; with `glow`, drawn unlit at that strength too. */
  dot(r: number, o: number, col: string, glow?: number): void;
  /** Raise everything after this by `k` hero units (a crossbow comes up to the shoulder to aim). */
  lift(k: number): void;
  now: number;
}
export interface Named {
  /** Its own stuff over the tier's (a Hungry piece, still veined) rather than over today's art (a unique, which is itself). */
  tierStuff?: boolean;
  paint?: Partial<Record<Role, Ramp>>;
  swap?: Record<string, string>;
  held?: (s: Strokes, h: Hero) => void;
}

export const RAG: Ramp = ['#4a3e32', '#6a5a48', '#857260', 0.5];
const pulse = (now: number, k = 3) => 0.5 + 0.5 * Math.sin(now * k);

const HUNGRY_LOOKS: Record<string, Named> = {
  // Skarn's Cleaver: a butcher's cleaver, a slab of black iron off the spine, squared, with a hole to hang it by.
  cleaver: {
    tierStuff: true,
    paint: { grip: RAG },
    held: (s) => {
      for (const o of [1.1, 1.9, 2.7]) s.along(8, 24, o, '#38363c', 2);
      s.along(8, 24, 3.5, '#9a9ea6');
      s.across(24, -0.6, 3.5, '#2c2a30', 2);
      s.along(8, 24, -0.5, '#242226');
      s.dot(21.6, 2.2, '#0c0a0e');
    },
  },
  // The Larder Pike: a barbed head, and meat hooks hung down the haft.
  pike: {
    tierStuff: true,
    paint: { wood: ['#3a2a1c', '#4e3a26', '#644c32', 0.5] },
    held: (s) => {
      s.across(17.4, -1.4, 1.4, '#b8bcc2');
      for (const r of [4.5, 7.6, 10.6]) {
        s.across(r, 0.4, 1.9, '#8a7266');
        s.along(r - 1, r, 1.9, '#8a7266');
        s.dot(r - 1, 1.3, '#c8b8a8');
      }
    },
  },
  // Spendthrift: a black bow on a gold string, coins tied at the grip.
  spendthrift: {
    tierStuff: true,
    paint: { wood: ['#1e181c', '#2c2428', '#3e3238', 0.5] },
    swap: { '#d8d0bc': '#e8c050' },
    held: (s) => {
      for (const o of [-2.2, 2.2]) s.dot(3.2, o, '#ffd860', 0.35);
      s.dot(3.2, 3.2, '#c89a2a');
    },
  },
  // Mother Rust's Needles: long rusted needles bound in red thread.
  needles: {
    tierStuff: true,
    paint: { steel: ['#4a2a1e', '#7a4a32', '#c08a62', 0.6], grip: ['#5a1e1e', '#7a2a2a', '#9a3a3a', 0.5] },
    held: (s) => {
      s.along(7, 10.6, 0, '#9a5e40');
      s.dot(11, 0, '#e0c0a0');
    },
  },
  // The Jealous Wand: black twisted wood, a green eye at its tip that never stops looking.
  jealous: {
    tierStuff: true,
    paint: { wood: ['#1c1820', '#2e2630', '#403444', 0.5] },
    held: (s) => {
      for (const r of [1.5, 3, 4.5]) s.dot(r, 0.6, '#4a3a50');
      s.across(6.2, -0.7, 0.7, '#4a9a2a', 2);
      s.dot(6.2, 0, '#9be860', 0.4 + 0.4 * pulse(s.now, 1.3));
    },
  },
  // The Keeping Mace: its head an iron cage, a coal kept burning in it.
  keeping: {
    tierStuff: true,
    paint: { fit: ['#5a4a2a', '#7a6234', '#8a7040', 0.5] },
    held: (s) => {
      s.dot(11.6, 0, '#ff8a3a', 0.55 + 0.35 * pulse(s.now, 5));
      s.dot(11.6, 0.6, '#ffd27a', 0.3 + 0.3 * pulse(s.now, 7));
    },
  },
};

/** Every named weapon look: the Hungry six and the uniques. */
export const NAMED: Record<string, Named> = { ...HUNGRY_LOOKS, ...UNIQUE_LOOKS };
