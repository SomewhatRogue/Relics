/**
 * Breathing room (docs/plans/bosses.md section 3; numbers shared/threat.ts SCREEN and HOLD). Once a tick:
 * what's on screen (awake goblins within SCREEN.near of any hero, not held back, by threat and by how many
 * are meaty or heavy), a pack that has just woken while that's over the party's caps held at its spot
 * (jeering: client/pacedraw.ts), and held packs let go: when the screen drops under HOLD.free of the cap,
 * after HOLD.wait seconds, or at once if a hero comes within HOLD.near or hits one of them. A held goblin
 * strikes nothing and stays put (sim/enemies.ts). A goblin with no pack (an old job's, a spider) is never
 * held, nor a named one. `held` is the room time it was held (0: not), so it's sent once each way.
 */
import { HOLD, SCREEN } from '../shared/tuning';
import { capsFor, foeThreat, meaty, tierOf } from '../shared/roombudget';
import { isDead } from './damage';
import { players } from './party';
import type { Enemy, Hero } from './types';

const fighter = (e: Enemy) => (e.kind === 'scrapper' || e.kind === 'butcher') && !isDead(e) && !e.escaped;
const near = (e: Enemy, hs: Hero[], r: number) => hs.some((h) => Math.hypot(h.x - e.x, h.y - e.y) < r);
const holdable = (e: Enemy) => e.pack !== undefined && !e.name;

export interface Screen { threat: number; meaty: number; heavy: number }

/** What's on screen now, held ones and `but` left out. */
export function onScreen(enemies: Enemy[], heroes: Hero[], but?: Set<Enemy>): Screen {
  const hs = players(heroes).filter((h) => h.act !== 'down'), out: Screen = { threat: 0, meaty: 0, heavy: 0 };
  for (const e of enemies) {
    if (!fighter(e) || e.alert === false || e.held || but?.has(e) || !near(e, hs, SCREEN.near)) continue;
    out.threat += foeThreat(e);
    if (meaty(e)) out.meaty++;
    if (tierOf(e) === 'heavy') out.heavy++;
  }
  return out;
}

/** The goblins asleep before the goblins move this tick (to see who woke). */
export const asleep = (enemies: Enemy[]) => new Set(enemies.filter((e) => e.alert === false && fighter(e) && holdable(e)));

/** After the goblins have moved: hold the packs that just woke over the caps, and let go the ones whose time has come. */
export function stepPacing(enemies: Enemy[], heroes: Hero[], was: Set<Enemy>, index: number, now: number): void {
  const hs = players(heroes).filter((h) => h.act !== 'down');
  if (!hs.length) return;
  const caps = capsFor(hs.length, index), held = new Map<number, Enemy[]>(), woke = new Map<number, Enemy[]>();
  for (const e of enemies) {
    if (!fighter(e) || !holdable(e)) continue;
    if (e.held) (held.get(e.pack!) ?? held.set(e.pack!, []).get(e.pack!)!).push(e);
    else if (was.has(e) && e.alert !== false) (woke.get(e.pack!) ?? woke.set(e.pack!, []).get(e.pack!)!).push(e);
  }
  // Just woke: a pack already held takes its late wakers; a new one holds if it would put the screen over.
  for (const [id, es] of woke) {
    const mates = held.get(id);
    if (mates) {
      for (const e of es) e.held = mates[0].held;
      mates.push(...es);
      continue;
    }
    // Close enough to touch, or hit as it woke: it comes now.
    if (es.some((e) => near(e, hs, HOLD.near) || e.hitAt > now - 0.5)) continue;
    const pack = enemies.filter((e) => e.pack === id && fighter(e) && e.alert !== false), s = onScreen(enemies, heroes, new Set(pack));
    // Nothing else on screen: a pack is never held from an empty screen, however big.
    if (s.threat <= 0) continue;
    const t = pack.reduce((n, e) => n + foeThreat(e), 0), m = pack.filter(meaty).length, hv = pack.filter((e) => tierOf(e) === 'heavy').length;
    if (s.threat + t <= caps.threat && (!m || s.meaty + m <= caps.meaty) && (!hv || s.heavy + hv <= caps.heavy)) continue;
    for (const e of pack) (e.held = now), (e.attack = null), e.act === 'attack' && (e.act = 'chase');
    held.set(id, pack);
  }
  if (!held.size) return;
  // Let go: the oldest first, one pack a tick while the screen is under HOLD.free of the cap.
  const s = onScreen(enemies, heroes);
  let room = s.threat < caps.threat * HOLD.free && s.meaty < caps.meaty;
  for (const es of [...held.values()].sort((a, b) => (a[0].held ?? 0) - (b[0].held ?? 0))) {
    const since = es[0].held ?? now, now0 = es.some((e) => near(e, hs, HOLD.near) || e.hitAt > since) || now - since >= HOLD.wait;
    if (!now0 && !room) continue;
    if (!now0) room = false;
    for (const e of es) (e.held = 0), (e.cooldown = Math.max(e.cooldown, 0.4));
  }
}

/** A held goblin's turn: it stands its ground facing the nearest hero (its jeering is drawn: client/pacedraw.ts). */
export function standHeld(e: Enemy, heroes: Hero[]): void {
  const hs = players(heroes).filter((h) => h.act !== 'down');
  if (!hs.length) return;
  const h = hs.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)), l = Math.hypot(h.x - e.x, h.y - e.y) || 1;
  (e.fx = (h.x - e.x) / l), (e.fy = (h.y - e.y) / l);
}
