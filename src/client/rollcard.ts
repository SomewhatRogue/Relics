/**
 * The boss-loot roll card (docs/design/boss-loot.md). When a unique piece is up for the group's roll and I
 * have not chosen, a card slides in over the play (the fight goes on): the piece, a timer, and NEED / GREED /
 * PASS (N, G, P on a laptop). After I choose it says so; when the room settles the roll it lists every
 * choice and roll and the winner for a few seconds. The choice rides on my input (Game.lootPicks); the room
 * decides (sim/lootroll.ts). Drawing never changes the fight.
 */
import { CLASS_ARMOR, CLASS_KITS, MODS, TRAITS, WEAPONS, itemName, slotOf, traitText, type HeroClass, type Item } from '../shared/tuning';
import type { FightEvent, Hero, LootPick, LootRoll } from '../sim/types';
import { modValue } from './card';
import { itemIcon } from './itemicons';
import { LOOTW } from './lootwords';
import { CLASS_NAME } from '../shared/classes';
import { UNIQUE_DROP } from '../shared/uniques';
import { uniqueLine } from './uniquelook';
import './loot.css';

/** The rolls on the room (sim/lootroll.ts keeps `room.rolls`); none where the sim has not got there. */
export const rollsOf = (room: unknown): LootRoll[] => (room as { rolls?: LootRoll[] }).rolls ?? [];

const SHOW = 7;
const cap = (s: string) => s[0] + s.slice(1).toLowerCase();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Whether this class can NEED the piece: its kit or armor is the class's own (a ring fits all). */
export function fitsClass(it: Item, cls: HeroClass): boolean {
  const s = slotOf(it);
  if (s === 'weapon') return !!it.kit && CLASS_KITS[cls].includes(it.kit);
  if (s === 'armor') return (it.armor ?? 'light') === CLASS_ARMOR[cls];
  return true;
}

interface Done { roll: LootRoll; winner: string | null; at: number }

export class RollCard {
  private el = document.createElement('div');
  private shownKey = '';
  private seen = new Map<number, LootRoll>();
  private done: Done[] = [];
  private told = new Set<number>();
  private me: Hero | null = null;
  private cur: LootRoll | null = null;

