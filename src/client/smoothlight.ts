/**
 * The flat view's smooth light (docs/design/graphics-overhaul.md, slice 1a), in two draws. First the light alone,
 * at the art's own small size: every torch and brazier summed as the banded pass sums them (light.ts), but left
 * unstepped, with the fog's thickness beside it. Then the picture at the screen's own pixels: the art and the
 * glowing layer read crisp, a whole art pixel each, the light read back smooth across them. So a pool of light has
 * no bands and no dither, the art's pixels are exactly what they were, and it costs no more light maths than before.
 */
import { MIST_GLSL, MIST_KEEP, type MistU } from './fenmistdraw';
import { FOG_BANDS, LIGHT_VS, MAX_LIGHTS, type Fog } from './light';

// The light is kept at half its strength so it fits where a target can't hold more than 1.
// (Built when first wanted, not when this file loads: light.ts and this file import each other.)
const lightFs = () => `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec4 uL[${MAX_LIGHTS}]; uniform vec3 uC[${MAX_LIGHTS}]; uniform int uN; uniform vec3 uAmb; uniform vec4 uFog;
out vec4 o;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 l = uAmb;
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= uN) break;
    vec4 L = uL[i]; vec2 d = px - L.xy; d.y *= 1.15;
    l += uC[i] * pow(clamp(1.0 - length(d) / L.z, 0.0, 1.0), 1.6) * L.w;
  }
  float fog = uFog.z > 0.0 ? clamp((length(px - uFog.xy) / uFog.w - ${FOG_BANDS.near.toFixed(1)}) / ${(FOG_BANDS.far - FOG_BANDS.near).toFixed(1)}, 0.0, 1.0) * uFog.z : 0.0;
  o = vec4(clamp(l, 0.12, 1.6) * 0.5, fog);
}`;
const mixFs = () => `#version 300 es
precision highp float;
uniform sampler2D uBase; uniform sampler2D uEmis; uniform sampler2D uLight; uniform vec2 uRes; uniform vec2 uOut; uniform vec3 uFogC;
out vec4 o;
${MIST_GLSL}
void main(){
  vec2 lp = vec2(gl_FragCoord.x, uOut.y - gl_FragCoord.y) * uRes / uOut;
  vec2 t = (floor(lp) + 0.5) / uRes;
  vec4 b = texture(uBase, t); vec4 e = texture(uEmis, t);
  vec4 L = texture(uLight, vec2(lp.x, uRes.y - lp.y) / uRes);
  vec3 c = mix(b.rgb * L.rgb * 3.1, uFogC, L.a);
  // Fenmere's mist, unstepped: over the lit layer only, never where anything glows (a telegraph shows whole).
  float mk = mistRaw(lp) * 0.88;
  if (mk > 0.0) {
    float near = 0.0;
    for (int j = -${MIST_KEEP}; j <= ${MIST_KEEP}; j++) for (int i = -${MIST_KEEP}; i <= ${MIST_KEEP}; i++) near = max(near, texture(uEmis, t + vec2(float(i), float(j)) / uRes).a);
    if (near < 0.1) c = mix(c, uMC, mk);
  }
  o = vec4(mix(c, e.rgb, e.a), 1.0);
}`;

type Locs = Record<string, WebGLUniformLocation | null>;

export class SmoothPass {
  readonly ok: boolean;
  private light: WebGLProgram | null = null;
  private mix: WebGLProgram | null = null;
  private ul: Locs = {};
  private um: Locs = {};
  private fbo: WebGLFramebuffer | null = null;
  private tex: WebGLTexture | null = null;
  private size = [0, 0];
  private half: boolean;

  constructor(private gl: WebGL2RenderingContext, link: (fs: string) => WebGLProgram | null) {
    this.half = !!gl.getExtension('EXT_color_buffer_float');
    this.light = link(lightFs());
    this.mix = link(mixFs());
    this.ok = !!this.light && !!this.mix;
    if (!this.ok) return;
    for (const n of ['uRes', 'uL', 'uC', 'uN', 'uAmb', 'uFog']) this.ul[n] = gl.getUniformLocation(this.light!, n);
    for (const n of ['uBase', 'uEmis', 'uLight', 'uRes', 'uOut', 'uFogC', 'uMist', 'uMN', 'uMY', 'uMH', 'uMC']) this.um[n] = gl.getUniformLocation(this.mix!, n);
    this.fbo = gl.createFramebuffer();
    this.tex = gl.createTexture();
  }

  /** The light's own small target, made again when the view's size changes: half floats where the device can, else bytes. */
  private target(w: number, h: number): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    if (this.size[0] === w && this.size[1] === h) return;
    this.size = [w, h];
    for (const half of this.half ? [true, false] : [false]) {
      gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) break;
      this.half = false;
    }
  }

  /** Both draws. The art and glow are already in texture units 0 and 1 (light.ts); `lights` and `colours` are its buffers. */
  render(w: number, h: number, outW: number, outH: number, lights: Float32Array, colours: Float32Array, n: number, amb: [number, number, number], fog: Fog | null, mist: MistU | null): void {
    const gl = this.gl;
    this.target(w, h);
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.light);
    gl.uniform2f(this.ul.uRes, w, h);
    gl.uniform4fv(this.ul.uL, lights);
    gl.uniform3fv(this.ul.uC, colours);
    gl.uniform1i(this.ul.uN, n);
    gl.uniform3f(this.ul.uAmb, amb[0], amb[1], amb[2]);
    gl.uniform4f(this.ul.uFog, fog?.x ?? 0, fog?.y ?? 0, fog?.k ?? 0, fog?.px ?? 16);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, outW, outH);
    gl.useProgram(this.mix);
    gl.uniform1i(this.um.uBase, 0);
    gl.uniform1i(this.um.uEmis, 1);
    gl.uniform1i(this.um.uLight, 2);
    gl.uniform2f(this.um.uRes, w, h);
    gl.uniform2f(this.um.uOut, outW, outH);
    gl.uniform3f(this.um.uFogC, ...(fog?.c ?? [0, 0, 0]));
    gl.uniform1i(this.um.uMN, mist?.n ?? 0);
    if (mist) gl.uniform4fv(this.um.uMist, mist.banks), gl.uniform1f(this.um.uMY, mist.yr), gl.uniform4f(this.um.uMH, ...mist.hero), gl.uniform3f(this.um.uMC, ...mist.c);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
