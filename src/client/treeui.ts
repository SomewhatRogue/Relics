/**
 * The knacks, from the pack's KNACKS button (and the trainer's): the upgrade screens (upgradeui.ts) on
 * the KNACKS tab, where the two on offer are a fork to PICK ONE and every chain of the class runs across
 * (Kyle, 2026-11-02: "its own sort of area you can see grow"). Picks are taken and RESET (free, every
 * knack back as a pick) anywhere out of a fight (Game.knacksOpen); on a job it's a look only. The
 * trainer's tabs show here too, to look at: buying is at the trainer.
 */
import type { Game } from './game';
import type { Panel } from './panels';
import { openUpgrades } from './upgradeui';
import { UPW } from './upgradewords';
import { KNW } from './treewords';
import './tree.css';

export interface TreeOpts { back?: () => void }

export function openTree(g: Game, panel: Panel, o: TreeOpts = {}): void {
  openUpgrades(g, panel, { title: UPW.title, atTrainer: false, back: o.back, reset: (back) => confirmReset(g, panel, back) }, 'knacks');
}

/** Are you sure: every knack comes back as a pick, for nothing. */
export function confirmReset(g: Game, panel: Panel, back: () => void): void {
  panel.show(KNW.resetTitle, `<p>${KNW.resetLine(g.profile.perks.length)}</p>`, [
    { label: KNW.resetYes, primary: true, act: () => (g.resetPerks(), back()) },
    { label: KNW.keep, act: back },
  ]);
}
