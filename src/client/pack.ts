/**
 * The pack (I, Tab, or PACK): your hero with what's on each part of them (HAND, BODY, two RINGs, the
 * RELIC carried, the BELT, and the class SKILL shown but not changed here), and beside it the pack, a
 * square a piece. Tap a piece (or point at it, with a mouse) for its card next to what you wear in that
 * slot now, every number with the change. Drag a piece onto its slot to wear it, or into the pack to
 * take it off. The world keeps going while it's open and your hero stands still; every change goes to
 * the room as an intent (sim/pack.ts).
 */
import { ELEMENT_NAME, LANTERN, POTION, POTIONS, RELICS, WEAPONS, type RelicId } from '../shared/tuning';
import { GEAR, full } from '../sim/pack';
import type { Hero } from '../sim/types';
import { COAL, COPY } from './copy';
import { heroSheet } from './card';
import { cell, grid, plainKit, sideBySide } from './cells';
import { itemIcon, potionIcon, relicIcon, skillIcon } from './itemicons';
import { drag } from './packdrag';
import { heroLook } from './sprites';
import { PACKW } from './storewords';
import { fits, moveOf } from './packmoves';
export { moveOf };
import './pack.css';

/** Where a piece is: in the pack (`bag:i`), in hand, worn (`armor`, `ring:k`), the relic carried, the skill, or on the belt (`belt:i`). */
export type Spot = string;
const el = (r: RelicId, h: Hero) => (h.augments[r] ? ' ' + ELEMENT_NAME[h.augments[r] as keyof typeof ELEMENT_NAME] : '');
const btn = (label: string, op: number, arg: number, cls = '') => `<button data-op="${op}" data-arg="${arg}" class="${cls}">${label}</button>`;
const figs = new Map<string, string>();
/** The hero's own sprite, facing you, as a picture. */
const figure = (cls: Parameters<typeof heroLook>[0], look: number) => figs.get(cls + look) ?? (figs.set(cls + look, heroLook(cls, look).down.c.toDataURL()), figs.get(cls + look)!);

export class PackView {
  private el = document.createElement('div');
  open = false;
  private keys = ['', '', ''];
  private sel: Spot | null = null;
  private hover: Spot | null = null;
  private h: Hero | null = null;
  private parts: HTMLElement[];

