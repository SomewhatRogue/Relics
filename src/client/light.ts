/**
 * The lighting pass: the scene is painted flat at low resolution, then one WebGL2 draw lights every
 * pixel from the torches, braziers and effects, in stepped bands with a little ordered dither (the
 * look Kyle approved), and lays the glowing layer (flames, eyes, telegraphs, numbers) on top unlit.
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
const FS = `#version 300 es
precision highp float;
uniform sampler2D uBase; uniform sampler2D uEmis; uniform vec2 uRes;
uniform vec4 uL[${MAX}]; uniform vec3 uC[${MAX}]; uniform int uN; uniform vec3 uAmb;
in vec2 uv; out vec4 o;
const float B[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 t = vec2(uv.x, 1.0 - uv.y);
  vec4 b = texture(uBase, t); vec4 e = texture(uEmis, t);
  vec3 l = uAmb;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uN) break;
    vec4 L = uL[i]; vec2 d = px - L.xy; d.y *= 1.15;
    float f = pow(clamp(1.0 - length(d) / L.z, 0.0, 1.0), 1.6) * L.w;
    l += uC[i] * f;
  }
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
  private u: Record<string, WebGLUniformLocation | null> = {};
  private tex: WebGLTexture[] = [];
  private lbuf = new Float32Array(MAX * 4);
  private cbuf = new Float32Array(MAX * 3);

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    this.ok = !!this.gl && this.setup();
    if (!this.ok) this.g2 = canvas.getContext('2d');
  }

  private setup(): boolean {
    const gl = this.gl!;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return false;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    gl.useProgram(p);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uBase', 'uEmis', 'uRes', 'uL', 'uC', 'uN', 'uAmb']) this.u[n] = gl.getUniformLocation(p, n);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.tex.push(t);
    }
    gl.uniform1i(this.u.uBase, 0);
    gl.uniform1i(this.u.uEmis, 1);
    return true;
  }

  render(base: HTMLCanvasElement, emis: HTMLCanvasElement, lights: Light[], amb: [number, number, number]): void {
    const w = this.canvas.width, h = this.canvas.height;
    if (!this.ok) {
      const g = this.g2!;
      g.clearRect(0, 0, w, h);
      g.drawImage(base, 0, 0);
      g.drawImage(emis, 0, 0);
      return;
    }
    const gl = this.gl!;
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, base);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, emis);
    const n = Math.min(MAX, lights.length);
    for (let i = 0; i < n; i++) {
      const l = lights[i];
      this.lbuf.set([l.x, l.y, l.r, l.i], i * 4);
      this.cbuf.set(l.c, i * 3);
    }
    gl.uniform2f(this.u.uRes, w, h);
    gl.uniform4fv(this.u.uL, this.lbuf);
    gl.uniform3fv(this.u.uC, this.cbuf);
    gl.uniform1i(this.u.uN, n);
    gl.uniform3f(this.u.uAmb, amb[0], amb[1], amb[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
