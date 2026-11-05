/**
 * The room's still parts in 3D: the floor (the 2D floor painting itself, laid flat, so floors, soil,
 * marks and water match the pixel view, with blood added as it's spilled), the back wall with its
 * painted face and real thickness and the gap of the way out, low side walls, ledges, the round things,
 * torches and braziers (their flames and light by the hour: lamps3d.ts). Static boxes are merged into one mesh.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { torchIn } from '../daytime';
import type { Fx } from '../fx';
import { OX, OY, PX } from '../world';
import { Boxes, Seed, jit } from './boxes';
import type { Lamp3 } from './lamps3d';
import type { L3 } from './lights3d';
import { VCOL } from './mats';
import { toonize } from './post';
import { addRound, type Spot } from './rounds3d';
import { addBridge } from './bridge3d';
import { sideGaps } from '../sidegaps';
import { waysOut } from '../wayout';

/** How high the back wall stands, and a ledge (tiles). */
export const WALL_H = 2.4;
export const LEDGE_H = 0.75;

export interface Ground { group: THREE.Group; fires: Spot[]; lights: L3[]; lamps: Lamp3[]; decals(fx: Fx): void; dispose(): void }

const BODY: Record<GameMap['theme']['back'], number> = { stone: 0x2a2733, palisade: 0x2e2016, trees: 0x10160e, rockface: 0x26242c, plaster: 0x2a2018 };

function texture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}

