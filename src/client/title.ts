/**
 * The start screen: your heroes (up to three), each with its class for life, its level and gold; play
 * one, make a new one, or retire one. Making a hero: five classes with a line each; tap one for its
 * pitch, ratings, weapon and skill; name them and begin.
 */
import { HERO_SLOTS } from '../shared/progress';
import { CHAPTER_1 } from '../shared/story';
import { CLASS_ORDER, type HeroClass } from '../shared/tuning';
import { CLASSES, NO_RELICS, STATS } from '../shared/classes';
import { COPY } from './copy';
import type { Game } from './game';
import { HEROES } from './sprites';

const NAMES: Record<HeroClass, string> = { WARRIOR: 'BRANNOCK', RANGER: 'WREN', ROGUE: 'SILK', MAGE: 'ASHE', HEALER: 'IVY' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const face = (cls: HeroClass) => `<img class="face" alt="" src="${HEROES[cls].down.c.toDataURL()}">`;

export class Title {
  private el = document.createElement('div');
  open = false;
  private pick: HeroClass = 'WARRIOR';
  /** On the class grid, or looking at one class. */
  private detail = false;
  private retiring = -1;

  constructor(private g: Game, private done: () => void) {
    this.el.id = 'title';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.click(e.target as HTMLElement));
  }

  show(): void {
    this.open = true;
    this.el.hidden = false;
    this.retiring = -1;
    this.detail = false;
    if (this.g.save.heroes.length) this.home();
    else this.create();
  }

  private hide(): void {
    this.open = false;
    this.el.hidden = true;
    this.done();
  }

  private home(): void {
    const hs = this.g.save.heroes;
    this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">${CHAPTER_1.name.toUpperCase()}</div>` +
      `<p class="lede">${COPY.homeLede}</p><div class="slots">` +
      hs.map((h, i) => `<div class="slot">${face(h.cls)}<div class="who"><b>${esc(h.name)}</b><span>${h.cls} &middot; LEVEL ${h.level} &middot; ${h.gold} GOLD</span></div>` +
        `<button data-play="${i}" class="primary">PLAY</button>${h.prologue ? `<button data-wood="${i}" class="ghost" title="Play the wood again">WOOD</button>` : ''}<button data-retire="${i}" class="ghost">${this.retiring === i ? 'SURE?' : 'RETIRE'}</button></div>`).join('') +
      `</div>${hs.length < HERO_SLOTS ? '<button data-new class="wide">NEW HERO</button>' : '<p class="dim">Three heroes is the most. Retire one to make another.</p>'}</div>`;
  }

  private create(): void {
    const back = this.g.save.heroes.length ? '<button data-back class="ghost wide">BACK</button>' : '';
    if (!this.detail) {
      this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">A NEW HERO</div><p class="lede">${COPY.pickLede}</p><div class="cgrid">` +
        CLASS_ORDER.map((k) => `<button data-cls="${k}" class="ccard">${face(k)}<span><b>${k}</b><i>${CLASSES[k].line}</i></span></button>`).join('') + `</div>${back}</div>`;
      return;
    }
    const c = this.pick, s = CLASSES[c];
    this.el.innerHTML = `<div class="tcard"><div class="dhead">${face(c)}<div><h2>${c}</h2><p>${s.pitch}</p></div></div>` +
      `<div class="bars">${STATS.map((k) => `<span>${k}</span><i>${'<em class="on"></em>'.repeat(s.stats[k])}${'<em></em>'.repeat(5 - s.stats[k])}</i>`).join('')}</div>` +
      `<dl class="sheet"><dt>WEAPON</dt><dd>${s.weapon}</dd><dt>SKILL</dt><dd>${s.skill}</dd><dt>GUARD</dt><dd>${s.guard}</dd><dt>CAN'T</dt><dd>${s.cant}</dd>${s.note ? `<dt>CENSER</dt><dd>${s.note}</dd>` : ''}</dl><p class="dim small">${NO_RELICS}</p>` +
      `<label class="name">NAME <input maxlength="12" value="${NAMES[c]}" autocomplete="off" spellcheck="false"></label>` +
      `<button data-begin class="primary wide">BEGIN AS ${c}</button>${this.g.save.heroes.some((h) => h.prologue) ? '<button data-skipwood class="ghost wide">BEGIN IN WICKHOLD (SKIP THE WOOD)</button>' : ''}<button data-pick class="ghost wide">OTHER CLASSES</button></div>`;
  }

  private click(t: HTMLElement): void {
    const b = t.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.play !== undefined) return this.g.choose(Number(d.play)), this.hide();
    if (d.wood !== undefined) return this.g.choose(Number(d.wood)), this.g.startWood(true), this.hide();
    if (d.skipwood !== undefined) {
      const name = (this.el.querySelector('input') as HTMLInputElement).value;
      if (this.g.create(this.pick, name) >= 0) this.g.skipWood(), this.hide();
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
    if (d.cls) return (this.pick = d.cls as HeroClass), (this.detail = true), this.create();
    if (d.pick !== undefined) return (this.detail = false), this.create();
    if (d.begin !== undefined) {
      const name = (this.el.querySelector('input') as HTMLInputElement).value;
      if (this.g.create(this.pick, name) >= 0) this.hide();
    }
  }
}
