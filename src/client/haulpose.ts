/**
 * How the Haulier stands this frame (drawn by client/hauldraw.ts). Read from what the room sends (its
 * blow and clock, boss.move, downUntil, stagUntil, roarUntil) and nothing else: drawing never changes
 * the fight. Angles and offsets are for a Haulier facing right; the drawing mirrors them.
 */
import type { Enemy } from '../sim/types';
import { ease } from './draw';

export const PAL = {
  skin: '#6f9c3c', skinLo: '#466f28', skinHi: '#93bf55', iron: '#5e5a58', ironHi: '#9a968f', ironLo: '#34302f',
  rust: '#6a4632', rivet: '#b8b4ac', wood: '#5a3d22', leather: '#3e2c1e', eye: '#d8ff60', eyeMad: '#ff6a30',
};

export interface HPose {
  ox: number; oy: number; sway: number; lean: number; crouch: number;
  step: number; moving: boolean;
  pickA: number; hand: [number, number]; stuck: boolean;
  headBack: number; roar: boolean; arms: 'pick' | 'up' | 'low';
  whirl: { r: number; sp: number } | null;
  dig: boolean; stars: boolean; reel: boolean;
  /** Down on its back: 0 upright, else how far along the fall and rise (see haullie.ts). */
  lie: 'none' | 'down' | 'sit' | 'knee';
  /** The jolt after the cart: seconds into the fall. */
  fallT: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const CARRY: [number, number] = [9, -11];
const mix = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

export function haulPose(e: Enemy, t: number, now: number): HPose {
  const b = e.boss!, a = e.attack;
  const p: HPose = { ox: 0, oy: 0, sway: 0, lean: 0, crouch: 0, step: 0, moving: !!e.moving, pickA: -2.0, hand: CARRY, stuck: false, headBack: 0, roar: false, arms: 'pick', whirl: null, dig: false, stars: false, reel: false, lie: 'none', fallT: 0 };
  const ph = now * 4.2 + e.id;
  if (p.moving) (p.step = Math.sin(ph)), (p.oy = -Math.round(Math.abs(Math.sin(ph)))), (p.sway = Math.round(Math.sin(ph * 0.5) * 1.5)), (p.lean = 1);
  const down = (b.downUntil ?? -9) - t;
  if (e.act === 'dead') return { ...p, lie: 'down', moving: false, step: 0, oy: 0, sway: 0 };
  if (down > 0) {
    p.moving = false, p.step = 0, p.oy = 0, p.sway = 0;
    p.lie = down > 0.6 ? 'down' : down > 0.4 ? 'sit' : 'knee';
    p.fallT = Math.max(0, 1.4 - down);
    return p;
  }
  if ((b.stagUntil ?? -9) > t) return { ...p, reel: true, stars: true, ox: Math.round(Math.sin(now * 13) * 2), lean: -3, headBack: 2, pickA: 1.0, hand: [8, -9], arms: 'low', step: Math.sin(now * 9), moving: false };
  if ((b.roarUntil ?? -9) > t) return { ...p, roar: true, ox: Math.round(Math.sin(now * 40)), lean: -2, headBack: 3, pickA: -1.57, hand: [7, -25], arms: 'up', moving: false, step: 0 };
  if (!a) return p;
  const w = a.windup, ac = a.active + 0.1, tt = a.t, left = w + a.active + a.recover - tt;
  const move = b.move ?? (a.kind === 'slam' ? 'overhead' : 'pick');
  p.moving = false, p.step = 0, p.oy = 0, p.sway = 0;
  const rr = Math.min(1, Math.max(0, (tt - w - ac) / a.recover));
  if (move === 'pick') {
    if (tt < w) { const k = ease(tt / w); Object.assign(p, { pickA: lerp(-2.0, -2.9, k), hand: mix(CARRY, [6, -18], k), lean: -2 * k }); }
    else if (tt < w + ac) { const k = (tt - w) / ac; Object.assign(p, { pickA: lerp(-2.9, 0.5, k), hand: mix([6, -18], [11, -12], k), lean: -2 + 6 * k }); }
    else { const k = rr < 0.6 ? 0 : ease((rr - 0.6) / 0.4); Object.assign(p, { pickA: lerp(0.5, -2.0, k), hand: mix([11, -12], CARRY, k), lean: 4 * (1 - k), crouch: 1 - k }); }
  } else if (move === 'overhead') {
    const UP: [number, number] = [7, -25];
    if (tt < w) { const k = tt / w; Object.assign(p, { pickA: k < 0.35 ? lerp(-2.0, -1.57, k / 0.35) : -1.57, hand: mix(CARRY, UP, ease(Math.min(1, k * 1.5))), lean: -1, arms: k > 0.3 ? 'up' : 'pick', oy: -1 }); if (w - tt < 0.25) p.ox = Math.round(Math.sin(now * 50)); }
    else if (tt < w + ac) { const k = (tt - w) / ac; Object.assign(p, { pickA: lerp(-1.57, 1.15, k), hand: mix(UP, [9, -10], k), lean: 6 * k, crouch: 2 * k }); }
    else {
      Object.assign(p, { stuck: true, pickA: 1.15, hand: [9, -10], lean: 6, crouch: 3 });
      // The last beat: it hauls the pick free, hitching.
      if (left < 0.7) { const k = left / 0.7; Object.assign(p, { pickA: 1.15 - 0.2 * Math.sin(now * 28), ox: Math.round(Math.sin(now * 34) * (1 + k)), crouch: 3 + Math.round(Math.sin(now * 28)) }); }
    }
  } else if (move === 'shove') {
    const k = Math.min(1, tt / w);
    Object.assign(p, { pickA: 2.4, hand: [4, -8], arms: 'low' });
    if (tt < w) Object.assign(p, { lean: -1 - 2 * ease(k), crouch: 1 + 2 * ease(k), dig: true });
    else if (tt < w + ac) Object.assign(p, { lean: 7, crouch: 3 });
    else Object.assign(p, { lean: 7 * (1 - ease(rr)), crouch: 3 * (1 - ease(rr)) });
  } else {
    // The chain drag: the pick tucked on the shoulder, the chain whirled round it.
    if (tt < w) { const k = ease(tt / w); Object.assign(p, { whirl: { r: lerp(7, 21, k), sp: lerp(5, 16, k) }, crouch: 1 }); }
    else if (tt < w + ac) p.whirl = { r: 26, sp: 18 }, (p.lean = Math.round(Math.sin(now * 18)));
    else { const k = ease(rr); p.whirl = { r: lerp(26, 6, k), sp: lerp(18, 3, k) }; }
  }
  return p;
}
