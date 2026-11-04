/**
 * The item card and the hero sheet: how a piece fights (its type), what's on it (modifiers, traits),
 * and what it would change against what you wear now, in the numbers the room uses. Green better, red
 * worse. Used by the loot card, chests and the pack.
 */
import { CLASS_DODGES, CLASS_GUARD, HUNGRY, type HungryId, MODS, MOD_TEXT, TIERS, TRAITS, WEAPONS, CHARGE, gearStats, itemName, slotOf, traitText, type HeroClass, type Item, type WeaponId } from '../shared/tuning';
import type { Hero } from '../sim/types';

/** How each weapon type fights, in a line. */
export const HOW: Record<WeaponId, string> = {
  sword: 'Three quick cuts and the best guard. Hold to bash with the shield and stun the goblin in front. Counter quickly after a parry for a riposte that hits twice as hard.',
  greatsword: 'Two slow sweeps that catch a crowd. Hold for an overhead that breaks a heavy swing, and let go on the flash to knock every goblin near where it lands flat. It can only parry, never hold a block.',
  spear: 'Long thrusts that keep goblins back. Hold to lunge through up to three. Catch a goblin as it charges or lunges and you pin it. Too close in, you only hit with the shaft.',
  daggers: 'A fast four-hit combo, two and a half times the damage from behind. A long dash.',
  longbow: 'Two quick cuts with a short sword. Hold to draw the longbow: the longer you hold, the harder it hits, and the arrow goes through a row of goblins. Let go on the white flash for a sure crit that blinds the goblin it hits.',
  shortbow: 'A quick draw, and you can walk while drawing.',
  crossbow: 'Two quick cuts with a short sword. Hold to aim and let go to fire a heavy bolt that goes through three goblins and shoves them back. When it\'s empty, hold to wind it, a bit at a time if you need to move. Wind it all in one go and the bolt glints, and the next shot hits harder and goes through the whole line.',
  wand: 'Quick sparks. Hold for a burst.',
  staff: 'Hold 1.6 s for an orb that bursts wide.',
  rod: 'Hold 1 s for a lance through a line.',
  mace: 'Every third blow heals everyone near. Hold for a smite that stuns.',
  rapier: 'Quick thrusts at long reach, better head on than the daggers. Hold to lunge through two, and let go on the flash to skewer them so they bleed.',
  poisoner: 'A short sword that catches two at once. Hold to raise the blowpipe, and let go on the flash to loose a poisoned dart; the goblin it hits stops to retch.',
  censer: 'Two cuts, then the censer burns goblins and heals everyone near. The best Cleric guard. Hold to whirl it.',
  flail: 'Slow, wide sweeps that come over a shield. The second heals. Hold to bring down a smite close in.',
};
const ARMOR_HOW = { light: 'Light: full speed and a full dodge, full damage taken.', medium: 'Medium: 5% slower, 12% less damage taken.', heavy: 'Heavy: 12% slower, a shorter dodge that costs more breath, 25% less damage taken, and small goblins can\'t stagger you.' };
/** The same for a class with no dodge (a Warrior, a Healer): nothing about a dodge it hasn't got. */
const ARMOR_FEET = { ...ARMOR_HOW, light: 'Light: full speed, full damage taken.', heavy: 'Heavy: 12% slower, 25% less damage, and small goblins can\'t stagger you.' };
/** How a weight of armor wears, for a class (one with no dodge hears nothing about one). */
export const armorHow = (a: keyof typeof ARMOR_HOW, cls?: HeroClass) => (cls && !CLASS_DODGES[cls] ? ARMOR_FEET : ARMOR_HOW)[a];
/** Rows a class has no use for: a parry it can't make, a block it can't hold, a dodge it hasn't got, heals it doesn't give. */
export const shown = (r: Row, cls: HeroClass) =>
  !(r.label === 'PARRY WINDOW' && CLASS_GUARD[cls] === 'none') && !(r.label === 'THROUGH A BLOCK' && CLASS_GUARD[cls] !== 'full') &&
  !(r.label === 'DODGE EVERY' && !CLASS_DODGES[cls]) && !(r.label === 'HEALING GIVEN' && cls !== 'HEALER');

export interface Row { label: string; v: number; unit: '' | 's' | '%'; low?: boolean }
interface Worn { weapon: WeaponId; item?: Item; armor: Item | null; rings: Item[]; baseHp: number }

