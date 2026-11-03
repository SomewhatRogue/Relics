/**
 * The tended lamps in 2.5D, by the same rule as the flat view (shared/lamps.ts): wall torches, braziers
 * and lamp posts give their flames and light only while lit; a hall's door lamp and a cottage's lit
 * windows glow only then, and are dark glass by day. A camp's brazier (`wild`) burns whatever the hour.
 */
import type * as THREE from 'three';
import type { Theme } from '../../shared/arena';
import { lampAt } from '../../shared/lamps';
import type { L3 } from './lights3d';
import type { Spot } from './rounds3d';

/** A lamp standing in the room (x, y in tiles): its flames and its light, as they are when lit. */
export interface Lamp3 { x: number; y: number; fires: Spot[]; light: L3; wild?: boolean }

/** This frame's lit lamps into the frame's fires and lights. */
export function lampsNow(theme: Theme, lamps: Lamp3[], fires: Spot[], lights: L3[]): void {
  for (const l of lamps) {
    const on = l.wild ? 1 : lampAt(theme, l.x, l.y);
    if (on <= 0) continue;
    if (on > 0.5) fires.push(...l.fires);
    lights.push({ ...l.light, i: l.light.i * on });
  }
}

/** Mark a glowing mesh as a lamp: `off` is how it looks put out. */
export function asLamp(m: THREE.Mesh, off: THREE.Material): THREE.Mesh {
  m.userData.lamp = { on: m.material, off };
  return m;
}

/** The lamp meshes under a group (found once, when it's built). */
export function lampMeshes(g: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  g.traverse((o) => o.userData.lamp && out.push(o as THREE.Mesh));
  return out;
}

/** Light or put out a building's lamp meshes (the building's lamps go together, by where it stands). */
export function setLampMeshes(theme: Theme, x: number, y: number, list: THREE.Mesh[]): void {
  if (!list.length) return;
  const on = lampAt(theme, x, y) > 0.5;
  for (const m of list) m.material = on ? m.userData.lamp.on : m.userData.lamp.off;
}
