/**
 * How THE LISTENER stands this frame (drawn by client/listendraw.ts). Read from what the room sends (its blow
 * and clock, boss.lmove, under, downUntil, stagUntil, roarUntil) and nothing else: drawing never changes the
 * fight. Offsets are for one facing right (the drawing mirrors them); y is up from its feet, negative.
 */
import type { Enemy } from '../sim/types';
import { ease } from './draw';

export const PAL = {
  skin: '#7a8870', skinLo: '#56644f', skinHi: '#a4b298', skinDk: '#3c4636', belly: '#92a086',
  rag: '#4d4034', ragLo: '#2f2822', ragHi: '#6e5e4a', bone: '#d8d6c0', ear: '#8a6f68', earLo: '#5c4540',
  eye: '#f2f8ff', rock: '#7c7a8c', rockHi: '#a8a6ba', rockLo: '#4a4858',
};

export interface LPose {
  ox: number; oy: number; step: number; moving: boolean;
  /** Upper body shifted forward, and dropped. */
  lean: number; crouch: number;
  /** The head's offset from its rest. */
  head: [number, number];
  /** Ears: how far each is turned (-2 back .. 2 forward), and the flick (0..1). */
  ear: number; flick: number;
  /** The near and far hands (from its feet, facing right). */
  hand: [number, number]; far: [number, number];
  /** A lump of rock held in the hands (0 none, else how high up). */
  lump: boolean;
  /** Sunk into the floor (0..1): drawn clipped to the floor line. */
  sink: number;
  /** A hole opening under it as it dives or is burst out of (0..1). */
  pit: number;
  roar: boolean; open: boolean;
  /** The sweep: the arm's angle (screen) from its start, and how far through (0 before, 1 done); the streak left behind. */
  sweep: { a0: number; k: number } | null;
  /** Head down and running. */
  charge: boolean; dust: boolean;
  stars: boolean; lie: 'none' | 'down' | 'sit';
  /** Eyes flare (a blow coming), 0..1. */
  flare: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const HANG: [number, number] = [9, -4], FARHANG: [number, number] = [-8, -4];

/** The pose now: `t` the room's time, `now` the wall clock (for the always-moving things: the ears, the breath). */
export function listenPose(e: Enemy, t: number, now: number): LPose {
  const b = e.boss!, a = e.attack, ph = now * 3.6 + e.id;
  const p: LPose = { ox: 0, oy: 0, step: 0, moving: !!e.moving, lean: 2, crouch: 1, head: [0, 0], ear: 0, flick: 0, hand: HANG, far: FARHANG, lump: false, sink: 0, pit: 0, roar: false, open: false, sweep: null, charge: false, dust: false, stars: false, lie: 'none', flare: 0 };
  // Always listening: the head cocks to one side then the other, the ears swing round and twitch.
  const cock = Math.sin(now * 0.7 + e.id * 1.7);
  p.head = [Math.round(cock * 1.5), Math.round(Math.sin(now * 0.45 + e.id) * 1)];
  p.ear = Math.round(Math.sin(now * 1.1 + e.id * 2.3) * 2);
  p.flick = (now * 1.9 + e.id) % 2.6 < 0.22 ? 1 : 0;
  if (p.moving) (p.step = Math.sin(ph * 1.2)), (p.oy = -Math.round(Math.abs(p.step) * 2)), (p.lean = 4), (p.crouch = 2), (p.hand = [10, -2]), (p.far = [-6, -6]);
  const down = (b.downUntil ?? -9) - t;
  if (e.act === 'dead') return { ...p, lie: 'down', moving: false, step: 0, oy: 0 };
  if (down > 0) {
    p.moving = false, p.step = 0, p.oy = 0, p.stars = true;
    p.lie = down > 0.5 ? 'down' : 'sit';
    p.flare = 0;
    return p;
  }
  if ((b.stagUntil ?? -9) > t) return { ...p, stars: true, ox: Math.round(Math.sin(now * 13) * 2), lean: -3, crouch: 3, head: [-2, 2], ear: -2, hand: [8, -2], far: [-8, -2], moving: false, step: 0 };
  if ((b.roarUntil ?? -9) > t) return { ...p, roar: true, open: true, ox: Math.round(Math.sin(now * 40)), lean: -3, crouch: 0, head: [-2, -3], ear: 2, hand: [14, -22], far: [-14, -22], moving: false, step: 0, flare: 1 };
  if (!a) return p;
  const w = a.windup, ac = a.active + 0.1, tt = a.t, move = b.lmove ?? 'rock';
  const rr = Math.min(1, Math.max(0, (tt - w - ac) / Math.max(0.01, a.recover)));
  p.moving = false, p.step = 0, p.oy = 0;
  if (move === 'rock') {
    // Wrenching a lump off the floor (hitching, grit flying), hauling it up, then the overhead throw.
    const throwAt = w - 0.35;
    if (tt < w * 0.45) { const k = ease(tt / (w * 0.45)); Object.assign(p, { crouch: 4 + Math.round(3 * k), lean: 5, hand: mix(HANG, [9, 0], k), far: mix(FARHANG, [6, 0], k), head: [3, 3], ear: 1, lump: k > 0.6, dust: true, ox: Math.round(Math.sin(now * 38) * k * 1.5) }); }
    else if (tt < throwAt) { const k = ease((tt - w * 0.45) / Math.max(0.05, throwAt - w * 0.45)); Object.assign(p, { crouch: 3, lean: lerp(5, -3, k), hand: mix([9, 0], [4, -31], k), far: mix([6, 0], [0, -30], k), head: [-1, -1], ear: 0, lump: true, flare: k }); }
    else if (tt < w) { const k = (tt - throwAt) / 0.35; Object.assign(p, { crouch: 1, lean: lerp(-3, 9, ease(k)), hand: mix([4, -31], [16, -14], k), far: mix([0, -30], [12, -16], k), lump: k < 0.55, head: [3, 2], flare: 1 }); }
    else if (tt < w + ac) Object.assign(p, { crouch: 3, lean: 9, hand: [16, -12], far: [12, -14], head: [3, 3], flare: 1 });
    else Object.assign(p, { crouch: Math.round(3 * (1 - rr)), lean: lerp(9, 2, ease(rr)), hand: mix([16, -12], HANG, ease(rr)), far: mix([12, -14], FARHANG, ease(rr)) });
  } else if (move === 'drop') {
    // Crouches low, then dives: head and shoulders first, the floor opening under it, gone below.
    const k = Math.min(1, tt / w);
    if (k < 0.45) { const j = ease(k / 0.45); Object.assign(p, { crouch: Math.round(7 * j), lean: Math.round(3 * j), hand: mix(HANG, [8, -1], j), far: mix(FARHANG, [-4, -1], j), head: [2, 3], ear: 2, flare: j, dust: true }); }
    else { const j = ease((k - 0.45) / 0.55); Object.assign(p, { crouch: 7, lean: 4, hand: [8, -1], far: [-4, -1], head: [3, 4], ear: 2, sink: j, pit: Math.min(1, j * 1.6), flare: 1 }); }
  } else if (move === 'rise') {
    // (Under the floor through the wind-up: the screen draws the hole, not it.) Bursts up arms wide, then settles.
    const s = tt - w;
    if (s < 0) Object.assign(p, { sink: 1 });
    else if (s < 0.4) { const k = ease(s / 0.4); Object.assign(p, { sink: 1 - k, pit: 1, crouch: 1, lean: -2, hand: mix([6, 6], [15, -24], k), far: mix([-6, 6], [-15, -24], k), head: [-1, -3], ear: 2, open: true, flare: 1, oy: -Math.round(Math.sin(k * Math.PI) * 4) }); }
    else Object.assign(p, { pit: Math.max(0, 1 - (s - 0.4) / 0.4), crouch: 4, lean: 5, hand: mix([15, -24], [14, -8], Math.min(1, (s - 0.4) / 0.25)), far: mix([-15, -24], [-10, -8], Math.min(1, (s - 0.4) / 0.25)), open: s < 0.6, flare: 1 });
  } else if (move === 'sweep') {
    // The far arm wound back behind it; then one long arm round in a wide arc.
    const A0 = -1.92;
    if (tt < w) { const k = ease(tt / w); Object.assign(p, { crouch: 2 + Math.round(2 * k), lean: Math.round(-4 * k), hand: mix(HANG, [-12, -16], k), far: [-7, -9], head: [-1, 0], flare: k }); p.sweep = null; }
    else if (tt < w + ac) { const k = (tt - w) / ac; Object.assign(p, { crouch: 3, lean: Math.round(lerp(-4, 8, k)), far: [-7, -9], flare: 1 }); p.sweep = { a0: A0, k }; }
    else { const k = ease(rr); Object.assign(p, { crouch: 3, lean: lerp(8, 2, k), hand: mix([16, -8], HANG, k), far: [-7, -9] }); p.sweep = rr < 0.35 ? { a0: A0, k: 1 } : null; }
  } else {
    // The charge: down on its knuckles, head lowered, ears flat back, arms trailing; then running.
    const k = Math.min(1, tt / w);
    if (tt < w) Object.assign(p, { crouch: 4 + Math.round(3 * ease(k)), lean: 4 + Math.round(4 * k), head: [4, 5], ear: -2, hand: mix(HANG, [-10, -8], ease(k)), far: mix(FARHANG, [-16, -10], ease(k)), charge: true, dust: true, flare: k, ox: Math.round(Math.sin(now * 40) * k * 1.4) });
    else if (tt < w + ac) Object.assign(p, { crouch: 7, lean: 10, head: [5, 6], ear: -2, hand: [-12, -8], far: [-18, -10], charge: true, dust: true, moving: true, step: Math.sin(now * 20), oy: -Math.round(Math.abs(Math.sin(now * 20)) * 2), flare: 1 });
    else Object.assign(p, { crouch: Math.round(7 * (1 - rr)), lean: lerp(10, 2, ease(rr)), head: [4 * (1 - rr), 4 * (1 - rr)], ear: -1, hand: mix([-8, -6], HANG, ease(rr)), far: mix([-14, -8], FARHANG, ease(rr)), charge: rr < 0.5 });
  }
  return p;
}
