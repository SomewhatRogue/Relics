/**
 * A hound going up or down the screen (Kyle, 2026-11-25: "dog doesn't have an up and down run"): seen
 * from the front, coming at you, or from behind, going away, in a walk, trot or run. The same pieces as
 * houndbody.ts's side view (a letter grid in HOUND_BOX, a breed's Shape, the coat's letters, its white),
 * the same four frames a gait and the same bob, so it turns between views without a hitch. hound.ts
 * chooses it when a moving hound faces more up or down than across. Pure, like houndMap.
 */
import type { HoundLook } from '../shared/houndlook';
import { hasBlaze, hasSocks, palOf } from './houndcoats';
import { patternOn, type HoundMap } from './houndbody';
import { Grid } from './houndgrid';
import { HOUND_BOX as BOX, SHAPES, type Shape } from './houndshapes';
import type { Gait } from './houndposes';
import type { Part } from './sprites';

export type HoundView = 'front' | 'back';

/** How a gait moves seen end on, frame `f` of 4: the body's bob (pixels up), and each side's foot lifted (left, right). */
function stride(g: Gait, f: number): { bob: number; up: [number, number] } {
  f = ((f % 4) + 4) % 4;
  if (g === 'run') return { bob: [2, 0, 0, 2][f], up: f === 0 || f === 3 ? [1, 1] : f === 1 ? [3, 0] : [0, 3] };
  const h = g === 'trot' ? 2 : 1;
  return { bob: g === 'trot' ? f % 2 : 0, up: f === 0 ? [h, 0] : f === 2 ? [0, h] : [0, 0] };
}

/** A leg straight down from (x, top) to the ground, `w` wide, its foot `up` off it; socks and toes as the side view has them. */
function leg(gr: Grid, look: HoundLook, x: number, top: number, w: number, up: number, ch: string): void {
  const foot = BOX.ground - up, socks = hasSocks(look.mark), far = ch === 'D';
  for (let y = top; y <= foot; y++) for (let i = 0; i < w; i++) {
    const low = y >= foot - 1;
    gr.set(x + i, y, socks && low ? (far ? 'w' : 'W') : look.breed === 'hillhound' && low && !far ? 'P' : look.breed === 'collie' && y === foot && !far ? 'P' : ch);
  }
}

/** The ears end on: folded back (rose), hanging at the cheeks (drop), or up with the tips over (semi); laid back running. */
function ears(gr: Grid, s: Shape, l: number, r: number, top: number, back: boolean): void {
  if (s.ear === 'drop') for (let y = top + 1; y <= top + 4; y++) gr.set(l - 1, y, 'D'), gr.set(r + 1, y, 'D'), y > top + 1 && (gr.set(l, y, 'D'), gr.set(r, y, 'D'));
  else if (s.ear === 'semi' && !back) gr.set(l + 1, top - 1, 'D'), gr.set(r - 1, top - 1, 'D'), gr.set(l + 1, top - 2, 'D'), gr.set(r - 1, top - 2, 'D'), gr.set(l, top - 3, 'D'), gr.set(r, top - 3, 'D');
  else gr.set(l, top, 'D'), gr.set(r, top, 'D'), gr.set(l - 1, top + 1, 'D'), gr.set(r + 1, top + 1, 'D');
}

/** Coming at you: the chest, the front legs swinging under it, the hind ones darker between, and the face. */
function front(gr: Grid, s: Shape, look: HoundLook, g: Gait, f: number): void {
  const G = BOX.ground, mid = BOX.x, { bob, up } = stride(g, f), half = Math.floor((s.depth + 5) / 2);
  const under = G - s.leg - bob, top = under - s.depth + 1, lw = Math.max(2, s.legW - 1);
  // The hind legs, far and dark, between the front ones, in the other step.
  leg(gr, look, mid - 2, under + 2, 1, up[1], 'D'), leg(gr, look, mid + 2, under + 2, 1, up[0], 'D');
  // The chest, rounded at the shoulders, light (or white, or tan) down the middle.
  const chest = hasBlaze(look.mark) ? 'W' : look.breed === 'hillhound' || s.ruff ? 'P' : 'L';
  for (let y = top; y <= under; y++) for (let x = mid - half; x <= mid + half; x++) {
    // (Rounded: the shoulders fall away two pixels at the top, a pixel at the bottom.)
    const edge = Math.abs(x - mid), corner = (y === top && edge >= half - 1) || (y === top + 1 && edge === half) || (y === under && edge === half);
    if (!corner) gr.set(x, y, edge <= 1 && y > top + 1 ? chest : 'B');
  }
  leg(gr, look, mid - half + 1, under, lw, up[0], 'B'), leg(gr, look, mid + half - lw, under, lw, up[1], 'B');
  // The face, its chin over the chest: brow, eyes, cheeks, the muzzle and nose, the chin (a beard, a ruff).
  const hw = s.skull[0] + 2 + ((s.skull[0] + 2) % 2 === 0 ? 1 : 0), l = mid - (hw >> 1), r = mid + (hw >> 1), h0 = top - 5;
  const rows = [
    (x: number) => (x === l || x === r ? '' : 'B'),
    (x: number) => (s.rough && Math.abs(x - mid) === 2 ? 'R' : 'B'),
    (x: number) => (Math.abs(x - mid) === 2 ? 'E' : x === mid && hasBlaze(look.mark) ? 'W' : 'B'),
    (x: number) => (Math.abs(x - mid) <= 1 ? (x === mid && hasBlaze(look.mark) ? 'W' : 'M') : 'B'),
    (x: number) => (x === mid ? 'N' : Math.abs(x - mid) <= 1 ? 'M' : x === l || x === r ? '' : 'B'),
    (x: number) => (Math.abs(x - mid) <= 1 ? (s.rough ? 'R' : s.ruff ? 'P' : 'M') : ''),
  ];
  const tan = look.breed === 'hillhound';
  rows.forEach((row, j) => { for (let x = l; x <= r; x++) { const ch = row(x); if (ch) gr.set(x, h0 + j, ch === 'M' ? (tan ? 'P' : 'L') : ch); } });
  // A collie's white ruff round under the jaw.
  if (s.ruff) for (let x = l; x <= r; x++) gr.set(x, top, 'P');
  ears(gr, s, l, r, h0, g === 'run');
}

