/**
 * A townsperson's figure in the pose of what they're at (siegedraw.ts drawWork is the flat one):
 * walking their round, standing about, creeping, a guard's spear, the gravedigger with the dead over
 * his shoulder or his spade going in, a blade on the whetstone, a bucket at the well; the column's
 * dead lying in what they bled; Hew after the bite. The bits in hand are built once and shown as needed.
 */
import * as THREE from 'three';
import type { Npc } from '../../shared/arena';
import { G, M } from './mats';
import type { NpcFig } from './npcs3d';
import { part, pivot, rest, walk } from './rig';

interface Kit { spade: THREE.Group; spear: THREE.Group; bundle: THREE.Group; blade: THREE.Group; bucket: THREE.Group; pool: THREE.Mesh; neck: THREE.Mesh }

const haft = M(0x6b4a2b), iron = M(0x8a8f9a), sacking = M(0x6a6670), blood = M(0x5a0c0c);

function kit(f: NpcFig): Kit {
  const k = f.root.userData.kit as Kit | undefined;
  if (k) return k;
  const spade = pivot(f.tool, 0, 0, 0);
  part(spade, 0.05, 0.9, 0.05, haft, 0, -0.1, 0.12), part(spade, 0.18, 0.2, 0.03, iron, 0, -0.6, 0.12);
  const spear = pivot(f.body, -0.4, 0, 0.05);
  part(spear, 0.05, 2.1, 0.05, haft, 0, 1.05, 0), part(spear, 0.07, 0.2, 0.03, M(0xcfd6dc), 0, 2.2, 0);
  // One of the dead, wrapped in sacking, across the shoulder.
  const bundle = pivot(f.shoulder, 0, 0.1, 0);
  part(bundle, 1.0, 0.24, 0.26, sacking, -0.05, 0, 0), part(bundle, 0.04, 0.26, 0.28, M(0x4e4a54), -0.3, 0, 0), part(bundle, 0.12, 0.12, 0.12, M(0x2a1e14), 0.48, 0, 0);
  const blade = pivot(f.body, 0, 0.62, 0.32);
  part(blade, 0.8, 0.03, 0.05, M(0xcfd6dc), 0, 0, 0), part(blade, 0.1, 0.06, 0.08, M(0x4a4652), 0, 0.04, 0);
  part(blade, 0.04, 0.04, 0.04, G(0xffd27a), 0.3, 0.06, 0).userData.keep = true;
  const bucket = pivot(f.root, -0.5, 0, 0.25);
  part(bucket, 0.02, 0.6, 0.02, M(0x8a7a5a), 0, 0.6, 0), part(bucket, 0.22, 0.22, 0.22, M(0x5a3d22), 0, 0.2, 0);
  // What they bled: a few overlapping patches, not a sheet.
  const pool = part(f.root, 0.7, 0.01, 0.5, blood, 0.1, 0.015, 0.05);
  for (const [w, d, x, z] of [[0.4, 0.3, -0.35, -0.1], [0.3, 0.25, 0.45, 0.25], [0.2, 0.18, -0.15, 0.35]]) part(pool, w / 0.7, 1, d / 0.5, M(0x6a1010), x / 0.7, 0, z / 0.5).userData.keep = true;
  pool.userData.keep = true;
  const neck = part(f.head, 0.2, 0.06, 0.2, M(0x7a1010), 0, -0.17, 0);
  neck.userData.keep = true;
  const out = { spade, spear, bundle, blade, bucket, pool, neck };
  f.root.userData.kit = out;
  return out;
}

