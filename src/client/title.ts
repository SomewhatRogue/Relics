/**
 * The start screen: your heroes (up to three), each with its class for life, its level and gold; play
 * one, make a new one, or retire one. Making a hero: the five classes, name and look only; tap one to
 * watch it fight and see its ratings; name them and begin. (Kyle: less is more.) RECOVERY CODE opens recoveryui.ts.
 */
import { HERO_SLOTS } from '../shared/progress';
import { CHAPTER_1 } from '../shared/story';
import { CLASS_KITS, CLASS_ORDER, type HeroClass } from '../shared/tuning';
import { CLASSES, CLASS_NAME, CLASS_TAG, SKILL_NOTE, STATS } from '../shared/classes';
import { areas } from './guardarea';
import { Preview } from './preview';
import { COPY, RECOVER } from './copy';
import { RECOVERY, type Recovery } from './recovery';
import { RecoveryPanel } from './recoveryui';
import type { Game } from './game';
import { heroPortrait } from './sprites';

const NAMES: Record<HeroClass, string> = { WARRIOR: 'BRANNOCK', RANGER: 'WREN', ROGUE: 'SILK', MAGE: 'ASHE', HEALER: 'IVY' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const face = (cls: HeroClass, look = 0) => `<img class="face" alt="" src="${heroPortrait(cls, look).toDataURL()}">`;

export class Title {
  private el = document.createElement('div');
  open = false;
  private pick: HeroClass = 'WARRIOR';
  /** On the class grid, or looking at one class. */
  private detail = false;
  private retiring = -1;
  private preview: Preview | null = null;
  /** Which of the class's three looks is chosen. */
  private look = 0;
  /** The recovery code panel (none in the one-file build), and whether it's the one showing. */
  private panel: RecoveryPanel | null = null;
  private inPanel = false;

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

  show(): void {
    this.open = true;
    this.el.hidden = false;
    this.retiring = -1;
    this.front();
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
    this.preview?.stop();
    this.preview = null;
    this.open = false;
    this.el.hidden = true;
    this.done();
  }

  private home(): void {
    const hs = this.g.save.heroes;
    this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">${CHAPTER_1.name.toUpperCase()}</div>` +
      `<p class="lede">${COPY.homeLede}</p><div class="slots">` +
      hs.map((h, i) => `<div class="slot">${face(h.cls, h.look)}<div class="who"><b>${esc(h.name)}</b><span>${CLASS_NAME[h.cls]} &middot; LEVEL ${h.level} &middot; ${h.gold} GOLD</span></div>` +
        `<button data-play="${i}" class="primary">PLAY</button>${h.prologue ? `<button data-wood="${i}" class="ghost" title="Play the wood again">WOOD</button>` : ''}<button data-retire="${i}" class="ghost">${this.retiring === i ? 'SURE?' : 'RETIRE'}</button></div>`).join('') +
      `</div>${hs.length < HERO_SLOTS ? '<button data-new class="wide">NEW HERO</button>' : '<p class="dim">Three heroes at most. Retire one to make another.</p>'}${this.recoverButton()}</div>`;
  }

  private create(): void {
    this.preview?.stop();
    this.preview = null;
    const back = this.g.save.heroes.length ? '<button data-back class="ghost wide">BACK</button>' : '';
    if (!this.detail) {
      this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">A NEW CHAPTER</div><p class="lede">Pick a class.</p><div class="cgrid names">` +
        CLASS_ORDER.map((k) => `<button data-cls="${k}" class="ccard">${face(k)}<b>${CLASS_NAME[k]}</b></button>`).join('') + `</div>${back}${this.recoverButton()}</div>`;
      return;
    }
    // The class card (Kyle, 2026-11-04): name and tagline, how it plays, the ratings, GUARD and DODGE
    // (from the class's first kit), the class's own rule and extra, then its skill.
    const c = this.pick, s = CLASSES[c];
    const row = (label: string, text: string) => `<div class="crow"><b>${label}</b><span>${text}</span></div>`;
    this.el.innerHTML = `<div class="tcard"><h2 class="cname">${CLASS_NAME[c]}</h2><p class="ctag">${CLASS_TAG[c]}</p><div class="stage"></div>` +
      `<div class="looks">${[0, 1, 2].map((i) => `<button data-look="${i}" class="${i === this.look ? 'on' : ''}">${face(c, i)}</button>`).join('')}</div>` +
      `<p class="cline">${s.line}</p>` +
      `<div class="bars">${STATS.map((k) => `<span>${k}</span><i>${'<em class="on"></em>'.repeat(s.stats[k])}${'<em></em>'.repeat(5 - s.stats[k])}</i>`).join('')}</div>` +
      `<div class="csheet">${areas(CLASS_KITS[c][0])}<p class="cguard">${s.guard}</p>` +
      (s.perk ? row(s.perkLabel ?? '', s.perk) : '') + (s.note ? row(s.noteLabel ?? '', s.note) : '') +
      (s.sign ? row(s.signLabel ?? '', s.sign) : '') + row('SKILL', s.skill) + `<p class="cnote">${SKILL_NOTE}</p></div>` +
      `<label class="name">NAME <input maxlength="12" value="${NAMES[c]}" autocomplete="off" spellcheck="false"></label>` +
      `<button data-begin class="primary wide">BEGIN</button>${this.g.save.heroes.some((h) => h.prologue) ? '<button data-skipwood class="ghost wide">SKIP THE WOOD</button>' : ''}<button data-pick class="ghost wide">BACK</button></div>`;
    this.preview = new Preview(c, this.look);
    this.el.querySelector('.stage')!.appendChild(this.preview.el);
    this.preview.start();
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
    if (!b) return;
    const d = b.dataset;
    if (this.inPanel) return this.panel?.click(d);
    if (d.recover !== undefined && this.panel) return (this.inPanel = true), this.panel.open(), void (this.el.innerHTML = this.panel.html());
    if (d.play !== undefined) return this.g.choose(Number(d.play)), this.hide();
    if (d.wood !== undefined) return this.g.choose(Number(d.wood)), this.g.startWood(true), this.hide();
    if (d.skipwood !== undefined) {
      const name = (this.el.querySelector('input') as HTMLInputElement).value;
      if (this.g.create(this.pick, name, this.look) >= 0) this.g.skipWood(), this.hide();
      return;
    }
    if (d.retire !== undefined) {
      const i = Number(d.retire);
      if (this.retiring === i) (this.g.retire(i), (this.retiring = -1));
      else this.retiring = i;
      return this.g.save.heroes.length ? this.home() : this.create();
    }
    if (d.new !== undefined) return (this.detail = false), this.create();
    if (d.back !== undefined) return this.home();
    if (d.cls) return (this.pick = d.cls as HeroClass), (this.look = 0), (this.detail = true), this.create();
    if (d.look !== undefined) return (this.look = Number(d.look)), this.keepName(() => this.create());
    if (d.pick !== undefined) return (this.detail = false), this.create();
    if (d.begin !== undefined) {
      const name = (this.el.querySelector('input') as HTMLInputElement).value;
      if (this.g.create(this.pick, name, this.look) >= 0) this.hide();
    }
  }
}
