/** The town hall's vote boards' words in the 2.5D view: the same canvas as the flat one (../voteboards.ts), on the back wall's face. */
import * as THREE from 'three';
import { OX, PX } from '../world';
import { WALL_H } from './ground';

/** A plane the width of the canvas, set on the wall's face (x from the canvas's own left edge, in tiles). */
export function makeBoards3d(canvas: HTMLCanvasElement): THREE.Group {
  const root = new THREE.Group(), tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  const w = canvas.width / PX, face = new THREE.Mesh(new THREE.PlaneGeometry(w, WALL_H), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, depthWrite: false }));
  face.position.set(w / 2 - OX / PX, WALL_H / 2, 0.03);
  root.add(face);
  return root;
}