  /** `picks`: my standing choices (Game.lootPicks); `name`: a hero's name; `say`: a line for the chat log. */
  constructor(private picks: Record<number, LootPick>, private name: (id: string) => string, private say: (s: string) => void) {
    this.el.id = 'roll';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    this.el.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest('button[data-pick]') as HTMLButtonElement | null;
      if (!b || b.disabled) return;
      e.preventDefault();
      this.choose(b.dataset.pick as LootPick);
    });
    // Capture, so N, G and P are ours while the card asks (G is also GRAB).
    addEventListener('keydown', (e) => {
      if (e.repeat || !this.cur || (e.target as HTMLElement).closest?.('input') || e.ctrlKey || e.metaKey || e.altKey) return;
      const p = ({ n: 'need', g: 'greed', p: 'pass' } as Record<string, LootPick>)[e.key.toLowerCase()];
      if (!p || this.picks[this.cur.id]) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      this.choose(p);
    }, true);
  }

  /** True while the card is asking me. */
  get asking(): boolean {
    return !!this.cur;
  }

  private choose(p: LootPick): void {
    const r = this.cur;
    if (!r || this.picks[r.id] || (p === 'need' && this.me && !fitsClass(r.item, WEAPONS[this.me.weapon].cls))) return;
    this.picks[r.id] = p;
    this.shownKey = '';
  }

  /** Each frame: `now` is real seconds (for how long a result stays). */
  frame(room: unknown, me: Hero | undefined, evs: FightEvent[], now: number, time: number): void {
    const rolls = rollsOf(room);
    this.me = me ?? null;
    for (const r of rolls) {
      if (r.winner === undefined) this.seen.set(r.id, JSON.parse(JSON.stringify(r)));
      else if (!this.told.has(r.id)) this.settle(r, r.winner, now);
    }
    for (const ev of evs) {
      if (ev.k !== 'lootroll' || ev.what !== 'done' || this.told.has(ev.id)) continue;
      const r = rolls.find((x) => x.id === ev.id) ?? this.seen.get(ev.id);
      if (r) this.settle(r, ev.winner ?? r.winner ?? null, now);
    }
    // Rolls gone from the room: forget what I chose on them.
    const live = new Set(rolls.map((r) => r.id));
    for (const k of Object.keys(this.picks)) if (!live.has(Number(k)) && !this.seen.has(Number(k))) delete this.picks[Number(k)];
    this.done = this.done.filter((d) => now - d.at < SHOW);
    this.cur = me ? rolls.find((r) => r.winner === undefined && !this.picks[r.id] && !r.picks[me.id]) ?? null : null;
    const waiting = me ? rolls.find((r) => r.winner === undefined) : undefined;
    const open = this.cur ?? waiting, res = this.done[this.done.length - 1];
    const roll = open ?? res?.roll;
    if (!roll || !me) return void this.hide();
    const mine = this.picks[roll.id] ?? roll.picks[me.id];
    const left = Math.max(0, Math.min(1, (roll.until - time) / UNIQUE_DROP.choose));
    const key = [roll.id, open ? 'o' : 'r', mine, this.cur ? 1 : 0, res?.at].join('|');
    if (key !== this.shownKey) {
      this.shownKey = key;
      this.el.innerHTML = this.html(roll, me, open ? null : res, mine);
      this.el.hidden = false;
    }
    const bar = this.el.querySelector('.rbar i') as HTMLElement | null;
    if (bar) bar.style.width = left * 100 + '%';
  }

  private hide(): void {
    this.el.hidden = true;
    this.shownKey = '';
  }

  /** A roll settled: keep it for a few seconds and say it in the chat log. */
  private settle(r: LootRoll, winner: string | null, now: number): void {
    this.told.add(r.id);
    this.done.push({ roll: r, winner, at: now });
    const what = itemName(r.item), w = r.rolls?.find((x) => x[0] === winner);
    this.say(winner && w ? LOOTW.won(this.name(winner), what, LOOTW.pick(w[1]), w[2]) : LOOTW.nobody(what));
    this.seen.delete(r.id);
    delete this.picks[r.id];
  }

  private html(r: LootRoll, me: Hero, res: Done | null, mine: LootPick | undefined): string {
    const it = r.item, cls = WEAPONS[me.weapon].cls, s = slotOf(it);
    const kind = s === 'weapon' ? LOOTW.weapon(WEAPONS[it.kit ?? 'sword'].name, cap(CLASS_NAME[WEAPONS[it.kit ?? 'sword'].cls])) : s === 'armor' ? LOOTW.armor(cap(it.armor ?? 'light')) : LOOTW.ring;
    const mods = (it.mods ?? []).map((m) => `<div>${esc(MODS[m.id]?.name ?? m.id)} <b>${modValue(m)}</b></div>`);
    const traits = it.traits.map((t) => `<div class="tr"><b>${esc(TRAITS[t].name)}:</b> ${esc(traitText(t, cls))}</div>`);
    const head = `<div class="rhead"><img src="${itemIcon(it)}" alt=""><div><b>${esc(itemName(it))}</b><span>${esc(kind)}</span></div></div>` +
      `<div class="rmods">${mods.join('')}${traits.join('')}</div>` + (uniqueLine(it) ? `<div class="uline">${esc(uniqueLine(it))}</div>` : '');
    if (res) {
      const last = new Map((res.roll.rolls ?? []).map((x) => [x[0], x] as const)), rows = [...last.values()].map(([id, p, n]) => `<div class="${id === res.winner ? 'win' : ''}"><span>${esc(this.name(id))} ${LOOTW.pick(p)}</span><b>${n}${id === res.winner ? ' ' + LOOTW.winnerTag : ''}</b></div>`);
      const passed = Object.entries(res.roll.picks).filter(([id, p]) => p === 'pass' && !(res.roll.rolls ?? []).some((x) => x[0] === id)).map(([id]) => `<div class="pass"><span>${esc(this.name(id))} ${LOOTW.pass}</span><b></b></div>`);
      return head + `<div class="rres">${rows.join('')}${passed.join('')}${rows.length ? '' : `<div>${LOOTW.everyonePassed}</div>`}</div>`;
    }
    if (mine) return head + `<div class="rbar"><i></i></div><div class="rwait">${LOOTW.yourPick(mine)}. ${LOOTW.waiting}</div>`;
    const fits = fitsClass(it, cls), keys = matchMedia('(hover: hover)').matches;
    const btn = (p: LootPick, dis = false, note = '') => `<button class="${p}" data-pick="${p}"${dis ? ' disabled' : ''}>${LOOTW[p]}${keys ? ` (${p === 'need' ? 'N' : p === 'greed' ? 'G' : 'P'})` : ''}${note ? `<small>${note}</small>` : ''}</button>`;
    return head + `<div class="rbar"><i></i></div><div class="rbtns">${btn('need', !fits, fits ? '' : LOOTW.notYours)}${btn('greed')}${btn('pass')}</div>`;
  }
}

