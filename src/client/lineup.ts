/**
 * The lineup (docs/design/art-pass.md): a dev page that draws every unit in every move side by side, at
 * phone scale, on the stone floor under torchlight, with the game's own drawHero and drawFoe and the
 * real lighting pass. Open it with `?lineup` (all), `?lineup=heroes` or `?lineup=goblins`. Drawing only.
 */
import { Lighting, type Light } from './light';
import { drawHero } from './actors';
import { drawFoe } from './strawman';
import { BARE, type Ctx } from './draw';
import { drawText } from './pixfont';
import { sized } from './bodysize';
import { MOVES, cast, foeIn, heroIn, type Unit } from './lineupcast';

const CELL = 32, LEFT = 46, TOP = 18, PX = 16;
/** Column heads, short enough to fit a cell (alternate ones sit lower so neighbours never touch). */
const HEADS = ['STAND', 'WALK', 'WINDUP', 'STRIKE', 'RECOVR', 'HURT', 'FLINCH', 'STAGGR', 'DIE'];
/** Two CSS pixels a scene pixel: the scale a phone sees the game at (about 12 tiles across). */
const SCALE = 2;

/** A grey flagstone floor, each slab a little different, mortar between (cool stone, as the look asks). */
function floor(g: CanvasRenderingContext2D, w: number, h: number): void {
  for (let ty = 0; ty * PX < h; ty++) for (let tx = 0; tx * PX < w; tx++) {
    const n = (tx * 73 + ty * 151 + ((tx * ty) % 7) * 31) % 9;
    g.fillStyle = ['#4a4652', '#4f4a58', '#46424e', '#524d5c', '#4a4652', '#48444f', '#504b59', '#45414c', '#4c4855'][n];
    g.fillRect(tx * PX, ty * PX, PX, PX);
    g.fillStyle = '#34313a';
    g.fillRect(tx * PX, ty * PX + PX - 1, PX, 1);
    g.fillRect(tx * PX + (ty % 2 ? 8 : 0), ty * PX, 1, PX);
    if (n % 3 === 0) (g.fillStyle = '#3e3a45'), g.fillRect(tx * PX + 4 + n, ty * PX + 5, 2, 1);
  }
}

/** A torch over the middle of each row (or every other, past 30 rows: the pass takes 32 at most), wide enough for every move. */
function torches(rows: number[], w: number, now: number): Light[] {
  const every = Math.max(1, Math.ceil(rows.length / 30)), out: Light[] = [];
  rows.forEach((y, i) => {
    if (i % every) return;
    const flick = Math.sin(now * 9 + i * 1.7) * 3;
    out.push({ x: w * 0.55, y: y - 14, r: w * 0.5 + 20 * (every - 1) + flick, i: 0.5, c: [1, 0.74, 0.46] });
  });
  return out.slice(0, 32);
}

export function openLineup(which: string): void {
  const units = cast(which), rows: number[] = [];
  let y = TOP;
  for (const u of units) rows.push((y += u.tall));
  const W = LEFT + MOVES.length * CELL + 4, H = y + 10;
  const mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  const lit = mk(), glow = mk(), out = mk(), scratch = Object.assign(document.createElement('canvas'), { width: 64, height: 64 });
  const page = document.createElement('div');
  page.id = 'lineup';
  page.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;background:#0d0b10;-webkit-overflow-scrolling:touch';
  out.style.cssText = `display:block;width:${W * SCALE}px;height:${H * SCALE}px;image-rendering:pixelated`;
  page.append(out);
  document.body.append(page);
  const light = new Lighting(out);
  const c: Ctx = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now: 0 };
  const sc: Ctx = { lit: scratch.getContext('2d')!, glow: scratch.getContext('2d')!, now: 0 };
  for (const g of [c.lit, c.glow]) g.imageSmoothingEnabled = false;
  const label = (g: CanvasRenderingContext2D, s: string, x: number, yy: number, col: string) => drawText(g, s, x, yy, col);

  const frame = () => {
    if (!page.isConnected) return;
    const now = performance.now() / 1000;
    c.now = sc.now = now;
    c.lit.clearRect(0, 0, W, H);
    c.glow.clearRect(0, 0, W, H);
    floor(c.lit, W, H);
    HEADS.forEach((m, i) => label(c.glow, m, LEFT + i * CELL + 3, i % 2 ? 9 : 2, '#c8c0a8'));
    BARE.on = true;
    try {
      units.forEach((u, r) => {
        const fy = rows[r];
        label(c.glow, u.label, 2, fy - 8, '#9ad8a8');
        MOVES.forEach((m, i) => draw(c, sc, u, m, LEFT + i * CELL + CELL / 2, fy, r * 100 + i, now));
      });
    } finally {
      BARE.on = false;
    }
    light.render(lit, glow, torches(rows, W, now), [0.2, 0.21, 0.27]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** One unit in one move with its feet at (x, y). A draw that throws shows a red cross, not a blank. */
function draw(c: Ctx, sc: Ctx, u: Unit, m: (typeof MOVES)[number], x: number, y: number, id: number, now: number): void {
  try {
    if ('hero' in u) {
      const { h, t, prime } = heroIn(u.hero, m, 'lineup' + id, now);
      if (prime) drawHero(sc, prime, 32, 40, 'bare', 0), drawHero(sc, h, 32, 40, 'bare', 0);
      drawHero(c, h, x, y, 'bare', t);
    } else {
      const { e, t } = foeIn(u.foe, m, id, now);
      c.t = t;
      // Stretched as the game does until each goblin is redrawn (bodysize.ts).
      sized(c, x, y, () => drawFoe(c, e, x, y, false, false), e.kind !== 'butcher' && !e.boss);
    }
  } catch (err) {
    c.glow.fillStyle = '#ff4a3a';
    for (let k = -4; k <= 4; k++) c.glow.fillRect(x + k, y - 8 + k, 1, 1), c.glow.fillRect(x + k, y - 8 - k, 1, 1);
    if (now % 5 < 0.02) console.warn('lineup:', u.label, m, err);
  } finally {
    c.t = undefined;
  }
}
