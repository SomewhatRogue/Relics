/**
 * The pack: what's in hand, the class skill, the relic carried, and the spares. Open any time (I, or
 * PACK); the world keeps going while it's open, and changes go to the room as an intent.
 */
import { CLASS_KITS, ELEMENT_NAME, LANTERN, RELICS, TRAITS, WEAPONS, itemName, type Item, type RelicId } from '../shared/tuning';
import { GEAR, PACK } from '../sim/pack';
import type { Hero } from '../sim/types';
import { COAL, COPY } from './copy';

const el = (r: RelicId, h: Hero) => (h.augments[r] ? ' <em>' + ELEMENT_NAME[h.augments[r] as keyof typeof ELEMENT_NAME] + '</em>' : '');
const traits = (i: Item) => i.traits.map((t) => `<div class="tr"><b>${TRAITS[t].name}</b> ${TRAITS[t].text}</div>`).join('');
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
    const key = JSON.stringify([h.weapon, h.arms[h.weapon], h.bag, h.relics, h.found, h.augments, h.glow]);
    if (key === this.key) return;
    this.key = key;
    const [skill, carried] = h.relics, cls = WEAPONS[h.weapon].cls, plain = CLASS_KITS[cls][0], held = h.arms[h.weapon];
    const spares = h.bag.map((it, i) => `<div class="row"><div><b>${itemName(it)}</b>${traits(it)}</div>${btn(COPY.equip, GEAR.equip, i, 'go')}${btn(COPY.drop, GEAR.drop, i, 'ghost')}</div>`);
    if (held || h.weapon !== plain) spares.unshift(`<div class="row"><div><b>${WEAPONS[plain].name}</b><div class="tr">${COPY.plain}</div></div>${btn(COPY.equip, GEAR.equip, -1, 'go')}</div>`);
    const shelf = h.found.map((r, i) => (r === carried ? '' : `<div class="row"><div><b>${RELICS[r].name}</b>${el(r, h)}</div>${btn(COPY.carry, GEAR.carry, i, 'go')}</div>`)).join('');
    this.el.innerHTML =
      `<div class="head"><h2>${COPY.pack}</h2><span>${COPY.stillGoing}</span><button data-close class="x" aria-label="Close">&times;</button></div>` +
      `<h3>${COPY.inHand}</h3><div class="row"><div><b>${held ? itemName(held) : WEAPONS[h.weapon].name}</b>${held ? traits(held) : `<div class="tr">${COPY.plain}</div>`}</div></div>` +
      `<h3>${COPY.skill}</h3><div class="row"><div><b>${RELICS[skill].name}</b>${el(skill, h)}</div></div>` +
      (cls === 'HEALER' ? `<h3>${COAL.name} <i>${h.glow} / ${LANTERN.max}</i></h3><div class="none">${COAL.line}</div>` : '') +
      `<h3>${COPY.relic}</h3>` +
      (carried ? `<div class="row"><div><b>${RELICS[carried].name}</b>${el(carried, h)}</div>${btn(COPY.putAway, GEAR.carry, -1, 'ghost')}</div>` : `<div class="none">${h.found.length ? '' : COPY.relicEmpty}</div>`) + shelf +
      `<h3>${COPY.packed} <i>${h.bag.length} / ${PACK}</i></h3>` + (spares.length ? spares.join('') : `<div class="none">${COPY.packEmpty}</div>`) +
      (h.bag.length >= PACK ? `<div class="none">${COPY.packFull}</div>` : '');
  }
}
