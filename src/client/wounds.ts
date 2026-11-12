/**
 * Injury you can see on the tough ones (Kyle, 2026-11-11: "if they're more injured they look it before you
 * slice them in half"): elites, BIG ONEs, named goblins, instance goblins with extra health, every butcher.
 * Plain one-hit goblins stay clean. Drawn from the room's own health share, so everyone sees the same:
 * - hurt (under two thirds): cuts across the body, blood running from them;
 * - badly hurt (under a third): more and deeper cuts, an eye put out (its glow gone), blood down the legs,
 *   a limp in the walk and a heave in the breath.
 * Each goblin's wounds sit in the same places every frame (seeded by its id). Lit layer (they're matter),
 * but for the eye. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { SCRAPPER } from '../shared/tuning';
import type { Ctx } from './draw';
import { LAYOUT } from './figure';
import type { BodyPose } from './motion';

/** Where on a body (its sprite's own pixels, before the outline): torso, arm, head and leg boxes, and its eyes. */
/** `skin`: x ranges of bare hide across the torso (a butcher's apron would hide a cut). */
interface Body { torso: number[]; arm: number[]; head: number[]; legs: number[][]; eyes: number[][]; skin?: number[][] }
/** A small goblin (17 by 20), or `k` times as big (Rakehead's four). */
const SMALL = (k: number): Body => {
  const r = (v: number) => Math.round(v * k);
  return { torso: [4, 10, 12, 13].map(r), arm: [2, 10, 2, 13].map(r), head: [5, 2, 12, 8].map(r), legs: [[4, 15, 6, 18].map(r), [10, 15, 12, 18].map(r)], eyes: [[6, 5].map(r), [10, 5].map(r)] };
};
/** A butcher, its head row (`hy`: heavy 7, hunched 10, lean 5) and size (a Doorkeeper's 1.15). */
const BIG = (hy: number, k: number): Body => {
  const r = (v: number) => Math.round(v * k);
  return { skin: [[3, 7], [19, 23]].map((s) => s.map(r)), torso: [3, 12, 23, 24].map(r), arm: [1, 16, 4, 22].map(r), head: [9, hy - 4, 18, hy + 3].map(r), legs: [[8, 26, 11, 30].map(r), [16, 26, 19, 30].map(r)], eyes: [[11, hy - 1].map(r), [16, hy - 1].map(r)] };
};

/** Tough enough to show its wounds. */
export const tough = (e: Enemy) => e.kind === 'butcher' || !!e.elite?.length || !!e.big || !!e.name || e.maxHp > SCRAPPER.hp * 1.6;

/** 0 whole, 1 hurt, 2 badly hurt (for the tough ones; 0 for anything else, or dead). */
export function hurtStage(e: Enemy): 0 | 1 | 2 {
  if (!tough(e) || e.act === 'dead' || e.maxHp <= 0) return 0;
  const s = e.hp / e.maxHp;
  return s < 1 / 3 ? 2 : s < 2 / 3 ? 1 : 0;
}

/** Badly hurt: a limp when it walks (one step short, a lean onto the good side), a heave when it stands. Before layout. */
export function hurtPose(p: BodyPose, e: Enemy, now: number): void {
  if (hurtStage(e) < 2 || p.phase !== 'rest') return;
  const side = e.id % 2 ? 1 : -1;
  // Down hard on the bad leg, up off the good one; a lean onto it.
  const step = Math.floor(now * 7 + e.id) % 4;
  if (e.moving) (p.oy = step === 1 ? 1 : step === 3 ? -1 : 0), (p.lean += side);
  else if ((now + e.id * 0.37) % 1.1 < 0.35) p.crouch -= 0.06;
}

/** A small steady random in [0, 1) from the goblin and a slot. */
const rnd = (id: number, i: number) => (((id * 2654435761 + i * 40503) >>> 0) % 1000) / 1000;

/**
 * The wounds over a body just drawn by drawFigure (it reads LAYOUT): `w` the sprite's canvas width, `kind`
 * which body, `hy` and `k` a butcher's head row and size.
 */
export function drawWounds(c: Ctx, e: Enemy, w: number, small: boolean, hy = 7, k = 1): void {
  const st = hurtStage(e);
  if (!st) return;
  const b = small ? SMALL(k) : BIG(hy, k), L = LAYOUT, half = Math.round(L.lean / 2), g = c.lit;
  // A body pixel to the screen (as figure.ts places the torso; the head leans the whole way, legs not at all).
  const at = (sx: number, sy: number, part: 'torso' | 'head' | 'legs'): [number, number] => {
    const dx = part === 'head' ? L.lean : part === 'legs' ? 0 : half, dy = part === 'legs' ? Math.min(0, L.drop) : L.drop;
    return [(L.flip ? L.left + w - 2 - sx : L.left + 1 + sx) + dx, L.top + 1 + sy + dy];
  };
  const inBox = (box: number[], i: number): [number, number] => {
    const y = box[1] + Math.floor(rnd(e.id, i + 50) * (box[3] - box[1] + 1));
    // On the bare hide either side of an apron (above it, the shoulders are bare too).
    if (b.skin && box === b.torso && y >= box[1] + 3) {
      const s = b.skin[i % 2];
      return [s[0] + Math.floor(rnd(e.id, i) * (s[1] - s[0] + 1)), y];
    }
    return [box[0] + Math.floor(rnd(e.id, i) * (box[2] - box[0] + 1)), y];
  };
  const cut = (box: number[], part: 'torso' | 'head' | 'legs', i: number, len: number) => {
    const [sx, sy] = inBox(box, i), [x, y] = at(sx, sy, part), down = rnd(e.id, i + 9) < 0.5 ? 1 : -1, f = L.flip ? -1 : 1;
    for (let j = 0; j < len; j++) (g.fillStyle = j === 0 || j === len - 1 ? '#5a0c0c' : '#8a1414'), g.fillRect(x + f * j, y + down * Math.round(j * 0.6), 1, 1);
    // Blood running from it, a drop at a time.
    const run = (c.now * (0.8 + rnd(e.id, i + 3)) + rnd(e.id, i + 7)) % 1;
    g.fillStyle = '#6a1010';
    g.fillRect(x + f, y + 1, 1, 1 + Math.round(run * (small ? 2 : 4)));
  };
  const n1 = small ? 2 : 3;
  for (let i = 0; i < n1; i++) cut(b.torso, 'torso', i, small ? 3 : 4);
  if (st < 2) return;
  for (let i = 0; i < n1; i++) cut(b.torso, 'torso', 10 + i, small ? 4 : 6);
  cut(b.arm, 'torso', 20, 3);
  cut(b.head, 'head', 21, small ? 2 : 3);
  // Blood down the legs.
  for (const [li, leg] of b.legs.entries()) {
    const [x, y] = at(leg[0] + 1, leg[1], 'legs');
    g.fillStyle = '#5a0c0c';
    g.fillRect(x, y, 1, leg[3] - leg[1] - (li + (e.id % 2)));
  }
  // An eye put out: its glow covered, a dark wet socket (facing you only).
  if (e.fy < -0.55) return;
  const [ex, ey] = b.eyes[e.id % 2], [x, y] = at(ex, ey, 'head');
  c.glow.fillStyle = '#3a0606';
  c.glow.fillRect(x, y, 1, 1);
}
