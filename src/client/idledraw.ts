/**
 * What's drawn in and around the hands through an idle or a pet (idlepose.ts poses the body): the
 * Warrior's thumb on the edge and the yawn, the Ranger's stick and hand on the hound, hearts at a pet.
 * The Rogue's, Mage's and Cleric's are in idledraw2.ts. Lit layer for things, glow for light.
 */
import type { Ctx } from './draw';
import { PX } from './world';
import { FETCH } from './idlehound';
import { colAt, dot, headPx, heart, skinOf, span, stick, type PropAt } from './idlekit';
import { cleric, mage, rogue } from './idledraw2';
import { parkProps } from './parked';
import { HS, hs } from './heroscale';

/** Draw the idle's or pet's things for the hero at `at` (after the body and its gear). */
export function idleProps(c: Ctx, at: PropAt): void {
  const o = at.o;
  if (o.park) return parkProps(c, at, o.park, o.parkT);
  if (o.kneel >= 0) return kneel(c, at, o.kneel, o.dog);
  if (o.pet >= 0) return pet(c, at, o.pet, o.dog, o.petR, o.petDur);
  const f = o.f;
  if (!f) return;
  const id = f.def.id, t = f.t;
  if (id[0] === 'w') warrior(c, at, id, t);
  else if (id[0] === 'r') ranger(c, at, id, t);
  else if (id[0] === 'g') rogue(c, at, id, t);
  else if (id[0] === 'm') mage(c, at, id, t);
  else cleric(c, at, id, t);
}

/** Kneeling by a friend who is out, raising them (kneel.ts): both hands out over them, the light in them
 *  brighter as the raise goes on, a mote now and then going down from the hands into them. */
function kneel(c: Ctx, at: PropAt, share: number, s: number): void {
  const sleeve = colAt(at.def, hs(1), at.def.tall + hs(7)), sk = skinOf(at.def), hx = at.bx + s * hs(7), hy = at.by - hs(6);
  dot(c.lit, at.bx + s * hs(4), hy, 3, 1, sleeve), dot(c.lit, at.bx + s * hs(4), hy + 2, 3, 1, sleeve);
  dot(c.lit, hx, hy, 2, 1, sk), dot(c.lit, hx, hy + 2, 2, 1, sk);
  const glow = 0.35 + 0.55 * share + 0.1 * Math.sin(at.now * 8);
  c.glow.globalAlpha = Math.max(0, Math.min(1, glow));
  dot(c.glow, hx + s, hy - 1, 2, 1, '#ffe9a8'), dot(c.glow, hx + s, hy + 1, 2, 1, '#ffffff'), dot(c.glow, hx + s * hs(2), hy + 3, 1, 1, '#e0a040');
  const p = (at.now * 1.6) % 1;
  c.glow.globalAlpha = (1 - p) * (0.4 + 0.5 * share);
  dot(c.glow, hx + s * hs(2), hy + 2 + p * 5, 1, 1, '#ffe9a8');
  c.glow.globalAlpha = 1;
}

/** Kneeling at a hound: a hand on its head rubbing (low on its belly when it's rolled over); hearts going
 *  up between them. Licked, no hand: a heart over the two of them. */
function pet(c: Ctx, at: PropAt, t: number, s: number, r: string, dur: number): void {
  if (t < 0.45 || t > dur - 0.4) return;
  if (r === 'lick') {
    heart(c, at.x + s * hs(5), at.y - hs(20), span(t, 1.1, 2.3));
    return;
  }
  const lowK = r === 'belly' && t > 0.8 ? 1 : 0, hx = at.x + s * hs(8) + Math.round(Math.sin(t * 14)) * (lowK ? 2 : 1), hy = at.y - hs(8) + lowK * 4;
  dot(c.lit, at.bx + s * hs(6), at.by - hs(6) + lowK * 2, 2, 1, colAt(at.def, hs(1), at.def.tall + hs(7)));
  dot(c.lit, hx, hy, 2, 1, skinOf(at.def));
  heart(c, at.x + s * hs(10), at.y - hs(15) + lowK * 3, span(t, 0.7, 1.9));
  heart(c, at.x + s * hs(7), at.y - hs(17) + lowK * 3, span(t, 1.2, Math.min(dur - 0.4, 2.2 + lowK)));
}

