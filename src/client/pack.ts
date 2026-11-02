/**
 * The pack (I, Tab, or PACK): what you wear in slots along the top (hand, armor, two rings, the relic
 * carried), the pack below, the relics on the shelf and the belt. Drag a piece onto its slot to wear it,
 * into the pack to take it off, or onto DROP; tap one to see its card and buttons. The world keeps going
 * while it's open, and every change goes to the room as an intent (sim/pack.ts).
 */
import { CLASS_KITS, ELEMENT_NAME, LANTERN, POTION, POTIONS, RELICS, TIERS, WEAPONS, itemName, slotOf, type Item, type RelicId } from '../shared/tuning';
import { GEAR, PACK } from '../sim/pack';
import type { Hero } from '../sim/types';
import { COAL, COPY } from './copy';
import { card, compare, heroSheet } from './card';
import { drag } from './packdrag';

/** Where a piece is: in the pack (`bag:i`), in hand, worn (`armor`, `ring:k`), the relic carried, a relic on the shelf (`found:i`), or on the belt (`belt:i`). */
export type Spot = string;
const el = (r: RelicId, h: Hero) => (h.augments[r] ? ' ' + ELEMENT_NAME[h.augments[r] as keyof typeof ELEMENT_NAME] : '');
const btn = (label: string, op: number, arg: number, cls = '') => `<button data-op="${op}" data-arg="${arg}" class="${cls}">${label}</button>`;

/** What dropping `src` on `dst` does, as a gear change (or nothing). */
export function moveOf(h: Hero, src: Spot, dst: Spot): [number, number] | null {
  const [s, si] = src.split(':'), [d] = dst.split(':'), i = Number(si), room = h.bag.length < PACK;
  if (s === 'bag') {
    const it = h.bag[i];
    if (!it) return null;
    const slot = slotOf(it);
    if (d === 'hand' && slot === 'weapon' && WEAPONS[it.kit!].cls === WEAPONS[h.weapon].cls) return [GEAR.equip, i];
    if ((d === 'armor' && slot === 'armor') || (d === 'ring' && slot === 'ring')) return [GEAR.equip, i];
    if (d === 'drop' && it.quality !== 'hungry') return [GEAR.drop, i];
    return null;
  }
  if (d === 'bag' && room) {
    if (s === 'hand' && h.arms[h.weapon]) return [GEAR.equip, -1];
    if (s === 'armor' && h.armor) return [GEAR.unarm, 0];
    if (s === 'ring' && h.rings[i] && h.rings[i].hungry !== 'wedding') return [GEAR.off, i];
  }
  if (s === 'found' && d === 'relic') return [GEAR.carry, i];
  if (s === 'relic' && d === 'shelf' && h.relics[1]) return [GEAR.carry, -1];
  if (s === 'belt' && d === 'belt' && i > 0) return [GEAR.front, i];
  if (s === 'belt' && d === 'drop') return [GEAR.pour, i];
  return null;
}

export class PackView {
  private el = document.createElement('div');
  open = false;
  private key = '';
  private sel: Spot | null = null;
  private h: Hero | null = null;

