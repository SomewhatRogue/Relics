/**
 * The new look, slice 0a (docs/design/new-look.md): HD-2D light in the 2.5D view behind `?hd` in the address, on
 * today's art, so the light can be judged on its own. Painted at about twice the resolution (sprites and textures
 * stay crisp, nearest-sampled), light smooth rather than stepped (post.ts `toonize` steps aside), and its own post
 * pass: a wide soft bloom off everything glowing, fog that thickens smoothly, a tilt-shift blur toward the top and
 * bottom of the screen, a vignette. No outlines (HD-2D doesn't draw them; the sprites carry their own).
 * Glowing things (telegraphs, eyes, spells: alpha below 1) are never blurred or fogged, so the fight reads.
 * Drawing only.
 */
import * as THREE from 'three';

/** Whether this screen draws the new look's light (`?hd` in the address). */
export const HD = typeof location !== 'undefined' && new URLSearchParams(location.search).has('hd');

/** Low-res pixels the scene is painted at under HD: four times the high quality's, so about half the scale. */
export const HD_AREA = 360000;

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

/** The HD post pass, with the same uniforms as post.ts's (view3d.ts sets them the same way). */
export function hdPostMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      tCol: { value: null }, tDep: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uGamma: { value: 1 }, uFog: { value: new THREE.Vector4(0, 0, 0, 16) }, uFogC: { value: new THREE.Vector3() }, uFogY: { value: 1 },
      // (Fenmere's mist isn't drawn in the test; its uniforms are here so view3d.ts can set them as usual.)
      uMist: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uMN: { value: 0 }, uMY: { value: 1 }, uMH: { value: new THREE.Vector4() }, uMC: { value: new THREE.Vector3() },
    },
    vertexShader: VS,
    fragmentShader: `
uniform sampler2D tCol; uniform vec2 uRes; uniform float uGamma;
uniform vec4 uFog; uniform vec3 uFogC; uniform float uFogY;
vec3 glowAt(vec2 p){ vec4 s = texture2D(tCol, p); return s.rgb * (1.0 - s.a); }
const float GA = 2.39996;
void main(){
  vec2 t = 1.0 / uRes, px = gl_FragCoord.xy, uv = px * t;
  vec4 c = texture2D(tCol, uv);
  vec3 col = c.rgb;
  bool plain = c.a > 0.995;
  // Tilt-shift: the band round the middle sharp, softening toward the top and bottom (a diorama). Only ordinary
  // surfaces are blurred, and only from ordinary neighbours, so a telegraph or a glowing eye stays crisp.
  float ts = smoothstep(0.24, 0.5, abs(uv.y - 0.5));
  if (plain && ts > 0.01) {
    float r = ts * uRes.y * 0.0065;
    vec3 acc = col; float n = 1.0;
    for (int i = 1; i < 13; i++) {
      float fi = float(i), rr = r * sqrt(fi / 12.0), a = fi * GA;
      vec4 s = texture2D(tCol, uv + vec2(cos(a), sin(a)) * rr * t);
      if (s.a > 0.995) { acc += s.rgb; n += 1.0; }
    }
    col = acc / n;
  }
  // Fog, smooth, thicker further across the ground from your hero (screen rows squashed by the tilt).
  if (uFog.z > 0.0) {
    vec2 fd = px - uFog.xy; fd.y /= uFogY;
    float ft = smoothstep(4.0, 14.0, length(fd) / uFog.w);
    col = mix(col, uFogC, ft * uFog.z * c.a);
  }
  // Bloom: everything glowing bleeds into a wide soft halo, in three rings.
  vec3 g = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float rad = k == 0 ? 2.5 : k == 1 ? 6.0 : 13.0, w = k == 0 ? 0.11 : k == 1 ? 0.07 : 0.045;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785 + float(k) * 0.39;
      g += glowAt(uv + vec2(cos(a), sin(a)) * rad * t) * w;
    }
  }
  col += g * (1.0 - c.a * 0.25);
  // A dark vignette at the edges.
  vec2 q = uv - 0.5;
  col *= 1.0 - smoothstep(0.18, 0.62, dot(q * vec2(1.0, 0.85), q * vec2(1.0, 0.85)) * 1.6) * 0.55;
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(uGamma)), 1.0);
}`,
    depthTest: false,
    depthWrite: false,
  });
}
