/**
 * The new look's characters (docs/decisions/new-look-characters.md), behind `?look=3d&hd&street`: the Warrior as the
 * concepts' knight and the knife goblins as the concepts' goblin, at the new density (32 px a tile, the knight 80
 * tall), each on its own card standing at its feet and turned to the chase camera, lit by the 3D lights like the flat
 * figures' cards (figmat.ts).
 *
 * `&chars=sheet` plays the generated frames (charkit/, scripts/charprep.py: per facing a walk of eight,
 * each blow in five, the reactions), picked by the pose code's phase (charframe.ts), and moves the card the way the
 * pose code moves today's figures: it leans (sheared from the feet), squashes into a blow's landing and a crouch,
 * shifts by the pose's offsets (a lunge, a stagger's shake), flashes white then red when struck, rolls over in a
 * roll; the walk follows the ground covered so the feet plant. A blow is pushed further than its frames: the body
 * sinks and leans back on the windup and throws forward, stretched, as it snaps out. A sword blow's danger area is
 * swept in the world at the blade's height, along the arc the room judges (held.ts), bright at the blade and fading
 * behind it (in place of extras3d.ts's dotted trail at the old figures' waist). A goblin falls through its death and
 * dissolves away; burned, it is charred.
 * `&chars=parts` moves the idle frame's parts with the pose code (charparts.ts). Without either, today's figures.
 * The old card is kept for its shadow and left empty. Only draws.
 */
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import type { Enemy, Hero } from '../../sim/types';
import { WEAPONS } from '../../shared/tuning';
import { heroPose } from '../heropose';
import { pose as heldPose } from '../held';
import { PX as ROOM_PX } from '../world';
import { scrapperPose } from '../foepose';
import type { BodyPose } from '../motion';
import { SWING } from '../swing';
import { blowFrames, facingFor, goblinShows, knightShows, rowOf, walkCol, type Facing, type KitMeta, type Shown } from '../charframe';
import type { Lerp } from './actors3d';
import { PITCH } from './camera3d';
import { cardMaterial } from './figmat';
import type { Figs } from './figs3d';
import { levelAt } from '../../shared/arena';
import { LEDGE_H } from './ground';
import { bodyLv } from '../../shared/heights';
import { STREET } from './streetkit';
import { drawParts, type Kit } from './charparts';
import META from './charkit/chars.json';
import { THROWN } from '../../shared/tuning';

const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('chars') : null;
/** Which way this screen makes the new characters, or '' for today's figures (the default since 2026-11-15: Kyle
 *  found them flat; they stay to be asked for, `&chars=sheet` or `&chars=parts`). */
export const CHARS: '' | 'sheet' | 'parts' = !STREET ? '' : Q === 'parts' ? 'parts' : Q === 'sheet' ? 'sheet' : '';

/** Whether this hero is drawn new (its swing's danger area drawn here too, not as extras3d.ts's dotted trail). */
export const drawnNew = (h: Hero): boolean => CHARS !== '' && WEAPONS[h.weapon].cls === 'WARRIOR';

const PICS = import.meta.glob('./charkit/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const PX = 32, COS = Math.cos(PITCH);
/** Room round a frame on its card for what goes past the body: a blow's smear, a lean. */
const MX = 56, MY = 48;
const FACE = new THREE.Vector3(0, 0.75, 0.66).normalize();
/** The goblins drawn as the knife goblin: the plain ones, the lungers and the looters. */
const KNIFE = new Set([undefined, 'lunger', 'looter']);
/** Tiles a full stride (both feet) covers: the knight's long legs, the goblin's scuttle. */
const STRIDE = { knight: 1.9, goblin: 1.15 };
/** The pose code's pixels at this density: a hero's 1.5 at twice the density; a goblin's 1 at twice. */
const POSE = { knight: 3, goblin: 2 };
/** How far a crouch squashes the card (and widens it), and a blow's landing on top. */
const SQUASH = { crouch: 0.22, widen: 0.1, impact: 0.06 };
/** A blow pushed past its frames: on the windup the body sinks and leans back (pixels at the top, a crouch share);
 *  as it snaps out it throws forward, stretched; the hit lands squashed. */
const PUSH = { back: 7, sink: 0.12, forward: 9, stretch: -0.1 };
/** A sword blow's danger area in the world: the blade's height (tiles), how much of the reach it fills from the
 *  edge in, its colours (a heavy gold, a counter orange, white on the hit). */
const SWEEP = { y: 1.05, inner: 0.42, segs: 22, cols: { cut: [1, 1, 1], heavy: [1, 0.91, 0.66], counter: [1, 0.63, 0.25] } };
const NONE = () => {};

interface Sheet extends Kit { meta: KitMeta; ready: boolean }
interface Fig { sweep?: THREE.Mesh; pivot: THREE.Object3D; mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; seen: number; lit: HTMLCanvasElement; glow: HTMLCanvasElement; litT: THREE.CanvasTexture; glowT: THREE.CanvasTexture; x: number; z: number; dist: number }

const blank = (w: number, h: number) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const canvasTex = (cv: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(cv);
  Object.assign(t, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false, flipY: false });
  return t;
};

