/**
 * The Rogue's, Mage's and Cleric's idles in hand (idledraw.ts has the rest): a knife and a coin in the
 * air, a book, sparks off the fingers, a hat brim, the censer's smoke, a prayer, a cloth on the mace.
 */
import type { Ctx } from './draw';
import { LAYOUT } from './figure';
import { colAt, dot, headPx, knife, skinOf, span, type PropAt } from './idlekit';
import { KNIFE_UP } from './idlepose';
import { HS, hs } from './heroscale';

/** The off hand (the one without the weapon), where it rests this frame. */
const offHand = (at: PropAt): [number, number] => [at.bx - at.side * hs(4), at.by - hs(7) + LAYOUT.drop];

export function rogue(c: Ctx, at: PropAt, id: string, t: number): void {
  // Twin daggers: the one in the weapon hand goes up (held.ts leaves it out meanwhile); a rapier or the
  // poisoner's short sword stays in hand and a spare comes off the belt into the other.
  const own = at.w === 'daggers', [ox, oy] = own ? [at.px, at.py] : offHand(at), len = own ? hs(6) : hs(3);
  if (id === 'g_flip') {
    for (const [t0, t1] of KNIFE_UP.g_flip) {
      const k = span(t, t0, t1);
      if (k > 0 && k < 1) knife(c.lit, ox, oy - Math.sin(k * Math.PI) * hs(12), k * Math.PI * 4, len);
      if (t > t1 && t < t1 + 0.1) dot(c.glow, ox, oy - 1, 1, 1, '#ffffff');
    }
    if (!own && t > 0.3) knife(c.lit, ox, oy, -Math.PI / 2 - at.side * 0.3);
  } else if (id === 'g_coin') {
    // A coin thumbed up, turning, and caught; the second time higher.
    for (const [t0, t1, h] of [[0.2, 1.2, hs(10)], [1.5, 2.6, hs(14)]]) {
      const k = span(t, t0, t1);
      if (k <= 0 || k >= 1) continue;
      const y = oy - 1 - Math.sin(k * Math.PI) * h, edge = Math.floor(t * 12) % 2;
      dot(c.lit, ox, y, edge ? 1 : 2, 1, edge ? '#a8802a' : '#e8c050');
      if (k > 0.4 && k < 0.6) dot(c.glow, ox, y - 1, 1, 1, '#fff2b0');
    }
  } else if (id === 'g_fumble') {
    // Flipped; it comes down off the fingers, bounces, and is snatched low the second time.
    let y = oy, a = Math.PI * 4 * span(t, 0.3, 1);
    if (t < 0.3) a = -Math.PI / 2;
    else if (t < 1) y = oy - Math.sin(span(t, 0.3, 1) * Math.PI) * hs(12);
    else if (t < 1.25) (y = oy - Math.sin(span(t, 1, 1.25) * Math.PI) * hs(5)), (a = t * 20);
    else if (t < 1.45) (y = oy + span(t, 1.25, 1.45) * hs(4)), (a = t * 20);
    else (y = oy + hs(2)), (a = -Math.PI / 2 - at.side * 0.3);
    // (Back in the hand, a dagger's drawn by held.ts again.)
    if (!own || (t > 0.3 && t < 1.45)) knife(c.lit, ox + (t > 1 && t < 1.45 ? at.side * 2 : 0), y, a, len);
    if (t > 1.45 && t < 1.55) dot(c.glow, ox, y - 1, 1, 1, '#ffffff');
    // A little red in the cheeks after.
    if (t > 1.6 && t < 3.6) dot(c.lit, at.exl - 1, at.ey, 1, 1, '#d8707a'), dot(c.lit, at.exr + 1, at.ey, 1, 1, '#d8707a');
  }
}

export function mage(c: Ctx, at: PropAt, id: string, t: number): void {
  const d = at.def, sk = skinOf(d);
  if (id === 'm_read' && t > 0.3 && t < 4.9) {
    // A small book held open in front; a page turned halfway.
    const x = at.bx - hs(3) - 1 - at.side, y = at.by - hs(11) + LAYOUT.drop;
    dot(c.lit, x - 1, y - 1, 11, 7, '#1a1216');
    dot(c.lit, x, y, 9, 5, '#9a4a26');
    dot(c.lit, x, y, 4, 4, '#f4ecd8'), dot(c.lit, x + 5, y, 4, 4, '#e4d8bc'), dot(c.lit, x + 4, y, 1, 4, '#6a3a1e');
    // A page turned over halfway through.
    if (t > 2.4 && t < 2.8) dot(c.lit, x + 6 - Math.round(span(t, 2.4, 2.8) * 5), y - 1, 1, 1, '#fffaf0');
    dot(c.lit, at.side > 0 ? x - 1 : x + 9, y + 3, 1, 2, sk);
  } else if (id === 'm_sparks') {
    // Flicked off whatever's in hand: the wand's tip, the staff's head, along the spellblade; three times.
    const p = at.p, r0 = at.w === 'staff' ? 13 : at.w === 'wand' ? 7 : 9, ox = at.px + Math.cos(p.a) * (p.ext + r0) * HS, oy = at.py + Math.sin(p.a) * (p.ext + r0) * HS + hs(2);
    for (const t0 of [0.3, 1.1, 1.9]) {
      const k = span(t, t0, t0 + 0.55);
      if (k <= 0 || k >= 1) continue;
      c.glow.globalAlpha = 1 - k;
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 - at.side * (0.9 - i * 0.45), r = 1 + k * (5 + (i % 2) * 2);
        dot(c.glow, ox + Math.cos(a) * r, oy - 2 + Math.sin(a) * r + k * k * 3, 1, 1, i === 1 ? '#ffffff' : at.el);
      }
      c.glow.globalAlpha = 1;
    }
  } else if (id === 'm_brim' && t > 0.4 && t < 2.2) {
    // A hand at the brim's end, tugging it down a touch and back.
    const brim = colAt(d, 1, 10), [bx, by] = headPx(16, 10), dip = t > 0.8 && t < 1.8 ? 1 : 0;
    dot(c.lit, bx, by + dip, 1, 1, brim), dot(c.lit, bx + (at.side > 0 ? 1 : -1), by + 1, 1, 1, sk);
  } else if (id === 'm_flop' && t > 0.4 && t < 2.5) {
    // The brim come down over the eyes, then pushed back up.
    const hat = colAt(d, 9, 6), brim = colAt(d, 1, 10), [x0, y0] = headPx(5, d.eyes[0]), [x1] = headPx(12, d.eyes[0]), lift = t > 2.2 ? 1 : 0;
    dot(c.lit, Math.min(x0, x1), y0 - 1 - lift, Math.abs(x1 - x0) + 1, 2, hat);
    dot(c.lit, Math.min(x0, x1) - 1, y0 + 1 - lift, 1, 1, brim), dot(c.lit, Math.max(x0, x1) + 1, y0 + 1 - lift, 1, 1, brim);
    if (t > 2.1) dot(c.lit, Math.round((x0 + x1) / 2), y0 + 1 - lift, 1, 1, sk);
  }
}

