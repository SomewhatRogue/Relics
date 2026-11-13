/**
 * Your trainer's screen: the upgrade screens (upgradeui.ts) opened for buying, with the trainer's one
 * spoken line, RESET for the knacks, and Maeve's YOUR HOUND for a Ranger. A knack waiting opens it on
 * KNACKS; otherwise on the tab last open. (Before 2026-11-05 this was sections of rows: trainsections.ts.)
 */
import type { Game } from './game';
import type { Panel } from './panels';
import { openHound } from './houndui';
import { HOUNDW } from './houndwords';
import { openShield } from './shieldui';
import { SHIELDW } from './shieldwords';
import { confirmReset } from './treeui';
import { openUpgrades } from './upgradeui';
import './trainer.css';

/**
 * The trainer's screen. `title`: the panel's heading; `who`: the trainer's name for the greeting;
 * `greet`: one spoken line, or '' for none.
 */
export function openTrainer(g: Game, panel: Panel, title: string, who: string, greet: string): void {
  const p = g.profile;
  const again = () => openUpgrades(g, panel, screen, undefined, false);
  const screen = {
    title, atTrainer: true, who, greet,
    // Maeve also looks over a Ranger's hound (houndui.ts); Cole paints a Warrior's shield (shieldui.ts).
    extra: p.cls === 'RANGER' ? [{ label: HOUNDW.button, act: () => openHound(g, panel, again) }] : p.cls === 'WARRIOR' ? [{ label: SHIELDW.button, act: () => openShield(g, panel, again) }] : [],
    reset: (back: () => void) => confirmReset(g, panel, back),
  };
  openUpgrades(g, panel, screen, p.picks > 0 ? 'knacks' : undefined);
}
