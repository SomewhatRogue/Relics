/**
 * The lighting pass: the scene is painted flat at low resolution, then WebGL2 lights every pixel
 * from the torches, braziers and effects, in stepped bands with a little ordered dither (the look
 * Kyle approved), and lays the glowing layer (flames, eyes, telegraphs, numbers) on top unlit.
 *
 * Two draws. The light falling on each scene pixel is summed once, into a texture the size of the
 * scene; then every canvas pixel (there are `k` to a scene pixel each way, for the bodies drawn at
 * twice the detail) reads it, so the light costs no more than it did when the canvas was the scene.
 */
export interface Light {
  x: number;
  y: number;
  r: number;
  i: number;
  c: [number, number, number];
}

const MAX = 32;
const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
/** Pass one, at scene size: the light on each scene pixel, halved to fit (it can reach 2). */
const LIGHT_FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec4 uL[${MAX}]; uniform vec3 uC[${MAX}]; uniform int uN; uniform vec3 uAmb;
out vec4 o;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 l = uAmb;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uN) break;
    vec4 L = uL[i]; vec2 d = px - L.xy; d.y *= 1.15;
    float f = pow(clamp(1.0 - length(d) / L.z, 0.0, 1.0), 1.6) * L.w;
    l += uC[i] * f;
  }
  o = vec4(clamp(l * 0.5, 0.0, 1.0), 1.0);
}`;
/** Pass two, at canvas size: the flat colour times its scene pixel's light, banded and dithered. */
const FS = `#version 300 es
precision highp float;
uniform sampler2D uBase; uniform sampler2D uEmis; uniform sampler2D uLit; uniform vec2 uRes; uniform float uK;
in vec2 uv; out vec4 o;
const float B[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main(){
  vec2 px = floor(vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK);
  vec2 t = vec2(uv.x, 1.0 - uv.y);
  vec4 b = texture(uBase, t); vec4 e = texture(uEmis, t);
  vec3 l = texture(uLit, uv).rgb * 2.0;
  int bx = int(mod(px.x, 4.0)); int by = int(mod(px.y, 4.0));
  float bz = B[by * 4 + bx] / 16.0 - 0.5;
  vec3 q = clamp(floor(l * 5.0 + bz * 0.9 + 0.5) / 5.0, 0.12, 1.6);
  vec3 c = b.rgb * q * 1.55;
  o = vec4(mix(c, e.rgb, e.a), 1.0);
}`;

export class Lighting {
  readonly ok: boolean;
  private gl: WebGL2RenderingContext | null;
  private g2: CanvasRenderingContext2D | null = null;
  private progs: { light: WebGLProgram; out: WebGLProgram } | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private tex: WebGLTexture[] = [];
  private fbo: WebGLFramebuffer | null = null;
  private litSize = [0, 0];
  private lbuf = new Float32Array(MAX * 4);
  private cbuf = new Float32Array(MAX * 3);

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    this.ok = !!this.gl && this.setup();
    if (!this.ok) this.g2 = canvas.getContext('2d');
  }

  private program(vs: string, fs: string, names: string[], tag: string): WebGLProgram | null {
    const gl = this.gl!;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    for (const n of names) this.u[tag + n] = gl.getUniformLocation(p, n);
    return p;
  }

  private setup(): boolean {
    const gl = this.gl!;
    const light = this.program(VS, LIGHT_FS, ['uRes', 'uL', 'uC', 'uN', 'uAmb'], 'l.'), out = this.program(VS, FS, ['uBase', 'uEmis', 'uLit', 'uRes', 'uK'], 'o.');
    if (!light || !out) return false;
    this.progs = { light, out };
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (let i = 0; i < 3; i++) {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.tex.push(t);
    }
    this.fbo = gl.createFramebuffer();
    gl.useProgram(out);
    gl.uniform1i(this.u['o.uBase'], 0);
    gl.uniform1i(this.u['o.uEmis'], 1);
    gl.uniform1i(this.u['o.uLit'], 2);
    return true;
  }

  render(base: HTMLCanvasElement, emis: HTMLCanvasElement, lights: Light[], amb: [number, number, number], k = 1): void {
    const w = this.canvas.width, h = this.canvas.height;
    if (!this.ok) {
      const g = this.g2!;
      g.clearRect(0, 0, w, h);
      g.drawImage(base, 0, 0);
      g.drawImage(emis, 0, 0);
      return;
    }
    const gl = this.gl!, sw = Math.ceil(w / k), sh = Math.ceil(h / k), P = this.progs!;
    // The light texture follows the scene's size.
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[2]);
    if (this.litSize[0] !== sw || this.litSize[1] !== sh) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex[2], 0);
      this.litSize = [sw, sh];
    }
    const n = Math.min(MAX, lights.length);
    for (let i = 0; i < n; i++) {
      const l = lights[i];
      this.lbuf.set([l.x, l.y, l.r, l.i], i * 4);
      this.cbuf.set(l.c, i * 3);
    }
    // Pass one: the light, once a scene pixel (unbind it from the sampler while it's drawn into).
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, sw, sh);
    gl.useProgram(P.light);
    gl.uniform2f(this.u['l.uRes'], sw, sh);
    gl.uniform4fv(this.u['l.uL'], this.lbuf);
    gl.uniform3fv(this.u['l.uC'], this.cbuf);
    gl.uniform1i(this.u['l.uN'], n);
    gl.uniform3f(this.u['l.uAmb'], amb[0], amb[1], amb[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // Pass two: every canvas pixel, its colour times the light on its scene pixel.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(P.out);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, base);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, emis);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[2]);
    gl.uniform2f(this.u['o.uRes'], w, h);
    gl.uniform1f(this.u['o.uK'], k);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
