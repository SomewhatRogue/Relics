/**
 * The keeper at a way station's fire (shared/shelter.ts, sim/pack.ts GEAR.buy and GEAR.refill): a Bitter, the carried relic
 * refilled, and the road home. The room does the buying (the hero's purse, belt and relic are its); this only asks, over the
 * same gear intent the pack uses, and shows what it can. The panel stays only while the hero is inside the station's ring.
 */
import { coinsHtml } from '../shared/coins';
import { canRecharge, rechargeCost } from '../shared/church';
import { POTION, POTIONS } from '../shared/potions';
import { COAL_STATION, SHELTER } from '../shared/shelter';
import { GEAR } from '../sim/pack';
import { carriedItem } from '../sim/charge';
import { inStation } from '../sim/landrules';
import type { Game } from './game';
import type { Panel } from './panels';
import { RELICW } from './relicwords';
import { SHELTERW, lineAt } from './shelterwords';
import { bountyHtml, handButtons } from './bountyui';
import { says } from './shopui';
import { SHOPW } from './shopwords';

/** How a gear op reaches the room (main.ts sets it to the page's input: for a guest too, the leader's room runs it). */
export const shelterLink: { gear: (op: number, arg: number) => void } = { gear: () => undefined };

/** The station whose ring the hero stands in, if any. */
const here = (g: Game) => (g.run?.job.roam && g.hero ? g.room.map.stations?.find((s) => inStation([s], g.hero)) : undefined);

/** The keeper's panel is the one up (main.ts lets gear presses through to the room under it). */
export const shelterUp = (): boolean => !!document.getElementById('shelter');

/** Once a frame: a keeper's panel left open after walking out of the ring is closed. */
export function shelterTick(g: Game, panel: Panel, running: boolean): void {
  if (running && panel.open && shelterUp() && !here(g)) panel.hide();
}

export function openShelter(g: Game, panel: Panel, name: string, leave: () => void): void {
  const h = g.hero, st = here(g);
  if (!st || h.act === 'down') return;
  // After a buy the room answers a tick later: draw again then, from what the room says the hero now holds.
  const again = () => setTimeout(() => panel.open && openShelter(g, panel, name, leave), 120);
  const ask = (op: number) => (shelterLink.gear(op, 0), again());
  const c = carriedItem(h), it = c && !c.el ? c : undefined, cost = it ? rechargeCost(it) : 0;
  const belt = h.belt.length >= POTION.belt, poor = h.purse < SHELTER.bitter;
  panel.show(st.name, '<i id="shelter"></i>' + says('Keeper', lineAt(st.name)) + `<p>You have ${coinsHtml(h.purse)}.</p>` + bountyHtml(g.profile, { posted: false, day: 0 }), [
    { label: `${SHOPW.buy} ${POTIONS.bitter.name} (${coinsHtml(SHELTER.bitter)})`, disabled: belt || poor, act: () => ask(GEAR.buy) },
    ...(st.name === COAL_STATION ? [{ label: `${SHELTERW.coal} (${coinsHtml(SHELTER.charcoal)})`, disabled: h.purse < SHELTER.charcoal, act: () => ask(GEAR.coal) }] : []),
    ...(it ? [{ label: canRecharge(it) ? RELICW.recharge(cost) : RELICW.full, disabled: !canRecharge(it) || h.purse < cost, act: () => ask(GEAR.refill) }] : []),
    // The other shelters found: the keeper's road to each, by its place in the map's list (sim/travel.ts).
    ...(g.room.map.stations ?? []).flatMap((s, i) => (s.name !== st.name && g.profile.shelters?.includes(s.name) ? [{ label: SHELTERW.to(s.name), act: () => (shelterLink.gear(GEAR.travel, i), panel.hide()) }] : [])),
    ...handButtons(g.profile, again, () => g.keep()),
    { label: SHELTERW.home, primary: true, act: () => (panel.hide(), leave()) },
  ]);
}
