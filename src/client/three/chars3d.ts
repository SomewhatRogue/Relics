/**
 * The new look's characters (docs/decisions/new-look-characters.md), behind `?look=3d&hd&street`: the Warrior as the
 * concepts' knight and the knife goblins as the concepts' goblin, at the new density (32 px a tile, the knight 80
 * tall), each on its own card standing at its feet and turned to the chase camera, lit by the 3D lights like the flat
 * figures' cards (figmat.ts). Two ways to make them, for Kyle to choose: `&chars=sheet` (the default) shows the
 * generated frames (charkit/, scripts/charprep.py) picked by the act; `&chars=parts` moves the idle frame's parts with
 * the pose code (charparts.ts). `&chars=old` keeps today's figures. The old card is kept for its shadow and left
 * empty. Only draws.
 */
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import type { Enemy, Hero } from '../../sim/types';
import { WEAPONS } from '../../shared/tuning';
import { heroPose } from '../heropose';
import { scrapperPose } from '../foepose';
import type { BodyPose } from '../motion';
import { WHITE } from '../motion';
import { SWING } from '../swing';
import { colFor, rowFor } from '../charframe';
import type { Lerp } from './actors3d';
import { PITCH } from './camera3d';
import { cardMaterial } from './figmat';
import type { Figs } from './figs3d';
import { LEDGE_H } from './ground';
import { STREET } from './streetkit';
import { drawParts, type Kit } from './charparts';
import META from './charkit/chars.json';

const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('chars') : null;
/** Which way this screen makes the new characters, or '' for today's figures. */
export const CHARS: '' | 'sheet' | 'parts' = !STREET || Q === 'old' ? '' : Q === 'parts' ? 'parts' : 'sheet';

const PICS = import.meta.glob('./charkit/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const PX = 32, COS = Math.cos(PITCH);
const FACE = new THREE.Vector3(0, 0.75, 0.66).normalize();
/** The goblins drawn as the knife goblin: the plain ones, the lungers and the looters. */
const KNIFE = new Set([undefined, 'lunger', 'looter']);
const NONE = () => {};

interface Sheet extends Kit { tex: { lit: THREE.Texture; glow: THREE.Texture; white: THREE.Texture } | null }
interface Fig { pivot: THREE.Object3D; mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; seen: number; lit?: HTMLCanvasElement; glow?: HTMLCanvasElement; litT?: THREE.CanvasTexture; glowT?: THREE.CanvasTexture }

const canvasTex = (cv: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(cv);
  Object.assign(t, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false, flipY: false });
  return t;
};
const blank = (w: number, h: number) => Object.assign(document.createElement('canvas'), { width: w, height: h });

/** A character's sheet, its glow and a white silhouette (the hit flash), loaded once. */
function loadSheet(name: keyof typeof META): Sheet {
  const m = META[name], img = new Image(), gimg = new Image();
  const s: Sheet = { lit: blank(1, 1), glow: blank(1, 1), white: blank(1, 1), w: m.w, h: m.h, fx: m.fx, fy: m.fy, tex: null };
  let n = 0;
  const done = () => {
    if (++n < 2) return;
    s.lit = blank(img.width, img.height);
    s.lit.getContext('2d')!.drawImage(img, 0, 0);
    s.glow = blank(img.width, img.height);
    s.glow.getContext('2d')!.drawImage(gimg, 0, 0);
    s.white = blank(img.width, img.height);
    const w = s.white.getContext('2d')!;
    w.drawImage(img, 0, 0);
    (w.globalCompositeOperation = 'source-in'), (w.fillStyle = '#fff'), w.fillRect(0, 0, img.width, img.height);
    s.tex = { lit: canvasTex(s.lit), glow: canvasTex(s.glow), white: canvasTex(s.white) };
  };
  (img.onload = gimg.onload = done), (img.src = PICS[`./charkit/${name}.png`]), (gimg.src = PICS[`./charkit/${name}-glow.png`]);
  return s;
}

const RO = { row: 0, flip: false };

export class Chars {
  readonly group = new THREE.Group();
  private kits = { knight: loadSheet('knight'), goblin: loadSheet('goblin') };
  private figs = new Map<string, Fig>();
  private frame = 0;

