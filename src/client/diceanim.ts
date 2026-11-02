/**
 * Knucklebones, thrown where you can see it. Your cup rattles and tips, your two bones tumble,
 * bounce and settle one after the other, then Moll does the same from across the table; a beat,
 * then the result. The faces were decided before the first rattle (the game rolls first, as it
 * always has): this only shows them landing. A tap skips straight to the end.
 */
import type { Panel } from './panels';
import { sfx } from './sfx';
import { drawText } from './pixfont';
import { DIE_W, cup, die, table } from './diceart';

const W = 104, H = 60;
/** A throw's bounces: [start, end, height share] as fractions of its flight. Faces show from the third. */
const SEGS = [[0, 0.5, 1], [0.5, 0.76, 0.34], [0.76, 0.92, 0.12], [0.92, 1, 0.04]];
const SETTLE = 0.76, KNOCK = [1, 0.5, 0.25, 0.1];
type Who = 'you' | 'moll';
interface Side { who: Who; faces: number[]; cup: [number, number]; dir: number; t0: number; shake: number; apex: number; land: [number, number][]; label: [number, number] }

const hash = (a: number, b: number) => {
  let h = Math.imul(a ^ 0x9e3779b9, 374761393) + Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};
const launch = (s: Side, i: number) => s.t0 + s.shake + 0.1 + i * 0.1;
const flight = (i: number) => 0.8 + i * 0.22;
const landed = (s: Side) => launch(s, 1) + flight(1);
const sum = (s: Side) => s.faces[0] + s.faces[1];

function sides(you: number[], moll: number[], seed: number): [Side, Side] {
  const j = (n: number) => (hash(seed, n) % 5) - 2;
  const a: Side = { who: 'you', faces: you, cup: [9, 52], dir: 1, t0: 0.1, shake: 0.75, apex: 13, label: [24, 54],
    land: [[32 + j(1), 43 + j(2)], [47 + j(3), 45 + j(4)]] };
  const b: Side = { who: 'moll', faces: moll, cup: [95, 23], dir: -1, t0: landed(a) + 0.1, shake: 0.6, apex: 9, label: [52, 2],
    land: [[73 + j(5), 25 + j(6)], [58 + j(7), 28 + j(8)]] };
  return [a, b];
}

/** Where the cup is at t: how high it's lifted, its jiggle, and how far it has tipped. */
function cupPose(s: Side, t: number): { x: number; y: number; a: number } {
  const [x, y] = s.cup, k = t - s.t0, tip = k - s.shake;
  if (k < 0) return { x, y, a: 0 };
  if (tip < 0) return { x: x + Math.round(Math.sin(t * 55) * 1.6), y: y - 3 + Math.round(Math.cos(t * 41)), a: Math.sin(t * 31) * 0.14 };
  const out = tip < 0.12 ? tip / 0.12 : tip < 0.45 ? 1 : Math.max(0, 1 - (tip - 0.45) / 0.3);
  return { x: x + s.dir * Math.round(out * 3), y: y - Math.round(3 * Math.max(out, 1 - tip / 0.3)), a: s.dir * 1.3 * out };
}

/** One die at t: where it touches the table, how high it is, its spin and the face it shows. */
function diePose(s: Side, i: number, t: number, seed: number) {
  const u = Math.min(1, (t - launch(s, i)) / flight(i)), e = 1 - (1 - u) * (1 - u);
  const sx = s.cup[0] + s.dir * 9, sy = s.cup[1] - 3, [tx, ty] = s.land[i];
  const seg = SEGS.findIndex(([a, b]) => u >= a && u <= b), [a, b, h] = SEGS[Math.max(0, seg)], q = (u - a) / (b - a);
  const z = 4 * h * s.apex * q * (1 - q) + (seg === 0 ? 8 * (1 - q) : 0);
  const spin = s.dir * (5 + i * 1.5) * (1 - u) * (1 - u);
  const face = u < SETTLE ? 1 + (hash(seed + i * 31 + s.dir, Math.floor((t - launch(s, i)) * 13)) % 6) : s.faces[i];
  return { u, x: sx + (tx - sx) * e, y: sy + (ty - sy) * e, z, a: Math.abs(spin) < 0.06 ? 0 : spin, face };
}

