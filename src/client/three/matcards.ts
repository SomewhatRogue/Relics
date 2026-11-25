/** A material on the floor in the 2.5D view: the same tile picture as the flat view (../tilemats.ts), stood up as a card, one pixel to one render pixel. */
import * as THREE from 'three';
import type { MatId } from '../../shared/materials';
import { matSprite } from '../tilemats';
import { KX } from '../tilekit';
import { PITCH } from './camera3d';
import { cardMaterial } from './figmat';

const tex = (cv: HTMLCanvasElement) => Object.assign(new THREE.CanvasTexture(cv), { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false });

export function makeMatCard(id: MatId): THREE.Group {
  const s = matSprite(id), root = new THREE.Group();
  const glow = Object.assign(document.createElement('canvas'), { width: s.w, height: s.h });
  const g = glow.getContext('2d')!;
  for (const [x, y, col] of s.glow) (g.fillStyle = col), g.fillRect(x, y, 1, 1);
  const w = s.w / KX, h = s.h / (KX * Math.cos(PITCH));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), cardMaterial(tex(s.c), tex(glow), true));
  m.position.set(0, h / 2, 0.05);
  root.add(m);
  return root;
}
