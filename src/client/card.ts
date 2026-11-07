/**
 * The item card and the hero sheet: how a piece fights (its type), what's on it (modifiers, traits),
 * and what it would change against what you wear now, in the numbers the room uses. Green better, red
 * worse. Used by the loot card, chests and the pack.
 */
import { CLASS_DODGES, CLASS_GUARD, guardOf, HUNGRY, type HungryId, LASTS, POTIONS, type PotionId, MODS, MOD_TEXT, PLUS, TIERS, TRAITS, WEAPONS, CHARGE, GUARD, RARE, SPELL, costText, gearStats, itemName, levelOf, plusOf, temperOf, modFits, slotOf, traitText, type HeroClass, type Item, type Mod, type MageKit, type WeaponId } from '../shared/tuning';
import { CARDW } from './shopwords';
import { plusLine, plusPips } from './forgeview';
import { ANVILW } from './pastimewords';
import type { Hero } from '../sim/types';
import { kitRows } from './kitlines';
import { areas } from './guardarea';
import { barWord, barWords } from '../shared/barword';

/** How a weapon fights, as three short labelled rows (TAP, HOLD, PERFECT, and ALSO where there's a
 *  bonus; kitlines.ts), then its GUARD and DODGE areas (guardarea.ts). */
export const weaponHow = (w: WeaponId): string => labelRows(kitRows(w)) + areas(w);
/** Short labelled rows, a label on the left and a few words on the right (TAP / HOLD / PERFECT, GIFT /
 *  COST, EFFECT / LASTS, USE / CHARGE...): the one way the game shows what a thing does. */
export const labelRows = (rows: [string, string][], cls = ''): string =>
  `<div class="kitrows${cls ? ' ' + cls : ''}">${rows.filter(([, v]) => v).map(([l, v]) => `<div><b>${l}</b><span>${v}</span></div>`).join('')}</div>`;
/** How a weight of armor wears, a line for each thing it changes (Kyle: "put each thing on its own line"). */
const ARMOR_HOW = {
  light: ['Light', 'Full speed', 'Full dodge', 'Full damage taken'],
  medium: ['Medium', '5% slower', '12% less damage taken'],
  heavy: ['Heavy', '12% slower', 'Shorter dodge, costs more stamina', '25% less damage taken', "Small goblins can't stagger you"],
};
/** The same for a class with no dodge (a Warrior, a Healer): nothing about a dodge it hasn't got. */
const ARMOR_FEET = { ...ARMOR_HOW, light: ['Light', 'Full speed', 'Full damage taken'], heavy: ['Heavy', '12% slower', '25% less damage taken', "Small goblins can't stagger you"] };
/** How a weight of armor wears, for a class (one with no dodge hears nothing about one; a Mage's bar is magic): the weight, then a row each. */
export const armorHow = (a: keyof typeof ARMOR_HOW, cls?: HeroClass): string => {
  const [name, ...rows] = (cls && !CLASS_DODGES[cls] ? ARMOR_FEET : ARMOR_HOW)[a];
  return `<div class="kitrows armor"><div><b>${name.toUpperCase()}</b><span>${rows.map((r) => barWords(r, cls)).join('<br>')}</span></div></div>`;
};
/** Rows a kit has no use for: a block it can't hold, a dodge it hasn't got, heals it doesn't give. */
export const shown = (r: Row, w: WeaponId) => {
  const k = WEAPONS[w], cls = k.cls, guard = guardOf(k);
  return !(r.label === 'STRIPED THROUGH BLOCK' && guard !== 'full') &&
    !(r.label === 'DODGE EVERY' && !CLASS_DODGES[cls]) && !(r.label === 'HEALING GIVEN' && cls !== 'HEALER') &&
    !(r.label === 'LAST BLOW' && k.combo.length < 2) && !(r.label === 'SWING ARC' && !k.combo.some((s) => !s.thrust && !s.shot && s.arc >= 100)) &&
    !(r.label === 'BACKSTAB' && !k.backstab) && !((r.label === 'SPELL POWER' || r.label === 'SPELL COST') && cls !== 'MAGE');
};