export function cleric(c: Ctx, at: PropAt, id: string, t: number): void {
  const d = at.def, sk = skinOf(d), s = at.side, now = at.now;
  // Where the censer hangs (heldkits.ts censer): its coal.
  const cx = at.px - s * hs(9) + Math.sin(now * 3) * 2, cy = at.py + hs(2) + Math.round(Math.sin(now * 3));
  if (id === 'c_censer') {
    // Swung gently, the smoke curling up thicker and wider than it does at rest.
    for (let i = 0; i < 7; i++) {
      const f = (now * 0.45 + i / 7) % 1;
      c.lit.globalAlpha = 0.75 * (1 - f) * Math.min(1, t * 2, (4.2 - t) * 2);
      dot(c.lit, cx + Math.sin(f * 7 + i) * 3 * f + f * 2, cy - 2 - f * 14, f > 0.45 ? 2 : 1, 1, i % 2 ? '#8a8690' : '#b0acb4');
    }
    c.lit.globalAlpha = 1;
  } else if (id === 'c_pray' && t > 0.5 && t < 3.9) {
    // Eyes shut, hands together at the chest, a little light going up from them.
    dot(c.lit, at.exl, at.ey, 1, 1, sk), dot(c.lit, at.exr, at.ey, 1, 1, sk);
    const hx = at.bx - hs(1), hy = at.by - hs(9) + LAYOUT.drop;
    dot(c.lit, hx, hy, 2, 2, sk);
    const k = (t * 0.6) % 1;
    c.glow.globalAlpha = 0.6 * (1 - k);
    dot(c.glow, hx + Math.round(Math.sin(t * 3)), hy - 3 - k * 8, 1, 1, '#ffe9a8');
    c.glow.globalAlpha = 1;
  } else if (id === 'c_polish' && t > 0.4 && t < 3.6) {
    // A cloth on the mace's head, the flail's hanging head, or along the censer-bearer's sword; it shines after.
    const a = at.p.a, flail = at.w === 'flail', ca = Math.PI / 2 + Math.sin(now * 3) * 0.25;
    const head = (r: number): [number, number] => (flail ? [at.px + Math.cos(a) * 5 * HS + Math.cos(ca) * 6 * HS, at.py + Math.sin(a) * 5 * HS + Math.sin(ca) * 6 * HS] : [at.px + Math.cos(a) * r, at.py + Math.sin(a) * r]);
    const r = at.w === 'censer' ? 7 + Math.sin(t * 8) * 3.5 : 9.5 + Math.sin(t * 12) * 1.5, [cx0, cy0] = head(r);
    dot(c.lit, cx0 - 1 + (flail ? Math.round(Math.sin(t * 12)) : 0), cy0 - 1, 2, 1, '#d8d0c0');
    if (t > 2.9 && Math.floor(t * 6) % 2) {
      const [gx0, gy0] = head(10), gx = gx0, gy = gy0 - 1;
      dot(c.glow, gx, gy, 1, 1, '#ffffff'), dot(c.glow, gx - 1, gy, 3, 1, '#fff2c0'), dot(c.glow, gx, gy - 1, 1, 3, '#fff2c0');
    }
  } else if (id === 'c_sneeze') {
    const nx = Math.floor((at.exl + at.exr) / 2), ny = at.ey + 1;
    // The smoke drifting into the face.
    if (t < 1.4) for (let i = 0; i < 3; i++) {
      const k = (t * 0.9 + i / 3) % 1;
      c.lit.globalAlpha = 0.7 * (1 - Math.abs(k - 0.5) * 1.6);
      dot(c.lit, cx + (nx - cx) * k, cy + (ny - cy) * k - Math.sin(k * Math.PI) * 3, 1, 1, '#a8a4ac');
    }
    c.lit.globalAlpha = 1;
    // Squinting up to it; then the sneeze out in front.
    if (t > 1.2 && t < 2.1) dot(c.lit, at.exl, at.ey, 1, 1, sk), dot(c.lit, at.exr, at.ey, 1, 1, sk);
    const k = span(t, 1.9, 2.5);
    if (k > 0 && k < 1) {
      c.lit.globalAlpha = 1 - k;
      for (let i = 0; i < 6; i++) dot(c.lit, nx + s * (2 + k * (4 + i * 1.5)), ny + (i - 2.5) * k * 1.2, 1, 1, '#e8e8ec');
      c.lit.globalAlpha = 1;
    }
  }
}