/** A character's kit, its glow and a white silhouette (the hit flash), loaded once. */
function loadKit(name: keyof typeof META): Sheet {
  const meta = META[name] as unknown as KitMeta, img = new Image(), gimg = new Image();
  const idle = (f: Facing): [number, number] => [rowOf(meta, f, meta.rows[1][0]), 4];
  const s: Sheet = { meta, lit: blank(1, 1), glow: blank(1, 1), white: blank(1, 1), w: meta.w, h: meta.h, fx: meta.fx, fy: meta.fy, idle: { front: idle('front'), side: idle('side'), back: idle('back') }, ready: false };
  let n = 0;
  const done = () => {
    if (++n < 2) return;
    const copy = (im: HTMLImageElement) => {
      const c = blank(im.width, im.height);
      c.getContext('2d')!.drawImage(im, 0, 0);
      return c;
    };
    (s.lit = copy(img)), (s.glow = copy(gimg)), (s.white = copy(img));
    const w = s.white.getContext('2d')!;
    (w.globalCompositeOperation = 'source-in'), (w.fillStyle = '#fff'), w.fillRect(0, 0, img.width, img.height);
    s.ready = true;
  };
  (img.onload = gimg.onload = done), (img.src = PICS[`./charkit/${name}.png`]), (gimg.src = PICS[`./charkit/${name}-glow.png`]);
  return s;
}

