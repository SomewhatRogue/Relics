/**
 * The loot card: stand on dropped gear and it says what it is (card.ts): its tier, how it fights,
 * what's on it, and what it would change against what you wear. TAKE (or F) puts it in your pack.
 */
import { TIERS, WEAPONS } from '../shared/tuning';
import { card, compare } from './card';
import { REACH } from '../sim/loot';
import { PACK } from '../sim/pack';
import { COPY } from './copy';
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';


export class LootCard {
  /** The drop on show (-1: none). */
  current = -1;
  private packed = 0;
  private el = document.createElement('div');

  constructor(take: (id: number) => void) {
    this.el.id = 'loot';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    const go = (e: Event) => {
      if (!(e.target as HTMLElement).closest('button') || this.current < 0) return;
      e.preventDefault();
      take(this.current);
    };
    this.el.addEventListener('touchstart', go, { passive: false });
    this.el.addEventListener('click', go);
  }

  update(room: ArenaRoom, me: Hero, keys: boolean): void {
    let best = null as (typeof room.drops)[number] | null, bd = REACH;
    for (const d of room.drops) {
      const dist = Math.hypot(d.x - me.x, d.y - me.y);
      if (dist <= bd) (bd = dist), (best = d);
    }
    if (!best) return void ((this.current = -1), (this.el.hidden = true));
    if (best.id === this.current && !this.el.hidden && me.bag.length === this.packed) return;
    this.packed = me.bag.length;
    this.current = best.id;
    const it = best.item, cls = it.kit ? WEAPONS[it.kit].cls : WEAPONS[me.weapon].cls, mine = cls === WEAPONS[me.weapon].cls;
    this.el.style.setProperty('--el', TIERS[it.quality].col);
    this.el.innerHTML = card(it, me) +
      (mine ? (me.bag.length >= PACK ? `<div class="yours">${COPY.full}</div>` : compare(me, it) + `<div class="yours">${COPY.takes}</div><button>TAKE${keys ? ' (F)' : ''}</button>`)
        : `<div class="yours">${COPY.otherClass.replace('{Class}', cls[0] + cls.slice(1).toLowerCase())}</div>`);
    this.el.hidden = false;
  }
}