/** Going away: the rump, the hind legs, the tail carried the breed's way, and the back of the head over it. */
function back(gr: Grid, s: Shape, look: HoundLook, g: Gait, f: number, wag: number, tuck: boolean): void {
  const G = BOX.ground, mid = BOX.x, { bob, up } = stride(g, f), half = Math.floor((s.depth + 4) / 2);
  const under = G - s.leg - bob, top = under - s.depth + 1, lw = Math.max(2, s.legW - 1);
  // The front legs, far and dark, between the hind ones.
  leg(gr, look, mid - 2, under + 1, 1, up[1], 'D'), leg(gr, look, mid + 2, under + 1, 1, up[0], 'D');
  // The back of the head and the neck, smaller for being further off.
  const hw = s.skull[0] + (s.skull[0] % 2 === 0 ? 1 : 0), l = mid - (hw >> 1), r = mid + (hw >> 1), h0 = top - 4;
  // The skull, then a narrower neck, dark at the nape, so it reads as a head over the back and not a hood.
  for (let y = h0; y < top - 1; y++) for (let x = l; x <= r; x++) if (!(y === h0 && (x === l || x === r))) gr.set(x, y, 'B');
  for (let x = l + 1; x < r; x++) gr.set(x, top - 1, s.ruff ? 'P' : 'D');
  ears(gr, s, l, r, h0, g === 'run');
  // Ears from behind stand out past the skull (a hill hound's hang already).
  if (s.ear !== 'drop') gr.set(l - 1, h0, 'D'), gr.set(r + 1, h0, 'D'), gr.set(l - 1, h0 - 1, 'D'), gr.set(r + 1, h0 - 1, 'D');
  // The rump, rounded, the thighs either side and the light between them.
  for (let y = top; y <= under; y++) for (let x = mid - half; x <= mid + half; x++) {
    const edge = Math.abs(x - mid), corner = (y === top && edge >= half - 1) || (y === top + 1 && edge === half);
    if (!corner) gr.set(x, y, y === under && edge <= 1 ? 'L' : 'B');
  }
  if (s.rough) for (let x = mid - half + 1; x < mid + half; x += 3) gr.set(x, top - 1, 'R');
  leg(gr, look, mid - half, under, lw + 1, up[0], 'B'), leg(gr, look, mid + half - lw, under, lw + 1, up[1], 'B');
  // The thighs' inner edges in shadow, down from the rump, so the hind legs part from it.
  for (let y = top + 2; y <= under; y++) gr.set(mid - half + lw + 1, y, 'D'), gr.set(mid + half - lw - 1, y, 'D');
  // The tail from the top of the rump: tucked between the legs, a sabre up (a hill hound's), or hanging; it wags side to side.
  const sway = Math.round(wag / 8), n = Math.max(3, Math.round(s.tail.len * 0.6)), tip = s.ruff ? 'P' : 'B';
  if (tuck) for (let j = 0; j < n; j++) gr.set(mid, top + 1 + j, 'D');
  else if (s.tail.base > 0) for (let j = 0; j < n + (g === 'run' ? -1 : 0); j++) gr.set(mid + Math.round((sway * j) / n), top - 1 - j, j === n - 1 ? tip : 'B');
  else if (g === 'run') for (let j = 0; j < 3; j++) gr.set(mid + Math.round((sway * j) / 3), top - j, 'B');
  else {
    // Hanging: down the rump (dark along it, so it shows on the coat) and on into the gap between the hind legs, swinging.
    const m = under - top + 3;
    for (let j = 0; j < m; j++) {
      const x = mid + Math.round((sway * j) / m), y = top + 1 + j, on = y <= under;
      gr.set(x, y, j === m - 1 ? tip : on ? 'D' : 'B');
      if (s.tail.thick === 2) gr.set(x + 1, y, on ? 'D' : 'B');
    }
  }
}

/** The pixel map for a hound seen end on, in gait `g` at frame `f`, wagging `wag` degrees; `tuck`: bolting. */
export function houndFacing(look: HoundLook, view: HoundView, g: Gait, f: number, wag = 0, tuck = false): HoundMap {
  const gr = new Grid(), s = SHAPES[look.breed], pal = palOf(look.breed, look.coat);
  if (view === 'front') front(gr, s, look, g, f);
  else back(gr, s, look, g, f, wag, tuck);
  patternOn(gr, look);
  const parts: Part[] = [];
  gr.g.forEach((row, y) => row.forEach((ch, x) => ch && parts.push(['p', x, y, pal[ch as keyof typeof pal]])));
  // Where hound.ts hangs a tongue, a stick or a closed eye: the chin, the muzzle, an eye (drawn only from the front).
  const top = BOX.ground - s.leg - stride(g, f).bob - s.depth + 1;
  return { parts, at: { jaw: [BOX.x - 2, top], tip: BOX.x + 1, eye: [BOX.x - 2, top - 3], top: top - 8 }, clipped: gr.clipped };
}
