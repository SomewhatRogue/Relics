/**
 * A hound in a pose as a pixel map (houndgrid.ts pieces, a breed's Shape, a coat's letters), facing
 * right with its feet on HOUND_BOX's ground row. Pure: tests read the maps, hound.ts makes sprites of
 * them (sprites.ts shades and outlines them like a hero) and caches each one.
 *
 * Kinds: `stand` (every gait, sniffing, shaking, the fight's lunge, bite and latch, a play bow, a
 * leap), `sit`, `down` (lying, head on its paws or up), `scratch` (sat, a hind foot at its ear) and
 * `belly` (rolled on its back, legs in the air).
 */
import type { HoundLook } from '../shared/houndlook';
import { PATTERN, hasBlaze, hasSocks, palOf } from './houndcoats';
import { Grid, head, leg, tail, type HeadAt } from './houndgrid';
import { HOUND_BOX as BOX, SHAPES, type Shape } from './houndshapes';
import type { Part } from './sprites';

export interface Pose {
  kind: 'stand' | 'sit' | 'down' | 'scratch' | 'belly';
  /** Feet: near front, far front, near hind, far hind; each [shift toward the head, lift], pixels. */
  legs?: [number, number][];
  /** Body longer (a gallop's reach), rump up (`tilt`, a bow's), all off the ground, crouched, chest down. */
  stretch?: number; tilt?: number; lift?: number; crouch?: number; front?: number;
  head?: { dx?: number; dy?: number; low?: boolean; open?: boolean };
  ears?: 'back' | 'up';
  tail?: 'up' | 'run' | 'tuck' | 'ground'; wag?: number;
  /** Shaking off: the coat stood out off the back, alternate columns (1 or 2). */
  fluff?: number;
  /** Lying with its head up, not on its paws. */
  headUp?: boolean;
  /** Scratching: where the hind foot is (0 or 1); on its back, which pair of legs is up higher. */
  kick?: number;
}

export interface HoundMap { parts: Part[]; at: HeadAt; clipped: number }

function stand(gr: Grid, s: Shape, look: HoundLook, p: Pose): HeadAt {
  const G = BOX.ground, len = s.body + (p.stretch ?? 0), lift = p.lift ?? 0, crouch = p.crouch ?? 0, tilt = p.tilt ?? 0, front = p.front ?? 0;
  const hipX = BOX.x - Math.round(len / 2) - 1, shX = hipX + len, legs = p.legs ?? [[0, 0], [0, 0], [0, 0], [0, 0]];
  const botSh = G - s.leg - lift + crouch + front, botHip = G - s.leg - lift + crouch - tilt;
  const topSh = botSh - s.depth + 1, topHip = botHip - s.depth + 1, tuck = topHip + s.waist - 1;
  tail(gr, s, hipX - 1, topHip + (s.tail.base > 0 ? 0 : 1), p.tail, p.wag ?? 0);
  leg(gr, s, look, false, shX, botSh, legs[1][0], legs[1][1], lift, true);
  leg(gr, s, look, true, hipX + 2, botHip, legs[3][0], legs[3][1], lift, true);
  for (let x = hipX - 1; x <= shX + 1; x++) {
    const k = Math.max(0, Math.min(1, (x - hipX) / len));
    const top = Math.round(topHip + (topSh - topHip) * k) - (s.arch && k > 0.1 && k < 0.5 ? 1 : 0);
    const under = Math.round(tuck + (botSh - tuck) * Math.pow(k, 1.4));
    const t0 = x === hipX - 1 || x === shX + 1 ? top + 1 : top, u0 = x === hipX - 1 ? under - 1 : x === shX + 1 ? botSh - 1 : under;
    for (let y = t0; y <= u0; y++) gr.set(x, y, x === shX + 1 ? (hasBlaze(look.mark) ? 'W' : look.breed === 'hillhound' || s.ruff ? 'P' : 'L') : y === u0 && k > 0.35 ? 'L' : 'B');
    if ((s.rough && x % 4 === 2 && x < shX - 1) || (p.fluff && (x + p.fluff) % 2 === 0 && x <= shX)) gr.set(x, top - 1, 'R');
  }
  leg(gr, s, look, true, hipX + 1, botHip, legs[2][0], legs[2][1], lift, false);
  leg(gr, s, look, false, shX - 1, botSh, legs[0][0], legs[0][1], lift, false);
  const sh = s.skull[1], h = p.head ?? {};
  const hx = shX + 1 + (h.dx ?? 0), hy = h.low ? G - lift - sh - s.snout + 2 + (h.dy ?? 0) : topSh - s.neck - sh + 2 + (h.dy ?? 0);
  return head(gr, s, look, [shX - 2, topSh + 1], hx, hy, p.ears, h.open);
}

function sit(gr: Grid, s: Shape, look: HoundLook, p: Pose): HeadAt {
  const G = BOX.ground, x0 = BOX.x - 8, cx = BOX.x, top = G - s.leg - s.depth - 1, sh = s.skull[1];
  tail(gr, s, x0, G, 'ground', p.wag ?? 0);
  leg(gr, s, look, false, cx + 3, G - s.leg - 1, 0, 0, 0, true);
  gr.rect(x0, G - 5, 6, 5, 'B'), gr.rect(x0 + 1, G - 6, 4, 1, 'B');
  gr.line(x0 + 2, G - 5, cx, top, 'B', 4);
  gr.rect(cx, top, 5, G - s.leg - top, 'B');
  gr.line(cx + 4, top + 1, cx + 4, G - s.leg - 1, hasBlaze(look.mark) ? 'W' : look.breed === 'hillhound' || s.ruff ? 'P' : 'L');
  if (s.rough) gr.set(x0 + 1, G - 7, 'R'), gr.set(x0 + 4, G - 7, 'R'), gr.set(cx - 1, top - 1, 'R');
  if (p.kind === 'scratch') {
    // A hind foot up at the ear, going: the head tipped into it.
    const k = p.kick ?? 0, hx = cx + 2, hy = top - s.neck - sh + 2;
    const at = head(gr, s, look, [cx + 2, top + 1], hx, hy, 'back', false);
    gr.line(x0 + 3, G - 3, hx - 1 + k, hy + sh - k, 'B', 3);
    return at;
  }
  gr.rect(x0 + 4, G, 5, 1, 'B');
  leg(gr, s, look, false, cx + 2, G - s.leg - 1, 0, 0, 0, false);
  return head(gr, s, look, [cx + 2, top + 1], cx + 3 + (p.head?.dx ?? 0), top - s.neck - sh + 1 + (p.head?.dy ?? 0), p.ears, p.head?.open);
}

