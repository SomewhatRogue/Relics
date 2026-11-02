/**
 * A class shown doing what it does, on the pick screen: a hero of that class in a room of its own,
 * played a little loop of blows, a heavy one, and a dodge (or a guard), and drawn at the game's scale.
 */
import { ArenaRoom } from '../sim/room';
import { NO_INTENT, type Intent } from '../sim/types';
import { CLASS_DODGES, CLASS_GUARD, CLASS_KITS, TICK, type HeroClass } from '../shared/tuning';
import { drawHero } from './actors';
import type { Ctx } from './draw';

const W = 56, H = 40, LOOP = 5.6;

export class Preview {
  readonly el = document.createElement('canvas');
  private lit = document.createElement('canvas');
  private glow = document.createElement('canvas');
  private room: ArenaRoom;
  private t = 0;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private seq = { attack: 0, roll: 0, block: 0 };

  constructor(private cls: HeroClass, look = 0) {
    for (const c of [this.el, this.lit, this.glow]) (c.width = W), (c.height = H);
    this.el.className = 'preview';
    this.room = new ArenaRoom(1, { scrappers: false, props: false });
    this.room.enemies = [];
    const h = this.room.join('me');
    h.weapon = CLASS_KITS[cls][0];
    h.look = look;
    this.home();
  }

  start(): void {
    this.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.advance(dt);
      this.draw(now / 1000);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  private home(): void {
    Object.assign(this.room.heroes[0], { x: 9, y: 9, fx: 0, fy: 1, kvx: 0, kvy: 0, act: 'idle', actT: 0, stamina: 100 });
  }

  /** The loop: three quick blows, a held heavy, then a dodge or a raised guard. */
  private intent(t: number): Intent {
    const dodges = CLASS_DODGES[this.cls], guards = CLASS_GUARD[this.cls] === 'full';
    const i: Intent = { ...NO_INTENT, attackSeq: this.seq.attack, rollSeq: this.seq.roll, blockSeq: this.seq.block };
    // (The 2 s press is held: a heavy blow.)
    if (t >= 2 && t < 3.1) i.attack = true;
    if (t >= 3.8 && t < 4.6 && guards && !dodges) i.block = true;
    if (dodges && t >= 3.8 && t < 3.95) i.mx = 1;
    return i;
  }

  private advance(dt: number): void {
    const before = this.t;
    this.t = (this.t + dt) % LOOP;
    if (this.t < before) this.home();
    // Presses land once each, at their moment in the loop.
    const crossed = (at: number) => (before < at && this.t >= at) || (this.t < before && at <= this.t);
    for (const at of [0.3, 0.75, 1.2, 2]) if (crossed(at)) this.seq.attack++;
    if (CLASS_DODGES[this.cls] && crossed(3.8)) this.seq.roll++;
    if (CLASS_GUARD[this.cls] === 'full' && !CLASS_DODGES[this.cls] && crossed(3.8)) this.seq.block++;
    const i = this.intent(this.t);
    this.room.setIntent('me', i);
    for (this.acc += dt; this.acc >= TICK; this.acc -= TICK) this.room.step();
    // Stay in frame.
    const h = this.room.heroes[0];
    if (Math.abs(h.x - 9) > 3 || Math.abs(h.y - 9) > 2) Object.assign(h, { x: 9 + Math.sign(h.x - 9) * 3 });
  }

  private draw(now: number): void {
    const lit = this.lit.getContext('2d')!, glow = this.glow.getContext('2d')!, out = this.el.getContext('2d')!;
    for (const g of [lit, glow, out]) (g.clearRect(0, 0, W, H), (g.imageSmoothingEnabled = false));
    const c: Ctx = { lit, glow, now }, h = this.room.heroes[0];
    drawHero(c, h, Math.round(W / 2 + (h.x - 9) * 6), Math.round(H - 9 + (h.y - 9) * 6), 'bare', this.room.time);
    out.drawImage(this.lit, 0, 0);
    out.drawImage(this.glow, 0, 0);
  }
}
