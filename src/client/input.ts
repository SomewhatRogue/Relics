/**
 * Turns keys, mouse and touch into an Intent. Laptop: WASD to move, mouse to aim, left click to
 * attack, hold right click to block (tap it to parry), Space to roll; J / K work too;
 * E the class skill, R the relic carried, G grab (then click to slam, G to throw), Q a potion (held:
 * turn the belt instead), C held winds a crossbow, X turns a Mage's element. Phone (upright):
 * a floating stick on the left, Attack, Block and Roll under the right thumb.
 */
import { NO_INTENT, type Intent } from '../sim/types';
import { unlockAudio } from './sfx';
import { PotionPress } from './potionpress';

export class Input {
  intent: Intent = { ...NO_INTENT };
  readonly touch = 'ontouchstart' in window || matchMedia('(pointer: coarse)').matches;
  private keys = new Set<string>();
  private mouse: [number, number] | null = null;
  private blockHeld = { mouse: false, key: false, touch: false };
  private attackHeld = { mouse: false, key: false, touch: false };
  private reloadHeld = { key: false, touch: false };
  private stick = { id: '', ox: 0, oy: 0, x: 0, y: 0 };
  private stickEl!: HTMLElement;
  private knobEl!: HTMLElement;
  /** A quick tap on the stick's side of the screen that never moved (a phone's tap on a drop: lootcard.ts). */
  onTap: ((x: number, y: number) => void) | null = null;
  private tapAt = { t: 0, x: 0, y: 0 };
  private potion = new PotionPress(() => this.intent.potionSeq++, () => (this.intent.beltSeq = (this.intent.beltSeq ?? 0) + 1));

