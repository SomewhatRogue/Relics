/**
 * The pack: what's in hand, the class skill, the relic carried, and the spares. Open any time (I, or
 * PACK); the world keeps going while it's open, and changes go to the room as an intent.
 */
import { POTION, POTIONS, CLASS_KITS, ELEMENT_NAME, LANTERN, RELICS, TIERS, WEAPONS, type RelicId } from '../shared/tuning';
import { GEAR, PACK } from '../sim/pack';
import type { Hero } from '../sim/types';
import { COAL, COPY } from './copy';
import { card, compare, heroSheet } from './card';

const el = (r: RelicId, h: Hero) => (h.augments[r] ? ' <em>' + ELEMENT_NAME[h.augments[r] as keyof typeof ELEMENT_NAME] + '</em>' : '');
const btn = (label: string, op: number, arg: number, cls = '') => `<button data-op="${op}" data-arg="${arg}" class="${cls}">${label}</button>`;

export class PackView {
  private el = document.createElement('div');
  open = false;
  private key = '';

  constructor(private gear: (op: number, arg: number) => void, private blocked: () => boolean) {
    this.el.id = 'pack';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    const press = (e: Event) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
      if (!b) return;
      e.preventDefault();
      if (b.dataset.close !== undefined) return this.toggle(false);
      this.gear(Number(b.dataset.op), Number(b.dataset.arg));
    };
    this.el.addEventListener('click', press);
    this.el.addEventListener('touchend', press, { passive: false });
    addEventListener('keydown', (e) => {
      if (e.repeat || (e.target as HTMLElement).closest?.('input')) return;
      const k = e.key.toLowerCase();
      if (k === 'i' || k === 'tab') (e.preventDefault(), this.toggle());
      else if (k === 'escape' && this.open) this.toggle(false);
    });
  }

  toggle(on = !this.open): void {
    if (on && this.blocked()) return;
    this.open = on;
    this.el.hidden = !on;
    this.key = '';
  }

  /** Each frame: redraw only when what's shown has changed. */
  update(h: Hero): void {
    if (!this.open) return;
    const key = JSON.stringify([h.weapon, h.arms[h.weapon], h.bag, h.relics, h.found, h.augments, h.glow, h.belt, h.armor, h.rings]);
    if (key === this.key) return;
    this.key = key;
    const [skill, carried] = h.relics, cls = WEAPONS[h.weapon].cls, plain = CLASS_KITS[cls][0], held = h.arms[h.weapon];
    const row = (inner: string, buttons = '') => `<div class="row"><div>${inner}</div>${buttons}</div>`;
    const gear = (inner: string, buttons: string) => `<div class="row stack"><div>${inner}</div><div class="btns">${buttons}</div></div>`;
    const spares = h.bag.map((it, i) => gear(card(it, h) + compare(h, it), (!it.kit || WEAPONS[it.kit].cls === cls ? btn(COPY.equip, GEAR.equip, i, 'go') : '') + (it.quality === 'hungry' ? '' : btn(COPY.drop, GEAR.drop, i, 'ghost'))));
    if (held || h.weapon !== plain) spares.unshift(row(`<div class="card-head" style="--t:${TIERS.plain.col}"><span class="chip">${TIERS.plain.name}</span><b>${WEAPONS[plain].name}</b></div><div class="tr">${COPY.plain}</div>`, btn(COPY.equip, GEAR.equip, -1, 'go')));
    const shelf = h.found.map((r, i) => (r === carried ? '' : row(`<b>${RELICS[r].name}</b>${el(r, h)}`, btn(COPY.carry, GEAR.carry, i, 'go')))).join('');
    this.el.innerHTML =
      `<div class="head"><h2>${COPY.pack}</h2><span>${COPY.stillGoing}</span><button data-close class="x" aria-label="Close">&times;</button></div>` +
      `<h3>${COPY.inHand}</h3>` + row(held ? card(held) : `<div class="card-head" style="--t:${TIERS.plain.col}"><span class="chip">${TIERS.plain.name}</span><b>${WEAPONS[h.weapon].name}</b></div><div class="tr">${COPY.plain}</div>`) +
      `<h3>${COPY.worn}</h3>` + (h.armor ? row(card(h.armor)) : `<div class="none">${COPY.noArmor}</div>`) +
      h.rings.map((r, i) => row(card(r), r.hungry === 'wedding' ? '' : btn(COPY.takeOff, GEAR.off, i, 'ghost'))).join('') +
      `<h3>${COPY.skill}</h3>` + row(`<b>${RELICS[skill].name}</b>${el(skill, h)}`) +
      (cls === 'HEALER' ? `<h3>${COAL.name} <i>${h.glow} / ${LANTERN.max}</i></h3><div class="none">${COAL.line}</div>` : '') +
      `<h3>${COPY.belt} <i>${h.belt.length} / ${POTION.belt}</i></h3>` +
      (h.belt.length ? h.belt.map((p, i) => row(`<b>${POTIONS[p].name}</b><div class="tr">${POTIONS[p].text}</div>`, (i ? btn(COPY.next, GEAR.front, i, 'go') : '') + btn(COPY.pour, GEAR.pour, i, 'ghost'))).join('') : `<div class="none">${COPY.beltEmpty}</div>`) +
      `<h3>${COPY.relic}</h3>` +
      (carried ? row(`<b>${RELICS[carried].name}</b>${el(carried, h)}`, btn(COPY.putAway, GEAR.carry, -1, 'ghost')) : `<div class="none">${h.found.length ? '' : COPY.relicEmpty}</div>`) + shelf +
      `<h3>${COPY.packed} <i>${h.bag.length} / ${PACK}</i></h3>` + (spares.length ? spares.join('') : `<div class="none">${COPY.packEmpty}</div>`) +
      (h.bag.length >= PACK ? `<div class="none">${COPY.packFull}</div>` : '') +
      `<h3>${COPY.stats}</h3>` + heroSheet(h);
  }
}
