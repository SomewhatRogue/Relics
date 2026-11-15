/**
 * Choosing a new hero round the fire (docs/design/hero-select.md): the five classes standing round a
 * campfire at the edge of the wood, each in its look, idling as heroes idle (idles.ts starts them once a
 * hero stands still). Picked: the camera eases toward them, they step a pace toward the fire, the others
 * dim. Leaving: they turn down the road, the fire flares, the screen goes black. Drawn with the game's own
 * drawHero and lighting pass at the game's scale (a step closer); no room runs, nothing fights.
 * A clear button over each hero (`data-cls`) takes the tap, so keys and scripts reach them too.
 */
import { newHero } from '../sim/hero';
import type { Hero } from '../sim/types';
import { CLASS_KITS, CLASS_ORDER, type HeroClass } from '../shared/tuning';
import { CLASS_NAME } from '../shared/classes';
import { drawHero } from './actors';
import { BARE, type Ctx } from './draw';
import { Lighting } from './light';
import { drawText, textWidth } from './pixfont';
import { BG, ROAD, drawCampfire, fireLights, paintClearing } from './ringdraw';
import './ring.css';

/** Where each class stands (fire at 0, 0): the far side of the fire, open to the road and to you; the
 *  ends lower and wider so every name under the feet clears its neighbour. */
const SPOT = [
  { x: -74, y: 4 },
  { x: -44, y: -18 },
  { x: 0, y: -28 },
  { x: 44, y: -18 },
  { x: 74, y: 4 },
];
/** A pace toward the fire (scene pixels), and walking speed (pixels a second). */
const STEP = 10, WALK = 26;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

interface Stand { cls: HeroClass; h: Hero; x: number; y: number; btn: HTMLButtonElement }

export class HeroRing {
  readonly el = document.createElement('div');
  private out = document.createElement('canvas');
  private litC = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  private bg = paintClearing();
  private light = new Lighting(this.out);
  private c: Ctx;
  private stands: Stand[];
  private picked: HeroClass | null = null;
  private cam = { x: 0, y: 0 };
  private dim = 0;
  private leaving = -1;
  private raf = 0;
  private last = 0;
  private scale = 1;
  private dpr = 1;
  private vw = 0;
  private vh = 0;
  private onResize = () => this.resize();

  /** `yours`: the classes you have a hero of already (stood there, labelled darker). */
  constructor(private yours: (cls: HeroClass) => boolean) {
    this.el.className = 'hring';
    this.out.className = 'hringcv';
    this.el.append(this.out);
    this.c = { lit: this.litC.getContext('2d')!, glow: this.glowC.getContext('2d')!, now: 0 };
    this.stands = CLASS_ORDER.map((cls, i) => {
      const h = newHero('ring-' + cls, SPOT[i].x / 16, SPOT[i].y / 16);
      Object.assign(h, { weapon: CLASS_KITS[cls][0], look: 0, hp: 100, tag: '', noHound: true });
      const btn = Object.assign(document.createElement('button'), { className: 'hspot', type: 'button' });
      btn.dataset.cls = cls;
      btn.setAttribute('aria-label', CLASS_NAME[cls]);
      this.el.append(btn);
      return { cls, h, x: SPOT[i].x, y: SPOT[i].y, btn };
    });
  }

  start(): void {
    this.resize();
    addEventListener('resize', this.onResize);
    this.last = performance.now();
    const frame = (t: number) => {
      this.step(Math.min(0.1, (t - this.last) / 1000), t / 1000);
      this.last = t;
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.onResize);
  }

  /** Step a class forward (null: back to the ring). */
  pick(cls: HeroClass | null): void {
    if (this.leaving < 0) this.picked = cls;
  }

  setLook(cls: HeroClass, look: number): void {
    const s = this.stands.find((s) => s.cls === cls);
    if (s) s.h.look = look;
  }

  /** CHOOSE: the hero turns to the road, the fire flares, black over about a second. */
  leave(): Promise<void> {
    this.leaving = 0;
    return fadeToBlack();
  }