/** The numbers that matter, for what's worn. */
export function sheet(w: Worn): Row[] {
  const g = gearStats(w.item, w.armor, w.rings), k = WEAPONS[w.weapon], first = k.combo[0], q = 1 - g.quick;
  return [
    { label: 'HIT', v: Math.round(first.dmg * (1 + g.damage)), unit: '' },
    { label: 'FULL CHARGE', v: Math.round(k.heavy.dmgFull * (1 + g.damage)), unit: '' },
    { label: 'SWING', v: (first.windup + first.active + first.recover * 1) * q, unit: 's', low: true },
    { label: 'TO FULL CHARGE', v: (k.draw ?? CHARGE.full) * (1 - g.draw), unit: 's', low: true },
    { label: 'REACH', v: k.heavy.range * (1 + g.reach), unit: '' },
    { label: 'PARRY WINDOW', v: k.parryWindow + g.parry, unit: 's' },
    { label: 'THROUGH A BLOCK', v: k.chip * (1 - g.guard), unit: '%', low: true },
    { label: 'HEALTH', v: w.baseHp + g.health, unit: '' },
    { label: 'DAMAGE TAKEN', v: g.taken, unit: '%', low: true },
    { label: 'WALK', v: k.speed * g.speed, unit: '%' },
    { label: 'DODGE EVERY', v: k.dodge.cooldown * (1 - g.dodge), unit: 's', low: true },
    { label: 'STAMINA RECOVERY', v: 1 + g.breath, unit: '%' },
    { label: 'SKILL RECHARGE', v: 1 - g.focus, unit: '%', low: true },
    { label: 'HEALING GIVEN', v: 1 + g.mending, unit: '%' },
  ];
}

export const fmt = (r: Row, v = r.v) => (r.unit === 's' ? v.toFixed(2) + ' s' : r.unit === '%' ? Math.round(v * 100) + '%' : String(Math.round(v * 10) / 10));
export const worn = (h: Hero): Worn => ({ weapon: h.weapon, item: h.arms[h.weapon], armor: h.armor, rings: h.rings, baseHp: h.baseHp });

/** What you'd wear with `it` on instead (a third ring pushes out the older). */
export function wearing(h: Hero, it: Item): Worn {
  const w = worn(h), s = slotOf(it);
  if (s === 'weapon') return { ...w, weapon: it.kit!, item: it };
  if (s === 'armor') return { ...w, armor: it };
  return { ...w, rings: [...(h.rings.length >= 2 ? h.rings.slice(1) : h.rings), it] };
}

/** The rows that change, old to new, green better, red worse. */
export function compare(h: Hero, it: Item): string {
  const a = sheet(worn(h)), b = sheet(wearing(h, it));
  const cls = WEAPONS[h.weapon].cls, rows = a.map((r, i) => ({ r, n: b[i] })).filter(({ r, n }) => shown(r, cls) && Math.abs(n.v - r.v) > 1e-3);
  if (!rows.length) return '<div class="cmp none">No change to what you wear now.</div>';
  return '<div class="cmp">' + rows.map(({ r, n }) => {
    const up = n.v > r.v, good = r.low ? !up : up;
    return `<div><span>${r.label}</span><i>${fmt(r)}</i><b>${fmt(n)}</b><em class="${good ? 'up' : 'down'}">${good ? 'better' : 'worse'}</em></div>`;
  }).join('') + '</div>';
}

/** The card: tier, name, how it fights, what's on it. */
export function card(it: Item, h?: Hero): string {
  const t = TIERS[it.quality], s = slotOf(it), cls = h ? WEAPONS[h.weapon].cls : it.kit ? WEAPONS[it.kit].cls : undefined;
  const how = s === 'weapon' ? (h && it.kit !== h.weapon ? HOW[it.kit!] : '') : s === 'armor' ? armorHow(it.armor ?? 'light', cls) : '';
  const mods = (it.mods ?? []).map((m) => `<div class="tr"><b>${MODS[m.id].name} ${m.v > 0 ? '+' : ''}${MODS[m.id].unit === '%' ? Math.round(m.v * 100) + '%' : MODS[m.id].unit === 's' ? m.v + ' s' : m.v}</b> ${MOD_TEXT[m.id]}</div>`);
  const traits = it.traits.map((k) => `<div class="tr"><b>${TRAITS[k].name}</b> ${traitText(k, cls)}</div>`);
  return `<div class="card-head" style="--t:${t.col}"><span class="chip">${t.name}</span><b>${itemName(it)}</b></div>` +
    (how ? `<div class="how">${how}</div>` : '') + [...mods, ...traits].join('') +
    (it.hungry ? `<div class="gift">${HUNGRY[it.hungry as HungryId].gift}</div><div class="cost">${HUNGRY[it.hungry as HungryId].cost}</div>` : '') + (mods.length + traits.length || it.hungry ? '' : `<div class="tr">Plain. No modifiers.</div>`);
}

/** The hero sheet: every number, as worn. */
export const heroSheet = (h: Hero) => '<div class="cmp sheet">' + sheet(worn(h)).filter((r) => shown(r, WEAPONS[h.weapon].cls)).map((r) => `<div><span>${r.label}</span><b>${fmt(r)}</b></div>`).join('') + '</div>';