export function buildGround(m: GameMap, bg: HTMLCanvasElement): Ground {
  const group = new THREE.Group(), B = new Boxes(), r = new Seed(m.w * 7 + m.h), fires: Spot[] = [], lights: L3[] = [], lamps: Lamp3[] = [];
  const tk = torchIn(m.theme), body = BODY[m.theme.back];
  // The floor: the 2D painting's floor, a copy we can bleed on.
  const fc = document.createElement('canvas');
  fc.width = m.w * PX;
  fc.height = m.h * PX;
  const fg = fc.getContext('2d')!;
  fg.drawImage(bg, OX, OY, fc.width, fc.height, 0, 0, fc.width, fc.height);
  const floorTex = texture(fc), floorMat = toonize(new THREE.MeshLambertMaterial({ map: floorTex }));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(m.w / 2, 0, m.h / 2);
  floor.receiveShadow = true;
  group.add(floor);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(m.w + 60, m.h + 60), VCOL);
  under.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(0.05), 3));
  under.rotation.x = -Math.PI / 2;
  under.position.set(m.w / 2, -0.02, m.h / 2);
  group.add(under);
  // The back wall: its painted face (from the 2D painting) on a wall with thickness, cut for the way out.
  const wc = document.createElement('canvas');
  wc.width = bg.width;
  wc.height = OY - 8;
  wc.getContext('2d')!.drawImage(bg, 0, 8, bg.width, wc.height, 0, 0, bg.width, wc.height);
  const wallMat = toonize(new THREE.MeshLambertMaterial({ map: texture(wc) }));
  const gaps = [m.exit, ...(m.roads ?? []).map((q) => q.area)].filter((a): a is NonNullable<typeof a> => !!a && a.y < 1).sort((a, b) => a.x - b.x);
  const segs: [number, number][] = [];
  let at = -1;
  for (const g of gaps) segs.push([at, g.x]), (at = g.x + g.w);
  segs.push([at, m.w + 1]);
  for (const [a, b] of segs) {
    if (b - a < 0.05) continue;
    B.b((a + b) / 2, 0, -0.55, b - a, WALL_H, 1.1, body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(b - a, WALL_H), wallMat), uv = face.geometry.getAttribute('uv') as THREE.BufferAttribute;
    const u0 = (OX + a * PX) / bg.width, u1 = (OX + b * PX) / bg.width;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) < 0.5 ? u0 : u1);
    face.position.set((a + b) / 2, WALL_H / 2, 0.005);
    face.receiveShadow = true;
    group.add(face);
    // What tops it: a stone coping, stake points, the trees' crowns, broken rock.
    for (let x = a; x < b - 0.01; x += 0.5) {
      const w = Math.min(0.5, b - x), th = m.theme.back;
      if (th === 'stone' || th === 'plaster') B.b(x + w / 2, WALL_H, -0.5, w - 0.03, 0.14, 1.2, jit(0x4f4a5c, 0.1, r));
      else if (th === 'palisade') B.c(x + w / 2, WALL_H + 0.12, -0.2, 0.22, 0.3, 0.22, jit(0x4a3424, 0.1, r), 0.78);
      else if (th === 'trees') B.lump(x + w / 2, WALL_H + 0.25 + r.next() * 0.4, -0.6, 1.1, 0.85, 1.3, jit(0x24391f, 0.2, r), r.next() * 3);
      else B.c(x + w / 2, WALL_H + r.next() * 0.3, -0.5, 0.6, 0.5, 1.1, jit(0x34313a, 0.2, r), r.next(), 0.2);
    }
  }
  for (const g of gaps) for (const gx of [g.x - 0.1, g.x + g.w + 0.1]) B.b(gx, 0, -0.2, 0.24, WALL_H + 0.3, 0.4, 0x3a3640);
  // Low side walls and a kerb along the front, so the room has edges without hiding anyone.
  // Cut where a way out or a side way goes through them (layout 3: ../sidegaps.ts), a post either side.
  const cuts = sideGaps(m, waysOut(m)), runs = (a: number, b: number, holes: [number, number][]) => {
    const out: [number, number][] = [];
    let at = a;
    for (const [h0, h1] of holes.sort((p, q) => p[0] - q[0])) (out.push([at, h0]), (at = h1));
    return [...out, [at, b] as [number, number]].filter(([p, q]) => q - p > 0.05);
  };
  for (const [sx, side] of [[-0.45, 'W'], [m.w + 0.45, 'E']] as const) {
    const holes = cuts.filter((g) => g.side === side).map((g): [number, number] => [g.a.y, g.a.y + g.a.h]);
    for (const [z0, z1] of runs(-1, m.h, holes)) B.b(sx, 0, (z0 + z1) / 2, 0.9, 1.0, z1 - z0, body);
    for (const [z0, z1] of holes) for (const z of [z0, z1]) B.b(sx, 0, z, 0.3, 1.5, 0.3, 0x3a3640);
  }
  const kerb = cuts.filter((g) => g.side === 'S').map((g): [number, number] => [g.a.x, g.a.x + g.a.w]);
  for (const [x0, x1] of runs(-0.9, m.w + 0.9, kerb)) B.b((x0 + x1) / 2, 0, m.h + 0.3, x1 - x0, 0.25, 0.6, body);
  for (const [x0, x1] of kerb) for (const x of [x0, x1]) B.b(x, 0, m.h + 0.3, 0.3, 0.9, 0.3, 0x3a3640);
  for (const l of m.ledges ?? []) {
    B.b(l.x + l.w / 2, 0, l.y + l.h / 2, l.w, LEDGE_H, l.h, l.kind === 'wood' ? 0x5a3d22 : 0x3a3640);
    for (const rp of l.ramps) B.b(rp.x + rp.w / 2, 0, rp.y + rp.h / 2, rp.w, LEDGE_H * 0.45, rp.h, 0x46424e);
  }
  for (const k of m.marks ?? []) if (k.kind === 'bridge') addBridge(B, k);
  // The tended lamps (torches, braziers, lamp posts) give flames and light only while lit (lamps3d.ts).
  for (const o of m.rounds) {
    const n = fires.length;
    addRound(B, o, fires, r);
    if (o.kind === 'post') lamps.push({ x: o.x, y: o.y, fires: fires.splice(n), light: { x: o.x, y: 1.6, z: o.y, r: 4.5, i: 0.8, c: [1, 0.72, 0.42], f: 9 } });
  }
  for (const t of m.torches) {
    // A cottage's fire is a torch in its hearth's mouth (shared/inside.ts): its flames on the hearth's floor.
    const hearth = m.blocks.find((b) => b.kind === 'hearth' && t.x > b.x && t.x < b.x + b.w && t.y > b.y - 0.1 && t.y < b.y + b.h + 0.1);
    if (hearth) {
      lamps.push({ x: t.x, y: t.y, always: true, fires: [[t.x, 0.05, t.y - 0.05, 0.75]], light: { x: t.x, y: 0.7, z: t.y + 0.7, r: 7, i: 1.1, c: [1, 0.62, 0.32], f: 13 } });
      continue;
    }
    const onWall = t.y < 0.8, y = onWall ? 1.55 : 1.3, z = onWall ? 0.16 : t.y;
    if (onWall) B.b(t.x, y - 0.3, 0.06, 0.08, 0.32, 0.14, 0x3a2a1a);
    else B.b(t.x, 0, z, 0.1, y, 0.1, 0x3a2a1a);
    B.b(t.x, y - 0.02, onWall ? 0.06 : z, 0.11, 0.08, onWall ? 0.16 : 0.11, 0x1a1410);
    lamps.push({ x: t.x, y: t.y, fires: [[t.x, y, z, 0.7]], light: { x: t.x, y: y + 0.4, z: z + 0.5, r: 8, i: 1.1, c: [1, 0.66, 0.36], f: 13 } });
  }
  for (const b of m.braziers) {
    B.b(b.x, 0, b.y, 0.12, 0.6, 0.12, 0x2a2630);
    B.b(b.x, 0.55, b.y, 0.55, 0.18, 0.55, 0x3a3640);
    // Ash in the bowl (the flames stand over it while it's lit).
    B.b(b.x, 0.73, b.y, 0.42, 0.02, 0.42, 0x5a5660);
    lamps.push({ x: b.x, y: b.y, always: b.wild, fires: [[b.x - 0.1, 0.72, b.y, 1], [b.x + 0.12, 0.72, b.y + 0.05, 0.9]], light: { x: b.x, y: 1.4, z: b.y, r: 6, i: 0.95, c: [1, 0.6, 0.3], f: 11 } });
  }
  for (const o of m.rounds) {
    if (o.kind === 'cookfire') lights.push({ x: o.x, y: 1.6, z: o.y, r: 4.5, i: 0.8 * tk, c: [1, 0.72, 0.42], f: 9 });
    // The Last Lantern never goes out (but its light, like any fire's, fades under the sun: lamps3d.ts).
    if (o.kind === 'lantern') lamps.push({ x: o.x, y: o.y, always: true, fires: [], light: { x: o.x, y: 2.4, z: o.y, r: 9, i: 1.2, c: [1, 0.78, 0.45], f: 3 } });
    if (o.kind === 'candles') lights.push({ x: o.x, y: 1.2, z: o.y, r: 3.5, i: 0.7, c: [1, 0.78, 0.48], f: 11 });
  }
  const statics = B.mesh(VCOL);
  if (statics) group.add(statics);
  // Blood spilled since the last frame goes into the floor's painting.
  const done = new WeakSet<object>();
  let dirty = 0;
  const decals = (fx: Fx) => {
    for (let i = fx.decals.length - 1; i >= 0; i--) {
      const d = fx.decals[i];
      if (done.has(d)) break;
      done.add(d);
      fg.fillStyle = d.col;
      fg.fillRect(d.x - OX, d.y - OY, 1, 1);
      dirty++;
    }
    if (dirty) (floorTex.needsUpdate = true), (dirty = 0);
  };
  const dispose = () => group.traverse((o) => {
    const mm = o as THREE.Mesh;
    if (mm.isMesh && mm.geometry !== statics?.geometry) mm.geometry.dispose();
  });
  return { group, fires, lights, lamps, decals, dispose: () => (dispose(), statics?.geometry.dispose(), floorTex.dispose(), floorMat.dispose(), wallMat.map?.dispose(), wallMat.dispose()) };
}
