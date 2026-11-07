/**
 * The Healer's MEND (`heal` in the code: the town works own "mend"; numbers in shared/signs.ts
 * HEAL_SIGN). A tap heals the worst-off hurt friend in reach, or the Healer if nobody near is hurt or the
 * Healer is much worse off than them (Kyle: "I like that healer mend can self heal too"; and 2026-11-06,
 * "Cleric could heal friends only self with V": the old rule gave it to you whenever you were the least
 * bit worse off, which in a fight is nearly always, and only reached 4 tiles). A friend is a hero on
 * their feet, or someone the room may heal (Hew in the wood: an Npc with health); the yard's squire only
 * when nobody else is hurt. Never a goblin. It's the Healer's own hands, not the censer: a cold censer
 * doesn't stop it. Every screen asks healTarget the same question to draw the gold mark (signdraw.ts).
 */
import { HEAL_SIGN } from '../shared/signs';
import type { Npc } from '../shared/arena';
import { heals } from './hungry';
import { healMult } from './lantern';
import type { FightEvent, Hero } from './types';

type Friend = { x: number; y: number; hp: number; maxHp: number; hero?: Hero; npc?: Npc };
type Body = { x: number; y: number; hp: number; maxHp: number };

/** Who a MEND from `h` goes to now: a friend, `h`, or nobody (null). (A friend wearing the Cleaver, whom
 *  nobody else can heal, is passed over: the press would be spent for nothing.) */
export function healTarget(h: Hero, heroes: Hero[], npcs: Npc[]): Friend | null {
  const dist = (o: { x: number; y: number }) => Math.hypot(o.x - h.x, o.y - h.y), hurt = (o: Body) => o.hp < o.maxHp;
  const all: Friend[] = [
    ...heroes.filter((o) => o !== h && o.act !== 'down' && !o.out && hurt(o) && heals(o, { ...h, cold: false }, 1) > 0).map((o) => ({ x: o.x, y: o.y, hp: o.hp, maxHp: o.maxHp, hero: o })),
    ...npcs.filter((n) => n.hp !== undefined && !!n.maxHp && n.hp < n.maxHp).map((n) => ({ x: n.x, y: n.y, hp: n.hp!, maxHp: n.maxHp!, npc: n })),
  ].filter((f) => dist(f) <= HEAL_SIGN.range);
  // (The yard's squire is a sparring partner: a real friend comes first.)
  const real = all.filter((f) => f.hero?.id !== 'squire'), friends = real.length ? real : all;
  const self: Friend = { x: h.x, y: h.y, hp: h.hp, maxHp: h.maxHp, hero: h };
  if (!friends.length) return hurt(h) ? self : null;
  const share = (f: Body) => f.hp / f.maxHp;
  const best = friends.reduce((a, b) => (share(b) < share(a) - HEAL_SIGN.tie || (Math.abs(share(b) - share(a)) <= HEAL_SIGN.tie && dist(b) < dist(a)) ? b : a));
  return hurt(h) && share(h) + HEAL_SIGN.selfFirst < share(best) ? self : best;
}

/** Pressed: heal someone, paid in stamina. False (nothing spent) with nobody hurt or no breath to spare. */
export function healTap(h: Hero, heroes: Hero[], npcs: Npc[], now: number, ev: FightEvent[]): boolean {
  if (h.winded || h.stamina < HEAL_SIGN.cost) return ev.push({ k: 'nosign', x: h.x, y: h.y, id: h.id, why: 'breath' }), false;
  const t = healTarget(h, heroes, npcs);
  if (!t) return ev.push({ k: 'nosign', x: h.x, y: h.y, id: h.id, why: 'hurt' }), false;
  Object.assign(h, { stamina: h.stamina - HEAL_SIGN.cost, staminaAt: now });
  const base = Math.round(HEAL_SIGN.heal * healMult(h));
  // (The Cleaver and the Keeping Mace still have their say on a hero; the cold censer doesn't.)
  const n = Math.min(t.maxHp - t.hp, Math.round(t.hero ? heals(t.hero, { ...h, cold: false }, base) : base));
  if (t.hero) t.hero.hp += n;
  else if (t.npc) t.npc.hp = t.hp + n;
  ev.push({ k: 'mended', x: h.x, y: h.y, x2: t.x, y2: t.y, n, self: t.hero === h });
  if (n > 0) ev.push({ k: 'heal', x: t.x, y: t.y, n });
  return true;
}
