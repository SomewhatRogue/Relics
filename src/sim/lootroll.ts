/**
 * The group's roll for a unique piece (docs/design/boss-loot.md): NEED / GREED / PASS, then the room's
 * 1 to 100 on its seeded stream. NEED only for a piece that fits the hero's class (else it counts as GREED).
 */
import type { Item } from '../shared/loot';
import { CLASS_ARMOR } from '../shared/gear';
import type { Rng } from '../shared/rng';
import { CLASS_KITS, WEAPONS } from '../shared/weapons';
import { UNIQUE_DROP } from '../shared/uniques';
import { DROPS } from '../shared/tuning';
import { dropId } from './loot';
import { full } from './pack';
import type { ArenaRoom } from './room';
import type { Hero, LootPick } from './types';

/** How long a settled roll stays on the room for the screens to show it, s (a local number). */
const SHOWN = 6;

/** The player heroes (the squire aside). */
export const players = (heroes: Hero[]) => heroes.filter((h) => h.id !== 'squire');

/** Whether the piece suits this hero's class. */
export function fits(h: Hero, i: Item): boolean {
  const cls = WEAPONS[h.weapon].cls;
  if (i.slot === 'ring') return true;
  if (i.slot === 'weapon') return !!i.kit && CLASS_KITS[cls].includes(i.kit);
  return !!i.armor && CLASS_ARMOR[cls] === i.armor;
}

export function openRoll(room: ArenaRoom, item: Item, x: number, y: number): void {
  const id = ++room.rollSeq;
  room.rolls.push({ id, x, y, item, until: room.time + UNIQUE_DROP.choose, picks: {} });
  room.events.push({ k: 'lootroll', what: 'open', id, x, y });
}

/** Once a tick: read the choices, settle what is ready, drop what has been shown long enough. */
export function stepRolls(room: ArenaRoom, rng: Rng): void {
  if (!room.rolls.length) return;
  const who = players(room.heroes);
  for (const r of room.rolls) {
    if (r.rolls) continue;
    for (const h of who) {
      const p = room.intents.get(h.id)?.loot?.[r.id];
      if (p === 'need' || p === 'greed' || p === 'pass') r.picks[h.id] = p;
    }
    if (room.time < r.until && !who.every((h) => r.picks[h.id])) continue;
    settle(room, r, who, rng);
  }
  room.rolls = room.rolls.filter((r) => !r.rolls || room.time < r.until);
}

function settle(room: ArenaRoom, r: ArenaRoom['rolls'][number], who: Hero[], rng: Rng): void {
  const pick = (h: Hero): LootPick => {
    const p = r.picks[h.id] ?? 'pass';
    return p === 'need' && !fits(h, r.item) ? 'greed' : p;
  };
  const sides = who.map((h) => [h, pick(h)] as const);
  const kind: LootPick = sides.some(([, p]) => p === 'need') ? 'need' : 'greed';
  let tied = sides.filter(([, p]) => p === kind).map(([h]) => h);
  r.rolls = [];
  r.winner = null;
  for (let n = 0; tied.length && n < 20; n++) {
    const got = tied.map((h) => [h, 1 + rng.int(100)] as const);
    for (const [h, v] of got) r.rolls.push([h.id, kind, v]);
    const top = Math.max(...got.map(([, v]) => v));
    tied = got.filter(([, v]) => v === top).map(([h]) => h);
    if (tied.length === 1 || n === 19) r.winner = tied[0].id;
  }
  r.until = room.time + SHOWN;
  const w = who.find((h) => h.id === r.winner);
  if (w && !full(w)) w.bag.push(r.item);
  else room.drops.push({ id: dropId(), x: r.x, y: r.y, item: r.item, life: DROPS.life, ...(w ? { owner: w.id } : {}) });
  if (!w || full(w)) room.events.push({ k: 'drop', x: r.x, y: r.y, q: r.item.quality });
  room.events.push({ k: 'lootroll', what: 'done', id: r.id, x: r.x, y: r.y, ...(r.winner ? { winner: r.winner } : {}) });
}
