/**
 * WEAPONS in the gear's box (Kyle, 2026-11-05: what each weapon does was "too much text for the weapon
 * beyond the stats and attributes ... too cluttered"): the item card now shows only the piece's name,
 * tier, numbers and what's on it, and how each kit fights lives here. Your own weapon first, then the
 * other kits of your class, each with its TAP / HOLD / PERFECT rows (kitlines.ts) and its GUARD and
 * DODGE areas (guardarea.ts). A Mage's rows are for the element in hand.
 */
import { WEAPONS, type Item, type WeaponId } from '../shared/tuning';
import { castElement } from '../sim/channel';
import { kitRows } from './kitlines';
import { labelRows } from './card';
import { areas } from './guardarea';
import { itemIcon } from './itemicons';
import type { Panel } from './panels';
import type { Game } from './game';

const icon = (w: WeaponId): string => {
  try {
    return itemIcon({ slot: 'weapon', kit: w, quality: 'plain', traits: [] } as unknown as Item);
  } catch {
    return '';
  }
};

/** The kits of `w`'s class, `w` first. */
export const classKits = (w: WeaponId): WeaponId[] => {
  const cls = WEAPONS[w].cls;
  return [w, ...(Object.keys(WEAPONS) as WeaponId[]).filter((k) => k !== w && WEAPONS[k].cls === cls)];
};

/** Open the panel. */
export function weaponsAbout(g: Game, panel: Panel): void {
  if (!g.hero || panel.open) return;
  const me = g.hero, el = WEAPONS[me.weapon].cls === 'MAGE' ? castElement(me) : '';
  const html = `<div class="kitabout">${classKits(me.weapon)
    .map((w) => {
      const ic = icon(w);
      return `<section class="kab${w === me.weapon ? ' mine' : ''}"><h4>${ic ? `<img src="${ic}" alt="">` : ''}${WEAPONS[w].name}${w === me.weapon ? ' <i>IN HAND</i>' : ''}</h4>` +
        labelRows(kitRows(w, el)) + areas(w) + '</section>';
    })
    .join('')}</div>`;
  panel.show('WEAPONS', html, [{ label: 'CLOSE', primary: true, act: () => panel.hide() }]);
}