  constructor(private heroScreen: () => [number, number, number, number?] | null) {
    const unlock = () => unlockAudio();
    for (const t of ['touchend', 'pointerup', 'click', 'keydown']) addEventListener(t, unlock, { passive: true });
    addEventListener('keydown', (e) => {
      if (e.repeat || (e.target as HTMLElement).closest?.('input')) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === ' ') this.intent.rollSeq++, e.preventDefault();
      if (k === 'j') (this.intent.attackSeq++), (this.attackHeld.key = true);
      if (k === 'e') this.use(0);
      if (k === 'r') this.use(1);
      if (k === 'g') this.intent.grabSeq++;
      if (k === 'q') this.potion.down();
      if (k === 'c') this.reload(true);
      if (k === 'x') this.element();
      if (k === 'k') (this.intent.blockSeq++), (this.blockHeld.key = true);
    });
    addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if (k === 'k') this.blockHeld.key = false;
      if (k === 'j') this.attackHeld.key = false;
      if (k === 'q') this.potion.up();
      if (k === 'c') this.reloadHeld.key = false;
    });
    addEventListener('blur', () => {
      this.keys.clear();
      this.potion.cancel();
      this.blockHeld = { mouse: false, key: false, touch: false };
      this.attackHeld = { mouse: false, key: false, touch: false };
      this.reloadHeld = { key: false, touch: false };
    });
    addEventListener('mousemove', (e) => (this.mouse = [e.clientX, e.clientY]));
    addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('button, [data-ui]')) return;
      this.mouse = [e.clientX, e.clientY];
      if (e.button === 0) (this.intent.attackSeq++), (this.attackHeld.mouse = true);
      if (e.button === 2) (this.intent.blockSeq++), (this.blockHeld.mouse = true);
    });
    addEventListener('mouseup', (e) => {
      if (e.button === 2) this.blockHeld.mouse = false;
      if (e.button === 0) this.attackHeld.mouse = false;
    });
    addEventListener('contextmenu', (e) => e.preventDefault());
    if (this.touch) this.buildTouch();
  }

  private buildTouch(): void {
    const ui = document.getElementById('touch')!;
    ui.hidden = false;
    this.stickEl = ui.querySelector('.stick')!;
    this.knobEl = ui.querySelector('.knob')!;
    const zone = ui.querySelector('.stick-zone') as HTMLElement;
    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      Object.assign(this.stick, { id: String(t.identifier), ox: t.clientX, oy: t.clientY, x: 0, y: 0 });
      this.tapAt = { t: performance.now(), x: t.clientX, y: t.clientY };
      this.stickEl.style.left = t.clientX + 'px';
      this.stickEl.style.top = t.clientY + 'px';
      this.stickEl.classList.add('on');
    }, { passive: false });
    const move = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (String(t.identifier) !== this.stick.id) continue;
        e.preventDefault();
        let dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
        const l = Math.hypot(dx, dy), max = 46;
        if (l > max) (dx *= max / l), (dy *= max / l);
        this.stick.x = dx / max;
        this.stick.y = dy / max;
        this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) if (String(t.identifier) === this.stick.id) {
        if (e.type === 'touchend' && performance.now() - this.tapAt.t < 280 && Math.hypot(t.clientX - this.tapAt.x, t.clientY - this.tapAt.y) < 12) this.onTap?.(t.clientX, t.clientY);
        Object.assign(this.stick, { id: '', x: 0, y: 0 });
        this.knobEl.style.transform = '';
        this.stickEl.classList.remove('on');
      }
    };
    zone.addEventListener('touchmove', move, { passive: false });
    zone.addEventListener('touchend', end);
    zone.addEventListener('touchcancel', end);
    const btn = (sel: string, down: () => void, up?: () => void) => {
      const el = ui.querySelector(sel) as HTMLElement;
      el.addEventListener('touchstart', (e) => (e.preventDefault(), el.classList.add('down'), down()), { passive: false });
      const release = (e: TouchEvent) => (e.preventDefault(), el.classList.remove('down'), up?.());
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
    };
    btn('.attack', () => ((this.intent.attackSeq++), (this.attackHeld.touch = true)), () => (this.attackHeld.touch = false));
    btn('.relic', () => this.use(0));
    btn('.relic2', () => this.use(1));
    btn('.grab', () => this.intent.grabSeq++);
    // A tap drinks; a long press turns the belt (potionpress.ts). A cancelled touch drinks nothing.
    const pb = ui.querySelector('.potion') as HTMLElement;
    pb.addEventListener('touchstart', (e) => (e.preventDefault(), pb.classList.add('down'), this.potion.down()), { passive: false });
    pb.addEventListener('touchend', (e) => (e.preventDefault(), pb.classList.remove('down'), this.potion.up()), { passive: false });
    pb.addEventListener('touchcancel', () => (pb.classList.remove('down'), this.potion.cancel()));
    btn('.roll', () => this.intent.rollSeq++);
    btn('.reload', () => this.reload(false), () => (this.reloadHeld.touch = false));
    btn('.element', () => this.element());
    btn('.block', () => ((this.intent.blockSeq++), (this.blockHeld.touch = true)), () => (this.blockHeld.touch = false));
  }

  /** Use an ability: 0 the class's skill, 1 the relic carried. */
  use(slot: number): void {
    this.intent.relicPick = slot;
    this.intent.relicPickSeq++;
    this.intent.relicSeq++;
  }

  /** A Mage's ELEMENT (X, or its ring by ATTACK): counted, so a tap is never lost. */
  element(): void {
    this.intent.elementSeq = (this.intent.elementSeq ?? 0) + 1;
  }

  /** RELOAD pressed (C, or the crossbow's button): counted, and held till it's let go. */
  private reload(key: boolean): void {
    this.intent.reloadSeq = (this.intent.reloadSeq ?? 0) + 1;
    if (key) this.reloadHeld.key = true;
    else this.reloadHeld.touch = true;
  }

  /** Change gear from the pack (see sim/pack.ts GEAR). */
  gear(op: number, arg: number): void {
    this.intent.gearOp = op;
    this.intent.gearArg = arg;
    this.intent.gearSeq++;
  }

  /** Open a chest (USE, or F beside it). */
  open(id: number): void {
    this.intent.open = id;
    this.intent.openSeq++;
  }

  /** Take a loot drop (the card's button, or F). */
  take(id: number): void {
    this.intent.take = id;
    this.intent.takeSeq++;
  }

  /** The current intent, read once a frame. */
  read(): Intent {
    const k = this.keys;
    let mx = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let my = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    if (this.stick.id) (mx = this.stick.x), (my = this.stick.y);
    else if (mx && my) (mx *= Math.SQRT1_2), (my *= Math.SQRT1_2);
    // Shift: creep (half pace, and goblins at rest see you from less far).
    if (!this.stick.id && k.has('shift')) (mx *= 0.45), (my *= 0.45);
    const i = this.intent;
    i.mx = Math.abs(mx) < 0.12 ? 0 : mx;
    i.my = Math.abs(my) < 0.12 ? 0 : my;
    i.block = this.blockHeld.mouse || this.blockHeld.key || this.blockHeld.touch;
    i.attack = this.attackHeld.mouse || this.attackHeld.key || this.attackHeld.touch;
    i.reload = this.reloadHeld.key || this.reloadHeld.touch;
    i.ax = i.ay = 0;
    const hs = this.heroScreen();
    // Aim in tiles: the direction to the mouse, and how far (a lobbed flask lands there). The 3D view's
    // floor is foreshortened, so it gives its own pixels per tile down the screen.
    if (!this.touch && this.mouse && hs) (i.ax = (this.mouse[0] - hs[0]) / hs[2]), (i.ay = (this.mouse[1] - hs[1]) / (hs[3] ?? hs[2]));
    return { ...i };
  }
}
