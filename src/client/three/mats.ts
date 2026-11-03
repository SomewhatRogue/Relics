/**
 * Materials, made once and shared: `M` a lit colour (banded), `G` an unlit glowing colour (eyes,
 * flames, spells), `VCOL` lit vertex colours (the merged buildings and props), `FLASH` a hit's white.
 */
import * as THREE from 'three';
import { toonize } from './post';

const cache = new Map<string, THREE.Material>();

/** A lit, flat-shaded colour. */
export function M(hex: number | string): THREE.MeshLambertMaterial {
  const k = 'm' + hex;
  let m = cache.get(k) as THREE.MeshLambertMaterial | undefined;
  if (!m) cache.set(k, (m = toonize(new THREE.MeshLambertMaterial({ color: hex, flatShading: true }))));
  return m;
}

/**
 * An unlit colour that glows: `a` is how ordinary it looks (0 blooms fully, 1 not at all). Written
 * without blending so the alpha reaches the post pass as it is.
 */
export function G(hex: number | string, a = 0): THREE.MeshBasicMaterial {
  const k = 'g' + hex + '_' + a;
  let m = cache.get(k) as THREE.MeshBasicMaterial | undefined;
  if (!m) cache.set(k, (m = new THREE.MeshBasicMaterial({ color: hex, opacity: a, blending: THREE.NoBlending })));
  return m;
}

export const VCOL = toonize(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
export const FLASH = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.55, blending: THREE.NoBlending });
/** Burned black (a goblin that burned to death, a charred beam). */
export const CHAR = toonize(new THREE.MeshLambertMaterial({ color: 0x1a1614, flatShading: true }));

/** Frozen solid. */
export const ICE = toonize(new THREE.MeshLambertMaterial({ color: 0xa8d8f0, flatShading: true }));

/**
 * A hero seen through what stands in front of them: a dithered violet silhouette, drawn only where
 * something nearer already covers them (view3d.ts draws the heroes again with this).
 */
export const XRAY = new THREE.ShaderMaterial({
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'void main(){ if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) > 0.5) discard; gl_FragColor = vec4(0.86, 0.8, 1.0, 0.35); }',
  depthFunc: THREE.GreaterDepth,
  depthWrite: false,
  blending: THREE.NoBlending,
});

/** A '#rrggbb' string as a number. */
export const hex = (s: string) => parseInt(s.slice(1, 7), 16);
