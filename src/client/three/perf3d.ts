/**
 * ?perf=1: a small readout in the corner of what the 3D view costs. The time spent drawing (the
 * JavaScript and the GPU calls it makes), the time between frames, the low-res size and its whole-
 * number scale, draw calls and triangles. Averaged over the last 60 frames.
 */
export class Perf {
  private el = document.createElement('div');
  private js: number[] = [];
  private gaps: number[] = [];
  private last = 0;
  private shown = 0;

  constructor(private on: boolean) {
    if (!on) return;
    Object.assign(this.el.style, { position: 'fixed', left: '6px', bottom: '6px', zIndex: '9', font: '600 10px ui-monospace, Menlo, monospace', color: '#d8d4de', background: '#0d0b10cc', padding: '3px 6px', borderRadius: '3px', pointerEvents: 'none' });
    this.el.id = 'perf3d';
    document.body.appendChild(this.el);
  }

  /** One frame drawn: what it took (ms), and what was drawn. */
  frame(ms: number, now: number, size: string, calls: number, tris: number): void {
    if (!this.on) return;
    if (this.last) this.gaps.push(now - this.last);
    this.last = now;
    this.js.push(ms);
    if (this.js.length > 60) this.js.shift(), this.gaps.shift();
    if (now - this.shown < 400) return;
    this.shown = now;
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
    this.el.textContent = `3D ${avg(this.js).toFixed(1)} ms draw, ${avg(this.gaps).toFixed(1)} ms frame, ${size}, ${calls} calls, ${Math.round(tris / 1000)}k tris`;
  }

  /** The numbers so far, for a test to read. */
  get stats(): { draw: number; frame: number } {
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
    return { draw: avg(this.js), frame: avg(this.gaps) };
  }

  show(v: boolean): void {
    if (this.on) this.el.style.display = v ? '' : 'none';
  }
}
