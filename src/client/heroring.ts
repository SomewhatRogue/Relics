/**
 * Choosing a new hero round the fire (docs/design/hero-select.md): the five classes standing round a
 * campfire at the edge of the wood (shared/ringmap.ts lays it), each in its look, idling as heroes idle
 * (idles.ts starts them once a hero stands still). Picked: the camera eases toward them, they step a
 * pace toward the fire, the others dim. Leaving: they turn down the road, the fire flares, black.
 * Flat: drawn here with the game's drawHero and lighting pass at the game's scale, a step closer. 2.5D
 * (the player's VIEW): the five stand in a still room on the clearing's map and the game's own views
 * draw it, the camera eased by `scene.focus`, and its picture is copied into the ring (so the game's HUD
 * stays hidden under the title), the ring a little narrower for the closer 3D camera. No room steps;
 * nothing fights. main.ts calls `frame`.
 * A clear button over each hero (`data-cls`) takes the tap, so keys and scripts reach them too.
 */
import { newHero } from '../sim/hero';
import { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';
import { CLASS_KITS, CLASS_ORDER, type HeroClass } from '../shared/tuning';
import { CLASS_NAME } from '../shared/classes';
import { RING, ringMap } from '../shared/ringmap';
import { drawHero } from './actors';
import { BARE, PLAIN, type Ctx } from './draw';
import type { Fx } from './fx';
import { idleWorld } from './idles';
import { Lighting } from './light';
import { drawText, textWidth } from './pixfont';
import { BG, drawCampfire, fireLights, paintClearing } from './ringdraw';
import type { Scene } from './scene';
import type { Views } from './three/views';
import './ring.css';

/** Walking speed (pixels a second); how much narrower the ring stands in 2.5D (its camera is closer). */
const WALK = 26, PX = 16, F = RING.fire, NARROW3D = 0.8;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** A class where it stands: x, y in pixels from the fire (the flat ring's units), and its spot. */
interface Stand { cls: HeroClass; h: Hero; x: number; y: number; hx: number; hy: number; btn: HTMLButtonElement }

export class HeroRing {
  readonly el = document.createElement('div');
  private out = document.createElement('canvas');
  /** 2.5D: the game's 3D picture, copied here each frame. */
  private copy = document.createElement('canvas');
  private in3d = false;
  private litC = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  /** A class you have already, drawn here first and greyed before it goes on the scene. */
  private grey = Object.assign(document.createElement('canvas'), { width: 64, height: 80 });
  private greyGlow = Object.assign(document.createElement('canvas'), { width: 64, height: 80 });
  private greyOut = Object.assign(document.createElement('canvas'), { width: 64, height: 80 });
  private bg = paintClearing();
  private light = new Lighting(this.out);
  private c: Ctx;
  private map = ringMap();
  private room = new ArenaRoom(1, { map: this.map, scrappers: false, props: false });
  private stands: Stand[];
  private picked: HeroClass | null = null;
  private cam = { x: 0, y: 0 };
  private dim = 0;
  private leaving = -1;
  private scale = 1;
  private dpr = 1;
  private vw = 0;
  private vh = 0;
  private onResize = () => this.resize();

  /** `yours`: the classes you have a hero of already (stood there, labelled darker). */
  constructor(private yours: (cls: HeroClass) => boolean) {
    this.el.className = 'hring';
    this.out.className = 'hringcv';
    this.copy.className = 'hring3dcv';
    this.el.append(this.out, this.copy);
    this.c = { lit: this.litC.getContext('2d')!, glow: this.glowC.getContext('2d')!, now: 0 };
    this.room.enemies = [];
    this.room.heroes = [];
    this.stands = CLASS_ORDER.map((cls, i) => {
      const [sx, sy] = RING.spots[i], h = newHero('ring-' + cls, F.x + sx, F.y + sy);
      Object.assign(h, { weapon: CLASS_KITS[cls][0], look: 0, hp: 100, tag: '', noHound: true });
      this.room.heroes.push(h);
      const btn = Object.assign(document.createElement('button'), { className: 'hspot', type: 'button', innerHTML: `<span>${CLASS_NAME[cls]}</span>` });
      btn.dataset.cls = cls;
      btn.setAttribute('aria-label', CLASS_NAME[cls]);
      // A class you have a hero of already: greyed out and not picked (Kyle, 2026-11-15).
      if (yours(cls)) btn.classList.add('yours'), (btn.disabled = true);
      this.el.append(btn);
      return { cls, h, x: sx * PX, y: sy * PX, hx: sx * PX, hy: sy * PX, btn };
    });
  }

  start(): void {
    this.resize();
    addEventListener('resize', this.onResize);
  }

  stop(): void {
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

  /** One frame (main.ts, in place of the game's): moved, then drawn flat here or by the game's views in 2.5D. */
  frame(views: Views, scene: Scene, fx: Fx, now: number, dt: number): void {
    this.step(Math.min(0.1, dt));
    let in3d = false;
    if (views.switch.look === '3d') {
      Object.assign(scene, { focus: this.focus(views), marks: [], doors: [], pointTo: null, fanfare: false, markEach: false });
      PLAIN.on = true;
      try {
        views.render(this.room, 'ring-' + (this.picked ?? 'ROGUE'), fx, now, dt, [], false);
      } finally {
        PLAIN.on = false;
      }
      in3d = views.is3d;
    }
    this.in3d = in3d;
    this.el.parentElement?.classList.toggle('ring3d', in3d);
    this.el.classList.toggle('picked', !!this.picked);
    if (in3d) return this.copy3d(), this.place3d(views);
    idleWorld([], this.map);
    this.draw(now);
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

  /** Where the fire sits on screen (a share across and down): left of the card on a wide screen, higher on a phone with a hero picked. */
  private fireShare(): [number, number] {
    if (innerWidth >= 760) return [(innerWidth - 420) / 2 / innerWidth, 0.56];
    return [0.5, this.picked ? 0.29 : 0.44];
  }

  /** The 2.5D camera's point (tiles): the eased camera, shifted so the fire sits where the flat one does. */
  private focus(views: Views): { x: number; y: number } {
    const [x0, y0] = views.tileScreen(F.x, F.y), kx = Math.abs(views.tileScreen(F.x + 1, F.y)[0] - x0) || 40, ky = Math.abs(views.tileScreen(F.x, F.y + 1)[1] - y0) || 30;
    const [sx, sy] = this.fireShare();
    return { x: F.x + this.cam.x / PX + ((0.5 - sx) * innerWidth) / kx, y: F.y + this.cam.y / PX + ((0.5 - sy) * innerHeight) / ky };
  }

  private step(dt: number): void {
    const k = 1 - Math.exp(-dt * 5);
    if (this.leaving >= 0) this.leaving += dt;
    this.dim = lerp(this.dim, this.picked ? 1 : 0, k);
    const me = this.stands.find((s) => s.cls === this.picked);
    this.cam.x = lerp(this.cam.x, me ? me.x * 0.45 : 0, k);
    this.cam.y = lerp(this.cam.y, me ? me.y * 0.5 : 0, k);
    for (const s of this.stands) this.move(s, s === me, dt);
  }

  /** Walk a hero to where it should be: its spot, a pace forward, or off down the road. */
  private move(s: Stand, me: boolean, dt: number): void {
    const away = me && this.leaving >= 0, st = RING.step, inX = me ? -Math.sign(s.hx) * st.in * PX : 0, dn = me ? st.down * PX : 0;
    const gx = away ? RING.road.from[0] * PX * 2 : s.hx + inX, gy = away ? RING.road.from[1] * PX * 2 : s.hy + dn;
    const dx = gx - s.x, dy = gy - s.y, d = Math.hypot(dx, dy), h = s.h;
    if (d > 0.6) {
      const v = Math.min(d, WALK * dt);
      s.x += (dx / d) * v, s.y += (dy / d) * v;
      Object.assign(h, { moving: true, fx: dx / d, fy: dy / d });
    } else Object.assign(h, { moving: false, fx: Math.max(-0.35, Math.min(0.35, -s.x / 90)), fy: 1 });
    h.x = F.x + (s.x / PX) * (this.in3d ? NARROW3D : 1), h.y = F.y + s.y / PX;
  }

  /** 2.5D: the 3D view's canvas and its overlay (names, numbers) drawn into the ring's own, the same frame. */
  private copy3d(): void {
    const v = document.getElementById('game3d') as HTMLCanvasElement | null, over = v?.nextElementSibling;
    if (!v) return;
    const W = Math.round(innerWidth * this.dpr), H = Math.round(innerHeight * this.dpr), g = this.copy.getContext('2d')!;
    if (this.copy.width !== W || this.copy.height !== H) (this.copy.width = W), (this.copy.height = H);
    g.imageSmoothingEnabled = false;
    g.drawImage(v, 0, 0, W, H);
    if (over instanceof HTMLCanvasElement) g.drawImage(over, 0, 0, W, H);
  }

  /** 2.5D: each hero's button over them, the name at its foot (CSS pixels from the views). */
  private place3d(views: Views): void {
    for (const s of this.stands) {
      const [fx, fy] = views.tileScreen(s.h.x, s.h.y), [, top] = views.tileScreen(s.h.x, s.h.y, 2.6), w = Math.max(40, (fy - top) * 0.55);
      Object.assign(s.btn.style, { left: fx - w / 2 + 'px', top: top + 'px', width: w + 'px', height: fy - top + 22 + 'px' });
      s.btn.classList.toggle('on', s.cls === this.picked);
    }
  }

  private draw(now: number): void {
    const { lit, glow } = this.c, [sx, sy] = this.fireShare(), flare = this.leaving < 0 ? 0 : Math.min(1, this.leaving / 0.35);
    const ox = Math.round(this.vw * sx - this.cam.x), oy = Math.round(this.vh * sy - this.cam.y), cssK = this.scale / this.dpr;
    this.c.now = now;
    lit.fillStyle = '#0e1410', lit.fillRect(0, 0, this.vw, this.vh);
    glow.clearRect(0, 0, this.vw, this.vh);
    lit.drawImage(this.bg, ox - BG.fx, oy - BG.fy);
    const order = [...this.stands].sort((a, b) => a.y - b.y), me = this.stands.find((s) => s.cls === this.picked);
    // The names first: a body drawn after erases the glow under it, so a hero in front hides a name behind.
    for (const s of this.stands) {
      const x = ox + Math.round(s.x), y = oy + Math.round(s.y), name = CLASS_NAME[s.cls];
      if (s !== me) drawText(glow, name, Math.round(x - textWidth(name) / 2), y + 5, this.yours(s.cls) ? '#5a564e' : this.picked ? '#7a7466' : '#c8bc9c');
      // The tap target: the body and the name under it, in CSS pixels.
      Object.assign(s.btn.style, { left: (x - 12) * cssK + 'px', top: (y - 46) * cssK + 'px', width: 24 * cssK + 'px', height: 58 * cssK + 'px' });
      s.btn.classList.toggle('on', s === me);
    }
    BARE.on = true;
    try {
      for (const s of order) if (s !== me) (this.yours(s.cls) ? this.drawGrey(s.h, ox + Math.round(s.x), oy + Math.round(s.y), now) : drawHero(this.c, s.h, ox + Math.round(s.x), oy + Math.round(s.y), 'bare', now));
      // The others dim: the dark laid over everything but the picked hero and the fire.
      if (this.dim > 0.01) (lit.globalAlpha = this.dim * 0.55), (lit.fillStyle = '#05070a'), lit.fillRect(0, 0, this.vw, this.vh), (lit.globalAlpha = 1);
      if (me) drawHero(this.c, me.h, ox + Math.round(me.x), oy + Math.round(me.y), 'bare', now);
    } finally {
      BARE.on = false;
    }
    drawCampfire(this.c, ox, oy, now, flare);
    this.light.render(this.litC, this.glowC, fireLights(ox, oy, now, flare), [0.1, 0.11, 0.17]);
  }

  /** A hero greyed out where it stands: drawn on its own, its colour taken out (shading and outline kept) and
   *  dimmed a little, nothing it glows with; then put down. */
  private drawGrey(h: Hero, x: number, y: number, now: number): void {
    const src = this.grey.getContext('2d')!, g = this.greyOut.getContext('2d')!, c: Ctx = { lit: src, glow: this.greyGlow.getContext('2d')!, now };
    for (const k of [src, g, c.glow]) k.clearRect(0, 0, 64, 80);
    drawHero(c, h, 32, 72, 'bare', now);
    g.drawImage(this.grey, 0, 0);
    g.globalCompositeOperation = 'saturation';
    g.fillStyle = '#808080', g.fillRect(0, 0, 64, 80);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(this.grey, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(16, 16, 22, 0.35)', g.fillRect(0, 0, 64, 80);
    g.globalCompositeOperation = 'source-over';
    this.c.lit.drawImage(this.greyOut, x - 32, y - 72);
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
