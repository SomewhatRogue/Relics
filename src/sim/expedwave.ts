/**
 * A wave or a hunting party on an expedition as one pack (Kyle, 2026-11-04: "I didn't see too many enemy
 * types"): a template for the ALARM (tuning EXPED_PACKS.waves: wolves, netters and thieves early, banners
 * and oil crews in the middle, sappers and log-carriers late), its centrepiece and backer if the cap
 * allows, and small ones (or wolves) for the rest, `n` in all. No specials past EXPED_PACKS.near already
 * awake round the one it's coming for, so a fight still reads. A party's wave is tougher and harder hitting and from
 * three players the template's `more` comes too, as on a job (sim/packs.ts). Rolled on the expedition's
 * own counter (expedpressure.ts roll), so a save carries it.
 */
import { ENCOUNTER, type Role } from '../shared/encounters';
import { PARTY_TOUGH } from '../shared/threat';
import { pickTemplate, templatesFor } from '../shared/expedpacks';
import { EXPED, EXPED_PACKS, VARIANTS } from '../shared/tuning';
import { isDead } from './damage';
import type { ExpedState } from './exped';
import { shapeFoe } from './ownfoes';
import type { ArenaRoom } from './room';
import type { Enemy, Hero } from './types';

type P = { x: number; y: number };

/** A goblin past a small one (a pack's role, or an old goblin's sort). */
export const special = (e: Enemy) =>
  e.role ? e.role !== 'fodder' && e.role !== 'wolf' && e.role !== 'blind' : (e.kind === 'butcher' && !e.name) || !!e.bow || (!!e.variant && e.variant !== 'looter');

/** The roles of a wave of `n` at this ALARM, with `room` for specials (and the pack's bunched small ones). */
export function waveRoles(x: ExpedState, n: number, room: number, roll: () => number): { roles: Role[]; bunch: boolean } {
  const lv = Math.min(x.level, EXPED_PACKS.waves.length - 1), cap = Math.max(0, Math.min(EXPED_PACKS.specials.wave[lv], room));
  const t = pickTemplate(roll, templatesFor(EXPED_PACKS.waves[lv], Infinity, cap));
  const specials: Role[] = [...(t.centre ?? []), ...(t.support ?? [])];
  if (x.party >= 3 && t.more && specials.length < cap) specials.push(t.more);
  const top = specials.slice(0, Math.max(0, n - 1));
  return { roles: [...top, ...Array<Role>(Math.max(0, n - top.length)).fill(t.fodderKind ?? 'fodder')], bunch: !!t.bunch };
}

/**
 * How many more specials a wave toward `h` may bring: EXPED_PACKS.near, less those awake round them and
 * those of earlier waves still on their way (a hold's waves come close together).
 */
export function roomFor(room: ArenaRoom, h: P): number {
  const far = EXPED.waveFrom[1] + 6;
  const about = room.enemies.filter((e) => {
    if (isDead(e) || e.alert === false || !special(e)) return false;
    const d = Math.hypot(e.x - h.x, e.y - h.y);
    return d < EXPED_PACKS.nearR || (d < far && (e.pack ?? 0) >= EXPED_PACKS.wave0);
  }).length;
  return Math.max(0, EXPED_PACKS.near - about);
}

/** One goblin of the wave, at (px, py), as its role makes it (as the room makes a planned one). */
export function waveFoe(room: ArenaRoom, role: Role, px: number, py: number, pack: number, bunch: boolean): Enemy {
  const e = room.addFoe(role === 'butcher' ? 'butcher' : 'scrapper', px, py);
  Object.assign(e, { pack, role });
  if (role === 'archer') e.bow = true;
  else if (role !== 'fodder' && role !== 'butcher') (e.variant = role), (e.hp = e.maxHp = VARIANTS[role as keyof typeof VARIANTS].hp);
  if (role === 'fodder' && bunch) e.hp = e.maxHp = ENCOUNTER.bunchHp;
  shapeFoe(e);
  return e;
}

/** A party's wave: every goblin of it tougher and harder hitting by the party's size (shared/threat.ts PARTY_TOUGH; its level is the room's). */
export function toughen(es: Enemy[], party: number): void {
  const n = Math.max(1, Math.min(4, party)) - 1;
  if (!n) return;
  for (const e of es) (e.hp = e.maxHp = Math.round(e.maxHp * PARTY_TOUGH.hp[n])), (e.harm = +((e.harm ?? 1) * PARTY_TOUGH.harm[n]).toFixed(3));
}

/** Who a wave at (px, py) comes for: the hero nearest it. */
export const nearest = (heroes: Hero[], px: number, py: number) => heroes.reduce((a, b) => (Math.hypot(b.x - px, b.y - py) < Math.hypot(a.x - px, a.y - py) ? b : a));
