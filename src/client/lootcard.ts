/**
 * The loot card: stand on a dropped weapon and it says what it is, in words: the traits and what
 * each one rewards, and what you'd leave behind. TAKE (or F) swaps it in.
 */
import { CLASS_KITS, TRAITS, WEAPONS, itemName, type Item } from '../shared/tuning';
import { REACH } from '../sim/loot';
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';

const describe = (i: Item | undefined) => (i ? itemName(i) + ': ' + i.traits.map((t) => TRAITS[t].name).join(' + ') : 'PLAIN');

export class LootCard {
  /** The drop on show (-1: none). */
  current = -1;
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
    if (best.id === this.current && !this.el.hidden) return;
    this.current = best.id;
    const it = best.item, cls = WEAPONS[it.kit].cls, mine = CLASS_KITS[WEAPONS[me.weapon].cls].includes(it.kit);
    const el = it.traits.find((t) => t === 'ember' || t === 'rime' || t === 'storm') ?? '';
    this.el.dataset.el = el === 'ember' ? 'fire' : el === 'rime' ? 'frost' : el;
    this.el.innerHTML =
      `<div class="name">${itemName(it)}</div>` +
      it.traits.map((t) => `<div class="trait"><b>${TRAITS[t].name}</b> ${TRAITS[t].text}</div>`).join('') +
      (mine ? `<div class="yours">Yours: ${describe(me.arms[it.kit])}</div><button>TAKE${keys ? ' (F)' : ''}</button>` : `<div class="yours">For a ${cls}</div>`);
    this.el.hidden = false;
  }
}
