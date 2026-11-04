/**
 * Goods as the shop list shows them (shopui.ts): a potion for the belt, or a kind of gear rolled when
 * you buy it (Halvard's Fine, Dessa's Forged). Every number comes from the same tuning the room uses.
 */
import { ARMOR, LASTS, POTION, POTIONS, SHOP, TIERS, WEAPONS, type ArmorKind, type Item, type PotionId, type WeaponId } from '../shared/tuning';
import { bagFull } from '../shared/bags';
import type { Game } from './game';
import type { Good } from './shopui';
import { SHOPW } from './shopwords';
import { weaponHow, armorHow, card, compare } from './card';
import { itemIcon, potionIcon } from './itemicons';
import { barWords } from '../shared/barword';

const p = (s: string) => `<p>${s}</p>`;
const dim = (s: string) => `<p class="dim">${s}</p>`;

/** One kind of potion: what it does, how long it lasts, whether it's thrown. */
export function potionGood(g: Game, id: PotionId): Good {
  const pr = g.profile, po = POTIONS[id], lasts = LASTS[id];
  return {
    name: po.name, price: po.price, icon: potionIcon(id), col: po.col,
    about: p(barWords(po.text, pr.cls)) + (lasts ? dim(SHOPW.lasts(lasts)) : '') + (po.thrown && !/thrown/i.test(po.text) ? dim(SHOPW.thrown) : ''),
    why: pr.belt.length >= POTION.belt ? SHOPW.beltFull : pr.gold < po.price ? SHOPW.poor : '',
    buy: () => void g.buyPotion(id),
  };
}

/** One kind of gear at a tier (a weapon of your class, an armor weight, a ring); `said` when it's bought. */
export function gearGood(g: Game, quality: 'fine' | 'forged', what: { kit?: WeaponId; armor?: ArmorKind }, said: string): Good {
  const pr = g.profile, cost = SHOP[quality], slot = what.kit ? 'weapon' : what.armor ? 'armor' : 'ring';
  const shown: Item = { slot, kit: what.kit, armor: what.armor, quality, traits: [] };
  const name = what.kit ? WEAPONS[what.kit].name : what.armor ? ARMOR[what.armor].name : 'A RING';
  const how = what.kit ? weaponHow(what.kit) : what.armor ? armorHow(what.armor, pr.cls) : '';
  return {
    name, price: cost, icon: itemIcon(shown), col: TIERS[quality].col,
    about: (how ? `<div class="how">${how}</div>` : '') + p(quality === 'fine' ? SHOPW.fine : slot === 'ring' ? SHOPW.ring : SHOPW.forged),
    why: bagFull(pr) ? SHOPW.packFull : pr.gold < cost ? SHOPW.poor : '',
    buy: () => {
      const it = g.buy(quality, what.kit ?? pr.weapon, slot, what.armor);
      return it ? dim(said) + card(it, g.hero) + compare(g.hero, it) : undefined;
    },
  };
}
