/**
 * The public works' crew at it, drawn over their sprite (npcs.ts): a broom going at the cobbles with
 * a little dust, planks on the shoulder up to the stall and laid on the stack, a shovel into a barrow
 * at the rubble and the barrow tipped on the heap. (x, y) their feet on screen; fx the way they walked
 * in (their sprite faces it); `walking` false while they stop to work. Paint only.
 */
import type { Npc } from '../shared/arena';
import type { Ctx } from './draw';

/** The kinds of work this file draws. */
export const CREW = new Set<NonNullable<Npc['work']>>(['sweep', 'haul', 'shovel']);

const HAFT = '#6b4a2b', STRAW = '#a08a50', PLANK = '#8b6a3a', PLANK_D = '#5a3d22', IRON = '#8a8f9a', STONE = ['#6a647a', '#57525e', '#7a7488'];

export function drawCrew(c: Ctx, n: Npc, x: number, y: number, fx: number, walking: boolean): void {
  const g = c.lit, t = c.now + n.x * 1.3, f = fx < 0 ? -1 : 1, X = Math.round(x), Y = Math.round(y);
  const r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + dx, Y + dy, w, h));
  if (n.work === 'sweep') {
    if (walking) {
      // The broom over the shoulder, head up behind.
      for (let i = 0; i < 9; i++) r(-f * i * 0.6 + f * 2, -12 - i, 1, 1, HAFT);
      return r(-f * 6 - 2, -24, 4, 3, STRAW);
    }
    // At the cobbles: the head going side to side, the handle following it, dust kicked up.
    const k = Math.sin(t * 5), hx = Math.round(f * 5 + k * 3);
    for (let i = 0; i < 10; i++) r(Math.round(f * 3 + (hx - f * 3) * (i / 9)), -11 + i, 1, 1, HAFT);
    r(hx - 2, -2, 5, 2, STRAW), r(hx - 1, -1, 3, 1, '#7a6a3a');
    if (Math.abs(k) > 0.7) for (let i = 0; i < 3; i++) r(hx + Math.round(k * (3 + i * 2)), -1 - i, 1, 1, '#8a8494');
    return;
  }
  if (n.work === 'haul') {
    // Two planks under the arm up to the stall (walking north, fx < 0 on this round), back empty.
    const loaded = walking ? fx < 0 : true, x0 = f > 0 ? -8 : -14;
    if (walking && loaded) return r(x0, -9, 22, 2, PLANK), r(x0, -7, 22, 2, PLANK_D), r(f > 0 ? 13 : -14, -9, 1, 4, '#b8946a');
    if (walking) return;
    // Stopped: laying a plank on the stack by the stall, or lifting one off the cart.
    const k = (t * 0.6) % 1, laying = fx < 0, up = laying ? 1 - k : k, py = Math.round(-3 - up * 11);
    if (laying) for (let i = 0; i < 3; i++) r(f * 4 - 2, -1 - i * 2, 14, 2, i % 2 ? PLANK_D : PLANK);
    return r(f * 3 - 6, py, 14, 2, PLANK), r(f * 3 - 6, py + 2, 14, 1, PLANK_D);
  }
  if (n.work === 'shovel') {
    // The barrow: in front while walking, full on the way to the heap (west), empty coming back.
    const bx = walking ? f * 10 : -f * 10, full = walking ? fx < 0 : fx > 0, tip = !walking && fx < 0;
    barrow(c, X + (tip ? f * 10 : bx), Y, full || tip, tip ? (t * 0.7) % 1 : 0);
    if (walking || tip) return;
    // At the rubble: the blade in, then swung back to the barrow with a load.
    const k = (t * 0.55) % 1, out = k < 0.5, sx = out ? f * 7 : -f * 6, sy = out ? -2 : -9;
    for (let i = 0; i < 9; i++) r(Math.round(sx * (i / 8)), -11 + Math.round((sy + 11) * (i / 8)), 1, 1, HAFT);
    r(sx - 1, sy, 3, 3, IRON);
    if (!out) r(sx - 1, sy - 1, 3, 1, STONE[0]);
  }
}

/** A wooden barrow with one wheel; `full` heaped with stone; `tip` 0..1 tipping it (stones tumbling out). */
function barrow(c: Ctx, x: number, y: number, full: boolean, tip: number): void {
  const g = c.lit, lift = tip ? Math.round(Math.min(1, tip * 2) * 4) : 0;
  const r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(x + dx, y + dy, w, h));
  r(-3, -2, 2, 2, '#1e1610');
  r(-5, -6 - lift, 9, 3, '#5a3d22'), r(-5, -3 - lift, 9, 1, '#3a2818');
  r(3, -4, 4, 1, HAFT), r(6, -3, 1, 3, HAFT);
  if (full && tip < 0.5) for (let i = 0; i < 5; i++) r(-4 + i * 2, -7 - lift - (i % 2), 2, 1, STONE[i % 3]);
  // Tipped: stones falling and rolling off.
  if (tip) for (let i = 0; i < 4; i++) {
    const k = (tip + i * 0.25) % 1;
    r(-6 - Math.round(k * 4), -6 + Math.round(k * 6), 1, 1, STONE[i % 3]);
  }
}
