/**
 * The materials the figures' cards are drawn with (figs3d.ts). A card samples two pictures of the
 * same cell: the flat view's `lit` layer, shaded by the 3D lights and banded like everything else
 * (mats.ts M), and its `glow` layer laid over unlit (eyes, sparks, flashes, words), which the post
 * pass blooms. Part-covered pixels (a shadow, a fading ghost, a ward's dots) keep to an ordered
 * dither, never a blend, so a figure stays whole pixels. Cards are left out of the outline pass: the
 * flat sprites carry their own one-pixel outline.
 */
import * as THREE from 'three';
import { BAYER, toonize } from './post';

const PICK = `
vec4 litT = texture2D(map, vMapUv);
vec4 glowT = texture2D(tGlow, vMapUv);
float cut = bay4(gl_FragCoord.xy) + 0.03;
bool keepLit = litT.a > cut, keepGlow = glowT.a > cut;
if (!keepLit && !keepGlow) discard;
diffuseColor.rgb *= keepLit ? litT.rgb : vec3(0.0);
diffuseColor.a = 1.0;
`;

// Over the lit body the glow mixes by its own alpha (a hit's wash); alone it is whole or gone. Alpha
// out is "how ordinary" (post.ts): just under 1 keeps the outline pass off the card.
const OVER = `
if (keepLit) gl_FragColor = vec4(mix(gl_FragColor.rgb, glowT.rgb, glowT.a), min(0.99, 1.0 - glowT.a));
else gl_FragColor = vec4(glowT.rgb, 0.0);
`;

/** The lit card material: `lit` as the map, `glow` beside it. */
export function cardMaterial(lit: THREE.Texture, glow: THREE.Texture): THREE.MeshLambertMaterial {
  const m = toonize(new THREE.MeshLambertMaterial({ map: lit, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
  const toon = m.onBeforeCompile;
  const tGlow = { value: glow };
  m.onBeforeCompile = (sh, r) => {
    toon.call(m, sh, r);
    sh.uniforms.tGlow = tGlow;
    sh.fragmentShader = ('uniform sampler2D tGlow;\n' + sh.fragmentShader).replace('#include <map_fragment>', PICK).replace('#include <opaque_fragment>', '#include <opaque_fragment>\n' + OVER);
  };
  m.customProgramCacheKey = () => 'figcard';
  m.userData.glow = tGlow;
  return m;
}

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

/**
 * A hero's card seen through whatever stands in front of them: the dithered violet silhouette of
 * mats.ts XRAY, cut to the figure's own shape.
 */
export function xrayMaterial(lit: { value: THREE.Texture | null }): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { map: lit },
    vertexShader: VS,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv;
void main(){ if (texture2D(map, vUv).a < 0.9) discard; if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) > 0.5) discard; gl_FragColor = vec4(0.86, 0.8, 1.0, 0.35); }`,
    depthFunc: THREE.GreaterDepth,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NoBlending,
  });
}

/** The soft pool under a figure: every other pixel of near black, written over the floor without depth. */
export const POOL = new THREE.ShaderMaterial({
  vertexShader: VS,
  fragmentShader: BAYER + `varying vec2 vUv;
void main(){ float r = length(vUv - 0.5) * 2.0; if (r > 1.0 || bay4(gl_FragCoord.xy) > 0.62 - r * 0.25) discard; gl_FragColor = vec4(0.03, 0.025, 0.045, 1.0); }`,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
  blending: THREE.NoBlending,
});