  /** `tree`: open the knacks tree (treeui.ts), and how many level-up picks wait. */
  constructor(private gear: (op: number, arg: number) => void, private blocked: () => boolean, private tree: { open: () => void; picks: () => number }) {
    this.el.id = 'pack';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    const press = (e: Event) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
      if (!b) return;
      e.preventDefault();
      if (b.dataset.close !== undefined) return this.toggle(false);
      if (b.dataset.tree !== undefined) return this.toggle(false), this.tree.open();
      this.gear(Number(b.dataset.op), Number(b.dataset.arg));
      this.sel = null;
    };
    this.el.addEventListener('click', press);
    this.el.addEventListener('touchend', press, { passive: false });
    drag(this.el, {
      can: (src, dst) => !!this.h && !!moveOf(this.h, src, dst),
      drop: (src, dst) => {
        const m = this.h && moveOf(this.h, src, dst);
        if (m) this.gear(m[0], m[1]), (this.sel = null), (this.key = '');
      },
      tap: (src) => ((this.sel = this.sel === src ? null : src), (this.key = '')),
    });
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
    this.sel = null;
  }

  /** One square: a piece (its tier's colour, its name) or an empty place to put one. */
  private tile(src: Spot | null, dst: Spot | null, it: { name: string; tier?: keyof typeof TIERS; sub?: string } | null, empty = ''): string {
    const sel = src && src === this.sel ? ' sel' : '';
    const col = it?.tier ? TIERS[it.tier].col : '#4f4a5c';
    return `<div class="tile${it ? '' : ' empty'}${sel}" style="--t:${col}"${src && it ? ` data-src="${src}"` : ''}${dst ? ` data-dst="${dst}"` : ''}>` +
      (it ? `<b>${it.name}</b>${it.sub ? `<i>${it.sub}</i>` : ''}` : `<i>${empty}</i>`) + '</div>';
  }

  private piece = (it: Item) => ({ name: itemName(it), tier: it.quality, sub: it.quality === 'plain' ? '' : TIERS[it.quality].name });

  /** The card and buttons for what's tapped. */
  private detail(h: Hero): string {
    const [s, si] = (this.sel ?? '').split(':'), i = Number(si), plain = CLASS_KITS[WEAPONS[h.weapon].cls][0];
    const row = (inner: string, buttons: string) => `<div class="detail">${inner}<div class="btns">${buttons}</div></div>`;
    if (s === 'bag' && h.bag[i]) {
      const it = h.bag[i], fits = !it.kit || WEAPONS[it.kit].cls === WEAPONS[h.weapon].cls;
      return row(card(it, h) + compare(h, it), (fits ? btn(COPY.equip, GEAR.equip, i, 'go') : '') + (it.quality === 'hungry' ? '' : btn(COPY.drop, GEAR.drop, i, 'ghost')));
    }
    if (s === 'hand') {
      // Every other kit of your class you carry, a tap away.
      const swaps = h.bag.map((it, k) => (slotOf(it) === 'weapon' && WEAPONS[it.kit!].cls === WEAPONS[h.weapon].cls ? btn(`${COPY.swapTo} ${itemName(it)}`, GEAR.equip, k, 'go') : '')).join('');
      return row(h.arms[h.weapon] ? card(h.arms[h.weapon]!) : `<b>${WEAPONS[h.weapon].name}</b><div class="tr">${COPY.plain}</div>`, swaps + (h.arms[h.weapon] || h.weapon !== plain ? btn(COPY.intoPack, GEAR.equip, -1, 'ghost') : ''));
    }
    if (s === 'armor' && h.armor) return row(card(h.armor, h), btn(COPY.takeOff, GEAR.unarm, 0, 'ghost'));
    if (s === 'ring' && h.rings[i]) return row(card(h.rings[i]), h.rings[i].hungry === 'wedding' ? '' : btn(COPY.takeOff, GEAR.off, i, 'ghost'));
    if (s === 'relic' && h.relics[1]) return row(`<b>${RELICS[h.relics[1]].name}</b>${el(h.relics[1], h)}`, btn(COPY.putAway, GEAR.carry, -1, 'ghost'));
    if (s === 'found' && h.found[i]) return row(`<b>${RELICS[h.found[i]].name}</b>${el(h.found[i], h)}`, btn(COPY.carry, GEAR.carry, i, 'go'));
    if (s === 'belt' && h.belt[i]) return row(`<b>${POTIONS[h.belt[i]].name}</b><div class="tr">${POTIONS[h.belt[i]].text}</div>`, (i ? btn(COPY.next, GEAR.front, i, 'go') : '') + btn(COPY.pour, GEAR.pour, i, 'ghost'));
    return `<div class="none">${COPY.dragHint}</div>`;
  }

  /** Each frame: redraw only when what's shown has changed (and never mid-drag). */
  update(h: Hero): void {
    this.h = h;
    if (!this.open || this.el.querySelector('.dragging')) return;
    const key = JSON.stringify([h.weapon, h.arms[h.weapon], h.bag, h.relics, h.found, h.augments, h.glow, h.belt, h.armor, h.rings, this.sel, this.tree.picks()]);
    if (key === this.key) return;
    this.key = key;
    const [skill, carried] = h.relics, held = h.arms[h.weapon];
    const hand = held ? this.piece(held) : { name: WEAPONS[h.weapon].name, tier: 'plain' as const };
    const worn = [
      this.tile('hand', 'hand', hand),
      this.tile('armor', 'armor', h.armor ? this.piece(h.armor) : null, 'ARMOR'),
      ...[0, 1].map((k) => this.tile('ring:' + k, 'ring', h.rings[k] ? this.piece(h.rings[k]) : null, 'RING')),
      this.tile('relic', 'relic', carried ? { name: RELICS[carried].name, tier: 'tolmouth', sub: 'RELIC' } : null, 'RELIC'),
    ].join('');
    const bag = Array.from({ length: PACK }, (_, i) => this.tile(h.bag[i] ? 'bag:' + i : null, 'bag', h.bag[i] ? this.piece(h.bag[i]) : null)).join('') +
      `<div class="tile drop" data-dst="drop"><i>${COPY.drop}</i></div>`;
    const shelf = h.found.map((r, i) => (r === carried ? '' : this.tile('found:' + i, 'shelf', { name: RELICS[r].name, tier: 'tolmouth', sub: 'RELIC' }))).join('');
    const belt = Array.from({ length: POTION.belt }, (_, i) => this.tile(h.belt[i] ? 'belt:' + i : null, i === 0 ? 'belt' : null, h.belt[i] ? { name: POTIONS[h.belt[i]].name, sub: i ? '' : COPY.drunkNext } : null)).join('');
    this.el.innerHTML =
      `<div class="head"><h2>${COPY.pack}</h2><span>${COPY.stillGoing}</span><button data-tree class="kn">${COPY.knacks}${this.tree.picks() ? ' <i>!</i>' : ''}</button><button data-close class="x" aria-label="Close">&times;</button></div>` +
      `<h3>${COPY.worn}</h3><div class="slots">${worn}</div>` +
      `<h3>${COPY.packed} <i>${h.bag.length} / ${PACK}</i></h3><div class="grid" data-dst="bag">${bag}</div>` +
      `<h3>${COPY.relic}</h3><div class="grid shelf" data-dst="shelf">${shelf || `<div class="none">${h.found.length ? '' : COPY.relicEmpty}</div>`}</div>` +
      `<h3>${COPY.belt} <i>${h.belt.length} / ${POTION.belt}</i></h3><div class="slots">${belt}</div>` +
      this.detail(h) +
      `<h3>${COPY.skill}</h3><div class="none"><b>${RELICS[skill].name}</b>${el(skill, h)}</div>` +
      (WEAPONS[h.weapon].cls === 'HEALER' ? `<h3>${COAL.name} <i>${h.glow} / ${LANTERN.max}</i></h3><div class="none">${COAL.line}</div>` : '') +
      `<h3>${COPY.stats}</h3>` + heroSheet(h);
  }
}