function down(gr: Grid, s: Shape, look: HoundLook, p: Pose): HeadAt {
  const G = BOX.ground, len = s.body, hipX = BOX.x - Math.round(len / 2) - 3, shX = hipX + len, top = G - Math.max(3, s.depth - 1) + 1, sh = s.skull[1];
  const paw = 4 + s.muzzle, socks = look.mark === 'socks' || look.mark === 'both';
  tail(gr, s, hipX - 1, G, 'ground', p.wag ?? 0);
  gr.rect(shX + 1, G - 1, paw, 1, 'D');
  gr.rect(hipX, top, len + 1, G - top + 1, 'B'), gr.rect(hipX - 1, top + 1, 1, G - top, 'B'), gr.rect(hipX + 2, top - 1, 5, 1, 'B');
  if (s.rough) for (let x = hipX + 5; x < shX; x += 4) gr.set(x, top - 1, 'R');
  gr.rect(shX + 1, G - 1, paw, 2, 'B'), gr.set(shX + paw, G, socks ? 'W' : look.breed === 'collie' ? 'P' : 'B');
  if (socks) gr.set(shX + paw - 1, G, 'W');
  const hy = p.headUp ? top - s.neck - sh + 2 : G - sh;
  return head(gr, s, look, [shX, top + 1], shX + 1, hy, p.ears, false);
}

/** Over on its back: the back along the floor, the pale belly up, four legs bent in the air and going, the head laid back. */
function belly(gr: Grid, s: Shape, look: HoundLook, p: Pose): HeadAt {
  const G = BOX.ground, len = s.body, hipX = BOX.x - Math.round(len / 2) - 1, shX = hipX + len, top = G - Math.max(3, s.depth - 1) + 1, sh = s.skull[1], k = p.kick ?? 0;
  tail(gr, s, hipX - 1, G, 'ground', p.wag ?? 0);
  const up = (x: number, far: boolean, hi: number, bend: number) => {
    const ch = far ? 'D' : 'B', y1 = top - 1 - (s.leg - 3) - hi;
    gr.line(x, top - 1, x, y1, ch, 2);
    // Bent at the wrist or hock, the paw flopped over.
    gr.set(x + bend, y1, hasSocks(look.mark) ? 'W' : ch);
  };
  up(hipX + 3, true, k, -1), up(shX - 1, true, 1 - k, 1);
  gr.rect(hipX, top, len + 1, G - top + 1, 'B'), gr.rect(hipX - 1, top + 1, 1, G - top, 'B');
  for (let x = hipX + 1; x < shX; x++) gr.set(x, top, 'L');
  up(hipX + 1, false, 1 - k, -1), up(shX - 3, false, k, 1);
  // The head laid back along the floor past the shoulder, mouth open in a grin (a beard keeps it a pixel up).
  return head(gr, s, look, [shX, top + 1], shX + 1, G - sh - (s.rough ? 1 : 0), 'back', true);
}

/** Brindle stripes or merle patches over the coat. */
function pattern(gr: Grid, look: HoundLook): void {
  const kind = PATTERN[look.breed]?.[look.coat];
  if (!kind) return;
  for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) {
    if (gr.g[y][x] !== 'B') continue;
    const on = kind === 'brindle' ? (x + (y >> 1)) % 3 === 0 : ((x >> 1) * 7 + (y >> 1) * 13) % 5 === 0;
    if (on) gr.g[y][x] = 'S';
  }
}

/** A pose's pixels (leg shifts, stretch, lift, head moves) half as big again, for the 1.5x hound (the art pass). */
const k15 = (v: number | undefined) => (v === undefined ? undefined : Math.sign(v) * Math.round(Math.abs(v) * 1.5));
function big(p: Pose): Pose {
  const h = p.head;
  return {
    ...p, legs: p.legs?.map(([a, b]) => [k15(a)!, k15(b)!]), stretch: k15(p.stretch), tilt: k15(p.tilt), lift: k15(p.lift), crouch: k15(p.crouch), front: k15(p.front),
    head: h && { ...h, dx: k15(h.dx), dy: k15(h.dy) },
  };
}

/** The pixel map for one hound in one pose. */
export function houndMap(look: HoundLook, p0: Pose): HoundMap {
  const p = big(p0);
  const gr = new Grid(), s = SHAPES[look.breed], pal = palOf(look.breed, look.coat);
  const at = p.kind === 'sit' || p.kind === 'scratch' ? sit(gr, s, look, p) : p.kind === 'down' ? down(gr, s, look, p) : p.kind === 'belly' ? belly(gr, s, look, p) : stand(gr, s, look, p);
  pattern(gr, look);
  const parts: Part[] = [];
  gr.g.forEach((row, y) => row.forEach((ch, x) => ch && parts.push(['p', x, y, pal[ch as keyof typeof pal]])));
  return { parts, at, clipped: gr.clipped };
}
