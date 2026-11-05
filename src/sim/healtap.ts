/**
 * The Healer's MEND (`heal` in the code: the town works own "mend"; numbers in shared/signs.ts
 * HEAL_SIGN). A tap heals the nearest hurt friend in reach, or the Healer if nobody near is hurt or the
 * Healer is the worst off (Kyle: "I like that healer mend can self heal too"). A friend is a hero on
 * their feet, or someone the room may heal (Hew in the wood: an Npc with health). Never a goblin.
 * It's the Healer's own hands, not the censer: a cold censer doesn't stop it.
 */
import { HEAL_SIGN } from '../shared/signs';
import type { Npc } from '../shared/arena';
import { heals } from './hungry';
import { healMult } from './lantern';
import type { FightEvent, Hero } from './types';

type Friend = { x: number; y: number; hp: number; maxHp: number; hero?: Hero; npc?: Npc };

/** Who a MEND from `h` goes to now: a friend, `h`, or nobody (null). */
export function healTarget(h: Hero, heroes: Hero[], npcs: Npc[]): Friend | null {
  const near = (o: { x: number; y: number }) => Math.hypot(o.x - h.x, o.y - h.y) <= HEAL_SIGN.range;
  const friends: Friend[] = [
    ...heroes.filter((o) => o !== h && o.act !== 'down' && !o.out && o.hp < o.maxHp && near(o)).map((o) => ({ x: o.x, y: o.y, hp: o.hp, maxHp: o.maxHp, hero: o })),
    ...npcs.filter((n) => n.hp !== undefined && n.maxHp && n.hp < n.maxHp && near(n)).map((n) => ({ x: n.x, y: n.y, hp: n.hp!, maxHp: n.maxHp!, npc: n })),
  ];
  const self: Friend = { x: h.x, y: h.y, hp: h.hp, maxHp: h.maxHp, hero: h }, hurt = h.hp < h.maxHp;
  if (!friends.length) return hurt ? self : null;
  const share = (f: Friend) => f.hp / f.maxHp;
  if (hurt && friends.every((f) => share(h) < share(f))) return self;
  return friends.reduce((a, b) => (Math.hypot(b.x - h.x, b.y - h.y) < Math.hypot(a.x - h.x, a.y - h.y) ? b : a));
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
