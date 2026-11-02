/**
 * Wickhold under siege, drawn: the gallows (an empty noose, a crow on the beam) and wicker hurdles,
 * painted into their block's canvas (blocks.ts, via furnish.ts); and what the townsfolk are busy at
 * (npcs.ts): the gravedigger with the dead over his shoulder or his spade, a recruit at the whetstone,
 * a bucket at the well.
 */
import type { Block, Npc } from '../shared/arena';
import type { Ctx } from './draw';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

/** A siege block's whole canvas (w wide, roofH the footprint, tall above it). */
export function siegeBlock(g: CanvasRenderingContext2D, b: Block, rect: Rect, w: number, roofH: number, tall: number): void {
  const H = roofH + tall;
  g.clearRect(0, 0, w, H);
  if (b.kind === 'hurdle') {
    // Woven withies between stakes, the tops ragged.
    for (let x = 0; x < w; x += 7) rect(x, roofH - 2, 2, tall + 2, '#3a2818');
    for (let y = roofH; y < H - 1; y += 2) for (let x = 1; x < w - 1; x += 3) rect(x + ((y >> 1) % 2), y, 2, 1, (x + y) % 4 ? '#5a4a30' : '#4a3c26');
    rect(0, H - 1, w, 1, '#1e1610');
    return;
  }
  // The gallows: a plank deck on its legs, two uprights and a beam, an empty noose, a crow.
  const deck = H - 7;
  rect(0, deck - roofH + 2, w, roofH - 2, '#5a3d22');
  for (let y = deck - roofH + 4; y < deck; y += 3) rect(0, y, w, 1, '#3a2818');
  rect(0, deck, w, 7, '#2e2016'), rect(2, deck, 2, 7, '#1e1610'), rect(w - 4, deck, 2, 7, '#1e1610');
  rect(3, 5, 3, deck - roofH - 1, '#4a3420'), rect(w - 6, 5, 3, deck - roofH - 1, '#4a3420');
  rect(0, 4, w, 3, '#5a3d22'), rect(0, 7, w, 1, '#2e2016');
  rect(6, 8, 3, 1, '#4a3420'), rect(w - 9, 8, 3, 1, '#4a3420');
  const rx = Math.round(w / 2) + 2;
  rect(rx, 7, 1, 10, '#8a7a5a');
  rect(rx - 2, 17, 5, 1, '#8a7a5a'), rect(rx - 2, 17, 1, 5, '#8a7a5a'), rect(rx + 2, 17, 1, 5, '#8a7a5a'), rect(rx - 1, 22, 3, 1, '#8a7a5a');
  // The crow, hunched on the beam.
  rect(7, 2, 4, 2, '#16141c'), rect(10, 1, 2, 2, '#16141c'), rect(12, 2, 1, 1, '#c8a040');
}

/** What they're at, drawn over them. (x, y) their feet on screen; tx their tile x; fx which way they walk. */
export function drawWork(c: Ctx, n: Npc, x: number, y: number, tx: number, fx: number): boolean {
  const g = c.lit, t = c.now;
  if (n.work === 'bury' || n.work === 'dig') {
    const digging = tx < 5;
    if (digging) {
      // The spade going in and coming up, and earth flicked aside.
      const k = Math.floor(t * 2.2 + n.x) % 4, sy = k < 2 ? 2 : -3;
      g.fillStyle = '#6b4a2b', g.fillRect(Math.round(x - 7), Math.round(y - 16 + sy), 1, 12);
      g.fillStyle = '#8a8f9a', g.fillRect(Math.round(x - 8), Math.round(y - 4 + sy), 3, 3);
      if (k === 3) (g.fillStyle = '#3e352a'), g.fillRect(Math.round(x - 12), Math.round(y - 8), 2, 1), g.fillRect(Math.round(x - 14), Math.round(y - 6), 1, 1);
    } else if (n.work === 'bury' && fx < 0) {
      // One of the dead, wrapped in sacking, over his shoulder.
      g.fillStyle = '#6a6670', g.fillRect(Math.round(x - 9), Math.round(y - 17), 18, 4);
      g.fillStyle = '#4e4a54', g.fillRect(Math.round(x - 9), Math.round(y - 14), 18, 1), g.fillRect(Math.round(x - 3), Math.round(y - 17), 1, 4);
      g.fillStyle = '#2a1e14', g.fillRect(Math.round(x + 8), Math.round(y - 16), 2, 2);
    } else {
      // The spade over his shoulder.
      g.fillStyle = '#6b4a2b', g.fillRect(Math.round(x + 2), Math.round(y - 19), 1, 12);
      g.fillStyle = '#8a8f9a', g.fillRect(Math.round(x + 1), Math.round(y - 21), 3, 3);
    }
    return digging;
  }
  if (n.work === 'whet') {
    // A blade across the knees, the stone going along it, a spark now and then.
    g.fillStyle = '#cfd6dc', g.fillRect(Math.round(x - 8), Math.round(y - 7), 14, 1);
    const k = (t * 1.6 + n.y) % 1;
    g.fillStyle = '#4a4652', g.fillRect(Math.round(x - 6 + k * 10), Math.round(y - 8), 2, 2);
    if (k > 0.85) (c.glow.fillStyle = '#ffd27a'), c.glow.fillRect(Math.round(x + 4), Math.round(y - 9), 1, 1);
    return true;
  }
  if (n.work === 'well') {
    // A bucket on a rope, coming up hand over hand.
    const up = Math.round(((t * 0.5 + n.x) % 1) * 6);
    g.fillStyle = '#8a7a5a', g.fillRect(Math.round(x - 9), Math.round(y - 14), 1, 8 - up);
    g.fillStyle = '#5a3d22', g.fillRect(Math.round(x - 11), Math.round(y - 6 - up), 5, 4);
    g.fillStyle = '#3a4a5c', g.fillRect(Math.round(x - 10), Math.round(y - 6 - up), 3, 1);
    return true;
  }
  return false;
}
