/**
 * Mini quests in the fight (shared/miniquest.ts; docs/design/territories.md, "Mini quests"). Each of the map's
 * has a record on the room: offered, taken, done. A hero standing by an offered giver takes it with GRAB (it reads
 * TALK: client/cluster.ts), once the packs standing over the giver are dead. Taking it makes its goblins, there and
 * then, as tough as the rest of the room's for the party. When they're all dead it's done: whoever was hidden
 * comes out and goes home, the giver too if they will (at once, or when a hero is back in sight of them), and a
 * hidden chest is shown. It never keeps a gate, and one
 * left unfinished is simply lost. Plain data (`room.minis`), so a friend's screen and a handed-on job have it.
 */
import { MINI, type Mini } from '../shared/miniquest';
import { miniWords, MINI_WORDS } from '../shared/miniwords';
import { afoot } from './afoot';
import { newChest } from './chests';
import { isDead } from './damage';
import type { ArenaRoom } from './room';
import { freeSurvivor } from './survivors';
import type { Target } from './targets';
import type { FightEvent, Hero } from './types';

/** A mini quest's record: where it stands, and the goblins it woke (their ids). */
export interface MiniState { id: string; state: 'offered' | 'taken' | 'done'; ids: number[]; /** Its giver has gone home. */ left?: boolean }

export const newMinis = (minis: Mini[] | undefined): MiniState[] => (minis ?? []).map((m) => ({ id: m.id, state: 'offered', ids: [] }));

const of = (room: ArenaRoom, id: string) => room.map.minis?.find((m) => m.id === id);
const up = (h: Hero) => h.act !== 'down' && !h.out && afoot(h, undefined);
/** The packs standing over the giver are dead (or there were none). */
const free = (room: ArenaRoom, m: Mini) => !m.after?.length || !room.allEnemies.some((e) => !isDead(e) && e.pack !== undefined && m.after!.includes(e.pack));

/** The offered mini quest whose giver this hero is standing by and can talk to now. */
export function canTalk(room: ArenaRoom, h: Hero): Mini | undefined {
  if (!up(h)) return undefined;
  let best: Mini | undefined, bd: number = MINI.reach;
  for (const s of room.minis) {
    const m = s.state === 'offered' ? of(room, s.id) : undefined;
    if (!m || !free(room, m)) continue;
    const d = Math.hypot(m.giver.x - h.x, m.giver.y - h.y);
    if (d <= bd) (bd = d), (best = m);
  }
  return best;
}

/** GRAB beside a giver: the mini quest is taken, and what it sends you after is made. True if one was. */
export function talkMini(room: ArenaRoom, h: Hero, ev: FightEvent[]): boolean {
  const m = canTalk(room, h), s = m && room.minis.find((x) => x.id === m.id);
  if (!m || !s) return false;
  s.state = 'taken';
  s.ids = room.wake(m.foes);
  // (The press is spent: it never falls through to a grab a tick later.)
  h.grabQueuedAt = -9;
  ev.push({ k: 'mini', x: m.giver.x, y: m.giver.y, id: m.id, what: 'taken' });
  return true;
}

/** The giver gets up and goes home: gone from where they stood (nobody paths round them now, no screen draws them). */
function leave(room: ArenaRoom, m: Mini, s: MiniState): void {
  freeSurvivor(room.survivors, m.giver.x, m.giver.y, room.time);
  if (room.map.npcs) room.map.npcs = room.map.npcs.filter((n) => n.talk !== `mini:${m.id}`);
  s.left = true;
}

/**
 * Once a tick: a taken one whose goblins are all dead is done, and pays; a giver who waits to be seen goes home
 * once a hero is back by them, with a last word.
 */
export function stepMinis(room: ArenaRoom, ev: FightEvent[]): void {
  for (const s of room.minis) {
    const m = of(room, s.id);
    if (m && s.state === 'done' && m.giverLeaves === 'seen' && !s.left && room.heroes.some((h) => up(h) && Math.hypot(h.x - m.giver.x, h.y - m.giver.y) <= MINI.seen)) {
      leave(room, m, s);
      ev.push({ k: 'mini', x: m.giver.x, y: m.giver.y, id: m.id, what: 'home' });
    }
    if (s.state !== 'taken') continue;
    // (Both lists: within a tick, on a map where the far ones doze, the ones just made are only among the awake.)
    if (!m || [room.allEnemies, room.enemies].some((l) => l.some((e) => s.ids.includes(e.id) && !isDead(e)))) continue;
    s.state = 'done';
    for (const p of m.frees ?? []) freeSurvivor(room.survivors, p.x, p.y, room.time);
    if (m.giverLeaves === 'done') leave(room, m, s);
    if (m.chest) room.chests.push(newChest(m.chest.x, m.chest.y));
    // (Said where whoever was hidden has just stepped out, so the words come from someone you can see.)
    const at = m.frees?.[0] ?? m.at;
    ev.push({ k: 'mini', x: at.x, y: at.y, id: m.id, what: 'done' });
  }
}

/** Is this giver still standing where they were (drawn, and in the way)? Gone once their quest is done, if they leave. */
export const giverThere = (room: ArenaRoom, m: Mini) => !room.minis.find((s) => s.id === m.id)?.left;

/** The gold marks: a giver with something to say, once a hero is near and they're free to say it; a taken one's ground. */
export function miniTargets(room: ArenaRoom): Target[] {
  const out: Target[] = [];
  for (const s of room.minis) {
    const m = of(room, s.id);
    if (!m) continue;
    if (s.state === 'offered' && free(room, m) && room.heroes.some((h) => Math.hypot(h.x - m.giver.x, h.y - m.giver.y) <= MINI.near)) out.push({ kind: 'folk', x: m.giver.x, y: m.giver.y });
    else if (s.state === 'taken') out.push({ kind: 'job', x: m.at.x, y: m.at.y });
  }
  return out;
}

/** The goal's second line: every mini quest in hand, said plainly. '' if none. */
export function miniLine(room: ArenaRoom): string {
  const taken = room.minis.filter((s) => s.state === 'taken').map((s) => miniWords(s.id).goal).filter(Boolean);
  return taken.length ? `${MINI_WORDS.also}: ${taken.join('. ')}` : '';
}
