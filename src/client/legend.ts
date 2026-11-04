/**
 * BUTTONS in the gear's box (Kyle: "a thing that shows what each icon actually means"): a framed panel
 * with each of this hero's buttons drawn by the same code as the cluster (btnart.ts with icons.ts,
 * skillicons.ts and the item and relic icons), each with one plain line, and on a laptop its key.
 */
import { guardOf, dodgeName, dodgeOf, RELICS, WEAPONS, type Item } from '../shared/tuning';
import { carriedItem } from '../sim/charge';
import { castElement } from '../sim/channel';
import { knows } from '../sim/types';
import { paintButton, type Face } from './btnart';
import { icon, type IconId } from './icons';
import { skillCanvas } from './skillicons';
import { itemIcon, potionIcon } from './itemicons';
import { relicItemIcon } from './relicicons';
import { kitRows } from './kitlines';
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

const round = (ic: CanvasImageSource | null, grade: Face['grade'] = 'iron'): Face => ({ shape: 'round', size: 28, grade, icon: ic });

/** The rows for this hero: what they have now, then every context word. */
async function rows(g: Game, touch: boolean): Promise<Row[]> {
  const me = g.hero, kit = WEAPONS[me.weapon], cls = kit.cls, out: Row[] = [];
  const it = me.arms[me.weapon] ?? ({ kit: me.weapon, traits: [] } as unknown as Item);
  // The weapon's own rows (kitlines.ts): what a tap does, a hold, and a hold let go on the flash.
  out.push({ face: round(await pic(safe(() => itemIcon(it)))), name: 'ATTACK', key: 'LEFT CLICK',
    text: kitRows(me.weapon).map(([l, v]) => `<i>${l}</i> ${v}`).join('<br>') });
  const guard = guardOf(kit);
  if (guard === 'full') out.push({ face: { shape: 'shield', size: 28, grade: 'iron', icon: icon('block') }, name: 'BLOCK', key: 'RIGHT CLICK', text: 'Hold to block. Tap while the red flashes white to parry.' });
  if (guard === 'parry') out.push({ face: { shape: 'shield', size: 28, grade: 'iron', icon: icon('parry') }, name: 'PARRY', key: 'RIGHT CLICK', text: "Tap while the red flashes white to parry. No held block." + (kit.spellblade ? ' A parry fills your blade.' : '') });
  if (dodgeOf(kit)) {
    const dn = dodgeName(cls);
    out.push({ face: { shape: 'diamond', size: 30, grade: 'iron', icon: icon(({ JUMP: 'jump', DASH: 'dash', BLINK: 'blink' } as Record<string, IconId>)[dn] ?? 'roll') }, name: dn, key: 'SPACE', text: 'Get out of any blow, even a striped one.' });
  }
  if (kit.reloads) out.push({ face: round(icon('reload'), 'gilt'), name: 'RELOAD', key: 'C', text: 'Hold to wind the crossbow. Wind it in one go, standing still, and the bolt glints (a PERFECT).' });
  const [skill, relic] = me.relics;
  if (knows(me, 'skill')) out.push({ face: round(skillCanvas(skill, skill === 'channel' ? castElement(me) : me.augments[skill])), name: 'SKILL', key: 'E', text: `Your class skill, ${RELICS[skill].name}. The dark sweep and the number count down to the next use.` });
  const carried = relic ? carriedItem(me) : undefined;
  if (relic) out.push({ face: round(await pic(relicItemIcon(carried ?? ({ kind: relic, charge: 1 } as Parameters<typeof relicItemIcon>[0])))), name: 'RELIC', key: 'R', text: 'The relic you carry. The bar along its foot is its charge.' });
  const next = me.belt[0];
  out.push({ face: { shape: 'orb', size: 30, grade: 'iron', fill: 0.7, liquid: '#a8261c', icon: next ? await pic(potionIcon(next)) : null }, name: 'HEALTH', key: 'Q', text: 'Your health. Tap to drink the front potion, hold to bring the next forward. The number is how many you have.' });
  // The gilt slot: what it can say.
  const ctx: [IconId, string, string, string][] = [
    ['grab', 'GRAB', 'G', cls === 'WARRIOR' ? 'Pick up any small goblin, crate or barrel. Press again to throw.' : 'Pick up a stunned goblin, or a small one from behind. Press again to throw.'],
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
