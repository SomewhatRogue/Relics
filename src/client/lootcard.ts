/**
 * The loot card (card.ts): what a dropped piece is, its tier, how it fights, what's on it, and what it
 * would change against what you wear. It stays shut until you ask (Kyle, 2026-11-04: "it shouldn't pop
 * up unless you click on it"): LOOK on a phone, a tap on the drop, or F on a laptop. On the floor a drop
 * is only its sprite and glint. TAKE (or F again) puts it in your pack; walking off shuts it.
 */
import { itemCol } from './uniquelook';
import { WEAPONS } from '../shared/tuning';
import { card, compare } from './card';
import { REACH } from '../sim/loot';
import { full } from '../sim/pack';
import { PACKW } from './storewords';
import { COPY } from './copy';
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';

type Drop = ArenaRoom['drops'][number];

export class LootCard {
  /** The drop whose card is open (-1: none). */
  current = -1;
  /** The nearest drop of yours in reach (-1: none): what LOOK or F would open. */
  near = -1;
  private packed = 0;
  private want = -1;
  private el = document.createElement('div');

  constructor(take: (id: number) => void) {
    this.el.id = 'loot';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    const go = (e: Event) => {
      const b = (e.target as HTMLElement).closest('button');
      if (!b || this.current < 0) return;
      e.preventDefault();
      if (b.dataset.shut !== undefined) this.shut();
      else take(this.current);
    };
    this.el.addEventListener('touchstart', go, { passive: false });
    this.el.addEventListener('click', go);
  }

  /** Open the card for drop `id` (shown next frame, if it's still yours and in reach). */
  open(id: number): void {
    this.want = id;
  }

  shut(): void {
    this.want = this.current = -1;
    this.el.hidden = true;
  }

  /** The drop of yours nearest `me`, within `reach`. */
  static nearest(room: ArenaRoom, me: Hero, reach = REACH): Drop | null {
    let best: Drop | null = null, bd = reach;
    for (const d of room.drops) {
      if (d.owner && d.owner !== me.id) continue;
      const dist = Math.hypot(d.x - me.x, d.y - me.y);
      if (dist <= bd) (bd = dist), (best = d);
    }
    return best;
  }

  update(room: ArenaRoom, me: Hero, keys: boolean): void {
    this.near = LootCard.nearest(room, me)?.id ?? -1;
    const d = this.want >= 0 ? room.drops.find((x) => x.id === this.want) : undefined;
    // Taken, gone, or walked away from: the card shuts.
    if (!d || Math.hypot(d.x - me.x, d.y - me.y) > REACH) return void (this.want >= 0 || !this.el.hidden ? this.shut() : undefined);
    if (d.id === this.current && !this.el.hidden && me.bag.length === this.packed) return;
    this.packed = me.bag.length;
    this.current = d.id;
    const it = d.item, cls = it.kit ? WEAPONS[it.kit].cls : WEAPONS[me.weapon].cls, mine = cls === WEAPONS[me.weapon].cls;
    this.el.style.setProperty('--el', itemCol(it));
    const shut = `<button data-shut>CLOSE</button>`;
    this.el.innerHTML = card(it, me) +
      (mine ? (full(me) ? `<div class="yours">${PACKW.fullJob}</div><div class="lbtns">${shut}</div>` : compare(me, it) + `<div class="yours">${COPY.takes}</div><div class="lbtns"><button class="primary">TAKE${keys ? ' (F)' : ''}</button>${shut}</div>`)
        : `<div class="yours">${COPY.otherClass.replace('{Class}', cls[0] + cls.slice(1).toLowerCase())} ${full(me) ? PACKW.fullJob : COPY.bound}</div><div class="lbtns">${full(me) ? '' : `<button class="primary">TAKE${keys ? ' (F)' : ''}</button>`}${shut}</div>`);
    this.el.hidden = false;
  }
}
