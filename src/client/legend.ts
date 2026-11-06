/**
 * BUTTONS in the gear's box (Kyle: "a thing that shows what each icon actually means"): a framed panel
 * with each of this hero's buttons drawn by the same code as the cluster (btnart.ts with icons.ts,
 * skillicons.ts and the item and relic icons), each with one plain line, and on a laptop its key.
 */
import { guardOf, dodgeName, dodgeOf, RELICS, WEAPONS, type Item } from '../shared/tuning';
import { carriedItem } from '../sim/charge';
import { castElement } from '../sim/channel';
import { knows } from '../sim/types';
import { taunts } from '../sim/taunt';
import { TAUNT_BUTTON } from '../shared/ladder';
import { SHIELD_LINE } from '../shared/classes';
import { paintButton, type Face } from './btnart';
import { icon, type IconId } from './icons';
import { skillCanvas } from './skillicons';
import { itemIcon, potionIcon } from './itemicons';
import { relicItemIcon } from './relicicons';
import { kitRows } from './kitlines';
import { SIGNS, SIGN_KEY, SIGN_WORDS } from '../shared/signs';
import { signFor } from '../sim/signature';
import type { Panel } from './panels';
import type { Game } from './game';

interface Row { face: Face; url?: string; w?: number; name: string; text: string; key: string }

/** An icon from a data URL, once decoded (null if it won't). */
async function pic(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  const im = new Image();
  im.src = url;
  return im.decode().then(() => im, () => null);
}

/** One button as a picture: the cluster's own art at one size. */
function drawn(f: Face): { url: string; w: number } {
  const c = document.createElement('canvas');
  paintButton(c, f);
  return { url: c.toDataURL(), w: c.width };
}

const EL_RING: Record<string, string> = { fire: '#ff9a3c', frost: '#bfe8ff', storm: '#fff27a' };
const round = (ic: CanvasImageSource | null, grade: Face['grade'] = 'iron'): Face => ({ shape: 'round', size: 28, grade, icon: ic });

