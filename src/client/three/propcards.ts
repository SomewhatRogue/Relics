/**
 * The tile redraw's props (docs/design/tile-redraw.md, R3; `?redraw=1`, ../tilelook.ts): trees, bushes, rocks,
 * reeds, hay, wells, stalls and tents drawn by the flat view's
 * own painters (../blocks.ts drawRound, drawBlock) and stood up as cards, one sprite pixel to one render pixel, as the
 * figures are (figs3d.ts). So both views show the same object, and nothing beside a figure reads as a lump of boxes.
 * A map's round things share one picture and one mesh (a wood is one draw); a block is its own (it is rebuilt when it
 * burns). Fences, walls and palisades stay built: they run on, and a card at the art's size would leave gaps.
 * Painted once, so what moves in the flat view (a flame) is still here; a lamp's flame and light are lamps3d.ts's.
 */
import * as THREE from 'three';
import type { Block, Round } from '../../shared/arena';
import { drawBlock, drawRound } from '../blocks';
import { LOOK } from '../blocklook';
import { PIECE_BLOCKS, PIECE_ROUNDS } from '../pieces';
import type { Ctx } from '../draw';
import { PX } from '../world';
import { cardMaterial } from './figmat';
import { PITCH } from './camera3d';
import { KX, KZ } from '../tilekit';
import { FURN, furnCut } from '../tilefurn';
import { stumpCut } from '../tilefurn2';

/** The round things drawn as cards. */
// (A stump is drawn in the kit, tilefurn2.ts: the flat view paints it as a block, which stood up reads as a crate.)
export const CARD_ROUNDS = new Set<string>(['stump', 'tree', 'pine', 'bush', 'deadtree', 'rock', 'reed', 'hay', 'well', 'stone', 'target', 'pillar']);
/**
 * The blocks drawn as cards: those the flat view paints as a real picture (a stall's awning, a tent), and the
 * furniture the kit draws (tilefurn.ts; the flat view paints it as plain slabs, which stood up read as crates). Hearths,
 * shelves, racks and the like stay built.
 */
const CARD_BLOCKS = new Set<string>(['stall', 'tent', ...FURN]);
export const isCardRound = (r: Round) => CARD_ROUNDS.has(r.kind) && !PIECE_ROUNDS.has(r.kind);
export const isCardBlock = (b: Block) => CARD_BLOCKS.has(b.kind) && !PIECE_BLOCKS.has(b.kind) && !b.ruined && b.lands === undefined && !b.door;

const COS = Math.cos(PITCH);
export interface Cut { lit: HTMLCanvasElement; glow: HTMLCanvasElement; w: number; h: number; ax: number; ay: number }

/** Paint with the flat view's code onto a scratch pair, the anchor at (ax, ay), and cut it to what was drawn. */
function cut(paint: (c: Ctx, x: number, y: number) => void, W: number, H: number, ax: number, ay: number): Cut | null {
  const mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  const lc = mk(), gc = mk(), c: Ctx = { lit: lc.getContext('2d')!, glow: gc.getContext('2d')!, now: 0 } as Ctx;
  paint(c, ax, ay);
  const a = c.lit.getImageData(0, 0, W, H).data, b = c.glow.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[(y * W + x) * 4 + 3] || b[(y * W + x) * 4 + 3]) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, crop = (s: HTMLCanvasElement) => {
    const o = Object.assign(document.createElement('canvas'), { width: w, height: h });
    o.getContext('2d')!.drawImage(s, x0, y0, w, h, 0, 0, w, h);
    return o;
  };
  return { lit: crop(lc), glow: crop(gc), w, h, ax: ax - x0, ay: ay - y0 };
}

/**
 * Cards in one picture: each placed by where its anchor stands (x, z tiles; up, its level's height), the anchor's
 * row being the foot. Upright, snapped so its pixels land on whole render pixels.
 */
export class CardSheet {
  private cuts: { c: Cut; x: number; z: number; up: number }[] = [];
  add(c: Cut | null, x: number, z: number, up = 0): void {
    if (c) this.cuts.push({ c, x, z, up });
  }
  /** A round thing: drawn about its middle, it stands where its lowest pixel is, that much nearer the camera. */
  addRound(r: Round, up = 0): void {
    if (r.kind === 'stump') return this.add(stumpCut(r.r), r.x, r.y + Math.max(0.2, r.r), up);
    const c = roundCut(r);
    if (!c) return;
    const dz = (c.h - c.ay) / PX;
    this.add({ ...c, ay: c.h }, r.x, r.y + dz, up);
  }
  mesh(): THREE.Mesh | null {
    if (!this.cuts.length) return null;
    // Shelves, 1024 wide.
    const W = 1024, at: [number, number][] = [];
    let sx = 0, sy = 0, row = 0;
    for (const { c } of this.cuts) {
      if (sx + c.w > W) (sx = 0), (sy += row + 1), (row = 0);
      at.push([sx, sy]), (sx += c.w + 1), (row = Math.max(row, c.h));
    }
    const H = sy + row + 1, mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
    const lit = mk(), glow = mk(), lg = lit.getContext('2d')!, gg = glow.getContext('2d')!;
    const pos: number[] = [], uv: number[] = [];
    this.cuts.forEach(({ c, x, z, up }, i) => {
      const [px, py] = at[i];
      lg.drawImage(c.lit, px, py), gg.drawImage(c.glow, px, py);
      // Left edge on a whole render pixel; the foot's row on a whole render pixel (12 a tile deep).
      const l = Math.round((x - c.ax / KX) * KX) / KX, r = l + c.w / KX, fz = Math.round(z * KZ) / KZ;
      const below = (c.h - c.ay) / (KX * COS), top = c.ay / (KX * COS), b = up - below, t = up + top;
      const u0 = px / W, u1 = (px + c.w) / W, v0 = 1 - (py + c.h) / H, v1 = 1 - py / H;
      pos.push(l, b, fz, r, b, fz, r, t, fz, l, b, fz, r, t, fz, l, t, fz);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const tex = (cv: HTMLCanvasElement) => Object.assign(new THREE.CanvasTexture(cv), { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false });
    return new THREE.Mesh(g, cardMaterial(tex(lit), tex(glow)));
  }
}

/** A round thing as the flat view paints it, anchored at its middle (where drawRound is told it stands). */
export const roundCut = (r: Round): Cut | null => cut((c, x, y) => drawRound(c, r, x, y), 160, 200, 80, 150);

/** A block as the flat view paints it (lamps lit by `lit`), anchored at its front edge's middle. */
export function blockCut(b: Block, lit: boolean): Cut | null {
  if (FURN.has(b.kind)) return furnCut(b);
  const w = Math.round(b.w * PX), d = Math.round(b.h * PX), tall = LOOK[b.kind]?.tall ?? 16, m = 24;
  return cut((c, x, y) => drawBlock(c, b, x - w / 2, y - d, lit), w + m * 2, d + tall + m * 2, m + w / 2, m + tall + d);
}
