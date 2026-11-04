/**
 * The figures in the 2.5D view as the flat game's own pixel figures, standing in the 3D world (the
 * HD-2D way): each frame every figure in sight is drawn by the flat view's code (drawHero, drawEnemy,
 * drawNpc and the rest, cards3d.ts says which) into its own cell of one atlas, a `lit` canvas and a
 * `glow` canvas, and shown on a card at its feet. A card is folded at the feet: above them it stands
 * upright, below them (a shadow's rim, a blade swung toward you) it lies on the floor, each sized so
 * one sprite pixel is one pixel of the low-res view, and snapped to whole pixels so it stays crisp.
 * The 3D lights shade the lit layer (figmat.ts); the glow stays unlit and blooms. Only draws.
 */
import * as THREE from 'three';
import { BARE, type Ctx } from '../draw';
import { XRAY_LAYER } from './actors3d';
import { PITCH } from './camera3d';
import { POOL, cardMaterial, xrayMaterial } from './figmat';
import type { Proj } from './overlay3d';

/** A cell of the atlas (sprite pixels), and where the feet go in it. */
export const CELL = { w: 96, h: 96, fx: 48, fy: 64 };
const COLS = 10, SIN = Math.sin(PITCH), COS = Math.cos(PITCH);
/** Which way a card's light-facing normal points (world): mostly at the camera, a little up, as the floor is lit. */
const FACE = new THREE.Vector3(0, 0.75, 0.66).normalize();
const BACK = new THREE.Vector3(0, SIN, COS);
const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

export type Draw = (c: Ctx, x: number, y: number) => void;
/** `xray`: a hero, shown as a silhouette behind walls; `pool`: the shadow's radius (tiles); `bias`: nearer the camera (tiles), to sit over another at the same spot. */
export interface Opts { xray?: boolean; pool?: number; bias?: number }

interface Slot { i: number; card: THREE.Mesh; pool: THREE.Mesh; seen: number; hero: boolean }

export class Figs {
  readonly group = new THREE.Group();
  private litC = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  private lit = this.litC.getContext('2d')!;
  private glow = this.glowC.getContext('2d')!;
  private litTex = this.texture(this.litC);
  private glowTex = this.texture(this.glowC);
  private mat = cardMaterial(this.litTex, this.glowTex);
  private xLit = { value: this.litTex as THREE.Texture | null };
  private xmat = xrayMaterial(this.xLit);
  private slots = new Map<string, Slot>();
  private byIndex: Slot[] = [];
  private free: number[] = [];
  private rows = 0;
  private frame = 0;
  private drawn = false;
  private c: Ctx = { lit: this.lit, glow: this.glow, now: 0 };
  private ppu = 16;
  private k = 1;
  private P: Proj = () => [0, 0];
  private W = 1;
  private H = 1;
  /** Milliseconds spent drawing the cells this frame (the perf readout). */
  ms = 0;
  private t0 = 0;

  constructor() {
    this.grow(2);
  }