  /** The game's scale (scene.ts), a step closer; a wide screen keeps the card's side clear. */
  private resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const W = innerWidth * this.dpr, H = innerHeight * this.dpr;
    this.scale = Math.max(2, Math.round(Math.sqrt((W * H) / 118000)) + 1);
    this.vw = Math.ceil(W / this.scale);
    this.vh = Math.ceil(H / this.scale);
    for (const cv of [this.out, this.litC, this.glowC]) (cv.width = this.vw), (cv.height = this.vh);
    this.out.style.width = (this.vw * this.scale) / this.dpr + 'px';
    this.out.style.height = (this.vh * this.scale) / this.dpr + 'px';
    for (const g of [this.c.lit, this.c.glow]) g.imageSmoothingEnabled = false;
  }

  /** Where the fire is on screen with nobody picked, and picked (scene pixels). */
  private fireAt(): [number, number] {
    const wide = innerWidth >= 760, card = wide ? (420 * this.dpr) / this.scale : 0;
    const ox = Math.round((this.vw - card) / 2);
    if (wide) return [ox, Math.round(this.vh * 0.56)];
    return [ox, Math.round(this.vh * (this.picked ? 0.29 : 0.44))];
  }

  private step(dt: number, now: number): void {
    const k = 1 - Math.exp(-dt * 5);
    if (this.leaving >= 0) this.leaving += dt;
    this.dim = lerp(this.dim, this.picked ? 1 : 0, k);
    const me = this.stands.find((s) => s.cls === this.picked);
    this.cam.x = lerp(this.cam.x, me ? me.x * 0.7 : 0, k);
    this.cam.y = lerp(this.cam.y, me ? me.y * 0.5 : 0, k);
    this.stands.forEach((s, i) => this.move(s, SPOT[i], s === me, dt));
    this.draw(now);
  }

  /** Walk a hero to where it should be: its spot, a pace toward the fire, or off down the road. */
  private move(s: Stand, home: { x: number; y: number }, me: boolean, dt: number): void {
    const away = me && this.leaving >= 0, [rx, ry] = ROAD.from, hd = Math.hypot(home.x, home.y) || 1, k = me ? STEP / hd : 0;
    const gx = away ? rx * 2 : home.x * (1 - k), gy = away ? ry * 2 : home.y * (1 - k);
    const dx = gx - s.x, dy = gy - s.y, d = Math.hypot(dx, dy), h = s.h;
    if (d > 0.6) {
      const v = Math.min(d, WALK * dt);
      s.x += (dx / d) * v, s.y += (dy / d) * v;
      Object.assign(h, { moving: true, fx: dx / d, fy: dy / d });
    } else Object.assign(h, { moving: false, fx: Math.max(-0.35, Math.min(0.35, -s.x / 90)), fy: 1 });
    h.x = s.x / 16, h.y = s.y / 16;
  }

  private draw(now: number): void {
    const { lit, glow } = this.c, [fx, fy] = this.fireAt(), flare = this.leaving < 0 ? 0 : Math.min(1, this.leaving / 0.35);
    const ox = Math.round(fx - this.cam.x), oy = Math.round(fy - this.cam.y), cssK = this.scale / this.dpr;
    this.c.now = now;
    lit.fillStyle = '#0e1410', lit.fillRect(0, 0, this.vw, this.vh);
    glow.clearRect(0, 0, this.vw, this.vh);
    lit.drawImage(this.bg, ox - BG.fx, oy - BG.fy);
    const order = [...this.stands].sort((a, b) => a.y - b.y), me = this.stands.find((s) => s.cls === this.picked);
    // The names first: a body drawn after erases the glow under it, so a hero in front hides a name behind.
    for (const s of this.stands) {
      const sx = ox + Math.round(s.x), sy = oy + Math.round(s.y), name = CLASS_NAME[s.cls];
      if (s !== me) drawText(glow, name, Math.round(sx - textWidth(name) / 2), sy + 5, this.yours(s.cls) ? '#5a564e' : this.picked ? '#7a7466' : '#c8bc9c');
      // The tap target: the body and the name under it, in CSS pixels.
      Object.assign(s.btn.style, { left: (sx - 12) * cssK + 'px', top: (sy - 46) * cssK + 'px', width: 24 * cssK + 'px', height: 58 * cssK + 'px' });
      s.btn.classList.toggle('on', s === me);
    }
    BARE.on = true;
    try {
      for (const s of order) if (s !== me) drawHero(this.c, s.h, ox + Math.round(s.x), oy + Math.round(s.y), 'bare', now);
      // The others dim: the dark laid over everything but the picked hero and the fire.
      if (this.dim > 0.01) (lit.globalAlpha = this.dim * 0.55), (lit.fillStyle = '#05070a'), lit.fillRect(0, 0, this.vw, this.vh), (lit.globalAlpha = 1);
      if (me) drawHero(this.c, me.h, ox + Math.round(me.x), oy + Math.round(me.y), 'bare', now);
    } finally {
      BARE.on = false;
    }
    drawCampfire(this.c, ox, oy, now, flare);
    this.light.render(this.litC, this.glowC, fireLights(ox, oy, now, flare), [0.1, 0.11, 0.17]);
  }
}

/** A black sheet over everything, in over about a second. */
export function fadeToBlack(): Promise<void> {
  const f = document.getElementById('ringfade') ?? Object.assign(document.createElement('div'), { id: 'ringfade' });
  document.body.append(f);
  void f.offsetWidth;
  f.classList.add('on');
  return new Promise((ok) => setTimeout(ok, 1100));
}

/** The game under it now: the black lifts. */
export function liftBlack(): void {
  const f = document.getElementById('ringfade');
  if (!f) return;
  setTimeout(() => f.classList.add('lift'), 250);
  setTimeout(() => f.remove(), 1200);
}