  /** Every new-look figure this frame; their old cards emptied (kept for the shadow). After cards3d's putCards. */
  put(f: Figs, room: ArenaRoom, meId: string, others: Hero[], lerp: Lerp, now: number): void {
    this.frame++;
    const t = room.time;
    const hero = (h: Hero, key: string, x: number, y: number) => {
      if (WEAPONS[h.weapon].cls !== 'WARRIOR' || h.act === 'down') return;
      const up = (h.z ?? 0) * LEDGE_H;
      if (this.show(key, this.kits.knight, x, up, y, h.fx, h.fy, heroPose(h, t, now), h.moving, now, 3)) f.put(key, x, up, y, NONE, { pool: 0.3 });
    };
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      hero(h, 'h' + h.id, x, y);
    }
    for (const h of others) hero(h, 'o' + h.id, h.x, h.y);
    for (const e of room.enemies) if (this.goblin(e, room)) {
      const [x, y] = lerp('e:' + e.id, e.x, e.y), up = Math.max(0, e.z ?? 0) * LEDGE_H;
      if (this.show('e' + e.id, this.kits.goblin, x, up, y, e.fx, e.fy, scrapperPose(e, t, now), e.moving, now, 2)) f.put('e' + e.id, x, up, y, NONE, { pool: 0.28 });
    }
    for (const [key, g] of this.figs) if (g.seen !== this.frame) (g.pivot.visible = false), this.figs.delete(key), this.drop(g);
  }

  /** A knife goblin on its feet, not held, hauled or on a roof. */
  private goblin(e: Enemy, room: ArenaRoom): boolean {
    if (e.kind !== 'scrapper' || !KNIFE.has(e.variant) || (e.z ?? 0) >= 2) return false;
    if (e.act === 'dead' || e.act === 'carried' || e.act === 'pinned' || e.corpse) return false;
    return !room.heroes.some((h) => h.carrying === e.id);
  }

  /** One figure on its card; false until its sheet has loaded (today's card stays meanwhile). */
  private show(key: string, k: Sheet, x: number, up: number, z: number, fx: number, fy: number, p: BodyPose, moving: boolean, now: number, scale: number): boolean {
    if (!k.tex) return false;
    const g = this.fig(key, k), { row, flip } = rowFor(fx, fy, SWING.yaw, RO), white = p.flash > 0.4 && p.tint === WHITE;
    if (CHARS === 'parts') {
      const lit = g.lit!.getContext('2d')!, glow = g.glow!.getContext('2d')!;
      lit.clearRect(0, 0, k.w, k.h), glow.clearRect(0, 0, k.w, k.h);
      drawParts({ lit, glow, now }, k, row, flip, p, scale, moving, now);
      g.litT!.needsUpdate = g.glowT!.needsUpdate = true;
      this.uv(g.mesh, 0, 0, 1, 1, false);
    } else {
      const col = colFor(p.phase, p.k, moving, now), W = k.lit.width, H = k.lit.height;
      this.uv(g.mesh, (col * k.w) / W, (row * k.h) / H, ((col + 1) * k.w) / W, ((row + 1) * k.h) / H, flip);
      (g.mat.userData.glow as { value: THREE.Texture }).value = white ? k.tex.white : k.tex.glow;
    }
    // Stood at the feet (mirrored, the feet are as far from the other edge), turned to face the camera.
    g.mesh.position.x = -(flip ? k.w - k.fx : k.fx) / PX;
    g.pivot.position.set(x, up, z);
    g.pivot.rotation.y = -SWING.yaw;
    g.pivot.visible = true;
    g.seen = this.frame;
    return true;
  }

  private fig(key: string, k: Sheet): Fig {
    let g = this.figs.get(key);
    if (g) return g;
    const geo = new THREE.BufferGeometry(), w = k.w / PX, h = k.h / (PX * COS), d = (k.h - k.fy) / (PX * COS);
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, h - d, 0, w, h - d, 0, 0, -d, 0, w, -d, 0], 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: 4 }, () => [FACE.x, FACE.y, FACE.z]).flat(), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(8).fill(0), 2));
    geo.setIndex([0, 2, 1, 1, 2, 3]);
    g = { pivot: new THREE.Object3D(), mesh: null!, mat: null!, seen: 0 };
    if (CHARS === 'parts') {
      (g.lit = blank(k.w, k.h)), (g.glow = blank(k.w, k.h));
      for (const c of [g.lit, g.glow]) c.getContext('2d')!.imageSmoothingEnabled = false;
      (g.litT = canvasTex(g.lit)), (g.glowT = canvasTex(g.glow));
      g.mat = cardMaterial(g.litT, g.glowT);
    } else g.mat = cardMaterial(k.tex!.lit, k.tex!.glow);
    g.mesh = new THREE.Mesh(geo, g.mat);
    g.mesh.frustumCulled = false;
    g.mesh.receiveShadow = true;
    g.pivot.add(g.mesh);
    this.group.add(g.pivot);
    this.figs.set(key, g);
    return g;
  }

  private uv(m: THREE.Mesh, u0: number, v0: number, u1: number, v1: number, flip: boolean): void {
    const a = m.geometry.getAttribute('uv') as THREE.BufferAttribute, [l, r] = flip ? [u1, u0] : [u0, u1];
    a.set([l, v0, r, v0, l, v1, r, v1]);
    a.needsUpdate = true;
  }

  private drop(g: Fig): void {
    this.group.remove(g.pivot);
    g.mesh.geometry.dispose();
    g.mat.dispose();
    g.litT?.dispose(), g.glowT?.dispose();
  }
}