  private texture(cv: HTMLCanvasElement): THREE.CanvasTexture {
    const t = new THREE.CanvasTexture(cv);
    Object.assign(t, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false, flipY: false });
    return t;
  }

  /** A frame begins: the view's scale, its projection and size, and the clocks the flat code draws by. */
  begin(ppu: number, P: Proj, W: number, H: number, now: number, t: number): void {
    this.t0 = performance.now();
    this.frame++;
    this.drawn = false;
    // One sprite pixel to one view pixel (whole multiples only, so it never blurs).
    Object.assign(this, { ppu, P, W, H, k: Math.max(1, Math.round((ppu * COS) / 16)) });
    this.c.now = now;
    this.c.t = t;
  }

  /** A figure with its feet at (x, z) on the floor, `h` up (a ledge), drawn by `draw` at (x, y) in its cell. */
  put(key: string, x: number, h: number, z: number, draw: Draw, o: Opts = {}): void {
    const [sx, sy] = this.P(x, h, z), k = this.k, mx = CELL.w * k, my = CELL.h * k;
    if (sx < -mx || sy < -my || sx > this.W + mx || sy > this.H + my) return;
    const s = this.slot(key);
    s.seen = this.frame;
    s.hero = !!o.xray;
    const ox = (s.i % COLS) * CELL.w, oy = Math.floor(s.i / COLS) * CELL.h;
    for (const g of [this.lit, this.glow]) g.save(), g.clearRect(ox, oy, CELL.w, CELL.h), g.beginPath(), g.rect(ox, oy, CELL.w, CELL.h), g.clip();
    BARE.on = true;
    try {
      draw(this.c, ox + CELL.fx, oy + CELL.fy);
    } finally {
      BARE.on = false;
      this.lit.restore();
      this.glow.restore();
    }
    this.drawn = true;
    // Snapped so the card's pixels fall on the view's: across by x, down the screen by z.
    const px = x + (Math.round(sx) - sx) / this.ppu, pz = z + (Math.round(sy) - sy) / (this.ppu * SIN), b = o.bias ?? 0;
    const card = s.card;
    card.position.set(px, h, pz).addScaledVector(BACK, b);
    card.scale.set(k / this.ppu, k / (this.ppu * COS), k / (this.ppu * SIN));
    card.visible = true;
    card.layers.set(o.xray ? XRAY_LAYER : 0);
    s.pool.visible = !!o.pool;
    if (o.pool) s.pool.position.set(x, h + 0.01, z), s.pool.scale.set(o.pool * 2.4, 1, o.pool * 1.6);
  }

  /** Hide whoever wasn't drawn this frame and send the atlas up if anything was. */
  end(): void {
    for (const [key, s] of this.slots) if (s.seen !== this.frame) {
      s.card.visible = s.pool.visible = false;
      this.slots.delete(key);
      this.free.push(s.i);
    }
    this.free.sort((a, b) => b - a);
    if (this.drawn) this.litTex.needsUpdate = this.glowTex.needsUpdate = true;
    this.ms = this.ms * 0.9 + (performance.now() - this.t0) * 0.1;
  }

  /** The heroes' cards as their silhouette (for the pass that shows them behind walls), or back. */
  xray(on: boolean): void {
    for (const s of this.slots.values()) if (s.hero) s.card.material = on ? this.xmat : this.mat;
  }

  get count(): number {
    return this.slots.size;
  }

  private slot(key: string): Slot {
    let s = this.slots.get(key);
    if (s) return s;
    const i = this.free.length ? this.free.pop()! : this.byIndex.length;
    s = this.byIndex[i];
    if (!s) {
      const card = new THREE.Mesh(this.fold(i), this.mat), pool = new THREE.Mesh(DISC, POOL);
      card.receiveShadow = true;
      card.frustumCulled = pool.frustumCulled = false;
      this.group.add(card, pool);
      this.byIndex[i] = s = { i, card, pool, seen: 0, hero: false };
      if (Math.ceil((i + 1) / COLS) > this.rows) this.grow(this.rows + 2);
    }
    s.card.material = this.mat;
    this.slots.set(key, s);
    return s;
  }

  /** The folded card for cell i, in sprite pixels: upright above the feet, flat on the floor below them. */
  private fold(i: number): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry(), { w, fx, fy, h } = CELL, l = -fx, r = w - fx;
    g.setAttribute('position', new THREE.Float32BufferAttribute([l, fy, 0, r, fy, 0, l, 0, 0, r, 0, 0, l, 0, h - fy, r, 0, h - fy], 3));
    // The normal as it will come out after the card's uneven scale, so the light lands as FACE says.
    const n = new THREE.Vector3(0, FACE.y / COS, FACE.z / SIN).normalize();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: 6 }, () => [n.x, n.y, n.z]).flat(), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(12).fill(0), 2));
    g.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]);
    this.mapUv(g, i);
    return g;
  }

  private mapUv(g: THREE.BufferGeometry, i: number): void {
    const W = COLS * CELL.w, H = this.rows * CELL.h || CELL.h, x0 = (i % COLS) * CELL.w, y0 = Math.floor(i / COLS) * CELL.h;
    const u0 = x0 / W, u1 = (x0 + CELL.w) / W, v0 = y0 / H, vf = (y0 + CELL.fy) / H, v1 = (y0 + CELL.h) / H;
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    uv.set([u0, v0, u1, v0, u0, vf, u1, vf, u0, v1, u1, v1]);
    uv.needsUpdate = true;
  }

  /** More rows in the atlas: new canvases' worth of texture, every card's corners moved to match. */
  private grow(rows: number): void {
    // Resizing a canvas wipes it: keep the cells already drawn this frame (a hero drawn before a new
    // goblin needed the room went blank for a frame whenever the atlas grew).
    const keep = [this.litC, this.glowC].map((cv) => {
      const k = document.createElement('canvas');
      (k.width = cv.width), (k.height = cv.height), k.getContext('2d')!.drawImage(cv, 0, 0);
      return k;
    });
    this.rows = rows;
    this.litC.width = this.glowC.width = COLS * CELL.w;
    this.litC.height = this.glowC.height = rows * CELL.h;
    for (const g of [this.lit, this.glow]) g.imageSmoothingEnabled = false;
    this.lit.drawImage(keep[0], 0, 0);
    this.glow.drawImage(keep[1], 0, 0);
    this.litTex.dispose();
    this.glowTex.dispose();
    this.litTex = this.texture(this.litC);
    this.glowTex = this.texture(this.glowC);
    this.mat.map = this.xLit.value = this.litTex;
    (this.mat.userData.glow as { value: THREE.Texture }).value = this.glowTex;
    for (const s of this.byIndex) if (s) this.mapUv(s.card.geometry, s.i);
  }
}
