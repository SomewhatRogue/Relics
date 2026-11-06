/** Elements on a goblin: flames while it burns, drifting frost while chilled, a block of ice when frozen;
 *  the Rogue's green poison, retching and bleeding (sim/venom.ts); blinded by a longbow (sim/rangershots.ts). */
import { lurking } from '../sim/lurk';
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';

const TALL: Record<Enemy['kind'], number> = { butcher: 24, scrapper: 14, dummy: 18, swingDummy: 18, spider: 6, brood: 14, nest: 12 };

/** `t` is the room's time (the statuses are kept in it); (x, y) the feet on screen. */
export function drawStatus(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  // (Nothing over a goblin still lying in Fenmere's reeds: sim/lurk.ts.)
  if (e.act === 'dead' || lurking(e)) return;
  const tall = TALL[e.kind], w = Math.round(e.radius * 16) + 2, g = c.glow;
  if (e.frozenUntil > t) {
    const left = Math.round(x - w), top = Math.round(y - tall - 1), fade = Math.min(1, (e.frozenUntil - t) / 0.4);
    g.globalAlpha = 0.32 * fade;
    g.fillStyle = '#bfe8ff';
    g.fillRect(left, top, w * 2, tall + 2);
    g.globalAlpha = 0.85 * fade;
    g.fillStyle = '#e8f8ff';
    g.fillRect(left, top, w * 2, 1);
    g.fillRect(left, top, 1, tall + 2);
    for (let i = 0; i < 3; i++) g.fillRect(left + 3 + i * 4, top + 3 + i * 5, 1, 2);
    g.globalAlpha = 1;
    return;
  }
  if (e.snareUntil > t) {
    // A net over it: a loose crosshatch, pegged at the corners.
    const left = Math.round(x - w - 1), top = Math.round(y - tall * 0.8);
    c.lit.fillStyle = '#8a7a5a';
    for (let i = 0; i <= w * 2 + 2; i += 3) {
      c.lit.fillRect(left + i, top, 1, Math.round(tall * 0.8));
    }
    for (let j = 0; j <= tall * 0.8; j += 3) c.lit.fillRect(left, top + j, w * 2 + 3, 1);
  }
  if (e.burnUntil > t) {
    const cols = ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'];
    for (let i = 0; i < 7; i++) {
      const f = Math.floor(c.now * 12 + i * 3.7) % 5, fx = x - w + ((i * 7) % (w * 2)), fy = y - tall * (0.3 + ((i * 13) % 7) / 10) - f;
      g.fillStyle = cols[(i + f) % 4];
      g.fillRect(Math.round(fx), Math.round(fy), 1, f > 2 ? 2 : 1);
    }
  }
  if ((e.venom ?? 0) > 0 && (e.venomUntil ?? 0) > t) {
    // Poisoned: a sickly green sweat over it and drips falling off, more for each stack (sim/venom.ts).
    const n = 2 + e.venom! * 2;
    for (let i = 0; i < n; i++) {
      const f = (c.now * 1.6 + i * 0.37) % 1, fx = x - w + ((i * 5) % (w * 2));
      g.fillStyle = i % 2 ? '#9be040' : '#6ab82a';
      g.fillRect(Math.round(fx), Math.round(y - tall * (0.8 - f * 0.7)), 1, 1);
    }
  }
  if ((e.pukeUntil ?? 0) > t) {
    // Retching: a green stream from the mouth to the floor ahead of it.
    g.fillStyle = '#9be040';
    for (let k = 0; k < 6; k++) g.fillRect(Math.round(x + e.fx * (3 + k)), Math.round(y - tall * 0.7 + k * 1.5 + e.fy * k), 1, 1);
  }
  if ((e.bleedUntil ?? 0) > t) {
    // Bleeding from a skewer: a dark drop or two running down.
    g.fillStyle = '#9a2a2a';
    const f = (c.now * 2) % 1;
    g.fillRect(Math.round(x + 1), Math.round(y - tall * (0.6 - f * 0.5)), 1, 2);
  }
  if ((e.blindUntil ?? 0) > t) {
    // Blinded: a white glare across its eyes and sparks of light circling its head.
    g.fillStyle = Math.floor(c.now * 10) % 2 ? '#ffffff' : '#e8f0ff';
    g.fillRect(Math.round(x - 3), Math.round(y - tall + 2), 7, 1);
    for (let i = 0; i < 3; i++) {
      const a = c.now * 5 + (i / 3) * Math.PI * 2;
      g.fillRect(Math.round(x + Math.cos(a) * (w + 1)), Math.round(y - tall - 2 + Math.sin(a) * 2), 1, 1);
    }
  }
  if (e.chillUntil > t) {
    g.fillStyle = '#dff4ff';
    for (let i = 0; i < 4; i++) {
      const a = c.now * 1.5 + i * 1.57;
      g.fillRect(Math.round(x + Math.cos(a) * (w + 2)), Math.round(y - tall * 0.5 + Math.sin(a * 1.3) * tall * 0.4), 1, 1);
    }
  }
}