function warrior(c: Ctx, at: PropAt, id: string, t: number): void {
  const d = at.def, sk = skinOf(d);
  if (id === 'w_edge' && t > 0.5 && t < 3.1) {
    // The thumb along the edge, pass after pass; a glint where it comes off the end.
    // (Only a blade: a sword's 12, a greatsword's 17; held.ts draws them from the hand.)
    const w = at.p, len = (at.w === 'greatsword' ? 16 : 11) * HS, k = ((t - 0.5) % 1.2) / 1.2, r = 3 * HS + k * (len - 3 * HS);
    dot(c.lit, at.px + Math.cos(w.a) * r, at.py + Math.sin(w.a) * r - 1, 1, 1, sk);
    if (k > 0.85) dot(c.glow, at.px + Math.cos(w.a) * (len + 1), at.py + Math.sin(w.a) * (len + 1) - 1, 1, 1, '#ffffff');
  } else if (id === 'w_yawn') {
    const mx = Math.floor((at.exl + at.exr) / 2);
    // A yawn: the mouth wide, the off arm up over the head.
    if (t > 0.4 && t < 1.9) {
      dot(c.lit, mx, at.ey + 2, 2, t > 0.8 && t < 1.5 ? 3 : 1, '#2a1418');
      const ax = at.bx - at.side * hs(5);
      dot(c.lit, ax, at.by - hs(15), 1, 5, colAt(d, hs(0), d.tall + hs(6)));
      dot(c.lit, ax - (at.side > 0 ? 1 : 0), at.by - hs(17), 2, 2, sk);
    }
    // The flex: the off arm bent up, a fist by the ear, a glint off the arm.
    if (t > 2.2 && t < 4) {
      const ax = at.bx - at.side * hs(6);
      dot(c.lit, ax - (at.side > 0 ? 1 : 0), at.by - hs(10), 2, 2, colAt(d, hs(0), d.tall + hs(6)));
      dot(c.lit, at.bx - at.side * hs(5), at.by - hs(13), 1, 3, colAt(d, hs(0), d.tall + hs(6)));
      dot(c.lit, at.bx - at.side * hs(5) - (at.side > 0 ? 1 : 0), at.by - hs(15), 2, 2, sk);
      if (Math.floor(t * 4) % 2) dot(c.glow, ax - at.side, at.by - hs(12), 1, 1, '#ffffff'), dot(c.glow, at.px + at.side, at.py - hs(3), 1, 1, '#ffffff');
    }
  }
}

function ranger(c: Ctx, at: PropAt, id: string, t: number): void {
  const d = at.def, s = at.o.f!.side, sk = skinOf(d);
  if (id === 'r_fetch') {
    const [lx, ly] = FETCH.land(s), gx = at.x + lx * PX, gy = at.y + ly * PX - 1;
    const [f0, f1] = FETCH.fly;
    if (t < f0) stick(c.lit, at.px, at.py - hs(1), -Math.PI / 2 + s * 0.4 + t * 4);
    else if (t < f1) {
      // In the air: an arc out to where it lands, turning over.
      const k = span(t, f0, f1);
      stick(c.lit, at.px + (gx - at.px) * k, at.py + (gy - at.py) * k - Math.sin(k * Math.PI) * hs(16), t * 16);
    } else if (t < FETCH.pick) stick(c.lit, gx, gy, 0);
    else if (t > FETCH.take && t < 4.3) stick(c.lit, at.px, at.py, -Math.PI / 2 + s * 0.6);
  } else if (id === 'r_ruffle' && t > 0.7 && t < 3) {
    // A hand on the hound's head (it leans in beside the hero), rubbing; a heart off it.
    const hx = at.x + s * hs(5.5) + Math.round(Math.sin(t * 13)), hy = at.y - hs(8);
    dot(c.lit, hx, hy, 2, 1, sk);
    heart(c, at.x + s * hs(9), at.y - hs(14), span(t, 1.3, 2.6));
  } else if (id === 'r_scan') {
    if (t > 0.2 && t < 2.5) {
      // A hand flat over the brow, toward the side they're looking.
      const x0 = at.side > 0 ? at.exl - 1 : at.exl - 2;
      dot(c.lit, x0, at.ey - 1, at.exr - at.exl + 4, 1, sk);
      dot(c.lit, at.side > 0 ? at.exr + 2 : at.exl - 2, at.ey, 1, 2, colAt(d, hs(1), d.tall + hs(6)));
    } else if (t > 2.9 && t < 4.9) {
      // Over the shoulder to the quiver: the fletching lifted and settled, feather by feather.
      const q = colAt(d, hs(10), hs(2)), [qx, qy] = headPx(hs(10), hs(2)), [hx, hy] = headPx(hs(10), hs(3));
      dot(c.lit, hx, hy, 1, 1, sk);
      const up = Math.floor(t * 4) % 2;
      dot(c.lit, qx, qy - 1 - up, 1, 1, q), dot(c.lit, qx - (at.side > 0 ? 1 : -1), qy - 1 - (1 - up), 1, 1, q);
    }
  } else if (id === 'r_tackle' && t > 1.3) {
    // Laughing: little bursts over the head, on the floor and after.
    const k = (t * 3) % 1, hy = t < 3.6 ? at.y - hs(12) : at.by - hs(20);
    if (t < 5.6) {
      c.glow.globalAlpha = 1 - k;
      dot(c.glow, at.x - s * (t < 3.6 ? 6 : 0) + Math.round(Math.sin(t * 9) * 3), hy - k * 5, 1, 1, '#ffe9a8');
      dot(c.glow, at.x - s * (t < 3.6 ? 4 : -2) - Math.round(Math.sin(t * 7) * 3), hy - 2 - k * 4, 1, 1, '#ffffff');
      c.glow.globalAlpha = 1;
    }
  }
}
