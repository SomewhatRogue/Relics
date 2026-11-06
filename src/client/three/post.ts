/**
 * The 3D look's shading, shared by every material: light banded into steps with a little ordered
 * dither (the 2D lighting pass's look, light.ts), the 2D pass's falloff for point lights, and the post
 * pass that outlines silhouettes one pixel dark from depth, lets glowing things bleed a little, and lays
 * the fog over in bands (as light.ts does in the flat view).
 * Every material writes alpha as "how ordinary": 1 a lit surface, below 1 glowing (0 glows fully).
 */
import * as THREE from 'three';
import { FOG_BANDS } from '../light';
import { MIST_GLSL, MIST_KEEP, MIST_MAX } from '../fenmistdraw';

export const BAYER = `
float bay2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bay4(vec2 a){ return bay2(0.5 * a) * 0.25 + bay2(a); }
`;

// Point lights fall off as the 2D pass's do: (1 - d / r) to the power `decay`, nothing past r.
const ATT = 'float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\n\t#if defined ( LEGACY_LIGHTS )';
if (THREE.ShaderChunk.lights_pars_begin.includes(ATT)) THREE.ShaderChunk.lights_pars_begin = THREE.ShaderChunk.lights_pars_begin.replace(ATT, ATT.replace('#if defined ( LEGACY_LIGHTS )', '#if 1'));
// Hex colours mean what they say (as the 2D canvas paints them): no colour-space conversion anywhere.
THREE.ColorManagement.enabled = false;
// Wrapped light: a face turned partly away from a light still takes some of it. The flat view lights
// a sprite as brightly as the floor under it; this keeps the 3D faces' shading (depth) but stops the
// upright faces (walls, people) going murky next to a floor lit square on.
const NL = 'float dotNL = saturate( dot( geometryNormal, directLight.direction ) );';
if (THREE.ShaderChunk.lights_lambert_pars_fragment.includes(NL)) THREE.ShaderChunk.lights_lambert_pars_fragment = THREE.ShaderChunk.lights_lambert_pars_fragment.replace(NL, 'float dotNL = saturate( dot( geometryNormal, directLight.direction ) * 0.6 + 0.4 );');

const TOON = `
{
  vec3 alb = max(diffuseColor.rgb, vec3(0.004));
  vec3 irr = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse) / alb;
  irr = max(irr, vec3(0.19));
  float L = max(max(irr.r, irr.g), irr.b);
  float bz = bay4(gl_FragCoord.xy) - 0.5;
  float q = floor(sqrt(L) * 5.0 + bz * 0.6 + 0.5) / 5.0;
  q = clamp(q * q, 0.0, 2.6);
  irr *= q / max(L, 0.0001);
  reflectedLight.directDiffuse = irr * alb;
  reflectedLight.indirectDiffuse = vec3(0.0);
}
`;

/** Band a Lambert material's light into steps. */
export function toonize<T extends THREE.Material>(m: T): T {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', BAYER + '\nvoid main() {').replace('vec3 outgoingLight =', TOON + '\nvec3 outgoingLight =');
  };
  return m;
}

export const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

