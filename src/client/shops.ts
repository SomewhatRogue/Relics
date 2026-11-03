/**
 * The shops that sell over the counter, each laid out by shopui.ts: the Drowned Rat (Gannet's brandy,
 * oil and smoke), the infirmary (Agne's Bitter), Dessa's stall on Market Row (Forged steel), and Ivo's
 * bench at the forge (frost flasks, a modifier turned). The vault, Tobin and Halvard: stores.ts.
 */
import { CLASS_KITS, ELEMENT_NAME, MODS, POTION, REROLL, RELICS, SKILL_CHOICES, TIERS, WANT, itemName, type PotionId } from '../shared/tuning';
import { marketOpen } from '../shared/story';
import { housesFor, type SpotId } from '../shared/town';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { goodsList, says, shopHead, wireGoods, type Good } from './shopui';
import { PLACES, SHOPW, type Place } from './shopwords';
import { gearGood, potionGood } from './shopgoods';
import { itemIcon } from './itemicons';
import { RUMOURS } from './rumours';
import { CHURCH } from './copy';
import { FORGE, PAWN } from './storewords';

const p = (s: string) => `<p>${s}</p>`;
const dim = (s: string) => `<p class="dim">${s}</p>`;

function show(panel: Panel, pl: Place, lines: string, goods: Good[], foot: string, again: () => void, buttons: Button[] = [], more = ''): void {
  panel.show(pl.name, shopHead(pl, lines) + goodsList(goods, foot) + more, buttons);
  wireGoods(goods, again);
}
const potions = (g: Game, ids: PotionId[]) => ids.map((id) => potionGood(g, id));
const beltFoot = (g: Game) => `${SHOPW.gold(g.profile.gold)} ${SHOPW.belt(g.profile.belt.length, POTION.belt)}`;

/** Gannet's bar: the rumour of the day, and what the watch drinks and throws. */
function tavern(g: Game, panel: Panel): void {
  const pr = g.profile, again = () => tavern(g, panel);
  const lines = says('Gannet', RUMOURS[(g.world.day * 5 + pr.runs) % RUMOURS.length]) + (pr.want >= 30 ? dim(CHURCH.gannet) : '');
  show(panel, PLACES.tavern, lines, potions(g, ['brandy', 'oil', 'smoke']), beltFoot(g), again);
}

/** Sister Agne, her beds, and the Bitter she makes. */
function infirmary(g: Game, panel: Panel): void {
  const pr = g.profile, w = g.world, again = () => infirmary(g, panel);
  const lines = says('Sister Agne', w.rescued ? `${w.rescued} through that gate so far. Some of them still won't sleep in the dark. I leave a candle.` : "Empty beds. First time in my life I've wanted them full. Bring someone home and I'll have work.") +
    (pr.want >= WANT.noticed ? says('Sister Agne', CHURCH.agne) : '');
  show(panel, PLACES.infirmary, lines, potions(g, ['bitter']), `Lit houses on Rescue Row: ${housesFor(w.rescued)}. ` + beltFoot(g), again);
}

/** Dessa, once the council lets the traders in: Forged weapons for your class, and rings. */
function trader(g: Game, panel: Panel): void {
  const pr = g.profile, again = () => trader(g, panel);
  if (!marketOpen(g.world)) return panel.show('MARKET ROW', p(PAWN.emptyRow));
  const said = 'Dessa counts your coin twice and smiles once.';
  const goods = [...CLASS_KITS[pr.cls].map((kit) => gearGood(g, 'forged', { kit }, said)), gearGood(g, 'forged', {}, said)];
  show(panel, PLACES.trader, says('Dessa', 'Wickhold steel, with a little weather in it. Fire, frost, storm. Price is the price.'), goods, SHOPW.gold(pr.gold), again);
}

/** Ivo's bench: frost flasks and a modifier turned, the relics you carry, and no elements for now. */
function wright(g: Game, panel: Panel): void {
  const pr = g.profile, again = () => wright(g, panel), rel = [...SKILL_CHOICES[pr.cls], ...pr.relics];
  const lines = (g.gearList().some((it) => it.quality === 'hungry') ? says('Ivo', CHURCH.ivo) : '') + says('Ivo', FORGE.ivo) + dim(FORGE.shut);
  const worn = g.gearList().filter((it) => !pr.bag.includes(it) && it.quality !== 'plain' && it.quality !== 'hungry');
  const turns: Good[] = worn.flatMap((it) => (it.mods ?? []).map((m, k) => ({
    name: `${itemName(it)}: ${MODS[m.id].name}`, price: REROLL, icon: itemIcon(it), col: TIERS[it.quality].col, label: 'REROLL',
    about: p(SHOPW.reroll), why: pr.gold < REROLL ? SHOPW.poor : '', buy: () => void g.rerollMod(it, k),
  })));
  // Not setting elements for now (Kyle, 2026-11-02): one greyed button a relic shows where it was; what's set stays set.
  const relics = '<div class="shop"><h3 class="gh">RELICS</h3>' + rel.map((r, i) => p(`<b>${RELICS[r].name}</b>${i ? (pr.relic === r ? ' (carried)' : ' (on the shelf)') : ' (your skill)'}: ${pr.augments[r] ? ELEMENT_NAME[pr.augments[r] as keyof typeof ELEMENT_NAME] : 'plain'}`)).join('') + '</div>';
  const carry = pr.relics.filter((r) => r !== pr.relic).map((r) => ({ label: `CARRY THE ${RELICS[r].short}`, primary: true, act: () => (g.carry(r), again()) }));
  show(panel, PLACES.wright, lines, [potionGood(g, 'frost'), ...turns], beltFoot(g), again,
    [...carry, ...rel.map((r) => ({ label: `${RELICS[r].short}: ${FORGE.element}`, disabled: true, act: () => {} }))], relics);
}

/** Open one of these if `id` is one; false otherwise. */
export function openShop(id: SpotId, g: Game, panel: Panel): boolean {
  const f = ({ tavern, infirmary, market: trader, wright } as Partial<Record<SpotId, (g: Game, panel: Panel) => void>>)[id];
  return f ? (f(g, panel), true) : false;
}