  /** `tree`: open the knacks tree (treeui.ts), how many level-up picks wait, and whether you're in town. */
  constructor(private gear: (op: number, arg: number) => void, private blocked: () => boolean, private tree: { open: () => void; picks: () => number; town?: () => boolean }) {
    this.el.id = 'pack';
    this.el.hidden = true;
    this.el.innerHTML = '<div class="head"></div><div class="top"></div><div class="detail"></div><div class="foot"></div>';
    this.parts = Array.from(this.el.children) as HTMLElement[];
    document.body.appendChild(this.el);
    const press = (e: Event) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
      if (!b) return;
      e.preventDefault();
      if (b.dataset.close !== undefined) return this.toggle(false);
      if (b.dataset.tree !== undefined) return this.toggle(false), this.tree.open();
      this.gear(Number(b.dataset.op), Number(b.dataset.arg));
      this.pick(null);
    };
    this.el.addEventListener('click', press);
    this.el.addEventListener('touchend', press, { passive: false });
    drag(this.el, {
      can: (src, dst) => !!this.h && !!moveOf(this.h, src, dst, this.town()),
      drop: (src, dst) => {
        const m = this.h && moveOf(this.h, src, dst, this.town());
        if (m) this.gear(m[0], m[1]), this.pick(null);
      },
      tap: (src) => this.pick(this.sel === src ? null : src),
    });
    // With a mouse, pointing at a piece shows its card (a tap still chooses it).
    this.el.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const t = (e.target as HTMLElement).closest('[data-src]') as HTMLElement | null;
      if (t && t.dataset.src !== this.hover) (this.hover = t.dataset.src!), (this.keys[1] = '');
    });
    addEventListener('keydown', (e) => {
      if (e.repeat || (e.target as HTMLElement).closest?.('input')) return;
      const k = e.key.toLowerCase();
      if (k === 'i' || k === 'tab') (e.preventDefault(), this.toggle());
      else if (k === 'escape' && this.open) this.toggle(false);
    });
  }

  private town = () => !!this.tree.town?.();

  toggle(on = !this.open): void {
    if (on && this.blocked()) return;
    this.open = on;
    this.el.hidden = !on;
    this.keys = ['', '', ''];
    this.sel = this.hover = null;
  }

  /** Choose a piece to look at (or none). */
  pick(src: Spot | null): void {
    this.sel = src;
    this.keys = ['', '', ''];
  }

  /** Your hero, with a square on each part that wears something. */
  private doll(h: Hero): string {
    const [, carried] = h.relics, held = h.arms[h.weapon], sel = this.sel, look = figure(WEAPONS[h.weapon].cls, h.look ?? 0);
    const slot = (name: string, inner: string) => `<div class="slot ${name}">${inner}</div>`;
    const hand = cell(held ?? null, 'hand', { dst: 'hand', sel, label: held ? PACKW.hand : WEAPONS[h.weapon].name, icon: held ? undefined : itemIcon({ kit: h.weapon, quality: 'plain', traits: [] }), col: held ? undefined : '#e8e4ee' });
    const belt = Array.from({ length: POTION.belt }, (_, i) => cell(null, h.belt[i] ? 'belt:' + i : null, { dst: i === 0 ? 'belt' : undefined, sel, icon: h.belt[i] ? potionIcon(h.belt[i]) : undefined, col: h.belt[i] ? POTIONS[h.belt[i]].col : undefined, tag: i === 0 && h.belt[i] ? '1ST' : undefined })).join('');
    return '<div class="doll">' +
      slot('s-relic', cell(null, carried ? 'relic' : null, { dst: 'relic', sel, label: PACKW.relic, icon: carried ? relicIcon() : undefined, col: carried ? '#ffd27a' : undefined })) +
      slot('s-skill', cell(null, 'skill', { sel, label: PACKW.skill, icon: skillIcon(), col: '#5a8ac8', dim: true })) +
      slot('s-hand', hand) +
      slot('s-body', cell(h.armor, h.armor ? 'armor' : null, { dst: 'armor', sel, label: PACKW.body })) +
      [0, 1].map((k) => slot('s-ring' + k, cell(h.rings[k] ?? null, h.rings[k] ? 'ring:' + k : null, { dst: 'ring', sel, label: PACKW.ring }))).join('') +
      `<div class="fig"><img src="${look}" alt=""></div>` +
      `<div class="slot s-belt"><i>${PACKW.belt}</i><div class="beltrow">${belt}</div></div></div>`;
  }

  /** The card and buttons for what's chosen (or pointed at). */
  private detail(h: Hero): string {
    const at = this.sel ?? this.hover, [s, si] = (at ?? '').split(':'), i = Number(si), town = this.town();
    const under = (buttons = '', note = '') => (note ? `<div class="note">${note}</div>` : '') + (buttons ? `<div class="btns">${buttons}</div>` : '');
    const row = (inner: string, buttons = '', note = '') => inner + under(buttons, note);
    if (s === 'bag' && h.bag[i]) {
      const it = h.bag[i], hungry = it.quality === 'hungry';
      return sideBySide(h, it, false, under((fits(h, it.kit) ? btn(PACKW.wear, GEAR.equip, i, 'go') : '') + (!town && !hungry ? btn(COPY.drop, GEAR.drop, i, 'ghost') : ''), hungry ? PACKW.hungry : town ? PACKW.inTown : ''));
    }
    if (s === 'hand') {
      const held = h.arms[h.weapon];
      return row(held ? sideBySide(h, held, true) : `<b>${WEAPONS[h.weapon].name}</b><div class="tr">${COPY.plain}</div>`, held || h.weapon !== plainKit(h) ? btn(COPY.intoPack, GEAR.equip, -1, 'ghost') : '');
    }
    if (s === 'armor' && h.armor) return row(sideBySide(h, h.armor, true), btn(COPY.takeOff, GEAR.unarm, 0, 'ghost'));
    if (s === 'ring' && h.rings[i]) return row(sideBySide(h, h.rings[i], true), h.rings[i].hungry === 'wedding' ? '' : btn(COPY.takeOff, GEAR.off, i, 'ghost'));
    if (s === 'relic' && h.relics[1]) {
      const others = h.found.map((r, k) => (r === h.relics[1] ? '' : btn(`${COPY.carry} ${RELICS[r].short}`, GEAR.carry, k, 'go'))).join('');
      return row(`<b>${RELICS[h.relics[1]].name}</b>${el(h.relics[1], h)}`, others + btn(COPY.putAway, GEAR.carry, -1, 'ghost'));
    }
    if (s === 'skill') return row(`<b>${RELICS[h.relics[0]].name}</b>${el(h.relics[0], h)}`, '', PACKW.skillLine);
    if (s === 'belt' && h.belt[i]) return row(`<b>${POTIONS[h.belt[i]].name}</b><div class="tr">${POTIONS[h.belt[i]].text}</div>`, (i ? btn(COPY.next, GEAR.front, i, 'go') : '') + btn(COPY.pour, GEAR.pour, i, 'ghost'));
    // Nothing chosen: relics found but not carried can still be picked up here.
    const shelf = h.found.filter((r) => r !== h.relics[1]).map((r) => btn(`${COPY.carry} ${RELICS[r].short}`, GEAR.carry, h.found.indexOf(r), 'go')).join('');
    return row(`<div class="none">${matchMedia('(hover: hover)').matches ? PACKW.hover : PACKW.hint}</div>`, shelf);
  }

  /** Each frame: redraw only the parts whose contents have changed (and never mid-drag). */
  update(h: Hero): void {
    this.h = h;
    if (!this.open || this.el.querySelector('.dragging')) return;
    const town = this.town(), gear = JSON.stringify([h.weapon, h.arms[h.weapon], h.bag, h.bagSize, h.relics, h.found, h.augments, h.belt, h.armor, h.rings, town]);
    const keys = [gear + this.sel + this.tree.picks(), gear + this.sel + this.hover, JSON.stringify([h.glow, h.weapon, h.armor, h.rings, h.arms[h.weapon]])];
    const [head, top, detail, foot] = this.parts;
    if (keys[0] !== this.keys[0]) {
      const size = h.bagSize || 8, isFull = full(h);
      head.innerHTML = `<h2>${COPY.pack}</h2><span>${town ? '' : COPY.stillGoing}</span><button data-tree class="kn">${COPY.knacks}${this.tree.picks() ? ' <i>!</i>' : ''}</button><button data-close class="x" aria-label="Close">&times;</button>`;
      top.innerHTML = this.doll(h) + `<div class="bag"><h3>${PACKW.bag} <i class="${isFull ? 'full' : ''}">${h.bag.length} / ${size}</i></h3>` + grid(h.bag, size, 'bag', this.sel, 'bag') +
        (town ? '' : `<div class="tile drop" data-dst="drop"><i>${COPY.drop}</i></div>`) + (isFull && !town ? `<div class="note warn">${PACKW.fullJob}</div>` : '') + '</div>';
    }
    if (keys[1] !== this.keys[1]) detail.innerHTML = this.detail(h);
    if (keys[2] !== this.keys[2]) {
      const open = (foot.querySelector('details') as HTMLDetailsElement | null)?.open ?? false;
      foot.innerHTML = (WEAPONS[h.weapon].cls === 'HEALER' ? `<h3>${COAL.name} <i>${h.glow} / ${LANTERN.max}</i></h3><div class="none">${COAL.line}</div>` : '') +
        `<details${open ? ' open' : ''}><summary>${COPY.stats}</summary>${heroSheet(h)}</details>`;
    }
    this.keys = keys;
  }
}

