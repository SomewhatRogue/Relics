/**
 * How THE LEECHMAN stands this frame (drawn by client/leechdraw.ts). Read from what the room sends (its blow, boss.cmove,
 * stagUntil, roarUntil, downUntil, whether the shallows are drained) and the screen's own stamps (client/leechstate.ts);
 * drawing never changes the fight. Offsets are for one facing right (the drawing mirrors them); y is up from its feet, negative.
 */
import { LEECHMAN } from '../shared/leechtune';
import type { Enemy } from '../sim/types';
import { ease } from './draw';
import { LEECH, wetAt } from './leechstate';

export const PAL = {
  skin: '#86a64e', skinLo: '#5e7c34', skinHi: '#b4d072', skinDk: '#3a5222', belly: '#a2bc66',
  wader: '#2c2834', waderHi: '#5a566a', waderLo: '#16141c', strap: '#6a5236', strapLo: '#3e2e1e',
  mud: '#5a4630', mudLo: '#34281a', cord: '#c8b480', cordLo: '#8a7a50', iron: '#d6dde2', bone: '#e8e4c8',
  leech: '#3c2040', leechHi: '#b898b8', leechBelly: '#8a2e44', eye: '#eef86a', water: '#2e5058', foam: '#a4c8c8',
};

export interface LeechPose {
  mode: 'stand' | 'crawl' | 'flounder' | 'haulout' | 'down' | 'dead';
  ox: number; oy: number; step: number; moving: boolean;
  lean: number; crouch: number; head: [number, number];
  hand: [number, number]; far: [number, number];
  /** The line: a loop whirling overhead (0 none, else 0..1 how wide), the cast (how far out the hook is, in tiles, and how slack the line is), the haul (hand over hand, 0 none else a clock). */
  whirl: number; cast: null | { d: number; slack: number }; haul: number;
  /** A slab of peat: held (0..1 how high up), or flying down the lane (0..1). */
  slab: null | { held?: number; fly?: number };
  /** A handful of leeches in the fist (0..1 plucked), and flung (0..1 along their flight). */
  pluck: number; fling: number | null;
  /** A blow swung across (0..1 through its arc). */
  swing: number | null;
  roar: boolean; open: boolean; stars: boolean; flare: number; lay: boolean;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const HANG: [number, number] = [9, -9], FARHANG: [number, number] = [-9, -9];
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** The pose now: `t` the room's time, `now` the wall clock (for the always-moving things: the sway, the leeches). */
export function leechPose(e: Enemy, t: number, now: number): LeechPose {
  const b = e.boss!, a = e.attack, id = e.id;
  const p: LeechPose = { mode: 'stand', ox: 0, oy: 0, step: 0, moving: !!e.moving, lean: 3 + Math.sin(now * 0.9 + id), crouch: 2, head: [Math.round(Math.sin(now * 0.8 + id)), Math.round(Math.sin(now * 1.4 + id))], hand: HANG, far: FARHANG, whirl: 0, cast: null, haul: 0, slab: null, pluck: 0, fling: null, swing: null, roar: false, open: false, stars: false, flare: 0, lay: false };
  // Wading: a slow sway side to side, the hands trailing; a stride when it walks.
  p.ox = Math.round(Math.sin(now * 1.3 + id) * 1.2);
  p.hand = [HANG[0] + Math.sin(now * 1.1 + id), HANG[1] + Math.sin(now * 1.7)];
  p.far = [FARHANG[0] - Math.sin(now * 0.9 + id), FARHANG[1] + Math.sin(now * 1.3)];
  if (p.moving) (p.step = Math.sin(now * 7 + id)), (p.oy = -Math.round(Math.abs(p.step) * 1.5)), (p.lean = 5), (p.hand = [11, -6]), (p.far = [-8, -12]);
  const down = (b.downUntil ?? -9) - t;
  if (e.act === 'dead') return { ...p, mode: 'dead', moving: false, step: 0, oy: 0, ox: 0 };
  if (down > 0) {
    // Off a log into the deep: floundering, arms up; else flat on its back in the shallows.
    const deep = LEECH.map ? wetAt(LEECH.map, e.x, e.y) === 2 : false;
    return { ...p, mode: deep ? 'flounder' : 'down', moving: false, step: 0, oy: 0, ox: 0, stars: !deep, open: deep, flare: 0 };
  }
  if (now - LEECH.out < 0.9 && LEECH.out > 0 && Math.hypot(LEECH.outAt.x - e.x, LEECH.outAt.y - e.y) < 1.5) return { ...p, mode: 'haulout', moving: false, step: 0, oy: 0, ox: 0 };
  if ((b.stagUntil ?? -9) > t) return { ...p, stars: true, ox: Math.round(Math.sin(now * 13) * 2), lean: -3, crouch: 4, head: [-2, 2], hand: [8, -6], far: [-8, -6], moving: false, step: 0 };
  if ((b.roarUntil ?? -9) > t) return { ...p, roar: true, open: true, ox: Math.round(Math.sin(now * 40)), lean: -4, crouch: 0, head: [-2, -3], hand: [15, -30], far: [-15, -30], moving: false, step: 0, flare: 1 };
  if (!a) {
    if (LEECH.map?.drained) return { ...p, mode: 'crawl', ox: 0, lean: 8, crouch: 0, hand: [13, -3], far: [-10, -3] };
    // Hauling a hero in hand over hand, after the line (the room has already moved them).
    const hk = now - LEECH.hooked;
    if (hk >= 0 && hk < 0.6 && LEECH.hooked > 0) return { ...p, haul: hk + 0.01, moving: false, step: 0, lean: -5, crouch: 3, hand: [10 + Math.sin(hk * 22) * 4, -16], far: [6 - Math.sin(hk * 22) * 4, -14], flare: 0.6 };
    if (now - LEECH.lay < 1) {
      const k = clamp((now - LEECH.lay) / 1);
      return { ...p, lay: true, moving: false, step: 0, lean: 8, crouch: 6, head: [3, 3], hand: [14, -4 + Math.sin(k * 20)], far: [10, -5], ox: Math.round(Math.sin(now * 30) * (1 - k)) };
    }
    return p;
  }
  const w = a.windup, ac = a.active + 0.1, tt = a.t, tell = a.tell ?? 0, move = b.cmove ?? 'wade';
  const rr = clamp((tt - w - ac) / Math.max(0.01, a.recover));
  p.moving = false, p.step = 0, p.oy = 0, p.ox = 0;
  if (LEECH.map?.drained) p.mode = 'crawl';
  if (move === 'line') {
    const range = a.range ?? LEECHMAN.line.range!;
    if (tt < w) { const k = clamp((tt - tell * 0.4) / Math.max(0.1, w - tell * 0.4)); Object.assign(p, { lean: lerp(3, -4, ease(k)), crouch: 2, hand: mix(HANG, [5, -37], ease(Math.min(1, k * 2))), far: mix(FARHANG, [-5, -20], k), head: [-1, -1], whirl: Math.max(0.15, k), flare: k }); }
    else if (tt < w + ac) { const k = clamp((tt - w) / ac); Object.assign(p, { lean: 9, crouch: 3, hand: [17, -22], far: [4, -20], flare: 1, cast: { d: range * ease(k), slack: 0 } }); }
    else Object.assign(p, { lean: lerp(9, -5, ease(rr)), crouch: 3, hand: [10 + Math.sin(rr * 18) * 4, -16], far: [6 - Math.sin(rr * 18) * 4, -14], haul: 0.01 + rr, cast: { d: range * (1 - ease(rr)), slack: 0.5 * rr }, flare: 0.5 });
  } else if (move === 'punish') {
    // Both fists overhead, then down through the hero it has hauled in.
    if (tt < w) { const k = ease(clamp(tt / w)); Object.assign(p, { lean: lerp(3, -7, k), crouch: 1, hand: mix(HANG, [7, -39], k), far: mix(FARHANG, [1, -38], k), flare: k, head: [-2, -2] }); }
    else if (tt < w + ac) Object.assign(p, { lean: 11, crouch: 5, hand: [19, -8], far: [14, -9], flare: 1, swing: clamp((tt - w) / ac), head: [3, 3] });
    else Object.assign(p, { lean: lerp(11, 3, ease(rr)), crouch: Math.round(5 * (1 - rr)) + 2, hand: mix([19, -8], HANG, ease(rr)), far: mix([14, -9], FARHANG, ease(rr)), swing: rr < 0.3 ? 1 : null });
  } else if (move === 'leeches') {
    // A hand to its own chest, plucking; the arm wound back; then flung.
    const f0 = w - 0.35;
    if (tt < w * 0.45) { const k = ease(clamp(tt / (w * 0.45))); Object.assign(p, { lean: 1, hand: mix(HANG, [3, -24], k), far: mix(FARHANG, [-3, -22], k), head: [1, 3], pluck: k * 0.8, flare: k * 0.4 }); }
    else if (tt < f0) { const k = ease(clamp((tt - w * 0.45) / Math.max(0.05, f0 - w * 0.45))); Object.assign(p, { lean: lerp(1, -5, k), hand: mix([3, -24], [-9, -30], k), far: mix([-3, -22], FARHANG, k), pluck: 1, flare: 0.5 + k * 0.5 }); }
    else if (tt < w) { const k = (tt - f0) / 0.35; Object.assign(p, { lean: lerp(-5, 9, ease(k)), hand: mix([-9, -30], [19, -26], ease(k)), pluck: k < 0.45 ? 1 : 0, fling: clamp((k - 0.15) / 0.85), flare: 1 }); }
    else Object.assign(p, { lean: lerp(9, 3, ease(rr)), hand: mix([19, -26], HANG, ease(rr)), fling: tt < w + ac ? 1 : null });
  } else if (move === 'peat') {
    // Down to the bank for a slab, up over its head, and heaved down the lane.
    const fly = w - 0.4;
    if (tt < w * 0.3) { const k = ease(clamp(tt / (w * 0.3))); Object.assign(p, { crouch: 2 + Math.round(8 * k), lean: 3 + 6 * k, hand: mix(HANG, [12, -2], k), far: mix(FARHANG, [8, -2], k), head: [3, 4] }); }
    else if (tt < fly) { const k = ease(clamp((tt - w * 0.3) / Math.max(0.1, fly - w * 0.3))); Object.assign(p, { crouch: Math.round(lerp(10, 1, k)), lean: lerp(9, -6, k), hand: mix([12, -2], [6, -39], k), far: mix([8, -2], [0, -37], k), slab: { held: k }, head: [-1, -2], flare: k }); }
    else if (tt < w) { const k = clamp((tt - fly) / 0.4); Object.assign(p, { crouch: 3, lean: lerp(-6, 10, ease(k)), hand: mix([6, -39], [19, -16], ease(k)), far: mix([0, -37], [14, -14], ease(k)), slab: k < 0.12 ? { held: 1 } : { fly: k }, flare: 1, head: [2, 2] }); }
    else Object.assign(p, { crouch: Math.round(3 * (1 - rr)) + 2, lean: lerp(10, 3, ease(rr)), hand: mix([19, -16], HANG, ease(rr)), far: mix([14, -14], FARHANG, ease(rr)), flare: 0.5 });
  } else {
    // The wade-in blow: an arm wound back over its shoulder, then round in a wide swing.
    if (tt < w) { const k = ease(clamp(tt / w)); Object.assign(p, { lean: lerp(3, -6, k), crouch: 2 + Math.round(2 * k), hand: mix(HANG, [-8, -36], k), far: mix(FARHANG, [-10, -14], k), flare: k }); }
    else if (tt < w + ac) Object.assign(p, { lean: 10, crouch: 4, hand: [21, -14], far: [-8, -12], swing: clamp((tt - w) / ac), flare: 1 });
    else Object.assign(p, { lean: lerp(10, 3, ease(rr)), crouch: 4, hand: mix([21, -14], HANG, ease(rr)), far: FARHANG, swing: rr < 0.3 ? 1 : null });
  }
  return p;
}
