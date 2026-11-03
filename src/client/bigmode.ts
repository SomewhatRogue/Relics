/**
 * `?bigmap=1`: the big map's load test in the browser (scripts/bigmap/browser.cjs). Your hero and three
 * bots spread to the map's quarters on one 96 by 72 field of goblins, the room running here as a
 * party leader's does. `n=` goblins (300), `sleep=0` keeps every goblin awake, `auto=1` lets a bot walk
 * your hero too, `bots=0` leaves you alone at the way in, `overview=1` lays a map of the whole field on top: goblins awake in green, dozing in
 * grey, the dead in red, each hero with its wake ring. `window.__bigPerf()` reads the frame times.
 */
import { bigRoom, addBots } from '../sim/bigroom';
import { drive } from '../sim/bots';
import { SLEEP } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Intent } from '../sim/types';
import { INTEREST } from './interest';
import { ME, type Game } from './game';

type Views = { render: (...a: unknown[]) => void };
const BOTS = ['b2', 'b3', 'b4'];

export function startBig(game: Game, q: URLSearchParams): void {
  const n = Number(q.get('n') ?? 300), sleep = q.get('sleep') !== '0', auto = q.get('auto') === '1';
  game.enterYard();
  const room = bigRoom(Number(q.get('seed') ?? 3), n, sleep);
  (game as unknown as { place(r: ArenaRoom): void }).place(room);
  const ids = q.get('bots') === '0' ? [] : BOTS, bots = ids.length ? addBots(room, [ME, ...ids], auto ? [ME, ...ids] : ids) : [];
  const perf = { gaps: [] as number[], sim: [] as number[], draw: [] as number[], last: 0 };
  const step = game.step.bind(game);
  game.step = (dt: number, intent: Intent) => {
    for (const b of bots) if (b.id !== ME) room.setIntent(b.id, drive(b, room));
    const mine = bots.find((b) => b.id === ME), t0 = performance.now();
    const ev = step(dt, mine ? drive(mine, room) : intent);
    perf.sim.push(performance.now() - t0);
    return ev;
  };
  const w = window as unknown as { __views: Views; __bigPerf: () => unknown; __big: unknown };
  const render = w.__views.render.bind(w.__views);
  w.__views.render = (...a: unknown[]) => {
    const t0 = performance.now();
    render(...a);
    perf.draw.push(performance.now() - t0);
  };
  const beat = (t: number) => {
    if (perf.last) perf.gaps.push(t - perf.last);
    perf.last = t;
    requestAnimationFrame(beat);
  };
  requestAnimationFrame(beat);
  const stat = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y), mean = a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    return { mean: +mean.toFixed(2), p95: +(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(2) };
  };
  w.__big = { room, bots };
  w.__bigPerf = (reset = false) => {
    const out = { frames: perf.gaps.length, fps: +(1000 / stat(perf.gaps).mean).toFixed(1), frame: stat(perf.gaps), sim: stat(perf.sim), draw: stat(perf.draw), awake: room.enemies.filter((e) => !e.dozing && e.act !== 'dead').length, alive: room.enemies.filter((e) => e.act !== 'dead').length };
    if (reset) (perf.gaps = []), (perf.sim = []), (perf.draw = []);
    return out;
  };
  if (q.get('overview') === '1') overview(room);
}

/** The whole field from above, for a screenshot: who's awake and who's dozing. */
function overview(room: ArenaRoom): void {
  const cv = document.createElement('canvas'), m = room.map;
  Object.assign(cv.style, { position: 'fixed', inset: '0', zIndex: '50', background: '#0d0b10', width: '100vw', height: '100vh' });
  document.body.appendChild(cv);
  const draw = () => {
    const W = (cv.width = innerWidth * devicePixelRatio), H = (cv.height = innerHeight * devicePixelRatio), pad = 24 * devicePixelRatio;
    const k = Math.min((W - pad * 2) / m.w, (H - pad * 4) / m.h), ox = (W - m.w * k) / 2, oy = pad * 2.5, c = cv.getContext('2d')!;
    const X = (x: number) => ox + x * k, Y = (y: number) => oy + y * k;
    c.fillStyle = '#1b2219';
    c.fillRect(X(0), Y(0), m.w * k, m.h * k);
    c.strokeStyle = '#2a3327';
    for (let x = 12; x < m.w; x += 12) c.strokeRect(X(x), Y(0), 0, m.h * k);
    for (let y = 12; y < m.h; y += 12) c.strokeRect(X(0), Y(y), m.w * k, 0);
    c.fillStyle = '#6b6672';
    for (const b of m.blocks) c.fillRect(X(b.x), Y(b.y), b.w * k, b.h * k);
    const dot = (x: number, y: number, r: number, col: string) => (c.beginPath(), c.arc(X(x), Y(y), Math.max(1.5, r * k), 0, 7), (c.fillStyle = col), c.fill());
    for (const r of m.rounds) dot(r.x, r.y, r.r, '#2f4a2c');
    for (const r of m.braziers) dot(r.x, r.y, 0.6, '#ff9a3c');
    for (const e of room.enemies) dot(e.x, e.y, 0.45, e.act === 'dead' ? '#8a2a2a' : e.dozing ? '#5d6470' : '#9cff5a');
    for (const h of room.heroes) {
      c.lineWidth = 1.5 * devicePixelRatio;
      for (const [r, col] of [[SLEEP.wake, '#ffd27a'], [INTEREST.radius, '#7ad0ff']] as const) (c.beginPath(), c.arc(X(h.x), Y(h.y), r * k, 0, 7), (c.strokeStyle = col), c.stroke());
      dot(h.x, h.y, 0.7, '#ffffff');
    }
    const awake = room.enemies.filter((e) => !e.dozing && e.act !== 'dead').length, dozing = room.enemies.filter((e) => e.dozing && e.act !== 'dead').length;
    c.font = `${13 * devicePixelRatio}px ui-monospace, monospace`;
    c.fillStyle = '#d8d4de';
    c.fillText(`${m.w} x ${m.h} tiles   awake ${awake} (green)   dozing ${dozing} (grey)   dead ${room.enemies.length - awake - dozing}   rings: wake ${SLEEP.wake} (gold), sent ${INTEREST.radius} (blue)`, pad, pad * 1.3);
  };
  setInterval(draw, 250);
}
