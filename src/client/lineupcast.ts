/**
 * Who stands in the lineup (lineup.ts) and how each is put in each move. Every move is set from the
 * room's own fields (the act, its clock, the attack's `t` against its `windup`), so what the page shows
 * is what the game draws. Cosmetic only: nothing here runs a room.
 */
import { newHero, currentSwing } from '../sim/hero';
import { newEnemy } from '../sim/enemies';
import type { Enemy, Hero, AttackKind } from '../sim/types';
import { CLASS_KITS, type HeroClass } from '../shared/tuning';
import type { FoeVariant } from '../shared/terrain';

export const MOVES = ['stand', 'walk', 'wind up', 'strike', 'recover', 'hurt', 'flinch', 'stagger', 'die'] as const;
export type Move = (typeof MOVES)[number];

export type Unit = { label: string; tall: number } & ({ hero: { cls: HeroClass; look: number } } | { foe: { kind: 'scrapper' | 'butcher'; variant?: FoeVariant } });

const CLS: HeroClass[] = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
/** The mobs, most confused first (docs/design/art-pass.md), then the rest. */
const MOBS: FoeVariant[] = ['shield', 'netter', 'hexer', 'lunger', 'gaffer', 'snarer', 'ironhide', 'heavy', 'looter', 'stoker', 'drummer', 'banner', 'thief', 'oiler', 'torch', 'blind', 'chalker', 'skimmer', 'planker', 'swingle', 'forker', 'kegman', 'pouncer', 'gorger'];

/** Everyone, by the group asked for (`heroes`, `goblins`, or all). */
export function cast(which: string): Unit[] {
  const out: Unit[] = [];
  if (which !== 'goblins') for (const cls of CLS) for (const look of [0, 1, 2]) out.push({ label: `${cls} ${look + 1}`, tall: 40, hero: { cls, look } });
  if (which !== 'heroes') {
    out.push({ label: 'GOBLIN', tall: 32, foe: { kind: 'scrapper' } }, { label: 'BUTCHER', tall: 44, foe: { kind: 'butcher' } });
    for (const v of MOBS) out.push({ label: v.toUpperCase(), tall: 34, foe: { kind: 'scrapper', variant: v } });
  }
  return out;
}

/** A looping share 0..1 of a `len` s cycle, offset so neighbours don't move in step. */
const loop = (now: number, len: number, off = 0) => ((now + off) % len) / len;

/** A hero in the move at wall time `now`; `t` is the room time to draw it at. */
export function heroIn(u: { cls: HeroClass; look: number }, m: Move, id: string, now: number): { h: Hero; t: number; prime?: Hero } {
  const h = newHero(id, 0, 0);
  Object.assign(h, { weapon: CLASS_KITS[u.cls][0], look: u.look, fx: 0.2, fy: 1, hp: 100, tag: '' });
  const s = currentSwing(h);
  let t = 10;
  // Stepped a hair every 3 s (never drawn) so a class's idle never starts: this column is the plain stand.
  h.x = (Math.floor(now / 3) % 2) * 0.05;
  if (m === 'walk') Object.assign(h, { fx: 1, fy: 0.1, moving: true });
  if (m === 'wind up' || m === 'strike' || m === 'recover') {
    Object.assign(h, { fx: 1, fy: 0.15, act: 'attack', combo: 0 });
    const k = loop(now, m === 'wind up' ? 1.2 : 0.9);
    h.actT = m === 'wind up' ? s.windup * k : m === 'strike' ? s.windup + s.active * k : s.windup + s.active + s.recover * k;
  }
  // Hurt: a hit without a stagger (the flash and the flinch along the push). The `prime` draw at the
  // blow's time with full health stamps it, so the age of the hit is `t`.
  if (m === 'hurt') {
    Object.assign(h, { fx: 1, fy: 0.15, kvx: -2, kvy: 0, hp: 80 });
    t = loop(now, 0.8) * 0.5;
    return { h, t, prime: { ...h, hp: 100 } };
  }
  if (m === 'flinch') Object.assign(h, { fx: 1, fy: 0.15, act: 'hurt', actDur: 0.5, actT: loop(now, 0.9) * 0.5, kvx: -3, kvy: 0 });
  if (m === 'stagger') Object.assign(h, { act: 'stun', actDur: 9, actT: now % 9 });
  if (m === 'die') Object.assign(h, { act: 'down', out: true, actDur: 9, actT: 1 });
  return { h, t };
}

/** What each sort swings with (the kinds the room gives them). */
function kindOf(e: Enemy): AttackKind {
  if (e.kind === 'butcher') return 'cleave';
  const v = e.variant;
  return v === 'hexer' ? 'hex' : v === 'netter' ? 'net' : v === 'heavy' ? 'swing' : v === 'gaffer' ? 'hook' : v === 'oiler' || v === 'skimmer' ? 'pour' : v === 'torch' ? 'torch' : v === 'pouncer' ? 'pounce' : 'stab';
}

/** A goblin in the move at wall time `now`; `t` is the room time to draw it at. */
export function foeIn(u: { kind: 'scrapper' | 'butcher'; variant?: FoeVariant }, m: Move, id: number, now: number): { e: Enemy; t: number } {
  const e = newEnemy(id, u.kind, 0, 0);
  if (u.variant) e.variant = u.variant;
  Object.assign(e, { act: 'idle', fx: 0.2, fy: 1, moving: false, cooldown: 9 });
  let t = 10;
  if (m === 'walk') Object.assign(e, { act: 'chase', fx: 1, fy: 0.1, moving: true });
  if (m === 'wind up' || m === 'strike' || m === 'recover') {
    const windup = u.kind === 'butcher' ? 0.9 : 0.6, active = 0.15, recover = 0.5;
    const k = loop(now, m === 'wind up' ? 1.2 : 0.9, id * 0.13);
    const at = m === 'wind up' ? windup * k : m === 'strike' ? windup + active * k : windup + active + 0.08 + recover * k;
    e.fx = 1;
    e.fy = 0.15;
    e.act = 'attack';
    e.attack = { kind: kindOf(e), t: at, windup, active, recover, dmg: 0, knock: 0, unblockable: false, dx: 1, dy: 0, ox: 0, oy: 0, range: 1, arc: 1, cx: 1, cy: 0, radius: 0.8, done: false };
  }
  if (m === 'hurt') (e.hitAt = 10 - loop(now, 0.6) * 0.3), Object.assign(e, { kvx: -1, kvy: 0, fx: 1 });
  if (m === 'flinch') Object.assign(e, { act: 'flinch', actDur: 0.45, actT: loop(now, 0.8) * 0.45, kvx: -2, kvy: 0, fx: 1 });
  if (m === 'stagger') Object.assign(e, { act: 'stunned', actDur: 9, actT: 1 });
  if (m === 'die') Object.assign(e, { act: 'dead', actDur: 9, actT: 1, death: '' });
  return { e, t };
}