function draw(g: CanvasRenderingContext2D, S: Side[], t: number, seed: number, heard: Set<string> | null): void {
  g.imageSmoothingEnabled = false;
  g.drawImage(table(W, H), 0, 0);
  const things: [number, () => void][] = [];
  for (const s of S) {
    const name = s.who === 'you' ? 'YOU' : 'MOLL';
    drawText(g, t >= landed(s) + 0.15 ? `${name} ${sum(s)}` : name, s.label[0] + 1, s.label[1] + 1, t >= landed(s) + 0.15 ? '#ffd27a' : '#c8b080');
    const c = cupPose(s, t);
    things.push([s.cup[1], () => {
      g.fillStyle = 'rgba(8,5,3,0.5)';
      g.fillRect(s.cup[0] - 5, s.cup[1] - 1, 10, 2);
      g.save();
      g.translate(c.x, c.y);
      g.rotate(c.a);
      g.drawImage(cup(), -6, -14);
      g.restore();
    }]);
    if (heard && t > s.t0 && t < s.t0 + s.shake) {
      const n = Math.floor((t - s.t0) / 0.075);
      if (!heard.has(`${s.who}r${n}`)) heard.add(`${s.who}r${n}`), sfx.dice('shake');
    }
    for (let i = 0; i < 2; i++) {
      if (t < launch(s, i)) continue;
      const d = diePose(s, i, t, seed);
      if (heard) SEGS.forEach(([, end], k) => {
        const key = `${s.who}${i}k${k}`;
        if (d.u >= end && !heard.has(key)) heard.add(key), sfx.dice('land', KNOCK[k]);
      });
      things.push([d.y, () => {
        const w = Math.max(4, 10 - Math.round(d.z / 2));
        g.fillStyle = 'rgba(8,5,3,0.5)';
        g.fillRect(Math.round(d.x - w / 2), Math.round(d.y), w, 2);
        // A puff off the table where it first hits.
        if (d.u > 0.5 && d.u < 0.64) {
          const p = (d.u - 0.5) / 0.14, r = Math.round(4 + p * 5);
          g.fillStyle = `rgba(200,180,150,${0.6 * (1 - p)})`;
          for (const [dx, dy] of [[-r, 0], [r, 0], [-r + 2, -1], [r - 2, -1], [-r + 1, 1], [r - 1, 1]]) g.fillRect(Math.round(d.x + dx), Math.round(d.y + dy), 1, 1);
        }
        g.save();
        g.translate(Math.round(d.x), Math.round(d.y - d.z) - 6);
        g.rotate(d.a);
        g.drawImage(die(d.face, s.who), -DIE_W / 2, -8);
        g.restore();
      }]);
    }
  }
  things.sort((p, q) => p[0] - q[0]).forEach(([, f]) => f());
}

/**
 * Show the throw in `panel`, then call `done` with an image of the landed bones for the result.
 * The outcome is already settled; nothing here can change it.
 */
export function throwDice(panel: Panel, title: string, you: number[], moll: number[], done: (img: string) => void): void {
  panel.show(title, '<canvas class="dicethrow"></canvas>', [], true);
  const cv = document.querySelector('#panel canvas.dicethrow') as HTMLCanvasElement | null, host = document.getElementById('panel');
  const g = cv?.getContext('2d');
  if (!cv || !g || !host) return done('');
  const s = Math.max(1, Math.floor((cv.parentElement?.clientWidth || W) / W));
  const css = `width:${W * s}px;height:${H * s}px;image-rendering:pixelated;display:block;margin:0 auto 8px;touch-action:none`;
  cv.width = W;
  cv.height = H;
  cv.style.cssText = css;
  const seed = you[0] * 7 + you[1] * 13 + moll[0] * 17 + moll[1] * 19, S = sides(you, moll, seed);
  const end = landed(S[1]) + 0.65, heard = new Set<string>(), start = performance.now();
  let over = false;
  const stop = () => ((over = true), host.removeEventListener('click', skip), document.body.classList.remove('dicing'));
  const finish = () => {
    if (over) return;
    stop();
    draw(g, S, end, seed, null);
    done(`<img class="dicethrow" alt="YOU ${sum(S[0])}, MOLL ${sum(S[1])}" src="${cv.toDataURL()}" style="${css}">`);
  };
  // The tap that threw can't also skip: give it a moment.
  const skip = () => performance.now() - start > 200 && finish();
  host.addEventListener('click', skip);
  // The banner's gold already knows how it went; hide it until the bones do.
  document.body.classList.add('dicing');
  const tick = () => {
    if (over) return;
    if (!cv.isConnected || !panel.open) return stop();
    const t = (performance.now() - start) / 1000;
    if (t >= end) return finish();
    draw(g, S, t, seed, heard);
    requestAnimationFrame(tick);
  };
  tick();
}
