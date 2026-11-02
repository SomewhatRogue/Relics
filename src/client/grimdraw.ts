/**
 * The goblins' leavings that move, drawn with the actors (sorted by their foot): one hung by the
 * ankles from a rafter hook like meat, opened, turning slowly and dripping; and the cook-pot on their
 * fire, simmering, with what's in it showing over the rim. The rest is painted once (grimpaint.ts).
 */
import type { Grim } from '../shared/arena';
import type { Ctx } from './draw';
import { BLOOD, BONE, GUT, SKIN } from './grimpaint';

/** Fill on the lit layer and wipe the glow under it, as a sprite does. */
function solid(c: Ctx, x: number, y: number, w: number, h: number, col: string): void {
  c.lit.fillStyle = col;
  c.lit.fillRect(Math.round(x), Math.round(y), w, h);
  c.glow.clearRect(Math.round(x), Math.round(y), w, h);
}

/** (x, y): the spot on the floor under it, on screen. */
export function drawHung(c: Ctx, q: Grim, x: number, y: number): void {
  const t = c.now * 0.7 + q.k, sway = (row: number) => Math.round(Math.sin(t) * row * 0.06), cloth = ['#5a4a3a', '#4a5a6a', '#6a5a48', '#5a3a3a'][q.k % 4];
  const top = y - 50;
  // The rope up into the dark, the hook, the ankles bound.
  for (let r = 0; r < 8; r++) solid(c, x, top - r * 2, 1, 2, '#8a7a5a');
  solid(c, x - 2, top + 1, 5, 1, '#57525e');
  const row = (r: number, dx: number, w: number, col: string) => solid(c, x + dx + sway(r), top + r, w, 1, col);
  for (let r = 2; r < 5; r++) row(r, -2, 5, '#8a7a5a');
  for (let r = 4; r < 13; r++) row(r, -3, 2, cloth), row(r, 2, 2, cloth);
  // The body hanging head down, split from the groin to the chest, emptied.
  for (let r = 13; r < 25; r++) {
    row(r, -3, 7, cloth);
    if (r > 13 && r < 23) row(r, -1, 3, r % 3 ? '#2e0a0a' : '#6a1010'), row(r, -2, 1, '#6a1212'), row(r, 2, 1, '#6a1212');
    if (r > 14 && r < 22 && r % 2) row(r, -3, 1, BONE[0]), row(r, 3, 1, BONE[0]);
  }
  // Arms hanging past the head, the hands open.
  for (let r = 22; r < 33; r++) row(r, -5, 2, r > 29 ? SKIN[0] : cloth), row(r, 4, 2, r > 29 ? SKIN[0] : cloth);
  for (let r = 25; r < 29; r++) row(r, -2, 4, SKIN[0]);
  row(26, -1, 1, '#14100c'), row(26, 1, 1, '#14100c'), row(29, -2, 4, q.k % 2 ? '#2a1a10' : '#5a4a2a'), row(30, -1, 2, q.k % 2 ? '#2a1a10' : '#5a4a2a');
  // What's still coming off it.
  const p = (c.now * 0.9 + q.k * 0.37) % 1;
  if (p < 0.8) solid(c, x + sway(31), top + 31 + p * 18, 1, 1, BLOOD[2]);
  if (q.k % 3 === 0) for (let r = 20; r < 27; r++) row(r, 1 - (r % 2), 1, GUT[r % 3]);
}

/** (x, y): the goblins' fire's foot, on screen (the pot sits on the coals). */
export function drawPot(c: Ctx, q: Grim, x: number, y: number): void {
  const top = y - 14;
  // Iron, black with soot, a rim catching the fire, broth inside, and in it, a hand or a foot.
  for (let r = 0; r < 8; r++) {
    const half = r < 1 ? 6 : r < 6 ? 6 - Math.floor((r - 1) / 3) : 4 - (r - 6);
    solid(c, x - half, top + r, half * 2 + 1, 1, r === 0 ? '#57525e' : r < 3 ? '#2a2630' : '#1e1a22');
  }
  solid(c, x - 5, top + 1, 11, 1, '#4a2a1a');
  if (Math.floor(c.now * 3 + q.k) % 2) solid(c, x - 3 + (q.k % 5), top + 1, 1, 1, '#7a4a2a');
  if (q.k % 2) {
    // An arm over the rim, fingers curled.
    for (let k = 0; k < 6; k++) solid(c, x + 2 + Math.floor(k / 2), top - k + 1, 1, 1, k > 3 ? SKIN[1] : SKIN[0]);
    solid(c, x + 5, top - 6, 2, 1, SKIN[1]), solid(c, x + 6, top - 5, 1, 1, SKIN[1]);
  } else {
    // A leg bone, the foot still on it.
    for (let k = 0; k < 6; k++) solid(c, x - 3 - Math.floor(k / 3), top - k + 1, 1, 1, BONE[0]);
    solid(c, x - 7, top - 6, 3, 2, SKIN[1]);
  }
  // Steam.
  c.lit.fillStyle = '#8a8494';
  for (let i = 0; i < 3; i++) {
    const s = (c.now * 0.5 + i / 3 + q.k * 0.1) % 1;
    c.lit.globalAlpha = 0.35 * (1 - s);
    c.lit.fillRect(Math.round(x - 3 + i * 3 + Math.sin(s * 6 + i) * 2), Math.round(top - 3 - s * 16), 2, 1);
  }
  c.lit.globalAlpha = 1;
  // The fire licking up round it.
  for (const s of [-1, 1]) if (Math.floor(c.now * 9 + s) % 3) (c.glow.fillStyle = s < 0 ? '#ffb44c' : '#ff7a28'), c.glow.fillRect(Math.round(x + s * 6), Math.round(top + 6), 1, 2);
}