/** Pose `f` as `n` at (x, z) facing (fx, fy); `walked` tiles so far, for the stride. */
export function poseNpc(f: NpcFig, n: Npc, fx: number, fy: number, x: number, now: number, walked: number): void {
  rest(f);
  const k = kit(f), digger = n.work === 'bury' || n.work === 'dig', digging = digger && x < 5;
  for (const g of [k.spade, k.spear, k.bundle, k.blade, k.bucket]) g.visible = false;
  for (const c of f.head.children) c.visible = true;
  k.pool.visible = k.neck.visible = false;
  f.head.visible = true;
  f.root.position.y = (n.lift ?? 0) / 16;
  if (n.pose) return void dead(f, n, k);
  const walking = (!!n.path || !!n.walking) && !digging;
  f.root.rotation.y = walking ? Math.atan2(fx, fy) : Math.sin(now * 0.25 + n.y * 3) * 0.5;
  f.mid.position.y += Math.sin(now * 2 + n.x) * 0.008;
  f.aR.rotation.x = f.aL.rotation.x = -0.1;
  if (walking) {
    walk(f, walked * (n.sneak ? 3 : 4.5), 1);
    f.aR.rotation.x += Math.sin(walked * 4.5) * 0.35;
    f.aL.rotation.x -= Math.sin(walked * 4.5) * 0.35;
  }
  // Hew down on one knee with the archer's arrow in him (sim/woodheal.ts): one knee on the ground, a hand to the leg.
  if (n.kneel) (f.mid.position.y -= 0.24), (f.mid.rotation.x = 0.25), (f.legs[0].rotation.x = -1.3), (f.legs[1].rotation.x = 1.2), (f.aR.rotation.x = -0.9);
  if (n.sneak) (f.mid.rotation.x = 0.4), (f.mid.position.y -= 0.12), (f.legs[0].rotation.x -= 0.5), (f.legs[1].rotation.x -= 0.5);
  if (n.look === 'guard') (k.spear.visible = true), (f.aR.rotation.x = -0.5), (f.aR.rotation.z = -0.2);
  if (digger) {
    if (digging) {
      // The spade going in and coming up.
      const s = Math.sin(now * 3.4 + n.x);
      k.spade.visible = true;
      f.root.rotation.y = -0.6;
      f.aR.rotation.x = f.aL.rotation.x = -0.9 - s * 0.4;
      f.mid.rotation.x = 0.25 + s * 0.12;
    } else if (n.work === 'bury' && fx < 0) (k.bundle.visible = true), (f.aR.rotation.x = f.aL.rotation.x = -2.6);
    else (k.spade.visible = true), (f.aR.rotation.x = -2.8);
  }
  if (n.work === 'whet') {
    // Sat on a block, a blade across the knees, the stone going along it.
    (f.mid.position.y -= 0.26), (f.legs[0].rotation.x = f.legs[1].rotation.x = -1.45), (f.mid.rotation.x = 0.2);
    k.blade.visible = true;
    k.blade.children[1].position.x = Math.sin(now * 3.2 + n.y) * 0.3;
    k.blade.children[2].visible = Math.sin(now * 3.2 + n.y) > 0.85;
    f.aR.rotation.x = f.aL.rotation.x = -0.9;
  }
  if (n.work === 'well') {
    // A bucket on a rope, coming up hand over hand.
    const up = ((now * 0.5 + n.x) % 1) * 0.5;
    k.bucket.visible = true;
    k.bucket.position.y = up;
    f.aR.rotation.x = -1.6 + Math.sin(now * 6) * 0.4;
    f.aL.rotation.x = -1.6 - Math.sin(now * 6) * 0.4;
  }
}

/** One of the column's dead on their back in what they bled; Hew held up without his head, or thrown down. */
function dead(f: NpcFig, n: Npc, k: Kit): void {
  const s = Math.round(n.x * 7 + n.y * 3);
  if (n.pose === 'corpse') {
    f.root.rotation.y = (s % 7) * 0.9;
    (f.mid.rotation.x = -Math.PI / 2), (f.mid.position.y = 0.14);
    f.aR.rotation.z = 0.6;
    f.aL.rotation.x = -0.6 - (s % 3) * 0.3;
    k.pool.visible = true;
    return;
  }
  f.head.visible = true;
  k.neck.visible = true;
  for (const c of f.head.children) if (c !== k.neck) c.visible = false;
  if (n.pose === 'body') (f.mid.rotation.z = Math.PI / 2), (f.mid.position.y = 0.14), (k.pool.visible = true);
  else (f.aR.rotation.x = f.aL.rotation.x = 0.2), (f.mid.rotation.x = 0.15);
}