/** The rows for this hero: what they have now, then every context word. */
async function rows(g: Game, touch: boolean): Promise<Row[]> {
  const me = g.hero, kit = WEAPONS[me.weapon], cls = kit.cls, out: Row[] = [];
  const it = me.arms[me.weapon] ?? ({ kit: me.weapon, traits: [] } as unknown as Item);
  // The weapon's own rows (kitlines.ts): what a tap does, a hold, and a hold let go on the flash.
  out.push({ face: round(await pic(safe(() => itemIcon(it)))), name: 'ATTACK', key: 'LEFT CLICK',
    text: kitRows(me.weapon, cls === 'MAGE' ? castElement(me) : '').map(([l, v]) => `<i>${l}</i> ${v}`).join('<br>') });
  // A Mage's ELEMENT: the small ring by ATTACK, in the element's colour (cluster.ts).
  if (cls === 'MAGE') out.push({ face: { shape: 'round', size: 22, grade: 'iron', icon: skillCanvas('channel', castElement(me)), ring: EL_RING[castElement(me)] }, name: 'ELEMENT', key: 'X', text: `Switch element: fire, frost, storm. It changes what your tap and hold do. The first spell after a switch is primed: it does 50% more damage.` });
  // A Rogue's, Ranger's or Healer's own button, in the same spot (shared/signs.ts), once the wood has given it.
  const sg = signFor(me);
  if (sg && g.taught().includes('sign')) out.push({ face: { shape: 'round', size: 22, grade: 'iron', icon: skillCanvas(sg, '') }, name: SIGNS[sg].name, key: SIGN_KEY, text: SIGN_WORDS[sg] });
  const guard = guardOf(kit);
  if (guard === 'full') out.push({ face: { shape: 'shield', size: 28, grade: 'iron', icon: icon('block') }, name: 'BLOCK', key: 'RIGHT CLICK', text: 'Hold to block. Your next blow after a block is a counter and hits harder.' });
  if (dodgeOf(kit)) {
    const dn = dodgeName(cls);
    out.push({ face: { shape: 'diamond', size: 30, grade: 'iron', icon: icon(({ JUMP: 'jump', DASH: 'dash', BLINK: 'blink' } as Record<string, IconId>)[dn] ?? 'roll') }, name: dn, key: 'SPACE', text: 'Get out of any blow, even a striped one.' + (kit.spellblade ? ` ${SHIELD_LINE}` : '') });
  }
  // A Warrior's TAUNT, in the dodge's place (sim/taunt.ts).
  else if (taunts(me)) out.push({ face: { shape: 'diamond', size: 30, grade: 'iron', icon: skillCanvas('horn', '') }, name: 'TAUNT', key: 'SPACE', text: TAUNT_BUTTON });
  if (kit.reloads) out.push({ face: round(icon('reload'), 'gilt'), name: 'RELOADS ITSELF', key: '', text: 'The crossbow winds itself when you are not attacking. Stand still while it winds and the bolt glints (a PERFECT).' });
  const [skill, relic] = me.relics;
  if (knows(me, 'skill')) out.push({ face: round(skillCanvas(skill, me.augments[skill])), name: 'SKILL', key: 'E', text: `Your class skill, ${RELICS[skill].name}. The dark sweep and the number count down to the next use.` });
  const carried = relic ? carriedItem(me) : undefined;
  if (relic) out.push({ face: round(await pic(relicItemIcon(carried ?? ({ kind: relic, charge: 1 } as Parameters<typeof relicItemIcon>[0])))), name: 'RELIC', key: 'R', text: 'The relic you carry. The pips under it are the uses it has left.' });
  const next = me.belt[0];
  out.push({ face: { shape: 'orb', size: 30, grade: 'iron', fill: 0.7, liquid: '#a8261c', icon: next ? await pic(potionIcon(next)) : null }, name: 'HEALTH', key: 'Q', text: 'Your health. Tap to drink the front potion, hold to bring the next forward. The number is how many you have.' });
  // The gilt slot: what it can say.
  const ctx: [IconId, string, string, string][] = [
    ['grab', 'GRAB', 'G', cls === 'WARRIOR' ? 'Pick up any small goblin, crate or barrel. Press again to throw.' : me.weapon === 'spellblade' ? 'Pick up a crate, a barrel, or a stunned goblin. Press again to throw.' : 'Pick up a crate or barrel. Press again to throw.'],
    ['help', 'HELP UP', 'G', 'Get a downed friend back up.'],
    ['burn', 'BURN', 'G', 'Set fire to a spider nest, or an oiled woodpile by a house.'],
    ['open', 'OPEN', 'F', 'Open a chest.'],
    ['chat', 'TALK', 'E', "Talk to whoever you're by."],
    ['enter', 'ENTER', 'E', 'Go through the door.'],
    ['use', 'USE', 'E', "Use the job board, market or gate you're by."],
  ];
  for (const [ic, name, key, text] of ctx) out.push({ face: round(icon(ic), 'gilt'), name, key, text });
  return out.map((r) => ({ ...r, key: touch ? '' : r.key, ...drawn(r.face) }));
}

const safe = (f: () => string) => { try { return f(); } catch { return ''; } };

/** Open the panel. */
export async function legend(g: Game, panel: Panel, touch: boolean): Promise<void> {
  if (!g.hero || panel.open) return;
  const list = await rows(g, touch);
  const html = `<div class="legend">${list.map((r) => `<div class="lg"><img src="${r.url}" alt="" style="width: calc(${r.w} * var(--px))"><b>${r.name}${r.key ? `<kbd>${r.key}</kbd>` : ''}</b><p>${r.text}</p></div>`).join('')}</div>`;
  panel.show('BUTTONS', html, [{ label: 'CLOSE', primary: true, act: () => panel.hide() }]);
}
