/**
 * The start screen: your heroes (up to three), each with its class for life, its level and gold; play
 * one, make a new one, or retire one. Making a hero: the five classes round a fire (heroring.ts), tap one
 * for its card (ringcard.ts): its looks, ratings, a name, CHOOSE; it walks off, black, and the game starts
 * (docs/design/hero-select.md). RECOVERY CODE opens recoveryui.ts.
 */
import { NAME_OK, normName } from '../shared/names';
import { heroId } from '../shared/progress';
import { claimName, freeNames } from './names';
import { HERO_SLOTS, canMake } from '../shared/progress';
import { CHAPTER_1 } from '../shared/story';
import { CLASS_ORDER, type HeroClass } from '../shared/tuning';
import { CLASS_NAME } from '../shared/classes';
import { HeroRing, liftBlack } from './heroring';
import { face, ownCard, ringCard } from './ringcard';
import { COPY, RECOVER } from './copy';
import { RECOVERY, type Recovery } from './recovery';
import { RecoveryPanel } from './recoveryui';
import type { Game } from './game';
import type { Fx } from './fx';
import type { Scene } from './scene';
import type { Views } from './three/views';

const NAMES: Record<HeroClass, string> = { WARRIOR: 'BRANNOCK', RANGER: 'WREN', ROGUE: 'SILK', MAGE: 'ASHE', HEALER: 'IVY' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
import { HOMEW } from './homewords';

export class Title {
  private el = document.createElement('div');
  open = false;
  private pick: HeroClass = 'WARRIOR';
  /** On the class grid, or looking at one class. */
  private detail = false;
  private retiring = -1;
  /** Which hero's other options (play the wood again, retire) are open on the home screen. */
  private more = -1;
  /** Which of the class's three looks is chosen. */
  private look = 0;
  /** The recovery code panel (none in the one-file build), and whether it's the one showing. */
  private panel: RecoveryPanel | null = null;
  private inPanel = false;
  /** The fire (heroring.ts) while making a hero. */
  private ring: HeroRing | null = null;
  private leaving = false;

  constructor(private g: Game, private done: () => void, recovery?: Recovery) {
    this.el.id = 'title';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.click(e.target as HTMLElement));
    if (recovery && RECOVERY) {
      const p = (this.panel = new RecoveryPanel(recovery, g, () => this.inPanel && this.open && (this.el.innerHTML = p.html()), () => this.front()));
      this.el.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.inPanel) void p.submit((this.el.querySelector('form input') as HTMLInputElement).value);
      });
    }
  }

  /** Trying a class (trial.ts): set by main.ts. `onShow` ends one first. */
  onTry: ((cls: HeroClass, look: number) => void) | null = null;
  onShow: (() => void) | null = null;

  show(): void {
    this.onShow?.();
    this.open = true;
    this.el.hidden = false;
    this.retiring = -1;
    this.front();
  }

  /** Back on a class's page (after trying it). */
  showClass(cls: HeroClass, look: number): void {
    Object.assign(this, { open: true, inPanel: false, pick: cls, look, detail: true });
    this.el.hidden = false;
    this.create();
  }

  /** Your heroes, or the class pick when there are none. */
  private front(): void {
    this.inPanel = false;
    this.detail = false;
    if (this.g.save.heroes.length) this.home();
    else this.create();
  }

  private recoverButton(): string {
    return this.panel ? `<button data-recover class="ghost wide">${RECOVER.button}</button>` : '';
  }

  private hide(): void {
    this.dropRing();
    this.open = false;
    this.el.hidden = true;
    this.done();
  }

  private home(): void {
    this.dropRing();
    const hs = this.g.save.heroes;
    this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">${CHAPTER_1.name.toUpperCase()}</div>` +
      `<p class="lede">${COPY.homeLede}</p><div class="slots">` +
      // Each hero: a big look at them, who they are on one line, PLAY under it, and the rest behind the dots
      // (Kyle, 2026-11-08: "hard to see your character and no one knows what wood is or retire means").
      hs.map((h, i) => `<div class="slot"><div class="stop">${face(h.cls, h.look)}<div class="who"><b>${esc(h.name)}</b>` +
        `<span>${HOMEW.line(CLASS_NAME[h.cls], h.level, h.gold)}</span></div></div>` +
        `<div class="sgo"><button data-play="${i}" class="primary">PLAY</button><button data-more="${i}" class="ghost more${this.more === i ? ' on' : ''}" aria-label="${HOMEW.more}"><i></i><i></i><i></i></button></div>` +
        (this.more === i ? `<div class="sopts">${h.prologue ? `<button data-wood="${i}" class="ghost">${HOMEW.wood}</button>` : ''}` +
          `<button data-retire="${i}" class="ghost${this.retiring === i ? ' danger' : ''}">${this.retiring === i ? HOMEW.sure(h.name) : HOMEW.retire}</button></div>` : '') +
        '</div>').join('') +
      `</div>${hs.length < HERO_SLOTS && CLASS_ORDER.some((k) => canMake(hs, k)) ? '<button data-new class="wide">NEW HERO</button>' : `<p class="dim">${HOMEW.full}</p>`}${this.recoverButton()}</div>`;
  }

  /** The fire with the five round it; the card under it once one is picked. */
  private create(): void {
    if (!this.ring) {
      const hs = this.g.save.heroes, ring = (this.ring = new HeroRing((k) => hs.find((h) => h.cls === k)?.look ?? null));
      this.el.classList.add('ringing');
      this.el.innerHTML = `<div class="rtop"><h1>RELIC</h1><div class="sub">A NEW CHAPTER</div><p class="lede">Pick a class.</p>` +
        `<div class="rtopb">${hs.length ? '<button data-back class="ghost">BACK</button>' : ''}${this.recoverButton()}</div></div><div class="rcard tcard"></div>`;
      this.el.prepend(ring.el);
      ring.start();
    }
    this.ring.pick(this.detail ? this.pick : null);
    if (!this.mine()) this.ring.setLook(this.pick, this.look);
    this.el.classList.toggle('picked', this.detail);
    this.card();
  }

  private card(): void {
    const box = this.el.querySelector('.rcard') as HTMLElement | null;
    if (!box) return;
    if (!this.detail) return void (box.innerHTML = '');
    const c = this.pick, own = this.mine();
    if (own) return void (box.innerHTML = ownCard(own.h, own.i));
    box.innerHTML = ringCard({ cls: c, look: this.look, name: this.free[0] ?? '', tryIt: !!this.onTry, skipWood: true });
    this.fillNames();
  }

  /** While the ring is up, main.ts gives it the frame in place of the game's (flat here, or the game's 2.5D view). */
  ringFrame(views: Views, scene: Scene, fx: Fx, now: number, dt: number): boolean {
    if (!this.ring || !this.open) return false;
    this.ring.frame(views, scene, fx, now, dt);
    return true;
  }

  private dropRing(): void {
    this.ring?.stop();
    this.ring = null;
    this.el.classList.remove('ringing', 'picked');
  }

  /** Your hero of the picked class, and its slot (none: a new one is made). */
  private mine(): { h: Game['save']['heroes'][number]; i: number } | null {
    const i = this.g.save.heroes.findIndex((h) => h.cls === this.pick);
    return i < 0 ? null : { h: this.g.save.heroes[i], i };
  }

  /** PLAY round the fire: they walk off, black, and your hero's game starts under it. */
  private async playFromRing(i: number): Promise<void> {
    this.leaving = true;
    await this.ring?.leave();
    this.leaving = false;
    this.g.choose(i);
    this.hide();
    liftBlack();
  }

  /** Tapped a hero round the fire (or the dark, `null`). */
  private tapRing(cls: HeroClass | null): void {
    if (this.leaving) return;
    if (!cls || (this.detail && cls === this.pick)) return void (this.detail && ((this.detail = false), this.create()));
    if (cls !== this.pick) this.look = 0;
    Object.assign(this, { pick: cls, detail: true });
    this.create();
    this.el.querySelector('.rcard')?.scrollTo(0, 0);
  }

  /** Names nobody has (client/names.ts): the first is the one suggested. Asked for when they run out. */
  private free: string[] = [];
  private asking = false;
  private claiming = false;
  private fillNames(): void {
    if (this.free.length || this.asking) return;
    this.asking = true;
    void freeNames(this.g.save.heroes.map((h) => normName(h.name))).then((list) => {
      this.asking = false;
      this.free = list.length ? list : [NAMES[this.pick]];
      const box = this.el.querySelector('label.name input') as HTMLInputElement | null;
      if (box && !box.value) box.value = this.free[0];
    });
  }
  private nameSays(text: string): void {
    const p = this.el.querySelector('.nameerr');
    if (p) p.textContent = text;
  }

  /** BEGIN (or skip the wood): the name is claimed on the server first, so no two heroes share one. */
  private async begin(skip: boolean): Promise<void> {
    if (this.claiming || this.leaving) return;
    const box = this.el.querySelector('label.name input') as HTMLInputElement, name = normName(box.value || this.free[0] || NAMES[this.pick]);
    if (!NAME_OK.test(name)) return this.nameSays('Two to twelve letters.');
    if (this.g.save.heroes.some((h) => normName(h.name) === name)) return this.nameSays('One of your heroes has that name.');
    this.claiming = true;
    this.nameSays('');
    const id = heroId(), got = await claimName(name, id);
    this.claiming = false;
    if (got === 'taken') return (this.free = this.free.filter((n) => n !== name)), this.nameSays('Someone has that name. Try another.');
    if (!canMake(this.g.save.heroes, this.pick)) return;
    // The hero turns to the road, the fire flares, black; the game starts under it and the black lifts.
    this.leaving = true;
    await this.ring?.leave();
    this.leaving = false;
    if (this.g.create(this.pick, name, this.look, id) >= 0) (skip && this.g.skipWood(), this.hide());
    liftBlack();
  }

  /** A hero whose name another hero holds: a new one before it plays (Kyle, 2026-11-13). */
  private renameView(i: number): void {
    const h = this.g.save.heroes[i];
    this.dropRing();
    this.pick = h.cls;
    this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">A NEW NAME</div><div class="stop" style="justify-content: center">${face(h.cls, h.look)}</div>` +
      `<p class="lede">Another hero already goes by ${esc(h.name)}. Pick a new name for yours.</p>` +
      `<label class="name">NAME <input maxlength="12" value="${this.free[0] ?? ''}" autocomplete="off" spellcheck="false"></label>` +
      `<button data-newname class="ghost">NEW NAME</button><p class="nameerr" role="status"></p>` +
      `<button data-rename="${i}" class="primary wide">KEEP THIS NAME</button><button data-back class="ghost wide">BACK</button></div>`;
    this.fillNames();
  }
  private async rename(i: number): Promise<void> {
    const h = this.g.save.heroes[i], box = this.el.querySelector('label.name input') as HTMLInputElement | null;
    if (!h || !box || this.claiming) return;
    const name = normName(box.value);
    if (!NAME_OK.test(name)) return this.nameSays('Two to twelve letters.');
    if (this.g.save.heroes.some((o) => o !== h && normName(o.name) === name)) return this.nameSays('One of your heroes has that name.');
    this.claiming = true;
    const got = await claimName(name, h.id);
    this.claiming = false;
    if (got === 'taken') return (this.free = this.free.filter((n) => n !== name)), this.nameSays('Someone has that name. Try another.');
    Object.assign(h, { name, rename: false });
    this.g.choose(i);
    this.hide();
  }

  /** Redraw without losing a name the player has typed. */
  private keepName(redraw: () => void): void {
    const typed = (this.el.querySelector('input') as HTMLInputElement | null)?.value;
    redraw();
    const box = this.el.querySelector('input') as HTMLInputElement | null;
    if (box && typed !== undefined) box.value = typed;
  }

  private click(t: HTMLElement): void {
    const b = t.closest('button');
    if (!b) return void (this.ring && t.closest('.hring') && this.tapRing(null));
    const d = b.dataset;
    if (this.inPanel) return this.panel?.click(d);
    if (d.recover !== undefined && this.panel) return this.dropRing(), (this.inPanel = true), this.panel.open(), void (this.el.innerHTML = this.panel.html());
    if (d.play !== undefined && this.g.save.heroes[Number(d.play)]?.rename) return this.renameView(Number(d.play));
    if (d.rename !== undefined) return void this.rename(Number(d.rename));
    if (d.play !== undefined && this.ring) return void (this.leaving || this.playFromRing(Number(d.play)));
    if (d.play !== undefined) return this.g.choose(Number(d.play)), this.hide();
    if (d.wood !== undefined) return this.g.choose(Number(d.wood)), this.g.startWood(true), this.hide();
    if (d.skipwood !== undefined) return void this.begin(true);
    if (d.newname !== undefined) {
      this.free.shift();
      const box = this.el.querySelector('label.name input') as HTMLInputElement;
      box.value = this.free[0] ?? '';
      return this.nameSays(''), this.fillNames();
    }
    if (d.more !== undefined) return (this.more = this.more === Number(d.more) ? -1 : Number(d.more)), (this.retiring = -1), this.home();
    if (d.retire !== undefined) {
      const i = Number(d.retire);
      if (this.retiring === i) (this.g.retire(i), (this.retiring = -1));
      else this.retiring = i;
      return this.g.save.heroes.length ? this.home() : this.create();
    }
    if (d.new !== undefined) return (this.detail = false), this.create();
    if (d.back !== undefined) return this.home();
    if (d.cls) return this.tapRing(d.cls as HeroClass);
    if (d.look !== undefined) return (this.look = Number(d.look)), this.keepName(() => this.create());
    if (d.try !== undefined && this.onTry) return this.hide(), this.onTry(this.pick, this.look);
    if (d.begin !== undefined && !this.leaving) void this.begin(false);
  }
}