/** Outlines from depth, creases, and a little bloom from the glowing; drawn straight to the low-res canvas. */
export function postMaterial(near: number, far: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      tCol: { value: null }, tDep: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uGamma: { value: 1 }, uFog: { value: new THREE.Vector4(0, 0, 0, 16) }, uFogC: { value: new THREE.Vector3() }, uFogY: { value: 1 },
      // Fenmere's mist (../fenmistdraw.ts).
      uMist: { value: Array.from({ length: MIST_MAX }, () => new THREE.Vector4()) }, uMN: { value: 0 }, uMY: { value: 1 }, uMH: { value: new THREE.Vector4(-1e5, -1e5, 0, 1) }, uMC: { value: new THREE.Vector3() },
    },
    vertexShader: QUAD_VS,
    fragmentShader: BAYER + `
uniform sampler2D tCol; uniform sampler2D tDep; uniform vec2 uRes; uniform float uGamma;
uniform vec4 uFog; uniform vec3 uFogC; uniform float uFogY;
${MIST_GLSL}
float D(vec2 p){ return ${near.toFixed(1)} + texture2D(tDep, p).x * ${(far - near).toFixed(1)}; }
vec3 glowAt(vec2 p){ vec4 s = texture2D(tCol, p); return s.rgb * (1.0 - s.a); }
void main(){
  vec2 px = floor(gl_FragCoord.xy); vec2 t = 1.0 / uRes; vec2 uv = (px + 0.5) * t;
  vec4 c = texture2D(tCol, uv);
  vec3 col = c.rgb;
  if (c.a > 0.995) {
    float d = D(uv);
    float dl = D(uv - vec2(t.x, 0.0)), dr = D(uv + vec2(t.x, 0.0));
    float dd = D(uv - vec2(0.0, t.y)), du = D(uv + vec2(0.0, t.y));
    float behind = max(max(dl, dr), max(du, dd)) - d;
    float lap = dl + dr + du + dd - 4.0 * d;
    // An edge in front of something further off: a darker shade of its own colour, not black.
    if (behind > 0.32) { vec3 o = col * 0.42; col = max(mix(vec3(dot(o, vec3(0.3, 0.55, 0.15))), o, 1.4), 0.0) + vec3(0.006, 0.005, 0.012); }
    else if (lap > 0.04) col *= 1.4;
    else if (lap < -0.04) col *= 0.72;
  }
  // Fog (client/skyfx.ts): ordinary surfaces go into its colour in stepped, dithered bands, thicker
  // further across the ground from your hero (screen rows squashed by the tilt); glowing things show through.
  if (uFog.z > 0.0) {
    vec2 fd = px - uFog.xy; fd.y /= uFogY;
    float ft = clamp((length(fd) / uFog.w - ${FOG_BANDS.near.toFixed(1)}) / ${(FOG_BANDS.far - FOG_BANDS.near).toFixed(1)}, 0.0, 1.0);
    float fs = floor(ft * ${FOG_BANDS.steps.toFixed(1)} + (bay4(px) - 0.5) * 0.9 + 0.5) / ${FOG_BANDS.steps.toFixed(1)};
    col = mix(col, uFogC, clamp(fs, 0.0, 1.0) * uFog.z * c.a);
  }
  // Fenmere's mist: over ordinary surfaces only, and nowhere near anything glowing (a telegraph's whole footprint stays clear).
  float mk = c.a > 0.995 ? mistK(px, bay4(px) - 0.5) : 0.0;
  if (mk > 0.0) {
    float near = 1.0;
    for (int j = -${MIST_KEEP}; j <= ${MIST_KEEP}; j++) for (int i = -${MIST_KEEP}; i <= ${MIST_KEEP}; i++) near = min(near, texture2D(tCol, uv + vec2(float(i), float(j)) * t).a);
    if (near > 0.99) col = mix(col, uMC, mk);
  }
  vec3 g = vec3(0.0);
  g += (glowAt(uv + vec2(t.x, 0.0)) + glowAt(uv - vec2(t.x, 0.0)) + glowAt(uv + vec2(0.0, t.y)) + glowAt(uv - vec2(0.0, t.y))) * 0.2;
  g += (glowAt(uv + t) + glowAt(uv - t) + glowAt(uv + vec2(t.x, -t.y)) + glowAt(uv + vec2(-t.x, t.y))) * 0.1;
  g = floor(g * 5.0 + bay4(px)) / 5.0;
  gl_FragColor = vec4(pow(max(col + g * (1.0 - c.a * 0.3), 0.0), vec3(uGamma)), 1.0);
}`,
    depthTest: false,
    depthWrite: false,
  });
}

/** A low-res target with nearest sampling (and a depth texture for the outlines). */
export function makeRT(w: number, h: number, depth: boolean): THREE.WebGLRenderTarget {
  const rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, generateMipmaps: false, depthBuffer: depth });
  if (depth) (rt.depthTexture = new THREE.DepthTexture(w, h)), (rt.depthTexture.type = THREE.UnsignedIntType);
  return rt;
}
