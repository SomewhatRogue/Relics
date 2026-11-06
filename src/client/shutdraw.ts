/**
 * Fewer doors, bigger insides (docs/plans/atlas.md section 6; the rule is shared/doors.ts), drawn flat:
 * a house shut for good is boarded up (pale planks nailed over its door and windows) or burnt out (the
 * walls blackened, the roof open, the doorway a black hole), with no light at the door and no woodpile;
 * a house you can go into has firelight moving in its doorway, so you can tell it from down the street.
 * The 2.5D view builds the same from the block (three/houses3d.ts), and both light the doorway from
 * `doorLights` (scene.ts, three/roomlights.ts). Paint only.
 */
import type { Block } from '../shared/arena';
import type { House } from '../shared/houses';
import type { ArenaRoom } from '../sim/room';
import { windowsOf } from './cottage';
import type { Ctx } from './draw';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;
const PLANK = ['#b09a72', '#9a845e', '#c4ae84'];

/** The door's box on the house's canvas (as blocks.ts paints a door). */
export function doorBox(b: Block, w: number, roofH: number, tall: number): { x: number; y: number; w: number; h: number } {
  const dw = b.kind === 'barn' ? 12 : 6, dh = Math.min(tall - 3, b.kind === 'barn' ? 18 : 11);
  return { x: Math.round(w / 2 - dw / 2), y: roofH + tall - dh, w: dw, h: dh };
}

/** Boarded up or burnt out, over the painted house (its own door was never painted: it has none). */
export function paintShut(rect: Rect, b: Block, h: House, w: number, roofH: number, tall: number): void {
  const d = doorBox(b, w, roofH, tall), barn = b.kind === 'barn';
  if (b.shut === 'burnt') {
    // Burnt out: soot up the walls, the roof gone through in two places, a black doorway with a stub of frame.
    for (let y = roofH; y < roofH + tall; y += 2) for (let x = (y >> 1) % 3; x < w; x += 3) rect(x, y, 2, 1, 'rgba(14,10,8,0.55)');
    for (const k of [0.2, 0.62]) {
      const hx = Math.round(w * k), hw = Math.round(w * 0.22);
      rect(hx, 2, hw, Math.max(2, roofH - 4), '#0d0b10');
      for (let i = hx + 1; i < hx + hw; i += 4) rect(i, 1, 1, roofH - 2, '#1e1612');
    }
    rect(d.x, d.y, d.w, d.h, '#0a0808');
    rect(d.x - 1, d.y - 1, 1, d.h + 1, '#1e1612'), rect(d.x + d.w, d.y + 3, 1, d.h - 3, '#1e1612');
    if (!barn) for (const x of windowsOf(h, w)) rect(x, roofH + tall - 15, 3, 3, '#050404'), rect(x - 1, roofH + tall - 17, 5, 1, '#1e1612');
    return;
  }
  // Boarded: the door's shape, then pale planks nailed across it and across each window.
  rect(d.x, d.y, d.w, d.h, '#2a1e14');
  for (let i = 0, y = d.y + 1; y < d.y + d.h - 1; y += 3, i++) rect(d.x - 2, y, d.w + 4, 2, PLANK[i % 3]);
  rect(d.x + 1, d.y + 1, 1, d.h - 2, '#6a5a3e'), rect(d.x + d.w - 2, d.y + 1, 1, d.h - 2, '#6a5a3e');
  if (!barn) for (const x of windowsOf(h, w)) {
    rect(x - 2, roofH + tall - 15, 7, 1, PLANK[0]);
    rect(x - 2, roofH + tall - 13, 7, 1, PLANK[1]);
  }
}

/** A job's house you could go into: a door to it, and it's not boarded, burnt out or fallen in. */
export const enterable = (b: Block) => !!b.door && b.look !== undefined && (b.kind === 'house' || b.kind === 'barn') && !b.shut && !b.ruined && (b.burning ?? -1) < 0;

/** Firelight moving in an enterable house's doorway, on the glow (a little brighter in the dark). */
export function drawDoorGlow(c: Ctx, b: Block, x: number, top: number, w: number, roofH: number, tall: number): void {
  if (!enterable(b) || b.fate === 'burning') return;
  const d = doorBox(b, w, roofH, tall), g = c.glow, t = c.now + b.x * 0.37;
  g.globalAlpha = 0.5 + 0.18 * Math.sin(t * 7) + 0.08 * Math.sin(t * 17);
  g.fillStyle = '#a8441a', g.fillRect(Math.round(x + d.x + 1), Math.round(top + d.y + 2), d.w - 2, d.h - 2);
  g.fillStyle = '#ff9a3c', g.fillRect(Math.round(x + d.x + 1), Math.round(top + d.y + d.h - 4), d.w - 2, 3);
  g.globalAlpha = 1;
  if (Math.floor(t * 5) % 3) (g.fillStyle = '#ffd27a'), g.fillRect(Math.round(x + d.x + 2 + (Math.floor(t * 3) % Math.max(1, d.w - 4))), Math.round(top + d.y + d.h - 3), 1, 1);
}

/** The doorway's light, in tiles (both views light from this). */
export function doorLights(room: ArenaRoom): { x: number; y: number; r: number; i: number; c: [number, number, number] }[] {
  const out: { x: number; y: number; r: number; i: number; c: [number, number, number] }[] = [];
  for (const b of room.map.blocks) if (enterable(b) && b.fate !== 'burning' && !room.indoors) out.push({ x: b.x + b.w / 2, y: b.y + b.h + 0.35, r: 1.7, i: 0.55, c: [1, 0.62, 0.3] });
  return out;
}
