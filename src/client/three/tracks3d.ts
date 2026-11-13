/**
 * The Haulier's tunnel mouths in the 3D view (the flat view's are in client/sumpdraw.ts): at each track's two
 * ends, against the room's edge, a dark opening under two timber props and a beam. (The tracks themselves come
 * painted in the ground's floor: client/world.ts paintMap.)
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { mouthsOf } from '../trackbed';

const WOOD = new THREE.MeshLambertMaterial({ color: 0x6a4a2a }), DARK = new THREE.MeshBasicMaterial({ color: 0x050407 });

export function trackMouths3d(m: GameMap): THREE.Group {
  const g = new THREE.Group();
  for (const t of m.tracks ?? []) {
    for (const [x, y, side] of mouthsOf(t, m)) {
      const a = new THREE.Group(), across = side === 't' || side === 'b';
      const hole = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.3), DARK);
      hole.position.set(0, 0.75, 0);
      a.add(hole);
      for (const s of [-0.75, 0.75]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 0.22), WOOD);
        post.position.set(s, 0.85, 0.1);
        a.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.26), WOOD);
      beam.position.set(0, 1.75, 0.1);
      a.add(beam);
      // Face into the room from its edge.
      a.position.set(x, 0, y);
      a.rotation.y = across ? (side === 't' ? 0 : Math.PI) : side === 'l' ? Math.PI / 2 : -Math.PI / 2;
      g.add(a);
    }
  }
  return g;
}