/** A 4x4 ordered-dither pattern: a corpse dissolves away pixel by pixel, the pixel-art way. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = new Map<number, CanvasPattern | null>();
function ditherOut(g: CanvasRenderingContext2D, gone: number, w: number, h: number): void {
  const lv = Math.min(16, Math.round(gone * 16));
  if (lv <= 0) return;
  let pat = dither.get(lv);
  if (pat === undefined) {
    const c = blank(4, 4), x = c.getContext('2d')!;
    for (let i = 0; i < 16; i++) if (BAYER[i] < lv) x.fillRect(i % 4, i >> 2, 1, 1);
    dither.set(lv, (pat = g.createPattern(c, 'repeat')));
  }
  if (!pat) return;
  g.save();
  (g.globalCompositeOperation = 'destination-out'), (g.fillStyle = pat), g.fillRect(0, 0, w, h);
  g.restore();
}

const FO = { facing: 'side' as Facing, flip: false }, SH: Shown = { row: '', col: 0 };

export class Chars {
  readonly group = new THREE.Group();
  private kits = { knight: loadKit('knight'), goblin: loadKit('goblin') };
  private figs = new Map<string, Fig>();
  private frame = 0;

  /** Every new-look figure this frame; their old cards emptied (kept for the shadow). After cards3d's putCards. */
  put(f: Figs, room: ArenaRoom, meId: string, others: Hero[], lerp: Lerp, now: number): void {
    this.frame++;
    const t = room.time;
    const hero = (h: Hero, key: string, x: number, y: number) => {
      const w = WEAPONS[h.weapon];
      if (w.cls !== 'WARRIOR' || h.act === 'down' || h.act === 'carry' || h.act === 'slam') return;
      const up = bodyLv(room.map, x, y, h.z) * LEDGE_H, g = this.fig(key, this.kits.knight);
      if (!g) return;
      const p = heroPose(h, t, now), walk = this.walked(g, x, y, h.moving, STRIDE.knight);
      knightShows({ act: h.act, heavy: h.heavy, combo: h.combo, blocking: h.blocking, phase: p.phase, k: p.k, moving: h.moving, walk }, SH, blowFrames(this.kits.knight.meta));
      this.sweep(g, h, x, up, y, now);
      const roll = h.act === 'roll' ? Math.min(1, (t - h.lastRollAt) / w.dodge.time) : -1;
      this.show(g, this.kits.knight, x, up, y, h.fx, h.fy, p, SH, POSE.knight, roll, -1, '', now, h.act === 'attack');
      f.put(key, x, up, y, NONE, { pool: 0.3 });
    };
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      hero(h, 'h' + h.id, x, y);
    }
    // (Another player's Warrior at the level they stand on.)
    for (const h of others) hero({ ...h, z: levelAt(room.map, h.x, h.y) }, 'o' + h.id, h.x, h.y);
    for (const e of room.enemies) if (this.goblin(e, room)) {
      // (Thrown in deep water, sim/drown.ts: sinking as it struggles, the water's surface over its lower half.)
      const sink = e.drownAt !== undefined && e.act !== 'dead' ? 0.25 + 0.35 * Math.min(1, (t - e.drownAt) / THROWN.drown) + Math.sin(now * 9 + e.id) * 0.05 : 0;
      const [x, y] = lerp('e:' + e.id, e.x, e.y), up = bodyLv(room.map, x, y, Math.max(0, e.z ?? 0)) * LEDGE_H - sink, key = 'e' + e.id, g = this.fig(key, this.kits.goblin);
      if (!g) continue;
      const dead = e.act === 'dead' ? e.actT : -1, p = scrapperPose(e, t, now), walk = this.walked(g, x, y, e.moving && dead < 0, STRIDE.goblin);
      goblinShows({ attack: e.attack?.kind ?? '', phase: p.phase, k: p.k, moving: e.moving, walk, dead }, SH);
      const fade = dead < 0 ? -1 : 1 - Math.max(0, 1 - e.actT / Math.max(0.01, e.actDur)) ** 0.5;
      this.show(g, this.kits.goblin, x, up, y, e.fx, e.fy, p, SH, POSE.goblin, -1, fade, e.death, now, !!e.attack && dead < 0);
      if (dead < 0) f.put(key, x, up, y, NONE, sink ? {} : { pool: 0.28 });
      else f.put(key, x, up, y, NONE);
    }
    for (const [key, g] of this.figs) if (g.seen !== this.frame) (g.pivot.visible = false), this.figs.delete(key), this.drop(g);
  }

  /** A knife goblin on its feet, or fallen whole (cut apart, burst, eaten or ashed it keeps today's drawing, gore and all). */
  private goblin(e: Enemy, room: ArenaRoom): boolean {
    if (e.kind !== 'scrapper' || !KNIFE.has(e.variant) || (e.z ?? 0) >= 2 || e.corpse) return false;
    if (e.act === 'carried' || e.act === 'pinned' || room.heroes.some((h) => h.carrying === e.id)) return false;
    if (e.act === 'dead') return (e.death === '' || e.death === 'fall' || e.death === 'burn') && !e.eaten && !e.ashed;
    return true;
  }

  /** The walk's frame: from the ground this figure has covered while walking (so the feet plant). */
  private walked(g: Fig, x: number, z: number, moving: boolean, stride: number): number {
    const d = Math.hypot(x - g.x, z - g.z);
    if (moving && d < 1) g.dist += d;
    else if (!moving) g.dist = 0;
    (g.x = x), (g.z = z);
    return walkCol(g.dist, stride);
  }

  private show(g: Fig, k: Sheet, x: number, up: number, z: number, fx: number, fy: number, p: BodyPose, s: Shown, scale: number, roll: number, gone: number, death: string, now: number, blow: boolean): void {
    const { facing, flip } = facingFor(fx, fy, SWING.yaw, FO), W = g.lit.width, H = g.lit.height, m = k.meta;
    const lit = g.lit.getContext('2d')!, glow = g.glow.getContext('2d')!;
    lit.clearRect(0, 0, W, H), glow.clearRect(0, 0, W, H);
    // Mirrored, the whole card turns about its middle: the hips land as far from the other edge.
    const ax = flip ? W - (MX + m.fx) : MX + m.fx, ay = MY + m.fy;
    if (CHARS === 'parts') {
      for (const c of [lit, glow]) c.save(), c.translate(MX, MY);
      drawParts({ lit, glow, now }, k, facing, flip, p, scale, p.phase === 'rest' && s.row === 'walk', now);
      for (const c of [lit, glow]) c.restore();
    } else {
      const row = rowOf(m, facing, s.row), sx = s.col * m.w, sy = row * m.h;
      for (const c of [lit, glow]) c.save(), flip && (c.translate(W, 0), c.scale(-1, 1));
      lit.drawImage(k.lit, sx, sy, m.w, m.h, MX, MY, m.w, m.h);
      glow.drawImage(k.glow, sx, sy, m.w, m.h, MX, MY, m.w, m.h);
      // Struck: a white wash, then the red fading (the pose's flash), never so strong the body is lost in it.
      if (p.flash > 0) {
        glow.globalAlpha = p.tint === '#ffffff' ? Math.min(0.6, p.flash * 0.8) : Math.min(0.28, p.flash * 0.4);
        glow.drawImage(k.white, sx, sy, m.w, m.h, MX, MY, m.w, m.h);
        (glow.globalAlpha = 1), (glow.globalCompositeOperation = 'source-atop'), (glow.fillStyle = p.tint), glow.fillRect(0, 0, W, H);
        glow.globalCompositeOperation = 'source-over';
      }
      for (const c of [lit, glow]) c.restore();
      // Burned to death: charred through, the eyes out.
      if (death === 'burn') (lit.globalCompositeOperation = 'source-atop'), (lit.fillStyle = 'rgba(18,10,8,0.82)'), lit.fillRect(0, 0, W, H), (lit.globalCompositeOperation = 'source-over'), glow.clearRect(0, 0, W, H);
    }
    if (gone > 0) ditherOut(lit, gone, W, H), ditherOut(glow, gone, W, H);
    g.litT.needsUpdate = g.glowT.needsUpdate = true;

    // The card: stood at the feet, leant (sheared from the feet up), squashed into a crouch and a blow's landing,
    // shifted by the pose's offsets, rolled over in a roll; turned to the camera.
    // A blow pushed: back and down over the windup, thrown forward and stretched as it snaps out, eased off after.
    const wind = blow && p.phase === 'windup' ? Math.min(1, p.k * 1.6) : 0, out = blow && p.phase === 'release' ? 1 : blow && p.phase === 'recover' ? Math.max(0, 1 - p.k * 2.5) : 0;
    const ahead = facing === 'side' ? (flip ? -1 : 1) : 0;
    const crouch = Math.max(-0.3, Math.min(0.5, p.crouch)) + (p.phase === 'contact' ? SQUASH.impact : 0) + wind * PUSH.sink + out * PUSH.stretch;
    const syk = 1 - crouch * SQUASH.crouch * 2, sxk = 1 + crouch * SQUASH.widen * 2;
    const lean = ((flip ? -1 : 1) * p.lean * scale + ahead * (out * PUSH.forward - wind * PUSH.back)) / PX, ox = (p.ox * scale) / PX, oy = (-p.oy * scale) / PX;
    const pos = g.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const turn = roll >= 0 ? (flip ? 1 : -1) * roll * Math.PI * 2 : 0, cy = (m.tall / 2) / (PX * COS);
    const corner = (i: number, cx: number, cyy: number) => {
      let X = ((cx - ax) / PX) * sxk, Y = ((ay - cyy) / (PX * COS)) * syk;
      X += lean * Math.max(0, Y) / (m.tall / (PX * COS));
      if (turn) {
        const dy = Y - cy, c = Math.cos(turn), sn = Math.sin(turn), x0 = X;
        (X = x0 * c - dy * sn), (Y = cy + x0 * sn + dy * c);
      }
      pos.setXYZ(i, X + ox, Y + oy, 0);
    };
    corner(0, 0, 0), corner(1, W, 0), corner(2, 0, H), corner(3, W, H);
    pos.needsUpdate = true;
    g.pivot.position.set(x, up, z);
    g.pivot.rotation.y = -SWING.yaw;
    g.pivot.visible = true;
    g.seen = this.frame;
  }

  /** A sword blow's danger area: the arc the room judges (held.ts: from where the blow starts to where the blade is),
   *  laid at the blade's height, bright at the blade and fading back along the sweep, white and full on the hit. */
  private sweep(g: Fig, h: Hero, x: number, up: number, z: number, now: number): void {
    const p = heldPose(h, now);
    if (h.act !== 'attack' || p.from === undefined || !p.reach) return void (g.sweep && (g.sweep.visible = false));
    if (!g.sweep) {
      const n = (SWEEP.segs + 1) * 3, geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 4).fill(1), 4));
      const idx: number[] = [];
      for (let i = 0; i < SWEEP.segs; i++) for (let r = 0; r < 2; r++) {
        const a = i * 3 + r, b = a + 3;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
      geo.setIndex(idx);
      g.sweep = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      g.sweep.frustumCulled = false;
      this.group.add(g.sweep);
    }
    const hold = h.hitstop > 0, R = p.reach / ROOM_PX, col = hold ? SWEEP.cols.cut : h.counter ? SWEEP.cols.counter : h.heavy ? SWEEP.cols.heavy : SWEEP.cols.cut;
    const pos = g.sweep.geometry.getAttribute('position') as THREE.BufferAttribute, c = g.sweep.geometry.getAttribute('color') as THREE.BufferAttribute;
    const span = p.a - p.from, y = up + SWEEP.y;
    for (let i = 0; i <= SWEEP.segs; i++) {
      const k = i / SWEEP.segs, a = p.from + span * k, ca = Math.cos(a), sa = Math.sin(a);
      // From the tail to the blade: the band widens and brightens; the edge is brightest, the inside clear.
      const lead = k ** 1.6, inner = R * (1 - (1 - SWEEP.inner) * (0.35 + 0.65 * k)), rs = [inner, (inner + R) / 2, R];
      const al = [0, (hold ? 0.55 : 0.32) * lead, (hold ? 1 : 0.85) * (0.15 + 0.85 * lead)];
      for (let r = 0; r < 3; r++) pos.setXYZ(i * 3 + r, x + ca * rs[r], y, z + sa * rs[r]), c.setXYZW(i * 3 + r, col[0], col[1], col[2], al[r]);
    }
    pos.needsUpdate = c.needsUpdate = true;
    g.sweep.visible = true;
  }

  private fig(key: string, k: Sheet): Fig | null {
    if (!k.ready) return null;
    let g = this.figs.get(key);
    if (g) return g;
    const W = k.w + 2 * MX, H = k.h + MY;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(12).fill(0), 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: 4 }, () => [FACE.x, FACE.y, FACE.z]).flat(), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
    geo.setIndex([0, 2, 1, 1, 2, 3]);
    const lit = blank(W, H), glow = blank(W, H);
    for (const c of [lit, glow]) c.getContext('2d')!.imageSmoothingEnabled = false;
    const litT = canvasTex(lit), glowT = canvasTex(glow), mat = cardMaterial(litT, glowT);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    g = { pivot: new THREE.Object3D(), mesh, mat, seen: 0, lit, glow, litT, glowT, x: 0, z: 0, dist: 0 };
    g.pivot.add(mesh);
    this.group.add(g.pivot);
    this.figs.set(key, g);
    return g;
  }

  private drop(g: Fig): void {
    this.group.remove(g.pivot);
    if (g.sweep) this.group.remove(g.sweep), g.sweep.geometry.dispose(), (g.sweep.material as THREE.Material).dispose();
    g.mesh.geometry.dispose();
    g.mat.dispose();
    g.litT.dispose(), g.glowT.dispose();
  }
}