export interface Row { label: string; v: number; unit: '' | 's' | '%'; low?: boolean }
interface Worn { weapon: WeaponId; item?: Item; armor: Item | null; rings: Item[]; baseHp: number }

/** The numbers that matter, for what's worn. */
export function sheet(w: Worn): Row[] {
  const g = gearStats(w.item, w.armor, w.rings), k = WEAPONS[w.weapon], first = k.combo[0], last = k.combo[k.combo.length - 1], q = 1 - g.quick;
  return [
    { label: 'HIT', v: Math.round(first.dmg * (1 + g.damage)), unit: '' },
    { label: 'FULL CHARGE', v: Math.round(k.heavy.dmgFull * (1 + g.damage)), unit: '' },
    { label: 'SWING', v: (first.windup + first.active + first.recover * 1) * q, unit: 's', low: true },
    { label: 'TO FULL CHARGE', v: (k.draw ?? CHARGE.full) * (1 - g.draw), unit: 's', low: true },
    { label: 'REACH', v: k.heavy.range * (1 + g.reach), unit: '' },
    // A red blow blocked takes no health; a striped one blocked, the class's share (GUARD.striped).
    { label: 'STRIPED THROUGH BLOCK', v: GUARD.striped.through[k.cls] ?? 1, unit: '%', low: true },
    { label: 'HEALTH', v: w.baseHp + g.health, unit: '' },
    { label: 'DAMAGE TAKEN', v: g.taken, unit: '%', low: true },
    { label: 'WALK', v: k.speed * g.speed, unit: '%' },
    { label: 'DODGE EVERY', v: k.dodge.cooldown * (1 - g.dodge), unit: 's', low: true },
    { label: `${barWord(k.cls)} RECOVERY`, v: 1 + g.breath, unit: '%' },
    { label: 'SKILL RECHARGE', v: 1 - g.focus, unit: '%', low: true },
    { label: 'HEALING GIVEN', v: 1 + g.mending, unit: '%' },
    // The new modifiers' own rows (shared/mods.ts), shown only for kits they act on (`shown`).
    { label: 'LAST BLOW', v: Math.round(last.dmg * (1 + g.damage) * (1 + g.finisher)), unit: '' },
    { label: 'SWING ARC', v: Math.round(first.arc * (1 + g.arc)), unit: '' },
    { label: 'BACKSTAB', v: (k.backstab ?? GUARD.rearMult) * (1 + g.backstab), unit: '%' },
    { label: 'CRIT CHANCE', v: g.crit, unit: '%' },
    { label: 'SPELL POWER', v: 1 + g.spell, unit: '%' },
    { label: 'SPELL COST', v: (SPELL[w.weapon as MageKit] ?? 0) * (1 - g.thrift), unit: '', low: true },
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
  const rows = a.map((r, i) => ({ r, n: b[i] })).filter(({ r, n }) => shown(r, h.weapon) && Math.abs(n.v - r.v) > 1e-3);
  if (!rows.length) return '<div class="cmp none">No change to what you wear now.</div>';
  return '<div class="cmp">' + rows.map(({ r, n }) => {
    const up = n.v > r.v, good = r.low ? !up : up;
    return `<div><span>${r.label}</span><i>${fmt(r)}</i><b>${fmt(n)}</b><em class="${good ? 'up' : 'down'}">${good ? 'better' : 'worse'}</em></div>`;
  }).join('') + '</div>';
}

/** A modifier's value as shown, grown by the piece's plus (`grow`, shared/forgeplus.ts): "+12%", "+6.6%",
 *  "+0.04 s", "+9"; CHEAPER SPELLS reads as the cut it is ("-12%"). */
export const modValue = (m: Mod, grow = 1) => {
  const neg = m.id === 'thrift', v = (neg ? -m.v : m.v) * grow, sign = v > 0 ? '+' : '';
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return MODS[m.id]?.unit === '%' ? sign + r1(v * 100) + '%' : MODS[m.id]?.unit === 's' ? sign + Math.round(v * 100) / 100 + ' s' : sign + r1(v);
};

/** The card: tier, name, how armor wears, what's on it. How a weapon fights is in the gear's WEAPONS panel. `brief` is kept for callers.
 *  A modifier the wearer can't use shows dim, "no use to you" (shared/mods.ts); a touched or turning piece's COST is in red. */
export function card(it: Item, h?: Hero, brief = false): string {
  const t = TIERS[it.quality], s = slotOf(it), cls = h ? WEAPONS[h.weapon].cls : it.kit ? WEAPONS[it.kit].cls : undefined;
  // A weapon's TAP / HOLD / PERFECT rows live in the gear's WEAPONS panel now (weaponsabout.ts; Kyle, 2026-11-05: "too cluttered").
  const how = s === 'armor' ? armorHow(it.armor ?? 'light', cls) : '';
  // Whose hands it's judged in: the weapon itself, or what the wearer holds.
  const kit = s === 'weapon' ? it.kit : h?.weapon;
  // "NAME +10%: what it does" and "NAME: what it does" (Kyle's example, before parry went: "STAMINA ON PARRY: parry refills stamina").
  // Each modifier as the piece gives it now, its pluses (and any temper) counted in: what the room uses.
  const grow = 1 + levelOf(it) * PLUS.mods;
  const mods = (it.mods ?? []).map((m) => {
    const use = !cls || !(m.id in MODS) || modFits(m.id, cls, kit);
    return `<div class="tr${use ? '' : ' nouse'}"><b>${barWords(MODS[m.id]?.name ?? m.id, cls)} ${modValue(m, grow)}${MOD_TEXT[m.id] ? ':' : ''}</b> ${barWords(MOD_TEXT[m.id] ?? '', cls)}${use ? '' : ` <i>${CARDW.noUse}</i>`}</div>`;
  });
  const traits = it.traits.map((k) => `<div class="tr"><b>${barWords(TRAITS[k].name, cls)}:</b> ${traitText(k, cls)}</div>`);
  // Its plus as pips, and what the plus adds (forgeview.ts).
  const plus = plusOf(it) ? [`<div class="tr plus"><b>${CARDW.plus(plusOf(it))}</b> ${plusPips(plusOf(it))} ${plusLine(it)}</div>`] : [];
  // Struck well at the anvil (shared/forgestrike.ts): how much more its upgrades count for.
  const tp = it.level ? Math.round((temperOf(it) / it.level) * 100) : 0;
  if (tp > 0) traits.push(`<div class="tr"><b>${ANVILW.cardRow}:</b> ${ANVILW.cardText(tp)}</div>`);
  // The rare three wear their chip filled in; HUNGRY's darkest of all (ui.css).
  const chip = RARE.includes(it.quality) ? ` rare ${it.quality}` : '';
  return `<div class="card-head" style="--t:${t.col}"><span class="chip${chip}">${t.name}</span><b>${itemName(it)}</b></div>` +
    (how ? `<div class="how">${how}</div>` : '') + [...plus, ...mods, ...traits].join('') +
    (it.cost ? labelRows([[CARDW.cost, costText(it.cost, cls)]], 'hungry') : '') +
    (it.hungry ? hungryRows(it.hungry as HungryId, cls) : '') + (mods.length + traits.length || it.hungry ? '' : `<div class="tr">Plain. No modifiers.</div>`);
}

/** A potion: EFFECT, LASTS, and THROWN for a flask. */
export const potionRows = (id: PotionId, cls?: HeroClass): string =>
  labelRows([['EFFECT', barWords(POTIONS[id].text, cls)], ['LASTS', LASTS[id] ? `${LASTS[id]} s` : ''], ['USE', POTIONS[id].thrown ? 'Thrown where you aim' : 'Drink']]);
/** Hungry gear's bargain, GIFT then COST, in its red rows. */
export const hungryRows = (id: HungryId, cls?: HeroClass): string =>
  labelRows([['GIFT', barWords(HUNGRY[id].gift, cls)], ['COST', barWords(HUNGRY[id].cost, cls)]], 'hungry');

/** The hero sheet: every number, as worn. */
export const heroSheet = (h: Hero) => '<div class="cmp sheet">' + sheet(worn(h)).filter((r) => shown(r, h.weapon) && !(r.label === 'CRIT CHANCE' && !r.v)).map((r) => `<div><span>${r.label}</span><b>${fmt(r)}</b></div>`).join('') + '</div>';
