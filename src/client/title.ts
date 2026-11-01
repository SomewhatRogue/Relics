/**
 * The start screen: your heroes (up to three), each with its class for life, its level and gold; play
 * one, make a new one, or retire one. Making a hero means picking a class once, and a name.
 */
import { HERO_SLOTS } from '../shared/progress';
import { CHAPTER_1 } from '../shared/story';
import { CLASS_ORDER, type HeroClass } from '../shared/tuning';
import { CLASSES, NO_RELICS } from '../shared/classes';
import type { Game } from './game';
import { HEROES } from './sprites';

const BLURB: Record<HeroClass, string> = {
  WARRIOR: 'Big and slow. Parries, heavy blows, and strong enough to lift barrels and throw goblins.',
  RANGER: 'The draw is everything: the longbow pierces a line, the crossbow fires on the press.',
  ROGUE: 'Twin daggers, two and a half times from behind. The only one quick on their feet.',
  MAGE: 'Quick sparks or long-charged blasts. Blinks far, but tires fast.',
  HEALER: 'Holy smites, blessed ground that mends allies and burns goblins, and a ward that throws arrows back. Good alone too.',
};
const NAMES: Record<HeroClass, string> = { WARRIOR: 'BRANNOCK', RANGER: 'WREN', ROGUE: 'SILK', MAGE: 'ASHE', HEALER: 'IVY' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const face = (cls: HeroClass) => `<img class="face" alt="" src="${HEROES[cls].down.c.toDataURL()}">`;

export class Title {
  private el = document.createElement('div');
  open = false;
  private pick: HeroClass = 'WARRIOR';
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
      `<p class="lede">Wickhold is the last walled town. Pick up where you left off, or raise another hero.</p><div class="slots">` +
      hs.map((h, i) => `<div class="slot">${face(h.cls)}<div class="who"><b>${esc(h.name)}</b><span>${h.cls} &middot; LEVEL ${h.level} &middot; ${h.gold} GOLD</span></div>` +
        `<button data-play="${i}" class="primary">PLAY</button><button data-retire="${i}" class="ghost">${this.retiring === i ? 'SURE?' : 'RETIRE'}</button></div>`).join('') +
      `</div>${hs.length < HERO_SLOTS ? '<button data-new class="wide">NEW HERO</button>' : '<p class="dim">Three heroes is the most. Retire one to make another.</p>'}</div>`;
  }

  private create(): void {
    const c = this.pick, s = CLASSES[c];
    this.el.innerHTML = `<div class="tcard"><h1>RELIC</h1><div class="sub">A NEW HERO</div>` +
      `<p class="lede">Choose a class. It is for life: to play another, make another hero.</p><div class="classes">` +
      CLASS_ORDER.map((k) => `<button data-cls="${k}" class="cls ${k === c ? 'on' : ''}">${face(k)}<b>${k}</b></button>`).join('') +
      `</div><div class="about"><b>${c}</b> ${BLURB[c]}<dl class="sheet">` +
      ([['WEAPON', s.weapon], ['GUARD', s.guard], ['DODGE', s.dodge], ['SKILL', s.skill], ['ONLY THEM', s.edge], ['CAN\'T', s.cant]] as const).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') +
      `</dl><span>${NO_RELICS}</span></div>` +
      `<label class="name">NAME <input maxlength="12" value="${NAMES[c]}" autocomplete="off" spellcheck="false"></label>` +
      `<button data-begin class="primary wide">BEGIN AS ${c}</button>${this.g.save.heroes.length ? '<button data-back class="ghost wide">BACK</button>' : ''}</div>`;
  }

  private click(t: HTMLElement): void {
    const b = t.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.play !== undefined) return this.g.choose(Number(d.play)), this.hide();
    if (d.retire !== undefined) {
      const i = Number(d.retire);
      if (this.retiring === i) (this.g.retire(i), (this.retiring = -1));
      else this.retiring = i;
      return this.g.save.heroes.length ? this.home() : this.create();
    }
    if (d.new !== undefined) return this.create();
    if (d.back !== undefined) return this.home();
    if (d.cls) {
      const typed = (this.el.querySelector('input') as HTMLInputElement | null)?.value ?? '';
      const keep = typed && typed !== NAMES[this.pick] ? typed : '';
      this.pick = d.cls as HeroClass;
      this.create();
      if (keep) (this.el.querySelector('input') as HTMLInputElement).value = keep;
      return;
    }
    if (d.begin !== undefined) {
      const name = (this.el.querySelector('input') as HTMLInputElement).value;
      if (this.g.create(this.pick, name) >= 0) this.hide();
    }
  }
}
